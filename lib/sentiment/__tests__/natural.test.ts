/**
 * @jest-environment node
 */

import {
  analyzeNaturalHybrid,
  analyzeNaturalHybridWithMetadata,
  analyzeNaturalBatch,
} from '../natural';

describe('Natural Sentiment Analysis', () => {
  describe('analyzeNaturalHybrid', () => {
    it('should analyze positive sentiment', async () => {
      const result = await analyzeNaturalHybrid('Amazing hotel! Great service and wonderful staff.');
      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.keywords).toBeDefined();
    });

    it('should analyze negative sentiment', async () => {
      const result = await analyzeNaturalHybrid('Terrible experience. Dirty rooms and rude staff.');
      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should analyze neutral sentiment', async () => {
      const result = await analyzeNaturalHybrid('The hotel is located downtown.');
      expect(result.sentiment).toBe('neutral');
      expect(Math.abs(result.score)).toBeLessThan(0.3);
    });

    it('should handle empty text', async () => {
      const result = await analyzeNaturalHybrid('');
      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0);
    });

    it('should use library method when enabled', async () => {
      process.env.NEXT_PUBLIC_USE_NATURAL = 'true';
      const result = await analyzeNaturalHybrid('Excellent service!');
      expect(result.method).toBeDefined();
      expect(['natural', 'traditional']).toContain(result.method);
    });

    it('should fallback to custom when library disabled', async () => {
      process.env.NEXT_PUBLIC_USE_NATURAL = 'false';
      const result = await analyzeNaturalHybrid('Great hotel!');
      expect(result).toBeDefined();
      expect(result.sentiment).toBeDefined();
    });
  });

  describe('analyzeNaturalHybridWithMetadata', () => {
    it('should return sentiment with metadata', async () => {
      const result = await analyzeNaturalHybridWithMetadata('Wonderful stay!');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('usedLibrary');
      expect(result).toHaveProperty('accuracy');
    });

    it('should report library usage correctly', async () => {
      process.env.NEXT_PUBLIC_USE_NATURAL = 'true';
      const result = await analyzeNaturalHybridWithMetadata('Amazing!');
      expect(result.method).toBeDefined();
      expect(result.usedLibrary).toBe(result.method === 'library');
    });

    it('should have higher accuracy with library', async () => {
      const result = await analyzeNaturalHybridWithMetadata('Perfect hotel!');
      if (result.usedLibrary) {
        expect(result.accuracy).toBe(0.82);
      } else {
        expect(result.accuracy).toBe(0.72);
      }
    });
  });

  describe('analyzeNaturalBatch', () => {
    it('should process multiple texts', async () => {
      const texts = [
        { text: 'Excellent service!', priority: 'high' as const },
        { text: 'Terrible experience.', priority: 'low' as const },
      ];

      const result = await analyzeNaturalBatch(texts);
      expect(result.results).toHaveLength(2);
      expect(result.stats.total).toBe(2);
    });

    it('should prioritize high priority for library usage', async () => {
      process.env.NEXT_PUBLIC_USE_NATURAL = 'true';
      const texts = [
        { text: 'Amazing!', priority: 'high' as const },
        { text: 'Great!', priority: 'low' as const },
      ];

      const result = await analyzeNaturalBatch(texts);
      const highPriorityResult = result.results.find((r) => r.priority === 'high');
      expect(highPriorityResult).toBeDefined();
      expect(highPriorityResult?.sentiment).toBeDefined();
    });

    it('should provide usage statistics', async () => {
      const texts = [
        { text: 'Good', priority: 'high' as const },
        { text: 'Bad', priority: 'high' as const },
        { text: 'Okay', priority: 'low' as const },
      ];

      const result = await analyzeNaturalBatch(texts);
      expect(result.stats.total).toBe(3);
      expect(result.stats.library + result.stats.custom).toBe(3);
      expect(result.stats.libraryPercentage).toBeGreaterThanOrEqual(0);
      expect(result.stats.libraryPercentage).toBeLessThanOrEqual(100);
    });
  });
});
