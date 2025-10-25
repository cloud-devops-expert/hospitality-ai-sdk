/**
 * Drizzle RLS Client for AWS Data API
 *
 * Provides Row-Level Security (RLS) support for multi-tenant applications
 * using AWS RDS Data API with PostgreSQL.
 *
 * Key Features:
 * - Automatic tenant isolation via PostgreSQL RLS
 * - Session variable management (app.current_tenant_id, app.current_user_id)
 * - Transaction-based RLS context
 * - Type-safe Drizzle ORM integration
 *
 * Usage:
 * ```typescript
 * const rlsDb = new DrizzleRLSClient({ ... });
 *
 * // All queries within this block are tenant-isolated
 * const bookings = await rlsDb.withRLS(
 *   { tenantId: 'tenant-123', userId: 'user-456' },
 *   async (tx) => {
 *     return tx.select().from(bookingsTable);
 *   }
 * );
 * ```
 *
 * @see .agent/docs/data-api-rls-session-variables.md
 */

import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import type { AwsDataApiPgDatabase } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { fromEnv, fromNodeProviderChain } from '@aws-sdk/credential-providers';
import type { SQL } from 'drizzle-orm';

// Type for Drizzle transaction callback
type TransactionCallback<T> = (tx: AwsDataApiPgDatabase<Record<string, never>>) => Promise<T>;

// Type for request objects (supports both Next.js Request and Express req)
type RequestLike = {
  headers?: {
    get?(name: string): string | null;
    [key: string]: unknown;
  };
  user?: {
    tenantId?: string;
    id?: string;
  };
};

/**
 * RLS context for tenant isolation
 */
export interface RLSContext {
  /**
   * Tenant ID - REQUIRED for multi-tenant isolation
   * Sets PostgreSQL session variable: app.current_tenant_id
   */
  tenantId: string;

  /**
   * User ID - OPTIONAL for user-specific policies
   * Sets PostgreSQL session variable: app.current_user_id
   */
  userId?: string;

  /**
   * Additional custom session variables
   * Example: { 'app.user_role': 'admin', 'app.department_id': '123' }
   */
  customVars?: Record<string, string>;
}

/**
 * Configuration for Drizzle RLS Client
 */
export interface DrizzleRLSConfig {
  /**
   * ARN of the Aurora Serverless cluster
   */
  resourceArn: string;

  /**
   * ARN of the Secrets Manager secret containing DB credentials
   */
  secretArn: string;

  /**
   * Database name
   */
  database: string;

  /**
   * AWS region (defaults to AWS_REGION env var or us-east-1)
   */
  region?: string;

  /**
   * Enable debug logging for RLS operations
   */
  debug?: boolean;

  /**
   * Validate tenant context before every query (default: true)
   * Throws error if tenantId is missing
   */
  strictMode?: boolean;
}

/**
 * Performance metrics for monitoring RLS overhead
 */
interface RLSMetrics {
  totalTransactions: number;
  totalContextSets: number;
  totalLatencyMs: number;
  errors: number;
}

const metrics: RLSMetrics = {
  totalTransactions: 0,
  totalContextSets: 0,
  totalLatencyMs: 0,
  errors: 0,
};

/**
 * Drizzle client with Row-Level Security support for AWS Data API
 *
 * @example
 * ```typescript
 * const rlsDb = new DrizzleRLSClient({
 *   resourceArn: process.env.DB_CLUSTER_ARN!,
 *   secretArn: process.env.DB_SECRET_ARN!,
 *   database: process.env.DATABASE_NAME!,
 * });
 *
 * // Execute queries with tenant isolation
 * const results = await rlsDb.withRLS(
 *   { tenantId: req.user.tenantId, userId: req.user.id },
 *   async (tx) => {
 *     // All queries here are automatically tenant-scoped
 *     const bookings = await tx.select().from(bookingsTable)
 *       .where(eq(bookingsTable.status, 'confirmed'));
 *
 *     const total = await tx.select({ sum: sum(bookingsTable.amount) })
 *       .from(bookingsTable);
 *
 *     return { bookings, total };
 *   }
 * );
 * ```
 */
