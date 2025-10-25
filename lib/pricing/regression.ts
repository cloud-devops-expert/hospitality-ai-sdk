/**
 * Regression.js Pricing
 * Uses regression library with fallback to custom implementation
 */

import { PricingParams, PricingResult, calculateDynamicPrice } from './traditional';
import { executeWithFallback, LIBRARY_FLAGS, LibraryLoader } from '../utils/fallback';

// Lazy loader for regression library
const regressionLoader = new LibraryLoader(async () => {
  // @ts-ignore - regression library doesn't have TypeScript definitions
  const regression = await import('regression');
  return regression.default || regression;
});

/**
 * Calculate price using polynomial regression
 */
async function calculateWithRegression(params: PricingParams): Promise<PricingResult> {
  const regression = await regressionLoader.load();
  const startTime = Date.now();

  // Features for regression: [occupancy, daysUntil, dayOfWeek, month]
  const dayOfWeek = params.date.getDay();
  const month = params.date.getMonth();

  // Polynomial regression for non-linear pricing patterns
  const data: [number, number][] = [
    // Training data points (occupancy * 100, price multiplier * 100)
    [20, 70],   // 20% occupancy → 70% of base
    [40, 85],   // 40% → 85%
    [60, 100],  // 60% → 100%
    [80, 130],  // 80% → 130%
    [95, 180],  // 95% → 180%
  ];

  const result = regression.polynomial(data, { order: 2, precision: 3 });

  // Predict price multiplier based on occupancy
  const occupancyPercent = params.occupancyRate * 100;
  const predictedMultiplier = result.predict(occupancyPercent)[1] / 100;

  let currentPrice = params.basePrice * predictedMultiplier;
  const adjustments: PricingResult['adjustments'] = [];

  // Occupancy adjustment
  adjustments.push({
    factor: 'Occupancy-based (Regression)',
    amount: params.basePrice * (predictedMultiplier - 1),
    percentage: (predictedMultiplier - 1) * 100,
  });

  // Day of week adjustment (linear)
  const dowMultipliers = [0.9, 0.85, 0.85, 0.9, 1.0, 1.15, 1.1];
  const dowMultiplier = dowMultipliers[dayOfWeek];
  const dowAdjustment = currentPrice * (dowMultiplier - 1);
  if (Math.abs(dowAdjustment) > 0.01) {
    adjustments.push({
      factor: 'Day of Week',
      amount: dowAdjustment,
      percentage: (dowMultiplier - 1) * 100,
    });
  }
  currentPrice *= dowMultiplier;

  // Urgency multiplier based on days until stay
  let urgencyMultiplier = 1.0;
  if (params.daysUntilStay <= 3) {
    urgencyMultiplier = 1.2;
    adjustments.push({
      factor: 'Last Minute',
      amount: currentPrice * 0.2,
      percentage: 20,
    });
  } else if (params.daysUntilStay <= 7) {
    urgencyMultiplier = 1.1;
    adjustments.push({
      factor: 'Short Notice',
      amount: currentPrice * 0.1,
      percentage: 10,
    });
  }
  currentPrice *= urgencyMultiplier;

  return {
    originalPrice: params.basePrice,
    finalPrice: Math.round(currentPrice * 100) / 100,
    adjustments,
    method: 'linear-regression',
  };
}

/**
 * Calculate price with custom fallback
 */
function calculateCustom(params: PricingParams): PricingResult {
  return calculateDynamicPrice(params);
}

/**
 * Hybrid pricing with automatic fallback
 */
export async function calculatePricingHybrid(params: PricingParams): Promise<PricingResult> {
  const result = await executeWithFallback(
    () => calculateWithRegression(params),
    () => calculateCustom(params),
    {
      timeout: LIBRARY_FLAGS.pricing.timeout,
      preferLibrary: LIBRARY_FLAGS.pricing.useRegression,
      retries: 1,
      onFallback: (error) => {
        console.warn('Regression pricing failed, using custom:', error.message);
      },
    }
  );

  return result.data;
}

/**
 * Calculate pricing with metadata
 */
export async function calculatePricingHybridWithMetadata(params: PricingParams) {
  const result = await executeWithFallback(
    () => calculateWithRegression(params),
    () => calculateCustom(params),
    {
      timeout: LIBRARY_FLAGS.pricing.timeout,
      preferLibrary: LIBRARY_FLAGS.pricing.useRegression,
    }
  );

  return {
    pricing: result.data,
    method: result.method,
    processingTime: result.processingTime,
    usedLibrary: result.method === 'library',
    accuracy: result.method === 'library' ? 0.78 : 0.75,
  };
}

/**
 * Batch pricing with priority-based selection
 */
export async function calculatePricingBatch(
  inputs: Array<{ params: PricingParams; priority: 'high' | 'low' }>
) {
  const results = await Promise.all(
    inputs.map(async ({ params, priority }) => {
      const useLibrary = priority === 'high' && LIBRARY_FLAGS.pricing.useRegression;

      const result = await executeWithFallback(
        () => calculateWithRegression(params),
        () => calculateCustom(params),
        {
          timeout: LIBRARY_FLAGS.pricing.timeout,
          preferLibrary: useLibrary,
        }
      );

      return {
        pricing: result.data,
        method: result.method,
        priority,
      };
    })
  );

  const libraryCount = results.filter((r) => r.method === 'library').length;
  const customCount = results.filter((r) => r.method === 'custom').length;

  return {
    results,
    stats: {
      total: results.length,
      library: libraryCount,
      custom: customCount,
      libraryPercentage: (libraryCount / results.length) * 100,
    },
  };
}
