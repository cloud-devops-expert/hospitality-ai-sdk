# AWS Data API Migration Guide

Complete step-by-step guide to migrate from traditional PostgreSQL (`pg`) to AWS Data API with Drizzle ORM and Row-Level Security (RLS).

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
4. [Phase 2: Code Preparation](#phase-2-code-preparation)
5. [Phase 3: RLS Implementation](#phase-3-rls-implementation)
6. [Phase 4: Testing & Validation](#phase-4-testing--validation)
7. [Phase 5: Production Deployment](#phase-5-production-deployment)
8. [Rollback Strategy](#rollback-strategy)
9. [Cost Analysis](#cost-analysis)
10. [Troubleshooting](#troubleshooting)

---

## Migration Overview

### Current Architecture

```
┌─────────────┐         ┌──────────────┐         ┌───────────────┐
│             │         │              │         │               │
│  PayloadCMS │ ──pg──> │   VPC        │ ──TCP─> │  Aurora       │
│  (Lambda)   │         │   NAT GW     │         │  Provisioned  │
│             │         │              │         │               │
└─────────────┘         └──────────────┘         └───────────────┘
      ↓                        ↓                         ↓
  Cold start           NAT Gateway                 Fixed capacity
  500-2000ms           $32/month                   $73/month
```

### Target Architecture

```
┌─────────────┐                               ┌───────────────┐
│             │                               │               │
│  PayloadCMS │ ──Data API (HTTPS)────────> │  Aurora       │
│  (Lambda)   │      + RLS Context           │  Serverless   │
│             │                               │  v2 + RLS     │
└─────────────┘                               └───────────────┘
      ↓                                              ↓
  Cold start                                  Auto-scaling
  50-200ms                                    $43/month
  IAM Auth                                    (0.5-2 ACU)
```

### Benefits

| Metric | Before (pg) | After (Data API) | Improvement |
|--------|------------|------------------|-------------|
| Cold Start | 500-2000ms | 50-200ms | **90% faster** |
| VPC Required | Yes | No | **-$32/month** |
| Connection Pool | Required | N/A | **Simpler** |
| Auth Method | Password | IAM | **More secure** |
| Multi-tenant Security | App-level | Database RLS | **SOC2/GDPR** |
| Monthly Cost | $105 | $75 | **-29%** |

### Trade-offs

- **Query Latency**: 2-3x higher for simple queries (+20-50ms)
- **RLS Overhead**: 2-3x overhead for isolated queries
- **Transaction Required**: Session variables need transaction blocks
- **No Connection Pooling**: Stateless connections only

---

## Prerequisites

### AWS Resources

- [ ] AWS account with admin access
- [ ] Terraform installed (v1.5+)
- [ ] AWS CLI configured
- [ ] Aurora Serverless v2 cluster (will be created)
- [ ] Secrets Manager access

### Development Environment

- [ ] Node.js 18+ installed
- [ ] TypeScript 5+ configured
- [ ] Drizzle ORM knowledge
- [ ] PayloadCMS v3 project
- [ ] Git repository

### Required Environment Variables

```bash
# Current (pg-based)
DATABASE_URL=postgresql://user:pass@hostname:5432/dbname

# New (Data API)
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai-dev-db-AbCdEf
DATABASE_NAME=hospitality_ai
AWS_REGION=us-east-1
USE_DATA_API=true
DEBUG_DATA_API=false
```

---

## Phase 1: Infrastructure Setup

**Duration**: 2-3 hours
**Risk Level**: Low (no impact on existing system)

### Step 1.1: Deploy Aurora Serverless v2 with Data API

```bash
cd .agent/infrastructure

# Initialize Terraform
terraform init

# Review planned changes
terraform plan -var="project_name=hospitality-ai" -var="environment=dev"

# Apply infrastructure
terraform apply -auto-approve \
  -var="project_name=hospitality-ai" \
  -var="environment=dev" \
  -var="min_capacity=0.5" \
  -var="max_capacity=2.0"
```

**Expected Output**:
```
Outputs:

cluster_arn = "arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev"
secret_arn = "arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai/dev/db-credentials-AbCdEf"
database_name = "hospitality_ai"
cluster_endpoint = "hospitality-ai-dev.cluster-abc123.us-east-1.rds.amazonaws.com"
```

**Save these values** - you'll need them for environment variables.

### Step 1.2: Configure IAM Permissions

Attach the Data API policy to your Lambda execution role:

```bash
# Get the policy ARN from Terraform output
export POLICY_ARN=$(terraform output -raw lambda_policy_arn)

# Attach to your Lambda role
aws iam attach-role-policy \
  --role-name your-lambda-execution-role \
  --policy-arn $POLICY_ARN
```

### Step 1.3: Initialize Database Schema

Apply the RLS policies and initial data:

```bash
# Connect to Aurora cluster using Data API
aws rds-data execute-statement \
  --resource-arn "arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev" \
  --secret-arn "arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai/dev/db-credentials-AbCdEf" \
  --database "hospitality_ai" \
  --sql "$(cat .agent/infrastructure/rls-policies.sql)"
```

Or use a PostgreSQL client:

```bash
psql -h hospitality-ai-dev.cluster-abc123.us-east-1.rds.amazonaws.com \
     -U admin \
     -d hospitality_ai \
     -f .agent/infrastructure/rls-policies.sql
```

**Verify schema**:
```bash
# Check tables exist
aws rds-data execute-statement \
  --resource-arn $DB_CLUSTER_ARN \
  --secret-arn $DB_SECRET_ARN \
  --database $DATABASE_NAME \
  --sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
```

### Step 1.4: Test Data API Connection

```typescript
// scripts/test-data-api.ts
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

async function testConnection() {
  const client = new RDSDataClient({ region: 'us-east-1' });

  const command = new ExecuteStatementCommand({
    resourceArn: process.env.DB_CLUSTER_ARN!,
    secretArn: process.env.DB_SECRET_ARN!,
    database: process.env.DATABASE_NAME!,
    sql: 'SELECT 1 as health_check',
  });

  const response = await client.send(command);
  console.log('Connection successful:', response);
}

testConnection();
```

```bash
npm install @aws-sdk/client-rds-data
npx tsx scripts/test-data-api.ts
```

**Expected output**: `Connection successful: { records: [ [ { longValue: 1 } ] ] }`

---

## Phase 2: Code Preparation

**Duration**: 4-6 hours
**Risk Level**: Low (no changes to production)

### Step 2.1: Install Dependencies

```bash
# Install Drizzle AWS Data API driver
npm install drizzle-orm @aws-sdk/client-rds-data @aws-sdk/credential-providers

# Remove (don't uninstall yet - needed for rollback)
# npm uninstall pg @types/pg
```

### Step 2.2: Copy Implementation Files

The following files have already been created:

1. ✅ `lib/database/aws-data-api-adapter.ts` - Base Data API adapter
2. ✅ `lib/database/drizzle-rls-client.ts` - RLS-aware client
3. ✅ `.agent/infrastructure/rls-policies.sql` - Database schema
4. ✅ `.agent/docs/rls-integration-examples.md` - Integration examples

### Step 2.3: Create Database Instance

```typescript
// lib/database/instance.ts
import { DrizzleRLSClient } from './drizzle-rls-client';
import { createDataApiAdapter } from './aws-data-api-adapter';

let rlsDbInstance: DrizzleRLSClient | null = null;
let rawDbInstance: ReturnType<typeof createDataApiAdapter> | null = null;

/**
 * Get RLS-enforced database client (use for tenant APIs)
 */
export function getRLSClient(): DrizzleRLSClient {
  if (!rlsDbInstance) {
    rlsDbInstance = new DrizzleRLSClient({
      resourceArn: process.env.DB_CLUSTER_ARN!,
      secretArn: process.env.DB_SECRET_ARN!,
      database: process.env.DATABASE_NAME!,
      region: process.env.AWS_REGION,
      debug: process.env.DEBUG_DATA_API === 'true',
      strictMode: true,
    });
  }
  return rlsDbInstance;
}

/**
 * Get raw Data API client (use for admin operations)
 */
export function getRawDataApiClient() {
  if (!rawDbInstance) {
    rawDbInstance = createDataApiAdapter({
      resourceArn: process.env.DB_CLUSTER_ARN!,
      secretArn: process.env.DB_SECRET_ARN!,
      database: process.env.DATABASE_NAME!,
      region: process.env.AWS_REGION,
      debug: process.env.DEBUG_DATA_API === 'true',
    });
  }
  return rawDbInstance;
}
```

### Step 2.4: Define Drizzle Schema

```typescript
// lib/database/schema.ts
import { pgTable, uuid, text, timestamp, numeric, date, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const entities = pgTable(
  'entities',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v7()`),
    tenantId: text('tenant_id').notNull(),
    entityType: text('entity_type').notNull(),
    name: text('name').notNull(),
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index('idx_entities_tenant_id').on(table.tenantId),
    entityTypeIdx: index('idx_entities_entity_type').on(table.entityType),
  })
);

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v7()`),
    tenantId: text('tenant_id').notNull(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => entities.id),
    roomId: uuid('room_id')
      .notNull()
      .references(() => entities.id),
    guestId: text('guest_id').notNull(),
    checkIn: date('check_in').notNull(),
    checkOut: date('check_out').notNull(),
    status: text('status').notNull().default('pending'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index('idx_bookings_tenant_id').on(table.tenantId),
    guestIdIdx: index('idx_bookings_guest_id').on(table.guestId),
    propertyIdIdx: index('idx_bookings_property_id').on(table.propertyId),
  })
);

export const tenantRelationships = pgTable(
  'tenant_relationships',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuid_generate_v7()`),
    tenantId: text('tenant_id').notNull(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entities.id),
    externalId: text('external_id').notNull(),
    relationshipType: text('relationship_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index('idx_tenant_relationships_tenant_id').on(table.tenantId),
    externalIdIdx: index('idx_tenant_relationships_external_id').on(table.externalId),
  })
);
```

### Step 2.5: Update Environment Variables

```bash
# .env.local (development)
# Old (keep for rollback)
DATABASE_URL=postgresql://user:pass@localhost:5432/hospitality_ai

