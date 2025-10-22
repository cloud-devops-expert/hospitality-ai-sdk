'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  RoomOccupancy,
  EnergyResult,
  optimizeEnergyScheduleBased,
  ENERGY_MODELS,
} from '@/lib/energy/optimizer';

export default function EnergyPage() {
  const [roomCount, setRoomCount] = useState(50);
  const [occupancyRate, setOccupancyRate] = useState(70);
  const [outsideTemp, setOutsideTemp] = useState(28);
  const [result, setResult] = useState<EnergyResult | null>(null);

  const handleOptimize = () => {
    const rooms: RoomOccupancy[] = Array.from({ length: roomCount }, (_, i) => ({
      roomId: `room-${i + 1}`,
      occupied: Math.random() < occupancyRate / 100,
      guestPreferences: { preferredTemp: 22 },
    }));

    const optimization = optimizeEnergyScheduleBased(rooms, outsideTemp);
    setResult(optimization);
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <Navigation title="Energy Management" />
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Optimize HVAC settings to reduce energy costs
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Available Algorithms
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(ENERGY_MODELS).map(([key, model]) => (
              <div key={key} className="p-4 border rounded">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{model.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {model.savings}% savings
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Rooms: {roomCount}
              </label>
              <input
                type="range"
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                className="w-full"
                min="10"
                max="200"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Occupancy: {occupancyRate}%
              </label>
              <input
                type="range"
                value={occupancyRate}
                onChange={(e) => setOccupancyRate(Number(e.target.value))}
                className="w-full"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                Outside Temp: {outsideTemp}°C
              </label>
              <input
                type="range"
                value={outsideTemp}
                onChange={(e) => setOutsideTemp(Number(e.target.value))}
                className="w-full"
                min="0"
                max="40"
              />
            </div>
            <button
              onClick={handleOptimize}
              className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-700"
            >
              Optimize Energy
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Optimization Results
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Daily Cost</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${result.estimatedCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Savings</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {result.savings.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
