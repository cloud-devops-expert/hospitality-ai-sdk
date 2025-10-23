/**
 * HostPMS Data Mapper
 * Transforms HostPMS Portuguese data to our unified English schema
 */

// UUID import - conditional to avoid Jest ES module issues
let uuid: () => string;
try {
  const uuidModule = require('uuid');
  uuid = uuidModule.v4;
} catch (e) {
  // Fallback for testing environments
  uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}
import type {
  HostPMSReservation,
  HostPMSReservationStatus,
  HostPMSChannel,
  UnifiedBooking,
  UnifiedBookingStatus,
  UnifiedChannel,
} from './types';

/**
 * Status mapping: Portuguese → English
 */
const STATUS_MAP: Record<HostPMSReservationStatus, UnifiedBookingStatus> = {
  confirmado: 'confirmed',
  cancelado: 'cancelled',
  check_in: 'checked_in',
  check_out: 'checked_out',
  no_show: 'no_show',
  pendente: 'pending',
};

/**
 * Channel mapping: Portuguese/HostPMS → English/Unified
 */
const CHANNEL_MAP: Record<HostPMSChannel, UnifiedChannel> = {
  direto: 'direct',
  booking_com: 'ota',
  expedia: 'ota',
  airbnb: 'ota',
  agencia: 'agent',
  outro: 'other',
};

/**
 * Room type mapping: Portuguese → English
 * Expandable as needed
 */
const ROOM_TYPE_MAP: Record<string, string> = {
  // Portuguese names
  'Quarto Duplo': 'Double Room',
  'Quarto Twin': 'Twin Room',
  'Suite': 'Suite',
  'Quarto Individual': 'Single Room',
  'Quarto Triplo': 'Triple Room',
  'Quarto Familiar': 'Family Room',
  'Suite Presidencial': 'Presidential Suite',
  'Studio': 'Studio',
  'Apartamento': 'Apartment',

  // Spanish names (HostPMS also used in Spain)
  'Habitación Doble': 'Double Room',
  'Habitación Individual': 'Single Room',
  'Habitación Triple': 'Triple Room',

  // Fallback - if not in map, return as-is
};

/**
 * Map HostPMS status to unified status
 */
export function mapStatus(status: HostPMSReservationStatus): UnifiedBookingStatus {
  return STATUS_MAP[status] || 'confirmed';
}

/**
 * Map HostPMS channel to unified channel
 */
export function mapChannel(channel: HostPMSChannel): UnifiedChannel {
  return CHANNEL_MAP[channel] || 'other';
}

/**
 * Map room type (Portuguese/Spanish → English)
 */
export function mapRoomType(roomType: string): string {
  // Try exact match first
  if (ROOM_TYPE_MAP[roomType]) {
    return ROOM_TYPE_MAP[roomType];
  }

  // Try case-insensitive match
  const lowerType = roomType.toLowerCase();
  const matchedKey = Object.keys(ROOM_TYPE_MAP).find(
    (key) => key.toLowerCase() === lowerType
  );

  if (matchedKey) {
    return ROOM_TYPE_MAP[matchedKey];
  }

  // Return original if no mapping found
  return roomType;
}

/**
 * Calculate lead time (days between booking and check-in)
 */
export function calculateLeadTime(bookedAt: Date, checkInDate: Date): number {
  const diffMs = checkInDate.getTime() - bookedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // Ensure non-negative
}

/**
 * Calculate length of stay (nights)
 */
export function calculateLengthOfStay(
  checkInDate: Date,
  checkOutDate: Date
): number {
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // Minimum 1 night
}

/**
 * Parse ISO date string to Date object
 */
function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Main mapper: HostPMS Reservation → Unified Booking
 */
