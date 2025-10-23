#!/usr/bin/env node
/**
 * AWS CDK App for Hospitality AI Infrastructure
 *
 * This app creates the Aurora Serverless v2 infrastructure
 * required for the Hospitality AI SDK with Data API enabled.
 */

import * as cdk from 'aws-cdk-lib';
import { AuroraStack } from '../lib/aurora-stack';

const app = new cdk.App();

// Get environment from context or use 'dev' as default
const environment = app.node.tryGetContext('environment') || 'dev';
const projectName = app.node.tryGetContext('projectName') || 'hospitality-ai';

// Stack configuration
const stackProps: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Aurora Serverless v2 infrastructure for ${projectName} (${environment})`,
};

// Create Aurora stack
new AuroraStack(app, `${projectName}-${environment}-aurora`, {
  ...stackProps,
  projectName,
  environment,
  minCapacity: parseFloat(app.node.tryGetContext('minCapacity') || '0.5'),
  maxCapacity: parseFloat(app.node.tryGetContext('maxCapacity') || '2.0'),
});

app.synth();
