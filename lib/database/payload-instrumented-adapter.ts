/**
 * PayloadCMS Database Adapter with Instrumented RDS Client
 *
 * Integrates PayloadCMS v3 with our instrumented RDS client for:
 * - Automatic tenant metrics tracking
 * - Row-Level Security (RLS) enforcement
 * - Multi-tenant data isolation
 *
 * Usage:
 * ```typescript
 * // payload.config.ts
 * import { payloadInstrumentedAdapter } from '@/lib/database/payload-instrumented-adapter';
 *
 * export default buildConfig({
 *   db: payloadInstrumentedAdapter({
 *     resourceArn: process.env.DB_CLUSTER_ARN!,
 *     secretArn: process.env.DB_SECRET_ARN!,
 *     database: process.env.DATABASE_NAME!,
 *   }),
 * });
 * ```
 */

import { InstrumentedRDSClient } from './instrumented-rds-client';

// Type declaration for optional PayloadCMS dependency
type DatabaseAdapter = any;

export interface PayloadInstrumentedAdapterArgs {
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
   * Custom metrics namespace
   */
  metricsNamespace?: string;
}

/**
 * Create PayloadCMS database adapter with instrumented client
 *
 * This adapter automatically tracks all database operations via CloudWatch
 * while maintaining PayloadCMS compatibility.
 */
export function payloadInstrumentedAdapter(
  args: PayloadInstrumentedAdapterArgs
): DatabaseAdapter {
  const instrumentedClient = new InstrumentedRDSClient({
    resourceArn: args.resourceArn,
    secretArn: args.secretArn,
    database: args.database,
    region: args.region,
    debug: args.debug,
    enableMetrics: args.enableMetrics ?? true,
    metricsNamespace: args.metricsNamespace,
  });

  // Return Drizzle instance (instrumented under the hood)
  return instrumentedClient.raw as DatabaseAdapter;
}

/**
 * Export for backwards compatibility
 */
export const createPayloadInstrumentedAdapter = payloadInstrumentedAdapter;
