'use client';

import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type RelevanceLevel = 'high' | 'medium' | 'low';

interface SearchMatch {
  text: string;
  category: string;
  similarity: number;
}

interface SearchRecord {
  id: string;
  query: string;
  topMatch: SearchMatch;
  searchedBy: string;
  timestamp: string;
  flagged?: boolean;
  flagReason?: string;
}

interface DepartmentStats {
  department: string;
  searches: number;
  percentage: number;
  avgSimilarity: number;
  topQueries: string[];
}

interface ContentGap {
  topic: string;
  searchCount: number;
  avgSimilarity: number;
  status: string;
  recommendation: string;
}

interface DailyVolume {
  date: string;
  searches: number;
  highRel: number;
  medRel: number;
  lowRel: number;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const RECENT_SEARCHES: SearchRecord[] = [
  {
    id: '1',
    query: 'Can guests check in early without extra charge?',
    topMatch: {
      text: 'Early check-in (before 3:00 PM) is complimentary for loyalty members, subject to availability.',
      category: 'Check-in Policy',
      similarity: 0.89,
    },
    searchedBy: 'Front Desk Staff',
    timestamp: '3 minutes ago',
  },
  {
    id: '2',
    query: 'pet weight restrictions',
    topMatch: {
      text: 'Pet policy: Maximum 50 lbs per pet, up to 2 pets per room.',
      category: 'Pet Policy',
      similarity: 0.76,
    },
    searchedBy: 'Reservations',
    timestamp: '12 minutes ago',
  },
  {
    id: '3',
    query: 'early bird breakfast discount',
    topMatch: {
      text: 'Breakfast served 7:00 AM - 10:30 AM daily.',
      category: 'Dining FAQ',
      similarity: 0.38,
    },
    searchedBy: 'Concierge',
    timestamp: '25 minutes ago',
    flagged: true,
    flagReason: 'Low relevance - no doc found for early bird pricing',
  },
  {
    id: '4',
    query: 'pool hours in winter',
    topMatch: {
      text: 'Outdoor pool is heated and open year-round, 6:00 AM - 10:00 PM daily.',
      category: 'Amenities FAQ',
      similarity: 0.92,
    },
    searchedBy: 'Front Desk Staff',
    timestamp: '38 minutes ago',
  },
  {
    id: '5',
    query: 'extended stay weekly rate',
    topMatch: {
      text: 'Contact reservations for group bookings and extended stays.',
      category: 'Booking FAQ',
      similarity: 0.45,
    },
    searchedBy: 'Reservations',
    timestamp: '52 minutes ago',
    flagged: true,
    flagReason: 'Vague answer - need specific weekly/monthly pricing doc',
  },
];

const MONTHLY_STATS = {
  totalSearches: 1200,
  avgSimilarity: 78.2,
  highRelevance: 912,
  mediumRelevance: 192,
  lowRelevance: 96,
  avgTimePerSearch: 0.5,
  timeSavedPerDay: 2.4,
  monthlySavings: 520,
};

const RELEVANCE_BREAKDOWN = {
  high: { count: 912, percentage: 76.0 },
  medium: { count: 192, percentage: 16.0 },
  low: { count: 96, percentage: 8.0 },
};

const DEPARTMENT_USAGE: DepartmentStats[] = [
  {
    department: 'Front Desk',
    searches: 480,
    percentage: 40.0,
    avgSimilarity: 81.3,
    topQueries: ['Check-in rules', 'Pet policy', 'Parking rates'],
  },
  {
    department: 'Concierge',
    searches: 300,
    percentage: 25.0,
    avgSimilarity: 76.8,
    topQueries: ['Attraction hours', 'Restaurant reservations', 'Transportation'],
  },
  {
    department: 'Reservations',
    searches: 240,
    percentage: 20.0,
    avgSimilarity: 79.5,
    topQueries: ['Cancellation policy', 'Group rates', 'Special requests'],
  },
  {
    department: 'Housekeeping',
    searches: 120,
    percentage: 10.0,
    avgSimilarity: 74.2,
    topQueries: ['Cleaning protocols', 'Supply requests', 'Maintenance'],
  },
  {
    department: 'Management',
    searches: 60,
    percentage: 5.0,
    avgSimilarity: 82.7,
    topQueries: ['Compliance', 'Staff procedures', 'Policy updates'],
  },
];

const DAILY_VOLUME: DailyVolume[] = [
  { date: 'Mon 10/14', searches: 162, highRel: 125, medRel: 24, lowRel: 13 },
  { date: 'Tue 10/15', searches: 178, highRel: 138, medRel: 28, lowRel: 12 },
  { date: 'Wed 10/16', searches: 171, highRel: 132, medRel: 26, lowRel: 13 },
  { date: 'Thu 10/17', searches: 169, highRel: 129, medRel: 27, lowRel: 13 },
  { date: 'Fri 10/18', searches: 185, highRel: 143, medRel: 31, lowRel: 11 },
  { date: 'Sat 10/19', searches: 142, highRel: 106, medRel: 23, lowRel: 13 },
  { date: 'Sun 10/20', searches: 138, highRel: 103, medRel: 24, lowRel: 11 },
];

const CONTENT_GAPS: ContentGap[] = [
  {
    topic: 'Early Bird Breakfast Discount',
    searchCount: 18,
    avgSimilarity: 0.38,
    status: 'Missing Content',
    recommendation: 'Add breakfast pricing page with early bird special (6-7am discount)',
  },
  {
    topic: 'Extended Stay Discounts (7+ nights)',
    searchCount: 14,
    avgSimilarity: 0.42,
    status: 'Vague Policy',
    recommendation: 'Clarify weekly/monthly rate structure in Rates & Policies',
  },
  {
    topic: 'Pet Size Limits',
    searchCount: 11,
    avgSimilarity: 0.58,
    status: 'Conflicting Info',
    recommendation: 'Pet policy says "50 lbs max", FAQ says "small/medium pets only"',
  },
];

const MONTHLY_INSIGHTS = [
  {
    insight: '"Pool hours winter" asked 82 times - most popular query this month',
    action: 'Add seasonal hours prominently to Amenities page',
    impact: 'Could reduce 7% of search volume by surfacing this info',
  },
  {
    insight: 'Content update on 10/15: Pet policy clarity → similarity improved 62% to 91%',
    action: 'Demonstrates value of clear, specific documentation',
    impact: 'Staff find answers 3x faster after policy rewrite',
  },
  {
    insight: 'Concierge searches up 42% (200 → 284) - new staff training in progress',
    action: 'Normal spike during onboarding, shows system helps new hires',
    impact: 'New staff productive faster with self-serve search',
  },
];

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

function ViewTabs({
  activeView,
  onViewChange,
}: {
  activeView: string;
  onViewChange: (view: string) => void;
}) {
  const views = [
    { id: 'search', label: 'Search Interface', icon: '🔍' },
    { id: 'performance', label: 'Performance & ROI', icon: '📊' },
    { id: 'historical', label: 'Historical Analysis', icon: '📈' },
  ];

  return (
    <div className="flex space-x-2 mb-6 overflow-x-auto">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeView === view.id
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {view.icon} {view.label}
        </button>
      ))}
    </div>
  );
}

