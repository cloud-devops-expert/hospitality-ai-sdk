/**
 * Food Recognition Demo (Computer Vision)
 *
 * Recognize food items using Hugging Face vision models (FREE!)
 * Now with REAL ML: Transformers.js + ViT model
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

// Recognition result type
type RecognitionResult = {
  foodItem: string;
  category: string;
  confidence: number;
  calories?: number;
  portionSize?: string;
  executionTime: number;
  modelUsed: string;
  wasteDetected: boolean;
  method: 'transformers.js' | 'mock';
};

export default function FoodRecognitionDemo() {
  const [selectedImage, setSelectedImage] = useState<string>('pizza');
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const sampleImages = [
    { id: 'pizza', name: 'Pizza', emoji: '🍕', category: 'Main Course' },
    { id: 'salad', name: 'Fresh Salad', emoji: '🥗', category: 'Appetizer' },
    { id: 'steak', name: 'Grilled Steak', emoji: '🥩', category: 'Main Course' },
    { id: 'sushi', name: 'Sushi Platter', emoji: '🍱', category: 'Main Course' },
    { id: 'breakfast', name: 'Breakfast Plate', emoji: '🍳', category: 'Breakfast' },
    { id: 'dessert', name: 'Chocolate Cake', emoji: '🍰', category: 'Dessert' },
    { id: 'soup', name: 'Soup Bowl', emoji: '🍲', category: 'Appetizer' },
    { id: 'burger', name: 'Burger & Fries', emoji: '🍔', category: 'Main Course' },
  ];

  const recognitionData: Record<string, RecognitionResult> = {
    pizza: {
      foodItem: 'Margherita Pizza',
      category: 'Italian Cuisine',
      confidence: 0.96,
      calories: 285,
      portionSize: '1 slice (125g)',
      executionTime: 0,
      modelUsed: 'Kaludi/Food-Classification',
      wasteDetected: false,
      method: 'mock',
    },
    salad: {
      foodItem: 'Caesar Salad',
      category: 'Salads & Vegetables',
      confidence: 0.93,
      calories: 180,
      portionSize: '1 serving (200g)',
      executionTime: 0,
      modelUsed: 'Kaludi/food-category-classification-v2.0',
      wasteDetected: false,
      method: 'mock',
    },
    steak: {
      foodItem: 'Grilled Ribeye Steak',
      category: 'Meat & Poultry',
      confidence: 0.95,
      calories: 310,
      portionSize: '8 oz (225g)',
      executionTime: 0,
      modelUsed: 'Jacques7103/Food-Recognition',
      wasteDetected: false,
      method: 'mock',
    },
    sushi: {
      foodItem: 'Assorted Sushi',
      category: 'Japanese Cuisine',
      confidence: 0.94,
      calories: 350,
      portionSize: '10 pieces',
      executionTime: 0,
      modelUsed: 'Kaludi/Food-Classification',
      wasteDetected: false,
      method: 'mock',
    },
    breakfast: {
      foodItem: 'American Breakfast',
      category: 'Breakfast Foods',
      confidence: 0.92,
      calories: 520,
      portionSize: '1 plate',
      executionTime: 0,
      modelUsed: 'Kaludi/food-category-classification-v2.0',
      wasteDetected: false,
      method: 'mock',
    },
    dessert: {
      foodItem: 'Chocolate Layer Cake',
      category: 'Desserts & Sweets',
      confidence: 0.97,
      calories: 450,
      portionSize: '1 slice (120g)',
      executionTime: 0,
      modelUsed: 'Jacques7103/Food-Recognition',
      wasteDetected: false,
      method: 'mock',
    },
    soup: {
      foodItem: 'Vegetable Soup',
      category: 'Soups & Stews',
      confidence: 0.91,
      calories: 120,
      portionSize: '1 bowl (300ml)',
      executionTime: 0,
      modelUsed: 'Kaludi/Food-Classification',
      wasteDetected: false,
      method: 'mock',
    },
    burger: {
      foodItem: 'Cheeseburger with Fries',
      category: 'Fast Food',
      confidence: 0.95,
      calories: 750,
      portionSize: '1 meal',
      executionTime: 0,
      modelUsed: 'Kaludi/food-category-classification-v2.0',
      wasteDetected: false,
      method: 'mock',
    },
  };

  const recognizeFood = async () => {
    setIsRecognizing(true);

    try {
      // Use uploaded image or mock base64 for selected image
      const imageData = uploadedImage || `data:image/png;base64,${selectedImage}`;

      // Call server-side API
      const response = await fetch('/api/ml/recognize-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          imageId: `demo-${Date.now()}`,
          location: 'Restaurant Kitchen',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Recognition failed');
      }

      const mlResult = await response.json();

      setResult({
        foodItem: mlResult.foodItem,
        category: mlResult.category,
        confidence: mlResult.confidence,
        calories: mlResult.calories,
        portionSize: mlResult.portionSize,
        executionTime: mlResult.executionTime,
        modelUsed: mlResult.modelUsed,
        wasteDetected: mlResult.wasteDetected,
        method: mlResult.method,
      });
    } catch (error: any) {
      console.error('Recognition failed:', error);

      // Show proper error message
      const errorMsg = error.message.includes('Timeout')
        ? 'Model is downloading (first time only). Please wait 30 seconds and try again.'
        : `Recognition failed: ${error.message}`;

      alert(errorMsg);

      // Only fall back to mock data if using preset food buttons (not uploaded image)
      if (!uploadedImage && recognitionData[selectedImage]) {
        const data = recognitionData[selectedImage];
        setResult({
          ...data,
          executionTime: 0,
          method: 'mock',
        });
      }
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos/ml"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🍕 Food Recognition (Computer Vision)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Recognize food items using Hugging Face vision models (85-93% accuracy, FREE!)
          </p>
        </div>

        {/* Key Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ✅ Why Food Recognition Models (FREE!)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Hugging Face Vision Models
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 85-93% recognition accuracy</li>
                <li>• &lt;1 second per image</li>
                <li>• 100+ food categories</li>
                <li>• $0/month cost (self-hosted)</li>
                <li>• Calorie estimation included</li>
                <li>• Waste detection capable</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Commercial APIs
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 88-95% accuracy (marginally better)</li>
                <li>• Cloud-only processing</li>
                <li>• $0.005-$0.02 per image</li>
                <li>• $500-$2,000/month for 10K images</li>
                <li>• API rate limits</li>
                <li>• Data privacy concerns</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Area */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Input */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Select Food Image
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {sampleImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedImage === image.id
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className="text-4xl mb-2">{image.emoji}</div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {image.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {image.category}
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Or Upload Your Own
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {uploadedImage ? (
                    <div>
                      <div className="text-2xl mb-2">📷</div>
                      <div className="font-semibold">{uploadedImage}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Click to change
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📸</div>
                      <div className="font-semibold">Click to upload</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        JPG, PNG (max 5MB)
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              onClick={recognizeFood}
              disabled={isRecognizing}
              className="w-full py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {isRecognizing ? '⏳ Recognizing (first use may take 30s)...' : '🔍 Recognize Food'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Use Cases
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Menu item verification (restaurants)</li>
                <li>• Food waste monitoring (reduce 25-40%)</li>
                <li>• Portion control & quality checks</li>
                <li>• Dietary tracking (hospitals, wellness)</li>
                <li>• Buffet monitoring (cruise ships, hotels)</li>
                <li>• Kitchen training & compliance</li>
              </ul>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Recognition Results
            </h2>

            {result ? (
              <div className="space-y-6">
                {/* Food Image Placeholder */}
                <div className="bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900 dark:to-yellow-900 rounded-lg p-8 text-center">
                  <div className="text-8xl mb-4">
                    {sampleImages.find((img) => img.id === selectedImage)?.emoji}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.foodItem}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Category
                      </span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Confidence</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                      Nutritional Information
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          {result.calories}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Calories</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {result.portionSize}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Portion Size
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.wasteDetected && (
                    <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4 border-2 border-red-200 dark:border-red-700">
                      <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <div className="font-semibold">Food Waste Detected</div>
                          <div className="text-sm">Significant uneaten portion identified</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Processing Time:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.executionTime.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Model:</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {result.modelUsed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Method:</span>
                    <span className={`font-semibold text-sm ${result.method === 'transformers.js' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {result.method === 'transformers.js' ? '🚀 Real ML (Transformers.js)' : '📋 Mock Data'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cost:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">$0.00</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>Select an image and click &quot;Recognize Food&quot; to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* ROI Section */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Expected ROI by Industry</h2>
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-4xl font-bold">$0</div>
              <div className="text-blue-200">Monthly Cost</div>
            </div>
            <div>
              <div className="text-4xl font-bold">85-93%</div>
              <div className="text-blue-200">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold">25-40%</div>
              <div className="text-blue-200">Waste Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$15K-$30K</div>
              <div className="text-blue-200">Annual Savings</div>
            </div>
          </div>
          <div className="pt-6 border-t border-blue-700">
            <h3 className="font-semibold mb-2">Industry Applications:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-blue-100 text-sm">
              <div>
                <strong>Restaurants (#17):</strong> Menu verification, portion control, waste
                monitoring
              </div>
              <div>
                <strong>Hotels (#1-6):</strong> Buffet monitoring, F&B quality control
              </div>
              <div>
                <strong>Cruise Ships (#11):</strong> Buffet waste reduction (25-40% savings)
              </div>
              <div>
                <strong>Healthcare (#23, #15):</strong> Patient meal verification, dietary
                compliance
              </div>
              <div>
                <strong>Wellness Retreats (#13):</strong> Meal tracking, nutrition analysis
              </div>
              <div>
                <strong>Senior Living (#15, #25):</strong> Dietary monitoring, intake tracking
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
