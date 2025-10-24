'use client';

/**
 * Inventory Forecasting Demo Page
 *
 * Interactive demo for inventory forecasting with local-first ML
 */

import { useState } from 'react';
import { TraditionalInventoryForecaster } from '@/lib/operations/inventory/traditional-forecaster';
import type {
  InventoryItem,
  UsageHistory,
  ForecastResult,
  ReorderResult,
  WasteResult,
} from '@/lib/operations/inventory/traditional-forecaster';

export default function InventoryDemoPage() {
  const [currentStock, setCurrentStock] = useState(120);
  const [costPerUnit, setCostPerUnit] = useState(2.5);
  const [shelfLifeDays, setShelfLifeDays] = useState(7);
  const [occupancy, setOccupancy] = useState(0.75);
  const [forecastDays, setForecastDays] = useState(7);

  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [reorderResult, setReorderResult] = useState<ReorderResult | null>(null);
  const [wasteResult, setWasteResult] = useState<WasteResult | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const generateHistory = (): UsageHistory[] => {
    const history: UsageHistory[] = [];
    const today = new Date();

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Simulate realistic usage patterns
      let baseUsage = 50;
      if (isWeekend) baseUsage *= 1.4;

      const dailyOccupancy = 0.6 + Math.random() * 0.3;
      history.push({
        date,
        quantity: Math.round(baseUsage * dailyOccupancy),
        occupancyRate: dailyOccupancy,
        dayOfWeek,
        isHoliday: false,
      });
    }

    return history;
  };

  const runForecast = () => {
    const startTime = performance.now();

    const item: InventoryItem = {
      id: '001',
      name: 'Fresh Tomatoes',
      category: 'food',
      currentStock,
      reorderLevel: 80,
      leadTimeDays: 2,
      costPerUnit,
      shelfLifeDays,
    };

    const history = generateHistory();
    const forecaster = new TraditionalInventoryForecaster();

    // Forecast
    const forecast = forecaster.forecastDemand(item, history, forecastDays, occupancy);
    setForecastResult(forecast);

    // Reorder
    const reorder = forecaster.calculateReorderQuantity(item, forecast.forecast);
    setReorderResult(reorder);

    // Waste
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);
    const waste = forecaster.predictWaste(item, forecast.forecast, expiryDate);
    setWasteResult(waste);

    const endTime = performance.now();
    setExecutionTime(endTime - startTime);
  };

  const roi = new TraditionalInventoryForecaster().calculateBusinessValue(
    250, // items
    10, // avg value
    0.25, // waste reduction
    8 // hours saved
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-navy-900 dark:text-white mb-4">
            📦 Inventory Forecasting Demo
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Interactive demo showing demand forecasting, automatic reorder, and waste prediction
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Annual Savings</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${roi.totalAnnualSavings.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Implementation</div>
            <div className="text-3xl font-bold text-navy-900 dark:text-white">2-4 hours</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Accuracy</div>
            <div className="text-3xl font-bold text-navy-900 dark:text-white">75-80%</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Cost</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">$0</div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
            🎛️ Adjust Parameters
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Stock (units)
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-navy-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cost Per Unit ($)
              </label>
              <input
                type="number"
                step="0.1"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-navy-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Shelf Life (days)
              </label>
              <input
                type="number"
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-navy-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Occupancy
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.01"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {(occupancy * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Forecast Days
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-navy-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={runForecast}
            className="w-full md:w-auto px-8 py-3 bg-navy-900 dark:bg-navy-700 text-white rounded-lg hover:bg-navy-800 dark:hover:bg-navy-600 transition-colors font-semibold"
          >
            Run Forecast
          </button>
        </div>

        {/* Results */}
        {forecastResult && (
          <>
            {/* Demand Forecast */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
                📈 Demand Forecast
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="space-y-3">
                    {forecastResult.forecast.map((qty, i) => {
                      const days = [
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday',
                      ];
                      const maxQty = Math.max(...forecastResult.forecast);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-slate-600 dark:text-slate-400 w-24">
                            {days[i % 7]}:
                          </span>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-8 overflow-hidden">
                            <div
                              className="bg-navy-900 dark:bg-navy-600 h-full rounded-full flex items-center justify-end pr-3"
                              style={{ width: `${(qty / maxQty) * 100}%` }}
                            >
                              <span className="text-sm font-semibold text-white">
                                {qty} units
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Total Forecasted Usage
                    </div>
                    <div className="text-3xl font-bold text-navy-900 dark:text-white">
                      {forecastResult.forecast.reduce((sum, f) => sum + f, 0)} units
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Average Daily Usage
                    </div>
                    <div className="text-3xl font-bold text-navy-900 dark:text-white">
                      {(
                        forecastResult.forecast.reduce((sum, f) => sum + f, 0) /
                        forecastResult.forecast.length
                      ).toFixed(1)}{' '}
                      units
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Confidence Level
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {(forecastResult.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reorder Analysis */}
            {reorderResult && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-12">
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
                  🔔 Automatic Reorder
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div
                    className={`rounded-lg p-6 ${
                      reorderResult.shouldReorder
                        ? 'bg-amber-50 dark:bg-amber-900/20'
                        : 'bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Reorder Needed
                    </div>
                    <div
                      className={`text-4xl font-bold ${
                        reorderResult.shouldReorder
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {reorderResult.shouldReorder ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div className="rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Days of Stock
                    </div>
                    <div className="text-4xl font-bold text-navy-900 dark:text-white">
                      {reorderResult.daysOfStockRemaining.toFixed(1)}
                    </div>
                  </div>
                  <div
                    className={`rounded-lg p-6 ${
                      reorderResult.urgency === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : reorderResult.urgency === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : 'bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Urgency</div>
                    <div
                      className={`text-4xl font-bold ${
                        reorderResult.urgency === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : reorderResult.urgency === 'medium'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {reorderResult.urgency.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-slate-700 dark:text-slate-300">{reorderResult.reason}</p>
                  {reorderResult.shouldReorder && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">
                          Recommended Order:
                        </span>
                        <span className="text-xl font-bold text-navy-900 dark:text-white">
                          {reorderResult.quantity} units ($
                          {(reorderResult.quantity * costPerUnit).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Waste Prediction */}
            {wasteResult && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-12">
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
                  🗑️ Waste Prediction
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Expected Waste
                    </div>
                    <div className="text-4xl font-bold text-navy-900 dark:text-white">
                      {wasteResult.wasteQuantity} units
                    </div>
                  </div>
                  <div className="rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Waste Value
                    </div>
                    <div className="text-4xl font-bold text-navy-900 dark:text-white">
                      ${wasteResult.wasteValue.toFixed(2)}
                    </div>
                  </div>
                  <div
                    className={`rounded-lg p-6 ${
                      wasteResult.severity === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : wasteResult.severity === 'medium'
                          ? 'bg-amber-50 dark:bg-amber-900/20'
                          : wasteResult.severity === 'low'
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Severity</div>
                    <div
                      className={`text-4xl font-bold ${
                        wasteResult.severity === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : wasteResult.severity === 'medium'
                            ? 'text-amber-600 dark:text-amber-400'
                            : wasteResult.severity === 'low'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {wasteResult.severity.toUpperCase()}
                    </div>
                  </div>
                </div>
                {wasteResult.recommendation && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-slate-700 dark:text-slate-300">
                      {wasteResult.recommendation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Performance */}
            <div className="bg-gradient-to-r from-navy-900 to-blue-800 dark:from-navy-800 dark:to-blue-900 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">⚡ Performance Metrics</h2>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-2">Execution Time</div>
                  <div className="text-white text-2xl font-bold">{executionTime.toFixed(2)}ms</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-2">API Calls</div>
                  <div className="text-green-400 text-2xl font-bold">0</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-2">Data Sent</div>
                  <div className="text-green-400 text-2xl font-bold">0 bytes</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-2">Works Offline</div>
                  <div className="text-green-400 text-2xl font-bold">✓</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
