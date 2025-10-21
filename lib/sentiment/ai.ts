/**
 * AI-Based Sentiment Analysis
 * Using LLM for complex cases
 */

import { SentimentResult } from './traditional';

export async function analyzeWithAI(text: string): Promise<SentimentResult> {
  try {
    const response = await fetch('/api/sentiment/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    return await response.json();
  } catch (error) {
    // Fallback to neutral if AI fails
    return {
      score: 0,
      sentiment: 'neutral',
      confidence: 0,
      keywords: [],
      method: 'ai'
    };
  }
}