# New (add these)
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai/dev/db-credentials-AbCdEf
DATABASE_NAME=hospitality_ai
AWS_REGION=us-east-1
USE_DATA_API=true
DEBUG_DATA_API=true
```

### Step 2.6: Create Feature Flag Config

```typescript
// lib/config/database.ts
export const databaseConfig = {
  useDataApi: process.env.USE_DATA_API === 'true',
  useLegacyPg: process.env.USE_DATA_API !== 'true',
  dataApi: {
    resourceArn: process.env.DB_CLUSTER_ARN!,
    secretArn: process.env.DB_SECRET_ARN!,
    database: process.env.DATABASE_NAME!,
    region: process.env.AWS_REGION || 'us-east-1',
  },
  pg: {
    connectionString: process.env.DATABASE_URL!,
  },
};
```

---

## Phase 3: RLS Implementation

**Duration**: 8-12 hours
**Risk Level**: Medium (testing required)

### Step 3.1: Migrate API Routes to RLS

**Before** (traditional pg):
```typescript
// app/api/bookings/route.ts (OLD)
import { db } from '@/lib/database/pg-client';

export async function GET(req: Request) {
  const tenantId = req.headers.get('x-tenant-id');

  // Manual tenant filtering
  const bookings = await db.query(
    'SELECT * FROM bookings WHERE tenant_id = $1',
    [tenantId]
  );

  return Response.json(bookings.rows);
}
```

**After** (Data API + RLS):
```typescript
// app/api/bookings/route.ts (NEW)
import { getRLSClient } from '@/lib/database/instance';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { bookings } from '@/lib/database/schema';

