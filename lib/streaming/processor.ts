/**
 * Real-Time Streaming ML
 *
 * Event-driven ML processing with real-time anomaly detection, pattern recognition,
 * and incremental learning using sliding window algorithms.
 *
 * Features:
 * - Event stream processing with sliding windows
 * - Real-time anomaly detection
 * - Live metric aggregation
 * - Pattern recognition and forecasting
 * - Alert generation and prioritization
 * - Incremental model updates
 *
 * @module lib/streaming/processor
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export type EventType =
  | 'booking'
  | 'checkin'
  | 'checkout'
  | 'room-service'
  | 'complaint'
  | 'maintenance'
  | 'payment'
  | 'review'
  | 'cancellation';

export interface StreamEvent {
  eventId: string;
  eventType: EventType;
  timestamp: Date;
  propertyId: string;
  guestId?: string;
  roomId?: string;
  data: Record<string, any>;
  metadata?: {
    source?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  };
}

export interface StreamWindow {
  windowId: string;
  startTime: Date;
  endTime: Date;
  events: StreamEvent[];
  metrics: WindowMetrics;
}

export interface WindowMetrics {
  eventCount: number;
  eventsByType: Record<EventType, number>;
  averageValue?: number;
  min?: number;
  max?: number;
  anomalyCount: number;
  patterns: Pattern[];
}

export interface Pattern {
  type: 'spike' | 'drop' | 'trend' | 'cyclic' | 'cluster';
  confidence: number; // 0-100
  description: string;
  startTime: Date;
  endTime: Date;
  significance: 'low' | 'medium' | 'high';
}

export interface Anomaly {
  anomalyId: string;
  event: StreamEvent;
  detectedAt: Date;
  type: 'statistical' | 'behavioral' | 'threshold' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100, higher = more anomalous
  baseline: number;
  deviation: number;
  description: string;
  suggestedAction?: string;
}

export interface Alert {
  alertId: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'anomaly' | 'threshold' | 'pattern' | 'prediction';
  title: string;
  description: string;
  affectedEntities: string[];
  metrics?: Record<string, number>;
  recommendations: string[];
  acknowledged: boolean;
}

export interface StreamMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageProcessingTime: number; // ms
  activeWindows: number;
  anomaliesDetected: number;
  alertsGenerated: number;
  lastUpdateTime: Date;
}

export interface StreamProcessorConfig {
  windowSize: number; // minutes
  windowSlide: number; // minutes
  anomalyThreshold: number; // 0-100
  maxWindows: number;
  enablePatternDetection: boolean;
  enableAnomalyDetection: boolean;
  enableAlerts: boolean;
}

export interface StreamProcessor {
  config: StreamProcessorConfig;
  windows: StreamWindow[];
  anomalies: Anomaly[];
  alerts: Alert[];
  metrics: StreamMetrics;
  baseline: Record<string, number>;
}

export interface RealTimeForecast {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeHorizon: number; // minutes
  trend: 'increasing' | 'decreasing' | 'stable';
}

// ============================================================================
// Stream Processor Creation and Management
// ============================================================================

/**
 * Creates a new stream processor
 */
export function createStreamProcessor(
  config?: Partial<StreamProcessorConfig>
): StreamProcessor {
  const defaultConfig: StreamProcessorConfig = {
    windowSize: 15,
    windowSlide: 5,
    anomalyThreshold: 75,
    maxWindows: 12,
    enablePatternDetection: true,
    enableAnomalyDetection: true,
    enableAlerts: true,
  };

  return {
    config: { ...defaultConfig, ...config },
    windows: [],
    anomalies: [],
    alerts: [],
    metrics: {
      totalEvents: 0,
      eventsPerSecond: 0,
      averageProcessingTime: 0,
      activeWindows: 0,
      anomaliesDetected: 0,
      alertsGenerated: 0,
      lastUpdateTime: new Date(),
    },
    baseline: {},
  };
}

/**
 * Processes a stream of events
 */
