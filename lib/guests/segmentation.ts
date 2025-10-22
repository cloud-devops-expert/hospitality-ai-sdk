/**
 * Guest Segmentation Module
 * Uses K-Means clustering to automatically segment guests
 */

import { kmeans } from 'ml-kmeans';

export interface Guest {
  id: string;
  name: string;
  email: string;
  totalStays: number;
  totalSpend: number;
  avgRoomRate: number;
  avgDaysInAdvance: number;
  roomUpgrades: number;
  amenityUsage: number; // 0-1 score
  lastStay?: Date;
  reviewScore?: number; // 1-5
}

export interface GuestSegment {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  recommendedActions: string[];
}

export interface SegmentedGuest extends Guest {
  segment: string;
  segmentIndex: number;
  segmentProbability?: number;
}

/**
 * Extract features from guest for clustering
 */
function extractFeatures(guest: Guest): number[] {
  return [
    guest.avgRoomRate / 100, // Normalized spending
    guest.totalStays / 10, // Stay frequency (normalized)
    guest.avgDaysInAdvance / 30, // Booking lead time
    guest.roomUpgrades / 5, // Upgrade frequency
    guest.amenityUsage, // Amenity usage (0-1)
  ];
}

/**
 * Define guest segments based on clustering
 */
const SEGMENT_DEFINITIONS: GuestSegment[] = [
  {
    id: 'budget',
    name: 'Budget Travelers',
    description: 'Price-conscious guests who book basic rooms well in advance',
    characteristics: [
      'Low average room rate',
      'Books far in advance',
      'Minimal upgrades',
      'Low amenity usage',
    ],
    recommendedActions: [
      'Offer early-bird discounts',
      'Promote package deals',
      'Highlight value-for-money',
    ],
  },
  {
    id: 'value',
    name: 'Value Seekers',
    description: 'Mid-range guests who balance price and experience',
    characteristics: [
      'Moderate room rates',
      'Occasional upgrades',
      'Some amenity usage',
      'Books 1-2 weeks ahead',
    ],
    recommendedActions: [
      'Upsell packages',
      'Offer mid-range upgrades',
      'Promote loyalty program',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Guests',
    description: 'High-spending guests who frequently upgrade',
    characteristics: [
      'Above-average room rates',
      'Frequent upgrades',
      'High amenity usage',
      'Books closer to arrival',
    ],
    recommendedActions: [
      'Offer premium experiences',
      'Personalized service',
      'VIP recognition',
    ],
  },
  {
    id: 'luxury',
    name: 'Luxury Travelers',
    description: 'Top-tier guests who expect exceptional service',
    characteristics: [
      'Highest room rates',
      'Always upgrades',
      'Maximum amenity usage',
      'Last-minute bookings',
      'High repeat rate',
    ],
    recommendedActions: [
      'Dedicated concierge',
      'Exclusive experiences',
      'Personal touches',
      'Loyalty rewards',
    ],
  },
];

/**
 * Segment guests using K-Means clustering
 */
export async function segmentGuests(
  guests: Guest[]
): Promise<SegmentedGuest[]> {
  if (guests.length < 4) {
    // Not enough data for clustering, use rule-based
    return guests.map((guest) => ({
      ...guest,
      ...assignSegmentRuleBased(guest),
    }));
  }

  // Extract features
  const features = guests.map((g) => extractFeatures(g));

  // Run K-Means clustering (4 segments)
  const result = kmeans(features, 4, {
    initialization: 'kmeans++',
    maxIterations: 100,
  });

  // Assign segment names based on cluster characteristics
  const clusterProfiles = analyzeClusterProfiles(
    result.centroids,
    guests,
    result.clusters
  );

  // Map guests to segments
  return guests.map((guest, i) => {
    const clusterIndex = result.clusters[i];
    const segment = clusterProfiles[clusterIndex];

    return {
      ...guest,
      segment: segment.name,
      segmentIndex: clusterIndex,
    };
  });
}

/**
 * Analyze cluster centroids to determine segment profiles
 */
function analyzeClusterProfiles(
  centroids: number[][],
  guests: Guest[],
  clusters: number[]
): GuestSegment[] {
  // Calculate average room rate per cluster
  const clusterRates = centroids.map((centroid, i) => {
    const guestsInCluster = guests.filter((_, j) => clusters[j] === i);
    const avgRate =
      guestsInCluster.reduce((sum, g) => sum + g.avgRoomRate, 0) /
      guestsInCluster.length;
    return { index: i, avgRate, centroid };
  });

  // Sort by average room rate to assign segment names
  clusterRates.sort((a, b) => a.avgRate - b.avgRate);

  // Map clusters to segments
  const mapping: GuestSegment[] = [];
  clusterRates.forEach((cluster, i) => {
    mapping[cluster.index] = SEGMENT_DEFINITIONS[i] || SEGMENT_DEFINITIONS[1];
  });

  return mapping;
}

/**
 * Rule-based segment assignment (fallback)
 */
function assignSegmentRuleBased(guest: Guest): {
  segment: string;
  segmentIndex: number;
} {
  const score =
    guest.avgRoomRate / 50 +
    guest.roomUpgrades * 10 +
    guest.amenityUsage * 20;

  if (score > 80) {
    return { segment: 'Luxury Travelers', segmentIndex: 3 };
  } else if (score > 50) {
    return { segment: 'Premium Guests', segmentIndex: 2 };
  } else if (score > 25) {
    return { segment: 'Value Seekers', segmentIndex: 1 };
  } else {
    return { segment: 'Budget Travelers', segmentIndex: 0 };
  }
}

/**
 * Get segment definition by name
 */
export function getSegmentDefinition(segmentName: string): GuestSegment | undefined {
  return SEGMENT_DEFINITIONS.find((s) => s.name === segmentName);
}

/**
 * Calculate segment statistics
 */
export function calculateSegmentStats(guests: SegmentedGuest[]): {
  totalGuests: number;
  segments: Array<{
    name: string;
    count: number;
    percentage: number;
    avgSpend: number;
    avgStays: number;
  }>;
} {
  const totalGuests = guests.length;
  const segmentGroups = new Map<string, SegmentedGuest[]>();

  // Group by segment
  guests.forEach((guest) => {
    const existing = segmentGroups.get(guest.segment) || [];
    existing.push(guest);
    segmentGroups.set(guest.segment, existing);
  });

  // Calculate stats per segment
  const segments = Array.from(segmentGroups.entries()).map(([name, group]) => {
    const avgSpend =
      group.reduce((sum, g) => sum + g.totalSpend, 0) / group.length;
    const avgStays =
      group.reduce((sum, g) => sum + g.totalStays, 0) / group.length;

    return {
      name,
      count: group.length,
      percentage: (group.length / totalGuests) * 100,
      avgSpend,
      avgStays,
    };
  });

  return {
    totalGuests,
    segments: segments.sort((a, b) => b.count - a.count),
  };
}

/**
 * Predict segment for a new guest
 */
export function predictGuestSegment(
  guest: Guest,
  existingGuests: SegmentedGuest[]
): { segment: string; confidence: number } {
  // Use rule-based for single guest prediction
  const { segment } = assignSegmentRuleBased(guest);

  // Calculate confidence based on similarity to existing guests in segment
  const segmentGuests = existingGuests.filter((g) => g.segment === segment);
  if (segmentGuests.length === 0) {
    return { segment, confidence: 0.7 };
  }

  // Simple confidence based on feature similarity
  const confidence = 0.85; // Placeholder

  return { segment, confidence };
}
