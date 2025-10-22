# ML Training Automation System

## Overview

This document outlines the training automation system for hospitality AI SDK modules, including how to train models, automate the process, and integrate TensorFlow.js and ML.js for production deployment.

## Training Architecture

### Current State (Phase 1-3)
- **Brain.js**: Trains on-device in real-time (~100ms)
- **Natural**: Pre-trained AFINN lexicon (no training needed)
- **Regression.js**: Trains on-device with historical data
- **Simple-statistics**: Statistical methods (no training needed)

### Proposed State (Phase 4+)
- **Offline Training**: Train models with large datasets
- **Model Export**: Export trained models to production-ready format
- **TensorFlow.js**: Use pre-trained models for inference
- **ML.js**: Use pre-trained models for classification
- **Automatic Retraining**: Schedule periodic model updates

## Training Pipeline Design

### 1. Data Collection Layer

```typescript
// lib/training/data-collector.ts

export interface TrainingDataPoint {
  id: string;
  timestamp: Date;
  module: 'forecast' | 'sentiment' | 'pricing' | 'allocation' | 'noshow';
  input: Record<string, any>;
  output: Record<string, any>;
  accuracy?: number;
  source: 'real' | 'synthetic' | 'historical';
}

export class DataCollector {
  private buffer: TrainingDataPoint[] = [];
  private readonly maxBufferSize = 10000;

  async collect(dataPoint: TrainingDataPoint): Promise<void> {
    this.buffer.push(dataPoint);

    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    // Save to local storage or database
    await this.saveToStorage(this.buffer);
    this.buffer = [];
  }

  private async saveToStorage(data: TrainingDataPoint[]): Promise<void> {
    // Save to IndexedDB for browser
    // Or filesystem for Node.js
    const db = await this.openDB();
    await db.put('training-data', {
      timestamp: new Date(),
      data,
    });
  }
}
```

### 2. Training Orchestrator

```typescript
// lib/training/orchestrator.ts

export interface TrainingConfig {
  module: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  minDataPoints: number;
  validationSplit: number;
  hyperparameters: Record<string, any>;
}

export class TrainingOrchestrator {
  private configs: Map<string, TrainingConfig> = new Map();

  registerModule(config: TrainingConfig): void {
    this.configs.set(config.module, config);
  }

  async trainAll(): Promise<TrainingReport[]> {
    const reports: TrainingReport[] = [];

    for (const [module, config] of this.configs.entries()) {
      const data = await this.loadTrainingData(module);

      if (data.length < config.minDataPoints) {
        console.warn(`Insufficient data for ${module}: ${data.length}/${config.minDataPoints}`);
        continue;
      }

      const report = await this.trainModule(module, data, config);
      reports.push(report);
    }

    return reports;
  }

  private async trainModule(
    module: string,
    data: TrainingDataPoint[],
    config: TrainingConfig
  ): Promise<TrainingReport> {
    const startTime = Date.now();

    // Split data
    const { train, validation } = this.splitData(data, config.validationSplit);

    // Train based on module type
    let model: any;
    switch (module) {
      case 'forecast':
        model = await this.trainForecastModel(train, config);
        break;
      case 'sentiment':
        model = await this.trainSentimentModel(train, config);
        break;
      case 'pricing':
        model = await this.trainPricingModel(train, config);
        break;
      case 'noshow':
        model = await this.trainNoShowModel(train, config);
        break;
      default:
        throw new Error(`Unknown module: ${module}`);
    }

    // Validate
    const accuracy = await this.validateModel(model, validation);

    // Save model
    await this.saveModel(module, model, accuracy);

    return {
      module,
      trainingTime: Date.now() - startTime,
      accuracy,
      dataPoints: data.length,
      modelSize: this.getModelSize(model),
      timestamp: new Date(),
    };
  }
}
```

### 3. TensorFlow.js Integration