export function processEventStream(
  processor: StreamProcessor,
  events: StreamEvent[]
): StreamProcessor {
  const startTime = Date.now();

  // Update baseline from existing events
  updateBaseline(processor, events);

  // Add events to appropriate windows
  events.forEach((event) => {
    addEventToWindow(processor, event);

    // Detect anomalies
    if (processor.config.enableAnomalyDetection) {
      const anomaly = detectAnomaly(processor, event);
      if (anomaly) {
        processor.anomalies.push(anomaly);
        processor.metrics.anomaliesDetected++;

        // Generate alert if configured
        if (processor.config.enableAlerts && anomaly.severity !== 'low') {
          const alert = generateAlert(anomaly);
          processor.alerts.push(alert);
          processor.metrics.alertsGenerated++;
        }
      }
    }
  });

  // Detect patterns across windows
  if (processor.config.enablePatternDetection) {
    detectPatterns(processor);
  }

  // Update metrics
  const processingTime = Date.now() - startTime;
  processor.metrics.totalEvents += events.length;
  processor.metrics.averageProcessingTime =
    (processor.metrics.averageProcessingTime * 0.7 + processingTime * 0.3);
  processor.metrics.lastUpdateTime = new Date();
  processor.metrics.activeWindows = processor.windows.length;

  // Calculate events per second
  if (processor.windows.length > 0) {
    const totalTime = processor.windows.reduce(
      (sum, w) => sum + (w.endTime.getTime() - w.startTime.getTime()),
      0
    ) / 1000;
    processor.metrics.eventsPerSecond = totalTime > 0
      ? processor.metrics.totalEvents / totalTime
      : 0;
  }

  return processor;
}

/**
 * Gets real-time forecast based on recent events
 */
export function getRealTimeForecast(
  processor: StreamProcessor,
  metric: string,
  timeHorizon: number = 15
): RealTimeForecast {
  if (processor.windows.length < 2) {
    const currentValue = processor.baseline[metric] || 0;
    return {
      metric,
      currentValue,
      predictedValue: currentValue,
      confidence: 30,
      timeHorizon,
      trend: 'stable',
    };
  }

  // Get values from recent windows
  const recentWindows = processor.windows.slice(-6); // Last 6 windows
  const values = recentWindows.map((w) => {
    if (metric === 'events') return w.metrics.eventCount;
    if (metric === 'anomalies') return w.metrics.anomalyCount;
    return 0;
  });

  const currentValue = values[values.length - 1];

  // Simple linear regression for prediction
  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = values.reduce((sum, y) => sum + y, 0) / n;

  const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0);
  const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Predict for next time horizon
  const predictedValue = Math.max(0, slope * n + intercept);

  // Calculate confidence based on variance
  const variance = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0) / n;
  const confidence = Math.max(0, Math.min(100, 100 - (variance / yMean) * 50));

  // Determine trend
  let trend: RealTimeForecast['trend'];
  if (slope > 0.1) {
    trend = 'increasing';
  } else if (slope < -0.1) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }

  return {
    metric,
    currentValue,
    predictedValue: Math.round(predictedValue),
    confidence: Math.round(confidence),
    timeHorizon,
    trend,
  };
}

/**
 * Gets current streaming metrics
 */
export function getStreamMetrics(processor: StreamProcessor): StreamMetrics {
  return processor.metrics;
}

/**
 * Gets recent anomalies
 */
export function getRecentAnomalies(
  processor: StreamProcessor,
  count: number = 10
): Anomaly[] {
  return processor.anomalies.slice(-count);
}

/**
 * Gets active alerts
 */
export function getActiveAlerts(processor: StreamProcessor): Alert[] {
  return processor.alerts.filter((alert) => !alert.acknowledged);
}

/**
 * Acknowledges an alert
 */
export function acknowledgeAlert(
  processor: StreamProcessor,
  alertId: string
): StreamProcessor {
  const alert = processor.alerts.find((a) => a.alertId === alertId);
  if (alert) {
    alert.acknowledged = true;
  }
  return processor;
}

