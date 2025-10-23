import {
  mapStatus,
  mapChannel,
  mapRoomType,
  calculateLeadTime,
  calculateLengthOfStay,
  mapHostPMSToUnified,
  mapHostPMSArrayToUnified,
  validateHostPMSReservation,
  sanitizeGuestData,
} from '../mapper';
import type { HostPMSReservation, UnifiedBooking } from '../types';

describe('HostPMS Mapper', () => {
  describe('mapStatus', () => {
    it('should map Portuguese status to English', () => {
      expect(mapStatus('confirmado')).toBe('confirmed');
      expect(mapStatus('cancelado')).toBe('cancelled');
      expect(mapStatus('check_in')).toBe('checked_in');
      expect(mapStatus('check_out')).toBe('checked_out');
      expect(mapStatus('no_show')).toBe('no_show');
      expect(mapStatus('pendente')).toBe('pending');
    });

    it('should return default status for unknown values', () => {
      // @ts-expect-error Testing invalid input
      expect(mapStatus('unknown')).toBe('confirmed');
    });
  });

  describe('mapChannel', () => {
    it('should map Portuguese channels to English', () => {
      expect(mapChannel('direto')).toBe('direct');
      expect(mapChannel('booking_com')).toBe('ota');
      expect(mapChannel('expedia')).toBe('ota');
      expect(mapChannel('airbnb')).toBe('ota');
      expect(mapChannel('agencia')).toBe('agent');
      expect(mapChannel('outro')).toBe('other');
    });

    it('should return "other" for unknown channels', () => {
      // @ts-expect-error Testing invalid input
      expect(mapChannel('unknown')).toBe('other');
    });
  });

  describe('mapRoomType', () => {
    it('should map Portuguese room types to English', () => {
      expect(mapRoomType('Quarto Duplo')).toBe('Double Room');
      expect(mapRoomType('Quarto Twin')).toBe('Twin Room');
      expect(mapRoomType('Suite')).toBe('Suite');
      expect(mapRoomType('Quarto Individual')).toBe('Single Room');
      expect(mapRoomType('Quarto Triplo')).toBe('Triple Room');
      expect(mapRoomType('Quarto Familiar')).toBe('Family Room');
    });

    it('should map Spanish room types to English', () => {
      expect(mapRoomType('Habitación Doble')).toBe('Double Room');
      expect(mapRoomType('Habitación Individual')).toBe('Single Room');
      expect(mapRoomType('Habitación Triple')).toBe('Triple Room');
    });

    it('should handle case-insensitive matching', () => {
      expect(mapRoomType('quarto duplo')).toBe('Double Room');
      expect(mapRoomType('QUARTO TWIN')).toBe('Twin Room');
      expect(mapRoomType('SuItE')).toBe('Suite');
    });

    it('should return original value for unknown room types', () => {
      expect(mapRoomType('Unknown Room Type')).toBe('Unknown Room Type');
      expect(mapRoomType('Custom Room')).toBe('Custom Room');
    });
  });

  describe('calculateLeadTime', () => {
    it('should calculate lead time in days', () => {
      const bookedAt = new Date('2024-01-01');
      const checkInDate = new Date('2024-01-15');
      expect(calculateLeadTime(bookedAt, checkInDate)).toBe(14);
    });

    it('should handle same-day booking', () => {
      const date = new Date('2024-01-01');
      expect(calculateLeadTime(date, date)).toBe(0);
    });

    it('should return 0 for negative lead time (edge case)', () => {
      const bookedAt = new Date('2024-01-15');
      const checkInDate = new Date('2024-01-01');
      expect(calculateLeadTime(bookedAt, checkInDate)).toBe(0);
    });

    it('should calculate long lead times correctly', () => {
      const bookedAt = new Date('2024-01-01');
      const checkInDate = new Date('2024-12-31');
      expect(calculateLeadTime(bookedAt, checkInDate)).toBe(365);
    });
  });

  describe('calculateLengthOfStay', () => {
    it('should calculate length of stay in nights', () => {
      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-05');
      expect(calculateLengthOfStay(checkIn, checkOut)).toBe(4);
    });

    it('should return 1 for single night stay', () => {
      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-02');
      expect(calculateLengthOfStay(checkIn, checkOut)).toBe(1);
    });

    it('should return minimum 1 night for same-day dates', () => {
      const date = new Date('2024-01-01');
      expect(calculateLengthOfStay(date, date)).toBe(1);
    });

    it('should calculate long stays correctly', () => {
      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-31');
      expect(calculateLengthOfStay(checkIn, checkOut)).toBe(30);
    });
  });

  describe('mapHostPMSToUnified', () => {
    const validReservation: HostPMSReservation = {
      reservation_id: 'RSV-12345',
      property_id: 'PT-LIS-001',
      guest: {
        name: 'João Silva',
        email: 'joao.silva@example.pt',
        phone: '+351912345678',
        country: 'PT',
        nif: '123456789',
      },
      room: {
        type: 'Quarto Duplo',
        number: '201',
        floor: 2,
      },
      dates: {
        check_in: '2024-03-20',
        check_out: '2024-03-25',
        created_at: '2024-03-01T10:30:00Z',
      },
      pricing: {
        total: 450.0,
        currency: 'EUR',
        rate_plan: 'Flexível',
        iva: 103.5,
        taxa_turistica: 10.0,
      },
      status: 'confirmado',
      channel: 'booking_com',
      payment_method: 'credit_card',
      special_requests: 'Quarto silencioso',
    };

    it('should transform HostPMS reservation to unified booking', () => {
      const unified = mapHostPMSToUnified(validReservation);

      expect(unified.external_id).toBe('RSV-12345');
      expect(unified.source).toBe('hostpms');
      expect(unified.hotel_id).toBe('PT-LIS-001');
      expect(unified.guest_name).toBe('João Silva');
      expect(unified.guest_email).toBe('joao.silva@example.pt');
      expect(unified.guest_phone).toBe('+351912345678');
      expect(unified.guest_country).toBe('PT');
      expect(unified.room_number).toBe('201');
      expect(unified.room_type).toBe('Double Room');
      expect(unified.total_amount).toBe(450.0);
      expect(unified.currency).toBe('EUR');
      expect(unified.status).toBe('confirmed');
      expect(unified.channel).toBe('ota');
      expect(unified.payment_method).toBe('credit_card');
    });

    it('should convert dates correctly', () => {
      const unified = mapHostPMSToUnified(validReservation);

      expect(unified.check_in_date).toBeInstanceOf(Date);
      expect(unified.check_out_date).toBeInstanceOf(Date);
      expect(unified.booked_at).toBeInstanceOf(Date);

      expect(unified.check_in_date.toISOString()).toBe(
        '2024-03-20T00:00:00.000Z'
      );
      expect(unified.check_out_date.toISOString()).toBe(
        '2024-03-25T00:00:00.000Z'
      );
    });

    it('should calculate ML features correctly', () => {
      const unified = mapHostPMSToUnified(validReservation);

      expect(unified.lead_time).toBe(18); // 18 days (Mar 1 10:30 → Mar 20 00:00)
      expect(unified.length_of_stay).toBe(5); // 5 nights
    });

    it('should set synced_at timestamp', () => {
      const before = new Date();
      const unified = mapHostPMSToUnified(validReservation);
      const after = new Date();

      expect(unified.synced_at).toBeInstanceOf(Date);
      expect(unified.synced_at.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(unified.synced_at.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should generate UUID by default', () => {
      const unified = mapHostPMSToUnified(validReservation);
      expect(unified.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should not generate ID when generateId is false', () => {
      const unified = mapHostPMSToUnified(validReservation, {
        generateId: false,
      });
      expect(unified.id).toBe('');
    });

    it('should include raw data when requested', () => {
      const unified = mapHostPMSToUnified(validReservation, {
        includeRawData: true,
      });
      expect(unified.raw_data).toEqual(validReservation);
    });

    it('should not include raw data by default', () => {
      const unified = mapHostPMSToUnified(validReservation);
      expect(unified.raw_data).toBeUndefined();
    });

    it('should set custom version when provided', () => {
      const unified = mapHostPMSToUnified(validReservation, { version: 5 });
      expect(unified.version).toBe(5);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalReservation: HostPMSReservation = {
        ...validReservation,
        guest: {
          name: 'João Silva',
        },
        payment_method: undefined,
      };

      const unified = mapHostPMSToUnified(minimalReservation);

      expect(unified.guest_email).toBeUndefined();
      expect(unified.guest_phone).toBeUndefined();
      expect(unified.guest_country).toBeUndefined();
      expect(unified.payment_method).toBeUndefined();
    });
  });

  describe('mapHostPMSArrayToUnified', () => {
    it('should transform array of reservations', () => {
      const reservations: HostPMSReservation[] = [
        {
          reservation_id: 'RSV-1',
          property_id: 'PT-LIS-001',
          guest: { name: 'Guest 1' },
          room: { type: 'Suite', number: '101' },
          dates: {
            check_in: '2024-03-20',
            check_out: '2024-03-25',
            created_at: '2024-03-01T10:00:00Z',
          },
          pricing: { total: 500, currency: 'EUR' },
          status: 'confirmado',
          channel: 'direto',
        },
        {
          reservation_id: 'RSV-2',
          property_id: 'PT-LIS-001',
          guest: { name: 'Guest 2' },
          room: { type: 'Quarto Duplo', number: '102' },
          dates: {
            check_in: '2024-03-21',
            check_out: '2024-03-24',
            created_at: '2024-03-02T11:00:00Z',
          },
          pricing: { total: 300, currency: 'EUR' },
          status: 'cancelado',
          channel: 'booking_com',
        },
      ];

      const unified = mapHostPMSArrayToUnified(reservations);

      expect(unified).toHaveLength(2);
      expect(unified[0].external_id).toBe('RSV-1');
      expect(unified[0].status).toBe('confirmed');
      expect(unified[1].external_id).toBe('RSV-2');
      expect(unified[1].status).toBe('cancelled');
    });

    it('should handle empty array', () => {
      const unified = mapHostPMSArrayToUnified([]);
      expect(unified).toEqual([]);
    });
  });

  describe('validateHostPMSReservation', () => {
    const validReservation: HostPMSReservation = {
      reservation_id: 'RSV-12345',
      property_id: 'PT-LIS-001',
      guest: {
        name: 'João Silva',
        email: 'joao@example.pt',
      },
      room: {
        type: 'Quarto Duplo',
        number: '201',
      },
      dates: {
        check_in: '2024-03-20',
        check_out: '2024-03-25',
        created_at: '2024-03-01T10:00:00Z',
      },
      pricing: {
        total: 450,
        currency: 'EUR',
      },
      status: 'confirmado',
      channel: 'direto',
    };

    it('should validate correct reservation', () => {
      const result = validateHostPMSReservation(validReservation);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing reservation_id', () => {
      const invalid = { ...validReservation, reservation_id: '' };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing reservation_id');
    });

    it('should detect missing property_id', () => {
      const invalid = { ...validReservation, property_id: '' };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing property_id');
    });

    it('should detect missing guest name', () => {
      const invalid = { ...validReservation, guest: { name: '' } };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing guest.name');
    });

    it('should detect missing room number', () => {
      const invalid = {
        ...validReservation,
        room: { ...validReservation.room, number: '' },
      };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing room.number');
    });

    it('should detect missing room type', () => {
      const invalid = {
        ...validReservation,
        room: { ...validReservation.room, type: '' },
      };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing room.type');
    });

    it('should detect missing check-in date', () => {
      const invalid = {
        ...validReservation,
        dates: { ...validReservation.dates, check_in: '' },
      };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing dates.check_in');
    });

    it('should detect invalid date range (check-out before check-in)', () => {
      const invalid = {
        ...validReservation,
        dates: {
          check_in: '2024-03-25',
          check_out: '2024-03-20',
          created_at: '2024-03-01T10:00:00Z',
        },
      };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('check_out must be after check_in');
    });

    it('should detect negative pricing', () => {
      const invalid = {
        ...validReservation,
        pricing: { ...validReservation.pricing, total: -100 },
      };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('pricing.total cannot be negative');
    });

    it('should detect missing status', () => {
      const invalid = { ...validReservation, status: '' as any };
      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing status');
    });

    it('should accumulate multiple errors', () => {
      const invalid: HostPMSReservation = {
        reservation_id: '',
        property_id: '',
        guest: { name: '' },
        room: { type: '', number: '' },
        dates: {
          check_in: '',
          check_out: '',
          created_at: '',
        },
        pricing: { total: -10, currency: '' },
        status: '' as any,
        channel: 'direto',
      };

      const result = validateHostPMSReservation(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
    });
  });

  describe('sanitizeGuestData', () => {
    const booking: UnifiedBooking = {
      id: 'uuid-123',
      external_id: 'RSV-12345',
      source: 'hostpms',
      hotel_id: 'PT-LIS-001',
      guest_name: 'João Silva',
      guest_email: 'joao.silva@example.pt',
      guest_phone: '+351912345678',
      guest_country: 'PT',
      room_number: '201',
      room_type: 'Double Room',
      check_in_date: new Date('2024-03-20'),
      check_out_date: new Date('2024-03-25'),
      booked_at: new Date('2024-03-01'),
      total_amount: 450,
      currency: 'EUR',
      status: 'confirmed',
      channel: 'ota',
      lead_time: 19,
      length_of_stay: 5,
      synced_at: new Date(),
      version: 1,
      raw_data: { original: 'data' },
    };

    it('should mask email when requested', () => {
      const sanitized = sanitizeGuestData(booking, { maskEmail: true });
      expect(sanitized.guest_email).toBe('anonymized@example.com');
      expect(sanitized.guest_phone).toBe('+351912345678'); // Not masked
      expect(sanitized.guest_name).toBe('João Silva'); // Not masked
    });

    it('should mask phone when requested', () => {
      const sanitized = sanitizeGuestData(booking, { maskPhone: true });
      expect(sanitized.guest_phone).toBe('+XXX-XXXXX-XXXX');
      expect(sanitized.guest_email).toBe('joao.silva@example.pt'); // Not masked
      expect(sanitized.guest_name).toBe('João Silva'); // Not masked
    });

    it('should mask name when requested', () => {
      const sanitized = sanitizeGuestData(booking, { maskName: true });
      expect(sanitized.guest_name).toBe('Guest (Anonymized)');
      expect(sanitized.guest_email).toBe('joao.silva@example.pt'); // Not masked
      expect(sanitized.guest_phone).toBe('+351912345678'); // Not masked
    });

    it('should mask all fields when all options true', () => {
      const sanitized = sanitizeGuestData(booking, {
        maskEmail: true,
        maskPhone: true,
        maskName: true,
      });
      expect(sanitized.guest_name).toBe('Guest (Anonymized)');
      expect(sanitized.guest_email).toBe('anonymized@example.com');
      expect(sanitized.guest_phone).toBe('+XXX-XXXXX-XXXX');
    });

    it('should remove raw_data regardless of masking options', () => {
      const sanitized1 = sanitizeGuestData(booking, {});
      expect(sanitized1.raw_data).toBeUndefined();

      const sanitized2 = sanitizeGuestData(booking, { maskEmail: true });
      expect(sanitized2.raw_data).toBeUndefined();
    });

    it('should not modify original booking object', () => {
      const originalEmail = booking.guest_email;
      sanitizeGuestData(booking, { maskEmail: true });
      expect(booking.guest_email).toBe(originalEmail);
    });

    it('should handle missing optional fields', () => {
      const bookingWithoutOptional: UnifiedBooking = {
        ...booking,
        guest_email: undefined,
        guest_phone: undefined,
      };

      const sanitized = sanitizeGuestData(bookingWithoutOptional, {
        maskEmail: true,
        maskPhone: true,
      });

      expect(sanitized.guest_email).toBeUndefined();
      expect(sanitized.guest_phone).toBeUndefined();
    });
  });
});
