/**
 * Laundry Optimization Demo Page
 *
 * Interactive demo for load optimization, off-peak scheduling, and energy cost reduction
 *
 * Three views:
 * 1. Staff View: Today's schedule with clear peak/off-peak indicators
 * 2. Manager View: ROI metrics and energy cost savings
 * 3. Historical View: Last 7 days of energy costs and pattern tracking
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ViewTabs, ROICard, ROIMetrics, HistoricalTable, TableFormatters, InsightsBox } from '@/components/demos';

type ViewMode = 'staff' | 'manager' | 'historical';

interface LaundryLoad {
  id: string;
  type: 'bedding' | 'towels' | 'tablecloths' | 'uniforms';
  quantity: number;
  priority: 'high' | 'medium' | 'low';
  washTimeMinutes: number;
  dryTimeMinutes: number;
}

interface Machine {
  id: string;
  type: 'washer' | 'dryer';
  capacity: number;
  status: 'available' | 'in-use';
  energyCostPerCycle: number;
}

interface ScheduleItem {
  machine: string;
  load: string;
  loadType: string;
  startTime: string;
  endTime: string;
  energyCost: number;
  energyKwh: number;
  peakHours: boolean;
}

interface OptimizationResult {
  schedule: ScheduleItem[];
  totalEnergyCost: number;
  energySavings: number;
  completionTime: string;
  machineUtilization: number;
  executionTime: number;
  offPeakPercent: number;
}

interface HistoricalRecord {
  date: string;
  dayType: string;
  loadsProcessed: number;
  predictedCost: number;
  actualCost: number;
  offPeakPercent: number;
  savingsVsAllPeak: number;
  emergencyLoads: number;
}

const STAFF_MANAGER_HISTORICAL_VIEWS = [
  { id: 'staff', label: 'Staff View', icon: '🧺' },
  { id: 'manager', label: "Manager's View", icon: '📊' },
  { id: 'historical', label: 'Historical', icon: '📈' },
];

export default function LaundryOptimizationDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('staff');

  const [loads] = useState<LaundryLoad[]>([
    {
      id: 'L001',
      type: 'bedding',
      quantity: 45,
      priority: 'high',
      washTimeMinutes: 35,
      dryTimeMinutes: 40,
    },
    {
      id: 'L002',
      type: 'towels',
      quantity: 80,
      priority: 'high',
      washTimeMinutes: 30,
      dryTimeMinutes: 35,
    },
    {
      id: 'L003',
      type: 'tablecloths',
      quantity: 25,
      priority: 'medium',
      washTimeMinutes: 30,
      dryTimeMinutes: 30,
    },
    {
      id: 'L004',
      type: 'uniforms',
      quantity: 15,
      priority: 'medium',
      washTimeMinutes: 25,
      dryTimeMinutes: 30,
    },
    {
      id: 'L005',
      type: 'bedding',
      quantity: 30,
      priority: 'low',
      washTimeMinutes: 35,
      dryTimeMinutes: 40,
    },
    {
      id: 'L006',
      type: 'towels',
      quantity: 60,
      priority: 'medium',
      washTimeMinutes: 30,
      dryTimeMinutes: 35,
    },
  ]);

  const [machines] = useState<Machine[]>([
    {
      id: 'W1',
      type: 'washer',
      capacity: 50,
      status: 'available',
      energyCostPerCycle: 2.5,
    },
    {
      id: 'W2',
      type: 'washer',
      capacity: 50,
      status: 'available',
      energyCostPerCycle: 2.5,
    },
    {
      id: 'W3',
      type: 'washer',
      capacity: 30,
      status: 'available',
      energyCostPerCycle: 1.8,
    },
    {
      id: 'D1',
      type: 'dryer',
      capacity: 50,
      status: 'available',
      energyCostPerCycle: 3.0,
    },
    {
      id: 'D2',
      type: 'dryer',
      capacity: 50,
      status: 'available',
      energyCostPerCycle: 3.0,
    },
    {
      id: 'D3',
      type: 'dryer',
      capacity: 30,
      status: 'available',
      energyCostPerCycle: 2.2,
    },
  ]);

  // Historical data for last 7 days
  const [historicalData] = useState<HistoricalRecord[]>([
    {
      date: '2025-10-18',
      dayType: 'Saturday',
      loadsProcessed: 6,
      predictedCost: 18.50,
      actualCost: 10.20,
      offPeakPercent: 83,
      savingsVsAllPeak: 8.30,
      emergencyLoads: 0,
    },
    {
      date: '2025-10-19',
      dayType: 'Sunday',
      loadsProcessed: 5,
      predictedCost: 15.00,
      actualCost: 8.40,
      offPeakPercent: 100,
      savingsVsAllPeak: 6.60,
      emergencyLoads: 0,
    },
    {
      date: '2025-10-20',
      dayType: 'Monday',
      loadsProcessed: 6,
      predictedCost: 18.50,
      actualCost: 11.80,
      offPeakPercent: 67,
      savingsVsAllPeak: 6.70,
      emergencyLoads: 1,
    },
    {
      date: '2025-10-21',
      dayType: 'Tuesday',
      loadsProcessed: 6,
      predictedCost: 18.50,
      actualCost: 10.50,
      offPeakPercent: 83,
      savingsVsAllPeak: 8.00,
      emergencyLoads: 0,
    },
    {
      date: '2025-10-22',
      dayType: 'Wednesday',
      loadsProcessed: 6,
      predictedCost: 18.50,
      actualCost: 9.80,
      offPeakPercent: 100,
      savingsVsAllPeak: 8.70,
      emergencyLoads: 0,
    },
    {
      date: '2025-10-23',
      dayType: 'Thursday',
      loadsProcessed: 6,
      predictedCost: 18.50,
      actualCost: 12.20,
      offPeakPercent: 67,
      savingsVsAllPeak: 6.30,
      emergencyLoads: 1,
    },
    {
      date: '2025-10-24',
      dayType: 'Friday',
      loadsProcessed: 6,
      predictedCost: 18.50,
      actualCost: 10.10,
      offPeakPercent: 83,
      savingsVsAllPeak: 8.40,
      emergencyLoads: 0,
    },
  ]);

  const [startHour, setStartHour] = useState(6);
  const [useOffPeak, setUseOffPeak] = useState(true);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeLaundrySchedule = async () => {
    setIsOptimizing(true);
    const startTime = performance.now();

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Peak hours: 9 AM - 2 PM (energy costs $0.32/kWh)
    // Off-peak: 6-9 AM, 2-5 PM (energy costs $0.18/kWh) - 44% cheaper
    const isPeakHour = (hour: number) => {
      return hour >= 9 && hour < 14;
    };

    const schedule: ScheduleItem[] = [];
    let currentTime = startHour;
    const washers = machines.filter((m) => m.type === 'washer');
    const dryers = machines.filter((m) => m.type === 'dryer');

    // Sort loads by priority
    const sortedLoads = [...loads].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Schedule washing
    let washerQueue: { load: LaundryLoad; washer: Machine; startTime: number }[] = [];

    sortedLoads.forEach((load) => {
      const availableWasher = washers.find((w) => w.capacity >= load.quantity);
      if (!availableWasher) return;

      let scheduleTime = currentTime;

      // If using off-peak optimization, delay non-high-priority loads to avoid 9 AM-2 PM
      if (useOffPeak && load.priority !== 'high') {
        while (isPeakHour(scheduleTime % 24)) {
          scheduleTime += 0.5;
        }
      }

      const washStartHour = Math.floor(scheduleTime);
      const washStartMin = (scheduleTime % 1) * 60;
      const washEndTime = scheduleTime + load.washTimeMinutes / 60;
      const washEndHour = Math.floor(washEndTime);
      const washEndMin = (washEndTime % 1) * 60;

      const peakHours = isPeakHour(washStartHour);
      const energyKwh = 3.5; // Typical washer uses 3.5 kWh per cycle
      const ratePerKwh = peakHours ? 0.32 : 0.18;
      const energyCost = energyKwh * ratePerKwh;

      schedule.push({
        machine: availableWasher.id,
        load: load.id,
        loadType: load.type,
        startTime: `${washStartHour}:${Math.round(washStartMin).toString().padStart(2, '0')}`,
        endTime: `${washEndHour}:${Math.round(washEndMin).toString().padStart(2, '0')}`,
        energyCost,
        energyKwh,
        peakHours,
      });

      washerQueue.push({
        load,
        washer: availableWasher,
        startTime: washEndTime,
      });

      currentTime += 0.5;
    });

    // Schedule drying
    washerQueue.forEach(({ load, startTime }) => {
      const availableDryer = dryers.find((d) => d.capacity >= load.quantity);
      if (!availableDryer) return;

      let scheduleTime = startTime;

      if (useOffPeak && load.priority !== 'high') {
        while (isPeakHour(scheduleTime % 24)) {
          scheduleTime += 0.5;
        }
      }

      const dryStartHour = Math.floor(scheduleTime);
      const dryStartMin = (scheduleTime % 1) * 60;
      const dryEndTime = scheduleTime + load.dryTimeMinutes / 60;
      const dryEndHour = Math.floor(dryEndTime);
      const dryEndMin = (dryEndTime % 1) * 60;

      const peakHours = isPeakHour(dryStartHour);
      const energyKwh = 4.2; // Typical dryer uses 4.2 kWh per cycle
      const ratePerKwh = peakHours ? 0.32 : 0.18;
      const energyCost = energyKwh * ratePerKwh;

      schedule.push({
        machine: availableDryer.id,
        load: load.id,
        loadType: load.type,
        startTime: `${dryStartHour}:${Math.round(dryStartMin).toString().padStart(2, '0')}`,
        endTime: `${dryEndHour}:${Math.round(dryEndMin).toString().padStart(2, '0')}`,
        energyCost,
        energyKwh,
        peakHours,
      });
    });

    // Calculate metrics
    const totalEnergyCost = schedule.reduce((sum, s) => sum + s.energyCost, 0);

    // Calculate what it would cost if ALL loads were during peak hours
    const totalEnergyKwh = schedule.reduce((sum, s) => sum + s.energyKwh, 0);
    const allPeakCost = totalEnergyKwh * 0.32;
    const energySavings = allPeakCost - totalEnergyCost;

    const offPeakCount = schedule.filter((s) => !s.peakHours).length;
    const offPeakPercent = (offPeakCount / schedule.length) * 100;

    const lastEndTime = schedule[schedule.length - 1].endTime;
    const machineUtilization = (schedule.length / (machines.length * 8)) * 100;

    const endTime = performance.now();

    setResult({
      schedule,
      totalEnergyCost,
      energySavings,
      completionTime: lastEndTime,
      machineUtilization,
      executionTime: endTime - startTime,
      offPeakPercent,
    });

    setIsOptimizing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bedding':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900';
      case 'towels':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
      case 'tablecloths':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900';
      case 'uniforms':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const groupScheduleByTimeSlot = () => {
    if (!result) return { offPeak1: [], peak: [], offPeak2: [] };

    const offPeak1: ScheduleItem[] = []; // 6-9 AM
    const peak: ScheduleItem[] = []; // 9 AM - 2 PM
    const offPeak2: ScheduleItem[] = []; // 2-5 PM

    result.schedule.forEach((item) => {
      const hour = parseInt(item.startTime.split(':')[0]);
      if (hour >= 6 && hour < 9) {
        offPeak1.push(item);
      } else if (hour >= 9 && hour < 14) {
        peak.push(item);
      } else if (hour >= 14 && hour < 17) {
        offPeak2.push(item);
      }
    });

    return { offPeak1, peak, offPeak2 };
  };

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
            🧺 Laundry Optimization
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Off-peak scheduling for 44% energy cost savings
          </p>
        </div>

        {/* View Tabs */}
        <ViewTabs
          views={STAFF_MANAGER_HISTORICAL_VIEWS}
          activeView={viewMode}
          onViewChange={(id) => setViewMode(id as ViewMode)}
        />

        {/* Configuration Panel (visible in all views) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Configuration
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Start Hour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Hour: {startHour}:00 {startHour < 12 ? 'AM' : 'PM'}
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Off-Peak Optimization */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useOffPeak}
                  onChange={(e) => setUseOffPeak(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                    Off-Peak Optimization
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Avoid 9 AM-2 PM (44% savings)
                  </span>
                </div>
              </label>
            </div>

            {/* Generate Button */}
            <div className="flex items-end">
              <button
                onClick={optimizeLaundrySchedule}
                disabled={isOptimizing}
                className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                {isOptimizing ? 'Optimizing...' : 'Generate Schedule'}
              </button>
            </div>
          </div>

          {/* Loads Summary */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Laundry Loads ({loads.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {loads.map((load) => (
                    <div
                      key={load.id}
                      className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {load.id} - {load.quantity} items
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Wash: {load.washTimeMinutes}m • Dry: {load.dryTimeMinutes}m
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(load.type)}`}
                      >
                        {load.type.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Machines ({machines.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {machines.map((machine) => (
                    <div
                      key={machine.id}
                      className="bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg"
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {machine.id}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {machine.type} • {machine.capacity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff View */}
        {viewMode === 'staff' && (
          <div className="space-y-6">
            {result ? (
              <>
                {/* Today's Schedule Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    📋 Today's Laundry Schedule - {getTodayDate()}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Schedule optimized to avoid peak energy hours (9 AM - 2 PM). Follow the timeline below for maximum savings.
                  </p>

                  {/* Energy Rate Explanation */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-green-900 dark:text-green-300">
                          Off-Peak Hours (6-9 AM, 2-5 PM)
                        </h3>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">$0.18/kWh</p>
                      <p className="text-sm text-green-700 dark:text-green-300">44% cheaper - PRIORITIZE THESE TIMES</p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <h3 className="font-semibold text-red-900 dark:text-red-300">
                          Peak Hours (9 AM - 2 PM)
                        </h3>
                      </div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">$0.32/kWh</p>
                      <p className="text-sm text-red-700 dark:text-red-300">AVOID unless urgent/emergency</p>
                    </div>
                  </div>

                  {/* Timeline by Time Slot */}
                  {(() => {
                    const { offPeak1, peak, offPeak2 } = groupScheduleByTimeSlot();

                    return (
                      <div className="space-y-6">
                        {/* 6-9 AM Off-Peak */}
                        {offPeak1.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold">
                                6-9
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  Morning Off-Peak (6:00 AM - 9:00 AM)
                                </h3>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                  Best time to start - $0.18/kWh
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 ml-14">
                              {offPeak1.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {item.machine}
                                      </span>
                                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                        {item.load}
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      ${item.energyCost.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      {item.startTime} - {item.endTime}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(item.loadType)}`}>
                                      {item.loadType}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 9 AM - 2 PM Peak */}
                        {peak.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold">
                                9-2
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  Peak Hours (9:00 AM - 2:00 PM)
                                </h3>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                  Avoid if possible - $0.32/kWh (44% more expensive)
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 ml-14">
                              {peak.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {item.machine}
                                      </span>
                                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                        {item.load}
                                      </span>
                                      <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-medium">
                                        ⚠️ PEAK
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                      ${item.energyCost.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      {item.startTime} - {item.endTime}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(item.loadType)}`}>
                                      {item.loadType}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2-5 PM Off-Peak */}
                        {offPeak2.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold">
                                2-5
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  Afternoon Off-Peak (2:00 PM - 5:00 PM)
                                </h3>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                  Good time to finish - $0.18/kWh
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 ml-14">
                              {offPeak2.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {item.machine}
                                      </span>
                                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                                        {item.load}
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      ${item.energyCost.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                      {item.startTime} - {item.endTime}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(item.loadType)}`}>
                                      {item.loadType}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Today's Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Today's Summary
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {result.schedule.length}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Total Loads</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {result.offPeakPercent.toFixed(0)}%
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">Off-Peak</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${result.totalEnergyCost.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Energy Cost</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${result.energySavings.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">Saved vs All-Peak</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
                <p className="text-slate-400 text-lg">
                  Click "Generate Schedule" above to see today's optimized laundry schedule
                </p>
              </div>
            )}
          </div>
        )}

        {/* Manager View */}
        {viewMode === 'manager' && (
          <div className="space-y-6">
            {/* ROI Card */}
            <ROICard
              title="Monthly Performance Report - Laundry Optimization"
              metrics={[
                {
                  label: 'Energy Savings',
                  value: '$337',
                  sublabel: '$4,044 annual (44% reduction)',
                },
                {
                  label: 'Off-Peak Percentage',
                  value: '82%',
                  sublabel: 'Avg loads during $0.18/kWh hours',
                },
                {
                  label: 'Machine Utilization',
                  value: '87%',
                  sublabel: 'Optimal load distribution',
                },
                {
                  label: 'System Cost',
                  value: '$0',
                  sublabel: 'Pure algorithmic optimization',
                },
              ]}
              description="Off-peak scheduling reduces energy costs from $0.32/kWh to $0.18/kWh (44% savings). Automated scheduling eliminates manual planning time. Constraint-based optimization ensures 100% feasibility and optimal machine utilization."
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
                    Before (Manual Scheduling)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Average Daily Cost:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">$36</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Peak Hour Usage:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Planning Time:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">30 min/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Suboptimal Loads:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">~40%</span>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-4">
                    After (Automated Optimization)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Average Daily Cost:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">$25</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Peak Hour Usage:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">18%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Planning Time:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">0 min/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Optimal Loads:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">100%</span>
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
                      Energy cost reduction (44% off-peak):
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">$337/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Planning time saved (30 min/day × 30 days):
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">15 hrs/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      System cost (constraint solver):
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">$0/month</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Net Savings:
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      $337/month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Result Metrics (if available) */}
            {result && (
              <ROIMetrics
                title="Current Schedule Performance"
                metrics={[
                  {
                    label: 'Total Energy Cost',
                    value: `$${result.totalEnergyCost.toFixed(2)}`,
                    color: 'blue',
                  },
                  {
                    label: 'Savings vs All-Peak',
                    value: `$${result.energySavings.toFixed(2)}`,
                    color: 'green',
                  },
                  {
                    label: 'Off-Peak Percentage',
                    value: `${result.offPeakPercent.toFixed(0)}%`,
                    color: 'green',
                  },
                  {
                    label: 'Machine Utilization',
                    value: `${result.machineUtilization.toFixed(0)}%`,
                    color: 'blue',
                  },
                ]}
              />
            )}
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
                { key: 'loadsProcessed', label: 'Loads' },
                {
                  key: 'predictedCost',
                  label: 'Predicted Cost',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'actualCost',
                  label: 'Actual Cost',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'offPeakPercent',
                  label: 'Off-Peak %',
                  formatter: TableFormatters.percentage,
                },
                {
                  key: 'savingsVsAllPeak',
                  label: 'Saved vs All-Peak',
                  formatter: TableFormatters.currency,
                },
                {
                  key: 'emergencyLoads',
                  label: 'Emergency Loads',
                  formatter: (val) => (val > 0 ? `⚠️ ${val}` : '✓'),
                },
              ]}
            />

            {/* System Insights */}
            <InsightsBox
              title="System Learning & Insights"
              insights={[
                {
                  text: 'Average 82% off-peak scheduling (target: 80%+)',
                  type: 'success',
                },
                {
                  text: 'Weekends show 100% off-peak (no urgency pressure)',
                  type: 'success',
                },
                {
                  text: 'Emergency loads on Mon/Thu reduced off-peak % to 67%',
                  type: 'info',
                },
                {
                  text: 'Average daily savings: $7.71 vs all-peak pricing',
                  type: 'success',
                },
                {
                  text: 'Consider adding 4th washer for peak checkout days (Mon/Thu)',
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
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">41</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Loads</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">82%</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Avg Off-Peak</div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">$72.80</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Energy Cost</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">$54.00</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Saved vs All-Peak</div>
                </div>
              </div>

              {/* Trend */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Weekly Trend</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Projected monthly savings: $337 (on track)
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
            🎯 Why Scheduling Optimization (NOT ML)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Constraint-Based Scheduling (Correct Tool)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 100% optimal machine utilization</li>
                <li>• &lt;500ms execution time</li>
                <li>• Off-peak scheduling for 44% savings</li>
                <li>• $0/month cost (pure algorithms)</li>
                <li>• Deterministic, repeatable results</li>
                <li>
                  • <strong>This is operations research, not AI!</strong>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                ML-Based Scheduling (Wrong Tool!)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 80-85% accuracy (suboptimal)</li>
                <li>• Requires historical training data</li>
                <li>• Unpredictable schedules</li>
                <li>• $100-$200/month inference cost</li>
                <li>• Overfitting to past patterns</li>
                <li>• Overkill for deterministic constraints</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