// ============================================================================
// Helper Functions
// ============================================================================

function updateBaseline(processor: StreamProcessor, events: StreamEvent[]): void {
  // Calculate baseline metrics from events
  const eventCounts = new Map<EventType, number>();

  events.forEach((event) => {
    eventCounts.set(event.eventType, (eventCounts.get(event.eventType) || 0) + 1);
  });

  eventCounts.forEach((count, eventType) => {
    const key = `${eventType}_rate`;
    const existingValue = processor.baseline[key] || 0;
    processor.baseline[key] = existingValue * 0.8 + (count / events.length) * 0.2;
  });
}

function addEventToWindow(processor: StreamProcessor, event: StreamEvent): void {
  const eventTime = event.timestamp;

  // Find or create appropriate window
  let targetWindow = processor.windows.find((w) =>
    eventTime >= w.startTime && eventTime < w.endTime
  );

  if (!targetWindow) {
    // Create new window
    const windowStartTime = new Date(eventTime);
    windowStartTime.setMinutes(
      Math.floor(windowStartTime.getMinutes() / processor.config.windowSlide) *
        processor.config.windowSlide
    );
    windowStartTime.setSeconds(0);
    windowStartTime.setMilliseconds(0);

    const windowEndTime = new Date(windowStartTime);
    windowEndTime.setMinutes(windowEndTime.getMinutes() + processor.config.windowSize);

    targetWindow = {
      windowId: `window_${windowStartTime.getTime()}`,
      startTime: windowStartTime,
      endTime: windowEndTime,
      events: [],
      metrics: {
        eventCount: 0,
        eventsByType: {} as Record<EventType, number>,
        anomalyCount: 0,
        patterns: [],
      },
    };

    processor.windows.push(targetWindow);

    // Remove old windows if exceeding max
    if (processor.windows.length > processor.config.maxWindows) {
      processor.windows.shift();
    }
  }

  // Add event to window
  targetWindow.events.push(event);
  targetWindow.metrics.eventCount++;

  // Update event type counts
  targetWindow.metrics.eventsByType[event.eventType] =
    (targetWindow.metrics.eventsByType[event.eventType] || 0) + 1;
}

function detectAnomaly(
  processor: StreamProcessor,
  event: StreamEvent
): Anomaly | null {
  const baselineKey = `${event.eventType}_rate`;
  const baseline = processor.baseline[baselineKey] || 0;

  if (baseline === 0) {
    return null; // Not enough data for baseline
  }

  // Get current rate from recent window
  const recentWindow = processor.windows[processor.windows.length - 1];
  if (!recentWindow) return null;

  const currentRate =
    (recentWindow.metrics.eventsByType[event.eventType] || 0) /
    recentWindow.metrics.eventCount;

  const deviation = Math.abs(currentRate - baseline);
  const deviationPercent = baseline > 0 ? (deviation / baseline) * 100 : 0;

  // Check if anomalous
  if (deviationPercent < processor.config.anomalyThreshold) {
    return null;
  }

  // Determine severity
  let severity: Anomaly['severity'];
  if (deviationPercent > 200) {
    severity = 'critical';
  } else if (deviationPercent > 150) {
    severity = 'high';
  } else if (deviationPercent > 100) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  // Determine type
  let type: Anomaly['type'] = 'statistical';
  if (event.eventType === 'complaint' || event.eventType === 'cancellation') {
    type = 'behavioral';
  }

  const score = Math.min(100, deviationPercent);

  const description = `${event.eventType} event rate ${currentRate.toFixed(
    2
  )} deviates ${deviationPercent.toFixed(0)}% from baseline ${baseline.toFixed(2)}`;

  let suggestedAction: string | undefined;
  if (event.eventType === 'complaint') {
    suggestedAction = 'Investigate recent complaint patterns and address root causes';
  } else if (event.eventType === 'cancellation') {
    suggestedAction = 'Review cancellation reasons and implement retention strategies';
  } else if (event.eventType === 'maintenance') {
    suggestedAction = 'Check for facility issues and allocate maintenance resources';
  }

  return {
    anomalyId: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event,
    detectedAt: new Date(),
    type,
    severity,
    score,
    baseline,
    deviation: deviationPercent,
    description,
    suggestedAction,
  };
}

