import {
  mapGuestJourney,
  analyzeJourneys,
  predictNextBestAction,
  optimizeJourney,
  JourneyTouchpoint,
  GuestJourney,
  JourneyStage,
} from '../mapper';

describe('Guest Journey Mapping', () => {
  // Sample touchpoints for testing
  const bookingTouchpoint: JourneyTouchpoint = {
    stage: 'booking',
    timestamp: new Date('2024-01-01T10:00:00'),
    action: 'Online reservation',
    channel: 'web',
    satisfaction: 8,
    durationMinutes: 10,
  };

  const preArrivalTouchpoint: JourneyTouchpoint = {
    stage: 'pre-arrival',
    timestamp: new Date('2024-01-05T14:00:00'),
    action: 'Pre-arrival email confirmation',
    channel: 'email',
    satisfaction: 9,
    durationMinutes: 2,
  };

  const arrivalTouchpoint: JourneyTouchpoint = {
    stage: 'arrival',
    timestamp: new Date('2024-01-10T15:00:00'),
    action: 'Arrival at property',
    channel: 'in-person',
    satisfaction: 7,
    durationMinutes: 5,
  };

  const checkInTouchpoint: JourneyTouchpoint = {
    stage: 'check-in',
    timestamp: new Date('2024-01-10T15:30:00'),
    action: 'Check-in process',
    channel: 'in-person',
    satisfaction: 6,
    durationMinutes: 15,
    issues: ['Long wait time at front desk'],
  };

  const inStayTouchpoint: JourneyTouchpoint = {
    stage: 'in-stay',
    timestamp: new Date('2024-01-11T12:00:00'),
    action: 'Room service request',
    channel: 'phone',
    satisfaction: 9,
    durationMinutes: 30,
  };

  const checkOutTouchpoint: JourneyTouchpoint = {
    stage: 'check-out',
    timestamp: new Date('2024-01-13T11:00:00'),
    action: 'Express checkout',
    channel: 'mobile',
    satisfaction: 8,
    durationMinutes: 5,
  };

  const postStayTouchpoint: JourneyTouchpoint = {
    stage: 'post-stay',
    timestamp: new Date('2024-01-14T10:00:00'),
    action: 'Feedback survey',
    channel: 'email',
    satisfaction: 8,
    durationMinutes: 5,
  };

  const completeTouchpoints: JourneyTouchpoint[] = [
    bookingTouchpoint,
    preArrivalTouchpoint,
    arrivalTouchpoint,
    checkInTouchpoint,
    inStayTouchpoint,
    checkOutTouchpoint,
    postStayTouchpoint,
  ];

  describe('mapGuestJourney', () => {
    it('should map a complete guest journey', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.guestId).toBe('guest-123');
      expect(journey.reservationId).toBe('res-456');
      expect(journey.touchpoints).toHaveLength(7);
      expect(journey.overallSatisfaction).toBeGreaterThan(0);
      expect(journey.completionRate).toBe(100); // All 7 stages completed
    });

    it('should sort touchpoints by timestamp', () => {
      const unsortedTouchpoints = [
        checkInTouchpoint,
        bookingTouchpoint,
        arrivalTouchpoint,
      ];

      const journey = mapGuestJourney('guest-123', 'res-456', unsortedTouchpoints);

      expect(journey.touchpoints[0].stage).toBe('booking');
      expect(journey.touchpoints[1].stage).toBe('arrival');
      expect(journey.touchpoints[2].stage).toBe('check-in');
    });

    it('should calculate stage scores correctly', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.stageScores.booking).toBeGreaterThan(0);
      expect(journey.stageScores['check-in']).toBeLessThan(journey.stageScores.booking);
      expect(journey.stageScores['in-stay']).toBeGreaterThan(80);
    });

    it('should identify pain points from issues', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.painPoints.length).toBeGreaterThan(0);

      const checkInPainPoint = journey.painPoints.find(
        (pp) => pp.stage === 'check-in'
      );
      expect(checkInPainPoint).toBeDefined();
      expect(checkInPainPoint?.issue).toContain('Long wait time');
    });

    it('should identify pain points from low satisfaction', () => {
      const lowSatisfactionTouchpoint: JourneyTouchpoint = {
        stage: 'arrival',
        timestamp: new Date('2024-01-10T15:00:00'),
        action: 'Arrival',
        channel: 'in-person',
        satisfaction: 3,
        durationMinutes: 20,
      };

      const journey = mapGuestJourney('guest-123', 'res-456', [
        lowSatisfactionTouchpoint,
      ]);

      expect(journey.painPoints.length).toBeGreaterThan(0);
      expect(journey.painPoints[0].severity).toBe('critical');
    });

    it('should identify highlights from high satisfaction', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.highlights.length).toBeGreaterThan(0);
      expect(journey.highlights.some((h) => h.includes('in-stay'))).toBe(true);
    });

    it('should calculate overall satisfaction', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.overallSatisfaction).toBeGreaterThan(0);
      expect(journey.overallSatisfaction).toBeLessThanOrEqual(100);
    });

    it('should penalize overall satisfaction for pain points', () => {
      const noPainPointsTouchpoints = completeTouchpoints.map((tp) => ({
        ...tp,
        issues: undefined,
        satisfaction: 9,
      }));

      const journeyWithPainPoints = mapGuestJourney(
        'guest-1',
        'res-1',
        completeTouchpoints
      );
      const journeyWithoutPainPoints = mapGuestJourney(
        'guest-2',
        'res-2',
        noPainPointsTouchpoints
      );

      expect(journeyWithoutPainPoints.overallSatisfaction).toBeGreaterThan(
        journeyWithPainPoints.overallSatisfaction
      );
    });

    it('should calculate completion rate', () => {
      const partialTouchpoints = [
        bookingTouchpoint,
        checkInTouchpoint,
        checkOutTouchpoint,
      ];

      const journey = mapGuestJourney('guest-123', 'res-456', partialTouchpoints);

      expect(journey.completionRate).toBeLessThan(100);
      expect(journey.completionRate).toBeGreaterThan(0);
    });

    it('should calculate total duration in hours', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.totalDurationHours).toBeGreaterThan(0);
      // From Jan 1 to Jan 14 is ~13 days = ~312 hours
      expect(journey.totalDurationHours).toBeGreaterThan(300);
    });

    it('should calculate channel distribution', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.channelDistribution.web).toBeGreaterThan(0);
      expect(journey.channelDistribution.email).toBeGreaterThan(0);
      expect(journey.channelDistribution['in-person']).toBeGreaterThan(0);
    });

    it('should generate recommendations', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.recommendations).toBeInstanceOf(Array);
      expect(journey.recommendations.length).toBeGreaterThan(0);
    });

    it('should throw error with no touchpoints', () => {
      expect(() => mapGuestJourney('guest-123', 'res-456', [])).toThrow(
        'At least one touchpoint is required'
      );
    });

    it('should handle missing satisfaction values with defaults', () => {
      const touchpointWithoutSatisfaction: JourneyTouchpoint = {
        stage: 'booking',
        timestamp: new Date(),
        action: 'Booking',
        channel: 'web',
      };

      const journey = mapGuestJourney('guest-123', 'res-456', [
        touchpointWithoutSatisfaction,
      ]);

      expect(journey.overallSatisfaction).toBeGreaterThan(0);
    });

    it('should assign correct severity to pain points', () => {
      const criticalTouchpoint: JourneyTouchpoint = {
        stage: 'check-in',
        timestamp: new Date(),
        action: 'Check-in',
        channel: 'in-person',
        satisfaction: 2,
        issues: ['Critical failure'],
      };

      const journey = mapGuestJourney('guest-123', 'res-456', [criticalTouchpoint]);

      const criticalPainPoint = journey.painPoints.find((pp) => pp.severity === 'critical');
      expect(criticalPainPoint).toBeDefined();
    });
  });

  describe('analyzeJourneys', () => {
    it('should analyze multiple journeys', () => {
      const journey1 = mapGuestJourney('guest-1', 'res-1', completeTouchpoints);
      const journey2 = mapGuestJourney('guest-2', 'res-2', completeTouchpoints);

      const analytics = analyzeJourneys([journey1, journey2]);

      expect(analytics.totalJourneys).toBe(2);
      expect(analytics.averageSatisfaction).toBeGreaterThan(0);
      expect(analytics.completionRate).toBeGreaterThan(0);
    });

    it('should calculate stage performance', () => {
      const journey1 = mapGuestJourney('guest-1', 'res-1', completeTouchpoints);
      const journey2 = mapGuestJourney('guest-2', 'res-2', completeTouchpoints);

      const analytics = analyzeJourneys([journey1, journey2]);

      expect(analytics.stagePerformance.booking).toBeDefined();
      expect(analytics.stagePerformance.booking.averageSatisfaction).toBeGreaterThan(0);
      expect(analytics.stagePerformance.booking.touchpointCount).toBeGreaterThan(0);
    });

    it('should identify common pain points', () => {
      const journey1 = mapGuestJourney('guest-1', 'res-1', completeTouchpoints);
      const journey2 = mapGuestJourney('guest-2', 'res-2', completeTouchpoints);

      const analytics = analyzeJourneys([journey1, journey2]);

      expect(analytics.commonPainPoints).toBeInstanceOf(Array);
      if (analytics.commonPainPoints.length > 0) {
        expect(analytics.commonPainPoints[0].frequency).toBeGreaterThan(0);
        expect(analytics.commonPainPoints[0].averageImpact).toBeGreaterThan(0);
      }
    });

    it('should analyze channel effectiveness', () => {
      const journey1 = mapGuestJourney('guest-1', 'res-1', completeTouchpoints);
      const journey2 = mapGuestJourney('guest-2', 'res-2', completeTouchpoints);

      const analytics = analyzeJourneys([journey1, journey2]);

      expect(analytics.channelEffectiveness.web).toBeDefined();
      expect(analytics.channelEffectiveness.web.usageCount).toBeGreaterThan(0);
    });

    it('should identify bottlenecks', () => {
      const slowCheckInTouchpoints = completeTouchpoints.map((tp) =>
        tp.stage === 'check-in'
          ? { ...tp, durationMinutes: 45, satisfaction: 4 }
          : tp
      );

      const journeys = Array.from({ length: 5 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, slowCheckInTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);

      expect(analytics.bottlenecks.length).toBeGreaterThan(0);

      const checkInBottleneck = analytics.bottlenecks.find(
        (b) => b.stage === 'check-in'
      );
      expect(checkInBottleneck).toBeDefined();
      expect(checkInBottleneck?.impact).toBeGreaterThan(0);
    });

    it('should calculate optimization score', () => {
      const journey1 = mapGuestJourney('guest-1', 'res-1', completeTouchpoints);
      const journey2 = mapGuestJourney('guest-2', 'res-2', completeTouchpoints);

      const analytics = analyzeJourneys([journey1, journey2]);

      expect(analytics.optimizationScore).toBeGreaterThan(0);
      expect(analytics.optimizationScore).toBeLessThanOrEqual(100);
    });

    it('should identify drop-off points', () => {
      const incompleteTouchpoints = [
        bookingTouchpoint,
        preArrivalTouchpoint,
        arrivalTouchpoint,
        // Missing check-in and beyond
      ];

      const journeys = [
        mapGuestJourney('guest-1', 'res-1', completeTouchpoints),
        mapGuestJourney('guest-2', 'res-2', incompleteTouchpoints),
        mapGuestJourney('guest-3', 'res-3', incompleteTouchpoints),
      ];

      const analytics = analyzeJourneys(journeys);

      expect(analytics.dropOffPoints).toBeInstanceOf(Array);
    });

    it('should throw error with no journeys', () => {
      expect(() => analyzeJourneys([])).toThrow(
        'At least one journey is required for analysis'
      );
    });

    it('should handle journeys with missing stages', () => {
      const partialJourney = mapGuestJourney('guest-1', 'res-1', [
        bookingTouchpoint,
        checkInTouchpoint,
      ]);

      const analytics = analyzeJourneys([partialJourney]);

      expect(analytics.stagePerformance['pre-arrival'].touchpointCount).toBe(0);
    });

    it('should sort bottlenecks by impact', () => {
      const touchpointsWithMultipleIssues = [
        { ...bookingTouchpoint, satisfaction: 3, durationMinutes: 60 },
        { ...checkInTouchpoint, satisfaction: 2, durationMinutes: 50 },
        { ...inStayTouchpoint, satisfaction: 4, durationMinutes: 120 },
      ];

      const journeys = Array.from({ length: 10 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, touchpointsWithMultipleIssues)
      );

      const analytics = analyzeJourneys(journeys);

      if (analytics.bottlenecks.length > 1) {
        expect(analytics.bottlenecks[0].impact).toBeGreaterThanOrEqual(
          analytics.bottlenecks[1].impact
        );
      }
    });
  });

  describe('predictNextBestAction', () => {
    it('should predict next action for booking stage', () => {
      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [bookingTouchpoint] },
        'booking',
        [bookingTouchpoint]
      );

      expect(action.action).toBeTruthy();
      expect(action.channel).toBeTruthy();
      expect(action.timing).toBeTruthy();
      expect(action.priority).toBeTruthy();
      expect(action.confidence).toBeGreaterThan(0);
      expect(action.expectedImpact).toBeGreaterThan(0);
      expect(action.reasoning).toBeTruthy();
    });

    it('should prioritize addressing unresolved issues', () => {
      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [checkInTouchpoint] },
        'check-in',
        [checkInTouchpoint]
      );

      expect(action.priority).toBe('urgent');
      expect(action.timing).toBe('immediate');
      expect(action.action).toContain('Long wait time');
    });

    it('should recommend proactive check-in for low satisfaction', () => {
      const lowSatTouchpoint: JourneyTouchpoint = {
        stage: 'in-stay',
        timestamp: new Date(),
        action: 'Room issue',
        channel: 'phone',
        satisfaction: 4,
        durationMinutes: 10,
      };

      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [lowSatTouchpoint] },
        'in-stay',
        [lowSatTouchpoint]
      );

      expect(action.priority).toBe('high');
      expect(action.action).toContain('check-in');
    });

    it('should suggest welcome amenity at check-in', () => {
      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [checkInTouchpoint] },
        'check-in',
        [
          {
            ...checkInTouchpoint,
            issues: undefined,
            satisfaction: 8,
          },
        ]
      );

      expect(action.action).toContain('welcome');
      expect(action.channel).toBe('in-person');
    });

    it('should recommend mid-stay check-in during in-stay', () => {
      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [inStayTouchpoint] },
        'in-stay',
        [inStayTouchpoint]
      );

      expect(action.action).toContain('mid-stay');
      expect(action.channel).toBe('mobile');
    });

    it('should request feedback at check-out', () => {
      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [checkOutTouchpoint] },
        'check-out',
        [checkOutTouchpoint]
      );

      expect(action.action).toContain('feedback');
      expect(action.channel).toBe('email');
    });

    it('should calculate confidence based on data quality', () => {
      const actionWithMoreData = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: completeTouchpoints },
        'in-stay',
        completeTouchpoints.slice(-3)
      );

      const actionWithLessData = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [bookingTouchpoint] },
        'booking',
        [bookingTouchpoint]
      );

      expect(actionWithMoreData.confidence).toBeGreaterThan(
        actionWithLessData.confidence
      );
    });

    it('should handle empty touchpoints array', () => {
      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [] },
        'booking',
        []
      );

      expect(action.confidence).toBeLessThan(100);
    });

    it('should provide reasoning for recommendations', () => {
      const action = predictNextBestAction(
        { guestId: 'guest-1', touchpoints: [checkInTouchpoint] },
        'check-in',
        [checkInTouchpoint]
      );

      expect(action.reasoning).toBeTruthy();
      expect(typeof action.reasoning).toBe('string');
    });
  });

  describe('optimizeJourney', () => {
    it('should generate optimization recommendations', () => {
      const journeys = Array.from({ length: 5 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, completeTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      expect(optimization.currentScore).toBeGreaterThan(0);
      expect(optimization.targetScore).toBeGreaterThan(optimization.currentScore);
      expect(optimization.improvements).toBeInstanceOf(Array);
      expect(optimization.quickWins).toBeInstanceOf(Array);
      expect(optimization.strategicInitiatives).toBeInstanceOf(Array);
    });

    it('should identify quick wins', () => {
      const lowPerformanceTouchpoints = completeTouchpoints.map((tp) => ({
        ...tp,
        satisfaction: 5,
      }));

      const journeys = Array.from({ length: 5 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, lowPerformanceTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      expect(optimization.quickWins.length).toBeGreaterThan(0);
    });

    it('should suggest strategic initiatives', () => {
      const journeys = Array.from({ length: 5 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, completeTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      expect(optimization.strategicInitiatives.length).toBeGreaterThan(0);
    });

    it('should calculate estimated satisfaction gain', () => {
      const journeys = Array.from({ length: 5 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, completeTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      expect(optimization.estimatedSatisfactionGain).toBeGreaterThan(0);
    });

    it('should provide stage-specific improvements', () => {
      const journeys = Array.from({ length: 5 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, completeTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      expect(optimization.improvements.length).toBeGreaterThan(0);

      optimization.improvements.forEach((improvement) => {
        expect(improvement.stage).toBeTruthy();
        expect(improvement.actions).toBeInstanceOf(Array);
        expect(improvement.estimatedImpact).toBeGreaterThanOrEqual(0);
      });
    });

    it('should address bottlenecks in quick wins', () => {
      const slowCheckInTouchpoints = completeTouchpoints.map((tp) =>
        tp.stage === 'check-in'
          ? { ...tp, durationMinutes: 60, satisfaction: 3 }
          : tp
      );

      const journeys = Array.from({ length: 10 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, slowCheckInTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      const hasBottleneckAddress = optimization.quickWins.some((qw) =>
        qw.toLowerCase().includes('bottleneck')
      );
      expect(hasBottleneckAddress).toBe(true);
    });

    it('should suggest simplifying journey for low completion', () => {
      const incompleteTouchpoints = [
        bookingTouchpoint,
        preArrivalTouchpoint,
        arrivalTouchpoint,
      ];

      const journeys = Array.from({ length: 10 }, (_, i) =>
        i < 5
          ? mapGuestJourney(`guest-${i}`, `res-${i}`, completeTouchpoints)
          : mapGuestJourney(`guest-${i}`, `res-${i}`, incompleteTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      const hasSimplificationSuggestion = optimization.quickWins.some((qw) =>
        qw.toLowerCase().includes('simplify')
      );
      expect(hasSimplificationSuggestion).toBe(true);
    });

    it('should set realistic target scores', () => {
      const journeys = Array.from({ length: 5 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, completeTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      expect(optimization.targetScore).toBeLessThanOrEqual(100);
      expect(optimization.targetScore).toBeGreaterThan(optimization.currentScore);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle a complete guest journey from start to finish', () => {
      const journey = mapGuestJourney('guest-123', 'res-456', completeTouchpoints);

      expect(journey.completionRate).toBe(100);
      expect(journey.touchpoints).toHaveLength(7);
      expect(journey.overallSatisfaction).toBeGreaterThan(0);
    });

    it('should analyze multiple guests and provide insights', () => {
      const journeys = Array.from({ length: 20 }, (_, i) => {
        const satisfaction = 5 + (i % 5);
        const adjustedTouchpoints = completeTouchpoints.map((tp) => ({
          ...tp,
          satisfaction: satisfaction + Math.random() * 2,
        }));

        return mapGuestJourney(`guest-${i}`, `res-${i}`, adjustedTouchpoints);
      });

      const analytics = analyzeJourneys(journeys);

      expect(analytics.totalJourneys).toBe(20);
      expect(analytics.stagePerformance).toBeDefined();
      expect(analytics.channelEffectiveness).toBeDefined();
    });

    it('should provide actionable recommendations throughout journey', () => {
      const stages: JourneyStage[] = [
        'booking',
        'pre-arrival',
        'arrival',
        'check-in',
        'in-stay',
        'check-out',
        'post-stay',
      ];

      stages.forEach((stage) => {
        const relevantTouchpoint = completeTouchpoints.find(
          (tp) => tp.stage === stage
        )!;

        const action = predictNextBestAction(
          { guestId: 'guest-1', touchpoints: [relevantTouchpoint] },
          stage,
          [relevantTouchpoint]
        );

        expect(action.action).toBeTruthy();
        expect(action.channel).toBeTruthy();
      });
    });

    it('should optimize journey based on analytics', () => {
      const journeys = Array.from({ length: 30 }, (_, i) =>
        mapGuestJourney(`guest-${i}`, `res-${i}`, completeTouchpoints)
      );

      const analytics = analyzeJourneys(journeys);
      const optimization = optimizeJourney(analytics);

      expect(optimization.improvements.length).toBeGreaterThan(0);
      expect(optimization.quickWins.length).toBeGreaterThan(0);
      expect(optimization.strategicInitiatives.length).toBeGreaterThan(0);
    });
  });
});
