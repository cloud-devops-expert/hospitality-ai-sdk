/**
 * Long-Term Trend Forecasting Module
 *
 * Multi-year forecasting with trend decomposition, scenario planning,
 * and confidence intervals. Uses traditional statistical methods for
 * hospitality business forecasting.
 *
 * Zero-cost local processing approach.
 */

// ============================================================================
// Types
// ============================================================================

export interface HistoricalDataPoint {
  date: Date;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

export interface ForecastInput {
  historicalData: HistoricalDataPoint[];
  forecastPeriods: number; // Number of periods to forecast
  periodType: 'day' | 'week' | 'month' | 'quarter' | 'year';
  metric: string; // e.g., 'revenue', 'occupancy', 'bookings'
  externalFactors?: ExternalFactor[];
}

export interface ExternalFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number; // 0-100
  startPeriod: number;
  endPeriod: number;
}

export interface ForecastResult {
  predictions: ForecastPrediction[];
  trendAnalysis: TrendAnalysis;
  scenarios: ScenarioForecast;
  confidence: ConfidenceMetrics;
  recommendations: string[];
}

export interface ForecastPrediction {
  period: number;
  date: Date;
  value: number;
  trend: number;
  seasonal: number;
  confidence: {
    lower: number;
    upper: number;
    level: number; // 0-100
  };
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number; // 0-100
  volatility: number; // 0-100
  components: {
    trend: number[];
    seasonal: number[];
    cyclical: number[];
    irregular: number[];
  };
  seasonalityDetected: boolean;
  seasonalPeriod?: number;
}

export interface ScenarioForecast {
  best: ScenarioPrediction;
  likely: ScenarioPrediction;
  worst: ScenarioPrediction;
}

export interface ScenarioPrediction {
  label: string;
  assumptions: string[];
  predictions: Array<{
    period: number;
    value: number;
  }>;
  totalValue: number;
  growthRate: number; // percentage
}

export interface ConfidenceMetrics {
  overall: number; // 0-100
  dataQuality: number; // 0-100
  trendStability: number; // 0-100
  seasonalConsistency: number; // 0-100
  warnings: string[];
}

export interface InvestmentROI {
  investment: number;
  expectedReturns: Array<{
    period: number;
    revenue: number;
    costs: number;
    netReturn: number;
  }>;
  breakEvenPeriod: number;
  totalROI: number; // percentage
  npv: number; // Net Present Value
  irr: number; // Internal Rate of Return
  paybackPeriod: number;
  recommendation: 'highly-recommended' | 'recommended' | 'neutral' | 'not-recommended';
}

// ============================================================================
// Core Forecasting Functions
// ============================================================================

/**
 * Generates multi-year forecast with trend analysis
 */
export function generateLongTermForecast(input: ForecastInput): ForecastResult {
  if (input.historicalData.length < 12) {
    throw new Error('At least 12 historical data points required for long-term forecasting');
  }

  // Extract values and normalize
  const values = input.historicalData.map(d => d.value);
  const dates = input.historicalData.map(d => d.date);

  // Decompose time series
  const trendAnalysis = decomposeTrend(values, input.periodType);

  // Generate base predictions
  const basePredictions = generateBasePredictions(
    values,
    trendAnalysis,
    input.forecastPeriods,
    dates
  );

  // Apply external factors
  const adjustedPredictions = applyExternalFactors(
    basePredictions,
    input.externalFactors || []
  );

  // Calculate confidence intervals
  const predictions = calculateConfidenceIntervals(
    adjustedPredictions,
    values,
    trendAnalysis.volatility
  );

  // Generate scenarios
  const scenarios = generateScenarios(
    predictions,
    trendAnalysis,
    input.externalFactors || []
  );

  // Calculate confidence metrics
  const confidence = calculateConfidenceMetrics(
    input.historicalData,
    trendAnalysis
  );

  // Generate recommendations
  const recommendations = generateForecastRecommendations(
    trendAnalysis,
    confidence,
    scenarios
  );

  return {
    predictions,
    trendAnalysis,
    scenarios,
    confidence,
    recommendations,
  };
}

/**
 * Decomposes time series into trend, seasonal, and irregular components
 */
