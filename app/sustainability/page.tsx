'use client';

import { useState } from 'react';
import {
  calculateCarbonFootprint,
  calculateWaterUsage,
  calculateWasteMetrics,
  calculateSustainabilityScore,
  generateSustainabilityReport,
  type SustainabilityData,
} from '@/lib/sustainability/tracker';

export default function SustainabilityPage() {
  const [period, setPeriod] = useState('monthly');
  
  const data: SustainabilityData = {
    period: period as any,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    electricity: { consumption: 15000, unit: 'kWh', cost: 2250 },
    naturalGas: { consumption: 3000, unit: 'm3', cost: 750 },
    water: { consumption: 5000, unit: 'm3', cost: 1500 },
    waste: { total: 2000, recycled: 800, composted: 400, unit: 'kg' },
    occupancy: { rooms: 120, occupiedNights: 2800 },
  };

  const carbon = calculateCarbonFootprint(data);
  const water = calculateWaterUsage(data);
  const waste = calculateWasteMetrics(data);
  const score = calculateSustainabilityScore(data);
  const report = generateSustainabilityReport(data);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🌱 Sustainability Metrics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Track carbon footprint, water usage, and waste management
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Carbon Footprint</div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {carbon.totalCO2e.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">metric tons CO2e</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Water Efficiency</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {water.waterPerOccupiedRoom.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">m³ per occupied room</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Waste Diversion</div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {waste.diversionRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">recycled + composted</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Score</div>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              {score.totalScore}
            </div>
            <div className="text-xs text-gray-500 uppercase">{score.rating}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Carbon Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Electricity</span>
                <span className="font-bold">{carbon.electricityCO2e.toFixed(1)} tons</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Natural Gas</span>
                <span className="font-bold">{carbon.naturalGasCO2e.toFixed(1)} tons</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Water</span>
                <span className="font-bold">{carbon.waterCO2e.toFixed(1)} tons</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Waste</span>
                <span className="font-bold">{carbon.wasteCO2e.toFixed(1)} tons</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Cost Savings Potential
            </h2>
            <div className="space-y-3">
              {report.recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <div className="text-sm text-gray-700 dark:text-gray-300">{rec}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">Annual Savings</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${report.costSavingsPotential.annual.min.toLocaleString()} - 
                ${report.costSavingsPotential.annual.max.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ESG Reporting Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry Percentile</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {score.industryPercentile}th
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Water Rating</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {water.efficiencyRating}
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Waste Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {waste.wasteScore}/100
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
