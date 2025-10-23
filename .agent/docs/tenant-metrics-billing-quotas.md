# Tenant Metrics, Billing & Quota Control

Comprehensive system for tracking tenant usage, enforcing quotas, and calculating billing.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Metrics Collection](#metrics-collection)
4. [Quota Enforcement](#quota-enforcement)
5. [Billing Calculations](#billing-calculations)
6. [Real-time Monitoring](#real-time-monitoring)
7. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### Design Principles

Following the project's **cost-effectiveness philosophy**:

1. **Database-backed counters** - Use PostgreSQL for atomic increments
2. **Time-window aggregation** - Pre-aggregate metrics hourly/daily
3. **In-memory caching** - Cache quota checks for 60 seconds
4. **Batch processing** - Aggregate billing data overnight
5. **Traditional algorithms** - No external analytics services

### System Components

```
┌──────────────────────────────────────────────────────────┐
│                    Tenant API Request                     │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Quota Middleware                                         │
│  - Check cached quota status                             │
│  - Enforce rate limits (requests/min, requests/hour)     │
│  - Return 429 if exceeded                                │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  RLS-Enforced API Handler                                │
│  - Execute tenant-isolated queries                        │
│  - Track query execution time                            │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  Metrics Collector (Async)                               │
│  - Increment request counter                             │
│  - Record response time                                   │
│  - Track database query count                            │
│  - Log API endpoint usage                                │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────┐
│  PostgreSQL (RLS-enforced)                               │
│  - tenant_metrics_raw (real-time events)                 │
│  - tenant_metrics_hourly (pre-aggregated)               │
│  - tenant_quotas (limits & billing tiers)                │
│  - tenant_billing_periods (monthly usage)                │
└──────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- ============================================================================
-- TENANT QUOTAS & TIERS
-- ============================================================================

CREATE TABLE tenant_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL UNIQUE,

  -- Billing tier
  tier TEXT NOT NULL DEFAULT 'free', -- free, starter, professional, enterprise

  -- Request quotas
  requests_per_minute INTEGER NOT NULL DEFAULT 10,
  requests_per_hour INTEGER NOT NULL DEFAULT 1000,
  requests_per_day INTEGER NOT NULL DEFAULT 10000,
  requests_per_month INTEGER NOT NULL DEFAULT 100000,

  -- Database quotas
  db_queries_per_hour INTEGER NOT NULL DEFAULT 5000,
  db_storage_mb INTEGER NOT NULL DEFAULT 1000, -- 1GB

  -- Feature flags
  advanced_analytics_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_features_enabled BOOLEAN NOT NULL DEFAULT false,
  custom_integrations_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Billing
  monthly_fee_cents INTEGER NOT NULL DEFAULT 0, -- $0 for free tier
  overage_rate_per_1k_requests_cents INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  valid_period TSTZRANGE NOT NULL DEFAULT tstzrange(now(), NULL, '[)'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_tier CHECK (tier IN ('free', 'starter', 'professional', 'enterprise', 'custom')),
  INDEX idx_tenant_quotas_tenant_id ON tenant_quotas(tenant_id),
  INDEX idx_tenant_quotas_tier ON tenant_quotas(tier)
);

-- Enable RLS
ALTER TABLE tenant_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_quota_isolation ON tenant_quotas
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- RAW METRICS (Real-time events)
-- ============================================================================

CREATE TABLE tenant_metrics_raw (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,
  user_id TEXT,

  -- Event metadata
  event_type TEXT NOT NULL, -- 'api_request', 'db_query', 'storage_write'
  endpoint TEXT, -- '/api/bookings', '/api/properties'
  method TEXT, -- 'GET', 'POST', 'PUT', 'DELETE'

  -- Performance metrics
  duration_ms INTEGER NOT NULL DEFAULT 0,
  db_query_count INTEGER NOT NULL DEFAULT 0,
  response_status INTEGER, -- HTTP status code

  -- Resource usage
  bytes_sent INTEGER NOT NULL DEFAULT 0,
  bytes_received INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Partitioning by month for performance
  CONSTRAINT valid_event_type CHECK (event_type IN ('api_request', 'db_query', 'storage_write', 'ai_request')),
  INDEX idx_metrics_raw_tenant_time ON tenant_metrics_raw(tenant_id, event_time DESC),
  INDEX idx_metrics_raw_event_type ON tenant_metrics_raw(event_type)
) PARTITION BY RANGE (event_time);

-- Create partitions (automate with pg_cron or external scheduler)
CREATE TABLE tenant_metrics_raw_2025_01 PARTITION OF tenant_metrics_raw
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE tenant_metrics_raw_2025_02 PARTITION OF tenant_metrics_raw
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Enable RLS
ALTER TABLE tenant_metrics_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_metrics_isolation ON tenant_metrics_raw
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- HOURLY AGGREGATED METRICS (Pre-computed for fast queries)
-- ============================================================================

CREATE TABLE tenant_metrics_hourly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL, -- Rounded to hour

  -- Request metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0, -- 2xx status
  failed_requests INTEGER NOT NULL DEFAULT 0, -- 4xx, 5xx status

  -- Performance metrics
  avg_duration_ms INTEGER NOT NULL DEFAULT 0,
  p50_duration_ms INTEGER,
  p95_duration_ms INTEGER,
  p99_duration_ms INTEGER,

  -- Database metrics
  total_db_queries INTEGER NOT NULL DEFAULT 0,

  -- Resource usage
  total_bytes_sent BIGINT NOT NULL DEFAULT 0,
  total_bytes_received BIGINT NOT NULL DEFAULT 0,

  -- Unique constraint: one row per tenant per hour
  UNIQUE (tenant_id, hour_bucket),
  INDEX idx_metrics_hourly_tenant_time ON tenant_metrics_hourly(tenant_id, hour_bucket DESC)
);

-- Enable RLS
ALTER TABLE tenant_metrics_hourly ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_metrics_hourly_isolation ON tenant_metrics_hourly
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- BILLING PERIODS (Monthly aggregations for invoicing)
-- ============================================================================

CREATE TABLE tenant_billing_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,

  -- Billing period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Usage metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_db_queries INTEGER NOT NULL DEFAULT 0,
  total_storage_mb INTEGER NOT NULL DEFAULT 0,
  total_ai_requests INTEGER NOT NULL DEFAULT 0,

  -- Performance
  avg_response_time_ms INTEGER NOT NULL DEFAULT 0,

  -- Billing calculation
  base_fee_cents INTEGER NOT NULL DEFAULT 0,
  overage_requests INTEGER NOT NULL DEFAULT 0,
  overage_charges_cents INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,

  -- Payment status
  invoice_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  invoice_generated_at TIMESTAMPTZ,
  payment_received_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_invoice_status CHECK (invoice_status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
  CONSTRAINT valid_period CHECK (period_end > period_start),
  UNIQUE (tenant_id, period_start),
  INDEX idx_billing_periods_tenant ON tenant_billing_periods(tenant_id, period_start DESC)
);

-- Enable RLS
ALTER TABLE tenant_billing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_billing_isolation ON tenant_billing_periods
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- QUOTA VIOLATIONS LOG
-- ============================================================================

CREATE TABLE tenant_quota_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id TEXT NOT NULL,

  -- Violation details
  quota_type TEXT NOT NULL, -- 'requests_per_minute', 'requests_per_hour', 'storage_limit'
  limit_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL,

  -- Context
  endpoint TEXT,
  user_id TEXT,

  -- Timestamp
  violated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX idx_quota_violations_tenant_time ON tenant_quota_violations(tenant_id, violated_at DESC)
);

-- Enable RLS
ALTER TABLE tenant_quota_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_violations_isolation ON tenant_quota_violations
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true));
```

### Helper Functions

```sql
-- ============================================================================
-- HELPER FUNCTIONS FOR QUOTA CHECKS
-- ============================================================================

-- Get current minute's request count
CREATE OR REPLACE FUNCTION get_tenant_requests_last_minute(p_tenant_id TEXT)
RETURNS INTEGER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM tenant_metrics_raw
  WHERE tenant_id = p_tenant_id
    AND event_type = 'api_request'
    AND event_time >= now() - INTERVAL '1 minute';
$$ LANGUAGE SQL STABLE;

-- Get current hour's request count
CREATE OR REPLACE FUNCTION get_tenant_requests_last_hour(p_tenant_id TEXT)
RETURNS INTEGER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM tenant_metrics_raw
  WHERE tenant_id = p_tenant_id
    AND event_type = 'api_request'
    AND event_time >= now() - INTERVAL '1 hour';
$$ LANGUAGE SQL STABLE;

-- Get current day's request count
CREATE OR REPLACE FUNCTION get_tenant_requests_today(p_tenant_id TEXT)
RETURNS INTEGER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM tenant_metrics_raw
  WHERE tenant_id = p_tenant_id
    AND event_type = 'api_request'
    AND event_time >= date_trunc('day', now());
$$ LANGUAGE SQL STABLE;

-- Check if tenant has exceeded quota
CREATE OR REPLACE FUNCTION check_tenant_quota(
  p_tenant_id TEXT,
  p_quota_type TEXT -- 'minute', 'hour', 'day'
)
RETURNS JSONB
AS $$
DECLARE
  v_quota tenant_quotas%ROWTYPE;
  v_current_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get tenant quota limits
  SELECT * INTO v_quota
  FROM tenant_quotas
  WHERE tenant_id = p_tenant_id
    AND now() <@ valid_period
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Tenant not found or quota not configured'
    );
  END IF;

  -- Get current usage based on time window
  CASE p_quota_type
    WHEN 'minute' THEN
      v_limit := v_quota.requests_per_minute;
      v_current_count := get_tenant_requests_last_minute(p_tenant_id);
    WHEN 'hour' THEN
      v_limit := v_quota.requests_per_hour;
      v_current_count := get_tenant_requests_last_hour(p_tenant_id);
    WHEN 'day' THEN
      v_limit := v_quota.requests_per_day;
      v_current_count := get_tenant_requests_today(p_tenant_id);
    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'Invalid quota type');
  END CASE;

  -- Check if exceeded
  IF v_current_count >= v_limit THEN
    -- Log violation
    INSERT INTO tenant_quota_violations (tenant_id, quota_type, limit_value, current_value)
    VALUES (p_tenant_id, 'requests_per_' || p_quota_type, v_limit, v_current_count);

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Quota exceeded',
      'limit', v_limit,
      'current', v_current_count,
      'resets_at', CASE p_quota_type
        WHEN 'minute' THEN now() + INTERVAL '1 minute'
        WHEN 'hour' THEN now() + INTERVAL '1 hour'
        WHEN 'day' THEN date_trunc('day', now()) + INTERVAL '1 day'
      END
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'limit', v_limit,
    'current', v_current_count,
    'remaining', v_limit - v_current_count
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Metrics Collection

### TypeScript Implementation

```typescript
// lib/metrics/tenant-metrics.ts
import { getRLSClient } from '@/lib/database/instance';
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

export class TenantMetricsCollector {
  private metricsQueue: MetricEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds

  constructor() {
    // Flush metrics every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Record a metric event (non-blocking)
   */
  async record(event: MetricEvent): Promise<void> {
    this.metricsQueue.push(event);

    // Flush if batch size reached
    if (this.metricsQueue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Flush queued metrics to database
   */
  private async flush(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    const batch = this.metricsQueue.splice(0, this.BATCH_SIZE);

    try {
      const rlsDb = getRLSClient();

      // Use admin context (bypass RLS) for metrics insertion
      await rlsDb.raw.execute(sql`
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
          bytes_received
        )
        SELECT
          ${sql.placeholder('tenantId')},
          ${sql.placeholder('userId')},
          ${sql.placeholder('eventType')},
          ${sql.placeholder('endpoint')},
          ${sql.placeholder('method')},
          ${sql.placeholder('durationMs')},
          ${sql.placeholder('dbQueryCount')},
          ${sql.placeholder('responseStatus')},
          ${sql.placeholder('bytesSent')},
          ${sql.placeholder('bytesReceived')}
        FROM unnest(${batch})
      `);

      console.log(`[Metrics] Flushed ${batch.length} events`);
    } catch (error) {
      console.error('[Metrics] Failed to flush:', error);
      // Re-queue failed events
      this.metricsQueue.unshift(...batch);
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush(); // Final flush
  }
}

// Singleton instance
let metricsCollectorInstance: TenantMetricsCollector | null = null;

export function getMetricsCollector(): TenantMetricsCollector {
  if (!metricsCollectorInstance) {
    metricsCollectorInstance = new TenantMetricsCollector();
  }
  return metricsCollectorInstance;
}
```

### Middleware Integration

```typescript
// lib/middleware/metrics-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMetricsCollector } from '@/lib/metrics/tenant-metrics';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';

export function metricsMiddleware(handler: Function) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    const context = extractRLSContext(req);
    const collector = getMetricsCollector();

    try {
      // Execute handler
      const response = await handler(req);
      const durationMs = Date.now() - startTime;

      // Record metrics (non-blocking)
      collector.record({
        tenantId: context.tenantId,
        userId: context.userId,
        eventType: 'api_request',
        endpoint: req.nextUrl.pathname,
        method: req.method,
        durationMs,
        responseStatus: response.status,
        bytesSent: response.headers.get('content-length')
          ? parseInt(response.headers.get('content-length')!)
          : 0,
      });

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Record error
      collector.record({
        tenantId: context.tenantId,
        userId: context.userId,
        eventType: 'api_request',
        endpoint: req.nextUrl.pathname,
        method: req.method,
        durationMs,
        responseStatus: 500,
      });

      throw error;
    }
  };
}
```

---

## Quota Enforcement

### Quota Check Implementation

```typescript
// lib/quotas/quota-checker.ts
import { getRLSClient } from '@/lib/database/instance';
import { sql } from 'drizzle-orm';
import NodeCache from 'node-cache';

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  remaining?: number;
  resetsAt?: Date;
}

export class QuotaChecker {
  private cache: NodeCache;

  constructor() {
    // Cache quota checks for 60 seconds
    this.cache = new NodeCache({ stdTTL: 60 });
  }

  /**
   * Check if tenant can make a request
   */
  async checkQuota(
    tenantId: string,
    quotaType: 'minute' | 'hour' | 'day'
  ): Promise<QuotaCheckResult> {
    const cacheKey = `quota:${tenantId}:${quotaType}`;

    // Check cache first
    const cached = this.cache.get<QuotaCheckResult>(cacheKey);
    if (cached && cached.allowed) {
      return cached;
    }

    // Query database
    const rlsDb = getRLSClient();
    const result = await rlsDb.raw.execute<QuotaCheckResult>(
      sql`SELECT * FROM check_tenant_quota(${tenantId}, ${quotaType})`
    );

    const quotaResult = result.rows[0] as unknown as QuotaCheckResult;

    // Cache successful checks
    if (quotaResult.allowed) {
      this.cache.set(cacheKey, quotaResult);
    }

    return quotaResult;
  }

  /**
   * Check multiple quota types at once
   */
  async checkAllQuotas(tenantId: string): Promise<{
    minute: QuotaCheckResult;
    hour: QuotaCheckResult;
    day: QuotaCheckResult;
  }> {
    const [minute, hour, day] = await Promise.all([
      this.checkQuota(tenantId, 'minute'),
      this.checkQuota(tenantId, 'hour'),
      this.checkQuota(tenantId, 'day'),
    ]);

    return { minute, hour, day };
  }
}

// Singleton
let quotaCheckerInstance: QuotaChecker | null = null;

export function getQuotaChecker(): QuotaChecker {
  if (!quotaCheckerInstance) {
    quotaCheckerInstance = new QuotaChecker();
  }
  return quotaCheckerInstance;
}
```

### Quota Enforcement Middleware

```typescript
// lib/middleware/quota-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { getQuotaChecker } from '@/lib/quotas/quota-checker';

export function quotaMiddleware(handler: Function) {
  return async (req: NextRequest) => {
    const context = extractRLSContext(req);
    const quotaChecker = getQuotaChecker();

    // Check minute-level quota (most restrictive)
    const minuteQuota = await quotaChecker.checkQuota(context.tenantId, 'minute');

    if (!minuteQuota.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: minuteQuota.reason,
          limit: minuteQuota.limit,
          current: minuteQuota.current,
          resetsAt: minuteQuota.resetsAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(minuteQuota.limit),
            'X-RateLimit-Remaining': String(minuteQuota.remaining || 0),
            'X-RateLimit-Reset': minuteQuota.resetsAt
              ? String(Math.floor(minuteQuota.resetsAt.getTime() / 1000))
              : '',
            'Retry-After': '60',
          },
        }
      );
    }

    // Also check hour-level quota (looser, but prevents burst attacks)
    const hourQuota = await quotaChecker.checkQuota(context.tenantId, 'hour');

    if (!hourQuota.allowed) {
      return NextResponse.json(
        {
          error: 'Hourly rate limit exceeded',
          message: hourQuota.reason,
          limit: hourQuota.limit,
          current: hourQuota.current,
          resetsAt: hourQuota.resetsAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(hourQuota.limit),
            'X-RateLimit-Remaining': String(hourQuota.remaining || 0),
            'X-RateLimit-Reset': hourQuota.resetsAt
              ? String(Math.floor(hourQuota.resetsAt.getTime() / 1000))
              : '',
            'Retry-After': '3600',
          },
        }
      );
    }

    // Execute handler
    const response = await handler(req);

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(minuteQuota.limit));
    response.headers.set('X-RateLimit-Remaining', String(minuteQuota.remaining || 0));

    return response;
  };
}
```

### Combined Middleware Usage

```typescript
// app/api/bookings/route.ts
import { quotaMiddleware } from '@/lib/middleware/quota-middleware';
import { metricsMiddleware } from '@/lib/middleware/metrics-middleware';
import { getRLSClient } from '@/lib/database/instance';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { bookings } from '@/lib/database/schema';

