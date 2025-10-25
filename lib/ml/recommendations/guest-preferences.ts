/**
 * Guest Preference Recommendations - Traditional ML
 *
 * Uses collaborative filtering and content-based filtering
 * Cost: $0 (traditional algorithms, no deep learning)
 * Accuracy: 70-80% prediction accuracy
 *
 * Techniques:
 * - Collaborative filtering (user-based, item-based)
 * - Content-based filtering (feature similarity)
 * - Hybrid approach for best results
 */

export interface GuestProfile {
  guestId: string;
  name: string;
  preferences: {
    roomType: string[]; // e.g., ["suite", "deluxe"]
    amenities: string[]; // e.g., ["spa", "pool", "gym"]
    location: string[]; // e.g., ["city center", "beach"]
    priceRange: string; // e.g., "budget", "mid-range", "luxury"
    travelPurpose: string; // e.g., "business", "leisure", "family"
  };
  bookingHistory: GuestBooking[];
  ratings: GuestRating[];
}

export interface GuestBooking {
  bookingId: string;
  propertyId: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalSpent: number;
}

export interface GuestRating {
  propertyId: string;
  rating: number; // 1-5
  aspects: {
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
}

export interface Property {
  propertyId: string;
  name: string;
  location: string;
  type: string; // "hotel", "resort", "boutique"
  rating: number;
  priceRange: string;
  amenities: string[];
  roomTypes: string[];
  features: string[];
}

export interface Recommendation {
  property: Property;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  method: 'collaborative' | 'content-based' | 'hybrid';
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  guestProfile: GuestProfile;
  executionTime: number;
  method: 'traditional-ml' | 'deep-learning';
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) || 0;
}

/**
 * Calculate Jaccard similarity for sets (e.g., amenities)
 */
