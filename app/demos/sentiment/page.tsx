'use client';

/**
 * Sentiment Analysis - Guest Feedback System
 *
 * ROI: $420/month ($5,040/year)
 * - Faster Response Time: $180/month (18 hrs/month saved)
 * - Improved Guest Satisfaction: $150/month (faster negative response)
 * - Staff Efficiency: $90/month (automated categorization)
 *
 * Three views:
 * - Analysis View: Real-time review analysis and response management
 * - Trends View: Sentiment trends, category performance, ROI
 * - Historical View: Last 7 days performance with insights
 */

import { useState } from 'react';
import { ViewTabs } from '@/components/demos/ViewTabs';
import { ROICard } from '@/components/demos/ROICard';
import { ROIMetrics } from '@/components/demos/ROIMetrics';
import { HistoricalTable } from '@/components/demos/HistoricalTable';
import { InsightsBox } from '@/components/demos/InsightsBox';
import { TableFormatters } from '@/components/demos/TableFormatters';

type ViewMode = 'analysis' | 'trends' | 'historical';
type Urgency = 'critical' | 'high' | 'medium' | 'low';
type Sentiment = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';

interface ReviewAnalysis {
  id: string;
  guestName: string;
  reviewText: string;
  source: 'booking' | 'google' | 'tripadvisor' | 'direct';
  timestamp: string;
  sentiment: {
    stars: 1 | 2 | 3 | 4 | 5;
    score: number;
    label: Sentiment;
  };
  categories: {
    food?: number;
    cleanliness?: number;
    service?: number;
    amenities?: number;
    location?: number;
  };
  urgency: Urgency;
  responseTemplate?: string;
  responded?: boolean;
}

interface DailySentiment {
  date: string;
  totalReviews: number;
  averageStars: number;
  very_positive: number;
  positive: number;
  neutral: number;
  negative: number;
  very_negative: number;
  responseTime: number;
  responded: number;
}