// Wrap handler with quota + metrics middleware
async function handleGetBookings(req: NextRequest) {
  const rlsDb = getRLSClient();
  const context = extractRLSContext(req);

  const results = await rlsDb.withRLS(context, async (tx) => {
    return tx.select().from(bookings);
  });

  return NextResponse.json(results);
}

export const GET = metricsMiddleware(quotaMiddleware(handleGetBookings));
```

---

## Billing Calculations

### Billing Service

```typescript
// lib/billing/billing-service.ts
import { getRLSClient } from '@/lib/database/instance';
import { sql } from 'drizzle-orm';

export interface BillingTier {
  name: string;
  monthlyFeeCents: number;
  includedRequests: number;
  overageRatePer1kRequestsCents: number;
}

export const BILLING_TIERS: Record<string, BillingTier> = {
  free: {
    name: 'Free',
    monthlyFeeCents: 0,
    includedRequests: 10000,
    overageRatePer1kRequestsCents: 0, // No overage, hard limit
  },
  starter: {
    name: 'Starter',
    monthlyFeeCents: 2900, // $29
    includedRequests: 100000,
    overageRatePer1kRequestsCents: 50, // $0.50 per 1k
  },
  professional: {
    name: 'Professional',
    monthlyFeeCents: 9900, // $99
    includedRequests: 500000,
    overageRatePer1kRequestsCents: 30, // $0.30 per 1k
  },
  enterprise: {
    name: 'Enterprise',
    monthlyFeeCents: 49900, // $499
    includedRequests: 5000000,
    overageRatePer1kRequestsCents: 10, // $0.10 per 1k
  },
};