export function decomposeTrend(values: number[], periodType: string): TrendAnalysis {
  const n = values.length;

  // Calculate trend using moving average
  const trendPeriod = getTrendPeriod(periodType);
  const trend = calculateMovingAverage(values, trendPeriod);

  // Detect seasonality
  const seasonalPeriod = detectSeasonalPeriod(values);
  const seasonalityDetected = seasonalPeriod > 0;

  // Calculate seasonal component
  const seasonal = seasonalityDetected
    ? calculateSeasonalComponent(values, trend, seasonalPeriod)
    : new Array(n).fill(0);

  // Calculate cyclical and irregular components
  const detrended = values.map((v, i) => v - trend[i]);
  const deseasoned = detrended.map((v, i) => v - seasonal[i]);

  const cyclical = calculateCyclicalComponent(deseasoned);
  const irregular = deseasoned.map((v, i) => v - cyclical[i]);

  // Analyze trend direction and strength
  const recentTrend = trend.slice(-Math.min(12, n));
  const trendSlope = linearRegression(
    recentTrend.map((_, i) => i),
    recentTrend
  ).slope;

  // Use relative threshold based on average value
  const avgValue = trend.reduce((sum, v) => sum + v, 0) / trend.length;
  const relativeThreshold = Math.abs(avgValue) * 0.0001; // 0.01% of average

  const direction: TrendAnalysis['direction'] =
    trendSlope > relativeThreshold ? 'increasing' :
    trendSlope < -relativeThreshold ? 'decreasing' : 'stable';

  const strength = Math.min(100, Math.abs(trendSlope / (avgValue || 1)) * 10000);

  // Calculate volatility
  const volatility = calculateVolatility(irregular);

  return {
    direction,
    strength,
    volatility,
    components: {
      trend,
      seasonal,
      cyclical,
      irregular,
    },
    seasonalityDetected,
    seasonalPeriod: seasonalityDetected ? seasonalPeriod : undefined,
  };
}

/**
 * Generates scenario-based forecasts (best, likely, worst)
 */
export function generateScenarios(
  predictions: ForecastPrediction[],
  trendAnalysis: TrendAnalysis,
  externalFactors: ExternalFactor[]
): ScenarioForecast {
  const baselineGrowth = predictions.length > 1
    ? ((predictions[predictions.length - 1].value - predictions[0].value) / predictions[0].value) * 100
    : 0;

  // Best case scenario: +20% optimistic growth
  const bestMultiplier = 1.2;
  const bestPredictions = predictions.map((p, i) => ({
    period: p.period,
    value: Math.round(p.value * (1 + (bestMultiplier - 1) * (i / predictions.length))),
  }));

  const bestAssumptions = [
    'Market conditions remain favorable',
    'Occupancy rates increase by 15-20%',
    'Premium pricing strategy successful',
    'Positive economic indicators',
  ];

  // Likely case scenario: baseline predictions
  const likelyPredictions = predictions.map(p => ({
    period: p.period,
    value: Math.round(p.value),
  }));

  const likelyAssumptions = [
    'Market conditions remain stable',
    'Current trends continue',
    'Moderate competition',
    'Normal seasonal patterns',
  ];

  // Worst case scenario: -15% conservative estimate
  const worstMultiplier = 0.85;
  const worstPredictions = predictions.map((p, i) => ({
    period: p.period,
    value: Math.round(p.value * (1 - (1 - worstMultiplier) * (i / predictions.length))),
  }));

  const worstAssumptions = [
    'Economic downturn impacts travel',
    'Increased competition',
    'Occupancy rates decline by 10-15%',
    'Price pressure in market',
  ];

  return {
    best: {
      label: 'Best Case',
      assumptions: bestAssumptions,
      predictions: bestPredictions,
      totalValue: bestPredictions.reduce((sum, p) => sum + p.value, 0),
      growthRate: Math.round(baselineGrowth * bestMultiplier),
    },
    likely: {
      label: 'Most Likely',
      assumptions: likelyAssumptions,
      predictions: likelyPredictions,
      totalValue: likelyPredictions.reduce((sum, p) => sum + p.value, 0),
      growthRate: Math.round(baselineGrowth),
    },
    worst: {
      label: 'Worst Case',
      assumptions: worstAssumptions,
      predictions: worstPredictions,
      totalValue: worstPredictions.reduce((sum, p) => sum + p.value, 0),
      growthRate: Math.round(baselineGrowth * worstMultiplier),
    },
  };
}