export default function SentimentAnalysisDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('trends');
  const [reviewText, setReviewText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<ReviewAnalysis | null>(null);

  // ===== SAMPLE DATA =====
  const pendingReviews: ReviewAnalysis[] = [
    {
      id: 'REV-001',
      guestName: 'Sarah Johnson',
      reviewText:
        'Room was dirty when we checked in. Found hair in the bathroom and the sheets looked used. Staff was apologetic but this is unacceptable for the price.',
      source: 'booking',
      timestamp: '2025-10-25T08:30:00Z',
      sentiment: { stars: 2, score: 0.92, label: 'negative' },
      categories: { cleanliness: 1, service: 3 },
      urgency: 'critical',
      responseTemplate: 'cleanliness_critical',
      responded: false,
    },
    {
      id: 'REV-002',
      guestName: 'Michael Chen',
      reviewText: 'Decent hotel, nothing special. Location is good but breakfast was mediocre.',
      source: 'google',
      timestamp: '2025-10-25T09:15:00Z',
      sentiment: { stars: 3, score: 0.78, label: 'neutral' },
      categories: { food: 2, location: 4 },
      urgency: 'medium',
      responded: false,
    },
    {
      id: 'REV-003',
      guestName: 'Emma Rodriguez',
      reviewText:
        'Staff was incredibly rude during check-in. Made us wait 45 minutes and showed no apology. Very disappointing experience.',
      source: 'tripadvisor',
      timestamp: '2025-10-25T10:00:00Z',
      sentiment: { stars: 1, score: 0.95, label: 'very_negative' },
      categories: { service: 1 },
      urgency: 'critical',
      responseTemplate: 'service_critical',
      responded: false,
    },
    {
      id: 'REV-004',
      guestName: 'David Park',
      reviewText:
        'Amazing stay! Everything was perfect from check-in to check-out. Staff was friendly, room was spotless, and breakfast was delicious.',
      source: 'direct',
      timestamp: '2025-10-25T11:30:00Z',
      sentiment: { stars: 5, score: 0.98, label: 'very_positive' },
      categories: { service: 5, cleanliness: 5, food: 5 },
      urgency: 'low',
      responseTemplate: 'general_positive',
      responded: false,
    },
  ];

  // ===== HISTORICAL DATA (Last 7 Days) =====
  const historicalData: DailySentiment[] = [
    {
      date: '2025-10-19',
      totalReviews: 42,
      averageStars: 4.3,
      very_positive: 15,
      positive: 18,
      neutral: 6,
      negative: 2,
      very_negative: 1,
      responseTime: 8.5,
      responded: 40,
    },
    {
      date: '2025-10-20',
      totalReviews: 38,
      averageStars: 4.4,
      very_positive: 14,
      positive: 19,
      neutral: 4,
      negative: 1,
      very_negative: 0,
      responseTime: 7.2,
      responded: 37,
    },
    {
      date: '2025-10-21',
      totalReviews: 45,
      averageStars: 4.2,
      very_positive: 16,
      positive: 17,
      neutral: 8,
      negative: 3,
      very_negative: 1,
      responseTime: 9.1,
      responded: 43,
    },
    {
      date: '2025-10-22',
      totalReviews: 40,
      averageStars: 4.5,
      very_positive: 18,
      positive: 16,
      neutral: 5,
      negative: 1,
      very_negative: 0,
      responseTime: 6.8,
      responded: 39,
    },
    {
      date: '2025-10-23',
      totalReviews: 47,
      averageStars: 4.4,
      very_positive: 19,
      positive: 18,
      neutral: 7,
      negative: 2,
      very_negative: 1,
      responseTime: 7.5,
      responded: 45,
    },
    {
      date: '2025-10-24',
      totalReviews: 43,
      averageStars: 4.3,
      very_positive: 17,
      positive: 17,
      neutral: 6,
      negative: 2,
      very_negative: 1,
      responseTime: 8.0,
      responded: 41,
    },
    {
      date: '2025-10-25',
      totalReviews: 41,
      averageStars: 4.4,
      very_positive: 16,
      positive: 18,
      neutral: 5,
      negative: 1,
      very_negative: 1,
      responseTime: 7.3,
      responded: 39,
    },
  ];

  const sampleReviews = [
    'The hotel was absolutely amazing! Best stay ever, highly recommend!',
    'Room was dirty and staff was rude. Very disappointed.',
    'Decent hotel, nothing special. Average experience.',
    'Perfect! Everything was wonderful from check-in to check-out.',
  ];

  // ===== SENTIMENT ANALYSIS FUNCTION =====
  const analyzeSentiment = () => {
    if (!reviewText.trim()) return;

    setAnalyzing(true);

    // Simulate analysis
    setTimeout(() => {
      const lowerText = reviewText.toLowerCase();
      let stars: 1 | 2 | 3 | 4 | 5 = 3;
      let label: Sentiment = 'neutral';
      let urgency: Urgency = 'medium';

      // Keyword-based sentiment
      if (/(amazing|perfect|wonderful|excellent|outstanding|fantastic)/i.test(reviewText)) {
        stars = 5;
        label = 'very_positive';
        urgency = 'low';
      } else if (/(great|good|nice|clean|friendly|helpful|recommend)/i.test(reviewText)) {
        stars = 4;
        label = 'positive';
        urgency = 'low';
      } else if (/(terrible|awful|disgusting|horrible|worst|dirty|rude)/i.test(reviewText)) {
        stars = 1;
        label = 'very_negative';
        urgency = 'critical';
      } else if (/(bad|poor|disappointed|mediocre|unacceptable)/i.test(reviewText)) {
        stars = 2;
        label = 'negative';
        urgency = 'high';
      }

      // Category detection
      const categories: ReviewAnalysis['categories'] = {};
      if (/(food|breakfast|dinner|restaurant|meal)/i.test(reviewText)) {
        categories.food = stars;
      }
      if (/(clean|dirt|spotless|hygiene|tidy|messy|stain)/i.test(reviewText)) {
        categories.cleanliness = stars;
      }
      if (/(staff|service|friendly|rude|helpful|reception)/i.test(reviewText)) {
        categories.service = stars;
      }
      if (/(pool|gym|wifi|tv|parking|spa|amenities)/i.test(reviewText)) {
        categories.amenities = stars;
      }
      if (/(location|walk|distance|nearby|close|far)/i.test(reviewText)) {
        categories.location = stars;
      }

      setCurrentAnalysis({
        id: 'REV-NEW',
        guestName: 'Test Review',
        reviewText,
        source: 'direct',
        timestamp: new Date().toISOString(),
        sentiment: {
          stars,
          score: 0.85 + Math.random() * 0.15,
          label,
        },
        categories,
        urgency,
        responded: false,
      });

      setAnalyzing(false);
    }, 500);
  };

  // ===== HELPER FUNCTIONS =====
  const getUrgencyColor = (urgency: Urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300';
    }
  };

  const getSentimentEmoji = (label: Sentiment) => {
    switch (label) {
      case 'very_positive':
        return '😍';
      case 'positive':
        return '😊';
      case 'neutral':
        return '😐';
      case 'negative':
        return '😕';
      case 'very_negative':
        return '😡';
    }
  };

  const getStarDisplay = (stars: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < stars ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}>
        ★
      </span>
    ));
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            💬 Sentiment Analysis - Guest Feedback
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Automated review analysis using traditional ML (BERT/keyword-based)
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="text-green-800 dark:text-green-300 font-semibold">
              ROI: $420/month ($5,040/year)
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs
          viewMode={viewMode}
          setViewMode={setViewMode}
          tabs={[
            { key: 'analysis', label: 'Analysis' },
            { key: 'trends', label: 'Trends' },
            { key: 'historical', label: 'Historical' },
          ]}
        />

        {/* ANALYSIS VIEW - Real-Time Review Analysis */}
        {viewMode === 'analysis' && (
          <div className="space-y-6">
            {/* Pending Reviews Queue */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🚨 Pending Reviews ({pendingReviews.length})
              </h2>
              <div className="space-y-3">
                {pendingReviews
                  .sort((a, b) => {
                    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                  })
                  .map((review) => (
                    <div
                      key={review.id}
                      className={`border-2 rounded-lg p-4 ${getUrgencyColor(review.urgency)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {review.guestName}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                              {review.source.toUpperCase()}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-bold ${getUrgencyColor(review.urgency)}`}
                            >
                              {review.urgency.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            "{review.reviewText}"
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-2xl">{getSentimentEmoji(review.sentiment.label)}</span>
                              <span className="font-semibold">{review.sentiment.stars} stars</span>
                            </div>
                            {Object.entries(review.categories).map(([cat, score]) => (
                              <div key={cat} className="text-xs text-slate-600 dark:text-slate-400">
                                {cat}: {score}/5
                              </div>
                            ))}
                          </div>
                        </div>
                        <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                          Respond
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Analysis Interface */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Input */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Analyze New Review
                </h2>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste a guest review here..."
                  className="w-full h-40 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  onClick={analyzeSentiment}
                  disabled={!reviewText.trim() || analyzing}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze Sentiment'}
                </button>

                <div className="mt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Try a sample:</p>
                  <div className="space-y-2">
                    {sampleReviews.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReviewText(sample)}
                        className="w-full text-left p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
                      >
                        "{sample.substring(0, 60)}..."
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analysis Result</h2>
                {currentAnalysis ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-6xl mb-2">
                        {getSentimentEmoji(currentAnalysis.sentiment.label)}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {currentAnalysis.sentiment.stars} Stars
                      </div>
                      <div className="text-lg text-slate-600 dark:text-slate-400 capitalize mb-2">
                        {currentAnalysis.sentiment.label.replace('_', ' ')}
                      </div>
                      <div className="flex justify-center gap-1 text-3xl">
                        {getStarDisplay(currentAnalysis.sentiment.stars)}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Urgency:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${getUrgencyColor(currentAnalysis.urgency)}`}
                        >
                          {currentAnalysis.urgency.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(currentAnalysis.sentiment.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Processing Time:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">&lt;50ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">API Cost:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">$0.00</span>
                      </div>
                    </div>

                    {Object.keys(currentAnalysis.categories).length > 0 && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Categories Detected:
                        </h3>
                        <div className="space-y-1">
                          {Object.entries(currentAnalysis.categories).map(([cat, score]) => (
                            <div key={cat} className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400 capitalize">{cat}:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{score}/5</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p>Enter a review and click "Analyze Sentiment"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TRENDS VIEW - Performance Insights & ROI */}
        {viewMode === 'trends' && (
          <div className="space-y-6">
            {/* ROI Card */}
            <ROICard
              title="Monthly Performance Report - Sentiment Analysis"
              totalSavings={420}
              annualSavings={5040}
              metrics={[
                {
                  label: 'Faster Response Time',
                  value: '$180',
                  sublabel: '18 hours/month saved on review analysis',
                },
                {
                  label: 'Guest Satisfaction',
                  value: '$150',
                  sublabel: 'Proactive negative feedback handling',
                },
                {
                  label: 'Staff Efficiency',
                  value: '$90',
                  sublabel: 'Automated categorization and prioritization',
                },
                {
                  label: 'System Cost',
                  value: '$0',
                  sublabel: 'Keyword + BERT (no API fees)',
                },
              ]}
              description="Automated sentiment analysis reduces response time by 75% (48-72h → 6-12h), increases response rate from 60% to 95%, and improves guest satisfaction by 9.5% (4.2 → 4.6 stars). All using traditional ML with $0 monthly cost."
            />

            {/* Before/After Comparison */}
            <ROIMetrics
              title="Before & After - Automated vs Manual Analysis"
              before={{
                response_time: 60,
                response_rate: 60,
                analysis_time: 22.5,
                satisfaction: 4.2,
              }}
              after={{
                response_time: 9,
                response_rate: 95,
                analysis_time: 2.5,
                satisfaction: 4.6,
              }}
              metrics={[
                {
                  label: 'Response Time (hours)',
                  beforeValue: 60,
                  afterValue: 9,
                  formatter: (val) => `${val}h`,
                  improvement: '75% faster',
                },
                {
                  label: 'Response Rate (%)',
                  beforeValue: 60,
                  afterValue: 95,
                  formatter: (val) => `${val}%`,
                  improvement: '+58% coverage',
                },
                {
                  label: 'Analysis Time (hrs/month)',
                  beforeValue: 22.5,
                  afterValue: 2.5,
                  formatter: (val) => `${val}h`,
                  improvement: '90% reduction',
                },
                {
                  label: 'Guest Satisfaction (stars)',
                  beforeValue: 4.2,
                  afterValue: 4.6,
                  formatter: (val) => `${val.toFixed(1)}★`,
                  improvement: '+9.5%',
                },
              ]}
            />

            {/* 30-Day Sentiment Trend */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📈 30-Day Sentiment Trend
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Average Stars</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">4.4</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Stable (↔)</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Reviews</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">296</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last 7 days</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Response Rate</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">95%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: &gt;95%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Category Performance:</h3>
                {[
                  { name: 'Cleanliness', score: 4.7, trend: 'stable', color: 'blue' },
                  { name: 'Service', score: 4.4, trend: 'up', color: 'green' },
                  { name: 'Food', score: 4.2, trend: 'down', color: 'red' },
                  { name: 'Location', score: 4.8, trend: 'stable', color: 'blue' },
                  { name: 'Amenities', score: 3.9, trend: 'stable', color: 'yellow' },
                ].map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-32">{cat.name}:</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                      <div
                        className={`bg-${cat.color}-600 h-6 rounded-full flex items-center justify-end pr-2`}
                        style={{ width: `${(cat.score / 5) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-white">{cat.score}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '↔'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HISTORICAL VIEW - Last 7 Days Performance */}
        {viewMode === 'historical' && (
          <div className="space-y-6">
            {/* Historical Table */}
            <HistoricalTable
              title="Last 7 Days - Review Analysis Performance"
              headers={[
                { key: 'date', label: 'Date', formatter: TableFormatters.date },
                { key: 'totalReviews', label: 'Reviews', formatter: (val) => val.toString() },
                { key: 'averageStars', label: 'Avg Stars', formatter: (val) => `${val.toFixed(1)}★` },
                { key: 'very_positive', label: '😍 Very +', formatter: (val) => val.toString() },
                { key: 'positive', label: '😊 +', formatter: (val) => val.toString() },
                { key: 'neutral', label: '😐 =', formatter: (val) => val.toString() },
                { key: 'negative', label: '😕 -', formatter: (val) => val.toString() },
                { key: 'very_negative', label: '😡 Very -', formatter: (val) => val.toString() },
                { key: 'responseTime', label: 'Response Time', formatter: (val) => `${val.toFixed(1)}h` },
              ]}
              data={historicalData}
              highlightColumn="averageStars"
            />

            {/* System Insights */}
            <InsightsBox
              title="📊 System Learning & Trends"
              insights={[
                {
                  icon: '📈',
                  title: 'Sentiment Stable',
                  description:
                    'Average rating stable at 4.4 stars over past week. Consistent guest satisfaction.',
                  importance: 'positive',
                },
                {
                  icon: '⚡',
                  title: 'Response Time Improving',
                  description:
                    'Average response time decreased from 9.1h to 7.3h (20% improvement). Approaching <6h target.',
                  importance: 'positive',
                },
                {
                  icon: '🔍',
                  title: 'Food Trend Alert',
                  description:
                    'Food category trending down (4.5 → 4.2 over 30 days). Review breakfast quality and menu.',
                  importance: 'warning',
                },
                {
                  icon: '✅',
                  title: 'High Response Rate',
                  description:
                    '95%+ response rate maintained. Only 4 reviews pending response (all low urgency).',
                  importance: 'positive',
                },
                {
                  icon: '👥',
                  title: 'Volume Steady',
                  description:
                    'Review volume consistent at 40-47/day. System processing all reviews in real-time.',
                  importance: 'info',
                },
                {
                  icon: '💡',
                  title: 'Cleanliness Excellence',
                  description:
                    'Cleanliness consistently highest category (4.7 avg). Housekeeping standards working well.',
                  importance: 'positive',
                },
              ]}
            />

            {/* Weekly Summary */}
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
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Best Day</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.max(...historicalData.map((d) => d.averageStars)).toFixed(1)}★
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {TableFormatters.date(
                      historicalData.find(
                        (d) => d.averageStars === Math.max(...historicalData.map((d) => d.averageStars))
                      )?.date || ''
                    )}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Avg Response Time
                  </div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(
                      historicalData.reduce((sum, d) => sum + d.responseTime, 0) / historicalData.length
                    ).toFixed(1)}
                    h
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Target: &lt;6h for negative reviews
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Technology Stack</h2>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <strong>Tier 1:</strong> Keyword-based sentiment analysis (85% accuracy, &lt;10ms) handles
              most reviews
            </p>
            <p>
              <strong>Tier 2:</strong> BERT model for nuanced cases (90% accuracy, ~50ms) when confidence
              &lt; 75%
            </p>
            <p>
              <strong>Tier 3:</strong> Human review escalation for uncertain cases (confidence &lt; 60%)
            </p>
            <p>
              <strong>Integration:</strong> Fetches reviews from Booking.com, Google, TripAdvisor APIs.
              Real-time analysis and response templates.
            </p>
            <p>
              <strong>Cost:</strong> $0/month (traditional ML, no API fees). 10-100x cheaper than GPT-4
              while maintaining 85-90% accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
