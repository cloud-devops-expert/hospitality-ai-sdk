/**
 * Real-Time Streaming ML Processor
 *
 * Event-driven ML updates, real-time anomaly detection,
 * and live dashboard data feeds for hospitality operations.
 *
 * Zero-cost local processing with incremental learning.
 */

// ============================================================================
// Types
// ============================================================================

export interface StreamEvent {
  eventId: string;
  eventType: 'booking' | 'checkin' | 'checkout' | 'review' | 'maintenance' | 'service_request' | 'revenue' | 'occupancy';
  timestamp: Date;
  data: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface StreamProcessor {
  processEvent(event: StreamEvent): Promise<ProcessedEvent>;
  getMetrics(): StreamMetrics;
  reset(): void;
}

export interface ProcessedEvent {
  eventId: string;
  processedAt: Date;
  anomalies: Anomaly[];
  predictions: Prediction[];
  alerts: Alert[];
  metrics: EventMetrics;
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  affectedMetric: string;
  threshold: number;
  actualValue: number;
}

export interface Prediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeHorizon: number; // minutes
  method: string;
}

export interface Alert {
  alertId: string;
  type: 'anomaly' | 'threshold' | 'trend' | 'pattern';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  action: string;
  timestamp: Date;
}

export interface EventMetrics {
  processingTime: number;
  eventCount: number;
  anomalyRate: number;
  alertRate: number;
}

export interface StreamMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageProcessingTime: number;
  anomalyCount: number;
  alertCount: number;
  uptimeSeconds: number;
  lastEventTime: Date | null;
  eventTypeDistribution: Map<string, number>;
}

export interface IncrementalModel {
  update(data: number[], target?: number): void;
  predict(data: number[]): number;
  getMetrics(): ModelMetrics;
}

export interface ModelMetrics {
  sampleCount: number;
  mean: number;
  variance: number;
  lastUpdate: Date;
  accuracy?: number;
}

export interface DashboardFeed {
  subscribe(callback: (event: ProcessedEvent) => void): string;
  unsubscribe(subscriptionId: string): void;
  getRecentEvents(limit: number): ProcessedEvent[];
  getLiveMetrics(): StreamMetrics;
}

// ============================================================================
// Incremental Learning Model
// ============================================================================

export class IncrementalStatsModel implements IncrementalModel {
  private n = 0;
  private mean = 0;
  private m2 = 0;
  private lastUpdate: Date | null = null;

  update(data: number[]): void {
    data.forEach(value => {
      this.n++;
      const delta = value - this.mean;
      this.mean += delta / this.n;
      const delta2 = value - this.mean;
      this.m2 += delta * delta2;
    });
    this.lastUpdate = new Date();
  }

  predict(data: number[]): number {
    if (this.n === 0) return data[data.length - 1] || 0;
    
    // Simple exponential smoothing
    const alpha = 0.3;
    const lastValue = data[data.length - 1] || this.mean;
    return alpha * lastValue + (1 - alpha) * this.mean;
  }

  getMetrics(): ModelMetrics {
    const variance = this.n > 1 ? this.m2 / (this.n - 1) : 0;
    return {
      sampleCount: this.n,
      mean: this.mean,
      variance,
      lastUpdate: this.lastUpdate || new Date(),
    };
  }

  reset(): void {
    this.n = 0;
    this.mean = 0;
    this.m2 = 0;
    this.lastUpdate = null;
  }
}

// ============================================================================
// Real-Time Anomaly Detection
// ============================================================================

export class RealTimeAnomalyDetector {
  private readonly windowSize: number;
  private readonly zScoreThreshold: number;
  private dataWindow: number[] = [];
  
  constructor(windowSize = 100, zScoreThreshold = 3) {
    this.windowSize = windowSize;
    this.zScoreThreshold = zScoreThreshold;
  }