/**
 * Calculates investment ROI based on forecast
 */
export function calculateInvestmentROI(
  investment: number,
  forecast: ForecastResult,
  annualCostPercentage: number = 30,
  discountRate: number = 10
): InvestmentROI {
  const expectedReturns = forecast.predictions.map((p, i) => {
    const revenue = p.value;
    const costs = revenue * (annualCostPercentage / 100);
    const netReturn = revenue - costs;

    return {
      period: p.period,
      revenue,
      costs,
      netReturn,
    };
  });

  // Calculate cumulative returns
  let cumulativeReturn = -investment;
  let breakEvenPeriod = -1;
  let paybackPeriod = -1;

  expectedReturns.forEach((ret, i) => {
    cumulativeReturn += ret.netReturn;
    if (breakEvenPeriod === -1 && cumulativeReturn > 0) {
      breakEvenPeriod = i + 1;
      paybackPeriod = i + 1;
    }
  });

  // Calculate total ROI
  const totalReturn = expectedReturns.reduce((sum, r) => sum + r.netReturn, 0);
  const totalROI = ((totalReturn - investment) / investment) * 100;

  // Calculate NPV
  const npv = calculateNPV(
    investment,
    expectedReturns.map(r => r.netReturn),
    discountRate
  );

  // Calculate IRR (simplified)
  const irr = calculateIRR(investment, expectedReturns.map(r => r.netReturn));

  // Determine recommendation
  let recommendation: InvestmentROI['recommendation'];
  if (totalROI > 50 && breakEvenPeriod <= 2 && irr > 20) {
    recommendation = 'highly-recommended';
  } else if (totalROI > 25 && breakEvenPeriod <= 3 && irr > 12) {
    recommendation = 'recommended';
  } else if (totalROI > 0 && breakEvenPeriod > 0) {
    recommendation = 'neutral';
  } else {
    recommendation = 'not-recommended';
  }

  return {
    investment,
    expectedReturns,
    breakEvenPeriod,
    totalROI: Math.round(totalROI * 100) / 100,
    npv: Math.round(npv),
    irr: Math.round(irr * 100) / 100,
    paybackPeriod,
    recommendation,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTrendPeriod(periodType: string): number {
  const periods = {
    day: 7,
    week: 4,
    month: 3,
    quarter: 4,
    year: 3,
  };
  return periods[periodType as keyof typeof periods] || 3;
}

function calculateMovingAverage(values: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(period / 2));
    const end = Math.min(values.length, i + Math.ceil(period / 2));
    const window = values.slice(start, end);
    const avg = window.reduce((sum, v) => sum + v, 0) / window.length;
    result.push(avg);
  }

  return result;
}

function detectSeasonalPeriod(values: number[]): number {
  if (values.length < 24) return 0;

  // Test common seasonal periods
  const testPeriods = [4, 7, 12, 52]; // Quarterly, weekly, monthly, weekly in year
  let bestPeriod = 0;
  let bestScore = 0;

  testPeriods.forEach(period => {
    if (values.length < period * 2) return;

    // Use autocorrelation-like approach
    let correlation = 0;
    const cycles = Math.floor(values.length / period);

    for (let offset = 0; offset < period; offset++) {
      const seasonalValues: number[] = [];
      for (let cycle = 0; cycle < cycles; cycle++) {
        const idx = cycle * period + offset;
        if (idx < values.length) {
          seasonalValues.push(values[idx]);
        }
      }

      if (seasonalValues.length > 2) {
        // Calculate consistency score (inverse of coefficient of variation)
        const mean = seasonalValues.reduce((sum, v) => sum + v, 0) / seasonalValues.length;
        const variance = calculateVariance(seasonalValues);
        const stdDev = Math.sqrt(variance);
        const cv = mean !== 0 ? stdDev / Math.abs(mean) : 1;

        // Lower coefficient of variation = more consistent = stronger seasonality
        correlation += 1 / (cv + 0.1);
      }
    }

    // Normalize by period length
    const normalizedScore = correlation / period;

    if (normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestPeriod = period;
    }
  });

  // Moderate threshold for seasonality detection (balance between sensitivity and false positives)
  return bestScore > 3.5 ? bestPeriod : 0;
}

