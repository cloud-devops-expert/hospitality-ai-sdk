/**
 * Training System Types
 * Shared types for ML training infrastructure
 */

export interface TrainingDataPoint {
  id: string;
  timestamp: Date;
  module: 'forecast' | 'sentiment' | 'pricing' | 'allocation' | 'noshow' | 'segmentation';
  input: Record<string, any>;
  output: Record<string, any>;
  accuracy?: number;
  source: 'real' | 'synthetic' | 'historical';
  metadata?: Record<string, any>;
}

export interface TrainingConfig {
  module: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  minDataPoints: number;
  validationSplit: number;
  hyperparameters: Record<string, any>;
  enabled: boolean;
}

export interface TrainingReport {
  module: string;
  trainingTime: number;
  accuracy: number;
  dataPoints: number;
  modelSize: number;
  timestamp: Date;
  metrics?: {
    precision?: number;
    recall?: number;
    f1Score?: number;
    mape?: number;
    r2?: number;
  };
  error?: string;
}

export interface ModelMetadata {
  version: string;
  createdAt: Date;
  accuracy: number;
  dataPoints: number;
  hyperparameters: Record<string, any>;
  framework: 'tensorflow' | 'mljs' | 'brainjs' | 'custom';
}

export interface PredictionMetadata {
  model: string;
  version: string;
  confidence: number;
  processingTime: number;
  method: 'library' | 'custom';
}
