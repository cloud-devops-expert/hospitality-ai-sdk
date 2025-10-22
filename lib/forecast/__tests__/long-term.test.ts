import {
  forecastLongTerm,
  generateScenarios,
  analyzeInvestmentROI,
  HistoricalData,
  ExternalFactors,
} from '../long-term';

describe('Long-Term Trend Forecasting', () => {
  // Generate 24 months of historical data
  const historicalData: HistoricalData[] = Array.from({ length: 24 }, (_, i) => ({
    month: `2023-${String((i % 12) + 1).padStart(2, '0')}`,
    occupancyRate: 70 + Math.sin(i / 2) * 10 + i * 0.5,
    averageDailyRate: 150 + i * 2,
    revenue: (70 + Math.sin(i / 2) * 10 + i * 0.5) * (150 + i * 2) * 1000,
    roomNights: 2100,
  }));

  describe('forecastLongTerm', () => {
    it('should generate yearly forecasts for specified years', () => {
      const forecasts = forecastLongTerm(historicalData, 3, undefined, 'yearly');

      expect(forecasts).toHaveLength(3);
      forecasts.forEach((f) => {
        expect(f.year).toBeGreaterThan(2023);
        expect(f.occupancyRate).toBeGreaterThanOrEqual(0);
        expect(f.occupancyRate).toBeLessThanOrEqual(100);
      });
    });

    it('should generate monthly forecasts when specified', () => {
      const forecasts = forecastLongTerm(historicalData, 2, undefined, 'monthly');

      expect(forecasts).toHaveLength(24);
      forecasts.forEach((f) => {
        expect(f.month).toBeGreaterThanOrEqual(1);
        expect(f.month).toBeLessThanOrEqual(12);
      });
    });

    it('should include confidence intervals', () => {
      const forecasts = forecastLongTerm(historicalData, 2);

      forecasts.forEach((f) => {
        expect(f.confidenceInterval).toBeDefined();
        expect(f.confidenceInterval.occupancyLow).toBeLessThan(f.occupancyRate);
        expect(f.confidenceInterval.occupancyHigh).toBeGreaterThan(f.occupancyRate);
        expect(f.confidenceInterval.revenueLow).toBeLessThan(f.revenue);
        expect(f.confidenceInterval.revenueHigh).toBeGreaterThan(f.revenue);
      });
    });

    it('should apply external factors when provided', () => {
      const factors: ExternalFactors = {
        economicGrowth: 3.0,
        touristArrivals: 5.0,
        competitorSupply: 100,
      };

      const withFactors = forecastLongTerm(historicalData, 2, factors);
      const withoutFactors = forecastLongTerm(historicalData, 2);

      // Forecasts should be different with external factors
      expect(withFactors[0].occupancyRate).not.toBe(withoutFactors[0].occupancyRate);
    });

    it('should throw error with insufficient data', () => {
      const insufficientData = historicalData.slice(0, 20);

      expect(() => forecastLongTerm(insufficientData, 3)).toThrow(
        'Need at least 24 months'
      );
    });

    it('should throw error with invalid forecast period', () => {
      expect(() => forecastLongTerm(historicalData, 0)).toThrow(
        'Years to forecast must be between 1 and 5'
      );
      expect(() => forecastLongTerm(historicalData, 6)).toThrow(
        'Years to forecast must be between 1 and 5'
      );
    });
  });

  describe('generateScenarios', () => {
    it('should generate three scenarios', () => {
      const scenarios = generateScenarios(historicalData, 3);

      expect(scenarios).toHaveLength(3);
      expect(scenarios.map((s) => s.scenario)).toEqual(['best-case', 'likely', 'worst-case']);
    });

    it('should have best case > likely > worst case revenue', () => {
      const scenarios = generateScenarios(historicalData, 3);

      const bestCase = scenarios.find((s) => s.scenario === 'best-case')!;
      const likelyCase = scenarios.find((s) => s.scenario === 'likely')!;
      const worstCase = scenarios.find((s) => s.scenario === 'worst-case')!;

      expect(bestCase.totalRevenue).toBeGreaterThan(likelyCase.totalRevenue);
      expect(likelyCase.totalRevenue).toBeGreaterThan(worstCase.totalRevenue);
    });

    it('should include assumptions for each scenario', () => {
      const scenarios = generateScenarios(historicalData, 2);

      scenarios.forEach((scenario) => {
        expect(scenario.assumptions).toBeInstanceOf(Array);
        expect(scenario.assumptions.length).toBeGreaterThan(0);
        expect(scenario.description).toBeTruthy();
      });
    });

    it('should have highest confidence for likely scenario', () => {
      const scenarios = generateScenarios(historicalData, 2);

      const likelyCase = scenarios.find((s) => s.scenario === 'likely')!;

      expect(likelyCase.confidence).toBeGreaterThanOrEqual(0.75);
    });
  });

  describe('analyzeInvestmentROI', () => {
    it('should calculate ROI metrics', () => {
      const forecasts = forecastLongTerm(historicalData, 5);
      const analysis = analyzeInvestmentROI(1000000, forecasts);

      expect(analysis.roi).toBeDefined();
      expect(analysis.npv).toBeDefined();
      expect(analysis.irr).toBeDefined();
      expect(analysis.paybackPeriod).toBeGreaterThanOrEqual(0);
    });

    it('should have positive ROI for profitable forecasts', () => {
      const forecasts = forecastLongTerm(historicalData, 5);
      const analysis = analyzeInvestmentROI(100000, forecasts); // Lower investment for positive ROI

      expect(analysis.roi).toBeGreaterThan(0);
      expect(analysis.totalReturnOverPeriod).toBeGreaterThan(0);
    });

    it('should calculate break-even year', () => {
      const forecasts = forecastLongTerm(historicalData, 5);
      const analysis = analyzeInvestmentROI(1000000, forecasts);

      expect(analysis.breakEvenYear).toBeGreaterThanOrEqual(1);
      expect(analysis.breakEvenYear).toBeLessThanOrEqual(forecasts.length + 1);
    });

    it('should respect discount rate', () => {
      const forecasts = forecastLongTerm(historicalData, 5);
      const highDiscount = analyzeInvestmentROI(1000000, forecasts, 0.15);
      const lowDiscount = analyzeInvestmentROI(1000000, forecasts, 0.05);

      expect(lowDiscount.npv).toBeGreaterThan(highDiscount.npv);
    });
  });
});
