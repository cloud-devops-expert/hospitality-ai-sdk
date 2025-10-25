/**
 * AWS Data API Adapter for PayloadCMS v3
 *
 * Replaces node-postgres (pg) with Drizzle's AWS Data API driver for serverless deployments.
 *
 * Benefits:
 * - No VPC required for Lambda functions
 * - No connection pooling issues
 * - IAM-based authentication (no passwords)
 * - Auto-scaling with Aurora Serverless v2
 * - Lower latency for cold starts
 *
 * Usage:
 * ```typescript
 * import { createDataApiAdapter } from './lib/database/aws-data-api-adapter';
 *
 * db: createDataApiAdapter({
 *   database: process.env.DATABASE_NAME!,
 *   secretArn: process.env.DB_SECRET_ARN!,
 *   resourceArn: process.env.DB_CLUSTER_ARN!,
 * })
 * ```
 */

import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { fromEnv, fromNodeProviderChain } from '@aws-sdk/credential-providers';

/**
 * Configuration for AWS RDS Data API
 */
export interface DataApiConfig {
  /**
   * Database name (e.g., 'hospitality')
   */
  database: string;

  /**
   * ARN of the AWS Secrets Manager secret containing database credentials
   * Format: arn:aws:secretsmanager:REGION:ACCOUNT:secret:NAME-SUFFIX
   */
  secretArn: string;

  /**
   * ARN of the Aurora Serverless cluster
   * Format: arn:aws:rds:REGION:ACCOUNT:cluster:CLUSTER-NAME
   */
  resourceArn: string;

  /**
   * AWS region (defaults to AWS_REGION env var or us-east-1)
   */
  region?: string;

  /**
   * Enable debug logging for Data API requests
   */
  debug?: boolean;

  /**
   * Connection timeout in milliseconds (default: 60000)
   */
  timeout?: number;
}

/**
 * Performance metrics for monitoring
 */
interface PerformanceMetrics {
  totalQueries: number;
  totalLatencyMs: number;
  errors: number;
  lastQueryTime?: Date;
}

const metrics: PerformanceMetrics = {
  totalQueries: 0,
  totalLatencyMs: 0,
  errors: 0,
};

/**
 * Create AWS RDS Data API client with proper authentication
 */
function createRDSClient(config: DataApiConfig): RDSDataClient {
  const region = config.region || process.env.AWS_REGION || 'us-east-1';

  // Prefer environment credentials in Lambda, fall back to credential chain
  const credentials =
    process.env.AWS_LAMBDA_FUNCTION_NAME ? fromEnv() : fromNodeProviderChain();

  return new RDSDataClient({
    region,
    credentials,
    maxAttempts: 3,
    requestHandler: {
      requestTimeout: config.timeout || 60000,
    },
  });
}

/**
 * Logging wrapper for debugging
 */
function logDataApiQuery(sql: string, params: unknown[], duration: number) {
  if (process.env.DEBUG_DATA_API === 'true') {
    console.log('[AWS Data API]', {
      sql: sql.substring(0, 200),
      params: params.length,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Create PayloadCMS-compatible database adapter using AWS Data API
 *
 * @example
 * ```typescript
 * // In payload.config.ts
 * import { createDataApiAdapter } from './lib/database/aws-data-api-adapter';
 *
 * export default buildConfig({
 *   db: createDataApiAdapter({
 *     database: process.env.DATABASE_NAME!,
 *     secretArn: process.env.DB_SECRET_ARN!,
 *     resourceArn: process.env.DB_CLUSTER_ARN!,
 *   }),
 * });
 * ```
 */
export function createDataApiAdapter(config: DataApiConfig) {
  if (!config.database || !config.secretArn || !config.resourceArn) {
    throw new Error(
      'Missing required Data API configuration: database, secretArn, and resourceArn are required'
    );
  }

  // Create RDS Data API client
  const rdsClient = createRDSClient(config);

  // Create Drizzle instance with Data API driver
  const db = drizzle(rdsClient, {
    database: config.database,
    secretArn: config.secretArn,
    resourceArn: config.resourceArn,
    logger: config.debug
      ? {
          logQuery(sql: string, params: unknown[]) {
            const start = Date.now();
            logDataApiQuery(sql, params, Date.now() - start);
          },
        }
      : undefined,
  });

  // Wrap execute method for performance tracking
  const originalExecute = db.execute.bind(db);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db.execute = async function (query: any) {
    const startTime = Date.now();
    metrics.totalQueries++;

    try {
      const result = await originalExecute(query);
      const duration = Date.now() - startTime;
      metrics.totalLatencyMs += duration;
      metrics.lastQueryTime = new Date();

      if (config.debug) {
        logDataApiQuery(
          typeof query === 'string' ? query : (query as { sql: string }).sql,
          [],
          duration
        );
      }

      return result;
    } catch (error) {
      metrics.errors++;
      throw error;
    }
  };

  return db;
}

/**
 * Get performance metrics for monitoring
 *
 * @example
 * ```typescript
 * const stats = getDataApiMetrics();
 * console.log(`Avg latency: ${stats.avgLatencyMs}ms`);
 * console.log(`Error rate: ${stats.errorRate}%`);
 * ```
 */
export function getDataApiMetrics() {
  return {
    ...metrics,
    avgLatencyMs:
      metrics.totalQueries > 0
        ? Math.round(metrics.totalLatencyMs / metrics.totalQueries)
        : 0,
    errorRate:
      metrics.totalQueries > 0
        ? Math.round((metrics.errors / metrics.totalQueries) * 100)
        : 0,
  };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetDataApiMetrics() {
  metrics.totalQueries = 0;
  metrics.totalLatencyMs = 0;
  metrics.errors = 0;
  metrics.lastQueryTime = undefined;
}

/**
 * Health check for Data API connection
 *
 * @example
 * ```typescript
 * const healthy = await checkDataApiHealth(db);
 * if (!healthy) {
 *   console.error('Data API connection failed');
 * }
 * ```
 */
export async function checkDataApiHealth(db: ReturnType<typeof createDataApiAdapter>): Promise<boolean> {
  try {
    const result = await db.execute('SELECT 1 as health_check');
    return result.rows?.length === 1;
  } catch (error) {
    console.error('[AWS Data API] Health check failed:', error);
    return false;
  }
}

/**
 * Create a feature-flagged adapter that falls back to traditional pg
 *
 * @example
 * ```typescript
 * // In payload.config.ts
 * import { createConditionalAdapter } from './lib/database/aws-data-api-adapter';
 * import { postgresAdapter } from '@payloadcms/db-postgres';
 *
 * export default buildConfig({
 *   db: createConditionalAdapter({
 *     useDataApi: process.env.USE_DATA_API === 'true',
 *     dataApiConfig: {
 *       database: process.env.DATABASE_NAME!,
 *       secretArn: process.env.DB_SECRET_ARN!,
 *       resourceArn: process.env.DB_CLUSTER_ARN!,
 *     },
 *     fallbackConfig: {
 *       pool: {
 *         connectionString: process.env.DATABASE_URL,
 *       },
 *     },
 *   }),
 * });
 * ```
 */
export function createConditionalAdapter(options: {
  useDataApi: boolean;
  dataApiConfig: DataApiConfig;
  fallbackConfig: Record<string, unknown>;
}) {
  if (options.useDataApi) {
    console.log('[Database] Using AWS Data API adapter');
    return createDataApiAdapter(options.dataApiConfig);
  } else {
    console.log('[Database] Using traditional PostgreSQL adapter');
    const { postgresAdapter } = require('@payloadcms/db-postgres');
    return postgresAdapter(options.fallbackConfig);
  }
}
