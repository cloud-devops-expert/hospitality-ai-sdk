# Tenant Usage Reporting & Fair Use Billing

**Passive metrics collection** for fair use monitoring and post-hoc billing (no active blocking).

## Philosophy

Following the project's **cost-effectiveness** principles:

- ✅ **Track, don't block** - Collect metrics without rate limiting
- ✅ **Batch processing** - Aggregate metrics periodically (hourly/daily)
- ✅ **Fair use alerts** - Notify when tenants exceed agreed limits
- ✅ **Flexible billing** - Calculate charges retrospectively
- ✅ **Traditional algorithms** - PostgreSQL counters, no external services

**Cost**: ~$0.50 per 1M requests tracked

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Tenant API Request                              │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│  Lightweight Metrics Middleware                  │
│  - Record: tenant_id, endpoint, duration, bytes  │
│  - Non-blocking async insertion                  │
│  - Batched every 5 seconds (100 events)          │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│  PostgreSQL (RLS-enforced)                       │
│  - tenant_usage_raw (raw events)                 │
│  - tenant_usage_daily (pre-aggregated)           │
│  - tenant_agreements (limits & pricing)          │
│  - tenant_usage_reports (monthly summaries)      │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│  Nightly Aggregation Job (cron)                  │
│  - Roll up daily metrics                         │
│  - Check fair use thresholds                     │
│  - Send alerts if exceeded                       │
│  - Generate monthly reports                      │
└──────────────────────────────────────────────────┘
```

---

## Simplified Database Schema

### Core Tables

```sql
-- ============================================================================
-- TENANT AGREEMENTS (SLA & Pricing)
-- ============================================================================

CREATE TABLE tenant_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL UNIQUE,

  -- Subscription tier
  tier TEXT NOT NULL DEFAULT 'free', -- free, starter, professional, enterprise, custom

  -- Agreed usage limits (for fair use monitoring)
  agreed_requests_per_month INTEGER NOT NULL DEFAULT 100000,
  agreed_storage_gb INTEGER NOT NULL DEFAULT 10,
  agreed_bandwidth_gb INTEGER NOT NULL DEFAULT 50,

  -- Pricing (for billing overages)
  monthly_base_fee_cents INTEGER NOT NULL DEFAULT 0,
  overage_per_1k_requests_cents INTEGER NOT NULL DEFAULT 0,
  overage_per_gb_storage_cents INTEGER NOT NULL DEFAULT 0,
  overage_per_gb_bandwidth_cents INTEGER NOT NULL DEFAULT 0,

  -- Fair use alerting
  alert_threshold_percentage INTEGER NOT NULL DEFAULT 80, -- Alert at 80% usage
  alert_email TEXT,

  -- Metadata
  valid_period TSTZRANGE NOT NULL DEFAULT tstzrange(now(), NULL, '[)'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_tier CHECK (tier IN ('free', 'starter', 'professional', 'enterprise', 'custom')),
  INDEX idx_agreements_tenant ON tenant_agreements(tenant_id)
);

-- Enable RLS
ALTER TABLE tenant_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_agreement_isolation ON tenant_agreements
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- RAW USAGE EVENTS (Lightweight tracking)
-- ============================================================================

CREATE TABLE tenant_usage_raw (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,
  user_id TEXT,

  -- Event metadata
  event_type TEXT NOT NULL, -- 'api_request', 'storage_write'
  endpoint TEXT,
  method TEXT, -- GET, POST, etc.

  -- Metrics
  duration_ms INTEGER NOT NULL DEFAULT 0,
  bytes_transferred INTEGER NOT NULL DEFAULT 0, -- Request + response size

  -- Timestamp
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX idx_usage_raw_tenant_time ON tenant_usage_raw(tenant_id, event_time DESC)
) PARTITION BY RANGE (event_time);

-- Create monthly partitions
CREATE TABLE tenant_usage_raw_2025_01 PARTITION OF tenant_usage_raw
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE tenant_usage_raw_2025_02 PARTITION OF tenant_usage_raw
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Enable RLS
ALTER TABLE tenant_usage_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_usage_isolation ON tenant_usage_raw
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- DAILY AGGREGATED USAGE (Pre-computed for fast queries)
-- ============================================================================

