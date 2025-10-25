'use client';

/**
 * Review Response Automation - LLM-Powered Personalization
 *
 * ROI: $380/month ($4,560/year) NET SAVINGS
 * - Staff Time Savings: $600/month (25h → 5h/month)
 * - Improved Guest Satisfaction: $180/month (95% response rate, 18h avg)
 * - System Cost: -$400/month (LLM API fees + infrastructure)
 *
 * Three views:
 * - Generation View: Interactive response generator with approval workflow
 * - Performance View: ROI metrics, quality tracking, time savings
 * - Historical View: Last 7 days generation data with insights
 *
 * NOTE: This is where LLMs excel! Creative text generation justifies the $400/month cost.
 */

import { useState } from 'react';
import { ViewTabs } from '@/components/demos/ViewTabs';
import { ROICard } from '@/components/demos/ROICard';
import { ROIMetrics } from '@/components/demos/ROIMetrics';
import { HistoricalTable } from '@/components/demos/HistoricalTable';
import { InsightsBox } from '@/components/demos/InsightsBox';
import { TableFormatters } from '@/components/demos/TableFormatters';

type ViewMode = 'generation' | 'performance' | 'historical';

interface Review {
  id: string;
  guestName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText: string;
  platform: string;
  stayDate: string;
}

interface GeneratedResponse {
  responseText: string;
  tone: string;
  confidence: number;
  suggestedAction: 'approve' | 'review' | 'escalate';
  estimatedCost: number;
}

interface DailyResponse {
  date: string;
  totalReviews: number;
  responsesGenerated: number;
  approved: number;
  edited: number;
  rejected: number;
  avgConfidence: number;
  avgResponseTime: number;
  llmCost: number;
}

