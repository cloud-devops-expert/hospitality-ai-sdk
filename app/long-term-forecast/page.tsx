'use client';

import { useState } from 'react';
import {
  generateLongTermForecast,
  calculateInvestmentROI,
  type ForecastInput,
} from '@/lib/forecast/long-term';

export default function LongTermForecastPage() {
  const [forecast, setForecast] = useState<any>(null);
  const [roi, setRoi] = useState<any>(null);

  const runForecast = () => {
    const input: ForecastInput = {
      historical: [
        { period: '2023-Q1', value: 85000 },
        { period: '2023-Q2', value: 92000 },
        { period: '2023-Q3', value: 88000 },
        { period: '2023-Q4', value: 95000 },
        { period: '2024-Q1', value: 90000 },
        { period: '2024-Q2', value: 98000 },
      ],
      periods: 8,
      periodType: 'quarter',
      includeSeasonality: true,
    };

    const result = generateLongTermForecast(input);
    setForecast(result);

    const roiResult = calculateInvestmentROI(result, 50000);
    setRoi(roiResult);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          📈 Long-Term Forecasting
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Multi-year forecasting with ROI analysis
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <button
            onClick={runForecast}
            className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-lg"
          >
            📊 Generate 2-Year Forecast
          </button>
        </div>

        {forecast && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Trend</div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 capitalize">
                  {forecast.trend.direction}
                </div>
                <div className="text-sm mt-1">Strength: {forecast.trend.strength}/100</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Confidence</div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {forecast.confidence.overall}%
                </div>
                <div className="text-sm mt-1">Quality: {forecast.confidence.dataQuality}%</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Seasonality</div>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {forecast.seasonality.detected ? 'Yes' : 'No'}
                </div>
                {forecast.seasonality.detected && (
                  <div className="text-sm mt-1">Period: {forecast.seasonality.period}</div>
                )}
              </div>
            </div>

            {roi && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Investment ROI Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">NPV</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${roi.npv.toLocaleString()}
                    </div>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">IRR</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {roi.irr.toFixed(1)}%
                    </div>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payback</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {roi.paybackPeriod.toFixed(1)}y
                    </div>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Break-even</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      Q{roi.breakEvenPeriod}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Forecast Timeline
              </h2>
              <div className="space-y-2">
                {forecast.forecast.slice(0, 8).map((f: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="font-semibold">{f.period}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Best: ${f.bestCase.toLocaleString()}
                      </span>
                      <span className="font-bold">${f.forecast.toLocaleString()}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Worst: ${f.worstCase.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