export async function GET(req: Request) {
  const rlsDb = getRLSClient();
  const context = extractRLSContext(req);

  // Automatic tenant isolation via RLS
  const results = await rlsDb.withRLS(context, async (tx) => {
    return tx.select().from(bookings);
  });

  return Response.json(results);
}
```

### Step 3.2: Update PayloadCMS Configuration

**Hybrid approach** (recommended):

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { createDataApiAdapter } from './lib/database/aws-data-api-adapter';

export default buildConfig({
  // Use traditional pg for admin panel (trusted users, fast)
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    push: false,
  }),

  // Custom endpoints use Data API + RLS (tenant APIs)
  endpoints: [
    {
      path: '/tenant-bookings',
      method: 'get',
      handler: async (req, res) => {
        const rlsDb = getRLSClient();
        const context = {
          tenantId: req.user?.tenant?.id || 'unknown',
          userId: req.user?.id,
        };

        const bookings = await rlsDb.withRLS(context, async (tx) => {
          return tx.select().from(bookingsTable);
        });

        return res.json(bookings);
      },
    },
  ],
});
```

### Step 3.3: Implement RLS Context Extraction

```typescript
// lib/middleware/rls-context.ts
import { NextRequest } from 'next/server';
import { RLSContext } from '@/lib/database/drizzle-rls-client';

export function extractRLSContextFromRequest(req: NextRequest): RLSContext {
  // Option 1: From headers (API calls)
  const tenantId = req.headers.get('x-tenant-id');
  const userId = req.headers.get('x-user-id');

  // Option 2: From JWT token
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (token) {
    const decoded = verifyJWT(token); // Implement based on your auth
    return {
      tenantId: decoded.tenantId,
      userId: decoded.userId,
      customVars: {
        'app.user_role': decoded.role,
      },
    };
  }

  // Option 3: From session
  // const session = await getServerSession(req);
  // return { tenantId: session.user.tenantId, userId: session.user.id };

  if (!tenantId) {
    throw new Error('Tenant context required: x-tenant-id header missing');
  }

  return { tenantId, userId };
}
```

