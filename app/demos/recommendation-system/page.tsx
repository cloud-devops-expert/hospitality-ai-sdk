/**
 * Recommendation System Demo - Hybrid Collaborative Filtering
 *
 * Three-View Architecture:
 * 1. Recommendations Generator - Interactive personalization tool
 * 2. Performance Metrics - ROI proof with conversion rates
 * 3. Historical - 30-day trends showing continuous improvement
 *
 * ROI: $900/month ($10,800/year) for 50-room hotel
 * Technology: Collaborative Filtering + Content-Based (Hybrid)
 * Performance: 20% conversion rate (4x improvement), 85% relevance
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

interface Recommendation {
  id: string;
  name: string;
  category: string;
  matchScore: number; // 0-100
  reason: string;
  price: string;
  tags: string[];
  icon: string;
}

interface DailyStats {
  date: string;
  day: string;
  totalGuests: number;
  sent: number;
  viewed: number;
  converted: number;
  clickThroughRate: number;
  conversionRate: number;
  accuracyScore: number;
  revenue: number;
  insight: string;
}

// ============================================================================
// Sample Data
// ============================================================================

const SCENARIOS = [
  { id: 'room', name: 'Room Upgrades', icon: '🛏️' },
  { id: 'dining', name: 'Menu Items', icon: '🍽️' },
  { id: 'spa', name: 'Spa Treatments', icon: '💆' },
  { id: 'activity', name: 'Activities', icon: '🎉' },
];

const PROFILES = [
  { id: 'business', name: 'Business Traveler', icon: '💼' },
  { id: 'family', name: 'Family Vacation', icon: '👨‍👩‍👧‍👦' },
  { id: 'couple', name: 'Romantic Couple', icon: '💑' },
  { id: 'wellness', name: 'Wellness Seeker', icon: '🧘' },
];

const RECOMMENDATIONS_DATA: Record<string, Record<string, Recommendation[]>> = {
  room: {
    business: [
      {
        id: '1',
        name: 'Executive Suite',
        category: 'Premium',
        matchScore: 94,
        reason: 'Work desk, fast WiFi, meeting area - matches your business travel preferences',
        price: '$249/night (+$80)',
        tags: ['WiFi', 'Desk', 'City View'],
        icon: '🏢',
      },
      {
        id: '2',
        name: 'Business Deluxe',
        category: 'Standard',
        matchScore: 88,
        reason: 'High floor, quiet, near conference rooms',
        price: '$179/night (+$10)',
        tags: ['Quiet', 'High Floor', 'WiFi'],
        icon: '💼',
      },
      {
        id: '3',
        name: 'Club Room',
        category: 'Premium',
        matchScore: 85,
        reason: 'Lounge access, complimentary breakfast',
        price: '$199/night (+$30)',
        tags: ['Lounge', 'Breakfast', 'WiFi'],
        icon: '⭐',
      },
    ],
    family: [
      {
        id: '4',
        name: 'Family Suite',
        category: 'Premium',
        matchScore: 96,
        reason: 'Two bedrooms, kitchenette, pool view - perfect for families',
        price: '$299/night (+$130)',
        tags: ['2 Bedrooms', 'Kitchenette', 'Pool View'],
        icon: '👨‍👩‍👧',
      },
      {
        id: '5',
        name: 'Connecting Rooms',
        category: 'Standard',
        matchScore: 91,
        reason: 'Privacy + proximity, kid-friendly amenities',
        price: '$229/night (+$60)',
        tags: ['Connected', 'Kid-Friendly', 'Large'],
        icon: '🚪',
      },
      {
        id: '6',
        name: 'Poolside Deluxe',
        category: 'Standard',
        matchScore: 87,
        reason: 'Direct pool access, family amenities',
        price: '$249/night (+$80)',
        tags: ['Pool Access', 'Family', 'Large'],
        icon: '🏊',
      },
    ],
    couple: [
      {
        id: '7',
        name: 'Honeymoon Suite',
        category: 'Luxury',
        matchScore: 98,
        reason: 'Private balcony, jacuzzi, sunset view - ultimate romance',
        price: '$399/night (+$230)',
        tags: ['Balcony', 'Jacuzzi', 'Sunset View'],
        icon: '💑',
      },
      {
        id: '8',
        name: 'Ocean View Suite',
        category: 'Premium',
        matchScore: 93,
        reason: 'Romantic setting, king bed, champagne',
        price: '$329/night (+$160)',
        tags: ['Ocean View', 'King Bed', 'Romantic'],
        icon: '🌊',
      },
      {
        id: '9',
        name: 'Garden Villa',
        category: 'Premium',
        matchScore: 89,
        reason: 'Private garden, outdoor shower',
        price: '$349/night (+$180)',
        tags: ['Garden', 'Private', 'Outdoor Shower'],
        icon: '🌺',
      },
    ],
    wellness: [
      {
        id: '10',
        name: 'Zen Suite',
        category: 'Premium',
        matchScore: 95,
        reason: 'Yoga mat, meditation area, herbal tea station',
        price: '$279/night (+$110)',
        tags: ['Yoga', 'Meditation', 'Quiet'],
        icon: '🧘',
      },
      {
        id: '11',
        name: 'Spa Room',
        category: 'Premium',
        matchScore: 91,
        reason: 'Near spa, aromatherapy, rain shower',
        price: '$259/night (+$90)',
        tags: ['Spa Access', 'Aromatherapy', 'Rain Shower'],
        icon: '💆',
      },
      {
        id: '12',
        name: 'Detox Villa',
        category: 'Luxury',
        matchScore: 88,
        reason: 'Juice bar, healthy mini-bar, air purifier',
        price: '$319/night (+$150)',
        tags: ['Healthy', 'Air Purifier', 'Quiet'],
        icon: '🥗',
      },
    ],
  },
  dining: {
    business: [
      {
        id: '13',
        name: 'Prime Ribeye Steak',
        category: 'Main Course',
        matchScore: 92,
        reason: 'Popular with business diners, classic choice',
        price: '$48',
        tags: ['Protein', 'Classic', 'Popular'],
        icon: '🥩',
      },
      {
        id: '14',
        name: 'Grilled Salmon',
        category: 'Main Course',
        matchScore: 88,
        reason: 'Healthy, quick service',
        price: '$36',
        tags: ['Healthy', 'Quick', 'Seafood'],
        icon: '🐟',
      },
      {
        id: '15',
        name: 'Caesar Salad',
        category: 'Appetizer',
        matchScore: 85,
        reason: 'Light, frequently paired with steak',
        price: '$14',
        tags: ['Light', 'Fresh', 'Classic'],
        icon: '🥗',
      },
    ],
  },
  spa: {
    wellness: [
      {
        id: '16',
        name: 'Deep Tissue Massage',
        category: 'Massage',
        matchScore: 96,
        reason: 'Highly rated for stress relief',
        price: '$120/90min',
        tags: ['Stress Relief', 'Deep', 'Therapeutic'],
        icon: '💆',
      },
      {
        id: '17',
        name: 'Aromatherapy Session',
        category: 'Wellness',
        matchScore: 91,
        reason: 'Relaxation with custom essential oils',
        price: '$95/60min',
        tags: ['Relaxation', 'Aromatherapy', 'Calming'],
        icon: '🌸',
      },
      {
        id: '18',
        name: 'Private Yoga Class',
        category: 'Fitness',
        matchScore: 89,
        reason: 'Mind-body wellness, personalized',
        price: '$85/60min',
        tags: ['Yoga', 'Private', 'Mindfulness'],
        icon: '🧘',
      },
    ],
  },
  activity: {
    family: [
      {
        id: '19',
        name: 'Family Snorkeling Tour',
        category: 'Water Sports',
        matchScore: 94,
        reason: 'Kid-friendly, safe, highly rated',
        price: '$45/person',
        tags: ['Family', 'Water', 'Adventure'],
        icon: '🤿',
      },
      {
        id: '20',
        name: 'Beach Games & Activities',
        category: 'Recreation',
        matchScore: 90,
        reason: 'All ages, included with stay',
        price: 'Included',
        tags: ['Family', 'Beach', 'Free'],
        icon: '🏖️',
      },
      {
        id: '21',
        name: 'Kids Club (Ages 4-12)',
        category: 'Childcare',
        matchScore: 87,
        reason: 'Supervised activities, parent break time',
        price: '$25/hour',
        tags: ['Kids', 'Supervised', 'Activities'],
        icon: '👶',
      },
    ],
  },
};

const HISTORICAL_DATA: DailyStats[] = [
  {
    date: '2024-10-25',
    day: 'Fri',
    totalGuests: 14,
    sent: 14,
    viewed: 6,
    converted: 3,
    clickThroughRate: 42.9,
    conversionRate: 21.4,
    accuracyScore: 88,
    revenue: 180,
    insight: 'Weekend surge - activity recommendations have 35% conversion rate',
  },
  {
    date: '2024-10-24',
    day: 'Thu',
    totalGuests: 12,
    sent: 12,
    viewed: 5,
    converted: 2,
    clickThroughRate: 41.7,
    conversionRate: 16.7,
    accuracyScore: 82,
    revenue: 120,
    insight: 'Business travelers prefer room upgrades 2.5x more than spa services',
  },
  {
    date: '2024-10-23',
    day: 'Wed',
    totalGuests: 15,
    sent: 15,
    viewed: 7,
    converted: 3,
    clickThroughRate: 46.7,
    conversionRate: 20.0,
    accuracyScore: 85,
    revenue: 180,
    insight: 'Optimal recommendation timing: 6 PM on check-in day (32% click-through)',
  },
  {
    date: '2024-10-22',
    day: 'Tue',
    totalGuests: 13,
    sent: 13,
    viewed: 5,
    converted: 2,
    clickThroughRate: 38.5,
    conversionRate: 15.4,
    accuracyScore: 80,
    revenue: 120,
    insight: 'Wellness seekers book spa services 3x more when offered in first 24 hours',
  },
  {
    date: '2024-10-21',
    day: 'Mon',
    totalGuests: 11,
    sent: 11,
    viewed: 5,
    converted: 2,
    clickThroughRate: 45.5,
    conversionRate: 18.2,
    accuracyScore: 84,
    revenue: 120,
    insight: 'Accuracy improved from 78% to 85% with guest feedback integration',
  },
  {
    date: '2024-10-20',
    day: 'Sun',
    totalGuests: 16,
    sent: 16,
    viewed: 7,
    converted: 4,
    clickThroughRate: 43.8,
    conversionRate: 25.0,
    accuracyScore: 87,
    revenue: 240,
    insight: 'Romantic couples have highest conversion rate (28%) for dining recommendations',
  },
  {
    date: '2024-10-19',
    day: 'Sat',
    totalGuests: 15,
    sent: 15,
    viewed: 6,
    converted: 3,
    clickThroughRate: 40.0,
    conversionRate: 20.0,
    accuracyScore: 86,
    revenue: 180,
    insight: 'Family guests book activities 60% more on weekends',
  },
];

const MONTHLY_INSIGHTS = [
  'Business travelers prefer room upgrades 2.5x more than spa services',
  'Family guests book activities 60% more on weekends',
  'Romantic couples have highest conversion rate (28%) for dining recommendations',
  'Wellness seekers book spa services 3x more when offered in first 24 hours',
  'Accuracy improved from 78% to 85% with guest feedback integration',
  'Optimal recommendation timing: 6 PM on check-in day (32% click-through)',
];

// ============================================================================
// Component
// ============================================================================

export default function RecommendationSystemDemo() {
  const [activeView, setActiveView] = useState<'generator' | 'performance' | 'historical'>(
    'generator'
  );
  const [selectedScenario, setSelectedScenario] = useState('room');
  const [selectedProfile, setSelectedProfile] = useState('business');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRecommendations = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const data =
      RECOMMENDATIONS_DATA[selectedScenario]?.[selectedProfile] ||
      RECOMMENDATIONS_DATA[selectedScenario]?.business ||
      [];

    setRecommendations(data);
    setIsGenerating(false);
  };

  const weeklyTotals = {
    totalGuests: HISTORICAL_DATA.reduce((sum, d) => sum + d.totalGuests, 0),
    sent: HISTORICAL_DATA.reduce((sum, d) => sum + d.sent, 0),
    viewed: HISTORICAL_DATA.reduce((sum, d) => sum + d.viewed, 0),
    converted: HISTORICAL_DATA.reduce((sum, d) => sum + d.converted, 0),
    revenue: HISTORICAL_DATA.reduce((sum, d) => sum + d.revenue, 0),
    avgClickThroughRate:
      HISTORICAL_DATA.reduce((sum, d) => sum + d.clickThroughRate, 0) / HISTORICAL_DATA.length,
    avgConversionRate:
      HISTORICAL_DATA.reduce((sum, d) => sum + d.conversionRate, 0) / HISTORICAL_DATA.length,
    avgAccuracyScore:
      HISTORICAL_DATA.reduce((sum, d) => sum + d.accuracyScore, 0) / HISTORICAL_DATA.length,
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
            🎯 Recommendation System
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
            Hybrid collaborative filtering + content-based personalization
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
              20% Conversion Rate
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
              85% Relevance Score
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
              4x Better Than Manual
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full">
              $50/month Cost
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs
          activeView={activeView}
          onViewChange={setActiveView as (view: string) => void}
          tabs={[
            { id: 'generator', label: 'Recommendations', icon: '🎯' },
            { id: 'performance', label: 'Performance', icon: '📊' },
            { id: 'historical', label: 'Historical', icon: '📈' },
          ]}
        />

        {/* View Content */}
        <div className="mt-6">
          {/* VIEW 1: Recommendations Generator */}
          {activeView === 'generator' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Controls */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Generate Recommendations
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    What to Recommend?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {SCENARIOS.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => setSelectedScenario(scenario.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedScenario === scenario.id
                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-4xl mb-2">{scenario.icon}</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {scenario.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    User Profile
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {PROFILES.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedProfile(profile.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedProfile === profile.id
                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-2xl mb-1">{profile.icon}</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {profile.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateRecommendations}
                  disabled={isGenerating}
                  className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'Get Recommendations'}
                </button>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 Use Cases
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Room upgrades (15-25% conversion)</li>
                    <li>• Menu recommendations (+10-20% spend)</li>
                    <li>• Spa upsells (30% fewer no-shows)</li>
                    <li>• Activity bookings (+satisfaction)</li>
                  </ul>
                </div>
              </div>

              {/* Recommendations Results */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Personalized Recommendations
                </h2>

                {recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{rec.icon}</div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {rec.name}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {rec.category}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                              {rec.matchScore}% Match
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                              {rec.price}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                          💡 {rec.reason}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {rec.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p>Select scenario and profile, then click &quot;Get Recommendations&quot;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: Performance Metrics */}
          {activeView === 'performance' && (
            <div className="space-y-6">
              {/* ROI Card */}
              <ROICard
                monthlyROI={900}
                annualROI={10800}
                description="Conservative estimate: 60 upsell conversions per month at $60 average value"
              />

              {/* Before/After Metrics */}
              <ROIMetrics
                title="Recommendation Performance"
                before={{
                  label: 'Manual/Random Recommendations',
                  metrics: [
                    { label: 'Conversion Rate', value: '5%', subtext: '10 of 200 offers' },
                    { label: 'Monthly Revenue', value: '$600', subtext: '10 × $60' },
                    { label: 'Guest Coverage', value: '50%', subtext: '200 of 400 guests' },
                    { label: 'Labor Cost', value: '$2,700', subtext: '90 hours/month' },
                  ],
                }}
                after={{
                  label: 'AI-Powered Personalization',
                  metrics: [
                    { label: 'Conversion Rate', value: '20%', subtext: '80 of 400 offers' },
                    { label: 'Monthly Revenue', value: '$4,800', subtext: '80 × $60' },
                    { label: 'Guest Coverage', value: '100%', subtext: '400 of 400 guests' },
                    { label: 'Labor Cost', value: '$450', subtext: '15 hours/month' },
                  ],
                }}
                improvement="+300%"
                improvementLabel="Conversion Rate Improvement"
              />

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Performance by Category
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left py-2 text-slate-600 dark:text-slate-400">
                          Category
                        </th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">Sent</th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">
                          Converted
                        </th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">Rate</th>
                        <th className="text-right py-2 text-slate-600 dark:text-slate-400">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr>
                        <td className="py-2 text-gray-900 dark:text-white">Room Upgrades</td>
                        <td className="text-right text-gray-900 dark:text-white">150</td>
                        <td className="text-right text-gray-900 dark:text-white">30</td>
                        <td className="text-right text-green-600 dark:text-green-400 font-semibold">
                          20%
                        </td>
                        <td className="text-right text-gray-900 dark:text-white">$1,800/mo</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-900 dark:text-white">Dining</td>
                        <td className="text-right text-gray-900 dark:text-white">100</td>
                        <td className="text-right text-gray-900 dark:text-white">25</td>
                        <td className="text-right text-green-600 dark:text-green-400 font-semibold">
                          25%
                        </td>
                        <td className="text-right text-gray-900 dark:text-white">$750/mo</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-900 dark:text-white">Spa Services</td>
                        <td className="text-right text-gray-900 dark:text-white">80</td>
                        <td className="text-right text-gray-900 dark:text-white">15</td>
                        <td className="text-right text-green-600 dark:text-green-400 font-semibold">
                          19%
                        </td>
                        <td className="text-right text-gray-900 dark:text-white">$900/mo</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-900 dark:text-white">Activities</td>
                        <td className="text-right text-gray-900 dark:text-white">70</td>
                        <td className="text-right text-gray-900 dark:text-white">10</td>
                        <td className="text-right text-green-600 dark:text-green-400 font-semibold">
                          14%
                        </td>
                        <td className="text-right text-gray-900 dark:text-white">$600/mo</td>
                      </tr>
                      <tr className="font-bold">
                        <td className="py-2 text-gray-900 dark:text-white">TOTAL</td>
                        <td className="text-right text-gray-900 dark:text-white">400</td>
                        <td className="text-right text-gray-900 dark:text-white">80</td>
                        <td className="text-right text-green-600 dark:text-green-400">20%</td>
                        <td className="text-right text-gray-900 dark:text-white">$4,050/mo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Cost Analysis
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Monthly Costs
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Infrastructure:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Data Storage:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Email Delivery:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$10</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Total Costs:
                        </span>
                        <span className="font-bold text-red-600 dark:text-red-400">$50</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Monthly Benefits
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Upsell Revenue:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$3,600</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Labor Savings:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">$2,250</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Total Benefits:
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          $5,850
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Net Monthly ROI:
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      $900
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Conservative estimate (realistic: $5,800/month)
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
                      key: 'totalGuests',
                      label: 'Guests',
                      format: TableFormatters.formatNumber,
                    },
                    { key: 'sent', label: 'Sent', format: TableFormatters.formatNumber },
                    { key: 'viewed', label: 'Viewed', format: TableFormatters.formatNumber },
                    {
                      key: 'converted',
                      label: 'Converted',
                      format: TableFormatters.formatNumber,
                    },
                    {
                      key: 'conversionRate',
                      label: 'Conv Rate',
                      format: TableFormatters.formatPercent,
                    },
                    {
                      key: 'accuracyScore',
                      label: 'Accuracy',
                      format: TableFormatters.formatPercent,
                    },
                    {
                      key: 'revenue',
                      label: 'Revenue',
                      format: TableFormatters.formatCurrency,
                    },
                  ]}
                />
              </div>

              {/* Weekly Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Weekly Summary
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {weeklyTotals.sent}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">
                      Recommendations Sent
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {weeklyTotals.converted}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      Conversions (20%)
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {weeklyTotals.avgAccuracyScore.toFixed(0)}%
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-400">
                      Avg Accuracy
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-300">
                      ${TableFormatters.formatNumber(weeklyTotals.revenue)}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-400">
                      Total Revenue
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Insights */}
              <InsightsBox title="System Learning Insights" insights={MONTHLY_INSIGHTS} />

              {/* Trend Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Monthly Trends
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Improving Metrics
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📈</span>
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            Conversion Rate: 15% → 20%
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            +33% improvement this month
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            Accuracy: 78% → 85%
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Guest feedback integration
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            Revenue: $800 → $1,200/week
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            +50% week-over-week
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Key Learnings
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          Business Travelers
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Room upgrades 2.5x more than spa
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          Romantic Couples
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          28% conversion for dining recs
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          Optimal Timing
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          6 PM check-in day (32% click-through)
                        </div>
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
