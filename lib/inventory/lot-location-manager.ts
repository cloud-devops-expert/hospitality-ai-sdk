/**
 * Lot and Location Management System
 *
 * Features:
 * - Warehouse location tracking
 * - FIFO/FEFO (First Expired First Out) management
 * - Lot/batch tracking with traceability
 * - Expiration risk monitoring
 * - Automated rotation recommendations
 * - Location optimization for picking efficiency
 */

export interface WarehouseLocation {
  id: string;
  zone: 'receiving' | 'cold-storage' | 'dry-storage' | 'prep-area' | 'bar' | 'kitchen';
  aisle?: string;
  shelf?: string;
  bin?: string;
  temperature?: number; // Celsius
  capacity: number;
  currentLoad: number;
  pickingPriority: number; // Lower = picked first
}

export interface Lot {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  receivedDate: Date;
  expirationDate?: Date;
  supplier: string;
  batchNumber: string;
  location: WarehouseLocation;
  status: 'available' | 'allocated' | 'expired' | 'quarantine';
  qualityScore?: number; // 0-100
}

export interface AllocationRequest {
  itemId: string;
  quantity: number;
  requestDate: Date;
  purpose: 'kitchen' | 'bar' | 'housekeeping' | 'maintenance';
  priority: 'urgent' | 'normal' | 'low';
}

export interface AllocationResult {
  lots: Array<{
    lot: Lot;
    quantityAllocated: number;
    daysUntilExpiration?: number;
  }>;
  totalAllocated: number;
  shortfall: number;
  warnings: string[];
  recommendations: string[];
  method: 'fifo' | 'fefo' | 'quality-first';
}

export interface ExpirationAlert {
  lot: Lot;
  daysUntilExpiration: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendedAction: string;
  affectedQuantity: number;
}

export interface LocationOptimization {
  lot: Lot;
  currentLocation: WarehouseLocation;
  recommendedLocation: WarehouseLocation;
  reason: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedPickingTimeReduction?: number; // seconds
}

/**
 * Allocate inventory using FEFO (First Expired First Out) strategy
 */
export function allocateInventoryFEFO(
  request: AllocationRequest,
  availableLots: Lot[]
): AllocationResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const allocations: Array<{
    lot: Lot;
    quantityAllocated: number;
    daysUntilExpiration?: number;
  }> = [];

  // Filter available lots for this item
  const itemLots = availableLots.filter(
    (lot) => lot.itemId === request.itemId && lot.status === 'available'
  );

  if (itemLots.length === 0) {
    return {
      lots: [],
      totalAllocated: 0,
      shortfall: request.quantity,
      warnings: ['No available inventory for this item'],
      recommendations: ['Place urgent order'],
      method: 'fefo',
    };
  }

  // Sort by expiration date (earliest first)
  const sortedLots = itemLots.sort((a, b) => {
    if (!a.expirationDate) return 1; // Non-perishable goes last
    if (!b.expirationDate) return -1;
    return a.expirationDate.getTime() - b.expirationDate.getTime();
  });

  let remainingQuantity = request.quantity;

  for (const lot of sortedLots) {
    if (remainingQuantity <= 0) break;

    const quantityToAllocate = Math.min(remainingQuantity, lot.quantity);

    let daysUntilExpiration: number | undefined;
    if (lot.expirationDate) {
      const msUntilExpiration = lot.expirationDate.getTime() - request.requestDate.getTime();
      daysUntilExpiration = Math.floor(msUntilExpiration / (1000 * 60 * 60 * 24));

      // Warning for near-expiration items
      if (daysUntilExpiration <= 2) {
        warnings.push(
          `⚠️ Critical: Lot ${lot.batchNumber} expires in ${daysUntilExpiration} days`
        );
      } else if (daysUntilExpiration <= 5) {
        warnings.push(
          `⚠️ Warning: Lot ${lot.batchNumber} expires in ${daysUntilExpiration} days`
        );
      }
    }

    allocations.push({
      lot,
      quantityAllocated: quantityToAllocate,
      daysUntilExpiration,
    });

    remainingQuantity -= quantityToAllocate;
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantityAllocated, 0);
  const shortfall = request.quantity - totalAllocated;

  // Generate recommendations
  if (shortfall > 0) {
    recommendations.push(`Shortage of ${shortfall} ${itemLots[0].unit} - order needed`);
  }

  if (allocations.length > 3) {
    recommendations.push(
      'Multiple lots used - consider consolidating to reduce picking time'
    );
  }

  const hasNearExpiration = allocations.some(
    (a) => a.daysUntilExpiration && a.daysUntilExpiration <= 3
  );
  if (hasNearExpiration) {
    recommendations.push('Use allocated items immediately to prevent waste');
  }

  return {
    lots: allocations,
    totalAllocated,
    shortfall,
    warnings,
    recommendations,
    method: 'fefo',
  };
}

