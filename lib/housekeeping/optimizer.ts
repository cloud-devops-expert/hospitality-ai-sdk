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

  // Sort by priority first
  remaining.sort((a, b) => {
    const priorityScore = { vip: 3, priority: 2, normal: 1 };
    return priorityScore[b.priority] - priorityScore[a.priority];
  });

  while (remaining.length > 0) {
    // Find closest room on same floor, then nearest floor
    let nearest = remaining[0];
    let minDist = Math.abs(nearest.floor - floor) * 100 + parseInt(nearest.number);

    for (const room of remaining) {
      const dist = Math.abs(room.floor - floor) * 100 + parseInt(room.number);
      if (dist < minDist) {
        minDist = dist;
        nearest = room;
      }
    }

    route.push(nearest);
    distance += minDist;
    floor = nearest.floor;
    remaining.splice(remaining.indexOf(nearest), 1);
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
