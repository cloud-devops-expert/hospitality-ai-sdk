/**
 * Room Allocation Types
 */

export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  floor: number;
  accessible: boolean;
  smokingAllowed: boolean;
  view: 'ocean' | 'city' | 'garden' | 'courtyard';
  status: 'available' | 'occupied' | 'maintenance';
  basePrice: number;
}

export interface Guest {
  id: string;
  name: string;
  preferences: {
    floor?: 'low' | 'medium' | 'high';
    view?: Room['view'];
    accessible?: boolean;
    smoking?: boolean;
    quiet?: boolean;
  };
  vipStatus: boolean;
  previousStays: number;
  budgetMax?: number;
}

export interface Booking {
  id: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  requestedRoomType: Room['type'];
}

export interface AllocationResult {
  booking: Booking;
  assignedRoom: Room | null;
  score: number; // 0-100
  reasons: string[];
  method: 'rule-based' | 'ai-assisted';
}

export interface AllocationConstraints {
  mustHaves: string[];
  niceToHaves: string[];
  conflicts: string[];
}
