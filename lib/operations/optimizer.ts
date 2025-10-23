/**
 * Operations Optimizer
 * Route optimization for housekeeping and maintenance
 */

import { Task, Staff, Route, Room, OperationsMetrics } from './types';

/**
 * Optimize task routes for staff
 */
export function optimizeRoutes(tasks: Task[], staff: Staff[]): Route[] {
  // Group tasks by floor for efficiency
  const tasksByFloor = new Map<number, Task[]>();
  tasks.forEach((task) => {
    const floorTasks = tasksByFloor.get(task.floor) || [];
    floorTasks.push(task);
    tasksByFloor.set(task.floor, floorTasks);
  });

  // Sort floors
  const floors = Array.from(tasksByFloor.keys()).sort((a, b) => a - b);

  // Assign tasks to available staff
  const availableStaff = staff.filter((s) => s.available);
  const routes: Route[] = [];
  let staffIndex = 0;

  for (const floor of floors) {
    const floorTasks = tasksByFloor.get(floor) || [];

    // Sort tasks by priority and room number
    floorTasks.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.roomNumber.localeCompare(b.roomNumber);
    });

    // Distribute tasks among staff
    for (const task of floorTasks) {
      if (availableStaff.length === 0) break;

      const currentStaff = availableStaff[staffIndex % availableStaff.length];
      let route = routes.find((r) => r.staffId === currentStaff.id);

      if (!route) {
        route = {
          staffId: currentStaff.id,
          tasks: [],
          totalDuration: 0,
          totalDistance: 0,
          efficiency: 0,
        };
        routes.push(route);
      }

      route.tasks.push(task);
      route.totalDuration += task.estimatedDuration;

      // Calculate floor distance
      if (route.tasks.length > 1) {
        const prevTask = route.tasks[route.tasks.length - 2];
        route.totalDistance += Math.abs(task.floor - prevTask.floor);
      }

      staffIndex++;
    }
  }

  // Calculate efficiency for each route
  routes.forEach((route) => {
    // Efficiency = (total task time) / (total task time + travel time)
    // Assume 2 minutes per floor traveled
    const travelTime = route.totalDistance * 2;
    route.efficiency =
      route.totalDuration / (route.totalDuration + travelTime);
  });

  return routes;
}

/**
 * Calculate operations metrics
 */
export function calculateMetrics(
  rooms: Room[],
  tasks: Task[],
  staff: Staff[]
): OperationsMetrics {
  const cleanRooms = rooms.filter((r) => r.status === 'clean').length;
  const dirtyRooms = rooms.filter(
    (r) => r.status === 'dirty' || r.status === 'vacant'
  ).length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;

  const now = new Date();
  const overdue = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.dueAt &&
      t.dueAt < now
  ).length;

  // Calculate average cleaning time from completed tasks
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const avgCleaningTime = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => {
        if (t.completedAt && t.createdAt) {
          return (
            sum + (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60)
          );
        }
        return sum;
      }, 0) / completedTasks.length
    : 30; // Default 30 minutes

  // Calculate staff utilization
  const totalCapacity = staff.length * 8 * 60; // 8 hours per staff
  const totalAssigned = tasks
    .filter((t) => t.status !== 'completed')
    .reduce((sum, t) => sum + t.estimatedDuration, 0);
  const staffUtilization = totalCapacity > 0 ? totalAssigned / totalCapacity : 0;

  // Estimate completion time
  const remainingMinutes = tasks
    .filter((t) => t.status !== 'completed')
    .reduce((sum, t) => sum + t.estimatedDuration, 0);
  const availableStaff = staff.filter((s) => s.available).length;
  const avgMinutesPerStaff = availableStaff > 0 ? remainingMinutes / availableStaff : remainingMinutes;
  const estimatedCompletion = new Date(now.getTime() + avgMinutesPerStaff * 60 * 1000);

  return {
    totalRooms: rooms.length,
    cleanRooms,
    dirtyRooms,
    inProgress,
    overdue,
    avgCleaningTime,
    staffUtilization,
    estimatedCompletion,
  };
}

/**
 * Generate task recommendations
 */
export function generateRecommendations(
  rooms: Room[],
  tasks: Task[],
  staff: Staff[]
): string[] {
  const recommendations: string[] = [];
  const metrics = calculateMetrics(rooms, tasks, staff);

  // Check for overdue tasks
  if (metrics.overdue > 0) {
    recommendations.push(
      `🚨 ${metrics.overdue} task${metrics.overdue > 1 ? 's are' : ' is'} overdue - prioritize immediately`
    );
  }

  // Check staff utilization
  if (metrics.staffUtilization > 0.9) {
    recommendations.push(
      '⚠️ Staff is over-utilized (>90%) - consider calling additional help'
    );
  } else if (metrics.staffUtilization < 0.5) {
    recommendations.push(
      '💡 Low utilization (<50%) - opportunity for preventive maintenance'
    );
  }

  // Check for upcoming checkouts
  const now = new Date();
  const upcomingCheckouts = rooms.filter((r) => {
    if (!r.nextCheckout) return false;
    const hoursUntil =
      (r.nextCheckout.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil < 2;
  });

  if (upcomingCheckouts.length > 0) {
    recommendations.push(
      `⏰ ${upcomingCheckouts.length} checkout${upcomingCheckouts.length > 1 ? 's' : ''} in next 2 hours - prepare rooms`
    );
  }

  // Check for upcoming checkins
  const upcomingCheckins = rooms.filter((r) => {
    if (!r.nextCheckin) return false;
    const hoursUntil =
      (r.nextCheckin.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil < 3 && r.status !== 'clean';
  });

  if (upcomingCheckins.length > 0) {
    recommendations.push(
      `🔑 ${upcomingCheckins.length} check-in${upcomingCheckins.length > 1 ? 's' : ''} in next 3 hours with unready rooms`
    );
  }

  // Efficiency recommendations
  const routes = optimizeRoutes(
    tasks.filter((t) => t.status !== 'completed'),
    staff
  );
  const avgEfficiency =
    routes.length > 0
      ? routes.reduce((sum, r) => sum + r.efficiency, 0) / routes.length
      : 1;

  if (avgEfficiency < 0.7) {
    recommendations.push(
      '📊 Route efficiency is low (<70%) - consider regrouping tasks by floor'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All operations running smoothly');
  }

  return recommendations;
}

/**
 * Predict task completion time
 */
export function predictCompletionTime(
  task: Task,
  staff: Staff[]
): { estimatedCompletion: Date; confidence: number } {
  const assignedStaff = staff.find((s) => s.id === task.assignedTo);

  let duration = task.estimatedDuration;

  // Adjust based on staff efficiency
  if (assignedStaff) {
    duration = duration / assignedStaff.efficiency;
  }

  // Add buffer for priority tasks
  if (task.priority === 'urgent') {
    duration *= 0.8; // Rush tasks are faster but less thorough
  }

  const estimatedCompletion = new Date(
    Date.now() + duration * 60 * 1000
  );

  // Confidence based on data availability
  const confidence = assignedStaff ? 0.85 : 0.6;

  return { estimatedCompletion, confidence };
}
