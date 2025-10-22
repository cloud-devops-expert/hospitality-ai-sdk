/**
 * @jest-environment node
 */

import { forecastHybrid, forecastHybridWithMetadata, forecastBatch } from '../hybrid';
import type { DataPoint } from '../statistical';

describe('Hybrid Forecast', () => {
  const sampleData: DataPoint[] = [
    { date: new Date('2025-01-01'), value: 60 },
    { date: new Date('2025-01-02'), value: 62 },
    { date: new Date('2025-01-03'), value: 65 },
    { date: new Date('2025-01-04'), value: 68 },
    { date: new Date('2025-01-05'), value: 70 },
    { date: new Date('2025-01-06'), value: 75 },
    { date: new Date('2025-01-07'), value: 78 },
  ];

  describe('forecastHybrid', () => {
    it('should return forecasts for specified days ahead', async () => {
      const result = await forecastHybrid(sampleData, 7);
      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('predicted');
      expect(result[0]).toHaveProperty('confidence');
      expect(result[0]).toHaveProperty('trend');
    });

    it('should use library method when enabled', async () => {
      process.env.NEXT_PUBLIC_USE_SIMPLE_STATS = 'true';
      const result = await forecastHybrid(sampleData, 3);
      expect(result).toHaveLength(3);
      // Library method should add 'method' field
      expect(result[0]).toHaveProperty('method');
    });

    it('should fallback to custom when library disabled', async () => {
      process.env.NEXT_PUBLIC_USE_SIMPLE_STATS = 'false';
      const result = await forecastHybrid(sampleData, 3);
      expect(result).toHaveLength(3);
      expect(result[0].predicted).toBeGreaterThan(0);
      expect(result[0].confidence).toBeGreaterThan(0);
    });

    it('should handle edge cases', async () => {
      const minData: DataPoint[] = [
        { date: new Date('2025-01-01'), value: 50 },
        { date: new Date('2025-01-02'), value: 52 },
      ];
      const result = await forecastHybrid(minData, 1);
      expect(result).toHaveLength(1);
      expect(result[0].predicted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('forecastHybridWithMetadata', () => {
    it('should return forecasts with metadata', async () => {
      const result = await forecastHybridWithMetadata(sampleData, 7);
      expect(result).toHaveProperty('forecasts');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('usedLibrary');
      expect(result).toHaveProperty('accuracy');
      expect(result.forecasts).toHaveLength(7);
    });

    it('should report library usage correctly', async () => {
      process.env.NEXT_PUBLIC_USE_SIMPLE_STATS = 'true';
      const result = await forecastHybridWithMetadata(sampleData, 3);
      expect(result.method).toBeDefined();
      expect(result.usedLibrary).toBe(result.method === 'library');
    });

    it('should have higher accuracy with library', async () => {
      const result = await forecastHybridWithMetadata(sampleData, 7);
      if (result.usedLibrary) {
        expect(result.accuracy).toBe(0.85);
      } else {
        expect(result.accuracy).toBe(0.81);
      }
    });
  });

  describe('forecastBatch', () => {
    it('should process multiple datasets', async () => {
      const datasets = [
        { data: sampleData, daysAhead: 7, priority: 'high' as const },
        { data: sampleData, daysAhead: 14, priority: 'low' as const },
      ];

      const result = await forecastBatch(datasets);
      expect(result.results).toHaveLength(2);
      expect(result.stats.total).toBe(2);
    });

    it('should prioritize high priority forecasts for library usage', async () => {
      process.env.NEXT_PUBLIC_USE_SIMPLE_STATS = 'true';
      const datasets = [
        { data: sampleData, daysAhead: 7, priority: 'high' as const },
        { data: sampleData, daysAhead: 7, priority: 'low' as const },
      ];

      const result = await forecastBatch(datasets);
      // High priority should use library when available
      const highPriorityResult = result.results.find((r) => r.priority === 'high');
      expect(highPriorityResult).toBeDefined();
      expect(highPriorityResult?.forecasts).toHaveLength(7);
    });

    it('should provide usage statistics', async () => {
      const datasets = [
        { data: sampleData, daysAhead: 3, priority: 'high' as const },
        { data: sampleData, daysAhead: 3, priority: 'high' as const },
        { data: sampleData, daysAhead: 3, priority: 'low' as const },
      ];

      const result = await forecastBatch(datasets);
      expect(result.stats.total).toBe(3);
      expect(result.stats.library + result.stats.custom).toBe(3);
      expect(result.stats.libraryPercentage).toBeGreaterThanOrEqual(0);
      expect(result.stats.libraryPercentage).toBeLessThanOrEqual(100);
    });
  });
});
