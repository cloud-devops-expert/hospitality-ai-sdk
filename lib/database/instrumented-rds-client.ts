/**
 * Instrumented RDS Data API Client
 *
 * Automatically tracks tenant metrics for ALL database operations.
 * Use this client everywhere (Lambdas, PayloadCMS, Next.js) for centralized metrics collection.
 *
 * Features:
 * - Automatic CloudWatch metrics publishing
 * - Row-Level Security (RLS) support
 * - Tenant context tracking via application_name
 * - Zero instrumentation needed in application code
 *
 * Usage:
 * ```typescript
 * import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';
 *
 * const db = getInstrumentedClient();
 * const bookings = await db.withRLS(
 *   { tenantId: 'tenant-123' },
 *   async (tx) => tx.select().from(bookingsTable)
 * );
 * // ✅ Metrics automatically tracked!
 * ```
 */

import { RDSDataClient, ExecuteStatementCommand, BatchExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand, RollbackTransactionCommand } from '@aws-sdk/client-rds-data';
import type { Command } from '@smithy/smithy-client';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import type { AwsDataApiPgDatabase } from 'drizzle-orm/aws-data-api/pg';
import { fromEnv, fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { getCloudWatchPublisher } from '@/lib/metrics/cloudwatch-publisher';

// Type for Drizzle transaction callback
type TransactionCallback<T> = (tx: AwsDataApiPgDatabase<Record<string, never>>) => Promise<T>;

/**
 * Configuration for instrumented client
 */
export interface InstrumentedClientConfig {
  resourceArn: string;
  secretArn: string;
  database: string;
  region?: string;
  debug?: boolean;
  /**
   * Enable automatic metrics publishing (default: true)
   */
  enableMetrics?: boolean;
  /**
   * Custom metrics namespace (default: 'HospitalityAI/Tenants')
   */
  metricsNamespace?: string;
}

/**
 * RLS context for tenant isolation
 */
export interface RLSContext {
  tenantId: string;
  userId?: string;
  customVars?: Record<string, string>;
}

/**
 * Metrics collected per operation
 */
interface OperationMetrics {
  tenantId: string;
  operation: string; // ExecuteStatement, BatchExecuteStatement, etc.
  durationMs: number;
  statusCode: number;
  bytesTransferred: number;
  errorMessage?: string;
}

/**
 * Instrumented RDS Data API Client
 *
 * Wraps AWS RDS Data API client with automatic tenant metrics tracking.
 */
export class InstrumentedRDSClient {
  private client: RDSDataClient;
  private db: ReturnType<typeof drizzle>;
  private config: Required<InstrumentedClientConfig>;
  private currentTenantId: string | null = null;

  constructor(config: InstrumentedClientConfig) {
    const region = config.region || process.env.AWS_REGION || 'us-east-1';

    this.config = {
      ...config,
      region,
      debug: config.debug || false,
      enableMetrics: config.enableMetrics ?? true,
      metricsNamespace: config.metricsNamespace || 'HospitalityAI/Tenants',
    };

    // Create RDS Data API client
    const credentials = process.env.AWS_LAMBDA_FUNCTION_NAME
      ? fromEnv()
      : fromNodeProviderChain();

    this.client = new RDSDataClient({
      region,
      credentials,
      maxAttempts: 3,
    });

    // Wrap client with metrics interceptor
    this.client = this.wrapClientWithMetrics(this.client);

    // Create Drizzle instance
    this.db = drizzle(this.client, {
      database: this.config.database,
      secretArn: this.config.secretArn,
      resourceArn: this.config.resourceArn,
      logger: this.config.debug
        ? {
            logQuery(sql: string, params: unknown[]) {
              console.log('[Instrumented RDS]', {
                sql: sql.substring(0, 200),
                params,
              });
            },
          }
        : undefined,
    });
  }

  /**
   * Wrap RDS client to intercept ALL API calls
   */
  private wrapClientWithMetrics(client: RDSDataClient): RDSDataClient {
    const originalSend = client.send.bind(client);

    // Override send method (must use any cast as we're intercepting internal SDK method)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).send = async (command: Command<any, any, any, any, any>) => {
      const startTime = Date.now();
      const commandName = command.constructor.name;

      try {
        // Execute command
        const result = await originalSend(command);
        const durationMs = Date.now() - startTime;

        // Track metrics if enabled
        if (this.config.enableMetrics) {
          const tenantId = this.extractTenantId(command);
          if (tenantId) {
            this.publishMetrics({
              tenantId,
              operation: commandName,
              durationMs,
              statusCode: 200,
              bytesTransferred: this.estimateResponseSize(result),
            });
          }
        }

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Track error metrics
        if (this.config.enableMetrics) {
          const tenantId = this.extractTenantId(command);
          if (tenantId) {
            this.publishMetrics({
              tenantId,
              operation: commandName,
              durationMs,
              statusCode: 500,
              bytesTransferred: 0,
              errorMessage,
            });
          }
        }

        throw error;
      }
    };

    return client;
  }

  /**
   * Extract tenant ID from SQL command
   */
  private extractTenantId(command: Command<any, any, any, any, any>): string | null {
    try {
      // Check current context first
      if (this.currentTenantId) {
        return this.currentTenantId;
      }

      // Try to extract from SQL (for ExecuteStatement)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const commandInput = command.input as any;
      if (commandInput?.sql && typeof commandInput.sql === 'string') {
        const sql = commandInput.sql;

        // Match: SET LOCAL application_name = 'tenant-123'
        const appNameMatch = sql.match(/application_name\s*=\s*'tenant-([^']+)'/);
        if (appNameMatch) {
          return appNameMatch[1];
        }

        // Match: SET LOCAL app.current_tenant_id = 'tenant-123'
        const tenantIdMatch = sql.match(/app\.current_tenant_id\s*=\s*'([^']+)'/);
        if (tenantIdMatch) {
          return tenantIdMatch[1];
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Estimate response size
   */
  private estimateResponseSize(result: unknown): number {
    try {
      return JSON.stringify(result).length;
    } catch {
      return 0;
    }
  }

  /**
   * Publish metrics to CloudWatch
   */
  private publishMetrics(metrics: OperationMetrics): void {
    try {
      const publisher = getCloudWatchPublisher({
        namespace: this.config.metricsNamespace,
      });

      publisher
        .publish({
          tenantId: metrics.tenantId,
          endpoint: 'rds-data-api',
          method: metrics.operation,
          durationMs: metrics.durationMs,
          statusCode: metrics.statusCode,
          bytesTransferred: metrics.bytesTransferred,
        })
        .catch((err) => {
          if (this.config.debug) {
            console.error('[Instrumented RDS] Failed to publish metrics:', err);
          }
        });
    } catch (err) {
      if (this.config.debug) {
        console.error('[Instrumented RDS] Metrics publishing error:', err);
      }
    }
  }

  /**
   * Execute queries with RLS context
   *
   * Automatically sets session variables and tracks metrics.
   *
   * @example
   * ```typescript
   * const bookings = await db.withRLS(
   *   { tenantId: 'tenant-123', userId: 'user-456' },
   *   async (tx) => {
   *     return tx.select().from(bookingsTable);
   *   }
   * );
   * ```
   */
  async withRLS<T>(
    context: RLSContext,
    callback: TransactionCallback<T>
  ): Promise<T> {
    this.validateContext(context);

    // Set current tenant for metrics tracking
    this.currentTenantId = context.tenantId;

    try {
      return await this.db.transaction(async (tx) => {
        // Set session variables
        await this.setSessionVariables(tx, context);

        // Execute user's queries
        const result = await callback(tx);

        return result;
      });
    } finally {
      // Clear tenant context
      this.currentTenantId = null;
    }
  }

  /**
   * Execute multiple operations in a single RLS transaction
   */
  async batchWithRLS<T>(
    context: RLSContext,
    operations: Array<TransactionCallback<T>>
  ): Promise<T[]> {
    this.validateContext(context);
    this.currentTenantId = context.tenantId;

    try {
      return await this.db.transaction(async (tx) => {
        await this.setSessionVariables(tx, context);

        const results: T[] = [];
        for (const operation of operations) {
          results.push(await operation(tx));
        }
        return results;
      });
    } finally {
      this.currentTenantId = null;
    }
  }

  /**
   * Set PostgreSQL session variables for RLS
   */
  private async setSessionVariables(tx: AwsDataApiPgDatabase<Record<string, never>>, context: RLSContext): Promise<void> {
    // Set application_name for visibility in pg_stat_activity
    const appName = `tenant-${context.tenantId}${context.userId ? `-user-${context.userId}` : ''}`;
    await tx.execute(`SET LOCAL application_name = '${this.escapeSQL(appName)}'`);

    if (this.config.debug) {
      console.log('[Instrumented RDS] Set application_name:', appName);
    }

    // Set tenant ID (required for RLS)
    await tx.execute(
      `SET LOCAL app.current_tenant_id = '${this.escapeSQL(context.tenantId)}'`
    );

    if (this.config.debug) {
      console.log('[Instrumented RDS] Set tenant context:', context.tenantId);
    }

    // Set user ID (optional)
    if (context.userId) {
      await tx.execute(
        `SET LOCAL app.current_user_id = '${this.escapeSQL(context.userId)}'`
      );

      if (this.config.debug) {
        console.log('[Instrumented RDS] Set user context:', context.userId);
      }
    }

    // Set custom variables
    if (context.customVars) {
      for (const [key, value] of Object.entries(context.customVars)) {
        await tx.execute(`SET LOCAL ${key} = '${this.escapeSQL(value)}'`);

        if (this.config.debug) {
          console.log(`[Instrumented RDS] Set ${key}:`, value);
        }
      }
    }
  }

  /**
   * Validate RLS context
   */
  private validateContext(context: RLSContext): void {
    if (!context.tenantId) {
      throw new Error('RLS context validation failed: tenantId is required');
    }

    // Validate tenant ID format
    if (!/^[a-zA-Z0-9-_]+$/.test(context.tenantId)) {
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
   * Basic SQL escaping
   */
  private escapeSQL(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * Get raw Drizzle instance (still instrumented)
   *
   * ⚠️ WARNING: Bypasses RLS enforcement. Use only for admin operations.
   */
  get raw() {
    if (this.config.debug) {
      console.warn('[Instrumented RDS] Using raw client - RLS enforcement bypassed!');
    }
    return this.db;
  }

  /**
   * Get raw RDS Data API client (for advanced use cases)
   */
  get rdsClient() {
    return this.client;
  }
}

// Singleton instance
let instrumentedClient: InstrumentedRDSClient | null = null;

/**
 * Get instrumented database client (singleton)
 *
 * USE THIS in all your code for automatic metrics tracking.
 *
 * @example
 * ```typescript
 * // In Lambda
 * const db = getInstrumentedClient();
 *
 * // In PayloadCMS
 * const db = getInstrumentedClient();
 *
 * // In Next.js API
 * const db = getInstrumentedClient();
 *
 * // All automatically tracked!
 * ```
 */
export function getInstrumentedClient(config?: InstrumentedClientConfig): InstrumentedRDSClient {
  if (!instrumentedClient) {
    instrumentedClient = new InstrumentedRDSClient(
      config || {
        resourceArn: process.env.DB_CLUSTER_ARN!,
        secretArn: process.env.DB_SECRET_ARN!,
        database: process.env.DATABASE_NAME!,
        debug: process.env.NODE_ENV === 'development',
      }
    );
  }

  return instrumentedClient;
}

/**
 * Get raw Drizzle instance (still instrumented)
 *
 * Convenience method for direct Drizzle usage.
 *
 * @example
 * ```typescript
 * const db = getInstrumentedDb();
 * // Still tracked via client interceptor!
 * ```
 */
export function getInstrumentedDb(config?: InstrumentedClientConfig) {
  return getInstrumentedClient(config).raw;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetInstrumentedClient() {
  instrumentedClient = null;
}