---

## Phase 4: Testing & Validation

**Duration**: 4-6 hours
**Risk Level**: Low (test environment only)

### Step 4.1: Unit Tests

```bash
# Create test environment variables
cat > .env.test <<EOF
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-test
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai-test-db-AbCdEf
DATABASE_NAME=hospitality_ai_test
AWS_REGION=us-east-1
USE_DATA_API=true
EOF

# Run tests
npm test
```

### Step 4.2: Integration Tests

Create test suite:

```typescript
// __tests__/integration/rls-tenant-isolation.test.ts
import { getRLSClient } from '@/lib/database/instance';
import { bookings } from '@/lib/database/schema';

describe('RLS Tenant Isolation', () => {
  const rlsDb = getRLSClient();

  it('should isolate tenant data', async () => {
    const tenant1Data = await rlsDb.withRLS(
      { tenantId: 'tenant-1', userId: 'user-1' },
      (tx) => tx.select().from(bookings)
    );

    const tenant2Data = await rlsDb.withRLS(
      { tenantId: 'tenant-2', userId: 'user-2' },
      (tx) => tx.select().from(bookings)
    );

    // Verify no data leakage
    expect(tenant1Data.every(b => b.tenantId === 'tenant-1')).toBe(true);
    expect(tenant2Data.every(b => b.tenantId === 'tenant-2')).toBe(true);
  });
});
```

### Step 4.3: Performance Benchmarking

```typescript
// scripts/benchmark-data-api.ts
import { getRLSClient, getRawDataApiClient } from '@/lib/database/instance';
import { bookings } from '@/lib/database/schema';

async function benchmark() {
  const rlsDb = getRLSClient();
  const iterations = 100;

  // Benchmark RLS queries
  const startTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    await rlsDb.withRLS({ tenantId: 'tenant-test' }, (tx) => {
      return tx.select().from(bookings).limit(10);
    });
  }
  const duration = Date.now() - startTime;

  console.log(`Average RLS query time: ${duration / iterations}ms`);
  console.log(`Metrics:`, rlsDb.getMetrics());
}

benchmark();
```

Expected results:
- Simple SELECT: 50-80ms
- JOIN query: 100-150ms
- RLS transaction: 150-200ms

### Step 4.4: Security Validation