/**
 * Allocate inventory using FIFO (First In First Out) strategy
 */
export function allocateInventoryFIFO(
  request: AllocationRequest,
  availableLots: Lot[]
): AllocationResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const allocations: Array<{
    lot: Lot;
    quantityAllocated: number;
    daysUntilExpiration?: number;
  }> = [];

  const itemLots = availableLots
    .filter((lot) => lot.itemId === request.itemId && lot.status === 'available')
    .sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());

  if (itemLots.length === 0) {
    return {
      lots: [],
      totalAllocated: 0,
      shortfall: request.quantity,
      warnings: ['No available inventory for this item'],
      recommendations: ['Place urgent order'],
      method: 'fifo',
    };
  }

  let remainingQuantity = request.quantity;

  for (const lot of itemLots) {
    if (remainingQuantity <= 0) break;

    const quantityToAllocate = Math.min(remainingQuantity, lot.quantity);

    let daysUntilExpiration: number | undefined;
    if (lot.expirationDate) {
      const msUntilExpiration = lot.expirationDate.getTime() - request.requestDate.getTime();
      daysUntilExpiration = Math.floor(msUntilExpiration / (1000 * 60 * 60 * 24));
    }

    allocations.push({
      lot,
      quantityAllocated: quantityToAllocate,
      daysUntilExpiration,
    });

    remainingQuantity -= quantityToAllocate;
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantityAllocated, 0);
  const shortfall = request.quantity - totalAllocated;

  if (shortfall > 0) {
    recommendations.push(`Shortage of ${shortfall} ${itemLots[0].unit} - order needed`);
  }

  return {
    lots: allocations,
    totalAllocated,
    shortfall,
    warnings,
    recommendations,
    method: 'fifo',
  };
}

/**
 * Monitor expiration dates and generate alerts
 */
export function monitorExpirationDates(
  lots: Lot[],
  currentDate: Date = new Date()
): ExpirationAlert[] {
  const alerts: ExpirationAlert[] = [];

  for (const lot of lots) {
    if (!lot.expirationDate || lot.status !== 'available') continue;

    const msUntilExpiration = lot.expirationDate.getTime() - currentDate.getTime();
    const daysUntilExpiration = Math.floor(msUntilExpiration / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      // Already expired
      alerts.push({
        lot,
        daysUntilExpiration: 0,
        riskLevel: 'critical',
        recommendedAction: 'DISCARD IMMEDIATELY - Item expired',
        affectedQuantity: lot.quantity,
      });
    } else if (daysUntilExpiration === 0) {
      // Expires today
      alerts.push({
        lot,
        daysUntilExpiration: 0,
        riskLevel: 'critical',
        recommendedAction: 'USE TODAY or discard at end of day',
        affectedQuantity: lot.quantity,
      });
    } else if (daysUntilExpiration <= 2) {
      // Critical: 1-2 days
      alerts.push({
        lot,
        daysUntilExpiration,
        riskLevel: 'critical',
        recommendedAction: `Priority use within ${daysUntilExpiration} days or offer at discount`,
        affectedQuantity: lot.quantity,
      });
    } else if (daysUntilExpiration <= 5) {
      // High: 3-5 days
      alerts.push({
        lot,
        daysUntilExpiration,
        riskLevel: 'high',
        recommendedAction: 'Schedule for immediate use in menu planning',
        affectedQuantity: lot.quantity,
      });
    } else if (daysUntilExpiration <= 7) {
      // Medium: 6-7 days
      alerts.push({
        lot,
        daysUntilExpiration,
        riskLevel: 'medium',
        recommendedAction: 'Monitor closely and plan usage',
        affectedQuantity: lot.quantity,
      });
    } else if (daysUntilExpiration <= 14) {
      // Low: 8-14 days
      alerts.push({
        lot,
        daysUntilExpiration,
        riskLevel: 'low',
        recommendedAction: 'Rotate to front of storage',
        affectedQuantity: lot.quantity,
      });
    }
  }

  // Sort by risk level and days until expiration
  return alerts.sort((a, b) => {
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (a.riskLevel !== b.riskLevel) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return a.daysUntilExpiration - b.daysUntilExpiration;
  });
}