  detectAnomaly(value: number, metric: string): Anomaly | null {
    this.dataWindow.push(value);
    if (this.dataWindow.length > this.windowSize) {
      this.dataWindow.shift();
    }

    if (this.dataWindow.length < 10) {
      return null; // Not enough data
    }

    const mean = this.dataWindow.reduce((sum, v) => sum + v, 0) / this.dataWindow.length;
    const variance = this.dataWindow.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / this.dataWindow.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return null;

    const zScore = Math.abs((value - mean) / stdDev);
    
    if (zScore > this.zScoreThreshold) {
      let severity: Anomaly['severity'];
      if (zScore > this.zScoreThreshold * 2) {
        severity = 'critical';
      } else if (zScore > this.zScoreThreshold * 1.5) {
        severity = 'high';
      } else if (zScore > this.zScoreThreshold * 1.2) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      return {
        type: 'statistical',
        severity,
        score: zScore,
        description: `${metric} value ${value.toFixed(2)} deviates significantly from mean ${mean.toFixed(2)}`,
        affectedMetric: metric,
        threshold: mean + this.zScoreThreshold * stdDev,
        actualValue: value,
      };
    }

    return null;
  }

  reset(): void {
    this.dataWindow = [];
  }
}

// ============================================================================
// Stream Processor Implementation
// ============================================================================

export class LiveStreamProcessor implements StreamProcessor {
  private eventCount = 0;
  private anomalyCount = 0;
  private alertCount = 0;
  private totalProcessingTime = 0;
  private startTime = Date.now();
  private lastEventTime: Date | null = null;
  private eventTypeDistribution = new Map<string, number>();
  
  private anomalyDetectors = new Map<string, RealTimeAnomalyDetector>();
  private incrementalModels = new Map<string, IncrementalStatsModel>();

  async processEvent(event: StreamEvent): Promise<ProcessedEvent> {
    const startProcessing = Date.now();
    
    this.eventCount++;
    this.lastEventTime = event.timestamp;
    this.eventTypeDistribution.set(
      event.eventType,
      (this.eventTypeDistribution.get(event.eventType) || 0) + 1
    );

    // Extract numeric metrics from event data
    const metrics = this.extractMetrics(event);
    
    // Detect anomalies
    const anomalies: Anomaly[] = [];
    for (const [metricName, value] of Object.entries(metrics)) {
      if (!this.anomalyDetectors.has(metricName)) {
        this.anomalyDetectors.set(metricName, new RealTimeAnomalyDetector());
      }
      const detector = this.anomalyDetectors.get(metricName)!;
      const anomaly = detector.detectAnomaly(value, metricName);
      if (anomaly) {
        anomalies.push(anomaly);
        this.anomalyCount++;
      }
    }

    // Update incremental models and generate predictions
    const predictions: Prediction[] = [];
    for (const [metricName, value] of Object.entries(metrics)) {
      if (!this.incrementalModels.has(metricName)) {
        this.incrementalModels.set(metricName, new IncrementalStatsModel());
      }
      const model = this.incrementalModels.get(metricName)!;
      model.update([value]);
      
      const predicted = model.predict([value]);
      predictions.push({
        metric: metricName,
        predictedValue: predicted,
        confidence: this.calculateConfidence(model.getMetrics()),
        timeHorizon: 15,
        method: 'exponential_smoothing',
      });
    }

    // Generate alerts
    const alerts = this.generateAlerts(event, anomalies);
    this.alertCount += alerts.length;

    const processingTime = Date.now() - startProcessing;
    this.totalProcessingTime += processingTime;

    const eventMetrics: EventMetrics = {
      processingTime,
      eventCount: this.eventCount,
      anomalyRate: (this.anomalyCount / this.eventCount) * 100,
      alertRate: (this.alertCount / this.eventCount) * 100,
    };

    return {
      eventId: event.eventId,
      processedAt: new Date(),
      anomalies,
      predictions,
      alerts,
      metrics: eventMetrics,
    };
  }

  getMetrics(): StreamMetrics {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    const eventsPerSecond = this.eventCount / uptimeSeconds;

    return {
      totalEvents: this.eventCount,
      eventsPerSecond: Math.round(eventsPerSecond * 100) / 100,
      averageProcessingTime: this.eventCount > 0 ? this.totalProcessingTime / this.eventCount : 0,
      anomalyCount: this.anomalyCount,
      alertCount: this.alertCount,
      uptimeSeconds: Math.round(uptimeSeconds),
      lastEventTime: this.lastEventTime,
      eventTypeDistribution: this.eventTypeDistribution,
    };
  }

  reset(): void {
    this.eventCount = 0;
    this.anomalyCount = 0;
    this.alertCount = 0;
    this.totalProcessingTime = 0;
    this.startTime = Date.now();
    this.lastEventTime = null;
    this.eventTypeDistribution.clear();
    this.anomalyDetectors.clear();
    this.incrementalModels.clear();
  }

