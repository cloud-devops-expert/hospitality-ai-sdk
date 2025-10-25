/**
 * Room Visualization API Route
 *
 * Generate room visualizations with different styles
 * Current: Placeholder images (instant, $0)
 * Future: AI generation optional upgrade
 */

import { NextResponse } from 'next/server';
import {
  generateRoomVisualization,
  generateRoomVariations,
  ROOM_STYLES,
  type RoomVisualizationRequest,
} from '@/lib/ml/vision/room-visualization';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomType,
      style,
      features,
      colorScheme,
      generateVariations,
      variationCount,
    } = body;

    if (!roomType) {
      return NextResponse.json(
        { error: 'Invalid request. Requires roomType.' },
        { status: 400 }
      );
    }

    const vizRequest: RoomVisualizationRequest = {
      roomType,
      style: style || 'modern',
      features: features || [],
      colorScheme,
    };

    // Generate variations or single visualization
    if (generateVariations) {
      const results = generateRoomVariations(vizRequest, variationCount || 3);
      return NextResponse.json({
        variations: results,
        count: results.length,
      });
    } else {
      const result = generateRoomVisualization(vizRequest);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('[ML API] Room visualization error:', error);
    return NextResponse.json(
      { error: error.message || 'Visualization generation failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available styles
export async function GET() {
  return NextResponse.json({
    styles: Object.values(ROOM_STYLES),
    count: Object.keys(ROOM_STYLES).length,
  });
}
