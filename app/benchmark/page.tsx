'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { ML_MODELS } from '@/lib/sentiment/ml-browser';
import { ML_ALLOCATION_MODELS } from '@/lib/allocation/ml-based';
import { ML_PRICING_MODELS } from '@/lib/pricing/ml-regression';
import { ML_FORECAST_MODELS } from '@/lib/forecast/ml-timeseries';

interface BenchmarkResult {
  method: string;
  latency: number;
  cost: number;
  accuracy: number;
  description: string;
}

export default function BenchmarkPage() {
  const [selectedModule, setSelectedModule] = useState<
    'sentiment' | 'allocation' | 'pricing' | 'forecast'
  >('sentiment');
  const [monthlyOperations, setMonthlyOperations] = useState(10000);

  const getBenchmarks = (): BenchmarkResult[] => {
    switch (selectedModule) {
      case 'sentiment':
        return [
          {
            method: 'Traditional (Keywords)',
            latency: 5,
            cost: 0,
            accuracy: 0.72,
            description: 'Simple keyword matching. Instant, free, basic accuracy.',
          },
          ...Object.entries(ML_MODELS).map(([_key, model]) => ({
            method: model.name,
            latency: model.avgLatency,
            cost: model.cost,
            accuracy: model.accuracy,
            description: model.description,
          })),
        ];

      case 'allocation':
        return [
          {
            method: 'Rule-Based',
            latency: 10,
            cost: 0,
            accuracy: 0.87,
            description: 'Constraint satisfaction algorithm. Fast and reliable.',
          },
          ...Object.entries(ML_ALLOCATION_MODELS).map(([_key, model]) => ({
            method: model.name,
            latency: model.avgLatency,
            cost: model.cost,
            accuracy: model.accuracy,
            description: model.description,
          })),
        ];

      case 'pricing':
        return [
          {
            method: 'Algorithmic',
            latency: 5,
            cost: 0,
            accuracy: 0.75,
            description: 'Multi-factor traditional pricing. Fast and predictable.',
          },
          ...Object.entries(ML_PRICING_MODELS).map(([_key, model]) => ({
            method: model.name,
            latency: model.avgLatency,
            cost: model.cost,
            accuracy: model.accuracy,
            description: model.description,
          })),
        ];

      case 'forecast':
        return [
          {
            method: 'Moving Average',
            latency: 20,
            cost: 0,
            accuracy: 0.81,
            description: 'Simple statistical average. Baseline method.',
          },
          ...Object.entries(ML_FORECAST_MODELS).map(([_key, model]) => ({
            method: model.name,
            latency: model.avgLatency,
            cost: model.cost,
            accuracy: model.accuracy,
            description: model.description,
          })),
        ];

      default:
        return [];
    }
  };

  const benchmarks = getBenchmarks();
  const monthlyCost = (method: BenchmarkResult) => (method.cost * monthlyOperations) / 1000;

  const getLatencyColor = (latency: number) => {
    if (latency < 20) return 'text-green-600 dark:text-green-400';
    if (latency < 100) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCostColor = (cost: number) => {
    if (cost === 0) return 'text-green-600 dark:text-green-400';
    if (cost < 0.1) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.85) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 0.75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        <Navigation title="ML Benchmarks & Cost Analysis" />

        <p className="text-gray-700 dark:text-gray-300 mb-8">
          Compare traditional algorithms with ML approaches across cost, latency, and accuracy
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            How It Works
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Comprehensive ML Benchmarking:</strong> Compare traditional algorithms vs ML approaches across 4 key hospitality modules
            </p>
            <p>
              <strong>3 Key Metrics:</strong> Latency (speed), Cost (per 1K operations), Accuracy (performance quality) - the "iron triangle" of ML evaluation
            </p>
            <p>
              <strong>Cost Analysis:</strong> Calculates monthly operational costs based on your usage volume - most traditional methods are $0, ML methods range from $0 (browser-based) to $0.50/1K (LLM)
            </p>
            <p>
              <strong>Trade-off Visualization:</strong> Helps identify the optimal method for your use case - Traditional for high volume + cost sensitivity, ML for accuracy-critical applications
            </p>
            <p>
              <strong>ROI Calculator:</strong> Shows monthly cost projections at different operation volumes (1K, 10K, 100K) to inform budget planning
            </p>
            <p>
              <strong>Decision Framework:</strong> Zero cost methods (Traditional, Browser ML) for baseline → Hybrid for smart escalation → Pure ML for maximum accuracy
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              <strong>Key Insight:</strong> 70-80% of operations can use zero-cost methods, reserve expensive ML for edge cases where accuracy justifies cost
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setSelectedModule('sentiment')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedModule === 'sentiment'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sentiment Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">4 methods</p>
          </button>

          <button
            onClick={() => setSelectedModule('allocation')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedModule === 'allocation'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Room Allocation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">4 methods</p>
          </button>

          <button
            onClick={() => setSelectedModule('pricing')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedModule === 'pricing'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dynamic Pricing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">4 methods</p>
          </button>

          <button
            onClick={() => setSelectedModule('forecast')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedModule === 'forecast'
                ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Demand Forecast</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">5 methods</p>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Monthly Operations
            </h2>
            <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
              {monthlyOperations.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            value={monthlyOperations}
            onChange={(e) => setMonthlyOperations(Number(e.target.value))}
            className="w-full accent-brand-600 dark:accent-brand-500"
            min="1000"
            max="100000"
            step="1000"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1K</span>
            <span>50K</span>
            <span>100K</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Latency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cost/1K Ops
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Monthly Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {benchmarks.map((benchmark, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {benchmark.method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-semibold ${getLatencyColor(benchmark.latency)}`}
                      >
                        {benchmark.latency}ms
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${getCostColor(benchmark.cost)}`}>
                        ${benchmark.cost.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${getCostColor(benchmark.cost)}`}>
                        ${monthlyCost(benchmark).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-semibold ${getAccuracyColor(benchmark.accuracy)}`}
                      >
                        {(benchmark.accuracy * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {benchmark.description}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Cost Analysis
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>Free Methods:</strong> Traditional, browser-based ML
              </p>
              <p>
                <strong>Low Cost:</strong> $0.01-0.10 per 1K operations
              </p>
              <p>
                <strong>Premium:</strong> $0.50+ per 1K operations
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Choose based on your volume and budget constraints
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Latency Guidelines
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <strong>&lt;20ms:</strong> Excellent (real-time)
              </p>
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                <strong>20-100ms:</strong> Good (interactive)
              </p>
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <strong>&gt;100ms:</strong> Acceptable (batch)
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Accuracy Targets
            </h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <strong>≥85%:</strong> Production-ready
              </p>
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                <strong>75-85%:</strong> Good for most cases
              </p>
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <strong>&lt;75%:</strong> Needs improvement
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="font-semibold text-green-800 dark:text-green-300 mb-2">
                Cost-Effective Choice
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Start with traditional methods. Upgrade to browser-based ML for better accuracy with
                zero API costs.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Hybrid Approach</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Use traditional for 70-80% of cases. Escalate complex cases to ML/AI for optimal
                cost-accuracy balance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
