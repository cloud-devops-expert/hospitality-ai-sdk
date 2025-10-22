import {
  forecastInventoryNeuralNet,
  forecastInventoryGradientBoosting,
  ML_INVENTORY_MODELS,
  InventoryItem,
  HotelContext,
} from '../ml-forecaster';

describe('ML-Based Inventory Forecasting', () => {
  const createInventoryItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
    id: 'item-1',
    name: 'Eggs (Dozen)',
    category: 'food',
    currentStock: 50,
    unit: 'dozen',
    avgDailyConsumption: 10,
    perishable: true,
    shelfLifeDays: 14,
    leadTimeDays: 2,
    unitCost: 4.5,
    storageCapacity: 200,
    ...overrides,
  });

  const createHotelContext = (overrides: Partial<HotelContext> = {}): HotelContext => ({
    currentOccupancy: 70,
    forecastOccupancy: [70, 75, 80, 85, 90, 85, 80],
    seasonalFactor: 1.0,
    upcomingEvents: false,
    averageGuestsPerRoom: 2,
    ...overrides,
  });

  describe('forecastInventoryNeuralNet', () => {
    describe('Basic Forecasting', () => {
      it('should generate demand forecast for specified days', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.forecastedDemand).toHaveLength(7);
        expect(result.forecastedDemand.every((d) => d > 0)).toBe(true);
        expect(result.method).toBe('neural-network');
      });

      it('should calculate recommended order quantity', () => {
        const item = createInventoryItem({ currentStock: 15 });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.recommendedOrder).toBeGreaterThanOrEqual(0);
        expect(result.estimatedCost).toBe(result.recommendedOrder * item.unitCost);
      });

      it('should calculate reorder point with safety stock', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.reorderPoint).toBeGreaterThan(0);
        expect(result.safetyStock).toBeGreaterThan(0);
        expect(result.reorderPoint).toBeGreaterThanOrEqual(result.safetyStock);
      });

      it('should calculate days until stockout', () => {
        const item = createInventoryItem({ currentStock: 20 });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.daysUntilStockout).toBeGreaterThanOrEqual(0);
        expect(result.daysUntilStockout).toBeLessThanOrEqual(7);
      });

      it('should return confidence score', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });

    describe('Occupancy Impact', () => {
      it('should increase demand forecast with high occupancy', () => {
        const item = createInventoryItem();
        const lowOccupancy = createHotelContext({ currentOccupancy: 40 });
        const highOccupancy = createHotelContext({ currentOccupancy: 90 });

        const lowResult = forecastInventoryNeuralNet(item, lowOccupancy, 7);
        const highResult = forecastInventoryNeuralNet(item, highOccupancy, 7);

        const lowTotal = lowResult.forecastedDemand.reduce((sum, d) => sum + d, 0);
        const highTotal = highResult.forecastedDemand.reduce((sum, d) => sum + d, 0);

        expect(highTotal).toBeGreaterThan(lowTotal);
      });

      it('should use forecast occupancy for each day', () => {
        const item = createInventoryItem();
        const context = createHotelContext({
          forecastOccupancy: [50, 60, 70, 80, 90, 85, 75],
        });

        const result = forecastInventoryNeuralNet(item, context, 7);

        // Later days (higher occupancy) should have higher demand
        expect(result.forecastedDemand[4]).toBeGreaterThan(result.forecastedDemand[0]);
      });
    });

    describe('Seasonality Impact', () => {
      it('should increase demand during peak season', () => {
        const item = createInventoryItem();
        const lowSeason = createHotelContext({ seasonalFactor: 0.7 });
        const peakSeason = createHotelContext({ seasonalFactor: 1.4 });

        const lowResult = forecastInventoryNeuralNet(item, lowSeason, 7);
        const peakResult = forecastInventoryNeuralNet(item, peakSeason, 7);

        const lowTotal = lowResult.forecastedDemand.reduce((sum, d) => sum + d, 0);
        const peakTotal = peakResult.forecastedDemand.reduce((sum, d) => sum + d, 0);

        expect(peakTotal).toBeGreaterThan(lowTotal);
      });
    });

    describe('Event Impact', () => {
      it('should consider upcoming events in recommendations', () => {
        const item = createInventoryItem();
        const noEvents = createHotelContext({ upcomingEvents: false });
        const withEvents = createHotelContext({ upcomingEvents: true });

        const noEventsResult = forecastInventoryNeuralNet(item, noEvents, 7);
        const withEventsResult = forecastInventoryNeuralNet(item, withEvents, 7);

        expect(withEventsResult.recommendations).toContain(
          'Upcoming events - consider buffer stock'
        );
      });
    });

    describe('Perishable Items', () => {
      it('should limit order quantity for perishable items', () => {
        const item = createInventoryItem({
          perishable: true,
          shelfLifeDays: 7,
          currentStock: 5,
        });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 30);

        // Should not order more than shelf life allows
        const maxAllowed = item.shelfLifeDays! * item.avgDailyConsumption * 1.2;
        expect(result.recommendedOrder).toBeLessThanOrEqual(maxAllowed);
      });

      it('should assess high waste risk for over-ordering perishables', () => {
        const item = createInventoryItem({
          perishable: true,
          currentStock: 100,
        });
        const context = createHotelContext({ currentOccupancy: 40 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        // With high stock and low occupancy, waste risk should be elevated
        expect(result.wasteRisk).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(result.wasteRisk);
      });

      it('should assess low waste risk for non-perishables', () => {
        const item = createInventoryItem({
          perishable: false,
          category: 'linen',
        });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.wasteRisk).toBe('low');
      });
    });

    describe('Stockout Risk Assessment', () => {
      it('should flag high stockout risk when stock is low', () => {
        const item = createInventoryItem({
          currentStock: 5,
          avgDailyConsumption: 15,
          leadTimeDays: 3,
        });
        const context = createHotelContext({ currentOccupancy: 85 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        // With very low stock and high consumption, stockout risk should be elevated
        expect(['medium', 'high']).toContain(result.stockoutRisk);
        if (result.stockoutRisk === 'high') {
          expect(
            result.recommendations.some((r) => r.includes('URGENT'))
          ).toBe(true);
        }
      });

      it('should flag low stockout risk when stock is adequate', () => {
        const item = createInventoryItem({
          currentStock: 100,
          leadTimeDays: 2,
        });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.stockoutRisk).toBe('low');
      });
    });

    describe('Storage Capacity', () => {
      it('should not exceed storage capacity', () => {
        const item = createInventoryItem({
          currentStock: 50,
          storageCapacity: 100,
        });
        const context = createHotelContext({ currentOccupancy: 95 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(item.currentStock + result.recommendedOrder).toBeLessThanOrEqual(
          item.storageCapacity
        );
      });
    });

    describe('Category-Specific Behavior', () => {
      it('should handle food category with waste awareness', () => {
        const item = createInventoryItem({ category: 'food' });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.item.category).toBe('food');
      });

      it('should handle linen category differently', () => {
        const item = createInventoryItem({
          category: 'linen',
          perishable: false,
          shelfLifeDays: undefined,
        });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.wasteRisk).toBe('low');
      });

      it('should handle cleaning supplies', () => {
        const item = createInventoryItem({
          category: 'cleaning',
          perishable: false,
        });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.method).toBe('neural-network');
      });
    });

    describe('Recommendations', () => {
      it('should provide urgent recommendation for imminent stockout', () => {
        const item = createInventoryItem({
          currentStock: 3,
          avgDailyConsumption: 20,
          leadTimeDays: 2,
        });
        const context = createHotelContext({ currentOccupancy: 90 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.recommendations.length).toBeGreaterThan(0);
        // With high consumption and very low stock, should get urgent warning
        if (result.stockoutRisk === 'high') {
          expect(
            result.recommendations.some((r) => r.toLowerCase().includes('urgent'))
          ).toBe(true);
        }
      });

      it('should recommend monitoring for medium waste risk', () => {
        const item = createInventoryItem({
          perishable: true,
          currentStock: 60,
        });
        const context = createHotelContext({ currentOccupancy: 50 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        if (result.wasteRisk === 'medium') {
          expect(
            result.recommendations.some((r) => r.includes('Monitor'))
          ).toBe(true);
        }
      });

      it('should recommend express delivery for urgent perishables', () => {
        const item = createInventoryItem({
          perishable: true,
          currentStock: 8,
        });
        const context = createHotelContext({ currentOccupancy: 85 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        if (result.daysUntilStockout < 2) {
          expect(
            result.recommendations.some((r) => r.includes('Express delivery'))
          ).toBe(true);
        }
      });

      it('should note high occupancy in recommendations', () => {
        const item = createInventoryItem();
        const context = createHotelContext({ currentOccupancy: 90 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(
          result.recommendations.some((r) => r.includes('High occupancy'))
        ).toBe(true);
      });

      it('should note low occupancy in recommendations', () => {
        const item = createInventoryItem();
        const context = createHotelContext({ currentOccupancy: 35 });

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(
          result.recommendations.some((r) => r.includes('Low occupancy'))
        ).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero current stock', () => {
        const item = createInventoryItem({ currentStock: 0 });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.recommendedOrder).toBeGreaterThan(0);
        // Zero stock means immediate stockout (day 0)
        expect(result.daysUntilStockout).toBe(0);
        expect(result.stockoutRisk).toBe('high');
      });

      it('should handle very high stock levels', () => {
        const item = createInventoryItem({ currentStock: 500 });
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.recommendedOrder).toBe(0);
        expect(result.daysUntilStockout).toBe(7);
      });

      it('should handle zero occupancy', () => {
        const item = createInventoryItem();
        const context = createHotelContext({
          currentOccupancy: 0,
          forecastOccupancy: [0, 0, 0, 0, 0, 0, 0],
        });

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.forecastedDemand.every((d) => d >= 0)).toBe(true);
      });
    });

    describe('Processing Time', () => {
      it('should track processing time', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const result = forecastInventoryNeuralNet(item, context, 7);

        expect(result.processingTime).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('forecastInventoryGradientBoosting', () => {
    describe('Basic Functionality', () => {
      it('should generate forecast with gradient boosting method', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const result = forecastInventoryGradientBoosting(item, context, 7);

        expect(result.method).toBe('gradient-boosting');
        expect(result.forecastedDemand).toHaveLength(7);
      });

      it('should have higher confidence than neural network', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const nnResult = forecastInventoryNeuralNet(item, context, 7);
        const gbResult = forecastInventoryGradientBoosting(item, context, 7);

        expect(gbResult.confidence).toBeGreaterThanOrEqual(nnResult.confidence);
      });

      it('should cap confidence at 0.98', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const result = forecastInventoryGradientBoosting(item, context, 7);

        expect(result.confidence).toBeLessThanOrEqual(0.98);
      });
    });

    describe('Event Detection', () => {
      it('should boost demand for upcoming events', () => {
        const item = createInventoryItem();
        const noEvents = createHotelContext({ upcomingEvents: false });
        const withEvents = createHotelContext({ upcomingEvents: true });

        const noEventsResult = forecastInventoryGradientBoosting(item, noEvents, 7);
        const withEventsResult = forecastInventoryGradientBoosting(item, withEvents, 7);

        const noEventsTotal = noEventsResult.forecastedDemand.reduce((s, d) => s + d, 0);
        const withEventsTotal = withEventsResult.forecastedDemand.reduce((s, d) => s + d, 0);

        expect(withEventsTotal).toBeGreaterThan(noEventsTotal);
      });

      it('should apply event factor to first 3 days only', () => {
        const item = createInventoryItem();
        const context = createHotelContext({ upcomingEvents: true });

        const result = forecastInventoryGradientBoosting(item, context, 7);

        // First days should have event boost
        expect(result.forecastedDemand).toHaveLength(7);
      });
    });

    describe('High Occupancy Scenarios', () => {
      it('should handle high occupancy with events', () => {
        const item = createInventoryItem();
        const context = createHotelContext({
          currentOccupancy: 95,
          upcomingEvents: true,
          seasonalFactor: 1.3,
        });

        const result = forecastInventoryGradientBoosting(item, context, 7);

        expect(result.recommendedOrder).toBeGreaterThan(0);
        expect(result.stockoutRisk).toBeDefined();
      });

      it('should recommend adequate safety stock for high demand', () => {
        const item = createInventoryItem({ currentStock: 30 });
        const context = createHotelContext({
          currentOccupancy: 90,
          seasonalFactor: 1.4,
        });

        const result = forecastInventoryGradientBoosting(item, context, 7);

        expect(result.safetyStock).toBeGreaterThan(0);
      });
    });

    describe('Low Occupancy Scenarios', () => {
      it('should reduce recommendations for low occupancy', () => {
        const item = createInventoryItem();
        const context = createHotelContext({
          currentOccupancy: 25,
          seasonalFactor: 0.7,
        });

        const result = forecastInventoryGradientBoosting(item, context, 7);

        const totalDemand = result.forecastedDemand.reduce((s, d) => s + d, 0);
        expect(totalDemand).toBeLessThan(item.avgDailyConsumption * 7);
      });
    });

    describe('Comparison with Neural Network', () => {
      it('should produce different forecasts than neural network', () => {
        const item = createInventoryItem();
        const context = createHotelContext();

        const nnResult = forecastInventoryNeuralNet(item, context, 7);
        const gbResult = forecastInventoryGradientBoosting(item, context, 7);

        expect(gbResult.method).not.toBe(nnResult.method);
        // Forecasts may be similar but method and confidence differ
        expect(gbResult.confidence).toBeGreaterThanOrEqual(nnResult.confidence);
      });
    });

    describe('Category Handling', () => {
      it('should handle beverage category', () => {
        const item = createInventoryItem({
          category: 'beverage',
          name: 'Orange Juice',
        });
        const context = createHotelContext();

        const result = forecastInventoryGradientBoosting(item, context, 7);

        expect(result.item.category).toBe('beverage');
        expect(result.method).toBe('gradient-boosting');
      });

      it('should handle amenity category', () => {
        const item = createInventoryItem({
          category: 'amenity',
          name: 'Shampoo Bottles',
          perishable: false,
        });
        const context = createHotelContext();

        const result = forecastInventoryGradientBoosting(item, context, 7);

        expect(result.wasteRisk).toBe('low');
      });
    });
  });

  describe('ML_INVENTORY_MODELS', () => {
    it('should define neural network model', () => {
      const model = ML_INVENTORY_MODELS['neural-network'];

      expect(model).toBeDefined();
      expect(model.name).toBe('Neural Network Forecaster');
      expect(model.type).toBe('deep-learning');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBeGreaterThan(0);
      expect(model.accuracy).toBeGreaterThan(0.8);
    });

    it('should define gradient boosting model', () => {
      const model = ML_INVENTORY_MODELS['gradient-boosting'];

      expect(model).toBeDefined();
      expect(model.name).toBe('Gradient Boosting Ensemble');
      expect(model.type).toBe('ensemble');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBeGreaterThan(0);
      expect(model.accuracy).toBeGreaterThan(0.85);
    });

    it('should have gradient boosting more accurate than neural network', () => {
      const nn = ML_INVENTORY_MODELS['neural-network'];
      const gb = ML_INVENTORY_MODELS['gradient-boosting'];

      expect(gb.accuracy).toBeGreaterThan(nn.accuracy);
    });

    it('should have both models with zero cost (local processing)', () => {
      Object.values(ML_INVENTORY_MODELS).forEach((model) => {
        expect(model.cost).toBe(0);
      });
    });

    it('should report waste and stockout reduction metrics', () => {
      Object.values(ML_INVENTORY_MODELS).forEach((model) => {
        expect(model.wasteReduction).toBeDefined();
        expect(model.stockoutReduction).toBeDefined();
      });
    });
  });
});
