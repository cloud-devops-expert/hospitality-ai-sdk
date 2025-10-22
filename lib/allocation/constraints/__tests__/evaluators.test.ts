import {
  roomTypeMatchEvaluator,
  noDoubleBookingEvaluator,
  accessibilityRequiredEvaluator,
  smokingPolicyEvaluator,
  petPolicyEvaluator,
  vipOceanViewEvaluator,
  vipHighFloorEvaluator,
  viewPreferenceEvaluator,
  floorPreferenceEvaluator,
  quietLocationEvaluator,
  budgetConstraintEvaluator,
  earlyCheckinEvaluator,
  lateCheckoutEvaluator,
  CONSTRAINT_EVALUATORS,
} from '../evaluators';
import { RoomType, View } from '../../types/timefold';
import type { GuestBooking, Room } from '../../types/timefold';

describe('Constraint Evaluators', () => {
  // Test data
  const createRoom = (overrides: Partial<Room> = {}): Room => ({
    id: 'room-1',
    number: '101',
    type: RoomType.DOUBLE,
    floor: 3,
    view: View.OCEAN,
    accessible: false,
    smokingAllowed: false,
    petFriendly: false,
    distanceFromElevator: 5,
    pricePerNight: 150,
    ...overrides,
  });

  const createBooking = (overrides: Partial<GuestBooking> = {}): GuestBooking => ({
    id: 'booking-1',
    guest: {
      id: 'guest-1',
      name: 'John Doe',
      vip: false,
      loyaltyTier: 1,
      preferences: {
        highFloor: false,
        accessible: false,
        smoking: false,
        quiet: false,
        pets: false,
      },
    },
    checkIn: new Date('2024-01-01'),
    checkOut: new Date('2024-01-05'),
    requestedRoomType: RoomType.DOUBLE,
    ...overrides,
  });

  describe('HARD Constraints', () => {
    describe('roomTypeMatchEvaluator', () => {
      it('should return null when room type matches', () => {
        const booking = createBooking({
          requestedRoomType: RoomType.DOUBLE,
          assignedRoom: createRoom({ type: RoomType.DOUBLE }),
        });

        const result = roomTypeMatchEvaluator.evaluator(booking);

        expect(result).toBeNull();
      });

      it('should return negative hard score when room type does not match', () => {
        const booking = createBooking({
          requestedRoomType: RoomType.SUITE,
          assignedRoom: createRoom({ type: RoomType.DOUBLE }),
        });

        const result = roomTypeMatchEvaluator.evaluator(booking);

        expect(result).not.toBeNull();
        expect(result?.score.hardScore).toBe(-1);
        expect(result?.score.softScore).toBe(0);
        expect(result?.constraintCode).toBe('ROOM_TYPE_MATCH');
      });

      it('should return null when no room assigned', () => {
        const booking = createBooking({ assignedRoom: undefined });

        const result = roomTypeMatchEvaluator.evaluator(booking);

        expect(result).toBeNull();
      });
    });

    describe('noDoubleBookingEvaluator', () => {
      it('should return null when no overlapping bookings', () => {
        const booking1 = createBooking({
          id: 'booking-1',
          assignedRoom: createRoom({ id: 'room-1' }),
          checkIn: new Date('2024-01-01'),
          checkOut: new Date('2024-01-05'),
        });

        const booking2 = createBooking({
          id: 'booking-2',
          assignedRoom: createRoom({ id: 'room-1' }),
          checkIn: new Date('2024-01-06'),
          checkOut: new Date('2024-01-10'),
        });

        const result = noDoubleBookingEvaluator.evaluator(booking1, [booking1, booking2]);

        expect(result).toBeNull();
      });

      it('should return negative hard score when bookings overlap', () => {
        const booking1 = createBooking({
          id: 'booking-1',
          assignedRoom: createRoom({ id: 'room-1' }),
          checkIn: new Date('2024-01-01'),
          checkOut: new Date('2024-01-05'),
        });

        const booking2 = createBooking({
          id: 'booking-2',
          assignedRoom: createRoom({ id: 'room-1' }),
          checkIn: new Date('2024-01-03'),
          checkOut: new Date('2024-01-07'),
        });

        const result = noDoubleBookingEvaluator.evaluator(booking1, [booking1, booking2]);

        expect(result).not.toBeNull();
        expect(result?.score.hardScore).toBe(-1);
        expect(result?.justification).toContain('double-booked');
      });

      it('should handle same-day check-in/check-out', () => {
        const booking1 = createBooking({
          id: 'booking-1',
          assignedRoom: createRoom({ id: 'room-1' }),
          checkIn: new Date('2024-01-01'),
          checkOut: new Date('2024-01-05'),
        });

        const booking2 = createBooking({
          id: 'booking-2',
          assignedRoom: createRoom({ id: 'room-1' }),
          checkIn: new Date('2024-01-05'),
          checkOut: new Date('2024-01-10'),
        });

        const result = noDoubleBookingEvaluator.evaluator(booking1, [booking1, booking2]);

        expect(result).toBeNull();
      });
    });

    describe('accessibilityRequiredEvaluator', () => {
      it('should return null when guest does not need accessible room', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, accessible: false },
          },
          assignedRoom: createRoom({ accessible: false }),
        });

        const result = accessibilityRequiredEvaluator.evaluator(booking);

        expect(result).toBeNull();
      });

      it('should return null when accessible guest gets accessible room', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, accessible: true },
          },
          assignedRoom: createRoom({ accessible: true }),
        });

        const result = accessibilityRequiredEvaluator.evaluator(booking);

        expect(result).toBeNull();
      });

      it('should return negative hard score when accessible guest gets non-accessible room', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, accessible: true },
          },
          assignedRoom: createRoom({ accessible: false }),
        });

        const result = accessibilityRequiredEvaluator.evaluator(booking);

        expect(result).not.toBeNull();
        expect(result?.score.hardScore).toBe(-1);
        expect(result?.justification).toContain('accessible');
      });
    });

    describe('smokingPolicyEvaluator', () => {
      it('should return null when preferences match', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, smoking: false },
          },
          assignedRoom: createRoom({ smokingAllowed: false }),
        });

        const result = smokingPolicyEvaluator.evaluator(booking);

        expect(result).toBeNull();
      });

      it('should violate when smoker gets non-smoking room', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, smoking: true },
          },
          assignedRoom: createRoom({ smokingAllowed: false }),
        });

        const result = smokingPolicyEvaluator.evaluator(booking);

        expect(result).not.toBeNull();
        expect(result?.score.hardScore).toBe(-1);
        expect(result?.justification).toContain('Smoker');
      });

      it('should violate when non-smoker gets smoking room', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, smoking: false },
          },
          assignedRoom: createRoom({ smokingAllowed: true }),
        });

        const result = smokingPolicyEvaluator.evaluator(booking);

        expect(result).not.toBeNull();
        expect(result?.score.hardScore).toBe(-1);
        expect(result?.justification).toContain('Non-smoker');
      });
    });

    describe('petPolicyEvaluator', () => {
      it('should return null when guest has no pets', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, pets: false },
          },
          assignedRoom: createRoom({ petFriendly: false }),
        });

        const result = petPolicyEvaluator.evaluator(booking);

        expect(result).toBeNull();
      });

      it('should return null when guest with pets gets pet-friendly room', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, pets: true },
          },
          assignedRoom: createRoom({ petFriendly: true }),
        });

        const result = petPolicyEvaluator.evaluator(booking);

        expect(result).toBeNull();
      });

      it('should violate when guest with pets gets non-pet-friendly room', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, pets: true },
          },
          assignedRoom: createRoom({ petFriendly: false }),
        });

        const result = petPolicyEvaluator.evaluator(booking);

        expect(result).not.toBeNull();
        expect(result?.score.hardScore).toBe(-1);
        expect(result?.justification).toContain('pets');
      });
    });
  });

  describe('SOFT Constraints', () => {
    describe('vipOceanViewEvaluator', () => {
      it('should return positive soft score for VIP with ocean view', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, vip: true, loyaltyTier: 3 },
          assignedRoom: createRoom({ view: View.OCEAN }),
        });

        const result = vipOceanViewEvaluator.evaluator(booking, [], [], { weight: 100 });

        expect(result).not.toBeNull();
        expect(result?.score.hardScore).toBe(0);
        expect(result?.score.softScore).toBe(100);
      });

      it('should respect loyalty tier parameter', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, vip: true, loyaltyTier: 2 },
          assignedRoom: createRoom({ view: View.OCEAN }),
        });

        const result = vipOceanViewEvaluator.evaluator(booking, [], [], {
          minLoyaltyTier: 3,
          weight: 100,
        });

        expect(result).toBeNull();
      });

      it('should support custom view types', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, vip: true, loyaltyTier: 3 },
          assignedRoom: createRoom({ view: View.BEACH }),
        });

        const result = vipOceanViewEvaluator.evaluator(booking, [], [], {
          viewTypes: [View.BEACH],
          weight: 100,
        });

        expect(result).not.toBeNull();
      });
    });

    describe('vipHighFloorEvaluator', () => {
      it('should return positive soft score for VIP on high floor', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, vip: true, loyaltyTier: 2 },
          assignedRoom: createRoom({ floor: 8 }),
        });

        const result = vipHighFloorEvaluator.evaluator(booking, [], [], { weight: 80 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(80);
      });

      it('should return null for VIP on low floor', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, vip: true, loyaltyTier: 2 },
          assignedRoom: createRoom({ floor: 2 }),
        });

        const result = vipHighFloorEvaluator.evaluator(booking, [], [], { minFloor: 5 });

        expect(result).toBeNull();
      });
    });

    describe('viewPreferenceEvaluator', () => {
      it('should reward matching view preference', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, view: View.OCEAN },
          },
          assignedRoom: createRoom({ view: View.OCEAN }),
        });

        const result = viewPreferenceEvaluator.evaluator(booking, [], [], { weight: 50 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(50);
      });

      it('should return null when view does not match', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, view: View.OCEAN },
          },
          assignedRoom: createRoom({ view: View.CITY }),
        });

        const result = viewPreferenceEvaluator.evaluator(booking, [], [], {});

        expect(result).toBeNull();
      });
    });

    describe('floorPreferenceEvaluator', () => {
      it('should reward high floor preference match', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, highFloor: true },
          },
          assignedRoom: createRoom({ floor: 8 }),
        });

        const result = floorPreferenceEvaluator.evaluator(booking, [], [], { highFloorBonus: 40 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(40);
      });

      it('should reward low floor preference match', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, highFloor: false },
          },
          assignedRoom: createRoom({ floor: 2 }),
        });

        const result = floorPreferenceEvaluator.evaluator(booking, [], [], { lowFloorBonus: 20 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(20);
      });
    });

    describe('quietLocationEvaluator', () => {
      it('should reward quiet location for quiet preference', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, quiet: true },
          },
          assignedRoom: createRoom({ distanceFromElevator: 5 }),
        });

        const result = quietLocationEvaluator.evaluator(booking, [], [], { weight: 60 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(60);
      });

      it('should return null when room is too close to elevator', () => {
        const booking = createBooking({
          guest: {
            ...createBooking().guest,
            preferences: { ...createBooking().guest.preferences, quiet: true },
          },
          assignedRoom: createRoom({ distanceFromElevator: 1 }),
        });

        const result = quietLocationEvaluator.evaluator(booking, [], [], {
          minDistanceFromElevator: 3,
        });

        expect(result).toBeNull();
      });
    });

    describe('budgetConstraintEvaluator', () => {
      it('should penalize rooms over budget', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, budget: 100 },
          assignedRoom: createRoom({ pricePerNight: 150 }),
        });

        const result = budgetConstraintEvaluator.evaluator(booking, [], [], { weight: -50 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(-50);
        expect(result?.justification).toContain('over budget');
      });

      it('should allow budget buffer percentage', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, budget: 100 },
          assignedRoom: createRoom({ pricePerNight: 105 }),
        });

        const result = budgetConstraintEvaluator.evaluator(booking, [], [], {
          budgetBufferPercent: 10,
        });

        expect(result).toBeNull();
      });

      it('should return null when no budget set', () => {
        const booking = createBooking({
          guest: { ...createBooking().guest, budget: undefined },
          assignedRoom: createRoom({ pricePerNight: 200 }),
        });

        const result = budgetConstraintEvaluator.evaluator(booking, [], [], {});

        expect(result).toBeNull();
      });
    });

    describe('earlyCheckinEvaluator', () => {
      it('should reward early check-in accommodation', () => {
        const booking = createBooking({
          earlyCheckin: true,
          assignedRoom: createRoom(),
        });

        const result = earlyCheckinEvaluator.evaluator(booking, [], [], { weight: 30 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(30);
      });

      it('should return null when early check-in not requested', () => {
        const booking = createBooking({
          earlyCheckin: false,
          assignedRoom: createRoom(),
        });

        const result = earlyCheckinEvaluator.evaluator(booking, [], [], {});

        expect(result).toBeNull();
      });
    });

    describe('lateCheckoutEvaluator', () => {
      it('should reward late checkout accommodation', () => {
        const booking = createBooking({
          lateCheckout: true,
          assignedRoom: createRoom(),
        });

        const result = lateCheckoutEvaluator.evaluator(booking, [], [], { weight: 30 });

        expect(result).not.toBeNull();
        expect(result?.score.softScore).toBe(30);
      });

      it('should return null when late checkout not requested', () => {
        const booking = createBooking({
          lateCheckout: false,
          assignedRoom: createRoom(),
        });

        const result = lateCheckoutEvaluator.evaluator(booking, [], [], {});

        expect(result).toBeNull();
      });
    });
  });

  describe('CONSTRAINT_EVALUATORS Registry', () => {
    it('should contain all hard constraints', () => {
      expect(CONSTRAINT_EVALUATORS.ROOM_TYPE_MATCH).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.NO_DOUBLE_BOOKING).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.ACCESSIBILITY_REQUIRED).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.SMOKING_POLICY).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.PET_POLICY).toBeDefined();
    });

    it('should contain all soft constraints', () => {
      expect(CONSTRAINT_EVALUATORS.VIP_OCEAN_VIEW).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.VIP_HIGH_FLOOR).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.VIEW_PREFERENCE).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.FLOOR_PREFERENCE).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.QUIET_LOCATION).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.BUDGET_CONSTRAINT).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.EARLY_CHECKIN).toBeDefined();
      expect(CONSTRAINT_EVALUATORS.LATE_CHECKOUT).toBeDefined();
    });

    it('should have correct constraint types', () => {
      expect(CONSTRAINT_EVALUATORS.ROOM_TYPE_MATCH.type).toBe('HARD');
      expect(CONSTRAINT_EVALUATORS.VIP_OCEAN_VIEW.type).toBe('SOFT');
    });
  });
});
