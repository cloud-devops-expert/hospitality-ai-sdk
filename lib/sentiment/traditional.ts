/**
 * Traditional Sentiment Analysis
 * Cost-effective keyword-based approach
 */

export interface SentimentResult {
  score: number; // -1 to 1
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 to 1
  keywords: string[];
  method: 'traditional' | 'ai' | 'browser-ml';
  processingTime?: number;
}

const POSITIVE_KEYWORDS = [
  'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'love', 'loved',
  'perfect', 'best', 'awesome', 'outstanding', 'superb', 'beautiful',
  'comfortable', 'clean', 'friendly', 'helpful', 'recommend', 'enjoy',
  'pleasant', 'nice', 'good', 'happy', 'satisfied', 'impressed'
];

const NEGATIVE_KEYWORDS = [
  'terrible', 'awful', 'horrible', 'worst', 'bad', 'poor', 'disappointing',
  'disappointed', 'dirty', 'rude', 'unfriendly', 'uncomfortable', 'noisy',
  'broken', 'problem', 'issue', 'complaint', 'never', 'avoid', 'waste',
  'overpriced', 'expensive', 'small', 'outdated', 'old', 'smell'
];

const INTENSIFIERS = ['very', 'extremely', 'absolutely', 'really', 'so', 'too'];
const NEGATIONS = ['not', 'no', 'never', 'neither', 'nobody', 'nothing'];

export function analyzeTraditional(text: string): SentimentResult {
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  const foundKeywords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';

    // Check for negation
    const isNegated = NEGATIONS.includes(prevWord);

    // Check for intensifier
    const hasIntensifier = INTENSIFIERS.includes(prevWord);
    const multiplier = hasIntensifier ? 1.5 : 1;

    if (POSITIVE_KEYWORDS.includes(word)) {
      foundKeywords.push(word);
      score += isNegated ? -0.5 * multiplier : 1 * multiplier;
    } else if (NEGATIVE_KEYWORDS.includes(word)) {
      foundKeywords.push(word);
      score += isNegated ? 0.5 * multiplier : -1 * multiplier;
    }
  }

  // Normalize score to -1 to 1 range
  const maxPossibleScore = words.length * 1.5; // worst case: all words are intensified keywords
  const normalizedScore = maxPossibleScore > 0
    ? Math.max(-1, Math.min(1, score / (maxPossibleScore * 0.3)))
    : 0;

  // Determine sentiment
  let sentiment: 'positive' | 'negative' | 'neutral';
  if (normalizedScore > 0.2) sentiment = 'positive';
  else if (normalizedScore < -0.2) sentiment = 'negative';
  else sentiment = 'neutral';

  // Calculate confidence based on keyword density
  const keywordDensity = foundKeywords.length / Math.max(words.length, 1);
  const confidence = Math.min(1, keywordDensity * 5); // Scale up density

  return {
    score: normalizedScore,
    sentiment,
    confidence,
    keywords: foundKeywords,
    method: 'traditional'
  };
}

export function shouldEscalateToAI(result: SentimentResult): boolean {
  // Escalate to AI if confidence is low or sentiment is unclear
  return result.confidence < 0.3 || result.sentiment === 'neutral';
}
