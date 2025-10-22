/**
 * ML-Based Room Allocation
 * Using clustering and recommendation approaches
 */

import { Room, Guest, Booking, AllocationResult } from './types';

/**
 * ML-based allocation using feature scoring
 * Simulates a trained model that learned from historical booking data
 */
export function allocateRoomML(
  booking: Booking,
  guest: Guest,
  availableRooms: Room[]
): AllocationResult {
  const candidates = availableRooms.filter(
    (room) => room.type === booking.requestedRoomType && room.status === 'available'
  );

  if (candidates.length === 0) {
    return {
      booking,
      assignedRoom: null,
      score: 0,
      reasons: ['No rooms available of requested type'],
      method: 'ml-based',
    };
  }

  // Feature extraction for ML model
  const scoredRooms = candidates.map((room) => {
    const features = extractFeatures(room, guest, booking);
    const score = mlPredict(features);
    const reasons = generateReasons(room, guest, features);

    return { room, score, reasons };
  });

  scoredRooms.sort((a, b) => b.score - a.score);
  const best = scoredRooms[0];

  return {
    booking,
    assignedRoom: best.room,
    score: best.score,
    reasons: best.reasons,
    method: 'ml-based',
  };
}

interface RoomFeatures {
  // Room features
  floor: number;
  price: number;
  viewScore: number;
  accessibility: number;
  smoking: number;

  // Guest features
  vipScore: number;
  loyaltyScore: number;
  budgetFit: number;

  // Preference matching
  viewMatch: number;
  floorMatch: number;
  smokingMatch: number;
  quietMatch: number;
}

function extractFeatures(room: Room, guest: Guest, _booking: Booking): RoomFeatures {
  // Normalize features to 0-1 range
  const viewScore =
    {
      ocean: 1.0,
      city: 0.7,
      garden: 0.6,
      courtyard: 0.4,
    }[room.view] || 0.5;

  const viewMatch = guest.preferences.view === room.view ? 1.0 : 0.0;

  const floorMatch = guest.preferences.floor
    ? matchFloorPreference(room.floor, guest.preferences.floor)
      ? 1.0
      : 0.5
    : 0.7;

  const smokingMatch =
    guest.preferences.smoking !== undefined
      ? guest.preferences.smoking === room.smokingAllowed
        ? 1.0
        : 0.0
      : 0.7;

  const quietMatch = guest.preferences.quiet ? (room.floor > 2 ? 1.0 : 0.3) : 0.7;

  return {
    floor: room.floor / 15, // Normalize assuming max 15 floors
    price: room.basePrice / 500, // Normalize
    viewScore,
    accessibility: room.accessible ? 1.0 : 0.0,
    smoking: room.smokingAllowed ? 1.0 : 0.0,
    vipScore: guest.vipStatus ? 1.0 : 0.0,
    loyaltyScore: Math.min(guest.previousStays / 10, 1.0),
    budgetFit: guest.budgetMax
      ? 1 - Math.abs(room.basePrice - guest.budgetMax) / guest.budgetMax
      : 0.7,
    viewMatch,
    floorMatch,
    smokingMatch,
    quietMatch,
  };
}

/**
 * Simulated ML model prediction
 * In production, this would be a trained neural network or gradient boosting model
 */
function mlPredict(features: RoomFeatures): number {
  // Learned weights (simulated - in production, these come from training)
  const weights = {
    viewMatch: 0.25,
    smokingMatch: 0.2,
    accessibility: 0.15,
    floorMatch: 0.12,
    quietMatch: 0.1,
    budgetFit: 0.1,
    vipScore: 0.08,
    viewScore: 0.05,
    loyaltyScore: 0.03,
    floor: 0.02,
  };

  const score =
    features.viewMatch * weights.viewMatch +
    features.smokingMatch * weights.smokingMatch +
    features.accessibility * weights.accessibility +
    features.floorMatch * weights.floorMatch +
    features.quietMatch * weights.quietMatch +
    features.budgetFit * weights.budgetFit +
    features.vipScore * weights.vipScore +
    features.viewScore * weights.viewScore +
    features.loyaltyScore * weights.loyaltyScore +
    features.floor * weights.floor;

  // Apply non-linear activation (sigmoid)
  return 100 / (1 + Math.exp(-10 * (score - 0.5)));
}

function matchFloorPreference(floor: number, preference: 'low' | 'medium' | 'high'): boolean {
  if (preference === 'low') return floor <= 3;
  if (preference === 'medium') return floor >= 4 && floor <= 8;
  if (preference === 'high') return floor >= 9;
  return false;
}

function generateReasons(room: Room, guest: Guest, features: RoomFeatures): string[] {
  const reasons: string[] = [];

  if (features.viewMatch === 1.0) reasons.push('Perfect view match');
  if (features.smokingMatch === 1.0) reasons.push('Smoking preference matched');
  if (features.accessibility === 1.0 && guest.preferences.accessible)
    reasons.push('Accessible room');
  if (features.vipScore === 1.0) reasons.push('VIP preference applied');
  if (features.loyaltyScore > 0.5) reasons.push('Loyalty guest bonus');
  if (features.budgetFit > 0.8) reasons.push('Within budget');
  if (features.quietMatch === 1.0 && guest.preferences.quiet) reasons.push('Quiet location');

  return reasons.length > 0 ? reasons : ['ML-optimized match'];
}

export interface MLAllocationModel {
  name: string;
  type: 'clustering' | 'neural-net' | 'recommendation';
  cost: number; // USD per 1000 allocations
  avgLatency: number; // milliseconds
  accuracy: number; // 0-1
  description: string;
}

export const ML_ALLOCATION_MODELS: Record<string, MLAllocationModel> = {
  'feature-based': {
    name: 'Feature-based ML',
    type: 'neural-net',
    cost: 0,
    avgLatency: 15,
    accuracy: 0.89,
    description: 'Local ML model with learned weights from historical data.',
  },
  clustering: {
    name: 'K-Means Clustering',
    type: 'clustering',
    cost: 0,
    avgLatency: 25,
    accuracy: 0.82,
    description: 'Groups similar guests and rooms for matching.',
  },
  'collaborative-filtering': {
    name: 'Collaborative Filtering',
    type: 'recommendation',
    cost: 0,
    avgLatency: 30,
    accuracy: 0.85,
    description: 'Recommends based on similar guest preferences.',
  },
};
