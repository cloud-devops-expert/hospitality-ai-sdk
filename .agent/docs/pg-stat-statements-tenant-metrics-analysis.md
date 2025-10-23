# pg_stat_statements for Tenant Metrics - Analysis

## Executive Summary

Exploring PostgreSQL's built-in `pg_stat_statements` extension for tracking tenant usage metrics.

**TL;DR:** ❌ **NOT VIABLE** - `pg_stat_statements` does not track `application_name`, making tenant identification impossible without significant workarounds.

---

## What is pg_stat_statements?

PostgreSQL extension that tracks execution statistics for all SQL statements executed by a server.

### Key Features

✅ **Tracks:**
- Query execution count (`calls`)
- Execution time (total, min, max, mean)
- Rows retrieved/affected
- I/O operations (blocks read/written)
- Planning time
- Memory usage
- WAL records generated

✅ **Benefits:**
- Database-native (no application instrumentation)
- Minimal overhead (~1-5% performance impact)
- Always enabled on Aurora PostgreSQL
- Free (included with PostgreSQL)

---

## Data Available in pg_stat_statements

### Standard Columns

```sql
SELECT
  userid,
  dbid,
  queryid,
  query,
  calls,                    -- Number of executions
  total_exec_time,          -- Total execution time (ms)
  mean_exec_time,           -- Average execution time (ms)
  rows,                     -- Total rows affected
  shared_blks_read,         -- Disk reads
  shared_blks_written,      -- Disk writes
  temp_blks_written         -- Temporary data written
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Aurora-Specific: aurora_stat_statements()

AWS Aurora adds 11 additional columns:

```sql
SELECT * FROM aurora_stat_statements()
LIMIT 10;

-- Additional columns:
-- storage_blks_read          Aurora storage reads
-- orcache_blks_hit           Optimized cache hits
-- storage_blk_read_time      Aurora storage read time
-- local_blk_read_time        Local block read time
-- orcache_blk_read_time      Cache read time
-- total_plan_peakmem         Planning memory usage
-- total_exec_peakmem         Execution memory usage
```

---

## 🚨 Critical Limitation: No application_name

**Problem:** `pg_stat_statements` aggregates statistics by:
- Database ID (`dbid`)
- User ID (`userid`)
- Query ID (`queryid`)

**Missing:** `application_name`, connection parameters, or any custom metadata.

### What This Means

```sql
-- ❌ This does NOT work (application_name is not a column)
SELECT
  application_name,
  SUM(calls) as request_count
FROM pg_stat_statements
GROUP BY application_name;

-- ERROR: column "application_name" does not exist
```

**You CANNOT filter or group by tenant** because tenant information (even if set via `application_name`) is not captured.

---

## Alternatives That Track application_name

### 1. pg_stat_monitor (Percona)

**Features:**
- Tracks `application_name`
- Tracks client IP
- Tracks username
- Bucket-based time-series data
- Query examples (not just normalized queries)

**AWS Status:** ❌ **NOT SUPPORTED** on Aurora/RDS PostgreSQL (as of 2024)

**Quote from AWS re:Post (April 2024):**
> "pg_stat_monitor is not included in the supported extensions for Amazon Aurora PostgreSQL and RDS PostgreSQL. A feature request has been prepared, but no ETA is available."

---

### 2. pg_stat_activity (Current Sessions Only)

**Available Data:**

```sql
SELECT
  application_name,
  usename,
  client_addr,
  state,
  query,
  query_start,
  state_change
FROM pg_stat_activity
WHERE application_name LIKE 'tenant-%';
```

**Pros:**
- ✅ Includes `application_name`
- ✅ Shows current tenant activity
- ✅ Available on Aurora

**Cons:**
- ❌ **Only shows current sessions** (no historical data)
- ❌ Cannot aggregate monthly request counts
- ❌ Cannot track total data transferred
- ❌ Would need continuous polling to build history

---

### 3. Custom Tracking Table (Hybrid Approach)

Create a custom tracking solution using `pg_stat_activity` snapshots:

```sql
-- Create tracking table
CREATE TABLE tenant_query_stats (
  snapshot_time TIMESTAMPTZ DEFAULT NOW(),
  application_name TEXT,
  tenant_id TEXT,
  query_count INTEGER,
  total_exec_time DOUBLE PRECISION,
  total_rows BIGINT,
  PRIMARY KEY (snapshot_time, tenant_id)
);

