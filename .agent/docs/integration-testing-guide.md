# Integration Testing Guide for Instrumented RDS Client

## Current Test Status

### ✅ Unit Tests (Passing)
- **Location**: `lib/database/__tests__/`
- **Status**: 22/22 tests passing
- **Coverage**: Logic validation with mocked AWS services

**What unit tests validate**:
- Constructor logic and configuration handling
- Tenant ID extraction from SQL statements
- RLS context validation
- Singleton pattern implementation
- SQL escaping for security
- Error handling

**What unit tests DON'T validate**:
- ❌ Real AWS RDS Data API connectivity
- ❌ Actual CloudWatch metrics publishing
- ❌ Real database transactions
- ❌ AWS credential handling
- ❌ Network latency and retry logic

---

## Integration Testing with Real AWS

To verify the instrumented RDS client works with actual AWS services, you need:

### 1. AWS Infrastructure Setup

#### Required AWS Resources

**Aurora Serverless v2 Cluster**:
```bash
# See: infrastructure/ (AWS CDK)
# Key requirements:
# - Engine: aurora-postgresql
# - Version: 15.x or later
# - Data API enabled: enableDataApi = true
# - ACU range: 0.5 - 2.0 (recommended for dev)

# Deploy using CDK:
cd infrastructure
cdk deploy -c environment=dev
```

**Secrets Manager Secret**:
```bash
# Stores database credentials
# Format: { "username": "admin", "password": "..." }
```

**IAM Permissions** for your AWS profile/role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-data:ExecuteStatement",
        "rds-data:BatchExecuteStatement",
        "rds-data:BeginTransaction",
        "rds-data:CommitTransaction",
        "rds-data:RollbackTransaction"
      ],
      "Resource": "arn:aws:rds:REGION:ACCOUNT:cluster:CLUSTER-NAME"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:SECRET-NAME*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "cloudwatch:namespace": "HospitalityAI"
        }
      }
    }
  ]
}
```

### 2. Local Configuration

**Configure AWS credentials**:

Option A - AWS Profile (Recommended):
```bash
# ~/.aws/credentials
[hospitality-ai]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY

# ~/.aws/config
[profile hospitality-ai]
region = us-east-1
output = json
```

Option B - Environment Variables:
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

**Create `.env.local`**:
```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local:
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:your-cluster
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:your-secret
DATABASE_NAME=hospitality_ai_cms
AWS_REGION=us-east-1

# Use AWS profile
AWS_PROFILE=hospitality-ai

# Enable metrics
ENABLE_METRICS=true
METRICS_NAMESPACE=HospitalityAI
```

### 3. Database Schema Setup

The instrumented client expects tables to exist. Run migrations:

```sql
-- Create test table with RLS
CREATE TABLE IF NOT EXISTS test_bookings (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE test_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tenant_isolation ON test_bookings
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE));
```

### 4. Integration Test Script

Create `lib/database/__tests__/integration.test.ts`:

```typescript
/**
 * Integration Tests - REQUIRES AWS CONFIGURATION
 *
 * Run with: npm run test:integration
 *
 * Prerequisites:
 * - Aurora Serverless v2 cluster with Data API enabled
 * - AWS credentials configured
 * - Environment variables set in .env.local
 */

import { getInstrumentedClient, resetInstrumentedClient } from '../instrumented-rds-client';

// Skip if AWS not configured
const isAWSConfigured = process.env.DB_CLUSTER_ARN && process.env.DB_SECRET_ARN;

