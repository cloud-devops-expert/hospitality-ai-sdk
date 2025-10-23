# Tenant Metrics with CloudWatch

AWS-native observability using CloudWatch Metrics, Alarms, and Dashboards.

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Tenant API Request                              │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│  CloudWatch Metrics Middleware                   │
│  - Async batch publishing (20 metrics/request)   │
│  - <2ms overhead                                 │
│  - Automatic aggregation by AWS                  │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│  CloudWatch Metrics                              │
│  Namespace: HospitalityAI/Tenants                │
│  Dimensions: TenantId, Endpoint, Method          │
│                                                  │
│  Metrics:                                        │
│  - RequestCount                                  │
│  - ResponseTime                                  │
│  - BytesTransferred                              │
│  - ErrorCount                                    │
└────────────────┬─────────────────────────────────┘
                 │
                 ├──────────────────────────────────┐
                 │                                  │
                 ▼                                  ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│  CloudWatch Alarms       │    │  CloudWatch Dashboards  │
│  - Fair use alerts       │    │  - Tenant usage views   │
│  - Error rate alerts     │    │  - API performance      │
│  - SNS notifications     │    │  - Cost tracking        │
└──────────────────────────┘    └─────────────────────────┘
```

## Benefits

✅ **AWS-Native**: No custom infrastructure needed
✅ **Auto-scaling**: CloudWatch handles aggregation
✅ **Built-in Alerting**: SNS integration out of the box
✅ **Rich Dashboards**: Visual metrics without coding
✅ **Logs Insights**: SQL-like queries for analysis
✅ **Low Latency**: Async publishing, <2ms overhead

## Cost Structure

| Component | Cost | Notes |
|-----------|------|-------|
| Custom Metrics | $0.30/metric/month | ~10 metrics per tenant |
| CloudWatch Alarms | $0.10/alarm/month | ~3 alarms per tenant |
| CloudWatch Dashboard | $3/dashboard/month | Shared across tenants |
| CloudWatch Logs | $0.50/GB ingested | Optional detailed logging |
| **Per Tenant** | **~$3.30/month** | Fixed cost, unlimited requests |

**Comparison**:
- PostgreSQL custom: $0.62 per 1M requests (variable)
- **CloudWatch: $3.30/month** (fixed, scales to billions)

**Break-even**: >5.3M requests/month → CloudWatch is cheaper

---

## Implementation

### 1. CloudWatch Metrics Publisher

```typescript
// lib/metrics/cloudwatch-publisher.ts

import {
  CloudWatchClient,
  PutMetricDataCommand,
  MetricDatum,
} from '@aws-sdk/client-cloudwatch';

export interface TenantMetric {
  tenantId: string;
  endpoint: string;
  method: string;
  durationMs: number;
  statusCode: number;
  bytesTransferred: number;
  timestamp?: Date;
}

export class CloudWatchMetricsPublisher {
  private client: CloudWatchClient;
  private queue: TenantMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private readonly NAMESPACE = 'HospitalityAI/Tenants';
  private readonly BATCH_SIZE = 20; // CloudWatch limit
  private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds

