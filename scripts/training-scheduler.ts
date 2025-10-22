#!/usr/bin/env tsx
/**
 * Training Scheduler
 * Automated training with cron scheduling
 */

import cron from 'node-cron';
import { trainingOrchestrator } from '../lib/training/orchestrator';

// Register training modules
trainingOrchestrator.registerModule({
  module: 'forecast',
  schedule: 'daily',
  minDataPoints: 100,
  validationSplit: 0.2,
  hyperparameters: {
    units: [64, 32, 16],
    epochs: 200,
    batchSize: 32,
  },
  enabled: false, // Enable when TensorFlow.js training is ready
});

trainingOrchestrator.registerModule({
  module: 'noshow',
  schedule: 'weekly',
  minDataPoints: 1000,
  validationSplit: 0.2,
  hyperparameters: {
    nEstimators: 100,
    maxDepth: 15,
    minSamplesSplit: 5,
  },
  enabled: true,
});

trainingOrchestrator.registerModule({
  module: 'segmentation',
  schedule: 'monthly',
  minDataPoints: 500,
  validationSplit: 0.2,
  hyperparameters: {
    k: 4,
    initialization: 'kmeans++',
  },
  enabled: true,
});

console.log('📅 Training Scheduler Started');
console.log('Registered modules:', trainingOrchestrator.getStatus().modules.join(', '));
console.log('');

// Daily training at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('\n⏰ [Daily Training] Starting at', new Date().toISOString());

  try {
    const reports = await trainingOrchestrator.trainAll();

    console.log('\n📊 Training Reports:');
    reports.forEach((report) => {
      console.log(`\n  ${report.module}:`);
      if (report.error) {
        console.log(`    ❌ Error: ${report.error}`);
      } else {
        console.log(`    ✅ Accuracy: ${(report.accuracy * 100).toFixed(2)}%`);
        console.log(`    ⏱️  Training time: ${(report.trainingTime / 1000).toFixed(1)}s`);
        console.log(`    📦 Data points: ${report.dataPoints}`);
      }
    });
  } catch (error) {
    console.error('❌ Training failed:', error);
  }
});

// Weekly summary on Sundays at 3 AM
cron.schedule('0 3 * * 0', async () => {
  console.log('\n📈 [Weekly Summary]', new Date().toISOString());

  const status = trainingOrchestrator.getStatus();
  console.log('\nData collected:');
  Object.entries(status.dataStats).forEach(([module, count]) => {
    console.log(`  ${module}: ${count} data points`);
  });
});

console.log('Scheduler is running. Press Ctrl+C to stop.');
console.log('Schedule:');
console.log('  - Daily training: 2:00 AM');
console.log('  - Weekly summary: Sunday 3:00 AM');
console.log('');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down training scheduler...');
  process.exit(0);
});
