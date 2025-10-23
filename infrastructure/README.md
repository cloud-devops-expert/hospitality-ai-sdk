# Aurora Serverless v2 Infrastructure (AWS CDK)

This directory contains AWS CDK infrastructure code for deploying Aurora PostgreSQL Serverless v2 with Data API enabled.

## What Gets Created

- **Aurora Serverless v2 Cluster**: PostgreSQL 15.4 with Data API enabled
- **VPC**: Isolated network for Aurora (created if not provided)
- **KMS Key**: Encryption key for database and secrets
- **Secrets Manager Secret**: Database credentials with automatic rotation support
- **IAM Policy**: Pre-configured policy for Lambda/ECS Data API access
- **CloudWatch Logs**: PostgreSQL logs with configurable retention
- **CloudWatch Alarms**: Capacity and connection monitoring

## Prerequisites

### 1. Install AWS CDK CLI

```bash
# Install globally
npm install -g aws-cdk

# Verify installation
cdk --version
```

### 2. Configure AWS Credentials

```bash
# Option A: AWS CLI configuration
aws configure

# Option B: Environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Bootstrap CDK (First time only)

```bash
# Navigate to infrastructure directory
cd infrastructure

# Bootstrap CDK in your AWS account
cdk bootstrap aws://ACCOUNT-NUMBER/REGION

# Example:
# cdk bootstrap aws://123456789012/us-east-1
```

## Quick Start

### Development Environment

```bash
cd infrastructure

# Install dependencies (already done at root level)
npm install

# Deploy with default settings (dev environment)
cdk deploy

# Or specify environment
cdk deploy -c environment=dev
```

### Production Environment

```bash
cd infrastructure

# Deploy production with higher capacity and protection
cdk deploy -c environment=prod -c minCapacity=1.0 -c maxCapacity=4.0
```

## Configuration Options

### Context Parameters

Pass configuration via `-c` flag or add to `cdk.context.json`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `environment` | `dev` | Environment name (dev/staging/prod) |
| `projectName` | `hospitality-ai` | Project name prefix |
| `minCapacity` | `0.5` | Minimum ACU (0.5-128) |
| `maxCapacity` | `2.0` | Maximum ACU (0.5-128) |

**Examples**:

```bash
# Custom capacity
cdk deploy -c minCapacity=1.0 -c maxCapacity=8.0

# Different project name
cdk deploy -c projectName=my-app -c environment=staging

# Specific region
cdk deploy --region eu-west-1
```

### Environment-Specific Behavior

| Feature | Dev | Prod |
|---------|-----|------|
| Deletion Protection | ❌ | ✅ |
| Final Snapshot | ❌ | ✅ |
| Backup Retention | 7 days | 30 days |
| Log Retention | 7 days | 30 days |
| Performance Insights | ❌ | ✅ |
| KMS Key Retention | Delete | Retain |

## CDK Commands

```bash
# Navigate to infrastructure directory first
cd infrastructure

# Show what will be deployed
cdk diff

# Synthesize CloudFormation template
cdk synth

# Deploy stack
cdk deploy

# Deploy without confirmation prompts
cdk deploy --require-approval never

# Destroy stack (CAREFUL!)
cdk destroy

# List all stacks
cdk list
```

## After Deployment

### 1. Get Stack Outputs

```bash
# View outputs
aws cloudformation describe-stacks \
  --stack-name hospitality-ai-dev-aurora \
  --query 'Stacks[0].Outputs'

