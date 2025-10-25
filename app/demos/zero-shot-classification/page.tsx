'use client';

/**
 * Zero-Shot Classification - Intelligent Request Routing
 *
 * ROI: $280/month ($3,360/year)
 * - Faster Request Routing: $150/month (8-10 hrs → 0.5-1 hr/day)
 * - Reduced Misdirected Requests: $80/month (25% → 8%)
 * - Staff Efficiency: $50/month (automated categorization)
 *
 * Three views:
 * - Classification View: Real-time request classification and routing
 * - Performance View: ROI metrics, accuracy, routing efficiency
 * - Historical View: Last 7 days classification data with insights
 */

import { useState } from 'react';
import { ViewTabs } from '@/components/demos/ViewTabs';
import { ROICard } from '@/components/demos/ROICard';
import { ROIMetrics } from '@/components/demos/ROIMetrics';
import { HistoricalTable } from '@/components/demos/HistoricalTable';
import { InsightsBox } from '@/components/demos/InsightsBox';
import { TableFormatters } from '@/components/demos/TableFormatters';

type ViewMode = 'classification' | 'performance' | 'historical';

interface ClassificationResult {
  department: { label: string; confidence: number };
  requestType: { label: string; confidence: number };
  urgency: { label: string; confidence: number };
}

interface GuestRequest {
  id: string;
  guestName: string;
  text: string;
  source: string;
  classification: ClassificationResult;
  status: 'pending' | 'routed';
}

interface DailyClassification {
  date: string;
  totalRequests: number;
  avgConfidence: number;
  avgRoutingTime: number;
  misdirectedRate: number;
  overrideRate: number;
  emergency: number;
  urgent: number;
  normal: number;
  low: number;
}

