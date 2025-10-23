# AWS Infrastructure Quick Start Guide

This guide walks you through deploying and testing the Aurora Serverless v2 infrastructure with Data API.

## Prerequisites

### 1. Install Required Tools

```bash
# Node.js and npm (already installed if you're here)
node --version  # Should be 18+
npm --version

# Install AWS CDK CLI globally
npm install -g aws-cdk

# Verify installation
cdk --version
```

### 2. Configure AWS Credentials

Choose **Option A** (recommended) or **Option B**:

#### Option A: AWS CLI Profile (Recommended)

```bash
# Install AWS CLI if not already installed
# macOS: brew install awscli
# Linux: apt-get install awscli
# Windows: Download from AWS

# Configure your profile
aws configure --profile hospitality-ai

# You'll be prompted for:
# - AWS Access Key ID: [your key]
# - AWS Secret Access Key: [your secret]
# - Default region: us-east-1
# - Default output format: json

# Verify
aws sts get-caller-identity --profile hospitality-ai
```

#### Option B: Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-1

# Verify
aws sts get-caller-identity
```

### 3. Verify IAM Permissions

Your AWS user/role needs these permissions:
- `cloudformation:*`
- `rds:*`
- `secretsmanager:*`
- `kms:*`
- `iam:CreatePolicy`, `iam:GetPolicy`, `iam:DeletePolicy`
- `ec2:*` (for VPC creation)
- `logs:*`

## Deploy Infrastructure (One-Time Setup)

### Step 1: Bootstrap CDK (First Time Only)

```bash
# Get your AWS account ID
aws sts get-caller-identity --query Account --output text

# Bootstrap CDK (replace ACCOUNT-ID and REGION)
cd infrastructure
cdk bootstrap aws://ACCOUNT-ID/us-east-1

# Or let CDK auto-detect
cdk bootstrap
```

### Step 2: Review What Will Be Deployed

```bash
cd infrastructure

# View the CloudFormation template
npm run cdk:synth

# See what resources will be created
npm run cdk:diff
```

### Step 3: Deploy Development Environment

```bash
# Deploy with default dev settings (0.5-2.0 ACU)
npm run cdk:deploy:dev

# This will create:
# ✅ Aurora Serverless v2 cluster
# ✅ VPC with isolated subnets
# ✅ KMS encryption key
# ✅ Secrets Manager secret
# ✅ IAM policies
# ✅ CloudWatch logs and alarms

# Deployment takes ~10-15 minutes
```

**Expected output**:
```
✅  hospitality-ai-dev-aurora

Outputs:
hospitality-ai-dev-aurora.ClusterArn = arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev
hospitality-ai-dev-aurora.SecretArn = arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai/dev/db-credentials-AbCdEf
hospitality-ai-dev-aurora.DatabaseName = hospitality_ai
...
```

### Step 4: Save Outputs to .env.local

```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local with the output values from above:
```

**`.env.local`**:
```bash
# AWS RDS Data API Configuration
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai/dev/db-credentials-AbCdEf
DATABASE_NAME=hospitality_ai
AWS_REGION=us-east-1

# AWS Credentials (if using profile)
AWS_PROFILE=hospitality-ai

# Metrics Configuration
ENABLE_METRICS=true
METRICS_NAMESPACE=HospitalityAI

# PayloadCMS Configuration
PAYLOAD_SECRET=your-secret-key-here-change-this-to-random-string
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# Application Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_LLM=false
NEXT_PUBLIC_ENABLE_CACHING=true
```

## Run Integration Tests

### Step 1: Verify Configuration

```bash
# Check if env vars are loaded
node -e "console.log(process.env.DB_CLUSTER_ARN || 'NOT SET')"
```

### Step 2: Run Integration Tests

```bash
# Run integration tests (requires AWS)
npm run test:integration

