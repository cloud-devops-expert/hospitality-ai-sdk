/**
 * Constraint Evaluators
 * Implements all 14 hotel room allocation constraints
 * 5 HARD (must never be violated) + 9 SOFT (preferences to optimize)
 */

import type { ConstraintMatch, HardSoftScore, ConstraintDefinition } from '../types/timefold';
import { View } from '../types/timefold';

// Helper to create constraint match
function createMatch(
  code: string,
  name: string,
  score: HardSoftScore,
  justification: string,
  bookingId?: string
): ConstraintMatch {
  return { constraintCode: code, constraintName: name, score, justification, bookingId };
}

// ============================================================================
// HARD CONSTRAINTS (Must never be violated)
// ============================================================================

/**
 * ROOM_TYPE_MATCH: Guest must get requested room type
 */
export const roomTypeMatchEvaluator: ConstraintDefinition = {
  code: 'ROOM_TYPE_MATCH',
  type: 'HARD',
  evaluator: (booking) => {
    if (!booking.assignedRoom) return null;

    if (booking.assignedRoom.type !== booking.requestedRoomType) {
      return createMatch(
        'ROOM_TYPE_MATCH',
        'Room Type Match',
        { hardScore: -1, softScore: 0 },
        `Guest requested ${booking.requestedRoomType} but assigned ${booking.assignedRoom.type}`,
        booking.id
      );
    }
    return null;
  },
};

/**
 * NO_DOUBLE_BOOKING: No room assigned to multiple guests on overlapping dates
 */
export const noDoubleBookingEvaluator: ConstraintDefinition = {
  code: 'NO_DOUBLE_BOOKING',
  type: 'HARD',
  evaluator: (booking, allBookings) => {
    if (!booking.assignedRoom) return null;

    const overlapping = allBookings.filter(
      (other) =>
        other.id !== booking.id &&
        other.assignedRoom?.id === booking.assignedRoom!.id &&
        datesOverlap(booking.checkIn, booking.checkOut, other.checkIn, other.checkOut)
    );

    if (overlapping.length > 0) {
      return createMatch(
        'NO_DOUBLE_BOOKING',
        'No Double Booking',
        { hardScore: -1, softScore: 0 },
        `Room ${booking.assignedRoom.number} double-booked with ${overlapping.length} other guest(s)`,
        booking.id
      );
    }
    return null;
  },
};

/**
 * ACCESSIBILITY_REQUIRED: Guests with accessibility needs must get accessible rooms
 */
export const accessibilityRequiredEvaluator: ConstraintDefinition = {
  code: 'ACCESSIBILITY_REQUIRED',
  type: 'HARD',
  evaluator: (booking) => {
    if (!booking.assignedRoom) return null;

    if (booking.guest.preferences.accessible && !booking.assignedRoom.accessible) {
      return createMatch(
        'ACCESSIBILITY_REQUIRED',
        'Accessibility Required',
        { hardScore: -1, softScore: 0 },
        `Guest requires accessible room but assigned non-accessible room ${booking.assignedRoom.number}`,
        booking.id
      );
    }
    return null;
  },
};

/**
 * SMOKING_POLICY: Match smoking preferences
 */
export const smokingPolicyEvaluator: ConstraintDefinition = {
  code: 'SMOKING_POLICY',
  type: 'HARD',
  evaluator: (booking) => {
    if (!booking.assignedRoom) return null;

    if (booking.guest.preferences.smoking && !booking.assignedRoom.smokingAllowed) {
      return createMatch(
        'SMOKING_POLICY',
        'Smoking Policy',
        { hardScore: -1, softScore: 0 },
        `Smoker assigned to non-smoking room ${booking.assignedRoom.number}`,
        booking.id
      );
    }

    if (!booking.guest.preferences.smoking && booking.assignedRoom.smokingAllowed) {
      return createMatch(
        'SMOKING_POLICY',
        'Smoking Policy',
        { hardScore: -1, softScore: 0 },
        `Non-smoker assigned to smoking room ${booking.assignedRoom.number}`,
        booking.id
      );
    }

    return null;
  },
};

