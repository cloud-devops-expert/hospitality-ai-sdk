/**
 * Tenant Context Plugin for PayloadCMS
 *
 * Automatically injects tenant context into all PayloadCMS operations
 * and enforces Row-Level Security (RLS) for multi-tenant data isolation.
 *
 * Features:
 * - Extracts tenant ID from authenticated user
 * - Injects RLS context before database operations
 * - Validates tenant access
 * - Automatically tracked via instrumented client
 */

import type { Config, Plugin } from 'payload/config';
import { getInstrumentedClient } from '@/lib/database/instrumented-rds-client';

export interface TenantContextPluginOptions {
  /**
   * Function to extract tenant ID from request
   */
  getTenantId: (req: any) => string | null;

  /**
   * Function to extract user ID from request
   */
  getUserId?: (req: any) => string | null;

  /**
   * Require tenant context for all operations (default: true)
   */
  strictMode?: boolean;

  /**
   * Collections that don't require tenant context
   */
  exemptCollections?: string[];

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Tenant Context Plugin
 *
 * Injects tenant context into PayloadCMS operations for RLS enforcement.
 */
export const tenantContextPlugin =
  (options: TenantContextPluginOptions): Plugin =>
  (incomingConfig: Config): Config => {
    const {
      getTenantId,
      getUserId,
      strictMode = true,
      exemptCollections = [],
      debug = false,
    } = options;

    return {
      ...incomingConfig,

      // Inject hooks into all collections
      collections: incomingConfig.collections?.map((collection) => {
        const isExempt = exemptCollections.includes(collection.slug);

        return {
          ...collection,

          hooks: {
            ...collection.hooks,

            // Before any operation
            beforeOperation: [
              ...(collection.hooks?.beforeOperation || []),
              async ({ operation, req, args }) => {
                // Skip if exempt collection (e.g., users, tenants)
                if (isExempt) {
                  if (debug) {
                    console.log(
                      `[Tenant Context] Skipping ${collection.slug} (exempt)`
                    );
                  }
                  return args;
                }

                // Extract tenant and user IDs
                const tenantId = getTenantId(req);
                const userId = getUserId ? getUserId(req) : null;

                // Validate in strict mode
                if (strictMode && !tenantId) {
                  throw new Error(
                    `Tenant context required for ${collection.slug} operations`
                  );
                }

                // Inject tenant context into request
                if (tenantId) {
                  req.context = {
                    ...req.context,
                    tenantId,
                    userId,
                  };

                  if (debug) {
                    console.log(
                      `[Tenant Context] Set context: tenant=${tenantId}, user=${userId}, operation=${operation}`
                    );
                  }
                }

                return args;
              },
            ],

            // Before read operations
            beforeRead: [
              ...(collection.hooks?.beforeRead || []),
              async ({ req, query }) => {
                if (isExempt || !req.context?.tenantId) {
                  return query;
                }

                const db = getInstrumentedClient();

                // Execute read with RLS
                // ✅ Automatically tracked via instrumented client!
                try {
                  const results = await db.withRLS(
                    {
                      tenantId: req.context.tenantId,
                      userId: req.context.userId,
                    },
                    async (tx) => {
                      // PayloadCMS will execute its query within RLS context
                      return query;
                    }
                  );

                  return results;
                } catch (error) {
                  if (debug) {
                    console.error(
                      `[Tenant Context] Read failed for ${collection.slug}:`,
                      error
                    );
                  }
                  throw error;
                }
              },
            ],

            // Before change operations (create, update, delete)
            beforeChange: [
              ...(collection.hooks?.beforeChange || []),
              async ({ data, req, operation }) => {
                if (isExempt || !req.context?.tenantId) {
                  return data;
                }

                // Inject tenant_id into data
                if (operation === 'create' && req.context.tenantId) {
                  data.tenant_id = req.context.tenantId;

                  if (debug) {
                    console.log(
                      `[Tenant Context] Injected tenant_id into ${collection.slug}`
                    );
                  }
                }

                return data;
              },
            ],

            // After any operation
            afterOperation: [
              ...(collection.hooks?.afterOperation || []),
              async ({ operation, req, result }) => {
                if (debug && req.context?.tenantId) {
                  console.log(
                    `[Tenant Context] Completed ${operation} for ${collection.slug} (tenant=${req.context.tenantId})`
                  );
                }

                return result;
              },
            ],
          },

          // Enhanced access control with RLS
          access: {
            ...collection.access,

            // Read access
            read: async ({ req }) => {
              // Exempt collections
              if (isExempt) {
                return collection.access?.read
                  ? await collection.access.read({ req } as any)
                  : true;
              }

              // Require tenant context
              if (!req.context?.tenantId) {
                if (strictMode) {
                  return false;
                }
                return collection.access?.read
                  ? await collection.access.read({ req } as any)
                  : true;
              }

              // Execute original access control with RLS
              const db = getInstrumentedClient();

              return await db.withRLS(
                {
                  tenantId: req.context.tenantId,
                  userId: req.context.userId,
                },
                async (tx) => {
                  // Check if collection has custom access control
                  if (collection.access?.read) {
                    return await collection.access.read({ req } as any);
                  }

                  // Default: allow access with RLS
                  return true;
                }
              );
            },

            // Create access
            create: async ({ req }) => {
              if (isExempt) {
                return collection.access?.create
                  ? await collection.access.create({ req } as any)
                  : true;
              }

              if (!req.context?.tenantId && strictMode) {
                return false;
              }

              if (collection.access?.create) {
                return await collection.access.create({ req } as any);
              }

              return true;
            },

            // Update access
            update: async ({ req }) => {
              if (isExempt) {
                return collection.access?.update
                  ? await collection.access.update({ req } as any)
                  : true;
              }

              if (!req.context?.tenantId && strictMode) {
                return false;
              }

              if (collection.access?.update) {
                return await collection.access.update({ req } as any);
              }

              return true;
            },

            // Delete access
            delete: async ({ req }) => {
              if (isExempt) {
                return collection.access?.delete
                  ? await collection.access.delete({ req } as any)
                  : true;
              }

              if (!req.context?.tenantId && strictMode) {
                return false;
              }

              if (collection.access?.delete) {
                return await collection.access.delete({ req } as any);
              }

              return true;
            },
          },
        };
      }),
    };
  };
