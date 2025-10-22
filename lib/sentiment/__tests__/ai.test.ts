import { analyzeWithAI } from '../ai';

// Mock global fetch
global.fetch = jest.fn();

describe('AI-Based Sentiment Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeWithAI', () => {
    describe('Successful API Calls', () => {
      it('should call API with correct parameters', async () => {
        const mockResponse = {
          score: 0.8,
          sentiment: 'positive' as const,
          confidence: 0.95,
          keywords: ['great', 'excellent'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const text = 'Great hotel with excellent service';
        await analyzeWithAI(text);

        expect(global.fetch).toHaveBeenCalledWith('/api/sentiment/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      });

      it('should return AI analysis result for positive sentiment', async () => {
        const mockResponse = {
          score: 0.8,
          sentiment: 'positive' as const,
          confidence: 0.95,
          keywords: ['great', 'excellent'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('Great hotel');

        expect(result).toEqual(mockResponse);
        expect(result.sentiment).toBe('positive');
        expect(result.score).toBe(0.8);
        expect(result.method).toBe('ai');
      });

      it('should return AI analysis result for negative sentiment', async () => {
        const mockResponse = {
          score: -0.7,
          sentiment: 'negative' as const,
          confidence: 0.9,
          keywords: ['terrible', 'awful'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('Terrible hotel');

        expect(result).toEqual(mockResponse);
        expect(result.sentiment).toBe('negative');
        expect(result.score).toBe(-0.7);
      });

      it('should return AI analysis result for neutral sentiment', async () => {
        const mockResponse = {
          score: 0,
          sentiment: 'neutral' as const,
          confidence: 0.85,
          keywords: [],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('The hotel is located downtown');

        expect(result).toEqual(mockResponse);
        expect(result.sentiment).toBe('neutral');
        expect(result.score).toBe(0);
      });

      it('should handle complex analysis with keywords', async () => {
        const mockResponse = {
          score: 0.65,
          sentiment: 'positive' as const,
          confidence: 0.88,
          keywords: ['comfortable', 'clean', 'friendly'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('Comfortable and clean with friendly staff');

        expect(result.keywords).toContain('comfortable');
        expect(result.keywords).toContain('clean');
        expect(result.keywords).toContain('friendly');
      });
    });

    describe('API Error Handling', () => {
      it('should fallback to neutral when API returns non-ok response', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
        });

        const result = await analyzeWithAI('Some text');

        expect(result).toEqual({
          score: 0,
          sentiment: 'neutral',
          confidence: 0,
          keywords: [],
          method: 'ai',
        });
      });

      it('should fallback to neutral when API returns 404', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
        });

        const result = await analyzeWithAI('Some text');

        expect(result.sentiment).toBe('neutral');
        expect(result.score).toBe(0);
        expect(result.confidence).toBe(0);
      });

      it('should fallback to neutral when API returns 401', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
        });

        const result = await analyzeWithAI('Some text');

        expect(result.sentiment).toBe('neutral');
        expect(result.method).toBe('ai');
      });

      it('should fallback to neutral when fetch throws network error', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const result = await analyzeWithAI('Some text');

        expect(result).toEqual({
          score: 0,
          sentiment: 'neutral',
          confidence: 0,
          keywords: [],
          method: 'ai',
        });
      });

      it('should fallback to neutral when fetch throws timeout error', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));

        const result = await analyzeWithAI('Some text');

        expect(result.sentiment).toBe('neutral');
        expect(result.score).toBe(0);
      });

      it('should fallback to neutral when JSON parsing fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => {
            throw new Error('JSON parse error');
          },
        });

        const result = await analyzeWithAI('Some text');

        expect(result.sentiment).toBe('neutral');
        expect(result.confidence).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', async () => {
        const mockResponse = {
          score: 0,
          sentiment: 'neutral' as const,
          confidence: 1,
          keywords: [],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('');

        expect(result.sentiment).toBe('neutral');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/sentiment/ai',
          expect.objectContaining({
            body: JSON.stringify({ text: '' }),
          })
        );
      });

      it('should handle very long text', async () => {
        const longText = 'Great hotel! '.repeat(100);
        const mockResponse = {
          score: 0.9,
          sentiment: 'positive' as const,
          confidence: 0.95,
          keywords: ['great'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI(longText);

        expect(result.sentiment).toBe('positive');
        expect(global.fetch).toHaveBeenCalled();
      });

      it('should handle special characters', async () => {
        const text = 'Great!!! Amazing??? Perfect...';
        const mockResponse = {
          score: 0.85,
          sentiment: 'positive' as const,
          confidence: 0.92,
          keywords: ['great', 'amazing', 'perfect'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI(text);

        expect(result.sentiment).toBe('positive');
      });

      it('should handle unicode characters', async () => {
        const text = 'Excellent hôtel! 五星級酒店!';
        const mockResponse = {
          score: 0.9,
          sentiment: 'positive' as const,
          confidence: 0.95,
          keywords: ['excellent'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI(text);

        expect(result.sentiment).toBe('positive');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/sentiment/ai',
          expect.objectContaining({
            body: JSON.stringify({ text }),
          })
        );
      });
    });

    describe('Response Variations', () => {
      it('should handle response with high confidence', async () => {
        const mockResponse = {
          score: 0.95,
          sentiment: 'positive' as const,
          confidence: 0.99,
          keywords: ['perfect'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('Perfect hotel');

        expect(result.confidence).toBe(0.99);
      });

      it('should handle response with low confidence', async () => {
        const mockResponse = {
          score: 0.1,
          sentiment: 'neutral' as const,
          confidence: 0.5,
          keywords: [],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('Ambiguous text');

        expect(result.confidence).toBe(0.5);
      });

      it('should handle response with many keywords', async () => {
        const mockResponse = {
          score: 0.8,
          sentiment: 'positive' as const,
          confidence: 0.9,
          keywords: ['great', 'excellent', 'amazing', 'wonderful', 'perfect'],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('Great excellent amazing wonderful perfect hotel');

        expect(result.keywords).toHaveLength(5);
      });

      it('should handle response with no keywords', async () => {
        const mockResponse = {
          score: 0,
          sentiment: 'neutral' as const,
          confidence: 0.8,
          keywords: [],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await analyzeWithAI('The hotel exists');

        expect(result.keywords).toEqual([]);
      });
    });

    describe('HTTP Method and Headers', () => {
      it('should use POST method', async () => {
        const mockResponse = {
          score: 0,
          sentiment: 'neutral' as const,
          confidence: 0.8,
          keywords: [],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        await analyzeWithAI('Test');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      it('should set Content-Type header to application/json', async () => {
        const mockResponse = {
          score: 0,
          sentiment: 'neutral' as const,
          confidence: 0.8,
          keywords: [],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        await analyzeWithAI('Test');

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      it('should send JSON body with text property', async () => {
        const mockResponse = {
          score: 0,
          sentiment: 'neutral' as const,
          confidence: 0.8,
          keywords: [],
          method: 'ai' as const,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const text = 'Test text';
        await analyzeWithAI(text);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ text }),
          })
        );
      });
    });
  });
});
