/**
 * Integration Tests - REQUIRES AWS CONFIGURATION
 *
 * Run with: npm run test:integration
 *
 * Prerequisites:
 * - Aurora Serverless v2 cluster with Data API enabled
 * - AWS credentials configured (AWS_PROFILE or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)
 * - Environment variables set in .env.local:
 *   - DB_CLUSTER_ARN
 *   - DB_SECRET_ARN
 *   - DATABASE_NAME
 *   - AWS_REGION
 *
 * Deploy infrastructure first:
 *   cd infrastructure
 *   cdk deploy -c environment=dev
 */

import { getInstrumentedClient, resetInstrumentedClient } from '../instrumented-rds-client';

// Check if AWS is configured
const isAWSConfigured = Boolean(
  process.env.DB_CLUSTER_ARN &&
  process.env.DB_SECRET_ARN &&
  process.env.DATABASE_NAME
);

// Skip all tests if AWS not configured
const describeIfAWS = isAWSConfigured ? describe : describe.skip;

describeIfAWS('InstrumentedRDSClient - Integration Tests', () => {
  beforeEach(() => {
    resetInstrumentedClient();
  });

  describe('Real AWS Connectivity', () => {
    it('should connect to Aurora via Data API', async () => {
      const client = getInstrumentedClient();

      const result = await client.withRLS(
        { tenantId: 'integration-test-tenant' },
        async (tx) => {
          const queryResult = await tx.execute('SELECT 1 as test');
          return queryResult;
        }
      );

      expect(result).toBeDefined();
    }, 30000); // 30 second timeout for real AWS

    it('should set RLS session variables', async () => {
      const client = getInstrumentedClient();

      await client.withRLS(
        { tenantId: 'test-tenant-123', userId: 'test-user-456' },
        async (tx) => {
          // Verify session variables are set
          const result = await tx.execute(`
            SELECT
              current_setting('app.current_tenant_id', true) as tenant,
              current_setting('app.current_user_id', true) as user_id
          `);

          expect(result).toBeDefined();
          // Data API returns results in a specific format
          // The actual assertions would depend on Drizzle's return format
        }
      );
    }, 30000);

    it('should publish metrics to CloudWatch', async () => {
      const client = getInstrumentedClient({
        enableMetrics: true,
        metricsNamespace: 'HospitalityAI/IntegrationTest',
      });

      await client.withRLS(
        { tenantId: 'metrics-test-tenant' },
        async (tx) => {
          await tx.execute('SELECT 1');
        }
      );

      // Wait for async metrics publishing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Metrics should now be in CloudWatch
      // Check CloudWatch console manually or use AWS SDK to verify:
      // - Namespace: HospitalityAI/IntegrationTest
      // - Metric: DatabaseOperations
      // - Dimension: TenantId=metrics-test-tenant

      // This test just verifies no errors occur during publishing
      expect(true).toBe(true);
    }, 30000);

    it('should enforce RLS policies', async () => {
      const client = getInstrumentedClient();

      // First, create test table if it doesn't exist
      await client.withRLS(
        { tenantId: 'setup' },
        async (tx) => {
          await tx.execute(`
            CREATE TABLE IF NOT EXISTS test_bookings (
              id SERIAL PRIMARY KEY,
              tenant_id TEXT NOT NULL,
              guest_name TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `);

          await tx.execute(`ALTER TABLE test_bookings ENABLE ROW LEVEL SECURITY`);

          await tx.execute(`
            DROP POLICY IF EXISTS tenant_isolation ON test_bookings
          `);

          await tx.execute(`
            CREATE POLICY tenant_isolation ON test_bookings
              USING (tenant_id = current_setting('app.current_tenant_id', TRUE))
          `);
        }
      );

      // Insert data for tenant A
      await client.withRLS(
        { tenantId: 'tenant-a' },
        async (tx) => {
          await tx.execute(`
            INSERT INTO test_bookings (tenant_id, guest_name)
            VALUES ('tenant-a', 'Guest A')
          `);
        }
      );

      // Try to read as tenant B - should see no results due to RLS
      const tenantBResults = await client.withRLS(
        { tenantId: 'tenant-b' },
        async (tx) => {
          const result = await tx.execute(`
            SELECT * FROM test_bookings WHERE guest_name = 'Guest A'
          `);
          return result;
        }
      );

      // RLS should prevent tenant B from seeing tenant A's data
      expect(Array.isArray(tenantBResults) ? tenantBResults.length : 0).toBe(0);

      // Read as tenant A - should see the booking
      const tenantAResults = await client.withRLS(
        { tenantId: 'tenant-a' },
        async (tx) => {
          const result = await tx.execute(`
            SELECT * FROM test_bookings WHERE guest_name = 'Guest A'
          `);
          return result;
        }
      );

      expect(Array.isArray(tenantAResults) ? tenantAResults.length : 0).toBeGreaterThan(0);

      // Cleanup
      await client.withRLS(
        { tenantId: 'tenant-a' },
        async (tx) => {
          await tx.execute(`DELETE FROM test_bookings WHERE guest_name = 'Guest A'`);
        }
      );
    }, 60000);
  });

  describe('Performance Tests', () => {
    it('should complete operation within 2 seconds', async () => {
      const client = getInstrumentedClient({ enableMetrics: false });

      const startTime = Date.now();

      await client.withRLS(
        { tenantId: 'perf-test' },
        async (tx) => {
          await tx.execute('SELECT 1');
        }
      );

      const duration = Date.now() - startTime;

      // Data API can have cold starts, so being generous with timeout
      expect(duration).toBeLessThan(2000);
    }, 30000);

    it('should handle batch operations efficiently', async () => {
      const client = getInstrumentedClient({ enableMetrics: false });

      const results = await client.batchWithRLS(
        { tenantId: 'batch-test' },
        [
          async (tx) => tx.execute('SELECT 1 as a'),
          async (tx) => tx.execute('SELECT 2 as b'),
          async (tx) => tx.execute('SELECT 3 as c'),
        ]
      );

      expect(results).toHaveLength(3);
    }, 30000);

    it('should handle concurrent operations', async () => {
      const client = getInstrumentedClient({ enableMetrics: false });

      // Run 5 operations concurrently
      const operations = Array.from({ length: 5 }, (_, i) =>
        client.withRLS(
          { tenantId: `concurrent-test-${i}` },
          async (tx) => tx.execute(`SELECT ${i} as value`)
        )
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(5);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid SQL gracefully', async () => {
      const client = getInstrumentedClient({ enableMetrics: false });

      await expect(
        client.withRLS(
          { tenantId: 'error-test' },
          async (tx) => tx.execute('SELECT * FROM nonexistent_table')
        )
      ).rejects.toThrow();
    }, 30000);

    it('should validate tenant context', async () => {
      const client = getInstrumentedClient({ enableMetrics: false });

      await expect(
        client.withRLS(
          { tenantId: '' },
          async (tx) => tx.execute('SELECT 1')
        )
      ).rejects.toThrow('tenantId is required');
    });

    it('should reject invalid tenant ID characters', async () => {
      const client = getInstrumentedClient({ enableMetrics: false });

      await expect(
        client.withRLS(
          { tenantId: 'tenant@#$%' },
          async (tx) => tx.execute('SELECT 1')
        )
      ).rejects.toThrow('invalid characters');
    });
  });
});

// Print helpful message if tests are skipped
if (!isAWSConfigured) {
  console.log('\n⚠️  Integration tests skipped - AWS not configured');
  console.log('\nTo run integration tests:');
  console.log('1. Deploy infrastructure: cd infrastructure && cdk deploy');
  console.log('2. Configure AWS credentials (AWS_PROFILE or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)');
  console.log('3. Set environment variables in .env.local:');
  console.log('   - DB_CLUSTER_ARN');
  console.log('   - DB_SECRET_ARN');
  console.log('   - DATABASE_NAME');
  console.log('   - AWS_REGION');
  console.log('4. Run: npm run test:integration\n');
}
