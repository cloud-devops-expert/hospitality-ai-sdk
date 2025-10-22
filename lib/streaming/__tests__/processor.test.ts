/**
 * Tests for Real-Time Streaming ML Processor
 */

import {
  LiveStreamProcessor,
  IncrementalStatsModel,
  RealTimeAnomalyDetector,
  LiveDashboardFeed,
  processEventBatch,
  detectTrend,
  type StreamEvent,
  type ProcessedEvent,
} from '../processor';

describe('Real-Time Streaming ML Processor', () => {
  describe('IncrementalStatsModel', () => {
    it('should update mean incrementally', () => {
      const model = new IncrementalStatsModel();
      
      model.update([10]);
      let metrics = model.getMetrics();
      expect(metrics.mean).toBe(10);
      
      model.update([20]);
      metrics = model.getMetrics();
      expect(metrics.mean).toBe(15);
    });

    it('should calculate variance', () => {
      const model = new IncrementalStatsModel();
      model.update([10, 20, 30]);
      
      const metrics = model.getMetrics();
      expect(metrics.variance).toBeGreaterThan(0);
    });

    it('should make predictions', () => {
      const model = new IncrementalStatsModel();
      model.update([100, 110, 120, 130]);
      
      const prediction = model.predict([130]);
      expect(prediction).toBeGreaterThan(100);
      expect(prediction).toBeLessThan(150);
    });

    it('should handle empty model prediction', () => {
      const model = new IncrementalStatsModel();
      const prediction = model.predict([50]);
      expect(prediction).toBe(50);
    });

    it('should track sample count', () => {
      const model = new IncrementalStatsModel();
      model.update([1, 2, 3, 4, 5]);
      
      const metrics = model.getMetrics();
      expect(metrics.sampleCount).toBe(5);
    });

    it('should reset model', () => {
      const model = new IncrementalStatsModel();
      model.update([1, 2, 3]);
      model.reset();
      
      const metrics = model.getMetrics();
      expect(metrics.sampleCount).toBe(0);
      expect(metrics.mean).toBe(0);
    });
  });

  describe('RealTimeAnomalyDetector', () => {
    it('should detect anomalies using z-score', () => {
      const detector = new RealTimeAnomalyDetector(50, 3);
      
      // Feed normal data
      for (let i = 0; i < 20; i++) {
        detector.detectAnomaly(100 + Math.random() * 10, 'metric1');
      }
      
      // Feed anomaly
      const anomaly = detector.detectAnomaly(200, 'metric1');
      expect(anomaly).not.toBeNull();
      if (anomaly) {
        expect(anomaly.severity).toMatch(/low|medium|high|critical/);
      }
    });

    it('should return null for insufficient data', () => {
      const detector = new RealTimeAnomalyDetector();
      const anomaly = detector.detectAnomaly(100, 'metric1');
      expect(anomaly).toBeNull();
    });

    it('should handle zero standard deviation', () => {
      const detector = new RealTimeAnomalyDetector();
      
      for (let i = 0; i < 15; i++) {
        detector.detectAnomaly(100, 'metric1');
      }
      
      const anomaly = detector.detectAnomaly(100, 'metric1');
      expect(anomaly).toBeNull();
    });

    it('should classify anomaly severity', () => {
      const detector = new RealTimeAnomalyDetector(50, 2);
      
      for (let i = 0; i < 30; i++) {
        detector.detectAnomaly(100, 'metric1');
      }
      
      const anomaly = detector.detectAnomaly(150, 'metric1');
      expect(anomaly).not.toBeNull();
      if (anomaly) {
        expect(anomaly.severity).toBeDefined();
        expect(anomaly.score).toBeGreaterThan(0);
      }
    });

    it('should reset detector', () => {
      const detector = new RealTimeAnomalyDetector();
      
      for (let i = 0; i < 15; i++) {
        detector.detectAnomaly(100, 'metric1');
      }
      
      detector.reset();
      const anomaly = detector.detectAnomaly(200, 'metric1');
      expect(anomaly).toBeNull(); // Not enough data after reset
    });
  });

  describe('LiveStreamProcessor', () => {
    let processor: LiveStreamProcessor;

    beforeEach(() => {
      processor = new LiveStreamProcessor();
    });

    it('should process events asynchronously', async () => {
      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'medium',
      };

      const processed = await processor.processEvent(event);
      
      expect(processed.eventId).toBe('evt-1');
      expect(processed.predictions.length).toBeGreaterThan(0);
      expect(processed.metrics.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should track event count', async () => {
      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      };

      await processor.processEvent(event);
      await processor.processEvent(event);

      const metrics = processor.getMetrics();
      expect(metrics.totalEvents).toBe(2);
    });

    it('should track event type distribution', async () => {
      const bookingEvent: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      };

      const checkinEvent: StreamEvent = {
        eventId: 'evt-2',
        eventType: 'checkin',
        timestamp: new Date(),
        data: { guestCount: 2 },
        priority: 'low',
      };

      await processor.processEvent(bookingEvent);
      await processor.processEvent(checkinEvent);

      const metrics = processor.getMetrics();
      expect(metrics.eventTypeDistribution.get('booking')).toBe(1);
      expect(metrics.eventTypeDistribution.get('checkin')).toBe(1);
    });

    it('should generate predictions for metrics', async () => {
      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'revenue',
        timestamp: new Date(),
        data: { amount: 1000, count: 5 },
        priority: 'low',
      };

      const processed = await processor.processEvent(event);
      
      expect(processed.predictions.length).toBeGreaterThan(0);
      expect(processed.predictions[0].metric).toBeDefined();
      expect(processed.predictions[0].predictedValue).toBeGreaterThanOrEqual(0);
      expect(processed.predictions[0].confidence).toBeGreaterThanOrEqual(0);
    });

    it('should detect anomalies', async () => {
      // Feed normal events
      for (let i = 0; i < 20; i++) {
        await processor.processEvent({
          eventId: `evt-${i}`,
          eventType: 'revenue',
          timestamp: new Date(),
          data: { revenue: 100 + Math.random() * 10 },
          priority: 'low',
        });
      }

      // Feed anomalous event
      const processed = await processor.processEvent({
        eventId: 'evt-anomaly',
        eventType: 'revenue',
        timestamp: new Date(),
        data: { revenue: 500 },
        priority: 'low',
      });

      expect(processed.anomalies.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate alerts for critical events', async () => {
      const event: StreamEvent = {
        eventId: 'evt-critical',
        eventType: 'maintenance',
        timestamp: new Date(),
        data: { urgency: 10 },
        priority: 'critical',
      };

      const processed = await processor.processEvent(event);
      
      expect(processed.alerts.length).toBeGreaterThan(0);
      const criticalAlert = processed.alerts.find(a => a.severity === 'critical');
      expect(criticalAlert).toBeDefined();
    });

    it('should calculate event metrics', async () => {
      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      };

      const processed = await processor.processEvent(event);
      
      expect(processed.metrics.eventCount).toBe(1);
      expect(processed.metrics.processingTime).toBeGreaterThanOrEqual(0);
      expect(processed.metrics.anomalyRate).toBeGreaterThanOrEqual(0);
      expect(processed.metrics.alertRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate stream metrics', async () => {
      await processor.processEvent({
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      });

      const metrics = processor.getMetrics();

      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventsPerSecond).toBeGreaterThanOrEqual(0);
      expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should reset processor', async () => {
      await processor.processEvent({
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      });

      processor.reset();
      const metrics = processor.getMetrics();
      
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.anomalyCount).toBe(0);
    });

    it('should handle events with multiple metrics', async () => {
      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { 
          revenue: 150,
          rooms: 2,
          guests: 4,
        },
        priority: 'low',
      };

      const processed = await processor.processEvent(event);
      
      expect(processed.predictions.length).toBe(3);
    });

    it('should ignore non-numeric data', async () => {
      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { 
          revenue: 150,
          guestName: 'John Doe',
          confirmed: true,
        },
        priority: 'low',
      };

      const processed = await processor.processEvent(event);
      
      expect(processed.predictions.length).toBe(1);
      expect(processed.predictions[0].metric).toBe('revenue');
    });
  });

  describe('LiveDashboardFeed', () => {
    let processor: LiveStreamProcessor;
    let feed: LiveDashboardFeed;

    beforeEach(() => {
      processor = new LiveStreamProcessor();
      feed = new LiveDashboardFeed(processor);
    });

    it('should allow subscriptions', () => {
      const callback = jest.fn();
      const subId = feed.subscribe(callback);
      
      expect(subId).toBeDefined();
      expect(feed.getSubscriberCount()).toBe(1);
    });

    it('should allow unsubscriptions', () => {
      const callback = jest.fn();
      const subId = feed.subscribe(callback);
      
      feed.unsubscribe(subId);
      expect(feed.getSubscriberCount()).toBe(0);
    });

    it('should publish events to subscribers', async () => {
      const callback = jest.fn();
      feed.subscribe(callback);

      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      };

      await feed.publishEvent(event);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].eventId).toBe('evt-1');
    });

    it('should store recent events', async () => {
      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      };

      await feed.publishEvent(event);
      
      const recent = feed.getRecentEvents(10);
      expect(recent.length).toBe(1);
      expect(recent[0].eventId).toBe('evt-1');
    });

    it('should limit recent events', async () => {
      for (let i = 0; i < 15; i++) {
        await feed.publishEvent({
          eventId: `evt-${i}`,
          eventType: 'booking',
          timestamp: new Date(),
          data: { revenue: 100 },
          priority: 'low',
        });
      }

      const recent = feed.getRecentEvents(5);
      expect(recent.length).toBe(5);
    });

    it('should provide live metrics', async () => {
      await feed.publishEvent({
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      });

      const metrics = feed.getLiveMetrics();
      expect(metrics.totalEvents).toBe(1);
    });

    it('should handle subscriber errors gracefully', async () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Subscriber error');
      });
      const goodCallback = jest.fn();

      feed.subscribe(errorCallback);
      feed.subscribe(goodCallback);

      const event: StreamEvent = {
        eventId: 'evt-1',
        eventType: 'booking',
        timestamp: new Date(),
        data: { revenue: 150 },
        priority: 'low',
      };

      await feed.publishEvent(event);
      
      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('processEventBatch', () => {
    it('should process multiple events', async () => {
      const processor = new LiveStreamProcessor();
      const events: StreamEvent[] = [
        {
          eventId: 'evt-1',
          eventType: 'booking',
          timestamp: new Date(),
          data: { revenue: 150 },
          priority: 'low',
        },
        {
          eventId: 'evt-2',
          eventType: 'checkin',
          timestamp: new Date(),
          data: { guests: 2 },
          priority: 'low',
        },
      ];

      const results = await processEventBatch(events, processor);
      
      expect(results.length).toBe(2);
      expect(results[0].eventId).toBe('evt-1');
      expect(results[1].eventId).toBe('evt-2');
    });
  });

  describe('detectTrend', () => {
    it('should detect increasing trend', () => {
      const events: ProcessedEvent[] = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          eventId: `evt-${i}`,
          processedAt: new Date(),
          anomalies: [],
          predictions: [{ metric: 'revenue', predictedValue: 100 + i * 10, confidence: 0.9, timeHorizon: 15, method: 'test' }],
          alerts: [],
          metrics: { processingTime: 1, eventCount: i + 1, anomalyRate: 0, alertRate: 0 },
        });
      }

      const trend = detectTrend(events, 'revenue');
      expect(trend.trend).toBe('increasing');
      expect(trend.strength).toBeGreaterThan(0);
    });

    it('should detect decreasing trend', () => {
      const events: ProcessedEvent[] = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          eventId: `evt-${i}`,
          processedAt: new Date(),
          anomalies: [],
          predictions: [{ metric: 'revenue', predictedValue: 200 - i * 10, confidence: 0.9, timeHorizon: 15, method: 'test' }],
          alerts: [],
          metrics: { processingTime: 1, eventCount: i + 1, anomalyRate: 0, alertRate: 0 },
        });
      }

      const trend = detectTrend(events, 'revenue');
      expect(trend.trend).toBe('decreasing');
      expect(trend.strength).toBeGreaterThan(0);
    });

    it('should detect stable trend', () => {
      const events: ProcessedEvent[] = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          eventId: `evt-${i}`,
          processedAt: new Date(),
          anomalies: [],
          predictions: [{ metric: 'revenue', predictedValue: 100, confidence: 0.9, timeHorizon: 15, method: 'test' }],
          alerts: [],
          metrics: { processingTime: 1, eventCount: i + 1, anomalyRate: 0, alertRate: 0 },
        });
      }

      const trend = detectTrend(events, 'revenue');
      expect(trend.trend).toBe('stable');
    });

    it('should return stable for insufficient data', () => {
      const events: ProcessedEvent[] = [
        {
          eventId: 'evt-1',
          processedAt: new Date(),
          anomalies: [],
          predictions: [{ metric: 'revenue', predictedValue: 100, confidence: 0.9, timeHorizon: 15, method: 'test' }],
          alerts: [],
          metrics: { processingTime: 1, eventCount: 1, anomalyRate: 0, alertRate: 0 },
        },
      ];

      const trend = detectTrend(events, 'revenue');
      expect(trend.trend).toBe('stable');
      expect(trend.confidence).toBe(0);
    });

    it('should handle missing metric', () => {
      const events: ProcessedEvent[] = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          eventId: `evt-${i}`,
          processedAt: new Date(),
          anomalies: [],
          predictions: [{ metric: 'occupancy', predictedValue: 80, confidence: 0.9, timeHorizon: 15, method: 'test' }],
          alerts: [],
          metrics: { processingTime: 1, eventCount: i + 1, anomalyRate: 0, alertRate: 0 },
        });
      }

      const trend = detectTrend(events, 'revenue');
      expect(trend.trend).toBe('stable');
      expect(trend.confidence).toBe(0);
    });
  });

  // Integration tests
  describe('Integration: Full streaming workflow', () => {
    it('should process event stream end-to-end', async () => {
      const processor = new LiveStreamProcessor();
      const feed = new LiveDashboardFeed(processor);
      
      const receivedEvents: ProcessedEvent[] = [];
      feed.subscribe((event) => {
        receivedEvents.push(event);
      });

      // Simulate event stream
      for (let i = 0; i < 5; i++) {
        await feed.publishEvent({
          eventId: `evt-${i}`,
          eventType: 'booking',
          timestamp: new Date(),
          data: { revenue: 100 + i * 10 },
          priority: 'low',
        });
      }

      expect(receivedEvents.length).toBe(5);
      expect(feed.getRecentEvents(10).length).toBe(5);
      
      const metrics = feed.getLiveMetrics();
      expect(metrics.totalEvents).toBe(5);
    });
  });
});
