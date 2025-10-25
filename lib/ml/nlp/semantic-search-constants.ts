/**
 * Semantic Search Constants
 *
 * Static data for semantic search UI (FAQs, types, helpers)
 * Extracted from semantic-search to avoid bundling Transformers.js in browser
 */

export interface SemanticSearchResult {
  text: string;
  similarity: number;
  index: number;
}

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  dimension: number;
}

export interface SearchQuery {
  query: string;
  documents: string[];
  topK?: number;
}

/**
 * Hotel FAQ knowledge base
 */
export const hotelFAQs = [
  {
    id: 1,
    question: 'What time is check-in?',
    answer: 'Check-in time is 3:00 PM. Early check-in available based on availability.',
  },
  {
    id: 2,
    question: 'What time is check-out?',
    answer: 'Check-out time is 11:00 AM. Late check-out available for $50 until 2 PM.',
  },
  {
    id: 3,
    question: 'Do you allow pets?',
    answer: 'Yes, we welcome pets under 50 lbs. Pet fee is $75 per night.',
  },
  {
    id: 4,
    question: 'Is breakfast included?',
    answer: 'Breakfast is included for all room types. Served 6:30-10:30 AM daily.',
  },
  {
    id: 5,
    question: 'Do you have free WiFi?',
    answer: 'Yes, complimentary high-speed WiFi throughout the property.',
  },
  {
    id: 6,
    question: 'Is parking available?',
    answer: 'Self-parking $35/day, valet parking $55/day. EV charging complimentary.',
  },
  {
    id: 7,
    question: 'Do you have a pool?',
    answer: 'Yes, heated pool open 6 AM to 10 PM daily.',
  },
  {
    id: 8,
    question: 'How do I cancel my reservation?',
    answer: 'Free cancellation up to 48 hours before arrival. Cancel via website or call front desk.',
  },
  {
    id: 9,
    question: 'Do you offer airport shuttle?',
    answer: 'Complimentary airport shuttle runs hourly from 6 AM to 10 PM.',
  },
  {
    id: 10,
    question: 'Is there a fitness center?',
    answer: 'Yes, 24/7 fitness center with cardio equipment and free weights.',
  },
];

/**
 * Helper function to get similarity color
 */
export function getSimilarityColor(similarity: number): string {
  if (similarity > 0.7) return 'text-green-600 dark:text-green-400';
  if (similarity > 0.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Helper function to get similarity background color
 */
export function getSimilarityBg(similarity: number): string {
  if (similarity > 0.7) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  if (similarity > 0.5) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
  return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
}
