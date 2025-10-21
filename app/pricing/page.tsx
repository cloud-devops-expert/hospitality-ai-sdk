'use client';

import { useState } from 'react';
import Link from 'next/link';
import { calculateDynamicPrice, PricingResult } from '@/lib/pricing/traditional';

export default function PricingPage() {
  const [basePrice, setBasePrice] = useState(200);
  const [roomType, setRoomType] = useState('double');
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );
  const [occupancyRate, setOccupancyRate] = useState(0.65);
  const [result, setResult] = useState<PricingResult | null>(null);

  const handleCalculate = () => {
    const date = new Date(selectedDate);
    const daysUntilStay = Math.floor((date.getTime() - Date.now()) / 86400000);

    const pricing = calculateDynamicPrice({
      basePrice,
      date,
      occupancyRate: occupancyRate / 100,
      daysUntilStay,
      roomType,
    });

    setResult(pricing);
  };

  const getAdjustmentColor = (percentage: number) => {
    if (percentage > 0) return 'text-red-600';
    if (percentage < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-purple-600 hover:text-purple-800 mb-4 inline-block">
          ← Back to Home
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Dynamic Pricing</h1>
          <p className="text-gray-600">
            Smart pricing engine using traditional algorithms and market factors
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Pricing Parameters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price ($)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="50"
                  max="1000"
                  step="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite (+50%)</option>
                  <option value="deluxe">Deluxe (+30%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Occupancy Rate: {occupancyRate}%
                </label>
                <input
                  type="range"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="100"
                  step="5"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Empty</span>
                  <span>Half Full</span>
                  <span>Fully Booked</span>
                </div>
              </div>

              <button
                onClick={handleCalculate}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 mt-4"
              >
                Calculate Price
              </button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Pricing Factors</h3>
              <ul className="space-y-1 text-xs text-gray-600">
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
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Calculated Price</h2>

                  <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-6 mb-4 text-center">
                    <p className="text-sm text-gray-600 mb-1">Final Price</p>
                    <p className="text-5xl font-bold text-purple-700">
                      ${result.finalPrice}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">per night</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Base Price</p>
                      <p className="font-semibold">${result.originalPrice}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Total Adjustment</p>
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
                      <p className="text-xs text-gray-600">Price Range</p>
                      <p className="text-xs text-gray-600">
                        {((result.finalPrice / result.originalPrice - 1) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((result.finalPrice - result.originalPrice * 0.5) / (result.originalPrice * 1)) * 100))}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Min (50%)</span>
                      <span>Base</span>
                      <span>Max (150%)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-3">Price Adjustments</h3>
                  <div className="space-y-2">
                    {result.adjustments.map((adj, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{adj.factor}</span>
                        <div className="text-right">
                          <span className={`font-semibold ${getAdjustmentColor(adj.percentage)}`}>
                            {adj.amount > 0 ? '+' : ''}${adj.amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({adj.percentage > 0 ? '+' : ''}{adj.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-3">Recommendation</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    {result.finalPrice > result.originalPrice * 1.2 ? (
                      <p className="bg-orange-50 border border-orange-200 rounded p-3">
                        <strong>High Demand Period:</strong> Consider offering value-added services to justify premium pricing.
                      </p>
                    ) : result.finalPrice < result.originalPrice * 0.85 ? (
                      <p className="bg-blue-50 border border-blue-200 rounded p-3">
                        <strong>Low Demand Period:</strong> Good time for promotions and package deals to drive bookings.
                      </p>
                    ) : (
                      <p className="bg-green-50 border border-green-200 rounded p-3">
                        <strong>Optimal Pricing:</strong> Price is well-balanced for current market conditions.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {!result && (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                <p>Configure parameters and click &ldquo;Calculate Price&rdquo; to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
