/**
 * PayloadCMS Configuration with Instrumented RDS Client
 *
 * This configuration automatically tracks all database operations
 * via CloudWatch metrics without manual instrumentation.
 */

import { buildConfig } from 'payload/config';
import { payloadInstrumentedAdapter } from '@/lib/database/payload-instrumented-adapter';
import { tenantContextPlugin } from './plugins/tenant-context';

// Import collections
import { Users } from './collections/Users';
import { Bookings } from './collections/Bookings';
import { Properties } from './collections/Properties';
import { Tenants } from './collections/Tenants';

export default buildConfig({
  // Server configuration
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // ✅ Use instrumented database adapter
  // All database operations automatically tracked!
  db: payloadInstrumentedAdapter({
    resourceArn: process.env.DB_CLUSTER_ARN!,
    secretArn: process.env.DB_SECRET_ARN!,
    database: process.env.DATABASE_NAME!,
    region: process.env.AWS_REGION || 'us-east-1',
    debug: process.env.NODE_ENV === 'development',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
  }),

  // Admin panel
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Hospitality AI',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },

  // Collections
  collections: [
    Users,
    Bookings,
    Properties,
    Tenants,
  ],

  // Globals
  globals: [],

  // TypeScript
  typescript: {
    outputFile: './payload-types.ts',
  },

  // GraphQL
  graphQL: {
    schemaOutputFile: './generated-schema.graphql',
  },

  // Plugins
  plugins: [
    // ✅ Inject tenant context into all requests
    tenantContextPlugin({
      // Extract tenant from user
      getTenantId: (req) => {
        return req.user?.tenantId || null;
      },
      // Extract user ID
      getUserId: (req) => {
        return req.user?.id || null;
      },
      // Strict mode: require tenant for all operations (except auth)
      strictMode: true,
      // Collections that don't require tenant context
      exemptCollections: ['users', 'tenants'],
    }),
  ],

  // CORS
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],

  // CSRF
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],

  // Rate limiting
  rateLimit: {
    max: 500,
    trustProxy: true,
  },
});