/**
 * PET_POLICY: Guests with pets need pet-friendly rooms
 */
export const petPolicyEvaluator: ConstraintDefinition = {
  code: 'PET_POLICY',
  type: 'HARD',
  evaluator: (booking) => {
    if (!booking.assignedRoom) return null;

    if (booking.guest.preferences.pets && !booking.assignedRoom.petFriendly) {
      return createMatch(
        'PET_POLICY',
        'Pet Policy',
        { hardScore: -1, softScore: 0 },
        `Guest with pets assigned to non-pet-friendly room ${booking.assignedRoom.number}`,
        booking.id
      );
    }
    return null;
  },
};

// ============================================================================
// SOFT CONSTRAINTS (Preferences to optimize)
// ============================================================================

/**
 * VIP_OCEAN_VIEW: Prioritize ocean view for VIP guests
 */
export const vipOceanViewEvaluator: ConstraintDefinition = {
  code: 'VIP_OCEAN_VIEW',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom) return null;

    const minLoyaltyTier = parameters.minLoyaltyTier || 1;
    const viewTypes = parameters.viewTypes || [View.OCEAN, View.BEACH];

    if (
      booking.guest.vip &&
      booking.guest.loyaltyTier >= minLoyaltyTier &&
      viewTypes.includes(booking.assignedRoom.view)
    ) {
      const weight = parameters.weight || 100;
      return createMatch(
        'VIP_OCEAN_VIEW',
        'VIP Ocean View Priority',
        { hardScore: 0, softScore: weight },
        `VIP guest (tier ${booking.guest.loyaltyTier}) assigned ${booking.assignedRoom.view} view room`,
        booking.id
      );
    }
    return null;
  },
};

/**
 * VIP_HIGH_FLOOR: VIP guests get high floors
 */
export const vipHighFloorEvaluator: ConstraintDefinition = {
  code: 'VIP_HIGH_FLOOR',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom) return null;

    const minFloor = parameters.minFloor || 5;
    const minLoyaltyTier = parameters.minLoyaltyTier || 1;

    if (
      booking.guest.vip &&
      booking.guest.loyaltyTier >= minLoyaltyTier &&
      booking.assignedRoom.floor >= minFloor
    ) {
      const weight = parameters.weight || 80;
      return createMatch(
        'VIP_HIGH_FLOOR',
        'VIP High Floor Priority',
        { hardScore: 0, softScore: weight },
        `VIP guest assigned floor ${booking.assignedRoom.floor}`,
        booking.id
      );
    }
    return null;
  },
};

/**
 * VIEW_PREFERENCE: Match guest view preference
 */
export const viewPreferenceEvaluator: ConstraintDefinition = {
  code: 'VIEW_PREFERENCE',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom) return null;

    if (
      booking.guest.preferences.view &&
      booking.assignedRoom.view === booking.guest.preferences.view
    ) {
      const weight = parameters.weight || 50;
      return createMatch(
        'VIEW_PREFERENCE',
        'View Preference',
        { hardScore: 0, softScore: weight },
        `Guest preference for ${booking.guest.preferences.view} view matched`,
        booking.id
      );
    }
    return null;
  },
};

/**
 * FLOOR_PREFERENCE: Match floor preference
 */
export const floorPreferenceEvaluator: ConstraintDefinition = {
  code: 'FLOOR_PREFERENCE',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom) return null;

    const highFloorBonus = parameters.highFloorBonus || 40;
    const lowFloorBonus = parameters.lowFloorBonus || 20;

    if (booking.guest.preferences.highFloor && booking.assignedRoom.floor >= 5) {
      return createMatch(
        'FLOOR_PREFERENCE',
        'Floor Preference',
        { hardScore: 0, softScore: highFloorBonus },
        `High floor preference matched (floor ${booking.assignedRoom.floor})`,
        booking.id
      );
    }

    if (!booking.guest.preferences.highFloor && booking.assignedRoom.floor <= 3) {
      return createMatch(
        'FLOOR_PREFERENCE',
        'Floor Preference',
        { hardScore: 0, softScore: lowFloorBonus },
        `Low floor preference matched (floor ${booking.assignedRoom.floor})`,
        booking.id
      );
    }

    return null;
  },
};