```typescript
// lib/training/tensorflow-trainer.ts

import * as tf from '@tensorflow/tfjs';

export class TensorFlowTrainer {
  /**
   * Train LSTM model for time-series forecasting
   */
  async trainForecastLSTM(
    data: number[][],
    config: {
      sequenceLength: number;
      units: number[];
      epochs: number;
      batchSize: number;
    }
  ): Promise<tf.LayersModel> {
    // Prepare sequences
    const { xs, ys } = this.prepareSequences(data, config.sequenceLength);

    // Build LSTM model
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.lstm({
      units: config.units[0],
      returnSequences: config.units.length > 1,
      inputShape: [config.sequenceLength, 1],
    }));

    // Hidden layers
    for (let i = 1; i < config.units.length; i++) {
      model.add(tf.layers.lstm({
        units: config.units[i],
        returnSequences: i < config.units.length - 1,
      }));
    }

    // Output layer
    model.add(tf.layers.dense({ units: 1 }));

    // Compile
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });

    // Train
    await model.fit(xs, ys, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
        },
      },
    });

    return model;
  }

  /**
   * Export model for production
   */
  async exportModel(model: tf.LayersModel, path: string): Promise<void> {
    await model.save(`file://${path}`);
  }

  /**
   * Load pre-trained model
   */
  async loadModel(path: string): Promise<tf.LayersModel> {
    return await tf.loadLayersModel(`file://${path}/model.json`);
  }
}
```

### 4. ML.js Integration

```typescript
// lib/training/mljs-trainer.ts

import { RandomForestClassifier } from 'ml-random-forest';
import { CrossValidation } from 'ml-cross-validation';
import { SVM } from 'ml-svm';

export class MLjsTrainer {
  /**
   * Train Random Forest for no-show prediction
   */
  async trainNoShowClassifier(
    features: number[][],
    labels: number[],
    config: {
      nEstimators: number;
      maxDepth: number;
      minSamplesSplit: number;
    }
  ): Promise<RandomForestClassifier> {
    const classifier = new RandomForestClassifier({
      nEstimators: config.nEstimators,
      maxDepth: config.maxDepth,
      minSamplesSplit: config.minSamplesSplit,
    });

    // Train
    classifier.train(features, labels);

    return classifier;
  }

  /**
   * Train SVM for guest classification
   */
  async trainGuestClassifier(
    features: number[][],
    labels: number[]
  ): Promise<SVM> {
    const svm = new SVM({
      kernel: 'rbf',
      C: 1.0,
      gamma: 0.1,
    });

    svm.train(features, labels);

    return svm;
  }

  /**
   * Cross-validation for model evaluation
   */
  async crossValidate(
    features: number[][],
    labels: number[],
    model: any,
    folds: number = 5
  ): Promise<{ accuracy: number; precision: number; recall: number }> {
    const cv = new CrossValidation(model, features, labels, {
      folds,
    });

    const results = await cv.run();

    return {
      accuracy: results.accuracy,
      precision: results.precision,
      recall: results.recall,
    };
  }

  /**
   * Export model to JSON
   */
  async exportModel(model: any, path: string): Promise<void> {
    const json = JSON.stringify(model.toJSON());
    // Save to filesystem or storage
    await this.saveToFile(path, json);
  }

  /**
   * Load pre-trained model
   */
  async loadModel(path: string, ModelClass: any): Promise<any> {
    const json = await this.loadFromFile(path);
    return ModelClass.load(JSON.parse(json));
  }
}
```

## Automation Strategy

### Option 1: Scheduled Training (Cron-based)

```typescript
// lib/training/scheduler.ts

import cron from 'node-cron';

export class TrainingScheduler {
  private orchestrator: TrainingOrchestrator;

  constructor(orchestrator: TrainingOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Schedule daily training at 2 AM
   */
  scheduleDailyTraining(): void {
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting scheduled training...');
      const reports = await this.orchestrator.trainAll();
      await this.sendNotification(reports);
    });
  }

  /**
   * Schedule weekly training on Sundays
   */
  scheduleWeeklyTraining(): void {
    cron.schedule('0 2 * * 0', async () => {
      console.log('Starting weekly training...');
      const reports = await this.orchestrator.trainAll();
      await this.sendNotification(reports);
    });
  }

  private async sendNotification(reports: TrainingReport[]): Promise<void> {
    // Send email, Slack message, or webhook
    console.log('Training complete:', reports);
  }
}
```

### Option 2: Event-Driven Training

```typescript
// lib/training/event-driven.ts

