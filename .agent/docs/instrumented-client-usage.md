# Instrumented RDS Client - Usage Guide

## Overview

The **Instrumented RDS Client** provides **centralized, automatic tenant metrics collection** across ALL services without manual instrumentation.

**Key Benefits:**
- ✅ **Single source of truth** - One client used everywhere
- ✅ **Zero instrumentation** - No middleware or wrappers needed
- ✅ **Automatic tracking** - Metrics published on every database operation
- ✅ **Works everywhere** - Lambdas, PayloadCMS, Next.js, any Node.js service

---

## Installation

The instrumented client is already available in your project:

```typescript
import { getInstrumentedClient, getInstrumentedDb } from '@/lib/database/instrumented-rds-client';
```

---

## Usage Across Different Services

### 1. Lambda Functions

**Before (Manual tracking):**
```typescript
import { withCloudWatchMetrics } from '@/lib/middleware/cloudwatch-metrics';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';

export const handler = withCloudWatchMetrics(async (event) => {
  // Manual setup...
  const db = drizzle(client, {...});
  // Query...
});
```

**After (Automatic tracking):**
```typescript
import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

export const handler = async (event: any) => {
  const tenantId = event.headers['x-tenant-id'];
  const db = getInstrumentedClient();

  // ✅ Automatically tracked!
  const bookings = await db.withRLS(
    { tenantId },
    async (tx) => {
      return tx.select().from(bookingsTable);
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify(bookings),
  };
};
```

---

### 2. PayloadCMS Collections

**Payload Config:**
```typescript
// payload.config.ts

import { getInstrumentedDb } from '@/lib/database/instrumented-rds-client';
import { buildConfig } from 'payload/config';

export default buildConfig({
  // ... other config

  // Use instrumented database
  db: getInstrumentedDb(),

  // PayloadCMS will use this for all operations
  // ✅ All queries automatically tracked!
});
```

**Collection Hooks:**
```typescript
// collections/Bookings.ts

import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

const Bookings: CollectionConfig = {
  slug: 'bookings',

  hooks: {
    beforeOperation: [
      async ({ operation, req }) => {
        const tenantId = req.user?.tenantId;

        if (tenantId && req.context) {
          const db = getInstrumentedClient();

          // Set RLS context for this operation
          req.context.rlsContext = { tenantId };

          // ✅ All subsequent queries tracked!
        }
      },
    ],
  },

  access: {
    read: async ({ req }) => {
      const db = getInstrumentedClient();

      // Use RLS-protected queries
      return await db.withRLS(
        { tenantId: req.user!.tenantId },
        async (tx) => {
          // Access control logic
          return true;
        }
      );
    },
  },
};

export default Bookings;
```

---

### 3. Next.js API Routes

**Before:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withCloudWatchMetrics } from '@/lib/middleware/cloudwatch-metrics';

export const GET = withCloudWatchMetrics(async (req: NextRequest) => {
  // ...
});
```

**After:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id');
  const db = getInstrumentedClient();

  // ✅ Automatically tracked!
  const bookings = await db.withRLS(
    { tenantId: tenantId! },
    async (tx) => {
      return tx.select().from(bookingsTable).limit(10);
    }
  );

  return NextResponse.json(bookings);
}
```

---

### 4. Next.js Server Actions

```typescript
'use server';

import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';
import { cookies } from 'next/headers';

export async function getBookings() {
  const cookieStore = cookies();
  const tenantId = cookieStore.get('tenantId')?.value;

  if (!tenantId) {
    throw new Error('Tenant ID required');
  }

  const db = getInstrumentedClient();

  // ✅ Automatically tracked!
  return await db.withRLS(
    { tenantId },
    async (tx) => {
      return tx.select().from(bookingsTable);
    }
  );
}
```

---

### 5. Background Jobs / Cron

```typescript
// jobs/daily-report.ts

import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

export async function generateDailyReports() {
  const db = getInstrumentedClient();

  // Get all tenants
  const tenants = await db.raw
    .select({ id: tenantsTable.id })
    .from(tenantsTable);

  for (const tenant of tenants) {
    // ✅ Each tenant query automatically tracked!
    await db.withRLS(
      { tenantId: tenant.id },
      async (tx) => {
        const bookings = await tx
          .select()
          .from(bookingsTable)
          .where(eq(bookingsTable.createdAt, today));

        // Generate report...
      }
    );
  }
}
```

---

### 6. GraphQL Resolvers