  private extractMetrics(event: StreamEvent): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(event.data)) {
      if (typeof value === 'number') {
        metrics[key] = value;
      }
    }

    return metrics;
  }

  private calculateConfidence(modelMetrics: ModelMetrics): number {
    if (modelMetrics.sampleCount < 10) return 0.3;
    if (modelMetrics.sampleCount < 50) return 0.6;
    if (modelMetrics.sampleCount < 100) return 0.8;
    return 0.9;
  }

  private generateAlerts(event: StreamEvent, anomalies: Anomaly[]): Alert[] {
    const alerts: Alert[] = [];

    // Critical event alerts
    if (event.priority === 'critical') {
      alerts.push({
        alertId: `alert-${event.eventId}`,
        type: 'threshold',
        severity: 'critical',
        message: `Critical ${event.eventType} event detected`,
        action: 'Immediate review required',
        timestamp: new Date(),
      });
    }

    // Anomaly alerts
    anomalies.forEach((anomaly, index) => {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        alerts.push({
          alertId: `alert-${event.eventId}-${index}`,
          type: 'anomaly',
          severity: anomaly.severity === 'critical' ? 'critical' : 'warning',
          message: anomaly.description,
          action: `Investigate ${anomaly.affectedMetric}`,
          timestamp: new Date(),
        });
      }
    });

    return alerts;
  }
}

// ============================================================================
// Dashboard Feed Implementation
// ============================================================================

export class LiveDashboardFeed implements DashboardFeed {
  private subscribers = new Map<string, (event: ProcessedEvent) => void>();
  private recentEvents: ProcessedEvent[] = [];
  private processor: StreamProcessor;
  private maxRecentEvents = 100;

  constructor(processor: StreamProcessor) {
    this.processor = processor;
  }

  subscribe(callback: (event: ProcessedEvent) => void): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.subscribers.set(subscriptionId, callback);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }

  async publishEvent(event: StreamEvent): Promise<void> {
    const processedEvent = await this.processor.processEvent(event);
    
    // Store in recent events
    this.recentEvents.unshift(processedEvent);
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents.pop();
    }

    // Notify all subscribers
    for (const callback of this.subscribers.values()) {
      try {
        callback(processedEvent);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    }
  }

  getRecentEvents(limit: number = 10): ProcessedEvent[] {
    return this.recentEvents.slice(0, limit);
  }

  getLiveMetrics(): StreamMetrics {
    return this.processor.getMetrics();
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}

// ============================================================================
// Batch Event Processing
// ============================================================================

export async function processEventBatch(
  events: StreamEvent[],
  processor: StreamProcessor
): Promise<ProcessedEvent[]> {
  const results: ProcessedEvent[] = [];
  
  for (const event of events) {
    const processed = await processor.processEvent(event);
    results.push(processed);
  }

  return results;
}

// ============================================================================
// Trend Detection
// ============================================================================

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  confidence: number;
  recentEvents: number;
}

export function detectTrend(events: ProcessedEvent[], metric: string): TrendAnalysis {
  if (events.length < 5) {
    return {
      trend: 'stable',
      strength: 0,
      confidence: 0,
      recentEvents: events.length,
    };
  }

  const values: number[] = [];
  events.forEach(event => {
    const pred = event.predictions.find(p => p.metric === metric);
    if (pred) {
      values.push(pred.predictedValue);
    }
  });

  if (values.length < 5) {
    return {
      trend: 'stable',
      strength: 0,
      confidence: 0,
      recentEvents: values.length,
    };
  }

  // Calculate linear regression slope
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, v) => sum + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  const slope = numerator / denominator;
  const avgValue = Math.abs(yMean);
  const normalizedSlope = avgValue > 0 ? (slope / avgValue) * 100 : 0;

  let trend: TrendAnalysis['trend'];
  if (Math.abs(normalizedSlope) < 1) {
    trend = 'stable';
  } else if (normalizedSlope > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  const strength = Math.min(100, Math.abs(normalizedSlope) * 10);
  const confidence = Math.min(0.95, n / 100);

  return {
    trend,
    strength: Math.round(strength),
    confidence: Math.round(confidence * 100) / 100,
    recentEvents: n,
  };
}
