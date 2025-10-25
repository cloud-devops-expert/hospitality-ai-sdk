/**
 * Kitchen Operations Demo Page
 *
 * Chef-focused interface with prep sheets, historical tracking, and ROI analysis
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner';
  avgDailyDemand: number;
  prepTimeMinutes: number;
  wastageRate: number;
  costPerServing: number;
  ingredients: { item: string; qty: string }[];
}

interface ForecastResult {
  menuItem: string;
  predictedDemand: number;
  recommendedPrepQty: number;
  estimatedWaste: number;
  prepStartTime: string;
  staffRequired: number;
  costSavings: number;
  ingredients: { item: string; qty: string }[];
  confidence: number;
  historicalNote: string;
}

interface OptimizationResult {
  forecasts: ForecastResult[];
  totalWasteReduction: number;
  totalCostSavings: number;
  staffEfficiency: number;
  executionTime: number;
  systemAccuracy: number;
}

interface HistoricalRecord {
  date: string;
  dayType: string;
  occupancy: number;
  hasEvent: boolean;
  predicted: number;
  prepped: number;
  leftovers: number;  // What staff records (count what's left in pan)
  consumed: number;   // Calculated: prepped - leftovers
  accuracy: number;
}

type ViewMode = 'chef' | 'manager' | 'historical';

export default function KitchenOperationsDemo() {
  const [menuItems] = useState<MenuItem[]>([
    {
      id: 'B001',
      name: 'Breakfast Buffet',
      category: 'breakfast',
      avgDailyDemand: 85,
      prepTimeMinutes: 120,
      wastageRate: 0.15,
      costPerServing: 8,
      ingredients: [
        { item: 'Eggs', qty: '7 dozen' },
        { item: 'Bacon', qty: '6 lbs' },
        { item: 'Bread', qty: '4 loaves' },
        { item: 'Fresh fruit', qty: '5 lbs' },
      ],
    },
    {
      id: 'B002',
      name: 'Omelette Station',
      category: 'breakfast',
      avgDailyDemand: 45,
      prepTimeMinutes: 30,
      wastageRate: 0.08,
      costPerServing: 6,
      ingredients: [
        { item: 'Eggs', qty: '4 dozen' },
        { item: 'Vegetables', qty: '2 lbs' },
        { item: 'Cheese', qty: '1 lb' },
      ],
    },
    {
      id: 'L001',
      name: 'Lunch Entrees',
      category: 'lunch',
      avgDailyDemand: 120,
      prepTimeMinutes: 180,
      wastageRate: 0.12,
      costPerServing: 12,
      ingredients: [
        { item: 'Chicken/Beef', qty: '15 lbs' },
        { item: 'Vegetables', qty: '8 lbs' },
        { item: 'Rice/Pasta', qty: '10 lbs' },
      ],
    },
    {
      id: 'D001',
      name: 'Dinner Service',
      category: 'dinner',
      avgDailyDemand: 150,
      prepTimeMinutes: 240,
      wastageRate: 0.10,
      costPerServing: 18,
      ingredients: [
        { item: 'Premium meat/Seafood', qty: '20 lbs' },
        { item: 'Vegetables', qty: '10 lbs' },
        { item: 'Sides', qty: '8 lbs' },
      ],
    },
  ]);

  const [historicalData] = useState<HistoricalRecord[]>([
    {
      date: '2024-01-19',
      dayType: 'Friday',
      occupancy: 78,
      hasEvent: false,
      predicted: 88,
      prepped: 97,
      leftovers: 4,      // Staff counted: 4 servings left in pan
      consumed: 93,      // Calculated: 97 - 4 = 93
      accuracy: 95,
    },
    {
      date: '2024-01-18',
      dayType: 'Thursday',
      occupancy: 72,
      hasEvent: false,
      predicted: 82,
      prepped: 90,
      leftovers: 11,     // 11 servings left in pan
      consumed: 79,      // 90 - 11 = 79
      accuracy: 96,
    },
    {
      date: '2024-01-17',
      dayType: 'Wednesday',
      occupancy: 68,
      hasEvent: true,
      predicted: 102,
      prepped: 112,
      leftovers: 4,      // 4 servings left in pan
      consumed: 108,     // 112 - 4 = 108
      accuracy: 94,
    },
    {
      date: '2024-01-16',
      dayType: 'Tuesday',
      occupancy: 65,
      hasEvent: false,
      predicted: 75,
      prepped: 83,
      leftovers: 12,     // 12 servings left in pan
      consumed: 71,      // 83 - 12 = 71
      accuracy: 95,
    },
    {
      date: '2024-01-15',
      dayType: 'Monday',
      occupancy: 60,
      hasEvent: false,
      predicted: 68,
      prepped: 75,
      leftovers: 11,     // 11 servings left in pan
      consumed: 64,      // 75 - 11 = 64
      accuracy: 94,
    },
  ]);

  const [occupancyRate, setOccupancyRate] = useState(75);
  const [dayOfWeek, setDayOfWeek] = useState<'weekday' | 'weekend'>('weekday');
  const [specialEvent, setSpecialEvent] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chef');

  const optimizeKitchenOperations = async () => {
    setIsOptimizing(true);
    const startTime = performance.now();

    await new Promise((resolve) => setTimeout(resolve, 600));

    const weekendMultiplier = dayOfWeek === 'weekend' ? 1.25 : 1.0;
    const eventMultiplier = specialEvent ? 1.4 : 1.0;
    const occupancyMultiplier = occupancyRate / 75;

    const forecasts: ForecastResult[] = menuItems.map((item) => {
      const baseDemand = item.avgDailyDemand;
      const predictedDemand = Math.round(
        baseDemand * occupancyMultiplier * weekendMultiplier * eventMultiplier
      );

      const safetyBuffer = 1.1;
      const recommendedPrepQty = Math.round(predictedDemand * safetyBuffer);

      const traditionalPrepQty = Math.round(baseDemand * 1.3);
      const optimizedWaste = recommendedPrepQty * item.wastageRate;
      const traditionalWaste = traditionalPrepQty * item.wastageRate;
      const wasteReduction = traditionalWaste - optimizedWaste;

      const serviceTime: Record<string, number> = {
        breakfast: 7,
        lunch: 12,
        dinner: 18,
      };
      const prepStartHour = serviceTime[item.category] - item.prepTimeMinutes / 60;
      const hour = Math.floor(prepStartHour);
      const minute = Math.round((prepStartHour % 1) * 60);
      const ampm = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const prepStartTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

      const staffRequired = Math.ceil(item.prepTimeMinutes / 60);
      const costSavings = wasteReduction * item.costPerServing;

      // Generate historical context
      const lastSimilarDay = dayOfWeek === 'weekend' ? 'Saturday' : 'Thursday';
      const historicalConsumption = Math.round(predictedDemand * (0.95 + Math.random() * 0.1));
      const historicalNote = `Last ${lastSimilarDay}: ${historicalConsumption} consumed, 92% accuracy`;

      // Calculate confidence based on factors
      const baseConfidence = 90;
      const occupancyVariance = Math.abs(occupancyRate - 75) / 75;
      const confidenceAdjustment = occupancyVariance * 10;
      const confidence = Math.max(75, Math.min(98, baseConfidence - confidenceAdjustment));

      return {
        menuItem: item.name,
        predictedDemand,
        recommendedPrepQty,
        estimatedWaste: optimizedWaste,
        prepStartTime,
        staffRequired,
        costSavings,
        ingredients: item.ingredients,
        confidence: Math.round(confidence),
        historicalNote,
      };
    });

    const totalWasteReduction = 28; // Average 28% reduction from 30% buffer to 10%
    const totalCostSavings = forecasts.reduce((sum, f) => sum + f.costSavings, 0);
    const staffEfficiency = 85 + Math.random() * 10;
    const systemAccuracy = 92;

    const endTime = performance.now();

    setResult({
      forecasts,
      totalWasteReduction,
      totalCostSavings,
      staffEfficiency,
      executionTime: endTime - startTime,
      systemAccuracy,
    });

    setIsOptimizing(false);
  };

  const getTodayDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    return `${days[today.getDay()]}, ${today.toLocaleDateString()}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breakfast':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'lunch':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'dinner':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🍽️ Kitchen Operations Optimization
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Chef-focused prep sheets, waste tracking, and ROI analysis
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-2 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('chef')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'chef'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              👨‍🍳 Chef&apos;s View
            </button>
            <button
              onClick={() => setViewMode('manager')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'manager'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              📊 Manager&apos;s View
            </button>
            <button
              onClick={() => setViewMode('historical')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                viewMode === 'historical'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              📈 Historical Tracking
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Today&apos;s Factors
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Occupancy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Occupancy: {occupancyRate}%
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={occupancyRate}
                onChange={(e) => setOccupancyRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {occupancyRate > 85
                  ? 'High occupancy - prep more'
                  : occupancyRate < 60
                  ? 'Low occupancy - prep less'
                  : 'Normal occupancy'}
              </div>
            </div>

            {/* Day Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Day Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDayOfWeek('weekday')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    dayOfWeek === 'weekday'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Weekday
                </button>
                <button
                  onClick={() => setDayOfWeek('weekend')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    dayOfWeek === 'weekend'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Weekend
                </button>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dayOfWeek === 'weekend' ? '+25% demand expected' : 'Normal weekday pattern'}
              </div>
            </div>

            {/* Special Event */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Special Event
              </label>
              <label className="flex items-center cursor-pointer bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                <input
                  type="checkbox"
                  checked={specialEvent}
                  onChange={(e) => setSpecialEvent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conference/Event Today
                </span>
              </label>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {specialEvent ? '+40% demand expected' : 'No special events'}
              </div>
            </div>
          </div>

          <button
            onClick={optimizeKitchenOperations}
            disabled={isOptimizing}
            className="w-full mt-6 py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isOptimizing ? 'Generating Prep Sheet...' : '🎯 Generate Prep Sheet'}
          </button>
        </div>

        {/* Content Views */}
        {result && (
          <>
            {/* CHEF'S VIEW */}
            {viewMode === 'chef' && (
              <div className="space-y-6">
                {/* Daily Brief */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
                    📋 Daily Prep Sheet - {getTodayDate()}
                  </h2>
                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Occupancy</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {occupancyRate}%
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Day Type</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                        {dayOfWeek}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Special Event
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {specialEvent ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        System Accuracy
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.systemAccuracy}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prep Instructions */}
                {result.forecasts.map((forecast, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-600"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {forecast.menuItem}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {forecast.historicalNote}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Confidence
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {forecast.confidence}%
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Prep Details */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          📊 Prep Requirements
                        </h4>
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">
                              Predicted Demand:
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {forecast.predictedDemand} servings
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-blue-600 dark:text-blue-400">
                              → PREP QUANTITY:
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">
                              {forecast.recommendedPrepQty} servings
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                              Safety buffer:
                            </span>
                            <span className="text-green-600 dark:text-green-400 font-semibold">
                              10% (vs 30% traditional)
                            </span>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">
                                Start prep at:
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {forecast.prepStartTime}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">
                                Staff required:
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {forecast.staffRequired} person
                                {forecast.staffRequired > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          🥘 Ingredients Needed
                        </h4>
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                          {forecast.ingredients.map((ing, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span className="text-gray-900 dark:text-white">{ing.item}</span>
                              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                {ing.qty}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                          <div className="text-sm text-green-700 dark:text-green-300">
                            💰 Expected savings vs over-prep:
                          </div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            +${forecast.costSavings.toFixed(0)}/day
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Safety & Data Entry Notes */}
                    <div className="mt-4 space-y-2">
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>⚠️ Safety Backup:</strong> If you run low during service, emergency
                          batch takes 15-20 minutes. No stockouts = 100% guest satisfaction.
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>📝 After Service:</strong> Count what&apos;s LEFT in the pan/tray (not consumed).
                          System calculates: Consumed = Prepped - Leftovers. Simpler than tracking who ate what!
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MANAGER'S VIEW */}
            {viewMode === 'manager' && (
              <div className="space-y-6">
                {/* ROI Overview */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-800 dark:to-emerald-800 rounded-xl shadow-lg p-8 text-white">
                  <h2 className="text-3xl font-bold mb-6">Monthly Performance Report</h2>

                  <div className="grid md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <div className="text-green-100 mb-1">Daily Cost Savings</div>
                      <div className="text-4xl font-bold">
                        ${result.totalCostSavings.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-green-100 mb-1">Monthly Projection</div>
                      <div className="text-4xl font-bold">
                        ${(result.totalCostSavings * 30).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-green-100 mb-1">Annual Projection</div>
                      <div className="text-4xl font-bold">
                        ${(result.totalCostSavings * 365).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-green-100 mb-1">System Cost</div>
                      <div className="text-4xl font-bold">$0</div>
                    </div>
                  </div>

                  <div className="border-t border-green-500 pt-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-green-100 mb-1">Waste Reduction</div>
                        <div className="text-2xl font-bold">
                          {result.totalWasteReduction.toFixed(0)}%
                        </div>
                        <div className="text-sm text-green-200">
                          Down from 30% to {(30 - result.totalWasteReduction).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-green-100 mb-1">System Accuracy</div>
                        <div className="text-2xl font-bold">{result.systemAccuracy}%</div>
                        <div className="text-sm text-green-200">Within ±10% of actual</div>
                      </div>
                      <div>
                        <div className="text-green-100 mb-1">Stockout Events</div>
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-green-200">Never ran out of food</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Cost Savings Breakdown
                  </h3>
                  <div className="space-y-4">
                    {result.forecasts.map((forecast, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                      >
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {forecast.menuItem}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Prep: {forecast.recommendedPrepQty} servings (10% buffer)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            +${forecast.costSavings.toFixed(0)}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">per day</div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t-2 border-slate-300 dark:border-slate-600 pt-4">
                      <div className="flex justify-between items-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          Total Daily Savings
                        </div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          ${result.totalCostSavings.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison: Traditional vs Optimized */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Traditional vs Optimized Approach
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h4 className="font-semibold text-red-900 dark:text-red-300 mb-3">
                        ❌ Traditional Kitchen (Before)
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <li>• Over-prep by 30-40% "to be safe"</li>
                        <li>• No data tracking or accountability</li>
                        <li>• Chef blamed for waste (defensive over-prep)</li>
                        <li>• No historical analysis or trends</li>
                        <li>• Monthly waste cost: ~$4,200</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-300 mb-3">
                        ✅ Optimized System (After)
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <li>• Smart buffer: Only 10-15% over predicted</li>
                        <li>• Full tracking: Predicted vs actual daily</li>
                        <li>• Data protects chef from blame</li>
                        <li>• Continuous learning from history</li>
                        <li>• Monthly waste cost: ~$1,800 (save $2,400)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORICAL TRACKING */}
            {viewMode === 'historical' && (
              <div className="space-y-6">
                {/* Accuracy Metrics */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    System Performance - Last 7 Days
                  </h2>
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Average Accuracy
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        94.8%
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Total Servings Saved
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        42
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Cost Savings (7 days)
                      </div>
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        $336
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Stockout Events
                      </div>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        0
                      </div>
                    </div>
                  </div>

                  {/* Historical Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                            Day
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Occupancy
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Event
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Predicted
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Prepped
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Leftovers
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Consumed
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Accuracy
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {historicalData.map((record, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {record.date}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                              {record.dayType}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                              {record.occupancy}%
                            </td>
                            <td className="px-4 py-3 text-center">
                              {record.hasEvent ? (
                                <span className="text-orange-600 dark:text-orange-400">✓</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                              {record.predicted}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-900 dark:text-white">
                              {record.prepped}
                            </td>
                            <td className="px-4 py-3 text-center text-orange-600 dark:text-orange-400">
                              {record.leftovers}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">
                              {record.consumed}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`font-semibold ${
                                  record.accuracy >= 90
                                    ? 'text-green-600 dark:text-green-400'
                                    : record.accuracy >= 80
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {record.accuracy}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Insights */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      💡 System Insights
                    </h4>
                    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      <li>
                        • <strong>Friday pattern detected:</strong> +8% demand vs weekday average
                        (93 consumed vs 86)
                      </li>
                      <li>
                        • <strong>Event accuracy improved:</strong> 94% on Wednesday (was 89% last
                        month)
                      </li>
                      <li>
                        • <strong>Leftover trend:</strong> Average 8 servings/day left (vs 25
                        traditional)
                      </li>
                      <li>
                        • <strong>Best day:</strong> Thursday (96% accuracy, only 11 leftovers)
                      </li>
                      <li>
                        • <strong>Recommendation:</strong> System confidence high - reduce buffer
                        to 8% for breakfast
                      </li>
                      <li>
                        • <strong>Data entry method:</strong> Staff counts leftovers in pan (simpler than tracking consumption)
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Trend Chart (Placeholder) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Prediction Accuracy Trend
                  </h3>
                  <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="text-center text-slate-500 dark:text-slate-400">
                      <div className="text-4xl mb-2">📈</div>
                      <div className="text-sm">
                        Chart visualization would show:
                        <br />
                        Predicted vs Actual consumption over time
                        <br />
                        Accuracy trending upward (82% → 95%)
                        <br />
                        Waste reduction (25 servings → 8 servings/day)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!result && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Configure today&apos;s factors and click &quot;Generate Prep Sheet&quot; to see
              chef-focused recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
