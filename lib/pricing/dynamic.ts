/**
 * Dynamic Pricing - Simplified Interface
 * Wrapper around traditional pricing for consistency with AI modules
 */

import { calculateDynamicPrice as calculateTraditionalPrice } from './traditional';

export interface DynamicPricingInput {
  baseRate: number;
  occupancyRate: number; // 0-1
  daysUntilArrival: number;
  seasonalMultiplier?: number;
  dayOfWeek?: number; // 0-6
}

export interface DynamicPricingOutput {
  suggestedPrice: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
}

/**
 * Calculate dynamic price with simplified interface
 */
export function calculateDynamicPrice(input: DynamicPricingInput): DynamicPricingOutput {
  const date = new Date();
  date.setDate(date.getDate() + input.daysUntilArrival);

  // Use traditional pricing algorithm
  const result = calculateTraditionalPrice({
    basePrice: input.baseRate,
    date,
    occupancyRate: input.occupancyRate,
    daysUntilStay: input.daysUntilArrival,
    roomType: 'Standard',
    seasonalFactor: input.seasonalMultiplier,
  });

  // Convert adjustments to factors format
  const factors = result.adjustments.map((adj) => ({
    name: adj.factor,
    impact: adj.percentage,
    description: `${adj.percentage > 0 ? '+' : ''}${adj.percentage.toFixed(1)}% (${adj.amount > 0 ? '+' : ''}$${adj.amount.toFixed(0)})`,
  }));

  // Calculate confidence based on number of factors
  const confidence = Math.min(0.95, 0.7 + factors.length * 0.05);

  return {
    suggestedPrice: result.finalPrice,
    confidence,
    factors,
  };
}