/**
 * Optimize warehouse locations for picking efficiency
 */
export function optimizeLocations(
  lots: Lot[],
  locations: WarehouseLocation[]
): LocationOptimization[] {
  const optimizations: LocationOptimization[] = [];

  for (const lot of lots) {
    if (lot.status !== 'available') continue;

    const currentLocation = lot.location;
    let recommendedLocation: WarehouseLocation | null = null;
    let reason = '';
    let priority: 'urgent' | 'high' | 'medium' | 'low' = 'low';

    // Rule 1: Perishables should be in appropriate temperature zones
    if (lot.expirationDate) {
      const daysUntilExpiration = Math.floor(
        (lot.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Critical expiration - move to prep area for immediate use
      if (daysUntilExpiration <= 2 && currentLocation.zone !== 'prep-area') {
        const prepArea = locations.find(
          (l) => l.zone === 'prep-area' && l.currentLoad < l.capacity
        );
        if (prepArea) {
          recommendedLocation = prepArea;
          reason = `Critical expiration (${daysUntilExpiration} days) - move to prep area`;
          priority = 'urgent';
        }
      }

      // Near expiration - move to high-priority picking area
      else if (
        daysUntilExpiration <= 5 &&
        currentLocation.pickingPriority > 1
      ) {
        const priorityLocation = locations.find(
          (l) =>
            l.zone === currentLocation.zone &&
            l.pickingPriority === 1 &&
            l.currentLoad < l.capacity
        );
        if (priorityLocation) {
          recommendedLocation = priorityLocation;
          reason = `Near expiration (${daysUntilExpiration} days) - move to high-priority picking`;
          priority = 'high';
        }
      }
    }

    // Rule 2: High-turnover items should be in easy-access locations
    if (!recommendedLocation && currentLocation.pickingPriority > 2) {
      const easyAccessLocation = locations.find(
        (l) =>
          l.zone === currentLocation.zone &&
          l.pickingPriority <= 2 &&
          l.currentLoad < l.capacity
      );
      if (easyAccessLocation) {
        recommendedLocation = easyAccessLocation;
        reason = 'Move to easier access location for faster picking';
        priority = 'medium';
      }
    }

    // Rule 3: Receiving zone items should be moved to proper storage
    if (!recommendedLocation && currentLocation.zone === 'receiving') {
      const properZone = lot.expirationDate ? 'cold-storage' : 'dry-storage';
      const storageLocation = locations.find(
        (l) => l.zone === properZone && l.currentLoad < l.capacity
      );
      if (storageLocation) {
        recommendedLocation = storageLocation;
        reason = 'Move from receiving to proper storage zone';
        priority = 'high';
      }
    }

    if (recommendedLocation) {
      // Estimate picking time reduction
      const pickingTimeReduction =
        (currentLocation.pickingPriority - recommendedLocation.pickingPriority) * 15;

      optimizations.push({
        lot,
        currentLocation,
        recommendedLocation,
        reason,
        priority,
        estimatedPickingTimeReduction: pickingTimeReduction > 0 ? pickingTimeReduction : undefined,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return optimizations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Generate lot traceability report
 */
export function generateTraceabilityReport(lotId: string, allLots: Lot[]) {
  const lot = allLots.find((l) => l.id === lotId);

  if (!lot) {
    return {
      found: false,
      error: 'Lot not found',
    };
  }

  const daysInStorage = Math.floor(
    (Date.now() - lot.receivedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let daysUntilExpiration: number | undefined;
  let expirationStatus: 'expired' | 'critical' | 'warning' | 'good' | 'none' = 'none';

  if (lot.expirationDate) {
    const msUntilExpiration = lot.expirationDate.getTime() - Date.now();
    daysUntilExpiration = Math.floor(msUntilExpiration / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      expirationStatus = 'expired';
    } else if (daysUntilExpiration <= 2) {
      expirationStatus = 'critical';
    } else if (daysUntilExpiration <= 5) {
      expirationStatus = 'warning';
    } else {
      expirationStatus = 'good';
    }
  }

  return {
    found: true,
    lot,
    traceability: {
      supplier: lot.supplier,
      batchNumber: lot.batchNumber,
      receivedDate: lot.receivedDate,
      daysInStorage,
      currentLocation: lot.location,
      expirationDate: lot.expirationDate,
      daysUntilExpiration,
      expirationStatus,
      currentQuantity: lot.quantity,
      status: lot.status,
      qualityScore: lot.qualityScore,
    },
  };
}

/**
 * Calculate lot rotation efficiency score
 */
export function calculateRotationEfficiency(
  lots: Lot[],
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): {
  score: number; // 0-100
  metrics: {
    averageAgeAtUse: number;
    expirationWasteRate: number;
    lotUtilizationRate: number;
    averageRotationTime: number;
  };
  recommendations: string[];
} {
  const activeLots = lots.filter((l) => l.status === 'available');
  const expiredLots = lots.filter((l) => l.status === 'expired');

  // Calculate average age
  const totalAge = activeLots.reduce((sum, lot) => {
    const age = (Date.now() - lot.receivedDate.getTime()) / (1000 * 60 * 60 * 24);
    return sum + age;
  }, 0);
  const averageAgeAtUse = activeLots.length > 0 ? totalAge / activeLots.length : 0;

  // Calculate expiration waste rate
  const totalExpiredQuantity = expiredLots.reduce((sum, lot) => sum + lot.quantity, 0);
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  const expirationWasteRate = totalQuantity > 0 ? (totalExpiredQuantity / totalQuantity) * 100 : 0;

  // Calculate lot utilization
  const partiallyUsedLots = activeLots.filter(
    (lot) => lot.quantity > 0 && lot.quantity < 100
  ).length;
  const lotUtilizationRate =
    activeLots.length > 0 ? ((activeLots.length - partiallyUsedLots) / activeLots.length) * 100 : 100;

  // Average rotation time (days from receipt to full use)
  const averageRotationTime = averageAgeAtUse;

  // Calculate overall score
  const wasteScore = Math.max(0, 100 - expirationWasteRate * 10); // Penalize 10pts per 1% waste
  const ageScore = Math.max(0, 100 - averageAgeAtUse * 2); // Penalize 2pts per day
  const utilizationScore = lotUtilizationRate;

  const score = (wasteScore * 0.4 + ageScore * 0.3 + utilizationScore * 0.3);

  // Generate recommendations
  const recommendations: string[] = [];

  if (expirationWasteRate > 5) {
    recommendations.push('High waste rate - improve FEFO compliance and expiration monitoring');
  }

  if (averageAgeAtUse > 7) {
    recommendations.push('Slow rotation - check for overstocking or low demand items');
  }

  if (lotUtilizationRate < 80) {
    recommendations.push('Many partial lots - consolidate inventory to reduce picking complexity');
  }

  if (partiallyUsedLots > activeLots.length * 0.3) {
    recommendations.push('Consider smaller order quantities to reduce partial lots');
  }

  if (recommendations.length === 0) {
    recommendations.push('Excellent lot rotation efficiency - maintain current practices');
  }

  return {
    score: Math.round(score),
    metrics: {
      averageAgeAtUse: Math.round(averageAgeAtUse * 10) / 10,
      expirationWasteRate: Math.round(expirationWasteRate * 10) / 10,
      lotUtilizationRate: Math.round(lotUtilizationRate * 10) / 10,
      averageRotationTime: Math.round(averageRotationTime * 10) / 10,
    },
    recommendations,
  };
}

export const LOT_MANAGEMENT_FEATURES = {
  'fefo-allocation': {
    name: 'FEFO (First Expired First Out)',
    description: 'Automatically allocates inventory based on expiration dates',
    benefitCategory: 'waste-reduction',
    implementation: 'zero-cost',
  },
  'fifo-allocation': {
    name: 'FIFO (First In First Out)',
    description: 'Allocates inventory based on receipt date',
    benefitCategory: 'rotation-efficiency',
    implementation: 'zero-cost',
  },
  'expiration-monitoring': {
    name: 'Expiration Date Monitoring',
    description: 'Real-time alerts for items approaching expiration',
    benefitCategory: 'waste-reduction',
    implementation: 'zero-cost',
  },
  'location-optimization': {
    name: 'Warehouse Location Optimization',
    description: 'Recommends optimal storage locations for faster picking',
    benefitCategory: 'efficiency',
    implementation: 'zero-cost',
  },
  'lot-traceability': {
    name: 'Full Lot Traceability',
    description: 'Track items from supplier to consumption',
    benefitCategory: 'compliance',
    implementation: 'zero-cost',
  },
  'rotation-analytics': {
    name: 'Rotation Efficiency Analytics',
    description: 'Score and optimize inventory rotation practices',
    benefitCategory: 'optimization',
    implementation: 'zero-cost',
  },
};
