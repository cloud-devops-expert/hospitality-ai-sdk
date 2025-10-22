import {
  calculateDynamicPrice,
  calculateMovingAverage,
  predictOccupancy,
} from '../traditional';
import type { PricingParams } from '../traditional';

describe('Traditional Dynamic Pricing', () => {
  describe('calculateDynamicPrice', () => {
    const baseParams: PricingParams = {
      basePrice: 100,
      date: new Date('2024-06-15'), // Saturday in June (high season)
      occupancyRate: 0.6,
      daysUntilStay: 30,
      roomType: 'double',
    };

    describe('Seasonal Adjustments', () => {
      it('should apply high season multiplier for summer months', () => {
        const params = { ...baseParams, date: new Date('2024-07-15') }; // July
        const result = calculateDynamicPrice(params);

        expect(result.adjustments.some((a) => a.factor === 'High Season')).toBe(true);
        expect(result.finalPrice).toBeGreaterThan(result.originalPrice);
      });

      it('should apply high season multiplier for December', () => {
        const params = { ...baseParams, date: new Date('2024-12-20') };
        const result = calculateDynamicPrice(params);

        const seasonalAdj = result.adjustments.find((a) => a.factor === 'High Season');
        expect(seasonalAdj).toBeDefined();
        expect(seasonalAdj?.percentage).toBe(30);
      });

      it('should apply low season discount', () => {
        const params = { ...baseParams, date: new Date('2024-02-15') }; // February
        const result = calculateDynamicPrice(params);

        const seasonalAdj = result.adjustments.find((a) => a.factor === 'Low Season');
        expect(seasonalAdj).toBeDefined();
        expect(seasonalAdj?.percentage).toBe(-20);
        expect(result.finalPrice).toBeLessThan(result.originalPrice);
      });

      it('should not add seasonal adjustment for shoulder season', () => {
        const params = { ...baseParams, date: new Date('2024-04-15') }; // April
        const result = calculateDynamicPrice(params);

        expect(result.adjustments.some((a) => a.factor.includes('Season'))).toBe(false);
      });
    });

    describe('Day of Week Adjustments', () => {
      it('should increase price for Friday', () => {
        const params = { ...baseParams, date: new Date('2024-06-14') }; // Friday
        const result = calculateDynamicPrice(params);

        const dowAdj = result.adjustments.find((a) => a.factor === 'Day of Week');
        expect(dowAdj).toBeDefined();
        expect(dowAdj?.percentage).toBeGreaterThan(0);
      });

      it('should increase price for Saturday', () => {
        const params = { ...baseParams, date: new Date('2024-06-15') }; // Saturday
        const result = calculateDynamicPrice(params);

        const dowAdj = result.adjustments.find((a) => a.factor === 'Day of Week');
        expect(dowAdj).toBeDefined();
        expect(dowAdj?.percentage).toBeCloseTo(10, 1);
      });

      it('should decrease price for Monday', () => {
        const params = { ...baseParams, date: new Date('2024-06-10') }; // Monday
        const result = calculateDynamicPrice(params);

        const dowAdj = result.adjustments.find((a) => a.factor === 'Day of Week');
        expect(dowAdj).toBeDefined();
        expect(dowAdj?.percentage).toBeLessThan(0);
      });
    });

    describe('Occupancy-Based Demand Pricing', () => {
      it('should apply high demand premium for >90% occupancy', () => {
        const params = { ...baseParams, occupancyRate: 0.95 };
        const result = calculateDynamicPrice(params);

        const demandAdj = result.adjustments.find((a) => a.factor.includes('High Demand'));
        expect(demandAdj).toBeDefined();
        expect(demandAdj?.percentage).toBe(25);
      });

      it('should apply medium demand premium for >75% occupancy', () => {
        const params = { ...baseParams, occupancyRate: 0.8 };
        const result = calculateDynamicPrice(params);

        const demandAdj = result.adjustments.find((a) => a.factor.includes('Medium Demand'));
        expect(demandAdj).toBeDefined();
        expect(demandAdj?.percentage).toBe(15);
      });

      it('should apply low demand discount for <40% occupancy', () => {
        const params = { ...baseParams, occupancyRate: 0.3 };
        const result = calculateDynamicPrice(params);

        const demandAdj = result.adjustments.find((a) => a.factor.includes('Low Demand'));
        expect(demandAdj).toBeDefined();
        expect(demandAdj?.percentage).toBe(-15);
      });

      it('should not add demand adjustment for moderate occupancy', () => {
        const params = { ...baseParams, occupancyRate: 0.6 };
        const result = calculateDynamicPrice(params);

        expect(result.adjustments.some((a) => a.factor.includes('Demand'))).toBe(false);
      });
    });

    describe('Early Booking and Last-Minute Pricing', () => {
      it('should apply early booking discount for >60 days', () => {
        const params = { ...baseParams, daysUntilStay: 75 };
        const result = calculateDynamicPrice(params);

        const earlyAdj = result.adjustments.find((a) => a.factor.includes('Early Booking'));
        expect(earlyAdj).toBeDefined();
        expect(earlyAdj?.percentage).toBe(-10);
      });

      it('should apply last-minute discount for <3 days with low occupancy', () => {
        const params = { ...baseParams, daysUntilStay: 2, occupancyRate: 0.5 };
        const result = calculateDynamicPrice(params);

        const lastMinuteAdj = result.adjustments.find((a) => a.factor.includes('Last Minute'));
        expect(lastMinuteAdj).toBeDefined();
        expect(lastMinuteAdj?.percentage).toBe(-20);
      });

      it('should not apply last-minute discount with high occupancy', () => {
        const params = { ...baseParams, daysUntilStay: 2, occupancyRate: 0.8 };
        const result = calculateDynamicPrice(params);

        expect(result.adjustments.some((a) => a.factor.includes('Last Minute'))).toBe(false);
      });

      it('should not apply any timing discount for moderate advance booking', () => {
        const params = { ...baseParams, daysUntilStay: 30 };
        const result = calculateDynamicPrice(params);

        expect(
          result.adjustments.some(
            (a) => a.factor.includes('Early Booking') || a.factor.includes('Last Minute')
          )
        ).toBe(false);
      });
    });

    describe('Room Type Premiums', () => {
      it('should apply suite premium', () => {
        const params = { ...baseParams, roomType: 'suite' };
        const result = calculateDynamicPrice(params);

        const premiumAdj = result.adjustments.find((a) => a.factor.includes('suite Premium'));
        expect(premiumAdj).toBeDefined();
        expect(premiumAdj?.percentage).toBe(50);
      });

      it('should apply deluxe premium', () => {
        const params = { ...baseParams, roomType: 'deluxe' };
        const result = calculateDynamicPrice(params);

        const premiumAdj = result.adjustments.find((a) => a.factor.includes('deluxe Premium'));
        expect(premiumAdj).toBeDefined();
        expect(premiumAdj?.percentage).toBe(30);
      });

      it('should apply double premium', () => {
        const params = { ...baseParams, roomType: 'double' };
        const result = calculateDynamicPrice(params);

        const premiumAdj = result.adjustments.find((a) => a.factor.includes('double Premium'));
        expect(premiumAdj).toBeDefined();
        expect(premiumAdj?.percentage).toBe(10);
      });

      it('should not add premium for single room', () => {
        const params = { ...baseParams, roomType: 'single' };
        const result = calculateDynamicPrice(params);

        expect(result.adjustments.some((a) => a.factor.includes('Premium'))).toBe(false);
      });

      it('should handle case-insensitive room type', () => {
        const params = { ...baseParams, roomType: 'SUITE' };
        const result = calculateDynamicPrice(params);

        const premiumAdj = result.adjustments.find((a) => a.factor.includes('Premium'));
        expect(premiumAdj).toBeDefined();
      });
    });

    describe('Complex Scenarios', () => {
      it('should combine multiple adjustments correctly', () => {
        const params: PricingParams = {
          basePrice: 100,
          date: new Date('2024-12-20'), // High season Friday
          occupancyRate: 0.95,
          daysUntilStay: 5,
          roomType: 'suite',
        };

        const result = calculateDynamicPrice(params);

        expect(result.adjustments.length).toBeGreaterThan(3);
        expect(result.finalPrice).toBeGreaterThan(result.originalPrice * 1.5);
      });

      it('should handle low season with discounts', () => {
        const params: PricingParams = {
          basePrice: 100,
          date: new Date('2024-02-12'), // Low season Monday
          occupancyRate: 0.3,
          daysUntilStay: 75,
          roomType: 'single',
        };

        const result = calculateDynamicPrice(params);

        expect(result.finalPrice).toBeLessThan(result.originalPrice);
        expect(result.adjustments.some((a) => a.factor === 'Low Season')).toBe(true);
        expect(result.adjustments.some((a) => a.factor.includes('Early Booking'))).toBe(true);
      });

      it('should round final price to 2 decimal places', () => {
        const params = { ...baseParams };
        const result = calculateDynamicPrice(params);

        expect(result.finalPrice).toBe(Math.round(result.finalPrice * 100) / 100);
      });
    });

    describe('Method Attribution', () => {
      it('should mark method as traditional', () => {
        const result = calculateDynamicPrice(baseParams);

        expect(result.method).toBe('traditional');
      });
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate average of all prices when window is larger than data', () => {
      const prices = [100, 110, 105, 115];
      const result = calculateMovingAverage(prices, 7);

      expect(result).toBe((100 + 110 + 105 + 115) / 4);
    });

    it('should calculate average of last N prices', () => {
      const prices = [100, 110, 105, 115, 120];
      const result = calculateMovingAverage(prices, 3);

      expect(result).toBe((105 + 115 + 120) / 3);
    });

    it('should handle empty array', () => {
      const result = calculateMovingAverage([], 7);

      expect(result).toBe(0);
    });

    it('should handle single price', () => {
      const result = calculateMovingAverage([100], 3);

      expect(result).toBe(100);
    });

    it('should use default window size of 7', () => {
      const prices = [100, 110, 105, 115, 120, 125, 130, 135, 140];
      const result = calculateMovingAverage(prices);

      // Should use last 7 prices: 110, 105, 115, 120, 125, 130, 135, 140 (8 values, but window is 7)
      expect(result).toBeCloseTo((105 + 115 + 120 + 125 + 130 + 135 + 140) / 7, 1);
    });
  });

  describe('predictOccupancy', () => {
    const generateHistoricalData = () => {
      const data = [];
      for (let i = 0; i < 90; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        data.push({
          date,
          rate: 0.5 + Math.random() * 0.3, // 50-80% occupancy
        });
      }
      return data;
    };

    it('should predict based on similar day of week and month', () => {
      const historical = [
        { date: new Date('2024-01-05'), rate: 0.7 }, // Friday in January
        { date: new Date('2024-01-12'), rate: 0.75 }, // Friday in January
        { date: new Date('2024-01-19'), rate: 0.72 }, // Friday in January
      ];

      const targetDate = new Date('2024-01-26'); // Friday in January
      const prediction = predictOccupancy(historical, targetDate);

      expect(prediction).toBeCloseTo(0.723, 2);
    });

    it('should fall back to monthly average when no matching day of week', () => {
      const historical = [
        { date: new Date('2024-01-10'), rate: 0.6 }, // January
        { date: new Date('2024-01-15'), rate: 0.7 }, // January
        { date: new Date('2024-01-20'), rate: 0.65 }, // January
      ];

      const targetDate = new Date('2024-01-25');
      const prediction = predictOccupancy(historical, targetDate);

      expect(prediction).toBeGreaterThan(0);
      expect(prediction).toBeLessThanOrEqual(1);
    });

    it('should return 0.5 as default when no historical data', () => {
      const prediction = predictOccupancy([], new Date('2024-06-15'));

      expect(prediction).toBe(0.5);
    });

    it('should return 0.5 when no matching month data', () => {
      const historical = [
        { date: new Date('2024-01-10'), rate: 0.6 },
        { date: new Date('2024-02-15'), rate: 0.7 },
      ];

      const targetDate = new Date('2024-06-15'); // June, no data
      const prediction = predictOccupancy(historical, targetDate);

      expect(prediction).toBe(0.5);
    });

    it('should handle large historical datasets', () => {
      const historical = generateHistoricalData();
      const targetDate = new Date('2024-03-15');
      const prediction = predictOccupancy(historical, targetDate);

      expect(prediction).toBeGreaterThan(0);
      expect(prediction).toBeLessThanOrEqual(1);
    });

    it('should average multiple similar days correctly', () => {
      const historical = [
        { date: new Date('2024-06-01'), rate: 0.8 },
        { date: new Date('2024-06-08'), rate: 0.85 },
        { date: new Date('2024-06-15'), rate: 0.82 },
        { date: new Date('2024-06-22'), rate: 0.88 },
      ];

      const targetDate = new Date('2024-06-29'); // Same day of week as all above
      const prediction = predictOccupancy(historical, targetDate);

      expect(prediction).toBeCloseTo(0.8375, 3);
    });
  });

  describe('Integration Tests', () => {
    it('should produce realistic prices for typical scenarios', () => {
      const weekdayLowSeason: PricingParams = {
        basePrice: 100,
        date: new Date('2024-02-13'), // Tuesday in February
        occupancyRate: 0.45,
        daysUntilStay: 14,
        roomType: 'double',
      };

      const result = calculateDynamicPrice(weekdayLowSeason);

      expect(result.finalPrice).toBeGreaterThan(60);
      expect(result.finalPrice).toBeLessThan(100);
    });

    it('should produce higher prices for peak demand', () => {
      const weekendHighSeason: PricingParams = {
        basePrice: 100,
        date: new Date('2024-12-28'), // Saturday in December
        occupancyRate: 0.95,
        daysUntilStay: 7,
        roomType: 'deluxe',
      };

      const result = calculateDynamicPrice(weekendHighSeason);

      expect(result.finalPrice).toBeGreaterThan(150);
    });
  });
});
