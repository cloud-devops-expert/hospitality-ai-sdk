'use client';

import { useState } from 'react';

// Simplified demo for Image Generation (SDXL)
// ROI: $200/month from reduced stock photo costs
// Technology: Stable Diffusion XL (1024x1024, GPU)

export default function ImageGenerationDemo() {
  const [activeView, setActiveView] = useState('generate');

  const RECENT_GENERATIONS = [
    {
      id: '1',
      prompt: 'Luxury hotel room with king-size bed, modern furniture, city view, warm lighting',
      category: 'Hotel Room',
      quality: 'high',
      dimensions: '1024x1024',
      generationTime: 28,
      timestamp: '12 min ago',
      usedFor: 'Instagram post',
    },
    {
      id: '2',
      prompt: 'Gourmet dish presentation, fine dining, elegant plating, natural lighting',
      category: 'Restaurant Dish',
      quality: 'standard',
      dimensions: '1024x1024',
      generationTime: 18,
      timestamp: '45 min ago',
      usedFor: 'Menu design',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Image Generation (SDXL)
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate professional marketing images with Stable Diffusion XL
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly ROI</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">$200</div>
              <div className="text-xs text-gray-500">$2,400/year</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-600 dark:text-green-400">
              <div className="text-2xl font-bold">1024²</div>
              <div className="text-sm opacity-80">Resolution</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-blue-600 dark:text-blue-400">
              <div className="text-2xl font-bold">15-60s</div>
              <div className="text-sm opacity-80">Generation</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-purple-600 dark:text-purple-400">
              <div className="text-2xl font-bold">80%</div>
              <div className="text-sm opacity-80">Cost Savings</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-orange-600 dark:text-orange-400">
              <div className="text-2xl font-bold">$0</div>
              <div className="text-sm opacity-80">Per Image</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Generations</h2>
          <div className="space-y-4">
            {RECENT_GENERATIONS.map(item => (
              <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{item.category}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.prompt}</div>
                  </div>
                  <div className="text-xs text-gray-500">{item.timestamp}</div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs mt-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                    <div className="font-semibold">Quality</div>
                    <div className="capitalize">{item.quality}</div>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                    <div className="font-semibold">Size</div>
                    <div>{item.dimensions}</div>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded">
                    <div className="font-semibold">Time</div>
                    <div>{item.generationTime}s</div>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded">
                    <div className="font-semibold">Cost</div>
                    <div>$0.00</div>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                    <div className="font-semibold">Used For</div>
                    <div>{item.usedFor}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">🔧 Technology: Stable Diffusion XL</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">SDXL Base 1.0 • 1024x1024 resolution • 15-60s GPU • $0 per image • 40 images/month • 80% cost reduction vs stock photos</p>
        </div>
      </div>
    </div>
  );
}
