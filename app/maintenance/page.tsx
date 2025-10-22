'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  Asset,
  MaintenancePrediction,
  predictMaintenanceUsageBased,
  MAINTENANCE_MODELS,
} from '@/lib/maintenance/predictor';

type AlgorithmType = 'schedule' | 'usage' | 'ml';

export default function MaintenancePage() {
  const [assetType, setAssetType] = useState<Asset['type']>('hvac');
  const [assetName, setAssetName] = useState('HVAC Unit #3');
  const [ageMonths, setAgeMonths] = useState(36);
  const [usageHours, setUsageHours] = useState(2400);
  const [daysSinceMaintenance, setDaysSinceMaintenance] = useState(60);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('usage');
  const [result, setResult] = useState<MaintenancePrediction | null>(null);

  const handlePredict = () => {
    const asset: Asset = {
      id: 'asset-1',
      name: assetName,
      type: assetType,
      ageMonths,
      usageHours,
      lastMaintenance: new Date(Date.now() - daysSinceMaintenance * 24 * 60 * 60 * 1000),
    };

    const prediction = predictMaintenanceUsageBased(asset);
    setResult(prediction);
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    return MAINTENANCE_MODELS[algo];
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <Navigation title="Maintenance Prediction" />
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Predict equipment maintenance needs to prevent failures and optimize scheduling
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Select Algorithm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['schedule', 'usage', 'ml'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              const isAvailable = algo === 'usage' || algo === 'schedule';
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
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {info.name}
                    {!isAvailable && (
                      <span className="ml-2 text-xs text-gray-500">(Coming Soon)</span>
                    )}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Effectiveness:</strong> {(info.effectiveness * 100).toFixed(0)}%
                    </div>
                    <div>
                      <strong>Cost:</strong> ${info.cost}
                    </div>
                    <div>
                      <strong>Latency:</strong> ~{info.avgLatency}ms
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Asset Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Asset Type
                </label>
                <select
                  value={assetType}
                  onChange={(e) => {
                    const type = e.target.value as Asset['type'];
                    setAssetType(type);
                    // Update name based on type
                    const names = {
                      hvac: 'HVAC Unit #3',
                      elevator: 'Main Elevator',
                      plumbing: 'Water System',
                      electrical: 'Main Panel',
                    };
                    setAssetName(names[type]);
                  }}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="hvac">HVAC System</option>
                  <option value="elevator">Elevator</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Age: {ageMonths} months
                </label>
                <input
                  type="range"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Usage Hours: {usageHours}h
                </label>
                <input
                  type="range"
                  value={usageHours}
                  onChange={(e) => setUsageHours(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="10000"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Days Since Last Maintenance: {daysSinceMaintenance}
                </label>
                <input
                  type="range"
                  value={daysSinceMaintenance}
                  onChange={(e) => setDaysSinceMaintenance(Number(e.target.value))}
                  className="w-full"
                  min="0"
                  max="365"
                />
              </div>

              <button
                onClick={handlePredict}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 mt-4"
              >
                Predict Maintenance
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Prediction Results
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Days Until Maintenance
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {result.daysUntilMaintenance}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Failure Risk</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            result.failureRisk > 0.7
                              ? 'bg-red-500'
                              : result.failureRisk > 0.4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${result.failureRisk * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {(result.failureRisk * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                    <span
                      className={`inline-block mt-2 px-4 py-2 rounded font-bold ${
                        result.priority === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : result.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}
                    >
                      {result.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Method: {result.method.charAt(0).toUpperCase() + result.method.slice(1)}-Based
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      {MAINTENANCE_MODELS[result.method].description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Configure asset parameters and click &ldquo;Predict Maintenance&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
