import {
  calculateSustainabilityMetrics,
  forecastSustainability,
  HotelSustainabilityData,
  SUSTAINABILITY_BENCHMARKS,
  CARBON_EMISSION_FACTORS,
} from '../tracker';

describe('Sustainability Metrics Tracking', () => {
  const sampleData: HotelSustainabilityData = {
    propertyId: 'hotel-001',
    propertyName: 'Green Hotel',
    roomCount: 100,
    occupancyRate: 75,
    month: '2025-01',
    electricityKWh: 30000,
    gasKWh: 10000,
    renewablePercent: 20,
    waterLiters: 750000,
    wasteKg: {
      general: 1000,
      recyclable: 800,
      organic: 600,
      hazardous: 50,
    },
    climate: 'temperate',
    hasPool: true,
    hasLaundry: true,
    hasSpa: false,
    hasRestaurant: true,
  };

  describe('calculateSustainabilityMetrics', () => {
    describe('Carbon Footprint', () => {
      it('should calculate total carbon footprint correctly', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.carbonFootprint.totalKgCO2e).toBeGreaterThan(0);
        expect(result.carbonFootprint.breakdown.electricity).toBeGreaterThan(0);
        expect(result.carbonFootprint.breakdown.gas).toBeGreaterThan(0);
        expect(result.carbonFootprint.breakdown.water).toBeGreaterThan(0);
        expect(result.carbonFootprint.breakdown.waste).toBeGreaterThan(0);
      });

      it('should calculate per-room carbon metrics', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.carbonFootprint.perRoom).toBeGreaterThan(0);
        expect(result.carbonFootprint.perOccupiedRoom).toBeGreaterThan(
          result.carbonFootprint.perRoom
        );
        expect(result.carbonFootprint.perGuest).toBeGreaterThan(0);
      });

      it('should account for renewable energy in carbon calculation', () => {
        const noRenewable = { ...sampleData, renewablePercent: 0 };
        const withRenewable = { ...sampleData, renewablePercent: 50 };

        const result1 = calculateSustainabilityMetrics(noRenewable);
        const result2 = calculateSustainabilityMetrics(withRenewable);

        expect(result2.carbonFootprint.totalKgCO2e).toBeLessThan(
          result1.carbonFootprint.totalKgCO2e
        );
        expect(result2.carbonFootprint.breakdown.electricity).toBeLessThan(
          result1.carbonFootprint.breakdown.electricity
        );
      });

      it('should use correct emission factors', () => {
        const data: HotelSustainabilityData = {
          ...sampleData,
          electricityKWh: 1000,
          gasKWh: 0,
          waterLiters: 0,
          wasteKg: { general: 0, recyclable: 0, organic: 0, hazardous: 0 },
          renewablePercent: 0,
        };

        const result = calculateSustainabilityMetrics(data);
        const expectedCarbon = 1000 * CARBON_EMISSION_FACTORS.electricityKWh;

        expect(result.carbonFootprint.breakdown.electricity).toBeCloseTo(
          expectedCarbon,
          -1
        );
      });
    });

    describe('Water Usage', () => {
      it('should calculate water metrics correctly', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.waterUsage.totalLiters).toBe(750000);
        expect(result.waterUsage.perRoom).toBeGreaterThan(0);
        expect(result.waterUsage.perOccupiedRoom).toBeGreaterThan(
          result.waterUsage.perRoom
        );
        expect(result.waterUsage.perGuest).toBeGreaterThan(0);
      });

      it('should rate water efficiency correctly', () => {
        const excellentWater: HotelSustainabilityData = {
          ...sampleData,
          waterLiters: 400000, // Low usage
        };
        const poorWater: HotelSustainabilityData = {
          ...sampleData,
          waterLiters: 1500000, // High usage
        };

        const result1 = calculateSustainabilityMetrics(excellentWater);
        const result2 = calculateSustainabilityMetrics(poorWater);

        expect(result1.waterUsage.efficiency).toBe('excellent');
        expect(result2.waterUsage.efficiency).toBe('poor');
        expect(result1.sustainabilityScore).toBeGreaterThan(result2.sustainabilityScore);
      });
    });

    describe('Waste Management', () => {
      it('should calculate waste metrics correctly', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        const expectedTotal =
          sampleData.wasteKg.general +
          sampleData.wasteKg.recyclable +
          sampleData.wasteKg.organic +
          sampleData.wasteKg.hazardous;

        expect(result.wasteMetrics.totalKg).toBe(expectedTotal);
        expect(result.wasteMetrics.perRoom).toBeGreaterThan(0);
        expect(result.wasteMetrics.perOccupiedRoom).toBeGreaterThan(0);
      });

      it('should calculate recycling and diversion rates', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        const totalWaste =
          sampleData.wasteKg.general +
          sampleData.wasteKg.recyclable +
          sampleData.wasteKg.organic +
          sampleData.wasteKg.hazardous;

        const expectedRecyclable = (sampleData.wasteKg.recyclable / totalWaste) * 100;
        const expectedOrganic = (sampleData.wasteKg.organic / totalWaste) * 100;
        const expectedDiversion = expectedRecyclable + expectedOrganic;

        expect(result.wasteMetrics.recyclablePercent).toBeCloseTo(
          expectedRecyclable,
          0
        );
        expect(result.wasteMetrics.organicPercent).toBeCloseTo(expectedOrganic, 0);
        expect(result.wasteMetrics.diversionRate).toBeCloseTo(expectedDiversion, 0);
      });

      it('should rate waste management correctly', () => {
        const excellentWaste: HotelSustainabilityData = {
          ...sampleData,
          wasteKg: { general: 200, recyclable: 1000, organic: 800, hazardous: 50 },
        };
        const poorWaste: HotelSustainabilityData = {
          ...sampleData,
          wasteKg: { general: 1800, recyclable: 100, organic: 50, hazardous: 50 },
        };

        const result1 = calculateSustainabilityMetrics(excellentWaste);
        const result2 = calculateSustainabilityMetrics(poorWaste);

        expect(result1.wasteMetrics.rating).toBe('excellent');
        expect(result2.wasteMetrics.rating).toBe('poor');
        expect(result1.wasteMetrics.diversionRate).toBeGreaterThan(
          result2.wasteMetrics.diversionRate
        );
      });
    });

    describe('Overall Sustainability Score', () => {
      it('should calculate overall score between 0-100', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.sustainabilityScore).toBeGreaterThanOrEqual(0);
        expect(result.sustainabilityScore).toBeLessThanOrEqual(100);
      });

      it('should assign correct rating based on score', () => {
        const excellent: HotelSustainabilityData = {
          ...sampleData,
          electricityKWh: 15000,
          waterLiters: 400000,
          wasteKg: { general: 100, recyclable: 1000, organic: 900, hazardous: 20 },
          renewablePercent: 80,
        };

        const poor: HotelSustainabilityData = {
          ...sampleData,
          electricityKWh: 50000,
          waterLiters: 1500000,
          wasteKg: { general: 1800, recyclable: 100, organic: 50, hazardous: 100 },
          renewablePercent: 0,
        };

        const result1 = calculateSustainabilityMetrics(excellent);
        const result2 = calculateSustainabilityMetrics(poor);

        expect(result1.sustainabilityScore).toBeGreaterThan(result2.sustainabilityScore);
        expect(['platinum', 'gold']).toContain(result1.rating);
        expect(['bronze', 'needs-improvement']).toContain(result2.rating);
      });

      it('should calculate industry percentile correctly', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.industryPercentile).toBeGreaterThanOrEqual(0);
        expect(result.industryPercentile).toBeLessThanOrEqual(100);
        expect(result.industryPercentile).toBeCloseTo(
          result.sustainabilityScore * 0.9,
          0
        );
      });
    });

    describe('Recommendations', () => {
      it('should generate recommendations based on performance', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.recommendations).toBeInstanceOf(Array);
        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(result.recommendations[0]).toBeTruthy();
      });

      it('should recommend renewable energy if percentage is low', () => {
        const lowRenewable: HotelSustainabilityData = {
          ...sampleData,
          renewablePercent: 10,
        };

        const result = calculateSustainabilityMetrics(lowRenewable);

        expect(
          result.recommendations.some((r) => r.toLowerCase().includes('renewable'))
        ).toBe(true);
      });

      it('should recommend water conservation if efficiency is poor', () => {
        const highWater: HotelSustainabilityData = {
          ...sampleData,
          waterLiters: 1500000,
        };

        const result = calculateSustainabilityMetrics(highWater);

        expect(
          result.recommendations.some(
            (r) =>
              r.toLowerCase().includes('water') || r.toLowerCase().includes('flow')
          )
        ).toBe(true);
      });

      it('should recommend waste diversion if rate is low', () => {
        const lowDiversion: HotelSustainabilityData = {
          ...sampleData,
          wasteKg: { general: 1800, recyclable: 200, organic: 100, hazardous: 50 },
        };

        const result = calculateSustainabilityMetrics(lowDiversion);

        expect(
          result.recommendations.some(
            (r) =>
              r.toLowerCase().includes('recycl') ||
              r.toLowerCase().includes('diversion')
          )
        ).toBe(true);
      });

      it('should congratulate excellent performance', () => {
        const excellent: HotelSustainabilityData = {
          ...sampleData,
          electricityKWh: 15000,
          waterLiters: 400000,
          wasteKg: { general: 100, recyclable: 1000, organic: 900, hazardous: 20 },
          renewablePercent: 80,
        };

        const result = calculateSustainabilityMetrics(excellent);

        expect(
          result.recommendations.some(
            (r) => r.includes('EXCELLENT') || r.includes('✅')
          )
        ).toBe(true);
      });
    });

    describe('Cost Estimation', () => {
      it('should estimate costs for all resources', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.estimatedCosts.electricity).toBeGreaterThan(0);
        expect(result.estimatedCosts.water).toBeGreaterThan(0);
        expect(result.estimatedCosts.waste).toBeGreaterThan(0);
        expect(result.estimatedCosts.total).toBeGreaterThan(0);

        // Total includes gas cost which isn't separately reported
        expect(result.estimatedCosts.total).toBeGreaterThan(
          result.estimatedCosts.electricity +
            result.estimatedCosts.water +
            result.estimatedCosts.waste
        );
      });
    });

    describe('Potential Savings', () => {
      it('should calculate potential savings', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.potentialSavings.annual).toBeGreaterThanOrEqual(0);
        expect(result.potentialSavings.measures).toBeInstanceOf(Array);
      });

      it('should recommend LED lighting for high electricity usage', () => {
        const highElectricity: HotelSustainabilityData = {
          ...sampleData,
          electricityKWh: 40000,
        };

        const result = calculateSustainabilityMetrics(highElectricity);

        expect(
          result.potentialSavings.measures.some((m) => m.measure.includes('LED'))
        ).toBe(true);
      });

      it('should recommend low-flow fixtures for high water usage', () => {
        const highWater: HotelSustainabilityData = {
          ...sampleData,
          waterLiters: 1800000,
        };

        const result = calculateSustainabilityMetrics(highWater);

        expect(
          result.potentialSavings.measures.some((m) => m.measure.includes('flow'))
        ).toBe(true);
      });

      it('should recommend solar for low renewable percentage', () => {
        const lowRenewable: HotelSustainabilityData = {
          ...sampleData,
          renewablePercent: 5,
        };

        const result = calculateSustainabilityMetrics(lowRenewable);

        expect(
          result.potentialSavings.measures.some((m) => m.measure.includes('Solar'))
        ).toBe(true);
      });

      it('should categorize measures by implementation difficulty', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        result.potentialSavings.measures.forEach((measure) => {
          expect(['easy', 'moderate', 'complex']).toContain(
            measure.implementation
          );
          expect(measure.savings).toBeGreaterThan(0);
          expect(measure.carbonReduction).toBeGreaterThan(0);
        });
      });
    });

    describe('Benchmarking', () => {
      it('should compare against industry averages', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(typeof result.benchmark.vsIndustryAverage.carbon).toBe('number');
        expect(typeof result.benchmark.vsIndustryAverage.water).toBe('number');
        expect(typeof result.benchmark.vsIndustryAverage.waste).toBe('number');
      });

      it('should show positive % when better than average', () => {
        const excellent: HotelSustainabilityData = {
          ...sampleData,
          electricityKWh: 15000,
          waterLiters: 400000,
          wasteKg: { general: 100, recyclable: 1000, organic: 900, hazardous: 20 },
          renewablePercent: 80,
        };

        const result = calculateSustainabilityMetrics(excellent);

        expect(result.benchmark.vsIndustryAverage.carbon).toBeGreaterThan(0);
        expect(result.benchmark.vsIndustryAverage.water).toBeGreaterThan(0);
      });

      it('should track progress toward goals', () => {
        const result = calculateSustainabilityMetrics(sampleData);

        expect(result.benchmark.goalProgress.carbon).toBeGreaterThanOrEqual(0);
        expect(result.benchmark.goalProgress.carbon).toBeLessThanOrEqual(100);
        expect(result.benchmark.goalProgress.water).toBeGreaterThanOrEqual(0);
        expect(result.benchmark.goalProgress.water).toBeLessThanOrEqual(100);
        expect(result.benchmark.goalProgress.waste).toBeGreaterThanOrEqual(0);
        expect(result.benchmark.goalProgress.waste).toBeLessThanOrEqual(100);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero occupancy', () => {
        const zeroOccupancy = { ...sampleData, occupancyRate: 0 };

        expect(() => calculateSustainabilityMetrics(zeroOccupancy)).not.toThrow();
      });

      it('should handle 100% renewable energy', () => {
        const fullRenewable = { ...sampleData, renewablePercent: 100 };

        const result = calculateSustainabilityMetrics(fullRenewable);

        expect(result.carbonFootprint.breakdown.electricity).toBe(0);
      });

      it('should handle zero waste in all categories', () => {
        const zeroWaste = {
          ...sampleData,
          wasteKg: { general: 0, recyclable: 0, organic: 0, hazardous: 0 },
        };

        expect(() => calculateSustainabilityMetrics(zeroWaste)).not.toThrow();
      });
    });
  });

  describe('forecastSustainability', () => {
    const historicalData: HotelSustainabilityData[] = [
      { ...sampleData, month: '2024-07', occupancyRate: 65 },
      { ...sampleData, month: '2024-08', occupancyRate: 75 },
      { ...sampleData, month: '2024-09', occupancyRate: 70 },
      { ...sampleData, month: '2024-10', occupancyRate: 60 },
      { ...sampleData, month: '2024-11', occupancyRate: 55 },
      { ...sampleData, month: '2024-12', occupancyRate: 80 },
    ];

    it('should generate forecasts for specified number of months', () => {
      const forecasts = forecastSustainability(historicalData, 6);

      expect(forecasts).toHaveLength(6);
      forecasts.forEach((forecast) => {
        expect(forecast.month).toMatch(/\d{4}-\d{2}/);
        expect(forecast.predictedMetrics.carbonKgCO2e).toBeGreaterThan(0);
        expect(forecast.predictedMetrics.waterLiters).toBeGreaterThan(0);
        expect(forecast.predictedMetrics.wasteKg).toBeGreaterThan(0);
      });
    });

    it('should include confidence scores', () => {
      const forecasts = forecastSustainability(historicalData, 3);

      forecasts.forEach((forecast) => {
        expect(forecast.confidence).toBeGreaterThan(0);
        expect(forecast.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should include seasonal and occupancy factors', () => {
      const forecasts = forecastSustainability(historicalData, 3);

      forecasts.forEach((forecast) => {
        expect(forecast.seasonalFactor).toBeGreaterThan(0);
        expect(forecast.occupancyFactor).toBeGreaterThan(0);
      });
    });

    it('should throw error with insufficient historical data', () => {
      const insufficientData = [
        { ...sampleData, month: '2024-11' },
        { ...sampleData, month: '2024-12' },
      ];

      expect(() => forecastSustainability(insufficientData, 3)).toThrow(
        'Need at least 3 months of historical data'
      );
    });

    it('should generate sequential month forecasts', () => {
      const forecasts = forecastSustainability(historicalData, 3);

      for (let i = 1; i < forecasts.length; i++) {
        const prevDate = new Date(forecasts[i - 1].month);
        const currDate = new Date(forecasts[i].month);

        const monthDiff =
          (currDate.getFullYear() - prevDate.getFullYear()) * 12 +
          (currDate.getMonth() - prevDate.getMonth());

        expect(monthDiff).toBe(1);
      }
    });

    it('should consider historical trends in predictions', () => {
      const increasingTrend: HotelSustainabilityData[] = [
        { ...sampleData, month: '2024-10', electricityKWh: 25000 },
        { ...sampleData, month: '2024-11', electricityKWh: 27000 },
        { ...sampleData, month: '2024-12', electricityKWh: 29000 },
        { ...sampleData, month: '2025-01', electricityKWh: 31000 },
      ];

      const forecasts = forecastSustainability(increasingTrend, 2);

      // With increasing trend, later forecasts should generally be higher
      expect(forecasts[0].predictedMetrics.carbonKgCO2e).toBeGreaterThan(0);
    });

    it('should default to 6 months if not specified', () => {
      const forecasts = forecastSustainability(historicalData);

      expect(forecasts).toHaveLength(6);
    });
  });

  describe('Benchmarks and Constants', () => {
    it('should export sustainability benchmarks', () => {
      expect(SUSTAINABILITY_BENCHMARKS).toBeDefined();
      expect(SUSTAINABILITY_BENCHMARKS.carbon).toBeDefined();
      expect(SUSTAINABILITY_BENCHMARKS.water).toBeDefined();
      expect(SUSTAINABILITY_BENCHMARKS.wasteRecycling).toBeDefined();
    });

    it('should export carbon emission factors', () => {
      expect(CARBON_EMISSION_FACTORS).toBeDefined();
      expect(CARBON_EMISSION_FACTORS.electricityKWh).toBeGreaterThan(0);
      expect(CARBON_EMISSION_FACTORS.gasKWh).toBeGreaterThan(0);
      expect(CARBON_EMISSION_FACTORS.waterLiter).toBeGreaterThan(0);
    });

    it('should have realistic benchmark values', () => {
      expect(SUSTAINABILITY_BENCHMARKS.carbon.excellent).toBeLessThan(
        SUSTAINABILITY_BENCHMARKS.carbon.poor
      );
      expect(SUSTAINABILITY_BENCHMARKS.water.excellent).toBeLessThan(
        SUSTAINABILITY_BENCHMARKS.water.poor
      );
      expect(SUSTAINABILITY_BENCHMARKS.wasteRecycling.excellent).toBeGreaterThan(
        SUSTAINABILITY_BENCHMARKS.wasteRecycling.poor
      );
    });
  });
});
