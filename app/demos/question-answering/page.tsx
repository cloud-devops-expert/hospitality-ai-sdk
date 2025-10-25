'use client';

import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  source: string;
  timestamp: string;
  askedBy: string;
  flagged?: boolean;
  flagReason?: string;
}

interface DepartmentStats {
  department: string;
  questions: number;
  percentage: number;
  avgConfidence: number;
  topTopics: string[];
}

interface KnowledgeGap {
  topic: string;
  questionsCount: number;
  avgConfidence: number;
  status: string;
  recommendation: string;
}

interface DailyVolume {
  date: string;
  questions: number;
  highConf: number;
  medConf: number;
  lowConf: number;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const RECENT_QUESTIONS: QuestionAnswer[] = [
  {
    id: '1',
    question: 'What time is breakfast served on weekends?',
    answer: '7:00 AM to 10:30 AM',
    confidence: 0.94,
    confidenceLevel: 'high',
    source: 'Dining Services Policy',
    timestamp: '2 minutes ago',
    askedBy: 'Guest (Room 305)',
  },
  {
    id: '2',
    question: 'Can I get a late checkout without extra charge?',
    answer: 'Late checkout until 2:00 PM is complimentary for loyalty members',
    confidence: 0.67,
    confidenceLevel: 'medium',
    source: 'Check-in/Check-out Policy',
    timestamp: '8 minutes ago',
    askedBy: 'Front Desk Staff',
    flagged: true,
    flagReason: 'Medium confidence - verify loyalty member status policy',
  },
  {
    id: '3',
    question: 'Do you validate parking for restaurant guests?',
    answer: 'No relevant information found',
    confidence: 0.12,
    confidenceLevel: 'low',
    source: 'No matching policy',
    timestamp: '15 minutes ago',
    askedBy: 'Restaurant Host',
    flagged: true,
    flagReason: 'Knowledge gap - parking validation policy missing',
  },
  {
    id: '4',
    question: 'Is the pool heated year-round?',
    answer: 'Yes, our outdoor pool is heated and open year-round',
    confidence: 0.89,
    confidenceLevel: 'high',
    source: 'Amenities & Facilities',
    timestamp: '22 minutes ago',
    askedBy: 'Guest (Room 412)',
  },
  {
    id: '5',
    question: 'What is the pet fee for a 3-night stay?',
    answer: '$75 per stay (non-refundable, covers up to 2 pets)',
    confidence: 0.91,
    confidenceLevel: 'high',
    source: 'Pet Policy',
    timestamp: '35 minutes ago',
    askedBy: 'Reservations Staff',
  },
];

const MONTHLY_STATS = {
  totalQuestions: 2560,
  automatedQuestions: 1869,
  automationRate: 73.0,
  avgConfidence: 81.3,
  laborHoursSaved: 75,
  monthlySavings: 620,
};

const CONFIDENCE_BREAKDOWN = {
  high: { count: 1741, percentage: 68.0 },
  medium: { count: 538, percentage: 21.0 },
  low: { count: 281, percentage: 11.0 },
};

const DEPARTMENT_USAGE: DepartmentStats[] = [
  {
    department: 'Front Desk',
    questions: 1240,
    percentage: 48.4,
    avgConfidence: 84.2,
    topTopics: ['Check-in times', 'Room amenities', 'Parking rates'],
  },
  {
    department: 'Reservations',
    questions: 680,
    percentage: 26.6,
    avgConfidence: 82.1,
    topTopics: ['Cancellation policy', 'Pet fees', 'Group bookings'],
  },
  {
    department: 'Restaurant',
    questions: 420,
    percentage: 16.4,
    avgConfidence: 78.5,
    topTopics: ['Breakfast hours', 'Menu options', 'Dietary restrictions'],
  },
  {
    department: 'Housekeeping',
    questions: 180,
    percentage: 7.0,
    avgConfidence: 79.8,
    topTopics: ['Towel requests', 'Room cleaning', 'Maintenance'],
  },
  {
    department: 'Management',
    questions: 40,
    percentage: 1.6,
    avgConfidence: 85.3,
    topTopics: ['Policy updates', 'Staff procedures', 'Compliance'],
  },
];

const DAILY_VOLUME: DailyVolume[] = [
  { date: 'Mon 10/14', questions: 340, highConf: 235, medConf: 68, lowConf: 37 },
  { date: 'Tue 10/15', questions: 380, highConf: 267, medConf: 81, lowConf: 32 },
  { date: 'Wed 10/16', questions: 365, highConf: 251, medConf: 78, lowConf: 36 },
  { date: 'Thu 10/17', questions: 372, highConf: 258, medConf: 75, lowConf: 39 },
  { date: 'Fri 10/18', questions: 420, highConf: 295, medConf: 89, lowConf: 36 },
  { date: 'Sat 10/19', questions: 298, highConf: 207, medConf: 62, lowConf: 29 },
  { date: 'Sun 10/20', questions: 285, highConf: 198, medConf: 60, lowConf: 27 },
];

const KNOWLEDGE_GAPS: KnowledgeGap[] = [
  {
    topic: 'Parking Validation for Restaurant',
    questionsCount: 47,
    avgConfidence: 0.12,
    status: 'Missing Policy',
    recommendation: 'Add "Restaurant Parking Validation" section to Parking Policy',
  },
  {
    topic: 'Early Check-in Availability',
    questionsCount: 38,
    avgConfidence: 0.58,
    status: 'Ambiguous',
    recommendation: 'Clarify early check-in rules (currently buried in long paragraph)',
  },
  {
    topic: 'Pool Towel Return Policy',
    questionsCount: 22,
    avgConfidence: 0.45,
    status: 'Conflicting Info',
    recommendation: 'Pool policy says "return to room", Amenities says "drop at desk"',
  },
];

const MONTHLY_INSIGHTS = [
  {
    insight: '"Parking validation" asked 47 times but not found in policy documents',
    action: 'Add new policy section for restaurant/spa parking validation',
    impact: 'Could improve automation rate from 73% to 75% (+2%)',
  },
  {
    insight: 'Pet policy updated on 10/12 - confidence improved significantly',
    action: 'Before: 62% avg confidence → After: 91% avg confidence (+47%)',
    impact: 'Demonstrates value of clear, structured policy writing',
  },
  {
    insight: 'Breakfast hours most-asked question (180 times this month)',
    action: 'Feature prominently on website/app homepage',
    impact: 'Reduce repetitive questions by 7% of total volume',
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
    { id: 'query', label: 'Query Interface', icon: '❓' },
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

function StatusBadge({ level }: { level: ConfidenceLevel }) {
  const styles = {
    high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    low: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  const labels = {
    high: 'High (≥80%)',
    medium: 'Medium (60-79%)',
    low: 'Low (<60%)',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuestionAnsweringDemo() {
  const [activeView, setActiveView] = useState('query');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Question Answering (RAG)
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Automated staff FAQ system using DistilBERT QA + FAISS vector search
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly ROI</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                $620
              </div>
              <div className="text-xs text-gray-500">$7,440/year</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <ROICard
              title="Automation Rate"
              value="73%"
              subtitle="1,869/2,560 questions"
              color="green"
            />
            <ROICard
              title="Avg Confidence"
              value="81.3%"
              subtitle="High accuracy"
              trend="↑ +4% vs last month"
              color="blue"
            />
            <ROICard
              title="Labor Saved"
              value="75 hrs"
              subtitle="2.5 hours/day"
              color="purple"
            />
            <ROICard
              title="Response Time"
              value="<280ms"
              subtitle="CPU-only inference"
              color="orange"
            />
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />

        {/* View 1: Query Interface */}
        {activeView === 'query' && (
          <div className="space-y-6">
            {/* Recent Questions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Recent Questions & Answers
              </h2>
              <div className="space-y-4">
                {RECENT_QUESTIONS.map((qa) => (
                  <div
                    key={qa.id}
                    className={`p-4 rounded-lg border-2 ${
                      qa.flagged
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-medium">{qa.askedBy}</span> • {qa.timestamp}
                        </div>
                        <div className="text-base font-medium text-gray-900 dark:text-white mb-2">
                          Q: {qa.question}
                        </div>
                        <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                          A: {qa.answer}
                        </div>
                      </div>
                      <StatusBadge level={qa.confidenceLevel} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Source: {qa.source} • Confidence: {(qa.confidence * 100).toFixed(1)}%
                      </span>
                      {qa.flagged && (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          ⚠️ {qa.flagReason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ⚡ Staff Action Items
              </h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">🔴</span>
                  <span>
                    <strong>Review 3 low-confidence answers</strong> before sending to guests
                    (Question #2, #3 flagged for manual verification)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">🟠</span>
                  <span>
                    <strong>Update policy document</strong> for "parking validation" (47
                    questions this month, no relevant policy found)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">🟡</span>
                  <span>
                    <strong>Verify answer accuracy</strong> for "late checkout fee" (conflicting
                    information detected in policy docs)
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
                    $620
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</div>
                  <div className="text-xs text-gray-500 mt-1">$7,440/year projected</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {MONTHLY_STATS.automatedQuestions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Questions Automated
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {MONTHLY_STATS.automationRate}% of total
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    75 hrs
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Labor Hours Saved</div>
                  <div className="text-xs text-gray-500 mt-1">2.5 hours/day average</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Availability</div>
                  <div className="text-xs text-gray-500 mt-1">
                    vs. 9am-6pm manual coverage
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Calculation:</strong> Before AI: 3.5 hr/day × 30 days × $22/hr =
                  $2,310/month → After AI: 1 hr/day × 30 days × $22/hr = $660/month →{' '}
                  <strong className="text-green-600 dark:text-green-400">
                    Savings: $1,650/month - $30 infrastructure = $620/month net
                  </strong>
                </div>
              </div>
            </div>

            {/* Accuracy Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Answer Accuracy Metrics
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {CONFIDENCE_BREAKDOWN.high.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    High Confidence (≥80%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {CONFIDENCE_BREAKDOWN.high.percentage}% of total
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {CONFIDENCE_BREAKDOWN.medium.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Medium Confidence (60-79%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {CONFIDENCE_BREAKDOWN.medium.percentage}% of total
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {CONFIDENCE_BREAKDOWN.low.count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Low Confidence (&lt;60%)
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {CONFIDENCE_BREAKDOWN.low.percentage}% of total (needs review)
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average confidence: <strong>{MONTHLY_STATS.avgConfidence}%</strong> • F1 Score:{' '}
                <strong>86.2%</strong> • Coverage: <strong>73%</strong> (rest escalated to staff)
              </div>
            </div>

            {/* Department Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Usage by Department ({MONTHLY_STATS.totalQuestions.toLocaleString()} questions
                this month)
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
                          {dept.questions.toLocaleString()} questions ({dept.percentage}%)
                        </span>
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Avg: {dept.avgConfidence}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Top topics: {dept.topTopics.join(', ')}
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
                7-Day Question Volume
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
                          {day.questions}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {day.highConf}
                        </td>
                        <td className="py-3 px-4 text-right text-yellow-600 dark:text-yellow-400">
                          {day.medConf}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                          {day.lowConf}
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
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.questions, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600 dark:text-green-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.highConf, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-yellow-600 dark:text-yellow-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.medConf, 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600 dark:text-red-400">
                        {DAILY_VOLUME.reduce((sum, d) => sum + d.lowConf, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Peak hours: 10am-12pm, 3pm-5pm • Weekend volume 15% lower than weekdays
              </div>
            </div>

            {/* Knowledge Gap Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Knowledge Gap Analysis (Top 3)
              </h2>
              <div className="space-y-4">
                {KNOWLEDGE_GAPS.map((gap, idx) => (
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
                          <span className="font-medium">{gap.questionsCount} questions</span> •
                          Avg confidence:{' '}
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            {(gap.avgConfidence * 100).toFixed(0)}%
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
                Answer Quality Trends (30 Days)
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Avg Confidence
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    78.1% → 81.3%
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                    ↑ +4% improvement
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Low-Confidence Rate
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    15% → 11%
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    ↓ 27% reduction
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Coverage Gaps
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    8 → 3 topics
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                    ↓ 62% improvement
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
                DistilBERT QA Model
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 66M parameters</li>
                <li>• 86.2% F1 Score on SQuAD</li>
                <li>• 180-250ms CPU inference</li>
                <li>• Extractive QA (finds answer in context)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                FAISS Vector Search
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Sentence-BERT embeddings (384 dims)</li>
                <li>• 180 policy chunks indexed</li>
                <li>• 2-5ms search time (CPU)</li>
                <li>• IndexFlatL2 for exact search</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Cost-Conscious Design
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• $0 API costs (fully local)</li>
                <li>• CPU-only (no GPU needed)</li>
                <li>• 24/7 availability</li>
                <li>• $30/month shared hosting</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Why RAG?</strong> Retrieval-Augmented Generation combines vector search
              (find relevant policy sections) with question answering (extract precise answer).
              This approach provides accurate, source-cited answers without expensive LLM API
              calls. Total latency &lt;280ms end-to-end on CPU.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