```sql
-- Test RLS policies manually
-- Connect as different tenants and verify isolation

-- Test 1: Set tenant context
SET LOCAL app.current_tenant_id = 'tenant-seaside-001';
SET LOCAL app.current_user_id = 'user-miguel-123';

-- Should only see tenant-seaside-001 data
SELECT * FROM bookings;

-- Test 2: Try to access another tenant's data
SELECT * FROM bookings WHERE tenant_id = 'tenant-mountain-002';
-- Should return 0 rows (RLS blocks it)

-- Test 3: Without tenant context
RESET app.current_tenant_id;
SELECT * FROM bookings;
-- Should return 0 rows
```

---

## Phase 5: Production Deployment

**Duration**: 2-4 hours
**Risk Level**: High (production impact)

### Step 5.1: Pre-Deployment Checklist

- [ ] All tests passing in staging
- [ ] Performance benchmarks acceptable
- [ ] RLS policies validated
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring dashboard ready
- [ ] AWS alarms configured

### Step 5.2: Blue-Green Deployment

**Option A**: Gradual rollout with feature flag

```typescript
// lib/config/feature-flags.ts
export const featureFlags = {
  useDataApiPercentage: parseInt(process.env.DATA_API_ROLLOUT_PERCENTAGE || '0'),
};

// lib/database/instance.ts
export function getDbClient() {
  const rolloutPercentage = featureFlags.useDataApiPercentage;
  const randomValue = Math.random() * 100;

  if (randomValue < rolloutPercentage) {
    console.log('[DB] Using Data API');
    return getRLSClient();
  } else {
    console.log('[DB] Using traditional pg');
    return getLegacyPgClient();
  }
}
```

Rollout schedule:
1. Day 1: 10% traffic → Monitor for 24h
2. Day 2: 25% traffic → Monitor for 24h
3. Day 3: 50% traffic → Monitor for 24h
4. Day 4: 100% traffic

**Option B**: Full cutover with rollback plan

```bash
# 1. Deploy new version with DATA_API=true
kubectl set env deployment/api USE_DATA_API=true

# 2. Monitor for 15 minutes
kubectl logs -f deployment/api | grep "Database"

# 3. If issues occur, rollback immediately
kubectl set env deployment/api USE_DATA_API=false
kubectl rollout undo deployment/api
```

### Step 5.3: Monitoring Setup

```typescript
// lib/monitoring/data-api-metrics.ts
import { getRLSClient } from '@/lib/database/instance';

export function logDataApiMetrics() {
  const rlsDb = getRLSClient();
  const metrics = rlsDb.getMetrics();

  console.log('[Metrics]', {
    totalQueries: metrics.totalTransactions,
    avgLatency: metrics.avgLatencyMs,
    errorRate: metrics.errorRate,
    timestamp: new Date().toISOString(),
  });

  // Send to monitoring service (CloudWatch, DataDog, etc.)
  // await sendToCloudWatch(metrics);
}

// Run every 5 minutes
setInterval(logDataApiMetrics, 5 * 60 * 1000);
```

### Step 5.4: CloudWatch Alarms

```bash
# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name data-api-error-rate-high \
  --alarm-description "Data API error rate > 5%" \
  --metric-name ErrorRate \
  --namespace HospitalityAI/DataAPI \
  --statistic Average \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Create alarm for high latency
aws cloudwatch put-metric-alarm \
  --alarm-name data-api-latency-high \
  --alarm-description "Data API latency > 500ms" \
  --metric-name AverageLatency \
  --namespace HospitalityAI/DataAPI \
  --statistic Average \
  --period 300 \
  --threshold 500.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Rollback Strategy

### Immediate Rollback (< 5 minutes)

```bash
# 1. Switch feature flag
export USE_DATA_API=false

# 2. Restart application
kubectl rollout restart deployment/api

# 3. Verify
curl https://api.yourdomain.com/health | jq '.database.adapter'
# Should show: "pg"
```

### Data Rollback (if schema changed)

```bash
# 1. Restore from backup
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier hospitality-ai-prod \
  --target-db-cluster-identifier hospitality-ai-prod-restored \
  --restore-to-time 2024-01-15T10:00:00Z

# 2. Update connection string
export DATABASE_URL=postgresql://user:pass@restored-cluster:5432/db

