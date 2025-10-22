/**
 * Tests for Guest Journey Mapping Module
 */

import {
  analyzeGuestJourney,
  optimizeJourney,
  generatePersonalization,
  benchmarkJourneys,
  type GuestJourney,
  type Touchpoint,
  type GuestProfile,
  type JourneyStage,
  type TouchpointType,
} from '../mapper';

describe('Guest Journey Mapping Module', () => {
  // Helper to create mock touchpoint
  const createTouchpoint = (
    id: string,
    stage: JourneyStage,
    type: TouchpointType,
    outcome: 'success' | 'partial' | 'failure' | 'abandoned' = 'success',
    satisfaction?: number
  ): Touchpoint => ({
    id,
    stage,
    type,
    timestamp: new Date(),
    duration: 120,
    outcome,
    satisfaction,
  });

  // Helper to create mock journey
  const createMockJourney = (
    id: string,
    touchpoints: Touchpoint[],
    profile?: GuestProfile
  ): GuestJourney => ({
    guestId: `guest-${id}`,
    journeyId: `journey-${id}`,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-05'),
    touchpoints,
    guestProfile: profile,
  });

  describe('analyzeGuestJourney', () => {
    it('should analyze a complete guest journey', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'research', 'website', 'success', 4),
        createTouchpoint('tp2', 'booking', 'website', 'success', 5),
        createTouchpoint('tp3', 'check-in', 'kiosk', 'success', 4),
        createTouchpoint('tp4', 'in-stay', 'room-service', 'success', 5),
        createTouchpoint('tp5', 'check-out', 'front-desk', 'success', 4),
      ];

      const journey = createMockJourney('1', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      expect(analysis.journeyId).toBe('journey-1');
      expect(analysis.overallScore).toBeGreaterThan(0);
      expect(analysis.stageScores.size).toBeGreaterThan(0);
      expect(analysis.touchpointScores.size).toBe(5);
      expect(analysis.completionRate).toBeGreaterThan(0);
    });

    it('should throw error for journey with no touchpoints', () => {
      const journey = createMockJourney('empty', []);

      expect(() => analyzeGuestJourney(journey)).toThrow(
        'Journey must have at least one touchpoint'
      );
    });

    it('should calculate high score for excellent journey', () => {
      const touchpoints = Array(10).fill(null).map((_, i) =>
        createTouchpoint(`tp${i}`, 'in-stay', 'concierge', 'success', 5)
      );

      const journey = createMockJourney('excellent', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      expect(analysis.overallScore).toBeGreaterThan(85);
    });

    it('should calculate low score for poor journey', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'failure', 1),
        createTouchpoint('tp2', 'check-in', 'front-desk', 'failure', 2),
        createTouchpoint('tp3', 'in-stay', 'room-service', 'partial', 2),
        createTouchpoint('tp4', 'check-out', 'front-desk', 'abandoned'),
      ];

      const journey = createMockJourney('poor', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      expect(analysis.overallScore).toBeLessThan(50);
    });

    it('should identify bottlenecks in journey', () => {
      const touchpoints = [
        ...Array(5).fill(null).map((_, i) =>
          createTouchpoint(`slow${i}`, 'check-in', 'front-desk', 'partial', 2)
        ).map(tp => ({ ...tp, duration: 900 })), // 15 min each
      ];

      const journey = createMockJourney('bottleneck', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      expect(analysis.bottlenecks.length).toBeGreaterThan(0);
      expect(analysis.bottlenecks[0].stage).toBe('check-in');
    });

    it('should calculate stage scores correctly', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'success', 5),
        createTouchpoint('tp2', 'booking', 'phone', 'success', 4),
        createTouchpoint('tp3', 'check-in', 'kiosk', 'failure', 2),
      ];

      const journey = createMockJourney('stages', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      const bookingScore = analysis.stageScores.get('booking');
      const checkinScore = analysis.stageScores.get('check-in');

      expect(bookingScore).toBeDefined();
      expect(checkinScore).toBeDefined();
      expect(bookingScore!.score).toBeGreaterThan(checkinScore!.score);
    });

    it('should identify highlights for great experiences', () => {
      const touchpoints = Array(5).fill(null).map((_, i) =>
        createTouchpoint(`tp${i}`, 'in-stay', 'concierge', 'success', 5)
      );

      const journey = createMockJourney('highlights', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      expect(analysis.highlights.length).toBeGreaterThan(0);
    });

    it('should identify pain points for poor experiences', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'check-in', 'front-desk', 'failure', 1),
        createTouchpoint('tp2', 'in-stay', 'room-service', 'failure', 2),
      ];

      const journey = createMockJourney('pain', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      expect(analysis.painPoints.length).toBeGreaterThan(0);
    });

    it('should generate recommendations', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'success', 3),
        createTouchpoint('tp2', 'check-in', 'front-desk', 'partial', 2),
      ];

      const journey = createMockJourney('recs', touchpoints);
      const analysis = analyzeGuestJourney(journey);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate completion rate', () => {
      const fullJourney = [
        createTouchpoint('tp1', 'booking', 'website', 'success'),
        createTouchpoint('tp2', 'pre-arrival', 'email', 'success'),
        createTouchpoint('tp3', 'check-in', 'kiosk', 'success'),
        createTouchpoint('tp4', 'in-stay', 'concierge', 'success'),
        createTouchpoint('tp5', 'check-out', 'front-desk', 'success'),
        createTouchpoint('tp6', 'post-stay', 'email', 'success'),
      ];

      const partialJourney = [
        createTouchpoint('tp1', 'booking', 'website', 'success'),
        createTouchpoint('tp2', 'check-in', 'kiosk', 'success'),
      ];

      const fullAnalysis = analyzeGuestJourney(createMockJourney('full', fullJourney));
      const partialAnalysis = analyzeGuestJourney(createMockJourney('partial', partialJourney));

      expect(fullAnalysis.completionRate).toBe(100);
      expect(partialAnalysis.completionRate).toBeLessThan(100);
    });
  });

  describe('optimizeJourney', () => {
    it('should generate optimization suggestions', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'partial', 3),
        createTouchpoint('tp2', 'check-in', 'front-desk', 'success', 3),
      ];

      const journey = createMockJourney('opt', touchpoints);
      const analysis = analyzeGuestJourney(journey);
      const optimization = optimizeJourney(journey, analysis);

      expect(optimization.improvements.length).toBeGreaterThan(0);
      expect(optimization.potentialScore).toBeGreaterThan(optimization.currentScore);
    });

    it('should prioritize high-impact improvements', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'failure', 1),
        createTouchpoint('tp2', 'check-in', 'kiosk', 'success', 4),
      ];

      const journey = createMockJourney('priority', touchpoints);
      const analysis = analyzeGuestJourney(journey);
      const optimization = optimizeJourney(journey, analysis);

      const priorities = optimization.improvements.map(imp => imp.priority);
      expect(Math.max(...priorities)).toBeGreaterThanOrEqual(7);
    });

    it('should estimate impact of improvements', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'partial', 3),
      ];

      const journey = createMockJourney('impact', touchpoints);
      const analysis = analyzeGuestJourney(journey);
      const optimization = optimizeJourney(journey, analysis);

      expect(optimization.estimatedImpact.satisfactionIncrease).toBeGreaterThanOrEqual(0);
      expect(optimization.estimatedImpact.timeReduction).toBeGreaterThanOrEqual(0);
      expect(optimization.estimatedImpact.conversionIncrease).toBeGreaterThanOrEqual(0);
    });

    it('should provide prioritized action list', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'failure', 2),
        createTouchpoint('tp2', 'check-in', 'kiosk', 'partial', 3),
      ];

      const journey = createMockJourney('actions', touchpoints);
      const analysis = analyzeGuestJourney(journey);
      const optimization = optimizeJourney(journey, analysis);

      expect(optimization.prioritizedActions.length).toBeGreaterThan(0);
      expect(optimization.prioritizedActions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('generatePersonalization', () => {
    it('should generate recommendations for business travelers', () => {
      const profile: GuestProfile = {
        guestType: 'business',
        loyaltyTier: 'none',
        previousStays: 5,
        averageSpend: 500,
        preferredChannels: ['mobile-app', 'email'],
      };

      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'mobile-app', 'success', 4),
      ];

      const journey = createMockJourney('business', touchpoints, profile);
      const analysis = analyzeGuestJourney(journey);
      const personalization = generatePersonalization(journey, analysis);

      const hasBusinessRec = personalization.recommendations.some(
        r => r.type.includes('express') || r.type.includes('workspace')
      );

      expect(hasBusinessRec).toBe(true);
    });

    it('should generate recommendations for families', () => {
      const profile: GuestProfile = {
        guestType: 'family',
        loyaltyTier: 'silver',
        previousStays: 2,
        averageSpend: 800,
        preferredChannels: ['website'],
      };

      const touchpoints = [
        createTouchpoint('tp1', 'research', 'website', 'success'),
      ];

      const journey = createMockJourney('family', touchpoints, profile);
      const analysis = analyzeGuestJourney(journey);
      const personalization = generatePersonalization(journey, analysis);

      const hasFamilyRec = personalization.recommendations.some(
        r => r.type.includes('family') || r.type.includes('connecting')
      );

      expect(hasFamilyRec).toBe(true);
    });

    it('should emphasize loyalty benefits for members', () => {
      const profile: GuestProfile = {
        guestType: 'leisure',
        loyaltyTier: 'platinum',
        previousStays: 20,
        averageSpend: 1200,
        preferredChannels: ['mobile-app'],
      };

      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'mobile-app', 'success', 5),
      ];

      const journey = createMockJourney('loyalty', touchpoints, profile);
      const analysis = analyzeGuestJourney(journey);
      const personalization = generatePersonalization(journey, analysis);

      const hasLoyaltyRec = personalization.recommendations.some(
        r => r.type.includes('loyalty')
      );

      expect(hasLoyaltyRec).toBe(true);
    });

    it('should identify preferred communication channels', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'mobile-app', 'success'),
        createTouchpoint('tp2', 'pre-arrival', 'mobile-app', 'success'),
        createTouchpoint('tp3', 'check-in', 'kiosk', 'success'),
      ];

      const journey = createMockJourney('channels', touchpoints);
      const analysis = analyzeGuestJourney(journey);
      const personalization = generatePersonalization(journey, analysis);

      expect(personalization.preferredChannels[0]).toBe('mobile-app');
    });

    it('should calculate optimal timing for interactions', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'success'),
      ];

      const journey = createMockJourney('timing', touchpoints);
      const analysis = analyzeGuestJourney(journey);
      const personalization = generatePersonalization(journey, analysis);

      expect(personalization.optimalTiming.size).toBeGreaterThan(0);
    });
  });

  describe('benchmarkJourneys', () => {
    it('should benchmark multiple journeys', () => {
      const journeys = Array(5).fill(null).map((_, i) => {
        const touchpoints = [
          createTouchpoint('tp1', 'booking', 'website', 'success', 4 + (i % 2)),
          createTouchpoint('tp2', 'check-in', 'kiosk', 'success', 3 + (i % 2)),
        ];
        return createMockJourney(`${i}`, touchpoints);
      });

      const benchmark = benchmarkJourneys(journeys);

      expect(benchmark.totalJourneys).toBe(5);
      expect(benchmark.averageScore).toBeGreaterThan(0);
      expect(benchmark.completionRate).toBeGreaterThan(0);
    });

    it('should identify top performing stages', () => {
      const journeys = Array(3).fill(null).map((_, i) => {
        const touchpoints = [
          createTouchpoint('tp1', 'booking', 'website', 'success', 5),
          createTouchpoint('tp2', 'check-in', 'kiosk', 'partial', 3),
        ];
        return createMockJourney(`${i}`, touchpoints);
      });

      const benchmark = benchmarkJourneys(journeys);

      expect(benchmark.topPerformingStages.length).toBeGreaterThan(0);
      expect(benchmark.topPerformingStages).toContain('booking');
    });

    it('should identify underperforming stages', () => {
      const journeys = Array(3).fill(null).map((_, i) => {
        const touchpoints = [
          createTouchpoint('tp1', 'booking', 'website', 'success', 5),
          createTouchpoint('tp2', 'check-in', 'front-desk', 'failure', 1),
        ];
        return createMockJourney(`${i}`, touchpoints);
      });

      const benchmark = benchmarkJourneys(journeys);

      expect(benchmark.underperformingStages.length).toBeGreaterThan(0);
      expect(benchmark.underperformingStages).toContain('check-in');
    });

    it('should throw error with no journeys', () => {
      expect(() => benchmarkJourneys([])).toThrow(
        'At least one journey is required for benchmarking'
      );
    });

    it('should provide industry comparison', () => {
      const journeys = [
        createMockJourney('1', [createTouchpoint('tp1', 'booking', 'website', 'success', 4)]),
      ];

      const benchmark = benchmarkJourneys(journeys);

      expect(benchmark.industryComparison.score).toBeGreaterThan(0);
      expect(benchmark.industryComparison.percentile).toBeGreaterThan(0);
      expect(benchmark.industryComparison.percentile).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete guest lifecycle', () => {
      const profile: GuestProfile = {
        guestType: 'leisure',
        loyaltyTier: 'gold',
        previousStays: 10,
        averageSpend: 1000,
        preferredChannels: ['mobile-app', 'email'],
      };

      const touchpoints = [
        createTouchpoint('tp1', 'awareness', 'social-media', 'success', 4),
        createTouchpoint('tp2', 'research', 'website', 'success', 4),
        createTouchpoint('tp3', 'booking', 'mobile-app', 'success', 5),
        createTouchpoint('tp4', 'pre-arrival', 'email', 'success', 4),
        createTouchpoint('tp5', 'check-in', 'kiosk', 'success', 5),
        createTouchpoint('tp6', 'in-stay', 'concierge', 'success', 5),
        createTouchpoint('tp7', 'amenity-usage', 'restaurant', 'success', 4),
        createTouchpoint('tp8', 'check-out', 'mobile-app', 'success', 5),
        createTouchpoint('tp9', 'post-stay', 'email', 'success', 4),
      ];

      const journey = createMockJourney('complete', touchpoints, profile);
      const analysis = analyzeGuestJourney(journey);
      const optimization = optimizeJourney(journey, analysis);
      const personalization = generatePersonalization(journey, analysis);

      expect(analysis.overallScore).toBeGreaterThan(80);
      expect(analysis.completionRate).toBe(100);
      expect(optimization.improvements.length).toBeGreaterThanOrEqual(0);
      expect(personalization.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle problematic journey with failures', () => {
      const touchpoints = [
        createTouchpoint('tp1', 'booking', 'website', 'failure', 1),
        createTouchpoint('tp2', 'booking', 'phone', 'success', 3),
        createTouchpoint('tp3', 'check-in', 'front-desk', 'partial', 2),
        createTouchpoint('tp4', 'in-stay', 'room-service', 'failure', 1),
        createTouchpoint('tp5', 'check-out', 'front-desk', 'abandoned'),
      ];

      const journey = createMockJourney('problematic', touchpoints);
      const analysis = analyzeGuestJourney(journey);
      const optimization = optimizeJourney(journey, analysis);

      expect(analysis.overallScore).toBeLessThan(60);
      expect(analysis.bottlenecks.length).toBeGreaterThan(0);
      expect(analysis.painPoints.length).toBeGreaterThan(0);
      expect(optimization.improvements.length).toBeGreaterThan(2);
      expect(optimization.potentialScore).toBeGreaterThan(analysis.overallScore);
    });

    it('should compare multiple guest types in benchmark', () => {
      const businessJourneys = Array(3).fill(null).map((_, i) => {
        const profile: GuestProfile = {
          guestType: 'business',
          loyaltyTier: 'platinum',
          previousStays: 15,
          averageSpend: 600,
          preferredChannels: ['mobile-app'],
        };
        return createMockJourney(`biz${i}`, [
          createTouchpoint('tp1', 'booking', 'mobile-app', 'success', 5),
          createTouchpoint('tp2', 'check-in', 'kiosk', 'success', 5),
        ], profile);
      });

      const familyJourneys = Array(2).fill(null).map((_, i) => {
        const profile: GuestProfile = {
          guestType: 'family',
          loyaltyTier: 'none',
          previousStays: 1,
          averageSpend: 1200,
          preferredChannels: ['website'],
        };
        return createMockJourney(`fam${i}`, [
          createTouchpoint('tp1', 'booking', 'website', 'success', 4),
          createTouchpoint('tp2', 'check-in', 'front-desk', 'success', 3),
        ], profile);
      });

      const allJourneys = [...businessJourneys, ...familyJourneys];
      const benchmark = benchmarkJourneys(allJourneys);

      expect(benchmark.totalJourneys).toBe(5);
      expect(benchmark.averageScore).toBeGreaterThan(0);
    });
  });
});