function calculateSeasonalComponent(
  values: number[],
  trend: number[],
  period: number
): number[] {
  const seasonal: number[] = new Array(values.length).fill(0);
  const seasonalAverages: number[] = new Array(period).fill(0);
  const seasonalCounts: number[] = new Array(period).fill(0);

  // Calculate average for each seasonal position
  values.forEach((value, i) => {
    const detrended = value - trend[i];
    const seasonalIndex = i % period;
    seasonalAverages[seasonalIndex] += detrended;
    seasonalCounts[seasonalIndex]++;
  });

  // Normalize seasonal averages
  seasonalAverages.forEach((sum, i) => {
    if (seasonalCounts[i] > 0) {
      seasonalAverages[i] = sum / seasonalCounts[i];
    }
  });

  // Apply to all positions
  values.forEach((_, i) => {
    seasonal[i] = seasonalAverages[i % period];
  });

  return seasonal;
}

function calculateCyclicalComponent(values: number[]): number[] {
  // Simplified cyclical component using longer moving average
  return calculateMovingAverage(values, Math.floor(values.length / 4));
}

function calculateVolatility(irregular: number[]): number {
  const variance = calculateVariance(irregular);
  const stdDev = Math.sqrt(variance);

  // Calculate mean of absolute values to avoid division by near-zero
  const meanAbsValue = irregular.reduce((sum, v) => sum + Math.abs(v), 0) / irregular.length;

  // If irregular components are all near zero, volatility is very low
  if (meanAbsValue < 1 && stdDev < 1) {
    return 0;
  }

  // If mean is still very small, use standard deviation directly as volatility indicator
  if (meanAbsValue < 10) {
    return Math.min(100, stdDev);
  }

  // Calculate coefficient of variation as volatility measure
  return Math.min(100, (stdDev / meanAbsValue) * 100);
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function generateBasePredictions(
  values: number[],
  trendAnalysis: TrendAnalysis,
  periods: number,
  dates: Date[]
): Array<{ period: number; date: Date; value: number; trend: number; seasonal: number }> {
  const lastValue = values[values.length - 1];
  const lastTrend = trendAnalysis.components.trend[trendAnalysis.components.trend.length - 1];
  const lastDate = dates[dates.length - 1];

  const regression = linearRegression(
    trendAnalysis.components.trend.map((_, i) => i),
    trendAnalysis.components.trend
  );

  const predictions: Array<{ period: number; date: Date; value: number; trend: number; seasonal: number }> = [];

  for (let i = 0; i < periods; i++) {
    const period = i + 1;
    const trendValue = regression.slope * (values.length + i) + regression.intercept;

    // Get seasonal component if available
    let seasonal = 0;
    if (trendAnalysis.seasonalityDetected && trendAnalysis.seasonalPeriod) {
      const seasonalIndex = (values.length + i) % trendAnalysis.seasonalPeriod;
      seasonal = trendAnalysis.components.seasonal[seasonalIndex] || 0;
    }

    const value = Math.max(0, trendValue + seasonal);

    // Calculate future date
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i + 1);

    predictions.push({
      period,
      date: futureDate,
      value,
      trend: trendValue,
      seasonal,
    });
  }

  return predictions;
}

function applyExternalFactors(
  predictions: Array<{ period: number; date: Date; value: number; trend: number; seasonal: number }>,
  externalFactors: ExternalFactor[]
): Array<{ period: number; date: Date; value: number; trend: number; seasonal: number }> {
  return predictions.map(p => {
    let adjustment = 1;

    externalFactors.forEach(factor => {
      if (p.period >= factor.startPeriod && p.period <= factor.endPeriod) {
        const impact = factor.magnitude / 100;
        if (factor.impact === 'positive') {
          adjustment *= (1 + impact);
        } else if (factor.impact === 'negative') {
          adjustment *= (1 - impact);
        }
      }
    });

    return {
      ...p,
      value: p.value * adjustment,
    };
  });
}