export class BillingService {
  /**
   * Calculate billing for a tenant for a given period
   */
  async calculateBilling(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    baseFee: number;
    includedRequests: number;
    totalRequests: number;
    overageRequests: number;
    overageCharges: number;
    totalAmount: number;
  }> {
    const rlsDb = getRLSClient();

    // Get tenant's tier
    const quotaResult = await rlsDb.raw.execute(sql`
      SELECT tier, monthly_fee_cents, overage_rate_per_1k_requests_cents
      FROM tenant_quotas
      WHERE tenant_id = ${tenantId}
        AND now() <@ valid_period
      LIMIT 1
    `);

    if (quotaResult.rows.length === 0) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const quota = quotaResult.rows[0] as any;
    const tier = BILLING_TIERS[quota.tier] || BILLING_TIERS.starter;

    // Get total requests for period
    const metricsResult = await rlsDb.raw.execute(sql`
      SELECT COUNT(*)::INTEGER as total_requests
      FROM tenant_metrics_raw
      WHERE tenant_id = ${tenantId}
        AND event_type = 'api_request'
        AND event_time >= ${periodStart}
        AND event_time < ${periodEnd}
    `);

    const totalRequests = (metricsResult.rows[0] as any).total_requests || 0;

    // Calculate overage
    const overageRequests = Math.max(0, totalRequests - tier.includedRequests);
    const overageCharges =
      Math.ceil(overageRequests / 1000) * tier.overageRatePer1kRequestsCents;

    const totalAmount = tier.monthlyFeeCents + overageCharges;

    return {
      baseFee: tier.monthlyFeeCents,
      includedRequests: tier.includedRequests,
      totalRequests,
      overageRequests,
      overageCharges,
      totalAmount,
    };
  }

