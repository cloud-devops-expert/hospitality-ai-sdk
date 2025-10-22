/**
 * Timefold-Inspired Constraint Solver Types
 * Database-driven, tenant-specific room allocation
 */

// ============================================================================
// Domain Model
// ============================================================================

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  SUITE = 'SUITE',
  DELUXE = 'DELUXE',
}

export enum View {
  OCEAN = 'OCEAN',
  CITY = 'CITY',
  GARDEN = 'GARDEN',
  COURTYARD = 'COURTYARD',
  BEACH = 'BEACH',
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  floor: number;
  view: View;
  accessible: boolean;
  smokingAllowed: boolean;
  petFriendly: boolean;
  distanceFromElevator: number;
  pricePerNight: number;
}

export interface Guest {
  id: string;
  name: string;
  vip: boolean;
  loyaltyTier: number; // 1-5
  preferences: {
    view?: View;
    highFloor: boolean;
    accessible: boolean;
    smoking: boolean;
    quiet: boolean;
    pets: boolean;
  };
  budget?: number;
}

export interface GuestBooking {
  id: string;
  guest: Guest;
  checkIn: Date;
  checkOut: Date;
  requestedRoomType: RoomType;
  assignedRoom?: Room; // Solver assigns this
  earlyCheckin?: boolean;
  lateCheckout?: boolean;
}

// ============================================================================
// Constraint Configuration (from database)
// ============================================================================

export type ConstraintType = 'HARD' | 'SOFT';

export type ConstraintCategory = 'vip' | 'accessibility' | 'preference' | 'business';

export interface ConstraintTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  constraintType: ConstraintType;
  defaultWeight: number;
  category: ConstraintCategory;
  parameterSchema?: any;
  exampleParameters?: any;
  javaClassName?: string;
}

export interface TenantConstraintConfig {
  id: string;
  tenantId: string;
  templateId: string;
  template: ConstraintTemplate;
  enabled: boolean;
  weight: number;
  parameters: Record<string, any>;
  notes?: string;
}

// ============================================================================
// Scoring
// ============================================================================

export interface HardSoftScore {
  hardScore: number; // Must be 0 for valid solution
  softScore: number; // Higher is better
}

export interface ConstraintMatch {
  constraintCode: string;
  constraintName: string;
  score: HardSoftScore;
  justification: string;
  bookingId?: string;
}

// ============================================================================
// Solution
// ============================================================================

export interface HotelAllocation {
  tenantId: string;
  rooms: Room[];
  bookings: GuestBooking[];
  score?: HardSoftScore;
  constraintMatches?: ConstraintMatch[];
  solveTime?: number; // milliseconds
}

// ============================================================================
// Allocation Request/Response
// ============================================================================

export interface AllocationRequest {
  tenantId: string;
  bookings: Array<{
    guestId: string;
    guestName: string;
    checkIn: string; // ISO date
    checkOut: string;
    requestedRoomType: RoomType;
    vip?: boolean;
    loyaltyTier?: number;
    preferences?: Guest['preferences'];
    budget?: number;
    earlyCheckin?: boolean;
    lateCheckout?: boolean;
  }>;
  rooms: Array<{
    id: string;
    number: string;
    type: RoomType;
    floor: number;
    view: View;
    accessible: boolean;
    smokingAllowed: boolean;
    petFriendly: boolean;
    distanceFromElevator: number;
    pricePerNight: number;
  }>;
  timeLimit?: number; // seconds
}

export interface AllocationResponse {
  success: boolean;
  solution: HotelAllocation;
  assignments: Array<{
    bookingId: string;
    guestName: string;
    roomNumber: string;
    roomType: RoomType;
    score: number;
  }>;
  score: HardSoftScore;
  constraintViolations: ConstraintMatch[];
  solveTime: number;
  message?: string;
}

// ============================================================================
// Constraint Evaluation
// ============================================================================

export type ConstraintEvaluator = (
  booking: GuestBooking,
  allBookings: GuestBooking[],
  allRooms: Room[],
  parameters: Record<string, any>
) => ConstraintMatch | null;

export interface ConstraintDefinition {
  code: string;
  type: ConstraintType;
  evaluator: ConstraintEvaluator;
}