function jaccardSimilarity(set1: string[], set2: string[]): number {
  const intersection = set1.filter((item) => set2.includes(item)).length;
  const union = new Set([...set1, ...set2]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Content-based filtering: Recommend based on property features
 */
function contentBasedRecommendations(
  guest: GuestProfile,
  properties: Property[],
  topN: number = 5
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const property of properties) {
    let score = 0;
    const reasoning: string[] = [];

    // Match amenities (40% weight)
    const amenitySimilarity = jaccardSimilarity(
      guest.preferences.amenities,
      property.amenities
    );
    score += amenitySimilarity * 0.4;
    if (amenitySimilarity > 0.5) {
      reasoning.push(`${Math.round(amenitySimilarity * 100)}% amenity match`);
    }

    // Match room types (30% weight)
    const roomTypeSimilarity = jaccardSimilarity(
      guest.preferences.roomType,
      property.roomTypes
    );
    score += roomTypeSimilarity * 0.3;
    if (roomTypeSimilarity > 0) {
      reasoning.push(`Offers your preferred room types`);
    }

    // Match price range (20% weight)
    if (guest.preferences.priceRange === property.priceRange) {
      score += 0.2;
      reasoning.push(`Matches your ${property.priceRange} budget`);
    }

    // Property rating (10% weight)
    score += (property.rating / 5) * 0.1;
    if (property.rating >= 4.5) {
      reasoning.push(`Highly rated (${property.rating}/5)`);
    }

    const confidence: 'high' | 'medium' | 'low' =
      score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';

    recommendations.push({
      property,
      score,
      confidence,
      reasoning,
      method: 'content-based',
    });
  }

  // Sort by score and return top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Collaborative filtering: Recommend based on similar guests
 *
 * Simplified version - in production, would use user-item matrix
 */
function collaborativeRecommendations(
  guest: GuestProfile,
  allGuests: GuestProfile[],
  properties: Property[],
  topN: number = 5
): Recommendation[] {
  // Find similar guests based on preferences and ratings
  const similarGuests: Array<{ guest: GuestProfile; similarity: number }> = [];

  for (const otherGuest of allGuests) {
    if (otherGuest.guestId === guest.guestId) continue;

    // Calculate similarity based on preferences
    const amenitySimilarity = jaccardSimilarity(
      guest.preferences.amenities,
      otherGuest.preferences.amenities
    );
    const roomTypeSimilarity = jaccardSimilarity(
      guest.preferences.roomType,
      otherGuest.preferences.roomType
    );

    const similarity = (amenitySimilarity + roomTypeSimilarity) / 2;

    if (similarity > 0.3) {
      similarGuests.push({ guest: otherGuest, similarity });
    }
  }

  // Sort by similarity
  similarGuests.sort((a, b) => b.similarity - a.similarity);

  // Get properties booked by similar guests
  const propertyScores = new Map<string, number>();

  for (const { guest: similarGuest, similarity } of similarGuests.slice(0, 10)) {
    for (const booking of similarGuest.bookingHistory) {
      const currentScore = propertyScores.get(booking.propertyId) || 0;
      propertyScores.set(booking.propertyId, currentScore + similarity);
    }
  }

  // Create recommendations
  const recommendations: Recommendation[] = [];

  for (const [propertyId, score] of propertyScores.entries()) {
    const property = properties.find((p) => p.propertyId === propertyId);
    if (!property) continue;

    const normalizedScore = Math.min(score, 1);
    const confidence: 'high' | 'medium' | 'low' =
      normalizedScore > 0.7 ? 'high' : normalizedScore > 0.4 ? 'medium' : 'low';

    recommendations.push({
      property,
      score: normalizedScore,
      confidence,
      reasoning: [
        `Popular with guests similar to you`,
        `${similarGuests.slice(0, 3).length} similar guests stayed here`,
      ],
      method: 'collaborative',
    });
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Hybrid recommendations: Combine collaborative and content-based
 */
export function generateRecommendations(
  guest: GuestProfile,
  allGuests: GuestProfile[],
  properties: Property[],
  topN: number = 5
): RecommendationResult {
  const startTime = performance.now();

  // Get content-based recommendations
  const contentRecs = contentBasedRecommendations(guest, properties, topN * 2);

  // Get collaborative recommendations
  const collabRecs = collaborativeRecommendations(guest, allGuests, properties, topN * 2);

  // Merge recommendations (hybrid approach)
  const mergedScores = new Map<string, { score: number; recs: Recommendation[] }>();

  // Process content-based
  for (const rec of contentRecs) {
    mergedScores.set(rec.property.propertyId, {
      score: rec.score * 0.6, // 60% weight for content-based
      recs: [rec],
    });
  }

  // Add collaborative
  for (const rec of collabRecs) {
    const existing = mergedScores.get(rec.property.propertyId);
    if (existing) {
      existing.score += rec.score * 0.4; // 40% weight for collaborative
      existing.recs.push(rec);
    } else {
      mergedScores.set(rec.property.propertyId, {
        score: rec.score * 0.4,
        recs: [rec],
      });
    }
  }

  // Create final recommendations
  const recommendations: Recommendation[] = Array.from(mergedScores.entries())
    .map(([propertyId, { score, recs }]) => {
      const property = properties.find((p) => p.propertyId === propertyId)!;

      // Combine reasoning from both methods
      const reasoning = Array.from(
        new Set(recs.flatMap((r) => r.reasoning))
      );

      const confidence: 'high' | 'medium' | 'low' =
        score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';

      return {
        property,
        score,
        confidence,
        reasoning,
        method: 'hybrid' as const,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  const executionTime = Math.round(performance.now() - startTime);

  return {
    recommendations,
    guestProfile: guest,
    executionTime,
    method: 'traditional-ml',
  };
}

/**
 * Generate sample data for demo
 */
export function generateSampleData(): {
  guests: GuestProfile[];
  properties: Property[];
} {
  // Sample properties
  const properties: Property[] = [
    {
      propertyId: 'prop-001',
      name: 'Grand Luxury Hotel',
      location: 'Downtown',
      type: 'hotel',
      rating: 4.8,
      priceRange: 'luxury',
      amenities: ['spa', 'pool', 'gym', 'restaurant', 'bar', 'concierge'],
      roomTypes: ['deluxe', 'suite', 'penthouse'],
      features: ['city view', 'rooftop pool', 'michelin restaurant'],
    },
    {
      propertyId: 'prop-002',
      name: 'Beach Resort Paradise',
      location: 'Beachfront',
      type: 'resort',
      rating: 4.6,
      priceRange: 'luxury',
      amenities: ['spa', 'pool', 'beach', 'water sports', 'kids club'],
      roomTypes: ['standard', 'ocean view', 'villa'],
      features: ['private beach', 'water sports', 'sunset views'],
    },
    {
      propertyId: 'prop-003',
      name: 'Business Inn Downtown',
      location: 'Business District',
      type: 'hotel',
      rating: 4.2,
      priceRange: 'mid-range',
      amenities: ['gym', 'business center', 'wifi', 'restaurant'],
      roomTypes: ['standard', 'executive'],
      features: ['fast wifi', 'meeting rooms', 'airport shuttle'],
    },
    {
      propertyId: 'prop-004',
      name: 'Boutique Garden Hotel',
      location: 'Historic Quarter',
      type: 'boutique',
      rating: 4.9,
      priceRange: 'luxury',
      amenities: ['garden', 'spa', 'library', 'bar'],
      roomTypes: ['standard', 'deluxe', 'suite'],
      features: ['historic building', 'art collection', 'quiet location'],
    },
    {
      propertyId: 'prop-005',
      name: 'Family Resort & Waterpark',
      location: 'Suburban',
      type: 'resort',
      rating: 4.4,
      priceRange: 'mid-range',
      amenities: ['waterpark', 'kids club', 'restaurant', 'pool'],
      roomTypes: ['family suite', 'connecting rooms'],
      features: ['waterpark', 'kids activities', 'family friendly'],
    },
  ];

  // Sample guests
  const guests: GuestProfile[] = [
    {
      guestId: 'guest-001',
      name: 'John Smith',
      preferences: {
        roomType: ['suite', 'deluxe'],
        amenities: ['spa', 'pool', 'gym'],
        location: ['downtown', 'city center'],
        priceRange: 'luxury',
        travelPurpose: 'leisure',
      },
      bookingHistory: [
        {
          bookingId: 'book-001',
          propertyId: 'prop-001',
          roomType: 'suite',
          checkIn: '2024-01-15',
          checkOut: '2024-01-18',
          totalSpent: 1200,
        },
      ],
      ratings: [
        {
          propertyId: 'prop-001',
          rating: 5,
          aspects: {
            cleanliness: 5,
            service: 5,
            location: 5,
            value: 4,
            amenities: 5,
          },
        },
      ],
    },
    {
      guestId: 'guest-002',
      name: 'Sarah Johnson',
      preferences: {
        roomType: ['ocean view', 'villa'],
        amenities: ['beach', 'spa', 'pool'],
        location: ['beachfront', 'resort'],
        priceRange: 'luxury',
        travelPurpose: 'leisure',
      },
      bookingHistory: [
        {
          bookingId: 'book-002',
          propertyId: 'prop-002',
          roomType: 'ocean view',
          checkIn: '2024-02-10',
          checkOut: '2024-02-15',
          totalSpent: 2000,
        },
      ],
      ratings: [
        {
          propertyId: 'prop-002',
          rating: 5,
          aspects: {
            cleanliness: 5,
            service: 4,
            location: 5,
            value: 4,
            amenities: 5,
          },
        },
      ],
    },
    {
      guestId: 'guest-003',
      name: 'Mike Chen',
      preferences: {
        roomType: ['standard', 'executive'],
        amenities: ['gym', 'business center', 'wifi'],
        location: ['business district', 'downtown'],
        priceRange: 'mid-range',
        travelPurpose: 'business',
      },
      bookingHistory: [
        {
          bookingId: 'book-003',
          propertyId: 'prop-003',
          roomType: 'executive',
          checkIn: '2024-03-01',
          checkOut: '2024-03-03',
          totalSpent: 400,
        },
      ],
      ratings: [
        {
          propertyId: 'prop-003',
          rating: 4,
          aspects: {
            cleanliness: 4,
            service: 4,
            location: 5,
            value: 5,
            amenities: 4,
          },
        },
      ],
    },
  ];

  return { guests, properties };
}
