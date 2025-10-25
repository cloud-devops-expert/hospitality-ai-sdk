/**
 * Guest Recommendations API Route
 *
 * Generate personalized property recommendations
 * Uses traditional ML (collaborative + content-based filtering)
 * Cost: $0 (no deep learning)
 */

import { NextResponse } from 'next/server';
import {
  generateRecommendations,
  generateSampleData,
  type GuestProfile,
  type Property,
} from '@/lib/ml/recommendations/guest-preferences';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestProfile, useSampleData, topN } = body;

    let guest: GuestProfile;
    let allGuests: GuestProfile[];
    let properties: Property[];

    if (useSampleData) {
      // Use sample data for demo
      const sampleData = generateSampleData();
      allGuests = sampleData.guests;
      properties = sampleData.properties;

      // Use first guest or provided guestId
      guest = guestProfile?.guestId
        ? allGuests.find((g) => g.guestId === guestProfile.guestId) || allGuests[0]
        : allGuests[0];
    } else {
      if (!guestProfile) {
        return NextResponse.json(
          { error: 'Invalid request. Requires guestProfile.' },
          { status: 400 }
        );
      }

      guest = guestProfile;
      allGuests = body.allGuests || [guest];
      properties = body.properties || [];

      if (properties.length === 0) {
        return NextResponse.json(
          { error: 'Invalid request. Requires properties array.' },
          { status: 400 }
        );
      }
    }

    // Generate recommendations
    const result = generateRecommendations(
      guest,
      allGuests,
      properties,
      topN || 5
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ML API] Recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Recommendation generation failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve sample data
export async function GET() {
  const sampleData = generateSampleData();

  return NextResponse.json({
    guests: sampleData.guests.map((g) => ({
      guestId: g.guestId,
      name: g.name,
      preferences: g.preferences,
    })),
    properties: sampleData.properties.map((p) => ({
      propertyId: p.propertyId,
      name: p.name,
      location: p.location,
      rating: p.rating,
      priceRange: p.priceRange,
    })),
  });
}
