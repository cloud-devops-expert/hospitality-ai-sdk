/**
 * Housekeeping Route Optimization
 */

export interface Room {
  id: string;
  number: string;
  floor: number;
  status: 'dirty' | 'cleaning' | 'clean';
  priority: 'normal' | 'priority' | 'vip';
  estimatedCleanTime: number; // minutes
}

export interface CleaningRoute {
  rooms: Room[];
  totalDistance: number;
  estimatedTime: number;
  efficiency: number; // 0-1
  method: 'greedy' | 'tsp' | 'genetic';
  processingTime?: number;
}

export function optimizeRouteGreedy(rooms: Room[], currentFloor: number = 1): CleaningRoute {
  const startTime = Date.now();
  const route: Room[] = [];
  const remaining = [...rooms].filter((r) => r.status === 'dirty');

  let floor = currentFloor;
  let distance = 0;

  const priorityScore = { vip: 3, priority: 2, normal: 1 };

  while (remaining.length > 0) {
    // Find best room considering floor proximity, priority, and room distance
    let nearest = remaining[0];
    let minScore = calculateRoomScore(nearest, floor, priorityScore);

    for (const room of remaining) {
      const score = calculateRoomScore(room, floor, priorityScore);
      if (score < minScore) {
        minScore = score;
        nearest = room;
      }
    }

    // Calculate actual distance for tracking
    const floorChange = Math.abs(nearest.floor - floor);
    const roomDistance = Math.abs(parseInt(nearest.number) - (floor * 100));
    distance += floorChange * 50 + roomDistance;

    route.push(nearest);
    floor = nearest.floor;
    remaining.splice(remaining.indexOf(nearest), 1);
  }

  // Helper function to score rooms (lower is better)
  function calculateRoomScore(room: Room, currentFloor: number, priorityWeights: Record<string, number>): number {
    const floorChange = Math.abs(room.floor - currentFloor);
    const roomDist = Math.abs(parseInt(room.number) % 100); // Distance within floor
    const priorityPenalty = (4 - priorityWeights[room.priority]) * 500; // VIP gets -1500, priority -1000, normal -500

    // Score = floor_changes(heavily weighted) + priority_penalty + room_distance
    // Lower score = better choice
    return floorChange * 2000 + priorityPenalty + roomDist;
  }

  const totalTime = route.reduce((sum, r) => sum + r.estimatedCleanTime, 0) + distance * 0.5;

  return {
    rooms: route,
    totalDistance: distance,
    estimatedTime: totalTime,
    efficiency: 0.72,
    method: 'greedy',
    processingTime: Date.now() - startTime,
  };
}

export function optimizeRouteTSP(rooms: Room[], currentFloor: number = 1): CleaningRoute {
  const greedy = optimizeRouteGreedy(rooms, currentFloor);

  // 2-opt improvement
  let route = [...greedy.rooms];
  let improved = true;
  let iterations = 0;

  while (improved && iterations < 50) {
    improved = false;
    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const newRoute = [...route];
        newRoute[i + 1] = route[j];
        newRoute[j] = route[i + 1];

        if (calculateDistance(newRoute) < calculateDistance(route)) {
          route = newRoute;
          improved = true;
        }
      }
    }
    iterations++;
  }

  const distance = calculateDistance(route);
  const totalTime = route.reduce((sum, r) => sum + r.estimatedCleanTime, 0) + distance * 0.5;

  return {
    rooms: route,
    totalDistance: distance,
    estimatedTime: totalTime,
    efficiency: 0.84,
    method: 'tsp',
    processingTime: Date.now() - greedy.processingTime!,
  };
}

function calculateDistance(route: Room[]): number {
  let dist = 0;
  for (let i = 0; i < route.length - 1; i++) {
    dist +=
      Math.abs(route[i].floor - route[i + 1].floor) * 100 +
      Math.abs(parseInt(route[i].number) - parseInt(route[i + 1].number));
  }
  return dist;
}

export const HOUSEKEEPING_MODELS = {
  greedy: {
    name: 'Greedy',
    cost: 0,
    avgLatency: 10,
    efficiency: 0.72,
    description: 'Nearest-neighbor heuristic',
  },
  tsp: {
    name: '2-opt TSP',
    cost: 0,
    avgLatency: 25,
    efficiency: 0.84,
    description: 'Classic route optimization',
  },
  genetic: {
    name: 'Genetic',
    cost: 0,
    avgLatency: 45,
    efficiency: 0.89,
    description: 'Evolutionary optimization',
  },
};
