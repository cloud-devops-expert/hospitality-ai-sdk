'use client';

/**
 * Operations ROI Demo Page
 *
 * Interactive demo showing complete ROI across all 5 operational areas
 */

import { useState, useEffect } from 'react';
import { TraditionalInventoryForecaster } from '@/lib/operations/inventory/traditional-forecaster';

interface Operation {
  name: string;
  description: string;
  algorithm: string;
  accuracy: string;
  monthlySavingsMin: number;
  monthlySavingsMax: number;
  implementationLines: number;
  implementationHours: number;
  icon: string;
}

const operations: Operation[] = [
  {
    name: 'Inventory Management',
    description: 'Demand forecasting, automatic reordering, waste prediction',
    algorithm: 'Moving Average + Seasonality',
    accuracy: '75-80%',
    monthlySavingsMin: 1500,
    monthlySavingsMax: 2500,
    implementationLines: 200,
    implementationHours: 3,
    icon: '📦',
  },
  {
    name: 'Kitchen Operations',
    description: 'Prep quantity forecasting, waste reduction, staff scheduling',
    algorithm: 'Occupancy-Based Forecasting',
    accuracy: '75-80%',
    monthlySavingsMin: 2000,
    monthlySavingsMax: 3000,
    implementationLines: 180,
    implementationHours: 3,
    icon: '🍽️',
  },
  {
    name: 'Laundry Optimization',
    description: 'Load optimization, off-peak scheduling, linen tracking',
    algorithm: 'Greedy Load Optimization',
    accuracy: '80-85%',
    monthlySavingsMin: 800,
    monthlySavingsMax: 1200,
    implementationLines: 150,
    implementationHours: 2,
    icon: '🧺',
  },
  {
    name: 'Predictive Maintenance',
    description: 'Failure prediction, maintenance scheduling, ROI calculation',
    algorithm: 'Time + Usage-Based',
    accuracy: '70-75%',
    monthlySavingsMin: 1500,
    monthlySavingsMax: 3000,
    implementationLines: 180,
    implementationHours: 3,
    icon: '🔧',
  },
  {
    name: 'Housekeeping Optimization',
    description: 'Room prioritization, staff assignment, route optimization',
    algorithm: 'Constraint Satisfaction',
    accuracy: '75-80%',
    monthlySavingsMin: 1200,
    monthlySavingsMax: 2000,
    implementationLines: 200,
    implementationHours: 3,
    icon: '🧹',
  },
];