-- Function to capture stats snapshot
CREATE OR REPLACE FUNCTION capture_tenant_stats()
RETURNS VOID AS $$
BEGIN
  INSERT INTO tenant_query_stats (
    application_name,
    tenant_id,
    query_count,
    total_exec_time,
    total_rows
  )
  SELECT
    application_name,
    SUBSTRING(application_name FROM 'tenant-([^-]+)') as tenant_id,
    COUNT(*) as query_count,
    SUM(EXTRACT(EPOCH FROM (NOW() - query_start))) as total_exec_time,
    0 as total_rows  -- Not available in pg_stat_activity
  FROM pg_stat_activity
  WHERE application_name LIKE 'tenant-%'
    AND state = 'active'
  GROUP BY application_name;
END;
$$ LANGUAGE plpgsql;

-- Schedule via cron or Lambda
SELECT cron.schedule(
  'capture-tenant-stats',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT capture_tenant_stats();'
);
```

**Problems with this approach:**

❌ **Inaccurate counting:**
- Only counts active queries at snapshot time
- Misses short-lived queries between snapshots
- Cannot track completed transactions

❌ **Missing data:**
- No bytes transferred
- No accurate request counts
- No response status codes

❌ **High database load:**
- Polling every 5 minutes = 8,640 queries/month
- Would need aggregation logic
- Adds unnecessary database overhead

---

## Why pg_stat_statements Won't Work for Tenant Metrics

### Required Metrics for Fair Use Billing

| Metric | Available in pg_stat_statements? | Notes |
|--------|----------------------------------|-------|
| **Request count per tenant** | ❌ No | No tenant identifier |
| **Bytes transferred per tenant** | ❌ No | No tenant identifier |
| **Response time per tenant** | ❌ No | No tenant identifier |
| **Error count per tenant** | ❌ No | No tenant identifier |
| **Endpoint breakdown** | ⚠️ Partial | Can see queries, but can't group by tenant |

### What You'd Get

```sql
-- This shows ALL tenant queries combined
SELECT
  query,
  calls,
  mean_exec_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%bookings%'
ORDER BY calls DESC;

-- Result:
-- query                            | calls | mean_exec_time | rows
-- SELECT * FROM bookings WHERE ... | 50000 | 15.3          | 500000
```

**Problem:** You can see that the query ran 50,000 times, but you **CANNOT** see:
- ❌ How many times tenant-123 ran it
- ❌ How many times tenant-456 ran it
- ❌ Which tenant used the most resources

---

## Workaround Attempt: Join pg_stat_statements with Custom Tracking

### Theoretical Approach

1. Set `application_name = tenant-{id}` in transactions (already doing this)
2. Log tenant queries to custom table
3. Join custom table with `pg_stat_statements` by `queryid`

```sql
-- Create custom tracking
CREATE TABLE tenant_query_log (
  query_id BIGINT,
  tenant_id TEXT,
  query_time TIMESTAMPTZ,
  PRIMARY KEY (query_id, tenant_id, query_time)
);

