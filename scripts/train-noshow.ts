#!/usr/bin/env tsx
/**
 * Train No-Show Prediction Model
 * Uses ML.js Random Forest for classification
 */

import { MLjsTrainer } from '../lib/training/mljs-trainer';
import { Booking } from '../lib/no-show/types';

// Generate synthetic training data
function generateTrainingData(count: number): {
  features: number[][];
  labels: number[];
} {
  const features: number[][] = [];
  const labels: number[] = [];

  for (let i = 0; i < count; i++) {
    // Random booking characteristics
    const daysBeforeArrival = Math.random() * 30;
    const leadTime = Math.random() * 90;
    const previousNoShows = Math.floor(Math.random() * 3);
    const roomRate = 50 + Math.random() * 200;
    const seasonalIndex = Math.random();
    const hasDeposit = Math.random() > 0.5 ? 1 : 0;
    const source = Math.random(); // 0=agent, 0.5=ota, 1=direct
    const paymentMethod = Math.random() > 0.7 ? 1 : 0; // 1=credit card

    features.push([
      daysBeforeArrival,
      leadTime,
      previousNoShows,
      roomRate / 100,
      seasonalIndex,
      hasDeposit,
      source,
      paymentMethod,
    ]);

    // Calculate no-show probability based on features
    let noShowProb = 0.1; // Base rate

    // Factors that increase no-show risk
    if (previousNoShows > 0) noShowProb += previousNoShows * 0.15;
    if (daysBeforeArrival < 2) noShowProb += 0.2;
    if (hasDeposit === 0) noShowProb += 0.15;
    if (source < 0.3) noShowProb += 0.1; // Agent booking
    if (paymentMethod === 0) noShowProb += 0.1; // Cash payment

    // Determine label
    const willNoShow = Math.random() < Math.min(noShowProb, 0.8);
    labels.push(willNoShow ? 1 : 0);
  }

  return { features, labels };
}

async function main() {
  console.log('🚫 Training No-Show Prediction Model\n');

  const trainer = new MLjsTrainer();

  // Generate training data
  console.log('Generating training data...');
  const { features, labels } = generateTrainingData(5000);
  console.log(`Generated ${features.length} samples\n`);

  // Cross-validation
  console.log('Running 5-fold cross-validation...');
  const cvResults = await trainer.crossValidate(
    features,
    labels,
    {
      nEstimators: 100,
      maxDepth: 15,
      minSamplesSplit: 5,
    },
    5
  );

  console.log('\n📊 Cross-Validation Results:');
  console.log(`  Accuracy:  ${(cvResults.accuracy * 100).toFixed(2)}%`);
  console.log(`  Precision: ${(cvResults.precision * 100).toFixed(2)}%`);
  console.log(`  Recall:    ${(cvResults.recall * 100).toFixed(2)}%`);
  console.log(`  F1 Score:  ${(cvResults.f1Score * 100).toFixed(2)}%\n`);

  // Train final model on all data
  console.log('Training final model on all data...');
  const model = await trainer.trainNoShowClassifier(features, labels, {
    nEstimators: 100,
    maxDepth: 15,
    minSamplesSplit: 5,
  });

  // Export model
  console.log('Exporting model...');
  await trainer.exportRFModel(model, './models/noshow-rf.json');

  console.log('\n✅ No-Show model training complete!');
  console.log('   Model saved to: ./models/noshow-rf.json');
  console.log(`   Expected accuracy: ${(cvResults.accuracy * 100).toFixed(2)}%`);
}

main().catch((error) => {
  console.error('❌ Training failed:', error);
  process.exit(1);
});
