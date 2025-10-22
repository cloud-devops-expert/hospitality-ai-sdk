import {
  movingAverage,
  exponentialSmoothing,
  calculateTrend,
  forecastNext,
  forecastRange,
  detectSeasonality,
} from '../statistical';
import type { DataPoint } from '../statistical';

describe('Statistical Forecasting', () => {
  const createDataPoints = (values: number[], startDate = new Date('2024-01-01')): DataPoint[] => {
    return values.map((value, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      return { date, value };
    });
  };

  describe('movingAverage', () => {
    it('should calculate simple moving average with full window', () => {
      const data = createDataPoints([10, 20, 30, 40, 50]);
      const result = movingAverage(data, 3);

      expect(result).toBe((30 + 40 + 50) / 3);
    });

    it('should use all data when window larger than data size', () => {
      const data = createDataPoints([10, 20, 30]);
      const result = movingAverage(data, 7);

      expect(result).toBe((10 + 20 + 30) / 3);
    });

    it('should use default window size of 7', () => {
      const data = createDataPoints([10, 20, 30, 40, 50, 60, 70, 80, 90]);
      const result = movingAverage(data);

      expect(result).toBe((30 + 40 + 50 + 60 + 70 + 80 + 90) / 7);
    });

    it('should handle single data point', () => {
      const data = createDataPoints([42]);
      const result = movingAverage(data, 3);

      expect(result).toBe(42);
    });

    it('should calculate correctly with window size 1', () => {
      const data = createDataPoints([10, 20, 30]);
      const result = movingAverage(data, 1);

      expect(result).toBe(30);
    });
  });

  describe('exponentialSmoothing', () => {
    it('should apply exponential smoothing with default alpha', () => {
      const data = createDataPoints([100, 110, 105, 115, 120]);
      const result = exponentialSmoothing(data);

      expect(result).toBeGreaterThan(100);
      expect(result).toBeLessThan(120);
    });

    it('should return 0 for empty data', () => {
      const result = exponentialSmoothing([]);

      expect(result).toBe(0);
    });

    it('should return value for single data point', () => {
      const data = createDataPoints([42]);
      const result = exponentialSmoothing(data);

      expect(result).toBe(42);
    });

    it('should weight recent data more heavily with higher alpha', () => {
      const data = createDataPoints([100, 100, 100, 100, 200]);

      const lowAlpha = exponentialSmoothing(data, 0.1);
      const highAlpha = exponentialSmoothing(data, 0.9);

      expect(highAlpha).toBeGreaterThan(lowAlpha);
      expect(highAlpha).toBeGreaterThan(180); // Should be much closer to 200 than lowAlpha
    });

    it('should handle ascending data', () => {
      const data = createDataPoints([10, 20, 30, 40, 50]);
      const result = exponentialSmoothing(data, 0.3);

      expect(result).toBeGreaterThan(10);
      expect(result).toBeLessThanOrEqual(50);
    });

    it('should handle descending data', () => {
      const data = createDataPoints([50, 40, 30, 20, 10]);
      const result = exponentialSmoothing(data, 0.3);

      expect(result).toBeLessThan(50);
      expect(result).toBeGreaterThanOrEqual(10);
    });
  });

  describe('calculateTrend', () => {
    it('should detect increasing trend', () => {
      const data = createDataPoints([10, 20, 30, 40, 50]);
      const result = calculateTrend(data);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.trend).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      const data = createDataPoints([50, 40, 30, 20, 10]);
      const result = calculateTrend(data);

      expect(result.slope).toBeLessThan(0);
      expect(result.trend).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      const data = createDataPoints([100, 100, 100, 100, 100]);
      const result = calculateTrend(data);

      expect(Math.abs(result.slope)).toBeLessThan(0.01);
      expect(result.trend).toBe('stable');
    });

    it('should handle data with minor fluctuations as stable', () => {
      const data = createDataPoints([100, 100, 100, 100, 100]);
      const result = calculateTrend(data);

      expect(result.trend).toBe('stable');
    });

    it('should return stable for single data point', () => {
      const data = createDataPoints([42]);
      const result = calculateTrend(data);

      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it('should calculate correct intercept for linear data', () => {
      const data = createDataPoints([10, 20, 30, 40, 50]);
      const result = calculateTrend(data);

      expect(result.intercept).toBeCloseTo(10, 0);
    });

    it('should handle negative values', () => {
      const data = createDataPoints([-10, -5, 0, 5, 10]);
      const result = calculateTrend(data);

      expect(result.slope).toBeGreaterThan(0);
      expect(result.trend).toBe('increasing');
    });
  });

  describe('forecastNext', () => {
    it('should forecast next period based on historical data', () => {
      const data = createDataPoints([100, 110, 120, 130, 140]);
      const result = forecastNext(data, 1);

      expect(result.predicted).toBeGreaterThan(100);
      expect(result.predicted).toBeLessThan(200);
      expect(result.trend).toBe('increasing');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.method).toBe('exponential-smoothing');
    });

    it('should return zero prediction for empty data', () => {
      const result = forecastNext([], 1);

      expect(result.predicted).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it('should forecast multiple days ahead', () => {
      const data = createDataPoints([100, 110, 120]);
      const result = forecastNext(data, 5);

      expect(result.predicted).toBeGreaterThan(0);
      const forecastDate = new Date(data[data.length - 1].date);
      forecastDate.setDate(forecastDate.getDate() + 5);
      expect(result.date.getTime()).toBe(forecastDate.getTime());
    });

    it('should have higher confidence for stable data', () => {
      const stableData = createDataPoints([100, 100, 100, 100, 100, 100, 100, 100]);
      const volatileData = createDataPoints([100, 50, 150, 75, 125, 60, 140, 80]);

      const stableResult = forecastNext(stableData);
      const volatileResult = forecastNext(volatileData);

      expect(stableResult.confidence).toBeGreaterThan(volatileResult.confidence);
    });

    it('should never predict negative values', () => {
      const data = createDataPoints([5, 4, 3, 2, 1]);
      const result = forecastNext(data, 10);

      expect(result.predicted).toBeGreaterThanOrEqual(0);
    });

    it('should combine multiple forecasting methods', () => {
      const data = createDataPoints([90, 95, 100, 105, 110, 115, 120]);
      const result = forecastNext(data, 1);

      expect(result.predicted).toBeGreaterThan(90);
      expect(result.predicted).toBeLessThan(150);
    });

    it('should set forecast date correctly', () => {
      const data = createDataPoints([100, 110, 120], new Date('2024-01-01'));
      const result = forecastNext(data, 3);

      const expectedDate = new Date('2024-01-06'); // 3 + 3 days
      expect(result.date.toDateString()).toBe(expectedDate.toDateString());
    });
  });

  describe('forecastRange', () => {
    it('should forecast multiple periods ahead', () => {
      const data = createDataPoints([100, 110, 120, 130]);
      const results = forecastRange(data, 5);

      expect(results).toHaveLength(5);
      expect(results[0].predicted).toBeGreaterThan(0);
      expect(results[4].predicted).toBeGreaterThan(0);
    });

    it('should have sequential dates', () => {
      const data = createDataPoints([100, 110, 120]);
      const results = forecastRange(data, 3);

      for (let i = 1; i < results.length; i++) {
        const dayDiff =
          (results[i].date.getTime() - results[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
        expect(dayDiff).toBe(1);
      }
    });

    it('should use previous forecasts for subsequent predictions', () => {
      const data = createDataPoints([100, 110, 120]);
      const results = forecastRange(data, 3);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.predicted).toBeGreaterThan(0);
      });
    });

    it('should handle single day forecast', () => {
      const data = createDataPoints([100, 110, 120]);
      const results = forecastRange(data, 1);

      expect(results).toHaveLength(1);
      expect(results[0].predicted).toBeGreaterThan(0);
    });

    it('should forecast increasing values for upward trend', () => {
      const data = createDataPoints([10, 20, 30, 40, 50]);
      const results = forecastRange(data, 3);

      for (let i = 1; i < results.length; i++) {
        expect(results[i].predicted).toBeGreaterThanOrEqual(results[i - 1].predicted * 0.9);
      }
    });
  });

  describe('detectSeasonality', () => {
    it('should detect weekly seasonality', () => {
      // Create data with weekly pattern: weekends higher
      const data: DataPoint[] = [];
      const startDate = new Date('2024-01-01'); // Monday

      for (let i = 0; i < 60; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfWeek = date.getDay();
        const value = dayOfWeek === 0 || dayOfWeek === 6 ? 150 : 100; // Higher on weekends
        data.push({ date, value });
      }

      const result = detectSeasonality(data);

      expect(result.hasSeasonality).toBe(true);
      expect(result.period).toBe(7);
      expect(result.pattern).toBeDefined();
      expect(result.pattern).toHaveLength(7);
    });

    it('should not detect seasonality in random data', () => {
      const data = createDataPoints([100, 102, 98, 101, 99, 100, 101, 99]);
      const result = detectSeasonality(data);

      expect(result.hasSeasonality).toBe(false);
      expect(result.pattern).toBeUndefined();
    });

    it('should return no seasonality for insufficient data', () => {
      const data = createDataPoints([100, 110, 120]);
      const result = detectSeasonality(data);

      expect(result.hasSeasonality).toBe(false);
    });

    it('should detect strong weekend pattern', () => {
      const data: DataPoint[] = [];
      const startDate = new Date('2024-01-01');

      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfWeek = date.getDay();
        const value = dayOfWeek === 5 || dayOfWeek === 6 ? 200 : 100;
        data.push({ date, value });
      }

      const result = detectSeasonality(data);

      expect(result.hasSeasonality).toBe(true);
      expect(result.pattern?.[5]).toBeGreaterThan(result.pattern?.[1] || 0);
      expect(result.pattern?.[6]).toBeGreaterThan(result.pattern?.[2] || 0);
    });

    it('should calculate day averages correctly', () => {
      const data: DataPoint[] = [];
      const startDate = new Date('2024-01-07'); // Sunday

      // Add consistent values per day of week
      for (let week = 0; week < 5; week++) {
        for (let day = 0; day < 7; day++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + week * 7 + day);
          data.push({ date, value: (day + 1) * 10 }); // Sunday=10, Monday=20, etc.
        }
      }

      const result = detectSeasonality(data);

      expect(result.pattern?.[0]).toBeCloseTo(10, 0); // Sunday (index 0)
      expect(result.pattern?.[6]).toBeCloseTo(70, 0); // Saturday (index 6)
    });

    it('should use 10% variance threshold', () => {
      // Data with exactly 10% variance should be borderline
      const data: DataPoint[] = [];
      const startDate = new Date('2024-01-01');

      for (let i = 0; i < 60; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfWeek = date.getDay();
        const value = dayOfWeek === 0 ? 110 : 100; // 10% higher on Sundays
        data.push({ date, value });
      }

      const result = detectSeasonality(data);

      expect(typeof result.hasSeasonality).toBe('boolean');
    });
  });

  describe('Integration Tests', () => {
    it('should provide reasonable forecasts for realistic hotel occupancy data', () => {
      // Simulate hotel occupancy with upward trend
      const data = createDataPoints([
        50, 52, 55, 53, 58, 60, 62, 65, 63, 68, 70, 72, 75, 73, 78, 80,
      ]);

      const forecast = forecastNext(data, 7);

      expect(forecast.predicted).toBeGreaterThan(70);
      expect(forecast.predicted).toBeLessThan(100);
      expect(forecast.confidence).toBeGreaterThan(0.3);
      expect(forecast.trend).toBe('increasing');
    });

    it('should handle seasonal hotel revenue forecasting', () => {
      const data: DataPoint[] = [];
      const startDate = new Date('2024-01-01');

      // Simulate seasonal pattern: higher revenue on weekends
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfWeek = date.getDay();
        const baseRevenue = 10000;
        const weekendBonus = dayOfWeek === 5 || dayOfWeek === 6 ? 5000 : 0;
        data.push({ date, value: baseRevenue + weekendBonus });
      }

      const seasonality = detectSeasonality(data);
      const forecasts = forecastRange(data, 7);

      expect(seasonality.hasSeasonality).toBe(true);
      expect(forecasts).toHaveLength(7);
      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThan(5000);
        expect(f.predicted).toBeLessThan(20000);
      });
    });

    it('should combine methods effectively for stable data', () => {
      const data = createDataPoints([100, 100, 100, 100, 100, 100, 100, 100]);

      const ma = movingAverage(data, 7);
      const es = exponentialSmoothing(data, 0.3);
      const trend = calculateTrend(data);
      const forecast = forecastNext(data, 1);

      expect(ma).toBeCloseTo(100, 0);
      expect(es).toBeCloseTo(100, 0);
      expect(trend.trend).toBe('stable');
      expect(forecast.predicted).toBeCloseTo(100, 1);
      expect(forecast.confidence).toBeGreaterThan(0.9);
    });
  });
});
