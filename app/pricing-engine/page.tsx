'use client';

import { useState, useEffect } from 'react';
import { calculateDynamicPrice } from '@/lib/pricing/dynamic';
import { forecastHybrid } from '@/lib/forecast/hybrid';

interface PriceRecommendation {
  date: Date;
  baseRate: number;
  suggestedPrice: number;
  confidence: number;
  factors: {
    occupancy: number;
    dayOfWeek: string;
    seasonal: number;
    demand: string;
  };
  reasoning: string[];
  potentialRevenue: number;
}

export default function PricingEnginePage() {
  const [recommendations, setRecommendations] = useState<PriceRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [baseRate, setBasePrice] = useState(150);
  const [selectedDate, setSelectedDate] = useState<PriceRecommendation | null>(
    null
  );
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, [baseRate]);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      // Get occupancy forecast
      const historicalData = generateSyntheticHistory(30);
      const forecasts = await forecastHybrid(historicalData, 14);

      // Generate pricing recommendations for next 14 days
      const recs: PriceRecommendation[] = [];
      const now = new Date();

      for (let i = 0; i < 14; i++) {
        const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const forecast = forecasts[i];
        const occupancy = forecast?.predicted || 60 + Math.random() * 30;

        const pricing = calculateDynamicPrice({
          baseRate,
          occupancyRate: occupancy / 100,
          daysUntilArrival: i,
          seasonalMultiplier: 1 + Math.sin(i / 7) * 0.2,
          dayOfWeek: date.getDay(),
        });

        const dayNames = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];

        const reasoning = [];
        if (occupancy > 80) {
          reasoning.push(`High demand (${Math.round(occupancy)}% occupancy)`);
        }
        if (date.getDay() === 5 || date.getDay() === 6) {
          reasoning.push('Weekend premium applied');
        }
        if (pricing.suggestedPrice > baseRate) {
          reasoning.push(
            `${Math.round(((pricing.suggestedPrice - baseRate) / baseRate) * 100)}% increase recommended`
          );
        } else if (pricing.suggestedPrice < baseRate) {
          reasoning.push(
            `${Math.round(((baseRate - pricing.suggestedPrice) / baseRate) * 100)}% discount to boost occupancy`
          );
        }
        if (i < 3) {
          reasoning.push('Last-minute booking window');
        }

        recs.push({
          date,
          baseRate,
          suggestedPrice: pricing.suggestedPrice,
          confidence: pricing.confidence,
          factors: {
            occupancy,
            dayOfWeek: dayNames[date.getDay()],
            seasonal: 1 + Math.sin(i / 7) * 0.2,
            demand: occupancy > 80 ? 'High' : occupancy > 60 ? 'Medium' : 'Low',
          },
          reasoning,
          potentialRevenue: pricing.suggestedPrice * 50, // Assuming 50 rooms
        });
      }

      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec: PriceRecommendation) => {
    const change = rec.suggestedPrice - rec.baseRate;
    if (change > 20) return 'bg-green-50 dark:bg-green-900/20 border-green-500';
    if (change < -20) return 'bg-red-50 dark:bg-red-900/20 border-red-500';
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500';
  };

  const getPriceChange = (rec: PriceRecommendation) => {
    const change = rec.suggestedPrice - rec.baseRate;
    const percent = (change / rec.baseRate) * 100;
    return {
      amount: change,
      percent,
      isIncrease: change > 0,
    };
  };

  const totalPotentialRevenue = recommendations.reduce(
    (sum, rec) => sum + rec.potentialRevenue,
    0
  );
  const currentRevenue = recommendations.reduce(
    (sum, rec) => sum + rec.baseRate * 50,
    0
  );
  const potentialGain = totalPotentialRevenue - currentRevenue;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing market conditions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            💰 Smart Pricing Engine
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            AI-powered dynamic pricing with explainable recommendations
          </p>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current Revenue (14 days)
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${currentRevenue.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Optimized Revenue
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${totalPotentialRevenue.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Potential Gain
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              +${Math.abs(potentialGain).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {((potentialGain / currentRevenue) * 100).toFixed(1)}% increase
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Room Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="80"
                  max="300"
                  value={baseRate}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100 w-16">
                  ${baseRate}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label
                htmlFor="autoApprove"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Auto-approve high confidence recommendations (&gt;85%)
              </label>
            </div>
            <button
              onClick={generateRecommendations}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
            >
              🔄 Refresh Recommendations
            </button>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, i) => {
            const change = getPriceChange(rec);
            return (
              <div
                key={i}
                onClick={() => setSelectedDate(rec)}
                className={`border-l-4 ${getRecommendationColor(rec)} rounded-r-lg p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all ${
                  selectedDate?.date === rec.date ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {rec.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {rec.factors.dayOfWeek}
                    </div>
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      rec.confidence > 0.85
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : rec.confidence > 0.7
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {Math.round(rec.confidence * 100)}% conf
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Recommended Price
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      ${rec.suggestedPrice.toFixed(0)}
                    </span>
                    <span className="text-sm line-through text-gray-500 dark:text-gray-400">
                      ${rec.baseRate}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      change.isIncrease ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {change.isIncrease ? '↑' : '↓'} $
                    {Math.abs(change.amount).toFixed(0)} ({change.percent.toFixed(0)}
                    %)
                  </div>
                </div>

                {/* Factors */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Demand
                    </span>
                    <span
                      className={`font-medium ${
                        rec.factors.demand === 'High'
                          ? 'text-green-600'
                          : rec.factors.demand === 'Medium'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {rec.factors.demand}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Occupancy
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {Math.round(rec.factors.occupancy)}%
                    </span>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {rec.reasoning.slice(0, 2).map((reason, j) => (
                    <div key={j} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Approved:', rec.date);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    ✓ Apply
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(rec);
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Modal */}
        {selectedDate && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDate(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Price Analysis
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedDate.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Price Comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Current Price
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    ${selectedDate.baseRate}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Recommended Price
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${selectedDate.suggestedPrice.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* All Factors */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Market Factors
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      Forecasted Occupancy
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedDate.factors.occupancy}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100 w-12">
                        {Math.round(selectedDate.factors.occupancy)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      Demand Level
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedDate.factors.demand}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      Day of Week
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedDate.factors.dayOfWeek}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      Confidence Score
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {Math.round(selectedDate.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  AI Reasoning
                </h3>
                <ul className="space-y-2">
                  {selectedDate.reasoning.map((reason, i) => (
                    <li
                      key={i}
                      className="flex items-start text-gray-700 dark:text-gray-300"
                    >
                      <span className="mr-2">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Revenue Impact */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Projected Revenue (50 rooms)
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${selectedDate.potentialRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  vs ${(selectedDate.baseRate * 50).toLocaleString()} at base
                  price
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    console.log('Applied:', selectedDate.date);
                    setSelectedDate(null);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Apply This Price
                </button>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function generateSyntheticHistory(days: number) {
  const data = [];
  const today = new Date();

  for (let i = days; i > 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const value = 60 + Math.random() * 30 + Math.sin(i / 7) * 10;
    data.push({ date, value });
  }

  return data;
}