function ROICard({
  title,
  value,
  subtitle,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className={`${colorClasses[color]} p-4 rounded-lg`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-xs opacity-60 mt-1">{subtitle}</div>
      {trend && <div className="text-xs font-semibold mt-1">{trend}</div>}
    </div>
  );
}

function SimilarityBadge({ similarity }: { similarity: number }) {
  const getLevel = (sim: number): RelevanceLevel => {
    if (sim >= 0.7) return 'high';
    if (sim >= 0.5) return 'medium';
    return 'low';
  };

  const level = getLevel(similarity);

  const styles = {
    high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    low: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[level]}`}>
      {(similarity * 100).toFixed(0)}%
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SemanticSearchDemo() {
  const [activeView, setActiveView] = useState('search');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Semantic Search
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Find documents by meaning using Sentence-BERT + pgvector
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly ROI</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                $520
              </div>
              <div className="text-xs text-gray-500">$6,240/year</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <ROICard
              title="Avg Similarity"
              value="78.2%"
              subtitle="High relevance"
              trend="↑ +5% vs last month"
              color="green"
            />
            <ROICard
              title="Success Rate"
              value="89%"
              subtitle="vs 45% keyword search"
              color="blue"
            />
            <ROICard
              title="Time Saved"
              value="2.4 hrs"
              subtitle="Per day"
              color="purple"
            />
            <ROICard
              title="Search Speed"
              value="<25ms"
              subtitle="CPU-only inference"
              color="orange"
            />
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />

        {/* View 1: Search Interface */}
        {activeView === 'search' && (
          <div className="space-y-6">
            {/* Recent Searches */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Searches
              </h2>
              <div className="space-y-4">
                {RECENT_SEARCHES.map((search) => (
                  <div
                    key={search.id}
                    className={`p-4 rounded-lg border-2 ${
                      search.flagged
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-medium">{search.searchedBy}</span> •{' '}
                          {search.timestamp}
                        </div>
                        <div className="text-base font-medium text-gray-900 dark:text-white mb-2">
                          Query: "{search.query}"
                        </div>
                      </div>
                      <SimilarityBadge similarity={search.topMatch.similarity} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Top Match ({search.topMatch.category}):
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {search.topMatch.text}
                      </div>
                    </div>
                    {search.flagged && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                        ⚠️ {search.flagReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ⚡ Content Team Action Items
              </h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">🔴</span>
                  <span>
                    <strong>Add missing content</strong> for "early bird breakfast discount" (18
                    searches, 38% avg similarity - no relevant doc found)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">🟠</span>
                  <span>
                    <strong>Clarify vague policy</strong> for "extended stay weekly rates" (14
                    searches, 42% similarity - need specific pricing structure)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">🟡</span>
                  <span>
                    <strong>Fix conflicting info</strong> for "pet size limits" (Pet Policy says
                    "50 lbs max", FAQ says "small/medium pets" - which is correct?)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* View 2: Performance & ROI */}
        {activeView === 'performance' && (
          <div className="space-y-6">
            {/* ROI Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ROI Summary (This Month)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    $520
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</div>
                  <div className="text-xs text-gray-500 mt-1">$6,240/year projected</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {MONTHLY_STATS.totalSearches.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Searches</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {MONTHLY_STATS.avgTimePerSearch} min avg
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {MONTHLY_STATS.timeSavedPerDay} hrs
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Time Saved Daily
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(MONTHLY_STATS.timeSavedPerDay * 30).toFixed(0)} hrs/month
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    89%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                  <div className="text-xs text-gray-500 mt-1">vs 45% keyword search</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Calculation:</strong> Before: 2.7 hr/day × 30 days × $22/hr =
                  $1,782/month → After: 0.3 hr/day × 30 days × $22/hr = $198/month →{' '}
                  <strong className="text-green-600 dark:text-green-400">
                    Savings: $1,584/month - $40 infrastructure = $520/month net (conservative)
                  </strong>
                </div>
              </div>
            </div>

            {/* Search Quality Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Search Quality Metrics
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {RELEVANCE_BREAKDOWN.high.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    High Relevance (≥70%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {RELEVANCE_BREAKDOWN.high.percentage}% of searches
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {RELEVANCE_BREAKDOWN.medium.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Medium Relevance (50-69%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {RELEVANCE_BREAKDOWN.medium.percentage}% of searches
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {RELEVANCE_BREAKDOWN.low.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Low Relevance (&lt;50%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {RELEVANCE_BREAKDOWN.low.percentage}% (content gaps)
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average similarity: <strong>{MONTHLY_STATS.avgSimilarity}%</strong> • Search
                speed: <strong>&lt;25ms</strong> • Success rate:{' '}
                <strong>
                  {((RELEVANCE_BREAKDOWN.high.count / MONTHLY_STATS.totalSearches) * 100).toFixed(
                    0
                  )}
                  %
                </strong>
              </div>
            </div>

            {/* Department Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Usage by Department ({MONTHLY_STATS.totalSearches.toLocaleString()} searches this
                month)
              </h2>
              <div className="space-y-4">
                {DEPARTMENT_USAGE.map((dept, idx) => (
                  <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {dept.department}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          {dept.searches.toLocaleString()} searches ({dept.percentage}%)
                        </span>
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Avg: {dept.avgSimilarity}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Top queries: {dept.topQueries.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View 3: Historical Analysis */}
        {activeView === 'historical' && (
          <div className="space-y-6">
            {/* 7-Day Volume */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                7-Day Search Volume
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Total
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                        High
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-yellow-600 dark:text-yellow-400">
                        Medium
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-red-600 dark:text-red-400">
                        Low
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAILY_VOLUME.map((day, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{day.date}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {day.searches}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {day.highRel}
                        </td>
                        <td className="py-3 px-4 text-right text-yellow-600 dark:text-yellow-400">
                          {day.medRel}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                          {day.lowRel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        7-Day Total
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.searches, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.highRel, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-yellow-600 dark:text-yellow-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.medRel, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600 dark:text-red-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.lowRel, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Peak search times: 10am-12pm, 3pm-5pm • Weekend volume 20% lower than weekdays
              </div>
            </div>

            {/* Content Gap Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Content Gap Analysis (Top 3)
              </h2>
              <div className="space-y-4">
                {CONTENT_GAPS.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                          {gap.topic}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{gap.searchCount} searches</span> • Avg
                          similarity:{' '}
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            {(gap.avgSimilarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full">
                        {gap.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border border-red-200 dark:border-red-800">
                      <strong>Recommendation:</strong> {gap.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📊 Monthly Insights & Actions
              </h2>
              <div className="space-y-4">
                {MONTHLY_INSIGHTS.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      💡 {item.insight}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Action:</strong> {item.action}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      <strong>Impact:</strong> {item.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Search Quality Trends (30 Days)
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Avg Similarity
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    74.8% → 78.2%
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                    ↑ +5% improvement
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Low-Relevance Rate
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    12% → 8%
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    ↓ 33% reduction
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Content Gaps
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    14 → 6 topics
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                    ↓ 57% improvement
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technology Details */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🔧 Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Sentence-BERT Model
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• all-MiniLM-L6-v2 (22M params)</li>
                <li>• 82.4% STS benchmark score</li>
                <li>• 384-dim embeddings</li>
                <li>• 8-12ms encoding time (CPU)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                pgvector Search
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• PostgreSQL vector extension</li>
                <li>• 203 documents indexed</li>
                <li>• IVFFlat cosine similarity</li>
                <li>• 5-10ms search time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Cost-Conscious Design
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• $0 API costs (fully local)</li>
                <li>• CPU-only (no GPU needed)</li>
                <li>• ACID compliance (Postgres)</li>
                <li>• $40/month shared hosting</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why Semantic Search?</strong> Meaning-based search finds relevant documents
              even with different wording. Example: Query "Can I bring my dog?" matches "We are a
              pet-friendly hotel" (87% similarity) despite sharing no common words. Traditional
              keyword search fails; semantic search succeeds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
