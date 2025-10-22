/**
 * No-Show Prediction Module
 * Uses ML.js Random Forest for accurate no-show predictions
 */

import { Booking, NoShowPrediction } from './types';
import { RandomForestClassifier as RFClassifier } from 'ml-random-forest';

let cachedModel: RFClassifier | null = null;

/**
 * Extract features from booking for ML model
 */
function extractFeatures(booking: Booking): number[] {
  return [
    booking.daysBeforeArrival,
    booking.leadTime,
    booking.previousNoShows || 0,
    booking.roomRate / 100, // Normalize
    booking.seasonalIndex || 0.5,
    booking.hasDeposit ? 1 : 0,
    booking.source === 'direct' ? 1 : booking.source === 'ota' ? 0.5 : 0,
    booking.paymentMethod === 'credit_card' ? 1 : 0,
  ];
}

/**
 * Predict no-show using ML.js Random Forest
 */
export async function predictNoShowML(
  booking: Booking
): Promise<NoShowPrediction> {
  const startTime = Date.now();

  try {
    // Load pre-trained model
    if (!cachedModel) {
      const MLjsTrainer = await import('../training/mljs-trainer');
      const trainer = new MLjsTrainer.MLjsTrainer();
      cachedModel = await trainer.loadRFModel('./models/noshow-rf.json');
    }

    // Extract features
    const features = extractFeatures(booking);

    // Predict
    const prediction = cachedModel.predict([features])[0]; // 0 or 1
    const probabilities = cachedModel.predictProbability([features])[0]; // [prob_0, prob_1]

    const probability = probabilities[1]; // Probability of no-show
    const confidence = Math.max(...probabilities);

    // Determine risk level
    const risk =
      probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low';

    // Identify contributing factors
    const factors: string[] = [];
    if (booking.previousNoShows && booking.previousNoShows > 0) {
      factors.push('Previous no-shows');
    }
    if (booking.daysBeforeArrival < 2) {
      factors.push('Last-minute booking');
    }
    if (!booking.hasDeposit) {
      factors.push('No deposit');
    }
    if (booking.source === 'ota') {
      factors.push('OTA booking');
    }

    return {
      bookingId: booking.id,
      willNoShow: prediction === 1,
      probability,
      confidence,
      risk,
      factors,
      method: 'ml.js Random Forest',
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    // Fallback to rule-based prediction
    return predictNoShowCustom(booking);
  }
}

/**
 * Custom rule-based no-show prediction (fallback)
 */
export function predictNoShowCustom(booking: Booking): NoShowPrediction {
  let riskScore = 0;
  const factors: string[] = [];

  // Previous no-shows (strong indicator)
  if (booking.previousNoShows && booking.previousNoShows > 0) {
    riskScore += booking.previousNoShows * 0.3;
    factors.push('Previous no-shows');
  }

  // Last-minute bookings
  if (booking.daysBeforeArrival < 2) {
    riskScore += 0.25;
    factors.push('Last-minute booking');
  }

  // No deposit
  if (!booking.hasDeposit) {
    riskScore += 0.2;
    factors.push('No deposit');
  }

  // OTA bookings (slightly higher risk)
  if (booking.source === 'ota') {
    riskScore += 0.15;
    factors.push('OTA booking');
  }

  // Payment method
  if (booking.paymentMethod === 'cash' || booking.paymentMethod === 'invoice') {
    riskScore += 0.1;
    factors.push('Cash/invoice payment');
  }

  // Clamp probability
  const probability = Math.min(0.95, riskScore);
  const willNoShow = probability > 0.5;
  const risk =
    probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low';

  return {
    bookingId: booking.id,
    willNoShow,
    probability,
    confidence: 0.72, // Lower confidence for rule-based
    risk,
    factors,
    method: 'custom rules',
  };
}

/**
 * Batch prediction for multiple bookings
 */
export async function predictNoShowBatch(
  bookings: Booking[]
): Promise<NoShowPrediction[]> {
  return Promise.all(bookings.map((booking) => predictNoShowML(booking)));
}

/**
 * Calculate no-show statistics for a set of bookings
 */
export function calculateNoShowStats(
  predictions: NoShowPrediction[]
): {
  totalBookings: number;
  predictedNoShows: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  averageProbability: number;
  potentialRevenueLoss: number;
} {
  const totalBookings = predictions.length;
  const predictedNoShows = predictions.filter((p) => p.willNoShow).length;
  const highRisk = predictions.filter((p) => p.risk === 'high').length;
  const mediumRisk = predictions.filter((p) => p.risk === 'medium').length;
  const lowRisk = predictions.filter((p) => p.risk === 'low').length;
  const averageProbability =
    predictions.reduce((sum, p) => sum + p.probability, 0) / totalBookings;

  return {
    totalBookings,
    predictedNoShows,
    highRisk,
    mediumRisk,
    lowRisk,
    averageProbability,
    potentialRevenueLoss: 0, // Calculate based on room rates if provided
  };
}
