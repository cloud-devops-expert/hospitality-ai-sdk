/**
 * Semantic Search with Embeddings
 *
 * Find semantically similar text using sentence embeddings
 * Uses sentence-transformers/all-MiniLM-L6-v2 via Transformers.js
 *
 * Business Value:
 * - Find similar guest queries/complaints
 * - Semantic FAQ search
 * - Knowledge base search
 * - $0 cost (runs locally)
 * - Only 80MB model (tiny!)
 *
 * Use Cases:
 * - Smart FAQ search
 * - Similar complaint detection
 * - Knowledge base retrieval
 * - Duplicate query detection
 */

import { pipeline, cos_sim } from '@xenova/transformers';

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

let embedder: any = null;

/**
 * Initialize the embedding model
 */
async function initializeEmbedder() {
  if (embedder) return embedder;

  console.log('Loading embedding model...');
  const startTime = performance.now();

  // Using MiniLM (only 80MB, perfect for browser!)
  embedder = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );

  const loadTime = Math.round(performance.now() - startTime);
  console.log(`Embedding model loaded in ${loadTime}ms`);

  return embedder;
}

/**
 * Generate embedding for a text
 *
 * @example
 * ```typescript
 * const embedding = await generateEmbedding("How do I check out?");
 * console.log(embedding.dimension); // 384
 * ```
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const model = await initializeEmbedder();

  // Generate embedding
  const output = await model(text, { pooling: 'mean', normalize: true });

  // Convert to array
  const embedding = Array.from(output.data);

  return {
    text,
    embedding,
    dimension: embedding.length,
  };
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  for (const text of texts) {
    const result = await generateEmbedding(text);
    results.push(result);
  }

  return results;
}

/**
 * Calculate cosine similarity between two texts
 */
export async function calculateSimilarity(text1: string, text2: string): Promise<number> {
  const embedding1 = await generateEmbedding(text1);
  const embedding2 = await generateEmbedding(text2);

  // Calculate cosine similarity
  const similarity = cosineSimilarity(embedding1.embedding, embedding2.embedding);

  return similarity;
}

/**
 * Search for most similar documents to a query
 *
 * @example
 * ```typescript
 * const results = await semanticSearch(
 *   "How do I cancel?",
 *   ["Cancellation policy...", "Check-in time..."],
 *   3
 * );
 * console.log(results[0].text); // Most similar document
 * console.log(results[0].similarity); // 0.92
 * ```
 */
export async function semanticSearch(
  query: string,
  documents: string[],
  topK: number = 5
): Promise<SemanticSearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Generate document embeddings
  const docEmbeddings = await generateEmbeddings(documents);

  // Calculate similarities
  const results: SemanticSearchResult[] = docEmbeddings.map((doc, index) => ({
    text: doc.text,
    similarity: cosineSimilarity(queryEmbedding.embedding, doc.embedding),
    index,
  }));

  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);

  // Return top K results
  return results.slice(0, topK);
}

/**
 * Batch semantic search
 */
export async function batchSemanticSearch(
  queries: SearchQuery[]
): Promise<SemanticSearchResult[][]> {
  const results: SemanticSearchResult[][] = [];

  for (const query of queries) {
    const result = await semanticSearch(
      query.query,
      query.documents,
      query.topK || 5
    );
    results.push(result);
  }

  return results;
}

/**
 * Find duplicate/similar queries
 */
export async function findDuplicateQueries(
  queries: string[],
  threshold: number = 0.8
): Promise<Array<{ query1: string; query2: string; similarity: number }>> {
  const duplicates: Array<{ query1: string; query2: string; similarity: number }> = [];

  // Generate embeddings for all queries
  const embeddings = await generateEmbeddings(queries);

  // Compare each pair
  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const similarity = cosineSimilarity(
        embeddings[i].embedding,
        embeddings[j].embedding
      );

      if (similarity >= threshold) {
        duplicates.push({
          query1: embeddings[i].text,
          query2: embeddings[j].text,
          similarity,
        });
      }
    }
  }

  return duplicates;
}

/**
 * Helper: Cosine similarity calculation
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
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
 * Search hotel FAQ by semantic similarity
 */
export async function searchHotelFAQ(query: string, topK: number = 3) {
  const faqTexts = hotelFAQs.map(
    (faq) => `${faq.question} ${faq.answer}`
  );

  const results = await semanticSearch(query, faqTexts, topK);

  return results.map((result) => ({
    ...hotelFAQs[result.index],
    similarity: result.similarity,
  }));
}

/**
 * Clear cached model
 */
export function clearEmbedderCache() {
  embedder = null;
}
