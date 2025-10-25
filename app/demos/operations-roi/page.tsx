'use client';

/**
 * Combined Operations ROI Dashboard
 *
 * Aggregates all 5 operations demos:
 * - Kitchen Operations: $2,400/month
 * - Housekeeping: $587/month
 * - Laundry: $337/month
 * - Maintenance: $1,154/month
 * - Inventory: $892/month
 * Total: $5,370/month ($64,440/year)
 *
 * Three views:
 * - Staff View: Actionable daily operations dashboard
 * - Manager View: Combined ROI metrics and before/after
 * - Historical View: Last 7 days trends with system learning
 */

import { useState } from 'react';
import { ViewTabs } from '@/components/demos/ViewTabs';
import { ROICard } from '@/components/demos/ROICard';
import { ROIMetrics } from '@/components/demos/ROIMetrics';
import { HistoricalTable } from '@/components/demos/HistoricalTable';
import { InsightsBox } from '@/components/demos/InsightsBox';
import { TableFormatters } from '@/components/demos/TableFormatters';

type ViewMode = 'staff' | 'manager' | 'historical';

interface OperationSummary {
  name: string;
  icon: string;
  monthly: number;
  category: 'waste' | 'labor' | 'energy' | 'equipment';
  status: 'active' | 'alert' | 'ok';
  alertMessage?: string;
  link: string;
}

interface DailyMetrics {
  date: string;
  totalSavings: number;
  wasteSavings: number;
  laborSavings: number;
  energySavings: number;
  equipmentSavings: number;
  operations: {
    kitchen: number;
    housekeeping: number;
    laundry: number;
    maintenance: number;
    inventory: number;
  };
}

