/**
 * Statistical Forecasting
 * Traditional time-series analysis
 */

export interface DataPoint {
  date: Date;
  value: number;
}

export interface ForecastResult {
  date: Date;
  predicted: number;
  confidence: number; // 0-1
  trend: 'increasing' | 'decreasing' | 'stable';
  method: 'moving-average' | 'exponential-smoothing' | 'trend-analysis' | 'arima' | 'prophet' | 'lstm';
}

/**
 * Simple Moving Average
 */
export function movingAverage(
  historicalData: DataPoint[],
  windowSize: number = 7
): number {
  if (historicalData.length < windowSize) {
    windowSize = historicalData.length;
  }

  const recentData = historicalData.slice(-windowSize);
  const sum = recentData.reduce((acc, dp) => acc + dp.value, 0);
  return sum / windowSize;
}

/**
 * Exponential Smoothing
 * More weight to recent data
 */
export function exponentialSmoothing(
  historicalData: DataPoint[],
  alpha: number = 0.3 // Smoothing factor (0-1)
): number {
  if (historicalData.length === 0) return 0;
  if (historicalData.length === 1) return historicalData[0].value;

  let smoothed = historicalData[0].value;

  for (let i = 1; i < historicalData.length; i++) {
    smoothed = alpha * historicalData[i].value + (1 - alpha) * smoothed;
  }

  return smoothed;
}

/**
 * Trend Analysis
 * Calculate linear trend
 */
export function calculateTrend(historicalData: DataPoint[]): {
  slope: number;
  intercept: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} {
  const n = historicalData.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, trend: 'stable' };
  }

  // Convert dates to numeric values (days since first date)
  const firstDate = historicalData[0].date.getTime();
  const x = historicalData.map(dp => (dp.date.getTime() - firstDate) / (1000 * 60 * 60 * 24));
  const y = historicalData.map(dp => dp.value);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(slope) < 0.01) trend = 'stable';
  else if (slope > 0) trend = 'increasing';
  else trend = 'decreasing';

  return { slope, intercept, trend };
}

/**
 * Forecast next period
 */
export function forecastNext(
  historicalData: DataPoint[],
  daysAhead: number = 1
): ForecastResult {
  if (historicalData.length === 0) {
    return {
      date: new Date(),
      predicted: 0,
      confidence: 0,
      trend: 'stable',
      method: 'moving-average'
    };
  }

  // Combine multiple methods for better accuracy
  const ma = movingAverage(historicalData, 7);
  const es = exponentialSmoothing(historicalData, 0.3);
  const trendAnalysis = calculateTrend(historicalData);

  // Weight the methods
  const predicted = ma * 0.4 + es * 0.4 + (ma + trendAnalysis.slope * daysAhead) * 0.2;

  // Calculate confidence based on data variance
  const values = historicalData.slice(-14).map(dp => dp.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Lower variance = higher confidence
  const confidence = Math.max(0, Math.min(1, 1 - (stdDev / mean)));

  const lastDate = historicalData[historicalData.length - 1].date;
  const forecastDate = new Date(lastDate);
  forecastDate.setDate(forecastDate.getDate() + daysAhead);

  return {
    date: forecastDate,
    predicted: Math.max(0, predicted),
    confidence,
    trend: trendAnalysis.trend,
    method: 'exponential-smoothing'
  };
}

/**
 * Forecast multiple periods ahead
 */
export function forecastRange(
  historicalData: DataPoint[],
  daysAhead: number
): ForecastResult[] {
  const forecasts: ForecastResult[] = [];
  const currentData = [...historicalData];

  for (let i = 1; i <= daysAhead; i++) {
    const forecast = forecastNext(currentData, 1);
    forecasts.push(forecast);

    // Add forecast to data for next iteration
    currentData.push({
      date: forecast.date,
      value: forecast.predicted
    });
  }

  return forecasts;
}

/**
 * Detect seasonality
 */
export function detectSeasonality(historicalData: DataPoint[]): {
  hasSeasonality: boolean;
  period?: number;
  pattern?: number[];
} {
  if (historicalData.length < 30) {
    return { hasSeasonality: false };
  }

  // Group by day of week
  const byDayOfWeek: number[][] = [[], [], [], [], [], [], []];

  historicalData.forEach(dp => {
    const day = dp.date.getDay();
    byDayOfWeek[day].push(dp.value);
  });

  // Calculate average for each day
  const dayAverages = byDayOfWeek.map(values => {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  });

  const overallMean = dayAverages.reduce((a, b) => a + b, 0) / dayAverages.length;

  // Check if there's significant variation by day
  const variance = dayAverages.reduce(
    (sum, avg) => sum + Math.pow(avg - overallMean, 2),
    0
  ) / dayAverages.length;

  const hasSeasonality = variance / overallMean > 0.1; // 10% threshold

  return {
    hasSeasonality,
    period: 7,
    pattern: hasSeasonality ? dayAverages : undefined
  };
}
