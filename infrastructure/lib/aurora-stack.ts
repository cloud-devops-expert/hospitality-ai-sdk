/**
 * Aurora Serverless v2 Stack with Data API
 *
 * This stack creates:
 * - Aurora PostgreSQL Serverless v2 cluster with Data API enabled
 * - Secrets Manager secret for database credentials
 * - KMS key for encryption
 * - IAM policies for Lambda/ECS access
 * - CloudWatch log groups and alarms
 */

import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface AuroraStackProps extends cdk.StackProps {
  /**
   * Project name prefix for resource naming
   * @default 'hospitality-ai'
   */
  projectName?: string;

  /**
   * Environment (dev, staging, prod)
   * @default 'dev'
   */
  environment?: string;

  /**
   * Minimum Aurora Capacity Units (ACU)
   * @default 0.5
   */
  minCapacity?: number;

  /**
   * Maximum Aurora Capacity Units (ACU)
   * @default 2.0
   */
  maxCapacity?: number;

  /**
   * Database name
   * @default project name with underscores
   */
  databaseName?: string;

  /**
   * Master username
   * @default 'admin'
   */
  masterUsername?: string;

  /**
   * VPC to deploy Aurora into
   * If not provided, a new VPC will be created
   */
  vpc?: ec2.IVpc;

  /**
   * Enable Performance Insights
   * @default true for prod, false otherwise
   */
  enablePerformanceInsights?: boolean;
}

