/**
 * PPE Detection Demo (YOLOv8 Safety Compliance)
 *
 * Real-time personal protective equipment detection using YOLOv8 object detection.
 * Technology: YOLOv8m fine-tuned for PPE detection
 * ROI: $650/month ($7,800/year) from insurance savings + injury prevention
 * Accuracy: 87% mAP@0.5, <100ms inference on CPU
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

type ViewTab = 'monitor' | 'performance' | 'historical';

type DetectionStatus = 'compliant' | 'warning' | 'violation';

interface Detection {
  id: string;
  timestamp: string;
  area: string;
  cameraId: string;
  employeeId: string;
  status: DetectionStatus;
  detected: string[];
  missing: string[];
  complianceScore: number;
  inferenceTime: number;
  alertSent: boolean;
  acknowledged: boolean;
}

interface ViolationAlert {
  id: string;
  area: string;
  issue: string;
  riskLevel: 'high' | 'medium' | 'low';
  missing: string[];
  recommendation: string;
  lastSeen: string;
  occurrences: number;
}

interface AreaStats {
  area: string;
  checks: number;
  compliant: number;
  violations: number;
  rate: number;
  trend: string;
  trendPercent: number;
}

interface HistoricalDay {
  date: string;
  checks: number;
  violations: number;
  rate: number;
  avgResponseTime: number;
  injuries: number;
}

// Sample data: Recent detections
const RECENT_DETECTIONS: Detection[] = [
  {
    id: '1',
    timestamp: '13:45',
    area: 'Main Kitchen',
    cameraId: 'CAM-K01',
    employeeId: '#2847',
    status: 'warning',
    detected: ['hairnet', 'apron'],
    missing: ['gloves'],
    complianceScore: 66.7,
    inferenceTime: 42,
    alertSent: true,
    acknowledged: true,
  },
  {
    id: '2',
    timestamp: '13:38',
    area: 'Maintenance Room',
    cameraId: 'CAM-M02',
    employeeId: '#1523',
    status: 'violation',
    detected: ['vest'],
    missing: ['hardhat', 'gloves'],
    complianceScore: 33.3,
    inferenceTime: 48,
    alertSent: true,
    acknowledged: false,
  },
  {
    id: '3',
    timestamp: '13:31',
    area: 'Housekeeping Storage',
    cameraId: 'CAM-H03',
    employeeId: '#3092',
    status: 'compliant',
    detected: ['gloves', 'vest'],
    missing: [],
    complianceScore: 100,
    inferenceTime: 39,
    alertSent: false,
    acknowledged: false,
  },
  {
    id: '4',
    timestamp: '13:22',
    area: 'Pool Deck',
    cameraId: 'CAM-P01',
    employeeId: '#1847',
    status: 'warning',
    detected: ['gloves'],
    missing: ['goggles'],
    complianceScore: 50,
    inferenceTime: 44,
    alertSent: true,
    acknowledged: true,
  },
  {
    id: '5',
    timestamp: '13:15',
    area: 'Medical Office',
    cameraId: 'CAM-MD01',
    employeeId: '#2198',
    status: 'compliant',
    detected: ['mask', 'gloves', 'coat'],
    missing: [],
    complianceScore: 100,
    inferenceTime: 46,
    alertSent: false,
    acknowledged: false,
  },
];

// Sample data: Active violation alerts
const ACTIVE_ALERTS: ViolationAlert[] = [
  {
    id: '1',
    area: 'Maintenance Room',
    issue: 'Employee without hardhat detected 3 times in last hour',
    riskLevel: 'high',
    missing: ['hardhat', 'gloves'],
    recommendation: 'Supervisor intervention required - potential OSHA violation',
    lastSeen: '8 minutes ago',
    occurrences: 3,
  },
  {
    id: '2',
    area: 'Pool Deck',
    issue: 'Chemical handling without goggles - 2 occurrences',
    riskLevel: 'high',
    missing: ['goggles'],
    recommendation: 'Immediate PPE reminder - eye injury risk',
    lastSeen: '23 minutes ago',
    occurrences: 2,
  },
  {
    id: '3',
    area: 'Main Kitchen',
    issue: 'Repeated glove violations during food prep',
    riskLevel: 'medium',
    missing: ['gloves'],
    recommendation: 'Schedule food safety refresher training',
    lastSeen: '15 minutes ago',
    occurrences: 4,
  },
];

// Sample data: Area compliance stats
const AREA_STATS: AreaStats[] = [
  { area: 'Kitchen', checks: 1247, compliant: 1089, violations: 158, rate: 87.3, trend: 'up', trendPercent: 2.1 },
  { area: 'Maintenance', checks: 623, compliant: 541, violations: 82, rate: 86.8, trend: 'flat', trendPercent: 0.0 },
  { area: 'Housekeeping', checks: 892, compliant: 831, violations: 61, rate: 93.2, trend: 'up', trendPercent: 1.5 },
  { area: 'Medical', checks: 178, compliant: 167, violations: 11, rate: 93.8, trend: 'up', trendPercent: 0.8 },
  { area: 'Pool', checks: 234, compliant: 198, violations: 36, rate: 84.6, trend: 'down', trendPercent: -1.2 },
];

// Sample data: Historical performance
const HISTORICAL_DATA: HistoricalDay[] = [
  { date: 'Oct 19', checks: 142, violations: 22, rate: 84.5, avgResponseTime: 4.2, injuries: 0 },
  { date: 'Oct 20', checks: 156, violations: 18, rate: 88.5, avgResponseTime: 3.8, injuries: 0 },
  { date: 'Oct 21', checks: 138, violations: 16, rate: 88.4, avgResponseTime: 3.5, injuries: 0 },
  { date: 'Oct 22', checks: 149, violations: 14, rate: 90.6, avgResponseTime: 3.2, injuries: 0 },
  { date: 'Oct 23', checks: 161, violations: 12, rate: 92.5, avgResponseTime: 2.8, injuries: 0 },
  { date: 'Oct 24', checks: 147, violations: 15, rate: 89.8, avgResponseTime: 3.1, injuries: 0 },
  { date: 'Oct 25', checks: 142, violations: 18, rate: 87.3, avgResponseTime: 3.4, injuries: 0 },
];

// Reusable components
const ViewTabs = ({ currentView, onViewChange }: { currentView: ViewTab; onViewChange: (view: ViewTab) => void }) => (
  <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-slate-700">
    {[
      { id: 'monitor' as ViewTab, label: 'Violation Monitor', icon: '🚨' },
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
    red: 'bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} rounded-lg p-4`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-70 mt-1">{subtext}</div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: DetectionStatus }) => {
  const styles = {
    compliant: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    warning: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    violation: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  };

  const icons = {
    compliant: '✅',
    warning: '⚠️',
    violation: '🚨',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]} {status.toUpperCase()}
    </span>
  );
};

export default function PPEDetectionDemo() {
  const [currentView, setCurrentView] = useState<ViewTab>('monitor');

  const totalChecksToday = RECENT_DETECTIONS.length * 28; // Extrapolate
  const violationsToday = RECENT_DETECTIONS.filter((d) => d.status !== 'compliant').length * 28;
  const complianceRate = ((totalChecksToday - violationsToday) / totalChecksToday) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demos/ml" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">🦺 PPE Detection (Safety Compliance)</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Real-time personal protective equipment monitoring using YOLOv8 object detection
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              YOLOv8m (87% accuracy)
            </span>
            <span>•</span>
            <span>45ms inference</span>
            <span>•</span>
            <span>$0 cost</span>
            <span>•</span>
            <span className="font-semibold text-green-600 dark:text-green-400">$650/month ROI</span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs currentView={currentView} onViewChange={setCurrentView} />

        {/* View 1: Violation Monitor */}
        {currentView === 'monitor' && (
          <div className="space-y-6">
            {/* Today's Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ROICard label="Total Checks Today" value={totalChecksToday.toString()} subtext="Across 5 areas" color="blue" />
              <ROICard label="Violations Found" value={`${violationsToday} (${((violationsToday / totalChecksToday) * 100).toFixed(1)}%)`} subtext="18 need attention" color="amber" />
              <ROICard label="Active Alerts" value="3" subtext="High-risk violations" color="red" />
              <ROICard label="Compliance Rate" value={`${complianceRate.toFixed(1)}%`} subtext="↑ +2.8% vs yesterday" color="green" />
            </div>

            {/* Active Violation Alerts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🚨 Active Violation Alerts</h2>
              <div className="space-y-4">
                {ACTIVE_ALERTS.map((alert) => (
                  <div key={alert.id} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{alert.area}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            alert.riskLevel === 'high'
                              ? 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200'
                              : alert.riskLevel === 'medium'
                              ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                              : 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200'
                          }`}>
                            {alert.riskLevel === 'high' ? '🚨 HIGH' : alert.riskLevel === 'medium' ? '⚠️ MEDIUM' : 'ℹ️ LOW'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">{alert.issue}</div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{alert.lastSeen}</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <strong>Missing PPE:</strong> {alert.missing.join(', ')}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <strong>Recommendation:</strong> {alert.recommendation}
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-900 dark:bg-blue-700 text-white text-sm rounded hover:bg-blue-800">
                          View Snapshot
                        </button>
                        <button className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-300 dark:hover:bg-slate-600">
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Detections Feed */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📹 Recent Detections</h2>
              <div className="space-y-3">
                {RECENT_DETECTIONS.map((detection) => (
                  <div key={detection.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-mono text-slate-500 dark:text-slate-400">{detection.timestamp}</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{detection.area}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">({detection.cameraId})</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Employee {detection.employeeId}</div>
                      </div>
                      <StatusBadge status={detection.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                      <div>
                        <div className="text-slate-600 dark:text-slate-400 mb-1">✓ Detected PPE:</div>
                        <div className="flex flex-wrap gap-1">
                          {detection.detected.map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        {detection.missing.length > 0 && (
                          <>
                            <div className="text-slate-600 dark:text-slate-400 mb-1">✗ Missing PPE:</div>
                            <div className="flex flex-wrap gap-1">
                              {detection.missing.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                      <div>Compliance: {detection.complianceScore.toFixed(1)}%</div>
                      <div>Inference: {detection.inferenceTime}ms</div>
                      <div>{detection.alertSent ? '✉️ Alert sent' : ''} {detection.acknowledged ? '✓ Acknowledged' : ''}</div>
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">💰 ROI Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Insurance Premium</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">$60,000</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">$54,000</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">/year</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">-10% reduction (compliance proof)</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Labor Cost</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">$20,280</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">$4,056</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">/year</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">-80% (automated monitoring)</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Injury Costs</div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400 line-through">$8,000</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">$2,000</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">/year</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">-75% (prevention)</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-baseline space-x-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Monthly Savings:</span>
                  <span className="text-4xl font-bold text-green-600 dark:text-green-400">$650</span>
                  <span className="text-slate-600 dark:text-slate-400">/month</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">($7,800/year)</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Formula: ($6,000 insurance + $1,224 labor + $600 injury prevention) ÷ 12 months = $650/month
                </div>
              </div>
            </div>

            {/* Compliance By Area Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📊 Compliance By Area (30 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Area</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Checks</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Compliant</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Violations</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AREA_STATS.map((stat) => (
                      <tr key={stat.area} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{stat.area}</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{stat.checks.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-medium">{stat.compliant.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400 font-medium">{stat.violations}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{stat.rate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center text-xs ${
                            stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'} {Math.abs(stat.trendPercent).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">Total</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                        {AREA_STATS.reduce((sum, s) => sum + s.checks, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                        {AREA_STATS.reduce((sum, s) => sum + s.compliant, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                        {AREA_STATS.reduce((sum, s) => sum + s.violations, 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                        {((AREA_STATS.reduce((sum, s) => sum + s.compliant, 0) / AREA_STATS.reduce((sum, s) => sum + s.checks, 0)) * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Detection Accuracy */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎯 System Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ROICard label="Overall Accuracy" value="87%" subtext="mAP@0.5 (YOLOv8m)" color="green" />
                <ROICard label="Avg Inference Time" value="45ms" subtext="22 FPS on Intel NUC CPU" color="blue" />
                <ROICard label="False Positives" value="3.2%" subtext="Conservative (better safe)" color="amber" />
                <ROICard label="False Negatives" value="8.1%" subtext="Staff training reminder" color="amber" />
              </div>
            </div>
          </div>
        )}

        {/* View 3: Historical */}
        {currentView === 'historical' && (
          <div className="space-y-6">
            {/* 7-Day Performance History */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📈 7-Day Performance History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Checks</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Violations</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Avg Response</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Injuries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HISTORICAL_DATA.map((day) => (
                      <tr key={day.date} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{day.date}</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{day.checks}</td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">{day.violations}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{day.rate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{day.avgResponseTime.toFixed(1)} min</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400 font-semibold">{day.injuries}</td>
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
                <ROICard
                  label="Total Checks"
                  value={HISTORICAL_DATA.reduce((sum, d) => sum + d.checks, 0).toLocaleString()}
                  subtext="Across all areas"
                  color="blue"
                />
                <ROICard
                  label="Violations"
                  value={`${HISTORICAL_DATA.reduce((sum, d) => sum + d.violations, 0)} (11.1%)`}
                  subtext="Down from 15.2%"
                  color="amber"
                />
                <ROICard
                  label="Compliance Rate"
                  value="88.9%"
                  subtext="↑ +3.7% vs last week"
                  color="green"
                />
                <ROICard
                  label="Avg Response Time"
                  value="3.4 min"
                  subtext="Alert → Action"
                  color="blue"
                />
                <ROICard
                  label="Injuries"
                  value="0"
                  subtext="Zero incidents"
                  color="green"
                />
              </div>
            </div>

            {/* Monthly Insights */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">💡 System Learning Insights (30 Days)</h2>
              <div className="space-y-3">
                {[
                  { icon: '🎯', text: 'Kitchen compliance improved 8.2% after glove reminder training', color: 'green' },
                  { icon: '⚠️', text: 'Pool area needs attention - 15.4% violation rate (goggles)', color: 'amber' },
                  { icon: '✅', text: 'Maintenance team 100% compliant for 3 consecutive days', color: 'green' },
                  { icon: '📊', text: 'Peak violations: 2-4pm shift change (brief 76% compliance)', color: 'blue' },
                  { icon: '🏆', text: 'Medical staff maintains 93.8% compliance (best in property)', color: 'green' },
                  { icon: '💡', text: 'Suggestion: Add PPE stations near high-traffic area entrances', color: 'blue' },
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

            {/* 30-Day Improvement Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">📈 30-Day Improvement Trends</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Compliance Rate</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">82%</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ 91%</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">+11% improvement</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Avg Response Time</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">8.2 min</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">→ 3.4 min</span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">59% faster</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Insurance Premium</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">$60K</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ $54K</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">10% reduction</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Labor Cost</div>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-xl text-slate-500 dark:text-slate-400">$20K</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">→ $4K</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">80% reduction</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technology Explanation */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-950 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🤖 How YOLOv8 PPE Detection Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Technology Stack:</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• <strong>Model:</strong> YOLOv8m (keremberke/yolov8m-protective-equipment-detection)</li>
                <li>• <strong>Size:</strong> 50MB quantized INT8</li>
                <li>• <strong>Accuracy:</strong> 87% mAP@0.5</li>
                <li>• <strong>Speed:</strong> 45ms on Intel NUC CPU (22 FPS)</li>
                <li>• <strong>PPE Classes:</strong> 11 types (hardhat, mask, vest, gloves, goggles, boots, etc.)</li>
                <li>• <strong>Deployment:</strong> On-premise (Intel NUC + IoT Greengrass)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ROI Breakdown:</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• <strong>Insurance:</strong> $6,000/year (10% premium reduction)</li>
                <li>• <strong>Labor:</strong> $16,224/year (80% reduction in manual checks)</li>
                <li>• <strong>Injury Prevention:</strong> $600/year (conservative estimate)</li>
                <li>• <strong>Total ROI:</strong> $650/month ($7,800/year)</li>
                <li>• <strong>Infrastructure:</strong> $400 Intel NUC + $22/month AWS</li>
                <li>• <strong>Net Savings:</strong> $595/month after costs</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-700">
            <p className="text-blue-100 text-sm">
              <strong>Why YOLOv8?</strong> Real-time detection (&lt;100ms), high accuracy (87%), CPU-optimized (no GPU needed), free (Apache 2.0 license), detects multiple PPE items in single pass. Commercial systems cost $500-$3,000/month with cloud dependency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
