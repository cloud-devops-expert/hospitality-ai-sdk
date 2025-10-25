/**
 * Demand Forecasting Demo (LightGBM)
 *
 * Gradient boosting forecasting for inventory, kitchen, laundry, housekeeping
 * ROI: $1,500/month ($18,000/year) - Reduces waste by 17% through accurate demand prediction
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

interface DepartmentForecast {
  date: string;
  day: string;
  predicted: number;
  confidence: number;
  alert?: {
    type: 'high_demand' | 'low_demand' | 'unusual_pattern';
    message: string;
  };
}

interface HistoricalRecord {
  date: string;
  dept: string;
  predicted: number;
  actual: number | null;
  error: number | null;
  savings: string;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const FORECASTS_BY_DEPT: Record<string, DepartmentForecast[]> = {
  inventory: [
    { date: '2024-10-25', day: 'Fri', predicted: 125, confidence: 0.93, alert: { type: 'high_demand', message: '18% above average' } },
    { date: '2024-10-26', day: 'Sat', predicted: 180, confidence: 0.91, alert: { type: 'high_demand', message: 'Weekend spike expected' } },
    { date: '2024-10-27', day: 'Sun', predicted: 175, confidence: 0.89 },
    { date: '2024-10-28', day: 'Mon', predicted: 110, confidence: 0.88 },
    { date: '2024-10-29', day: 'Tue', predicted: 115, confidence: 0.86 },
    { date: '2024-10-30', day: 'Wed', predicted: 118, confidence: 0.85 },
    { date: '2024-10-31', day: 'Thu', predicted: 122, confidence: 0.84 },
  ],
  kitchen: [
    { date: '2024-10-25', day: 'Fri', predicted: 180, confidence: 0.91 },
    { date: '2024-10-26', day: 'Sat', predicted: 240, confidence: 0.89, alert: { type: 'high_demand', message: 'Weekend dinner rush' } },
    { date: '2024-10-27', day: 'Sun', predicted: 230, confidence: 0.88 },
    { date: '2024-10-28', day: 'Mon', predicted: 160, confidence: 0.87 },
    { date: '2024-10-29', day: 'Tue', predicted: 165, confidence: 0.85 },
    { date: '2024-10-30', day: 'Wed', predicted: 170, confidence: 0.84 },
    { date: '2024-10-31', day: 'Thu', predicted: 175, confidence: 0.83 },
  ],
  laundry: [
    { date: '2024-10-25', day: 'Fri', predicted: 75, confidence: 0.90 },
    { date: '2024-10-26', day: 'Sat', predicted: 95, confidence: 0.88, alert: { type: 'high_demand', message: 'High turnover day' } },
    { date: '2024-10-27', day: 'Sun', predicted: 90, confidence: 0.87 },
    { date: '2024-10-28', day: 'Mon', predicted: 65, confidence: 0.86 },
    { date: '2024-10-29', day: 'Tue', predicted: 68, confidence: 0.84 },
    { date: '2024-10-30', day: 'Wed', predicted: 70, confidence: 0.83 },
    { date: '2024-10-31', day: 'Thu', predicted: 72, confidence: 0.82 },
  ],
  housekeeping: [
    { date: '2024-10-25', day: 'Fri', predicted: 48, confidence: 0.88, alert: { type: 'unusual_pattern', message: 'High variance expected' } },
    { date: '2024-10-26', day: 'Sat', predicted: 65, confidence: 0.86 },
    { date: '2024-10-27', day: 'Sun', predicted: 62, confidence: 0.85 },
    { date: '2024-10-28', day: 'Mon', predicted: 42, confidence: 0.84 },
    { date: '2024-10-29', day: 'Tue', predicted: 45, confidence: 0.82 },
    { date: '2024-10-30', day: 'Wed', predicted: 46, confidence: 0.81 },
    { date: '2024-10-31', day: 'Thu', predicted: 48, confidence: 0.80 },
  ],
};

const DEPARTMENT_ACCURACY = [
  { dept: 'Inventory', accuracy: 90, avgError: 3.2, forecasts: 28 },
  { dept: 'Kitchen', accuracy: 88, avgError: 4.1, forecasts: 28 },
  { dept: 'Laundry', accuracy: 87, avgError: 3.8, forecasts: 28 },
  { dept: 'Housekeeping', accuracy: 85, avgError: 5.2, forecasts: 28 },
];

const LAST_7_DAYS: HistoricalRecord[] = [
  { date: '2024-10-19', dept: 'Inventory', predicted: 118, actual: 122, error: 3.3, savings: '$42' },
  { date: '2024-10-20', dept: 'Kitchen', predicted: 165, actual: 158, error: 4.2, savings: '$38' },
  { date: '2024-10-21', dept: 'Laundry', predicted: 72, actual: 70, error: 2.8, savings: '$28' },
  { date: '2024-10-22', dept: 'Inventory', predicted: 130, actual: 135, error: 3.7, savings: '$45' },
  { date: '2024-10-23', dept: 'Kitchen', predicted: 220, actual: 212, error: 3.6, savings: '$52' },
  { date: '2024-10-24', dept: 'Laundry', predicted: 88, actual: 85, error: 3.4, savings: '$35' },
  { date: '2024-10-25', dept: 'Inventory', predicted: 125, actual: null, error: null, savings: '-' },
];

const INSIGHTS = [
  'Kitchen accuracy improved from 85% to 90% this week (seasonal patterns learned)',
  'Weekend demand consistently 40% higher than weekdays - system detected pattern',
  'Inventory forecast within 5% for 6 out of 7 days (excellent performance)',
  'Laundry demand correlates 0.92 with occupancy rate - strong predictor',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ForecastingDemo() {
  const [currentView, setCurrentView] = useState<'forecasts' | 'performance' | 'historical'>('forecasts');
  const [selectedDept, setSelectedDept] = useState<string>('inventory');

  const departments = [
    { id: 'inventory', name: 'Inventory', icon: '📦', color: 'blue' },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: 'green' },
    { id: 'laundry', name: 'Laundry', icon: '🧺', color: 'purple' },
    { id: 'housekeeping', name: 'Housekeeping', icon: '🧹', color: 'amber' },
  ];

  const getAlertBadge = (type: string) => {
    const badges = {
      high_demand: { label: 'High Demand', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
      low_demand: { label: 'Low Demand', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      unusual_pattern: { label: 'Unusual Pattern', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    };
    return badges[type as keyof typeof badges];
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
            📈 Demand Forecasting (LightGBM)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Gradient boosting forecasting reduces waste by 17% through accurate demand prediction
          </p>
        </div>

        {/* View Tabs */}
        <ViewTabs
          currentView={currentView}
          views={[
            { id: 'forecasts', label: 'Forecasts', icon: '📊' },
            { id: 'performance', label: 'Performance', icon: '🎯' },
            { id: 'historical', label: 'Historical', icon: '📈' },
          ]}
          onChange={(view) => setCurrentView(view as any)}
        />

        {/* View 1: Forecasts (Staff Operations) */}
        {currentView === 'forecasts' && (
          <div className="space-y-8">
            {/* Department Selector */}
            <div className="grid grid-cols-4 gap-4">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedDept === dept.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="text-3xl mb-2">{dept.icon}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{dept.name}</div>
                </button>
              ))}
            </div>

            {/* 7-Day Forecast */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                7-Day {departments.find(d => d.id === selectedDept)?.name} Forecast
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                LightGBM gradient boosting predictions (retrained weekly)
              </p>

              <div className="space-y-3">
                {FORECASTS_BY_DEPT[selectedDept].map((forecast, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      forecast.alert
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {forecast.day}, {forecast.date}
                          </div>
                          {forecast.alert && (
                            <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              ⚠️ {forecast.alert.message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {forecast.predicted}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {(forecast.confidence * 100).toFixed(0)}% confidence
                          </div>
                        </div>
                        {forecast.alert && (
                          <span className={`text-xs px-3 py-1 rounded ${getAlertBadge(forecast.alert.type).color}`}>
                            {getAlertBadge(forecast.alert.type).label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  💡 Model Info
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <div><strong>Algorithm:</strong> LightGBM (Gradient Boosting)</div>
                  <div><strong>Training data:</strong> Last 90 days</div>
                  <div><strong>Retraining:</strong> Weekly (Sunday night)</div>
                  <div><strong>Inference time:</strong> &lt;100ms (CPU-only)</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                📝 Record Today&apos;s Actual Demand
              </button>
              <button className="p-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold">
                🔧 Adjust Forecast (Override)
              </button>
            </div>
          </div>
        )}

        {/* View 2: Performance (Manager ROI) */}
        {currentView === 'performance' && (
          <div className="space-y-8">
            {/* ROI Card */}
            <ROICard
              monthlyROI={1500}
              annualROI={18000}
              description="LightGBM forecasting reduces waste by 17% (25% → 8%) through accurate demand prediction"
            />

            {/* Before/After Comparison */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📊 Before/After Comparison
              </h2>
              <ROIMetrics
                beforeMetrics={[
                  { label: 'Forecasting Method', value: 'Manual (Intuition)' },
                  { label: 'Avg Accuracy', value: '65%' },
                  { label: 'Waste Rate', value: '25%' },
                  { label: 'Monthly Waste Cost', value: '$3,000' },
                  { label: 'Staff Time', value: '5 hours/week' },
                ]}
                afterMetrics={[
                  { label: 'Forecasting Method', value: 'LightGBM (ML)' },
                  { label: 'Avg Accuracy', value: '88%' },
                  { label: 'Waste Rate', value: '8%' },
                  { label: 'Monthly Waste Cost', value: '$770' },
                  { label: 'Staff Time', value: '1 hour/week' },
                ]}
              />
            </div>

            {/* Department Accuracy Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🎯 Department Accuracy Breakdown
              </h3>
              <div className="space-y-4">
                {DEPARTMENT_ACCURACY.map((dept, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {dept.dept}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          {dept.accuracy}% accuracy
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {dept.avgError}% avg error
                        </span>
                        <span className="text-slate-500 dark:text-slate-500">
                          {dept.forecasts} forecasts
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{ width: `${dept.accuracy}%` }}
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
                  <div className="text-3xl font-bold mb-2">88%</div>
                  <div className="text-blue-200">Avg Forecast Accuracy (vs 65% manual)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">17%</div>
                  <div className="text-blue-200">Waste Reduction (25% → 8%)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">&lt;100ms</div>
                  <div className="text-blue-200">Inference Time (CPU-only, no GPU)</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-700">
                <h4 className="font-semibold mb-2">Why LightGBM over TimesFM (Transformers)?</h4>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• 10-15x faster inference (&lt;100ms vs 1-2 seconds)</li>
                  <li>• 87-90% accuracy (only 3-5% less than transformers)</li>
                  <li>• CPU-only (no GPU required, saves $200-400/month)</li>
                  <li>• Perfect for tabular data (hotel operations)</li>
                  <li>• Weekly retraining adapts quickly to patterns</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* View 3: Historical (7-Day Forecast vs Actual) */}
        {currentView === 'historical' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📈 Last 7 Days: Forecast vs Actual
              </h2>

              <HistoricalTable
                columns={[
                  { header: 'Date', key: 'date', formatter: TableFormatters.date },
                  { header: 'Department', key: 'dept' },
                  { header: 'Predicted', key: 'predicted', formatter: TableFormatters.number },
                  {
                    header: 'Actual',
                    key: 'actual',
                    formatter: (val: number | null) => (
                      val !== null ? TableFormatters.number(val) : <span className="text-slate-400">Pending</span>
                    ),
                  },
                  {
                    header: 'Error %',
                    key: 'error',
                    formatter: (val: number | null) => (
                      val !== null ? (
                        <span className={val < 5 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                          {val.toFixed(1)}%
                        </span>
                      ) : <span className="text-slate-400">-</span>
                    ),
                  },
                  { header: 'Daily Savings', key: 'savings', formatter: TableFormatters.currency },
                ]}
                data={LAST_7_DAYS}
              />

              <div className="mt-6 grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Accuracy</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">88.2%</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+2.1% vs last week</div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Error</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">3.5%</div>
                  <div className="text-xs text-green-600 dark:text-green-400">-0.8% vs last week</div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Weekly Savings</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">$240</div>
                  <div className="text-xs text-green-600 dark:text-green-400">$1,035/month projected</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Forecasts Recorded</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">6/7</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">86% completion rate</div>
                </div>
              </div>
            </div>

            <InsightsBox insights={INSIGHTS} />

            {/* System Learning */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🧠 System Learning & Improvements
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    ✓ Accuracy Improvement Trend
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">
                    Model accuracy increased from 85% to 90% over past 4 weeks. Weekly retraining successfully
                    adapted to seasonal patterns (autumn holiday bookings).
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    📊 Pattern Detection
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    Weekend demand consistently 40% higher than weekdays (Saturday peak). LightGBM captured
                    this pattern with 0.92 correlation to occupancy rate.
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    🎯 Confidence Calibration
                  </div>
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    Day 1 forecasts now 95% confident (up from 90% last month). System learned that near-term
                    predictions are more reliable than 7-day forecasts.
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
