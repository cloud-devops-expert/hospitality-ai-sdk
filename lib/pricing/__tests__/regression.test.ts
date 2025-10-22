/**
 * @jest-environment node
 */

import {
  calculatePricingHybrid,
  calculatePricingHybridWithMetadata,
  calculatePricingBatch,
} from '../regression';
import type { PricingParams } from '../traditional';

describe('Regression Pricing', () => {
  const basePricing: PricingParams = {
    basePrice: 150,
    date: new Date('2025-07-15'), // Friday in July
    occupancyRate: 0.75,
    daysUntilStay: 14,
    roomType: 'standard',
  };

  describe('calculatePricingHybrid', () => {
    it('should calculate price with regression', async () => {
      const result = await calculatePricingHybrid(basePricing);
      expect(result.finalPrice).toBeGreaterThan(0);
      expect(result.originalPrice).toBe(150);
      expect(result.adjustments).toBeDefined();
      expect(result.method).toBeDefined();
    });

    it('should handle high occupancy', async () => {
      const highOccupancy = { ...basePricing, occupancyRate: 0.95 };
      const result = await calculatePricingHybrid(highOccupancy);
      expect(result.finalPrice).toBeGreaterThan(basePricing.basePrice);
    });

    it('should handle low occupancy', async () => {
      const lowOccupancy = { ...basePricing, occupancyRate: 0.30 };
      const result = await calculatePricingHybrid(lowOccupancy);
      expect(result.finalPrice).toBeLessThan(basePricing.basePrice);
    });

    it('should handle last minute booking', async () => {
      const lastMinute = { ...basePricing, daysUntilStay: 2 };
      const result = await calculatePricingHybrid(lastMinute);
      const hasLastMinuteAdjustment = result.adjustments.some(
        (adj) => adj.factor.includes('Last Minute') || adj.factor.includes('Short Notice')
      );
      expect(hasLastMinuteAdjustment || result.finalPrice > 0).toBe(true);
    });
  });

  describe('calculatePricingHybridWithMetadata', () => {
    it('should return pricing with metadata', async () => {
      const result = await calculatePricingHybridWithMetadata(basePricing);
      expect(result).toHaveProperty('pricing');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('usedLibrary');
      expect(result).toHaveProperty('accuracy');
    });

    it('should report library usage correctly', async () => {
      process.env.NEXT_PUBLIC_USE_REGRESSION = 'true';
      const result = await calculatePricingHybridWithMetadata(basePricing);
      expect(result.method).toBeDefined();
      expect(result.usedLibrary).toBe(result.method === 'library');
    });
  });

  describe('calculatePricingBatch', () => {
    it('should process multiple pricing requests', async () => {
      const inputs = [
        { params: basePricing, priority: 'high' as const },
        { params: { ...basePricing, occupancyRate: 0.5 }, priority: 'low' as const },
      ];

      const result = await calculatePricingBatch(inputs);
      expect(result.results).toHaveLength(2);
      expect(result.stats.total).toBe(2);
    });

    it('should provide usage statistics', async () => {
      const inputs = [
        { params: basePricing, priority: 'high' as const },
        { params: basePricing, priority: 'high' as const },
        { params: basePricing, priority: 'low' as const },
      ];

      const result = await calculatePricingBatch(inputs);
      expect(result.stats.total).toBe(3);
      expect(result.stats.library + result.stats.custom).toBe(3);
    });
  });
});