# Or use CDK
cdk deploy --outputs-file outputs.json
```

### 2. Update .env.local

Copy the output values to your `.env.local`:

```bash
DB_CLUSTER_ARN=arn:aws:rds:us-east-1:123456789012:cluster:hospitality-ai-dev
DB_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:hospitality-ai/dev/db-credentials-AbCdEf
DATABASE_NAME=hospitality_ai
AWS_REGION=us-east-1
ENABLE_METRICS=true
METRICS_NAMESPACE=HospitalityAI
```

### 3. Attach Policy to Lambda Role

```bash
# Get the policy ARN from outputs
POLICY_ARN=$(aws cloudformation describe-stacks \
  --stack-name hospitality-ai-dev-aurora \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaPolicyArn`].OutputValue' \
  --output text)

# Attach to your Lambda execution role
aws iam attach-role-policy \
  --role-name your-lambda-role-name \
  --policy-arn $POLICY_ARN
```

### 4. Initialize Database Schema

```bash
# Connect via Data API and run migrations
npm run db:migrate

# Or use a Lambda function to initialize schema
aws lambda invoke \
  --function-name init-database \
  --payload '{"action":"migrate"}' \
  response.json
```

## Cost Estimation

### Development (minCapacity: 0.5, maxCapacity: 2.0)

| Service | Cost |
|---------|------|
| Aurora ACU (0.5 ACU × 730h) | $43.80/month |
| Storage (100GB @ $0.10/GB) | $10.00/month |
| Data API (10M requests) | $3.50/month |
| **Total** | **~$57/month** |

### Production (minCapacity: 1.0, maxCapacity: 4.0)

| Service | Cost |
|---------|------|
| Aurora ACU (1.0 ACU × 730h) | $87.60/month |
| Storage (500GB @ $0.10/GB) | $50.00/month |
| Data API (100M requests) | $35.00/month |
| Backup Storage (500GB × 7 days) | $9.50/month |
| **Total** | **~$182/month** |

**Cost Optimization Tips**:
- Use `cdk destroy` to tear down dev stacks when not in use
- Set low `minCapacity` for development (0.5 ACU)
- Monitor actual usage with CloudWatch metrics
- Enable Aurora Serverless v2 auto-pause (if traffic is sporadic)

## Monitoring

### View Metrics

```bash
# Capacity metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ServerlessDatabaseCapacity \
  --dimensions Name=DBClusterIdentifier,Value=hospitality-ai-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# Connection count
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=hospitality-ai-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### CloudWatch Alarms

Two alarms are automatically created:

1. **Capacity Alarm**: Triggers when ACU usage exceeds 80% of max
2. **Connections Alarm**: Triggers when connections exceed 100

Configure SNS notifications in the stack to receive alerts.

## Updating the Stack

### Change Capacity

```bash
# Increase capacity
cdk deploy -c minCapacity=1.0 -c maxCapacity=4.0

# CloudFormation will update the cluster (no downtime)
```

### Update PostgreSQL Version

Edit `lib/aurora-stack.ts`:

```typescript
version: rds.AuroraPostgresEngineVersion.VER_15_5, // Updated version
```

Then deploy:

```bash
cdk deploy
```

**Note**: Major version upgrades may require maintenance window.

## Troubleshooting

### Issue: "Stack already exists"

If deployment fails partway through:

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name hospitality-ai-dev-aurora

# If in ROLLBACK_COMPLETE state, delete and redeploy
cdk destroy
cdk deploy
```

### Issue: "Insufficient permissions"

Ensure your AWS credentials have these permissions:
- `cloudformation:*`
- `rds:*`
- `secretsmanager:*`
- `kms:*`
- `iam:*` (for policy creation)
- `ec2:*` (for VPC creation)
- `logs:*`

### Issue: "Resource limit exceeded"

Check AWS service quotas:

```bash
# View RDS quotas
aws service-quotas get-service-quota \
  --service-code rds \
  --quota-code L-952B80B8 # DB clusters per region

# Request increase if needed
aws service-quotas request-service-quota-increase \
  --service-code rds \
  --quota-code L-952B80B8 \
  --desired-value 50
```

## Security Best Practices

1. **Never commit CDK outputs** containing ARNs to version control
2. **Use Secrets Manager** for database credentials (done automatically)
3. **Enable deletion protection** for production (`-c environment=prod`)
4. **Restrict IAM policies** to specific Lambda functions
5. **Enable VPC Flow Logs** for network monitoring
6. **Use KMS encryption** for data at rest (enabled by default)
7. **Enable Performance Insights** for production troubleshooting

## Cleanup

```bash
# Destroy the stack (CAREFUL - deletes all data!)
cd infrastructure
cdk destroy

# Confirm when prompted
# Note: Production stacks have deletion protection enabled
```

**Important**: For production environments with `deletionProtection: true`, you must first:

```bash
# Disable deletion protection
aws rds modify-db-cluster \
  --db-cluster-identifier hospitality-ai-prod \
  --no-deletion-protection

# Then destroy
cdk destroy
```

## Migration from Terraform

If migrating from the old Terraform setup:

1. **Export Terraform state** (if you have existing infrastructure)
2. **Import resources to CDK** using `cdk import` (advanced)
3. **Or recreate from scratch** (recommended for clean setup)

See `.agent/docs/terraform-to-cdk-migration.md` for detailed migration guide.

## Support

- **CDK Documentation**: https://docs.aws.amazon.com/cdk/
- **Aurora Serverless v2**: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html
- **RDS Data API**: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html
- **Project Issues**: https://github.com/your-org/hospitality-ai-sdk/issues

## License

See root LICENSE file.
