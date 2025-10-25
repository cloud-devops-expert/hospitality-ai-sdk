/**
 * Housekeeping Optimization Demo Page
 *
 * Staff-focused interface with route optimization, historical tracking, and ROI analysis
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ViewTabs,
  HOUSEKEEPER_MANAGER_HISTORICAL_VIEWS,
  ROICard,
  ROIMetrics,
  HistoricalTable,
  InsightsBox,
  TableFormatters,
} from '@/components/demos';

interface Room {
  id: string;
  floor: number;
  priority: 'high' | 'medium' | 'low';
  checkOutTime?: string;
  status: 'checkout' | 'stayover' | 'vip';
  estimatedMinutes: number;
}

interface StaffMember {
  id: string;
  name: string;
  skills: string[];
  shiftStart: string;
  shiftEnd: string;
  maxRooms: number;
}

interface Assignment {
  staff: string;
  staffId: string;
  rooms: Room[];
  totalMinutes: number;
  route: string;
  routeSteps: { floor: number; rooms: string[] }[];
  efficiency: number;
}

interface OptimizationResult {
  assignments: Assignment[];
  totalEfficiency: number;
  balanceScore: number;
  executionTime: number;
}

interface HistoricalRecord {
  date: string;
  dayType: string;
  rooms: number;
  staff: string;
  predicted: number;  // minutes
  actual: number;     // minutes
  accuracy: number;   // percentage
}

type ViewMode = 'housekeeper' | 'manager' | 'historical';

export default function HousekeepingDemo() {
  const [rooms] = useState<Room[]>([
    { id: '101', floor: 1, priority: 'high', checkOutTime: '10:00 AM', status: 'vip', estimatedMinutes: 60 },
    { id: '102', floor: 1, priority: 'medium', status: 'stayover', estimatedMinutes: 30 },
    { id: '103', floor: 1, priority: 'high', checkOutTime: '11:00 AM', status: 'checkout', estimatedMinutes: 45 },
    { id: '201', floor: 2, priority: 'medium', status: 'checkout', estimatedMinutes: 45 },
    { id: '202', floor: 2, priority: 'low', status: 'stayover', estimatedMinutes: 30 },
    { id: '203', floor: 2, priority: 'high', checkOutTime: '12:00 PM', status: 'checkout', estimatedMinutes: 45 },
    { id: '301', floor: 3, priority: 'medium', status: 'stayover', estimatedMinutes: 30 },
    { id: '302', floor: 3, priority: 'high', checkOutTime: '11:30 AM', status: 'checkout', estimatedMinutes: 45 },
    { id: '303', floor: 3, priority: 'low', status: 'stayover', estimatedMinutes: 30 },
    { id: '304', floor: 3, priority: 'high', status: 'vip', estimatedMinutes: 60 },
  ]);

  const [staff] = useState<StaffMember[]>([
    { id: 'S1', name: 'Maria', skills: ['standard', 'vip'], shiftStart: '8:00 AM', shiftEnd: '4:00 PM', maxRooms: 12 },
    { id: 'S2', name: 'John', skills: ['standard'], shiftStart: '8:00 AM', shiftEnd: '4:00 PM', maxRooms: 14 },
    { id: 'S3', name: 'Lisa', skills: ['standard', 'vip'], shiftStart: '9:00 AM', shiftEnd: '5:00 PM', maxRooms: 12 },
  ]);

  const [historicalData] = useState<HistoricalRecord[]>([
    { date: '2024-01-22', dayType: 'Monday', rooms: 24, staff: 'Maria, John, Lisa', predicted: 540, actual: 575, accuracy: 94 },
    { date: '2024-01-21', dayType: 'Sunday', rooms: 21, staff: 'Maria, John, Lisa', predicted: 475, actual: 480, accuracy: 99 },
    { date: '2024-01-20', dayType: 'Saturday', rooms: 26, staff: 'Maria, John, Lisa', predicted: 590, actual: 610, accuracy: 97 },
    { date: '2024-01-19', dayType: 'Friday', rooms: 28, staff: 'Maria, John, Lisa', predicted: 630, actual: 695, accuracy: 91 },
    { date: '2024-01-18', dayType: 'Thursday', rooms: 22, staff: 'Maria, John', predicted: 495, actual: 485, accuracy: 98 },
  ]);

  const [viewMode, setViewMode] = useState<ViewMode>('housekeeper');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('Maria');

  const optimizeAssignments = async () => {
    setIsOptimizing(true);
    const startTime = performance.now();

    await new Promise((resolve) => setTimeout(resolve, 400));

    const sortedRooms = [...rooms].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const assignments: Assignment[] = staff.map((s) => ({
      staff: s.name,
      staffId: s.id,
      rooms: [],
      totalMinutes: 0,
      route: '',
      routeSteps: [],
      efficiency: 0,
    }));

    sortedRooms.forEach((room) => {
      let bestStaffIdx = 0;
      let minWorkload = assignments[0].totalMinutes;

      assignments.forEach((assignment, idx) => {
        const staffMember = staff[idx];
        const canHandleVIP = room.status === 'vip' ? staffMember.skills.includes('vip') : true;

        if (
          canHandleVIP &&
          assignment.totalMinutes < minWorkload &&
          assignment.rooms.length < staffMember.maxRooms
        ) {
          minWorkload = assignment.totalMinutes;
          bestStaffIdx = idx;
        }
      });

      assignments[bestStaffIdx].rooms.push(room);
      assignments[bestStaffIdx].totalMinutes += room.estimatedMinutes;
    });

    assignments.forEach((assignment) => {
      if (assignment.rooms.length > 0) {
        const roomsByFloor = assignment.rooms.reduce(
          (acc, room) => {
            if (!acc[room.floor]) acc[room.floor] = [];
            acc[room.floor].push(room);
            return acc;
          },
          {} as Record<number, Room[]>
        );

        const floors = Object.keys(roomsByFloor).sort((a, b) => Number(a) - Number(b));

        assignment.routeSteps = floors.map(floor => ({
          floor: Number(floor),
          rooms: roomsByFloor[Number(floor)].map(r => r.id)
        }));

        assignment.route = floors
          .map((floor) => {
            const floorRooms = roomsByFloor[Number(floor)];
            return `Floor ${floor}: ${floorRooms.map((r) => r.id).join(' → ')}`;
          })
          .join(', then ');

        const floorChanges = floors.length - 1;
        assignment.efficiency = Math.max(0, 100 - floorChanges * 10);
      }
    });

    const workloads = assignments.map((a) => a.totalMinutes).filter((w) => w > 0);
    const avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const variance =
      workloads.reduce((sum, w) => sum + Math.pow(w - avgWorkload, 2), 0) / workloads.length;
    const balanceScore = Math.max(0, 100 - Math.sqrt(variance) / 5);

    const totalEfficiency =
      assignments.reduce((sum, a) => sum + a.efficiency, 0) / assignments.length;

    const endTime = performance.now();

    setResult({
      assignments: assignments.filter((a) => a.rooms.length > 0),
      totalEfficiency,
      balanceScore,
      executionTime: endTime - startTime,
    });

    setIsOptimizing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getSelectedAssignment = () => {
    return result?.assignments.find(a => a.staff === selectedStaff);
  };

  const getTodayDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    return `${days[today.getDay()]}, ${today.toLocaleDateString()}`;
  };

  const getPriorityRooms = (assignment: Assignment | undefined) => {
    if (!assignment) return [];
    return assignment.rooms
      .filter(r => r.checkOutTime && r.priority === 'high')
      .sort((a, b) => (a.checkOutTime || '').localeCompare(b.checkOutTime || ''));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos/ml"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧹 Housekeeping Optimization
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Staff-focused route optimization, historical tracking, and ROI proof
          </p>
        </div>

        {/* View Mode Tabs */}
        <ViewTabs
          views={HOUSEKEEPER_MANAGER_HISTORICAL_VIEWS}
          activeView={viewMode}
          onViewChange={(view) => setViewMode(view as ViewMode)}
        />

        {/* Configuration Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Today's Workload
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400">Rooms to Clean</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{rooms.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {rooms.filter(r => r.status === 'checkout').length} checkouts, {rooms.filter(r => r.status === 'stayover').length} stayovers
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400">Staff Available</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{staff.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {staff.map(s => s.name).join(', ')}
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400">VIP Rooms</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {rooms.filter(r => r.status === 'vip').length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Require special training
              </div>
            </div>
          </div>

          <button
            onClick={optimizeAssignments}
            disabled={isOptimizing}
            className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isOptimizing ? 'Optimizing Routes...' : '🎯 Generate Assignments'}
          </button>
        </div>

        {/* Content Views */}
        {result && (
          <>
            {/* HOUSEKEEPER VIEW */}
            {viewMode === 'housekeeper' && (
              <div className="space-y-6">
                {/* Staff Selector */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
                  <div className="flex gap-2">
                    {result.assignments.map((assignment) => (
                      <button
                        key={assignment.staffId}
                        onClick={() => setSelectedStaff(assignment.staff)}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                          selectedStaff === assignment.staff
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {assignment.staff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Assignment Card */}
                {getSelectedAssignment() && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
                      📋 Daily Assignment - {selectedStaff} ({getTodayDate()})
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Total Rooms</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {getSelectedAssignment()?.rooms.length}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Estimated Time</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {Math.floor((getSelectedAssignment()?.totalMinutes || 0) / 60)}h {(getSelectedAssignment()?.totalMinutes || 0) % 60}m
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <div className="text-sm text-slate-600 dark:text-slate-400">Route Efficiency</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {getSelectedAssignment()?.efficiency}%
                        </div>
                      </div>
                    </div>

                    {/* Optimized Route */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        🗺️ Optimized Route (Minimize Floor Changes)
                      </h3>
                      <div className="space-y-3">
                        {getSelectedAssignment()?.routeSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xl flex-shrink-0">
                              F{step.floor}
                            </div>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                Floor {step.floor} - {step.rooms.length} rooms
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {step.rooms.join(' → ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Priority Rooms */}
                    {getPriorityRooms(getSelectedAssignment()).length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <h3 className="font-semibold text-red-900 dark:text-red-300 mb-3">
                          🚨 Priority Rooms (Checkout Today) - DO FIRST
                        </h3>
                        <div className="space-y-2">
                          {getPriorityRooms(getSelectedAssignment()).map((room) => (
                            <div key={room.id} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3">
                              <div>
                                <span className="font-semibold text-gray-900 dark:text-white">Room {room.id}</span>
                                {room.status === 'vip' && (
                                  <span className="ml-2 px-2 py-1 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                Checkout: {room.checkOutTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MANAGER VIEW */}
            {viewMode === 'manager' && (
              <div className="space-y-6">
                {/* ROI Overview */}
                <ROICard
                  title="Monthly Performance Report"
                  metrics={[
                    { label: 'Planning Time Saved', value: '12.5 hrs', sublabel: '$250/month at $20/hr' },
                    { label: 'Routing Efficiency', value: '22.5 hrs', sublabel: '$337/month at $15/hr' },
                    { label: 'Total Savings', value: '$587', sublabel: '$7,044 annual' },
                    { label: 'System Cost', value: '$0', sublabel: 'Zero API fees' },
                  ]}
                  description="Automated planning saves manager 25 min/day. Efficient routing saves 45 min/day in labor. Balanced workloads reduce staff complaints by 71%."
                />

                {/* Performance Metrics */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Today's Optimization Results
                  </h3>

                  <ROIMetrics
                    metrics={[
                      { label: 'Route Efficiency', value: `${result.totalEfficiency.toFixed(0)}%`, color: 'green', sublabel: 'Fewer floor changes' },
                      { label: 'Workload Balance', value: `${result.balanceScore.toFixed(0)}%`, color: 'blue', sublabel: 'Fair distribution' },
                      { label: 'Execution Time', value: `${result.executionTime.toFixed(0)}ms`, color: 'purple', sublabel: '<1 second' },
                      { label: 'Algorithm Cost', value: '$0.00', color: 'green', sublabel: 'Zero fees' },
                    ]}
                  />
                </div>

                {/* Staff Performance */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Staff Workload Distribution
                  </h3>
                  <div className="space-y-4">
                    {result.assignments.map((assignment, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {assignment.staff}
                          </h4>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {assignment.rooms.length} rooms • {Math.floor(assignment.totalMinutes / 60)}h {assignment.totalMinutes % 60}m
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Efficiency</div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {assignment.efficiency}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Floors</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {assignment.routeSteps.length}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Min/Room</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {Math.round(assignment.totalMinutes / assignment.rooms.length)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparison */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Manual vs Optimized Planning
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h4 className="font-semibold text-red-900 dark:text-red-300 mb-3">
                        ❌ Manual Planning (Before)
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <li>• Manager spends 15-30 min daily planning</li>
                        <li>• Suboptimal routes (more floor changes)</li>
                        <li>• Unbalanced workloads cause complaints</li>
                        <li>• No historical tracking or learning</li>
                        <li>• Staff frustration from unfair assignments</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-300 mb-3">
                        ✅ Optimized System (After)
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        <li>• Instant planning (&lt;1 second)</li>
                        <li>• Optimized routes (15-25% time savings)</li>
                        <li>• Balanced workloads (variance &lt;15%)</li>
                        <li>• Historical tracking and learning</li>
                        <li>• Staff satisfaction up 40%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORICAL VIEW */}
            {viewMode === 'historical' && (
              <div className="space-y-6">
                {/* Summary Metrics */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    System Performance - Last 7 Days
                  </h2>

                  <ROIMetrics
                    metrics={[
                      { label: 'Average Accuracy', value: '95.8%', color: 'green', sublabel: 'Within ±10% of actual' },
                      { label: 'Time Savings (7 days)', value: '3.5 hrs', color: 'blue', sublabel: '$52 saved' },
                      { label: 'Days Tracked', value: '5', color: 'purple', sublabel: 'All completed' },
                      { label: 'Efficiency Trend', value: '+12%', color: 'green', sublabel: 'Improving' },
                    ]}
                  />
                </div>

                {/* Historical Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Daily Performance History
                  </h3>

                  <HistoricalTable
                    data={historicalData}
                    columns={[
                      { key: 'date', label: 'Date', align: 'left' },
                      { key: 'dayType', label: 'Day', align: 'left' },
                      { key: 'rooms', label: 'Rooms', align: 'center', className: 'text-gray-900 dark:text-white' },
                      { key: 'staff', label: 'Staff', align: 'left', className: 'text-sm' },
                      {
                        key: 'predicted',
                        label: 'Predicted',
                        align: 'center',
                        format: (val) => `${Math.floor(val / 60)}h ${val % 60}m`,
                        className: 'text-blue-600 dark:text-blue-400 font-semibold'
                      },
                      {
                        key: 'actual',
                        label: 'Actual',
                        align: 'center',
                        format: (val) => `${Math.floor(val / 60)}h ${val % 60}m`,
                        className: 'text-gray-900 dark:text-white font-semibold'
                      },
                      {
                        key: 'accuracy',
                        label: 'Accuracy',
                        align: 'center',
                        format: (val) => TableFormatters.percentage(val)
                      },
                    ]}
                  />
                </div>

                {/* Insights */}
                <InsightsBox
                  insights={[
                    <><strong>Friday pattern detected:</strong> +10% workload vs weekday average (695 min vs 630 min)</>,
                    <><strong>VIP rooms:</strong> Average 35 min actual (not 30 min predicted) - system learning</>,
                    <><strong>Best performer:</strong> Thursday (98% accuracy, minimal variance)</>,
                    <><strong>Routing efficiency:</strong> Saves 45 min/day on average vs manual planning</>,
                    <><strong>Workload balance:</strong> Variance reduced from 28% to 12% (staff satisfaction up)</>,
                  ]}
                />
              </div>
            )}
          </>
        )}

        {!result && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🧹</div>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Click &quot;Generate Assignments&quot; to see staff-focused route optimization
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
