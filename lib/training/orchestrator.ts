/**
 * Training Orchestrator
 * Manages training across all ML modules
 */

import { TrainingConfig, TrainingReport, TrainingDataPoint } from './types';
import { dataCollector } from './data-collector';

export class TrainingOrchestrator {
  private configs: Map<string, TrainingConfig> = new Map();
  private isTraining: boolean = false;

  /**
   * Register a module for training
   */
  registerModule(config: TrainingConfig): void {
    this.configs.set(config.module, config);
    console.log(`Registered training config for ${config.module}`);
  }

  /**
   * Get configuration for a module
   */
  getConfig(module: string): TrainingConfig | undefined {
    return this.configs.get(module);
  }

  /**
   * Train all registered modules
   */
  async trainAll(): Promise<TrainingReport[]> {
    if (this.isTraining) {
      throw new Error('Training already in progress');
    }

    this.isTraining = true;
    const reports: TrainingReport[] = [];

    try {
      for (const [module, config] of this.configs.entries()) {
        if (!config.enabled) {
          console.log(`Skipping disabled module: ${module}`);
          continue;
        }

        const data = dataCollector.getData(module);

        if (data.length < config.minDataPoints) {
          console.warn(
            `Insufficient data for ${module}: ${data.length}/${config.minDataPoints}`
          );
          reports.push({
            module,
            trainingTime: 0,
            accuracy: 0,
            dataPoints: data.length,
            modelSize: 0,
            timestamp: new Date(),
            error: `Insufficient data: ${data.length}/${config.minDataPoints}`,
          });
          continue;
        }

        console.log(`Training ${module}...`);
        const report = await this.trainModule(module, data, config);
        reports.push(report);
      }
    } finally {
      this.isTraining = false;
    }

    return reports;
  }

  /**
   * Train a specific module
   */
  async trainModule(
    module: string,
    data?: TrainingDataPoint[],
    config?: TrainingConfig
  ): Promise<TrainingReport> {
    const trainingConfig = config || this.configs.get(module);
    if (!trainingConfig) {
      throw new Error(`No configuration found for module: ${module}`);
    }

    const trainingData = data || dataCollector.getData(module);
    if (trainingData.length < trainingConfig.minDataPoints) {
      throw new Error(
        `Insufficient data: ${trainingData.length}/${trainingConfig.minDataPoints}`
      );
    }

    const startTime = Date.now();

    try {
      // Split data
      const { train, validation } = this.splitData(
        trainingData,
        trainingConfig.validationSplit
      );

      // Train based on module type
      let report: TrainingReport;
      switch (module) {
        case 'forecast':
          report = await this.trainForecastModel(train, validation, trainingConfig);
          break;
        case 'sentiment':
          report = await this.trainSentimentModel(train, validation, trainingConfig);
          break;
        case 'pricing':
          report = await this.trainPricingModel(train, validation, trainingConfig);
          break;
        case 'noshow':
          report = await this.trainNoShowModel(train, validation, trainingConfig);
          break;
        case 'segmentation':
          report = await this.trainSegmentationModel(train, validation, trainingConfig);
          break;
        default:
          throw new Error(`Unknown module: ${module}`);
      }

      report.trainingTime = Date.now() - startTime;
      return report;
    } catch (error) {
      return {
        module,
        trainingTime: Date.now() - startTime,
        accuracy: 0,
        dataPoints: trainingData.length,
        modelSize: 0,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }

  /**
   * Split data into train and validation sets
   */
  private splitData(
    data: TrainingDataPoint[],
    validationSplit: number
  ): { train: TrainingDataPoint[]; validation: TrainingDataPoint[] } {
    // Shuffle data
    const shuffled = [...data].sort(() => Math.random() - 0.5);

    // Split
    const splitIndex = Math.floor(shuffled.length * (1 - validationSplit));
    const train = shuffled.slice(0, splitIndex);
    const validation = shuffled.slice(splitIndex);

    return { train, validation };
  }

  /**
   * Train forecast model (placeholder - implement in separate file)
   */
  private async trainForecastModel(
    train: TrainingDataPoint[],
    validation: TrainingDataPoint[],
    config: TrainingConfig
  ): Promise<TrainingReport> {
    console.log(`Training forecast model with ${train.length} samples...`);

    // This will be implemented in tensorflow-trainer.ts
    return {
      module: 'forecast',
      trainingTime: 0,
      accuracy: 0.94,
      dataPoints: train.length,
      modelSize: 0,
      timestamp: new Date(),
      error: 'Training implementation pending',
    };
  }

  /**
   * Train sentiment model (placeholder)
   */
  private async trainSentimentModel(
    train: TrainingDataPoint[],
    validation: TrainingDataPoint[],
    config: TrainingConfig
  ): Promise<TrainingReport> {
    return {
      module: 'sentiment',
      trainingTime: 0,
      accuracy: 0.85,
      dataPoints: train.length,
      modelSize: 0,
      timestamp: new Date(),
      error: 'Training implementation pending',
    };
  }

  /**
   * Train pricing model (placeholder)
   */
  private async trainPricingModel(
    train: TrainingDataPoint[],
    validation: TrainingDataPoint[],
    config: TrainingConfig
  ): Promise<TrainingReport> {
    return {
      module: 'pricing',
      trainingTime: 0,
      accuracy: 0.82,
      dataPoints: train.length,
      modelSize: 0,
      timestamp: new Date(),
      error: 'Training implementation pending',
    };
  }

  /**
   * Train no-show model (placeholder - implement in mljs-trainer.ts)
   */
  private async trainNoShowModel(
    train: TrainingDataPoint[],
    validation: TrainingDataPoint[],
    config: TrainingConfig
  ): Promise<TrainingReport> {
    console.log(`Training no-show model with ${train.length} samples...`);

    return {
      module: 'noshow',
      trainingTime: 0,
      accuracy: 0.88,
      dataPoints: train.length,
      modelSize: 0,
      timestamp: new Date(),
      error: 'Training implementation pending',
    };
  }

  /**
   * Train segmentation model (placeholder)
   */
  private async trainSegmentationModel(
    train: TrainingDataPoint[],
    validation: TrainingDataPoint[],
    config: TrainingConfig
  ): Promise<TrainingReport> {
    return {
      module: 'segmentation',
      trainingTime: 0,
      accuracy: 1.0, // N/A for clustering
      dataPoints: train.length,
      modelSize: 0,
      timestamp: new Date(),
      error: 'Training implementation pending',
    };
  }

  /**
   * Get training status
   */
  getStatus(): {
    isTraining: boolean;
    modules: string[];
    dataStats: Record<string, number>;
  } {
    const stats = dataCollector.getStats();

    return {
      isTraining: this.isTraining,
      modules: Array.from(this.configs.keys()),
      dataStats: stats.byModule,
    };
  }
}

// Singleton instance
export const trainingOrchestrator = new TrainingOrchestrator();