-- Function to log queries (called from app)
CREATE OR REPLACE FUNCTION log_tenant_query(p_query TEXT, p_tenant_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_queryid BIGINT;
BEGIN
  -- Get queryid from pg_stat_statements
  SELECT queryid INTO v_queryid
  FROM pg_stat_statements
  WHERE query = p_query
  LIMIT 1;

  IF v_queryid IS NOT NULL THEN
    INSERT INTO tenant_query_log (query_id, tenant_id, query_time)
    VALUES (v_queryid, p_tenant_id, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Query tenant statistics
SELECT
  t.tenant_id,
  COUNT(*) as tenant_calls,
  SUM(pss.mean_exec_time) as total_time,
  SUM(pss.rows) as total_rows
FROM tenant_query_log t
JOIN pg_stat_statements pss ON t.query_id = pss.queryid
GROUP BY t.tenant_id
ORDER BY total_time DESC;
```

### Problems with This Approach

❌ **Application overhead:**
- Requires calling `log_tenant_query()` for every query
- Adds database write on every request
- Defeats purpose of "database-native" tracking

❌ **Query ID matching:**
- `queryid` changes when query parameters change
- Normalized queries lose tenant-specific WHERE clauses
- JOIN would miss many queries

❌ **Data volume:**
- 10M requests/month = 10M rows in `tenant_query_log`
- Storage costs exceed CloudWatch metrics
- Index maintenance overhead

❌ **Complexity:**
- More complex than application-level tracking
- Still requires instrumentation
- No advantage over custom CloudWatch metrics

---

## Cost Analysis: pg_stat_statements vs Alternatives

### Option 1: pg_stat_statements + Custom Tracking Table

```
Database storage:
- 10M requests/month
- 50 bytes per row (query_id, tenant_id, timestamp)
- Monthly data: 10M * 50 bytes = 500 MB

Aurora storage: 500 MB * $0.10/GB = $0.05/month
Aurora I/O: 10M writes * $0.20/1M = $2.00/month

Aggregation queries:
- 1,000 queries/month * $0.0001 = $0.10/month

Total: $2.15/month
```

### Option 2: Custom CloudWatch Metrics (Current Implementation)

```
Metrics: 10 tenants * 10 metrics * $0.30 = $30.00/month
Alarms: 10 tenants * 3 alarms * $0.10 = $3.00/month

Total: $33.00/month
```

### Option 3: PostgreSQL Usage Tracker (Alternative)

```
Database storage:
- Batched inserts (1,000 requests per row)
- 10M requests / 1,000 = 10,000 rows
- 200 bytes per row
- Monthly data: 10,000 * 200 bytes = 2 MB

Aurora storage: negligible
Aurora I/O: 10,000 writes * $0.20/1M = $0.002/month

Total: <$0.01/month
```

**Winner for cost:** PostgreSQL-based tracking (<$0.01/month)

**Winner for simplicity:** Custom CloudWatch metrics ($33/month)

**pg_stat_statements approach:** $2.15/month but extremely complex and incomplete

---

## Recommendation Matrix

### DON'T Use pg_stat_statements For Tenant Metrics

| Use Case | Recommended Solution | Reason |
|----------|---------------------|---------|
| **<100 tenants** | Custom CloudWatch Metrics | Simple, real-time, worth the cost |
| **100-500 tenants** | Custom CloudWatch Metrics | Cost still manageable ($330/month) |
| **>500 tenants** | PostgreSQL Tracking Table | Cost-effective at scale |
| **Real-time alerts needed** | Custom CloudWatch Metrics | Instant alerting capability |
| **Historical billing only** | PostgreSQL Tracking Table | Cheapest option |
| **Compliance audit trail** | Enable CloudTrail (hybrid) | Full API audit + metrics |

### When pg_stat_statements IS Useful

✅ **Query performance optimization:**
```sql
-- Find slowest queries across all tenants
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC;
```

✅ **Database-level diagnostics:**
```sql
-- Find most expensive queries by total time
SELECT query, total_exec_time, calls
FROM pg_stat_statements
ORDER BY total_exec_time DESC;
```

✅ **I/O analysis:**
```sql
-- Find queries causing most disk reads
SELECT query, shared_blks_read, calls
FROM pg_stat_statements
ORDER BY shared_blks_read DESC;
```

**Use it for:** Database optimization and performance tuning

**Don't use it for:** Tenant billing, fair use compliance, or per-tenant metrics

---

## Final Verdict

### Why pg_stat_statements Won't Work

1. ❌ **No `application_name` column** - Cannot identify tenants
2. ❌ **No custom metadata** - Cannot track tenant-specific information
3. ❌ **Aggregates by query** - Loses per-request granularity
4. ❌ **Workarounds are complex** - Custom tracking negates benefits
5. ❌ **Missing data** - No HTTP response codes, endpoints, or bytes transferred

### Recommended Solution (No Change Needed)

**Keep your current implementation:**

```typescript
// lib/metrics/cloudwatch-publisher.ts
// lib/middleware/cloudwatch-metrics.ts
```

**Why:**
- ✅ Already implemented and working
- ✅ Real-time metrics
- ✅ All required data (requests, bytes, errors, latency)
- ✅ Per-tenant and per-endpoint granularity
- ✅ Native CloudWatch dashboards and alerts
- ✅ Cost is acceptable (<$3.30/tenant/month)

### Alternative for Cost Optimization (>500 tenants)

**Switch to PostgreSQL-based tracking:**

```typescript
// lib/metrics/usage-tracker.ts (already exists)
```

**Why:**
- ✅ <$0.01/month (vs $3.30/tenant/month)
- ✅ Scales to millions of tenants
- ✅ No external dependencies
- ✅ Simple queries for billing reports

**Trade-off:**
- ❌ No real-time alerting
- ❌ Manual dashboard creation
- ❌ Query-based reporting instead of metrics

---

## Summary

| Approach | Cost (10 tenants) | Real-Time | Complexity | Verdict |
|----------|------------------|-----------|------------|---------|
| **pg_stat_statements** | $2.15/mo | ❌ No | 🔴 Very High | ❌ Don't use |
| **Custom CloudWatch** | $33/mo | ✅ Yes | 🟢 Low | ✅ **Recommended** |
| **PostgreSQL Tracking** | <$0.01/mo | ❌ No | 🟡 Medium | ✅ For >500 tenants |
| **CloudTrail** | $13/mo | ❌ No | 🔴 Very High | ❌ Requires IAM changes |

**Conclusion:** `pg_stat_statements` is excellent for query performance optimization but **cannot be used for tenant metrics tracking**. Your current CloudWatch metrics implementation is the right choice.
