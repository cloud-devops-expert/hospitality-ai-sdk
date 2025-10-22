'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  CheckInBooking,
  CheckInPrediction,
  predictCheckInHistorical,
  CHECKIN_MODELS,
} from '@/lib/checkin/predictor';

type AlgorithmType = 'stated' | 'historical' | 'ml';

export default function CheckInPage() {
  const [guestType, setGuestType] = useState<CheckInBooking['guestType']>('business');
  const [bookingSource, setBookingSource] = useState<CheckInBooking['bookingSource']>('direct');
  const [distanceMiles, setDistanceMiles] = useState(30);
  const [statedTime, setStatedTime] = useState('15:00');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('historical');
  const [result, setResult] = useState<CheckInPrediction | null>(null);

  const handlePredict = () => {
    const booking: CheckInBooking = {
      id: 'booking-1',
      guestName: 'John Doe',
      guestType,
      bookingSource,
      distanceMiles,
      statedArrivalTime: new Date(`2024-01-01T${statedTime}`),
    };

    const prediction = predictCheckInHistorical(booking);
    setResult(prediction);
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    return CHECKIN_MODELS[algo];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <Navigation title="Check-in Time Prediction" />
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Predict actual guest check-in times to optimize front desk staffing
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Select Algorithm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['stated', 'historical', 'ml'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              const isAvailable = algo === 'historical' || algo === 'stated';
              return (
                <button
                  key={algo}
                  onClick={() => isAvailable && setSelectedAlgorithm(algo)}
                  disabled={!isAvailable}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlgorithm === algo
                      ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : isAvailable
                        ? 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                        : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {info.name}
                    {!isAvailable && (
                      <span className="ml-2 text-xs text-gray-500">(Coming Soon)</span>
                    )}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Accuracy:</strong> {(info.accuracy * 100).toFixed(0)}%
                    </div>
                    <div>
                      <strong>Cost:</strong> ${info.cost}
                    </div>
                    <div>
                      <strong>Latency:</strong> ~{info.avgLatency}ms
                    </div>
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
                  Guest Type
                </label>
                <select
                  value={guestType}
                  onChange={(e) => setGuestType(e.target.value as CheckInBooking['guestType'])}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="business">Business Traveler</option>
                  <option value="leisure">Leisure</option>
                  <option value="family">Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Booking Source
                </label>
                <select
                  value={bookingSource}
                  onChange={(e) =>
                    setBookingSource(e.target.value as CheckInBooking['bookingSource'])
                  }
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="direct">Direct Booking</option>
                  <option value="ota">OTA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Stated Arrival Time
                </label>
                <input
                  type="time"
                  value={statedTime}
                  onChange={(e) => setStatedTime(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Distance from Property: {distanceMiles} miles
                </label>
                <input
                  type="range"
                  value={distanceMiles}
                  onChange={(e) => setDistanceMiles(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="300"
                  step="5"
                />
              </div>

              <button
                onClick={handlePredict}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 mt-4"
              >
                Predict Check-in Time
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Prediction Results
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Predicted Check-in Time
                    </p>
                    <p className="text-5xl font-bold text-brand-600 dark:text-brand-400">
                      {formatTime(result.predictedTime)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Confidence Window
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
                      ± {result.confidenceWindow} hours
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Accuracy</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-brand-600 dark:bg-brand-500 h-3 rounded-full transition-all"
                          style={{ width: `${result.accuracy * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {(result.accuracy * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Method: {result.method.charAt(0).toUpperCase() + result.method.slice(1)}
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      {CHECKIN_MODELS[result.method].description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Configure booking details and click &ldquo;Predict Check-in Time&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
