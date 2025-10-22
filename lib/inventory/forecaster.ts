/**
 * F&B Inventory Management
 */

export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  avgDailyConsumption: number;
  perishable: boolean;
}

export interface InventoryForecast {
  item: InventoryItem;
  recommendedOrder: number;
  daysUntilStockout: number;
  method: 'moving-average' | 'timeseries' | 'ml';
  processingTime?: number;
}

export function forecastInventoryMovingAverage(
  item: InventoryItem,
  days: number = 7
): InventoryForecast {
  const startTime = Date.now();

  const forecast = item.avgDailyConsumption * days;
  const daysUntilStockout = Math.floor(item.currentStock / item.avgDailyConsumption);

  let recommendedOrder = 0;
  if (daysUntilStockout < 3) {
    recommendedOrder = Math.ceil(forecast - item.currentStock);
  }

  return {
    item,
    recommendedOrder,
    daysUntilStockout,
    method: 'moving-average',
    processingTime: Date.now() - startTime,
  };
}

export const INVENTORY_MODELS = {
  'moving-average': {
    name: 'Moving Average',
    cost: 0,
    avgLatency: 10,
    waste: 12,
    stockouts: 8,
    description: 'Historical patterns',
  },
  timeseries: {
    name: 'Time Series',
    cost: 0,
    avgLatency: 60,
    waste: 7,
    stockouts: 4,
    description: 'ARIMA/Prophet',
  },
  ml: {
    name: 'Machine Learning',
    cost: 0,
    avgLatency: 100,
    waste: 4,
    stockouts: 2,
    description: 'Multi-factor models',
  },
};
