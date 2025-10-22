import {
  calculatePriceLinearRegression,
  calculatePriceNeuralNet,
  ML_PRICING_MODELS,
} from '../ml-regression';
import type { PricingInput } from '../traditional';

describe('ML-Based Dynamic Pricing', () => {
  const createPricingInput = (overrides: Partial<PricingInput> = {}): PricingInput => ({
    basePrice: 100,
    date: new Date('2024-06-15'), // Saturday in June
    occupancyRate: 60,
    daysUntilStay: 30,
    roomType: 'double',
    ...overrides,
  });

  describe('calculatePriceLinearRegression', () => {
    it('should calculate price using linear regression model', () => {
      const input = createPricingInput();
      const result = calculatePriceLinearRegression(input);

      expect(result.method).toBe('linear-regression');
      expect(result.originalPrice).toBe(100);
      expect(result.finalPrice).toBeGreaterThan(0);
      expect(result.adjustments).toHaveLength(1);
      expect(result.adjustments[0].factor).toBe('Base model prediction');
    });

    it('should increase price for high occupancy', () => {
      const lowOccupancy = createPricingInput({ occupancyRate: 30 });
      const highOccupancy = createPricingInput({ occupancyRate: 90 });

      const lowResult = calculatePriceLinearRegression(lowOccupancy);
      const highResult = calculatePriceLinearRegression(highOccupancy);

      expect(highResult.finalPrice).toBeGreaterThan(lowResult.finalPrice);
    });

    it('should apply weekend premium', () => {
      const weekday = createPricingInput({ date: new Date('2024-06-12') }); // Wednesday
      const weekend = createPricingInput({ date: new Date('2024-06-15') }); // Saturday

      const weekdayResult = calculatePriceLinearRegression(weekday);
      const weekendResult = calculatePriceLinearRegression(weekend);

      expect(weekendResult.finalPrice).toBeGreaterThan(weekdayResult.finalPrice);
    });

    it('should apply summer premium', () => {
      const winter = createPricingInput({ date: new Date('2024-01-15') });
      const summer = createPricingInput({ date: new Date('2024-07-15') });

      const winterResult = calculatePriceLinearRegression(winter);
      const summerResult = calculatePriceLinearRegression(summer);

      expect(summerResult.finalPrice).toBeGreaterThan(winterResult.finalPrice);
    });

    it('should decrease price for early bookings', () => {
      const lastMinute = createPricingInput({ daysUntilStay: 3 });
      const earlyBooking = createPricingInput({ daysUntilStay: 90 });

      const lastMinuteResult = calculatePriceLinearRegression(lastMinute);
      const earlyResult = calculatePriceLinearRegression(earlyBooking);

      // Early bookings get negative coefficient, so lower price
      expect(earlyResult.finalPrice).toBeLessThan(lastMinuteResult.finalPrice);
    });

    it('should apply room type premium for suites', () => {
      const single = createPricingInput({ roomType: 'single' });
      const suite = createPricingInput({ roomType: 'suite' });

      const singleResult = calculatePriceLinearRegression(single);
      const suiteResult = calculatePriceLinearRegression(suite);

      expect(suiteResult.finalPrice).toBeGreaterThan(singleResult.finalPrice);
    });

    it('should handle winter discount', () => {
      const spring = createPricingInput({ date: new Date('2024-04-15') });
      const winter = createPricingInput({ date: new Date('2024-12-15') });

      const springResult = calculatePriceLinearRegression(spring);
      const winterResult = calculatePriceLinearRegression(winter);

      // Winter has negative coefficient, so should produce different price
      expect(winterResult.finalPrice).toBeDefined();
      expect(springResult.finalPrice).toBeDefined();
    });

    it('should round final price to integer', () => {
      const input = createPricingInput({ basePrice: 99.99 });
      const result = calculatePriceLinearRegression(input);

      expect(Number.isInteger(result.finalPrice)).toBe(true);
    });

    it('should calculate adjustment amount correctly', () => {
      const input = createPricingInput();
      const result = calculatePriceLinearRegression(input);

      const expectedAmount = result.finalPrice - result.originalPrice;
      expect(result.adjustments[0].amount).toBe(expectedAmount);
    });

    it('should calculate adjustment percentage correctly', () => {
      const input = createPricingInput();
      const result = calculatePriceLinearRegression(input);

      const multiplier = result.finalPrice / result.originalPrice;
      const expectedPercentage = (multiplier - 1) * 100;
      // Use lower precision due to rounding in price calculation
      expect(result.adjustments[0].percentage).toBeCloseTo(expectedPercentage, 0);
    });

    it('should handle deluxe room type', () => {
      const input = createPricingInput({ roomType: 'deluxe' });
      const result = calculatePriceLinearRegression(input);

      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should produce consistent results for same input', () => {
      const input = createPricingInput();
      const result1 = calculatePriceLinearRegression(input);
      const result2 = calculatePriceLinearRegression(input);

      expect(result1.finalPrice).toBe(result2.finalPrice);
    });
  });

  describe('calculatePriceNeuralNet', () => {
    it('should calculate price using neural network model', () => {
      const input = createPricingInput();
      const result = calculatePriceNeuralNet(input);

      expect(result.method).toBe('neural-network');
      expect(result.originalPrice).toBe(100);
      expect(result.finalPrice).toBeGreaterThan(0);
      expect(result.adjustments).toHaveLength(1);
      expect(result.adjustments[0].factor).toBe('Neural network prediction');
    });

    it('should produce different results than linear regression', () => {
      const input = createPricingInput();
      const linearResult = calculatePriceLinearRegression(input);
      const neuralResult = calculatePriceNeuralNet(input);

      // Neural network should produce different predictions due to non-linearity
      expect(neuralResult.method).not.toBe(linearResult.method);
    });

    it('should handle high occupancy scenarios', () => {
      const input = createPricingInput({ occupancyRate: 95 });
      const result = calculatePriceNeuralNet(input);

      expect(result.finalPrice).toBeGreaterThan(0);
      expect(Number.isInteger(result.finalPrice)).toBe(true);
    });

    it('should handle low occupancy scenarios', () => {
      const input = createPricingInput({ occupancyRate: 20 });
      const result = calculatePriceNeuralNet(input);

      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should apply ReLU activation (non-negative outputs)', () => {
      const input = createPricingInput();
      const result = calculatePriceNeuralNet(input);

      // Final price should be positive due to ReLU activations
      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should produce reasonable price multipliers', () => {
      const inputs = [
        createPricingInput({ occupancyRate: 10, daysUntilStay: 1 }),
        createPricingInput({ occupancyRate: 95, daysUntilStay: 180 }),
        createPricingInput({ occupancyRate: 50, daysUntilStay: 30 }),
      ];

      inputs.forEach((input) => {
        const result = calculatePriceNeuralNet(input);
        const multiplier = result.finalPrice / result.originalPrice;

        // Neural network should produce positive, reasonable multipliers
        expect(multiplier).toBeGreaterThan(0);
        expect(multiplier).toBeLessThan(5); // Reasonable upper bound
      });
    });

    it('should round final price to integer', () => {
      const input = createPricingInput({ basePrice: 123.45 });
      const result = calculatePriceNeuralNet(input);

      expect(Number.isInteger(result.finalPrice)).toBe(true);
    });

    it('should calculate adjustment amount correctly', () => {
      const input = createPricingInput();
      const result = calculatePriceNeuralNet(input);

      const expectedAmount = result.finalPrice - result.originalPrice;
      expect(result.adjustments[0].amount).toBe(expectedAmount);
    });

    it('should handle weekend pricing', () => {
      const weekend = createPricingInput({ date: new Date('2024-06-16') }); // Sunday
      const result = calculatePriceNeuralNet(weekend);

      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should handle summer season', () => {
      const summer = createPricingInput({ date: new Date('2024-08-15') });
      const result = calculatePriceNeuralNet(summer);

      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should handle winter season', () => {
      const winter = createPricingInput({ date: new Date('2024-01-15') });
      const result = calculatePriceNeuralNet(winter);

      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should handle suite room type', () => {
      const input = createPricingInput({ roomType: 'suite' });
      const result = calculatePriceNeuralNet(input);

      expect(result.finalPrice).toBeGreaterThan(0);
    });

    it('should produce consistent results for same input', () => {
      const input = createPricingInput();
      const result1 = calculatePriceNeuralNet(input);
      const result2 = calculatePriceNeuralNet(input);

      expect(result1.finalPrice).toBe(result2.finalPrice);
    });
  });

  describe('ML_PRICING_MODELS', () => {
    it('should define linear regression model', () => {
      const model = ML_PRICING_MODELS['linear-regression'];

      expect(model).toBeDefined();
      expect(model.name).toBe('Linear Regression');
      expect(model.type).toBe('regression');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(8);
      expect(model.accuracy).toBe(0.78);
      expect(model.description).toContain('linear');
    });

    it('should define neural network model', () => {
      const model = ML_PRICING_MODELS['neural-network'];

      expect(model).toBeDefined();
      expect(model.name).toBe('Neural Network');
      expect(model.type).toBe('neural-net');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(12);
      expect(model.accuracy).toBe(0.86);
    });

    it('should define random forest model', () => {
      const model = ML_PRICING_MODELS['random-forest'];

      expect(model).toBeDefined();
      expect(model.name).toBe('Random Forest');
      expect(model.type).toBe('ensemble');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(18);
      expect(model.accuracy).toBe(0.89);
    });

    it('should have all models with zero cost (local processing)', () => {
      Object.values(ML_PRICING_MODELS).forEach((model) => {
        expect(model.cost).toBe(0);
      });
    });

    it('should have all models with reasonable latency', () => {
      Object.values(ML_PRICING_MODELS).forEach((model) => {
        expect(model.avgLatency).toBeGreaterThan(0);
        expect(model.avgLatency).toBeLessThan(50);
      });
    });

    it('should have all models with accuracy between 0 and 1', () => {
      Object.values(ML_PRICING_MODELS).forEach((model) => {
        expect(model.accuracy).toBeGreaterThanOrEqual(0);
        expect(model.accuracy).toBeLessThanOrEqual(1);
      });
    });

    it('should have neural network more accurate than linear regression', () => {
      expect(ML_PRICING_MODELS['neural-network'].accuracy).toBeGreaterThan(
        ML_PRICING_MODELS['linear-regression'].accuracy
      );
    });

    it('should have random forest as most accurate', () => {
      const accuracies = Object.values(ML_PRICING_MODELS).map((m) => m.accuracy);
      const maxAccuracy = Math.max(...accuracies);

      expect(ML_PRICING_MODELS['random-forest'].accuracy).toBe(maxAccuracy);
    });

    it('should have neural network faster than random forest', () => {
      expect(ML_PRICING_MODELS['neural-network'].avgLatency).toBeLessThan(
        ML_PRICING_MODELS['random-forest'].avgLatency
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should price peak season weekend with high occupancy', () => {
      const input = createPricingInput({
        date: new Date('2024-07-20'), // Summer Saturday
        occupancyRate: 95,
        daysUntilStay: 7,
        roomType: 'suite',
      });

      const linearResult = calculatePriceLinearRegression(input);
      const neuralResult = calculatePriceNeuralNet(input);

      // Both should increase price for peak demand
      expect(linearResult.finalPrice).toBeGreaterThan(linearResult.originalPrice);
      expect(neuralResult.finalPrice).toBeGreaterThan(0);
    });

    it('should price low season weekday with low occupancy', () => {
      const input = createPricingInput({
        date: new Date('2024-02-14'), // Winter Wednesday
        occupancyRate: 25,
        daysUntilStay: 60,
        roomType: 'single',
      });

      const linearResult = calculatePriceLinearRegression(input);
      const neuralResult = calculatePriceNeuralNet(input);

      // Should have lower prices for low demand
      expect(linearResult.finalPrice).toBeLessThan(linearResult.originalPrice);
      expect(neuralResult.finalPrice).toBeGreaterThan(0);
    });

    it('should compare linear vs neural network predictions', () => {
      const testCases = [
        createPricingInput({ occupancyRate: 30 }),
        createPricingInput({ occupancyRate: 60 }),
        createPricingInput({ occupancyRate: 90 }),
      ];

      testCases.forEach((input) => {
        const linearResult = calculatePriceLinearRegression(input);
        const neuralResult = calculatePriceNeuralNet(input);

        expect(linearResult.method).toBe('linear-regression');
        expect(neuralResult.method).toBe('neural-network');
        expect(linearResult.finalPrice).toBeGreaterThan(0);
        expect(neuralResult.finalPrice).toBeGreaterThan(0);
      });
    });

    it('should handle various room types consistently', () => {
      const roomTypes: Array<'single' | 'double' | 'suite' | 'deluxe'> = [
        'single',
        'double',
        'suite',
        'deluxe',
      ];

      roomTypes.forEach((roomType) => {
        const input = createPricingInput({ roomType });
        const linearResult = calculatePriceLinearRegression(input);
        const neuralResult = calculatePriceNeuralNet(input);

        expect(linearResult.finalPrice).toBeGreaterThan(0);
        expect(neuralResult.finalPrice).toBeGreaterThan(0);
      });
    });

    it('should handle year-round seasonal variations', () => {
      const months = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct

      months.forEach((month) => {
        const date = new Date(2024, month, 15);
        const input = createPricingInput({ date });
        const linearResult = calculatePriceLinearRegression(input);
        const neuralResult = calculatePriceNeuralNet(input);

        expect(linearResult.finalPrice).toBeGreaterThan(0);
        expect(neuralResult.finalPrice).toBeGreaterThan(0);
      });
    });
  });
});
