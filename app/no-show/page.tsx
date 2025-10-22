'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Booking, NoShowPrediction } from '@/lib/no-show/types';
import { predictNoShowRuleBased } from '@/lib/no-show/traditional';
import {
  predictNoShowLogisticRegression,
  predictNoShowGradientBoosting,
  NO_SHOW_MODELS,
} from '@/lib/no-show/ml';

type AlgorithmType = 'rule-based' | 'logistic-regression' | 'gradient-boosting';

export default function NoShowPage() {
  const [guestName, setGuestName] = useState('John Doe');
  const [channel, setChannel] = useState<Booking['bookingChannel']>('ota');
  const [leadTime, setLeadTime] = useState(7);
  const [payment, setPayment] = useState<Booking['paymentMethod']>('pay-at-property');
  const [hasRequests, setHasRequests] = useState(false);
  const [totalStays, setTotalStays] = useState(0);
  const [noShows, setNoShows] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('rule-based');
  const [result, setResult] = useState<NoShowPrediction | null>(null);

  const handlePredict = () => {
    const booking: Booking = {
      id: 'booking-1',
      guestName,
      checkInDate: new Date(),
      checkOutDate: new Date(Date.now() + 86400000 * 2),
      roomType: 'double',
      bookingChannel: channel,
      leadTimeDays: leadTime,
      totalAmount: 300,
      paymentMethod: payment,
      hasSpecialRequests: hasRequests,
      guestHistory:
        totalStays > 0
          ? {
              totalStays,
              noShowCount: noShows,
              cancellationCount: 0,
            }
          : undefined,
    };

    let prediction: NoShowPrediction;
    switch (selectedAlgorithm) {
      case 'rule-based':
        prediction = predictNoShowRuleBased(booking);
        break;
      case 'logistic-regression':
        prediction = predictNoShowLogisticRegression(booking);
        break;
      case 'gradient-boosting':
        prediction = predictNoShowGradientBoosting(booking);
        break;
    }
    setResult(prediction);
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    return NO_SHOW_MODELS[algo];
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <Navigation title="No-Show Prediction" />

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Predict booking no-show risk to optimize overbooking and revenue
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            How It Works
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
            <p>
              <strong>3 Prediction Methods:</strong> Rule-Based (74% accuracy), Logistic Regression (79% accuracy), Gradient Boosting (82% accuracy)
            </p>
            <p>
              <strong>Rule-Based:</strong> Risk scoring based on booking channel (OTA +20 risk), payment method (pay-later +30), lead time (&gt;30 days +15), and guest history (no-show rate × 50)
            </p>
            <p>
              <strong>Risk Factors:</strong> OTA bookings, long lead times, no prepayment, no special requests, first-time guests, and previous no-show history
            </p>
            <p>
              <strong>Logistic Regression:</strong> Binary classification model learning optimal weights for each risk factor from historical data (79% accuracy)
            </p>
            <p>
              <strong>Gradient Boosting:</strong> Ensemble of decision trees capturing complex interactions between features - highest accuracy at 82%
            </p>
            <p>
              <strong>Risk Classification:</strong> Low (&lt;20%), Medium (20-50%), High (&gt;50%) with recommended actions for each level
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              <strong>Performance:</strong> Rule-Based: 5ms | Logistic: 8ms | Gradient: 12ms | Zero cost | Enables smart overbooking strategy
            </p>
          </div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Select Algorithm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['rule-based', 'logistic-regression', 'gradient-boosting'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              return (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgorithm(algo)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlgorithm === algo
                      ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize">
                    {info.name}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Cost:</strong> ${info.cost}
                    </div>
                    <div>
                      <strong>Latency:</strong> ~{info.avgLatency}ms
                    </div>
                    <div>
                      <strong>Accuracy:</strong> {(info.accuracy * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-500 mt-2">{info.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Booking Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Booking Channel
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Booking['bookingChannel'])}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="direct">Direct</option>
                  <option value="ota">OTA</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Lead Time: {leadTime} days
                </label>
                <input
                  type="range"
                  value={leadTime}
                  onChange={(e) => setLeadTime(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Payment Method
                </label>
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value as Booking['paymentMethod'])}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="prepaid">Prepaid</option>
                  <option value="pay-at-property">Pay at Property</option>
                  <option value="corporate-billing">Corporate Billing</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasRequests}
                    onChange={(e) => setHasRequests(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Has Special Requests
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Guest History (optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Total Stays"
                    value={totalStays}
                    onChange={(e) => setTotalStays(Number(e.target.value))}
                    className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <input
                    type="number"
                    placeholder="No-Shows"
                    value={noShows}
                    onChange={(e) => setNoShows(Number(e.target.value))}
                    className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <button
                onClick={handlePredict}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 mt-4"
              >
                Predict No-Show Risk
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Prediction Results
                </h2>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Level</p>
                  <p
                    className={`text-3xl font-bold px-3 py-2 rounded inline-block ${getRiskColor(result.riskLevel)}`}
                  >
                    {result.riskLevel.toUpperCase()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Probability</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {(result.probability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {(result.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Reasons
                  </p>
                  <ul className="space-y-1">
                    {result.reasons.map((reason, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 dark:text-gray-300 flex items-start"
                      >
                        <span className="text-brand-600 dark:text-brand-400 mr-2">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Recommended Actions
                  </p>
                  <ul className="space-y-1">
                    {result.recommendedActions.map((action, idx) => (
                      <li
                        key={idx}
                        className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-gray-700 dark:text-gray-300"
                      >
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
                <p>
                  Enter booking details and click &ldquo;Predict No-Show Risk&rdquo; to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