export class DrizzleRLSClient {
  private client: RDSDataClient;
  private db: ReturnType<typeof drizzle>;
  private config: Required<DrizzleRLSConfig>;

  constructor(config: DrizzleRLSConfig) {
    const region = config.region || process.env.AWS_REGION || 'us-east-1';
    const strictMode = config.strictMode ?? true;

    this.config = {
      ...config,
      region,
      debug: config.debug || false,
      strictMode,
    };

    // Create RDS Data API client
    const credentials =
      process.env.AWS_LAMBDA_FUNCTION_NAME ? fromEnv() : fromNodeProviderChain();

    this.client = new RDSDataClient({
      region,
      credentials,
      maxAttempts: 3,
    });

    // Create Drizzle instance
    this.db = drizzle(this.client, {
      database: this.config.database,
      secretArn: this.config.secretArn,
      resourceArn: this.config.resourceArn,
      logger: this.config.debug
        ? {
            logQuery(sql: string, params: unknown[]) {
              console.log('[Drizzle RLS]', { sql: sql.substring(0, 200), params });
            },
          }
        : undefined,
    });
  }

  /**
   * Execute queries with RLS context
   *
   * Creates a transaction, sets session variables, executes callback, commits transaction.
   * All queries within the callback are tenant-isolated via PostgreSQL RLS policies.
   *
   * @example
   * ```typescript
   * const bookings = await rlsDb.withRLS(
   *   { tenantId: 'abc-123', userId: 'user-456' },
   *   async (tx) => {
   *     return tx.select().from(bookingsTable);
   *   }
   * );
   * ```
   */
  async withRLS<T>(context: RLSContext, callback: TransactionCallback<T>): Promise<T> {
    this.validateContext(context);

    const startTime = Date.now();
    metrics.totalTransactions++;

    try {
      return await this.db.transaction(async (tx) => {
        // Set session variables at the start of transaction
        // Using SET LOCAL ensures they're transaction-scoped
        await this.setSessionVariables(tx, context);

        // Execute user's queries within RLS context
        const result = await callback(tx);

        return result;
      });
    } catch (error) {
      metrics.errors++;
      throw error;
    } finally {
      metrics.totalLatencyMs += Date.now() - startTime;
    }
  }

  /**
   * Execute multiple operations in a single RLS transaction
   *
   * More efficient than multiple `withRLS` calls because session
   * variables are set once for all operations.
   *
   * @example
   * ```typescript
   * const [bookings, payments, stats] = await rlsDb.batchWithRLS(
   *   { tenantId: 'abc-123' },
   *   [
   *     (tx) => tx.select().from(bookingsTable),
   *     (tx) => tx.select().from(paymentsTable),
   *     (tx) => tx.select({ count: count() }).from(bookingsTable),
   *   ]
   * );
   * ```
   */
  async batchWithRLS<T>(
    context: RLSContext,
    operations: Array<TransactionCallback<T>>
  ): Promise<T[]> {
    this.validateContext(context);

    return this.db.transaction(async (tx) => {
      // Set RLS context once for all operations
      await this.setSessionVariables(tx, context);

      // Execute all operations in order
      const results: T[] = [];
      for (const operation of operations) {
        results.push(await operation(tx));
      }
      return results;
    });
  }

  /**
   * Get raw Drizzle instance WITHOUT RLS enforcement
   *
   * ⚠️ WARNING: Use only for admin operations where tenant isolation is not required.
   * Regular application code should use `withRLS()` instead.
   *
   * @example
   * ```typescript
   * // Admin operation - bypass RLS
   * const allTenants = await rlsDb.raw.select().from(tenantsTable);
   * ```
   */
  get raw() {
    if (this.config.debug) {
      console.warn('[Drizzle RLS] Using raw client - RLS enforcement bypassed!');
    }
    return this.db;
  }