export default function ReviewResponseDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('performance');
  const [review, setReview] = useState<Review>({
    id: 'REV-NEW',
    guestName: 'John Smith',
    rating: 5,
    reviewText: '',
    platform: 'Google Reviews',
    stayDate: '2025-10-20',
  });
  const [result, setResult] = useState<GeneratedResponse | null>(null);
  const [generating, setGenerating] = useState(false);

  // Sample reviews for demo
  const sampleReviews = [
    {
      name: '5-Star - Excellent Stay',
      data: {
        id: 'REV-001',
        guestName: 'Sarah Johnson',
        rating: 5 as 1 | 2 | 3 | 4 | 5,
        reviewText:
          'Amazing stay! The room was spotless, staff incredibly friendly, and the breakfast was fantastic. Best hotel experience in years. Highly recommend!',
        platform: 'Google Reviews',
        stayDate: '2025-10-20',
      },
    },
    {
      name: '2-Star - Poor Experience',
      data: {
        id: 'REV-002',
        guestName: 'Robert Wilson',
        rating: 2 as 1 | 2 | 3 | 4 | 5,
        reviewText:
          "Disappointed with our stay. Room was not clean upon arrival, AC wasn't working properly, and it took hours to get it fixed. Expected much better.",
        platform: 'TripAdvisor',
        stayDate: '2025-10-18',
      },
    },
  ];

  // Historical data
  const historicalData: DailyResponse[] = [
    {
      date: '2025-10-19',
      totalReviews: 58,
      responsesGenerated: 56,
      approved: 52,
      edited: 8,
      rejected: 4,
      avgConfidence: 0.92,
      avgResponseTime: 14.5,
      llmCost: 0.14,
    },
    {
      date: '2025-10-20',
      totalReviews: 62,
      responsesGenerated: 60,
      approved: 55,
      edited: 9,
      rejected: 5,
      avgConfidence: 0.91,
      avgResponseTime: 16.2,
      llmCost: 0.15,
    },
    {
      date: '2025-10-21',
      totalReviews: 54,
      responsesGenerated: 52,
      approved: 48,
      edited: 7,
      rejected: 4,
      avgConfidence: 0.93,
      avgResponseTime: 13.8,
      llmCost: 0.13,
    },
    {
      date: '2025-10-22',
      totalReviews: 61,
      responsesGenerated: 59,
      approved: 54,
      edited: 10,
      rejected: 5,
      avgConfidence: 0.90,
      avgResponseTime: 15.5,
      llmCost: 0.15,
    },
    {
      date: '2025-10-23',
      totalReviews: 65,
      responsesGenerated: 63,
      approved: 58,
      edited: 11,
      rejected: 5,
      avgConfidence: 0.92,
      avgResponseTime: 14.0,
      llmCost: 0.16,
    },
    {
      date: '2025-10-24',
      totalReviews: 59,
      responsesGenerated: 57,
      approved: 53,
      edited: 9,
      rejected: 4,
      avgConfidence: 0.91,
      avgResponseTime: 15.2,
      llmCost: 0.14,
    },
    {
      date: '2025-10-25',
      totalReviews: 63,
      responsesGenerated: 61,
      approved: 56,
      edited: 10,
      rejected: 5,
      avgConfidence: 0.92,
      avgResponseTime: 13.5,
      llmCost: 0.15,
    },
  ];

  const generateResponse = () => {
    if (!review.reviewText.trim()) return;

    setGenerating(true);
    setTimeout(() => {
      let responseText = '';
      let tone = '';
      let suggestedAction: 'approve' | 'review' | 'escalate' = 'approve';
      let confidence = 0.95;

      // Generate based on rating
      if (review.rating === 5) {
        tone = 'Grateful & Enthusiastic';
        suggestedAction = 'approve';
        responseText = `Dear ${review.guestName},

Thank you so much for your wonderful 5-star review! We're absolutely thrilled to hear that you had such an amazing experience with us.

Your kind words about our spotless rooms, friendly staff, and fantastic breakfast truly make our day. We work hard to ensure every guest has a memorable stay, and it's incredibly rewarding to know we exceeded your expectations.

We can't wait to welcome you back on your next visit!

Warm regards,
Michael Chen
General Manager`;
      } else if (review.rating === 4) {
        tone = 'Appreciative & Responsive';
        suggestedAction = 'approve';
        confidence = 0.92;
        responseText = `Dear ${review.guestName},

Thank you for your positive 4-star review and for taking the time to share your feedback! We're glad to hear you found your stay enjoyable overall.

We appreciate your comments and are always working to improve our services. Your feedback helps us identify areas where we can do even better.

We hope to welcome you back soon for an even better experience!

Best regards,
Michael Chen
General Manager`;
      } else if (review.rating === 3) {
        tone = 'Understanding & Constructive';
        suggestedAction = 'review';
        confidence = 0.85;
        responseText = `Dear ${review.guestName},

Thank you for your honest feedback. We appreciate you sharing your experience, though we're sorry to hear that some aspects didn't fully meet your expectations.

Your comments are valuable as we continuously work to improve our guest experience. We'd love the opportunity to provide you with a better stay in the future - please reach out to us directly if you'd like to discuss your experience further.

Sincerely,
Michael Chen
General Manager`;
      } else if (review.rating === 2) {
        tone = 'Apologetic & Proactive';
        suggestedAction = 'escalate';
        confidence = 0.75;
        responseText = `Dear ${review.guestName},

We sincerely apologize for falling short of your expectations during your recent stay. Your concerns about room cleanliness and the AC issues are completely unacceptable, and we deeply regret the inconvenience caused.

I would very much like to speak with you personally to discuss your experience and how we can make this right. Please contact me directly at michael.chen@hotel.com or (555) 123-4567.

We hope you'll give us another opportunity to provide the level of service you deserve.

Our sincerest apologies,
Michael Chen
General Manager`;
      } else {
        tone = 'Urgent & Remedial';
        suggestedAction = 'escalate';
        confidence = 0.70;
        responseText = `Dear ${review.guestName},

We are truly sorry to hear about your extremely disappointing experience at our hotel. Your feedback is deeply concerning and completely unacceptable.

This is not the standard we hold ourselves to, and we take full responsibility for these failures. I would like to speak with you immediately to address these serious issues and discuss appropriate compensation.

Please contact me directly at michael.chen@hotel.com or (555) 123-4567 - we are committed to making this right.

With our sincerest apologies,
Michael Chen
General Manager

[URGENT: Escalate to GM immediately - review mentions multiple critical failures]`;
      }

      setResult({
        responseText,
        tone,
        confidence,
        suggestedAction,
        estimatedCost: 0.0025,
      });
      setGenerating(false);
    }, 1500);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'escalate':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Review Response - LLM-Powered Personalization
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Automated, personalized responses using GPT-4o-mini / Claude Haiku
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="text-green-800 dark:text-green-300 font-semibold">
              ROI: $380/month ($4,560/year) net savings
            </span>
          </div>
        </div>

        <ViewTabs
          viewMode={viewMode}
          setViewMode={setViewMode}
          tabs={[
            { key: 'generation', label: 'Generation' },
            { key: 'performance', label: 'Performance' },
            { key: 'historical', label: 'Historical' },
          ]}
        />

        {/* GENERATION VIEW */}
        {viewMode === 'generation' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Guest Review</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={review.guestName}
                      onChange={(e) => setReview({ ...review, guestName: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Rating
                      </label>
                      <select
                        value={review.rating}
                        onChange={(e) => setReview({ ...review, rating: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                        className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                        <option value={3}>⭐⭐⭐ (3 stars)</option>
                        <option value={2}>⭐⭐ (2 stars)</option>
                        <option value={1}>⭐ (1 star)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Platform
                      </label>
                      <select
                        value={review.platform}
                        onChange={(e) => setReview({ ...review, platform: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Google Reviews">Google Reviews</option>
                        <option value="TripAdvisor">TripAdvisor</option>
                        <option value="Booking.com">Booking.com</option>
                        <option value="Expedia">Expedia</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Review Text
                    </label>
                    <textarea
                      value={review.reviewText}
                      onChange={(e) => setReview({ ...review, reviewText: e.target.value })}
                      placeholder="Enter the guest's review..."
                      className="w-full h-40 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={generateResponse}
                  disabled={!review.reviewText.trim() || generating}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {generating ? 'Generating Response...' : '✨ Generate Response'}
                </button>

                <div className="mt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Try a sample:</p>
                  <div className="space-y-2">
                    {sampleReviews.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReview(sample.data)}
                        className="w-full text-left p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Generated Response
                </h2>

                {result ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
                        {result.responseText}
                      </pre>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Tone:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{result.tone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Action:</span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(result.suggestedAction)}`}
                        >
                          {result.suggestedAction.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Estimated Cost:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${result.estimatedCost.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                        Edit
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p>Enter review and click "Generate Response"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">💡 Why LLMs Excel Here:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
                <div>
                  <strong>Perfect Use Case:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Creative text generation (LLM strength)</li>
                    <li>• High variability (each review unique)</li>
                    <li>• Tone matching (grateful → apologetic)</li>
                    <li>• Context-aware personalization</li>
                  </ul>
                </div>
                <div>
                  <strong>vs Templates:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• 95%+ human-like quality (vs robotic)</li>
                    <li>• References specific details</li>
                    <li>• Natural language flow</li>
                    <li>• Worth $400/month LLM cost</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE VIEW */}
        {viewMode === 'performance' && (
          <div className="space-y-6">
            <ROICard
              title="Monthly Performance Report - Review Response Automation"
              totalSavings={380}
              annualSavings={4560}
              metrics={[
                {
                  label: 'Staff Time Savings',
                  value: '$600',
                  sublabel: '25 hrs/month → 5 hrs/month (80% reduction)',
                },
                {
                  label: 'Guest Satisfaction',
                  value: '$180',
                  sublabel: '95% response rate, 18h avg response time',
                },
                {
                  label: 'LLM API Cost',
                  value: '-$400',
                  sublabel: 'GPT-4o-mini + infrastructure (~400 reviews/month)',
                },
                {
                  label: 'Net Savings',
                  value: '$380',
                  sublabel: '$600 + $180 - $400 = $380/month',
                },
              ]}
              description="LLM-powered review responses achieve 95% response rates with 80% less staff time. While LLM costs $400/month, the personalized, context-aware responses justify the expense through time savings ($600) and improved guest satisfaction ($180), delivering net savings of $380/month."
            />

            <ROIMetrics
              title="Before & After - Manual vs LLM-Assisted"
              before={{
                response_rate: 65,
                avg_response_time: 96,
                staff_time_month: 25,
                monthly_cost: 750,
              }}
              after={{
                response_rate: 95,
                avg_response_time: 18,
                staff_time_month: 5,
                monthly_cost: 550,
              }}
              metrics={[
                {
                  label: 'Response Rate (%)',
                  beforeValue: 65,
                  afterValue: 95,
                  formatter: (val) => `${val}%`,
                  improvement: '+46%',
                },
                {
                  label: 'Avg Response Time (hrs)',
                  beforeValue: 96,
                  afterValue: 18,
                  formatter: (val) => `${val}h`,
                  improvement: '81% faster',
                },
                {
                  label: 'Staff Time (hrs/month)',
                  beforeValue: 25,
                  afterValue: 5,
                  formatter: (val) => `${val}h`,
                  improvement: '80% reduction',
                },
                {
                  label: 'Monthly Cost',
                  beforeValue: 750,
                  afterValue: 550,
                  formatter: TableFormatters.currency,
                  improvement: '$200 savings',
                },
              ]}
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 30-Day Performance Metrics
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Approval Rate</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">92%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Target: &gt;85%
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total LLM Cost</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">$4.20</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    (~$0.0025/response)
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Edit Rate</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">14%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: &lt;15%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Workflow Distribution:</h3>
                {[
                  { name: '5-Star (Auto-Approve)', count: 180, percentage: 45, color: 'green' },
                  { name: '4-Star (Quick Review)', count: 120, percentage: 30, color: 'blue' },
                  { name: '3-Star (Standard Review)', count: 60, percentage: 15, color: 'yellow' },
                  { name: '1-2 Star (Escalate)', count: 40, percentage: 10, color: 'red' },
                ].map((workflow) => (
                  <div key={workflow.name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-48">{workflow.name}:</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                      <div
                        className={`bg-${workflow.color}-600 h-6 rounded-full flex items-center justify-end pr-2`}
                        style={{ width: `${workflow.percentage}%` }}
                      >
                        <span className="text-xs font-semibold text-white">{workflow.count}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">
                      {workflow.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HISTORICAL VIEW */}
        {viewMode === 'historical' && (
          <div className="space-y-6">
            <HistoricalTable
              title="Last 7 Days - Response Generation Performance"
              headers={[
                { key: 'date', label: 'Date', formatter: TableFormatters.date },
                { key: 'totalReviews', label: 'Reviews', formatter: (val) => val.toString() },
                { key: 'responsesGenerated', label: 'Generated', formatter: (val) => val.toString() },
                { key: 'approved', label: 'Approved', formatter: (val) => val.toString() },
                { key: 'edited', label: 'Edited', formatter: (val) => val.toString() },
                {
                  key: 'avgConfidence',
                  label: 'Avg Confidence',
                  formatter: (val) => `${(val * 100).toFixed(0)}%`,
                },
                { key: 'avgResponseTime', label: 'Avg Time', formatter: (val) => `${val.toFixed(1)}h` },
                { key: 'llmCost', label: 'LLM Cost', formatter: TableFormatters.currency },
              ]}
              data={historicalData}
              highlightColumn="avgConfidence"
            />

            <InsightsBox
              title="📊 System Learning & Trends"
              insights={[
                {
                  icon: '✅',
                  title: 'High Approval Rate',
                  description:
                    '92% of generated responses approved with minimal edits. LLM quality excellent for creative text generation.',
                  importance: 'positive',
                },
                {
                  icon: '⚡',
                  title: 'Fast Turnaround',
                  description:
                    'Average response time 14.5 hours (vs 96 hours manual). 95% of reviews responded within 24 hours.',
                  importance: 'positive',
                },
                {
                  icon: '💰',
                  title: 'Cost Efficiency',
                  description:
                    'Daily LLM cost $0.14 (56 responses). Monthly projection: $4.20 for pure API (extremely cheap!)',
                  importance: 'info',
                },
                {
                  icon: '📝',
                  title: 'Quality Consistency',
                  description:
                    'Response quality consistent at 90-93% confidence. Tone matching 100% accurate across all ratings.',
                  importance: 'positive',
                },
                {
                  icon: '🔧',
                  title: 'Low Edit Rate',
                  description:
                    'Only 14% of responses required editing. Prompts working well, minimal staff intervention needed.',
                  importance: 'positive',
                },
                {
                  icon: '📈',
                  title: 'Response Rate Improved',
                  description:
                    'Now responding to 95% of reviews (vs 65% manual). Guests notice and appreciate faster responses.',
                  importance: 'positive',
                },
              ]}
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 7-Day Summary</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Average Daily Reviews
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {(historicalData.reduce((sum, d) => sum + d.totalReviews, 0) / 7).toFixed(0)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Total: {historicalData.reduce((sum, d) => sum + d.totalReviews, 0)} reviews
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Best Confidence Day</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {(Math.max(...historicalData.map((d) => d.avgConfidence)) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {TableFormatters.date(
                      historicalData.find(
                        (d) => d.avgConfidence === Math.max(...historicalData.map((d) => d.avgConfidence))
                      )?.date || ''
                    )}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total LLM Cost</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    ${historicalData.reduce((sum, d) => sum + d.llmCost, 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last 7 days</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Why This Uses LLMs</h2>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <strong>Perfect Use Case for Generative AI:</strong> Writing personalized, context-aware text is
              what LLMs do best. Unlike classification or routing (where traditional ML works), review
              responses require creativity, tone matching, and natural language flow.
            </p>
            <p>
              <strong>Cost Justification:</strong> Pure LLM API cost is ~$0.0025/response ($4.20/month for
              400 reviews). Including infrastructure, the total cost is ~$400/month, but this is justified by
              $600 staff time savings + $180 guest satisfaction improvement = $780 value delivered.
            </p>
            <p>
              <strong>Models:</strong> GPT-4o-mini ($0.15 input / $0.60 output per 1M tokens) or Claude Haiku
              (similar pricing). Both produce 95%+ human-like quality responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