  /**
   * Generate billing period record
   */
  async generateBillingPeriod(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const billing = await this.calculateBilling(tenantId, periodStart, periodEnd);

    const rlsDb = getRLSClient();

    await rlsDb.raw.execute(sql`
      INSERT INTO tenant_billing_periods (
        tenant_id,
        period_start,
        period_end,
        total_requests,
        base_fee_cents,
        overage_requests,
        overage_charges_cents,
        total_amount_cents,
        invoice_status,
        invoice_generated_at
      )
      VALUES (
        ${tenantId},
        ${periodStart},
        ${periodEnd},
        ${billing.totalRequests},
        ${billing.baseFee},
        ${billing.overageRequests},
        ${billing.overageCharges},
        ${billing.totalAmount},
        'pending',
        now()
      )
      ON CONFLICT (tenant_id, period_start) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        overage_requests = EXCLUDED.overage_requests,
        overage_charges_cents = EXCLUDED.overage_charges_cents,
        total_amount_cents = EXCLUDED.total_amount_cents,
        updated_at = now()
    `);
  }

  /**
   * Generate billing for all tenants (run monthly via cron)
   */
  async generateMonthlyBillingForAllTenants(): Promise<void> {
    const rlsDb = getRLSClient();

    // Get all active tenants
    const tenantsResult = await rlsDb.raw.execute(sql`
      SELECT DISTINCT tenant_id
      FROM tenant_quotas
      WHERE now() <@ valid_period
    `);

    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    for (const row of tenantsResult.rows) {
      const tenantId = (row as any).tenant_id;

      try {
        await this.generateBillingPeriod(tenantId, periodStart, periodEnd);
        console.log(`[Billing] Generated for tenant ${tenantId}`);
      } catch (error) {
        console.error(`[Billing] Failed for tenant ${tenantId}:`, error);
      }
    }
  }
}

