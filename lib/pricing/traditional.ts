/**
 * Traditional Dynamic Pricing
 * Cost-effective algorithmic approach
 */

export interface PricingParams {
  basePrice: number;
  date: Date;
  occupancyRate: number; // 0-1
  daysUntilStay: number;
  roomType: string;
  seasonalFactor?: number;
}

export type PricingInput = PricingParams;

export interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  adjustments: Array<{
    factor: string;
    amount: number;
    percentage: number;
  }>;
  method: 'traditional' | 'ai' | 'linear-regression' | 'neural-network';
}

const SEASONAL_PATTERNS = {
  high: [5, 6, 7, 11, 12], // June, July, August, December, January (month indices)
  shoulder: [3, 4, 8, 9], // April, May, September, October
  low: [0, 1, 2, 10], // February, March, November, January
};

const DAY_OF_WEEK_MULTIPLIERS = {
  0: 0.9, // Sunday
  1: 0.85, // Monday
  2: 0.85, // Tuesday
  3: 0.9, // Wednesday
  4: 1.0, // Thursday
  5: 1.15, // Friday
  6: 1.1, // Saturday
};

export function calculateDynamicPrice(params: PricingParams): PricingResult {
  const adjustments: PricingResult['adjustments'] = [];
  let currentPrice = params.basePrice;

  // 1. Seasonal adjustment
  const month = params.date.getMonth();
  let seasonMultiplier = 1.0;

  if (SEASONAL_PATTERNS.high.includes(month)) {
    seasonMultiplier = 1.3;
    adjustments.push({
      factor: 'High Season',
      amount: params.basePrice * 0.3,
      percentage: 30,
    });
  } else if (SEASONAL_PATTERNS.low.includes(month)) {
    seasonMultiplier = 0.8;
    adjustments.push({
      factor: 'Low Season',
      amount: -params.basePrice * 0.2,
      percentage: -20,
    });
  }
  currentPrice *= seasonMultiplier;

  // 2. Day of week adjustment
  const dayOfWeek = params.date.getDay();
  const dowMultiplier = DAY_OF_WEEK_MULTIPLIERS[dayOfWeek as keyof typeof DAY_OF_WEEK_MULTIPLIERS];
  const dowAdjustment = currentPrice * (dowMultiplier - 1);
  if (Math.abs(dowAdjustment) > 0.01) {
    adjustments.push({
      factor: 'Day of Week',
      amount: dowAdjustment,
      percentage: (dowMultiplier - 1) * 100,
    });
  }
  currentPrice *= dowMultiplier;

  // 3. Occupancy-based demand pricing
  if (params.occupancyRate > 0.9) {
    const demandAdjustment = currentPrice * 0.25;
    adjustments.push({
      factor: 'High Demand (>90% occupancy)',
      amount: demandAdjustment,
      percentage: 25,
    });
    currentPrice += demandAdjustment;
  } else if (params.occupancyRate > 0.75) {
    const demandAdjustment = currentPrice * 0.15;
    adjustments.push({
      factor: 'Medium Demand (>75% occupancy)',
      amount: demandAdjustment,
      percentage: 15,
    });
    currentPrice += demandAdjustment;
  } else if (params.occupancyRate < 0.4) {
    const demandAdjustment = -currentPrice * 0.15;
    adjustments.push({
      factor: 'Low Demand (<40% occupancy)',
      amount: demandAdjustment,
      percentage: -15,
    });
    currentPrice += demandAdjustment;
  }

  // 4. Early booking discount
  if (params.daysUntilStay > 60) {
    const earlyBirdDiscount = -currentPrice * 0.1;
    adjustments.push({
      factor: 'Early Booking (>60 days)',
      amount: earlyBirdDiscount,
      percentage: -10,
    });
    currentPrice += earlyBirdDiscount;
  } else if (params.daysUntilStay < 3 && params.occupancyRate < 0.7) {
    // Last-minute discount if not fully booked
    const lastMinuteDiscount = -currentPrice * 0.2;
    adjustments.push({
      factor: 'Last Minute Deal',
      amount: lastMinuteDiscount,
      percentage: -20,
    });
    currentPrice += lastMinuteDiscount;
  }

  // 5. Room type premium
  const roomTypePremiums: Record<string, number> = {
    suite: 0.5,
    deluxe: 0.3,
    double: 0.1,
    single: 0,
  };
  const typePremium = roomTypePremiums[params.roomType.toLowerCase()] || 0;
  if (typePremium > 0) {
    const premiumAmount = params.basePrice * typePremium;
    adjustments.push({
      factor: `${params.roomType} Premium`,
      amount: premiumAmount,
      percentage: typePremium * 100,
    });
    currentPrice += premiumAmount;
  }

  return {
    originalPrice: params.basePrice,
    finalPrice: Math.round(currentPrice * 100) / 100,
    adjustments,
    method: 'traditional',
  };
}

export function calculateMovingAverage(historicalPrices: number[], windowSize: number = 7): number {
  if (historicalPrices.length === 0) return 0;

  const relevantPrices = historicalPrices.slice(-windowSize);
  const sum = relevantPrices.reduce((acc, price) => acc + price, 0);
  return sum / relevantPrices.length;
}

export function predictOccupancy(
  historicalOccupancy: Array<{ date: Date; rate: number }>,
  targetDate: Date
): number {
  // Simple pattern matching based on historical data
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDay();

  const similarDays = historicalOccupancy.filter((record) => {
    const recordMonth = record.date.getMonth();
    const recordDay = record.date.getDay();
    return recordMonth === targetMonth && recordDay === targetDay;
  });

  if (similarDays.length === 0) {
    // Fallback to monthly average
    const monthlyData = historicalOccupancy.filter(
      (record) => record.date.getMonth() === targetMonth
    );
    if (monthlyData.length === 0) return 0.5; // Default 50%

    return monthlyData.reduce((sum, r) => sum + r.rate, 0) / monthlyData.length;
  }

  return similarDays.reduce((sum, r) => sum + r.rate, 0) / similarDays.length;
}
