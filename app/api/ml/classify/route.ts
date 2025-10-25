/**
 * Zero-Shot Classification API Route
 *
 * Server-side ML inference using Transformers.js
 * Sharp works natively on Node.js server
 */

import { NextResponse } from 'next/server';
import { classifyText } from '@/lib/ml/nlp/zero-shot-classifier';

export async function POST(request: Request) {
  try {
    const { text, labels } = await request.json();

    if (!text || !labels || !Array.isArray(labels)) {
      return NextResponse.json(
        { error: 'Invalid request. Requires text and labels array.' },
        { status: 400 }
      );
    }

    // Run classification on server
    const result = await classifyText(text, labels);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ML API] Classification error:', error);
    return NextResponse.json(
      { error: error.message || 'Classification failed' },
      { status: 500 }
    );
  }
}

// Enable edge runtime for faster cold starts (optional)
// export const runtime = 'edge';
