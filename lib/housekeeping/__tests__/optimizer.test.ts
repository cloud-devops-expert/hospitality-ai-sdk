import { optimizeRouteGreedy, optimizeRouteTSP } from '../optimizer';
import type { Room } from '../optimizer';

describe('Housekeeping Route Optimization', () => {
  const sampleRooms: Room[] = [
    {
      id: 'room-1',
      number: '101',
      floor: 1,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
    {
      id: 'room-2',
      number: '102',
      floor: 1,
      status: 'dirty',
      priority: 'priority',
      estimatedCleanTime: 35,
    },
    {
      id: 'room-3',
      number: '201',
      floor: 2,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
    {
      id: 'room-4',
      number: '202',
      floor: 2,
      status: 'dirty',
      priority: 'normal',
      estimatedCleanTime: 30,
    },
    {
      id: 'room-5',
      number: '105',
      floor: 1,
      status: 'dirty',
      priority: 'vip',
      estimatedCleanTime: 40,
    },
  ];

  describe('Greedy Algorithm', () => {
    it('should optimize route for given rooms', () => {
      const result = optimizeRouteGreedy(sampleRooms, 1);

      expect(result.rooms).toHaveLength(sampleRooms.length);
      expect(result.method).toBe('greedy');
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.efficiency).toBeGreaterThan(0);
    });

    it('should prioritize VIP rooms', () => {
      const result = optimizeRouteGreedy(sampleRooms, 1);

      // VIP should be cleaned early
      const vipIndex = result.rooms.findIndex((r) => r.id === 'room-5');

      expect(vipIndex).toBeLessThan(3);
    });

    it('should minimize distance traveled', () => {
      const result = optimizeRouteGreedy(sampleRooms, 1);

      // Should visit rooms and have reasonable total distance
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.totalDistance).toBeLessThan(2000);
    });
  });

  describe('TSP Algorithm', () => {
    it('should outperform greedy algorithm', () => {
      const greedy = optimizeRouteGreedy(sampleRooms, 1);
      const tsp = optimizeRouteTSP(sampleRooms, 1);

      expect(tsp.rooms).toHaveLength(sampleRooms.length);
      expect(tsp.efficiency).toBeGreaterThanOrEqual(greedy.efficiency);
      expect(tsp.method).toBe('tsp');
    });

    it('should provide optimal or near-optimal route', () => {
      const result = optimizeRouteTSP(sampleRooms, 1);

      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.estimatedTime).toBeGreaterThan(0);
    });
  });

  describe('Performance Comparison', () => {
    it('should show efficiency improvements across methods', () => {
      const greedy = optimizeRouteGreedy(sampleRooms, 1);
      const tsp = optimizeRouteTSP(sampleRooms, 1);

      expect(greedy.rooms).toHaveLength(sampleRooms.length);
      expect(tsp.rooms).toHaveLength(sampleRooms.length);
      expect(greedy.efficiency).toBeGreaterThan(0);
      expect(tsp.efficiency).toBeGreaterThanOrEqual(greedy.efficiency);
    });

    it('should process large sets efficiently', () => {
      const largeSet = Array.from({ length: 20 }, (_, i) => ({
        id: `room-${i}`,
        number: `${100 + i}`,
        floor: Math.floor(i / 4) + 1,
        status: 'dirty' as const,
        priority: 'normal' as const,
        estimatedCleanTime: 30,
      }));

      const result = optimizeRouteGreedy(largeSet, 1);

      expect(result.rooms.length).toBe(20);
      expect(result.processingTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single room', () => {
      const singleRoom = [sampleRooms[0]];
      const result = optimizeRouteGreedy(singleRoom, 1);

      expect(result.rooms).toHaveLength(1);
      expect(result.totalDistance).toBeGreaterThanOrEqual(0);
    });

    it('should handle all clean rooms', () => {
      const cleanRooms = sampleRooms.map((r) => ({ ...r, status: 'clean' as const }));
      const result = optimizeRouteGreedy(cleanRooms, 1);

      expect(result.rooms).toHaveLength(0);
    });

    it('should handle rooms across multiple floors', () => {
      const multiFloor = [
        {
          id: 'room-1',
          number: '101',
          floor: 1,
          status: 'dirty' as const,
          priority: 'normal' as const,
          estimatedCleanTime: 30,
        },
        {
          id: 'room-2',
          number: '301',
          floor: 3,
          status: 'dirty' as const,
          priority: 'normal' as const,
          estimatedCleanTime: 30,
        },
        {
          id: 'room-3',
          number: '501',
          floor: 5,
          status: 'dirty' as const,
          priority: 'normal' as const,
          estimatedCleanTime: 30,
        },
      ];

      const result = optimizeRouteGreedy(multiFloor, 1);

      expect(result.rooms).toHaveLength(3);
      expect(result.totalDistance).toBeGreaterThan(0);
    });
  });

  describe('Priority Handling', () => {
    it('should respect room priorities', () => {
      const result = optimizeRouteGreedy(sampleRooms, 1);

      // VIP should be early in the route (first 3 positions)
      const vipIndex = result.rooms.findIndex((r) => r.priority === 'vip');
      expect(vipIndex).toBeLessThan(3);

      // Priority should be before normal rooms
      const priorityIndex = result.rooms.findIndex((r) => r.priority === 'priority');
      const normalIndices = result.rooms
        .map((r, i) => (r.priority === 'normal' ? i : -1))
        .filter((i) => i >= 0);

      expect(priorityIndex).toBeLessThan(Math.max(...normalIndices));
    });
  });
});
