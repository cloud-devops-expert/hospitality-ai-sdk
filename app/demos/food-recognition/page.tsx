/**
 * Food Recognition Demo - Computer Vision for Waste Reduction
 *
 * Three-View Architecture:
 * 1. Waste Monitor - Real-time food waste tracking
 * 2. Performance Metrics - ROI proof and waste reduction
 * 3. Historical - 30-day trends showing continuous improvement
 *
 * ROI: $800/month ($9,600/year) for 50-room hotel restaurant
 * Technology: ResNet-50 image classification
 * Performance: 88% accuracy, <500ms inference, 30% waste reduction
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ViewTabs,
  ROICard,
  ROIMetrics,
  HistoricalTable,
  InsightsBox,
  TableFormatters,
} from '@/components/demos/shared';

// ============================================================================
// Types
// ============================================================================

interface WasteItem {
  id: string;
  timestamp: string;
  foodName: string;
  category: string;
  wastePercentage: number;
  estimatedValue: number;
  mealPeriod: string;
  confidence: number;
  emoji: string;
}

interface DailyStats {
  date: string;
  day: string;
  itemsServed: number;
  itemsWasted: number;
  wastePercentage: number;
  wasteCost: number;
  accuracy: number;
  insight: string;
}

// ============================================================================
// Sample Data
// ============================================================================

const RECENT_WASTE: WasteItem[] = [
  {
    id: '1',
    timestamp: '2024-10-25 13:45',
    foodName: 'Caesar Salad',
    category: 'Salads',
    wastePercentage: 45,
    estimatedValue: 8,
    mealPeriod: 'Lunch',
    confidence: 92,
    emoji: '🥗',
  },
  {
    id: '2',
    timestamp: '2024-10-25 13:42',
    foodName: 'French Fries',
    category: 'Sides',
    wastePercentage: 35,
    estimatedValue: 3,
    mealPeriod: 'Lunch',
    confidence: 95,
    emoji: '🍟',
  },
  {
    id: '3',
    timestamp: '2024-10-25 13:38',
    foodName: 'Grilled Chicken',
    category: 'Meat',
    wastePercentage: 20,
    estimatedValue: 6,
    mealPeriod: 'Lunch',
    confidence: 89,
    emoji: '🍗',
  },
  {
    id: '4',
    timestamp: '2024-10-25 13:35',
    foodName: 'Pasta Primavera',
    category: 'Pasta',
    wastePercentage: 40,
    estimatedValue: 7,
    mealPeriod: 'Lunch',
    confidence: 87,
    emoji: '🍝',
  },
  {
    id: '5',
    timestamp: '2024-10-25 13:30',
    foodName: 'Chocolate Cake',
    category: 'Desserts',
    wastePercentage: 25,
    estimatedValue: 5,
    mealPeriod: 'Lunch',
    confidence: 94,
    emoji: '🍰',
  },
];

const TODAY_SUMMARY = {
  totalWasted: 45,
  totalValue: 180,
  topWasted: [
    { name: 'Caesar Salad', value: 35, count: 15 },
    { name: 'Ribeye Steak', value: 28, count: 4 },
    { name: 'French Fries', value: 22, count: 18 },
  ],
  byMealPeriod: [
    { period: 'Breakfast', percentage: 12 },
    { period: 'Lunch', percentage: 32 },
    { period: 'Dinner', percentage: 56 },
  ],
};

const HISTORICAL_DATA: DailyStats[] = [
  {
    date: '2024-10-25',
    day: 'Fri',
    itemsServed: 150,
    itemsWasted: 24,
    wastePercentage: 16.0,
    wasteCost: 192,
    accuracy: 90,
    insight: 'Lowest waste day - reduced Caesar Salad portions working',
  },
  {
    date: '2024-10-24',
    day: 'Thu',
    itemsServed: 148,
    itemsWasted: 28,
    wastePercentage: 18.9,
    wasteCost: 224,
    accuracy: 87,
    insight: 'Lunch peak caused higher waste - 32% during rush',
  },
  {
    date: '2024-10-23',
    day: 'Wed',
    itemsServed: 145,
    itemsWasted: 26,
    wastePercentage: 17.9,
    wasteCost: 208,
    accuracy: 88,
    insight: 'Normal day - waste within target range',
  },
  {
    date: '2024-10-22',
    day: 'Tue',
    itemsServed: 152,
    itemsWasted: 29,
    wastePercentage: 19.1,
    wasteCost: 232,
    accuracy: 86,
    insight: 'Tuesday dinner event increased waste',
  },
  {
    date: '2024-10-21',
    day: 'Mon',
    itemsServed: 140,
    itemsWasted: 25,
    wastePercentage: 17.9,
    wasteCost: 200,
    accuracy: 89,
    insight: 'Monday low volume - good waste control',
  },
  {
    date: '2024-10-20',
    day: 'Sun',
    itemsServed: 165,
    itemsWasted: 32,
    wastePercentage: 19.4,
    wasteCost: 256,
    accuracy: 85,
    insight: 'Weekend brunch higher waste - adjust portions',
  },
  {
    date: '2024-10-19',
    day: 'Sat',
    itemsServed: 158,
    itemsWasted: 30,
    wastePercentage: 19.0,
    wasteCost: 240,
    accuracy: 88,
    insight: 'Saturday dinner busy - waste management good',
  },
];

const MONTHLY_INSIGHTS = [
  'Waste rate decreased from 25% to 18% in 30 days (28% reduction)',
  'Caesar Salad portions reduced by 20% - waste dropped from 40% to 22%',
  'Weekend dinner waste 15% higher than weekdays - adjusted menu',
  'Lunch rush (12-1 PM) highest waste - prep-to-order for salads',
  'Recognition accuracy improved from 82% to 88% with feedback',
  'Steak waste reduced 50% after kitchen training on doneness',
];

const TOP_WASTED_ITEMS = [
  { name: 'Caesar Salad', timesWasted: 85, avgWaste: 40, monthlyCost: 680, action: 'Reduce portion' },
  { name: 'French Fries', timesWasted: 72, avgWaste: 30, monthlyCost: 360, action: 'Offer small' },
  { name: 'Ribeye Steak', timesWasted: 45, avgWaste: 25, monthlyCost: 540, action: 'Check quality' },
  { name: 'Pasta Primavera', timesWasted: 62, avgWaste: 35, monthlyCost: 496, action: 'Reduce portion' },
];

// ============================================================================
// Component
// ============================================================================

export default function FoodRecognitionDemo() {
  const [activeView, setActiveView] = useState<'monitor' | 'performance' | 'historical'>('monitor');

  const weeklyTotals = {
    itemsServed: HISTORICAL_DATA.reduce((sum, d) => sum + d.itemsServed, 0),
    itemsWasted: HISTORICAL_DATA.reduce((sum, d) => sum + d.itemsWasted, 0),
    totalWasteCost: HISTORICAL_DATA.reduce((sum, d) => sum + d.wasteCost, 0),
    avgWastePercentage:
      HISTORICAL_DATA.reduce((sum, d) => sum + d.wastePercentage, 0) / HISTORICAL_DATA.length,
    avgAccuracy: HISTORICAL_DATA.reduce((sum, d) => sum + d.accuracy, 0) / HISTORICAL_DATA.length,
  };

  const getWasteColor = (percentage: number) => {
    if (percentage < 10) return 'text-green-600 dark:text-green-400';
    if (percentage < 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
            🍕 Food Recognition
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
            Computer vision-powered waste monitoring for kitchen operations
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
              88% Accuracy
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
              30% Waste Reduction
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
              ResNet-50
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full">
              $0 API Cost
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs
          activeView={activeView}
          onViewChange={setActiveView as (view: string) => void}
          tabs={[
            { id: 'monitor', label: 'Waste Monitor', icon: '📸' },
            { id: 'performance', label: 'Performance', icon: '📊' },
            { id: 'historical', label: 'Historical', icon: '📈' },
          ]}
        />

        {/* View Content */}
        <div className="mt-6">
          {/* VIEW 1: Waste Monitor */}
          {activeView === 'monitor' && (
            <div className="space-y-6">
              {/* Today's Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Total Wasted Today
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {TODAY_SUMMARY.totalWasted}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">items</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Waste Value</div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    ${TODAY_SUMMARY.totalValue}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">today</div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Top Wasted Item
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {TODAY_SUMMARY.topWasted[0].name}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">
                    ${TODAY_SUMMARY.topWasted[0].value}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Peak Period</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Dinner</div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    {TODAY_SUMMARY.byMealPeriod[2].percentage}% of waste
                  </div>
                </div>
              </div>

              {/* Recent Waste Feed */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Recent Waste Detected
                </h2>
                <div className="space-y-3">
                  {RECENT_WASTE.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-slate-300 dark:border-slate-600"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{item.emoji}</div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.foodName}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {item.category} • {item.mealPeriod} • {item.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getWasteColor(item.wastePercentage)}`}>
                          {item.wastePercentage}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          ${item.estimatedValue} waste
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {item.confidence}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High-Waste Alerts */}
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-4">
                  ⚠️ High-Waste Alerts
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-red-800 dark:text-red-300">
                      Caesar Salad: 15 servings wasted today
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      40% waste rate - Review portion size
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-orange-800 dark:text-orange-300">
                      Ribeye Steak: 8 servings with &gt;50% waste
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Check cooking quality and doneness
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="font-semibold text-yellow-800 dark:text-yellow-300">
                      French Fries: Popular but 30% waste
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Offer smaller portions as option
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: Performance Metrics */}
          {activeView === 'performance' && (
            <div className="space-y-6">
              {/* ROI Card */}
              <ROICard
                monthlyROI={800}
                annualROI={9600}
                description="Conservative estimate: 20% waste reduction + labor savings"
              />

              {/* Before/After Metrics */}
              <ROIMetrics
                title="Waste Reduction Performance"
                before={{
                  label: 'Manual Tracking',
                  metrics: [
                    { label: 'Waste Rate', value: '25%', subtext: '1,125 items/month' },
                    { label: 'Monthly Cost', value: '$9,000', subtext: '1,125 × $8' },
                    { label: 'Tracking Time', value: '60 hrs', subtext: '$1,800 labor' },
                    { label: 'Visibility', value: 'Low', subtext: 'No item-level data' },
                  ],
                }}
                after={{
                  label: 'AI-Powered Monitoring',
                  metrics: [
                    { label: 'Waste Rate', value: '18%', subtext: '810 items/month' },
                    { label: 'Monthly Cost', value: '$6,480', subtext: '810 × $8' },
                    { label: 'Tracking Time', value: '5 hrs', subtext: '$150 labor' },
                    { label: 'Visibility', value: 'High', subtext: 'Item-level insights' },
                  ],
                }}
                improvement="-28%"
                improvementLabel="Waste Reduction"
              />

              {/* Top Wasted Items */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Top Wasted Items (Action Opportunities)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left py-2 text-slate-600 dark:text-slate-400">
                          Food Item
                        </th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">
                          Times Wasted
                        </th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">
                          Avg Waste %
                        </th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">
                          Monthly Cost
                        </th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {TOP_WASTED_ITEMS.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 text-gray-900 dark:text-white">{item.name}</td>
                          <td className="text-right text-gray-900 dark:text-white">
                            {item.timesWasted}
                          </td>
                          <td className="text-right text-red-600 dark:text-red-400 font-semibold">
                            {item.avgWaste}%
                          </td>
                          <td className="text-right text-gray-900 dark:text-white">
                            ${item.monthlyCost}
                          </td>
                          <td className="text-right text-blue-600 dark:text-blue-400">
                            {item.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recognition Accuracy */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Recognition Performance
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Overall Accuracy
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">88%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Correctly identified
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Processing Speed
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">350ms</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Average per image
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      False Positives
                    </div>
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">8%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Misidentified items
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Accuracy by Category
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Meat/Poultry:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Desserts:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">90%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Salads:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">86%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Soups:</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">82%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Mixed Dishes:</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">78%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Historical Performance */}
          {activeView === 'historical' && (
            <div className="space-y-6">
              {/* Historical Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    7-Day Performance History
                  </h3>
                </div>
                <HistoricalTable
                  data={HISTORICAL_DATA}
                  columns={[
                    { key: 'date', label: 'Date', format: TableFormatters.formatDate },
                    {
                      key: 'itemsServed',
                      label: 'Served',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'itemsWasted',
                      label: 'Wasted',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'wastePercentage',
                      label: 'Waste %',
                      format: TableFormatters.formatPercent,
                    },
                    {
                      key: 'wasteCost',
                      label: 'Cost',
                      format: TableFormatters.formatCurrency,
                    },
                    {
                      key: 'accuracy',
                      label: 'Accuracy',
                      format: TableFormatters.formatPercent,
                    },
                  ]}
                />
              </div>

              {/* Weekly Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Weekly Summary (7 Days)
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {weeklyTotals.itemsServed}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">Items Served</div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-900 dark:text-red-300">
                      {weeklyTotals.itemsWasted}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-400">
                      Items Wasted ({weeklyTotals.avgWastePercentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                      ${TableFormatters.formatNumber(weeklyTotals.totalWasteCost)}
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-400">Waste Cost</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {weeklyTotals.avgAccuracy.toFixed(0)}%
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      Avg Accuracy
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Insights */}
              <InsightsBox title="System Learning Insights (30 Days)" insights={MONTHLY_INSIGHTS} />

              {/* Trend Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  30-Day Improvement Trends
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📉</span>
                    <div className="flex-1">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        Waste Rate: 25% → 18%
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        28% reduction in food waste
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div className="flex-1">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        Cost: $9,000 → $6,480/month
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        $2,520/month savings
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div className="flex-1">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        Accuracy: 82% → 88%
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Continuous improvement with feedback
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍🍳</span>
                    <div className="flex-1">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        Labor: 60 hrs → 5 hrs/month
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        $1,650/month labor savings
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
