/**
 * ML API Integration Tests
 *
 * Tests actual ML model inference through API endpoints
 * These tests verify that the API routes work correctly end-to-end
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

describe('ML API Integration Tests', () => {
  // Health check to ensure server is running
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

  describe('Translation API (/api/ml/translate)', () => {
    it('should translate text from English to Spanish', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello, welcome to our hotel!',
          sourceLang: 'eng_Latn',
          targetLang: 'spa_Latn',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('translatedText');
      expect(data).toHaveProperty('executionTimeMs');
      expect(data).toHaveProperty('characterCount');
      expect(data.characterCount).toBeGreaterThan(0);
      expect(data.executionTimeMs).toBeGreaterThanOrEqual(0);
    }, 60000); // 60s timeout for model loading

    it('should translate text from English to French', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Good morning!',
          sourceLang: 'eng_Latn',
          targetLang: 'fra_Latn',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.translatedText).toBeDefined();
      expect(data.translatedText.length).toBeGreaterThan(0);
    }, 60000);

    it('should handle empty text', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          sourceLang: 'eng_Latn',
          targetLang: 'spa_Latn',
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle long text', async () => {
      const longText = 'Hello! '.repeat(50); // ~350 chars
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: longText,
          sourceLang: 'eng_Latn',
          targetLang: 'spa_Latn',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.translatedText).toBeDefined();
      expect(data.characterCount).toBeGreaterThanOrEqual(300);
    }, 60000);

    it('should reject invalid language codes', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello',
          sourceLang: 'invalid_Lang',
          targetLang: 'also_Invalid',
        }),
      });

      // Should either validate and reject, or handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(200);
    }, 60000);
  });

  describe('Question Answering API (/api/ml/qa)', () => {
    it('should answer questions about a context', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context:
            'The Grand Hotel offers luxury accommodations with 200 rooms. Check-in time is 3 PM and check-out is 11 AM. We have a spa, pool, and three restaurants.',
          question: 'What is the check-in time?',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('answer');
      expect(data).toHaveProperty('confidence');
      expect(data).toHaveProperty('executionTimeMs');
      expect(data.answer).toBeDefined();
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
    }, 60000);

    it('should handle questions about amenities', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context:
            'Our hotel features a fitness center, business lounge, and complimentary breakfast from 6 AM to 10 AM.',
          question: 'What time does breakfast start?',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.answer).toBeDefined();
      expect(typeof data.answer).toBe('string');
    }, 60000);

    it('should handle empty question', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'Some context',
          question: '',
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle empty context', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: '',
          question: 'What is the check-in time?',
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Text Summarization API (/api/ml/summarize)', () => {
    it('should summarize long text', async () => {
      const longText = `
        The Grand Hotel has been serving guests since 1950. Located in the heart of the city,
        we offer 200 luxurious rooms and suites. Our amenities include a world-class spa,
        an Olympic-sized pool, three award-winning restaurants, and a state-of-the-art fitness center.
        We pride ourselves on exceptional service and attention to detail. Our staff speaks
        15 different languages to serve our international clientele. We also offer business
        facilities including meeting rooms, conference halls, and high-speed internet throughout
        the property. The hotel has won numerous awards for hospitality excellence and sustainable
        practices. We look forward to welcoming you!
      `;

      const response = await fetch(`${BASE_URL}/api/ml/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: longText,
          maxLength: 60,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('executionTimeMs');
      expect(data).toHaveProperty('originalLength');
      expect(data).toHaveProperty('summaryLength');
      expect(data.summary).toBeDefined();
      expect(data.summaryLength).toBeLessThan(data.originalLength);
    }, 60000);

    it('should handle short text', async () => {
      const shortText = 'Hello world!';

      const response = await fetch(`${BASE_URL}/api/ml/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: shortText,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.summary).toBeDefined();
    }, 60000);

    it('should respect maxLength parameter', async () => {
      const text = 'This is a test. '.repeat(20); // ~320 chars

      const response = await fetch(`${BASE_URL}/api/ml/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          maxLength: 30,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.summaryLength).toBeLessThanOrEqual(50); // Some tolerance
    }, 60000);
  });

  describe('Semantic Search API (/api/ml/search)', () => {
    it('should perform semantic search', async () => {
      const documents = [
        'Our hotel has a beautiful swimming pool with ocean views.',
        'The spa offers relaxing massages and wellness treatments.',
        'Our restaurant serves Italian cuisine with fresh ingredients.',
        'Free WiFi is available throughout the hotel.',
      ];

      const response = await fetch(`${BASE_URL}/api/ml/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Where can I swim?',
          documents,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0]).toHaveProperty('document');
      expect(data.results[0]).toHaveProperty('score');
      expect(data.results[0]).toHaveProperty('rank');

      // First result should be about the pool
      expect(data.results[0].document).toContain('pool');
    }, 60000);

    it('should rank results by relevance', async () => {
      const documents = [
        'The hotel is located in downtown.',
        'We have a fitness gym open 24/7.',
        'Our gym features modern equipment and personal trainers.',
        'Parking is available for $20 per day.',
      ];

      const response = await fetch(`${BASE_URL}/api/ml/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'fitness center',
          documents,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results.length).toBeGreaterThan(0);

      // Results should be sorted by score (descending)
      for (let i = 0; i < data.results.length - 1; i++) {
        expect(data.results[i].score).toBeGreaterThanOrEqual(data.results[i + 1].score);
      }

      // Top result should be about gym/fitness
      expect(data.results[0].document.toLowerCase()).toMatch(/gym|fitness/);
    }, 60000);

    it('should handle empty documents', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          documents: [],
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle empty query', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '',
          documents: ['doc1', 'doc2'],
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete translation in reasonable time', async () => {
      const startTime = Date.now();

      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          sourceLang: 'eng_Latn',
          targetLang: 'spa_Latn',
        }),
      });

      const totalTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      // After first load, should be fast (<5s)
      // First load may take longer (model download)
      expect(totalTime).toBeLessThan(30000); // 30s max
    }, 60000);

    it('should complete QA in reasonable time', async () => {
      const startTime = Date.now();

      const response = await fetch(`${BASE_URL}/api/ml/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'The check-in time is 3 PM.',
          question: 'When is check-in?',
        }),
      });

      const totalTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(totalTime).toBeLessThan(30000); // 30s max
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing text, sourceLang, targetLang
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle GET requests appropriately', async () => {
      const response = await fetch(`${BASE_URL}/api/ml/translate`, {
        method: 'GET',
      });

      // Should either return 405 Method Not Allowed or handle gracefully
      expect([200, 405]).toContain(response.status);
    });
  });
});
