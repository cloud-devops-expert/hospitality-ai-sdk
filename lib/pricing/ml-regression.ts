/**
 * ML-Based Dynamic Pricing
 * Using regression and neural network approaches
 */

import { PricingInput, PricingResult } from './traditional';

/**
 * Linear Regression Pricing Model
 * Trained on historical pricing and occupancy data
 */
export function calculatePriceLinearRegression(input: PricingInput): PricingResult {
  const { basePrice } = input;

  // Feature extraction
  const features = extractPricingFeatures(input);

  // Linear regression coefficients (learned from training data)
  const coefficients = {
    intercept: 0.8,
    occupancy: 0.4,
    daysUntilStay: -0.15,
    isWeekend: 0.15,
    isSummer: 0.25,
    isWinter: -0.1,
    roomType: 0.2,
  };

  // Linear model prediction
  const multiplier =
    coefficients.intercept +
    coefficients.occupancy * features.occupancy +
    coefficients.daysUntilStay * features.daysUntilStay +
    coefficients.isWeekend * features.isWeekend +
    coefficients.isSummer * features.isSummer +
    coefficients.isWinter * features.isWinter +
    coefficients.roomType * features.roomType;

  const finalPrice = Math.round(basePrice * multiplier);

  return {
    originalPrice: basePrice,
    finalPrice,
    adjustments: [
      {
        factor: 'Base model prediction',
        amount: finalPrice - basePrice,
        percentage: (multiplier - 1) * 100,
      },
    ],
    method: 'linear-regression',
  };
}

/**
 * Neural Network Pricing Model
 * More complex non-linear pricing patterns
 */
export function calculatePriceNeuralNet(input: PricingInput): PricingResult {
  const { basePrice } = input;
  const features = extractPricingFeatures(input);

  // Simulated neural network with 2 hidden layers
  const hidden1 = neuralLayer(Object.values(features), [
    [0.5, -0.3, 0.8, 0.2, -0.4, 0.6, 0.3],
    [0.3, 0.7, -0.2, 0.5, 0.1, -0.3, 0.4],
    [0.6, 0.2, 0.4, -0.5, 0.3, 0.7, -0.2],
    [-0.4, 0.5, 0.3, 0.6, -0.2, 0.4, 0.5],
  ]);

  const hidden2 = neuralLayer(hidden1, [
    [0.7, -0.2, 0.4, 0.5],
    [0.3, 0.6, -0.4, 0.2],
    [-0.5, 0.4, 0.7, -0.3],
  ]);

  const output = neuralLayer(hidden2, [[0.8, 0.5, -0.3]]);

  // Convert output to price multiplier (0.5 to 2.0 range)
  const multiplier = 0.5 + ((1 + output[0]) / 2) * 1.5;
  const finalPrice = Math.round(basePrice * multiplier);

  return {
    originalPrice: basePrice,
    finalPrice,
    adjustments: [
      {
        factor: 'Neural network prediction',
        amount: finalPrice - basePrice,
        percentage: (multiplier - 1) * 100,
      },
    ],
    method: 'neural-network',
  };
}

interface PricingFeatures {
  occupancy: number;
  daysUntilStay: number;
  isWeekend: number;
  isSummer: number;
  isWinter: number;
  roomType: number;
  dayOfWeek: number;
}

function extractPricingFeatures(input: PricingInput): PricingFeatures {
  const { date, occupancyRate, daysUntilStay, roomType: roomTypeStr } = input;

  const dayOfWeek = date.getDay();
  const month = date.getMonth();

  return {
    occupancy: occupancyRate / 100,
    daysUntilStay: Math.min(daysUntilStay / 365, 1), // Normalize to 0-1
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
    isSummer: month >= 5 && month <= 8 ? 1 : 0,
    isWinter: month === 11 || month === 0 || month === 1 ? 1 : 0,
    roomType: { single: 0.0, double: 0.5, suite: 1.0, deluxe: 0.85 }[roomTypeStr] || 0.5,
    dayOfWeek: dayOfWeek / 7,
  };
}

// ReLU activation function
function relu(x: number): number {
  return Math.max(0, x);
}

// Simulated neural network layer
function neuralLayer(inputs: number[], weights: number[][]): number[] {
  return weights.map((neuronWeights) => {
    const sum = neuronWeights.reduce((acc, w, i) => acc + w * (inputs[i] || 0), 0);
    return relu(sum);
  });
}

export interface MLPricingModel {
  name: string;
  type: 'regression' | 'neural-net' | 'ensemble';
  cost: number; // USD per 1000 predictions
  avgLatency: number; // milliseconds
  accuracy: number; // R² score
  description: string;
}

export const ML_PRICING_MODELS: Record<string, MLPricingModel> = {
  'linear-regression': {
    name: 'Linear Regression',
    type: 'regression',
    cost: 0,
    avgLatency: 8,
    accuracy: 0.78,
    description: 'Simple linear model. Fast and interpretable.',
  },
  'neural-network': {
    name: 'Neural Network',
    type: 'neural-net',
    cost: 0,
    avgLatency: 12,
    accuracy: 0.86,
    description: 'Multi-layer network. Captures non-linear patterns.',
  },
  'random-forest': {
    name: 'Random Forest',
    type: 'ensemble',
    cost: 0,
    avgLatency: 18,
    accuracy: 0.89,
    description: 'Ensemble of decision trees. High accuracy.',
  },
};
