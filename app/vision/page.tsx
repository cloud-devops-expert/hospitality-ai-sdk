'use client';

import { useState } from 'react';
import { analyzeImage, type ImageAnalysisInput } from '@/lib/vision/detector';

export default function VisionPage() {
  const [analysisType, setAnalysisType] = useState<'facility' | 'occupancy' | 'cleanliness' | 'safety' | 'asset'>('facility');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    const input: ImageAnalysisInput = {
      imageId: `img-${Date.now()}`,
      imageData: 'sample-image-data-base64',
      analysisType,
      location: 'Demo Location',
      timestamp: new Date(),
    };

    const res = await analyzeImage(input, { roomCapacity: 50, assetType: 'furniture' });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          👁️ Computer Vision
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Facility monitoring, occupancy detection, and safety analysis
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Analysis Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {['facility', 'occupancy', 'cleanliness', 'safety', 'asset'].map((type) => (
              <button
                key={type}
                onClick={() => setAnalysisType(type as any)}
                className={`px-4 py-3 rounded-lg font-medium capitalize ${
                  analysisType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
          >
            {loading ? '🔄 Analyzing...' : '🚀 Run Analysis'}
          </button>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Analysis Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {result.overallScore}
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {(result.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Processing</div>
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {result.processingTime}ms
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Detections</h3>
                {result.detections.map((d: any, i: number) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-900 p-3 rounded mb-2">
                    <div className="font-semibold">{d.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{d.description}</div>
                  </div>
                ))}
              </div>

              {result.insights.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Insights</h3>
                  {result.insights.map((insight: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span className="text-blue-500">💡</span>
                      <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.alerts.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Alerts</h3>
                  {result.alerts.map((alert: any, i: number) => (
                    <div key={i} className="bg-red-50 dark:bg-red-900/20 p-3 rounded mb-2">
                      <div className="font-semibold text-red-800 dark:text-red-400">
                        {alert.message}
                      </div>
                      <div className="text-sm">{alert.action}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