export class AuroraStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;
  public readonly secret: secretsmanager.ISecret;
  public readonly lambdaPolicy: iam.ManagedPolicy;
  public readonly clusterArn: string;
  public readonly secretArn: string;
  public readonly databaseName: string;

  constructor(scope: Construct, id: string, props: AuroraStackProps = {}) {
    super(scope, id, props);

    // Default values
    const projectName = props.projectName || 'hospitality-ai';
    const environment = props.environment || 'dev';
    const minCapacity = props.minCapacity ?? 0.5;
    const maxCapacity = props.maxCapacity ?? 2.0;
    const databaseName = props.databaseName || projectName.replace(/-/g, '_');
    const masterUsername = props.masterUsername || 'admin';
    const isProd = environment === 'prod';
    const enablePerformanceInsights = props.enablePerformanceInsights ?? isProd;

    // VPC - use provided or create new
    const vpc = props.vpc || new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2, // Aurora Serverless v2 requires at least 2 AZs
      natGateways: 0, // No NAT gateways needed for serverless
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'aurora-isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'AuroraKmsKey', {
      description: `KMS key for ${projectName} Aurora cluster`,
      enableKeyRotation: true,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    new kms.Alias(this, 'AuroraKmsAlias', {
      aliasName: `alias/${projectName}-${environment}-aurora`,
      targetKey: encryptionKey,
    });

    // Secrets Manager secret for credentials
    const dbSecret = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: `${projectName}/${environment}/db-credentials`,
      description: 'Master credentials for Aurora cluster',
      encryptionKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: masterUsername }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'AuroraLogGroup', {
      logGroupName: `/aws/rds/cluster/${projectName}-${environment}/postgresql`,
      retention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Aurora Serverless v2 Cluster
    const cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      clusterIdentifier: `${projectName}-${environment}`,
      defaultDatabaseName: databaseName,
      credentials: rds.Credentials.fromSecret(dbSecret),

      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },

      // Serverless v2 configuration
      writer: rds.ClusterInstance.serverlessV2('writer', {
        enablePerformanceInsights,
        performanceInsightRetention: enablePerformanceInsights
          ? rds.PerformanceInsightRetention.DEFAULT
          : undefined,
      }),

      serverlessV2MinCapacity: minCapacity,
      serverlessV2MaxCapacity: maxCapacity,

      // Enable Data API (critical for HTTP-based access)
      enableDataApi: true,

      // Storage
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,

      // Backup
      backup: {
        retention: isProd ? cdk.Duration.days(30) : cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },

      // Maintenance
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',

      // CloudWatch logs
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,

      // Deletion protection
      deletionProtection: isProd,
      removalPolicy: isProd ? cdk.RemovalPolicy.SNAPSHOT : cdk.RemovalPolicy.DESTROY,
    });

    // IAM Policy for Lambda/ECS to access Data API
    const lambdaPolicy = new iam.ManagedPolicy(this, 'LambdaDataApiPolicy', {
      managedPolicyName: `${projectName}-${environment}-lambda-data-api`,
      description: 'Allow Lambda functions to use RDS Data API',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds-data:ExecuteStatement',
            'rds-data:BatchExecuteStatement',
            'rds-data:BeginTransaction',
            'rds-data:CommitTransaction',
            'rds-data:RollbackTransaction',
          ],
          resources: [cluster.clusterArn],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          resources: [dbSecret.secretArn],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['kms:Decrypt'],
          resources: [encryptionKey.keyArn],
          conditions: {
            StringEquals: {
              'kms:ViaService': `secretsmanager.${this.region}.amazonaws.com`,
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['cloudwatch:PutMetricData'],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'cloudwatch:namespace': 'HospitalityAI',
            },
          },
        }),
      ],
    });

    // CloudWatch Alarms
    const capacityAlarm = new cloudwatch.Alarm(this, 'CapacityAlarm', {
      alarmName: `${projectName}-${environment}-aurora-capacity`,
      alarmDescription: 'Aurora cluster capacity approaching maximum',
      metric: cluster.metricServerlessDatabaseCapacity({
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.minutes(5),
      }),
      threshold: maxCapacity * 0.8, // Alert at 80% of max ACU
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const connectionsAlarm = new cloudwatch.Alarm(this, 'ConnectionsAlarm', {
      alarmName: `${projectName}-${environment}-aurora-connections`,
      alarmDescription: 'High number of database connections',
      metric: cluster.metricDatabaseConnections({
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Store properties for external access
    this.cluster = cluster;
    this.secret = dbSecret;
    this.lambdaPolicy = lambdaPolicy;
    this.clusterArn = cluster.clusterArn;
    this.secretArn = dbSecret.secretArn;
    this.databaseName = databaseName;

    // Outputs
    new cdk.CfnOutput(this, 'ClusterArn', {
      description: 'ARN of the Aurora cluster (use for Data API)',
      value: cluster.clusterArn,
      exportName: `${projectName}-${environment}-cluster-arn`,
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      description: 'ARN of the Secrets Manager secret (use for Data API)',
      value: dbSecret.secretArn,
      exportName: `${projectName}-${environment}-secret-arn`,
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      description: 'Name of the database',
      value: databaseName,
      exportName: `${projectName}-${environment}-database-name`,
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      description: 'Writer endpoint for the cluster',
      value: cluster.clusterEndpoint.hostname,
      exportName: `${projectName}-${environment}-endpoint`,
    });

    new cdk.CfnOutput(this, 'LambdaPolicyArn', {
      description: 'ARN of IAM policy for Lambda Data API access',
      value: lambdaPolicy.managedPolicyArn,
      exportName: `${projectName}-${environment}-lambda-policy-arn`,
    });

    new cdk.CfnOutput(this, 'EnvironmentVariables', {
      description: 'Environment variables for Lambda/ECS configuration',
      value: JSON.stringify({
        DB_CLUSTER_ARN: cluster.clusterArn,
        DB_SECRET_ARN: dbSecret.secretArn,
        DATABASE_NAME: databaseName,
        AWS_REGION: this.region,
        USE_DATA_API: 'true',
        ENABLE_METRICS: 'true',
        METRICS_NAMESPACE: 'HospitalityAI',
      }, null, 2),
    });

    new cdk.CfnOutput(this, 'UsageInstructions', {
      description: 'Instructions for using Data API',
      value: [
        '1. Attach the Lambda policy to your Lambda execution role:',
        `   aws iam attach-role-policy --role-name <lambda-role-name> --policy-arn ${lambdaPolicy.managedPolicyArn}`,
        '',
        '2. Set these environment variables in your Lambda function:',
        `   DB_CLUSTER_ARN=${cluster.clusterArn}`,
        `   DB_SECRET_ARN=${dbSecret.secretArn}`,
        `   DATABASE_NAME=${databaseName}`,
        `   AWS_REGION=${this.region}`,
        '   USE_DATA_API=true',
        '',
        '3. Deploy your application with the Drizzle Data API adapter',
      ].join('\n'),
    });

    // Cost estimation output
    const monthlyCostMin = minCapacity * 730 * 0.12 + 10.0 + 3.5;
    const monthlyCostMax = maxCapacity * 730 * 0.12 + 10.0 + 3.5;

    new cdk.CfnOutput(this, 'EstimatedMonthlyCost', {
      description: 'Estimated monthly cost (USD)',
      value: [
        `Minimum capacity (${minCapacity} ACU):`,
        `- Aurora ACU: ${minCapacity} × 730 hours × $0.12/hour = $${(minCapacity * 730 * 0.12).toFixed(2)}`,
        '- Storage (100GB): $0.10/GB = $10.00',
        '- Data API (10M requests): $0.35 per 1M = $3.50',
        `Total: ~$${monthlyCostMin.toFixed(2)}/month`,
        '',
        `Maximum capacity (${maxCapacity} ACU):`,
        `- Aurora ACU: ${maxCapacity} × 730 hours × $0.12/hour = $${(maxCapacity * 730 * 0.12).toFixed(2)}`,
        '- Storage (100GB): $0.10/GB = $10.00',
        '- Data API (10M requests): $0.35 per 1M = $3.50',
        `Total: ~$${monthlyCostMax.toFixed(2)}/month`,
      ].join('\n'),
    });

    // Tags
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('DataAPI', 'enabled');
  }
}