// Singleton
let billingServiceInstance: BillingService | null = null;

export function getBillingService(): BillingService {
  if (!billingServiceInstance) {
    billingServiceInstance = new BillingService();
  }
  return billingServiceInstance;
}
```

---

## Real-time Monitoring

### Dashboard API

```typescript
// app/api/admin/metrics/[tenantId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRLSClient } from '@/lib/database/instance';
import { sql } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const rlsDb = getRLSClient();
  const { tenantId } = params;

  // Get current usage
  const [minuteUsage, hourUsage, dayUsage, monthUsage] = await Promise.all([
    rlsDb.raw.execute(sql`
      SELECT get_tenant_requests_last_minute(${tenantId}) as count
    `),
    rlsDb.raw.execute(sql`
      SELECT get_tenant_requests_last_hour(${tenantId}) as count
    `),
    rlsDb.raw.execute(sql`
      SELECT get_tenant_requests_today(${tenantId}) as count
    `),
    rlsDb.raw.execute(sql`
      SELECT COUNT(*)::INTEGER as count
      FROM tenant_metrics_raw
      WHERE tenant_id = ${tenantId}
        AND event_type = 'api_request'
        AND event_time >= date_trunc('month', now())
    `),
  ]);

  // Get quota limits
  const quotaResult = await rlsDb.raw.execute(sql`
    SELECT
      tier,
      requests_per_minute,
      requests_per_hour,
      requests_per_day,
      requests_per_month
    FROM tenant_quotas
    WHERE tenant_id = ${tenantId}
      AND now() <@ valid_period
    LIMIT 1
  `);

  const quota = quotaResult.rows[0] as any;

  return NextResponse.json({
    tenantId,
    tier: quota.tier,
    usage: {
      minute: {
        current: (minuteUsage.rows[0] as any).count,
        limit: quota.requests_per_minute,
        percentage: ((minuteUsage.rows[0] as any).count / quota.requests_per_minute) * 100,
      },
      hour: {
        current: (hourUsage.rows[0] as any).count,
        limit: quota.requests_per_hour,
        percentage: ((hourUsage.rows[0] as any).count / quota.requests_per_hour) * 100,
      },
      day: {
        current: (dayUsage.rows[0] as any).count,
        limit: quota.requests_per_day,
        percentage: ((dayUsage.rows[0] as any).count / quota.requests_per_day) * 100,
      },
      month: {
        current: (monthUsage.rows[0] as any).count,
        limit: quota.requests_per_month,
        percentage: ((monthUsage.rows[0] as any).count / quota.requests_per_month) * 100,
      },
    },
  });
}
```

---

## Cost Optimization

### Database-Level Optimizations

1. **Partitioned tables** - Metrics tables partitioned by month
2. **Hourly pre-aggregation** - Reduce query load for dashboards
3. **Indexed columns** - tenant_id, event_time for fast lookups
4. **Cached quota checks** - 60-second TTL in memory

### Cost Per Operation

```typescript
// Estimated costs (based on Aurora Serverless v2 ACU pricing)

