'use client';

import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Priority = 'high' | 'medium' | 'low';
type ContentType = 'Guest Review' | 'Shift Report' | 'Email Thread' | 'Meeting Notes';

interface SummaryItem {
  id: string;
  type: ContentType;
  originalText: string;
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  priority: Priority;
  timestamp: string;
  source: string;
  flagged?: boolean;
  flagReason?: string;
}

interface ContentTypeStats {
  type: string;
  count: number;
  percentage: number;
  avgCompression: number;
  avgLength: number;
  topThemes: string[];
}

interface DailyVolume {
  date: string;
  reviews: number;
  reports: number;
  emails: number;
  notes: number;
  total: number;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const PENDING_SUMMARIES: SummaryItem[] = [
  {
    id: '1',
    type: 'Guest Review',
    originalText: 'Our stay was wonderful! Staff incredibly friendly, especially Maria at front desk who went above and beyond for early check-in. Room spotlessly clean, bed extremely comfortable. Complimentary breakfast had great variety. Perfect location - walking distance to attractions. Only minor issue: pool was a bit cold, but understandable given season. Highly recommend!',
    summary: 'Excellent stay. Friendly staff (Maria praised). Clean room, comfortable bed. Great breakfast variety. Perfect location. Pool slightly cold. Highly recommend.',
    originalLength: 387,
    summaryLength: 142,
    compressionRatio: 63,
    priority: 'high',
    timestamp: '8 minutes ago',
    source: 'TripAdvisor',
  },
  {
    id: '2',
    type: 'Shift Report',
    originalText: 'Morning shift was busy with 18 check-ins and 12 check-outs. Kitchen staff shortage due to 2 call-outs (flu). Guest in Room 305 reported AC not working - maintenance notified at 11:15am. Pool towel inventory running low, ordered more. Late checkout request Room 412 approved. No other incidents. Overall smooth operations despite staffing challenges.',
    summary: 'Busy morning: 18 check-ins, 12 check-outs. Kitchen staff shortage (2 called sick). AC issue Room 305 reported, maintenance notified. Pool towel inventory low. Smooth operations overall.',
    originalLength: 312,
    summaryLength: 108,
    compressionRatio: 65,
    priority: 'high',
    timestamp: '32 minutes ago',
    source: 'Front Desk Report',
    flagged: true,
    flagReason: 'Kitchen staffing issue requires immediate attention',
  },
  {
    id: '3',
    type: 'Email Thread',
    originalText: 'RE: RE: RE: Conference Room Booking Request. After back-and-forth with sales team and client, confirmed conference room booking for March 15, 3pm-6pm. Client needs 40-person capacity (we can accommodate). AV equipment requested (projector, screen, microphones). Catering arranged through our kitchen (coffee service + pastries at 3pm, light snacks at 5pm). Parking validation for 40 vehicles approved. Client will send attendee list by March 10. Follow-up meeting scheduled for final details.',
    summary: 'Conference room booking confirmed for March 15, 3pm-6pm. 40-person capacity. AV equipment requested. Catering arranged (coffee/pastries). Parking validated.',
    originalLength: 495,
    summaryLength: 127,
    compressionRatio: 74,
    priority: 'medium',
    timestamp: '1 hour ago',
    source: 'Sales Team',
  },
  {
    id: '4',
    type: 'Meeting Notes',
    originalText: 'Weekly management meeting notes. Discussed Q2 revenue targets, occupancy projections, and marketing initiatives. Action items: (1) Finalize summer pricing strategy by April 1, (2) Launch social media campaign highlighting pool amenities, (3) Schedule HVAC maintenance before June, (4) Review competitor analysis from John. Next meeting April 5.',
    summary: 'Q2 targets discussed. Action items: Finalize summer pricing (Apr 1), launch pool marketing campaign, schedule HVAC maintenance (before June). Next meeting Apr 5.',
    originalLength: 320,
    summaryLength: 98,
    compressionRatio: 69,
    priority: 'medium',
    timestamp: '3 hours ago',
    source: 'Management Team',
  },
  {
    id: '5',
    type: 'Guest Review',
    originalText: 'Disappointing stay. Check-in process took 45 minutes due to system issues. Room had strong cigarette smell despite being non-smoking. Requested room change but told hotel was fully booked. Air conditioning made loud rattling noise throughout night. Breakfast options limited and lukewarm. Location is convenient but overall experience did not meet expectations for the price.',
    summary: 'Disappointing stay. 45-min check-in (system issues). Room had cigarette smell, no change available (full occupancy). AC noisy. Breakfast limited/lukewarm. Convenient location but poor value.',
    originalLength: 342,
    summaryLength: 128,
    compressionRatio: 63,
    priority: 'high',
    timestamp: '4 hours ago',
    source: 'Google Reviews',
    flagged: true,
    flagReason: 'Multiple service failures - immediate follow-up needed',
  },
];

const MONTHLY_STATS = {
  totalSummaries: 1350,
  avgCompressionRatio: 75.3,
  avgSummaryLength: 118,
  avgProcessingTime: 1.15,
  timeSavedPerDay: 2.6,
  monthlySavings: 480,
};

const CONTENT_TYPE_USAGE: ContentTypeStats[] = [
  {
    type: 'Guest Reviews',
    count: 750,
    percentage: 55.6,
    avgCompression: 76.2,
    avgLength: 387,
    topThemes: ['Staff friendly', 'Clean room', 'Great location'],
  },
  {
    type: 'Shift Reports',
    count: 450,
    percentage: 33.3,
    avgCompression: 74.1,
    avgLength: 312,
    topThemes: ['Check-in/out count', 'Maintenance issues', 'Staffing'],
  },
  {
    type: 'Email Threads',
    count: 100,
    percentage: 7.4,
    avgCompression: 82.5,
    avgLength: 495,
    topThemes: ['Bookings', 'Guest requests', 'Vendor communication'],
  },
  {
    type: 'Meeting Notes',
    count: 50,
    percentage: 3.7,
    avgCompression: 71.8,
    avgLength: 320,
    topThemes: ['Action items', 'Decisions', 'Follow-ups'],
  },
];

const DAILY_VOLUME: DailyVolume[] = [
  { date: 'Mon 10/14', reviews: 105, reports: 62, emails: 14, notes: 7, total: 188 },
  { date: 'Tue 10/15', reviews: 112, reports: 68, emails: 16, notes: 8, total: 204 },
  { date: 'Wed 10/16', reviews: 108, reports: 64, emails: 13, notes: 6, total: 191 },
  { date: 'Thu 10/17', reviews: 115, reports: 70, emails: 17, notes: 9, total: 211 },
  { date: 'Fri 10/18', reviews: 125, reports: 75, emails: 18, notes: 10, total: 228 },
  { date: 'Sat 10/19', reviews: 98, reports: 58, emails: 11, notes: 5, total: 172 },
  { date: 'Sun 10/20', reviews: 87, reports: 53, emails: 11, notes: 5, total: 156 },
];

const MONTHLY_INSIGHTS = [
  {
    insight: '"AC/heating" mentioned in 47 reviews this month (up 65% vs last month)',
    action: 'Schedule HVAC system inspection before summer season',
    impact: 'Prevent guest complaints, improve satisfaction scores',
  },
  {
    insight: 'Email thread summaries reduced full-read time by 18 min/day',
    action: 'Managers now read 7 full emails vs 25 previously (72% reduction)',
    impact: 'Time savings allow focus on strategic tasks vs email triage',
  },
  {
    insight: 'Shift reports 22% longer on weekends - more incidents documented',
    action: 'Consider additional weekend supervisor to handle increased volume',
    impact: 'Improve weekend operations, reduce incident response time',
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
    { id: 'queue', label: 'Summarization Queue', icon: '📝' },
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

function PriorityBadge({ priority }: { priority: Priority }) {
  const styles = {
    high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[priority]}`}>
      {priority.toUpperCase()}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TextSummarizationDemo() {
  const [activeView, setActiveView] = useState('queue');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Text Summarization
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Auto-summarize reviews, reports, emails using DistilBART
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly ROI</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                $480
              </div>
              <div className="text-xs text-gray-500">$5,760/year</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <ROICard
              title="Compression Ratio"
              value="75%"
              subtitle="Avg compression"
              color="green"
            />
            <ROICard
              title="Processing Time"
              value="<1.2s"
              subtitle="CPU-only inference"
              color="blue"
            />
            <ROICard
              title="Time Saved"
              value="2.6 hrs"
              subtitle="Per day"
              color="purple"
            />
            <ROICard
              title="Coverage"
              value="100%"
              subtitle="vs 30% manual"
              trend="↑ 70% increase"
              color="orange"
            />
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />

        {/* View 1: Summarization Queue */}
        {activeView === 'queue' && (
          <div className="space-y-6">
            {/* Pending Summaries */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Summaries (Last 5)
              </h2>
              <div className="space-y-4">
                {PENDING_SUMMARIES.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 ${
                      item.flagged
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {item.type}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.source}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                      <PriorityBadge priority={item.priority} />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800 mb-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Summary ({item.summaryLength} chars, {item.compressionRatio}% compression):
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.summary}
                      </div>
                    </div>

                    <details className="group">
                      <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        View original ({item.originalLength} chars)
                      </summary>
                      <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                        {item.originalText}
                      </div>
                    </details>

                    {item.flagged && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                        ⚠️ {item.flagReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ⚡ Management Action Items
              </h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">🔴</span>
                  <span>
                    <strong>Immediate follow-up</strong> on disappointing review (Room cigarette
                    smell, AC noise, 45-min check-in) - contact guest for service recovery
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">🟠</span>
                  <span>
                    <strong>Address staffing</strong>: Kitchen shortage (2 call-outs) impacting
                    operations - review backup staffing plan
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">🟡</span>
                  <span>
                    <strong>Verify AC repair</strong> for Room 305 (reported 11:15am) - confirm
                    maintenance completion and guest satisfaction
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
                    $480
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</div>
                  <div className="text-xs text-gray-500 mt-1">$5,760/year projected</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {MONTHLY_STATS.totalSummaries.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Items Summarized</div>
                  <div className="text-xs text-gray-500 mt-1">45/day average</div>
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
                    {MONTHLY_STATS.avgCompressionRatio}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Compression</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {MONTHLY_STATS.avgSummaryLength} chars avg
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Calculation:</strong> Before: 3 hr/day × 30 days × $28/hr =
                  $2,520/month → After: 0.375 hr/day × 30 days × $28/hr = $315/month →{' '}
                  <strong className="text-green-600 dark:text-green-400">
                    Savings: $2,205/month - $30 infrastructure = $480/month net (conservative)
                  </strong>
                </div>
              </div>
            </div>

            {/* Content Type Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Usage by Content Type ({MONTHLY_STATS.totalSummaries.toLocaleString()} items)
              </h2>
              <div className="space-y-4">
                {CONTENT_TYPE_USAGE.map((type, idx) => (
                  <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {type.type}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          {type.count.toLocaleString()} items ({type.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {type.avgCompression.toFixed(1)}% compression
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Avg length: {type.avgLength} chars • Top themes: {type.topThemes.join(', ')}
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
                7-Day Summarization Volume
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        Reviews
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                        Reports
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">
                        Emails
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-orange-600 dark:text-orange-400">
                        Notes
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Total
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
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                          {day.reviews}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {day.reports}
                        </td>
                        <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400">
                          {day.emails}
                        </td>
                        <td className="py-3 px-4 text-right text-orange-600 dark:text-orange-400">
                          {day.notes}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {day.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        7-Day Total
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.reviews, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.reports, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-purple-600 dark:text-purple-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.emails, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-orange-600 dark:text-orange-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.notes, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.total, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Peak summarization times: 10am (shift reports), 5pm (end-of-day emails) • Weekends
                25% lower volume
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
                DistilBART Model
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• distilbart-cnn-6-6 (306M params)</li>
                <li>• ROUGE-L: 39.7 (95% of BART quality)</li>
                <li>• 800-1200ms CPU inference</li>
                <li>• Abstractive + extractive summarization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Performance Metrics
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 75% avg compression ratio</li>
                <li>• <1.2 sec processing time</li>
                <li>• 1,350 summaries/month</li>
                <li>• 100% coverage (vs 30% manual)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Cost-Conscious Design
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• $0 API costs (fully local)</li>
                <li>• CPU-only (no GPU needed)</li>
                <li>• Batch processing support</li>
                <li>• $30/month shared hosting</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why DistilBART?</strong> 6x faster than BART-large with 95% quality.
              Compresses 500-word reviews into 125-word summaries (75% compression) while
              preserving key information. Perfect for scanning large volumes of content quickly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
