'use client';

import { useState } from 'react';
import {
  analyzeGuestJourney,
  identifyBottlenecks,
  type GuestJourneyInput,
} from '@/lib/journey/mapper';

export default function JourneyPage() {
  const [analysis, setAnalysis] = useState<any>(null);

  const runAnalysis = () => {
    const input: GuestJourneyInput = {
      guestId: 'G-12345',
      journeyStart: new Date('2025-01-01'),
      journeyEnd: new Date('2025-01-05'),
      touchpoints: [
        { stage: 'awareness', type: 'website', timestamp: new Date('2024-12-20'), duration: 180, score: 9 },
        { stage: 'research', type: 'website', timestamp: new Date('2024-12-21'), duration: 300, score: 8 },
        { stage: 'booking', type: 'website', timestamp: new Date('2024-12-21'), duration: 240, score: 9 },
        { stage: 'pre-arrival', type: 'email', timestamp: new Date('2024-12-28'), duration: 60, score: 10 },
        { stage: 'check-in', type: 'front-desk', timestamp: new Date('2025-01-01'), duration: 300, score: 7 },
        { stage: 'in-stay', type: 'room-service', timestamp: new Date('2025-01-02'), duration: 120, score: 9 },
        { stage: 'check-out', type: 'front-desk', timestamp: new Date('2025-01-05'), duration: 180, score: 8 },
      ],
    };

    const result = analyzeGuestJourney(input);
    setAnalysis(result);
  };

  const stages = [
    'awareness', 'research', 'booking', 'pre-arrival', 'arrival',
    'check-in', 'in-stay', 'service-interaction', 'amenity-usage',
    'check-out', 'post-stay'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🗺️ Guest Journey Mapping
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Track guest journeys across 11 stages
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <button
            onClick={runAnalysis}
            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-lg"
          >
            🎯 Analyze Sample Journey
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Score</div>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {analysis.overallExperience}/100
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {analysis.completionRate}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Touchpoints</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {analysis.totalTouchpoints}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(analysis.averageDuration)}min
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Journey Stages
              </h2>
              <div className="space-y-3">
                {Object.entries(analysis.stageMetrics).map(([stage, metrics]: [string, any]) => (
                  <div key={stage} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold capitalize">{stage.replace('-', ' ')}</span>
                      <span className="text-sm">Score: {metrics.averageScore}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(metrics.averageScore / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analysis.bottlenecks.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Bottlenecks Identified
                </h2>
                <div className="space-y-3">
                  {analysis.bottlenecks.map((b: any, i: number) => (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 p-4 rounded">
                      <div className="font-semibold capitalize">{b.stage.replace('-', ' ')}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Duration: {b.averageDuration}min (Industry avg: {b.industryBenchmark}min)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
