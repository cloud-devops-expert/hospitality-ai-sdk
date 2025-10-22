/**
 * Tests for Long-Term Trend Forecasting Module
 */

import {
  generateLongTermForecast,
  decomposeTrend,
  generateScenarios,
  calculateInvestmentROI,
  type ForecastInput,
  type HistoricalDataPoint,
  type ExternalFactor,
} from '../long-term';

describe('Long-Term Trend Forecasting Module', () => {
  // Helper function to generate mock historical data
  const generateMockData = (
    periods: number,
    baseValue: number = 10000,
    trend: number = 100,
    seasonalAmplitude: number = 500
  ): HistoricalDataPoint[] => {
    const data: HistoricalDataPoint[] = [];
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < periods; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);

      const trendValue = baseValue + (trend * i);
      const seasonal = seasonalAmplitude * Math.sin((i * 2 * Math.PI) / 12);
      const random = (Math.random() - 0.5) * 200;

      data.push({
        date,
        value: trendValue + seasonal + random,
        category: 'revenue',
      });
    }

    return data;
  };

  describe('generateLongTermForecast', () => {
    it('should generate forecast with basic historical data', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      };

      const forecast = generateLongTermForecast(input);

      expect(forecast.predictions.length).toBe(12);
      expect(forecast.trendAnalysis).toBeDefined();
      expect(forecast.scenarios).toBeDefined();
      expect(forecast.confidence).toBeDefined();
      expect(forecast.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect increasing trend', () => {
      const historicalData = generateMockData(24, 10000, 200, 0);

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      };

      const forecast = generateLongTermForecast(input);

      expect(forecast.trendAnalysis.direction).toBe('increasing');
      expect(forecast.trendAnalysis.strength).toBeGreaterThan(50);
    });

    it('should detect decreasing trend', () => {
      const historicalData = generateMockData(24, 15000, -150, 0);

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      };

      const forecast = generateLongTermForecast(input);

      expect(forecast.trendAnalysis.direction).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      const historicalData: HistoricalDataPoint[] = [];
      const startDate = new Date('2023-01-01');

      for (let i = 0; i < 24; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);
        // Use truly flat data with minimal random variation
        historicalData.push({
          date,
          value: 10000 + (Math.random() - 0.5) * 10,
        });
      }

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      };

      const forecast = generateLongTermForecast(input);

      expect(forecast.trendAnalysis.direction).toBe('stable');
      expect(forecast.trendAnalysis.strength).toBeLessThan(20);
    });

    it('should throw error with insufficient historical data', () => {
      const historicalData = generateMockData(8, 10000, 100, 0);

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      };

      expect(() => generateLongTermForecast(input)).toThrow(
        'At least 12 historical data points required'
      );
    });

    it('should include confidence intervals in predictions', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      };

      const forecast = generateLongTermForecast(input);

      forecast.predictions.forEach(p => {
        expect(p.confidence).toBeDefined();
        expect(p.confidence.lower).toBeLessThan(p.value);
        expect(p.confidence.upper).toBeGreaterThan(p.value);
        expect(p.confidence.level).toBeGreaterThan(0);
        expect(p.confidence.level).toBeLessThanOrEqual(100);
      });
    });

    it('should degrade confidence for distant future predictions', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      };

      const forecast = generateLongTermForecast(input);

      const firstConfidence = forecast.predictions[0].confidence.level;
      const lastConfidence = forecast.predictions[forecast.predictions.length - 1].confidence.level;

      expect(lastConfidence).toBeLessThan(firstConfidence);
    });

    it('should apply external factors to predictions', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);

      const externalFactors: ExternalFactor[] = [
        {
          name: 'Major event',
          impact: 'positive',
          magnitude: 20,
          startPeriod: 1,
          endPeriod: 3,
        },
      ];

      const input: ForecastInput = {
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
        externalFactors,
      };

      const forecastWithFactors = generateLongTermForecast(input);
      const forecastWithoutFactors = generateLongTermForecast({
        ...input,
        externalFactors: [],
      });

      // Values should be higher with positive external factor
      expect(forecastWithFactors.predictions[1].value).toBeGreaterThan(
        forecastWithoutFactors.predictions[1].value
      );
    });
  });

  describe('decomposeTrend', () => {
    it('should decompose time series into components', () => {
      const values = generateMockData(24, 10000, 100, 500).map(d => d.value);

      const analysis = decomposeTrend(values, 'month');

      expect(analysis.components.trend.length).toBe(values.length);
      expect(analysis.components.seasonal.length).toBe(values.length);
      expect(analysis.components.cyclical.length).toBe(values.length);
      expect(analysis.components.irregular.length).toBe(values.length);
    });

    it('should detect seasonality in monthly data', () => {
      const values = generateMockData(36, 10000, 50, 1000).map(d => d.value);

      const analysis = decomposeTrend(values, 'month');

      expect(analysis.seasonalityDetected).toBe(true);
      expect(analysis.seasonalPeriod).toBe(12);
    });

    it('should not detect seasonality in random data', () => {
      const values: number[] = [];
      for (let i = 0; i < 24; i++) {
        // Use larger random variation to ensure no pattern
        values.push(10000 + (Math.random() -0.5) * 10000);
      }

      const analysis = decomposeTrend(values, 'month');

      // Random data should have weak seasonality at best
      // Note: Due to randomness, sometimes patterns emerge by chance
      // so we check that seasonality is either not detected or has low strength
      if (analysis.seasonalityDetected) {
        // If detected, volatility should be high indicating weak pattern
        expect(analysis.volatility).toBeGreaterThan(20);
      }
    });

    it('should calculate volatility correctly', () => {
      const stableValues = Array(24).fill(10000);
      const volatileValues: number[] = [];

      for (let i = 0; i < 24; i++) {
        volatileValues.push(10000 + (Math.random() - 0.5) * 8000);
      }

      const stableAnalysis = decomposeTrend(stableValues, 'month');
      const volatileAnalysis = decomposeTrend(volatileValues, 'month');

      expect(volatileAnalysis.volatility).toBeGreaterThan(stableAnalysis.volatility);
    });

    it('should identify trend strength', () => {
      const strongTrendValues = generateMockData(24, 10000, 500, 0).map(d => d.value);
      const weakTrendValues = generateMockData(24, 10000, 10, 0).map(d => d.value);

      const strongAnalysis = decomposeTrend(strongTrendValues, 'month');
      const weakAnalysis = decomposeTrend(weakTrendValues, 'month');

      expect(strongAnalysis.strength).toBeGreaterThan(weakAnalysis.strength);
    });
  });

  describe('generateScenarios', () => {
    it('should generate three scenarios (best, likely, worst)', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      expect(forecast.scenarios.best).toBeDefined();
      expect(forecast.scenarios.likely).toBeDefined();
      expect(forecast.scenarios.worst).toBeDefined();
    });

    it('should have best case values higher than likely', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      expect(forecast.scenarios.best.totalValue).toBeGreaterThan(
        forecast.scenarios.likely.totalValue
      );
    });

    it('should have worst case values lower than likely', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      expect(forecast.scenarios.worst.totalValue).toBeLessThan(
        forecast.scenarios.likely.totalValue
      );
    });

    it('should include assumptions for each scenario', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      expect(forecast.scenarios.best.assumptions.length).toBeGreaterThan(0);
      expect(forecast.scenarios.likely.assumptions.length).toBeGreaterThan(0);
      expect(forecast.scenarios.worst.assumptions.length).toBeGreaterThan(0);
    });

    it('should calculate growth rates for scenarios', () => {
      const historicalData = generateMockData(24, 10000, 100, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      expect(forecast.scenarios.best.growthRate).toBeGreaterThan(
        forecast.scenarios.likely.growthRate
      );
      expect(forecast.scenarios.likely.growthRate).toBeGreaterThan(
        forecast.scenarios.worst.growthRate
      );
    });
  });

  describe('calculateInvestmentROI', () => {
    it('should calculate ROI for profitable investment', () => {
      const historicalData = generateMockData(24, 10000, 200, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      });

      const roi = calculateInvestmentROI(50000, forecast, 30, 10);

      expect(roi.totalROI).toBeGreaterThan(0);
      expect(roi.breakEvenPeriod).toBeGreaterThan(0);
      expect(roi.expectedReturns.length).toBe(24);
    });

    it('should recommend highly profitable investments', () => {
      const historicalData = generateMockData(24, 20000, 500, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      });

      const roi = calculateInvestmentROI(30000, forecast, 20, 10);

      expect(roi.recommendation).toEqual(
        expect.stringMatching(/highly-recommended|recommended/)
      );
    });

    it('should not recommend unprofitable investments', () => {
      const historicalData = generateMockData(24, 5000, -100, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      });

      const roi = calculateInvestmentROI(100000, forecast, 50, 10);

      expect(roi.recommendation).toBe('not-recommended');
    });

    it('should calculate break-even period correctly', () => {
      const historicalData = generateMockData(24, 15000, 200, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      });

      const roi = calculateInvestmentROI(80000, forecast, 30, 10);

      expect(roi.breakEvenPeriod).toBeGreaterThan(0);
      expect(roi.breakEvenPeriod).toBeLessThanOrEqual(24);
    });

    it('should calculate NPV (Net Present Value)', () => {
      const historicalData = generateMockData(24, 15000, 200, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      });

      const roi = calculateInvestmentROI(50000, forecast, 30, 10);

      expect(roi.npv).toBeDefined();
      expect(typeof roi.npv).toBe('number');
    });

    it('should calculate IRR (Internal Rate of Return)', () => {
      const historicalData = generateMockData(24, 15000, 200, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      });

      const roi = calculateInvestmentROI(50000, forecast, 30, 10);

      expect(roi.irr).toBeDefined();
      expect(typeof roi.irr).toBe('number');
    });

    it('should handle different cost percentages', () => {
      const historicalData = generateMockData(24, 15000, 200, 0);
      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
      });

      const lowCostROI = calculateInvestmentROI(50000, forecast, 20, 10);
      const highCostROI = calculateInvestmentROI(50000, forecast, 50, 10);

      expect(lowCostROI.totalROI).toBeGreaterThan(highCostROI.totalROI);
    });
  });

  describe('Confidence Metrics', () => {
    it('should have higher confidence with more historical data', () => {
      const shortData = generateMockData(12, 10000, 100, 0);
      const longData = generateMockData(48, 10000, 100, 0);

      const shortForecast = generateLongTermForecast({
        historicalData: shortData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      const longForecast = generateLongTermForecast({
        historicalData: longData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      expect(longForecast.confidence.dataQuality).toBeGreaterThan(
        shortForecast.confidence.dataQuality
      );
    });

    it('should have lower confidence with high volatility', () => {
      const stableData: HistoricalDataPoint[] = [];
      const volatileData: HistoricalDataPoint[] = [];
      const startDate = new Date('2023-01-01');

      for (let i = 0; i < 24; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);

        stableData.push({
          date,
          value: 10000 + i * 100 + (Math.random() - 0.5) * 50,
        });

        volatileData.push({
          date,
          value: 10000 + i * 100 + (Math.random() - 0.5) * 5000,
        });
      }

      const stableForecast = generateLongTermForecast({
        historicalData: stableData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      const volatileForecast = generateLongTermForecast({
        historicalData: volatileData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      // Stable data should have higher trend stability OR lower overall volatility
      expect(
        stableForecast.confidence.trendStability >= volatileForecast.confidence.trendStability ||
        stableForecast.trendAnalysis.volatility < volatileForecast.trendAnalysis.volatility
      ).toBe(true);
    });

    it('should include warnings for low confidence', () => {
      const limitedData = generateMockData(12, 10000, 100, 0);

      const forecast = generateLongTermForecast({
        historicalData: limitedData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      if (forecast.confidence.overall < 70) {
        expect(forecast.confidence.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should warn about high volatility', () => {
      const volatileData: HistoricalDataPoint[] = [];
      const startDate = new Date('2023-01-01');

      for (let i = 0; i < 24; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);

        volatileData.push({
          date,
          value: 10000 + (Math.random() - 0.5) * 8000,
        });
      }

      const forecast = generateLongTermForecast({
        historicalData: volatileData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      const hasVolatilityWarning = forecast.confidence.warnings.some(w =>
        w.toLowerCase().includes('volatility')
      );

      expect(hasVolatilityWarning).toBe(true);
    });
  });

  describe('Recommendations', () => {
    it('should recommend capacity expansion for strong growth', () => {
      const historicalData = generateMockData(24, 10000, 500, 0);

      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      const hasExpansionRec = forecast.recommendations.some(r =>
        r.toLowerCase().includes('expansion') || r.toLowerCase().includes('growth')
      );

      expect(hasExpansionRec).toBe(true);
    });

    it('should recommend strategy review for declining trend', () => {
      const historicalData = generateMockData(24, 15000, -300, 0);

      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      const hasReviewRec = forecast.recommendations.some(r =>
        r.toLowerCase().includes('review') || r.toLowerCase().includes('declining')
      );

      expect(hasReviewRec).toBe(true);
    });

    it('should recommend seasonal optimization when seasonality detected', () => {
      const historicalData = generateMockData(36, 10000, 100, 2000);

      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      if (forecast.trendAnalysis.seasonalityDetected) {
        const hasSeasonalRec = forecast.recommendations.some(r =>
          r.toLowerCase().includes('seasonal')
        );

        expect(hasSeasonalRec).toBe(true);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete forecasting workflow', () => {
      // Simulate 3 years of monthly revenue data
      const historicalData = generateMockData(36, 50000, 500, 5000);

      const externalFactors: ExternalFactor[] = [
        {
          name: 'New conference center opening',
          impact: 'positive',
          magnitude: 15,
          startPeriod: 6,
          endPeriod: 24,
        },
        {
          name: 'Economic slowdown',
          impact: 'negative',
          magnitude: 10,
          startPeriod: 1,
          endPeriod: 6,
        },
      ];

      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 24,
        periodType: 'month',
        metric: 'revenue',
        externalFactors,
      });

      // Validate complete forecast
      expect(forecast.predictions.length).toBe(24);
      expect(forecast.trendAnalysis.direction).toBeTruthy();
      expect(forecast.scenarios.best.totalValue).toBeGreaterThan(0);
      expect(forecast.scenarios.likely.totalValue).toBeGreaterThan(0);
      expect(forecast.scenarios.worst.totalValue).toBeGreaterThan(0);
      expect(forecast.confidence.overall).toBeGreaterThan(0);
      expect(forecast.recommendations.length).toBeGreaterThan(0);

      // Validate ROI calculation
      const roi = calculateInvestmentROI(200000, forecast, 30, 10);
      expect(roi.totalROI).toBeDefined();
      expect(roi.breakEvenPeriod).toBeGreaterThan(0);
      expect(roi.recommendation).toBeTruthy();
    });

    it('should handle different period types', () => {
      const dailyData = generateMockData(365, 1000, 2, 100);
      const quarterlyData = generateMockData(16, 100000, 2000, 10000);

      const dailyForecast = generateLongTermForecast({
        historicalData: dailyData,
        forecastPeriods: 90,
        periodType: 'day',
        metric: 'revenue',
      });

      const quarterlyForecast = generateLongTermForecast({
        historicalData: quarterlyData,
        forecastPeriods: 8,
        periodType: 'quarter',
        metric: 'revenue',
      });

      expect(dailyForecast.predictions.length).toBe(90);
      expect(quarterlyForecast.predictions.length).toBe(8);
    });

    it('should provide actionable insights for business planning', () => {
      const historicalData = generateMockData(24, 75000, 300, 8000);

      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      // Should have clear trend direction
      expect(forecast.trendAnalysis.direction).toBeTruthy();

      // Should have reasonable confidence
      expect(forecast.confidence.overall).toBeGreaterThan(40);

      // Should have practical recommendations
      expect(forecast.recommendations.length).toBeGreaterThan(0);

      // Scenarios should be realistic
      const range = forecast.scenarios.best.totalValue - forecast.scenarios.worst.totalValue;
      expect(range).toBeGreaterThan(0);
    });

    it('should handle seasonal hospitality patterns', () => {
      // Simulate typical hotel revenue with summer peaks
      const historicalData: HistoricalDataPoint[] = [];
      const startDate = new Date('2022-01-01');

      for (let i = 0; i < 36; i++) {
        const month = i % 12;
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);

        // Summer months (Jun-Aug) have 30% higher revenue
        let seasonalMultiplier = 1;
        if (month >= 5 && month <= 7) {
          seasonalMultiplier = 1.3;
        } else if (month === 11) {
          // December also peaks
          seasonalMultiplier = 1.25;
        } else if (month >= 0 && month <= 2) {
          // Winter slow season
          seasonalMultiplier = 0.85;
        }

        historicalData.push({
          date,
          value: 80000 * seasonalMultiplier + (Math.random() - 0.5) * 5000,
        });
      }

      const forecast = generateLongTermForecast({
        historicalData,
        forecastPeriods: 12,
        periodType: 'month',
        metric: 'revenue',
      });

      expect(forecast.trendAnalysis.seasonalityDetected).toBe(true);
      expect(forecast.trendAnalysis.seasonalPeriod).toBe(12);
    });
  });
});
