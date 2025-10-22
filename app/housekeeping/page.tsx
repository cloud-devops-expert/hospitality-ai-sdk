'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  Room,
  CleaningRoute,
  optimizeRouteGreedy,
  optimizeRouteTSP,
  HOUSEKEEPING_MODELS,
} from '@/lib/housekeeping/optimizer';

type AlgorithmType = 'greedy' | 'tsp' | 'genetic';

export default function HousekeepingPage() {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('greedy');
  const [result, setResult] = useState<CleaningRoute | null>(null);

  const sampleRooms: Room[] = [
    {
      id: '101',
      number: '101',
      floor: 1,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
    {
      id: '203',
      number: '203',
      floor: 2,
      status: 'dirty',
      priority: 'priority',
      estimatedCleanTime: 35,
    },
    {
      id: '305',
      number: '305',
      floor: 3,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
    {
      id: '207',
      number: '207',
      floor: 2,
      status: 'dirty',
      priority: 'vip',
      estimatedCleanTime: 45,
    },
    {
      id: '410',
      number: '410',
      floor: 4,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
    {
      id: '512',
      number: '512',
      floor: 5,
      status: 'dirty',
      priority: 'priority',
      estimatedCleanTime: 40,
    },
    {
      id: '308',
      number: '308',
      floor: 3,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
    {
      id: '115',
      number: '115',
      floor: 1,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
  ];

  const handleOptimize = () => {
    let route: CleaningRoute;
    switch (selectedAlgorithm) {
      case 'greedy':
        route = optimizeRouteGreedy(sampleRooms, currentFloor);
        break;
      case 'tsp':
        route = optimizeRouteTSP(sampleRooms, currentFloor);
        break;
      case 'genetic':
        // Use TSP for now
        route = optimizeRouteTSP(sampleRooms, currentFloor);
        route.method = 'genetic';
        route.efficiency = 0.89;
        break;
    }
    setResult(route);
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    return HOUSEKEEPING_MODELS[algo];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'vip':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'priority':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <Navigation title="Housekeeping Route Optimization" />

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Optimize cleaning routes to minimize time and maximize efficiency
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Select Algorithm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['greedy', 'tsp', 'genetic'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              const isAvailable = algo !== 'genetic';
              return (
                <button
                  key={algo}
                  onClick={() => isAvailable && setSelectedAlgorithm(algo)}
                  disabled={!isAvailable}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlgorithm === algo
                      ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : isAvailable
                        ? 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                        : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize">
                    {info.name}
                    {!isAvailable && (
                      <span className="ml-2 text-xs text-gray-500">(Simulated)</span>
                    )}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Cost:</strong> ${info.cost}
                    </div>
                    <div>
                      <strong>Latency:</strong> ~{info.avgLatency}ms
                    </div>
                    <div>
                      <strong>Efficiency:</strong> {(info.efficiency * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-500 mt-2">{info.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Current Floor: {currentFloor}
                </label>
                <input
                  type="range"
                  value={currentFloor}
                  onChange={(e) => setCurrentFloor(Number(e.target.value))}
                  className="w-full"
                  min="1"
                  max="5"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Rooms to Clean ({sampleRooms.length})
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sampleRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 rounded"
                    >
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Room {room.number}
                      </span>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${getPriorityColor(room.priority)}`}
                        >
                          {room.priority}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                          {room.estimatedCleanTime}min
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOptimize}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 mt-4"
              >
                Optimize Route
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    Optimized Route
                  </h2>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Time</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(result.estimatedTime)}m
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Distance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(result.totalDistance)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Efficiency</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {(result.efficiency * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                    <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                      Cleaning Order
                    </p>
                    <div className="space-y-2">
                      {result.rooms.map((room, idx) => (
                        <div
                          key={room.id}
                          className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              Room {room.number}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Floor {room.floor} • {room.estimatedCleanTime} min
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getPriorityColor(room.priority)}`}
                          >
                            {room.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    Optimization Benefits
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span>Minimized floor changes for efficiency</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span>VIP and priority rooms handled first</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                      <span>
                        Estimated {Math.round(result.efficiency * 45)} minutes saved per day
                      </span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {!result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Click &ldquo;Optimize Route&rdquo; to see the best cleaning sequence</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
