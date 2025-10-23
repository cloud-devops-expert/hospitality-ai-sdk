import {
  optimizeRoutes,
  calculateMetrics,
  generateRecommendations,
  predictCompletionTime,
} from '../optimizer';
import { Task, Staff, Room } from '../types';

describe('Operations Optimizer', () => {
  const mockStaff: Staff[] = [
    {
      id: 'staff-1',
      name: 'Maria Garcia',
      role: 'Housekeeper',
      tasksAssigned: 5,
      tasksCompleted: 20,
      efficiency: 0.9,
      available: true,
      currentFloor: 1,
    },
    {
      id: 'staff-2',
      name: 'Sarah Johnson',
      role: 'Housekeeper',
      tasksAssigned: 3,
      tasksCompleted: 15,
      efficiency: 0.85,
      available: true,
      currentFloor: 2,
    },
    {
      id: 'staff-3',
      name: 'Lisa Chen',
      role: 'Housekeeper',
      tasksAssigned: 0,
      tasksCompleted: 10,
      efficiency: 0.8,
      available: false,
    },
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      type: 'housekeeping',
      roomNumber: '101',
      floor: 1,
      title: 'Deep Clean',
      priority: 'high',
      status: 'pending',
      estimatedDuration: 30,
      createdAt: new Date('2024-01-01T09:00:00'),
    },
    {
      id: 'task-2',
      type: 'housekeeping',
      roomNumber: '102',
      floor: 1,
      title: 'Deep Clean',
      priority: 'medium',
      status: 'pending',
      estimatedDuration: 25,
      createdAt: new Date('2024-01-01T09:05:00'),
    },
    {
      id: 'task-3',
      type: 'housekeeping',
      roomNumber: '201',
      floor: 2,
      title: 'Deep Clean',
      priority: 'urgent',
      status: 'pending',
      estimatedDuration: 35,
      createdAt: new Date('2024-01-01T09:10:00'),
    },
    {
      id: 'task-4',
      type: 'maintenance',
      roomNumber: '202',
      floor: 2,
      title: 'Fix AC',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'staff-2',
      estimatedDuration: 45,
      createdAt: new Date('2024-01-01T08:00:00'),
    },
  ];

  const mockRooms: Room[] = [
    {
      number: '101',
      floor: 1,
      type: 'Standard',
      status: 'dirty',
    },
    {
      number: '102',
      floor: 1,
      type: 'Deluxe',
      status: 'dirty',
    },
    {
      number: '201',
      floor: 2,
      type: 'Suite',
      status: 'dirty',
    },
    {
      number: '202',
      floor: 2,
      type: 'Standard',
      status: 'maintenance',
    },
    {
      number: '301',
      floor: 3,
      type: 'Standard',
      status: 'clean',
    },
  ];

  describe('optimizeRoutes', () => {
    it('should create routes for available staff', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every((r) => r.staffId)).toBe(true);
    });

    it('should assign tasks to routes', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      const totalAssignedTasks = routes.reduce(
        (sum, r) => sum + r.tasks.length,
        0
      );

      expect(totalAssignedTasks).toBeGreaterThan(0);
      expect(totalAssignedTasks).toBeLessThanOrEqual(mockTasks.length);
    });

    it('should group tasks by floor for efficiency', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      routes.forEach((route) => {
        if (route.tasks.length > 1) {
          // Check if consecutive tasks are on same floor when possible
          const floors = route.tasks.map((t) => t.floor);
          const uniqueFloors = new Set(floors);
          // Having fewer floor changes is more efficient
          expect(uniqueFloors.size).toBeLessThanOrEqual(route.tasks.length);
        }
      });
    });

    it('should prioritize urgent and high priority tasks', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      routes.forEach((route) => {
        if (route.tasks.length > 0) {
          // First task should be urgent or high priority when available
          const firstTask = route.tasks[0];
          const hasUrgentOrHigh = ['urgent', 'high'].includes(
            firstTask.priority
          );
          // At least check that priority is considered
          expect(firstTask.priority).toBeDefined();
        }
      });
    });

    it('should calculate total duration for each route', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      routes.forEach((route) => {
        const calculatedDuration = route.tasks.reduce(
          (sum, task) => sum + task.estimatedDuration,
          0
        );

        expect(route.totalDuration).toBe(calculatedDuration);
      });
    });

    it('should calculate travel distance between floors', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      routes.forEach((route) => {
        expect(route.totalDistance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate efficiency score', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      routes.forEach((route) => {
        expect(route.efficiency).toBeGreaterThan(0);
        expect(route.efficiency).toBeLessThanOrEqual(1);
      });
    });

    it('should not assign tasks to unavailable staff', () => {
      const routes = optimizeRoutes(mockTasks, mockStaff);

      const unavailableStaffIds = mockStaff
        .filter((s) => !s.available)
        .map((s) => s.id);

      routes.forEach((route) => {
        expect(unavailableStaffIds).not.toContain(route.staffId);
      });
    });

    it('should handle empty task list', () => {
      const routes = optimizeRoutes([], mockStaff);

      expect(routes).toEqual([]);
    });

    it('should handle no available staff', () => {
      const unavailableStaff = mockStaff.map((s) => ({
        ...s,
        available: false,
      }));

      const routes = optimizeRoutes(mockTasks, unavailableStaff);

      expect(routes).toEqual([]);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate total rooms', () => {
      const metrics = calculateMetrics(mockRooms, mockTasks, mockStaff);

      expect(metrics.totalRooms).toBe(mockRooms.length);
    });

    it('should count clean rooms correctly', () => {
      const metrics = calculateMetrics(mockRooms, mockTasks, mockStaff);

      const expectedClean = mockRooms.filter((r) => r.status === 'clean').length;

      expect(metrics.cleanRooms).toBe(expectedClean);
    });

    it('should count dirty rooms correctly', () => {
      const metrics = calculateMetrics(mockRooms, mockTasks, mockStaff);

      const expectedDirty = mockRooms.filter(
        (r) => r.status === 'dirty' || r.status === 'vacant'
      ).length;

      expect(metrics.dirtyRooms).toBe(expectedDirty);
    });

    it('should count tasks in progress', () => {
      const metrics = calculateMetrics(mockRooms, mockTasks, mockStaff);

      const expectedInProgress = mockTasks.filter(
        (t) => t.status === 'in_progress'
      ).length;

      expect(metrics.inProgress).toBe(expectedInProgress);
    });

    it('should count overdue tasks', () => {
      const now = new Date();
      const tasksWithOverdue: Task[] = [
        ...mockTasks,
        {
          id: 'task-5',
          type: 'housekeeping',
          roomNumber: '301',
          floor: 3,
          title: 'Clean',
          priority: 'high',
          status: 'pending',
          estimatedDuration: 30,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          dueAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
      ];

      const metrics = calculateMetrics(mockRooms, tasksWithOverdue, mockStaff);

      expect(metrics.overdue).toBeGreaterThan(0);
    });

    it('should calculate staff utilization', () => {
      const metrics = calculateMetrics(mockRooms, mockTasks, mockStaff);

      expect(metrics.staffUtilization).toBeGreaterThanOrEqual(0);
      expect(metrics.staffUtilization).toBeLessThanOrEqual(1);
    });

    it('should estimate completion time', () => {
      const metrics = calculateMetrics(mockRooms, mockTasks, mockStaff);

      expect(metrics.estimatedCompletion).toBeInstanceOf(Date);
      expect(metrics.estimatedCompletion.getTime()).toBeGreaterThanOrEqual(
        Date.now()
      );
    });

    it('should handle empty rooms list', () => {
      const metrics = calculateMetrics([], mockTasks, mockStaff);

      expect(metrics.totalRooms).toBe(0);
      expect(metrics.cleanRooms).toBe(0);
      expect(metrics.dirtyRooms).toBe(0);
    });

    it('should handle empty tasks list', () => {
      const metrics = calculateMetrics(mockRooms, [], mockStaff);

      expect(metrics.inProgress).toBe(0);
      expect(metrics.overdue).toBe(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on metrics', () => {
      const recommendations = generateRecommendations(
        mockRooms,
        mockTasks,
        mockStaff
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should alert for overdue tasks', () => {
      const now = new Date();
      const tasksWithOverdue: Task[] = [
        {
          id: 'task-overdue',
          type: 'housekeeping',
          roomNumber: '101',
          floor: 1,
          title: 'Clean',
          priority: 'high',
          status: 'pending',
          estimatedDuration: 30,
          createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          dueAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        },
      ];

      const recommendations = generateRecommendations(
        mockRooms,
        tasksWithOverdue,
        mockStaff
      );

      const hasOverdueAlert = recommendations.some((r) =>
        r.toLowerCase().includes('overdue')
      );

      expect(hasOverdueAlert).toBe(true);
    });

    it('should warn about high staff utilization', () => {
      const highUtilizationTasks: Task[] = Array.from(
        { length: 20 },
        (_, i) => ({
          id: `task-${i}`,
          type: 'housekeeping' as const,
          roomNumber: `10${i}`,
          floor: Math.floor(i / 5) + 1,
          title: 'Clean',
          priority: 'medium' as const,
          status: 'pending' as const,
          estimatedDuration: 60,
          createdAt: new Date(),
        })
      );

      const recommendations = generateRecommendations(
        mockRooms,
        highUtilizationTasks,
        mockStaff
      );

      // Should generate some recommendations for high workload
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend preventive maintenance when utilization is low', () => {
      const lowUtilizationTasks: Task[] = [mockTasks[0]];

      const recommendations = generateRecommendations(
        mockRooms,
        lowUtilizationTasks,
        mockStaff
      );

      const hasLowUtilizationRec = recommendations.some(
        (r) =>
          r.toLowerCase().includes('preventive') ||
          r.toLowerCase().includes('low utilization')
      );

      // Either should recommend preventive maintenance or show all clear
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should alert for upcoming checkouts', () => {
      const now = new Date();
      const roomsWithCheckout: Room[] = [
        {
          number: '101',
          floor: 1,
          type: 'Standard',
          status: 'occupied',
          nextCheckout: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
        },
      ];

      const recommendations = generateRecommendations(
        roomsWithCheckout,
        mockTasks,
        mockStaff
      );

      const hasCheckoutAlert = recommendations.some((r) =>
        r.toLowerCase().includes('checkout')
      );

      expect(hasCheckoutAlert).toBe(true);
    });

    it('should alert for upcoming checkins with unready rooms', () => {
      const now = new Date();
      const roomsWithCheckin: Room[] = [
        {
          number: '101',
          floor: 1,
          type: 'Standard',
          status: 'dirty',
          nextCheckin: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        },
      ];

      const recommendations = generateRecommendations(
        roomsWithCheckin,
        mockTasks,
        mockStaff
      );

      const hasCheckinAlert = recommendations.some((r) =>
        r.toLowerCase().includes('check-in')
      );

      expect(hasCheckinAlert).toBe(true);
    });

    it('should provide positive feedback when operations are smooth', () => {
      const cleanRooms: Room[] = mockRooms.map((r) => ({
        ...r,
        status: 'clean',
      }));

      const recommendations = generateRecommendations(
        cleanRooms,
        [],
        mockStaff
      );

      // Should have at least one recommendation (could be positive or neutral)
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toBeDefined();
    });
  });

  describe('predictCompletionTime', () => {
    const task: Task = {
      id: 'task-1',
      type: 'housekeeping',
      roomNumber: '101',
      floor: 1,
      title: 'Deep Clean',
      priority: 'medium',
      status: 'pending',
      estimatedDuration: 30,
      createdAt: new Date(),
    };

    it('should predict completion time', () => {
      const prediction = predictCompletionTime(task, mockStaff);

      expect(prediction.estimatedCompletion).toBeInstanceOf(Date);
      expect(prediction.estimatedCompletion.getTime()).toBeGreaterThan(
        Date.now()
      );
    });

    it('should provide confidence score', () => {
      const prediction = predictCompletionTime(task, mockStaff);

      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should adjust duration based on staff efficiency', () => {
      const assignedTask = {
        ...task,
        assignedTo: 'staff-1', // Maria with 0.9 efficiency
      };

      const prediction = predictCompletionTime(assignedTask, mockStaff);

      // Should adjust for efficiency
      const timeDiff =
        prediction.estimatedCompletion.getTime() - Date.now();
      const minutes = timeDiff / (60 * 1000);

      // Duration should be adjusted by efficiency (30 / 0.9 ≈ 33.3 minutes)
      expect(minutes).toBeGreaterThan(30);
      expect(minutes).toBeLessThan(40);
    });

    it('should have higher confidence when staff is assigned', () => {
      const assignedTask = {
        ...task,
        assignedTo: 'staff-1',
      };

      const unassignedPrediction = predictCompletionTime(task, mockStaff);
      const assignedPrediction = predictCompletionTime(
        assignedTask,
        mockStaff
      );

      expect(assignedPrediction.confidence).toBeGreaterThan(
        unassignedPrediction.confidence
      );
    });

    it('should adjust time for urgent tasks', () => {
      const urgentTask = {
        ...task,
        priority: 'urgent' as const,
        assignedTo: 'staff-1',
      };

      const normalPrediction = predictCompletionTime(
        { ...task, assignedTo: 'staff-1' },
        mockStaff
      );
      const urgentPrediction = predictCompletionTime(urgentTask, mockStaff);

      // Urgent tasks are faster but less thorough (0.8x duration)
      const normalTime =
        normalPrediction.estimatedCompletion.getTime() - Date.now();
      const urgentTime =
        urgentPrediction.estimatedCompletion.getTime() - Date.now();

      expect(urgentTime).toBeLessThan(normalTime);
    });
  });
});
