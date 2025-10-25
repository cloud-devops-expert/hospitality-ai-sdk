/**
 * Food Recognition API Route
 *
 * Server-side ML inference using Transformers.js
 * ViT models work natively on Node.js server
 */

import { NextResponse } from 'next/server';
import { recognizeFood, FoodRecognitionInput } from '@/lib/vision/food-recognition';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageData, imageId, location } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Invalid request. Requires imageData.' },
        { status: 400 }
      );
    }

    // Create input
    const input: FoodRecognitionInput = {
      imageData,
      imageId: imageId || `demo-${Date.now()}`,
      location: location || 'Restaurant Kitchen',
      timestamp: new Date(),
    };

    // Run recognition on server
    const result = await recognizeFood(input);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ML API] Food recognition error:', error);
    return NextResponse.json(
      { error: error.message || 'Food recognition failed' },
      { status: 500 }
    );
  }
}

// Enable edge runtime for faster cold starts (optional)
// export const runtime = 'edge';