  constructor() {
    this.client = new CloudWatchClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.startFlushInterval();

    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => this.destroy());
      process.on('SIGTERM', () => this.destroy());
      process.on('SIGINT', () => this.destroy());
    }
  }

  /**
   * Publish tenant metric (non-blocking)
   */
  async publish(metric: TenantMetric): Promise<void> {
    this.queue.push(metric);

    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush().catch((err) => {
        console.error('[CloudWatch] Flush failed:', err);
      });
    }
  }

  /**
   * Flush metrics to CloudWatch
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.BATCH_SIZE);

    try {
      const metricData: MetricDatum[] = [];

      for (const metric of batch) {
        const timestamp = metric.timestamp || new Date();
        const dimensions = [
          { Name: 'TenantId', Value: metric.tenantId },
          { Name: 'Endpoint', Value: metric.endpoint },
          { Name: 'Method', Value: metric.method },
        ];

        // Request count
        metricData.push({
          MetricName: 'RequestCount',
          Value: 1,
          Unit: 'Count',
          Timestamp: timestamp,
          Dimensions: dimensions,
        });

        // Response time
        metricData.push({
          MetricName: 'ResponseTime',
          Value: metric.durationMs,
          Unit: 'Milliseconds',
          Timestamp: timestamp,
          Dimensions: dimensions,
        });

        // Bytes transferred
        metricData.push({
          MetricName: 'BytesTransferred',
          Value: metric.bytesTransferred,
          Unit: 'Bytes',
          Timestamp: timestamp,
          Dimensions: dimensions,
        });

        // Error count (if status >= 400)
        if (metric.statusCode >= 400) {
          metricData.push({
            MetricName: 'ErrorCount',
            Value: 1,
            Unit: 'Count',
            Timestamp: timestamp,
            Dimensions: dimensions,
          });
        }

        // Success count (if status < 400)
        if (metric.statusCode < 400) {
          metricData.push({
            MetricName: 'SuccessCount',
            Value: 1,
            Unit: 'Count',
            Timestamp: timestamp,
            Dimensions: dimensions,
          });
        }
      }

      // Publish to CloudWatch
      await this.client.send(
        new PutMetricDataCommand({
          Namespace: this.NAMESPACE,
          MetricData: metricData,
        })
      );

      console.log(`[CloudWatch] Published ${metricData.length} metrics`);
    } catch (error) {
      console.error('[CloudWatch] Failed to publish metrics:', error);
      // Re-queue failed metrics
      this.queue.unshift(...batch);
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[CloudWatch] Scheduled flush failed:', err);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  async destroy(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// Singleton
let publisher: CloudWatchMetricsPublisher | null = null;

export function getCloudWatchPublisher(): CloudWatchMetricsPublisher {
  if (!publisher) {
    publisher = new CloudWatchMetricsPublisher();
  }
  return publisher;
}
```

### 2. CloudWatch Middleware

```typescript
// lib/middleware/cloudwatch-tracking.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCloudWatchPublisher } from '@/lib/metrics/cloudwatch-publisher';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';

/**
 * Wrap API handler with CloudWatch metrics tracking
 */
export function withCloudWatchMetrics(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    let context: { tenantId: string; userId?: string } | null = null;

    try {
      context = extractRLSContext(req);
    } catch {
      // Skip tracking for public endpoints
    }

    try {
      const response = await handler(req, ...args);
      const durationMs = Date.now() - startTime;

      // Publish to CloudWatch (fire and forget)
      if (context) {
        const publisher = getCloudWatchPublisher();
        const url = new URL(req.url);

        publisher
          .publish({
            tenantId: context.tenantId,
            endpoint: url.pathname,
            method: req.method,
            durationMs,
            statusCode: response.status,
            bytesTransferred:
              parseInt(response.headers.get('content-length') || '0') || 0,
          })
          .catch((err) => {
            console.error('[CloudWatch] Publish failed:', err);
          });
      }

      return response;
    } catch (error) {
      // Track error
      if (context) {
        const publisher = getCloudWatchPublisher();
        const url = new URL(req.url);

        publisher
          .publish({
            tenantId: context.tenantId,
            endpoint: url.pathname,
            method: req.method,
            durationMs: Date.now() - startTime,
            statusCode: 500,
            bytesTransferred: 0,
          })
          .catch(() => {});
      }

      throw error;
    }
  };
}
```

### 3. Usage in API Routes

```typescript
// app/api/bookings/route.ts

import { withCloudWatchMetrics } from '@/lib/middleware/cloudwatch-tracking';
import { getRLSClient } from '@/lib/database/instance';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';
import { bookings } from '@/lib/database/schema';

async function handleGetBookings(req: NextRequest) {
  const rlsDb = getRLSClient();
  const context = extractRLSContext(req);

  const results = await rlsDb.withRLS(context, (tx) => {
    return tx.select().from(bookings);
  });

  return NextResponse.json(results);
}

// Wrap with CloudWatch tracking
export const GET = withCloudWatchMetrics(handleGetBookings);
```

---

## CloudWatch Alarms

### Fair Use Alert (Requests)

```typescript
// scripts/setup-cloudwatch-alarms.ts

import {
  CloudWatchClient,
  PutMetricAlarmCommand,
} from '@aws-sdk/client-cloudwatch';