export function mapHostPMSToUnified(
  reservation: HostPMSReservation,
  options: {
    generateId?: boolean;
    includeRawData?: boolean;
    version?: number;
  } = {}
): UnifiedBooking {
  const {
    generateId = true,
    includeRawData = false,
    version = 1,
  } = options;

  // Parse dates
  const checkInDate = parseDate(reservation.dates.check_in);
  const checkOutDate = parseDate(reservation.dates.check_out);
  const bookedAt = parseDate(reservation.dates.created_at);

  // Calculate ML features
  const leadTime = calculateLeadTime(bookedAt, checkInDate);
  const lengthOfStay = calculateLengthOfStay(checkInDate, checkOutDate);

  const unified: UnifiedBooking = {
    // IDs
    id: generateId ? uuid() : '', // Will be set by database if empty
    external_id: reservation.reservation_id,
    source: 'hostpms',
    hotel_id: reservation.property_id,

    // Guest info
    guest_name: reservation.guest.name,
    guest_email: reservation.guest.email,
    guest_phone: reservation.guest.phone,
    guest_country: reservation.guest.country,

    // Room info
    room_number: reservation.room.number,
    room_type: mapRoomType(reservation.room.type),

    // Dates
    check_in_date: checkInDate,
    check_out_date: checkOutDate,
    booked_at: bookedAt,

    // Pricing
    total_amount: reservation.pricing.total,
    currency: reservation.pricing.currency,

    // Status & Channel
    status: mapStatus(reservation.status),
    channel: mapChannel(reservation.channel),
    payment_method: reservation.payment_method,

    // ML features
    lead_time: leadTime,
    length_of_stay: lengthOfStay,

    // Metadata
    synced_at: new Date(),
    version,
  };

  // Optionally include raw HostPMS data for debugging/audit
  if (includeRawData) {
    unified.raw_data = reservation;
  }

  return unified;
}

/**
 * Batch mapper: Transform array of HostPMS reservations
 */
export function mapHostPMSArrayToUnified(
  reservations: HostPMSReservation[],
  options?: {
    includeRawData?: boolean;
  }
): UnifiedBooking[] {
  return reservations.map((reservation) =>
    mapHostPMSToUnified(reservation, options)
  );
}

/**
 * Validate HostPMS reservation has required fields
 */
export function validateHostPMSReservation(
  reservation: HostPMSReservation
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!reservation.reservation_id) {
    errors.push('Missing reservation_id');
  }
  if (!reservation.property_id) {
    errors.push('Missing property_id');
  }
  if (!reservation.guest?.name) {
    errors.push('Missing guest.name');
  }
  if (!reservation.room?.number) {
    errors.push('Missing room.number');
  }
  if (!reservation.room?.type) {
    errors.push('Missing room.type');
  }
  if (!reservation.dates?.check_in) {
    errors.push('Missing dates.check_in');
  }
  if (!reservation.dates?.check_out) {
    errors.push('Missing dates.check_out');
  }
  if (!reservation.dates?.created_at) {
    errors.push('Missing dates.created_at');
  }
  if (reservation.pricing?.total === undefined) {
    errors.push('Missing pricing.total');
  }
  if (!reservation.pricing?.currency) {
    errors.push('Missing pricing.currency');
  }
  if (!reservation.status) {
    errors.push('Missing status');
  }

  // Validate dates
  if (reservation.dates?.check_in && reservation.dates?.check_out) {
    const checkIn = new Date(reservation.dates.check_in);
    const checkOut = new Date(reservation.dates.check_out);

    if (checkOut <= checkIn) {
      errors.push('check_out must be after check_in');
    }
  }

  // Validate pricing
  if (reservation.pricing?.total !== undefined && reservation.pricing.total < 0) {
    errors.push('pricing.total cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize guest data (for GDPR compliance)
 * Masks email and phone for deleted/anonymized guests
 */
export function sanitizeGuestData(
  booking: UnifiedBooking,
  options: {
    maskEmail?: boolean;
    maskPhone?: boolean;
    maskName?: boolean;
  } = {}
): UnifiedBooking {
  const sanitized = { ...booking };

  if (options.maskEmail && sanitized.guest_email) {
    sanitized.guest_email = 'anonymized@example.com';
  }

  if (options.maskPhone && sanitized.guest_phone) {
    sanitized.guest_phone = '+XXX-XXXXX-XXXX';
  }

  if (options.maskName && sanitized.guest_name) {
    sanitized.guest_name = 'Guest (Anonymized)';
  }

  // Remove raw data entirely
  delete sanitized.raw_data;

  return sanitized;
}
