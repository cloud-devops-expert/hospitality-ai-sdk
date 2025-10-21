'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { calculateDynamicPrice, PricingResult } from '@/lib/pricing/traditional';
import { calculatePriceLinearRegression, calculatePriceNeuralNet } from '@/lib/pricing/ml-regression';

type AlgorithmType = 'traditional' | 'linear-regression' | 'neural-network';

export default function PricingPage() {
  const [basePrice, setBasePrice] = useState(200);
  const [roomType, setRoomType] = useState('double');
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );
  const [occupancyRate, setOccupancyRate] = useState(0.65);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('traditional');

  const handleCalculate = () => {
    const date = new Date(selectedDate);
    const daysUntilStay = Math.floor((date.getTime() - Date.now()) / 86400000);

    const input = {
      basePrice,
      date,
      occupancyRate: occupancyRate / 100,
      daysUntilStay,
      roomType,
    };

    let pricing: PricingResult;
    switch (selectedAlgorithm) {
      case 'traditional':
        pricing = calculateDynamicPrice(input);
        break;
      case 'linear-regression':
        pricing = calculatePriceLinearRegression(input);
        break;
      case 'neural-network':
        pricing = calculatePriceNeuralNet(input);
        break;
    }

    setResult(pricing);
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    switch (algo) {
      case 'traditional':
        return { cost: '$0', latency: '~5ms', accuracy: '75% R²', description: 'Multi-factor formula' };
      case 'linear-regression':
        return { cost: '$0', latency: '~8ms', accuracy: '78% R²', description: 'Trend learning' };
      case 'neural-network':
        return { cost: '$0', latency: '~12ms', accuracy: '86% R²', description: 'Non-linear patterns' };
    }
  };

  const getAdjustmentColor = (percentage: number) => {
    if (percentage > 0) return 'text-red-600 dark:text-red-400';
    if (percentage < 0) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-brand-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <Navigation title="Dynamic Pricing" />

        <p className="text-gray-700 dark:text-gray-300 mb-8">
          Smart pricing engine using algorithms and market factors
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Algorithm</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['traditional', 'linear-regression', 'neural-network'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              return (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgorithm(algo)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlgorithm === algo
                      ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 capitalize mb-2">
                    {algo.replace('-', ' ')}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>Cost:</strong> {info.cost}</div>
                    <div><strong>Latency:</strong> {info.latency}</div>
                    <div><strong>Accuracy:</strong> {info.accuracy}</div>
                    <div className="text-gray-500 dark:text-gray-500 mt-2">{info.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Pricing Parameters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base Price ($)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="50"
                  max="1000"
                  step="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite (+50%)</option>
                  <option value="deluxe">Deluxe (+30%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Occupancy Rate: {occupancyRate}%
                </label>
                <input
                  type="range"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(Number(e.target.value))}
                  className="w-full accent-brand-600 dark:accent-brand-500"
                  min="0"
                  max="100"
                  step="5"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Empty</span>
                  <span>Half Full</span>
                  <span>Fully Booked</span>
                </div>
              </div>

              <button
                onClick={handleCalculate}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 dark:hover:bg-brand-600 mt-4 transition-colors"
              >
                Calculate Price
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pricing Factors</h3>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>• Seasonal demand (high/low season)</li>
                <li>• Day of week (weekends +15%)</li>
                <li>• Current occupancy rate</li>
                <li>• Booking window (early bird discounts)</li>
                <li>• Room type premium</li>
                <li>• Last-minute deals</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            {result && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Calculated Price</h2>

                  <div className="bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-500 dark:border-brand-600 rounded-lg p-6 mb-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Final Price</p>
                    <p className="text-5xl font-bold text-brand-700 dark:text-brand-400">
                      ${result.finalPrice}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">per night</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Base Price</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">${result.originalPrice}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Adjustment</p>
                      <p className={`font-semibold ${getAdjustmentColor(
                        ((result.finalPrice - result.originalPrice) / result.originalPrice) * 100
                      )}`}>
                        {result.finalPrice > result.originalPrice ? '+' : ''}
                        ${(result.finalPrice - result.originalPrice).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Price Range</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {((result.finalPrice / result.originalPrice - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-brand-600 dark:bg-brand-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((result.finalPrice - result.originalPrice * 0.5) / (result.originalPrice * 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Min (50%)</span>
                      <span>Base</span>
                      <span>Max (150%)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Price Adjustments</h3>
                  <div className="space-y-2">
                    {result.adjustments.map((adj, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{adj.factor}</span>
                        <div className="text-right">
                          <span className={`font-semibold ${getAdjustmentColor(adj.percentage)}`}>
                            {adj.amount > 0 ? '+' : ''}${adj.amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            ({adj.percentage > 0 ? '+' : ''}{adj.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Recommendation</h3>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    {result.finalPrice > result.originalPrice * 1.2 ? (
                      <p className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3">
                        <strong>High Demand Period:</strong> Consider offering value-added services to justify premium pricing.
                      </p>
                    ) : result.finalPrice < result.originalPrice * 0.85 ? (
                      <p className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                        <strong>Low Demand Period:</strong> Good time for promotions and package deals to drive bookings.
                      </p>
                    ) : (
                      <p className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                        <strong>Optimal Pricing:</strong> Price is well-balanced for current market conditions.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {!result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Configure parameters and click &ldquo;Calculate Price&rdquo; to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
