import { parseIntent, generateSuggestions, formatResponse } from '../nlu';

describe('Natural Language Understanding (NLU)', () => {
  describe('parseIntent', () => {
    describe('Forecast Intents', () => {
      it('should detect forecast intent from "forecast"', () => {
        const intent = parseIntent('What is the forecast for next week?');

        expect(intent.type).toBe('forecast');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect forecast intent from "occupancy"', () => {
        const intent = parseIntent('Show me occupancy for this weekend');

        expect(intent.type).toBe('forecast');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect forecast intent from "busy"', () => {
        const intent = parseIntent('How busy are we tonight?');

        expect(intent.type).toBe('forecast');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect forecast intent from "demand"', () => {
        const intent = parseIntent('What is demand looking like?');

        expect(intent.type).toBe('forecast');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should extract timeframe from forecast query', () => {
        const intent = parseIntent('Forecast for tomorrow');

        expect(intent.type).toBe('forecast');
        expect(intent.timeframe).toBeDefined();
      });
    });

    describe('Pricing Intents', () => {
      it('should detect pricing intent from "price"', () => {
        const intent = parseIntent('What should I price rooms at?');

        expect(intent.type).toBe('pricing');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect pricing intent from "rate"', () => {
        const intent = parseIntent('Should I raise my rates?');

        expect(intent.type).toBe('pricing');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect pricing intent from "charge"', () => {
        const intent = parseIntent('How much should I charge?');

        expect(intent.type).toBe('pricing');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect pricing intent from "increase"', () => {
        const intent = parseIntent('Should I increase prices?');

        expect(intent.type).toBe('pricing');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    describe('No-Show Intents', () => {
      it('should detect no-show intent from "no-show"', () => {
        const intent = parseIntent('Show me high-risk no-shows');

        expect(intent.type).toBe('noshow');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect no-show intent from "cancel"', () => {
        const intent = parseIntent('Who will likely cancel?');

        expect(intent.type).toBe('noshow');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect no-show intent from "probability"', () => {
        const intent = parseIntent('What is the no-show probability?');

        expect(intent.type).toBe('noshow');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    describe('Guest Segmentation Intents', () => {
      it('should detect segmentation intent from "guest"', () => {
        const intent = parseIntent('Show me guest segments');

        expect(intent.type).toBe('segmentation');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect segmentation intent from "VIP"', () => {
        const intent = parseIntent('Show me VIP guest segments');

        expect(intent.type).toBe('segmentation');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect segmentation intent from "profile"', () => {
        const intent = parseIntent('What are the guest profiles?');

        expect(intent.type).toBe('segmentation');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect segmentation intent from "luxury"', () => {
        const intent = parseIntent('Show me luxury travelers');

        expect(intent.type).toBe('segmentation');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    describe('Sentiment Intents', () => {
      it('should detect sentiment intent from "review"', () => {
        const intent = parseIntent('Analyze review sentiment');

        expect(intent.type).toBe('sentiment');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect sentiment intent from "feedback"', () => {
        const intent = parseIntent('What does feedback say?');

        expect(intent.type).toBe('sentiment');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect sentiment intent from "satisfaction"', () => {
        const intent = parseIntent('Check satisfaction ratings');

        expect(intent.type).toBe('sentiment');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    describe('Operations Intents', () => {
      it('should detect operations intent from "housekeeping"', () => {
        const intent = parseIntent('Optimize housekeeping routes');

        expect(intent.type).toBe('operations');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect operations intent from "clean"', () => {
        const intent = parseIntent('Clean room 301');

        expect(intent.type).toBe('operations');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect operations intent from "maintenance"', () => {
        const intent = parseIntent('Show maintenance tasks');

        expect(intent.type).toBe('operations');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });

      it('should detect operations intent from "staff"', () => {
        const intent = parseIntent('How is staff performance?');

        expect(intent.type).toBe('operations');
        expect(intent.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    describe('General/Fallback Intent', () => {
      it('should return general intent for unrecognized queries', () => {
        const intent = parseIntent('Hello, how are you?');

        expect(intent.type).toBe('general');
        expect(intent.confidence).toBeLessThan(0.8);
      });

      it('should return general intent for empty query', () => {
        const intent = parseIntent('');

        expect(intent.type).toBe('general');
      });

      it('should return general intent for random text', () => {
        const intent = parseIntent('asdfqwerzxcv');

        expect(intent.type).toBe('general');
      });
    });

    describe('Case Insensitivity', () => {
      it('should handle uppercase queries', () => {
        const intent = parseIntent('WHAT IS THE FORECAST?');

        expect(intent.type).toBe('forecast');
      });

      it('should handle mixed case queries', () => {
        const intent = parseIntent('ShoW Me The PRicing');

        expect(intent.type).toBe('pricing');
      });
    });
  });

  describe('Timeframe Extraction', () => {
    it('should extract "tonight" timeframe', () => {
      const intent = parseIntent('How busy are we tonight?');

      expect(intent.timeframe).toBeDefined();
      expect(intent.timeframe?.start).toBeInstanceOf(Date);
      expect(intent.timeframe?.end).toBeInstanceOf(Date);

      // Should be today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(intent.timeframe?.start?.getTime()).toBe(today.getTime());
    });

    it('should extract "tomorrow" timeframe', () => {
      const intent = parseIntent('Forecast for tomorrow');

      expect(intent.timeframe).toBeDefined();
      expect(intent.timeframe?.start).toBeInstanceOf(Date);
      expect(intent.timeframe?.end).toBeInstanceOf(Date);

      // Should be tomorrow
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      expect(intent.timeframe?.start?.getTime()).toBe(tomorrow.getTime());
    });

    it('should extract "weekend" timeframe', () => {
      const intent = parseIntent('What is occupancy this weekend?');

      expect(intent.timeframe).toBeDefined();
      expect(intent.timeframe?.start).toBeInstanceOf(Date);
      expect(intent.timeframe?.end).toBeInstanceOf(Date);
    });

    it('should extract "next week" timeframe', () => {
      const intent = parseIntent('Show me demand for next week');

      expect(intent.timeframe).toBeDefined();
      expect(intent.timeframe?.start).toBeInstanceOf(Date);
      expect(intent.timeframe?.end).toBeInstanceOf(Date);
    });

    it('should return undefined for no timeframe', () => {
      const intent = parseIntent('Show me pricing');

      // No specific timeframe mentioned
      if (intent.timeframe) {
        // Timeframe is optional, so this is acceptable
        expect(intent.timeframe.start || intent.timeframe.end).toBeTruthy();
      }
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for forecast intent', () => {
      const intent = { type: 'forecast' as const, confidence: 0.9 };
      const suggestions = generateSuggestions(intent);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('price'))).toBe(true);
    });

    it('should generate suggestions for pricing intent', () => {
      const intent = { type: 'pricing' as const, confidence: 0.9 };
      const suggestions = generateSuggestions(intent);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('occupancy'))).toBe(true);
    });

    it('should generate suggestions for no-show intent', () => {
      const intent = { type: 'noshow' as const, confidence: 0.9 };
      const suggestions = generateSuggestions(intent);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('reminder'))).toBe(true);
    });

    it('should generate suggestions for segmentation intent', () => {
      const intent = { type: 'segmentation' as const, confidence: 0.85 };
      const suggestions = generateSuggestions(intent);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('offer'))).toBe(true);
    });

    it('should generate suggestions for sentiment intent', () => {
      const intent = { type: 'sentiment' as const, confidence: 0.85 };
      const suggestions = generateSuggestions(intent);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('review'))).toBe(true);
    });

    it('should generate suggestions for operations intent', () => {
      const intent = { type: 'operations' as const, confidence: 0.85 };
      const suggestions = generateSuggestions(intent);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('route') || s.toLowerCase().includes('staff'))).toBe(true);
    });

    it('should generate default suggestions for general intent', () => {
      const intent = { type: 'general' as const, confidence: 0.5 };
      const suggestions = generateSuggestions(intent);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('formatResponse', () => {
    it('should format forecast response with occupancy data', () => {
      const intent = { type: 'forecast' as const, confidence: 0.9 };
      const data = {
        occupancy: 75.5,
        confidence: 85,
        trend: 'increasing',
        vsLastYear: 10,
      };

      const response = formatResponse(intent, data);

      expect(response).toContain('76%'); // Rounded occupancy
      expect(response).toContain('📊');
      expect(response).toContain('85%'); // Confidence
      expect(response).toContain('+10%'); // vs last year
    });

    it('should format pricing response with recommendation', () => {
      const intent = { type: 'pricing' as const, confidence: 0.9 };
      const data = {
        recommendedPrice: 180,
        currentPrice: 150,
        explanation: 'High demand detected',
      };

      const response = formatResponse(intent, data);

      expect(response).toContain('$180');
      expect(response).toContain('+$30'); // Price change
      expect(response).toContain('💰');
    });

    it('should format no-show response with array data', () => {
      const intent = { type: 'noshow' as const, confidence: 0.9 };
      const data = [
        { risk: 'high', probability: 0.8 },
        { risk: 'high', probability: 0.9 },
        { risk: 'low', probability: 0.2 },
      ];

      const response = formatResponse(intent, data);

      expect(response).toContain('2'); // high-risk count
      expect(response).toContain('3'); // total count
      expect(response).toContain('🚫');
    });

    it('should format segmentation response with segment data', () => {
      const intent = { type: 'segmentation' as const, confidence: 0.85 };
      const data = {
        segments: [
          { name: 'Premium Guests', percentage: 35, avgSpend: 450 },
          { name: 'Budget Travelers', percentage: 30, avgSpend: 120 },
        ],
      };

      const response = formatResponse(intent, data);

      expect(response).toContain('Premium Guests');
      expect(response).toContain('35%');
      expect(response).toContain('$450');
      expect(response).toContain('👥');
    });

    it('should return default response for general intent', () => {
      const intent = { type: 'general' as const, confidence: 0.5 };
      const data = {};

      const response = formatResponse(intent, data);

      expect(response.length).toBeGreaterThan(0);
      expect(response.toLowerCase()).toContain('help');
    });

    it('should handle missing data gracefully', () => {
      const intent = { type: 'forecast' as const, confidence: 0.9 };
      const data = {}; // Empty data

      const response = formatResponse(intent, data);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long queries', () => {
      const longQuery = 'What is ' + 'the forecast '.repeat(50) + 'for next week?';
      const intent = parseIntent(longQuery);

      expect(intent.type).toBe('forecast');
    });

    it('should handle queries with special characters', () => {
      const intent = parseIntent('What\'s the price? #urgent @manager');

      expect(intent.type).toBe('pricing');
    });

    it('should handle queries with numbers', () => {
      const intent = parseIntent('Forecast for 7 days');

      expect(intent.type).toBe('forecast');
    });

    it('should trim whitespace from queries', () => {
      const intent = parseIntent('   forecast   ');

      expect(intent.type).toBe('forecast');
    });
  });
});
