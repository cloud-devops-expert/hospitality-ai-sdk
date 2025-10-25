/**
 * Text Summarization API Route
 *
 * Server-side ML inference using Transformers.js (DistilBART)
 * Handles text summarization for long documents
 */

import { NextResponse } from 'next/server';

// Import summarization function (will run on server)
async function summarizeTextServer(
  text: string,
  maxLength: number = 130,
  minLength: number = 30
): Promise<{
  originalText: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  executionTimeMs: number;
}> {
  const startTime = performance.now();

  try {
    // Dynamically import Transformers.js on server
    const { pipeline } = await import('@xenova/transformers');

    // Load summarization model
    const summarizer = await pipeline(
      'summarization',
      'Xenova/distilbart-cnn-6-6'
    );

    // Run summarization
    const result = await summarizer(text, {
      max_length: maxLength,
      min_length: minLength,
    });

    const executionTimeMs = Math.round(performance.now() - startTime);

    const summary = result[0].summary_text;
    const originalLength = text.length;
    const summaryLength = summary.length;
    const compressionRatio = Math.round(((originalLength - summaryLength) / originalLength) * 100);

    return {
      originalText: text,
      summary,
      originalLength,
      summaryLength,
      compressionRatio,
      executionTimeMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Summarization error:', error);
    throw new Error(`Summarization failed: ${errorMessage}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, maxLength, minLength } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Invalid request. Requires text.' },
        { status: 400 }
      );
    }

    // Run summarization on server
    const result = await summarizeTextServer(
      text,
      maxLength || 130,
      minLength || 30
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Summarization failed';
    console.error('[ML API] Summarization error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
