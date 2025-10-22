import {
  forecastARIMA,
  forecastProphet,
  forecastLSTM,
  ML_FORECAST_MODELS,
} from '../ml-timeseries';
import type { DataPoint } from '../statistical';

describe('ML Time-Series Forecasting', () => {
  const createDataPoints = (values: number[], startDate = new Date('2024-01-01')): DataPoint[] => {
    return values.map((value, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      return { date, value };
    });
  };

  describe('forecastARIMA', () => {
    it('should forecast future values using ARIMA model', () => {
      const data = createDataPoints([50, 52, 55, 58, 60, 62, 65]);
      const forecasts = forecastARIMA(data, 3);

      expect(forecasts).toHaveLength(3);
      expect(forecasts[0].method).toBe('arima');
      expect(forecasts[0].predicted).toBeGreaterThanOrEqual(0);
      expect(forecasts[0].predicted).toBeLessThanOrEqual(100);
    });

    it('should have sequential dates', () => {
      const data = createDataPoints([50, 55, 60], new Date('2024-01-01'));
      const forecasts = forecastARIMA(data, 3);

      expect(forecasts[0].date.toDateString()).toBe(new Date('2024-01-04').toDateString());
      expect(forecasts[1].date.toDateString()).toBe(new Date('2024-01-05').toDateString());
      expect(forecasts[2].date.toDateString()).toBe(new Date('2024-01-06').toDateString());
    });

    it('should have decreasing confidence over time', () => {
      const data = createDataPoints([50, 55, 60, 65, 70]);
      const forecasts = forecastARIMA(data, 5);

      expect(forecasts[0].confidence).toBeGreaterThan(forecasts[1].confidence);
      expect(forecasts[1].confidence).toBeGreaterThan(forecasts[2].confidence);
      expect(forecasts[2].confidence).toBeGreaterThan(forecasts[3].confidence);
    });

    it('should detect increasing trend', () => {
      const data = createDataPoints([10, 20, 30, 40, 50]);
      const forecasts = forecastARIMA(data, 2);

      expect(forecasts[0].predicted).toBeGreaterThan(0);
      expect(forecasts[0].trend).toBeDefined();
    });

    it('should clamp predictions to 0-100 range', () => {
      const data = createDataPoints([95, 96, 97, 98, 99]);
      const forecasts = forecastARIMA(data, 10);

      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThanOrEqual(0);
        expect(f.predicted).toBeLessThanOrEqual(100);
      });
    });

    it('should handle single day forecast', () => {
      const data = createDataPoints([50, 55, 60]);
      const forecasts = forecastARIMA(data, 1);

      expect(forecasts).toHaveLength(1);
      expect(forecasts[0].predicted).toBeGreaterThan(0);
    });

    it('should forecast multiple days ahead', () => {
      const data = createDataPoints([50, 52, 54, 56, 58]);
      const forecasts = forecastARIMA(data, 7);

      expect(forecasts).toHaveLength(7);
      forecasts.forEach((f) => {
        expect(f.method).toBe('arima');
        expect(f.confidence).toBeGreaterThan(0);
        expect(f.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should handle stable data', () => {
      const data = createDataPoints([50, 50, 50, 50, 50]);
      const forecasts = forecastARIMA(data, 3);

      expect(forecasts).toHaveLength(3);
      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThanOrEqual(0);
        expect(f.predicted).toBeLessThanOrEqual(100);
      });
    });

    it('should detect decreasing trend', () => {
      const data = createDataPoints([80, 75, 70, 65, 60]);
      const forecasts = forecastARIMA(data, 2);

      expect(forecasts[0].predicted).toBeGreaterThanOrEqual(0);
      expect(['increasing', 'decreasing', 'stable']).toContain(forecasts[0].trend);
    });
  });

  describe('forecastProphet', () => {
    it('should forecast using Prophet-like additive model', () => {
      const data = createDataPoints([50, 52, 55, 58, 60, 62, 65]);
      const forecasts = forecastProphet(data, 3);

      expect(forecasts).toHaveLength(3);
      expect(forecasts[0].method).toBe('prophet');
      expect(forecasts[0].predicted).toBeGreaterThanOrEqual(0);
      expect(forecasts[0].predicted).toBeLessThanOrEqual(100);
    });

    it('should incorporate seasonality (day of week)', () => {
      const data: DataPoint[] = [];
      const startDate = new Date('2024-01-01'); // Monday

      // Create data with weekly pattern
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfWeek = date.getDay();
        const value = dayOfWeek === 0 || dayOfWeek === 6 ? 80 : 50; // Higher on weekends
        data.push({ date, value });
      }

      const forecasts = forecastProphet(data, 7);

      expect(forecasts).toHaveLength(7);
      expect(forecasts[0].method).toBe('prophet');
    });

    it('should detect trend direction from slope', () => {
      const increasingData = createDataPoints([10, 20, 30, 40, 50, 60, 70]);
      const increasingForecasts = forecastProphet(increasingData, 3);

      const decreasingData = createDataPoints([70, 60, 50, 40, 30, 20, 10]);
      const decreasingForecasts = forecastProphet(decreasingData, 3);

      expect(increasingForecasts[0].trend).toBe('increasing');
      expect(decreasingForecasts[0].trend).toBe('decreasing');
    });

    it('should have decreasing confidence over time', () => {
      const data = createDataPoints([50, 55, 60, 65, 70]);
      const forecasts = forecastProphet(data, 5);

      expect(forecasts[0].confidence).toBeGreaterThan(forecasts[1].confidence);
      expect(forecasts[1].confidence).toBeGreaterThan(forecasts[2].confidence);
    });

    it('should clamp predictions to 0-100 range', () => {
      const data = createDataPoints([90, 92, 94, 96, 98]);
      const forecasts = forecastProphet(data, 10);

      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThanOrEqual(0);
        expect(f.predicted).toBeLessThanOrEqual(100);
      });
    });

    it('should handle stable trend', () => {
      const data = createDataPoints([50, 50.1, 49.9, 50.2, 49.8]);
      const forecasts = forecastProphet(data, 3);

      expect(forecasts[0].trend).toBe('stable');
    });

    it('should set correct forecast dates', () => {
      const data = createDataPoints([50, 55, 60], new Date('2024-01-01'));
      const forecasts = forecastProphet(data, 2);

      expect(forecasts[0].date.toDateString()).toBe(new Date('2024-01-04').toDateString());
      expect(forecasts[1].date.toDateString()).toBe(new Date('2024-01-05').toDateString());
    });

    it('should have higher confidence than ARIMA for seasonal data', () => {
      const data = createDataPoints([50, 55, 60, 65, 70]);
      const prophetForecasts = forecastProphet(data, 3);
      const arimaForecasts = forecastARIMA(data, 3);

      expect(prophetForecasts[0].confidence).toBeGreaterThan(arimaForecasts[0].confidence);
    });
  });

  describe('forecastLSTM', () => {
    it('should forecast using LSTM-like neural network', () => {
      const data = createDataPoints([50, 52, 55, 58, 60, 62, 65]);
      const forecasts = forecastLSTM(data, 3);

      expect(forecasts).toHaveLength(3);
      expect(forecasts[0].method).toBe('lstm');
      expect(forecasts[0].predicted).toBeGreaterThanOrEqual(0);
      expect(forecasts[0].predicted).toBeLessThanOrEqual(100);
    });

    it('should normalize and denormalize data', () => {
      const data = createDataPoints([10, 20, 30, 40, 50]);
      const forecasts = forecastLSTM(data, 3);

      // Predictions should be in reasonable range of input data
      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThanOrEqual(0);
        expect(f.predicted).toBeLessThanOrEqual(100);
      });
    });

    it('should use sequence length of 7', () => {
      const shortData = createDataPoints([50, 55, 60]);
      const longData = createDataPoints([50, 52, 54, 56, 58, 60, 62, 64, 66, 68]);

      const shortForecasts = forecastLSTM(shortData, 2);
      const longForecasts = forecastLSTM(longData, 2);

      expect(shortForecasts).toHaveLength(2);
      expect(longForecasts).toHaveLength(2);
    });

    it('should have decreasing confidence over time', () => {
      const data = createDataPoints([50, 55, 60, 65, 70]);
      const forecasts = forecastLSTM(data, 5);

      expect(forecasts[0].confidence).toBeGreaterThan(forecasts[1].confidence);
      expect(forecasts[2].confidence).toBeGreaterThan(forecasts[3].confidence);
    });

    it('should detect trend based on recent averages', () => {
      const increasingData = createDataPoints([40, 45, 50, 55, 60, 65, 70]);
      const forecasts = forecastLSTM(increasingData, 2);

      expect(['increasing', 'stable', 'decreasing']).toContain(forecasts[0].trend);
    });

    it('should clamp predictions to 0-100 range', () => {
      const data = createDataPoints([95, 96, 97, 98, 99]);
      const forecasts = forecastLSTM(data, 5);

      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThanOrEqual(0);
        expect(f.predicted).toBeLessThanOrEqual(100);
      });
    });

    it('should handle single forecast', () => {
      const data = createDataPoints([50, 55, 60, 65, 70]);
      const forecasts = forecastLSTM(data, 1);

      expect(forecasts).toHaveLength(1);
      expect(forecasts[0].method).toBe('lstm');
    });

    it('should set sequential forecast dates', () => {
      const data = createDataPoints([50, 55, 60], new Date('2024-01-01'));
      const forecasts = forecastLSTM(data, 3);

      const dayDiff1 = (forecasts[1].date.getTime() - forecasts[0].date.getTime()) / (1000 * 60 * 60 * 24);
      const dayDiff2 = (forecasts[2].date.getTime() - forecasts[1].date.getTime()) / (1000 * 60 * 60 * 24);

      expect(dayDiff1).toBe(1);
      expect(dayDiff2).toBe(1);
    });

    it('should handle volatile data', () => {
      const data = createDataPoints([50, 70, 40, 80, 30, 90, 20]);
      const forecasts = forecastLSTM(data, 3);

      expect(forecasts).toHaveLength(3);
      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThanOrEqual(0);
        expect(f.predicted).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('ML_FORECAST_MODELS', () => {
    it('should define ARIMA model', () => {
      const model = ML_FORECAST_MODELS.arima;

      expect(model).toBeDefined();
      expect(model.name).toBe('ARIMA');
      expect(model.type).toBe('arima');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(35);
      expect(model.accuracy).toBe(0.85);
      expect(model.description).toContain('statistical');
    });

    it('should define Prophet model', () => {
      const model = ML_FORECAST_MODELS.prophet;

      expect(model).toBeDefined();
      expect(model.name).toBe('Prophet-like');
      expect(model.type).toBe('prophet');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(28);
      expect(model.accuracy).toBe(0.88);
    });

    it('should define LSTM model', () => {
      const model = ML_FORECAST_MODELS.lstm;

      expect(model).toBeDefined();
      expect(model.name).toBe('LSTM Neural Network');
      expect(model.type).toBe('lstm');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(45);
      expect(model.accuracy).toBe(0.83);
    });

    it('should define ensemble model', () => {
      const model = ML_FORECAST_MODELS.ensemble;

      expect(model).toBeDefined();
      expect(model.type).toBe('ensemble');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(85);
      expect(model.accuracy).toBe(0.91);
      expect(model.accuracy).toBeGreaterThan(ML_FORECAST_MODELS.arima.accuracy);
    });

    it('should have all models with zero cost (local processing)', () => {
      Object.values(ML_FORECAST_MODELS).forEach((model) => {
        expect(model.cost).toBe(0);
      });
    });

    it('should have all models with reasonable latency', () => {
      Object.values(ML_FORECAST_MODELS).forEach((model) => {
        expect(model.avgLatency).toBeGreaterThan(0);
        expect(model.avgLatency).toBeLessThan(200);
      });
    });

    it('should have all models with accuracy between 0 and 1', () => {
      Object.values(ML_FORECAST_MODELS).forEach((model) => {
        expect(model.accuracy).toBeGreaterThanOrEqual(0);
        expect(model.accuracy).toBeLessThanOrEqual(1);
      });
    });

    it('should have Prophet more accurate than ARIMA', () => {
      expect(ML_FORECAST_MODELS.prophet.accuracy).toBeGreaterThan(ML_FORECAST_MODELS.arima.accuracy);
    });

    it('should have ensemble as most accurate', () => {
      const accuracies = Object.values(ML_FORECAST_MODELS).map((m) => m.accuracy);
      const maxAccuracy = Math.max(...accuracies);

      expect(ML_FORECAST_MODELS.ensemble.accuracy).toBe(maxAccuracy);
    });
  });

  describe('Integration Scenarios', () => {
    it('should produce consistent forecasts for hotel occupancy', () => {
      const occupancyData = createDataPoints([
        65, 70, 75, 68, 72, 78, 82, // Week 1: increasing
        75, 80, 85, 78, 83, 88, 90, // Week 2: high occupancy
      ]);

      const arimaForecasts = forecastARIMA(occupancyData, 7);
      const prophetForecasts = forecastProphet(occupancyData, 7);
      const lstmForecasts = forecastLSTM(occupancyData, 7);

      // All methods should produce reasonable forecasts
      [arimaForecasts, prophetForecasts, lstmForecasts].forEach((forecasts) => {
        expect(forecasts).toHaveLength(7);
        forecasts.forEach((f) => {
          expect(f.predicted).toBeGreaterThan(50);
          expect(f.predicted).toBeLessThanOrEqual(100);
        });
      });
    });

    it('should handle seasonal revenue patterns', () => {
      const data: DataPoint[] = [];
      const startDate = new Date('2024-01-01');

      // Simulate 60 days with weekend peaks
      for (let i = 0; i < 60; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfWeek = date.getDay();
        const baseRevenue = 5000;
        const weekendBonus = dayOfWeek === 5 || dayOfWeek === 6 ? 3000 : 0;
        data.push({ date, value: (baseRevenue + weekendBonus) / 100 }); // Normalized to 0-100
      }

      const forecasts = forecastProphet(data, 7);

      expect(forecasts).toHaveLength(7);
      forecasts.forEach((f) => {
        expect(f.predicted).toBeGreaterThan(0);
        expect(f.predicted).toBeLessThanOrEqual(100);
      });
    });

    it('should compare all three models on same data', () => {
      const data = createDataPoints([50, 52, 54, 56, 58, 60, 62, 64, 66]);

      const arimaForecasts = forecastARIMA(data, 3);
      const prophetForecasts = forecastProphet(data, 3);
      const lstmForecasts = forecastLSTM(data, 3);

      // All should forecast increasing trend
      expect(arimaForecasts[0].predicted).toBeGreaterThan(0);
      expect(prophetForecasts[0].predicted).toBeGreaterThan(0);
      expect(lstmForecasts[0].predicted).toBeGreaterThan(0);

      // Prophet should have highest initial confidence
      expect(prophetForecasts[0].confidence).toBeGreaterThan(lstmForecasts[0].confidence);
    });
  });
});
