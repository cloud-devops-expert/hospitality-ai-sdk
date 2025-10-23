# CloudTrail for Tenant Metrics - Cost Analysis

## Executive Summary

Using AWS CloudTrail to track RDS Data API usage (ExecuteStatement, BatchExecuteStatement) for tenant billing and fair use compliance.

**TL;DR:** ❌ **NOT RECOMMENDED** - CloudTrail redacts request parameters making tenant identification difficult without architectural changes.

---

## What CloudTrail Logs for RDS Data API

### Log Coverage

✅ **Logged Operations:**
- `ExecuteStatement` - Individual SQL queries
- `BatchExecuteStatement` - Batch SQL operations
- `BeginTransaction` - Transaction start
- `CommitTransaction` - Transaction commit
- `RollbackTransaction` - Transaction rollback

### Event Classification

**Aurora Serverless v2 / Provisioned:**
- Event source: `rdsdataapi.amazonaws.com`
- Event type: **Data Events** (not management events)
- Must be explicitly enabled in CloudTrail trail configuration

**Aurora Serverless v1:**
- Event source: `rdsdata.amazonaws.com`
- Event type: **Management Events**
- Logged by default (first copy free)

---

## What's in CloudTrail Logs

### Available Fields

```json
{
  "eventVersion": "1.08",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AIDAI...",
    "arn": "arn:aws:iam::123456789012:user/api-lambda-role",
    "accountId": "123456789012",
    "userName": "api-lambda-role"
  },
  "eventTime": "2024-01-20T15:30:45Z",
  "eventSource": "rdsdataapi.amazonaws.com",
  "eventName": "ExecuteStatement",
  "awsRegion": "us-east-1",
  "sourceIPAddress": "10.0.1.100",
  "userAgent": "aws-sdk-js/3.0.0",
  "requestParameters": {
    "resourceArn": "arn:aws:rds:us-east-1:123456789012:cluster:my-cluster",
    "secretArn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:...",
    "database": "**********",
    "schema": "**********",
    "sql": "**********",
    "parameters": [
      {
        "name": "tenant_id",
        "value": "**********"
      }
    ],
    "continueAfterTimeout": false,
    "includeResultMetadata": true
  },
  "responseElements": null,
  "requestID": "abc123...",
  "eventID": "xyz789...",
  "eventType": "AwsApiCall"
}
```

### 🚨 Critical Limitation: Redacted Parameters

**Problem**: AWS redacts sensitive data from CloudTrail logs:
- ❌ `database` → `**********`
- ❌ `schema` → `**********`
- ❌ `sql` → `**********`
- ❌ `parameters` (including `tenant_id`) → `**********`

**AWS Documentation:**
> "Event data doesn't reveal the database name, schema name, or SQL statements in requests to the Data API."

**This means**: You **CANNOT** directly extract `tenant_id` from SQL parameters or queries.

---

## Workaround: IAM-Based Tenant Identification

### Strategy: Encode Tenant in IAM Identity

Since `userIdentity` is NOT redacted, you could identify tenants via IAM:

#### Option 1: Dedicated IAM Role per Tenant

```typescript
// Create IAM role for each tenant
const roleName = `hospitality-api-tenant-${tenantId}`;

// Lambda assumes role based on tenant
const credentials = await sts.assumeRole({
  RoleArn: `arn:aws:iam::123456789012:role/${roleName}`,
  RoleSessionName: `tenant-${tenantId}-session`
});

// CloudTrail will show:
// userIdentity.arn = arn:aws:iam::123456789012:role/hospitality-api-tenant-abc123
// userIdentity.sessionContext.sessionIssuer.userName = hospitality-api-tenant-abc123
```

**Pros:**
- ✅ Tenant ID visible in CloudTrail logs
- ✅ Query by IAM role name