  /**
   * Set PostgreSQL session variables for RLS
   */
  private async setSessionVariables(tx: AwsDataApiPgDatabase<Record<string, never>>, context: RLSContext): Promise<void> {
    metrics.totalContextSets++;

    // Set application_name for visibility in pg_stat_activity and Performance Insights
    const appName = `tenant-${context.tenantId}${context.userId ? `-user-${context.userId}` : ''}`;
    await tx.execute(
      `SET LOCAL application_name = '${this.escapeSQL(appName)}'`
    );

    if (this.config.debug) {
      console.log('[Drizzle RLS] Set application_name:', appName);
    }

    // Set tenant ID (required)
    await tx.execute(
      `SET LOCAL app.current_tenant_id = '${this.escapeSQL(context.tenantId)}'`
    );

    if (this.config.debug) {
      console.log('[Drizzle RLS] Set tenant context:', context.tenantId);
    }

    // Set user ID (optional)
    if (context.userId) {
      await tx.execute(
        `SET LOCAL app.current_user_id = '${this.escapeSQL(context.userId)}'`
      );

      if (this.config.debug) {
        console.log('[Drizzle RLS] Set user context:', context.userId);
      }
    }

    // Set custom variables (optional)
    if (context.customVars) {
      for (const [key, value] of Object.entries(context.customVars)) {
        await tx.execute(`SET LOCAL ${key} = '${this.escapeSQL(value)}'`);

        if (this.config.debug) {
          console.log(`[Drizzle RLS] Set ${key}:`, value);
        }
      }
    }
  }

  /**
   * Validate RLS context
   */
  private validateContext(context: RLSContext): void {
    if (this.config.strictMode && !context.tenantId) {
      throw new Error(
        'RLS context validation failed: tenantId is required in strict mode'
      );
    }

    // Validate tenant ID format (UUID or alphanumeric)
    if (context.tenantId && !/^[a-zA-Z0-9-_]+$/.test(context.tenantId)) {
      throw new Error(
        'RLS context validation failed: tenantId contains invalid characters'
      );
    }

    // Validate user ID format (if provided)
    if (context.userId && !/^[a-zA-Z0-9-_]+$/.test(context.userId)) {
      throw new Error(
        'RLS context validation failed: userId contains invalid characters'
      );
    }
  }

  /**
   * Basic SQL escaping to prevent injection
   * Note: This is a safety measure, but PostgreSQL parameterized queries are still preferred
   */
  private escapeSQL(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...metrics,
      avgLatencyMs:
        metrics.totalTransactions > 0
          ? Math.round(metrics.totalLatencyMs / metrics.totalTransactions)
          : 0,
      errorRate:
        metrics.totalTransactions > 0
          ? Math.round((metrics.errors / metrics.totalTransactions) * 100)
          : 0,
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    metrics.totalTransactions = 0;
    metrics.totalContextSets = 0;
    metrics.totalLatencyMs = 0;
    metrics.errors = 0;
  }
}

/**
 * Create a singleton RLS client instance
 *
 * @example
 * ```typescript
 * // lib/database/instance.ts
 * import { createRLSClient } from './drizzle-rls-client';
 *
 * export const rlsDb = createRLSClient({
 *   resourceArn: process.env.DB_CLUSTER_ARN!,
 *   secretArn: process.env.DB_SECRET_ARN!,
 *   database: process.env.DATABASE_NAME!,
 * });
 * ```
 */
export function createRLSClient(config: DrizzleRLSConfig): DrizzleRLSClient {
  return new DrizzleRLSClient(config);
}

/**
 * Middleware helper to extract RLS context from HTTP request
 *
 * @example
 * ```typescript
 * import { extractRLSContext } from './drizzle-rls-client';
 *
 * export async function GET(req: Request) {
 *   const context = extractRLSContext(req);
 *
 *   const bookings = await rlsDb.withRLS(context, async (tx) => {
 *     return tx.select().from(bookingsTable);
 *   });
 *
 *   return Response.json(bookings);
 * }
 * ```
 */
export function extractRLSContext(req: RequestLike): RLSContext {
  // Extract from headers (preferred for API calls)
  const tenantId =
    req.headers?.get?.('x-tenant-id') ||
    (req.headers?.['x-tenant-id'] as string) ||
    req.user?.tenantId;

  const userId =
    req.headers?.get?.('x-user-id') ||
    (req.headers?.['x-user-id'] as string) ||
    req.user?.id;

  if (!tenantId) {
    throw new Error('Tenant context required: x-tenant-id header or req.user.tenantId missing');
  }

  return { tenantId, userId };
}
