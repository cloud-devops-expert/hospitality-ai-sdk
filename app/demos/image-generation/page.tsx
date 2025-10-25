/**
 * Image Generation Demo (SDXL)
 *
 * Stable Diffusion XL for marketing content (FREE!)
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GenerationResult {
  prompt: string;
  negativePrompt: string;
  style: string;
  dimensions: string;
  generationTime: number;
  modelUsed: string;
  seed: number;
  steps: number;
  guidance: number;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
}

export default function ImageGenerationDemo() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('hotel-room');
  const [customPrompt, setCustomPrompt] = useState('');
  const [quality, setQuality] = useState<'draft' | 'standard' | 'high' | 'ultra'>('standard');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const templates = [
    {
      id: 'hotel-room',
      name: 'Hotel Room',
      icon: '🛏️',
      prompt:
        'Luxury hotel room with king-size bed, modern furniture, city view, warm lighting, professional photography',
      use: 'Property listings, booking sites',
    },
    {
      id: 'restaurant-dish',
      name: 'Restaurant Dish',
      icon: '🍽️',
      prompt:
        'Gourmet dish presentation, fine dining, elegant plating, natural lighting, restaurant photography',
      use: 'Menu design, social media',
    },
    {
      id: 'spa-wellness',
      name: 'Spa & Wellness',
      icon: '💆',
      prompt:
        'Serene spa interior, massage table, candles, soft lighting, relaxing atmosphere, luxury wellness center',
      use: 'Spa marketing, brochures',
    },
    {
      id: 'event-venue',
      name: 'Event Venue',
      icon: '🎉',
      prompt:
        'Elegant event venue, wedding reception setup, decorated tables, ambient lighting, professional event photography',
      use: 'Event promotion, venue tours',
    },
    {
      id: 'poolside',
      name: 'Pool & Outdoor',
      icon: '🏊',
      prompt:
        'Resort swimming pool, lounge chairs, palm trees, sunset, tropical paradise, vacation photography',
      use: 'Resort marketing, travel ads',
    },
    {
      id: 'reception',
      name: 'Front Desk',
      icon: '🏨',
      prompt:
        'Modern hotel reception desk, friendly staff, luxury lobby, professional hospitality photography',
      use: 'Brand marketing, website',
    },
  ];

  const qualitySettings = {
    draft: { steps: 20, guidance: 5, time: 8, description: 'Quick preview' },
    standard: { steps: 30, guidance: 7, time: 15, description: 'Good quality' },
    high: { steps: 50, guidance: 9, time: 30, description: 'Professional' },
    ultra: { steps: 100, guidance: 12, time: 60, description: 'Print quality' },
  };

  const generateImage = async () => {
    setIsGenerating(true);
    const startTime = performance.now();

    const settings = qualitySettings[quality];
    const prompt = customPrompt || templates.find((t) => t.id === selectedTemplate)?.prompt || '';

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const endTime = performance.now();

    setResult({
      prompt,
      negativePrompt:
        'blurry, low quality, distorted, watermark, text, logo, amateur, bad lighting',
      style: templates.find((t) => t.id === selectedTemplate)?.name || 'Custom',
      dimensions: '1024x1024',
      generationTime: endTime - startTime,
      modelUsed: 'stabilityai/stable-diffusion-xl-base-1.0',
      seed: Math.floor(Math.random() * 1000000),
      steps: settings.steps,
      guidance: settings.guidance,
      quality,
    });

    setIsGenerating(false);
  };

  const getQualityColor = (q: string) => {
    switch (q) {
      case 'draft':
        return 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600';
      case 'standard':
        return 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700';
      case 'high':
        return 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700';
      case 'ultra':
        return 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700';
      default:
        return 'bg-slate-100 dark:bg-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/demos/ml"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎨 Image Generation (SDXL)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Stable Diffusion XL for professional marketing content (FREE!)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ✅ Why SDXL (FREE!)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Stable Diffusion XL
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Professional quality (1024x1024)</li>
                <li>• 15-60 seconds per image</li>
                <li>• $0-$300/month (self-hosted GPU)</li>
                <li>• Unlimited generations</li>
                <li>• Full commercial rights</li>
                <li>• Customize for brand</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Commercial Services
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Similar quality</li>
                <li>• 5-30 seconds per image</li>
                <li>• $0.02-$0.10 per image</li>
                <li>• Pay per generation</li>
                <li>• Limited commercial use</li>
                <li>• No customization</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Select Template
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setCustomPrompt('');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className="text-4xl mb-2">{template.icon}</div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {template.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {template.use}
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Custom Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe your image... (leave blank to use template)"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white resize-none"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Quality Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(qualitySettings) as Array<keyof typeof qualitySettings>).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      quality === q
                        ? getQualityColor(q)
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {q}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ~{qualitySettings[q].time}s
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateImage}
              disabled={isGenerating}
              className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:bg-slate-300 transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Use Cases
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Social media marketing (Instagram, Facebook)</li>
                <li>• Website hero images & banners</li>
                <li>• Email marketing campaigns</li>
                <li>• Property listings & virtual tours</li>
                <li>• Menu design & promotional materials</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Generation Details
            </h2>

            {result ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🖼️</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Image Generated Successfully
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    (In production, SDXL image would appear here)
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Prompt:</h3>
                  <div className="bg-blue-50 dark:bg-blue-900 px-3 py-2 rounded text-sm text-blue-800 dark:text-blue-200">
                    {result.prompt}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Negative Prompt:
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900 px-3 py-2 rounded text-sm text-red-800 dark:text-red-200">
                    {result.negativePrompt}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Style:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.style}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Quality:</span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {result.quality}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Dimensions:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.dimensions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Steps:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.steps}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Guidance Scale:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.guidance}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Seed:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.seed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Generation Time:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.generationTime.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Model:</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-xs">
                      {result.modelUsed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cost:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">$0.00</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="bg-yellow-50 dark:bg-yellow-900 px-3 py-3 rounded text-sm">
                    <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                      💡 Pro Tip:
                    </div>
                    <div className="text-yellow-700 dark:text-yellow-300">
                      Save the seed number to recreate similar images. Adjust guidance scale (7-12)
                      for more creative vs. accurate results.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>Select a template and click &quot;Generate Image&quot;</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl shadow-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-4">Expected ROI</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="text-4xl font-bold">$0-$300</div>
              <div className="text-blue-200">Monthly Cost</div>
            </div>
            <div>
              <div className="text-4xl font-bold">Unlimited</div>
              <div className="text-blue-200">Generations</div>
            </div>
            <div>
              <div className="text-4xl font-bold">60-80%</div>
              <div className="text-blue-200">Cost Savings vs Stock</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$5K-$15K</div>
              <div className="text-blue-200">Annual Savings</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-700 text-blue-100 text-sm">
            <strong>Industries:</strong> All 21 industries - Hotels, Restaurants, Healthcare,
            Events, any business needing marketing visuals
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Cost Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400">
                    Cost Per Image
                  </th>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400">
                    100 Images/Month
                  </th>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400">
                    Commercial Rights
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr className="bg-green-50 dark:bg-green-900">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    SDXL (Self-Hosted)
                  </td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-bold">$0.00</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-bold">
                    $0-$300
                  </td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400">✓ Full Rights</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">DALL-E 3</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">$0.04-$0.08</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">$4-$8</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">✓ Full Rights</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Midjourney</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">~$0.10</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">$10-$30</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    ⚠️ License Required
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Stock Photos</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">$5-$50</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">$500-$5,000</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    ⚠️ Limited License
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
