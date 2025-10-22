'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  InventoryItem,
  forecastInventoryMovingAverage,
  INVENTORY_MODELS,
} from '@/lib/inventory/forecaster';

export default function InventoryPage() {
  const [items] = useState<InventoryItem[]>([
    { id: '1', name: 'Eggs (dozen)', currentStock: 50, avgDailyConsumption: 15, perishable: true },
    { id: '2', name: 'Milk (liters)', currentStock: 30, avgDailyConsumption: 12, perishable: true },
    { id: '3', name: 'Coffee (kg)', currentStock: 10, avgDailyConsumption: 2, perishable: false },
    {
      id: '4',
      name: 'Bread (loaves)',
      currentStock: 40,
      avgDailyConsumption: 18,
      perishable: true,
    },
  ]);

  const forecasts = items.map((item) => forecastInventoryMovingAverage(item));

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <Navigation title="F&B Inventory Management" />
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Forecast inventory needs to reduce waste and prevent stockouts
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(INVENTORY_MODELS).map(([key, model]) => (
              <div key={key} className="p-4 border rounded">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{model.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {model.waste}% waste
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Inventory Forecast
          </h2>
          <div className="space-y-4">
            {forecasts.map((forecast, idx) => (
              <div key={idx} className="p-4 border rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {forecast.item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current Stock: {forecast.item.currentStock}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      forecast.daysUntilStockout < 3
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : forecast.daysUntilStockout < 7
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    {forecast.daysUntilStockout} days
                  </span>
                </div>
                {forecast.recommendedOrder > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Recommended Order:</strong> {forecast.recommendedOrder} units
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