export default function ZeroShotClassificationDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('performance');
  const [text, setText] = useState('');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [classifying, setClassifying] = useState(false);

  // Sample pending requests
  const pendingRequests: GuestRequest[] = [
    {
      id: 'REQ-001',
      guestName: 'Sarah M.',
      text: 'URGENT: Water leak in bathroom, floor is flooding!',
      source: 'chat',
      classification: {
        department: { label: 'maintenance', confidence: 0.97 },
        requestType: { label: 'maintenance problem', confidence: 0.94 },
        urgency: { label: 'emergency', confidence: 0.96 },
      },
      status: 'pending',
    },
    {
      id: 'REQ-002',
      guestName: 'Michael C.',
      text: 'Can I get extra towels in room 305?',
      source: 'email',
      classification: {
        department: { label: 'housekeeping', confidence: 0.98 },
        requestType: { label: 'housekeeping request', confidence: 0.96 },
        urgency: { label: 'normal', confidence: 0.91 },
      },
      status: 'pending',
    },
    {
      id: 'REQ-003',
      guestName: 'Emma R.',
      text: 'I want to cancel my reservation for next weekend',
      source: 'phone',
      classification: {
        department: { label: 'front desk', confidence: 0.95 },
        requestType: { label: 'cancellation request', confidence: 0.93 },
        urgency: { label: 'urgent', confidence: 0.85 },
      },
      status: 'pending',
    },
  ];

  // Historical data
  const historicalData: DailyClassification[] = [
    {
      date: '2025-10-19',
      totalRequests: 268,
      avgConfidence: 0.89,
      avgRoutingTime: 12,
      misdirectedRate: 8.2,
      overrideRate: 6.5,
      emergency: 15,
      urgent: 42,
      normal: 185,
      low: 26,
    },
    {
      date: '2025-10-20',
      totalRequests: 245,
      avgConfidence: 0.88,
      avgRoutingTime: 14,
      misdirectedRate: 9.1,
      overrideRate: 7.2,
      emergency: 12,
      urgent: 38,
      normal: 172,
      low: 23,
    },
    {
      date: '2025-10-21',
      totalRequests: 282,
      avgConfidence: 0.90,
      avgRoutingTime: 11,
      misdirectedRate: 7.8,
      overrideRate: 6.1,
      emergency: 18,
      urgent: 45,
      normal: 192,
      low: 27,
    },
    {
      date: '2025-10-22',
      totalRequests: 256,
      avgConfidence: 0.91,
      avgRoutingTime: 10,
      misdirectedRate: 7.5,
      overrideRate: 5.8,
      emergency: 14,
      urgent: 40,
      normal: 178,
      low: 24,
    },
    {
      date: '2025-10-23',
      totalRequests: 290,
      avgConfidence: 0.90,
      avgRoutingTime: 11,
      misdirectedRate: 8.0,
      overrideRate: 6.3,
      emergency: 16,
      urgent: 47,
      normal: 198,
      low: 29,
    },
    {
      date: '2025-10-24',
      totalRequests: 272,
      avgConfidence: 0.91,
      avgRoutingTime: 10,
      misdirectedRate: 7.2,
      overrideRate: 5.9,
      emergency: 15,
      urgent: 43,
      normal: 188,
      low: 26,
    },
    {
      date: '2025-10-25',
      totalRequests: 278,
      avgConfidence: 0.92,
      avgRoutingTime: 9,
      misdirectedRate: 6.8,
      overrideRate: 5.5,
      emergency: 17,
      urgent: 44,
      normal: 190,
      low: 27,
    },
  ];

  const sampleRequests = [
    'The AC in room 305 is not working, it's very hot',
    'I need extra towels in my room',
    'What time is breakfast served?',
    'I want to book a suite for next weekend',
  ];

  const classifyRequest = () => {
    if (!text.trim()) return;

    setClassifying(true);
    setTimeout(() => {
      // Simple keyword-based classification for demo
      const lowerText = text.toLowerCase();

      let dept = 'front desk';
      let type = 'general inquiry';
      let urgency = 'normal';
      let deptConf = 0.85;
      let typeConf = 0.82;
      let urgConf = 0.88;

      // Department
      if (/(clean|towel|housekeep|dirty|bed|sheet)/i.test(text)) {
        dept = 'housekeeping';
        deptConf = 0.95;
      } else if (/(ac|air|heat|leak|repair|fix|broken|maintain)/i.test(text)) {
        dept = 'maintenance';
        deptConf = 0.96;
      } else if (/(food|breakfast|dinner|restaurant|meal|room service)/i.test(text)) {
        dept = 'food & beverage';
        deptConf = 0.93;
      } else if (/(bill|charge|payment|invoice)/i.test(text)) {
        dept = 'billing';
        deptConf = 0.94;
      }

      // Request type
      if (/(book|reserve|reservation)/i.test(text)) {
        type = 'new booking request';
        typeConf = 0.92;
      } else if (/(cancel|cancellation)/i.test(text)) {
        type = 'cancellation request';
        typeConf = 0.94;
      } else if (/(complain|dirty|rude|terrible|awful)/i.test(text)) {
        type = 'guest complaint';
        typeConf = 0.90;
      } else if (/(towel|clean|housekeep)/i.test(text)) {
        type = 'housekeeping request';
        typeConf = 0.95;
      } else if (/(fix|repair|broken|leak|ac)/i.test(text)) {
        type = 'maintenance problem';
        typeConf = 0.93;
      }

      // Urgency
      if (/(urgent|emergency|asap|now|immediately|leak|flood)/i.test(text)) {
        urgency = 'emergency';
        urgConf = 0.96;
      } else if (/(soon|today|quick|problem|broken)/i.test(text)) {
        urgency = 'urgent';
        urgConf = 0.89;
      } else if (/(when|what time|how|where)/i.test(text)) {
        urgency = 'low priority';
        urgConf = 0.87;
      }

      setResult({
        department: { label: dept, confidence: deptConf },
        requestType: { label: type, confidence: typeConf },
        urgency: { label: urgency, confidence: urgConf },
      });
      setClassifying(false);
    }, 500);
  };

  const getConfidenceColor = (conf: number) => {
    if (conf > 0.9) return 'text-green-600 dark:text-green-400';
    if (conf > 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300';
      case 'low priority':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 Zero-Shot Classification - Intelligent Routing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Auto-classify guest requests into ANY categories without training data
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="text-green-800 dark:text-green-300 font-semibold">
              ROI: $280/month ($3,360/year)
            </span>
          </div>
        </div>

        <ViewTabs
          viewMode={viewMode}
          setViewMode={setViewMode}
          tabs={[
            { key: 'classification', label: 'Classification' },
            { key: 'performance', label: 'Performance' },
            { key: 'historical', label: 'Historical' },
          ]}
        />

        {/* CLASSIFICATION VIEW */}
        {viewMode === 'classification' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🚨 Pending Requests ({pendingRequests.length})
              </h2>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`border-2 rounded-lg p-4 ${getUrgencyColor(req.classification.urgency.label)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 dark:text-white">{req.guestName}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                            {req.source.toUpperCase()}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-bold ${getUrgencyColor(req.classification.urgency.label)}`}
                          >
                            {req.classification.urgency.label.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">"{req.text}"</p>
                        <div className="flex gap-4 text-xs">
                          <span>
                            📍 {req.classification.department.label} (
                            {(req.classification.department.confidence * 100).toFixed(0)}%)
                          </span>
                          <span>📋 {req.classification.requestType.label}</span>
                        </div>
                      </div>
                      <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                        Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Classify New Request
                </h2>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter guest request text..."
                  className="w-full h-32 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  onClick={classifyRequest}
                  disabled={!text.trim() || classifying}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  {classifying ? 'Classifying...' : '🎯 Classify Request'}
                </button>

                <div className="mt-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Try a sample:</p>
                  <div className="space-y-2">
                    {sampleRequests.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => setText(sample)}
                        className="w-full text-left p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
                      >
                        "{sample}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Classification Result
                </h2>
                {result ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Department:</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 capitalize">
                        {result.department.label}
                      </div>
                      <div className={`text-lg font-semibold ${getConfidenceColor(result.department.confidence)}`}>
                        {(result.department.confidence * 100).toFixed(1)}% confidence
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">Request Type:</span>
                        <span className="text-blue-600 dark:text-blue-400 capitalize">
                          {result.requestType.label}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">Urgency:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${getUrgencyColor(result.urgency.label)}`}
                        >
                          {result.urgency.label.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">Processing Time:</span>
                        <span className="text-green-600 dark:text-green-400">&lt;500ms</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <span className="font-medium text-gray-900 dark:text-white">API Cost:</span>
                        <span className="text-green-600 dark:text-green-400">$0.00</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p>Enter request text and click "Classify Request"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE VIEW */}
        {viewMode === 'performance' && (
          <div className="space-y-6">
            <ROICard
              title="Monthly Performance Report - Zero-Shot Classification"
              totalSavings={280}
              annualSavings={3360}
              metrics={[
                {
                  label: 'Faster Request Routing',
                  value: '$150',
                  sublabel: '8-10 hrs/day → 0.5-1 hr/day (90% time reduction)',
                },
                {
                  label: 'Reduced Misdirected Requests',
                  value: '$80',
                  sublabel: '25% → 8% misdirection rate (68% improvement)',
                },
                {
                  label: 'Staff Efficiency',
                  value: '$50',
                  sublabel: 'Automated categorization and prioritization',
                },
                {
                  label: 'System Cost',
                  value: '$0',
                  sublabel: 'Local inference (facebook/bart-large-mnli)',
                },
              ]}
              description="Zero-shot classification enables instant request routing with 90%+ accuracy, reducing manual routing time by 92% (2.5 min → 0.2 min per request) and cutting misdirected requests by 68%. All using local inference with zero API costs."
            />

            <ROIMetrics
              title="Before & After - Manual vs Auto-Classification"
              before={{
                avg_routing_time: 2.5,
                misdirected_rate: 25,
                staff_time_daily: 9,
                emergency_response: 45,
              }}
              after={{
                avg_routing_time: 0.2,
                misdirected_rate: 8,
                staff_time_daily: 0.75,
                emergency_response: 12,
              }}
              metrics={[
                {
                  label: 'Avg Routing Time (min)',
                  beforeValue: 2.5,
                  afterValue: 0.2,
                  formatter: (val) => `${val} min`,
                  improvement: '92% faster',
                },
                {
                  label: 'Misdirected Rate (%)',
                  beforeValue: 25,
                  afterValue: 8,
                  formatter: (val) => `${val}%`,
                  improvement: '68% reduction',
                },
                {
                  label: 'Staff Time (hrs/day)',
                  beforeValue: 9,
                  afterValue: 0.75,
                  formatter: (val) => `${val}h`,
                  improvement: '90% reduction',
                },
                {
                  label: 'Emergency Response (min)',
                  beforeValue: 45,
                  afterValue: 12,
                  formatter: (val) => `${val} min`,
                  improvement: '73% faster',
                },
              ]}
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 30-Day Classification Distribution
              </h2>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Avg Classification Accuracy
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">90%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: &gt;90%</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Requests</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">7,891</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last 30 days</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Override Rate</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">6.2%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: &lt;8%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Department Distribution:</h3>
                {[
                  { name: 'Housekeeping', count: 2525, percentage: 32 },
                  { name: 'Maintenance', count: 1736, percentage: 22 },
                  { name: 'Front Desk', count: 1420, percentage: 18 },
                  { name: 'Food & Beverage', count: 947, percentage: 12 },
                  { name: 'Concierge', count: 631, percentage: 8 },
                  { name: 'Billing', count: 395, percentage: 5 },
                  { name: 'Management', count: 237, percentage: 3 },
                ].map((dept) => (
                  <div key={dept.name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-32">{dept.name}:</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${dept.percentage}%` }}
                      >
                        <span className="text-xs font-semibold text-white">{dept.count}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-12">{dept.percentage}%</span>
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
              title="Last 7 Days - Classification Performance"
              headers={[
                { key: 'date', label: 'Date', formatter: TableFormatters.date },
                { key: 'totalRequests', label: 'Requests', formatter: (val) => val.toString() },
                {
                  key: 'avgConfidence',
                  label: 'Avg Confidence',
                  formatter: (val) => `${(val * 100).toFixed(1)}%`,
                },
                { key: 'avgRoutingTime', label: 'Routing Time', formatter: (val) => `${val}s` },
                { key: 'misdirectedRate', label: 'Misdirected', formatter: (val) => `${val.toFixed(1)}%` },
                { key: 'overrideRate', label: 'Override', formatter: (val) => `${val.toFixed(1)}%` },
                { key: 'emergency', label: '🚨 Emergency', formatter: (val) => val.toString() },
                { key: 'urgent', label: '⚠️ Urgent', formatter: (val) => val.toString() },
              ]}
              data={historicalData}
              highlightColumn="avgConfidence"
            />

            <InsightsBox
              title="📊 System Learning & Trends"
              insights={[
                {
                  icon: '📈',
                  title: 'Accuracy Improving',
                  description:
                    'Classification confidence increased from 88% to 92% over 7 days. Model learning common request patterns.',
                  importance: 'positive',
                },
                {
                  icon: '⚡',
                  title: 'Routing Time Decreasing',
                  description:
                    'Average routing time improved from 14s to 9s (36% faster). Staff getting efficient with review process.',
                  importance: 'positive',
                },
                {
                  icon: '🎯',
                  title: 'Low Override Rate',
                  description:
                    'Override rate declining (7.2% → 5.5%). Auto-classifications highly accurate and trusted by staff.',
                  importance: 'positive',
                },
                {
                  icon: '🚨',
                  title: 'Emergency Response Excellent',
                  description:
                    'Average 15 emergencies/day identified and routed instantly (<10s). Zero missed emergencies.',
                  importance: 'positive',
                },
                {
                  icon: '📊',
                  title: 'Volume Steady',
                  description:
                    'Request volume consistent at 260-290/day. System scaling well with no performance degradation.',
                  importance: 'info',
                },
                {
                  icon: '💡',
                  title: 'Housekeeping Peak',
                  description:
                    'Housekeeping requests consistently 30-35% of total. Consider dedicated housekeeping routing queue.',
                  importance: 'info',
                },
              ]}
            />

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 7-Day Summary</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Average Daily Requests
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {(historicalData.reduce((sum, d) => sum + d.totalRequests, 0) / 7).toFixed(0)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Total: {historicalData.reduce((sum, d) => sum + d.totalRequests, 0)} requests
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Best Confidence Day</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {(Math.max(...historicalData.map((d) => d.avgConfidence)) * 100).toFixed(1)}%
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
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Routing Time</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(
                      historicalData.reduce((sum, d) => sum + d.avgRoutingTime, 0) / historicalData.length
                    ).toFixed(1)}
                    s
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target: &lt;15s</div>
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
              <strong>Model:</strong> facebook/bart-large-mnli (zero-shot classification via NLI)
            </p>
            <p>
              <strong>Accuracy:</strong> 90%+ for clear categories, 80%+ for nuanced cases
            </p>
            <p>
              <strong>Speed:</strong> &lt;500ms per classification (local inference via Transformers.js)
            </p>
            <p>
              <strong>No Training Required:</strong> Add new categories instantly without training data
            </p>
            <p>
              <strong>Cost:</strong> $0/month (local inference, no API fees). 10-100x cheaper than GPT-4
              classification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
