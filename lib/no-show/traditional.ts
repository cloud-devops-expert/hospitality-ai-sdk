/**
 * Traditional Rule-Based No-Show Prediction
 * Cost-effective scoring using historical patterns
 */

import { Booking, NoShowPrediction } from './types';

export function predictNoShowRuleBased(booking: Booking): NoShowPrediction {
  const startTime = Date.now();
  let riskScore = 0;
  const reasons: string[] = [];

  // Channel reliability (0-30 points)
  const channelScores: Record<Booking['bookingChannel'], number> = {
    'direct': 5,
    'phone': 10,
    'email': 12,
    'corporate': 8,
    'ota': 20,
  };
  riskScore += channelScores[booking.bookingChannel];
  if (booking.bookingChannel === 'ota') {
    reasons.push('OTA booking (higher risk)');
  }

  // Lead time (0-25 points)
  if (booking.leadTimeDays === 0) {
    riskScore += 25;
    reasons.push('Same-day booking (very high risk)');
  } else if (booking.leadTimeDays < 3) {
    riskScore += 18;
    reasons.push('Last-minute booking (high risk)');
  } else if (booking.leadTimeDays < 7) {
    riskScore += 10;
    reasons.push('Short lead time');
  } else if (booking.leadTimeDays > 60) {
    riskScore += 8;
    reasons.push('Very long lead time');
  }

  // Payment method (0-25 points)
  const paymentScores: Record<Booking['paymentMethod'], number> = {
    'prepaid': 0,
    'corporate-billing': 5,
    'pay-at-property': 25,
  };
  riskScore += paymentScores[booking.paymentMethod];
  if (booking.paymentMethod === 'pay-at-property') {
    reasons.push('No prepayment (high risk)');
  }

  // Special requests (-10 points = lower risk)
  if (booking.hasSpecialRequests) {
    riskScore -= 10;
    reasons.push('Has special requests (shows intent)');
  }

  // Guest history (0-20 points)
  if (booking.guestHistory) {
    const { totalStays, noShowCount, cancellationCount } = booking.guestHistory;
    const noShowRate = totalStays > 0 ? noShowCount / totalStays : 0;
    const cancellationRate = totalStays > 0 ? cancellationCount / totalStays : 0;

    if (noShowRate > 0.3) {
      riskScore += 20;
      reasons.push('History of no-shows');
    } else if (noShowRate > 0.1) {
      riskScore += 10;
      reasons.push('Some previous no-shows');
    } else if (totalStays > 5 && noShowRate === 0) {
      riskScore -= 15;
      reasons.push('Loyal guest with clean history');
    }

    if (cancellationRate > 0.3) {
      riskScore += 10;
      reasons.push('High cancellation history');
    }
  } else {
    riskScore += 10;
    reasons.push('New guest (no history)');
  }

  // Normalize to 0-1 probability
  const probability = Math.max(0, Math.min(1, riskScore / 100));

  // Determine risk level
  let riskLevel: NoShowPrediction['riskLevel'];
  if (probability < 0.3) {
    riskLevel = 'low';
  } else if (probability < 0.6) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  // Recommended actions
  const recommendedActions: string[] = [];
  if (riskLevel === 'high') {
    recommendedActions.push('Send confirmation SMS/email');
    recommendedActions.push('Require deposit or prepayment');
    recommendedActions.push('Consider overbooking buffer');
  } else if (riskLevel === 'medium') {
    recommendedActions.push('Send reminder 24h before arrival');
    recommendedActions.push('Confirm via phone call');
  } else {
    recommendedActions.push('Standard confirmation email');
  }

  const confidence = reasons.length > 0 ? Math.min(1, reasons.length / 5) : 0.5;

  return {
    bookingId: booking.id,
    probability,
    riskLevel,
    confidence,
    reasons,
    recommendedActions,
    method: 'rule-based',
    processingTime: Date.now() - startTime,
  };
}
