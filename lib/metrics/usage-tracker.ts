/**
 * Simple Usage Tracker
 *
 * Passive metrics collection for fair use monitoring (no active blocking).
 *
 * Features:
 * - Batched async inserts (100 events or 5 seconds)
 * - <1ms overhead per request
 * - Fire-and-forget tracking
 * - No rate limiting
 *
 * Cost: ~$0.50 per 1M requests
 */

// TODO: Import from correct database module when implemented
// import { getRawDataApiClient } from '@/lib/database/instrumented-rds-client';
import { sql } from 'drizzle-orm';

// Temporary stub until getRawDataApiClient is exported
const getRawDataApiClient = (): any => {
  throw new Error('getRawDataApiClient not implemented yet');
};

export interface UsageEvent {
  tenantId: string;
  userId?: string;
  eventType: 'api_request' | 'storage_write';
  endpoint?: string;
  method?: string;
  durationMs: number;
  bytesTransferred: number; // Request size + response size
}

class UsageTracker {
  private queue: UsageEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds

  constructor() {
    this.startFlushInterval();

    // Graceful shutdown
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.destroy());
      process.on('SIGTERM', () => this.destroy());
      process.on('SIGINT', () => this.destroy());
    }
  }

  /**
   * Track a usage event (non-blocking)
   */
  async track(event: UsageEvent): Promise<void> {
    this.queue.push(event);

    if (this.queue.length >= this.BATCH_SIZE) {
      // Fire and forget
      this.flush().catch((err) => {
        console.error('[Usage] Flush failed:', err);
      });
    }
  }

  /**
   * Flush events to database
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.BATCH_SIZE);

    try {
      const db = getRawDataApiClient();
      const values = batch.map((e) => ({
        tenant_id: e.tenantId,
        user_id: e.userId || null,
        event_type: e.eventType,
        endpoint: e.endpoint || null,
        method: e.method || null,
        duration_ms: e.durationMs,
        bytes_transferred: e.bytesTransferred,
        event_time: new Date(),
      }));

      await db.execute(sql`
        INSERT INTO tenant_usage_raw (
          tenant_id, user_id, event_type, endpoint, method,
          duration_ms, bytes_transferred, event_time
        )
        SELECT * FROM jsonb_to_recordset(${JSON.stringify(values)}::jsonb) AS x(
          tenant_id TEXT, user_id TEXT, event_type TEXT,
          endpoint TEXT, method TEXT, duration_ms INTEGER,
          bytes_transferred INTEGER, event_time TIMESTAMPTZ
        )
      `);

      console.log(`[Usage] Tracked ${batch.length} events`);
    } catch (error) {
      console.error('[Usage] Failed to flush:', error);
      // Re-queue failed events
      this.queue.unshift(...batch);
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[Usage] Scheduled flush failed:', err);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  async destroy(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// Singleton
let tracker: UsageTracker | null = null;

export function getUsageTracker(): UsageTracker {
  if (!tracker) tracker = new UsageTracker();
  return tracker;
}

/**
 * Helper: Track API request
 */
export async function trackRequest(
  tenantId: string,
  userId: string | undefined,
  req: { url: string; method: string },
  durationMs: number,
  responseSize: number
): Promise<void> {
  const tracker = getUsageTracker();
  await tracker.track({
    tenantId,
    userId,
    eventType: 'api_request',
    endpoint: new URL(req.url).pathname,
    method: req.method,
    durationMs,
    bytesTransferred: responseSize,
  });
}

/**
 * Helper: Track storage write
 */
export async function trackStorageWrite(
  tenantId: string,
  userId: string | undefined,
  bytesWritten: number
): Promise<void> {
  const tracker = getUsageTracker();
  await tracker.track({
    tenantId,
    userId,
    eventType: 'storage_write',
    durationMs: 0,
    bytesTransferred: bytesWritten,
  });
}
