/**
 * TensorFlow.js Training System
 * Train deep learning models for time-series forecasting
 */

import * as tf from '@tensorflow/tfjs';

export interface LSTMConfig {
  sequenceLength: number;
  units: number[];
  epochs: number;
  batchSize: number;
  learningRate?: number;
  dropout?: number;
}

export class TensorFlowTrainer {
  /**
   * Train LSTM model for time-series forecasting
   */
  async trainForecastLSTM(
    data: number[][],
    config: LSTMConfig
  ): Promise<tf.LayersModel> {
    console.log('Preparing training data...');
    const { xs, ys, min, max } = this.prepareSequences(data, config.sequenceLength);

    console.log(`Training LSTM with ${xs.shape[0]} sequences...`);
    const model = this.buildLSTMModel(config);

    // Train
    const history = await model.fit(xs, ys, {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(
              `Epoch ${epoch}: ` +
              `loss=${logs?.loss.toFixed(4)}, ` +
              `val_loss=${logs?.val_loss?.toFixed(4)}, ` +
              `mae=${logs?.mae?.toFixed(4)}`
            );
          }
        },
      },
    });

    // Cleanup tensors
    xs.dispose();
    ys.dispose();

    // Store normalization params in model metadata
    (model as any).metadata = { min, max };

    console.log('Training complete!');
    return model;
  }

  /**
   * Build LSTM model architecture
   */
  private buildLSTMModel(config: LSTMConfig): tf.LayersModel {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.lstm({
      units: config.units[0],
      returnSequences: config.units.length > 1,
      inputShape: [config.sequenceLength, 1],
    }));

    if (config.dropout) {
      model.add(tf.layers.dropout({ rate: config.dropout }));
    }

    // Hidden layers
    for (let i = 1; i < config.units.length; i++) {
      model.add(tf.layers.lstm({
        units: config.units[i],
        returnSequences: i < config.units.length - 1,
      }));

      if (config.dropout) {
        model.add(tf.layers.dropout({ rate: config.dropout }));
      }
    }

    // Output layer
    model.add(tf.layers.dense({ units: 1 }));

    // Compile
    model.compile({
      optimizer: tf.train.adam(config.learningRate || 0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mape'],
    });

    return model;
  }

  /**
   * Prepare sequences for LSTM training
   */
  private prepareSequences(
    data: number[][],
    sequenceLength: number
  ): { xs: tf.Tensor3D; ys: tf.Tensor2D; min: number; max: number } {
    // Flatten data
    const values = data.flat();

    // Normalize to 0-1 range
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const normalized = values.map((v) => (v - min) / range);

    // Create sequences
    const xsData: number[][] = [];
    const ysData: number[] = [];

    for (let i = sequenceLength; i < normalized.length; i++) {
      xsData.push(normalized.slice(i - sequenceLength, i));
      ysData.push(normalized[i]);
    }

    // Convert to tensors
    const xs = tf.tensor3d(
      xsData.map((seq) => seq.map((v) => [v])),
      [xsData.length, sequenceLength, 1]
    );
    const ys = tf.tensor2d(ysData.map((v) => [v]), [ysData.length, 1]);

    return { xs, ys, min, max };
  }

  /**
   * Export model for production use
   */
  async exportModel(model: tf.LayersModel, path: string): Promise<void> {
    await model.save(`file://${path}`);
    console.log(`Model exported to ${path}`);
  }

  /**
   * Load pre-trained model
   */
  async loadModel(path: string): Promise<tf.LayersModel> {
    const model = await tf.loadLayersModel(`file://${path}/model.json`);
    console.log('Model loaded successfully');
    return model;
  }

  /**
   * Evaluate model performance
   */
  async evaluate(
    model: tf.LayersModel,
    testData: number[][],
    sequenceLength: number
  ): Promise<{ mse: number; mae: number; mape: number }> {
    const { xs, ys } = this.prepareSequences(testData, sequenceLength);

    const result = model.evaluate(xs, ys) as tf.Scalar[];
    const mse = await result[0].data();
    const mae = await result[1].data();
    const mape = await result[2].data();

    xs.dispose();
    ys.dispose();
    result.forEach((r) => r.dispose());

    return {
      mse: mse[0],
      mae: mae[0],
      mape: mape[0],
    };
  }
}
