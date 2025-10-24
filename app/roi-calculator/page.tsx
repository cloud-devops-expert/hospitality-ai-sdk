'use client';

import { useState } from 'react';
import type { HotelProfile, ROICalculation } from '@/lib/business-value/roi-calculator';

export default function ROICalculatorPage() {
  const [profile, setProfile] = useState<HotelProfile>({
    name: '',
    roomCount: 40,
    averageOccupancy: 75,
    staffCount: 15,
    averageStaffHourlyRate: 18,
    manualDataEntry: {
      pmsToPosDaily: 1.5,
      posToAccountingDaily: 2.0,
      wifiGuestTrackingManual: 1.0,
      barInventoryReconciliation: 2.5,
      roomChargeCorrections: 1.5,
    },
    currentErrorRates: {
      billingErrorsPerMonth: 25,
      averageErrorCost: 35,
    },
    existingSystems: {
      hasPMS: true,
      pmsName: 'Cloudbeds',
      hasPOS: true,
      posName: 'Toast',
      hasUniFiWiFi: true,
      hasBarEquipment: true,
      barEquipmentName: 'iPourIt Self-Serve Beer Wall',
    },
  });

  const [result, setResult] = useState<ROICalculation | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateROI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/roi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      } else {
        alert('Error calculating ROI: ' + data.error);
      }
    } catch (error) {
      alert('Error calculating ROI: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            💰 Middleware ROI Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Calculate the business value of integrating your existing systems
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            ISV/SI Model: We integrate what you already have, we don&apos;t sell hardware
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              Hotel Profile
            </h2>

            {/* Hotel Basics */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hotel Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="My Hotel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Room Count
                  </label>
                  <input
                    type="number"
                    value={profile.roomCount}
                    onChange={(e) =>
                      setProfile({ ...profile, roomCount: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Occupancy (%)
                  </label>
                  <input
                    type="number"
                    value={profile.averageOccupancy}
                    onChange={(e) =>
                      setProfile({ ...profile, averageOccupancy: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Staff Count
                  </label>
                  <input
                    type="number"
                    value={profile.staffCount}
                    onChange={(e) =>
                      setProfile({ ...profile, staffCount: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avg. Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    value={profile.averageStaffHourlyRate}
                    onChange={(e) =>
                      setProfile({ ...profile, averageStaffHourlyRate: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Manual Processes */}
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Manual Processes (Hours/Day)
            </h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  PMS to POS Data Transfer
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.manualDataEntry.pmsToPosDaily}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      manualDataEntry: {
                        ...profile.manualDataEntry,
                        pmsToPosDaily: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  POS to Accounting Reconciliation
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.manualDataEntry.posToAccountingDaily}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      manualDataEntry: {
                        ...profile.manualDataEntry,
                        posToAccountingDaily: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Guest Location Tracking (Manual)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.manualDataEntry.wifiGuestTrackingManual}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      manualDataEntry: {
                        ...profile.manualDataEntry,
                        wifiGuestTrackingManual: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Bar Inventory Reconciliation
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.manualDataEntry.barInventoryReconciliation}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      manualDataEntry: {
                        ...profile.manualDataEntry,
                        barInventoryReconciliation: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Room Charge Error Corrections
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.manualDataEntry.roomChargeCorrections}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      manualDataEntry: {
                        ...profile.manualDataEntry,
                        roomChargeCorrections: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Existing Systems */}
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Existing Systems
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.existingSystems.hasPMS}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        existingSystems: {
                          ...profile.existingSystems,
                          hasPMS: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">PMS</span>
                </label>
                {profile.existingSystems.hasPMS && (
                  <input
                    type="text"
                    value={profile.existingSystems.pmsName || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        existingSystems: {
                          ...profile.existingSystems,
                          pmsName: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Cloudbeds, Oracle OPERA"
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.existingSystems.hasPOS}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        existingSystems: {
                          ...profile.existingSystems,
                          hasPOS: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">POS</span>
                </label>
                {profile.existingSystems.hasPOS && (
                  <input
                    type="text"
                    value={profile.existingSystems.posName || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        existingSystems: {
                          ...profile.existingSystems,
                          posName: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., Toast, Square, MICROS"
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.existingSystems.hasUniFiWiFi}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        existingSystems: {
                          ...profile.existingSystems,
                          hasUniFiWiFi: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">UniFi WiFi</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.existingSystems.hasBarEquipment}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        existingSystems: {
                          ...profile.existingSystems,
                          hasBarEquipment: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bar Equipment</span>
                </label>
                {profile.existingSystems.hasBarEquipment && (
                  <input
                    type="text"
                    value={profile.existingSystems.barEquipmentName || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        existingSystems: {
                          ...profile.existingSystems,
                          barEquipmentName: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., iPourIt, Berg, Barpay"
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateROI}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate ROI'}
            </button>
          </div>

          {/* Right Column: Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              ROI Analysis
            </h2>

            {result ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Monthly Savings
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      ${result.roi.netSavingsMonthly.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      ROI (First Year)
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {result.roi.roiPercentage.toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      Payback Period
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {result.roi.paybackPeriodMonths.toFixed(1)} mo
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                      FTEs Freed
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {result.businessImpact.equivalentFullTimeEmployees.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Time Savings */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Time Savings
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Daily:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.timeSavings.hoursPerDay.toFixed(1)} hours
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monthly:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.timeSavings.hoursPerMonth.toFixed(0)} hours
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Yearly:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.timeSavings.hoursPerYear.toFixed(0)} hours
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Cost Breakdown
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Labor Savings (Yearly):</span>
                      <span className="font-medium">
                        ${result.costSavings.laborSavingsYearly.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Error Reduction (Yearly):</span>
                      <span className="font-medium">
                        ${result.costSavings.errorReductionSavingsYearly.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span>Total Savings (Yearly):</span>
                      <span>${result.costSavings.totalSavingsYearly.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400 mt-3">
                      <span>Platform Cost (Yearly):</span>
                      <span className="font-medium">
                        -${result.platformCost.yearlyLicense.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>Setup Cost (One-Time):</span>
                      <span className="font-medium">
                        -${result.platformCost.integrationSetupCost.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-green-700 dark:text-green-300 border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                      <span>Net Savings (Year 1):</span>
                      <span>${result.roi.netSavingsYearly.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Business Impact */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Business Impact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Error Reduction:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.businessImpact.errorReductionPercentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Guest Satisfaction:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        +{result.businessImpact.estimatedGuestSatisfactionImprovement}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Line */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Bottom Line
                  </h3>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Save ${result.roi.netSavingsMonthly.toFixed(0)}/month after costs</li>
                    <li>• Break even in {Math.ceil(result.roi.paybackPeriodMonths)} months</li>
                    <li>
                      • Gain{' '}
                      {result.businessImpact.equivalentFullTimeEmployees.toFixed(1)} FTEs
                    </li>
                    <li>
                      • Reduce billing errors by{' '}
                      {result.businessImpact.errorReductionPercentage}%
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Enter your hotel details and click &quot;Calculate ROI&quot; to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
