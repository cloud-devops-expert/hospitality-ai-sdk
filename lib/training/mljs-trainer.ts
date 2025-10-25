/**
 * ML.js Training System
 * Train classical ML models for classification and clustering
 */

import { RandomForestClassifier as RFClassifier } from 'ml-random-forest';
import { kmeans } from 'ml-kmeans';

export interface RandomForestConfig {
  nEstimators: number;
  maxDepth: number;
  minSamplesSplit: number;
  replacement?: boolean;
}

export interface KMeansConfig {
  k: number;
  initialization?: 'random' | 'kmeans++' | 'mostDistant';
  maxIterations?: number;
}

export class MLjsTrainer {
  /**
   * Train Random Forest classifier for no-show prediction
   */
  async trainNoShowClassifier(
    features: number[][],
    labels: number[],
    config: RandomForestConfig
  ): Promise<RFClassifier> {
    console.log(`Training Random Forest with ${features.length} samples...`);

    const classifier = new RFClassifier({
      nEstimators: config.nEstimators,
      // maxDepth and minSamplesSplit are not valid options for ml-random-forest
      replacement: config.replacement !== false,
    });

    // Train
    classifier.train(features, labels);

    console.log('Random Forest training complete');
    return classifier;
  }

  /**
   * Cross-validation for model evaluation
   */
  async crossValidate(
    features: number[][],
    labels: number[],
    config: RandomForestConfig,
    folds: number = 5
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    const foldSize = Math.floor(features.length / folds);
    const metrics = {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
    };

    for (let i = 0; i < folds; i++) {
      // Split data
      const testStart = i * foldSize;
      const testEnd = testStart + foldSize;

      const trainFeatures = [
        ...features.slice(0, testStart),
        ...features.slice(testEnd),
      ];
      const trainLabels = [...labels.slice(0, testStart), ...labels.slice(testEnd)];
      const testFeatures = features.slice(testStart, testEnd);
      const testLabels = labels.slice(testStart, testEnd);

      // Train model
      const classifier = await this.trainNoShowClassifier(
        trainFeatures,
        trainLabels,
        config
      );

      // Evaluate
      const predictions = classifier.predict(testFeatures);
      const foldMetrics = this.calculateMetrics(testLabels, predictions);

      metrics.accuracy += foldMetrics.accuracy;
      metrics.precision += foldMetrics.precision;
      metrics.recall += foldMetrics.recall;
      metrics.f1Score += foldMetrics.f1Score;
    }

    // Average across folds
    return {
      accuracy: metrics.accuracy / folds,
      precision: metrics.precision / folds,
      recall: metrics.recall / folds,
      f1Score: metrics.f1Score / folds,
    };
  }

  /**
   * Calculate classification metrics
   */
  private calculateMetrics(
    actual: number[],
    predicted: number[]
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    let tp = 0; // True positives
    let fp = 0; // False positives
    let tn = 0; // True negatives
    let fn = 0; // False negatives

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] === 1 && predicted[i] === 1) tp++;
      else if (actual[i] === 0 && predicted[i] === 1) fp++;
      else if (actual[i] === 0 && predicted[i] === 0) tn++;
      else if (actual[i] === 1 && predicted[i] === 0) fn++;
    }

    const accuracy = (tp + tn) / (tp + tn + fp + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = (2 * precision * recall) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1Score };
  }

  /**
   * Train K-Means clustering for guest segmentation
   */
  async trainGuestSegmentation(
    features: number[][],
    config: KMeansConfig
  ): Promise<{ centroids: number[][]; clusters: number[] }> {
    console.log(`Training K-Means with ${features.length} samples...`);

    const result = kmeans(features, config.k, {
      initialization: config.initialization || 'kmeans++',
      maxIterations: config.maxIterations || 100,
    });

    console.log('K-Means training complete');
    return {
      centroids: result.centroids,
      clusters: result.clusters,
    };
  }

  /**
   * Export Random Forest model to JSON
   */
  async exportRFModel(model: RFClassifier, path: string): Promise<void> {
    if (typeof window !== 'undefined') {
      // Browser: Save to localStorage
      const json = JSON.stringify(model.toJSON());
      localStorage.setItem(`model-${path}`, json);
      console.log(`Model saved to localStorage: model-${path}`);
    } else {
      // Node: Save to file
      const fs = await import('fs/promises');
      const pathModule = await import('path');

      const dir = pathModule.dirname(path);
      await fs.mkdir(dir, { recursive: true });

      const json = JSON.stringify(model.toJSON());
      await fs.writeFile(path, json);
      console.log(`Model saved to ${path}`);
    }
  }

  /**
   * Load Random Forest model from JSON
   */
  async loadRFModel(path: string): Promise<RFClassifier> {
    let json: string;

    if (typeof window !== 'undefined') {
      // Browser: Load from localStorage
      json = localStorage.getItem(`model-${path}`) || '{}';
    } else {
      // Node: Load from file
      const fs = await import('fs/promises');
      json = await fs.readFile(path, 'utf-8');
    }

    const modelData = JSON.parse(json);
    const model = RFClassifier.load(modelData);
    console.log('Model loaded successfully');
    return model;
  }

  /**
   * Export K-Means model to JSON
   */
  async exportKMeansModel(
    centroids: number[][],
    path: string
  ): Promise<void> {
    const modelData = {
      type: 'kmeans',
      centroids,
      k: centroids.length,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`model-${path}`, JSON.stringify(modelData));
    } else {
      const fs = await import('fs/promises');
      const pathModule = await import('path');

      const dir = pathModule.dirname(path);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(path, JSON.stringify(modelData, null, 2));
    }

    console.log(`K-Means model saved`);
  }

  /**
   * Load K-Means model from JSON
   */
  async loadKMeansModel(path: string): Promise<number[][]> {
    let json: string;

    if (typeof window !== 'undefined') {
      json = localStorage.getItem(`model-${path}`) || '{}';
    } else {
      const fs = await import('fs/promises');
      json = await fs.readFile(path, 'utf-8');
    }

    const modelData = JSON.parse(json);
    return modelData.centroids;
  }
}
