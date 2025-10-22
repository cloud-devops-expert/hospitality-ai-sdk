/**
 * Room Allocation API Endpoint
 * POST /api/allocate
 *
 * Performs constraint-based room allocation using tenant-specific rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConstraintSolver } from '@/lib/allocation/solver/constraint-solver';
import type {
  AllocationRequest,
  AllocationResponse,
  GuestBooking,
  Guest,
  Room,
} from '@/lib/allocation/types/timefold';

export async function POST(request: NextRequest) {
  try {
    const body: AllocationRequest = await request.json();

    // Validate request
    if (!body.tenantId) {
      return NextResponse.json(
        { success: false, message: 'tenantId is required' },
        { status: 400 }
      );
    }

    if (!body.bookings || body.bookings.length === 0) {
      return NextResponse.json(
        { success: false, message: 'bookings array is required' },
        { status: 400 }
      );
    }

    if (!body.rooms || body.rooms.length === 0) {
      return NextResponse.json(
        { success: false, message: 'rooms array is required' },
        { status: 400 }
      );
    }

    // Convert request to domain model
    const guests: Guest[] = body.bookings.map(b => ({
      id: b.guestId,
      name: b.guestName,
      vip: b.vip || false,
      loyaltyTier: b.loyaltyTier || 1,
      preferences: b.preferences || {
        highFloor: false,
        accessible: false,
        smoking: false,
        quiet: false,
        pets: false,
      },
      budget: b.budget,
    }));

    const bookings: GuestBooking[] = body.bookings.map((b, i) => ({
      id: `booking-${i}`,
      guest: guests[i],
      checkIn: new Date(b.checkIn),
      checkOut: new Date(b.checkOut),
      requestedRoomType: b.requestedRoomType,
      earlyCheckin: b.earlyCheckin,
      lateCheckout: b.lateCheckout,
    }));

    const rooms: Room[] = body.rooms.map(r => ({
      id: r.id,
      number: r.number,
      type: r.type,
      floor: r.floor,
      view: r.view,
      accessible: r.accessible,
      smokingAllowed: r.smokingAllowed,
      petFriendly: r.petFriendly,
      distanceFromElevator: r.distanceFromElevator,
      pricePerNight: r.pricePerNight,
    }));

    // Solve allocation
    const solver = new ConstraintSolver();
    const solution = await solver.solve(
      {
        tenantId: body.tenantId,
        rooms,
        bookings,
      },
      body.timeLimit || 30
    );

    // Build response
    const assignments = solution.bookings
      .filter(b => b.assignedRoom)
      .map(b => ({
        bookingId: b.id,
        guestName: b.guest.name,
        roomNumber: b.assignedRoom!.number,
        roomType: b.assignedRoom!.type,
        score: 100, // Placeholder
      }));

    const constraintViolations = (solution.constraintMatches || []).filter(
      m => m.score.hardScore < 0 || m.score.softScore < 0
    );

    const response: AllocationResponse = {
      success: solution.score!.hardScore === 0,
      solution,
      assignments,
      score: solution.score!,
      constraintViolations,
      solveTime: solution.solveTime!,
      message:
        solution.score!.hardScore === 0
          ? `Successfully allocated ${assignments.length}/${bookings.length} bookings`
          : `Hard constraints violated (score: ${solution.score!.hardScore})`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Allocation API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET /api/allocate - Get solver status
export async function GET() {
  return NextResponse.json({
    service: 'Timefold-Inspired Constraint Solver',
    version: '1.0.0',
    status: 'operational',
    features: [
      'Database-driven constraints',
      'Multi-tenant support',
      'Hot-reloadable rules',
      '14 constraint types (5 HARD + 9 SOFT)',
    ],
  });
}
