/**
 * Tenant Metrics Collector
 *
 * Cost-effective, batched metrics collection for billing and quota tracking.
 *
 * Features:
 * - Batched inserts (100 events or 5 seconds)
 * - Non-blocking async collection
 * - Automatic retry on failure
 * - Memory-efficient queue management
 *
 * Cost: ~$1.00 per 1M metric events
 */

import { getRawDataApiClient } from '@/lib/database/instrumented-rds-client';
import { sql } from 'drizzle-orm';

export interface MetricEvent {
  tenantId: string;
  userId?: string;
  eventType: 'api_request' | 'db_query' | 'storage_write' | 'ai_request';
  endpoint?: string;
  method?: string;
  durationMs: number;
  dbQueryCount?: number;
  responseStatus?: number;
  bytesSent?: number;
  bytesReceived?: number;
}

export interface MetricsConfig {
  batchSize?: number; // Default: 100
  flushIntervalMs?: number; // Default: 5000 (5s)
  maxQueueSize?: number; // Default: 10000
  enableDebugLogging?: boolean;
}

export class TenantMetricsCollector {
  private metricsQueue: MetricEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushing: boolean = false;
  private droppedEvents: number = 0;

  private readonly config: Required<MetricsConfig>;

  constructor(config: MetricsConfig = {}) {
    this.config = {
      batchSize: config.batchSize ?? 100,
      flushIntervalMs: config.flushIntervalMs ?? 5000,
      maxQueueSize: config.maxQueueSize ?? 10000,
      enableDebugLogging: config.enableDebugLogging ?? false,
    };

    this.startFlushInterval();

    // Graceful shutdown
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.destroy());
      process.on('SIGTERM', () => this.destroy());
      process.on('SIGINT', () => this.destroy());
    }
  }

  /**
   * Record a metric event (non-blocking)
   */
  async record(event: MetricEvent): Promise<void> {
    // Check queue size limit
    if (this.metricsQueue.length >= this.config.maxQueueSize) {
      this.droppedEvents++;
      if (this.config.enableDebugLogging) {
        console.warn(`[Metrics] Queue full, dropped event for tenant ${event.tenantId}`);
      }
      return;
    }

    this.metricsQueue.push(event);

    // Flush if batch size reached
    if (this.metricsQueue.length >= this.config.batchSize) {
      // Don't await - fire and forget
      this.flush().catch((err) => {
        console.error('[Metrics] Background flush failed:', err);
      });
    }
  }

  /**
   * Record multiple events at once
   */
  async recordBatch(events: MetricEvent[]): Promise<void> {
    for (const event of events) {
      await this.record(event);
    }
  }

  /**
   * Flush queued metrics to database
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.metricsQueue.length === 0) {
      return;
    }

    this.isFlushing = true;

    const batch = this.metricsQueue.splice(0, this.config.batchSize);

    try {
      const db = getRawDataApiClient();

      // Build values for batch insert
      const values = batch.map((event) => ({
        tenant_id: event.tenantId,
        user_id: event.userId || null,
        event_type: event.eventType,
        endpoint: event.endpoint || null,
        method: event.method || null,
        duration_ms: event.durationMs,
        db_query_count: event.dbQueryCount || 0,
        response_status: event.responseStatus || null,
        bytes_sent: event.bytesSent || 0,
        bytes_received: event.bytesReceived || 0,
        event_time: new Date(),
      }));

      // Bulk insert using unnest
      await db.execute(sql`
        INSERT INTO tenant_metrics_raw (
          tenant_id,
          user_id,
          event_type,
          endpoint,
          method,
          duration_ms,
          db_query_count,
          response_status,
          bytes_sent,
          bytes_received,
          event_time
        )
        SELECT * FROM jsonb_to_recordset(${JSON.stringify(values)}::jsonb) AS x(
          tenant_id TEXT,
          user_id TEXT,
          event_type TEXT,
          endpoint TEXT,
          method TEXT,
          duration_ms INTEGER,
          db_query_count INTEGER,
          response_status INTEGER,
          bytes_sent INTEGER,
          bytes_received INTEGER,
          event_time TIMESTAMPTZ
        )
      `);

      if (this.config.enableDebugLogging) {
        console.log(`[Metrics] Flushed ${batch.length} events`);
      }
    } catch (error) {
      console.error('[Metrics] Failed to flush batch:', error);

      // Re-queue failed events (up to max queue size)
      if (this.metricsQueue.length + batch.length <= this.config.maxQueueSize) {
        this.metricsQueue.unshift(...batch);
      } else {
        this.droppedEvents += batch.length;
        console.error(`[Metrics] Dropped ${batch.length} events due to queue overflow`);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Start periodic flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[Metrics] Scheduled flush failed:', err);
      });
    }, this.config.flushIntervalMs);
  }

  /**
   * Get current queue statistics
   */
  getStats(): {
    queueSize: number;
    droppedEvents: number;
    isFlushing: boolean;
  } {
    return {
      queueSize: this.metricsQueue.length,
      droppedEvents: this.droppedEvents,
      isFlushing: this.isFlushing,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.droppedEvents = 0;
  }

  /**
   * Cleanup on shutdown
   */
  async destroy(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    await this.flush();

    if (this.config.enableDebugLogging) {
      console.log('[Metrics] Collector destroyed');
    }
  }
}

// Singleton instance
let metricsCollectorInstance: TenantMetricsCollector | null = null;

/**
 * Get or create metrics collector singleton
 */
export function getMetricsCollector(config?: MetricsConfig): TenantMetricsCollector {
  if (!metricsCollectorInstance) {
    metricsCollectorInstance = new TenantMetricsCollector(config);
  }
  return metricsCollectorInstance;
}

/**
 * Helper function to track API request
 */
export async function trackApiRequest(
  tenantId: string,
  userId: string | undefined,
  endpoint: string,
  method: string,
  durationMs: number,
  status: number
): Promise<void> {
  const collector = getMetricsCollector();
  await collector.record({
    tenantId,
    userId,
    eventType: 'api_request',
    endpoint,
    method,
    durationMs,
    responseStatus: status,
  });
}

/**
 * Helper function to track database query
 */
export async function trackDatabaseQuery(
  tenantId: string,
  queryCount: number,
  durationMs: number
): Promise<void> {
  const collector = getMetricsCollector();
  await collector.record({
    tenantId,
    eventType: 'db_query',
    durationMs,
    dbQueryCount: queryCount,
  });
}

/**
 * Helper function to track AI request
 */
export async function trackAiRequest(
  tenantId: string,
  userId: string | undefined,
  durationMs: number,
  modelName?: string
): Promise<void> {
  const collector = getMetricsCollector();
  await collector.record({
    tenantId,
    userId,
    eventType: 'ai_request',
    endpoint: modelName,
    durationMs,
  });
}
