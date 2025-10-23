import { generateTimeline } from '../generator';
import { TimelineFilter } from '../types';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random()),
}));

// Mock no-show prediction
jest.mock('../../noshow/prediction', () => ({
  predictNoShowCustom: jest.fn((booking) => ({
    probability: booking.previousNoShows > 0 ? 0.8 : 0.2,
    risk: booking.previousNoShows > 0 ? 'high' : 'low',
    factors: [],
  })),
}));

// Mock forecast
jest.mock('../../forecast/hybrid', () => ({
  forecastHybrid: jest.fn(() => ({
    forecast: [],
    confidence: 0.85,
  })),
}));

describe('Timeline Generator', () => {
  describe('generateTimeline', () => {
    it('should generate timeline events without filters', async () => {
      const result = await generateTimeline();

      expect(result.events).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.totalCount).toBe(result.events.length);
      expect(result.hasMore).toBe(false);
    });

    it('should return events with required properties', async () => {
      const result = await generateTimeline();
      const event = result.events[0];

      expect(event.id).toBeDefined();
      expect(event.type).toBeDefined();
      expect(event.title).toBeDefined();
      expect(event.description).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.priority).toBeDefined();
    });

    it('should sort events by timestamp (most recent first)', async () => {
      const result = await generateTimeline();

      for (let i = 1; i < result.events.length; i++) {
        expect(result.events[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          result.events[i].timestamp.getTime()
        );
      }
    });

    it('should include various event types', async () => {
      const result = await generateTimeline();
      const eventTypes = new Set(result.events.map((e) => e.type));

      // Should have multiple event types
      expect(eventTypes.size).toBeGreaterThan(1);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter events by date range', async () => {
      const now = new Date();
      const start = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day from now
      const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

      const filter: TimelineFilter = {
        dateRange: { start, end },
      };

      const result = await generateTimeline(filter);

      // All events should be within date range
      result.events.forEach((event) => {
        expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(event.timestamp.getTime()).toBeLessThanOrEqual(end.getTime());
      });
    });

    it('should use default date range when not specified', async () => {
      const result = await generateTimeline();
      const now = new Date();

      // Events should be within default 7-day window
      result.events.forEach((event) => {
        const daysDiff =
          (event.timestamp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
        expect(daysDiff).toBeLessThanOrEqual(7);
      });
    });
  });

  describe('Event Type Filtering', () => {
    it('should filter by single event type', async () => {
      const filter: TimelineFilter = {
        types: ['booking'],
      };

      const result = await generateTimeline(filter);

      result.events.forEach((event) => {
        expect(event.type).toBe('booking');
      });
    });

    it('should filter by multiple event types', async () => {
      const filter: TimelineFilter = {
        types: ['booking', 'checkin', 'checkout'],
      };

      const result = await generateTimeline(filter);

      result.events.forEach((event) => {
        expect(['booking', 'checkin', 'checkout']).toContain(event.type);
      });
    });

    it('should include maintenance events when filtered', async () => {
      const filter: TimelineFilter = {
        types: ['maintenance'],
      };

      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
      result.events.forEach((event) => {
        expect(event.type).toBe('maintenance');
      });
    });

    it('should include housekeeping events when filtered', async () => {
      const filter: TimelineFilter = {
        types: ['housekeeping'],
      };

      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
      result.events.forEach((event) => {
        expect(event.type).toBe('housekeeping');
      });
    });

    it('should include review events when filtered', async () => {
      const filter: TimelineFilter = {
        types: ['review'],
      };

      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
      result.events.forEach((event) => {
        expect(event.type).toBe('review');
      });
    });

    it('should include VIP arrival events when filtered', async () => {
      const filter: TimelineFilter = {
        types: ['vip_arrival'],
      };

      const result = await generateTimeline(filter);

      // VIP arrivals are generated from bookings with Suite or many previous stays
      // May be 0 if no VIPs in synthetic data
      expect(Array.isArray(result.events)).toBe(true);
      result.events.forEach((event) => {
        expect(event.type).toBe('vip_arrival');
      });
    });
  });

  describe('Priority Filtering', () => {
    it('should filter by priority', async () => {
      const filter: TimelineFilter = {
        priorities: ['high', 'critical'],
      };

      const result = await generateTimeline(filter);

      result.events.forEach((event) => {
        expect(['high', 'critical']).toContain(event.priority);
      });
    });

    it('should filter by single priority', async () => {
      const filter: TimelineFilter = {
        priorities: ['low'],
      };

      const result = await generateTimeline(filter);

      result.events.forEach((event) => {
        expect(event.priority).toBe('low');
      });
    });
  });

  describe('Search Query Filtering', () => {
    it('should filter by title search', async () => {
      const filter: TimelineFilter = {
        searchQuery: 'booking',
      };

      const result = await generateTimeline(filter);

      result.events.forEach((event) => {
        const matchesTitle = event.title.toLowerCase().includes('booking');
        const matchesDescription = event.description
          .toLowerCase()
          .includes('booking');
        expect(matchesTitle || matchesDescription).toBe(true);
      });
    });

    it('should filter by guest name in metadata', async () => {
      // Get all events first to find a guest name
      const allEvents = await generateTimeline();
      const eventWithGuest = allEvents.events.find((e) => e.metadata?.guestName);

      if (eventWithGuest && eventWithGuest.metadata?.guestName) {
        const guestName = eventWithGuest.metadata.guestName;
        const filter: TimelineFilter = {
          searchQuery: guestName,
        };

        const result = await generateTimeline(filter);

        // At least one event should match the guest name
        expect(result.events.length).toBeGreaterThan(0);
      }
    });

    it('should filter by room number', async () => {
      const filter: TimelineFilter = {
        searchQuery: '1', // Search for rooms containing "1"
      };

      const result = await generateTimeline(filter);

      // Should find some events with "1" in them
      // (room numbers, guest names, or descriptions may contain "1")
      expect(Array.isArray(result.events)).toBe(true);
      // If we have results, verify they match the query
      if (result.events.length > 0) {
        result.events.forEach((event) => {
          const matchesQuery =
            event.title.toLowerCase().includes('1') ||
            event.description.toLowerCase().includes('1') ||
            event.metadata?.guestName?.toLowerCase().includes('1') ||
            event.metadata?.roomNumber?.toLowerCase().includes('1');
          expect(matchesQuery).toBe(true);
        });
      }
    });

    it('should be case-insensitive', async () => {
      const filterUpper: TimelineFilter = {
        searchQuery: 'MAINTENANCE',
      };
      const filterLower: TimelineFilter = {
        searchQuery: 'maintenance',
      };

      const resultUpper = await generateTimeline(filterUpper);
      const resultLower = await generateTimeline(filterLower);

      // Both should find maintenance events
      expect(resultUpper.events.length).toBeGreaterThan(0);
      expect(resultLower.events.length).toBeGreaterThan(0);

      // Verify both match maintenance-related events
      resultUpper.events.forEach((event) => {
        const text = `${event.title} ${event.description}`.toLowerCase();
        expect(text.includes('maintenance')).toBe(true);
      });

      resultLower.events.forEach((event) => {
        const text = `${event.title} ${event.description}`.toLowerCase();
        expect(text.includes('maintenance')).toBe(true);
      });
    });

    it('should return empty array when no matches', async () => {
      const filter: TimelineFilter = {
        searchQuery: 'nonexistent-query-12345',
      };

      const result = await generateTimeline(filter);

      expect(result.events.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('Combined Filtering', () => {
    it('should apply multiple filters together', async () => {
      const now = new Date();
      const filter: TimelineFilter = {
        types: ['booking', 'checkin'],
        priorities: ['high', 'medium'],
        dateRange: {
          start: now,
          end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      };

      const result = await generateTimeline(filter);

      result.events.forEach((event) => {
        expect(['booking', 'checkin']).toContain(event.type);
        expect(['high', 'medium']).toContain(event.priority);
        expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(now.getTime());
      });
    });

    it('should apply type filter and search together', async () => {
      const filter: TimelineFilter = {
        types: ['maintenance'],
        searchQuery: 'room',
      };

      const result = await generateTimeline(filter);

      result.events.forEach((event) => {
        expect(event.type).toBe('maintenance');
        const hasRoomInText =
          event.title.toLowerCase().includes('room') ||
          event.description.toLowerCase().includes('room') ||
          event.metadata?.roomNumber?.toLowerCase().includes('room');
        expect(hasRoomInText).toBe(true);
      });
    });
  });

  describe('Event Properties', () => {
    it('should include actions for high-risk check-ins', async () => {
      const result = await generateTimeline();
      const highRiskCheckin = result.events.find(
        (e) => e.type === 'checkin' && e.priority === 'critical'
      );

      if (highRiskCheckin) {
        expect(highRiskCheckin.actions).toBeDefined();
        expect(highRiskCheckin.actions!.length).toBeGreaterThan(0);
        expect(highRiskCheckin.actions).toContainEqual(
          expect.objectContaining({
            action: 'send-checkin-reminder',
            primary: true,
          })
        );
      }
    });

    it('should include actions for check-outs', async () => {
      const filter: TimelineFilter = {
        types: ['checkout'],
      };
      const result = await generateTimeline(filter);

      if (result.events.length > 0) {
        const checkoutEvent = result.events[0];
        expect(checkoutEvent.actions).toBeDefined();
        expect(checkoutEvent.actions!.length).toBeGreaterThan(0);
        expect(checkoutEvent.actions).toContainEqual(
          expect.objectContaining({
            action: 'prepare-checkout-bill',
          })
        );
      }
    });

    it('should include actions for VIP arrivals', async () => {
      const filter: TimelineFilter = {
        types: ['vip_arrival'],
      };
      const result = await generateTimeline(filter);

      if (result.events.length > 0) {
        const vipEvent = result.events[0];
        expect(vipEvent.actions).toBeDefined();
        expect(vipEvent.actions!.length).toBeGreaterThan(0);
        expect(vipEvent.actions).toContainEqual(
          expect.objectContaining({
            action: 'prepare-vip-welcome',
          })
        );
      }
    });

    it('should include actions for maintenance events', async () => {
      const filter: TimelineFilter = {
        types: ['maintenance'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
      const maintenanceEvent = result.events[0];
      expect(maintenanceEvent.actions).toBeDefined();
      expect(maintenanceEvent.actions!.length).toBeGreaterThan(0);
    });

    it('should include actions for reviews', async () => {
      const filter: TimelineFilter = {
        types: ['review'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
      const reviewEvent = result.events[0];
      expect(reviewEvent.actions).toBeDefined();
      expect(reviewEvent.actions!.length).toBeGreaterThan(0);
      expect(reviewEvent.actions).toContainEqual(
        expect.objectContaining({
          action: 'respond-to-review',
        })
      );
    });

    it('should have metadata for booking events', async () => {
      const filter: TimelineFilter = {
        types: ['booking'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
      const bookingEvent = result.events[0];
      expect(bookingEvent.metadata).toBeDefined();
      expect(bookingEvent.metadata?.guestName).toBeDefined();
      expect(bookingEvent.metadata?.roomNumber).toBeDefined();
      expect(bookingEvent.metadata?.amount).toBeDefined();
      expect(bookingEvent.metadata?.bookingId).toBeDefined();
    });

    it('should have icon and color for all events', async () => {
      const result = await generateTimeline();

      result.events.forEach((event) => {
        expect(event.icon).toBeDefined();
        expect(event.color).toBeDefined();
      });
    });
  });

  describe('Event Type Coverage', () => {
    it('should generate booking events', async () => {
      const filter: TimelineFilter = {
        types: ['booking'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should generate check-in events', async () => {
      const filter: TimelineFilter = {
        types: ['checkin'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should generate check-out events', async () => {
      const filter: TimelineFilter = {
        types: ['checkout'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should generate maintenance events', async () => {
      const filter: TimelineFilter = {
        types: ['maintenance'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should generate housekeeping events', async () => {
      const filter: TimelineFilter = {
        types: ['housekeeping'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should generate review events', async () => {
      const filter: TimelineFilter = {
        types: ['review'],
      };
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });
  });

  describe('Response Structure', () => {
    it('should return correct response structure', async () => {
      const result = await generateTimeline();

      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.events)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
      expect(typeof result.hasMore).toBe('boolean');
    });

    it('should have totalCount match events length', async () => {
      const result = await generateTimeline();

      expect(result.totalCount).toBe(result.events.length);
    });

    it('should set hasMore to false', async () => {
      const result = await generateTimeline();

      expect(result.hasMore).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filter', async () => {
      const filter: TimelineFilter = {};
      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should handle filter with empty arrays', async () => {
      const filter: TimelineFilter = {
        types: [],
        priorities: [],
      };
      const result = await generateTimeline(filter);

      // Empty types/priorities arrays filter out all events
      // This is expected behavior: empty array means "include none of these"
      expect(result.events.length).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle very narrow date range', async () => {
      const now = new Date();
      const filter: TimelineFilter = {
        dateRange: {
          start: now,
          end: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour
        },
      };

      const result = await generateTimeline(filter);

      // May have 0 or few events in 1 hour window
      expect(Array.isArray(result.events)).toBe(true);
    });

    it('should handle very wide date range', async () => {
      const now = new Date();
      const filter: TimelineFilter = {
        dateRange: {
          start: now,
          end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      };

      const result = await generateTimeline(filter);

      expect(result.events.length).toBeGreaterThan(0);
    });

    it('should handle past date range', async () => {
      const now = new Date();
      const filter: TimelineFilter = {
        dateRange: {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      };

      const result = await generateTimeline(filter);

      // Should handle past dates gracefully
      expect(Array.isArray(result.events)).toBe(true);
    });
  });
});