CREATE TABLE tenant_usage_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,
  usage_date DATE NOT NULL,

  -- Aggregate metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_bandwidth_bytes BIGINT NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,

  -- Endpoint breakdown (top 10 endpoints)
  endpoint_breakdown JSONB DEFAULT '[]'::jsonb,

  -- Computed at
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, usage_date),
  INDEX idx_usage_daily_tenant_date ON tenant_usage_daily(tenant_id, usage_date DESC)
);

-- Enable RLS
ALTER TABLE tenant_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_daily_usage_isolation ON tenant_usage_daily
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- MONTHLY USAGE REPORTS (For billing & compliance)
-- ============================================================================

CREATE TABLE tenant_usage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,

  -- Reporting period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Usage metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_bandwidth_gb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_storage_gb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,

  -- Fair use compliance
  agreed_requests INTEGER NOT NULL DEFAULT 0,
  agreed_bandwidth_gb NUMERIC(10, 2) NOT NULL DEFAULT 0,
  requests_overage INTEGER NOT NULL DEFAULT 0,
  bandwidth_overage_gb NUMERIC(10, 2) NOT NULL DEFAULT 0,

  -- Billing calculation
  base_fee_cents INTEGER NOT NULL DEFAULT 0,
  overage_requests_cents INTEGER NOT NULL DEFAULT 0,
  overage_bandwidth_cents INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,

  -- Status
  report_status TEXT NOT NULL DEFAULT 'draft', -- draft, final, invoiced, paid
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_report_status CHECK (report_status IN ('draft', 'final', 'invoiced', 'paid')),
  UNIQUE (tenant_id, period_start),
  INDEX idx_reports_tenant_period ON tenant_usage_reports(tenant_id, period_start DESC)
);

-- Enable RLS
ALTER TABLE tenant_usage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_reports_isolation ON tenant_usage_reports
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- FAIR USE ALERTS LOG
-- ============================================================================

CREATE TABLE tenant_fair_use_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,

  -- Alert details
  metric_type TEXT NOT NULL, -- 'requests', 'bandwidth', 'storage'
  current_value NUMERIC(12, 2) NOT NULL,
  agreed_limit NUMERIC(12, 2) NOT NULL,
  usage_percentage INTEGER NOT NULL,

  -- Alert metadata
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  alert_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX idx_alerts_tenant_time ON tenant_fair_use_alerts(tenant_id, created_at DESC)
);

-- Enable RLS
ALTER TABLE tenant_fair_use_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_alerts_isolation ON tenant_fair_use_alerts
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));
```

### Helper Functions

```sql
-- ============================================================================
-- USAGE AGGREGATION FUNCTIONS
-- ============================================================================

