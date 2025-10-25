/**
 * Speech Transcription Demo (OpenAI Whisper)
 *
 * Automated transcription of audio to text using Whisper for call center QA, voice notes.
 * Technology: OpenAI Whisper (95-98% accuracy, 99 languages)
 * ROI: $550/month ($6,600/year) from call center QA automation
 * Accuracy: 95.5% WER, 100% call coverage vs 1.5% manual
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

type ViewTab = 'queue' | 'performance' | 'historical';

type CallStatus = 'transcribed' | 'review_flagged' | 'reviewed';

interface TranscribedCall {
  id: string;
  timestamp: string;
  caller: string;
  duration: string;
  type: string;
  status: CallStatus;
  confidence: number;
  sentiment?: number;
}

interface FlaggedCall {
  id: string;
  caller: string;
  keywords: string[];
  sentiment: number;
  responseQuality: number;
  recommendation: string;
  time: string;
}

interface CallCategory {
  category: string;
  count: number;
  avgDuration: string;
  avgSentiment: number;
  topKeywords: string;
}

interface HistoricalDay {
  date: string;
  calls: number;
  flagged: number;
  accuracy: number;
  avgTime: number;
  laborHours: number;
}

// Sample data
const RECENT_CALLS: TranscribedCall[] = [
  { id: '1', timestamp: '14:35', caller: 'Room 305 / Mr. Chen', duration: '2:15', type: 'Complaint', status: 'review_flagged', confidence: 96, sentiment: -0.65 },
  { id: '2', timestamp: '14:28', caller: 'Room 412 / Ms. Williams', duration: '1:45', type: 'Inquiry', status: 'transcribed', confidence: 98, sentiment: 0.15 },
  { id: '3', timestamp: '14:22', caller: 'External / John Smith', duration: '4:20', type: 'Reservation', status: 'transcribed', confidence: 95, sentiment: 0.42 },
  { id: '4', timestamp: '14:18', caller: 'Room 508 / Mrs. Garcia', duration: '3:10', type: 'Praise', status: 'reviewed', confidence: 97, sentiment: 0.82 },
  { id: '5', timestamp: '14:12', caller: 'Room 201 / Mr. Taylor', duration: '2:50', type: 'Complaint', status: 'review_flagged', confidence: 94, sentiment: -0.48 },
];

const FLAGGED_CALLS: FlaggedCall[] = [
  {
    id: '1',
    caller: 'Room 305 / Mr. Chen',
    keywords: ['not working', 'quite urgent', 'business meeting'],
    sentiment: -0.65,
    responseQuality: 8.2,
    recommendation: 'Training example: good recovery response. Staff escalated appropriately.',
    time: '45 minutes ago',
  },
  {
    id: '2',
    caller: 'Room 201 / Mr. Taylor',
    keywords: ['slow check-in', 'waited 20 minutes', 'frustrated'],
    sentiment: -0.48,
    responseQuality: 6.5,
    recommendation: 'Review staffing during peak hours (2-4pm). Consider mobile check-in.',
    time: '58 minutes ago',
  },
  {
    id: '3',
    caller: 'Room 615 / Ms. Anderson',
    keywords: ['noisy neighbors', 'late night', 'sleep'],
    sentiment: -0.52,
    responseQuality: 7.8,
    recommendation: 'Room reassignment offered. Follow-up needed to ensure resolution.',
    time: '2 hours ago',
  },
];

const CALL_CATEGORIES: CallCategory[] = [
  { category: 'Reservations', count: 3240, avgDuration: '3:45', avgSentiment: 0.42, topKeywords: 'book, availability, price' },
  { category: 'Complaints', count: 680, avgDuration: '5:12', avgSentiment: -0.58, topKeywords: 'not working, issue, disappointed' },
  { category: 'Inquiries', count: 4120, avgDuration: '2:30', avgSentiment: 0.15, topKeywords: 'pool hours, breakfast, checkout' },
  { category: 'Praise', count: 320, avgDuration: '2:10', avgSentiment: 0.78, topKeywords: 'wonderful, excellent, thank you' },
  { category: 'Other', count: 1640, avgDuration: '2:50', avgSentiment: 0.08, topKeywords: 'Various' },
];

const HISTORICAL_DATA: HistoricalDay[] = [
  { date: 'Oct 19', calls: 278, flagged: 22, accuracy: 95.2, avgTime: 2.4, laborHours: 1.8 },
  { date: 'Oct 20', calls: 295, flagged: 18, accuracy: 95.5, avgTime: 2.3, laborHours: 1.5 },
  { date: 'Oct 21', calls: 261, flagged: 16, accuracy: 95.8, avgTime: 2.2, laborHours: 1.3 },
  { date: 'Oct 22', calls: 302, flagged: 24, accuracy: 95.3, avgTime: 2.4, laborHours: 2.0 },
  { date: 'Oct 23', calls: 288, flagged: 19, accuracy: 95.7, avgTime: 2.3, laborHours: 1.6 },
  { date: 'Oct 24', calls: 271, flagged: 15, accuracy: 96.0, avgTime: 2.2, laborHours: 1.2 },
  { date: 'Oct 25', calls: 284, flagged: 18, accuracy: 95.8, avgTime: 2.3, laborHours: 1.5 },
];

// Reusable components
const ViewTabs = ({ currentView, onViewChange }: { currentView: ViewTab; onViewChange: (view: ViewTab) => void }) => (
  <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-slate-700">
    {[
      { id: 'queue' as ViewTab, label: 'Transcription Queue', icon: '🎙️' },
      { id: 'performance' as ViewTab, label: 'Performance', icon: '📊' },
      { id: 'historical' as ViewTab, label: 'Historical', icon: '📈' },
    ].map(({ id, label, icon }) => (
      <button
        key={id}
        onClick={() => onViewChange(id)}
        className={`px-4 py-2 font-semibold transition-colors ${
          currentView === id
            ? 'text-blue-900 dark:text-blue-100 border-b-2 border-blue-900 dark:border-blue-400'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        {icon} {label}
      </button>
    ))}
  </div>
);

const ROICard = ({ label, value, subtext, color = 'blue' }: { label: string; value: string; subtext: string; color?: string }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} rounded-lg p-4`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-70 mt-1">{subtext}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: CallStatus }) => {
  const styles = {
    transcribed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    review_flagged: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    reviewed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  };

  const icons = {
    transcribed: '✅',
    review_flagged: '⚠️',
    reviewed: '👁️',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]} {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

export default function SpeechTranscriptionDemo() {
  const [currentView, setCurrentView] = useState<ViewTab>('queue');

  const totalTranscribed = RECENT_CALLS.length * 57;
  const flaggedForReview = FLAGGED_CALLS.length * 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demos/ml" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">🎙️ Speech Transcription (Whisper)</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Automated call transcription using OpenAI Whisper for quality assurance and insights
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Whisper Medium (95.5% accuracy)
            </span>
            <span>•</span>
            <span>99 languages</span>
            <span>•</span>
            <span>100% coverage</span>
            <span>•</span>
            <span className="font-semibold text-green-600 dark:text-green-400">$550/month ROI</span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs currentView={currentView} onViewChange={setCurrentView} />

        {/* View 1: Transcription Queue */}
        {currentView === 'queue' && (
          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ROICard label="Calls Transcribed" value={totalTranscribed.toString()} subtext="Today, 100% coverage" color="blue" />
              <ROICard label="Flagged for Review" value={`${flaggedForReview} (${((flaggedForReview / totalTranscribed) * 100).toFixed(1)}%)`} subtext="Complaints, issues" color="amber" />
              <ROICard label="Avg Transcription" value="2.3 min" subtext="Whisper Medium (2x realtime)" color="green" />
              <ROICard label="Accuracy" value="95.8%" subtext="Word Error Rate 4.2%" color="green" />
            </div>

            {/* Flagged Calls Queue */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">⚠️ Flagged Calls ({FLAGGED_CALLS.length})</h2>
              <div className="space-y-4">
                {FLAGGED_CALLS.map((call) => (
                  <div key={call.id} className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{call.caller}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <strong>Keywords:</strong> {call.keywords.join(', ')}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{call.time}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                      <div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Sentiment</div>
                        <div className={`font-semibold ${call.sentiment < -0.5 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {call.sentiment.toFixed(2)} (Negative)
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Response Quality</div>
                        <div className="font-semibold text-green-600 dark:text-green-400">{call.responseQuality}/10</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <strong>Recommendation:</strong> {call.recommendation}
                      </div>
                      <button className="px-3 py-1 bg-blue-900 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-800">
                        View Transcript
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transcriptions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📞 Recent Transcriptions</h2>
              <div className="space-y-3">
                {RECENT_CALLS.map((call) => (
                  <div key={call.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-mono text-slate-500 dark:text-slate-400">{call.timestamp}</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{call.caller}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">({call.duration})</div>
                      </div>
                      <StatusBadge status={call.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm">
                      <div className="text-slate-600 dark:text-slate-400">Type: {call.type}</div>
                      <div className="text-slate-600 dark:text-slate-400">Confidence: {call.confidence}%</div>
                      {call.sentiment !== undefined && (
                        <div className={`font-medium ${call.sentiment > 0.5 ? 'text-green-600' : call.sentiment < -0.3 ? 'text-red-600' : 'text-slate-600'}`}>
                          Sentiment: {call.sentiment.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View 2: Performance */}
        {currentView === 'performance' && (
          <div className="space-y-6">
            {/* ROI Metrics */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">💰 ROI Analysis (30 Days)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Labor Hours</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">15hr/wk</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">3hr/wk</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">80% reduction</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Call Coverage</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">1.5%</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">100%</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">67x increase</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Time to Insights</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">2-3 days</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">&lt;1hr</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">98% faster</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Searchable</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">No</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">Yes</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">100% searchable</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-baseline space-x-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Savings:</span>
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">$550</span>
                  <span className="text-slate-600 dark:text-slate-400">/month</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">($6,600/year)</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Formula: (15hr - 3hr) × $26/hr × 4.33 weeks/month = $1,350/month (conservative: $550/month)
                </div>
              </div>
            </div>

            {/* Call Category Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Call Category Breakdown (30 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Count</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Avg Duration</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Avg Sentiment</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Top Keywords</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CALL_CATEGORIES.map((cat) => (
                      <tr key={cat.category} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{cat.category}</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{cat.count.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">{cat.avgDuration}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${cat.avgSentiment > 0.5 ? 'text-green-600' : cat.avgSentiment < -0.3 ? 'text-red-600' : 'text-slate-600'}`}>
                            {cat.avgSentiment > 0 ? '+' : ''}{cat.avgSentiment.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">{cat.topKeywords}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">Total</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{CALL_CATEGORIES.reduce((sum, c) => sum + c.count, 0).toLocaleString()}</td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* System Performance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎯 System Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ROICard label="Average Accuracy" value="95.5%" subtext="Word Error Rate 4.5%" color="green" />
                <ROICard label="Languages Detected" value="8" subtext="English, Spanish, French..." color="blue" />
                <ROICard label="Avg Transcription" value="2.3 min" subtext="Whisper Medium (2x realtime)" color="green" />
                <ROICard label="Coverage" value="100%" subtext="All calls transcribed" color="green" />
              </div>
            </div>
          </div>
        )}

        {/* View 3: Historical */}
        {currentView === 'historical' && (
          <div className="space-y-6">
            {/* 7-Day History */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📈 7-Day Transcription History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Calls</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Flagged</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Accuracy</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Avg Time</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Labor Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HISTORICAL_DATA.map((day) => (
                      <tr key={day.date} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{day.date}</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{day.calls}</td>
                        <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">{day.flagged} ({((day.flagged / day.calls) * 100).toFixed(1)}%)</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{day.accuracy.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">{day.avgTime.toFixed(1)} min</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-semibold">{day.laborHours.toFixed(1)} hr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Weekly Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <ROICard label="Total Calls" value="1,979" subtext="All transcribed" color="blue" />
                <ROICard label="Flagged" value="132 (6.7%)" subtext="For review" color="amber" />
                <ROICard label="Avg Accuracy" value="95.6%" subtext="WER 4.4%" color="green" />
                <ROICard label="Labor Saved" value="10.8 hrs" subtext="vs 25.7 hrs manual" color="green" />
                <ROICard label="Savings" value="$390" subtext="This week" color="green" />
              </div>
            </div>

            {/* Monthly Insights */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">💡 Automated Theme Detection (30 Days)</h2>
              <div className="space-y-3">
                {[
                  { icon: '🎯', text: 'AC complaint spike detected (42 calls, +65% vs last month) - maintenance needed', color: 'amber' },
                  { icon: '✅', text: 'Staff response quality improved 12% after customer service training', color: 'green' },
                  { icon: '⚠️', text: 'Spanish call volume +28% - consider bilingual staff expansion', color: 'amber' },
                  { icon: '📊', text: 'Peak complaint hours: 2-4pm (housekeeping changeover) - staffing issue?', color: 'blue' },
                  { icon: '🏆', text: 'Sarah (front desk) maintains 9.2/10 satisfaction across 89 calls', color: 'green' },
                  { icon: '💡', text: 'Create knowledge base from top 20 FAQ calls (72% of inquiries)', color: 'blue' },
                ].map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      insight.color === 'green'
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : insight.color === 'amber'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <p className="text-slate-700 dark:text-slate-300 pt-1">{insight.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 30-Day Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📈 30-Day Improvement Trends</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Accuracy</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">94.8%</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ 95.6%</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">+0.8% improvement</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Flagged Calls</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">8.2%</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ 6.7%</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">18% reduction</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Labor Hours</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">60hr/mo</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ 12hr/mo</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">80% reduction</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Response Time</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">2.3d</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">→ 4.2hr</span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">95% faster</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technology Explanation */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-950 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🤖 How OpenAI Whisper Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Technology Stack:</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• <strong>Model:</strong> OpenAI Whisper Medium (769MB)</li>
                <li>• <strong>Accuracy:</strong> 95-98% (WER 2-5%)</li>
                <li>• <strong>Languages:</strong> 99 supported (multilingual hotels)</li>
                <li>• <strong>Speed:</strong> 2x realtime (30min call in 15min)</li>
                <li>• <strong>Deployment:</strong> On-premise (Intel NUC) or cloud</li>
                <li>• <strong>Cost:</strong> $0/month (free open source)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ROI Breakdown:</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• <strong>Labor Savings:</strong> $1,350/month (12 hours × $26/hr × 4.33 weeks)</li>
                <li>• <strong>Conservative ROI:</strong> $550/month ($6,600/year)</li>
                <li>• <strong>Call Coverage:</strong> 100% vs 1.5% manual (67x increase)</li>
                <li>• <strong>Time to Insights:</strong> 98% faster (&lt;1hr vs 2-3 days)</li>
                <li>• <strong>Searchability:</strong> 100% of calls indexed (instant keyword search)</li>
                <li>• <strong>Payback:</strong> Immediate (no infrastructure cost)</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-700">
            <p className="text-blue-100 text-sm">
              <strong>Why Whisper?</strong> 95-98% accuracy (vs. 96-99% commercial APIs), $0 cost (vs. $0.006/min = $360/year), on-premise privacy (HIPAA compliant), 99 languages (multilingual support). Commercial APIs offer marginally better accuracy but with recurring costs and cloud dependency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
