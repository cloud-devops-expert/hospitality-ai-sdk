'use client';

import { useState } from 'react';
import {
  scoreRoomInspection,
  optimizeInspectionRoute,
  type RoomInspectionInput,
} from '@/lib/quality-assurance/inspector';

export default function QualityAssurancePage() {
  const [inspectionScore, setInspectionScore] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);

  const runInspection = () => {
    const input: RoomInspectionInput = {
      roomId: 'R-101',
      roomType: 'deluxe',
      inspector: 'Demo Inspector',
      timestamp: new Date(),
      categories: {
        cleanliness: { bedroom: 9, bathroom: 8, commonArea: 9 },
        maintenance: { fixtures: 8, appliances: 9, furniture: 8 },
        safety: { exitSigns: 10, smokeDetector: 10, locks: 9 },
        amenities: { minibar: 9, tv: 8, wifi: 10 },
      },
      defects: [
        { category: 'maintenance', severity: 'minor', description: 'Loose door handle', estimatedFixTime: 15 },
      ],
    };

    const score = scoreRoomInspection(input);
    setInspectionScore(score);
  };

  const optimizeRoute = () => {
    const rooms = [
      { roomId: 'R-101', floor: 1, priority: 'standard' },
      { roomId: 'R-102', floor: 1, priority: 'high' },
      { roomId: 'R-201', floor: 2, priority: 'standard' },
      { roomId: 'R-202', floor: 2, priority: 'urgent' },
      { roomId: 'R-301', floor: 3, priority: 'standard' },
    ];

    const optimized = optimizeInspectionRoute(rooms as any, 1);
    setRoute(optimized);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          ✓ Quality Assurance Automation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Automated inspections and route optimization
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Room Inspection
            </h2>
            <button
              onClick={runInspection}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              🔍 Run Sample Inspection
            </button>
            
            {inspectionScore && (
              <div className="mt-4 space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {inspectionScore.overallScore}/100
                  </div>
                  <div className="text-xs uppercase mt-1">{inspectionScore.grade}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Cleanliness</div>
                    <div className="text-xl font-bold">{inspectionScore.categoryScores.cleanliness}</div>
                  </div>
                  <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Safety</div>
                    <div className="text-xl font-bold">{inspectionScore.categoryScores.safety}</div>
                  </div>
                </div>
                <div className={`p-3 rounded ${inspectionScore.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="font-bold">{inspectionScore.passed ? '✓ PASSED' : '✗ FAILED'}</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Route Optimization
            </h2>
            <button
              onClick={optimizeRoute}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
            >
              🗺️ Optimize Inspection Route
            </button>

            {route && (
              <div className="mt-4 space-y-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Time Saved</div>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {route.metrics.timeSaved}min
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Optimized Sequence:</div>
                  {route.sequence.map((room: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-gray-400">{i + 1}.</span>
                      <span className="font-mono">{room.roomId}</span>
                      <span className="text-xs text-gray-500">Floor {room.floor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