async function createFairUseAlarm(tenantId: string, requestLimit: number) {
  const client = new CloudWatchClient({ region: 'us-east-1' });

  await client.send(
    new PutMetricAlarmCommand({
      AlarmName: `tenant-${tenantId}-fair-use-requests`,
      AlarmDescription: `Alert when ${tenantId} exceeds ${requestLimit} requests/month`,
      MetricName: 'RequestCount',
      Namespace: 'HospitalityAI/Tenants',
      Statistic: 'Sum',
      Period: 86400, // 1 day
      EvaluationPeriods: 30, // 30 days = 1 month
      Threshold: requestLimit,
      ComparisonOperator: 'GreaterThanThreshold',
      Dimensions: [
        {
          Name: 'TenantId',
          Value: tenantId,
        },
      ],
      ActionsEnabled: true,
      AlarmActions: [
        `arn:aws:sns:us-east-1:123456789012:tenant-alerts`, // Your SNS topic
      ],
    })
  );

  console.log(`Created fair use alarm for tenant ${tenantId}`);
}

// Create alarms for all tenants
async function setupAllAlarms() {
  // Get tenants from database
  const tenants = await getTenants(); // Your implementation

  for (const tenant of tenants) {
    await createFairUseAlarm(tenant.id, tenant.monthlyRequestLimit);
    await createHighErrorRateAlarm(tenant.id);
    await createHighLatencyAlarm(tenant.id);
  }
}
```

### Terraform Configuration

```hcl
# .agent/infrastructure/cloudwatch-alarms.tf

resource "aws_cloudwatch_metric_alarm" "tenant_fair_use_requests" {
  for_each = var.tenants

  alarm_name          = "tenant-${each.key}-fair-use-requests"
  alarm_description   = "Alert when ${each.key} exceeds monthly request limit"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 30
  metric_name         = "RequestCount"
  namespace           = "HospitalityAI/Tenants"
  period              = 86400
  statistic           = "Sum"
  threshold           = each.value.monthly_request_limit

  dimensions = {
    TenantId = each.key
  }

  alarm_actions = [aws_sns_topic.tenant_alerts.arn]

  tags = {
    TenantId    = each.key
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "tenant_high_error_rate" {
  for_each = var.tenants

  alarm_name          = "tenant-${each.key}-high-error-rate"
  alarm_description   = "Alert when ${each.key} has >5% error rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5.0

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "ErrorCount"
      namespace   = "HospitalityAI/Tenants"
      period      = 300
      stat        = "Sum"
      dimensions = {
        TenantId = each.key
      }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "RequestCount"
      namespace   = "HospitalityAI/Tenants"
      period      = 300
      stat        = "Sum"
      dimensions = {
        TenantId = each.key
      }
    }
  }

  alarm_actions = [aws_sns_topic.tenant_alerts.arn]
}

