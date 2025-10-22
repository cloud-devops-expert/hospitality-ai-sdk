'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  LiveStreamProcessor,
  LiveDashboardFeed,
  type StreamEvent,
  type ProcessedEvent,
} from '@/lib/streaming/processor';

export default function StreamingPage() {
  const [processor] = useState(() => new LiveStreamProcessor());
  const [feed] = useState(() => new LiveDashboardFeed(processor));
  const [events, setEvents] = useState<ProcessedEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [metrics, setMetrics] = useState(processor.getMetrics());

  useEffect(() => {
    const subId = feed.subscribe((event: ProcessedEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 20));
      setMetrics(processor.getMetrics());
    });

    return () => feed.unsubscribe(subId);
  }, [feed, processor]);

  const simulateEvent = async (type: StreamEvent['eventType']) => {
    const event: StreamEvent = {
      eventId: `evt-$${Date.now()}`,
      eventType: type,
      timestamp: new Date(),
      data: {
        revenue: Math.random() * 500 + 100,
        guests: Math.floor(Math.random() * 4) + 1,
      },
      priority: Math.random() > 0.9 ? 'critical' : 'medium',
    };
    await feed.publishEvent(event);
  };

  const startAutoStream = () => {
    setIsStreaming(true);
    const types: StreamEvent['eventType'][] = ['booking', 'checkin', 'checkout'];
    const interval = setInterval(() => {
      simulateEvent(types[Math.floor(Math.random() * types.length)]);
    }, 2000);
    setTimeout(() => {
      clearInterval(interval);
      setIsStreaming(false);
    }, 30000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Navigation title="Real-Time Streaming ML" />
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Live event processing with anomaly detection
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Algorithm:</strong> Event-driven stream processing with rolling window anomaly detection
            </p>
            <p>
              <strong>Stream Processing:</strong> Asynchronous event ingestion with non-blocking publish/subscribe pattern for real-time data flow
            </p>
            <p>
              <strong>Anomaly Detection:</strong> Uses Z-score statistical method on rolling 10-event windows to detect outliers (threshold: 2.5 standard deviations)
            </p>
            <p>
              <strong>Alert Generation:</strong> Critical events (top 10% priority) with anomalies trigger immediate alerts for staff action
            </p>
            <p>
              <strong>Performance Metrics:</strong> Tracks total events processed, throughput (events/sec), anomaly count, and alert count in real-time
            </p>
            <p>
              <strong>Use Cases:</strong> Revenue anomalies, unusual booking patterns, operational irregularities, fraud detection
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              <strong>Performance:</strong> &lt;50ms per event | Handles 100+ events/sec | Zero external dependencies | Local processing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.totalEvents}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Events/Sec</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {metrics.eventsPerSecond.toFixed(2)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Anomalies</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {metrics.anomalyCount}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Alerts</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {metrics.alertCount}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Event Simulator
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => simulateEvent('booking')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              📅 Booking
            </button>
            <button
              onClick={() => simulateEvent('checkin')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              ✓ Check-in
            </button>
            <button
              onClick={() => simulateEvent('checkout')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              → Check-out
            </button>
            <button
              onClick={startAutoStream}
              disabled={isStreaming}
              className={`px-4 py-2 rounded-lg ${
                isStreaming ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {isStreaming ? '⏸ Streaming...' : '▶ Auto Stream'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Live Event Feed
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Click a button to simulate events
              </p>
            ) : (
              events.map((event) => (
                <div
                  key={event.eventId}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-mono text-sm">{event.eventId}</span>
                    <span className="text-xs text-gray-500">
                      {event.metrics.processingTime.toFixed(2)}ms
                    </span>
                  </div>
                  {event.anomalies.length > 0 && (
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      ⚠️ {event.anomalies.length} anomaly detected
                    </div>
                  )}
                  {event.alerts.length > 0 && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      🚨 {event.alerts.length} alert
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