export class EventDrivenTrainer {
  private dataCollector: DataCollector;
  private orchestrator: TrainingOrchestrator;

  /**
   * Trigger training when data threshold is reached
   */
  async onDataThreshold(module: string): Promise<void> {
    const config = this.orchestrator.getConfig(module);
    const dataCount = await this.dataCollector.getCount(module);

    if (dataCount >= config.minDataPoints * 2) {
      console.log(`Threshold reached for ${module}, triggering training...`);
      await this.orchestrator.trainModule(module);
    }
  }

  /**
   * Trigger training when accuracy drops
   */
  async onAccuracyDrop(module: string, currentAccuracy: number): Promise<void> {
    const baseline = await this.getBaselineAccuracy(module);

    if (currentAccuracy < baseline * 0.9) {
      console.log(`Accuracy drop detected for ${module}, retraining...`);
      await this.orchestrator.trainModule(module);
    }
  }
}
```

### Option 3: Continuous Learning

```typescript
// lib/training/continuous.ts

export class ContinuousLearner {
  /**
   * Incremental learning with online updates
   */
  async updateModel(
    module: string,
    newData: TrainingDataPoint[]
  ): Promise<void> {
    const model = await this.loadCurrentModel(module);

    // Perform incremental update
    await this.incrementalTrain(model, newData);

    // Save updated model
    await this.saveModel(module, model);
  }

  /**
   * A/B testing for model comparison
   */
  async abTest(
    module: string,
    modelA: any,
    modelB: any,
    testData: TrainingDataPoint[]
  ): Promise<{ winner: 'A' | 'B'; accuracyA: number; accuracyB: number }> {
    const accuracyA = await this.evaluate(modelA, testData);
    const accuracyB = await this.evaluate(modelB, testData);

    return {
      winner: accuracyA > accuracyB ? 'A' : 'B',
      accuracyA,
      accuracyB,
    };
  }
}
```

## Training Workflow

### Step 1: Data Collection (Automatic)

```typescript
// In production code
import { dataCollector } from '@/lib/training/data-collector';

// Collect data from real usage
const result = await forecastHybrid(historicalData, 14);
await dataCollector.collect({
  id: uuid(),
  timestamp: new Date(),
  module: 'forecast',
  input: { historicalData, daysAhead: 14 },
  output: result,
  source: 'real',
});
```

### Step 2: Manual Training (Development)

```bash
# Train all modules
npm run train

# Train specific module
npm run train -- --module forecast

# Train with custom config
npm run train -- --config training-config.json

# Export models for production
npm run train:export -- --output ./models
```

### Step 3: Automated Training (Production)

```typescript
// server/training-server.ts

import express from 'express';
import { TrainingOrchestrator } from '@/lib/training/orchestrator';
import { TrainingScheduler } from '@/lib/training/scheduler';

const app = express();
const orchestrator = new TrainingOrchestrator();
const scheduler = new TrainingScheduler(orchestrator);

// Register modules
orchestrator.registerModule({
  module: 'forecast',
  schedule: 'daily',
  minDataPoints: 1000,
  validationSplit: 0.2,
  hyperparameters: {
    units: [64, 32],
    epochs: 50,
    batchSize: 32,
  },
});

// Start scheduled training
scheduler.scheduleDailyTraining();

// Manual trigger endpoint
app.post('/api/train/:module', async (req, res) => {
  const { module } = req.params;
  const report = await orchestrator.trainModule(module);
  res.json(report);
});

// Health check
app.get('/api/training/status', async (req, res) => {
  const status = await orchestrator.getStatus();
  res.json(status);
});

app.listen(3001, () => {
  console.log('Training server running on port 3001');
});
```

## Model Deployment Pipeline

### 1. Train Offline (Development/CI)

```typescript
// scripts/train-models.ts

import { TensorFlowTrainer } from '@/lib/training/tensorflow-trainer';
import { MLjsTrainer } from '@/lib/training/mljs-trainer';