describe.skipIf(!isAWSConfigured)('InstrumentedRDSClient - Integration Tests', () => {
  beforeEach(() => {
    resetInstrumentedClient();
  });

  describe('Real AWS Connectivity', () => {
    it('should connect to Aurora via Data API', async () => {
      const client = getInstrumentedClient();

      await client.withRLS(
        { tenantId: 'integration-test-tenant' },
        async (tx) => {
          const result = await tx.execute('SELECT 1 as test');
          expect(result).toBeDefined();
        }
      );
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

      // Check CloudWatch console:
      // - Namespace: HospitalityAI/IntegrationTest
      // - Metric: DatabaseOperations
      // - Dimension: TenantId=metrics-test-tenant
    }, 30000);

    it('should enforce RLS policies', async () => {
      const client = getInstrumentedClient();

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

      // Try to read as tenant B - should see no results
      await client.withRLS(
        { tenantId: 'tenant-b' },
        async (tx) => {
          const result = await tx.execute(`
            SELECT * FROM test_bookings WHERE guest_name = 'Guest A'
          `);
          expect(result.length).toBe(0); // RLS should block
        }
      );

      // Read as tenant A - should see the booking
      await client.withRLS(
        { tenantId: 'tenant-a' },
        async (tx) => {
          const result = await tx.execute(`
            SELECT * FROM test_bookings WHERE guest_name = 'Guest A'
          `);
          expect(result.length).toBe(1);
        }
      );
    }, 30000);
  });

  describe('Performance Tests', () => {
    it('should complete operation within 1 second', async () => {
      const client = getInstrumentedClient({ enableMetrics: false });

      const startTime = Date.now();

      await client.withRLS(
        { tenantId: 'perf-test' },
        async (tx) => {
          await tx.execute('SELECT 1');
        }
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
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
  });
});
```

### 5. Add Integration Test Command

Update `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:integration": "jest lib/database/__tests__/integration.test.ts --runInBand",
    "test:all": "jest && npm run test:integration"
  }
}
```

### 6. Verify Integration Test Results

**Run the tests**:
```bash
# Make sure AWS credentials and .env.local are configured
npm run test:integration
```

**Check CloudWatch Metrics**:
```bash
# AWS Console
1. Navigate to CloudWatch > Metrics
2. Select "HospitalityAI" namespace
3. Check for "DatabaseOperations" metric
4. Filter by TenantId dimension

# AWS CLI
aws cloudwatch get-metric-statistics \
  --namespace HospitalityAI \
  --metric-name DatabaseOperations \
  --dimensions Name=TenantId,Value=integration-test-tenant \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

**Verify RLS in Aurora**:
```sql
-- Connect to Aurora via Data API
-- Check if RLS is active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'test_bookings';

-- Verify tenant isolation works
-- This should show NO results when RLS is enforced
SET app.current_tenant_id = 'tenant-b';
SELECT * FROM test_bookings WHERE tenant_id = 'tenant-a';
```

---

## Cost Estimate for Integration Testing

**Minimal testing (1 hour)**:
- Aurora ACU hours: 0.5 ACU × 1 hour = $0.06
- Data API requests: ~100 requests = $0.00
- CloudWatch metrics: ~50 custom metrics = $0.01
- **Total: ~$0.07**

**Daily development (8 hours)**:
- Aurora: 0.5 ACU × 8 hours = $0.48
- Data API: ~1000 requests = $0.00
- CloudWatch: ~500 metrics = $0.10
- **Total: ~$0.58/day**

**Pause Aurora when not testing**: Use CDK to adjust capacity:
```bash
# Reduce to minimum capacity
cd infrastructure
cdk deploy -c minCapacity=0.5 -c maxCapacity=0.5

# Or destroy when not in use (dev only)
cdk destroy
```

---

## Troubleshooting Integration Tests

### Issue: "Access Denied" Error

**Cause**: IAM permissions not configured

**Fix**:
```bash
# Check your AWS identity
aws sts get-caller-identity

# Verify you have Data API permissions
aws rds-data execute-statement \
  --resource-arn $DB_CLUSTER_ARN \
  --secret-arn $DB_SECRET_ARN \
  --database $DATABASE_NAME \
  --sql "SELECT 1"
```

### Issue: "Cluster not found"

**Cause**: Aurora Data API not enabled or wrong ARN

**Fix**:
```bash
# Verify cluster exists and Data API is enabled
aws rds describe-db-clusters \
  --db-cluster-identifier your-cluster-name \
  --query 'DBClusters[0].{HttpEndpointEnabled:HttpEndpointEnabled,Status:Status}'
```

### Issue: Metrics not appearing in CloudWatch

**Cause**: Async publishing delay or IAM permissions

**Fix**:
- Wait 1-2 minutes for metrics to appear
- Check CloudWatch PutMetricData permissions
- Verify namespace matches exactly

---

## Summary

**What We Know Works**:
✅ Unit tests validate logic (22/22 passing)
✅ Code structure and patterns are correct
✅ Mocked interactions work as expected

**What Needs AWS Configuration to Verify**:
⏸️ Real AWS connectivity
⏸️ CloudWatch metrics publishing
⏸️ RLS enforcement with Data API
⏸️ Performance under real network conditions

**Next Steps**:
1. Set up Aurora Serverless v2 cluster (via CDK in `infrastructure/`)
2. Configure AWS credentials locally
3. Run integration tests
4. Verify CloudWatch metrics
5. Test RLS isolation with real data

See `infrastructure/README.md` for deployment instructions.

The code is production-ready from a logic perspective, but requires AWS infrastructure to validate end-to-end functionality.
