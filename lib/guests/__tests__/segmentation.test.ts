import {
  segmentGuests,
  getSegmentDefinition,
  calculateSegmentStats,
  predictGuestSegment,
  Guest,
  SegmentedGuest,
} from '../segmentation';

describe('Guest Segmentation', () => {
  const mockGuests: Guest[] = [
    {
      id: '1',
      name: 'Budget Bob',
      email: 'bob@example.com',
      totalStays: 2,
      totalSpend: 500,
      avgRoomRate: 80,
      avgDaysInAdvance: 45,
      roomUpgrades: 0,
      amenityUsage: 0.1,
      lastStay: new Date('2024-01-01'),
      reviewScore: 4,
    },
    {
      id: '2',
      name: 'Value Vera',
      email: 'vera@example.com',
      totalStays: 5,
      totalSpend: 1500,
      avgRoomRate: 120,
      avgDaysInAdvance: 20,
      roomUpgrades: 1,
      amenityUsage: 0.4,
      lastStay: new Date('2024-02-01'),
      reviewScore: 4.5,
    },
    {
      id: '3',
      name: 'Premium Paul',
      email: 'paul@example.com',
      totalStays: 10,
      totalSpend: 5000,
      avgRoomRate: 200,
      avgDaysInAdvance: 10,
      roomUpgrades: 3,
      amenityUsage: 0.7,
      lastStay: new Date('2024-03-01'),
      reviewScore: 5,
    },
    {
      id: '4',
      name: 'Luxury Lucy',
      email: 'lucy@example.com',
      totalStays: 15,
      totalSpend: 10000,
      avgRoomRate: 300,
      avgDaysInAdvance: 5,
      roomUpgrades: 5,
      amenityUsage: 0.95,
      lastStay: new Date('2024-03-15'),
      reviewScore: 5,
    },
  ];

  describe('segmentGuests', () => {
    it('should segment guests into groups', async () => {
      const segmented = await segmentGuests(mockGuests);

      expect(segmented).toHaveLength(mockGuests.length);
      expect(segmented.every((g) => g.segment)).toBe(true);
      expect(segmented.every((g) => typeof g.segmentIndex === 'number')).toBe(true);
    });

    it('should preserve guest properties', async () => {
      const segmented = await segmentGuests(mockGuests);

      expect(segmented[0].name).toBe(mockGuests[0].name);
      expect(segmented[0].email).toBe(mockGuests[0].email);
      expect(segmented[0].totalStays).toBe(mockGuests[0].totalStays);
    });

    it('should assign different segments to guests with different characteristics', async () => {
      const segmented = await segmentGuests(mockGuests);

      const budgetGuest = segmented.find((g) => g.name === 'Budget Bob');
      const luxuryGuest = segmented.find((g) => g.name === 'Luxury Lucy');

      expect(budgetGuest?.segmentIndex).not.toBe(luxuryGuest?.segmentIndex);
    });

    it('should use rule-based fallback for small datasets', async () => {
      const smallDataset = [mockGuests[0]];
      const segmented = await segmentGuests(smallDataset);

      expect(segmented).toHaveLength(1);
      expect(segmented[0].segment).toBeDefined();
    });

    it('should handle guests with varying characteristics', async () => {
      const diverseGuests: Guest[] = [
        ...mockGuests,
        {
          id: '5',
          name: 'Mid Jane',
          email: 'jane@example.com',
          totalStays: 6,
          totalSpend: 2000,
          avgRoomRate: 150,
          avgDaysInAdvance: 15,
          roomUpgrades: 2,
          amenityUsage: 0.5,
          reviewScore: 4.2,
        },
      ];

      const segmented = await segmentGuests(diverseGuests);

      expect(segmented).toHaveLength(diverseGuests.length);
      expect(new Set(segmented.map((g) => g.segment)).size).toBeGreaterThan(1);
    });
  });

  describe('getSegmentDefinition', () => {
    it('should return definition for Budget Travelers', () => {
      const def = getSegmentDefinition('Budget Travelers');

      expect(def).toBeDefined();
      expect(def?.id).toBe('budget');
      expect(def?.characteristics.length).toBeGreaterThan(0);
      expect(def?.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should return definition for Value Seekers', () => {
      const def = getSegmentDefinition('Value Seekers');

      expect(def).toBeDefined();
      expect(def?.id).toBe('value');
    });

    it('should return definition for Premium Guests', () => {
      const def = getSegmentDefinition('Premium Guests');

      expect(def).toBeDefined();
      expect(def?.id).toBe('premium');
    });

    it('should return definition for Luxury Travelers', () => {
      const def = getSegmentDefinition('Luxury Travelers');

      expect(def).toBeDefined();
      expect(def?.id).toBe('luxury');
    });

    it('should return undefined for unknown segment', () => {
      const def = getSegmentDefinition('Unknown Segment');

      expect(def).toBeUndefined();
    });

    it('should have characteristics for each segment', () => {
      const segments = ['Budget Travelers', 'Value Seekers', 'Premium Guests', 'Luxury Travelers'];

      segments.forEach((segment) => {
        const def = getSegmentDefinition(segment);
        expect(def?.characteristics).toBeDefined();
        expect(def?.characteristics.length).toBeGreaterThan(0);
      });
    });

    it('should have recommended actions for each segment', () => {
      const segments = ['Budget Travelers', 'Value Seekers', 'Premium Guests', 'Luxury Travelers'];

      segments.forEach((segment) => {
        const def = getSegmentDefinition(segment);
        expect(def?.recommendedActions).toBeDefined();
        expect(def?.recommendedActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateSegmentStats', () => {
    let segmentedGuests: SegmentedGuest[];

    beforeEach(async () => {
      segmentedGuests = await segmentGuests(mockGuests);
    });

    it('should calculate total guests correctly', () => {
      const stats = calculateSegmentStats(segmentedGuests);

      expect(stats.totalGuests).toBe(mockGuests.length);
    });

    it('should group guests by segment', () => {
      const stats = calculateSegmentStats(segmentedGuests);

      expect(stats.segments.length).toBeGreaterThan(0);
      expect(stats.segments.every((s) => s.name)).toBe(true);
      expect(stats.segments.every((s) => s.count > 0)).toBe(true);
    });

    it('should calculate percentages correctly', () => {
      const stats = calculateSegmentStats(segmentedGuests);

      const totalPercentage = stats.segments.reduce((sum, s) => sum + s.percentage, 0);

      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    it('should calculate average spend per segment', () => {
      const stats = calculateSegmentStats(segmentedGuests);

      expect(stats.segments.every((s) => s.avgSpend >= 0)).toBe(true);
    });

    it('should calculate average stays per segment', () => {
      const stats = calculateSegmentStats(segmentedGuests);

      expect(stats.segments.every((s) => s.avgStays >= 0)).toBe(true);
    });

    it('should sort segments by count descending', () => {
      const stats = calculateSegmentStats(segmentedGuests);

      for (let i = 1; i < stats.segments.length; i++) {
        expect(stats.segments[i - 1].count).toBeGreaterThanOrEqual(
          stats.segments[i].count
        );
      }
    });

    it('should handle single guest', () => {
      const singleGuest = [segmentedGuests[0]];
      const stats = calculateSegmentStats(singleGuest);

      expect(stats.totalGuests).toBe(1);
      expect(stats.segments.length).toBe(1);
      expect(stats.segments[0].percentage).toBe(100);
    });
  });

  describe('predictGuestSegment', () => {
    let existingGuests: SegmentedGuest[];

    beforeEach(async () => {
      existingGuests = await segmentGuests(mockGuests);
    });

    it('should predict segment for new guest', () => {
      const newGuest: Guest = {
        id: '5',
        name: 'New Guest',
        email: 'new@example.com',
        totalStays: 3,
        totalSpend: 1000,
        avgRoomRate: 150,
        avgDaysInAdvance: 20,
        roomUpgrades: 1,
        amenityUsage: 0.5,
        reviewScore: 4.0,
      };

      const prediction = predictGuestSegment(newGuest, existingGuests);

      expect(prediction.segment).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should predict budget segment for low-spending guest', () => {
      const budgetGuest: Guest = {
        id: '6',
        name: 'Budget Guest',
        email: 'budget@example.com',
        totalStays: 1,
        totalSpend: 200,
        avgRoomRate: 70,
        avgDaysInAdvance: 60,
        roomUpgrades: 0,
        amenityUsage: 0.05,
        reviewScore: 3.5,
      };

      const prediction = predictGuestSegment(budgetGuest, existingGuests);

      expect(prediction.segment).toBe('Budget Travelers');
    });

    it('should predict luxury segment for high-spending guest', () => {
      const luxuryGuest: Guest = {
        id: '7',
        name: 'Luxury Guest',
        email: 'luxury@example.com',
        totalStays: 20,
        totalSpend: 15000,
        avgRoomRate: 350,
        avgDaysInAdvance: 3,
        roomUpgrades: 10,
        amenityUsage: 1.0,
        reviewScore: 5.0,
      };

      const prediction = predictGuestSegment(luxuryGuest, existingGuests);

      expect(prediction.segment).toBe('Luxury Travelers');
    });

    it('should return confidence score', () => {
      const newGuest: Guest = {
        id: '8',
        name: 'Test Guest',
        email: 'test@example.com',
        totalStays: 5,
        totalSpend: 2000,
        avgRoomRate: 180,
        avgDaysInAdvance: 15,
        roomUpgrades: 2,
        amenityUsage: 0.6,
        reviewScore: 4.5,
      };

      const prediction = predictGuestSegment(newGuest, existingGuests);

      expect(typeof prediction.confidence).toBe('number');
      expect(prediction.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Feature Extraction', () => {
    it('should handle guests with all properties', async () => {
      const completeGuest: Guest = {
        id: '9',
        name: 'Complete Guest',
        email: 'complete@example.com',
        totalStays: 8,
        totalSpend: 3000,
        avgRoomRate: 175,
        avgDaysInAdvance: 12,
        roomUpgrades: 2,
        amenityUsage: 0.65,
        lastStay: new Date('2024-03-01'),
        reviewScore: 4.8,
      };

      const segmented = await segmentGuests([completeGuest]);

      expect(segmented[0].segment).toBeDefined();
    });

    it('should handle guests without optional properties', async () => {
      const minimalGuest: Guest = {
        id: '10',
        name: 'Minimal Guest',
        email: 'minimal@example.com',
        totalStays: 1,
        totalSpend: 200,
        avgRoomRate: 100,
        avgDaysInAdvance: 30,
        roomUpgrades: 0,
        amenityUsage: 0.2,
      };

      const segmented = await segmentGuests([minimalGuest]);

      expect(segmented[0].segment).toBeDefined();
    });
  });

  describe('Segment Definitions', () => {
    it('should have 4 distinct segments', () => {
      const segments = [
        'Budget Travelers',
        'Value Seekers',
        'Premium Guests',
        'Luxury Travelers',
      ];

      segments.forEach((segment) => {
        const def = getSegmentDefinition(segment);
        expect(def).toBeDefined();
      });
    });

    it('should have unique segment IDs', () => {
      const segments = [
        'Budget Travelers',
        'Value Seekers',
        'Premium Guests',
        'Luxury Travelers',
      ];

      const ids = segments
        .map((s) => getSegmentDefinition(s)?.id)
        .filter(Boolean);

      expect(new Set(ids).size).toBe(segments.length);
    });

    it('should have descriptions for all segments', () => {
      const segments = [
        'Budget Travelers',
        'Value Seekers',
        'Premium Guests',
        'Luxury Travelers',
      ];

      segments.forEach((segment) => {
        const def = getSegmentDefinition(segment);
        expect(def?.description).toBeDefined();
        expect(def?.description.length).toBeGreaterThan(0);
      });
    });
  });
});