const COSTS = {
  // Metrics insertion (batched)
  insertMetric: 0.000001, // $0.000001 per metric

  // Quota check (cached 60s)
  quotaCheck: 0.000005, // $0.000005 per check (amortized)

  // Billing calculation (monthly)
  billingCalculation: 0.01, // $0.01 per tenant per month

  // Dashboard query
  dashboardQuery: 0.0001, // $0.0001 per dashboard load
};

// Example: 1M requests/month
const monthlyRequests = 1_000_000;
const metricsCost = monthlyRequests * COSTS.insertMetric; // $1.00
const quotaChecksCost = (monthlyRequests / 60) * COSTS.quotaCheck; // $0.08 (cached)
const totalMetricsCost = metricsCost + quotaChecksCost; // $1.08/month

console.log(`Total metrics cost for 1M requests: $${totalMetricsCost.toFixed(2)}`);
// Output: Total metrics cost for 1M requests: $1.08
```

### Traditional Algorithm Benefits

- ✅ **No external services** (Datadog, New Relic, etc. cost $50-500/month)
- ✅ **Local processing** (batch inserts, in-memory cache)
- ✅ **PostgreSQL counters** (atomic, consistent)
- ✅ **Minimal latency** (<5ms quota check from cache)

---

## Summary

### What You Get

| Feature | Implementation | Cost |
|---------|---------------|------|
| **Request tracking** | Database-backed counters | $1.00/1M requests |
| **Quota enforcement** | PostgreSQL functions + cache | $0.08/1M checks |
| **Billing calculation** | Monthly batch job | $0.01/tenant |
| **Real-time dashboard** | Pre-aggregated hourly data | $0.10/1k views |
| **Total** | - | **$1.19 per 1M requests** |

### Comparison to SaaS Solutions

| Provider | Cost per 1M Events | Features |
|----------|-------------------|----------|
| **Datadog** | ~$100 | Full observability, complex |
| **New Relic** | ~$75 | APM, dashboards |
| **Custom (This)** | **$1.19** | **Billing-focused, simple** |

**Savings**: $73.81 per 1M events (98% reduction)

---

## Next Steps

1. **Review schema** - Customize tables for your needs
2. **Deploy infrastructure** - Run SQL migrations
3. **Integrate middleware** - Add quota + metrics to APIs
4. **Set up cron jobs** - Monthly billing generation
5. **Build admin dashboard** - Monitor tenant usage

**Estimated Implementation**: 8-12 hours
