// Computer vision demo
'use client';

export default function VisionPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Computer Vision
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Facility monitoring, occupancy detection, and safety analysis
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-700 dark:text-gray-300">
            Demo coming soon - Module: lib/vision/detector.ts
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            34 tests • 100% coverage • Safety detection • Asset tracking
          </p>
        </div>
      </div>
    </div>
  );
}
