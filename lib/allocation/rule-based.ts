/**
 * Rule-Based Room Allocation
 * Traditional constraint-based algorithm
 */

import { Room, Guest, Booking, AllocationResult, AllocationConstraints } from './types';

export function allocateRoomRuleBased(
  booking: Booking,
  guest: Guest,
  availableRooms: Room[]
): AllocationResult {
  const reasons: string[] = [];

  // Filter rooms by type
  let candidates = availableRooms.filter(room =>
    room.type === booking.requestedRoomType && room.status === 'available'
  );

  if (candidates.length === 0) {
    return {
      booking,
      assignedRoom: null,
      score: 0,
      reasons: ['No rooms available of requested type'],
      method: 'rule-based'
    };
  }

  // Score each candidate room
  const scoredRooms = candidates.map(room => {
    let score = 50; // Base score
    const roomReasons: string[] = [];

    // MUST-HAVE constraints (high weight)
    if (guest.preferences.accessible && room.accessible) {
      score += 30;
      roomReasons.push('Accessible room matched');
    } else if (guest.preferences.accessible && !room.accessible) {
      score -= 40;
      roomReasons.push('Accessibility requirement not met');
    }

    if (guest.preferences.smoking !== undefined) {
      if (guest.preferences.smoking === room.smokingAllowed) {
        score += 20;
        roomReasons.push('Smoking preference matched');
      } else {
        score -= 30;
        roomReasons.push('Smoking preference not matched');
      }
    }

    // NICE-TO-HAVE preferences (medium weight)
    if (guest.preferences.view && guest.preferences.view === room.view) {
      score += 15;
      roomReasons.push(`Preferred ${room.view} view`);
    }

    if (guest.preferences.floor) {
      const floorMatch = matchFloorPreference(room.floor, guest.preferences.floor);
      if (floorMatch) {
        score += 10;
        roomReasons.push('Floor preference matched');
      }
    }

    // VIP status upgrades
    if (guest.vipStatus) {
      if (room.view === 'ocean') {
        score += 15;
        roomReasons.push('VIP ocean view priority');
      }
      if (room.type === 'suite' || room.type === 'deluxe') {
        score += 10;
        roomReasons.push('VIP room type priority');
      }
    }

    // Loyalty bonus
    if (guest.previousStays > 5) {
      score += 5;
      roomReasons.push('Loyalty guest bonus');
    }

    // Budget constraint
    if (guest.budgetMax && room.basePrice > guest.budgetMax) {
      score -= 25;
      roomReasons.push('Over budget');
    }

    // Quiet preference (avoid low floors near lobby)
    if (guest.preferences.quiet && room.floor <= 2) {
      score -= 10;
      roomReasons.push('Low floor may be noisy');
    }

    return { room, score: Math.max(0, Math.min(100, score)), reasons: roomReasons };
  });

  // Sort by score and pick the best
  scoredRooms.sort((a, b) => b.score - a.score);
  const best = scoredRooms[0];

  return {
    booking,
    assignedRoom: best.room,
    score: best.score,
    reasons: best.reasons,
    method: 'rule-based'
  };
}

function matchFloorPreference(floor: number, preference: 'low' | 'medium' | 'high'): boolean {
  if (preference === 'low') return floor <= 3;
  if (preference === 'medium') return floor >= 4 && floor <= 8;
  if (preference === 'high') return floor >= 9;
  return false;
}

export function batchAllocate(
  bookings: Booking[],
  guests: Map<string, Guest>,
  rooms: Room[]
): AllocationResult[] {
  const results: AllocationResult[] = [];
  const assignedRoomIds = new Set<string>();

  // Sort bookings by priority (VIP first, then by previous stays)
  const sortedBookings = [...bookings].sort((a, b) => {
    const guestA = guests.get(a.guestId);
    const guestB = guests.get(b.guestId);
    if (!guestA || !guestB) return 0;

    if (guestA.vipStatus !== guestB.vipStatus) {
      return guestA.vipStatus ? -1 : 1;
    }
    return guestB.previousStays - guestA.previousStays;
  });

  for (const booking of sortedBookings) {
    const guest = guests.get(booking.guestId);
    if (!guest) continue;

    const availableRooms = rooms.filter(r => !assignedRoomIds.has(r.id));
    const result = allocateRoomRuleBased(booking, guest, availableRooms);

    if (result.assignedRoom) {
      assignedRoomIds.add(result.assignedRoom.id);
    }

    results.push(result);
  }

  return results;
}

export function getConstraints(guest: Guest): AllocationConstraints {
  const mustHaves: string[] = [];
  const niceToHaves: string[] = [];
  const conflicts: string[] = [];

  if (guest.preferences.accessible) {
    mustHaves.push('Accessible room required');
  }

  if (guest.preferences.smoking !== undefined) {
    mustHaves.push(guest.preferences.smoking ? 'Smoking room' : 'Non-smoking room');
  }

  if (guest.preferences.view) {
    niceToHaves.push(`${guest.preferences.view} view preferred`);
  }

  if (guest.preferences.floor) {
    niceToHaves.push(`${guest.preferences.floor} floor preferred`);
  }

  if (guest.preferences.quiet) {
    niceToHaves.push('Quiet location preferred');
    conflicts.push('Rooms near elevators, lobby, or low floors');
  }

  return { mustHaves, niceToHaves, conflicts };
}
