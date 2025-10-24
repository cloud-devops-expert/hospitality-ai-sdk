/**
 * BERT Sentiment Analyzer
 *
 * Battle-tested implementation using nlptown/bert-base-multilingual-uncased-sentiment
 * from Hugging Face via @xenova/transformers
 *
 * Features:
 * - 6 languages supported (English, Dutch, German, French, Spanish, Italian)
 * - 1-5 star sentiment classification
 * - 85-90% accuracy on product reviews
 * - CPU-only, ~50ms inference time
 * - $0 cost (runs locally)
 *
 * Use Case: Analyze guest reviews to identify satisfaction levels
 */

import { pipeline, Pipeline } from '@xenova/transformers';

export interface SentimentResult {
  label: string; // '1 star', '2 stars', '3 stars', '4 stars', '5 stars'
  score: number; // Confidence (0-1)
  stars: number; // Numeric rating (1-5)
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
}

export interface SentimentAnalysisResult {
  text: string;
  result: SentimentResult;
  executionTimeMs: number;
}

export class BERTSentimentAnalyzer {
  private pipeline: Pipeline | null = null;
  private readonly modelName = 'Xenova/nlptown-bert-base-multilingual-uncased-sentiment';

  /**
   * Initialize the BERT sentiment model
   * First run will download the model (~100MB), subsequent runs use cache
   */
  async initialize(): Promise<void> {
    if (this.pipeline) {
      return; // Already initialized
    }

    console.log('Initializing BERT sentiment model...');
    const startTime = performance.now();

    this.pipeline = await pipeline('sentiment-analysis', this.modelName);

    const endTime = performance.now();
    console.log(`BERT model loaded in ${Math.round(endTime - startTime)}ms`);
  }

  /**
   * Analyze sentiment of a single text
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    if (!this.pipeline) {
      await this.initialize();
    }

    const startTime = performance.now();

    // Run inference
    const result = await this.pipeline!(text);

    const endTime = performance.now();

    // Parse result
    const parsed = this.parseResult(result);

    return {
      text,
      result: parsed,
      executionTimeMs: endTime - startTime,
    };
  }

  /**
   * Batch analyze multiple texts for better performance
   */
  async analyzeBatch(texts: string[]): Promise<SentimentAnalysisResult[]> {
    if (!this.pipeline) {
      await this.initialize();
    }

    const startTime = performance.now();

    // Run batch inference
    const results = await this.pipeline!(texts);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Parse results
    return texts.map((text, i) => ({
      text,
      result: this.parseResult(Array.isArray(results) ? results[i] : results),
      executionTimeMs: totalTime / texts.length, // Average time per text
    }));
  }

  /**
   * Parse raw model output into structured result
   */
  private parseResult(rawResult: any): SentimentResult {
    const label = rawResult.label || rawResult[0]?.label;
    const score = rawResult.score || rawResult[0]?.score;

    // Extract star rating from label (e.g., '5 stars' -> 5)
    const stars = parseInt(label.split(' ')[0]);

    // Map stars to sentiment category
    let sentiment: SentimentResult['sentiment'];
    if (stars === 1) sentiment = 'very_negative';
    else if (stars === 2) sentiment = 'negative';
    else if (stars === 3) sentiment = 'neutral';
    else if (stars === 4) sentiment = 'positive';
    else sentiment = 'very_positive';

    return {
      label,
      score,
      stars,
      sentiment,
    };
  }

  /**
   * Aggregate sentiment analysis for multiple reviews
   */
  async analyzeReviews(reviews: string[]): Promise<{
    reviews: SentimentAnalysisResult[];
    summary: {
      averageStars: number;
      sentimentDistribution: Record<string, number>;
      totalReviews: number;
      positivePercentage: number;
      negativePercentage: number;
    };
  }> {
    const results = await this.analyzeBatch(reviews);

    // Calculate statistics
    const totalStars = results.reduce((sum, r) => sum + r.result.stars, 0);
    const averageStars = totalStars / results.length;

    const distribution: Record<string, number> = {
      very_negative: 0,
      negative: 0,
      neutral: 0,
      positive: 0,
      very_positive: 0,
    };

    results.forEach((r) => {
      distribution[r.result.sentiment]++;
    });

    const positive = distribution.positive + distribution.very_positive;
    const negative = distribution.very_negative + distribution.negative;

    return {
      reviews: results,
      summary: {
        averageStars: Math.round(averageStars * 10) / 10,
        sentimentDistribution: distribution,
        totalReviews: results.length,
        positivePercentage: Math.round((positive / results.length) * 100),
        negativePercentage: Math.round((negative / results.length) * 100),
      },
    };
  }
}
