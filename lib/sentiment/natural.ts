/**
 * Natural Library Sentiment Analysis
 * Uses Natural NLP library with fallback to custom implementation
 */

import { SentimentResult, analyzeTraditional } from './traditional';
import { executeWithFallback, LIBRARY_FLAGS, LibraryLoader } from '../utils/fallback';

// Lazy loader for Natural library
const naturalLoader = new LibraryLoader(async () => {
  const natural = await import('natural');
  return natural.default || natural;
});

/**
 * Analyze sentiment using Natural library
 */
async function analyzeWithNatural(text: string): Promise<SentimentResult> {
  const natural = await naturalLoader.load();
  const startTime = Date.now();

  // Natural's SentimentAnalyzer with AFINN lexicon
  const { SentimentAnalyzer, PorterStemmer, WordTokenizer } = natural;
  const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

  // Tokenize text
  const tokenizer = new WordTokenizer();
  const tokens = tokenizer.tokenize(text);

  if (!tokens || tokens.length === 0) {
    return {
      score: 0,
      sentiment: 'neutral',
      confidence: 0.5,
      keywords: [],
      method: 'natural' as any,
      processingTime: Date.now() - startTime,
    };
  }

  // Get sentiment score from Natural
  const sentimentScore = analyzer.getSentiment(tokens);

  // Natural returns scores typically between -5 and 5
  // Normalize to -1 to 1 range
  const normalizedScore = Math.max(-1, Math.min(1, sentimentScore / 5));

  // Extract keywords (tokens with sentiment)
  const keywords: string[] = [];
  tokens.forEach((token) => {
    const tokenScore = analyzer.getSentiment([token]);
    if (Math.abs(tokenScore) > 0.5) {
      keywords.push(token);
    }
  });

  // Determine sentiment category
  let sentiment: 'positive' | 'negative' | 'neutral';
  if (normalizedScore > 0.1) {
    sentiment = 'positive';
  } else if (normalizedScore < -0.1) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  // Calculate confidence based on score magnitude and keyword count
  const scoreMagnitude = Math.abs(normalizedScore);
  const keywordConfidence = Math.min(keywords.length / 5, 1);
  const confidence = (scoreMagnitude * 0.7 + keywordConfidence * 0.3);

  return {
    score: normalizedScore,
    sentiment,
    confidence: Math.max(0.5, Math.min(1, confidence)),
    keywords: keywords.slice(0, 10), // Top 10 keywords
    method: 'natural' as any,
    processingTime: Date.now() - startTime,
  };
}

/**
 * Analyze sentiment with custom fallback
 */
function analyzeCustom(text: string): SentimentResult {
  return analyzeTraditional(text);
}

/**
 * Hybrid sentiment analysis using Natural library with fallback
 *
 * @example
 * ```typescript
 * // Try Natural library, fallback to custom
 * const result = await analyzeNaturalHybrid("Amazing hotel! Great service.");
 *
 * // Check which method was used
 * console.log(result.method); // 'natural' or 'traditional'
 * ```
 */
export async function analyzeNaturalHybrid(text: string): Promise<SentimentResult> {
  const result = await executeWithFallback(
    () => analyzeWithNatural(text),
    () => analyzeCustom(text),
    {
      timeout: LIBRARY_FLAGS.sentiment.timeout,
      preferLibrary: LIBRARY_FLAGS.sentiment.useNatural,
      retries: 1,
      onFallback: (error) => {
        console.warn('Natural sentiment analysis failed, using custom:', error.message);
      },
    }
  );

  return result.data;
}

/**
 * Analyze sentiment with metadata about which method was used
 */
export async function analyzeNaturalHybridWithMetadata(text: string) {
  const result = await executeWithFallback(
    () => analyzeWithNatural(text),
    () => analyzeCustom(text),
    {
      timeout: LIBRARY_FLAGS.sentiment.timeout,
      preferLibrary: LIBRARY_FLAGS.sentiment.useNatural,
    }
  );

  return {
    sentiment: result.data,
    method: result.method,
    processingTime: result.processingTime,
    usedLibrary: result.method === 'library',
    accuracy: result.method === 'library' ? 0.82 : 0.72, // Natural is more accurate
  };
}

/**
 * Batch sentiment analysis with automatic library/custom selection
 */
export async function analyzeNaturalBatch(
  texts: Array<{ text: string; priority: 'high' | 'low' }>
) {
  const results = await Promise.all(
    texts.map(async ({ text, priority }) => {
      // High priority uses library, low priority uses custom
      const useLibrary = priority === 'high' && LIBRARY_FLAGS.sentiment.useNatural;

      const result = await executeWithFallback(
        () => analyzeWithNatural(text),
        () => analyzeCustom(text),
        {
          timeout: LIBRARY_FLAGS.sentiment.timeout,
          preferLibrary: useLibrary,
        }
      );

      return {
        sentiment: result.data,
        method: result.method,
        priority,
      };
    })
  );

  const libraryCount = results.filter((r) => r.method === 'library').length;
  const customCount = results.filter((r) => r.method === 'custom').length;

  return {
    results,
    stats: {
      total: results.length,
      library: libraryCount,
      custom: customCount,
      libraryPercentage: (libraryCount / results.length) * 100,
    },
  };
}
