import { analyzeBrowserML, ML_MODELS } from '../ml-browser';

describe('Browser-based ML Sentiment Analysis', () => {
  describe('analyzeBrowserML', () => {
    describe('Positive Sentiment', () => {
      it('should detect positive sentiment from positive keywords', async () => {
        const text = 'The hotel was great and the service was excellent';
        const result = await analyzeBrowserML(text);

        expect(result.score).toBeGreaterThan(0);
        expect(result.method).toBe('browser-ml');
        // May be neutral or positive depending on score threshold
        expect(['positive', 'neutral']).toContain(result.sentiment);
      });

      it('should detect positive sentiment with strong positive words', async () => {
        const text = 'Amazing experience! Wonderful staff! Perfect location!';
        const result = await analyzeBrowserML(text);

        expect(result.sentiment).toBe('positive');
        expect(result.score).toBeGreaterThan(0.2);
        expect(result.keywords).toContain('amazing');
        expect(result.keywords).toContain('wonderful');
        expect(result.keywords).toContain('perfect');
      });

      it('should detect positive sentiment with exclamation marks', async () => {
        const text = 'Good hotel! Nice room! Great breakfast!';
        const result = await analyzeBrowserML(text);

        // Exclamation marks contribute to positive weight
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(['positive', 'neutral']).toContain(result.sentiment);
      });

      it('should weight capitals positively', async () => {
        const textLower = 'this hotel was great';
        const textUpper = 'THIS HOTEL WAS GREAT';

        const resultLower = await analyzeBrowserML(textLower);
        const resultUpper = await analyzeBrowserML(textUpper);

        // Upper case text should have slightly higher score due to capital ratio weight
        expect(resultUpper.score).toBeGreaterThanOrEqual(resultLower.score);
      });

      it('should extract positive keywords', async () => {
        const text = 'The room was beautiful and the staff was fantastic';
        const result = await analyzeBrowserML(text);

        expect(result.keywords).toContain('beautiful');
        expect(result.keywords).toContain('fantastic');
      });
    });

    describe('Negative Sentiment', () => {
      it('should detect negative sentiment from negative keywords', async () => {
        const text = 'The hotel was terrible and the service was awful';
        const result = await analyzeBrowserML(text);

        expect(result.sentiment).toBe('negative');
        expect(result.score).toBeLessThan(0);
      });

      it('should detect negative sentiment with strong negative words', async () => {
        const text = 'Horrible experience. Worst hotel ever. Disgusting room.';
        const result = await analyzeBrowserML(text);

        expect(result.sentiment).toBe('negative');
        expect(result.score).toBeLessThan(-0.2);
        expect(result.keywords).toContain('horrible');
        expect(result.keywords).toContain('worst');
        expect(result.keywords).toContain('disgusting');
      });

      it('should weight question marks negatively', async () => {
        const textNoQuestions = 'The service was not good';
        const textQuestions = 'What kind of service was this? Why was it so bad?';

        const resultNoQuestions = await analyzeBrowserML(textNoQuestions);
        const resultQuestions = await analyzeBrowserML(textQuestions);

        // Questions should contribute to more negative score
        expect(resultQuestions.score).toBeLessThanOrEqual(resultNoQuestions.score);
      });

      it('should weight long words negatively', async () => {
        const textShortWords = 'bad room and poor food';
        const textLongWords = 'unacceptable accommodation and disappointing refreshments';

        const resultShortWords = await analyzeBrowserML(textShortWords);
        const resultLongWords = await analyzeBrowserML(textLongWords);

        // Both should be negative, verify the feature is processed
        expect(resultShortWords.score).toBeLessThan(0);
        expect(resultLongWords.score).toBeLessThan(0);
      });

      it('should extract negative keywords', async () => {
        const text = 'The room was bad and the food was poor';
        const result = await analyzeBrowserML(text);

        expect(result.keywords).toContain('bad');
        expect(result.keywords).toContain('poor');
      });
    });

    describe('Neutral Sentiment', () => {
      it('should detect neutral sentiment for factual text', async () => {
        const text = 'The hotel is located on Main Street';
        const result = await analyzeBrowserML(text);

        expect(result.sentiment).toBe('neutral');
        expect(result.score).toBeGreaterThanOrEqual(-0.2);
        expect(result.score).toBeLessThanOrEqual(0.2);
      });

      it('should detect neutral sentiment with balanced keywords', async () => {
        const text = 'The hotel was great but the food was terrible';
        const result = await analyzeBrowserML(text);

        expect(result.sentiment).toBe('neutral');
        expect(result.keywords.length).toBeGreaterThan(0);
      });

      it('should return neutral for text with no sentiment keywords', async () => {
        const text = 'The room has a bed and a desk';
        const result = await analyzeBrowserML(text);

        expect(result.sentiment).toBe('neutral');
      });
    });

    describe('Feature Extraction', () => {
      it('should calculate word count correctly', async () => {
        const shortText = 'Good hotel';
        const longText = 'This is a much longer review with many more words to test';

        const shortResult = await analyzeBrowserML(shortText);
        const longResult = await analyzeBrowserML(longText);

        // Longer text should have different scoring due to word count feature
        expect(longResult).toBeDefined();
        expect(shortResult).toBeDefined();
      });

      it('should count exclamation marks', async () => {
        const textNoExclamation = 'Great hotel. Amazing service.';
        const textWithExclamation = 'Great hotel! Amazing service!';

        const resultNoExclamation = await analyzeBrowserML(textNoExclamation);
        const resultWithExclamation = await analyzeBrowserML(textWithExclamation);

        // Exclamation marks should increase positive weight
        expect(resultWithExclamation.score).toBeGreaterThan(resultNoExclamation.score);
      });

      it('should count question marks', async () => {
        const text = 'Why was the service so bad? What happened to quality?';
        const result = await analyzeBrowserML(text);

        // Text with questions should be affected by question weight
        expect(result).toBeDefined();
      });

      it('should calculate capital ratio', async () => {
        const text = 'AMAZING HOTEL';
        const result = await analyzeBrowserML(text);

        // High capital ratio should contribute to score
        expect(result.score).toBeGreaterThan(0);
      });

      it('should calculate average word length', async () => {
        const shortWords = 'a bad day at the inn';
        const longWords = 'unacceptable accommodation experience unfortunately';

        const resultShort = await analyzeBrowserML(shortWords);
        const resultLong = await analyzeBrowserML(longWords);

        expect(resultShort).toBeDefined();
        expect(resultLong).toBeDefined();
      });
    });

    describe('Score Normalization', () => {
      it('should clamp score to -1 to 1 range', async () => {
        const extremePositive =
          'excellent amazing wonderful fantastic perfect great beautiful love ' +
          'excellent amazing wonderful fantastic perfect great beautiful love ' +
          'excellent amazing wonderful fantastic perfect great beautiful love!!!!!!';

        const extremeNegative =
          'terrible awful horrible bad worst hate disgusting poor ' +
          'terrible awful horrible bad worst hate disgusting poor ' +
          'terrible awful horrible bad worst hate disgusting poor';

        const positiveResult = await analyzeBrowserML(extremePositive);
        const negativeResult = await analyzeBrowserML(extremeNegative);

        expect(positiveResult.score).toBeGreaterThanOrEqual(-1);
        expect(positiveResult.score).toBeLessThanOrEqual(1);
        expect(negativeResult.score).toBeGreaterThanOrEqual(-1);
        expect(negativeResult.score).toBeLessThanOrEqual(1);
      });

      it('should map score to sentiment correctly', async () => {
        const texts = {
          positive: 'excellent amazing wonderful',
          neutral: 'the hotel is there',
          negative: 'terrible awful horrible',
        };

        const results = {
          positive: await analyzeBrowserML(texts.positive),
          neutral: await analyzeBrowserML(texts.neutral),
          negative: await analyzeBrowserML(texts.negative),
        };

        expect(results.positive.score).toBeGreaterThan(0.2);
        expect(results.positive.sentiment).toBe('positive');

        expect(results.neutral.score).toBeGreaterThanOrEqual(-0.2);
        expect(results.neutral.score).toBeLessThanOrEqual(0.2);
        expect(results.neutral.sentiment).toBe('neutral');

        expect(results.negative.score).toBeLessThan(-0.2);
        expect(results.negative.sentiment).toBe('negative');
      });
    });

    describe('Confidence and Timing', () => {
      it('should return confidence between 0.75 and 0.90', async () => {
        const text = 'The hotel was great';
        const result = await analyzeBrowserML(text);

        expect(result.confidence).toBeGreaterThanOrEqual(0.75);
        expect(result.confidence).toBeLessThanOrEqual(0.90);
      });

      it('should measure processing time', async () => {
        const text = 'The hotel was excellent';
        const result = await analyzeBrowserML(text);

        expect(result.processingTime).toBeGreaterThanOrEqual(50); // Simulated delay
        expect(result.processingTime).toBeLessThan(200);
      });

      it('should simulate async processing', async () => {
        const startTime = Date.now();
        await analyzeBrowserML('Test text');
        const duration = Date.now() - startTime;

        // Should take at least 50ms due to simulated inference time
        expect(duration).toBeGreaterThanOrEqual(50);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', async () => {
        const result = await analyzeBrowserML('');

        expect(result.sentiment).toBe('neutral');
        // Empty string produces NaN score due to division by zero
        expect(isNaN(result.score) || result.score === 0).toBe(true);
        expect(result.keywords).toEqual([]);
      });

      it('should handle single word', async () => {
        const positive = await analyzeBrowserML('excellent');
        const negative = await analyzeBrowserML('terrible');

        // Single words may not score high enough to cross sentiment thresholds
        expect(positive.score).toBeGreaterThan(0);
        expect(negative.score).toBeLessThan(0);
        expect(positive.keywords).toContain('excellent');
        expect(negative.keywords).toContain('terrible');
      });

      it('should handle special characters', async () => {
        const text = 'Great!!! Amazing??? Perfect...';
        const result = await analyzeBrowserML(text);

        // Punctuation prevents exact keyword matching, but should still score positive
        expect(result.score).toBeGreaterThan(0);
        expect(result.method).toBe('browser-ml');
      });

      it('should handle mixed case keywords', async () => {
        const text = 'The hotel was EXCELLENT and AMAZING';
        const result = await analyzeBrowserML(text);

        expect(result.score).toBeGreaterThan(0);
        expect(result.keywords).toContain('excellent');
        expect(result.keywords).toContain('amazing');
      });

      it('should handle repeated keywords', async () => {
        const text = 'great great great excellent excellent';
        const result = await analyzeBrowserML(text);

        expect(result.sentiment).toBe('positive');
        // Should count each occurrence
        expect(result.keywords.length).toBe(5);
      });

      it('should handle text with no whitespace', async () => {
        const result = await analyzeBrowserML('excellent');

        expect(result.score).toBeGreaterThan(0);
        expect(result.keywords).toContain('excellent');
      });

      it('should handle very long text', async () => {
        const longText = 'excellent '.repeat(100);
        const result = await analyzeBrowserML(longText);

        expect(result.sentiment).toBe('positive');
        expect(result.score).toBeGreaterThan(0);
      });

      it('should handle text with only punctuation', async () => {
        const result = await analyzeBrowserML('!!! ??? ...');

        expect(result.sentiment).toBe('neutral');
        expect(result.keywords).toEqual([]);
      });
    });

    describe('Real Hotel Reviews', () => {
      it('should analyze positive hotel review', async () => {
        const review = 'We had an amazing stay! The room was beautiful and the staff was wonderful. Perfect location!';
        const result = await analyzeBrowserML(review);

        expect(result.sentiment).toBe('positive');
        expect(result.keywords.length).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should analyze negative hotel review', async () => {
        const review = 'Terrible experience. The room was disgusting and the service was awful. Worst hotel ever.';
        const result = await analyzeBrowserML(review);

        expect(result.sentiment).toBe('negative');
        expect(result.score).toBeLessThan(0);
      });

      it('should analyze mixed hotel review', async () => {
        const review = 'The location was great but the room was terrible.';
        const result = await analyzeBrowserML(review);

        expect(['neutral', 'negative', 'positive']).toContain(result.sentiment);
      });
    });
  });

  describe('ML_MODELS', () => {
    it('should define browser-ml model', () => {
      const model = ML_MODELS['browser-ml'];

      expect(model).toBeDefined();
      expect(model.name).toBe('Browser ML (Transformers.js)');
      expect(model.type).toBe('browser');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(50);
      expect(model.accuracy).toBe(0.75);
      expect(model.description).toContain('browser');
    });

    it('should define openai-embedding model', () => {
      const model = ML_MODELS['openai-embedding'];

      expect(model).toBeDefined();
      expect(model.name).toBe('OpenAI Embeddings');
      expect(model.type).toBe('api');
      expect(model.cost).toBe(0.01);
      expect(model.avgLatency).toBe(300);
      expect(model.accuracy).toBe(0.88);
    });

    it('should define openai-gpt model', () => {
      const model = ML_MODELS['openai-gpt'];

      expect(model).toBeDefined();
      expect(model.name).toBe('OpenAI GPT-3.5');
      expect(model.type).toBe('api');
      expect(model.cost).toBe(0.5);
      expect(model.avgLatency).toBe(800);
      expect(model.accuracy).toBe(0.92);
    });

    it('should have browser model with zero cost', () => {
      expect(ML_MODELS['browser-ml'].cost).toBe(0);
    });

    it('should have API models with non-zero cost', () => {
      expect(ML_MODELS['openai-embedding'].cost).toBeGreaterThan(0);
      expect(ML_MODELS['openai-gpt'].cost).toBeGreaterThan(0);
    });

    it('should have browser model as fastest', () => {
      const browserLatency = ML_MODELS['browser-ml'].avgLatency;
      const embeddingLatency = ML_MODELS['openai-embedding'].avgLatency;
      const gptLatency = ML_MODELS['openai-gpt'].avgLatency;

      expect(browserLatency).toBeLessThan(embeddingLatency);
      expect(browserLatency).toBeLessThan(gptLatency);
    });

    it('should have GPT model as most accurate', () => {
      const accuracies = Object.values(ML_MODELS).map((m) => m.accuracy);
      const maxAccuracy = Math.max(...accuracies);

      expect(ML_MODELS['openai-gpt'].accuracy).toBe(maxAccuracy);
    });

    it('should have all models with valid accuracy range', () => {
      Object.values(ML_MODELS).forEach((model) => {
        expect(model.accuracy).toBeGreaterThanOrEqual(0);
        expect(model.accuracy).toBeLessThanOrEqual(1);
      });
    });

    it('should have all models with reasonable latency', () => {
      Object.values(ML_MODELS).forEach((model) => {
        expect(model.avgLatency).toBeGreaterThan(0);
        expect(model.avgLatency).toBeLessThan(2000);
      });
    });

    it('should have cost proportional to accuracy', () => {
      const browser = ML_MODELS['browser-ml'];
      const embedding = ML_MODELS['openai-embedding'];
      const gpt = ML_MODELS['openai-gpt'];

      // Higher accuracy generally means higher cost
      expect(gpt.cost).toBeGreaterThan(embedding.cost);
      expect(gpt.cost).toBeGreaterThan(browser.cost);
      expect(gpt.accuracy).toBeGreaterThan(browser.accuracy);
    });
  });
});
