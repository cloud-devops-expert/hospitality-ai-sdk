import { optimizeRouteGreedy, optimizeRouteTSP } from '../optimizer';
import type { Room } from '../optimizer';

describe('Housekeeping Route Optimization', () => {
  const sampleRooms: Room[] = [
    { id: '101', floor: 1, roomNumber: 101, status: 'dirty', priority: 'normal' },
    { id: '102', floor: 1, roomNumber: 102, status: 'dirty', priority: 'normal' },
    { id: '201', floor: 2, roomNumber: 201, status: 'dirty', priority: 'vip' },
    { id: '202', floor: 2, roomNumber: 202, status: 'dirty', priority: 'priority' },
    { id: '301', floor: 3, roomNumber: 301, status: 'dirty', priority: 'normal' },
  ];

  describe('Greedy Algorithm', () => {
    it('should optimize route for given rooms', () => {
      const result = optimizeRouteGreedy(sampleRooms, 1);

      expect(result.route).toHaveLength(sampleRooms.length);
      expect(result.method).toBe('greedy');
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.efficiency).toBeLessThanOrEqual(1);
    });

    it('should prioritize VIP rooms', () => {
      const result = optimizeRouteGreedy(sampleRooms, 1);
      const vipRoom = sampleRooms.find(r => r.priority === 'vip');
      const vipIndex = result.route.indexOf(vipRoom!.id);

      expect(vipIndex).toBeLessThan(3); // VIP should be early in route
    });

    it('should start from specified floor', () => {
      const result = optimizeRouteGreedy(sampleRooms, 2);
      const firstRoom = sampleRooms.find(r => r.id === result.route[0]);

      expect(firstRoom?.floor).toBe(2);
    });

    it('should handle single room', () => {
      const singleRoom = [sampleRooms[0]];
      const result = optimizeRouteGreedy(singleRoom, 1);

      expect(result.route).toHaveLength(1);
      expect(result.totalDistance).toBe(0);
    });

    it('should handle empty room list', () => {
      const result = optimizeRouteGreedy([], 1);

      expect(result.route).toHaveLength(0);
      expect(result.totalDistance).toBe(0);
    });
  });

  describe('TSP Algorithm', () => {
    it('should optimize route more efficiently than greedy', () => {
      const greedyResult = optimizeRouteGreedy(sampleRooms, 1);
      const tspResult = optimizeRouteTSP(sampleRooms, 1);

      expect(tspResult.method).toBe('tsp');
      expect(tspResult.totalDistance).toBeLessThanOrEqual(greedyResult.totalDistance);
      expect(tspResult.efficiency).toBeGreaterThanOrEqual(greedyResult.efficiency);
    });

    it('should include all rooms in route', () => {
      const result = optimizeRouteTSP(sampleRooms, 1);

      expect(result.route).toHaveLength(sampleRooms.length);
      expect(new Set(result.route).size).toBe(sampleRooms.length);
    });

    it('should respect priority ordering', () => {
      const result = optimizeRouteTSP(sampleRooms, 1);
      const vipRoom = sampleRooms.find(r => r.priority === 'vip');
      const vipIndex = result.route.indexOf(vipRoom!.id);

      expect(vipIndex).toBeLessThan(sampleRooms.length / 2); // VIP in first half
    });

    it('should handle single room', () => {
      const singleRoom = [sampleRooms[0]];
      const result = optimizeRouteTSP(singleRoom, 1);

      expect(result.route).toHaveLength(1);
      expect(result.totalDistance).toBe(0);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between floors', () => {
      const floor1Rooms = sampleRooms.filter(r => r.floor === 1);
      const floor3Rooms = sampleRooms.filter(r => r.floor === 3);

      const sameFloorRoute = optimizeRouteGreedy(floor1Rooms, 1);
      const multiFloorRoute = optimizeRouteGreedy([...floor1Rooms, ...floor3Rooms], 1);

      expect(multiFloorRoute.totalDistance).toBeGreaterThan(sameFloorRoute.totalDistance);
    });

    it('should calculate distance between room numbers', () => {
      const adjacentRooms = [
        { id: '101', floor: 1, roomNumber: 101, status: 'dirty' as const, priority: 'normal' as const },
        { id: '102', floor: 1, roomNumber: 102, status: 'dirty' as const, priority: 'normal' as const },
      ];

      const distantRooms = [
        { id: '101', floor: 1, roomNumber: 101, status: 'dirty' as const, priority: 'normal' as const },
        { id: '150', floor: 1, roomNumber: 150, status: 'dirty' as const, priority: 'normal' as const },
      ];

      const adjacentRoute = optimizeRouteGreedy(adjacentRooms, 1);
      const distantRoute = optimizeRouteGreedy(distantRooms, 1);

      expect(distantRoute.totalDistance).toBeGreaterThan(adjacentRoute.totalDistance);
    });
  });

  describe('Efficiency Metrics', () => {
    it('should calculate efficiency ratio', () => {
      const result = optimizeRouteGreedy(sampleRooms, 1);

      expect(result.efficiency).toBeDefined();
      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.efficiency).toBeLessThanOrEqual(1);
    });

    it('should have better efficiency with TSP', () => {
      const greedyResult = optimizeRouteGreedy(sampleRooms, 1);
      const tspResult = optimizeRouteTSP(sampleRooms, 1);

      expect(tspResult.efficiency).toBeGreaterThanOrEqual(greedyResult.efficiency);
    });
  });

  describe('Priority Handling', () => {
    it('should handle different priority levels', () => {
      const mixedPriorityRooms: Room[] = [
        { id: '101', floor: 1, roomNumber: 101, status: 'dirty', priority: 'vip' },
        { id: '102', floor: 1, roomNumber: 102, status: 'dirty', priority: 'priority' },
        { id: '103', floor: 1, roomNumber: 103, status: 'dirty', priority: 'normal' },
      ];

      const result = optimizeRouteGreedy(mixedPriorityRooms, 1);

      // VIP should be first
      expect(result.route[0]).toBe('101');
      // Priority should be second
      expect(result.route[1]).toBe('102');
      // Normal should be last
      expect(result.route[2]).toBe('103');
    });
  });
});
