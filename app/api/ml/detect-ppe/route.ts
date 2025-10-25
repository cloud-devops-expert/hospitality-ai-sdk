/**
 * PPE Detection API Route
 *
 * Server-side ML inference using TensorFlow.js/Transformers.js
 * Object detection models work natively on Node.js server
 */

import { NextResponse } from 'next/server';
import { detectPPE, PPEDetectionInput } from '@/lib/vision/ppe-detection';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageData, scenario, imageId, location } = body;

    if (!imageData || !scenario) {
      return NextResponse.json(
        { error: 'Invalid request. Requires imageData and scenario.' },
        { status: 400 }
      );
    }

    // Create input
    const input: PPEDetectionInput = {
      imageData,
      scenario: scenario as 'kitchen' | 'medical' | 'maintenance' | 'housekeeping',
      imageId: imageId || `demo-${Date.now()}`,
      location: location || 'Facility',
      timestamp: new Date(),
    };

    // Run detection on server
    const result = await detectPPE(input);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ML API] PPE detection error:', error);
    return NextResponse.json(
      { error: error.message || 'PPE detection failed' },
      { status: 500 }
    );
  }
}

// Enable edge runtime for faster cold starts (optional)
// export const runtime = 'edge';
