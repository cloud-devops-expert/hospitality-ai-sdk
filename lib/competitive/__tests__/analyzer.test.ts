/**
 * Tests for Competitive Intelligence Module
 */

import {
  analyzeMarketPosition,
  analyzePositioning,
  comparePricing,
  analyzeAmenityGaps,
  estimateMarketShare,
  generateStrategicRecommendations,
  type CompetitorData,
} from '../analyzer';

describe('Competitive Intelligence Module', () => {
  // Sample data
  const sampleCompetitor1: CompetitorData = {
    competitorId: 'comp-1',
    name: 'Luxury Hotel A',
    category: 'luxury',
    location: 'Downtown',
    distance: 2,
    roomCount: 150,
    amenities: ['pool', 'gym', 'spa', 'restaurant', 'wifi', 'parking'],
    pricing: {
      baseRate: 250,
      averageRate: 350,
      peakRate: 500,
      lastUpdated: new Date(),
    },
    reviews: {
      averageRating: 4.5,
      totalReviews: 500,
      recentRating: 4.6,
      sentiment: 'positive',
    },
    occupancy: 80,
  };

  const sampleCompetitor2: CompetitorData = {
    competitorId: 'comp-2',
    name: 'Midscale Hotel B',
    category: 'midscale',
    location: 'Suburbs',
    distance: 5,
    roomCount: 100,
    amenities: ['gym', 'wifi', 'parking', 'business-center'],
    pricing: {
      baseRate: 100,
      averageRate: 150,
      peakRate: 200,
      lastUpdated: new Date(),
    },
    reviews: {
      averageRating: 3.8,
      totalReviews: 200,
      recentRating: 3.9,
      sentiment: 'neutral',
    },
    occupancy: 65,
  };

  const sampleCompetitor3: CompetitorData = {
    competitorId: 'comp-3',
    name: 'Budget Hotel C',
    category: 'budget',
    location: 'Airport',
    distance: 10,
    roomCount: 80,
    amenities: ['wifi', 'parking'],
    pricing: {
      baseRate: 60,
      averageRate: 80,
      peakRate: 100,
      lastUpdated: new Date(),
    },
    reviews: {
      averageRating: 3.2,
      totalReviews: 150,
      recentRating: 3.3,
      sentiment: 'neutral',
    },
    occupancy: 70,
  };

  const yourHotel = {
    competitorId: 'your-hotel',
    name: 'Your Hotel',
    category: 'upscale' as const,
    location: 'Downtown',
    distance: 0,
    roomCount: 120,
    amenities: ['pool', 'gym', 'restaurant', 'wifi', 'parking', 'rooftop-bar'],
    pricing: {
      baseRate: 150,
      averageRate: 200,
      peakRate: 300,
      lastUpdated: new Date(),
    },
    reviews: {
      averageRating: 4.2,
      totalReviews: 300,
      recentRating: 4.3,
      sentiment: 'positive' as const,
    },
    occupancy: 75,
  };

  describe('analyzeMarketPosition', () => {
    it('should analyze basic market metrics', () => {
      const analysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(analysis.marketSize).toBe(4);
      expect(analysis.totalRooms).toBe(450);
      expect(analysis.averageOccupancy).toBeGreaterThan(0);
      expect(analysis.averageRate).toBeGreaterThan(0);
    });

    it('should throw error with no competitors', () => {
      expect(() => analyzeMarketPosition(yourHotel, [])).toThrow(
        'At least one competitor required for market analysis'
      );
    });

    it('should segment market by category', () => {
      const analysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(analysis.marketSegments.size).toBeGreaterThan(0);
      expect(analysis.marketSegments.has('luxury')).toBe(true);
      expect(analysis.marketSegments.has('midscale')).toBe(true);
      expect(analysis.marketSegments.has('budget')).toBe(true);
    });

    it('should calculate segment market shares', () => {
      const analysis = analyzeMarketPosition(yourHotel, [sampleCompetitor1]);

      const luxurySegment = analysis.marketSegments.get('luxury');
      expect(luxurySegment).toBeDefined();
      expect(luxurySegment!.marketShare).toBeGreaterThan(0);
      expect(luxurySegment!.marketShare).toBeLessThanOrEqual(100);
    });

    it('should identify market trends', () => {
      const analysis = analyzeMarketPosition(yourHotel, [sampleCompetitor1]);

      expect(analysis.marketTrends.occupancyTrend).toMatch(/increasing|stable|decreasing/);
      expect(analysis.marketTrends.pricingTrend).toMatch(/increasing|stable|decreasing/);
      expect(analysis.marketTrends.demandLevel).toMatch(/high|medium|low/);
    });

    it('should set high demand for high occupancy markets', () => {
      const highOccupancyCompetitor = {
        ...sampleCompetitor1,
        occupancy: 85,
      };

      const analysis = analyzeMarketPosition(
        { ...yourHotel, occupancy: 82 },
        [highOccupancyCompetitor]
      );

      expect(analysis.marketTrends.demandLevel).toBe('high');
    });

    it('should set low demand for low occupancy markets', () => {
      const lowOccupancyCompetitor = {
        ...sampleCompetitor1,
        occupancy: 50,
      };

      const analysis = analyzeMarketPosition(
        { ...yourHotel, occupancy: 55 },
        [lowOccupancyCompetitor]
      );

      expect(analysis.marketTrends.demandLevel).toBe('low');
    });
  });

  describe('analyzePositioning', () => {
    it('should calculate price and quality percentiles', () => {
      const positioning = analyzePositioning(yourHotel, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(positioning.currentPosition.pricePercentile).toBeGreaterThanOrEqual(0);
      expect(positioning.currentPosition.pricePercentile).toBeLessThanOrEqual(100);
      expect(positioning.currentPosition.qualityPercentile).toBeGreaterThanOrEqual(0);
      expect(positioning.currentPosition.qualityPercentile).toBeLessThanOrEqual(100);
    });

    it('should calculate value score', () => {
      const positioning = analyzePositioning(yourHotel, [sampleCompetitor1]);

      expect(positioning.currentPosition.valueScore).toBeGreaterThanOrEqual(0);
      expect(positioning.currentPosition.valueScore).toBeLessThanOrEqual(100);
    });

    it('should identify superior quality as advantage', () => {
      const highQualityHotel = {
        ...yourHotel,
        reviews: {
          averageRating: 4.8,
          totalReviews: 500,
          recentRating: 4.9,
          sentiment: 'positive' as const,
        },
      };

      const positioning = analyzePositioning(highQualityHotel, [
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      const hasQualityAdvantage = positioning.competitiveAdvantages.some(adv =>
        adv.includes('quality')
      );
      expect(hasQualityAdvantage).toBe(true);
    });

    it('should identify competitive pricing as advantage', () => {
      const lowPriceHotel = {
        ...yourHotel,
        pricing: {
          baseRate: 70,
          averageRate: 90,
          peakRate: 120,
          lastUpdated: new Date(),
        },
      };

      const positioning = analyzePositioning(lowPriceHotel, [sampleCompetitor1]);

      const hasPricingAdvantage = positioning.competitiveAdvantages.some(adv =>
        adv.includes('pricing')
      );
      expect(hasPricingAdvantage).toBe(true);
    });

    it('should identify premium pricing disadvantage', () => {
      const highPriceHotel = {
        ...yourHotel,
        pricing: {
          baseRate: 300,
          averageRate: 400,
          peakRate: 600,
          lastUpdated: new Date(),
        },
      };

      const positioning = analyzePositioning(highPriceHotel, [
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      const hasPricingDisadvantage = positioning.competitiveDisadvantages.some(dis =>
        dis.includes('pricing')
      );
      expect(hasPricingDisadvantage).toBe(true);
    });

    it('should provide recommendations', () => {
      const positioning = analyzePositioning(yourHotel, [sampleCompetitor1]);

      expect(Array.isArray(positioning.recommendations)).toBe(true);
    });
  });

  describe('comparePricing', () => {
    it('should calculate market average', () => {
      const comparison = comparePricing(200, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(comparison.marketAverage).toBeGreaterThan(0);
    });

    it('should calculate price variance', () => {
      const comparison = comparePricing(200, [sampleCompetitor1]);

      expect(typeof comparison.variance).toBe('number');
    });

    it('should identify premium positioning', () => {
      const comparison = comparePricing(500, [
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(comparison.pricePosition).toBe('premium');
    });

    it('should identify discount positioning', () => {
      const comparison = comparePricing(70, [
        sampleCompetitor1,
        sampleCompetitor2,
      ]);

      expect(comparison.pricePosition).toBe('discount');
    });

    it('should identify value positioning', () => {
      const comparison = comparePricing(300, [sampleCompetitor1]);

      expect(comparison.pricePosition).toMatch(/competitive|value/);
    });

    it('should sort competitors by price', () => {
      const comparison = comparePricing(200, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      const prices = comparison.competitorPrices.map(c => c.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('should calculate price differences', () => {
      const comparison = comparePricing(200, [sampleCompetitor1]);

      expect(comparison.competitorPrices[0].difference).toBeDefined();
      expect(typeof comparison.competitorPrices[0].difference).toBe('number');
    });

    it('should provide pricing recommendation', () => {
      const comparison = comparePricing(200, [sampleCompetitor1]);

      expect(typeof comparison.recommendation).toBe('string');
      expect(comparison.recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeAmenityGaps', () => {
    it('should identify missing amenities', () => {
      const gaps = analyzeAmenityGaps(
        ['wifi', 'parking'],
        [sampleCompetitor1, sampleCompetitor2]
      );

      expect(gaps.missingAmenities.length).toBeGreaterThan(0);
    });

    it('should calculate amenity prevalence', () => {
      const gaps = analyzeAmenityGaps(['wifi'], [sampleCompetitor1]);

      gaps.missingAmenities.forEach(amenity => {
        expect(amenity.prevalence).toBeGreaterThanOrEqual(0);
        expect(amenity.prevalence).toBeLessThanOrEqual(100);
      });
    });

    it('should prioritize high-prevalence amenities', () => {
      const gaps = analyzeAmenityGaps(['wifi'], [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      const parkingAmenity = gaps.missingAmenities.find(a => a.amenity === 'parking');
      if (parkingAmenity) {
        expect(parkingAmenity.priority).toBe('high'); // parking is in all 3 = 100%
      }
    });

    it('should assign medium priority for moderate prevalence', () => {
      const competitor = {
        ...sampleCompetitor1,
        amenities: ['rare-amenity'],
      };

      const gaps = analyzeAmenityGaps(['wifi'], [competitor, sampleCompetitor2]);

      const rareAmenity = gaps.missingAmenities.find(a => a.amenity === 'rare-amenity');
      if (rareAmenity && rareAmenity.prevalence > 40 && rareAmenity.prevalence <= 70) {
        expect(rareAmenity.priority).toBe('medium');
      }
    });

    it('should identify unique amenities', () => {
      const gaps = analyzeAmenityGaps(['unique-spa', 'wifi'], [sampleCompetitor1]);

      expect(gaps.uniqueAmenities).toContain('unique-spa');
    });

    it('should calculate overall amenity score', () => {
      const gaps = analyzeAmenityGaps(['wifi', 'parking', 'pool'], [
        sampleCompetitor1,
      ]);

      expect(gaps.overallScore).toBeGreaterThanOrEqual(0);
      expect(gaps.overallScore).toBeLessThanOrEqual(100);
    });

    it('should sort missing amenities by prevalence', () => {
      const gaps = analyzeAmenityGaps(['wifi'], [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      const prevalences = gaps.missingAmenities.map(a => a.prevalence);
      const sortedPrevalences = [...prevalences].sort((a, b) => b - a);
      expect(prevalences).toEqual(sortedPrevalences);
    });

    it('should estimate costs for missing amenities', () => {
      const gaps = analyzeAmenityGaps(['wifi'], [sampleCompetitor1]);

      gaps.missingAmenities.forEach(amenity => {
        expect(amenity.estimatedCost).toBeGreaterThan(0);
      });
    });
  });

  describe('estimateMarketShare', () => {
    it('should calculate market share percentage', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);

      const shareEstimate = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      expect(shareEstimate.estimatedShare).toBeGreaterThanOrEqual(0);
      expect(shareEstimate.estimatedShare).toBeLessThanOrEqual(100);
    });

    it('should calculate competitor shares', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);

      const shareEstimate = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      expect(shareEstimate.competitorShares.size).toBeGreaterThan(0);
      expect(shareEstimate.competitorShares.get('comp-1')).toBeDefined();
    });

    it('should identify gaining trend for above-average occupancy', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);

      const shareEstimate = estimateMarketShare(
        { ...yourHotel, occupancy: 85 },
        [{ ...sampleCompetitor1, occupancy: 70 }],
        { ...marketAnalysis, averageOccupancy: 70 }
      );

      expect(shareEstimate.trend).toBe('gaining');
    });

    it('should identify losing trend for below-average occupancy', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);

      const shareEstimate = estimateMarketShare(
        { ...yourHotel, occupancy: 60 },
        [{ ...sampleCompetitor1, occupancy: 80 }],
        { ...marketAnalysis, averageOccupancy: 80 }
      );

      expect(shareEstimate.trend).toBe('losing');
    });

    it('should identify stable trend', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);

      const shareEstimate = estimateMarketShare(
        { ...yourHotel, occupancy: 75 },
        [{ ...sampleCompetitor1, occupancy: 75 }],
        { ...marketAnalysis, averageOccupancy: 75 }
      );

      expect(shareEstimate.trend).toBe('stable');
    });

    it('should project future market share', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);

      const shareEstimate = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      expect(shareEstimate.projectedShare).toBeGreaterThanOrEqual(0);
      expect(shareEstimate.projectedShare).toBeLessThanOrEqual(100);
    });

    it('should increase projection for gaining trend', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);

      const shareEstimate = estimateMarketShare(
        { ...yourHotel, occupancy: 85 },
        [{ ...sampleCompetitor1, occupancy: 70 }],
        { ...marketAnalysis, averageOccupancy: 70 }
      );

      expect(shareEstimate.projectedShare).toBeGreaterThan(
        shareEstimate.estimatedShare
      );
    });
  });

  describe('generateStrategicRecommendations', () => {
    it('should generate comprehensive recommendations', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);
      const positioning = analyzePositioning(yourHotel, [sampleCompetitor1]);
      const priceComparison = comparePricing(200, [sampleCompetitor1]);
      const amenityGaps = analyzeAmenityGaps(yourHotel.amenities, [
        sampleCompetitor1,
      ]);
      const marketShare = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      const recommendations = generateStrategicRecommendations(
        positioning,
        priceComparison,
        amenityGaps,
        marketShare
      );

      expect(recommendations.pricingStrategy).toBeDefined();
      expect(recommendations.positioningStrategy).toBeDefined();
      expect(Array.isArray(recommendations.amenityInvestments)).toBe(true);
      expect(Array.isArray(recommendations.marketingFocus)).toBe(true);
      expect(Array.isArray(recommendations.competitiveActions)).toBe(true);
    });

    it('should recommend high-priority amenity investments', () => {
      const positioning = analyzePositioning(yourHotel, [sampleCompetitor1]);
      const priceComparison = comparePricing(200, [sampleCompetitor1]);
      const amenityGaps = analyzeAmenityGaps(['wifi'], [sampleCompetitor1]);
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);
      const marketShare = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      const recommendations = generateStrategicRecommendations(
        positioning,
        priceComparison,
        amenityGaps,
        marketShare
      );

      expect(recommendations.amenityInvestments.length).toBeGreaterThan(0);
    });

    it('should prioritize actions correctly', () => {
      const positioning = analyzePositioning(yourHotel, [sampleCompetitor1]);
      const priceComparison = comparePricing(200, [sampleCompetitor1]);
      const amenityGaps = analyzeAmenityGaps(yourHotel.amenities, [
        sampleCompetitor1,
      ]);
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);
      const marketShare = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      const recommendations = generateStrategicRecommendations(
        positioning,
        priceComparison,
        amenityGaps,
        marketShare
      );

      if (recommendations.competitiveActions.length > 1) {
        const priorities = recommendations.competitiveActions.map(a => a.priority);
        const sortedPriorities = [...priorities].sort((a, b) => b - a);
        expect(priorities).toEqual(sortedPriorities);
      }
    });

    it('should recommend quality improvement for low quality percentile', () => {
      const lowQualityHotel = {
        ...yourHotel,
        reviews: {
          averageRating: 2.5,
          totalReviews: 100,
          recentRating: 2.6,
          sentiment: 'negative' as const,
        },
      };

      const positioning = analyzePositioning(lowQualityHotel, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);
      const priceComparison = comparePricing(200, [sampleCompetitor1]);
      const amenityGaps = analyzeAmenityGaps(yourHotel.amenities, [
        sampleCompetitor1,
      ]);
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);
      const marketShare = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      const recommendations = generateStrategicRecommendations(
        positioning,
        priceComparison,
        amenityGaps,
        marketShare
      );

      const hasQualityAction = recommendations.competitiveActions.some(action =>
        action.action.toLowerCase().includes('quality')
      );
      expect(hasQualityAction).toBe(true);
    });

    it('should highlight unique amenities in marketing', () => {
      const positioning = analyzePositioning(yourHotel, [sampleCompetitor1]);
      const priceComparison = comparePricing(200, [sampleCompetitor1]);
      const amenityGaps = analyzeAmenityGaps(
        ['wifi', 'unique-rooftop-bar', 'unique-spa'],
        [sampleCompetitor1]
      );
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);
      const marketShare = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );

      const recommendations = generateStrategicRecommendations(
        positioning,
        priceComparison,
        amenityGaps,
        marketShare
      );

      if (amenityGaps.uniqueAmenities.length > 0) {
        const hasUniqueAmenityFocus = recommendations.marketingFocus.some(focus =>
          focus.includes('unique')
        );
        expect(hasUniqueAmenityFocus).toBe(true);
      }
    });
  });

  // Integration tests
  describe('Integration: Full competitive analysis', () => {
    it('should perform complete competitive analysis workflow', () => {
      // Step 1: Market analysis
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(marketAnalysis.marketSize).toBe(4);

      // Step 2: Positioning
      const positioning = analyzePositioning(yourHotel, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(positioning.currentPosition.pricePercentile).toBeDefined();

      // Step 3: Price comparison
      const priceComparison = comparePricing(200, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(priceComparison.pricePosition).toBeDefined();

      // Step 4: Amenity gaps
      const amenityGaps = analyzeAmenityGaps(yourHotel.amenities, [
        sampleCompetitor1,
        sampleCompetitor2,
        sampleCompetitor3,
      ]);

      expect(amenityGaps.overallScore).toBeGreaterThan(0);

      // Step 5: Market share
      const marketShare = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1, sampleCompetitor2, sampleCompetitor3],
        marketAnalysis
      );

      expect(marketShare.estimatedShare).toBeGreaterThan(0);

      // Step 6: Strategic recommendations
      const recommendations = generateStrategicRecommendations(
        positioning,
        priceComparison,
        amenityGaps,
        marketShare
      );

      expect(recommendations.pricingStrategy).toBeDefined();
      expect(recommendations.competitiveActions.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle single competitor scenario', () => {
      const marketAnalysis = analyzeMarketPosition(yourHotel, [
        sampleCompetitor1,
      ]);
      const positioning = analyzePositioning(yourHotel, [sampleCompetitor1]);
      const priceComparison = comparePricing(200, [sampleCompetitor1]);
      const amenityGaps = analyzeAmenityGaps(yourHotel.amenities, [
        sampleCompetitor1,
      ]);
      const marketShare = estimateMarketShare(
        yourHotel,
        [sampleCompetitor1],
        marketAnalysis
      );
      const recommendations = generateStrategicRecommendations(
        positioning,
        priceComparison,
        amenityGaps,
        marketShare
      );

      expect(marketAnalysis.marketSize).toBe(2);
      expect(positioning.currentPosition.valueScore).toBeDefined();
      expect(priceComparison.competitorPrices.length).toBe(1);
      expect(amenityGaps.missingAmenities).toBeDefined();
      expect(marketShare.estimatedShare).toBeGreaterThan(0);
      expect(recommendations.pricingStrategy).toBeDefined();
    });
  });
});
