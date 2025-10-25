/**
 * Fraud Detection Demo - XGBoost-Powered Booking Fraud Prevention
 *
 * Three-View Architecture:
 * 1. Pending Reviews - High-risk bookings requiring staff review
 * 2. Performance Metrics - ROI proof and detection accuracy
 * 3. Historical - 7-day trends showing system learning
 *
 * ROI: $1,200/month ($14,400/year) for 50-room hotel
 * Technology: XGBoost gradient boosting + rule-based overrides
 * Performance: 85% fraud detection, 12% false positive rate, <80ms inference
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ViewTabs,
  ROICard,
  ROIMetrics,
  HistoricalTable,
  InsightsBox,
  TableFormatters,
} from '@/components/demos/shared';

// ============================================================================
// Types
// ============================================================================

interface PendingReview {
  id: string;
  bookingReference: string;
  guestName: string;
  riskScore: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium';
  hoursUntilCheckIn: number;
  bookingDetails: {
    rooms: number;
    guests: number;
    nights: number;
    totalValue: number;
    paymentMethod: string;
    isInternational: boolean;
    isFirstTime: boolean;
  };
  riskFactors: Array<{
    factor: string;
    weight: number; // 0-1
    description: string;
  }>;
  recommendation: 'approve' | 'require_deposit' | 'require_id' | 'decline';
  similarFraudCases: number;
}

interface DailyStats {
  date: string;
  day: string;
  totalBookings: number;
  flaggedBookings: number;
  confirmedFraud: number;
  detectedFraud: number;
  missedFraud: number;
  falseAlarms: number;
  detectionRate: number; // percentage
  falsePositiveRate: number; // percentage
  precision: number; // percentage
  avgRiskScore: number;
  fraudPreventedValue: number;
  dailySavings: number;
  insight: string;
}

// ============================================================================
// Sample Data
// ============================================================================

const PENDING_REVIEWS: PendingReview[] = [
  {
    id: '1',
    bookingReference: 'BK-2024-8291',
    guestName: 'James Rodriguez',
    riskScore: 91,
    riskLevel: 'critical',
    hoursUntilCheckIn: 4,
    bookingDetails: {
      rooms: 5,
      guests: 2,
      nights: 1,
      totalValue: 2800,
      paymentMethod: 'Prepaid Card',
      isInternational: true,
      isFirstTime: true,
    },
    riskFactors: [
      {
        factor: 'Multiple rooms, minimal guests',
        weight: 0.32,
        description: '5 rooms for 2 guests - unusual party pattern',
      },
      {
        factor: 'Extremely last-minute booking',
        weight: 0.28,
        description: 'Check-in in 4 hours - high urgency red flag',
      },
      {
        factor: 'Prepaid card payment',
        weight: 0.22,
        description: 'Prepaid cards have 5x higher fraud rate',
      },
      {
        factor: 'First-time international guest',
        weight: 0.18,
        description: 'No booking history, international payment',
      },
    ],
    recommendation: 'decline',
    similarFraudCases: 7,
  },
  {
    id: '2',
    bookingReference: 'BK-2024-8287',
    guestName: 'Sarah Chen',
    riskScore: 82,
    riskLevel: 'high',
    hoursUntilCheckIn: 12,
    bookingDetails: {
      rooms: 3,
      guests: 12,
      nights: 1,
      totalValue: 950,
      paymentMethod: 'Prepaid Card',
      isInternational: false,
      isFirstTime: true,
    },
    riskFactors: [
      {
        factor: 'High guest-to-room ratio',
        weight: 0.30,
        description: '12 guests in 3 rooms (4:1 ratio) - party risk',
      },
      {
        factor: 'Last-minute weekend booking',
        weight: 0.25,
        description: 'Friday night booking made same-day',
      },
      {
        factor: 'Prepaid card payment',
        weight: 0.22,
        description: 'Prepaid cards common in party bookings',
      },
      {
        factor: 'First-time guest',
        weight: 0.15,
        description: 'No previous booking history',
      },
    ],
    recommendation: 'require_id',
    similarFraudCases: 5,
  },
  {
    id: '3',
    bookingReference: 'BK-2024-8283',
    guestName: 'Michael Foster',
    riskScore: 76,
    riskLevel: 'high',
    hoursUntilCheckIn: 18,
    bookingDetails: {
      rooms: 2,
      guests: 2,
      nights: 1,
      totalValue: 1800,
      paymentMethod: 'Credit Card',
      isInternational: true,
      isFirstTime: true,
    },
    riskFactors: [
      {
        factor: 'High-value single-night booking',
        weight: 0.35,
        description: '$1,800 for one night - unusually high',
      },
      {
        factor: 'First-time international guest',
        weight: 0.25,
        description: 'International payment, no history',
      },
      {
        factor: 'Last-minute booking',
        weight: 0.20,
        description: 'Booked <24 hours before check-in',
      },
    ],
    recommendation: 'require_id',
    similarFraudCases: 3,
  },
  {
    id: '4',
    bookingReference: 'BK-2024-8279',
    guestName: 'Emma Wilson',
    riskScore: 69,
    riskLevel: 'medium',
    hoursUntilCheckIn: 36,
    bookingDetails: {
      rooms: 1,
      guests: 2,
      nights: 2,
      totalValue: 580,
      paymentMethod: 'Debit Card',
      isInternational: false,
      isFirstTime: true,
    },
    riskFactors: [
      {
        factor: 'First-time guest',
        weight: 0.28,
        description: 'No previous booking history',
      },
      {
        factor: 'Debit card payment',
        weight: 0.18,
        description: 'Debit cards have moderate risk',
      },
      {
        factor: 'Booking value slightly above average',
        weight: 0.12,
        description: '$290/night vs $220 average',
      },
    ],
    recommendation: 'require_deposit',
    similarFraudCases: 1,
  },
];

const HISTORICAL_DATA: DailyStats[] = [
  {
    date: '2024-10-25',
    day: 'Fri',
    totalBookings: 112,
    flaggedBookings: 18,
    confirmedFraud: 3,
    detectedFraud: 3,
    missedFraud: 0,
    falseAlarms: 15,
    detectionRate: 100,
    falsePositiveRate: 13.4,
    precision: 16.7,
    avgRiskScore: 72.5,
    fraudPreventedValue: 2400,
    dailySavings: 2100,
    insight: 'Perfect detection day - all 3 fraud cases flagged. Weekend party pattern detected.',
  },
  {
    date: '2024-10-24',
    day: 'Thu',
    totalBookings: 118,
    flaggedBookings: 16,
    confirmedFraud: 4,
    detectedFraud: 3,
    missedFraud: 1,
    falseAlarms: 13,
    detectionRate: 75,
    falsePositiveRate: 11.0,
    precision: 18.8,
    avgRiskScore: 69.8,
    fraudPreventedValue: 2400,
    dailySavings: 1950,
    insight:
      'Missed 1 fraud case - new pattern: local guest with stolen card. Added to training data.',
  },
  {
    date: '2024-10-23',
    day: 'Wed',
    totalBookings: 105,
    flaggedBookings: 14,
    confirmedFraud: 2,
    detectedFraud: 2,
    missedFraud: 0,
    falseAlarms: 12,
    detectionRate: 100,
    falsePositiveRate: 11.4,
    precision: 14.3,
    avgRiskScore: 68.2,
    fraudPreventedValue: 1600,
    dailySavings: 1300,
    insight: 'Low fraud day. Model confidence improved to 88% after last week retraining.',
  },
  {
    date: '2024-10-22',
    day: 'Tue',
    totalBookings: 122,
    flaggedBookings: 21,
    confirmedFraud: 5,
    detectedFraud: 4,
    missedFraud: 1,
    falseAlarms: 17,
    detectionRate: 80,
    falsePositiveRate: 13.9,
    precision: 19.0,
    avgRiskScore: 74.1,
    fraudPreventedValue: 3200,
    dailySavings: 2750,
    insight:
      'High fraud day - convention in town. 80% detection rate, 1 missed (local prepaid card).',
  },
  {
    date: '2024-10-21',
    day: 'Mon',
    totalBookings: 98,
    flaggedBookings: 12,
    confirmedFraud: 2,
    detectedFraud: 2,
    missedFraud: 0,
    falseAlarms: 10,
    detectionRate: 100,
    falsePositiveRate: 10.2,
    precision: 16.7,
    avgRiskScore: 67.5,
    fraudPreventedValue: 1600,
    dailySavings: 1250,
    insight: 'Excellent detection. False positive rate down to 10.2% (improving).',
  },
  {
    date: '2024-10-20',
    day: 'Sun',
    totalBookings: 115,
    flaggedBookings: 17,
    confirmedFraud: 3,
    detectedFraud: 2,
    missedFraud: 1,
    falseAlarms: 15,
    detectionRate: 67,
    falsePositiveRate: 13.0,
    precision: 11.8,
    avgRiskScore: 71.3,
    fraudPreventedValue: 1600,
    dailySavings: 1200,
    insight:
      'Missed 1 fraud - new pattern: business traveler with multiple failed payments. Pattern added.',
  },
  {
    date: '2024-10-19',
    day: 'Sat',
    totalBookings: 130,
    flaggedBookings: 22,
    confirmedFraud: 5,
    detectedFraud: 4,
    missedFraud: 1,
    falseAlarms: 18,
    detectionRate: 80,
    falsePositiveRate: 13.8,
    precision: 18.2,
    avgRiskScore: 73.8,
    fraudPreventedValue: 3200,
    dailySavings: 2800,
    insight: 'Weekend surge - party bookings increased. 4 of 5 fraud cases detected.',
  },
];

const WEEKLY_INSIGHTS = [
  'Detection rate improved from 78% to 85% after retraining with new fraud patterns',
  'False positive rate decreased from 18% to 12% - more precise targeting',
  'New fraud pattern detected: Last-minute bookings (>$2,000) with prepaid cards',
  'Party risk pattern refined: Guest-to-room ratio >4 on weekends now flagged',
  'International first-time bookings (<24h) now require extra verification',
  'Model accuracy increased from 82% to 88% with weekly retraining',
];

// ============================================================================
// Component
// ============================================================================

export default function FraudDetectionDemo() {
  const [activeView, setActiveView] = useState<'pending' | 'performance' | 'historical'>(
    'pending'
  );
  const [selectedBooking, setSelectedBooking] = useState<PendingReview | null>(null);

  // Calculate weekly totals for performance view
  const weeklyTotals = {
    totalBookings: HISTORICAL_DATA.reduce((sum, d) => sum + d.totalBookings, 0),
    flaggedBookings: HISTORICAL_DATA.reduce((sum, d) => sum + d.flaggedBookings, 0),
    confirmedFraud: HISTORICAL_DATA.reduce((sum, d) => sum + d.confirmedFraud, 0),
    detectedFraud: HISTORICAL_DATA.reduce((sum, d) => sum + d.detectedFraud, 0),
    missedFraud: HISTORICAL_DATA.reduce((sum, d) => sum + d.missedFraud, 0),
    fraudPreventedValue: HISTORICAL_DATA.reduce((sum, d) => sum + d.fraudPreventedValue, 0),
    weeklySavings: HISTORICAL_DATA.reduce((sum, d) => sum + d.dailySavings, 0),
    avgDetectionRate:
      HISTORICAL_DATA.reduce((sum, d) => sum + d.detectionRate, 0) / HISTORICAL_DATA.length,
    avgFalsePositiveRate:
      HISTORICAL_DATA.reduce((sum, d) => sum + d.falsePositiveRate, 0) / HISTORICAL_DATA.length,
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'critical':
        return '🛑';
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      default:
        return '✅';
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'decline':
        return 'Manual review required - likely fraud';
      case 'require_id':
        return 'Require ID + credit card verification';
      case 'require_deposit':
        return 'Request 20-30% deposit before approval';
      case 'approve':
        return 'Accept with standard monitoring';
      default:
        return rec;
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'decline':
        return 'text-red-600 dark:text-red-400';
      case 'require_id':
        return 'text-orange-600 dark:text-orange-400';
      case 'require_deposit':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'approve':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos/ml"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🛑 Fraud Detection
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
            XGBoost-powered booking fraud prevention system
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
              85% Detection Rate
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
              12% False Positives
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
              &lt;80ms Inference
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full">
              CPU-Only
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs
          activeView={activeView}
          onViewChange={setActiveView as (view: string) => void}
          tabs={[
            { id: 'pending', label: 'Pending Reviews', icon: '📋' },
            { id: 'performance', label: 'Performance', icon: '📊' },
            { id: 'historical', label: 'Historical', icon: '📈' },
          ]}
        />

        {/* View Content */}
        <div className="mt-6">
          {/* VIEW 1: Pending Reviews */}
          {activeView === 'pending' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pending Queue */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    High-Risk Bookings
                  </h2>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-semibold">
                    {PENDING_REVIEWS.length} Pending
                  </span>
                </div>

                <div className="space-y-3">
                  {PENDING_REVIEWS.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedBooking?.id === booking.id
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : `${getRiskColor(booking.riskLevel)} border-2 hover:shadow-md`
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getRiskEmoji(booking.riskLevel)}</span>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {booking.guestName}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {booking.bookingReference}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {booking.riskScore}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            Risk Score
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          {booking.bookingDetails.rooms} room
                          {booking.bookingDetails.rooms > 1 ? 's' : ''} •{' '}
                          {booking.bookingDetails.nights} night
                          {booking.bookingDetails.nights > 1 ? 's' : ''} • $
                          {booking.bookingDetails.totalValue}
                        </span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {booking.hoursUntilCheckIn}h until check-in
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                {selectedBooking ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Booking Analysis
                      </h2>
                      <div className="text-slate-600 dark:text-slate-400">
                        {selectedBooking.bookingReference}
                      </div>
                    </div>

                    {/* Risk Score */}
                    <div className="text-center p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="text-6xl mb-2">{getRiskEmoji(selectedBooking.riskLevel)}</div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                        {selectedBooking.riskScore}/100
                      </div>
                      <div className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">
                        {selectedBooking.riskLevel} Risk
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Booking Details
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Guest:</span>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {selectedBooking.guestName}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Value:</span>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            ${selectedBooking.bookingDetails.totalValue}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Rooms:</span>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {selectedBooking.bookingDetails.rooms} (
                            {selectedBooking.bookingDetails.guests} guests)
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Nights:</span>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {selectedBooking.bookingDetails.nights}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Payment:</span>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {selectedBooking.bookingDetails.paymentMethod}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600 dark:text-slate-400">Check-in:</span>
                          <div className="font-semibold text-orange-600 dark:text-orange-400">
                            {selectedBooking.hoursUntilCheckIn}h
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {selectedBooking.bookingDetails.isInternational && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                            International
                          </span>
                        )}
                        {selectedBooking.bookingDetails.isFirstTime && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs">
                            First-Time Guest
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Risk Factors */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Risk Factors
                      </h3>
                      <div className="space-y-2">
                        {selectedBooking.riskFactors.map((factor, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                {factor.factor}
                              </span>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {(factor.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {factor.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Similar Cases */}
                    {selectedBooking.similarFraudCases > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="font-semibold text-red-800 dark:text-red-300 mb-1">
                          ⚠️ {selectedBooking.similarFraudCases} Similar Fraud Cases Found
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-400">
                          This booking pattern matches {selectedBooking.similarFraudCases} past
                          fraud incidents
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Recommended Action
                      </h3>
                      <div
                        className={`p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg ${getRecommendationColor(selectedBooking.recommendation)}`}
                      >
                        <div className="font-semibold mb-1">
                          {getRecommendationText(selectedBooking.recommendation)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button className="py-2 px-4 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 font-semibold">
                        ✓ Approve
                      </button>
                      <button className="py-2 px-4 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-semibold">
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p>Select a booking from the queue to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: Performance Metrics */}
          {activeView === 'performance' && (
            <div className="space-y-6">
              {/* ROI Card */}
              <ROICard
                monthlyROI={1200}
                annualROI={14400}
                description="Conservative estimate: 2 fraud incidents prevented per month at $800 each"
              />

              {/* Before/After Metrics */}
              <ROIMetrics
                title="Fraud Detection Performance"
                before={{
                  label: 'Manual Review Only',
                  metrics: [
                    { label: 'Fraud Detection Rate', value: '40%', subtext: '10 of 24 detected' },
                    { label: 'Monthly Fraud Losses', value: '$11,200', subtext: '14 undetected' },
                    {
                      label: 'Review Coverage',
                      value: '5%',
                      subtext: '50 of 800 bookings reviewed',
                    },
                    { label: 'False Positives', value: 'N/A', subtext: 'Manual judgment' },
                  ],
                }}
                after={{
                  label: 'XGBoost + Manual Review',
                  metrics: [
                    { label: 'Fraud Detection Rate', value: '85%', subtext: '20 of 24 detected' },
                    { label: 'Monthly Fraud Losses', value: '$3,200', subtext: '4 undetected' },
                    {
                      label: 'Review Coverage',
                      value: '15%',
                      subtext: '120 of 800 bookings flagged',
                    },
                    {
                      label: 'False Positive Rate',
                      value: '12%',
                      subtext: '96 false alarms/month',
                    },
                  ],
                }}
                improvement="+113%"
                improvementLabel="Detection Rate Improvement"
              />

              {/* Weekly Performance Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Weekly Performance Summary (Last 7 Days)
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {weeklyTotals.totalBookings}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">Total Bookings</div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                      {weeklyTotals.flaggedBookings}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-400">
                      High-Risk Flagged (15%)
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-900 dark:text-red-300">
                      {weeklyTotals.confirmedFraud}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-400">
                      Confirmed Fraud Cases
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {weeklyTotals.detectedFraud}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      Fraud Detected (85%)
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Detection Rate
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {weeklyTotals.avgDetectionRate.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      False Positive Rate
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {weeklyTotals.avgFalsePositiveRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Fraud Prevented
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      ${TableFormatters.formatNumber(weeklyTotals.fraudPreventedValue)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Cost Analysis
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Monthly Costs
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          XGBoost Infrastructure (CPU):
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">$100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Data Storage:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Model Retraining:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">$30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Staff Review Time:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">$300</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Total Costs:
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">$450</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Monthly Benefits
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Fraud Prevented:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">$1,600</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Chargeback Reduction:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">$500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Damage Prevention:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">$1,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Staff Efficiency:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">$200</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Total Benefits:
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          $3,300
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Net Monthly ROI:
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      $1,200
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Conservative estimate (realistic: $2,850/month)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Historical Performance */}
          {activeView === 'historical' && (
            <div className="space-y-6">
              {/* Historical Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    7-Day Performance History
                  </h3>
                </div>
                <HistoricalTable
                  data={HISTORICAL_DATA}
                  columns={[
                    { key: 'date', label: 'Date', format: TableFormatters.formatDate },
                    {
                      key: 'totalBookings',
                      label: 'Bookings',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'flaggedBookings',
                      label: 'Flagged',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'confirmedFraud',
                      label: 'Fraud',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'detectedFraud',
                      label: 'Detected',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'missedFraud',
                      label: 'Missed',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'detectionRate',
                      label: 'Detection',
                      format: TableFormatters.formatPercent,
                    },
                    {
                      key: 'falsePositiveRate',
                      label: 'False Pos',
                      format: TableFormatters.formatPercent,
                    },
                    {
                      key: 'dailySavings',
                      label: 'Savings',
                      format: TableFormatters.formatCurrency,
                    },
                  ]}
                />
              </div>

              {/* Weekly Insights */}
              <InsightsBox title="System Learning Insights" insights={WEEKLY_INSIGHTS} />

              {/* Trend Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Weekly Trends
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Improving Metrics
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📈</span>
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            Detection Rate: 78% → 85%
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            +7% improvement this week
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📉</span>
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            False Positives: 18% → 12%
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            -6% reduction this week
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            Model Accuracy: 82% → 88%
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Weekly retraining effect
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      New Patterns Detected
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          Last-Minute High-Value Pattern
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Bookings &gt;$2,000 within 24h now flagged
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          Weekend Party Pattern
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Guest-to-room ratio &gt;4 on Fri/Sat
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          International First-Timer
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          International + first-time + &lt;24h
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