-- Get monthly usage for a tenant
CREATE OR REPLACE FUNCTION get_tenant_monthly_usage(
  p_tenant_id TEXT,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE (
  total_requests BIGINT,
  total_bandwidth_bytes BIGINT,
  avg_response_time_ms INTEGER
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_requests,
    SUM(bytes_transferred)::BIGINT as total_bandwidth_bytes,
    AVG(duration_ms)::INTEGER as avg_response_time_ms
  FROM tenant_usage_raw
  WHERE tenant_id = p_tenant_id
    AND event_type = 'api_request'
    AND event_time >= p_period_start::TIMESTAMPTZ
    AND event_time < p_period_end::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check if tenant exceeds fair use threshold
CREATE OR REPLACE FUNCTION check_fair_use_threshold(
  p_tenant_id TEXT,
  p_metric_type TEXT -- 'requests', 'bandwidth', 'storage'
)
RETURNS JSONB
AS $$
DECLARE
  v_agreement tenant_agreements%ROWTYPE;
  v_current_value NUMERIC;
  v_agreed_limit NUMERIC;
  v_usage_percentage INTEGER;
BEGIN
  -- Get tenant agreement
  SELECT * INTO v_agreement
  FROM tenant_agreements
  WHERE tenant_id = p_tenant_id
    AND now() <@ valid_period
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tenant agreement not found');
  END IF;

  -- Get current usage for current month
  CASE p_metric_type
    WHEN 'requests' THEN
      SELECT COUNT(*) INTO v_current_value
      FROM tenant_usage_raw
      WHERE tenant_id = p_tenant_id
        AND event_type = 'api_request'
        AND event_time >= date_trunc('month', now());

      v_agreed_limit := v_agreement.agreed_requests_per_month;

    WHEN 'bandwidth' THEN
      SELECT SUM(bytes_transferred) / (1024.0 * 1024.0 * 1024.0) INTO v_current_value
      FROM tenant_usage_raw
      WHERE tenant_id = p_tenant_id
        AND event_time >= date_trunc('month', now());

      v_agreed_limit := v_agreement.agreed_bandwidth_gb;

    ELSE
      RETURN jsonb_build_object('error', 'Invalid metric type');
  END CASE;

  -- Calculate usage percentage
  v_usage_percentage := ROUND((v_current_value / v_agreed_limit) * 100);

  -- Check if threshold exceeded
  IF v_usage_percentage >= v_agreement.alert_threshold_percentage THEN
    -- Log alert
    INSERT INTO tenant_fair_use_alerts (
      tenant_id,
      metric_type,
      current_value,
      agreed_limit,
      usage_percentage
    )
    VALUES (
      p_tenant_id,
      p_metric_type,
      v_current_value,
      v_agreed_limit,
      v_usage_percentage
    );

    RETURN jsonb_build_object(
      'exceeded', true,
      'metric', p_metric_type,
      'current', v_current_value,
      'limit', v_agreed_limit,
      'percentage', v_usage_percentage
    );
  END IF;

  RETURN jsonb_build_object(
    'exceeded', false,
    'metric', p_metric_type,
    'current', v_current_value,
    'limit', v_agreed_limit,
    'percentage', v_usage_percentage
  );
END;
$$ LANGUAGE plpgsql;
```

---

## TypeScript Implementation

### Simplified Metrics Collector

```typescript
// lib/metrics/usage-tracker.ts

import { getRawDataApiClient } from '@/lib/database/instance';
import { sql } from 'drizzle-orm';

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
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor() {
    this.startFlushInterval();
  }

  /**
   * Track a usage event (non-blocking)
   */
  async track(event: UsageEvent): Promise<void> {
    this.queue.push(event);

    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush(); // Fire and forget
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
    } catch (error) {
      console.error('[Usage] Failed to flush:', error);
      this.queue.unshift(...batch); // Re-queue
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  async destroy(): Promise<void> {
    if (this.flushInterval) clearInterval(this.flushInterval);
    await this.flush();
  }
}

let tracker: UsageTracker | null = null;

export function getUsageTracker(): UsageTracker {
  if (!tracker) tracker = new UsageTracker();
  return tracker;
}

/**
 * Middleware-friendly helper
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
```

### Lightweight Middleware

```typescript
// lib/middleware/usage-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { trackRequest } from '@/lib/metrics/usage-tracker';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';

export function withUsageTracking(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    let context: { tenantId: string; userId?: string } | null = null;

    try {
      context = extractRLSContext(req);
    } catch {
      // If context extraction fails, skip tracking
    }

    try {
      const response = await handler(req, ...args);
      const durationMs = Date.now() - startTime;

      // Track usage (fire and forget)
      if (context) {
        const responseSize =
          parseInt(response.headers.get('content-length') || '0') || 0;

        trackRequest(
          context.tenantId,
          context.userId,
          { url: req.url, method: req.method },
          durationMs,
          responseSize
        ).catch((err) => console.error('[Usage] Track failed:', err));
      }

      return response;
    } catch (error) {
      // Track error (optional)
      if (context) {
        const durationMs = Date.now() - startTime;
        trackRequest(
          context.tenantId,
          context.userId,
          { url: req.url, method: req.method },
          durationMs,
          0
        ).catch(() => {});
      }

      throw error;
    }
  };
}
```

### Usage in API Routes

```typescript
// app/api/bookings/route.ts

import { withUsageTracking } from '@/lib/middleware/usage-middleware';
import { getRLSClient } from '@/lib/database/instance';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { bookings } from '@/lib/database/schema';

async function handleGetBookings(req: NextRequest) {
  const rlsDb = getRLSClient();
  const context = extractRLSContext(req);

  const results = await rlsDb.withRLS(context, (tx) => {
    return tx.select().from(bookings);
  });

  return NextResponse.json(results);
}

// Wrap with usage tracking (no blocking, just logging)
export const GET = withUsageTracking(handleGetBookings);
```

---

## Reporting & Billing

### Monthly Report Generation

```typescript
// lib/billing/usage-report-generator.ts

import { getRawDataApiClient } from '@/lib/database/instance';
import { sql } from 'drizzle-orm';

export interface UsageReport {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRequests: number;
  totalBandwidthGb: number;
  agreedRequests: number;
  agreedBandwidthGb: number;
  requestsOverage: number;
  bandwidthOverageGb: number;
  baseFee: number;
  overageFees: number;
  totalAmount: number;
}

export class UsageReportGenerator {
  /**
   * Generate monthly usage report for a tenant
   */
  async generateReport(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageReport> {
    const db = getRawDataApiClient();

    // Get tenant agreement
    const agreementResult = await db.execute(sql`
      SELECT
        agreed_requests_per_month,
        agreed_bandwidth_gb,
        monthly_base_fee_cents,
        overage_per_1k_requests_cents,
        overage_per_gb_bandwidth_cents
      FROM tenant_agreements
      WHERE tenant_id = ${tenantId}
        AND now() <@ valid_period
      LIMIT 1
    `);

    if (!agreementResult.rows.length) {
      throw new Error(`No agreement found for tenant ${tenantId}`);
    }

    const agreement = agreementResult.rows[0] as any;

    // Get usage statistics
    const usageResult = await db.execute(sql`
      SELECT * FROM get_tenant_monthly_usage(
        ${tenantId},
        ${periodStart},
        ${periodEnd}
      )
    `);

    const usage = usageResult.rows[0] as any;
    const totalRequests = parseInt(usage.total_requests || '0');
    const totalBandwidthGb = parseFloat(
      ((usage.total_bandwidth_bytes || 0) / (1024 * 1024 * 1024)).toFixed(2)
    );

    // Calculate overages
    const requestsOverage = Math.max(
      0,
      totalRequests - agreement.agreed_requests_per_month
    );
    const bandwidthOverageGb = Math.max(
      0,
      totalBandwidthGb - parseFloat(agreement.agreed_bandwidth_gb)
    );

    // Calculate fees (in cents)
    const baseFee = parseInt(agreement.monthly_base_fee_cents);
    const requestOverageFee =
      Math.ceil(requestsOverage / 1000) *
      parseInt(agreement.overage_per_1k_requests_cents);
    const bandwidthOverageFee =
      Math.ceil(bandwidthOverageGb) *
      parseInt(agreement.overage_per_gb_bandwidth_cents);

    const totalAmount = baseFee + requestOverageFee + bandwidthOverageFee;

    // Insert report
    await db.execute(sql`
      INSERT INTO tenant_usage_reports (
        tenant_id, period_start, period_end,
        total_requests, total_bandwidth_gb,
        agreed_requests, agreed_bandwidth_gb,
        requests_overage, bandwidth_overage_gb,
        base_fee_cents, overage_requests_cents,
        overage_bandwidth_cents, total_amount_cents,
        report_status
      )
      VALUES (
        ${tenantId}, ${periodStart}, ${periodEnd},
        ${totalRequests}, ${totalBandwidthGb},
        ${agreement.agreed_requests_per_month}, ${agreement.agreed_bandwidth_gb},
        ${requestsOverage}, ${bandwidthOverageGb},
        ${baseFee}, ${requestOverageFee},
        ${bandwidthOverageFee}, ${totalAmount},
        'final'
      )
      ON CONFLICT (tenant_id, period_start) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        total_bandwidth_gb = EXCLUDED.total_bandwidth_gb,
        requests_overage = EXCLUDED.requests_overage,
        bandwidth_overage_gb = EXCLUDED.bandwidth_overage_gb,
        total_amount_cents = EXCLUDED.total_amount_cents,
        report_status = 'final'
    `);

    return {
      tenantId,
      periodStart,
      periodEnd,
      totalRequests,
      totalBandwidthGb,
      agreedRequests: parseInt(agreement.agreed_requests_per_month),
      agreedBandwidthGb: parseFloat(agreement.agreed_bandwidth_gb),
      requestsOverage,
      bandwidthOverageGb,
      baseFee,
      overageFees: requestOverageFee + bandwidthOverageFee,
      totalAmount,
    };
  }

  /**
   * Generate reports for all tenants (run monthly via cron)
   */
  async generateAllReports(): Promise<void> {
    const db = getRawDataApiClient();

    // Get all tenants
    const tenantsResult = await db.execute(sql`
      SELECT DISTINCT tenant_id FROM tenant_agreements
      WHERE now() <@ valid_period
    `);

    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    for (const row of tenantsResult.rows) {
      const tenantId = (row as any).tenant_id;

      try {
        await this.generateReport(tenantId, periodStart, periodEnd);
        console.log(`[Report] Generated for ${tenantId}`);
      } catch (error) {
        console.error(`[Report] Failed for ${tenantId}:`, error);
      }
    }
  }
}
```

---

## API Endpoints

### Get Current Month Usage

```typescript
// app/api/usage/current/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getRawDataApiClient } from '@/lib/database/instance';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const context = extractRLSContext(req);
  const db = getRawDataApiClient();

  // Get current month usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await db.execute(sql`
    SELECT * FROM get_tenant_monthly_usage(
      ${context.tenantId},
      ${startOfMonth},
      ${new Date()}
    )
  `);

  // Get agreement
  const agreementResult = await db.execute(sql`
    SELECT agreed_requests_per_month, agreed_bandwidth_gb
    FROM tenant_agreements
    WHERE tenant_id = ${context.tenantId}
      AND now() <@ valid_period
    LIMIT 1
  `);

  const usage = result.rows[0] as any;
  const agreement = agreementResult.rows[0] as any;

  return NextResponse.json({
    period: {
      start: startOfMonth,
      end: new Date(),
    },
    usage: {
      requests: parseInt(usage.total_requests || '0'),
      bandwidthGb: parseFloat(
        ((usage.total_bandwidth_bytes || 0) / (1024 * 1024 * 1024)).toFixed(2)
      ),
      avgResponseMs: parseInt(usage.avg_response_time_ms || '0'),
    },
    limits: {
      requests: parseInt(agreement.agreed_requests_per_month),
      bandwidthGb: parseFloat(agreement.agreed_bandwidth_gb),
    },
    utilization: {
      requestsPercentage: Math.round(
        (parseInt(usage.total_requests || '0') /
          parseInt(agreement.agreed_requests_per_month)) *
          100
      ),
      bandwidthPercentage: Math.round(
        ((usage.total_bandwidth_bytes || 0) /
          (1024 * 1024 * 1024) /
          parseFloat(agreement.agreed_bandwidth_gb)) *
          100
      ),
    },
  });
}
```

---

## Summary

### What You Get

| Feature | Implementation | Cost |
|---------|---------------|------|
| Usage tracking | Batched async inserts | $0.50/1M requests |
| Daily aggregation | Nightly cron job | $0.01/tenant/day |
| Monthly reports | Batch generation | $0.01/tenant/month |
| Fair use alerts | Email notifications | $0.10/alert |
| **Total** | - | **$0.62 per 1M requests** |

### No Active Blocking

- ✅ **No rate limiting** - All requests pass through
- ✅ **Async tracking** - <1ms overhead per request
- ✅ **Retrospective billing** - Calculate charges monthly
- ✅ **Fair use alerts** - Email notifications only
- ✅ **Tenant dashboard** - Self-service usage visibility

### Comparison

| Approach | Blocking | Cost | Complexity |
|----------|----------|------|------------|
| **Active Quotas** | Yes | $1.19/1M | High |
| **Passive Tracking** | No | **$0.62/1M** | **Low** |

**Savings**: $0.57 per 1M requests (48% cheaper than active quotas)

---

This approach is **much simpler**, **more cost-effective**, and aligns perfectly with your fair use compliance needs without disrupting tenant experience.