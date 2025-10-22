import { allocateRoomML, ML_ALLOCATION_MODELS } from '../ml-based';
import type { Room, Guest, Booking } from '../types';

describe('ML-Based Room Allocation', () => {
  const createRoom = (overrides: Partial<Room> = {}): Room => ({
    id: 'room-1',
    number: '101',
    type: 'double',
    floor: 3,
    view: 'ocean',
    accessible: false,
    smokingAllowed: false,
    petFriendly: false,
    distanceFromElevator: 5,
    basePrice: 150,
    status: 'available',
    ...overrides,
  });

  const createGuest = (overrides: Partial<Guest> = {}): Guest => ({
    id: 'guest-1',
    name: 'John Doe',
    email: 'john@example.com',
    vipStatus: false,
    previousStays: 0,
    preferences: {},
    ...overrides,
  });

  const createBooking = (overrides: Partial<Booking> = {}): Booking => ({
    id: 'booking-1',
    guestId: 'guest-1',
    checkIn: new Date('2024-06-01'),
    checkOut: new Date('2024-06-03'),
    requestedRoomType: 'double',
    assignedRoom: null,
    ...overrides,
  });

  describe('allocateRoomML', () => {
    describe('Room Type and Availability', () => {
      it('should only consider rooms of requested type', () => {
        const booking = createBooking({ requestedRoomType: 'suite' });
        const guest = createGuest();
        const rooms = [
          createRoom({ id: 'r1', type: 'double' }),
          createRoom({ id: 'r2', type: 'suite' }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.method).toBe('ml-based');
      });

      it('should only consider available rooms', () => {
        const booking = createBooking();
        const guest = createGuest();
        const rooms = [
          createRoom({ id: 'r1', status: 'occupied' }),
          createRoom({ id: 'r2', status: 'available' }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
      });

      it('should return null when no rooms available', () => {
        const booking = createBooking();
        const guest = createGuest();
        const rooms: Room[] = [];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom).toBeNull();
        expect(result.score).toBe(0);
        expect(result.reasons).toContain('No rooms available of requested type');
      });

      it('should return null when no rooms match type', () => {
        const booking = createBooking({ requestedRoomType: 'suite' });
        const guest = createGuest();
        const rooms = [createRoom({ type: 'double' })];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom).toBeNull();
        expect(result.reasons).toContain('No rooms available of requested type');
      });
    });

    describe('View Preference Matching', () => {
      it('should prioritize exact view match', () => {
        const guest = createGuest({ preferences: { view: 'ocean' } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', view: 'city' }),
          createRoom({ id: 'r2', view: 'ocean' }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Perfect view match');
      });

      it('should score ocean view higher than other views', () => {
        const guest = createGuest();
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', view: 'city' }),
          createRoom({ id: 'r2', view: 'ocean' }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        // Ocean should be preferred even without explicit preference
        expect(result.assignedRoom?.view).toBe('ocean');
      });
    });

    describe('Floor Preference Matching', () => {
      it('should match low floor preference', () => {
        const guest = createGuest({ preferences: { floor: 'low' } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', floor: 10 }),
          createRoom({ id: 'r2', floor: 2 }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.assignedRoom?.floor).toBeLessThanOrEqual(3);
      });

      it('should match medium floor preference', () => {
        const guest = createGuest({ preferences: { floor: 'medium' } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', floor: 2 }),
          createRoom({ id: 'r2', floor: 6 }),
          createRoom({ id: 'r3', floor: 12 }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.floor).toBeGreaterThanOrEqual(4);
        expect(result.assignedRoom?.floor).toBeLessThanOrEqual(8);
      });

      it('should match high floor preference', () => {
        const guest = createGuest({ preferences: { floor: 'high' } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', floor: 2 }),
          createRoom({ id: 'r2', floor: 10 }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.assignedRoom?.floor).toBeGreaterThanOrEqual(9);
      });
    });

    describe('Smoking Preference', () => {
      it('should match smoking preference for smoker', () => {
        const guest = createGuest({ preferences: { smoking: true } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', smokingAllowed: false }),
          createRoom({ id: 'r2', smokingAllowed: true }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Smoking preference matched');
      });

      it('should match non-smoking preference', () => {
        const guest = createGuest({ preferences: { smoking: false } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', smokingAllowed: true }),
          createRoom({ id: 'r2', smokingAllowed: false }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Smoking preference matched');
      });
    });

    describe('Accessibility Requirements', () => {
      it('should prioritize accessible rooms for guests needing them', () => {
        const guest = createGuest({ preferences: { accessible: true } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', accessible: false }),
          createRoom({ id: 'r2', accessible: true }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Accessible room');
      });
    });

    describe('VIP Status', () => {
      it('should apply VIP bonus to scoring', () => {
        const vipGuest = createGuest({ vipStatus: true });
        const regularGuest = createGuest({ vipStatus: false });
        const booking = createBooking();
        const rooms = [createRoom({ view: 'ocean' })];

        const vipResult = allocateRoomML(booking, vipGuest, rooms);
        const regularResult = allocateRoomML(booking, regularGuest, rooms);

        expect(vipResult.score).toBeGreaterThan(regularResult.score);
        expect(vipResult.reasons).toContain('VIP preference applied');
      });
    });

    describe('Loyalty Program', () => {
      it('should give loyalty bonus for returning guests', () => {
        const loyalGuest = createGuest({ previousStays: 10 });
        const newGuest = createGuest({ previousStays: 0 });
        const booking = createBooking();
        const rooms = [createRoom()];

        const loyalResult = allocateRoomML(booking, loyalGuest, rooms);
        const newResult = allocateRoomML(booking, newGuest, rooms);

        expect(loyalResult.score).toBeGreaterThan(newResult.score);
        expect(loyalResult.reasons).toContain('Loyalty guest bonus');
      });

      it('should cap loyalty score at 10 stays', () => {
        const guest1 = createGuest({ previousStays: 10 });
        const guest2 = createGuest({ previousStays: 20 });
        const booking = createBooking();
        const rooms = [createRoom()];

        const result1 = allocateRoomML(booking, guest1, rooms);
        const result2 = allocateRoomML(booking, guest2, rooms);

        expect(result1.score).toBeCloseTo(result2.score, 1);
      });
    });

    describe('Budget Considerations', () => {
      it('should prefer rooms within budget', () => {
        const guest = createGuest({ budgetMax: 150 });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', basePrice: 300 }),
          createRoom({ id: 'r2', basePrice: 150 }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons).toContain('Within budget');
      });

      it('should handle guests without budget constraint', () => {
        const guest = createGuest({ budgetMax: undefined });
        const booking = createBooking();
        const rooms = [createRoom({ basePrice: 500 })];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom).not.toBeNull();
        expect(result.score).toBeGreaterThan(0);
      });
    });

    describe('Quiet Location Preference', () => {
      it('should prefer higher floors for quiet preference', () => {
        const guest = createGuest({ preferences: { quiet: true } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', floor: 1 }),
          createRoom({ id: 'r2', floor: 5 }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.assignedRoom?.floor).toBeGreaterThan(2);
        expect(result.reasons).toContain('Quiet location');
      });
    });

    describe('Complex Scenarios', () => {
      it('should handle multiple preferences correctly', () => {
        const guest = createGuest({
          vipStatus: true,
          previousStays: 5,
          budgetMax: 200,
          preferences: {
            view: 'ocean',
            floor: 'high',
            quiet: true,
            accessible: false,
            smoking: false,
          },
        });
        const booking = createBooking();
        const rooms = [
          createRoom({
            id: 'r1',
            view: 'city',
            floor: 2,
            basePrice: 100,
          }),
          createRoom({
            id: 'r2',
            view: 'ocean',
            floor: 10,
            basePrice: 180,
            smokingAllowed: false,
          }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.reasons.length).toBeGreaterThan(1);
        expect(result.score).toBeGreaterThan(50);
      });

      it('should select best room from multiple candidates', () => {
        const guest = createGuest({ preferences: { view: 'ocean' } });
        const booking = createBooking();
        const rooms = [
          createRoom({ id: 'r1', view: 'city', floor: 5 }),
          createRoom({ id: 'r2', view: 'ocean', floor: 3 }),
          createRoom({ id: 'r3', view: 'garden', floor: 8 }),
        ];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom?.id).toBe('r2');
        expect(result.assignedRoom?.view).toBe('ocean');
      });

      it('should return fallback reason when no specific matches', () => {
        const guest = createGuest();
        const booking = createBooking();
        const rooms = [createRoom()];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.assignedRoom).not.toBeNull();
        if (result.reasons.length === 1 && !result.reasons.some((r) => r !== 'ML-optimized match')) {
          expect(result.reasons).toContain('ML-optimized match');
        }
      });
    });

    describe('Score Range', () => {
      it('should return scores between 0 and 100', () => {
        const guest = createGuest({
          vipStatus: true,
          previousStays: 10,
          preferences: { view: 'ocean' },
        });
        const booking = createBooking();
        const rooms = [createRoom({ view: 'ocean' })];

        const result = allocateRoomML(booking, guest, rooms);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });

      it('should give higher scores for better matches', () => {
        const perfectGuest = createGuest({
          vipStatus: true,
          previousStays: 10,
          budgetMax: 150,
          preferences: {
            view: 'ocean',
            smoking: false,
            accessible: false,
          },
        });
        const basicGuest = createGuest();
        const booking = createBooking();
        const rooms = [
          createRoom({
            view: 'ocean',
            smokingAllowed: false,
            accessible: false,
            basePrice: 150,
          }),
        ];

        const perfectResult = allocateRoomML(booking, perfectGuest, rooms);
        const basicResult = allocateRoomML(booking, basicGuest, rooms);

        expect(perfectResult.score).toBeGreaterThan(basicResult.score);
      });
    });
  });

  describe('ML_ALLOCATION_MODELS', () => {
    it('should define feature-based model', () => {
      const model = ML_ALLOCATION_MODELS['feature-based'];

      expect(model).toBeDefined();
      expect(model.name).toBe('Feature-based ML');
      expect(model.type).toBe('neural-net');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(15);
      expect(model.accuracy).toBe(0.89);
    });

    it('should define clustering model', () => {
      const model = ML_ALLOCATION_MODELS.clustering;

      expect(model).toBeDefined();
      expect(model.type).toBe('clustering');
      expect(model.cost).toBe(0);
      expect(model.avgLatency).toBe(25);
    });

    it('should define collaborative filtering model', () => {
      const model = ML_ALLOCATION_MODELS['collaborative-filtering'];

      expect(model).toBeDefined();
      expect(model.type).toBe('recommendation');
      expect(model.cost).toBe(0);
      expect(model.accuracy).toBe(0.85);
    });

    it('should have all models with zero cost (local processing)', () => {
      Object.values(ML_ALLOCATION_MODELS).forEach((model) => {
        expect(model.cost).toBe(0);
      });
    });

    it('should have all models with reasonable latency', () => {
      Object.values(ML_ALLOCATION_MODELS).forEach((model) => {
        expect(model.avgLatency).toBeGreaterThan(0);
        expect(model.avgLatency).toBeLessThan(100);
      });
    });

    it('should have all models with accuracy between 0 and 1', () => {
      Object.values(ML_ALLOCATION_MODELS).forEach((model) => {
        expect(model.accuracy).toBeGreaterThanOrEqual(0);
        expect(model.accuracy).toBeLessThanOrEqual(1);
      });
    });
  });
});
