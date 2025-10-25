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

    // Run classification on server with multi-label and hypothesis template
    // Multi-label allows text to be in multiple categories (e.g., complaint + housekeeping)
    // Hypothesis template improves accuracy by providing context
    const result = await classifyText(
      text,
      labels,
      true, // Enable multi-label classification
      'This guest message is about {}.' // Better hypothesis template
    );

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
