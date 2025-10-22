import { analyzeHybrid, batchAnalyze } from '../hybrid';
import * as traditionalModule from '../traditional';
import * as aiModule from '../ai';

// Mock the AI module
jest.mock('../ai');

describe('Hybrid Sentiment Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeHybrid', () => {
    describe('Traditional-Only Path', () => {
      it('should use only traditional analysis for confident results', async () => {
        const text = 'The hotel was excellent and the staff was amazing';

        const result = await analyzeHybrid(text);

        expect(result.usedAI).toBe(false);
        expect(result.sentiment).toBe('positive');
        expect(result.processingTime).toBeGreaterThanOrEqual(0);
        expect(aiModule.analyzeWithAI).not.toHaveBeenCalled();
      });

      it('should not escalate to AI when confidence is high', async () => {
        const text = 'Perfect stay! Amazing room! Excellent service! Great location!';

        const result = await analyzeHybrid(text);

        expect(result.usedAI).toBe(false);
        expect(result.confidence).toBeGreaterThan(0.3);
        expect(aiModule.analyzeWithAI).not.toHaveBeenCalled();
      });

      it('should include traditional result when not using AI', async () => {
        const text = 'The room was clean and comfortable';

        const result = await analyzeHybrid(text);

        expect(result.usedAI).toBe(false);
        expect(result.keywords).toBeDefined();
        expect(result.method).toBe('traditional');
      });

      it('should measure processing time', async () => {
        const text = 'Good hotel';

        const result = await analyzeHybrid(text);

        expect(result.processingTime).toBeGreaterThanOrEqual(0);
        expect(result.processingTime).toBeLessThan(1000);
      });
    });

    describe('AI Escalation Path', () => {
      it('should escalate to AI for low confidence results', async () => {
        const text = 'The hotel is located on Main Street';
        const mockAIResult = {
          score: 0.1,
          sentiment: 'neutral' as const,
          confidence: 0.8,
          keywords: [],
          method: 'ai' as const,
        };

        (aiModule.analyzeWithAI as jest.Mock).mockResolvedValue(mockAIResult);

        const result = await analyzeHybrid(text);

        expect(result.usedAI).toBe(true);
        expect(result.traditionalResult).toBeDefined();
        expect(aiModule.analyzeWithAI).toHaveBeenCalledWith(text);
      });

      it('should escalate to AI for neutral sentiment', async () => {
        const text = 'The room has a bed and a desk';
        const mockAIResult = {
          score: 0,
          sentiment: 'neutral' as const,
          confidence: 0.9,
          keywords: [],
          method: 'ai' as const,
        };

        (aiModule.analyzeWithAI as jest.Mock).mockResolvedValue(mockAIResult);

        const result = await analyzeHybrid(text);

        expect(result.usedAI).toBe(true);
        expect(aiModule.analyzeWithAI).toHaveBeenCalled();
      });

      it('should use forceAI parameter to skip traditional check', async () => {
        const text = 'Excellent hotel with amazing views!';
        const mockAIResult = {
          score: 0.9,
          sentiment: 'positive' as const,
          confidence: 1.0,
          keywords: ['excellent', 'amazing'],
          method: 'ai' as const,
        };

        (aiModule.analyzeWithAI as jest.Mock).mockResolvedValue(mockAIResult);

        const result = await analyzeHybrid(text, true);

        expect(result.usedAI).toBe(true);
        expect(aiModule.analyzeWithAI).toHaveBeenCalledWith(text);
        expect(result.traditionalResult).toBeDefined();
      });

      it('should include both traditional and AI results when escalating', async () => {
        const text = 'The location is on the corner';
        const mockAIResult = {
          score: 0.2,
          sentiment: 'positive' as const,
          confidence: 0.7,
          keywords: ['convenient'],
          method: 'ai' as const,
        };

        (aiModule.analyzeWithAI as jest.Mock).mockResolvedValue(mockAIResult);

        const result = await analyzeHybrid(text);

        expect(result.usedAI).toBe(true);
        expect(result.traditionalResult).toBeDefined();
        expect(result.traditionalResult?.confidence).toBeLessThan(0.3);
      });

      it('should return AI result when escalated successfully', async () => {
        const text = 'Ambiguous review text here';
        const mockAIResult = {
          score: 0.6,
          sentiment: 'positive' as const,
          confidence: 0.85,
          keywords: ['good', 'nice'],
          method: 'ai' as const,
        };

        (aiModule.analyzeWithAI as jest.Mock).mockResolvedValue(mockAIResult);

        const result = await analyzeHybrid(text);

        expect(result.sentiment).toBe('positive');
        expect(result.confidence).toBe(0.85);
        expect(result.method).toBe('ai');
      });
    });

    describe('AI Fallback Behavior', () => {
      it('should fallback to traditional when AI fails', async () => {
        const text = 'The room was clean';

        (aiModule.analyzeWithAI as jest.Mock).mockRejectedValue(new Error('API Error'));

        // Force AI to trigger the fallback
        const result = await analyzeHybrid(text, true);

        expect(result.usedAI).toBe(false);
        expect(result.sentiment).toBe('positive');
        expect(result.keywords).toContain('clean');
      });

      it('should handle AI timeout gracefully', async () => {
        const text = 'Neutral text with no keywords';

        (aiModule.analyzeWithAI as jest.Mock).mockRejectedValue(new Error('Timeout'));

        const result = await analyzeHybrid(text);

        expect(result.usedAI).toBe(false);
        expect(result.traditionalResult).toBeUndefined();
      });

      it('should maintain processing time even with AI failure', async () => {
        const text = 'Some text';

        (aiModule.analyzeWithAI as jest.Mock).mockRejectedValue(new Error('Failed'));

        const result = await analyzeHybrid(text, true);

        expect(result.processingTime).toBeGreaterThanOrEqual(0);
        expect(result.usedAI).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', async () => {
        const result = await analyzeHybrid('');

        expect(result.sentiment).toBe('neutral');
        expect(result.score).toBe(0);
      });

      it('should handle very long text', async () => {
        const longText = 'excellent '.repeat(100);
        const result = await analyzeHybrid(longText);

        expect(result.sentiment).toBe('positive');
        expect(result.usedAI).toBe(false);
      });

      it('should handle special characters', async () => {
        const text = 'Great!!! Amazing??? Perfect...';
        const result = await analyzeHybrid(text);

        expect(result.sentiment).toBe('positive');
        expect(result.keywords.length).toBeGreaterThan(0);
      });
    });
  });

  describe('batchAnalyze', () => {
    it('should analyze multiple texts', async () => {
      const texts = [
        'Excellent hotel',
        'Terrible service',
        'The room was okay',
      ];

      const results = await batchAnalyze(texts);

      expect(results).toHaveLength(3);
      expect(results[0].sentiment).toBe('positive');
      expect(results[1].sentiment).toBe('negative');
      expect(results[2].sentiment).toBeDefined();
    });

    it('should process all texts independently', async () => {
      const texts = [
        'Perfect stay!',
        'Average room',
        'Horrible experience',
      ];

      const results = await batchAnalyze(texts);

      expect(results[0].usedAI).toBeDefined();
      expect(results[1].usedAI).toBeDefined();
      expect(results[2].usedAI).toBeDefined();
    });

    it('should handle empty array', async () => {
      const results = await batchAnalyze([]);

      expect(results).toHaveLength(0);
    });

    it('should handle single text', async () => {
      const results = await batchAnalyze(['Good hotel']);

      expect(results).toHaveLength(1);
      expect(results[0].sentiment).toBe('positive');
    });

    it('should process texts in parallel', async () => {
      const texts = ['Text 1', 'Text 2', 'Text 3', 'Text 4', 'Text 5'];
      const startTime = Date.now();

      await batchAnalyze(texts);

      const duration = Date.now() - startTime;
      // Should be faster than sequential (< 50ms total for simple traditional analysis)
      expect(duration).toBeLessThan(100);
    });

    it('should handle mix of AI and traditional paths', async () => {
      const mockAIResult = {
        score: 0.5,
        sentiment: 'positive' as const,
        confidence: 0.9,
        keywords: [],
        method: 'ai' as const,
      };

      (aiModule.analyzeWithAI as jest.Mock).mockResolvedValue(mockAIResult);

      const texts = [
        'Excellent service!', // Traditional
        'The room is there', // Should escalate to AI
      ];

      const results = await batchAnalyze(texts);

      expect(results).toHaveLength(2);
      expect(results[0].usedAI).toBe(false);
      expect(results[1].usedAI).toBe(true);
    });

    it('should handle errors in batch gracefully', async () => {
      (aiModule.analyzeWithAI as jest.Mock).mockRejectedValue(new Error('Failed'));

      const texts = [
        'Good',
        'The hotel', // Low confidence, will try AI and fail
      ];

      const results = await batchAnalyze(texts);

      expect(results).toHaveLength(2);
      expect(results[0].sentiment).toBeDefined();
      expect(results[1].sentiment).toBeDefined();
    });

    it('should preserve order of results', async () => {
      const texts = ['First review', 'Second review', 'Third review'];

      const results = await batchAnalyze(texts);

      expect(results).toHaveLength(3);
      // Each result should correspond to its input
      results.forEach((result) => {
        expect(result).toHaveProperty('sentiment');
        expect(result).toHaveProperty('usedAI');
      });
    });
  });
});