# 3. Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bookings"
```

### Rollback Decision Matrix

| Issue | Severity | Rollback? | Action |
|-------|----------|-----------|--------|
| Error rate > 5% | High | Yes | Immediate rollback |
| Latency > 1000ms | High | Yes | Immediate rollback |
| RLS policy failure | Critical | Yes | Immediate rollback + data audit |
| 1-2 isolated errors | Low | No | Monitor and investigate |
| Latency 200-500ms | Medium | No | Optimize queries |

---

## Cost Analysis

### Monthly Cost Breakdown

**Before (pg + Aurora Provisioned)**:
```
Aurora db.t3.medium:    $73.00 (730h × $0.10/h)
NAT Gateway:            $32.85 ($0.045/h + data)
Total:                  $105.85/month
```

**After (Data API + Aurora Serverless v2)**:
```
Aurora Serverless v2:   $43.80 (0.5 ACU × 730h × $0.12/h)
Data API:               $3.50  (10M requests × $0.35/1M)
Secrets Manager:        $0.40  (1 secret × $0.40)
Total:                  $47.70/month
```

**Savings**: $58.15/month (55% reduction)

### Per-Request Cost

```typescript
// Cost per operation (Data API pricing: $0.35 per 1M requests)
const COST_PER_REQUEST = 0.00000035;

// Example: 1M bookings queries per month
const monthlyCost = 1_000_000 * COST_PER_REQUEST;
console.log(`Monthly Data API cost: $${monthlyCost}`); // $0.35
```

---

## Troubleshooting

### Issue 1: "Transaction not found" Error

**Cause**: Transaction timeout (default: 60 seconds)

**Solution**:
```typescript
const rlsDb = new DrizzleRLSClient({
  resourceArn: process.env.DB_CLUSTER_ARN!,
  secretArn: process.env.DB_SECRET_ARN!,
  database: process.env.DATABASE_NAME!,
  timeout: 120000, // Increase to 2 minutes
});
```

### Issue 2: "ThrottlingException" Error

**Cause**: Too many concurrent Data API requests

**Solution**: Implement exponential backoff

```typescript
import { retry } from '@aws-sdk/util-retry';

const client = new RDSDataClient({
  region: 'us-east-1',
  maxAttempts: 5,
  retryStrategy: retry.DEFAULT_RETRY_STRATEGY,
});
```

### Issue 3: RLS Policy Not Working

**Cause**: Session variables not set or transaction not used

**Debug**:
```sql
-- Check current session variables
SHOW app.current_tenant_id;
SHOW app.current_user_id;

-- Manually test RLS
SET LOCAL app.current_tenant_id = 'test-tenant';
SELECT * FROM bookings; -- Should see only test-tenant data
```

### Issue 4: High Latency

**Cause**: N+1 query problem or missing indexes

**Solution**:
```typescript
// Bad: N+1 queries
for (const booking of bookings) {
  const property = await tx.select().from(entities).where(eq(entities.id, booking.propertyId));
}

// Good: Single JOIN
const results = await tx
  .select()
  .from(bookings)
  .leftJoin(entities, eq(bookings.propertyId, entities.id));
```

---

## Validation Checklist

### Pre-Production

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] RLS isolation validated
- [ ] Performance benchmarks acceptable
- [ ] Monitoring dashboard configured
- [ ] Rollback plan documented
- [ ] Team trained on new architecture

### Post-Production (Monitor for 7 days)

- [ ] Error rate < 1%
- [ ] Average latency < 300ms
- [ ] No RLS policy violations
- [ ] Cost tracking accurate
- [ ] CloudWatch alarms configured
- [ ] No data leakage incidents

---

## Next Steps

1. **Review this guide** with your team
2. **Set up staging environment** for testing
3. **Run Phase 1** (Infrastructure Setup)
4. **Test thoroughly** in staging (Phase 4)
5. **Plan production deployment** (Phase 5)
6. **Monitor closely** for first week

## Additional Resources

- [AWS Data API Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html)
- [Drizzle ORM AWS Data API Guide](https://orm.drizzle.team/docs/get-started-aws-data-api)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PayloadCMS Custom Adapters](https://payloadcms.com/docs/database/overview)

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review `.agent/docs/rls-integration-examples.md`
3. Consult `.agent/docs/data-api-rls-session-variables.md`
4. Open an issue in the project repository