# If AWS not configured, tests will be skipped with a helpful message
```

**Expected output if configured**:
```
PASS lib/database/__tests__/integration.test.ts
  InstrumentedRDSClient - Integration Tests
    Real AWS Connectivity
      ✓ should connect to Aurora via Data API (543ms)
      ✓ should set RLS session variables (321ms)
      ✓ should publish metrics to CloudWatch (2105ms)
      ✓ should enforce RLS policies (1987ms)
    Performance Tests
      ✓ should complete operation within 2 seconds (234ms)
      ✓ should handle batch operations efficiently (456ms)
      ✓ should handle concurrent operations (678ms)
    Error Handling
      ✓ should handle invalid SQL gracefully (123ms)
      ✓ should validate tenant context (2ms)
      ✓ should reject invalid tenant ID characters (1ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

### Step 3: Verify CloudWatch Metrics

```bash
# View metrics in AWS Console
open https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#metricsV2:

# Or use AWS CLI
aws cloudwatch get-metric-statistics \
  --namespace HospitalityAI \
  --metric-name DatabaseOperations \
  --dimensions Name=TenantId,Value=integration-test-tenant \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum \
  --region us-east-1
```

## Daily Development Workflow

### Start Development

```bash
# Run unit tests (fast, no AWS required)
npm test

# Run integration tests (requires AWS)
npm run test:integration

# Run all tests
npm run test:all

# Start Next.js dev server
npm run dev
```

### Monitor Your Infrastructure

```bash
# View Aurora metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ServerlessDatabaseCapacity \
  --dimensions Name=DBClusterIdentifier,Value=hospitality-ai-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1

# Check current ACU usage
aws rds describe-db-clusters \
  --db-cluster-identifier hospitality-ai-dev \
  --query 'DBClusters[0].ServerlessV2ScalingConfiguration' \
  --region us-east-1
```

### Make Infrastructure Changes

```bash
# Edit infrastructure/lib/aurora-stack.ts
# Then preview changes:
npm run cdk:diff

# Deploy changes
npm run cdk:deploy:dev
```

## Cost Management

### Check Current Spend

```bash
# View Aurora costs for this month
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --filter file://<(echo '{
    "Dimensions": {
      "Key": "SERVICE",
      "Values": ["Amazon Relational Database Service"]
    }
  }')
```

### Reduce Costs During Development

**Option 1: Reduce capacity**
```bash
# Deploy with minimum capacity
npm run cdk:deploy -- -c minCapacity=0.5 -c maxCapacity=0.5
```

**Option 2: Destroy when not in use** (dev only)
```bash
# ⚠️  WARNING: This deletes ALL data!
npm run cdk:destroy

# Redeploy when needed
npm run cdk:deploy:dev
```

**Option 3: Pause Aurora** (manual)
```bash
# Stop cluster (only works with provisioned, not serverless v2)
# For serverless v2, use minimum capacity instead
```

## Troubleshooting

### Issue: "Stack already exists" error

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name hospitality-ai-dev-aurora

# If in ROLLBACK_COMPLETE, delete and retry
npm run cdk:destroy
npm run cdk:deploy:dev
```

### Issue: Integration tests fail with "Access Denied"

```bash
# Verify credentials
aws sts get-caller-identity

# Check if you have Data API permissions
aws rds-data execute-statement \
  --resource-arn $DB_CLUSTER_ARN \
  --secret-arn $DB_SECRET_ARN \
  --database $DATABASE_NAME \
  --sql "SELECT 1" \
  --region us-east-1
```

### Issue: "Cluster not found"

```bash
# Verify cluster exists
aws rds describe-db-clusters \
  --db-cluster-identifier hospitality-ai-dev \
  --region us-east-1

# Check if Data API is enabled
aws rds describe-db-clusters \
  --db-cluster-identifier hospitality-ai-dev \
  --query 'DBClusters[0].HttpEndpointEnabled' \
  --region us-east-1
# Should return: true
```

### Issue: Metrics not appearing in CloudWatch

```bash
# Wait 1-2 minutes for metrics to propagate

# Check CloudWatch permissions
aws cloudwatch put-metric-data \
  --namespace HospitalityAI/Test \
  --metric-name TestMetric \
  --value 1 \
  --region us-east-1

# If this fails, you don't have cloudwatch:PutMetricData permission
```

## Cleanup (When Done)

### Destroy Development Stack

```bash
# ⚠️  WARNING: This will DELETE all data in the dev database!

npm run cdk:destroy

# Confirm when prompted
# Resources will be permanently deleted
```

### Production Cleanup

Production stacks have **deletion protection** enabled. To destroy:

```bash
# 1. Disable deletion protection
aws rds modify-db-cluster \
  --db-cluster-identifier hospitality-ai-prod \
  --no-deletion-protection \
  --region us-east-1

# 2. Destroy stack
cd infrastructure
cdk destroy -c environment=prod

# 3. Confirm when prompted
```

## Next Steps

- ✅ [Read the complete infrastructure README](infrastructure/README.md)
- ✅ [Review integration testing guide](.agent/docs/integration-testing-guide.md)
- ✅ [Learn about the instrumented RDS client](.agent/docs/instrumented-client-usage.md)
- ✅ [Explore PayloadCMS integration](.agent/docs/payloadcms-integration-guide.md)
- ✅ [Understand centralized metrics](.agent/docs/centralized-metrics-architecture.md)

## Quick Command Reference

| Command | Description |
|---------|-------------|
| `npm run cdk:deploy:dev` | Deploy dev environment |
| `npm run cdk:deploy:prod` | Deploy production |
| `npm run cdk:diff` | Preview changes |
| `npm run cdk:destroy` | Delete stack |
| `npm test` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:all` | Run all tests |
| `npm run dev` | Start Next.js dev server |

## Support

- **CDK Issues**: https://github.com/aws/aws-cdk/issues
- **Aurora Serverless**: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html
- **Data API**: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
- **Project Issues**: [Create an issue](../../issues)
