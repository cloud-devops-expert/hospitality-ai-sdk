/**
 * Inventory Management Demo Page
 *
 * Interactive demo for inventory tracking, reorder management, and waste prevention
 *
 * Three views:
 * 1. Staff View: Quick count interface with reorder alerts and expiration warnings
 * 2. Manager View: ROI metrics and waste reduction stats
 * 3. Historical View: Last 7 days inventory trends and insights
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ViewTabs, ROICard, ROIMetrics, HistoricalTable, TableFormatters, InsightsBox } from '@/components/demos';

type ViewMode = 'staff' | 'manager' | 'historical';
type Category = 'food' | 'beverage' | 'linen' | 'toiletry' | 'cleaning';
type Urgency = 'critical' | 'high' | 'medium' | 'low';

interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  currentQuantity: number;
  parLevel: number;
  reorderPoint: number;
  unit: string;
  costPerUnit: number;
  location: string;
  expirationDate?: string;
  abcCategory: 'A' | 'B' | 'C';
}

interface ReorderAlert {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  reorderPoint: number;
  recommendedOrderQty: number;
  urgency: Urgency;
  estimatedCost: number;
  reason: string;
}

interface ExpirationWarning {
  itemId: string;
  itemName: string;
  quantity: number;
  expirationDate: string;
  daysUntilExpiration: number;
  potentialWaste: number;
  action: string;
}

interface HistoricalRecord {
  date: string;
  dayType: string;
  totalValue: number;
  wasteValue: number;
  stockouts: number;
  reorderAlerts: number;
  expirationWarnings: number;
  turnoverDays: number;
}

const STAFF_MANAGER_HISTORICAL_VIEWS = [
  { id: 'staff', label: 'Staff View', icon: '📦' },
  { id: 'manager', label: "Manager's View", icon: '📊' },
  { id: 'historical', label: 'Historical', icon: '📈' },
];

export default function InventoryManagementDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('staff');

  // Sample inventory items
  const [inventory] = useState<InventoryItem[]>([
    {
      id: 'ITEM-MILK-001',
      name: 'Whole Milk (1 gallon)',
      category: 'beverage',
      currentQuantity: 5,
      parLevel: 30,
      reorderPoint: 12,
      unit: 'gallon',
      costPerUnit: 3.50,
      location: 'Walk-in Cooler A',
      expirationDate: '2025-10-30',
      abcCategory: 'A',
    },
    {
      id: 'ITEM-TOMATO-001',
      name: 'Roma Tomatoes',
      category: 'food',
      currentQuantity: 8,
      parLevel: 40,
      reorderPoint: 15,
      unit: 'lb',
      costPerUnit: 2.20,
      location: 'Produce Cooler',
      expirationDate: '2025-10-28',
      abcCategory: 'A',
    },
    {
      id: 'ITEM-YOGURT-001',
      name: 'Greek Yogurt (6 oz)',
      category: 'food',
      currentQuantity: 12,
      parLevel: 30,
      reorderPoint: 18,
      unit: 'unit',
      costPerUnit: 1.50,
      location: 'Walk-in Cooler B',
      expirationDate: '2025-10-27',
      abcCategory: 'B',
    },
    {
      id: 'ITEM-TOWEL-001',
      name: 'Bath Towels (white)',
      category: 'linen',
      currentQuantity: 45,
      parLevel: 60,
      reorderPoint: 30,
      unit: 'unit',
      costPerUnit: 8.00,
      location: 'Linen Storage A',
      abcCategory: 'B',
    },
    {
      id: 'ITEM-SOAP-001',
      name: 'Hand Soap (pump)',
      category: 'toiletry',
      currentQuantity: 8,
      parLevel: 25,
      reorderPoint: 10,
      unit: 'unit',
      costPerUnit: 2.75,
      location: 'Housekeeping Supply',
      abcCategory: 'C',
    },
  ]);

  // Historical data for last 7 days
  const [historicalData] = useState<HistoricalRecord[]>([
    {
      date: '2025-10-18',
      dayType: 'Saturday',
      totalValue: 15450,
      wasteValue: 12,
      stockouts: 0,
      reorderAlerts: 3,
      expirationWarnings: 2,
      turnoverDays: 18.2,
    },
    {
      date: '2025-10-19',
      dayType: 'Sunday',
      totalValue: 15200,
      wasteValue: 0,
      stockouts: 0,
      reorderAlerts: 2,
      expirationWarnings: 1,
      turnoverDays: 17.9,
    },
    {
      date: '2025-10-20',
      dayType: 'Monday',
      totalValue: 15800,
      wasteValue: 45,
      stockouts: 1,
      reorderAlerts: 4,
      expirationWarnings: 3,
      turnoverDays: 18.6,
    },
    {
      date: '2025-10-21',
      dayType: 'Tuesday',
      totalValue: 15350,
      wasteValue: 0,
      stockouts: 0,
      reorderAlerts: 2,
      expirationWarnings: 2,
      turnoverDays: 18.1,
    },
    {
      date: '2025-10-22',
      dayType: 'Wednesday',
      totalValue: 15100,
      wasteValue: 18,
      stockouts: 0,
      reorderAlerts: 3,
      expirationWarnings: 2,
      turnoverDays: 17.8,
    },
    {
      date: '2025-10-23',
      dayType: 'Thursday',
      totalValue: 15650,
      wasteValue: 0,
      stockouts: 0,
      reorderAlerts: 2,
      expirationWarnings: 1,
      turnoverDays: 18.4,
    },
    {
      date: '2025-10-24',
      dayType: 'Friday',
      totalValue: 15300,
      wasteValue: 8,
      stockouts: 0,
      reorderAlerts: 3,
      expirationWarnings: 3,
      turnoverDays: 18.0,
    },
  ]);

  // Generate reorder alerts
  const getReorderAlerts = (): ReorderAlert[] => {
    const alerts: ReorderAlert[] = [];

    for (const item of inventory) {
      if (item.currentQuantity <= item.reorderPoint) {
        const recommendedOrderQty = item.parLevel - item.currentQuantity;
        const daysOfSupply = item.currentQuantity / (item.parLevel / 7); // Rough estimate

        let urgency: Urgency;
        if (daysOfSupply < 1) urgency = 'critical';
        else if (daysOfSupply < 2) urgency = 'high';
        else if (daysOfSupply < 3) urgency = 'medium';
        else urgency = 'low';

        alerts.push({
          itemId: item.id,
          itemName: item.name,
          currentQuantity: item.currentQuantity,
          reorderPoint: item.reorderPoint,
          recommendedOrderQty,
          urgency,
          estimatedCost: recommendedOrderQty * item.costPerUnit,
          reason: `Below reorder point (${item.currentQuantity} < ${item.reorderPoint})`,
        });
      }
    }

    return alerts.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  };

  // Generate expiration warnings
  const getExpirationWarnings = (): ExpirationWarning[] => {
    const warnings: ExpirationWarning[] = [];
    const today = new Date('2025-10-25'); // Demo date

    for (const item of inventory) {
      if (!item.expirationDate) continue;

      const expirationDate = new Date(item.expirationDate);
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiration <= 3 && daysUntilExpiration >= 0) {
        const estimatedDailyUsage = item.parLevel / 7; // Rough estimate
        const canUseBeforeExpiry = item.currentQuantity <= estimatedDailyUsage * daysUntilExpiration;

        warnings.push({
          itemId: item.id,
          itemName: item.name,
          quantity: item.currentQuantity,
          expirationDate: item.expirationDate,
          daysUntilExpiration,
          potentialWaste: canUseBeforeExpiry ? 0 : item.currentQuantity * item.costPerUnit,
          action: canUseBeforeExpiry
            ? `Will be used before expiry (${item.currentQuantity} ${item.unit} / ${estimatedDailyUsage.toFixed(1)} per day)`
            : `Prioritize usage or donate by ${new Date(expirationDate.getTime() - 86400000).toLocaleDateString()}`,
        });
      }
    }

    return warnings;
  };

  const getUrgencyColor = (urgency: Urgency) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-gray-900';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getUrgencyBorder = (urgency: Urgency) => {
    switch (urgency) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-slate-500 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'food':
        return '🥗';
      case 'beverage':
        return '🥛';
      case 'linen':
        return '🛏️';
      case 'toiletry':
        return '🧴';
      case 'cleaning':
        return '🧹';
      default:
        return '📦';
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const reorderAlerts = getReorderAlerts();
  const expirationWarnings = getExpirationWarnings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            📦 Inventory Management
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Consumption-based reordering with expiration tracking
          </p>
        </div>

        {/* View Tabs */}
        <ViewTabs
          views={STAFF_MANAGER_HISTORICAL_VIEWS}
          activeView={viewMode}
          onViewChange={(id) => setViewMode(id as ViewMode)}
        />

        {/* Inventory Summary (visible in all views) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Inventory Summary
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {inventory.length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Items</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {reorderAlerts.length}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Reorder Alerts</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {expirationWarnings.length}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Expiring Soon</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${inventory.reduce((sum, item) => sum + item.currentQuantity * item.costPerUnit, 0).toFixed(0)}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Total Value</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ABC Classification
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">A-items (count daily):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {inventory.filter(i => i.abcCategory === 'A').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">B-items (every 2-3 days):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {inventory.filter(i => i.abcCategory === 'B').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">C-items (weekly):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {inventory.filter(i => i.abcCategory === 'C').length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Stock Status
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Healthy:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {inventory.filter(i => i.currentQuantity > i.reorderPoint).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Below reorder point:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {inventory.filter(i => i.currentQuantity <= i.reorderPoint).length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Waste Risk
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Items expiring (3 days):</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {expirationWarnings.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Potential waste:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${expirationWarnings.reduce((sum, w) => sum + w.potentialWaste, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff View */}
        {viewMode === 'staff' && (
          <div className="space-y-6">
            {/* Reorder Alerts */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🚨 Reorder Alerts ({reorderAlerts.length})
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Items below reorder point - create orders to avoid stockouts
              </p>

              {reorderAlerts.length > 0 ? (
                <div className="space-y-3">
                  {reorderAlerts.map((alert) => (
                    <div
                      key={alert.itemId}
                      className={`border-2 rounded-lg p-4 ${getUrgencyBorder(alert.urgency)}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getUrgencyColor(alert.urgency)}`}>
                              {alert.urgency.toUpperCase()}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {alert.itemName}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {alert.reason}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            Order: {alert.recommendedOrderQty} units
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            ${alert.estimatedCost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Create Order
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  ✓ All items above reorder point
                </div>
              )}
            </div>

            {/* Expiration Warnings */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ⏰ Expiration Warnings ({expirationWarnings.length})
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Items expiring within 3 days - prioritize usage to reduce waste
              </p>

              {expirationWarnings.length > 0 ? (
                <div className="space-y-3">
                  {expirationWarnings.map((warning) => (
                    <div
                      key={warning.itemId}
                      className={`border-2 rounded-lg p-4 ${
                        warning.potentialWaste > 0
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white mb-1">
                            {warning.itemName}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Expires: {new Date(warning.expirationDate).toLocaleDateString()} ({warning.daysUntilExpiration} days)
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            Quantity: {warning.quantity} units
                          </div>
                        </div>
                        {warning.potentialWaste > 0 && (
                          <div className="text-right">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Waste Risk</div>
                            <div className="font-semibold text-red-600 dark:text-red-400">
                              ${warning.potentialWaste.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`text-sm p-2 rounded ${
                        warning.potentialWaste > 0
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                          : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                      }`}>
                        {warning.potentialWaste > 0 ? '⚠️ ' : '✓ '}{warning.action}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  ✓ No items expiring in next 3 days
                </div>
              )}
            </div>

            {/* Quick Count (A-items) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📱 Quick Count - A-Items (High Value)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Count these items daily for optimal inventory management
              </p>

              <div className="space-y-3">
                {inventory.filter(item => item.abcCategory === 'A').map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Current</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {item.currentQuantity}
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Count
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manager View */}
        {viewMode === 'manager' && (
          <div className="space-y-6">
            {/* ROI Card */}
            <ROICard
              title="Monthly Performance Report - Inventory Management"
              metrics={[
                {
                  label: 'Waste Reduction',
                  value: '$640',
                  sublabel: '$7,680 annual (80% fewer expirations)',
                },
                {
                  label: 'Stockout Prevention',
                  value: '$150',
                  sublabel: '75% fewer emergency orders',
                },
                {
                  label: 'Labor Savings',
                  value: '$102',
                  sublabel: '3 hrs/week → 30 min/week',
                },
                {
                  label: 'System Cost',
                  value: '$0',
                  sublabel: 'Simple statistics (EMA)',
                },
              ]}
              description="Consumption-based par levels reduce waste by 80% ($800 → $160/month). Automated reorder alerts prevent stockouts and eliminate emergency orders. Mobile quick counting saves 2.5 hours/week vs clipboard. Zero API costs - uses exponential moving average for forecasting."
            />

            {/* Comparison Metrics */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Before vs After Implementation
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Before */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-4">
                    Before (Manual Tracking)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Waste:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">$800</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Waste %:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Stockouts/month:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Counting Time:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">3 hrs/week</span>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-4">
                    After (Automated Tracking)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Waste:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">$160</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Waste %:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Stockouts/month:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Counting Time:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">30 min/week</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Breakdown */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Savings Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Waste reduction (80%):
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">$640/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Stockout prevention (75%):
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">$150/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Labor savings (2.5 hrs/week):
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">$102/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      System cost (EMA forecasting):
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">$0/month</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Net Savings:
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      $892/month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Alerts (if available) */}
            <ROIMetrics
              title="Current Status"
              metrics={[
                {
                  label: 'Reorder Alerts',
                  value: `${reorderAlerts.length}`,
                  color: reorderAlerts.length > 0 ? 'red' : 'green',
                },
                {
                  label: 'Expiring Soon',
                  value: `${expirationWarnings.length}`,
                  color: expirationWarnings.length > 0 ? 'orange' : 'green',
                },
                {
                  label: 'Potential Waste',
                  value: `$${expirationWarnings.reduce((sum, w) => sum + w.potentialWaste, 0).toFixed(0)}`,
                  color: expirationWarnings.some(w => w.potentialWaste > 0) ? 'red' : 'green',
                },
                {
                  label: 'Inventory Value',
                  value: `$${inventory.reduce((sum, item) => sum + item.currentQuantity * item.costPerUnit, 0).toFixed(0)}`,
                  color: 'blue',
                },
              ]}
            />
          </div>
        )}

        {/* Historical View */}
        {viewMode === 'historical' && (
          <div className="space-y-6">
            {/* Historical Performance Table */}
            <HistoricalTable
              data={historicalData}
              columns={[
                { key: 'date', label: 'Date', formatter: (val) => new Date(val).toLocaleDateString() },
                { key: 'dayType', label: 'Day', formatter: TableFormatters.badge },
                {
                  key: 'totalValue',
                  label: 'Inventory Value',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'wasteValue',
                  label: 'Waste',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'stockouts',
                  label: 'Stockouts',
                  formatter: (val) => (val > 0 ? `⚠️ ${val}` : '✓ 0'),
                },
                { key: 'reorderAlerts', label: 'Reorder Alerts' },
                { key: 'expirationWarnings', label: 'Expiring' },
                {
                  key: 'turnoverDays',
                  label: 'Turnover Days',
                  formatter: (val) => `${val.toFixed(1)} days`,
                },
              ]}
            />

            {/* System Insights */}
            <InsightsBox
              title="System Learning & Insights"
              insights={[
                {
                  text: 'Waste reduced by 78% vs baseline ($800 → $160/month)',
                  type: 'success',
                },
                {
                  text: 'Stockouts down 75% (4 → 1 per month)',
                  type: 'success',
                },
                {
                  text: 'Inventory turnover: 18.0 days (target: 14 days) - slightly high',
                  type: 'info',
                },
                {
                  text: 'Monday shows elevated waste (checkout day impact)',
                  type: 'info',
                },
                {
                  text: 'Consider reducing milk order quantity to avoid Sunday expirations',
                  type: 'recommendation',
                },
              ]}
            />

            {/* Weekly Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Last 7 Days Summary
              </h3>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">$15,407</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Avg Inventory Value</div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">$83</div>
                  <div className="text-sm text-red-700 dark:text-red-300">Total Waste</div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">1</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Total Stockouts</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">18.0</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Avg Turnover Days</div>
                </div>
              </div>

              {/* Trend */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Weekly Trend</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Projected monthly savings: $892 (on track)
                    </p>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Why Not ML Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 Why Statistical Forecasting (NOT ML)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Exponential Moving Average (Correct Tool)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 90%+ accuracy for stable items</li>
                <li>• Self-adjusting to consumption patterns</li>
                <li>• Transparent calculations (EMA formula)</li>
                <li>• $0/month cost (simple statistics)</li>
                <li>• &lt;10ms calculation time</li>
                <li>
                  • <strong>This is statistical forecasting, not AI!</strong>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                ML-Based Forecasting (Overkill!)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 92-95% accuracy (marginal improvement)</li>
                <li>• Requires 3-6 months training data</li>
                <li>• Black box decision-making</li>
                <li>• $200-$400/month inference cost</li>
                <li>• 100-300ms calculation time</li>
                <li>• Overkill for simple consumption patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