async function trainAllModels() {
  const tfTrainer = new TensorFlowTrainer();
  const mljsTrainer = new MLjsTrainer();

  // 1. Train forecast model
  console.log('Training forecast LSTM...');
  const forecastData = await loadForecastData();
  const forecastModel = await tfTrainer.trainForecastLSTM(forecastData, {
    sequenceLength: 7,
    units: [64, 32],
    epochs: 100,
    batchSize: 32,
  });
  await tfTrainer.exportModel(forecastModel, './models/forecast');

  // 2. Train no-show classifier
  console.log('Training no-show classifier...');
  const { features, labels } = await loadNoShowData();
  const noShowModel = await mljsTrainer.trainNoShowClassifier(features, labels, {
    nEstimators: 100,
    maxDepth: 10,
    minSamplesSplit: 5,
  });
  await mljsTrainer.exportModel(noShowModel, './models/noshow');

  console.log('All models trained and exported!');
}

trainAllModels();
```

### 2. Use Pre-trained Models (Production)

```typescript
// lib/forecast/tensorflow.ts

import * as tf from '@tensorflow/tfjs';

let cachedModel: tf.LayersModel | null = null;

export async function forecastWithTensorFlow(
  historicalData: DataPoint[],
  daysAhead: number
): Promise<ForecastResult[]> {
  // Load pre-trained model (cached)
  if (!cachedModel) {
    cachedModel = await tf.loadLayersModel('/models/forecast/model.json');
  }

  // Prepare input
  const values = historicalData.map(d => d.value);
  const normalized = normalizeData(values);
  const sequences = prepareSequences(normalized, 7);

  // Predict
  const input = tf.tensor3d([sequences]);
  const predictions = cachedModel.predict(input) as tf.Tensor;
  const results = await predictions.array();

  // Denormalize and format
  return formatResults(results, historicalData, daysAhead);
}
```

## Performance Monitoring

```typescript
// lib/training/monitoring.ts

export class ModelMonitor {
  /**
   * Track model performance in production
   */
  async trackPrediction(
    module: string,
    predicted: any,
    actual: any,
    timestamp: Date
  ): Promise<void> {
    const error = this.calculateError(predicted, actual);

    await this.logMetric({
      module,
      error,
      timestamp,
    });

    // Trigger retraining if error exceeds threshold
    if (error > this.getThreshold(module)) {
      await this.triggerRetraining(module);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(module: string, period: 'day' | 'week' | 'month'): Promise<Report> {
    const metrics = await this.getMetrics(module, period);

    return {
      module,
      period,
      averageError: this.average(metrics.map(m => m.error)),
      p95Error: this.percentile(metrics.map(m => m.error), 0.95),
      totalPredictions: metrics.length,
      timestamp: new Date(),
    };
  }
}
```

## Recommended Architecture

### Phase 1 (Current): On-Device Training
- Brain.js trains in real-time (~100ms)
- No data collection needed
- Zero latency for model updates
- Limited by browser/device resources

### Phase 2: Hybrid Training
- Collect data from production usage
- Train improved models offline with TensorFlow.js
- Deploy pre-trained models for inference
- Fallback to on-device training when needed

### Phase 3: Continuous Learning
- Automated training pipeline with scheduled updates
- A/B testing for model comparison
- Performance monitoring and alerting
- Incremental learning for model updates

## Cost Analysis

| Approach | Setup Time | Accuracy | Latency | Maintenance |
|----------|-----------|----------|---------|-------------|
| On-device (current) | 0h | 91% | 100ms | Low |
| Pre-trained TF.js | 40h | 94% | 20ms | Medium |
| Continuous learning | 120h | 96% | 20ms | High |

## Next Steps

1. **Implement data collector** in production code
2. **Create training scripts** for offline model training
3. **Set up TensorFlow.js pipeline** for forecast module
4. **Implement ML.js pipeline** for classification
5. **Deploy training server** for automated updates
6. **Monitor model performance** in production
7. **Iterate on hyperparameters** based on results

## References

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [ML.js Documentation](https://github.com/mljs)
- [Brain.js Documentation](https://github.com/BrainJS/brain.js)
- [Model Training Best Practices](https://developers.google.com/machine-learning/crash-course)
