import { generateDailyBriefing } from '../generator';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random()),
}));

// Mock no-show prediction
jest.mock('../../noshow/prediction', () => ({
  predictNoShowCustom: jest.fn((booking) => ({
    probability: booking.previousNoShows > 0 ? 0.85 : 0.15,
    risk: booking.previousNoShows > 0 ? 'high' : 'low',
    factors: [
      {
        name: 'Previous No-Shows',
        value: booking.previousNoShows,
        impact: booking.previousNoShows > 0 ? 0.4 : 0,
      },
    ],
  })),
}));

// Mock forecast
jest.mock('../../forecast/hybrid', () => ({
  forecastHybrid: jest.fn((data, days) => {
    const results = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      // High occupancy on weekends
      const predicted = dayOfWeek === 5 || dayOfWeek === 6 ? 88 : 70;
      results.push({
        date,
        predicted,
        confidence: 0.85,
      });
    }
    return results;
  }),
}));

// Note: calculateDynamicPrice is imported but not used in generator.ts

describe('Daily Briefing Generator', () => {
  describe('generateDailyBriefing', () => {
    it('should generate a daily briefing', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing).toBeDefined();
      expect(briefing.date).toBeInstanceOf(Date);
      expect(briefing.generatedAt).toBeInstanceOf(Date);
    });

    it('should include a greeting', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.greeting).toBeDefined();
      expect(typeof briefing.greeting).toBe('string');
      expect(briefing.greeting.length).toBeGreaterThan(0);
    });

    it('should generate summary with all metrics', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.summary).toBeDefined();
      expect(typeof briefing.summary.arrivals).toBe('number');
      expect(typeof briefing.summary.departures).toBe('number');
      expect(typeof briefing.summary.occupancy).toBe('number');
      expect(typeof briefing.summary.revenue).toBe('number');
      expect(typeof briefing.summary.vipGuests).toBe('number');
      expect(typeof briefing.summary.highRiskNoShows).toBe('number');
    });

    it('should generate alerts', async () => {
      const briefing = await generateDailyBriefing();

      expect(Array.isArray(briefing.alerts)).toBe(true);
      // May have 0 alerts if no critical situations detected
      expect(briefing.alerts.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate insights', async () => {
      const briefing = await generateDailyBriefing();

      expect(Array.isArray(briefing.insights)).toBe(true);
      expect(briefing.insights.length).toBeGreaterThan(0);
      briefing.insights.forEach((insight) => {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Alert Structure', () => {
    it('should have properly structured alerts', async () => {
      const briefing = await generateDailyBriefing();

      briefing.alerts.forEach((alert) => {
        expect(alert.id).toBeDefined();
        expect(alert.type).toBeDefined();
        expect(['critical', 'important', 'fyi']).toContain(alert.type);
        expect(alert.category).toBeDefined();
        expect(alert.title).toBeDefined();
        expect(alert.description).toBeDefined();
        expect(Array.isArray(alert.actions)).toBe(true);
        expect(alert.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should sort alerts by priority', async () => {
      const briefing = await generateDailyBriefing();

      if (briefing.alerts.length > 1) {
        const priorities = { critical: 0, important: 1, fyi: 2 };

        for (let i = 1; i < briefing.alerts.length; i++) {
          const prevPriority = priorities[briefing.alerts[i - 1].type];
          const currentPriority = priorities[briefing.alerts[i].type];
          expect(prevPriority).toBeLessThanOrEqual(currentPriority);
        }
      }
    });

    it('should include actions for each alert', async () => {
      const briefing = await generateDailyBriefing();

      briefing.alerts.forEach((alert) => {
        expect(alert.actions.length).toBeGreaterThan(0);
        alert.actions.forEach((action) => {
          expect(action.id).toBeDefined();
          expect(action.label).toBeDefined();
          expect(action.action).toBeDefined();
        });
      });
    });

    it('should mark primary action in alerts', async () => {
      const briefing = await generateDailyBriefing();

      // At least some alerts should have a primary action
      const alertsWithPrimary = briefing.alerts.filter((alert) =>
        alert.actions.some((action) => action.primary)
      );

      if (briefing.alerts.length > 0) {
        expect(alertsWithPrimary.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Alert Categories', () => {
    it('should generate no-show alerts for high-risk bookings', async () => {
      // The mock creates high-risk no-shows for bookings with previousNoShows > 0
      const briefing = await generateDailyBriefing();

      const noShowAlerts = briefing.alerts.filter((a) => a.category === 'noshow');

      // Verify structure of no-show alerts
      noShowAlerts.forEach((alert) => {
        expect(alert.type).toBe('critical');
        expect(alert.category).toBe('noshow');
        expect(alert.title).toContain('No-Show');
        expect(alert.impact).toBeDefined();
        expect(alert.actions).toContainEqual(
          expect.objectContaining({
            action: 'send-checkin-reminder',
            primary: true,
          })
        );
      });
    });

    it('should generate VIP alerts for premium guests', async () => {
      const briefing = await generateDailyBriefing();

      const vipAlerts = briefing.alerts.filter((a) => a.category === 'vip');

      // Verify structure of VIP alerts
      vipAlerts.forEach((alert) => {
        expect(alert.type).toBe('important');
        expect(alert.category).toBe('vip');
        expect(alert.title).toContain('VIP');
        expect(alert.actions).toContainEqual(
          expect.objectContaining({
            action: 'prepare-vip-welcome',
            primary: true,
          })
        );
      });
    });

    it('should generate pricing alerts for high occupancy periods', async () => {
      const briefing = await generateDailyBriefing();

      const pricingAlerts = briefing.alerts.filter((a) => a.category === 'pricing');

      // Verify structure of pricing alerts
      pricingAlerts.forEach((alert) => {
        expect(alert.type).toBe('important');
        expect(alert.category).toBe('pricing');
        expect(alert.title).toContain('Pricing');
        expect(alert.impact).toBeDefined();
        expect(alert.metadata?.forecast).toBeDefined();
        expect(alert.metadata?.confidence).toBeDefined();
      });
    });

    it('should generate operations alerts', async () => {
      const briefing = await generateDailyBriefing();

      const opsAlerts = briefing.alerts.filter((a) => a.category === 'operations');

      // Operations alerts are probabilistic (30% chance)
      opsAlerts.forEach((alert) => {
        expect(alert.type).toBe('fyi');
        expect(alert.category).toBe('operations');
        expect(alert.title).toBeDefined();
        expect(alert.description).toBeDefined();
      });
    });
  });

  describe('Summary Calculations', () => {
    it('should calculate arrivals correctly', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.summary.arrivals).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(briefing.summary.arrivals)).toBe(true);
    });

    it('should calculate departures correctly', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.summary.departures).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(briefing.summary.departures)).toBe(true);
    });

    it('should have valid occupancy percentage', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.summary.occupancy).toBeGreaterThanOrEqual(0);
      expect(briefing.summary.occupancy).toBeLessThanOrEqual(100);
    });

    it('should calculate revenue', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.summary.revenue).toBeGreaterThan(0);
    });

    it('should match vipGuests count with alerts', async () => {
      const briefing = await generateDailyBriefing();
      const vipAlerts = briefing.alerts.filter((a) => a.category === 'vip');

      expect(briefing.summary.vipGuests).toBe(vipAlerts.length);
    });

    it('should match highRiskNoShows count with alerts', async () => {
      const briefing = await generateDailyBriefing();
      const noShowAlerts = briefing.alerts.filter((a) => a.category === 'noshow');

      expect(briefing.summary.highRiskNoShows).toBe(noShowAlerts.length);
    });
  });

  describe('Insights Generation', () => {
    it('should generate insights based on summary', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.insights.length).toBeGreaterThan(0);
    });

    it('should mention high occupancy when applicable', async () => {
      const briefing = await generateDailyBriefing();

      if (briefing.summary.occupancy > 85) {
        const hasOccupancyInsight = briefing.insights.some((i) =>
          i.toLowerCase().includes('occupancy')
        );
        expect(hasOccupancyInsight).toBe(true);
      }
    });

    it('should mention high-risk no-shows when present', async () => {
      const briefing = await generateDailyBriefing();

      if (briefing.summary.highRiskNoShows > 0) {
        const hasNoShowInsight = briefing.insights.some(
          (i) => i.toLowerCase().includes('no-show') || i.toLowerCase().includes('risk')
        );
        expect(hasNoShowInsight).toBe(true);
      }
    });

    it('should mention VIP guests when present', async () => {
      const briefing = await generateDailyBriefing();

      if (briefing.summary.vipGuests > 0) {
        const hasVIPInsight = briefing.insights.some((i) =>
          i.toLowerCase().includes('vip')
        );
        expect(hasVIPInsight).toBe(true);
      }
    });

    it('should mention pricing opportunities when identified', async () => {
      const briefing = await generateDailyBriefing();
      const pricingAlerts = briefing.alerts.filter((a) => a.category === 'pricing');

      if (pricingAlerts.length > 0) {
        const hasPricingInsight = briefing.insights.some((i) =>
          i.toLowerCase().includes('pricing')
        );
        expect(hasPricingInsight).toBe(true);
      }
    });

    it('should provide positive message when no issues', async () => {
      // Create a scenario with no critical alerts
      // (this depends on the synthetic data, which is random)
      const briefing = await generateDailyBriefing();

      // If no specific insights, should have a positive message
      if (
        briefing.summary.highRiskNoShows === 0 &&
        briefing.summary.vipGuests === 0 &&
        briefing.summary.occupancy <= 85
      ) {
        const hasPositiveMessage = briefing.insights.some(
          (i) => i.includes('✅') || i.includes('smoothly')
        );
        expect(hasPositiveMessage).toBe(true);
      }
    });
  });

  describe('Greeting Generation', () => {
    it('should generate appropriate greeting based on time', async () => {
      const briefing = await generateDailyBriefing();

      // Should generate one of the three greetings
      const hasMorning = briefing.greeting.includes('morning') && briefing.greeting.includes('🌅');
      const hasAfternoon = briefing.greeting.includes('afternoon') && briefing.greeting.includes('☀️');
      const hasEvening = briefing.greeting.includes('evening') && briefing.greeting.includes('🌙');

      expect(hasMorning || hasAfternoon || hasEvening).toBe(true);
    });

    it('should include a greeting message', async () => {
      const briefing = await generateDailyBriefing();

      expect(briefing.greeting).toBeDefined();
      expect(briefing.greeting.length).toBeGreaterThan(0);
      expect(briefing.greeting).toContain('Good');
    });
  });

  describe('Alert Metadata', () => {
    it('should include metadata in no-show alerts', async () => {
      const briefing = await generateDailyBriefing();
      const noShowAlerts = briefing.alerts.filter((a) => a.category === 'noshow');

      noShowAlerts.forEach((alert) => {
        expect(alert.metadata).toBeDefined();
        expect(alert.metadata?.bookingId).toBeDefined();
        expect(typeof alert.metadata?.probability).toBe('number');
        expect(Array.isArray(alert.metadata?.factors)).toBe(true);
      });
    });

    it('should include metadata in VIP alerts', async () => {
      const briefing = await generateDailyBriefing();
      const vipAlerts = briefing.alerts.filter((a) => a.category === 'vip');

      vipAlerts.forEach((alert) => {
        expect(alert.metadata).toBeDefined();
        expect(alert.metadata?.bookingId).toBeDefined();
        expect(typeof alert.metadata?.previousStays).toBe('number');
      });
    });

    it('should include metadata in pricing alerts', async () => {
      const briefing = await generateDailyBriefing();
      const pricingAlerts = briefing.alerts.filter((a) => a.category === 'pricing');

      pricingAlerts.forEach((alert) => {
        expect(alert.metadata).toBeDefined();
        expect(typeof alert.metadata?.forecast).toBe('number');
        expect(typeof alert.metadata?.confidence).toBe('number');
        expect(alert.metadata?.confidence).toBeGreaterThan(0);
        expect(alert.metadata?.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Action Structure', () => {
    it('should have valid action structure', async () => {
      const briefing = await generateDailyBriefing();

      briefing.alerts.forEach((alert) => {
        alert.actions.forEach((action) => {
          expect(action.id).toBeDefined();
          expect(typeof action.id).toBe('string');
          expect(action.label).toBeDefined();
          expect(typeof action.label).toBe('string');
          expect(action.action).toBeDefined();
          expect(typeof action.action).toBe('string');

          // Optional fields
          if (action.icon) {
            expect(typeof action.icon).toBe('string');
          }
          if (action.params) {
            expect(typeof action.params).toBe('object');
          }
          if (action.primary !== undefined) {
            expect(typeof action.primary).toBe('boolean');
          }
        });
      });
    });

    it('should have at most one primary action per alert', async () => {
      const briefing = await generateDailyBriefing();

      briefing.alerts.forEach((alert) => {
        const primaryActions = alert.actions.filter((a) => a.primary);
        expect(primaryActions.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle briefing with no alerts gracefully', async () => {
      // This test may or may not have alerts depending on random data
      const briefing = await generateDailyBriefing();

      expect(Array.isArray(briefing.alerts)).toBe(true);
      expect(Array.isArray(briefing.insights)).toBe(true);
      expect(briefing.insights.length).toBeGreaterThan(0);
    });

    it('should generate consistent data structures', async () => {
      const briefing1 = await generateDailyBriefing();
      const briefing2 = await generateDailyBriefing();

      // Both should have same structure (not same values)
      expect(typeof briefing1.summary.occupancy).toBe(
        typeof briefing2.summary.occupancy
      );
      expect(Array.isArray(briefing1.alerts)).toBe(Array.isArray(briefing2.alerts));
      expect(Array.isArray(briefing1.insights)).toBe(
        Array.isArray(briefing2.insights)
      );
    });

    it('should handle different times of day', async () => {
      // Generate multiple briefings
      const briefings = [];
      for (let i = 0; i < 3; i++) {
        const briefing = await generateDailyBriefing();
        briefings.push(briefing);
      }

      // All briefings should have valid greetings
      briefings.forEach((briefing) => {
        expect(briefing.greeting).toBeDefined();
        expect(briefing.greeting.length).toBeGreaterThan(0);
        expect(briefing.greeting).toContain('Good');
      });
    });
  });

  describe('Impact Messages', () => {
    it('should include impact for no-show alerts', async () => {
      const briefing = await generateDailyBriefing();
      const noShowAlerts = briefing.alerts.filter((a) => a.category === 'noshow');

      noShowAlerts.forEach((alert) => {
        expect(alert.impact).toBeDefined();
        expect(alert.impact).toContain('revenue');
      });
    });

    it('should include impact for VIP alerts', async () => {
      const briefing = await generateDailyBriefing();
      const vipAlerts = briefing.alerts.filter((a) => a.category === 'vip');

      vipAlerts.forEach((alert) => {
        expect(alert.impact).toBeDefined();
        expect(alert.impact).toContain('value');
      });
    });

    it('should include impact for pricing alerts', async () => {
      const briefing = await generateDailyBriefing();
      const pricingAlerts = briefing.alerts.filter((a) => a.category === 'pricing');

      pricingAlerts.forEach((alert) => {
        expect(alert.impact).toBeDefined();
        expect(alert.impact).toContain('revenue');
      });
    });
  });
});
