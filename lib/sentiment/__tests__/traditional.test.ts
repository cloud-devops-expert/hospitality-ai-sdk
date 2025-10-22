import { analyzeTraditional, shouldEscalateToAI } from '../traditional';

describe('Traditional Sentiment Analysis', () => {
  describe('analyzeTraditional', () => {
    describe('Positive Sentiment', () => {
      it('should detect positive sentiment in simple text', () => {
        const result = analyzeTraditional('The hotel was excellent and the staff was wonderful');

        expect(result.sentiment).toBe('positive');
        expect(result.score).toBeGreaterThan(0);
        expect(result.keywords).toContain('excellent');
        expect(result.keywords).toContain('wonderful');
        expect(result.method).toBe('traditional');
      });

      it('should detect strongly positive sentiment', () => {
        const result = analyzeTraditional(
          'Absolutely amazing! The room was perfect, staff was fantastic, and everything was beautiful. Best hotel ever!'
        );

        expect(result.sentiment).toBe('positive');
        expect(result.score).toBeGreaterThan(0.5);
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should handle intensifiers for positive keywords', () => {
        const withIntensifier = analyzeTraditional('The room was very clean and very comfortable');
        const withoutIntensifier = analyzeTraditional('The room was clean and comfortable');

        expect(withIntensifier.score).toBeGreaterThan(withoutIntensifier.score);
      });
    });

    describe('Negative Sentiment', () => {
      it('should detect negative sentiment in simple text', () => {
        const result = analyzeTraditional('The room was dirty and the staff was rude');

        expect(result.sentiment).toBe('negative');
        expect(result.score).toBeLessThan(0);
        expect(result.keywords).toContain('dirty');
        expect(result.keywords).toContain('rude');
      });

      it('should detect strongly negative sentiment', () => {
        const result = analyzeTraditional(
          'Terrible experience! The room was awful, staff was horrible, everything was broken. Worst hotel ever!'
        );

        expect(result.sentiment).toBe('negative');
        expect(result.score).toBeLessThan(-0.5);
        expect(result.confidence).toBeGreaterThan(0.3);
      });

      it('should handle intensifiers for negative keywords', () => {
        const withIntensifier = analyzeTraditional('The room was very dirty and very noisy');
        const withoutIntensifier = analyzeTraditional('The room was dirty and noisy');

        expect(withIntensifier.score).toBeLessThan(withoutIntensifier.score);
      });
    });

    describe('Neutral Sentiment', () => {
      it('should detect neutral sentiment when no keywords present', () => {
        const result = analyzeTraditional('The hotel is located on Main Street');

        expect(result.sentiment).toBe('neutral');
        expect(result.score).toBeCloseTo(0, 1);
        expect(result.keywords).toHaveLength(0);
      });

      it('should detect neutral sentiment when positive and negative balance', () => {
        const result = analyzeTraditional('The room was clean but the service was poor');

        expect(result.sentiment).toBe('neutral');
        expect(Math.abs(result.score)).toBeLessThan(0.3);
      });
    });

    describe('Negation Handling', () => {
      it('should handle negation of positive keywords', () => {
        const positive = analyzeTraditional('The room was clean');
        const negated = analyzeTraditional('The room was not clean');

        expect(positive.score).toBeGreaterThan(0);
        expect(negated.score).toBeLessThan(0);
      });

      it('should handle negation of negative keywords', () => {
        const negative = analyzeTraditional('The room was dirty');
        const negated = analyzeTraditional('The room was not dirty');

        expect(negative.score).toBeLessThan(0);
        expect(negated.score).toBeGreaterThan(0);
      });

      it('should handle multiple negations', () => {
        const result = analyzeTraditional('not bad, not terrible, not awful');

        expect(result.score).toBeGreaterThan(0);
      });
    });

    describe('Confidence Scoring', () => {
      it('should have high confidence with many keywords', () => {
        const result = analyzeTraditional(
          'excellent amazing wonderful fantastic great perfect best'
        );

        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('should have low confidence with few keywords', () => {
        const result = analyzeTraditional(
          'The hotel has a lobby with chairs and a desk and some windows'
        );

        expect(result.confidence).toBeLessThan(0.3);
      });

      it('should have medium confidence with some keywords', () => {
        const result = analyzeTraditional('The room was clean and comfortable');

        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });

    describe('Score Normalization', () => {
      it('should normalize score to -1 to 1 range', () => {
        const veryPositive = analyzeTraditional(
          'excellent amazing wonderful fantastic great perfect best outstanding superb beautiful'
        );
        const veryNegative = analyzeTraditional(
          'terrible awful horrible worst bad poor disappointing dirty rude unfriendly'
        );

        expect(veryPositive.score).toBeLessThanOrEqual(1);
        expect(veryPositive.score).toBeGreaterThanOrEqual(-1);
        expect(veryNegative.score).toBeLessThanOrEqual(1);
        expect(veryNegative.score).toBeGreaterThanOrEqual(-1);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        const result = analyzeTraditional('');

        expect(result.sentiment).toBe('neutral');
        expect(result.score).toBe(0);
        expect(result.keywords).toHaveLength(0);
        expect(result.confidence).toBe(0);
      });

      it('should handle single word positive', () => {
        const result = analyzeTraditional('excellent');

        expect(result.sentiment).toBe('positive');
        expect(result.keywords).toContain('excellent');
      });

      it('should handle single word negative', () => {
        const result = analyzeTraditional('terrible');

        expect(result.sentiment).toBe('negative');
        expect(result.keywords).toContain('terrible');
      });

      it('should handle text with special characters', () => {
        const result = analyzeTraditional('Excellent!!! Amazing... Great??? Perfect!!!');

        expect(result.sentiment).toBe('positive');
        expect(result.keywords.length).toBeGreaterThan(0);
      });

      it('should handle mixed case text', () => {
        const result = analyzeTraditional('EXCELLENT Amazing WoNdErFuL');

        expect(result.sentiment).toBe('positive');
        expect(result.keywords).toContain('excellent');
        expect(result.keywords).toContain('amazing');
        expect(result.keywords).toContain('wonderful');
      });

      it('should handle text with numbers', () => {
        const result = analyzeTraditional('Room 123 was excellent on floor 5');

        expect(result.sentiment).toBe('positive');
        expect(result.keywords).toContain('excellent');
      });
    });

    describe('Real Hotel Review Examples', () => {
      it('should correctly analyze positive hotel review', () => {
        const result = analyzeTraditional(
          'We had a wonderful stay! The room was clean and comfortable. Staff was very friendly and helpful. The location was perfect. Highly recommend this hotel!'
        );

        expect(result.sentiment).toBe('positive');
        expect(result.score).toBeGreaterThan(0.3);
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should correctly analyze negative hotel review', () => {
        const result = analyzeTraditional(
          'Terrible experience. The room was dirty and smelled bad. Staff was rude and unhelpful. Very noisy at night. Would never recommend.'
        );

        expect(result.sentiment).toBe('negative');
        expect(result.score).toBeLessThan(-0.3);
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should correctly analyze mixed hotel review', () => {
        const result = analyzeTraditional(
          'The location was great and the room was clean, but the service was poor and the price was too expensive.'
        );

        expect(result.sentiment).toBe('neutral');
        expect(Math.abs(result.score)).toBeLessThan(0.3);
      });
    });
  });

  describe('shouldEscalateToAI', () => {
    it('should escalate when confidence is low', () => {
      const lowConfidenceResult = {
        score: 0.1,
        sentiment: 'positive' as const,
        confidence: 0.2,
        keywords: ['good'],
        method: 'traditional' as const,
      };

      expect(shouldEscalateToAI(lowConfidenceResult)).toBe(true);
    });

    it('should escalate when sentiment is neutral', () => {
      const neutralResult = {
        score: 0.05,
        sentiment: 'neutral' as const,
        confidence: 0.5,
        keywords: [],
        method: 'traditional' as const,
      };

      expect(shouldEscalateToAI(neutralResult)).toBe(true);
    });

    it('should not escalate when confident and clear sentiment', () => {
      const confidentPositive = {
        score: 0.7,
        sentiment: 'positive' as const,
        confidence: 0.8,
        keywords: ['excellent', 'wonderful', 'amazing'],
        method: 'traditional' as const,
      };

      expect(shouldEscalateToAI(confidentPositive)).toBe(false);
    });

    it('should not escalate for confident negative sentiment', () => {
      const confidentNegative = {
        score: -0.7,
        sentiment: 'negative' as const,
        confidence: 0.8,
        keywords: ['terrible', 'awful', 'horrible'],
        method: 'traditional' as const,
      };

      expect(shouldEscalateToAI(confidentNegative)).toBe(false);
    });

    it('should use 0.3 confidence threshold', () => {
      const justBelowThreshold = {
        score: 0.5,
        sentiment: 'positive' as const,
        confidence: 0.29,
        keywords: ['good'],
        method: 'traditional' as const,
      };

      const justAboveThreshold = {
        score: 0.5,
        sentiment: 'positive' as const,
        confidence: 0.31,
        keywords: ['good', 'nice'],
        method: 'traditional' as const,
      };

      expect(shouldEscalateToAI(justBelowThreshold)).toBe(true);
      expect(shouldEscalateToAI(justAboveThreshold)).toBe(false);
    });
  });
});
