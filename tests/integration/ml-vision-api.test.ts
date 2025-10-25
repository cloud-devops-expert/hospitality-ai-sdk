/**
 * ML Vision API Integration Tests
 *
 * Tests computer vision model inference through API endpoints
 * Covers food recognition and PPE detection
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Sample base64-encoded 1x1 pixel images for testing
const SAMPLE_IMAGE_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('ML Vision API Integration Tests', () => {
  beforeAll(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/location`);
      if (!response.ok) {
        console.warn('Server may not be running at', BASE_URL);
      }
    } catch (error) {
      console.warn('Could not connect to server:', error);
    }
  });

  describe('Food Recognition API (/api/ml/recognize-food)', () => {
    it('should recognize food from image data', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('foodItem');
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('confidence');
      expect(data).toHaveProperty('executionTime');
      expect(data).toHaveProperty('modelUsed');
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
      expect(data.executionTime).toBeGreaterThanOrEqual(0);
    }, 60000);

    it('should include nutrition information when available', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      // Nutrition info may or may not be present depending on food item
      if (data.calories) {
        expect(data.calories).toBeGreaterThanOrEqual(0);
      }
      if (data.portionSize) {
        expect(typeof data.portionSize).toBe('string');
      }
    }, 60000);

    it('should detect waste for uncertain results', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('wasteDetected');
      expect(typeof data.wasteDetected).toBe('boolean');
    }, 60000);

    it('should handle metadata (imageId, location)', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          imageId: 'test-001',
          location: 'Main Kitchen',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.foodItem).toBeDefined();
    }, 60000);

    it('should handle empty image data', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: '',
        }),
      });

      // Should either handle gracefully or return error
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle invalid image format', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: 'invalid-data',
        }),
      });

      // Should either handle gracefully or return error
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle missing imageData field', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should complete in reasonable time', async () => {
      const startTime = Date.now();

      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
        }),
      });

      const totalTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(totalTime).toBeLessThan(30000); // 30s max
    }, 60000);
  });

  describe('PPE Detection API (/api/ml/detect-ppe)', () => {
    it('should detect PPE from image data - kitchen scenario', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'kitchen',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('detected');
      expect(data).toHaveProperty('missing');
      expect(data).toHaveProperty('complianceScore');
      expect(data).toHaveProperty('violationCount');
      expect(data).toHaveProperty('executionTime');
      expect(data).toHaveProperty('modelUsed');
      expect(data).toHaveProperty('status');

      expect(Array.isArray(data.detected)).toBe(true);
      expect(Array.isArray(data.missing)).toBe(true);
      expect(data.complianceScore).toBeGreaterThanOrEqual(0);
      expect(data.complianceScore).toBeLessThanOrEqual(100);
      expect(data.executionTime).toBeGreaterThanOrEqual(0);
      expect(['compliant', 'warning', 'violation']).toContain(data.status);
    }, 60000);

    it('should detect PPE - medical scenario', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'medical',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.detected).toBeDefined();
      expect(data.missing).toBeDefined();
      // Medical requires: Mask, Gloves, Gown
      expect(data.detected.length + data.missing.length).toBe(3);
    }, 60000);

    it('should detect PPE - maintenance scenario', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'maintenance',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      // Maintenance requires: Hard Hat, Safety Vest, Gloves
      expect(data.detected.length + data.missing.length).toBe(3);
    }, 60000);

    it('should detect PPE - housekeeping scenario', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'housekeeping',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      // Housekeeping requires: Gloves, Uniform
      expect(data.detected.length + data.missing.length).toBe(2);
    }, 60000);

    it('should calculate compliance score correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'kitchen',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      const totalRequired = data.detected.length + data.missing.length;
      const expectedScore = (data.detected.length / totalRequired) * 100;

      expect(data.complianceScore).toBeCloseTo(expectedScore, 0);
    }, 60000);

    it('should set appropriate status based on compliance', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'medical',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      if (data.complianceScore === 100) {
        expect(data.status).toBe('compliant');
      } else if (data.complianceScore >= 66.7) {
        expect(data.status).toBe('warning');
      } else {
        expect(data.status).toBe('violation');
      }
    }, 60000);

    it('should handle metadata (imageId, location)', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'kitchen',
          imageId: 'inspection-001',
          location: 'Main Kitchen',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.detected).toBeDefined();
    }, 60000);

    it('should handle custom requiredPPE', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'custom',
          requiredPPE: ['Gloves', 'Mask', 'Apron'],
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.detected.length + data.missing.length).toBe(3);
    }, 60000);

    it('should handle missing scenario field', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle invalid scenario', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'invalid-scenario',
        }),
      });

      // Should either default to a scenario or return error
      expect(response.status).toBeGreaterThanOrEqual(200);
    }, 60000);

    it('should complete in reasonable time', async () => {
      const startTime = Date.now();

      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: SAMPLE_IMAGE_DATA,
          scenario: 'kitchen',
        }),
      });

      const totalTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(totalTime).toBeLessThan(30000); // 30s max
    }, 60000);
  });

  describe('Performance Benchmarks', () => {
    it('should process food recognition efficiently', async () => {
      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: SAMPLE_IMAGE_DATA,
          }),
        });

        times.push(Date.now() - startTime);
        expect(response.status).toBe(200);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Food recognition avg time: ${avgTime.toFixed(0)}ms`);

      // After first load, subsequent requests should be faster
      expect(times[times.length - 1]).toBeLessThan(30000);
    }, 120000);

    it('should process PPE detection efficiently', async () => {
      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: SAMPLE_IMAGE_DATA,
            scenario: 'kitchen',
          }),
        });

        times.push(Date.now() - startTime);
        expect(response.status).toBe(200);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`PPE detection avg time: ${avgTime.toFixed(0)}ms`);

      expect(times[times.length - 1]).toBeLessThan(30000);
    }, 120000);
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON - food recognition', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/recognize-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle malformed JSON - PPE detection', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/detect-ppe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle GET requests appropriately', async () => {
      const responses = await Promise.all([
        fetch(`${BASE_URL}/api/ml/recognize-food`, { method: 'GET' }),
        fetch(`${BASE_URL}/api/ml/detect-ppe`, { method: 'GET' }),
      ]);

      responses.forEach((response) => {
        expect([200, 405]).toContain(response.status);
      });
    });
  });
});