resource "aws_sns_topic" "tenant_alerts" {
  name = "${var.project_name}-${var.environment}-tenant-alerts"

  tags = {
    Name        = "${var.project_name}-${var.environment}-tenant-alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "tenant_alerts_email" {
  topic_arn = aws_sns_topic.tenant_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
```

---

## CloudWatch Dashboards

### Dashboard JSON

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "HospitalityAI/Tenants", "RequestCount", { "stat": "Sum", "label": "Total Requests" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Total Requests",
        "period": 300
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "HospitalityAI/Tenants", "ResponseTime", { "stat": "Average" } ],
          [ "...", { "stat": "p99" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Response Time (Avg & P99)",
        "period": 300,
        "yAxis": {
          "left": {
            "label": "Milliseconds"
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "HospitalityAI/Tenants", "ErrorCount", { "stat": "Sum" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Error Count",
        "period": 300,
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "HospitalityAI/Tenants", "BytesTransferred", { "stat": "Sum" } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Bandwidth Usage",
        "period": 3600,
        "yAxis": {
          "left": {
            "label": "Bytes"
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ { "expression": "(errors / requests) * 100", "label": "Error Rate %", "id": "error_rate" } ],
          [ "HospitalityAI/Tenants", "ErrorCount", { "id": "errors", "visible": false } ],
          [ ".", "RequestCount", { "id": "requests", "visible": false } ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Error Rate %",
        "period": 300,
        "yAxis": {
          "left": {
            "min": 0,
            "max": 100
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "HospitalityAI/Tenants", "RequestCount", { "stat": "Sum" } ]
        ],
        "view": "singleValue",
        "region": "us-east-1",
        "title": "Total Requests (Last Hour)",
        "period": 3600
      }
    }
  ]
}
```

### Terraform Dashboard

```hcl
# .agent/infrastructure/cloudwatch-dashboards.tf

resource "aws_cloudwatch_dashboard" "tenant_metrics" {
  dashboard_name = "${var.project_name}-${var.environment}-tenant-metrics"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["HospitalityAI/Tenants", "RequestCount", { stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "Total Requests"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["HospitalityAI/Tenants", "ResponseTime", { stat = "Average" }],
            ["...", { stat = "p99" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "Response Time (Avg & P99)"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["HospitalityAI/Tenants", "BytesTransferred", { stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.aws_region
          title  = "Bandwidth Usage"
          period = 3600
        }
      }
    ]
  })
}

output "dashboard_url" {
  description = "URL to CloudWatch Dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.tenant_metrics.dashboard_name}"
}
```

---

## CloudWatch Logs Insights Queries

### Query: Top 10 Tenants by Request Count

```sql
fields @timestamp, tenantId, endpoint
| filter namespace = "HospitalityAI/Tenants"
| stats count() as requests by tenantId
| sort requests desc
| limit 10
```

### Query: P95 Response Time by Endpoint

```sql
fields @timestamp, endpoint, responseTime
| filter namespace = "HospitalityAI/Tenants"
| stats pct(responseTime, 95) as p95_ms by endpoint
| sort p95_ms desc
```

### Query: Error Rate by Tenant

```sql
fields @timestamp, tenantId
| filter namespace = "HospitalityAI/Tenants"
| stats sum(ErrorCount) as errors, sum(RequestCount) as requests by tenantId
| fields tenantId, errors, requests, (errors / requests * 100) as error_rate
| sort error_rate desc
```

---

## Monthly Billing Report (from CloudWatch)

```typescript
// lib/billing/cloudwatch-billing.ts

import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';

export async function generateMonthlyReport(
  tenantId: string,
  startDate: Date,
  endDate: Date
) {
  const client = new CloudWatchClient({ region: 'us-east-1' });

  // Get total requests
  const requestsResult = await client.send(
    new GetMetricStatisticsCommand({
      Namespace: 'HospitalityAI/Tenants',
      MetricName: 'RequestCount',
      Dimensions: [{ Name: 'TenantId', Value: tenantId }],
      StartTime: startDate,
      EndTime: endDate,
      Period: 2592000, // 30 days
      Statistics: ['Sum'],
    })
  );

  // Get total bandwidth
  const bandwidthResult = await client.send(
    new GetMetricStatisticsCommand({
      Namespace: 'HospitalityAI/Tenants',
      MetricName: 'BytesTransferred',
      Dimensions: [{ Name: 'TenantId', Value: tenantId }],
      StartTime: startDate,
      EndTime: endDate,
      Period: 2592000,
      Statistics: ['Sum'],
    })
  );

  const totalRequests = requestsResult.Datapoints?.[0]?.Sum || 0;
  const totalBytes = bandwidthResult.Datapoints?.[0]?.Sum || 0;
  const totalGb = totalBytes / (1024 * 1024 * 1024);

  return {
    tenantId,
    period: { start: startDate, end: endDate },
    totalRequests: Math.round(totalRequests),
    totalBandwidthGb: parseFloat(totalGb.toFixed(2)),
  };
}
```

---

## Summary

### What You Get

✅ **CloudWatch Metrics**: Automatic aggregation, no custom code
✅ **CloudWatch Alarms**: SNS notifications for fair use, errors, latency
✅ **CloudWatch Dashboards**: Visual monitoring without coding
✅ **CloudWatch Logs Insights**: SQL-like queries for analysis
✅ **Terraform IaC**: Reproducible infrastructure

### Cost (Per Tenant)

| Component | Monthly Cost |
|-----------|-------------|
| ~10 custom metrics | $3.00 |
| 3 alarms | $0.30 |
| Dashboard (shared) | $0.10 (amortized) |
| **Total** | **$3.40/tenant** |

**Best for**: >5.3M requests/month per tenant

### Next Steps

1. Deploy CloudWatch publisher
2. Apply Terraform configuration
3. Create SNS topic for alerts
4. Build CloudWatch dashboard
5. Set up monthly billing query

This is the **AWS-native way** and gives you full control over alerts and dashboards!
