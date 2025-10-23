# AWS Aurora Serverless v2 with Data API
# This configuration sets up a serverless PostgreSQL cluster optimized for PayloadCMS

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Variables
variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "hospitality-ai"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "min_capacity" {
  description = "Minimum Aurora Capacity Units (ACU)"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Maximum Aurora Capacity Units (ACU)"
  type        = number
  default     = 2.0
}

# Random password for master user
resource "random_password" "db_master" {
  length  = 32
  special = true
}

# Aurora Serverless v2 Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "${var.project_name}-${var.environment}"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = "15.4"
  database_name      = replace(var.project_name, "-", "_")

  master_username = "admin"
  master_password = random_password.db_master.result

  # Enable Data API (required for HTTP access)
  enable_http_endpoint = true

  # Serverless v2 scaling configuration
  serverlessv2_scaling_configuration {
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
  }

  # Backup configuration
  backup_retention_period = var.environment == "prod" ? 30 : 7
  preferred_backup_window = "03:00-04:00"

  # Maintenance
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  apply_immediately            = var.environment != "prod"

  # Encryption
  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  # Deletion protection
  deletion_protection      = var.environment == "prod"
  skip_final_snapshot      = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Enable CloudWatch logs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "${var.project_name}-${var.environment}-aurora"
    Environment = var.environment
    ManagedBy   = "Terraform"
    DataAPI     = "enabled"
  }
}

# Aurora Cluster Instance (Serverless v2)
resource "aws_rds_cluster_instance" "aurora" {
  identifier         = "${var.project_name}-${var.environment}-instance-1"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version

  # Performance Insights (recommended for production)
  performance_insights_enabled = var.environment == "prod"

  tags = {
    Name        = "${var.project_name}-${var.environment}-instance-1"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# KMS Key for encryption
resource "aws_kms_key" "aurora" {
  description             = "KMS key for ${var.project_name} Aurora cluster"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-aurora-kms"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${var.project_name}-${var.environment}-aurora"
  target_key_id = aws_kms_key.aurora.key_id
}

# Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.project_name}/${var.environment}/db-credentials"
  description = "Master credentials for Aurora cluster"
  kms_key_id  = aws_kms_key.aurora.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-credentials"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = aws_rds_cluster.aurora.master_username
    password = aws_rds_cluster.aurora.master_password
    engine   = "postgres"
    host     = aws_rds_cluster.aurora.endpoint
    port     = 5432
    dbname   = aws_rds_cluster.aurora.database_name
    dbClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  })
}

# IAM Policy for Lambda to access Data API
resource "aws_iam_policy" "lambda_data_api" {
  name        = "${var.project_name}-${var.environment}-lambda-data-api"
  description = "Allow Lambda functions to use RDS Data API"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ]
        Resource = aws_rds_cluster.aurora.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.aurora.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-data-api"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Data sources
data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

# CloudWatch Log Group for PostgreSQL logs
resource "aws_cloudwatch_log_group" "aurora_postgresql" {
  name              = "/aws/rds/cluster/${aws_rds_cluster.aurora.cluster_identifier}/postgresql"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-aurora-logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-aurora-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ServerlessDatabaseCapacity"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.max_capacity * 0.8 # Alert at 80% of max ACU
  alarm_description   = "Aurora cluster capacity approaching maximum"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-aurora-cpu-alarm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-${var.environment}-aurora-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "High number of database connections"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora.cluster_identifier
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-aurora-connections-alarm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Outputs for use in application configuration
output "cluster_arn" {
  description = "ARN of the Aurora cluster (use for Data API)"
  value       = aws_rds_cluster.aurora.arn
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret (use for Data API)"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "database_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.aurora.database_name
}

output "cluster_endpoint" {
  description = "Writer endpoint for the cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint for the cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "lambda_policy_arn" {
  description = "ARN of IAM policy for Lambda Data API access"
  value       = aws_iam_policy.lambda_data_api.arn
}

output "environment_variables" {
  description = "Environment variables for Lambda/ECS configuration"
  value = {
    DB_CLUSTER_ARN = aws_rds_cluster.aurora.arn
    DB_SECRET_ARN  = aws_secretsmanager_secret.db_credentials.arn
    DATABASE_NAME  = aws_rds_cluster.aurora.database_name
    AWS_REGION     = data.aws_region.current.name
    USE_DATA_API   = "true"
  }
}

# Example usage instructions
output "usage_instructions" {
  description = "Instructions for using Data API"
  value = <<-EOT
    1. Attach the Lambda policy to your Lambda execution role:
       aws iam attach-role-policy \
         --role-name <lambda-role-name> \
         --policy-arn ${aws_iam_policy.lambda_data_api.arn}

    2. Set these environment variables in your Lambda function:
       DB_CLUSTER_ARN=${aws_rds_cluster.aurora.arn}
       DB_SECRET_ARN=${aws_secretsmanager_secret.db_credentials.arn}
       DATABASE_NAME=${aws_rds_cluster.aurora.database_name}
       AWS_REGION=${data.aws_region.current.name}
       USE_DATA_API=true

    3. Deploy your application with the Drizzle Data API adapter
  EOT
}

# Cost estimation (for documentation)
output "estimated_monthly_cost" {
  description = "Estimated monthly cost (USD) at minimum capacity"
  value = <<-EOT
    Minimum capacity (${var.min_capacity} ACU):
    - Aurora ACU: ${var.min_capacity} × 730 hours × $0.12/hour = $${var.min_capacity * 730 * 0.12}
    - Storage (100GB): $0.10/GB = $10.00
    - Data API (10M requests): $0.35 per 1M = $3.50
    Total: ~$${var.min_capacity * 730 * 0.12 + 10.00 + 3.50}/month

    Maximum capacity (${var.max_capacity} ACU):
    - Aurora ACU: ${var.max_capacity} × 730 hours × $0.12/hour = $${var.max_capacity * 730 * 0.12}
    - Storage (100GB): $0.10/GB = $10.00
    - Data API (10M requests): $0.35 per 1M = $3.50
    Total: ~$${var.max_capacity * 730 * 0.12 + 10.00 + 3.50}/month
  EOT
}