function calculateConfidenceIntervals(
  predictions: Array<{ period: number; date: Date; value: number; trend: number; seasonal: number }>,
  historicalValues: number[],
  volatility: number
): ForecastPrediction[] {
  const stdError = calculateStandardError(historicalValues);

  return predictions.map((p, i) => {
    // Confidence degrades with distance into future
    const confidenceLevel = Math.max(50, 95 - (i * 2));
    const zScore = 1.96; // 95% confidence

    // Widen interval based on period and volatility
    const errorMargin = stdError * zScore * (1 + (i * 0.1)) * (1 + volatility / 100);

    return {
      period: p.period,
      date: p.date,
      value: Math.round(p.value),
      trend: Math.round(p.trend),
      seasonal: Math.round(p.seasonal),
      confidence: {
        lower: Math.round(Math.max(0, p.value - errorMargin)),
        upper: Math.round(p.value + errorMargin),
        level: confidenceLevel,
      },
    };
  });
}

function calculateStandardError(values: number[]): number {
  const variance = calculateVariance(values);
  return Math.sqrt(variance / values.length);
}

function calculateConfidenceMetrics(
  historicalData: HistoricalDataPoint[],
  trendAnalysis: TrendAnalysis
): ConfidenceMetrics {
  const warnings: string[] = [];

  // Data quality score
  const dataQuality = Math.min(100, (historicalData.length / 24) * 100);
  if (dataQuality < 50) {
    warnings.push('Limited historical data may reduce forecast accuracy');
  }

  // Trend stability
  const trendStability = Math.max(0, 100 - trendAnalysis.volatility);
  if (trendStability < 60) {
    warnings.push('High volatility detected - forecast may be less reliable');
  }

  // Seasonal consistency
  const seasonalConsistency = trendAnalysis.seasonalityDetected ? 85 : 60;
  if (!trendAnalysis.seasonalityDetected && historicalData.length >= 24) {
    warnings.push('No clear seasonal pattern detected');
  }

  const overall = Math.round(
    (dataQuality * 0.3) + (trendStability * 0.4) + (seasonalConsistency * 0.3)
  );

  if (overall < 60) {
    warnings.push('Overall confidence is moderate - consider gathering more data');
  }

  return {
    overall,
    dataQuality,
    trendStability,
    seasonalConsistency,
    warnings,
  };
}

function generateForecastRecommendations(
  trendAnalysis: TrendAnalysis,
  confidence: ConfidenceMetrics,
  scenarios: ScenarioForecast
): string[] {
  const recommendations: string[] = [];

  // Trend-based recommendations
  if (trendAnalysis.direction === 'increasing' && trendAnalysis.strength > 60) {
    recommendations.push('Strong growth trend detected - consider capacity expansion');
  } else if (trendAnalysis.direction === 'decreasing' && trendAnalysis.strength > 60) {
    recommendations.push('Declining trend detected - review pricing and marketing strategies');
  } else {
    recommendations.push('Stable trend - focus on operational efficiency and service quality');
  }

  // Volatility recommendations
  if (trendAnalysis.volatility > 40) {
    recommendations.push('High volatility - implement flexible pricing and staffing strategies');
  }

  // Seasonality recommendations
  if (trendAnalysis.seasonalityDetected) {
    recommendations.push('Clear seasonal patterns - optimize staffing and inventory for peak periods');
  }

  // Confidence-based recommendations
  if (confidence.overall < 70) {
    recommendations.push('Moderate forecast confidence - gather more historical data for better accuracy');
  }

  // Scenario-based recommendations
  const range = scenarios.best.totalValue - scenarios.worst.totalValue;
  const avgValue = (scenarios.best.totalValue + scenarios.worst.totalValue) / 2;
  const rangePercent = (range / avgValue) * 100;

  if (rangePercent > 40) {
    recommendations.push('Wide scenario range - prepare contingency plans for various outcomes');
  }

  return recommendations;
}

function calculateNPV(
  investment: number,
  cashFlows: number[],
  discountRate: number
): number {
  let npv = -investment;

  cashFlows.forEach((cf, i) => {
    npv += cf / Math.pow(1 + discountRate / 100, i + 1);
  });

  return npv;
}

function calculateIRR(investment: number, cashFlows: number[]): number {
  // Simplified IRR calculation using Newton's method
  let irr = 0.1; // Initial guess 10%
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = -investment;
    let derivative = 0;

    cashFlows.forEach((cf, period) => {
      const p = period + 1;
      npv += cf / Math.pow(1 + irr, p);
      derivative -= (p * cf) / Math.pow(1 + irr, p + 1);
    });

    if (Math.abs(npv) < tolerance) break;

    irr = irr - npv / derivative;
  }

  return irr * 100;
}