```typescript
// graphql/resolvers/bookings.ts

import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

export const bookingsResolver = {
  Query: {
    bookings: async (_parent: any, _args: any, context: any) => {
      const tenantId = context.user.tenantId;
      const db = getInstrumentedClient();

      // ✅ Automatically tracked!
      return await db.withRLS(
        { tenantId },
        async (tx) => {
          return tx.select().from(bookingsTable);
        }
      );
    },
  },
};
```

---

### 7. tRPC Procedures

```typescript
// trpc/routers/bookings.ts

import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';
import { z } from 'zod';

export const bookingsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = getInstrumentedClient();

      // ✅ Automatically tracked!
      return await db.withRLS(
        { tenantId: ctx.user.tenantId },
        async (tx) => {
          return tx
            .select()
            .from(bookingsTable)
            .limit(input.limit || 10);
        }
      );
    }),
});
```

---

## Advanced Usage

### Batch Operations

Execute multiple operations in a single transaction:

```typescript
const db = getInstrumentedClient();

const [bookings, payments, stats] = await db.batchWithRLS(
  { tenantId: 'tenant-123' },
  [
    (tx) => tx.select().from(bookingsTable),
    (tx) => tx.select().from(paymentsTable),
    (tx) => tx.select({ count: count() }).from(bookingsTable),
  ]
);

// ✅ All operations tracked as a single logical operation
```

### Custom Session Variables

```typescript
const db = getInstrumentedClient();

await db.withRLS(
  {
    tenantId: 'tenant-123',
    userId: 'user-456',
    customVars: {
      'app.user_role': 'admin',
      'app.department_id': 'sales',
    },
  },
  async (tx) => {
    // Use custom variables in RLS policies
    return tx.select().from(bookingsTable);
  }
);
```

### Admin Operations (Bypass RLS)

```typescript
const db = getInstrumentedClient();

// ⚠️ WARNING: Bypasses RLS - use only for admin operations
const allTenants = await db.raw
  .select()
  .from(tenantsTable);

// ✅ Still tracked for metrics (tenant_id will be null)
```

---

## Configuration Options

### Custom Configuration

```typescript
import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

const db = getInstrumentedClient({
  resourceArn: process.env.DB_CLUSTER_ARN!,
  secretArn: process.env.DB_SECRET_ARN!,
  database: process.env.DATABASE_NAME!,
  region: 'us-west-2',
  debug: true, // Enable debug logging
  enableMetrics: true, // Enable CloudWatch metrics (default: true)
  metricsNamespace: 'MyApp/Database', // Custom namespace
});
```

### Disable Metrics (Testing)

```typescript
const db = getInstrumentedClient({
  // ... config
  enableMetrics: false, // Disable metrics publishing
});
```

---

## Environment Variables

Required environment variables:

```bash
# Database configuration
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:my-cluster
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret
DATABASE_NAME=hospitality_db

# AWS region (optional, defaults to AWS_REGION or us-east-1)
AWS_REGION=us-east-1

# Node environment (optional, enables debug in development)
NODE_ENV=production
```

---

## Migration Guide

### From Manual CloudWatch Middleware

**Old approach:**
```typescript
// ❌ Remove these files
// lib/middleware/cloudwatch-metrics.ts
// Manually wrapping every handler

export const GET = withCloudWatchMetrics(async (req) => {
  // ...
});
```

**New approach:**
```typescript
// ✅ Just use instrumented client
import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

export async function GET(req: Request) {
  const db = getInstrumentedClient();
  // Automatically tracked!
}
```

### From DrizzleRLSClient

**Old approach:**
```typescript
import { createRLSClient } from '@/lib/database/drizzle-rls-client';

const rlsDb = createRLSClient({ ... });
const bookings = await rlsDb.withRLS({ tenantId }, async (tx) => { ... });
```

**New approach:**
```typescript
import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

const db = getInstrumentedClient();
const bookings = await db.withRLS({ tenantId }, async (tx) => { ... });
// ✅ Same API + automatic metrics!
```

---

## Metrics Published

For every database operation, the following metrics are automatically published to CloudWatch:

**Namespace:** `HospitalityAI/Tenants` (configurable)

**Dimensions:**
- `TenantId`: Extracted from RLS context
- `Endpoint`: `rds-data-api`
- `Method`: `ExecuteStatementCommand`, `BatchExecuteStatementCommand`, etc.

**Metrics:**
- `RequestCount`: Number of database operations
- `ResponseTime`: Operation duration in milliseconds
- `BytesTransferred`: Estimated response size
- `ErrorCount`: Failed operations
- `SuccessCount`: Successful operations

