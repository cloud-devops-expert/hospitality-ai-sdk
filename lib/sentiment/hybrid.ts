/**
 * Hybrid Sentiment Analysis
 * Combines traditional and AI approaches
 */

import { analyzeTraditional, shouldEscalateToAI, SentimentResult } from './traditional';
import { analyzeWithAI } from './ai';

export interface HybridAnalysisResult extends SentimentResult {
  usedAI: boolean;
  traditionalResult?: SentimentResult;
  processingTime: number;
}

export async function analyzeHybrid(
  text: string,
  forceAI: boolean = false
): Promise<HybridAnalysisResult> {
  const startTime = Date.now();

  // Step 1: Always try traditional approach first
  const traditionalResult = analyzeTraditional(text);

  // Step 2: Decide if we need AI
  const needsAI = forceAI || shouldEscalateToAI(traditionalResult);

  if (!needsAI) {
    return {
      ...traditionalResult,
      usedAI: false,
      processingTime: Date.now() - startTime
    };
  }

  // Step 3: Use AI for complex cases
  try {
    const aiResult = await analyzeWithAI(text);
    return {
      ...aiResult,
      usedAI: true,
      traditionalResult,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    // Fallback to traditional if AI fails
    return {
      ...traditionalResult,
      usedAI: false,
      processingTime: Date.now() - startTime
    };
  }
}

export function batchAnalyze(texts: string[]): Promise<HybridAnalysisResult[]> {
  return Promise.all(texts.map(text => analyzeHybrid(text)));
}
