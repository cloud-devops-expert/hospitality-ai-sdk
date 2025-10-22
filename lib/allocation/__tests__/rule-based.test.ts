import { allocateRoomRuleBased, batchAllocate, getConstraints } from '../rule-based';
import type { Room, Guest, Booking } from '../types';

describe('Rule-Based Room Allocation', () => {
  const createRoom = (overrides: Partial<Room> = {}): Room => ({
    id: 'room-1',
    number: '101',
    type: 'double',
    floor: 5,
    accessible: false,
    smokingAllowed: false,
    view: 'ocean',
    status: 'available',
    basePrice: 150,
    ...overrides,
  });

  const createGuest = (overrides: Partial<Guest> = {}): Guest => ({
    id: 'guest-1',
    name: 'John Doe',
    preferences: {},
    vipStatus: false,
    previousStays: 0,
    ...overrides,
  });

  const createBooking = (overrides: Partial<Booking> = {}): Booking => ({
    id: 'booking-1',
    guestId: 'guest-1',
    checkIn: new Date('2024-01-01'),
    checkOut: new Date('2024-01-05'),
    requestedRoomType: 'double',
    ...overrides,
  });

  describe('allocateRoomRuleBased', () => {
    describe('Basic Room Matching', () => {
      it('should allocate room when type matches', () => {
        const booking = createBooking({ requestedRoomType: 'double' });
        const guest = createGuest();
        const rooms = [createRoom({ type: 'double' })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom).not.toBeNull();
        expect(result.assignedRoom?.type).toBe('double');
        expect(result.method).toBe('rule-based');
      });

      it('should return null when no rooms of requested type', () => {
        const booking = createBooking({ requestedRoomType: 'suite' });
        const guest = createGuest();
        const rooms = [createRoom({ type: 'double' })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom).toBeNull();
        expect(result.score).toBe(0);
        expect(result.reasons).toContain('No rooms available of requested type');
      });

      it('should filter out non-available rooms', () => {
        const booking = createBooking({ requestedRoomType: 'double' });
        const guest = createGuest();
        const rooms = [
          createRoom({ type: 'double', status: 'occupied' }),
          createRoom({ type: 'double', status: 'maintenance' }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom).toBeNull();
      });
    });

    describe('Accessibility Requirements', () => {
      it('should highly prioritize accessible rooms for guests needing them', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { accessible: true } });
        const rooms = [
          createRoom({ id: 'r1', accessible: false }),
          createRoom({ id: 'r2', accessible: true }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Accessible room matched');
      });

      it('should penalize non-accessible rooms when accessibility needed', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { accessible: true } });
        const rooms = [createRoom({ accessible: false })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.score).toBeLessThan(50);
        expect(result.reasons).toContain('Accessibility requirement not met');
      });
    });

    describe('Smoking Preferences', () => {
      it('should match smoking room for smokers', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { smoking: true } });
        const rooms = [
          createRoom({ id: 'r1', smokingAllowed: false }),
          createRoom({ id: 'r2', smokingAllowed: true }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Smoking preference matched');
      });

      it('should match non-smoking room for non-smokers', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { smoking: false } });
        const rooms = [
          createRoom({ id: 'r1', smokingAllowed: true }),
          createRoom({ id: 'r2', smokingAllowed: false }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Smoking preference matched');
      });

      it('should penalize mismatched smoking preference', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { smoking: true } });
        const rooms = [createRoom({ smokingAllowed: false })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.score).toBeLessThan(50);
        expect(result.reasons).toContain('Smoking preference not matched');
      });
    });

    describe('View Preferences', () => {
      it('should prefer rooms with matching view', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { view: 'ocean' } });
        const rooms = [
          createRoom({ id: 'r1', view: 'city' }),
          createRoom({ id: 'r2', view: 'ocean' }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Preferred ocean view');
      });

      it('should still allocate room without preferred view', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { view: 'garden' } });
        const rooms = [createRoom({ view: 'city' })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom).not.toBeNull();
      });
    });

    describe('Floor Preferences', () => {
      it('should match low floor preference', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { floor: 'low' } });
        const rooms = [
          createRoom({ id: 'r1', floor: 10 }),
          createRoom({ id: 'r2', floor: 2 }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Floor preference matched');
      });

      it('should match medium floor preference', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { floor: 'medium' } });
        const rooms = [
          createRoom({ id: 'r1', floor: 2 }),
          createRoom({ id: 'r2', floor: 6 }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
      });

      it('should match high floor preference', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { floor: 'high' } });
        const rooms = [
          createRoom({ id: 'r1', floor: 5 }),
          createRoom({ id: 'r2', floor: 12 }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
      });
    });

    describe('VIP Priority', () => {
      it('should prioritize ocean view for VIPs', () => {
        const booking = createBooking();
        const guest = createGuest({ vipStatus: true });
        const rooms = [
          createRoom({ id: 'r1', view: 'city' }),
          createRoom({ id: 'r2', view: 'ocean' }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('VIP ocean view priority');
      });

      it('should prioritize suite and deluxe rooms for VIPs', () => {
        const booking = createBooking({ requestedRoomType: 'deluxe' });
        const guest = createGuest({ vipStatus: true });
        const rooms = [createRoom({ type: 'deluxe' })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.reasons).toContain('VIP room type priority');
      });
    });

    describe('Loyalty Bonus', () => {
      it('should give bonus to returning guests', () => {
        const booking = createBooking();
        const guest = createGuest({ previousStays: 10 });
        const rooms = [createRoom()];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.reasons).toContain('Loyalty guest bonus');
      });

      it('should not give bonus for new guests', () => {
        const booking = createBooking();
        const guest = createGuest({ previousStays: 2 });
        const rooms = [createRoom()];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.reasons).not.toContain('Loyalty guest bonus');
      });
    });

    describe('Budget Constraints', () => {
      it('should penalize rooms over budget', () => {
        const booking = createBooking();
        const guest = createGuest({ budgetMax: 100 });
        const rooms = [
          createRoom({ id: 'r1', basePrice: 150 }),
          createRoom({ id: 'r2', basePrice: 80 }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
      });

      it('should include over budget reason when applicable', () => {
        const booking = createBooking();
        const guest = createGuest({ budgetMax: 100 });
        const rooms = [createRoom({ basePrice: 200 })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.reasons).toContain('Over budget');
      });
    });

    describe('Quiet Preference', () => {
      it('should avoid low floors for quiet preference', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { quiet: true } });
        const rooms = [
          createRoom({ id: 'r1', floor: 1 }),
          createRoom({ id: 'r2', floor: 8 }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
      });

      it('should penalize low floors for quiet guests', () => {
        const booking = createBooking();
        const guest = createGuest({ preferences: { quiet: true } });
        const rooms = [createRoom({ floor: 1 })];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.reasons).toContain('Low floor may be noisy');
      });
    });

    describe('Score Calculation', () => {
      it('should cap score at 100', () => {
        const booking = createBooking();
        const guest = createGuest({
          vipStatus: true,
          previousStays: 10,
          preferences: {
            accessible: true,
            smoking: true,
            view: 'ocean',
            floor: 'high',
          },
        });
        const rooms = [
          createRoom({
            accessible: true,
            smokingAllowed: true,
            view: 'ocean',
            floor: 12,
            type: 'suite',
          }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.score).toBeLessThanOrEqual(100);
      });

      it('should not go below 0', () => {
        const booking = createBooking();
        const guest = createGuest({
          budgetMax: 50,
          preferences: {
            accessible: true,
            smoking: true,
          },
        });
        const rooms = [
          createRoom({
            accessible: false,
            smokingAllowed: false,
            basePrice: 300,
          }),
        ];

        const result = allocateRoomRuleBased(booking, guest, rooms);

        expect(result.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('batchAllocate', () => {
    it('should allocate rooms for multiple bookings', () => {
      const bookings = [
        createBooking({ id: 'b1', guestId: 'g1' }),
        createBooking({ id: 'b2', guestId: 'g2' }),
      ];
      const guests = new Map([
        ['g1', createGuest({ id: 'g1' })],
        ['g2', createGuest({ id: 'g2' })],
      ]);
      const rooms = [createRoom({ id: 'r1' }), createRoom({ id: 'r2' })];

      const results = batchAllocate(bookings, guests, rooms);

      expect(results).toHaveLength(2);
      expect(results[0].assignedRoom).not.toBeNull();
      expect(results[1].assignedRoom).not.toBeNull();
    });

    it('should not assign same room twice', () => {
      const bookings = [
        createBooking({ id: 'b1', guestId: 'g1' }),
        createBooking({ id: 'b2', guestId: 'g2' }),
      ];
      const guests = new Map([
        ['g1', createGuest({ id: 'g1' })],
        ['g2', createGuest({ id: 'g2' })],
      ]);
      const rooms = [createRoom({ id: 'r1' })];

      const results = batchAllocate(bookings, guests, rooms);

      expect(results[0].assignedRoom).not.toBeNull();
      expect(results[1].assignedRoom).toBeNull();
    });

    it('should prioritize VIP guests', () => {
      const bookings = [
        createBooking({ id: 'b1', guestId: 'g1' }),
        createBooking({ id: 'b2', guestId: 'g2' }),
      ];
      const guests = new Map([
        ['g1', createGuest({ id: 'g1', vipStatus: false })],
        ['g2', createGuest({ id: 'g2', vipStatus: true })],
      ]);
      const rooms = [createRoom({ id: 'r1', view: 'ocean' })];

      const results = batchAllocate(bookings, guests, rooms);

      // VIP should get the ocean view room
      const vipResult = results.find((r) => r.booking.guestId === 'g2');
      expect(vipResult?.assignedRoom).not.toBeNull();
    });

    it('should prioritize by loyalty when VIP status equal', () => {
      const bookings = [
        createBooking({ id: 'b1', guestId: 'g1' }),
        createBooking({ id: 'b2', guestId: 'g2' }),
      ];
      const guests = new Map([
        ['g1', createGuest({ id: 'g1', vipStatus: false, previousStays: 10 })],
        ['g2', createGuest({ id: 'g2', vipStatus: false, previousStays: 2 })],
      ]);
      const rooms = [createRoom({ id: 'r1' })];

      const results = batchAllocate(bookings, guests, rooms);

      const loyalResult = results.find((r) => r.booking.guestId === 'g1');
      expect(loyalResult?.assignedRoom).not.toBeNull();
    });

    it('should skip bookings with missing guests', () => {
      const bookings = [createBooking({ id: 'b1', guestId: 'g-missing' })];
      const guests = new Map();
      const rooms = [createRoom()];

      const results = batchAllocate(bookings, guests, rooms);

      expect(results).toHaveLength(0);
    });
  });

  describe('getConstraints', () => {
    it('should return accessible as must-have', () => {
      const guest = createGuest({ preferences: { accessible: true } });
      const constraints = getConstraints(guest);

      expect(constraints.mustHaves).toContain('Accessible room required');
    });

    it('should return smoking preference as must-have', () => {
      const guest = createGuest({ preferences: { smoking: true } });
      const constraints = getConstraints(guest);

      expect(constraints.mustHaves).toContain('Smoking room');
    });

    it('should return non-smoking preference as must-have', () => {
      const guest = createGuest({ preferences: { smoking: false } });
      const constraints = getConstraints(guest);

      expect(constraints.mustHaves).toContain('Non-smoking room');
    });

    it('should return view as nice-to-have', () => {
      const guest = createGuest({ preferences: { view: 'ocean' } });
      const constraints = getConstraints(guest);

      expect(constraints.niceToHaves).toContain('ocean view preferred');
    });

    it('should return floor preference as nice-to-have', () => {
      const guest = createGuest({ preferences: { floor: 'high' } });
      const constraints = getConstraints(guest);

      expect(constraints.niceToHaves).toContain('high floor preferred');
    });

    it('should return quiet location as nice-to-have with conflicts', () => {
      const guest = createGuest({ preferences: { quiet: true } });
      const constraints = getConstraints(guest);

      expect(constraints.niceToHaves).toContain('Quiet location preferred');
      expect(constraints.conflicts).toContain('Rooms near elevators, lobby, or low floors');
    });

    it('should handle guest with no preferences', () => {
      const guest = createGuest({ preferences: {} });
      const constraints = getConstraints(guest);

      expect(constraints.mustHaves).toHaveLength(0);
      expect(constraints.niceToHaves).toHaveLength(0);
      expect(constraints.conflicts).toHaveLength(0);
    });

    it('should combine multiple preferences', () => {
      const guest = createGuest({
        preferences: {
          accessible: true,
          smoking: false,
          view: 'ocean',
          floor: 'high',
          quiet: true,
        },
      });
      const constraints = getConstraints(guest);

      expect(constraints.mustHaves.length).toBeGreaterThan(0);
      expect(constraints.niceToHaves.length).toBeGreaterThan(0);
      expect(constraints.conflicts.length).toBeGreaterThan(0);
    });
  });
});