**Cons:**
- ❌ One IAM role per tenant (limit: 5,000 roles per account)
- ❌ AssumeRole overhead (~50ms per request)
- ❌ Complex IAM management
- ❌ Breaks with >5,000 tenants

#### Option 2: Session Name Tagging

```typescript
// Encode tenant in session name
const credentials = await sts.assumeRole({
  RoleArn: 'arn:aws:iam::123456789012:role/shared-api-role',
  RoleSessionName: `tenant-${tenantId}-user-${userId}`
});

// CloudTrail will show:
// userIdentity.arn includes session name
```

**Pros:**
- ✅ Single shared IAM role
- ✅ Tenant ID visible in session name
- ✅ Scales to unlimited tenants

**Cons:**
- ❌ AssumeRole overhead (~50ms per request)
- ❌ Complex credential management
- ❌ Adds latency to every API call

---

## Cost Breakdown

### Scenario: 10 tenants, 10M requests/month

#### 1. CloudTrail Data Event Logging

```
Cost: $0.10 per 100,000 events

Monthly requests: 10,000,000
CloudTrail cost: 10,000,000 / 100,000 * $0.10 = $10.00/month
```

#### 2. CloudWatch Logs Storage (CloudTrail → CWL)

CloudTrail can send logs to CloudWatch Logs for querying.

```
Average log size per event: ~2 KB (compressed ~400 bytes)
Monthly log data: 10M * 0.4 KB = 4 GB

Storage cost: 4 GB * $0.50 = $2.00/month
```

#### 3. Query Costs (CloudWatch Logs Insights)

```
Cost: $0.005 per GB scanned

Monthly queries to analyze tenant usage:
- Daily rollups: 30 queries * 4 GB = 120 GB scanned
- Ad-hoc queries: 50 GB scanned

Query cost: 170 GB * $0.005 = $0.85/month
```

#### 4. Alternative: Athena Queries (CloudTrail → S3)

```
Cost: $5.00 per TB scanned

Monthly data in S3: 4 GB
Monthly queries: 170 GB scanned

Athena cost: 170 GB / 1024 * $5.00 = $0.83/month
```

### Total CloudTrail-Based Cost

| Component | Cost/Month |
|-----------|------------|
| CloudTrail data events | $10.00 |
| CloudWatch Logs storage | $2.00 |
| Query costs (Insights) | $0.85 |
| **Total** | **$12.85** |

**Per tenant:** $12.85 / 10 = **$1.29/tenant/month**

---

## Comparison: CloudTrail vs Custom CloudWatch Metrics

### Custom CloudWatch Metrics (Current Implementation)

```
Cost: $0.30 per metric/month
Metrics per tenant: 10 (RequestCount, ResponseTime, BytesTransferred, etc.)

Cost per tenant: 10 * $0.30 = $3.00/month
+ 3 alarms * $0.10 = $0.30/month
= $3.30/tenant/month
```

### Cost Comparison (10 Tenants, 10M Requests/Month)

| Approach | Cost/Month | Per Tenant | Scales to 100 Tenants |
|----------|------------|------------|----------------------|
| **CloudTrail + Logs Insights** | $12.85 | $1.29 | $128.50 |
| **Custom CloudWatch Metrics** | $33.00 | $3.30 | $330.00 |

**Winner:** CloudTrail is **61% cheaper** at this scale.

---

## Scaling Analysis

### 100 Tenants, 100M Requests/Month

#### CloudTrail Approach

```
CloudTrail events: 100M / 100,000 * $0.10 = $100.00
Storage: 40 GB * $0.50 = $20.00
Query: 500 GB * $0.005 = $2.50

Total: $122.50/month
Per tenant: $1.23/month
```

#### Custom Metrics Approach

```
Metrics: 100 tenants * 10 metrics * $0.30 = $300.00
Alarms: 100 tenants * 3 alarms * $0.10 = $30.00

Total: $330.00/month
Per tenant: $3.30/month
```