function detectPatterns(processor: StreamProcessor): void {
  if (processor.windows.length < 3) return;

  const recentWindows = processor.windows.slice(-6);

  // Detect spike pattern
  const eventCounts = recentWindows.map((w) => w.metrics.eventCount);
  const avgCount = eventCounts.reduce((sum, c) => sum + c, 0) / eventCounts.length;
  const maxCount = Math.max(...eventCounts);

  if (maxCount > avgCount * 2) {
    const spikeWindow = recentWindows.find((w) => w.metrics.eventCount === maxCount);
    if (spikeWindow && spikeWindow.metrics.patterns.every((p) => p.type !== 'spike')) {
      spikeWindow.metrics.patterns.push({
        type: 'spike',
        confidence: 85,
        description: `Event spike detected: ${maxCount} events (${((maxCount / avgCount - 1) * 100).toFixed(0)}% above average)`,
        startTime: spikeWindow.startTime,
        endTime: spikeWindow.endTime,
        significance: maxCount > avgCount * 3 ? 'high' : 'medium',
      });
    }
  }

  // Detect trend pattern
  if (eventCounts.length >= 4) {
    const firstHalf = eventCounts.slice(0, Math.floor(eventCounts.length / 2));
    const secondHalf = eventCounts.slice(Math.floor(eventCounts.length / 2));

    const firstAvg = firstHalf.reduce((sum, c) => sum + c, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, c) => sum + c, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.3) {
      const lastWindow = recentWindows[recentWindows.length - 1];
      if (lastWindow.metrics.patterns.every((p) => p.type !== 'trend')) {
        lastWindow.metrics.patterns.push({
          type: 'trend',
          confidence: 75,
          description: `Upward trend detected: ${((secondAvg / firstAvg - 1) * 100).toFixed(0)}% increase`,
          startTime: recentWindows[0].startTime,
          endTime: lastWindow.endTime,
          significance: 'medium',
        });
      }
    } else if (secondAvg < firstAvg * 0.7) {
      const lastWindow = recentWindows[recentWindows.length - 1];
      if (lastWindow.metrics.patterns.every((p) => p.type !== 'trend')) {
        lastWindow.metrics.patterns.push({
          type: 'trend',
          confidence: 75,
          description: `Downward trend detected: ${((1 - secondAvg / firstAvg) * 100).toFixed(0)}% decrease`,
          startTime: recentWindows[0].startTime,
          endTime: lastWindow.endTime,
          significance: 'medium',
        });
      }
    }
  }
}

function generateAlert(anomaly: Anomaly): Alert {
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let priority: Alert['priority'];
  if (anomaly.severity === 'critical') {
    priority = 'critical';
  } else if (anomaly.severity === 'high') {
    priority = 'high';
  } else if (anomaly.severity === 'medium') {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  const title = `${anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)} Anomaly: ${anomaly.event.eventType}`;

  const affectedEntities: string[] = [anomaly.event.propertyId];
  if (anomaly.event.roomId) affectedEntities.push(anomaly.event.roomId);
  if (anomaly.event.guestId) affectedEntities.push(anomaly.event.guestId);

  const recommendations: string[] = [];
  if (anomaly.suggestedAction) {
    recommendations.push(anomaly.suggestedAction);
  }
  recommendations.push('Monitor pattern over next hour');
  recommendations.push('Review historical data for similar anomalies');

  return {
    alertId,
    timestamp: anomaly.detectedAt,
    priority,
    category: 'anomaly',
    title,
    description: anomaly.description,
    affectedEntities,
    metrics: {
      anomalyScore: anomaly.score,
      baseline: anomaly.baseline,
      deviation: anomaly.deviation,
    },
    recommendations,
    acknowledged: false,
  };
}
