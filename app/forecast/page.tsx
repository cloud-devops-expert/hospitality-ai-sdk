'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { forecastRange, DataPoint, ForecastResult, detectSeasonality } from '@/lib/forecast/statistical';

function generateSampleData(): DataPoint[] {
  const data: DataPoint[] = [];
  const today = new Date();
  const baseOccupancy = 65;

  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const month = date.getMonth();

    // Weekend boost
    let value = baseOccupancy;
    if (dayOfWeek === 5 || dayOfWeek === 6) value += 15;

    // Seasonal variation
    if ([5, 6, 7, 11].includes(month)) value += 10; // Summer/December
    if ([0, 1, 2].includes(month)) value -= 10; // Winter

    // Random variation
    value += (Math.random() - 0.5) * 8;

    data.push({
      date,
      value: Math.max(0, Math.min(100, value))
    });
  }

  return data;
}

export default function ForecastPage() {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);
  const [forecastDays, setForecastDays] = useState(14);
  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  const [seasonality, setSeasonality] = useState<ReturnType<typeof detectSeasonality> | null>(null);

  useEffect(() => {
    const data = generateSampleData();
    setHistoricalData(data);
    const season = detectSeasonality(data);
    setSeasonality(season);
  }, []);

  const handleForecast = () => {
    const results = forecastRange(historicalData, forecastDays);
    setForecasts(results);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600 bg-green-100';
      case 'decreasing': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      default: return '→';
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-orange-600 hover:text-orange-800 mb-4 inline-block">
          ← Back to Home
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Demand Forecast</h1>
          <p className="text-gray-600">
            Predict occupancy using statistical time-series analysis
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Historical Data Points</p>
            <p className="text-3xl font-bold text-gray-900">{historicalData.length}</p>
            <p className="text-xs text-gray-500 mt-1">Last 60 days</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Current Trend</p>
            <div className="flex items-center">
              {forecasts.length > 0 && (
                <span className={`text-2xl font-bold px-3 py-1 rounded ${getTrendColor(forecasts[0].trend)}`}>
                  {getTrendIcon(forecasts[0].trend)} {forecasts[0].trend}
                </span>
              )}
              {forecasts.length === 0 && (
                <span className="text-gray-400">Run forecast</span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Seasonality Detected</p>
            <p className="text-3xl font-bold text-gray-900">
              {seasonality?.hasSeasonality ? 'Yes' : 'No'}
            </p>
            {seasonality?.hasSeasonality && (
              <p className="text-xs text-gray-500 mt-1">7-day pattern</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Forecast Settings</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Period: {forecastDays} days
              </label>
              <input
                type="range"
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="w-full"
                min="7"
                max="30"
                step="1"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 week</span>
                <span>2 weeks</span>
                <span>1 month</span>
              </div>
            </div>

            <button
              onClick={handleForecast}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
            >
              Generate Forecast
            </button>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Historical Occupancy (Last 7 Days)</h3>
              <div className="space-y-2">
                {historicalData.slice(-7).map((dp, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {dp.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${dp.value}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-12 text-right">
                        {dp.value.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {seasonality?.hasSeasonality && seasonality.pattern && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Pattern</h3>
                <div className="space-y-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <div key={day} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 w-8">{day}</span>
                      <div className="flex-1 mx-2 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${((seasonality.pattern![idx] || 0) / Math.max(...seasonality.pattern!)) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-700 w-8 text-right">
                        {(seasonality.pattern![idx] || 0).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {forecasts.length > 0 ? (
              <>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">Forecast Results</h2>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Average Predicted</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {(forecasts.reduce((sum, f) => sum + f.predicted, 0) / forecasts.length).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Avg Confidence</p>
                        <p className="text-2xl font-bold text-orange-700">
                          {(forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {forecasts.map((forecast, idx) => (
                      <div key={idx} className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {forecast.date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-600">
                              {idx + 1} day{idx !== 0 ? 's' : ''} ahead
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-orange-600">
                              {forecast.predicted.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {(forecast.confidence * 100).toFixed(0)}% confidence
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, forecast.predicted)}%` }}
                            />
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${getTrendColor(forecast.trend)}`}>
                            {getTrendIcon(forecast.trend)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-3">Insights</h3>
                  <ul className="space-y-2 text-sm">
                    {forecasts[0].trend === 'increasing' && (
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>Demand is trending upward. Consider adjusting prices higher.</span>
                      </li>
                    )}
                    {forecasts[0].trend === 'decreasing' && (
                      <li className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span>Demand is declining. Consider promotional campaigns.</span>
                      </li>
                    )}
                    {seasonality?.hasSeasonality && (
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Weekly pattern detected. Optimize staffing accordingly.</span>
                      </li>
                    )}
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
                      <span>
                        Based on {historicalData.length} days of historical data using statistical methods.
                      </span>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                <p className="mb-4">No forecast generated yet</p>
                <p className="text-sm">Click &ldquo;Generate Forecast&rdquo; to predict future occupancy</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Methods Used</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-purple-700 mb-1">Moving Average</p>
              <p className="text-gray-600">Simple average of recent values for baseline prediction</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700 mb-1">Exponential Smoothing</p>
              <p className="text-gray-600">Weight recent data more heavily for responsive forecasts</p>
            </div>
            <div>
              <p className="font-semibold text-purple-700 mb-1">Trend Analysis</p>
              <p className="text-gray-600">Linear regression to identify upward/downward trends</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
