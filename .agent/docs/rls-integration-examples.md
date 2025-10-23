# RLS Integration Examples

Complete examples showing how to use `DrizzleRLSClient` with AWS Data API for multi-tenant applications.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Next.js API Routes](#nextjs-api-routes)
3. [Express.js Integration](#expressjs-integration)
4. [PayloadCMS Custom Endpoints](#payloadcms-custom-endpoints)
5. [Testing RLS Policies](#testing-rls-policies)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)

---

## Basic Setup

### 1. Environment Variables

```bash
# .env.local
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai/dev/db-credentials-AbCdEf
DATABASE_NAME=hospitality_ai
AWS_REGION=us-east-1
USE_DATA_API=true

# Enable debug logging for development
DEBUG_DATA_API=true
```

### 2. Create RLS Client Instance

```typescript
// lib/database/instance.ts
import { DrizzleRLSClient } from './drizzle-rls-client';

// Singleton instance
let rlsDbInstance: DrizzleRLSClient | null = null;

export function getRLSClient(): DrizzleRLSClient {
  if (!rlsDbInstance) {
    rlsDbInstance = new DrizzleRLSClient({
      resourceArn: process.env.DB_CLUSTER_ARN!,
      secretArn: process.env.DB_SECRET_ARN!,
      database: process.env.DATABASE_NAME!,
      region: process.env.AWS_REGION,
      debug: process.env.DEBUG_DATA_API === 'true',
      strictMode: true, // Require tenantId for all queries
    });
  }
  return rlsDbInstance;
}
```

### 3. Define Drizzle Schema

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

---

## Next.js API Routes

### Example 1: Get Guest Bookings

```typescript
// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRLSClient } from '@/lib/database/instance';
import { bookings, entities } from '@/lib/database/schema';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const rlsDb = getRLSClient();
    const context = extractRLSContext(req);

    // All queries within this block are tenant-isolated
    const results = await rlsDb.withRLS(context, async (tx) => {
      return tx
        .select({
          id: bookings.id,
          propertyName: entities.name,
          checkIn: bookings.checkIn,
          checkOut: bookings.checkOut,
          status: bookings.status,
          totalAmount: bookings.totalAmount,
        })
        .from(bookings)
        .leftJoin(entities, eq(bookings.propertyId, entities.id))
        .where(eq(bookings.guestId, context.userId!));
    });

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('[API] Get bookings failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Example 2: Create Booking with Validation

```typescript
// app/api/bookings/route.ts (POST)
import { NextRequest, NextResponse } from 'next/server';
import { getRLSClient } from '@/lib/database/instance';
import { bookings, entities } from '@/lib/database/schema';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { eq, and, between } from 'drizzle-orm';

interface CreateBookingRequest {
  propertyId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

export async function POST(req: NextRequest) {
  try {
    const rlsDb = getRLSClient();
    const context = extractRLSContext(req);
    const body: CreateBookingRequest = await req.json();

    // Validate request
    if (!body.propertyId || !body.roomId || !body.checkIn || !body.checkOut) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Execute multiple operations in a single RLS transaction
    const result = await rlsDb.withRLS(context, async (tx) => {
      // 1. Check room availability
      const conflictingBookings = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.roomId, body.roomId),
            eq(bookings.status, 'confirmed'),
            // Date range overlap check
            between(bookings.checkIn, body.checkIn, body.checkOut)
          )
        )
        .limit(1);

      if (conflictingBookings.length > 0) {
        throw new Error('Room is not available for selected dates');
      }

      // 2. Get room pricing
      const room = await tx
        .select({
          id: entities.id,
          name: entities.name,
          metadata: entities.metadata,
        })
        .from(entities)
        .where(eq(entities.id, body.roomId))
        .limit(1);

      if (room.length === 0) {
        throw new Error('Room not found');
      }

      const basePrice = (room[0].metadata as any)?.base_price || 100;
      const nights = Math.ceil(
        (new Date(body.checkOut).getTime() - new Date(body.checkIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalAmount = basePrice * nights;

      // 3. Create booking
      const newBooking = await tx
        .insert(bookings)
        .values({
          tenantId: context.tenantId,
          propertyId: body.propertyId,
          roomId: body.roomId,
          guestId: context.userId!,
          checkIn: body.checkIn,
          checkOut: body.checkOut,
          status: 'confirmed',
          totalAmount: totalAmount.toString(),
          createdBy: context.userId!,
          metadata: { guestCount: body.guestCount },
        })
        .returning();

      return newBooking[0];
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Create booking failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Example 3: Batch Operations

```typescript
// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRLSClient } from '@/lib/database/instance';
import { bookings, entities } from '@/lib/database/schema';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { eq, count, sum, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const rlsDb = getRLSClient();
    const context = extractRLSContext(req);

    // Execute multiple independent queries in a single transaction
    const [properties, bookingStats, revenueStats, upcomingBookings] = await rlsDb.batchWithRLS(
      context,
      [
        // Query 1: Get all properties
        (tx) =>
          tx
            .select({
              id: entities.id,
              name: entities.name,
              metadata: entities.metadata,
            })
            .from(entities)
            .where(eq(entities.entityType, 'property')),

        // Query 2: Get booking counts by status
        (tx) =>
          tx
            .select({
              status: bookings.status,
              count: count(),
            })
            .from(bookings)
            .groupBy(bookings.status),

        // Query 3: Get revenue statistics
        (tx) =>
          tx
            .select({
              totalRevenue: sum(bookings.totalAmount),
              avgBookingValue: sql<number>`AVG(${bookings.totalAmount})`,
            })
            .from(bookings)
            .where(eq(bookings.status, 'confirmed')),

        // Query 4: Get upcoming bookings
        (tx) =>
          tx
            .select({
              id: bookings.id,
              propertyName: entities.name,
              checkIn: bookings.checkIn,
              checkOut: bookings.checkOut,
            })
            .from(bookings)
            .leftJoin(entities, eq(bookings.propertyId, entities.id))
            .where(gte(bookings.checkIn, new Date().toISOString().split('T')[0]))
            .limit(10),
      ]
    );

    return NextResponse.json({
      success: true,
      data: {
        properties,
        bookingStats,
        revenueStats: revenueStats[0],
        upcomingBookings,
      },
    });
  } catch (error) {
    console.error('[API] Dashboard data fetch failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

## Express.js Integration

### Middleware for RLS Context

```typescript
// middleware/rls-context.ts
import { Request, Response, NextFunction } from 'express';
import { RLSContext } from '@/lib/database/drizzle-rls-client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      rlsContext?: RLSContext;
    }
  }
}

export function extractRLSContextMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract from JWT token (assuming you're using JWT auth)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    // Decode JWT (use your actual JWT library)
    const decoded = verifyJWT(token); // Implement this based on your auth system

    req.rlsContext = {
      tenantId: decoded.tenantId,
      userId: decoded.userId,
      customVars: {
        'app.user_role': decoded.role || 'guest',
      },
    };

    next();
  } catch (error) {
    console.error('[Middleware] RLS context extraction failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Dummy JWT verification (replace with your actual implementation)
function verifyJWT(token: string): { tenantId: string; userId: string; role?: string } {
  // Example: Use jsonwebtoken library
  // return jwt.verify(token, process.env.JWT_SECRET);
  throw new Error('Implement JWT verification');
}
```

### Express Route Example

```typescript
// routes/bookings.ts
import express from 'express';
import { getRLSClient } from '@/lib/database/instance';
import { bookings } from '@/lib/database/schema';
import { extractRLSContextMiddleware } from '@/middleware/rls-context';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Apply RLS context middleware to all routes
router.use(extractRLSContextMiddleware);

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const rlsDb = getRLSClient();
    const context = req.rlsContext!;

    const results = await rlsDb.withRLS(context, async (tx) => {
      return tx
        .select()
        .from(bookings)
        .where(eq(bookings.guestId, context.userId!));
    });

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[Express] Get bookings failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const rlsDb = getRLSClient();
    const context = req.rlsContext!;

    const result = await rlsDb.withRLS(context, async (tx) => {
      return tx
        .insert(bookings)
        .values({
          ...req.body,
          tenantId: context.tenantId,
          guestId: context.userId!,
          createdBy: context.userId!,
        })
        .returning();
    });

    res.status(201).json({ success: true, data: result[0] });
  } catch (error) {
    console.error('[Express] Create booking failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

---

## PayloadCMS Custom Endpoints

### Custom Endpoint for Tenant-Isolated Data

```typescript
// payload/endpoints/tenant-bookings.ts
import { Endpoint } from 'payload/config';
import { getRLSClient } from '@/lib/database/instance';
import { bookings, entities } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export const tenantBookingsEndpoint: Endpoint = {
  path: '/tenant-bookings',
  method: 'get',
  handler: async (req, res) => {
    try {
      // Extract tenant context from PayloadCMS user
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const rlsDb = getRLSClient();
      const context = {
        tenantId: req.user.tenant?.id || 'unknown',
        userId: req.user.id,
      };

      const results = await rlsDb.withRLS(context, async (tx) => {
        return tx
          .select({
            id: bookings.id,
            propertyName: entities.name,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
            status: bookings.status,
            totalAmount: bookings.totalAmount,
          })
          .from(bookings)
          .leftJoin(entities, eq(bookings.propertyId, entities.id));
      });

      return res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('[PayloadCMS] Tenant bookings endpoint failed:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};
```

### Add to PayloadCMS Config

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config';
import { tenantBookingsEndpoint } from './payload/endpoints/tenant-bookings';

export default buildConfig({
  // ... other config
  endpoints: [tenantBookingsEndpoint],
});
```

---

## Testing RLS Policies

### Unit Tests with Jest

```typescript
// lib/database/__tests__/drizzle-rls-client.test.ts
import { DrizzleRLSClient, RLSContext } from '../drizzle-rls-client';
import { bookings, entities } from '../schema';
import { eq } from 'drizzle-orm';

describe('DrizzleRLSClient', () => {
  let rlsDb: DrizzleRLSClient;
  const tenant1Context: RLSContext = {
    tenantId: 'tenant-seaside-001',
    userId: 'user-miguel-123',
  };
  const tenant2Context: RLSContext = {
    tenantId: 'tenant-mountain-002',
    userId: 'user-jane-789',
  };

  beforeAll(() => {
    rlsDb = new DrizzleRLSClient({
      resourceArn: process.env.TEST_DB_CLUSTER_ARN!,
      secretArn: process.env.TEST_DB_SECRET_ARN!,
      database: process.env.TEST_DATABASE_NAME!,
      debug: true,
    });
  });

  describe('Tenant Isolation', () => {
    it('should only return tenant 1 bookings for tenant 1 user', async () => {
      const results = await rlsDb.withRLS(tenant1Context, async (tx) => {
        return tx.select().from(bookings);
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach((booking) => {
        expect(booking.tenantId).toBe('tenant-seaside-001');
      });
    });

    it('should only return tenant 2 bookings for tenant 2 user', async () => {
      const results = await rlsDb.withRLS(tenant2Context, async (tx) => {
        return tx.select().from(bookings);
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach((booking) => {
        expect(booking.tenantId).toBe('tenant-mountain-002');
      });
    });

    it('should not allow cross-tenant data access', async () => {
      // Try to query tenant 2 data with tenant 1 context
      const results = await rlsDb.withRLS(tenant1Context, async (tx) => {
        return tx.select().from(bookings).where(eq(bookings.tenantId, 'tenant-mountain-002'));
      });

      // RLS policy should prevent seeing tenant 2 data
      expect(results.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when tenantId is missing in strict mode', async () => {
      await expect(
        rlsDb.withRLS({ tenantId: '' } as RLSContext, async (tx) => {
          return tx.select().from(bookings);
        })
      ).rejects.toThrow('tenantId is required in strict mode');
    });

    it('should validate tenantId format', async () => {
      await expect(
        rlsDb.withRLS({ tenantId: "tenant'; DROP TABLE bookings;--" }, async (tx) => {
          return tx.select().from(bookings);
        })
      ).rejects.toThrow('tenantId contains invalid characters');
    });
  });

  describe('Performance Metrics', () => {
    it('should track query metrics', async () => {
      rlsDb.resetMetrics();

      await rlsDb.withRLS(tenant1Context, async (tx) => {
        return tx.select().from(bookings);
      });

      const metrics = rlsDb.getMetrics();
      expect(metrics.totalTransactions).toBe(1);
      expect(metrics.totalContextSets).toBe(1);
      expect(metrics.avgLatencyMs).toBeGreaterThan(0);
    });
  });
});
```

### Integration Tests

```typescript
// lib/database/__tests__/rls-integration.test.ts
import { DrizzleRLSClient } from '../drizzle-rls-client';
import { bookings, entities } from '../schema';
import { eq } from 'drizzle-orm';

describe('RLS Integration Tests', () => {
  let rlsDb: DrizzleRLSClient;

  beforeAll(() => {
    rlsDb = new DrizzleRLSClient({
      resourceArn: process.env.TEST_DB_CLUSTER_ARN!,
      secretArn: process.env.TEST_DB_SECRET_ARN!,
      database: process.env.TEST_DATABASE_NAME!,
    });
  });

  it('should handle complex multi-table queries with RLS', async () => {
    const context = { tenantId: 'tenant-seaside-001', userId: 'user-miguel-123' };

    const results = await rlsDb.withRLS(context, async (tx) => {
      return tx
        .select({
          bookingId: bookings.id,
          propertyName: entities.name,
          checkIn: bookings.checkIn,
          totalAmount: bookings.totalAmount,
        })
        .from(bookings)
        .leftJoin(entities, eq(bookings.propertyId, entities.id))
        .where(eq(bookings.guestId, context.userId));
    });

    expect(results.length).toBeGreaterThan(0);
    results.forEach((result) => {
      expect(result.propertyName).toBeDefined();
    });
  });

  it('should handle batch operations efficiently', async () => {
    const context = { tenantId: 'tenant-seaside-001', userId: 'user-miguel-123' };

    const [allBookings, confirmedBookings, properties] = await rlsDb.batchWithRLS(context, [
      (tx) => tx.select().from(bookings),
      (tx) => tx.select().from(bookings).where(eq(bookings.status, 'confirmed')),
      (tx) => tx.select().from(entities).where(eq(entities.entityType, 'property')),
    ]);

    expect(allBookings.length).toBeGreaterThanOrEqual(confirmedBookings.length);
    expect(properties.length).toBeGreaterThan(0);
  });
});
```

---

## Performance Optimization

### 1. Connection Reuse

```typescript
// lib/database/instance.ts
let rlsDbInstance: DrizzleRLSClient | null = null;

export function getRLSClient(): DrizzleRLSClient {
  if (!rlsDbInstance) {
    rlsDbInstance = new DrizzleRLSClient({
      resourceArn: process.env.DB_CLUSTER_ARN!,
      secretArn: process.env.DB_SECRET_ARN!,
      database: process.env.DATABASE_NAME!,
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return rlsDbInstance;
}
```

### 2. Query Result Caching

```typescript
// lib/database/cached-rls-client.ts
import { getRLSClient } from './instance';
import { RLSContext } from './drizzle-rls-client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 60000; // 1 minute

export async function withCachedRLS<T>(
  context: RLSContext,
  cacheKey: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Cache] Hit:', cacheKey);
    return cached.data;
  }

  // Execute query
  const rlsDb = getRLSClient();
  const result = await rlsDb.withRLS(context, callback);

  // Store in cache
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  console.log('[Cache] Miss:', cacheKey);

  return result;
}

// Clear cache on data mutations
export function invalidateCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}
```

### 3. Prepared Statements (Future Enhancement)

```typescript
// Note: AWS Data API doesn't support traditional prepared statements
// But you can pre-compile Drizzle queries for reuse

import { bookings } from './schema';
import { eq } from 'drizzle-orm';

// Pre-compiled query builder
export function createBookingsByGuestQuery(guestId: string) {
  return (tx: any) => tx.select().from(bookings).where(eq(bookings.guestId, guestId));
}

// Usage
const query = createBookingsByGuestQuery('user-miguel-123');
const results = await rlsDb.withRLS(context, query);
```

---

## Error Handling

### Comprehensive Error Handler

```typescript
// lib/database/error-handler.ts
import { RLSError } from './drizzle-rls-client';

export class DatabaseError extends Error {
  constructor(
    public code: string,
    public message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('[Database] Operation failed:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // RDS Data API throttling
      if (error.message.includes('ThrottlingException')) {
        throw new DatabaseError('THROTTLED', 'Database request throttled. Please retry.', error);
      }

      // RLS validation errors
      if (error.message.includes('tenantId')) {
        throw new DatabaseError('INVALID_CONTEXT', 'Invalid tenant context provided', error);
      }

      // Transaction errors
      if (error.message.includes('Transaction')) {
        throw new DatabaseError('TRANSACTION_FAILED', 'Database transaction failed', error);
      }

      // Generic database error
      throw new DatabaseError('DB_ERROR', error.message, error);
    }

    throw new DatabaseError('UNKNOWN_ERROR', 'An unknown error occurred');
  }
}
```

### Usage in API Routes

```typescript
// app/api/bookings/route.ts
import { withErrorHandling, DatabaseError } from '@/lib/database/error-handler';

export async function GET(req: NextRequest) {
  try {
    const results = await withErrorHandling(async () => {
      const rlsDb = getRLSClient();
      const context = extractRLSContext(req);
      return rlsDb.withRLS(context, async (tx) => {
        return tx.select().from(bookings);
      });
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.code === 'INVALID_CONTEXT' ? 400 : 500 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Summary

This guide demonstrates how to integrate `DrizzleRLSClient` with:

1. **Next.js API Routes** - Server-side rendering and API endpoints
2. **Express.js** - Traditional Node.js backend
3. **PayloadCMS** - Custom endpoints with tenant isolation
4. **Testing** - Unit and integration tests for RLS policies
5. **Performance** - Caching strategies and query optimization
6. **Error Handling** - Comprehensive error management

### Key Takeaways

- **Always use `withRLS()`** for tenant-isolated queries
- **Extract RLS context early** in your request pipeline
- **Use `batchWithRLS()`** for multiple independent queries
- **Cache results** when appropriate to reduce Data API calls
- **Handle errors gracefully** with specific error codes
- **Test tenant isolation** thoroughly before production

### Cost Per Operation

Based on AWS Data API pricing:

- Simple SELECT: ~$0.00035 (50ms average)
- Complex JOIN: ~$0.00070 (100ms average)
- Transaction with RLS: ~$0.00105 (150ms average)
- Batch operation (3 queries): ~$0.00210 (300ms average)

**Cost optimization**: Use `batchWithRLS()` to reduce transaction overhead when executing multiple queries.
