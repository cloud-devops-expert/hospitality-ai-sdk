#!/usr/bin/env tsx
/**
 * Train Guest Segmentation Model
 * Uses ML.js K-Means for clustering
 */

import { MLjsTrainer } from '../lib/training/mljs-trainer';
import { Guest } from '../lib/guests/segmentation';

// Generate synthetic guest data
function generateGuestData(count: number): number[][] {
  const features: number[][] = [];

  for (let i = 0; i < count; i++) {
    // Create guests with distinct profiles
    const segment = Math.floor(Math.random() * 4);

    let avgRoomRate: number;
    let totalStays: number;
    let avgDaysInAdvance: number;
    let roomUpgrades: number;
    let amenityUsage: number;

    switch (segment) {
      case 0: // Budget
        avgRoomRate = 50 + Math.random() * 50;
        totalStays = 1 + Math.random() * 3;
        avgDaysInAdvance = 20 + Math.random() * 30;
        roomUpgrades = 0;
        amenityUsage = Math.random() * 0.3;
        break;
      case 1: // Value
        avgRoomRate = 100 + Math.random() * 50;
        totalStays = 2 + Math.random() * 5;
        avgDaysInAdvance = 10 + Math.random() * 20;
        roomUpgrades = Math.random() * 2;
        amenityUsage = 0.3 + Math.random() * 0.3;
        break;
      case 2: // Premium
        avgRoomRate = 150 + Math.random() * 100;
        totalStays = 3 + Math.random() * 10;
        avgDaysInAdvance = 5 + Math.random() * 15;
        roomUpgrades = 1 + Math.random() * 4;
        amenityUsage = 0.5 + Math.random() * 0.3;
        break;
      case 3: // Luxury
        avgRoomRate = 250 + Math.random() * 250;
        totalStays = 5 + Math.random() * 20;
        avgDaysInAdvance = Math.random() * 10;
        roomUpgrades = 3 + Math.random() * 5;
        amenityUsage = 0.7 + Math.random() * 0.3;
        break;
      default:
        avgRoomRate = 100;
        totalStays = 2;
        avgDaysInAdvance = 14;
        roomUpgrades = 1;
        amenityUsage = 0.5;
    }

    features.push([
      avgRoomRate / 100,
      totalStays / 10,
      avgDaysInAdvance / 30,
      roomUpgrades / 5,
      amenityUsage,
    ]);
  }

  return features;
}

async function main() {
  console.log('👥 Training Guest Segmentation Model\n');

  const trainer = new MLjsTrainer();

  // Generate training data
  console.log('Generating guest data...');
  const features = generateGuestData(1000);
  console.log(`Generated ${features.length} guest profiles\n`);

  // Train K-Means clustering
  console.log('Training K-Means (4 segments)...');
  const result = await trainer.trainGuestSegmentation(features, {
    k: 4,
    initialization: 'kmeans++',
    maxIterations: 100,
  });

  console.log('\n📊 Clustering Results:');
  console.log(`  Number of segments: 4`);
  console.log(`  Centroids:`);
  result.centroids.forEach((centroid, i) => {
    console.log(`    Segment ${i + 1}: [${centroid.map((v) => v.toFixed(2)).join(', ')}]`);
  });

  // Calculate cluster sizes
  const clusterSizes = [0, 0, 0, 0];
  result.clusters.forEach((cluster) => {
    clusterSizes[cluster]++;
  });

  console.log(`\n  Segment sizes:`);
  clusterSizes.forEach((size, i) => {
    console.log(`    Segment ${i + 1}: ${size} guests (${((size / features.length) * 100).toFixed(1)}%)`);
  });

  // Export model
  console.log('\nExporting model...');
  await trainer.exportKMeansModel(result.centroids, './models/segmentation-kmeans.json');

  console.log('\n✅ Guest segmentation model training complete!');
  console.log('   Model saved to: ./models/segmentation-kmeans.json');
  console.log('   Segments: Budget, Value, Premium, Luxury');
}

main().catch((error) => {
  console.error('❌ Training failed:', error);
  process.exit(1);
});
