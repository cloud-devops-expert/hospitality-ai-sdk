/**
 * Maintenance Prediction (Preventive)
 */

export interface Asset {
  id: string;
  name: string;
  type: 'hvac' | 'elevator' | 'plumbing' | 'electrical';
  ageMonths: number;
  usageHours: number;
  lastMaintenance: Date;
}

export interface MaintenancePrediction {
  asset: Asset;
  daysUntilMaintenance: number;
  failureRisk: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  method: 'schedule' | 'usage' | 'ml';
  processingTime?: number;
}

export function predictMaintenanceUsageBased(asset: Asset): MaintenancePrediction {
  const startTime = Date.now();

  // Usage-based prediction
  const maintenanceIntervals: Record<Asset['type'], number> = {
    hvac: 2160, // 90 days * 24 hours
    elevator: 4320, // 180 days * 24 hours
    plumbing: 8760, // 365 days * 24 hours
    electrical: 4320,
  };

  const interval = maintenanceIntervals[asset.type];
  const hoursSinceLastMaintenance = asset.usageHours;
  const utilizationRate = hoursSinceLastMaintenance / interval;

  const daysUntilMaintenance = Math.max(0, Math.floor((interval - hoursSinceLastMaintenance) / 24));
  const failureRisk = Math.min(1, utilizationRate);

  let priority: MaintenancePrediction['priority'];
  if (failureRisk > 0.8) priority = 'high';
  else if (failureRisk > 0.5) priority = 'medium';
  else priority = 'low';

  return {
    asset,
    daysUntilMaintenance,
    failureRisk,
    priority,
    method: 'usage',
    processingTime: Date.now() - startTime,
  };
}

export const MAINTENANCE_MODELS = {
  schedule: {
    name: 'Schedule-Based',
    cost: 0,
    avgLatency: 1,
    effectiveness: 0.6,
    description: 'Fixed intervals',
  },
  usage: {
    name: 'Usage-Based',
    cost: 0,
    avgLatency: 20,
    effectiveness: 0.78,
    description: 'Actual utilization tracking',
  },
  ml: {
    name: 'ML Prediction',
    cost: 0,
    avgLatency: 80,
    effectiveness: 0.93,
    description: 'Failure probability',
  },
};