/**
 * QUIET_LOCATION: Away from elevators and high-traffic areas
 */
export const quietLocationEvaluator: ConstraintDefinition = {
  code: 'QUIET_LOCATION',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom) return null;

    const minDistance = parameters.minDistanceFromElevator || 3;

    if (
      booking.guest.preferences.quiet &&
      booking.assignedRoom.distanceFromElevator >= minDistance
    ) {
      const weight = parameters.weight || 60;
      return createMatch(
        'QUIET_LOCATION',
        'Quiet Location',
        { hardScore: 0, softScore: weight },
        `Quiet room assigned (${booking.assignedRoom.distanceFromElevator} rooms from elevator)`,
        booking.id
      );
    }
    return null;
  },
};

/**
 * BUDGET_CONSTRAINT: Penalize assigning premium rooms when budget allows cheaper
 */
export const budgetConstraintEvaluator: ConstraintDefinition = {
  code: 'BUDGET_CONSTRAINT',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom || !booking.guest.budget) return null;

    const budgetBufferPercent = parameters.budgetBufferPercent || 10;
    const maxAllowable = booking.guest.budget * (1 + budgetBufferPercent / 100);

    if (booking.assignedRoom.pricePerNight > maxAllowable) {
      const weight = parameters.weight || -50;
      const overage = booking.assignedRoom.pricePerNight - maxAllowable;
      return createMatch(
        'BUDGET_CONSTRAINT',
        'Budget Constraint',
        { hardScore: 0, softScore: weight },
        `Room $${overage.toFixed(2)} over budget ($${maxAllowable.toFixed(2)})`,
        booking.id
      );
    }
    return null;
  },
};

// Simplified versions for remaining constraints
export const connectingRoomsEvaluator: ConstraintDefinition = {
  code: 'CONNECTING_ROOMS',
  type: 'SOFT',
  evaluator: () => null, // Requires group booking logic
};

export const earlyCheckinEvaluator: ConstraintDefinition = {
  code: 'EARLY_CHECKIN',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom || !booking.earlyCheckin) return null;

    const weight = parameters.weight || 30;
    return createMatch(
      'EARLY_CHECKIN',
      'Early Check-in',
      { hardScore: 0, softScore: weight },
      `Early check-in request accommodated`,
      booking.id
    );
  },
};

export const lateCheckoutEvaluator: ConstraintDefinition = {
  code: 'LATE_CHECKOUT',
  type: 'SOFT',
  evaluator: (booking, _allBookings, _allRooms, parameters) => {
    if (!booking.assignedRoom || !booking.lateCheckout) return null;

    const weight = parameters.weight || 30;
    return createMatch(
      'LATE_CHECKOUT',
      'Late Checkout',
      { hardScore: 0, softScore: weight },
      `Late checkout request accommodated`,
      booking.id
    );
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && end1 > start2;
}

// ============================================================================
// Constraint Registry
// ============================================================================

export const CONSTRAINT_EVALUATORS: Record<string, ConstraintDefinition> = {
  ROOM_TYPE_MATCH: roomTypeMatchEvaluator,
  NO_DOUBLE_BOOKING: noDoubleBookingEvaluator,
  ACCESSIBILITY_REQUIRED: accessibilityRequiredEvaluator,
  SMOKING_POLICY: smokingPolicyEvaluator,
  PET_POLICY: petPolicyEvaluator,
  VIP_OCEAN_VIEW: vipOceanViewEvaluator,
  VIP_HIGH_FLOOR: vipHighFloorEvaluator,
  VIEW_PREFERENCE: viewPreferenceEvaluator,
  FLOOR_PREFERENCE: floorPreferenceEvaluator,
  QUIET_LOCATION: quietLocationEvaluator,
  BUDGET_CONSTRAINT: budgetConstraintEvaluator,
  CONNECTING_ROOMS: connectingRoomsEvaluator,
  EARLY_CHECKIN: earlyCheckinEvaluator,
  LATE_CHECKOUT: lateCheckoutEvaluator,
};
