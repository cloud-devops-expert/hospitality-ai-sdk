import { forecastInventoryMovingAverage } from '../forecaster';
import type { InventoryItem } from '../forecaster';

describe('Inventory Forecasting', () => {
  const sampleItems: InventoryItem[] = [
    { id: '1', name: 'Eggs (dozen)', currentStock: 50, avgDailyConsumption: 15, perishable: true },
    { id: '2', name: 'Milk (liters)', currentStock: 30, avgDailyConsumption: 12, perishable: true },
    { id: '3', name: 'Coffee (kg)', currentStock: 10, avgDailyConsumption: 2, perishable: false },
    { id: '4', name: 'Bread (loaves)', currentStock: 40, avgDailyConsumption: 18, perishable: true },
  ];

  describe('Moving Average Forecasting', () => {
    it('should forecast for each item', () => {
      const forecasts = sampleItems.map(item => forecastInventoryMovingAverage(item));

      expect(forecasts).toHaveLength(sampleItems.length);
      forecasts.forEach(forecast => {
        expect(forecast.daysUntilStockout).toBeGreaterThan(0);
        expect(forecast.recommendedOrder).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate days until stockout correctly', () => {
      const item: InventoryItem = {
        id: 'test',
        name: 'Test Item',
        currentStock: 100,
        avgDailyConsumption: 10,
        perishable: false,
      };

      const forecast = forecastInventoryMovingAverage(item);

      expect(forecast.daysUntilStockout).toBe(10); // 100 / 10 = 10 days
    });

    it('should recommend reorder for low stock items', () => {
      const lowStock: InventoryItem = {
        id: 'test',
        name: 'Low Stock',
        currentStock: 5,
        avgDailyConsumption: 10,
        perishable: true,
      };

      const forecast = forecastInventoryMovingAverage(lowStock);

      expect(forecast.daysUntilStockout).toBeLessThan(7);
      expect(forecast.recommendedOrder).toBeGreaterThan(0);
    });

    it('should not recommend order for high stock', () => {
      const highStock: InventoryItem = {
        id: 'test',
        name: 'High Stock',
        currentStock: 1000,
        avgDailyConsumption: 10,
        perishable: false,
      };

      const forecast = forecastInventoryMovingAverage(highStock);

      expect(forecast.daysUntilStockout).toBeGreaterThan(7);
      expect(forecast.recommendedOrder).toBe(0);
    });
  });

  describe('Perishable Items', () => {
    it('should handle perishable items conservatively', () => {
      const perishable: InventoryItem = {
        id: 'test',
        name: 'Perishable',
        currentStock: 50,
        avgDailyConsumption: 10,
        perishable: true,
      };

      const nonPerishable: InventoryItem = {
        ...perishable,
        perishable: false,
      };

      const perishableForecast = forecastInventoryMovingAverage(perishable);
      const nonPerishableForecast = forecastInventoryMovingAverage(nonPerishable);

      expect(perishableForecast).toBeDefined();
      expect(nonPerishableForecast).toBeDefined();
    });
  });

  describe('Recommended Orders', () => {
    it('should calculate order quantity based on lead time', () => {
      const item: InventoryItem = {
        id: 'test',
        name: 'Test',
        currentStock: 10,
        avgDailyConsumption: 15,
        perishable: false,
      };

      const forecast = forecastInventoryMovingAverage(item);

      expect(forecast.recommendedOrder).toBeGreaterThan(0);
      // Should order enough for safety stock
      expect(forecast.recommendedOrder).toBeGreaterThanOrEqual(forecast.item.avgDailyConsumption);
    });

    it('should not order if stock is sufficient', () => {
      const item: InventoryItem = {
        id: 'test',
        name: 'Test',
        currentStock: 200,
        avgDailyConsumption: 10,
        perishable: false,
      };

      const forecast = forecastInventoryMovingAverage(item);

      expect(forecast.recommendedOrder).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero consumption', () => {
      const item: InventoryItem = {
        id: 'test',
        name: 'No Consumption',
        currentStock: 100,
        avgDailyConsumption: 0,
        perishable: false,
      };

      const forecast = forecastInventoryMovingAverage(item);

      expect(forecast.daysUntilStockout).toBeGreaterThan(999); // Effectively infinite
    });

    it('should handle very low stock', () => {
      const item: InventoryItem = {
        id: 'test',
        name: 'Very Low',
        currentStock: 1,
        avgDailyConsumption: 10,
        perishable: true,
      };

      const forecast = forecastInventoryMovingAverage(item);

      expect(forecast.daysUntilStockout).toBeLessThan(1);
      expect(forecast.recommendedOrder).toBeGreaterThan(0);
    });

    it('should handle high consumption rate', () => {
      const item: InventoryItem = {
        id: 'test',
        name: 'High Demand',
        currentStock: 100,
        avgDailyConsumption: 50,
        perishable: false,
      };

      const forecast = forecastInventoryMovingAverage(item);

      expect(forecast.daysUntilStockout).toBe(2);
      expect(forecast.recommendedOrder).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should forecast eggs correctly', () => {
      const eggs = sampleItems.find(i => i.name.includes('Eggs'))!;
      const forecast = forecastInventoryMovingAverage(eggs);

      expect(forecast.daysUntilStockout).toBeCloseTo(50 / 15, 0);
      expect(forecast.item).toBe(eggs);
    });

    it('should forecast milk correctly', () => {
      const milk = sampleItems.find(i => i.name.includes('Milk'))!;
      const forecast = forecastInventoryMovingAverage(milk);

      expect(forecast.daysUntilStockout).toBeCloseTo(30 / 12, 0);
    });

    it('should forecast coffee correctly', () => {
      const coffee = sampleItems.find(i => i.name.includes('Coffee'))!;
      const forecast = forecastInventoryMovingAverage(coffee);

      expect(forecast.daysUntilStockout).toBe(5); // 10 / 2 = 5
    });
  });
});
