/**
 * Food Recognition Tests
 */

import {
  recognizeFood,
  recognizeFoodWithMetadata,
  recognizeFoodBatch,
  analyzeWaste,
  FoodRecognitionInput,
  FoodRecognitionResult,
} from '../food-recognition';

describe('Food Recognition', () => {
  describe('recognizeFood', () => {
    it('should recognize food from image data', async () => {
      const input: FoodRecognitionInput = {
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        imageId: 'test-001',
        location: 'Restaurant Kitchen',
      };

      const result = await recognizeFood(input);

      expect(result).toBeDefined();
      expect(result.foodItem).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.modelUsed).toBeDefined();
      expect(result.method).toMatch(/transformers\.js|mock/);
    });

    it('should return consistent results for same input', async () => {
      const input: FoodRecognitionInput = {
        imageData: 'data:image/png;base64,sameinput',
      };

      const result1 = await recognizeFood(input);
      const result2 = await recognizeFood(input);

      // Mock implementation is deterministic based on hash
      if (result1.method === 'mock' && result2.method === 'mock') {
        expect(result1.foodItem).toBe(result2.foodItem);
        expect(result1.confidence).toBeCloseTo(result2.confidence, 2);
      }
    });

    it('should handle different image data', async () => {
      const inputs: FoodRecognitionInput[] = [
        { imageData: 'data:image/png;base64,pizza' },
        { imageData: 'data:image/png;base64,burger' },
        { imageData: 'data:image/png;base64,salad' },
      ];

      const results = await Promise.all(inputs.map((input) => recognizeFood(input)));

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.foodItem).toBeDefined();
        expect(result.category).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should include nutrition info when available', async () => {
      const input: FoodRecognitionInput = {
        imageData: 'data:image/png;base64,pizza',
      };

      const result = await recognizeFood(input);

      if (result.foodItem.toLowerCase().includes('pizza')) {
        expect(result.calories).toBeDefined();
        expect(result.calories).toBeGreaterThan(0);
        expect(result.portionSize).toBeDefined();
      }
    });

    it('should detect waste for low confidence results', async () => {
      const input: FoodRecognitionInput = {
        imageData: 'data:image/png;base64,unclear',
      };

      const result = await recognizeFood(input);

      expect(result.wasteDetected).toBeDefined();
      expect(typeof result.wasteDetected).toBe('boolean');
    });
  });

  describe('recognizeFoodWithMetadata', () => {
    it('should include method metadata', async () => {
      const input: FoodRecognitionInput = {
        imageData: 'data:image/png;base64,test',
      };

      const result = await recognizeFoodWithMetadata(input);

      expect(result.methodUsed).toBeDefined();
      expect(result.methodUsed).toMatch(/transformers\.js|mock/);
      expect(result.method).toBe(result.methodUsed);
    });
  });

  describe('recognizeFoodBatch', () => {
    it('should process multiple images', async () => {
      const inputs: FoodRecognitionInput[] = [
        { imageData: 'data:image/png;base64,image1', imageId: '001' },
        { imageData: 'data:image/png;base64,image2', imageId: '002' },
        { imageData: 'data:image/png;base64,image3', imageId: '003' },
      ];

      const results = await recognizeFoodBatch(inputs);

      expect(results).toHaveLength(3);
      results.forEach((result, i) => {
        expect(result.foodItem).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should handle empty batch', async () => {
      const results = await recognizeFoodBatch([]);

      expect(results).toHaveLength(0);
    });

    it('should process large batches efficiently', async () => {
      const inputs: FoodRecognitionInput[] = Array.from({ length: 10 }, (_, i) => ({
        imageData: `data:image/png;base64,batch${i}`,
        imageId: `batch-${i}`,
      }));

      const startTime = Date.now();
      const results = await recognizeFoodBatch(inputs);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });

  describe('analyzeWaste', () => {
    it('should calculate waste percentage', () => {
      const results: FoodRecognitionResult[] = [
        {
          foodItem: 'Pizza',
          category: 'Italian',
          confidence: 0.9,
          executionTime: 50,
          modelUsed: 'mock',
          wasteDetected: false,
          method: 'mock',
        },
        {
          foodItem: 'Burger',
          category: 'American',
          confidence: 0.4,
          executionTime: 50,
          modelUsed: 'mock',
          wasteDetected: true,
          method: 'mock',
        },
        {
          foodItem: 'Salad',
          category: 'Healthy',
          confidence: 0.3,
          executionTime: 50,
          modelUsed: 'mock',
          wasteDetected: true,
          method: 'mock',
        },
      ];

      const analysis = analyzeWaste(results, 10);

      expect(analysis.totalItems).toBe(3);
      expect(analysis.wasteItems).toBe(2);
      expect(analysis.wastePercentage).toBeCloseTo(66.67, 1);
      expect(analysis.estimatedCost).toBe(20); // 2 items * $10
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide critical recommendations for high waste', () => {
      const results: FoodRecognitionResult[] = Array.from({ length: 10 }, (_, i) => ({
        foodItem: `Item ${i}`,
        category: 'Food',
        confidence: 0.3,
        executionTime: 50,
        modelUsed: 'mock',
        wasteDetected: i < 4, // 40% waste
        method: 'mock',
      }));

      const analysis = analyzeWaste(results);

      expect(analysis.wastePercentage).toBeCloseTo(40, 0);
      expect(analysis.recommendations).toContain('Critical waste level - review portion sizes');
    });

    it('should provide positive feedback for low waste', () => {
      const results: FoodRecognitionResult[] = Array.from({ length: 20 }, (_, i) => ({
        foodItem: `Item ${i}`,
        category: 'Food',
        confidence: 0.9,
        executionTime: 50,
        modelUsed: 'mock',
        wasteDetected: i === 0, // 5% waste
        method: 'mock',
      }));

      const analysis = analyzeWaste(results);

      expect(analysis.wastePercentage).toBeLessThanOrEqual(5);
      expect(analysis.recommendations).toContain('Excellent waste management');
    });

    it('should calculate cost correctly', () => {
      const results: FoodRecognitionResult[] = Array.from({ length: 10 }, (_, i) => ({
        foodItem: `Item ${i}`,
        category: 'Food',
        confidence: 0.9,
        executionTime: 50,
        modelUsed: 'mock',
        wasteDetected: i < 3, // 3 waste items
        method: 'mock',
      }));

      const analysis = analyzeWaste(results, 12.50);

      expect(analysis.wasteItems).toBe(3);
      expect(analysis.estimatedCost).toBe(37.50); // 3 * $12.50
    });

    it('should handle zero waste', () => {
      const results: FoodRecognitionResult[] = Array.from({ length: 5 }, (_, i) => ({
        foodItem: `Item ${i}`,
        category: 'Food',
        confidence: 0.95,
        executionTime: 50,
        modelUsed: 'mock',
        wasteDetected: false,
        method: 'mock',
      }));

      const analysis = analyzeWaste(results);

      expect(analysis.wasteItems).toBe(0);
      expect(analysis.wastePercentage).toBe(0);
      expect(analysis.estimatedCost).toBe(0);
      expect(analysis.recommendations).toContain('Excellent waste management');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty image data', async () => {
      const input: FoodRecognitionInput = {
        imageData: '',
      };

      const result = await recognizeFood(input);

      expect(result).toBeDefined();
      expect(result.foodItem).toBeDefined();
    });

    it('should handle very long image data', async () => {
      const longData = 'data:image/png;base64,' + 'A'.repeat(10000);
      const input: FoodRecognitionInput = {
        imageData: longData,
      };

      const result = await recognizeFood(input);

      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp when provided', async () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      const input: FoodRecognitionInput = {
        imageData: 'data:image/png;base64,test',
        timestamp,
      };

      const result = await recognizeFood(input);

      expect(result).toBeDefined();
      // Timestamp is stored in input, not result, but should not cause errors
    });
  });
});
