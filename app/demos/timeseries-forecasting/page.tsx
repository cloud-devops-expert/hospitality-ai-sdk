/**
 * Timeseries Forecasting Demo (TimesFM)
 *
 * Google's TimesFM foundation model for long-range strategic forecasting (14-30 days)
 * ROI: $2,000/month ($24,000/year) - Revenue optimization through accurate occupancy/revenue forecasts
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
// TYPES
// ============================================================================

interface Scenario {
  id: string;
  name: string;
  icon: string;
  unit: string;
  description: string;
}

interface ForecastResult {
  scenario: string;
  forecast: number[];
  confidenceLower: number[];
  confidenceUpper: number[];
  metrics: {
    mape: number;
    rmse: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  recommendations: string[];
  inferenceTime: number;
}

interface HistoricalAccuracy {
  month: string;
  scenario: string;
  forecastedAvg: number;
  actualAvg: number;
  mape: number;
  accuracy: number;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SCENARIOS: Scenario[] = [
  { id: 'occupancy', name: 'Hotel Occupancy', icon: '🏨', unit: '%', description: 'Long-range occupancy for revenue optimization' },
  { id: 'revenue', name: 'Revenue', icon: '💰', unit: '$', description: 'Monthly revenue projections for budgeting' },
  { id: 'demand', name: 'Restaurant Demand', icon: '🍽️', unit: 'covers', description: 'Bulk ordering and inventory planning' },
  { id: 'events', name: 'Event Attendance', icon: '🎉', unit: 'attendees', description: 'Capacity planning for conferences' },
];

const FORECAST_DATA: Record<string, Omit<ForecastResult, 'inferenceTime'>> = {
  occupancy: {
    scenario: 'Hotel Occupancy',
    forecast: [84, 87, 89, 92, 90, 88, 85, 83, 86, 89, 91, 94, 92, 89, 87, 85, 88, 90, 92, 95, 93, 91, 89, 87, 90, 92, 94, 96, 94, 92],
    confidenceLower: [80, 83, 85, 88, 86, 84, 81, 79, 82, 85, 87, 90, 88, 85, 83, 81, 84, 86, 88, 91, 89, 87, 85, 83, 86, 88, 90, 92, 90, 88],
    confidenceUpper: [88, 91, 93, 96, 94, 92, 89, 87, 90, 93, 95, 98, 96, 93, 91, 89, 92, 94, 96, 99, 97, 95, 93, 91, 94, 96, 98, 100, 98, 96],
    metrics: { mape: 3.2, rmse: 2.8, trend: 'increasing' },
    recommendations: [
      'High demand expected - implement dynamic pricing (+15-25%)',
      'Staff up housekeeping for weekend peaks (days 4-5, 11-12, 18-19, 25-26)',
      'Promote mid-week packages to smooth occupancy curve',
    ],
  },
  revenue: {
    scenario: 'Monthly Revenue',
    forecast: [185, 195, 205, 215, 210, 200, 190, 185, 198, 208, 218, 228, 220, 210, 200, 195, 205, 215, 225, 235, 230, 220, 210, 200, 210, 220, 230, 240, 235, 225],
    confidenceLower: [175, 185, 195, 205, 200, 190, 180, 175, 188, 198, 208, 218, 210, 200, 190, 185, 195, 205, 215, 225, 220, 210, 200, 190, 200, 210, 220, 230, 225, 215],
    confidenceUpper: [195, 205, 215, 225, 220, 210, 200, 195, 208, 218, 228, 238, 230, 220, 210, 205, 215, 225, 235, 245, 240, 230, 220, 210, 220, 230, 240, 250, 245, 235],
    metrics: { mape: 4.1, rmse: 8.5, trend: 'increasing' },
    recommendations: [
      'Revenue trending up - budget +12% for next quarter',
      'Invest in marketing for high-demand periods (days 10-15, 20-25)',
      'Negotiate better supplier terms with projected volume increase',
    ],
  },
  demand: {
    scenario: 'Restaurant Demand',
    forecast: [162, 178, 165, 202, 228, 245, 215, 170, 185, 172, 210, 238, 255, 225, 178, 192, 180, 218, 248, 265, 235, 188, 202, 190, 225, 255, 272, 242, 195, 210],
    confidenceLower: [154, 170, 157, 194, 220, 237, 207, 162, 177, 164, 202, 230, 247, 217, 170, 184, 172, 210, 240, 257, 227, 180, 194, 182, 217, 247, 264, 234, 187, 202],
    confidenceUpper: [170, 186, 173, 210, 236, 253, 223, 178, 193, 180, 218, 246, 263, 233, 186, 200, 188, 226, 256, 273, 243, 196, 210, 198, 233, 263, 280, 250, 203, 218],
    metrics: { mape: 4.5, rmse: 8.2, trend: 'increasing' },
    recommendations: [
      'Order 18% more ingredients for weekend peaks',
      'Schedule 3 additional servers for high-demand days (Fri-Sun)',
      'Consider prix fixe specials for low-demand mid-week days',
    ],
  },
  events: {
    scenario: 'Event Attendance',
    forecast: [395, 425, 455, 490, 475, 440, 410, 385, 420, 450, 480, 510, 495, 460, 430, 400, 435, 465, 495, 525, 510, 475, 445, 415, 450, 480, 510, 540, 525, 490],
    confidenceLower: [375, 405, 435, 470, 455, 420, 390, 365, 400, 430, 460, 490, 475, 440, 410, 380, 415, 445, 475, 505, 490, 455, 425, 395, 430, 460, 490, 520, 505, 470],
    confidenceUpper: [415, 445, 475, 510, 495, 460, 430, 405, 440, 470, 500, 530, 515, 480, 450, 420, 455, 485, 515, 545, 530, 495, 465, 435, 470, 500, 530, 560, 545, 510],
    metrics: { mape: 6.8, rmse: 18.5, trend: 'increasing' },
    recommendations: [
      'High turnout expected - expand venue capacity or limit registrations',
      'Order 22% more catering for peak days (days 10-12, 24-26)',
      'Arrange overflow parking and shuttle service for weekends',
    ],
  },
};

const ACCURACY_BY_SCENARIO = [
  { scenario: 'Occupancy', accuracy: 94, mape: 3.2, forecasts: 6 },
  { scenario: 'Revenue', accuracy: 92, mape: 4.1, forecasts: 6 },
  { scenario: 'Demand', accuracy: 90, mape: 5.3, forecasts: 6 },
  { scenario: 'Events', accuracy: 88, mape: 6.8, forecasts: 6 },
];

const LAST_6_MONTHS: HistoricalAccuracy[] = [
  { month: 'Apr 2024', scenario: 'Occupancy', forecastedAvg: 78, actualAvg: 76, mape: 2.6, accuracy: 97.4 },
  { month: 'May 2024', scenario: 'Revenue', forecastedAvg: 192, actualAvg: 188, mape: 2.1, accuracy: 97.9 },
  { month: 'Jun 2024', scenario: 'Demand', forecastedAvg: 215, actualAvg: 208, mape: 3.3, accuracy: 96.7 },
  { month: 'Jul 2024', scenario: 'Occupancy', forecastedAvg: 88, actualAvg: 86, mape: 2.3, accuracy: 97.7 },
  { month: 'Aug 2024', scenario: 'Revenue', forecastedAvg: 205, actualAvg: 212, mape: 3.4, accuracy: 96.6 },
  { month: 'Sep 2024', scenario: 'Events', forecastedAvg: 445, actualAvg: 432, mape: 2.9, accuracy: 97.1 },
];

const INSIGHTS = [
  'Occupancy forecasts consistently 92-95% accurate over 6 months (TimesFM foundation model)',
  'Revenue forecasts improved from 88% to 94% accuracy (seasonal patterns learned)',
  'Event forecasts most challenging (85-90% accuracy) but acceptable for strategic planning',
  'Zero-shot capability eliminates 2-3 hours of monthly manual forecasting',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TimeseriesForecastingDemo() {
  const [currentView, setCurrentView] = useState<'scenarios' | 'performance' | 'historical'>('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<string>('occupancy');
  const [forecastHorizon, setForecastHorizon] = useState<number>(30);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  const runForecast = () => {
    setIsForecasting(true);

    setTimeout(() => {
      const data = FORECAST_DATA[selectedScenario];
      const adjustedForecast = data.forecast.slice(0, forecastHorizon);
      const adjustedLower = data.confidenceLower.slice(0, forecastHorizon);
      const adjustedUpper = data.confidenceUpper.slice(0, forecastHorizon);

      setResult({
        ...data,
        forecast: adjustedForecast,
        confidenceLower: adjustedLower,
        confidenceUpper: adjustedUpper,
        inferenceTime: 1200 + Math.random() * 800,  // 1.2-2.0 seconds
      });

      setIsForecasting(false);
    }, 1500);
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
  };

  const getTrendColor = (trend: string) => {
    return trend === 'increasing'
      ? 'text-green-600 dark:text-green-400'
      : trend === 'decreasing'
      ? 'text-red-600 dark:text-red-400'
      : 'text-blue-600 dark:text-blue-400';
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
            📊 Timeseries Forecasting (TimesFM)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Google&apos;s foundation model for long-range strategic forecasting (14-30 days)
          </p>
        </div>

        {/* View Tabs */}
        <ViewTabs
          currentView={currentView}
          views={[
            { id: 'scenarios', label: 'Scenarios', icon: '🎯' },
            { id: 'performance', label: 'Performance', icon: '📊' },
            { id: 'historical', label: 'Historical', icon: '📈' },
          ]}
          onChange={(view) => setCurrentView(view as any)}
        />

        {/* View 1: Scenarios (Interactive Forecasting) */}
        {currentView === 'scenarios' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Configuration */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Select Scenario
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedScenario === scenario.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="text-4xl mb-2">{scenario.icon}</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {scenario.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {scenario.unit}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Forecast Horizon (Days)
                  </label>
                  <input
                    type="range"
                    min="14"
                    max="30"
                    value={forecastHorizon}
                    onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {forecastHorizon} days
                  </div>
                </div>

                <button
                  onClick={runForecast}
                  disabled={isForecasting}
                  className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:bg-slate-300 transition-colors"
                >
                  {isForecasting ? '⏳ Forecasting (TimesFM)...' : '🎯 Generate Forecast'}
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-3">✅ Why TimesFM?</h3>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>• 90-95% accuracy for long-range (14-30 days)</li>
                  <li>• Zero-shot (no training required)</li>
                  <li>• Foundation model (pre-trained on billions of series)</li>
                  <li>• Handles complex patterns (events, holidays)</li>
                  <li>• Confidence intervals built-in</li>
                </ul>
              </div>
            </div>

            {/* Right: Results */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Forecast Results
              </h2>

              {result ? (
                <div className="space-y-6">
                  {/* Trend Indicator */}
                  <div className="text-center">
                    <div className="text-6xl mb-4">{getTrendIcon(result.metrics.trend)}</div>
                    <div className={`text-2xl font-bold mb-2 ${getTrendColor(result.metrics.trend)}`}>
                      {result.metrics.trend.toUpperCase()} TREND
                    </div>
                    <div className="text-lg text-slate-600 dark:text-slate-400">
                      MAPE: {result.metrics.mape.toFixed(1)}% | RMSE: {result.metrics.rmse.toFixed(1)}
                    </div>
                  </div>

                  {/* Forecast Values (First 7 days) */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      📊 Next 7 Days (of {forecastHorizon}):
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.forecast.slice(0, 7).map((value, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400">Day {idx + 1}:</span>
                            <div className="text-right">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {value.toFixed(0)} {SCENARIOS.find(s => s.id === selectedScenario)?.unit}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Range: {result.confidenceLower[idx].toFixed(0)} - {result.confidenceUpper[idx].toFixed(0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      💡 Strategic Recommendations:
                    </h3>
                    <div className="space-y-2">
                      {result.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded text-green-800 dark:text-green-200 text-sm"
                        >
                          ✓ {rec}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Model:</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-xs">
                        google/timesfm-1.0-200m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Inference Time:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {result.inferenceTime.toFixed(0)}ms (GPU)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Zero-shot:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        No training required
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p>Select a scenario and click &quot;Generate Forecast&quot;</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 2: Performance (Manager ROI) */}
        {currentView === 'performance' && (
          <div className="space-y-8">
            {/* ROI Card */}
            <ROICard
              monthlyROI={2000}
              annualROI={24000}
              description="TimesFM long-range forecasting enables revenue optimization (+12%) and waste reduction through accurate strategic planning"
            />

            {/* Before/After Comparison */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📊 Before/After Comparison
              </h2>
              <ROIMetrics
                beforeMetrics={[
                  { label: 'Forecasting Method', value: 'Manual (Excel)' },
                  { label: 'Forecast Horizon', value: '7-14 days' },
                  { label: 'Avg Accuracy', value: '82%' },
                  { label: 'Monthly Revenue', value: '$168,750' },
                  { label: 'Time Required', value: '3 hours/month' },
                ]}
                afterMetrics={[
                  { label: 'Forecasting Method', value: 'TimesFM (Zero-shot)' },
                  { label: 'Forecast Horizon', value: '30 days' },
                  { label: 'Avg Accuracy', value: '92%' },
                  { label: 'Monthly Revenue', value: '$193,050' },
                  { label: 'Time Required', value: '20 min/month' },
                ]}
              />
            </div>

            {/* Accuracy by Scenario */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🎯 Accuracy by Scenario
              </h3>
              <div className="space-y-4">
                {ACCURACY_BY_SCENARIO.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.scenario}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          {item.accuracy}% accuracy
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {item.mape.toFixed(1)}% MAPE
                        </span>
                        <span className="text-slate-500 dark:text-slate-500">
                          {item.forecasts} forecasts
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">✅ Key Benefits</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold mb-2">92%</div>
                  <div className="text-blue-200">Avg Forecast Accuracy (vs 82% manual)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">+15%</div>
                  <div className="text-blue-200">Revenue Increase (dynamic pricing)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">Zero-shot</div>
                  <div className="text-blue-200">No Training Required (foundation model)</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-700">
                <h4 className="font-semibold mb-2">TimesFM vs LightGBM (Complementary)</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-100">
                  <div>
                    <strong>TimesFM:</strong> Long-range (14-30 days), strategic planning, revenue optimization, zero-shot
                  </div>
                  <div>
                    <strong>LightGBM:</strong> Short-range (7 days), daily operations, inventory/kitchen, faster inference
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 3: Historical (Retrospective Analysis) */}
        {currentView === 'historical' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📈 Last 6 Months: Forecast vs Actual
              </h2>

              <HistoricalTable
                columns={[
                  { header: 'Month', key: 'month' },
                  { header: 'Scenario', key: 'scenario' },
                  { header: 'Forecasted Avg', key: 'forecastedAvg', formatter: TableFormatters.number },
                  { header: 'Actual Avg', key: 'actualAvg', formatter: TableFormatters.number },
                  {
                    header: 'MAPE %',
                    key: 'mape',
                    formatter: (val: number) => (
                      <span className={val < 5 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                        {val.toFixed(1)}%
                      </span>
                    ),
                  },
                  {
                    header: 'Accuracy %',
                    key: 'accuracy',
                    formatter: (val: number) => (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {val.toFixed(1)}%
                      </span>
                    ),
                  },
                ]}
                data={LAST_6_MONTHS}
              />

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Accuracy (6 months)</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">97.2%</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Excellent performance</div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg MAPE</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">2.8%</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Industry-leading</div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Time Saved</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">16.5 hrs</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Over 6 months</div>
                </div>
              </div>
            </div>

            <InsightsBox insights={INSIGHTS} />

            {/* System Reliability */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🧠 System Reliability & Insights
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    ✓ Consistent Accuracy
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">
                    TimesFM maintained 92-95% accuracy over 6 months without retraining. Foundation model handles
                    seasonal patterns and events automatically (zero-shot capability).
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    📊 Strategic Value
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    Long-range forecasts (30 days) enable proactive revenue management, staff hiring, and bulk
                    ordering decisions. Eliminates reactive firefighting.
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    🎯 Complementary to LightGBM
                  </div>
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    TimesFM (strategic, 14-30 days) + LightGBM (operational, 7 days) = complete forecasting
                    coverage. Combined ROI: $3,500/month.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
