/**
 * Instrumented RDS Client - Real-World Examples
 *
 * This file demonstrates how to use the instrumented client
 * across different service types and frameworks.
 */

import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';
import { bookingsTable, propertiesTable, tenantsTable } from '@/lib/database/schema';
import { eq, and, gte } from 'drizzle-orm';

// ============================================================================
// Example 1: Lambda Function (AWS Lambda)
// ============================================================================

/**
 * Lambda handler for listing bookings
 *
 * ✅ Metrics automatically tracked - no middleware needed!
 */
export const listBookingsLambda = async (event: any) => {
  const tenantId = event.headers['x-tenant-id'];
  const userId = event.requestContext.authorizer?.userId;

  if (!tenantId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Tenant ID required' }),
    };
  }

  const db = getInstrumentedClient();

  try {
    // ✅ Automatically tracked: tenant, operation, duration, status
    const bookings = await db.withRLS(
      { tenantId, userId },
      async (tx) => {
        return tx
          .select()
          .from(bookingsTable)
          .where(eq(bookingsTable.status, 'confirmed'))
          .limit(50);
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(bookings),
    };
  } catch (error: any) {
    // ✅ Error metrics automatically tracked too!
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// ============================================================================
// Example 2: Next.js API Route
// ============================================================================

/**
 * Next.js API route for creating bookings
 *
 * ✅ No withCloudWatchMetrics wrapper needed!
 */
export async function createBookingApi(req: Request) {
  const tenantId = req.headers.get('x-tenant-id');
  const body = await req.json();

  if (!tenantId) {
    return Response.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  const db = getInstrumentedClient();

  try {
    // ✅ Metrics tracked automatically
    const newBooking = await db.withRLS(
      { tenantId },
      async (tx) => {
        return tx
          .insert(bookingsTable)
          .values({
            ...body,
            tenantId,
            createdAt: new Date(),
          })
          .returning();
      }
    );

    return Response.json(newBooking[0], { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// Example 3: Next.js Server Action
// ============================================================================

/**
 * Server action for updating booking status
 *
 * ✅ Works seamlessly with Server Actions
 */
'use server';

export async function updateBookingStatus(bookingId: string, status: string) {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  const tenantId = cookieStore.get('tenantId')?.value;

  if (!tenantId) {
    throw new Error('Authentication required');
  }

  const db = getInstrumentedClient();

  // ✅ Automatically tracked
  return await db.withRLS(
    { tenantId },
    async (tx) => {
      return tx
        .update(bookingsTable)
        .set({ status, updatedAt: new Date() })
        .where(
          and(
            eq(bookingsTable.id, bookingId),
            eq(bookingsTable.tenantId, tenantId)
          )
        )
        .returning();
    }
  );
}

// ============================================================================
// Example 4: PayloadCMS Collection Hook
// ============================================================================

/**
 * PayloadCMS collection with RLS and automatic tracking
 */
import type { CollectionConfig } from 'payload/types';

export const BookingsCollection: CollectionConfig = {
  slug: 'bookings',

  hooks: {
    beforeOperation: [
      async ({ operation, req }) => {
        const tenantId = req.user?.tenantId;

        if (tenantId) {
          const db = getInstrumentedClient();

          // Inject tenant context for all operations
          req.context = {
            ...req.context,
            tenantId,
            db,
          };
        }
      },
    ],

    // Custom query with RLS
    beforeRead: [
      async ({ req }) => {
        if (!req.context?.tenantId) {
          throw new Error('Tenant context required');
        }

        const db = req.context.db as ReturnType<typeof getInstrumentedClient>;

        // ✅ Automatically tracked
        const results = await db.withRLS(
          { tenantId: req.context.tenantId },
          async (tx) => {
            return tx
              .select()
              .from(bookingsTable)
              .where(eq(bookingsTable.tenantId, req.context.tenantId));
          }
        );

        return results;
      },
    ],
  },

  fields: [
    {
      name: 'guestName',
      type: 'text',
      required: true,
    },
    {
      name: 'checkIn',
      type: 'date',
      required: true,
    },
    {
      name: 'checkOut',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'confirmed', 'cancelled'],
      defaultValue: 'pending',
    },
  ],
};

// ============================================================================
// Example 5: GraphQL Resolver
// ============================================================================

/**
 * GraphQL resolver with RLS
 */
export const bookingsResolvers = {
  Query: {
    bookings: async (_parent: any, args: any, context: any) => {
      const { tenantId, userId } = context.user;
      const db = getInstrumentedClient();

      // ✅ Automatically tracked
      return await db.withRLS(
        { tenantId, userId },
        async (tx) => {
          let query = tx.select().from(bookingsTable);

          if (args.status) {
            query = query.where(eq(bookingsTable.status, args.status));
          }

          if (args.startDate) {
            query = query.where(gte(bookingsTable.checkIn, args.startDate));
          }

          return query.limit(args.limit || 10);
        }
      );
    },

    booking: async (_parent: any, args: { id: string }, context: any) => {
      const { tenantId } = context.user;
      const db = getInstrumentedClient();

      // ✅ Automatically tracked
      const results = await db.withRLS(
        { tenantId },
        async (tx) => {
          return tx
            .select()
            .from(bookingsTable)
            .where(eq(bookingsTable.id, args.id))
            .limit(1);
        }
      );

      return results[0] || null;
    },
  },

  Mutation: {
    createBooking: async (_parent: any, args: any, context: any) => {
      const { tenantId, userId } = context.user;
      const db = getInstrumentedClient();

      // ✅ Automatically tracked
      const newBooking = await db.withRLS(
        { tenantId, userId },
        async (tx) => {
          return tx
            .insert(bookingsTable)
            .values({
              ...args.input,
              tenantId,
              createdBy: userId,
            })
            .returning();
        }
      );

      return newBooking[0];
    },
  },
};

// ============================================================================
// Example 6: tRPC Procedure
// ============================================================================

/**
 * tRPC router with RLS
 */
import { z } from 'zod';
import { router, protectedProcedure } from '@/server/trpc';

export const bookingsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getInstrumentedClient();

      // ✅ Automatically tracked
      return await db.withRLS(
        { tenantId: ctx.user.tenantId },
        async (tx) => {
          let query = tx.select().from(bookingsTable);

          if (input.status) {
            query = query.where(eq(bookingsTable.status, input.status));
          }

          return query.limit(input.limit);
        }
      );
    }),

  create: protectedProcedure
    .input(
      z.object({
        guestName: z.string(),
        checkIn: z.date(),
        checkOut: z.date(),
        propertyId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getInstrumentedClient();

      // ✅ Automatically tracked
      return await db.withRLS(
        { tenantId: ctx.user.tenantId, userId: ctx.user.id },
        async (tx) => {
          const newBooking = await tx
            .insert(bookingsTable)
            .values({
              ...input,
              tenantId: ctx.user.tenantId,
              createdBy: ctx.user.id,
            })
            .returning();

          return newBooking[0];
        }
      );
    }),
});

// ============================================================================
// Example 7: Background Job / Cron
// ============================================================================

/**
 * Daily report generation job
 *
 * ✅ Each tenant's queries automatically tracked separately
 */
export async function generateDailyReports() {
  const db = getInstrumentedClient();

  // Get all active tenants (no RLS needed for admin query)
  const tenants = await db.raw
    .select({ id: tenantsTable.id, name: tenantsTable.name })
    .from(tenantsTable)
    .where(eq(tenantsTable.status, 'active'));

  console.log(`Generating reports for ${tenants.length} tenants...`);

  for (const tenant of tenants) {
    try {
      // ✅ Each tenant's metrics tracked separately!
      await db.withRLS(
        { tenantId: tenant.id },
        async (tx) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const bookings = await tx
            .select()
            .from(bookingsTable)
            .where(gte(bookingsTable.createdAt, today));

          // Generate and send report...
          console.log(
            `Tenant ${tenant.name}: ${bookings.length} bookings today`
          );

          return bookings;
        }
      );
    } catch (error) {
      console.error(`Report failed for tenant ${tenant.id}:`, error);
      // Error metrics automatically tracked!
    }
  }
}

// ============================================================================
// Example 8: Batch Operations
// ============================================================================

/**
 * Execute multiple queries in single transaction
 */
export async function getDashboardData(tenantId: string) {
  const db = getInstrumentedClient();

  // ✅ All operations tracked as single logical operation
  const [bookings, properties, recentActivity] = await db.batchWithRLS(
    { tenantId },
    [
      // Query 1: Total bookings
      (tx) =>
        tx
          .select()
          .from(bookingsTable)
          .where(eq(bookingsTable.status, 'confirmed')),

      // Query 2: Properties
      (tx) => tx.select().from(propertiesTable),

      // Query 3: Recent activity
      (tx) =>
        tx
          .select()
          .from(bookingsTable)
          .orderBy(bookingsTable.createdAt)
          .limit(10),
    ]
  );

  return {
    stats: {
      totalBookings: bookings.length,
      totalProperties: properties.length,
    },
    recentActivity,
  };
}

// ============================================================================
// Example 9: Migration from Old Approach
// ============================================================================

/**
 * BEFORE: Manual middleware approach
 */
/*
import { withCloudWatchMetrics } from '@/lib/middleware/cloudwatch-metrics';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';

export const handler = withCloudWatchMetrics(async (event) => {
  const tenantId = event.headers['x-tenant-id'];

  const client = new RDSDataClient({ region: 'us-east-1' });
  const db = drizzle(client, {
    database: process.env.DATABASE_NAME!,
    secretArn: process.env.DB_SECRET_ARN!,
    resourceArn: process.env.DB_CLUSTER_ARN!,
  });

  // Manual RLS setup...
  await db.execute(`SET LOCAL app.current_tenant_id = '${tenantId}'`);

  const bookings = await db.select().from(bookingsTable);

  return { statusCode: 200, body: JSON.stringify(bookings) };
});
*/

/**
 * AFTER: Instrumented client (simplified!)
 */
export const handlerNew = async (event: any) => {
  const tenantId = event.headers['x-tenant-id'];
  const db = getInstrumentedClient();

  // ✅ RLS + metrics in one call!
  const bookings = await db.withRLS(
    { tenantId },
    async (tx) => tx.select().from(bookingsTable)
  );

  return {
    statusCode: 200,
    body: JSON.stringify(bookings),
  };
};

// ============================================================================
// Example 10: Testing
// ============================================================================

/**
 * Unit test example
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resetInstrumentedClient } from '@/lib/database/instrumented-rds-client';

describe('Bookings Service', () => {
  beforeEach(() => {
    // Reset singleton between tests
    resetInstrumentedClient();
  });

  it('should fetch bookings for tenant', async () => {
    const db = getInstrumentedClient({
      enableMetrics: false, // Disable metrics in tests
      debug: true, // Enable debug logs
    });

    const bookings = await db.withRLS(
      { tenantId: 'test-tenant-123' },
      async (tx) => {
        return tx
          .select()
          .from(bookingsTable)
          .where(eq(bookingsTable.status, 'confirmed'))
          .limit(10);
      }
    );

    expect(Array.isArray(bookings)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const db = getInstrumentedClient({ enableMetrics: false });

    await expect(
      db.withRLS(
        { tenantId: '' }, // Invalid tenant ID
        async (tx) => tx.select().from(bookingsTable)
      )
    ).rejects.toThrow('tenantId is required');
  });
});