export default function OperationsROIDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('manager');

  // ===== OPERATIONS SUMMARY =====
  const operations: OperationSummary[] = [
    {
      name: 'Kitchen Operations',
      icon: '🍽️',
      monthly: 2400,
      category: 'waste',
      status: 'active',
      alertMessage: '3 items need prep schedule adjustment today',
      link: '/demos/kitchen',
    },
    {
      name: 'Housekeeping',
      icon: '🧹',
      monthly: 587,
      category: 'labor',
      status: 'ok',
      link: '/demos/housekeeping',
    },
    {
      name: 'Laundry',
      icon: '🧺',
      monthly: 337,
      category: 'energy',
      status: 'ok',
      link: '/demos/laundry',
    },
    {
      name: 'Maintenance',
      icon: '🔧',
      monthly: 1154,
      category: 'equipment',
      status: 'alert',
      alertMessage: 'HVAC-301 needs inspection (due today)',
      link: '/demos/maintenance',
    },
    {
      name: 'Inventory',
      icon: '📦',
      monthly: 892,
      category: 'waste',
      status: 'alert',
      alertMessage: '5 items below reorder point',
      link: '/demos/inventory',
    },
  ];

  // ===== ROI CALCULATIONS =====
  const totalMonthly = operations.reduce((sum, op) => sum + op.monthly, 0);
  const totalAnnual = totalMonthly * 12;

  const categoryTotals = {
    waste: operations.filter((op) => op.category === 'waste').reduce((sum, op) => sum + op.monthly, 0),
    labor: operations.filter((op) => op.category === 'labor').reduce((sum, op) => sum + op.monthly, 0),
    energy: operations.filter((op) => op.category === 'energy').reduce((sum, op) => sum + op.monthly, 0),
    equipment: operations
      .filter((op) => op.category === 'equipment')
      .reduce((sum, op) => sum + op.monthly, 0),
  };

  // ===== BEFORE/AFTER METRICS =====
  const beforeMetrics = {
    monthlyWaste: 4100, // $3,292 (kitchen+inventory) is saved waste
    laborHours: 684, // 63.5 hours saved/month across all operations
    energyCost: 760, // $337 laundry savings
    emergencyRepairs: 28, // 80% reduction from 28 → 5.6 with maintenance
  };

  const afterMetrics = {
    monthlyWaste: 808, // 80% reduction
    laborHours: 620.5, // 684 - 63.5 saved
    energyCost: 423, // 760 - 337
    emergencyRepairs: 5.6, // 80% reduction
  };

  // ===== HISTORICAL DATA (Last 7 Days) =====
  const historicalData: DailyMetrics[] = [
    {
      date: '2025-10-19',
      totalSavings: 165,
      wasteSavings: 102,
      laborSavings: 25,
      energySavings: 13,
      equipmentSavings: 25,
      operations: { kitchen: 72, housekeeping: 18, laundry: 10, maintenance: 35, inventory: 30 },
    },
    {
      date: '2025-10-20',
      totalSavings: 172,
      wasteSavings: 108,
      laborSavings: 26,
      energySavings: 11,
      equipmentSavings: 27,
      operations: { kitchen: 78, housekeeping: 19, laundry: 9, maintenance: 38, inventory: 28 },
    },
    {
      date: '2025-10-21',
      totalSavings: 183,
      wasteSavings: 115,
      laborSavings: 28,
      energySavings: 14,
      equipmentSavings: 26,
      operations: { kitchen: 82, housekeeping: 21, laundry: 12, maintenance: 37, inventory: 31 },
    },
    {
      date: '2025-10-22',
      totalSavings: 178,
      wasteSavings: 110,
      laborSavings: 27,
      energySavings: 12,
      equipmentSavings: 29,
      operations: { kitchen: 75, housekeeping: 20, laundry: 10, maintenance: 41, inventory: 32 },
    },
    {
      date: '2025-10-23',
      totalSavings: 195,
      wasteSavings: 122,
      laborSavings: 29,
      energySavings: 15,
      equipmentSavings: 29,
      operations: { kitchen: 85, housekeeping: 22, laundry: 13, maintenance: 40, inventory: 35 },
    },
    {
      date: '2025-10-24',
      totalSavings: 188,
      wasteSavings: 118,
      laborSavings: 28,
      energySavings: 13,
      equipmentSavings: 29,
      operations: { kitchen: 80, housekeeping: 21, laundry: 11, maintenance: 39, inventory: 37 },
    },
    {
      date: '2025-10-25',
      totalSavings: 191,
      wasteSavings: 120,
      laborSavings: 28,
      energySavings: 14,
      equipmentSavings: 29,
      operations: { kitchen: 82, housekeeping: 21, laundry: 12, maintenance: 38, inventory: 38 },
    },
  ];

  // ===== HELPER FUNCTIONS =====
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'alert':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'ok':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'waste':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'labor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'energy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'equipment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            💰 Operations ROI Dashboard
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Combined performance across all 5 operational areas
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="text-green-800 dark:text-green-300 font-semibold">
              Total Savings: ${totalMonthly.toLocaleString()}/month (${totalAnnual.toLocaleString()}/year)
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <ViewTabs viewMode={viewMode} setViewMode={setViewMode} />

        {/* STAFF VIEW - Daily Operations Dashboard */}
        {viewMode === 'staff' && (
          <div className="space-y-6">
            {/* Active Alerts */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🚨 Active Alerts ({operations.filter((op) => op.status !== 'ok').length})
              </h2>
              <div className="space-y-3">
                {operations
                  .filter((op) => op.status !== 'ok')
                  .map((op) => (
                    <div
                      key={op.name}
                      className="bg-white dark:bg-slate-800 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{op.icon}</span>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{op.name}</div>
                            <div className="text-sm text-orange-700 dark:text-orange-400">
                              {op.alertMessage}
                            </div>
                          </div>
                        </div>
                        <a
                          href={op.link}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Operations Status Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 All Operations Status
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {operations.map((op) => (
                  <a
                    key={op.name}
                    href={op.link}
                    className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{op.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 dark:text-white">{op.name}</div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          ${op.monthly.toLocaleString()}/month
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(op.status)}`}>
                        {op.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(op.category)}`}>
                        {op.category.toUpperCase()}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
                <div className="text-sm text-slate-500 dark:text-slate-400">Waste Reduction</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${categoryTotals.waste.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">per month</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="text-sm text-slate-500 dark:text-slate-400">Labor Savings</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${categoryTotals.labor.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">per month</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-green-500">
                <div className="text-sm text-slate-500 dark:text-slate-400">Energy Savings</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${categoryTotals.energy.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">per month</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-purple-500">
                <div className="text-sm text-slate-500 dark:text-slate-400">Equipment Savings</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${categoryTotals.equipment.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">per month</div>
              </div>
            </div>
          </div>
        )}

        {/* MANAGER VIEW - Combined ROI & Before/After */}
        {viewMode === 'manager' && (
          <div className="space-y-6">
            {/* Combined ROI Card */}
            <ROICard
              title="Combined Monthly Performance Report - All Operations"
              totalSavings={totalMonthly}
              annualSavings={totalAnnual}
              metrics={[
                {
                  label: 'Waste Reduction',
                  value: `$${categoryTotals.waste.toLocaleString()}`,
                  sublabel: `$${(categoryTotals.waste * 12).toLocaleString()} annual (Kitchen + Inventory)`,
                },
                {
                  label: 'Labor Savings',
                  value: `$${categoryTotals.labor.toLocaleString()}`,
                  sublabel: '63.5 hours/month saved (Housekeeping)',
                },
                {
                  label: 'Energy Savings',
                  value: `$${categoryTotals.energy.toLocaleString()}`,
                  sublabel: '44% reduction (Off-peak laundry scheduling)',
                },
                {
                  label: 'Equipment Savings',
                  value: `$${categoryTotals.equipment.toLocaleString()}`,
                  sublabel: '80% fewer emergency repairs (Preventive maintenance)',
                },
                {
                  label: 'System Cost',
                  value: '$0',
                  sublabel: 'No API fees, all operations research algorithms',
                },
              ]}
              description="Combined operations optimization reduces waste by 80%, saves 63.5 labor hours/month, cuts energy costs by 44%, and prevents emergency repairs with predictive maintenance. All using simple, deterministic algorithms with $0 monthly cost."
            />

            {/* Operations Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 Operations Breakdown
              </h2>
              <div className="space-y-4">
                {operations.map((op) => (
                  <div
                    key={op.name}
                    className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{op.icon}</span>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{op.name}</div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(op.category)}`}>
                            {op.category.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${op.monthly.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">per month</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                        style={{ width: `${(op.monthly / totalMonthly) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {((op.monthly / totalMonthly) * 100).toFixed(1)}% of total savings
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Before/After Comparison */}
            <ROIMetrics
              title="Before & After - Combined Impact"
              before={{
                monthly_waste: beforeMetrics.monthlyWaste,
                labor_hours_month: beforeMetrics.laborHours,
                energy_cost: beforeMetrics.energyCost,
                emergency_repairs: beforeMetrics.emergencyRepairs,
              }}
              after={{
                monthly_waste: afterMetrics.monthlyWaste,
                labor_hours_month: afterMetrics.laborHours,
                energy_cost: afterMetrics.energyCost,
                emergency_repairs: afterMetrics.emergencyRepairs,
              }}
              metrics={[
                {
                  label: 'Monthly Waste',
                  beforeValue: beforeMetrics.monthlyWaste,
                  afterValue: afterMetrics.monthlyWaste,
                  formatter: TableFormatters.currency,
                  improvement: `${(((beforeMetrics.monthlyWaste - afterMetrics.monthlyWaste) / beforeMetrics.monthlyWaste) * 100).toFixed(0)}% reduction`,
                },
                {
                  label: 'Labor Hours/Month',
                  beforeValue: beforeMetrics.laborHours,
                  afterValue: afterMetrics.laborHours,
                  formatter: (val) => `${val} hrs`,
                  improvement: '63.5 hours saved',
                },
                {
                  label: 'Energy Cost/Month',
                  beforeValue: beforeMetrics.energyCost,
                  afterValue: afterMetrics.energyCost,
                  formatter: TableFormatters.currency,
                  improvement: `${(((beforeMetrics.energyCost - afterMetrics.energyCost) / beforeMetrics.energyCost) * 100).toFixed(0)}% reduction`,
                },
                {
                  label: 'Emergency Repairs/Month',
                  beforeValue: beforeMetrics.emergencyRepairs,
                  afterValue: afterMetrics.emergencyRepairs,
                  formatter: (val) => `${val} repairs`,
                  improvement: '80% reduction',
                },
              ]}
            />

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🎯 Savings by Category
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Waste Reduction */}
                <div className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Waste Reduction</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    ${categoryTotals.waste.toLocaleString()}/month
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <div>• Kitchen: $2,400/month (consumption tracking)</div>
                    <div>• Inventory: $892/month (expiration + reordering)</div>
                    <div className="font-semibold mt-2">80% waste reduction overall</div>
                  </div>
                </div>

                {/* Labor Savings */}
                <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Labor Savings</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    ${categoryTotals.labor.toLocaleString()}/month
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <div>• Housekeeping: $587/month (routing + planning)</div>
                    <div>• 63.5 hours/month saved</div>
                    <div className="font-semibold mt-2">10% labor efficiency gain</div>
                  </div>
                </div>

                {/* Energy Savings */}
                <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Energy Savings</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    ${categoryTotals.energy.toLocaleString()}/month
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <div>• Laundry: $337/month (off-peak scheduling)</div>
                    <div>• 44% energy cost reduction</div>
                    <div className="font-semibold mt-2">Sustainability + cost savings</div>
                  </div>
                </div>

                {/* Equipment Savings */}
                <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Equipment Savings</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    ${categoryTotals.equipment.toLocaleString()}/month
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <div>• Maintenance: $1,154/month (preventive vs reactive)</div>
                    <div>• 80% fewer emergency repairs</div>
                    <div className="font-semibold mt-2">Equipment lifespan extension</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORICAL VIEW - Last 7 Days Performance */}
        {viewMode === 'historical' && (
          <div className="space-y-6">
            {/* Historical Table */}
            <HistoricalTable
              title="Last 7 Days - Combined Performance"
              headers={[
                { key: 'date', label: 'Date', formatter: TableFormatters.date },
                { key: 'totalSavings', label: 'Total Savings', formatter: TableFormatters.currency },
                { key: 'wasteSavings', label: 'Waste', formatter: TableFormatters.currency },
                { key: 'laborSavings', label: 'Labor', formatter: TableFormatters.currency },
                { key: 'energySavings', label: 'Energy', formatter: TableFormatters.currency },
                { key: 'equipmentSavings', label: 'Equipment', formatter: TableFormatters.currency },
              ]}
              data={historicalData}
              highlightColumn="totalSavings"
            />

            {/* Operations Breakdown - Last 7 Days */}
            <HistoricalTable
              title="Last 7 Days - Operations Breakdown"
              headers={[
                { key: 'date', label: 'Date', formatter: TableFormatters.date },
                {
                  key: 'operations.kitchen',
                  label: '🍽️ Kitchen',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'operations.housekeeping',
                  label: '🧹 Housekeeping',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'operations.laundry',
                  label: '🧺 Laundry',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'operations.maintenance',
                  label: '🔧 Maintenance',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'operations.inventory',
                  label: '📦 Inventory',
                  formatter: TableFormatters.currency,
                },
              ]}
              data={historicalData}
            />

            {/* System Insights */}
            <InsightsBox
              title="📊 System Learning & Trends"
              insights={[
                {
                  icon: '📈',
                  title: 'Upward Trend',
                  description:
                    'Total daily savings increased 15.8% over the past week ($165 → $191/day). System is learning and optimizing.',
                  importance: 'positive',
                },
                {
                  icon: '🍽️',
                  title: 'Kitchen Leading',
                  description:
                    'Kitchen operations show strongest performance ($72-$85/day), accounting for 42-44% of total savings. Consumption tracking is highly effective.',
                  importance: 'info',
                },
                {
                  icon: '📦',
                  title: 'Inventory Improving',
                  description:
                    'Inventory savings grew 26.7% ($30 → $38/day) as EMA forecasting learns consumption patterns. Expect continued improvement.',
                  importance: 'positive',
                },
                {
                  icon: '⚡',
                  title: 'Energy Optimization',
                  description:
                    'Laundry energy savings stabilized at $11-15/day. Off-peak scheduling now fully optimized for current occupancy levels.',
                  importance: 'info',
                },
                {
                  icon: '🔧',
                  title: 'Maintenance Stability',
                  description:
                    'Maintenance savings consistent at $35-41/day. Preventive schedule preventing emergencies effectively.',
                  importance: 'positive',
                },
                {
                  icon: '💡',
                  title: 'Projected Monthly Savings',
                  description:
                    'Based on 7-day trend, projected monthly savings: $5,640 (up from baseline $5,370). System continues to optimize.',
                  importance: 'info',
                },
              ]}
            />

            {/* Trend Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 7-Day Summary
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Average Daily Savings
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    $
                    {(
                      historicalData.reduce((sum, day) => sum + day.totalSavings, 0) /
                      historicalData.length
                    ).toFixed(0)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Projected monthly: $
                    {(
                      (historicalData.reduce((sum, day) => sum + day.totalSavings, 0) /
                        historicalData.length) *
                      30
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Best Performing Day
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ${Math.max(...historicalData.map((d) => d.totalSavings))}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {TableFormatters.date(
                      historicalData.find(
                        (d) => d.totalSavings === Math.max(...historicalData.map((d) => d.totalSavings))
                      )?.date || ''
                    )}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Week-over-Week Growth</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(
                      ((historicalData[historicalData.length - 1].totalSavings -
                        historicalData[0].totalSavings) /
                        historicalData[0].totalSavings) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    System learning and improving
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            💡 Implementation Notes
          </h2>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <strong>Technology Stack:</strong> All 5 operations use simple, deterministic algorithms
              (operations research, constraint satisfaction, exponential moving average, greedy optimization).
              No ML inference, no API calls, $0/month cost.
            </p>
            <p>
              <strong>Data Collection:</strong> Morning operations generate work orders/schedules/alerts.
              Evening operations record simple actuals (times, quantities). Weekly analysis adjusts parameters.
            </p>
            <p>
              <strong>Integration:</strong> Each operation stores daily records in PostgreSQL as JSONB. Read
              individual demo pages for detailed specs and implementation guides.
            </p>
            <p>
              <strong>System Learning:</strong> Over time, the system learns patterns and adjusts forecasts,
              routing algorithms, and maintenance schedules. Historical data shows continuous improvement.
            </p>
          </div>
        </div>

        {/* Links to Individual Demos */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🔗 Individual Operation Demos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            {operations.map((op) => (
              <a
                key={op.name}
                href={op.link}
                className="flex items-center gap-2 px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <span className="text-2xl">{op.icon}</span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">{op.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
