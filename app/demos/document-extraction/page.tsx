/**
 * Document Extraction Demo (Tesseract OCR + LayoutLMv3)
 *
 * Automated extraction of structured data from invoices, receipts, contracts, forms.
 * Technology: Tesseract OCR + Microsoft LayoutLMv3
 * ROI: $720/month ($8,640/year) from labor automation
 * Accuracy: 92% field extraction, 96% OCR text accuracy
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

type ViewTab = 'queue' | 'performance' | 'historical';

type ExtractionStatus = 'extracted' | 'review_needed' | 'failed';

interface ExtractedDoc {
  id: string;
  timestamp: string;
  type: string;
  filename: string;
  status: ExtractionStatus;
  fieldsExtracted: string;
  confidence: number;
  issue?: string;
}

interface ReviewItem {
  id: string;
  type: string;
  filename: string;
  issue: string;
  recommendation: string;
  timeInQueue: string;
}

interface DocTypeStats {
  type: string;
  count: number;
  avgTime: number;
  accuracy: number;
  reviewRate: number;
}

interface HistoricalDay {
  date: string;
  docs: number;
  reviewed: number;
  accuracy: number;
  avgTime: number;
  laborHours: number;
}

// Sample data: Recent extractions
const RECENT_EXTRACTIONS: ExtractedDoc[] = [
  { id: '1', timestamp: '14:35', type: 'Vendor Invoice', filename: 'ABC_Supplies_INV-12345.pdf', status: 'extracted', fieldsExtracted: '9/10', confidence: 96 },
  { id: '2', timestamp: '14:28', type: 'Receipt', filename: 'OfficeSupplies_RCP-8923.jpg', status: 'extracted', fieldsExtracted: '10/10', confidence: 98 },
  { id: '3', timestamp: '14:22', type: 'Guest Registration', filename: 'Chen_Michael_RES-10234.pdf', status: 'extracted', fieldsExtracted: '13/13', confidence: 97 },
  { id: '4', timestamp: '14:18', type: 'Vendor Invoice', filename: 'XYZ_Corp_INV-67890.pdf', status: 'review_needed', fieldsExtracted: '8/10', confidence: 72, issue: 'Low confidence' },
  { id: '5', timestamp: '14:12', type: 'Contract', filename: 'HVAC_Service_CNTR-567.pdf', status: 'extracted', fieldsExtracted: '8/8', confidence: 94 },
];

// Sample data: Pending review
const PENDING_REVIEW: ReviewItem[] = [
  {
    id: '1',
    type: 'Vendor Invoice',
    filename: 'XYZ_Corp_INV-67890.pdf',
    issue: 'Low confidence (72%) for total_amount: $1,234.56',
    recommendation: 'Review scanned image quality, verify total amount matches line items',
    timeInQueue: '12 minutes ago',
  },
  {
    id: '2',
    type: 'Receipt',
    filename: 'Handwritten_Receipt_092.jpg',
    issue: 'Handwriting detection - multiple fields unclear',
    recommendation: 'Manual entry recommended for handwritten receipts (80% accuracy)',
    timeInQueue: '28 minutes ago',
  },
  {
    id: '3',
    type: 'Contract',
    filename: 'Event_Contract_Multi.pdf',
    issue: 'Multi-page document - missing signature page',
    recommendation: 'Upload all contract pages for complete extraction',
    timeInQueue: '1 hour ago',
  },
];

// Sample data: Processing by type
const DOC_TYPE_STATS: DocTypeStats[] = [
  { type: 'Vendor Invoices', count: 180, avgTime: 1.9, accuracy: 94.2, reviewRate: 6.1 },
  { type: 'Receipts', count: 320, avgTime: 1.2, accuracy: 92.1, reviewRate: 8.3 },
  { type: 'Registration Cards', count: 890, avgTime: 1.7, accuracy: 93.8, reviewRate: 4.2 },
  { type: 'Contracts', count: 12, avgTime: 2.4, accuracy: 91.5, reviewRate: 16.7 },
  { type: 'Forms', count: 240, avgTime: 1.5, accuracy: 89.7, reviewRate: 10.4 },
];

// Sample data: Historical
const HISTORICAL_DATA: HistoricalDay[] = [
  { date: 'Oct 19', docs: 58, reviewed: 5, accuracy: 91.2, avgTime: 1.9, laborHours: 0.4 },
  { date: 'Oct 20', docs: 62, reviewed: 4, accuracy: 92.1, avgTime: 1.8, laborHours: 0.3 },
  { date: 'Oct 21', docs: 54, reviewed: 3, accuracy: 92.8, avgTime: 1.7, laborHours: 0.3 },
  { date: 'Oct 22', docs: 67, reviewed: 6, accuracy: 91.5, avgTime: 1.8, laborHours: 0.5 },
  { date: 'Oct 23', docs: 71, reviewed: 5, accuracy: 92.5, avgTime: 1.7, laborHours: 0.4 },
  { date: 'Oct 24', docs: 59, reviewed: 3, accuracy: 93.2, avgTime: 1.7, laborHours: 0.3 },
  { date: 'Oct 25', docs: 42, reviewed: 3, accuracy: 92.3, avgTime: 1.8, laborHours: 0.3 },
];

// Reusable components
const ViewTabs = ({ currentView, onViewChange }: { currentView: ViewTab; onViewChange: (view: ViewTab) => void }) => (
  <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-slate-700">
    {[
      { id: 'queue' as ViewTab, label: 'Processing Queue', icon: '📥' },
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

const StatusBadge = ({ status }: { status: ExtractionStatus }) => {
  const styles = {
    extracted: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    review_needed: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    failed: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };

  const icons = {
    extracted: '✅',
    review_needed: '⚠️',
    failed: '❌',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]} {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

export default function DocumentExtractionDemo() {
  const [currentView, setCurrentView] = useState<ViewTab>('queue');

  const totalProcessed = RECENT_EXTRACTIONS.length * 8;
  const pendingReview = PENDING_REVIEW.length;
  const automationRate = ((totalProcessed - pendingReview) / totalProcessed) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demos/ml" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">📄 Document Extraction (OCR + LayoutLMv3)</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Automated extraction of structured data from invoices, receipts, contracts, and forms
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Tesseract OCR + LayoutLMv3
            </span>
            <span>•</span>
            <span>92% field accuracy</span>
            <span>•</span>
            <span>1.7s processing</span>
            <span>•</span>
            <span className="font-semibold text-green-600 dark:text-green-400">$720/month ROI</span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs currentView={currentView} onViewChange={setCurrentView} />

        {/* View 1: Processing Queue */}
        {currentView === 'queue' && (
          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ROICard label="Processed Today" value={totalProcessed.toString()} subtext="5 document types" color="blue" />
              <ROICard label="Pending Review" value={pendingReview.toString()} subtext="Need attention" color="amber" />
              <ROICard label="Automation Rate" value={`${automationRate.toFixed(1)}%`} subtext="Fully automated" color="green" />
              <ROICard label="Avg Processing" value="1.8s" subtext="↓ 99.3% vs manual" color="green" />
            </div>

            {/* Pending Review Queue */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">⚠️ Pending Review ({PENDING_REVIEW.length})</h2>
              <div className="space-y-4">
                {PENDING_REVIEW.map((item) => (
                  <div key={item.id} className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{item.type}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{item.filename}</span>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">{item.issue}</div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.timeInQueue}</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <strong>Recommendation:</strong> {item.recommendation}
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-900 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-800">
                          View Details
                        </button>
                        <button className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white text-sm rounded hover:bg-green-700">
                          Approve
                        </button>
                        <button className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-300 dark:hover:bg-slate-600">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Extractions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📥 Recent Extractions</h2>
              <div className="space-y-3">
                {RECENT_EXTRACTIONS.map((doc) => (
                  <div key={doc.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-mono text-slate-500 dark:text-slate-400">{doc.timestamp}</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{doc.type}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{doc.filename}</div>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm">
                      <div className="text-slate-600 dark:text-slate-400">Fields: {doc.fieldsExtracted}</div>
                      <div className="text-slate-600 dark:text-slate-400">Confidence: {doc.confidence}%</div>
                      {doc.issue && <div className="text-amber-600 dark:text-amber-400">{doc.issue}</div>}
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
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">2hr/wk</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">87% reduction</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Labor Cost</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">$1,820</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">$224</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">/mo</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">$1,596 saved</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Processing Time</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">4.2min</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">1.8s</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">99.3% faster</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Error Rate</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">3.2%</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">0.8%</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">75% fewer errors</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-baseline space-x-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Savings:</span>
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">$720</span>
                  <span className="text-slate-600 dark:text-slate-400">/month</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">($8,640/year)</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Formula: (15hr - 2hr) × $28/hr × 4.33 weeks/month = $1,596/month (conservative: $720/month)
                </div>
              </div>
            </div>

            {/* Processing By Type */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Processing By Document Type (30 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Type</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Count</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Avg Time</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Accuracy</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Review Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DOC_TYPE_STATS.map((stat) => (
                      <tr key={stat.type} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{stat.type}</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{stat.count}</td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400 font-medium">{stat.avgTime.toFixed(1)}s</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{stat.accuracy.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">{stat.reviewRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">Total</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{DOC_TYPE_STATS.reduce((sum, s) => sum + s.count, 0)}</td>
                      <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                        {(DOC_TYPE_STATS.reduce((sum, s) => sum + s.avgTime * s.count, 0) / DOC_TYPE_STATS.reduce((sum, s) => sum + s.count, 0)).toFixed(1)}s
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                        {(DOC_TYPE_STATS.reduce((sum, s) => sum + s.accuracy * s.count, 0) / DOC_TYPE_STATS.reduce((sum, s) => sum + s.count, 0)).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">
                        {(DOC_TYPE_STATS.reduce((sum, s) => sum + s.reviewRate * s.count, 0) / DOC_TYPE_STATS.reduce((sum, s) => sum + s.count, 0)).toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* System Performance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎯 System Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ROICard label="OCR Accuracy" value="96.4%" subtext="Character-level (Tesseract)" color="green" />
                <ROICard label="Field Extraction" value="92.3%" subtext="LayoutLMv3 accuracy" color="green" />
                <ROICard label="Fully Automated" value="92.8%" subtext="7.2% need review" color="green" />
                <ROICard label="Avg Time" value="1.7s" subtext="Per document" color="blue" />
              </div>
            </div>
          </div>
        )}

        {/* View 3: Historical */}
        {currentView === 'historical' && (
          <div className="space-y-6">
            {/* 7-Day History */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📈 7-Day Processing History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Docs</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Reviewed</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Accuracy</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Avg Time</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Labor Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HISTORICAL_DATA.map((day) => (
                      <tr key={day.date} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{day.date}</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{day.docs}</td>
                        <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">{day.reviewed} ({((day.reviewed / day.docs) * 100).toFixed(1)}%)</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{day.accuracy.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">{day.avgTime.toFixed(1)}s</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-semibold">{day.laborHours.toFixed(1)}hr</td>
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
                <ROICard label="Total Docs" value="413" subtext="All document types" color="blue" />
                <ROICard label="Manual Review" value="29 (7.0%)" subtext="Needed attention" color="amber" />
                <ROICard label="Fully Automated" value="384 (93.0%)" subtext="No review needed" color="green" />
                <ROICard label="Avg Accuracy" value="92.2%" subtext="Field extraction" color="green" />
                <ROICard label="Labor Saved" value="13.1 hrs" subtext="vs 17.3 hrs manual" color="green" />
              </div>
            </div>

            {/* Monthly Insights */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">💡 System Learning Insights (30 Days)</h2>
              <div className="space-y-3">
                {[
                  { icon: '🎯', text: 'Invoice extraction improved 2.1% after vendor template training', color: 'green' },
                  { icon: '⚠️', text: 'Handwritten forms still challenging (80% accuracy) - consider typed forms', color: 'amber' },
                  { icon: '✅', text: 'Receipt processing 99% automated (lowest review rate)', color: 'green' },
                  { icon: '📊', text: 'Peak processing: Monday AM (weekend invoices) - consider batch upload', color: 'blue' },
                  { icon: '🏆', text: 'Registration cards 95.8% accurate (best document type)', color: 'green' },
                  { icon: '💡', text: 'Suggestion: Train LayoutLMv3 on property-specific contract templates', color: 'blue' },
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
                    <span className="text-xl text-slate-500 dark:text-slate-400">89.2%</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ 92.3%</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">+3.5% improvement</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Fully Automated</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">87.1%</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ 93.0%</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">+6.8% improvement</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Labor Hours</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">17.3hr/wk</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ 2.6hr/wk</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">85% reduction</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Processing Time</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">2.1s</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">→ 1.7s</span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">19% faster</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technology Explanation */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-950 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🤖 How Tesseract OCR + LayoutLMv3 Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Technology Stack:</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• <strong>Tesseract OCR:</strong> Text extraction (98% accuracy, 500ms)</li>
                <li>• <strong>LayoutLMv3:</strong> Field classification (92% accuracy, 1200ms)</li>
                <li>• <strong>Total Time:</strong> 1.7 seconds avg (vs. 4.2 minutes manual)</li>
                <li>• <strong>Deployment:</strong> On-premise (Intel NUC) or serverless (AWS Lambda)</li>
                <li>• <strong>HIPAA Compliant:</strong> On-premise processing (no cloud upload)</li>
                <li>• <strong>Cost:</strong> $0/month (free open source)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ROI Breakdown:</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• <strong>Labor Savings:</strong> $1,596/month (13 hours × $28/hr × 4.33 weeks)</li>
                <li>• <strong>Conservative ROI:</strong> $720/month ($8,640/year)</li>
                <li>• <strong>Processing Speed:</strong> 99.3% faster (4.2 min → 1.8 sec)</li>
                <li>• <strong>Error Reduction:</strong> 75% fewer errors (3.2% → 0.8%)</li>
                <li>• <strong>Searchability:</strong> 100% of docs indexed (vs. 0% scanned PDFs)</li>
                <li>• <strong>Payback:</strong> Immediate (no infrastructure cost)</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-700">
            <p className="text-blue-100 text-sm">
              <strong>Why This Approach?</strong> Tesseract extracts text (500ms), LayoutLMv3 understands document structure (1200ms). Hybrid approach achieves 92% field accuracy vs. 70-80% with OCR alone. Commercial APIs cost $500-$2,000/month with cloud dependency and data privacy concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
