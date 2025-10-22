// Guest journey demo
'use client';

export default function JourneyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Guest Journey Mapping
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Track guest journeys across 11 stages with touchpoint optimization
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-700 dark:text-gray-300">
            Demo coming soon - Module: lib/journey/mapper.ts
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            27 tests • 100% coverage • 11 stages • Bottleneck identification
          </p>
        </div>
      </div>
    </div>
  );
}
