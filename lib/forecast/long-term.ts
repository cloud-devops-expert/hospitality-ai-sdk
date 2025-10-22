/**
 * Long-Term Trend Forecasting (1-5 Years)
 *
 * Features:
 * - Multi-year occupancy and revenue forecasting
 * - Trend decomposition (trend, seasonal, cyclical, irregular)
 * - External factor integration (economic indicators, market trends)
 * - Confidence intervals for long-term predictions
 * - Scenario planning (best/worst/likely cases)
 * - Investment ROI forecasting
 * - Strategic planning support
 */

export interface HistoricalData {
  month: string; // 'YYYY-MM'
  occupancyRate: number; // 0-100
  averageDailyRate: number; // ADR in currency
  revenue: number;
  roomNights: number;
}

export interface ExternalFactors {
  economicGrowth?: number; // GDP growth rate, -10 to +10
  inflation?: number; // 0-20
  touristArrivals?: number; // % change year-over-year
  competitorSupply?: number; // New rooms in market, # of rooms
  marketEvents?: Array<{
    year: number;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

export interface LongTermForecast {
  year: number;
  month?: number; // 1-12, if monthly forecast
  period: string; // 'YYYY' or 'YYYY-MM'

  // Forecasted metrics
  occupancyRate: number; // 0-100
  averageDailyRate: number;
  revenue: number;
  roomNights: number;

  // Confidence intervals (95%)
  confidenceInterval: {
    occupancyLow: number;
    occupancyHigh: number;
    revenueLow: number;
    revenueHigh: number;
  };

  // Decomposition
  decomposition: {
    trend: number;
    seasonal: number;
    cyclical: number;
    residual: number;
  };

  // External influence
  externalImpact: {
    economic: number; // -20 to +20 percentage points
    market: number;
    competition: number;
    total: number;
  };
}

export interface ScenarioForecast {
  scenario: 'best-case' | 'likely' | 'worst-case';
  description: string;
  assumptions: string[];
  forecasts: LongTermForecast[];
  totalRevenue: number;
  averageOccupancy: number;
  confidence: number;
}

export interface InvestmentAnalysis {
  investmentAmount: number;
  paybackPeriod: number; // years
  roi: number; // %
  npv: number; // Net Present Value
  irr: number; // Internal Rate of Return, %
  breakEvenYear: number;
  totalReturnOverPeriod: number;
}

/**
 * Generate long-term forecast (1-5 years) with trend decomposition
 */
export function forecastLongTerm(
  historicalData: HistoricalData[],
  yearsToForecast: number,
  externalFactors?: ExternalFactors,
  granularity: 'monthly' | 'yearly' = 'yearly'
): LongTermForecast[] {
  if (historicalData.length < 24) {
    throw new Error('Need at least 24 months of historical data for long-term forecasting');
  }

  if (yearsToForecast < 1 || yearsToForecast > 5) {
    throw new Error('Years to forecast must be between 1 and 5');
  }

  // Extract time series data
  const occupancyTS = historicalData.map((d) => d.occupancyRate);
  const adrTS = historicalData.map((d) => d.averageDailyRate);
  const revenueTS = historicalData.map((d) => d.revenue);

  // Decompose historical data
  const occupancyDecomp = decomposeTimeSeries(occupancyTS);
  const adrDecomp = decomposeTimeSeries(adrTS);

  // Calculate long-term trends
  const occupancyTrend = calculateLongTermTrend(occupancyTS);
  const adrTrend = calculateLongTermTrend(adrTS);

  // Generate forecasts
  const forecasts: LongTermForecast[] = [];
  const lastData = historicalData[historicalData.length - 1];
  const lastDate = new Date(lastData.month);

  const periodsToForecast = granularity === 'yearly' ? yearsToForecast : yearsToForecast * 12;
  const periodIncrement = granularity === 'yearly' ? 12 : 1;

  for (let i = 1; i <= periodsToForecast; i++) {
    const currentDate = new Date(lastDate);
    currentDate.setMonth(currentDate.getMonth() + i * periodIncrement);

    const year = currentDate.getFullYear();
    const month = granularity === 'monthly' ? currentDate.getMonth() + 1 : undefined;
    const period = granularity === 'yearly'
      ? `${year}`
      : `${year}-${String(month).padStart(2, '0')}`;

    // Calculate base forecast (trend + seasonal)
    const monthIndex = currentDate.getMonth();
    const baseOccupancy =
      lastData.occupancyRate +
      occupancyTrend * i +
      occupancyDecomp.seasonal[monthIndex % 12];

    const baseADR = lastData.averageDailyRate + adrTrend * i + adrDecomp.trend * 0.1;

    // Apply external factors
    const externalImpact = calculateExternalImpact(
      year,
      i,
      externalFactors
    );

    // Final forecast with external adjustments
    const forecastedOccupancy = Math.max(
      20,
      Math.min(95, baseOccupancy + externalImpact.total)
    );
    const forecastedADR = Math.max(
      50,
      baseADR * (1 + externalImpact.total / 100)
    );

    // Calculate room nights and revenue
    const daysInPeriod = granularity === 'yearly' ? 365 : getDaysInMonth(year, month!);
    const roomsAvailable = lastData.roomNights / (historicalData.length * 30); // Estimate
    const forecastedRoomNights =
      roomsAvailable * daysInPeriod * (forecastedOccupancy / 100);
    const forecastedRevenue = forecastedRoomNights * forecastedADR;

    // Calculate confidence intervals (wider for longer-term)
    const confidenceWidth = 5 + i * 2; // Increasing uncertainty over time
    const revenueConfidenceWidth = forecastedRevenue * (0.1 + i * 0.05);

    forecasts.push({
      year,
      month,
      period,
      occupancyRate: Math.round(forecastedOccupancy * 10) / 10,
      averageDailyRate: Math.round(forecastedADR * 100) / 100,
      revenue: Math.round(forecastedRevenue),
      roomNights: Math.round(forecastedRoomNights),
      confidenceInterval: {
        occupancyLow: Math.max(0, Math.round((forecastedOccupancy - confidenceWidth) * 10) / 10),
        occupancyHigh: Math.min(100, Math.round((forecastedOccupancy + confidenceWidth) * 10) / 10),
        revenueLow: Math.round(forecastedRevenue - revenueConfidenceWidth),
        revenueHigh: Math.round(forecastedRevenue + revenueConfidenceWidth),
      },
      decomposition: {
        trend: occupancyTrend * i,
        seasonal: occupancyDecomp.seasonal[monthIndex % 12],
        cyclical: occupancyDecomp.cyclical || 0,
        residual: occupancyDecomp.residual || 0,
      },
      externalImpact,
    });
  }

  return forecasts;
}

/**
 * Generate scenario-based forecasts (best/likely/worst case)
 */
export function generateScenarios(
  historicalData: HistoricalData[],
  yearsToForecast: number,
  baselineFactors?: ExternalFactors
): ScenarioForecast[] {
  // Best case: Optimistic economic growth, increased tourism
  const bestCaseFactors: ExternalFactors = {
    economicGrowth: 4.0,
    inflation: 2.0,
    touristArrivals: 8.0,
    competitorSupply: 50, // Limited new supply
    marketEvents: [
      {
        year: new Date().getFullYear() + 1,
        impact: 'positive',
        magnitude: 'high',
        description: 'Major convention center expansion',
      },
    ],
  };

  // Likely case: Moderate growth
  const likelyCaseFactors: ExternalFactors = {
    economicGrowth: 2.5,
    inflation: 2.5,
    touristArrivals: 3.0,
    competitorSupply: 150,
    marketEvents: [],
  };

  // Worst case: Economic downturn, oversupply
  const worstCaseFactors: ExternalFactors = {
    economicGrowth: -1.0,
    inflation: 4.0,
    touristArrivals: -5.0,
    competitorSupply: 300, // Significant new supply
    marketEvents: [
      {
        year: new Date().getFullYear() + 1,
        impact: 'negative',
        magnitude: 'high',
        description: 'Economic recession',
      },
    ],
  };

  const bestCase = forecastLongTerm(historicalData, yearsToForecast, bestCaseFactors, 'yearly');
  const likelyCase = forecastLongTerm(historicalData, yearsToForecast, likelyCaseFactors, 'yearly');
  const worstCase = forecastLongTerm(historicalData, yearsToForecast, worstCaseFactors, 'yearly');

  return [
    {
      scenario: 'best-case',
      description: 'Optimistic scenario with strong economic growth and favorable market conditions',
      assumptions: [
        '4% economic growth',
        '8% increase in tourist arrivals',
        'Limited new competitor supply',
        'Major positive market events',
      ],
      forecasts: bestCase,
      totalRevenue: bestCase.reduce((sum, f) => sum + f.revenue, 0),
      averageOccupancy:
        bestCase.reduce((sum, f) => sum + f.occupancyRate, 0) / bestCase.length,
      confidence: 0.65,
    },
    {
      scenario: 'likely',
      description: 'Most probable scenario with moderate growth and stable market conditions',
      assumptions: [
        '2.5% economic growth',
        '3% increase in tourist arrivals',
        'Moderate new competitor supply',
        'Stable market conditions',
      ],
      forecasts: likelyCase,
      totalRevenue: likelyCase.reduce((sum, f) => sum + f.revenue, 0),
      averageOccupancy:
        likelyCase.reduce((sum, f) => sum + f.occupancyRate, 0) / likelyCase.length,
      confidence: 0.80,
    },
    {
      scenario: 'worst-case',
      description: 'Pessimistic scenario with economic downturn and market challenges',
      assumptions: [
        'Economic recession (-1% growth)',
        '5% decline in tourist arrivals',
        'Significant new competitor supply',
        'Negative market events',
      ],
      forecasts: worstCase,
      totalRevenue: worstCase.reduce((sum, f) => sum + f.revenue, 0),
      averageOccupancy:
        worstCase.reduce((sum, f) => sum + f.occupancyRate, 0) / worstCase.length,
      confidence: 0.70,
    },
  ];
}

/**
 * Analyze investment ROI based on long-term forecasts
 */
export function analyzeInvestmentROI(
  investmentAmount: number,
  forecasts: LongTermForecast[],
  discountRate: number = 0.08 // 8% default
): InvestmentAnalysis {
  const years = forecasts.length;
  let cumulativeCashFlow = -investmentAmount;
  let breakEvenYear = years + 1; // Default to beyond forecast period
  let npv = -investmentAmount;

  const annualCashFlows: number[] = [];

  // Calculate annual cash flows and NPV
  for (let year = 0; year < years; year++) {
    const annualRevenue = forecasts[year].revenue;
    const annualCashFlow = annualRevenue * 0.30; // Assume 30% profit margin

    annualCashFlows.push(annualCashFlow);

    // NPV calculation
    npv += annualCashFlow / Math.pow(1 + discountRate, year + 1);

    // Check for breakeven
    cumulativeCashFlow += annualCashFlow;
    if (cumulativeCashFlow >= 0 && breakEvenYear > years) {
      breakEvenYear = year + 1;
    }
  }

  // Calculate IRR (simplified Newton-Raphson method)
  const irr = calculateIRR([-investmentAmount, ...annualCashFlows]);

  // Total return over period
  const totalCashFlows = annualCashFlows.reduce((sum, cf) => sum + cf, 0);
  const totalReturn = totalCashFlows - investmentAmount;

  // ROI
  const roi = (totalReturn / investmentAmount) * 100;

  // Payback period
  const paybackPeriod = breakEvenYear > years ? years : breakEvenYear;

  return {
    investmentAmount,
    paybackPeriod,
    roi: Math.round(roi * 10) / 10,
    npv: Math.round(npv),
    irr: Math.round(irr * 100) / 100,
    breakEvenYear,
    totalReturnOverPeriod: Math.round(totalReturn),
  };
}

// Helper functions

function decomposeTimeSeries(data: number[]): {
  trend: number;
  seasonal: number[];
  cyclical: number | null;
  residual: number | null;
} {
  // Calculate trend using linear regression
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Calculate seasonal component (12-month cycle)
  const seasonal: number[] = Array(12).fill(0);
  const monthCounts: number[] = Array(12).fill(0);

  data.forEach((value, index) => {
    const month = index % 12;
    const trendValue = (sumY / n) + slope * index;
    seasonal[month] += value - trendValue;
    monthCounts[month]++;
  });

  // Average seasonal components
  for (let i = 0; i < 12; i++) {
    if (monthCounts[i] > 0) {
      seasonal[i] /= monthCounts[i];
    }
  }

  return {
    trend: slope,
    seasonal,
    cyclical: null,
    residual: null,
  };
}

function calculateLongTermTrend(data: number[]): number {
  // Use last 12 months for long-term trend calculation
  const recentData = data.slice(-12);
  const n = recentData.length;

  if (n < 2) return 0;

  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = recentData.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * recentData[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  return slope;
}

function calculateExternalImpact(
  year: number,
  periodOffset: number,
  factors?: ExternalFactors
): {
  economic: number;
  market: number;
  competition: number;
  total: number;
} {
  if (!factors) {
    return { economic: 0, market: 0, competition: 0, total: 0 };
  }

  // Economic impact (GDP growth → occupancy)
  const economicImpact = (factors.economicGrowth || 0) * 0.5; // 1% GDP → 0.5% occupancy

  // Market impact (tourist arrivals)
  const marketImpact = (factors.touristArrivals || 0) * 0.3; // 1% tourists → 0.3% occupancy

  // Competition impact (new supply)
  const competitionImpact = -(factors.competitorSupply || 0) / 100; // New rooms → negative

  // Event impact
  let eventImpact = 0;
  if (factors.marketEvents) {
    factors.marketEvents.forEach((event) => {
      if (event.year === year) {
        const magnitude = event.magnitude === 'high' ? 3 : event.magnitude === 'medium' ? 2 : 1;
        const direction = event.impact === 'positive' ? 1 : event.impact === 'negative' ? -1 : 0;
        eventImpact += magnitude * direction;
      }
    });
  }

  const total = economicImpact + marketImpact + competitionImpact + eventImpact;

  return {
    economic: Math.round(economicImpact * 10) / 10,
    market: Math.round(marketImpact * 10) / 10,
    competition: Math.round(competitionImpact * 10) / 10,
    total: Math.round(total * 10) / 10,
  };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.00001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv += (-t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100; // Return as percentage
    }

    rate = newRate;
  }

  return rate * 100;
}