---

## Monitoring Your Metrics

### CloudWatch Console

1. Navigate to **CloudWatch → Metrics → Custom namespaces**
2. Select **HospitalityAI/Tenants**
3. View metrics by:
   - Tenant ID
   - Operation type
   - Time range

### Query Examples

**Total requests per tenant:**
```
SELECT SUM(RequestCount)
FROM SCHEMA("HospitalityAI/Tenants", TenantId)
GROUP BY TenantId
```

**Average response time by tenant:**
```
SELECT AVG(ResponseTime)
FROM SCHEMA("HospitalityAI/Tenants", TenantId)
GROUP BY TenantId
```

**Error rate:**
```
SELECT
  SUM(ErrorCount) / SUM(RequestCount) * 100 as ErrorRate
FROM SCHEMA("HospitalityAI/Tenants", TenantId)
GROUP BY TenantId
```

---

## Best Practices

### 1. Always Use RLS Context

```typescript
// ✅ Good - tenant isolated
await db.withRLS({ tenantId }, async (tx) => {
  return tx.select().from(bookingsTable);
});

// ❌ Bad - bypasses RLS and tenant tracking
await db.raw.select().from(bookingsTable);
```

### 2. Extract Tenant ID Early

```typescript
// Extract once at entry point
export async function GET(req: Request) {
  const tenantId = req.headers.get('x-tenant-id');

  if (!tenantId) {
    return Response.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  // Use throughout handler
  const db = getInstrumentedClient();
  await db.withRLS({ tenantId }, async (tx) => { ... });
}
```

### 3. Use Singleton Pattern

```typescript
// ✅ Good - reuse singleton
const db = getInstrumentedClient();

// ❌ Bad - creates new client every time
const db = new InstrumentedRDSClient({ ... });
```

### 4. Handle Errors Gracefully

```typescript
try {
  await db.withRLS({ tenantId }, async (tx) => {
    // Database operations
  });
} catch (error) {
  // Error metrics automatically tracked!
  console.error('Database operation failed:', error);
  throw error;
}
```

---

## Troubleshooting

### Metrics Not Appearing

1. **Check CloudWatch permissions:**
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "cloudwatch:PutMetricData"
     ],
     "Resource": "*"
   }
   ```

2. **Verify tenant ID is being set:**
   ```typescript
   const db = getInstrumentedClient({ debug: true });
   // Check logs for "Set tenant context: ..."
   ```

3. **Check CloudWatch namespace:**
   ```typescript
   // Make sure you're looking in the right namespace
   const db = getInstrumentedClient({
     metricsNamespace: 'HospitalityAI/Tenants'
   });
   ```

### High Latency

If you notice increased latency:

1. **Disable metrics temporarily:**
   ```typescript
   const db = getInstrumentedClient({ enableMetrics: false });
   ```

2. **Check CloudWatch publisher queue:**
   ```typescript
   const publisher = getCloudWatchPublisher();
   console.log('Queue size:', publisher.getQueueSize());
   ```

3. **Metrics are async (fire-and-forget)** - should not block queries

---

## Testing

### Unit Tests

```typescript
import { resetInstrumentedClient, getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

describe('BookingsService', () => {
  beforeEach(() => {
    // Reset singleton between tests
    resetInstrumentedClient();
  });

  it('should fetch bookings with RLS', async () => {
    const db = getInstrumentedClient({
      enableMetrics: false, // Disable metrics in tests
    });

    const bookings = await db.withRLS(
      { tenantId: 'test-tenant' },
      async (tx) => tx.select().from(bookingsTable)
    );

    expect(bookings).toBeDefined();
  });
});
```

---

## Performance Impact

**Metrics collection overhead:**
- Client interception: <1ms
- Tenant extraction: <0.1ms
- Metrics publishing: Async (non-blocking)

**Total impact:** <1ms per database operation (negligible)

---

## Summary

The Instrumented RDS Client provides:

✅ **Centralized metrics** - One place for all tracking
✅ **Zero instrumentation** - No manual middleware needed
✅ **Universal compatibility** - Works everywhere
✅ **Automatic tenant tracking** - Extract from RLS context
✅ **Full RLS support** - Tenant isolation built-in
✅ **Minimal overhead** - <1ms per operation
✅ **CloudWatch integration** - Native dashboards and alerts

**Migration is simple:** Replace your database client with `getInstrumentedClient()` and remove manual middleware!