**CloudTrail saves:** $207.50/month (63% cheaper)

### 1,000 Tenants, 1B Requests/Month

#### CloudTrail Approach

```
CloudTrail events: 1B / 100,000 * $0.10 = $1,000.00
Storage: 400 GB * $0.50 = $200.00
Query: 5 TB * $0.005 = $25.00

Total: $1,225.00/month
Per tenant: $1.23/month
```

#### Custom Metrics Approach

```
Metrics: 1,000 * 10 * $0.30 = $3,000.00
Alarms: 1,000 * 3 * $0.10 = $300.00

Total: $3,300.00/month
Per tenant: $3.30/month
```

**CloudTrail saves:** $2,075.00/month (63% cheaper)

---

## Trade-Offs

### CloudTrail Pros

✅ **61-63% cheaper** than custom CloudWatch metrics
✅ **Automatic logging** - no instrumentation needed
✅ **Complete audit trail** - every Data API call logged
✅ **No application changes** - works out of the box
✅ **Scales linearly** - cost per request doesn't increase
✅ **Compliance benefits** - full API audit trail

### CloudTrail Cons

❌ **Tenant identification requires IAM workaround**
   - AssumeRole per request (~50ms overhead)
   - Complex credential management
   - Requires architectural changes

❌ **Query latency**
   - CloudWatch Logs Insights: 10-30 seconds
   - Athena: 5-15 seconds
   - Custom metrics: Real-time aggregation

❌ **No real-time metrics**
   - CloudTrail has 5-15 minute delay
   - Cannot use for real-time rate limiting
   - Historical analysis only

❌ **Complex querying**
   - Must parse JSON logs
   - Extract tenant from IAM session name
   - More complex than simple metric queries

❌ **No built-in dashboards**
   - Must build custom dashboards
   - Custom metrics have native CloudWatch graphs

---

## Implementation Options

### Option A: IAM Session Name Approach (Recommended for CloudTrail)

```typescript
// lib/auth/tenant-credentials.ts

import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';

export async function getTenantCredentials(tenantId: string, userId?: string) {
  const sts = new STSClient({ region: 'us-east-1' });

  const sessionName = `tenant-${tenantId}${userId ? `-user-${userId}` : ''}`;

  const response = await sts.send(
    new AssumeRoleCommand({
      RoleArn: process.env.SHARED_DATA_API_ROLE_ARN!,
      RoleSessionName: sessionName,
      DurationSeconds: 3600, // Cache for 1 hour
    })
  );

  return response.Credentials;
}

// lib/database/drizzle-rls-client-cloudtrail.ts

export class DrizzleRLSClientWithCloudTrail {
  async withRLS<T>(context: RLSContext, callback: (tx: any) => Promise<T>): Promise<T> {
    // Get tenant-specific credentials (logged in CloudTrail)
    const credentials = await getTenantCredentials(context.tenantId, context.userId);

    // Create client with tenant credentials
    const rdsClient = new RDSDataClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken!,
      },
    });

    const db = drizzle(rdsClient, {
      database: this.config.database,
      secretArn: this.config.secretArn,
      resourceArn: this.config.resourceArn,
    });

    return await db.transaction(async (tx) => {
      // Set RLS variables
      await tx.execute(`SET LOCAL app.current_tenant_id = '${context.tenantId}'`);
      return await callback(tx);
    });
  }
}
```

**Query CloudTrail logs:**

```
# CloudWatch Logs Insights query
fields @timestamp, userIdentity.sessionContext.sessionIssuer.userName, eventName
| parse userIdentity.sessionContext.sessionIssuer.userName /tenant-(?<tenantId>[^-]+)/
| filter eventName = "ExecuteStatement"
| stats count() as requestCount by tenantId
| sort requestCount desc
```

### Option B: Stick with Custom Metrics (Current Implementation)

Keep the existing `lib/metrics/cloudwatch-publisher.ts` implementation:

**Pros:**
- ✅ Already implemented and working
- ✅ Real-time metrics
- ✅ Simple tenant extraction (from HTTP headers)
- ✅ No IAM complexity
- ✅ Native CloudWatch dashboards

**Cons:**
- ❌ More expensive ($3.30/tenant vs $1.23/tenant)
- ❌ Requires application instrumentation

---

## Recommendation

### For Your Use Case (Multi-Tenant SaaS with Fair Use Compliance):

**Stick with Custom CloudWatch Metrics** (`lib/metrics/cloudwatch-publisher.ts`)

**Why:**

1. **No architectural changes required**
   - CloudTrail approach requires AssumeRole per request
   - Adds 50ms latency per API call
   - Complex credential caching logic

2. **Real-time metrics**
   - CloudTrail has 5-15 minute delay
   - Cannot be used for real-time alerts
   - Custom metrics are instant

3. **Simpler implementation**
   - Already implemented and working
   - No IAM session management
   - No complex log parsing

4. **Cost difference is acceptable**
   - $3.30/tenant vs $1.23/tenant
   - For 100 tenants: $330 vs $123 = $207/month difference
   - Worth the simplicity and real-time capabilities

5. **Better UX**
   - Native CloudWatch dashboards
   - Simple metric queries
   - Easy to understand

### When to Use CloudTrail Instead:

✅ **Use CloudTrail if:**
- You have >500 tenants (cost savings become significant)
- You only need historical billing (not real-time alerts)
- You already use AssumeRole for tenant isolation
- You need compliance audit trail (CloudTrail provides this anyway)

❌ **Don't use CloudTrail if:**
- You need real-time metrics or alerts
- You want simple implementation
- Tenant count is <500 (cost benefit is small)
- You don't want to refactor authentication

---

## Hybrid Approach (Best of Both Worlds)

### Use BOTH for Different Purposes:

```typescript
// 1. Enable CloudTrail for compliance/audit (you probably already have this)
//    → Full API audit trail
//    → Security forensics
//    → Compliance reporting

// 2. Keep custom CloudWatch metrics for operational monitoring
//    → Real-time tenant usage
//    → Fair use alerts
//    → Live dashboards
```

**Total Cost (100 tenants):**
- CloudTrail: $122.50/month (audit/compliance)
- Custom metrics: $330/month (operational monitoring)
- **Total: $452.50/month**

**Benefits:**
- ✅ Full audit trail (CloudTrail)
- ✅ Real-time metrics (custom)
- ✅ Best of both worlds

---

## Cost Summary

### Single Tenant, 1M Requests/Month

| Approach | Monthly Cost | Latency Overhead | Complexity |
|----------|-------------|------------------|------------|
| **Custom CloudWatch Metrics** | $3.30 | <1ms | Low |
| **CloudTrail + IAM Sessions** | $1.23 | +50ms | High |

### 100 Tenants, 100M Requests/Month

| Approach | Monthly Cost | Cost Savings | Real-Time |
|----------|-------------|--------------|-----------|
| **Custom CloudWatch Metrics** | $330.00 | - | ✅ Yes |
| **CloudTrail + Logs Insights** | $122.50 | -63% | ❌ No |

### 1,000 Tenants, 1B Requests/Month

| Approach | Monthly Cost | Cost Savings | Implementation |
|----------|-------------|--------------|----------------|
| **Custom CloudWatch Metrics** | $3,300.00 | - | Simple |
| **CloudTrail + Logs Insights** | $1,225.00 | -63% | Complex |

---

## Final Verdict

**For <500 tenants:** Keep custom CloudWatch metrics ($207/month difference isn't worth the complexity)

**For >500 tenants:** Consider CloudTrail approach (save $2,000+/month)

**Your current implementation** (`lib/metrics/cloudwatch-publisher.ts`) is the right choice for now. Re-evaluate when you cross 500 tenants.