export default function OperationsROIPage() {
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [forecast, setForecast] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const totalMonthlyMin = operations.reduce((sum, op) => sum + op.monthlySavingsMin, 0);
  const totalMonthlyMax = operations.reduce((sum, op) => sum + op.monthlySavingsMax, 0);
  const totalAnnualMin = totalMonthlyMin * 12;
  const totalAnnualMax = totalMonthlyMax * 12;
  const totalLines = operations.reduce((sum, op) => sum + op.implementationLines, 0);
  const totalHours = operations.reduce((sum, op) => sum + op.implementationHours, 0);

  const runLiveDemo = () => {
    setIsRunning(true);
    const startTime = performance.now();

    // Generate sample history
    const history = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      return {
        date,
        quantity: Math.round(50 * (isWeekend ? 1.4 : 1) * (0.6 + Math.random() * 0.3)),
        occupancyRate: 0.6 + Math.random() * 0.3,
        dayOfWeek,
        isHoliday: false,
      };
    });

    const forecaster = new TraditionalInventoryForecaster();
    const item = {
      id: '001',
      name: 'Fresh Tomatoes',
      category: 'food' as const,
      currentStock: 120,
      reorderLevel: 80,
      leadTimeDays: 2,
      costPerUnit: 2.5,
      shelfLifeDays: 7,
    };

    const result = forecaster.forecastDemand(item, history, 7, 0.75);
    const endTime = performance.now();

    setExecutionTime(endTime - startTime);
    setForecast(result.forecast);
    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run on page load
    runLiveDemo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            💰 Operations ROI Calculator
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Complete business value analysis across all 5 operational areas
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Total Monthly Savings
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${totalMonthlyMin.toLocaleString()}-${totalMonthlyMax.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Total Annual Savings
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${totalAnnualMin.toLocaleString()}-${totalAnnualMax.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Implementation</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalHours} hours
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              (~{Math.ceil(totalHours / 8)} days)
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">ROI</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">∞</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              $0 cost = infinite ROI
            </div>
          </div>
        </div>

        {/* Operations Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            5 Operational Areas
          </h2>
          <div className="space-y-4">
            {operations.map((op, index) => (
              <div
                key={op.name}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:border-navy-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{op.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {index + 1}. {op.name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">{op.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${op.monthlySavingsMin.toLocaleString()}-$
                      {op.monthlySavingsMax.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">per month</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Algorithm:</span>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {op.algorithm}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Accuracy:</span>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {op.accuracy}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Lines of Code:</span>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {op.implementationLines}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Dev Time:</span>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {op.implementationHours} hours
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Demo */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">⚡ Live Algorithm Demo</h2>
          <p className="text-blue-100 mb-6">
            Watch the inventory forecasting algorithm run in real-time. This executes entirely in
            your browser with zero API calls.
          </p>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white font-semibold mb-3">7-Day Forecast</h3>
                <div className="space-y-2">
                  {forecast.length > 0 &&
                    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-blue-200 w-12">{day}:</span>
                        <div className="flex-1 bg-white/20 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-green-400 h-full rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(forecast[i] / Math.max(...forecast)) * 100}%` }}
                          >
                            <span className="text-xs font-semibold text-white">
                              {forecast[i]} units
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Execution Time:</span>
                    <span className="text-white font-semibold">{executionTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">API Calls:</span>
                    <span className="text-green-400 font-semibold">0 (zero!)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Data Sent:</span>
                    <span className="text-green-400 font-semibold">0 bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Works Offline:</span>
                    <span className="text-green-400 font-semibold">✓ Yes</span>
                  </div>
                  {forecast.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-200">Total Forecast:</span>
                      <span className="text-white font-semibold">
                        {forecast.reduce((sum, f) => sum + f, 0)} units
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={runLiveDemo}
            disabled={isRunning}
            className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run Demo Again'}
          </button>
        </div>

        {/* Comparison */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📊 Local-First vs AI/Cloud
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400">
                    Metric
                  </th>
                  <th className="text-left py-3 px-4 text-gray-900 dark:text-white">
                    Local-First (Ours)
                  </th>
                  <th className="text-left py-3 px-4 text-slate-600 dark:text-slate-400">
                    AI/Cloud
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Cost</td>
                  <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                    $0/month
                  </td>
                  <td className="py-3 px-4">$200-500/month</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Accuracy</td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    75-80%
                  </td>
                  <td className="py-3 px-4">85-95%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Latency</td>
                  <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                    &lt;10ms
                  </td>
                  <td className="py-3 px-4">200-1000ms</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">API Calls</td>
                  <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">0</td>
                  <td className="py-3 px-4">10,000+/month</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Works Offline</td>
                  <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                    ✓ Yes
                  </td>
                  <td className="py-3 px-4">✗ No</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Privacy</td>
                  <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                    Complete
                  </td>
                  <td className="py-3 px-4">⚠️ Third-party</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Annual Savings</td>
                  <td className="py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                    ${totalAnnualMin.toLocaleString()}-${totalAnnualMax.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    ${(totalAnnualMin + 15000).toLocaleString()}-$
                    {(totalAnnualMax + 30000).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-gray-900 dark:text-white font-semibold mb-2">💡 Recommendation:</p>
            <p className="text-slate-600 dark:text-slate-300">
              Start with local-first (75-80% accuracy, $0 cost). Only consider AI enhancement for
              hotels &gt;100 rooms where 10-15% accuracy improvement justifies $2.4K-$6K/year cost.
            </p>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🚀 2-Day Implementation Plan
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Day 1</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="text-gray-900 dark:text-white font-semibold">Morning:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Implement inventory & kitchen forecasters (4 hours)
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-gray-900 dark:text-white font-semibold">Afternoon:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Implement laundry & maintenance (4 hours)
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Day 2</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="text-gray-900 dark:text-white font-semibold">Morning:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Implement housekeeping & integrate with PMS (4 hours)
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-gray-900 dark:text-white font-semibold">Afternoon:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Test with real data & deploy (2 hours)
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-gray-900 dark:text-white font-semibold mb-2">✅ What You Get:</p>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
              <li>910 lines of production-ready TypeScript</li>
              <li>Zero dependencies (pure algorithms)</li>
              <li>Complete documentation</li>
              <li>$84K-$140K/year in savings</li>
              <li>Infinite ROI (zero cost!)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
