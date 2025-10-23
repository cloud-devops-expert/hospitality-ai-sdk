# CloudWatch: AWS Native vs. Custom Publisher

## What AWS Provides Automatically

### 1. RDS Database Metrics (Free)

**Namespace**: `AWS/RDS`
**Granularity**: Database instance level
**Update Frequency**: Every 1 minute

```
CPUUtilization
DatabaseConnections
FreeableMemory
ReadLatency
WriteLatency
ReadIOPS
WriteIOPS
NetworkReceiveThroughput
NetworkTransmitThroughput
ServerlessDatabaseCapacity (for Aurora Serverless)
```

**Dimensions**:
- `DBInstanceIdentifier`: Your Aurora instance
- `DBClusterIdentifier`: Your Aurora cluster

**Use case**: Monitor database health, not tenant usage

**Example Query**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=hospitality-ai-dev \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-21T00:00:00Z \
  --period 3600 \
  --statistics Average
```

---

### 2. Performance Insights (Optional, $0.009/vCPU-hour)

**Enabled**: When Performance Insights is turned on
**Granularity**: Query level
**Retention**: 7 days free, up to 2 years paid

**What it tracks**:
- Individual SQL queries
- Query execution time
- Wait events
- Database load
- **Data API queries** show as "Host: RDS Data API"

**Dimensions**:
- Query SQL text
- Database user
- Host (shows "RDS Data API" for Data API calls)

**Use case**: Debug slow queries, optimize database performance

**Limitation**: ❌ **No tenant-level breakdown**

**Example**: You can see "10,000 SELECT queries from Data API" but NOT "tenant-123 made 5,000 requests"

---

### 3. AWS API Usage Metrics (Free)

**Namespace**: `AWS/Usage`
**Granularity**: AWS service level
**Update Frequency**: Every 1 minute

```
CallCount (for RDS-Data API calls)
```

**Dimensions**:
- `Service`: RDS-Data
- `Type`: API
- `Resource`: ExecuteStatement, BatchExecuteStatement, etc.
- `Class`: None

**Use case**: Track overall Data API usage across ALL tenants

**Example Query**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Usage \
  --metric-name CallCount \
  --dimensions Name=Service,Value=RDS-Data Name=Type,Value=API \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-21T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

**Limitation**: ❌ **No tenant-level breakdown**

---

## What's Missing from AWS Native Metrics

| Need | AWS Native | Solution |
|------|------------|----------|
| **Tenant-level request counts** | ❌ No | ✅ Custom publisher |
| **Per-tenant bandwidth usage** | ❌ No | ✅ Custom publisher |
| **Tenant API endpoint breakdown** | ❌ No | ✅ Custom publisher |
| **Per-tenant error rates** | ❌ No | ✅ Custom publisher |
| **Fair use alerts per tenant** | ❌ No | ✅ Custom CloudWatch Alarms |
| **Billing metrics per tenant** | ❌ No | ✅ Custom metrics + queries |

---

## Custom Publisher: What It Adds

### Custom Metrics Published

**Namespace**: `HospitalityAI/Tenants`

```
RequestCount
ResponseTime
BytesTransferred
ErrorCount
SuccessCount
```

**Dimensions**:
- `TenantId`: "tenant-123"
- `Endpoint`: "/api/bookings"
- `Method`: "GET"

### Why You Need This

#### 1. **Tenant-Level Billing**

**Without custom publisher**:
```
❌ You CANNOT answer: "How many API calls did tenant-123 make this month?"
```

**With custom publisher**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace HospitalityAI/Tenants \
  --metric-name RequestCount \
  --dimensions Name=TenantId,Value=tenant-123 \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-02-01T00:00:00Z \
  --period 2592000 \
  --statistics Sum

# Output: 1,250,000 requests → Bill tenant accordingly
```

#### 2. **Fair Use Monitoring**

**Without custom publisher**:
```
❌ You CANNOT set alerts like: "Notify if tenant-123 exceeds 1M requests/month"
```

**With custom publisher**:
```hcl
resource "aws_cloudwatch_metric_alarm" "tenant_fair_use" {
  alarm_name          = "tenant-123-fair-use"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 30
  metric_name         = "RequestCount"
  namespace           = "HospitalityAI/Tenants"
  period              = 86400
  statistic           = "Sum"
  threshold           = 1000000

  dimensions = {
    TenantId = "tenant-123"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

#### 3. **Tenant Dashboards**

**Without custom publisher**:
- You can see: "Database has 500 connections"
- You CANNOT see: "tenant-123 is using 200 connections"

**With custom publisher**:
- Create per-tenant CloudWatch dashboards
- Show: Requests, bandwidth, errors, latency by tenant
- Filter by endpoint, method, time range

#### 4. **Proactive Support**

**Without custom publisher**:
```
❌ Tenant complains: "API is slow"
❌ You check: Database CPU is fine, connections are low
❌ No way to identify which tenant or endpoint is having issues
```

**With custom publisher**:
```bash
# Query: Which tenant has high latency?
aws cloudwatch get-metric-statistics \
  --namespace HospitalityAI/Tenants \
  --metric-name ResponseTime \
  --dimensions Name=TenantId,Value=tenant-123 \
  --start-time ... \
  --statistics Average,p99

