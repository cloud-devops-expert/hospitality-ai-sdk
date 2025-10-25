/**
 * Semantic Search API Route
 *
 * Server-side ML inference using Transformers.js (MiniLM)
 * Handles semantic search using embeddings
 */

import { NextResponse } from 'next/server';
import { hotelFAQs } from '@/lib/ml/nlp/semantic-search-constants';

// Cosine similarity helper
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

// Import semantic search function (will run on server)
async function semanticSearchServer(
  query: string,
  documents: string[],
  topK: number = 5,
  useHotelFAQs: boolean = false
): Promise<Array<{
  text?: string;
  similarity: number;
  index: number;
  question?: string;
  answer?: string;
  id?: number;
}>> {
  try {
    // Dynamically import Transformers.js on server
    const { pipeline } = await import('@xenova/transformers');

    // Load embedding model
    const embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );

    // Generate query embedding
    const queryOutput = await embedder(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);

    let finalDocuments = documents;
    if (useHotelFAQs) {
      // Use hotel FAQs as documents
      finalDocuments = hotelFAQs.map((faq) => `${faq.question} ${faq.answer}`);
    }

    // Generate document embeddings
    const results: Array<{
      text?: string;
      similarity: number;
      index: number;
      question?: string;
      answer?: string;
      id?: number;
    }> = [];
    for (let i = 0; i < finalDocuments.length; i++) {
      const docOutput = await embedder(finalDocuments[i], { pooling: 'mean', normalize: true });
      const docEmbedding = Array.from(docOutput.data);
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);

      if (useHotelFAQs) {
        results.push({
          ...hotelFAQs[i],
          similarity,
          index: i,
        });
      } else {
        results.push({
          text: finalDocuments[i],
          similarity,
          index: i,
        });
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);

    // Return top K results
    return results.slice(0, topK);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Semantic search error:', error);
    throw new Error(`Semantic search failed: ${errorMessage}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, documents, topK, useHotelFAQs } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Invalid request. Requires query.' },
        { status: 400 }
      );
    }

    if (!useHotelFAQs && (!documents || documents.length === 0)) {
      return NextResponse.json(
        { error: 'Invalid request. Requires documents when not using hotel FAQs.' },
        { status: 400 }
      );
    }

    // Run semantic search on server
    const results = await semanticSearchServer(
      query,
      documents || [],
      topK || 5,
      useHotelFAQs
    );

    return NextResponse.json({ results });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Semantic search failed';
    console.error('[ML API] Semantic search error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
