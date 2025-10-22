/**
 * Energy Management & Optimization
 */

export interface RoomOccupancy {
  roomId: string;
  occupied: boolean;
  arrivalTime?: Date;
  departureTime?: Date;
  guestPreferences?: { preferredTemp: number };
}

export interface EnergySettings {
  currentTemp: number;
  targetTemp: number;
  outsideTemp: number;
  hvacMode: 'cool' | 'heat' | 'off';
}

export interface EnergyResult {
  roomSettings: Map<string, EnergySettings>;
  estimatedCost: number;
  savings: number; // vs baseline
  method: 'schedule' | 'occupancy' | 'weather';
  processingTime?: number;
}

export function optimizeEnergyScheduleBased(
  rooms: RoomOccupancy[],
  outsideTemp: number
): EnergyResult {
  const startTime = Date.now();
  const settings = new Map<string, EnergySettings>();
  let totalCost = 0;

  rooms.forEach((room) => {
    let targetTemp = 22; // default
    let hvacMode: 'cool' | 'heat' | 'off' = 'off';

    if (room.occupied) {
      targetTemp = room.guestPreferences?.preferredTemp || 22;
      hvacMode = outsideTemp > 24 ? 'cool' : outsideTemp < 18 ? 'heat' : 'off';
      totalCost += 2; // $2/day per occupied room
    } else {
      // Eco mode for vacant
      targetTemp = outsideTemp > 24 ? 26 : 18;
      hvacMode = 'off';
      totalCost += 0.5; // minimal cost
    }

    settings.set(room.roomId, {
      currentTemp: outsideTemp,
      targetTemp,
      outsideTemp,
      hvacMode,
    });
  });

  const baseline = rooms.length * 2; // $2/room baseline
  const savings = ((baseline - totalCost) / baseline) * 100;

  return {
    roomSettings: settings,
    estimatedCost: totalCost,
    savings,
    method: 'schedule',
    processingTime: Date.now() - startTime,
  };
}

export const ENERGY_MODELS = {
  schedule: {
    name: 'Schedule-Based',
    cost: 0,
    avgLatency: 1,
    savings: 15,
    description: 'Fixed temperature schedules',
  },
  occupancy: {
    name: 'Occupancy Prediction',
    cost: 0,
    avgLatency: 20,
    savings: 28,
    description: 'Forecast-based pre-conditioning',
  },
  weather: {
    name: 'Weather-Adaptive',
    cost: 0,
    avgLatency: 50,
    savings: 35,
    description: 'External data integration',
  },
};
