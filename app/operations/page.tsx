'use client';

import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import {
  Task,
  Staff,
  Room,
  TaskStatus,
  TaskPriority,
  OperationsMetrics,
} from '@/lib/operations/types';
import {
  optimizeRoutes,
  calculateMetrics,
  generateRecommendations,
  predictCompletionTime,
} from '@/lib/operations/optimizer';

export default function OperationsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'tasks' | 'routes' | 'rooms'>('tasks');

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = () => {
    setLoading(true);

    // Generate synthetic data
    const syntheticRooms = generateSyntheticRooms(50);
    const syntheticStaff = generateSyntheticStaff(8);
    const syntheticTasks = generateSyntheticTasks(syntheticRooms, syntheticStaff);

    setRooms(syntheticRooms);
    setStaff(syntheticStaff);
    setTasks(syntheticTasks);

    const metricsData = calculateMetrics(syntheticRooms, syntheticTasks, syntheticStaff);
    setMetrics(metricsData);

    const recs = generateRecommendations(syntheticRooms, syntheticTasks, syntheticStaff);
    setRecommendations(recs);

    setLoading(false);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📋';
      case 'low':
        return '📝';
    }
  };

  const getRoomStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'clean':
        return 'bg-green-500';
      case 'dirty':
        return 'bg-red-500';
      case 'in_progress' as any:
        return 'bg-blue-500';
      case 'occupied':
        return 'bg-gray-400';
      case 'maintenance':
        return 'bg-orange-500';
      default:
        return 'bg-gray-300';
    }
  };

  const routes = optimizeRoutes(
    tasks.filter((t) => t.status !== 'completed'),
    staff
  );

  const filteredTasks = selectedFloor
    ? tasks.filter((t) => t.floor === selectedFloor)
    : tasks;

  const filteredRooms = selectedFloor
    ? rooms.filter((r) => r.floor === selectedFloor)
    : rooms;

  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading operations dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            🏨 Operations Command Center
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Real-time housekeeping and maintenance management
          </p>
        </div>

        {/* Metrics Dashboard */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Clean Rooms
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {metrics.cleanRooms}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                of {metrics.totalRooms}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Dirty Rooms
              </div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {metrics.dirtyRooms}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                In Progress
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.inProgress}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Overdue
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {metrics.overdue}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Staff Utilization
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(metrics.staffUtilization * 100)}%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Completion ETA
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {metrics.estimatedCompletion.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              💡 AI Recommendations
            </h2>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="mr-2">{rec.split(' ')[0]}</span>
                  <span>{rec.substring(rec.indexOf(' ') + 1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* View Mode */}
            <div className="flex gap-2">
              {(['tasks', 'routes', 'rooms'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Floor Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Floor:
              </span>
              <button
                onClick={() => setSelectedFloor(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  !selectedFloor
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {floors.map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    selectedFloor === floor
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {floor}
                </button>
              ))}
            </div>

            <button
              onClick={loadOperations}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'tasks' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{getPriorityIcon(task.priority)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {task.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {task.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        Room {task.roomNumber}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Floor {task.floor}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {task.assignedTo || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {task.estimatedDuration} min
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                              Start
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                              Complete
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === 'routes' && (
          <div className="space-y-6">
            {routes.map((route) => {
              const staffMember = staff.find((s) => s.id === route.staffId);
              return (
                <div
                  key={route.staffId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {staffMember?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {staffMember?.role}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Efficiency
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {Math.round(route.efficiency * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tasks
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {route.tasks.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Duration
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {route.totalDuration} min
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Travel
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {route.totalDistance} floors
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {route.tasks.map((task, i) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {i + 1}
                          </span>
                          <span>{getPriorityIcon(task.priority)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Room {task.roomNumber}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {task.title}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {task.estimatedDuration} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'rooms' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {filteredRooms.map((room) => (
                <div
                  key={room.number}
                  className="relative group cursor-pointer"
                  title={`Room ${room.number} - ${room.status}`}
                >
                  <div
                    className={`aspect-square rounded-lg ${getRoomStatusColor(room.status)} flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition`}
                  >
                    {room.number}
                  </div>
                  <div className="absolute inset-0 bg-black/75 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                    {room.status}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Clean
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Dirty
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  In Progress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Occupied
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Maintenance
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function generateSyntheticRooms(count: number): Room[] {
  const types = ['Standard', 'Deluxe', 'Suite'];
  const statuses: Room['status'][] = ['clean', 'dirty', 'occupied', 'maintenance'];
  const floors = [1, 2, 3, 4, 5];

  return Array.from({ length: count }, (_, i) => {
    const floor = floors[Math.floor(i / 10)];
    const roomNum = `${floor}${(i % 10).toString().padStart(2, '0')}`;

    return {
      number: roomNum,
      floor,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastCleaned: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    };
  });
}

function generateSyntheticStaff(count: number): Staff[] {
  const names = [
    'Maria Garcia',
    'Sarah Johnson',
    'Lisa Chen',
    'Ana Rodriguez',
    'Emily Brown',
    'Sofia Martinez',
    'Jessica Lee',
    'Michelle Davis',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: uuid(),
    name: names[i] || `Staff ${i + 1}`,
    role: 'Housekeeper',
    tasksAssigned: Math.floor(Math.random() * 8),
    tasksCompleted: Math.floor(Math.random() * 20),
    efficiency: 0.7 + Math.random() * 0.3,
    available: Math.random() > 0.2,
  }));
}

function generateSyntheticTasks(rooms: Room[], staff: Staff[]): Task[] {
  const tasks: Task[] = [];
  const now = new Date();

  rooms.forEach((room) => {
    if (room.status === 'dirty' || room.status === 'maintenance') {
      const assignedStaff =
        staff[Math.floor(Math.random() * staff.length)];
      const isOverdue = Math.random() > 0.8;
      const isInProgress = Math.random() > 0.7;

      tasks.push({
        id: uuid(),
        type: room.status === 'maintenance' ? 'maintenance' : 'housekeeping',
        roomNumber: room.number,
        floor: room.floor,
        title:
          room.status === 'maintenance'
            ? 'Equipment Repair'
            : 'Deep Cleaning',
        priority: isOverdue
          ? 'urgent'
          : room.status === 'maintenance'
            ? 'high'
            : 'medium',
        status: isOverdue
          ? 'overdue'
          : isInProgress
            ? 'in_progress'
            : 'pending',
        assignedTo: assignedStaff.name,
        estimatedDuration: 20 + Math.floor(Math.random() * 40),
        createdAt: new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000),
        dueAt: isOverdue
          ? new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000)
          : new Date(now.getTime() + Math.random() * 4 * 60 * 60 * 1000),
      });
    }
  });

  return tasks;
}
