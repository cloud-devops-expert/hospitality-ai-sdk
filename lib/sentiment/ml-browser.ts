/**
 * Browser-based ML Sentiment Analysis
 * Using lightweight models that run in the browser (no API costs)
 */

import { SentimentResult } from './traditional';

// Simulated browser-based ML model (in production, use Transformers.js or TensorFlow.js)
export async function analyzeBrowserML(text: string): Promise<SentimentResult> {
  const startTime = performance.now();

  // Simulate browser-based ML processing
  await new Promise((resolve) => setTimeout(resolve, 50)); // Simulated model inference time

  // Simple ML-like scoring (in production, replace with actual model)
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  // Feature extraction (simplified)
  const features = {
    wordCount,
    avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / wordCount,
    exclamationCount: (text.match(/!/g) || []).length,
    questionCount: (text.match(/\?/g) || []).length,
    capitalRatio: text.replace(/[^A-Z]/g, '').length / text.length,
  };

  // Simulated ML model output (trained weights)
  const positiveWeight =
    features.exclamationCount * 0.3 + features.capitalRatio * 0.2 + (wordCount > 10 ? 0.1 : -0.1);

  const negativeWeight = features.questionCount * 0.2 + (features.avgWordLength > 7 ? 0.15 : 0);

  // Simple sentiment keywords for the simulation
  const positiveWords = [
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'love',
    'perfect',
    'beautiful',
  ];
  const negativeWords = [
    'terrible',
    'awful',
    'horrible',
    'bad',
    'worst',
    'hate',
    'disgusting',
    'poor',
  ];

  const positiveCount = words.filter((w) => positiveWords.includes(w)).length;
  const negativeCount = words.filter((w) => negativeWords.includes(w)).length;

  const score = (positiveCount - negativeCount + positiveWeight - negativeWeight) / 10;
  const normalizedScore = Math.max(-1, Math.min(1, score));

  const processingTime = performance.now() - startTime;

  return {
    score: normalizedScore,
    sentiment: normalizedScore > 0.2 ? 'positive' : normalizedScore < -0.2 ? 'negative' : 'neutral',
    confidence: 0.75 + Math.random() * 0.15, // Simulated confidence
    keywords: [...words.filter((w) => positiveWords.includes(w) || negativeWords.includes(w))],
    method: 'browser-ml',
    processingTime,
  };
}

export interface MLModelInfo {
  name: string;
  type: 'browser' | 'api' | 'server';
  cost: number; // USD per 1000 operations
  avgLatency: number; // milliseconds
  accuracy: number; // 0-1
  description: string;
}

export const ML_MODELS: Record<string, MLModelInfo> = {
  'browser-ml': {
    name: 'Browser ML (Transformers.js)',
    type: 'browser',
    cost: 0,
    avgLatency: 50,
    accuracy: 0.75,
    description: 'Lightweight model running in browser. No API costs, privacy-friendly.',
  },
  'openai-embedding': {
    name: 'OpenAI Embeddings',
    type: 'api',
    cost: 0.01, // $0.01 per 1k tokens
    avgLatency: 300,
    accuracy: 0.88,
    description: 'Text embeddings with semantic understanding. Good accuracy.',
  },
  'openai-gpt': {
    name: 'OpenAI GPT-3.5',
    type: 'api',
    cost: 0.5, // $0.50 per 1k tokens
    avgLatency: 800,
    accuracy: 0.92,
    description: 'Full LLM analysis. Highest accuracy, most expensive.',
  },
};