# Answer: tenant-123's /api/reports endpoint is averaging 5000ms
```

---

## Architecture Comparison

### AWS Native Only

```
┌─────────────────┐
│  Tenant API     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Data API       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────────┐
│  Aurora         │─────▶│  CloudWatch          │
│  Database       │      │  AWS/RDS metrics     │
└─────────────────┘      │  - CPU, Memory       │
                         │  - Connections       │
                         │  - No tenant info    │
                         └──────────────────────┘

❌ Can answer: "Is database healthy?"
✅ Can answer: "Which tenant is using too much?"
```

### With Custom Publisher

```
┌─────────────────┐
│  Tenant API     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CloudWatch Middleware              │
│  → Track: tenantId, endpoint, time  │
└────────┬────────────────────────────┘
         │
         ├──────────────────┬─────────────────┐
         │                  │                 │
         ▼                  ▼                 ▼
┌─────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Data API   │  │  CloudWatch      │  │  CloudWatch     │
│             │  │  Custom Metrics  │  │  Alarms         │
│             │  │  - Per tenant    │  │  - Fair use     │
└─────────────┘  │  - Per endpoint  │  │  - High errors  │
                 │  - Billing data  │  └─────────────────┘
                 └──────────────────┘

✅ Can answer: "Is database healthy?"
✅ Can answer: "Which tenant is using too much?"
✅ Can answer: "How much to bill each tenant?"
✅ Can answer: "Which endpoint is slow for tenant-123?"
```

---

## Cost Comparison

### AWS Native Metrics (Free Tier)

| Metric | Cost |
|--------|------|
| RDS metrics (AWS/RDS) | **Free** |
| API usage metrics (AWS/Usage) | **Free** |
| Performance Insights (7 days) | **Free** |
| **Total** | **$0** |

**What you get**: Database health monitoring

---

### Custom Publisher ($3.40/tenant/month)

| Component | Quantity | Unit Cost | Total |
|-----------|----------|-----------|-------|
| Custom metrics | 10 metrics/tenant | $0.30/metric | $3.00 |
| CloudWatch alarms | 3 alarms/tenant | $0.10/alarm | $0.30 |
| Dashboard (shared) | 1 dashboard | $3.00/month | $0.10 (amortized) |
| **Total per tenant** | - | - | **$3.40** |

**What you get**: Tenant billing, fair use alerts, per-tenant dashboards

**Break-even**: >5.3M requests/month per tenant (vs. PostgreSQL custom tracking at $0.62/1M)

---

## Decision Matrix

### Use AWS Native Only (Free)

✅ **Good for**:
- Internal monitoring
- Database health checks
- No multi-tenant billing needed
- Small number of tenants (<10)

❌ **Cannot do**:
- Tenant-level billing
- Fair use enforcement
- Per-tenant performance tracking
- Tenant-specific alerts

---

### Use Custom Publisher ($3.40/tenant/month)

✅ **Good for**:
- Multi-tenant SaaS
- Fair use compliance
- Per-tenant billing
- Proactive support
- Large tenant base (>50)

✅ **Provides**:
- Tenant request counts
- Bandwidth tracking
- Error rate by tenant
- Latency by endpoint
- Automatic fair use alerts

---

## Recommendation

### For Your Use Case

Since you need **fair use compliance and tenant billing**, you **MUST use a custom publisher** because:

1. ❌ **AWS native metrics don't track tenant-level data**
2. ✅ **You need to answer**: "How much did tenant-123 use this month?"
3. ✅ **You need to alert**: "tenant-123 exceeded their quota"
4. ✅ **You need to bill**: Based on actual tenant usage

### Alternative: PostgreSQL Tracking

If cost is a concern, you could use **PostgreSQL-based tracking** instead:

| Approach | Cost | Pros | Cons |
|----------|------|------|------|
| **CloudWatch Publisher** | $3.40/tenant/month (fixed) | Native AWS, visual dashboards | Fixed cost per tenant |
| **PostgreSQL Tracking** | $0.62/1M requests (variable) | Cheaper at low volume | Scales with usage |

**Break-even**: ~5.3M requests/month per tenant

---

## Conclusion

**AWS provides**:
- ✅ Database health metrics (free)
- ✅ API call counts (free, but no tenant breakdown)
- ✅ Query performance tracking (optional, not tenant-specific)

**You need to build**:
- ✅ Tenant-level request tracking
- ✅ Per-tenant bandwidth monitoring
- ✅ Fair use alerting per tenant
- ✅ Billing metrics by tenant

**Recommended solution**: Implement the custom CloudWatch publisher for tenant-specific metrics while leveraging AWS native metrics for database health monitoring.
