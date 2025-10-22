#!/usr/bin/env tsx
/**
 * Train All ML Models
 * Orchestrates training for all models
 */

import { spawn } from 'child_process';
import { resolve } from 'path';

function runScript(scriptPath: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${scriptPath}`);
    console.log('='.repeat(60));

    const child = spawn('tsx', [scriptPath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`Script failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Training All ML Models');
  console.log('This will train:');
  console.log('  1. No-Show Prediction (Random Forest)');
  console.log('  2. Guest Segmentation (K-Means)');
  console.log('  3. (TensorFlow.js forecast training coming soon)');
  console.log('');

  const startTime = Date.now();

  try {
    // Train no-show model
    await runScript(resolve(__dirname, 'train-noshow.ts'));

    // Train segmentation model
    await runScript(resolve(__dirname, 'train-segmentation.ts'));

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All models trained successfully!');
    console.log(`   Total time: ${totalTime}s`);
    console.log('='.repeat(60));
    console.log('\nModels saved to:');
    console.log('  - ./models/noshow-rf.json');
    console.log('  - ./models/segmentation-kmeans.json');
    console.log('\nYou can now use these models in production!');
  } catch (error) {
    console.error('\n❌ Training pipeline failed:', error);
    process.exit(1);
  }
}

main();
