import {
  analyzeCompetitiveIntelligence,
  analyzePricePositioning,
  analyzeSentimentBenchmark,
  analyzeOccupancyComparison,
  analyzeAmenities,
  calculateMarketPosition,
  estimateMarketShare,
  PropertyData,
  CompetitorSet,
} from '../analyzer';

describe('Competitive Intelligence', () => {
  // Sample property data
  const sampleProperty: PropertyData = {
    propertyId: 'prop-001',
    name: 'Grand Hotel',
    type: 'hotel',
    stars: 4,
    rooms: 200,
    location: {
      city: 'San Francisco',
      region: 'CA',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    averageDailyRate: 250,
    occupancyRate: 75,
    reviewScore: 8.2,
    reviewCount: 1500,
    amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking', 'spa'],
    yearOpened: 2010,
  };

  const competitors: PropertyData[] = [
    {
      propertyId: 'comp-001',
      name: 'Luxury Inn',
      type: 'hotel',
      stars: 5,
      rooms: 150,
      location: { city: 'San Francisco', region: 'CA' },
      averageDailyRate: 350,
      occupancyRate: 85,
      reviewScore: 9.0,
      reviewCount: 2000,
      amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking', 'spa', 'concierge', 'valet'],
      yearOpened: 2015,
    },
    {
      propertyId: 'comp-002',
      name: 'Budget Stay',
      type: 'hotel',
      stars: 3,
      rooms: 180,
      location: { city: 'San Francisco', region: 'CA' },
      averageDailyRate: 150,
      occupancyRate: 70,
      reviewScore: 7.5,
      reviewCount: 800,
      amenities: ['wifi', 'parking', 'breakfast'],
      yearOpened: 2005,
    },
    {
      propertyId: 'comp-003',
      name: 'Comfort Hotel',
      type: 'hotel',
      stars: 4,
      rooms: 220,
      location: { city: 'San Francisco', region: 'CA' },
      averageDailyRate: 220,
      occupancyRate: 80,
      reviewScore: 8.0,
      reviewCount: 1200,
      amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking', 'business-center'],
      yearOpened: 2012,
    },
    {
      propertyId: 'comp-004',
      name: 'City Lodge',
      type: 'hotel',
      stars: 3,
      rooms: 160,
      location: { city: 'San Francisco', region: 'CA' },
      averageDailyRate: 180,
      occupancyRate: 65,
      reviewScore: 7.8,
      reviewCount: 900,
      amenities: ['wifi', 'gym', 'parking', 'breakfast'],
      yearOpened: 2008,
    },
  ];

  const competitorSet: CompetitorSet = {
    property: sampleProperty,
    competitors,
  };

  describe('analyzeCompetitiveIntelligence', () => {
    it('should analyze complete competitive intelligence', () => {
      const intelligence = analyzeCompetitiveIntelligence(competitorSet);

      expect(intelligence.property).toBe(sampleProperty);
      expect(intelligence.competitorCount).toBe(4);
      expect(intelligence.pricePositioning).toBeDefined();
      expect(intelligence.sentimentBenchmark).toBeDefined();
      expect(intelligence.occupancyComparison).toBeDefined();
      expect(intelligence.amenityAnalysis).toBeDefined();
      expect(intelligence.marketPosition).toBeDefined();
      expect(intelligence.marketShare).toBeDefined();
      expect(intelligence.strategicRecommendations).toBeInstanceOf(Array);
      expect(intelligence.competitiveIndex).toBeGreaterThan(0);
      expect(intelligence.competitiveIndex).toBeLessThanOrEqual(100);
    });

    it('should throw error with no competitors', () => {
      expect(() =>
        analyzeCompetitiveIntelligence({
          property: sampleProperty,
          competitors: [],
        })
      ).toThrow('At least one competitor is required for analysis');
    });

    it('should provide strategic recommendations', () => {
      const intelligence = analyzeCompetitiveIntelligence(competitorSet);

      expect(intelligence.strategicRecommendations.length).toBeGreaterThan(0);
      expect(intelligence.strategicRecommendations.length).toBeLessThanOrEqual(8);
    });
  });

  describe('analyzePricePositioning', () => {
    it('should analyze price positioning', () => {
      const positioning = analyzePricePositioning(sampleProperty, competitors);

      expect(positioning.position).toBe('upscale'); // $250 is 75th percentile = upscale
      expect(positioning.percentileRank).toBeGreaterThanOrEqual(0);
      expect(positioning.percentileRank).toBeLessThanOrEqual(100);
      expect(positioning.priceIndex).toBeGreaterThan(0);
      expect(positioning.competitiveAdvantage).toBeTruthy();
    });

    it('should calculate percentile rank correctly', () => {
      const positioning = analyzePricePositioning(sampleProperty, competitors);

      // Property at $250, competitors at $150, $180, $220, $350
      // Sorted: $150, $180, $220, $250, $350
      // Position 3 of 4 = 60th percentile
      expect(positioning.percentileRank).toBeGreaterThanOrEqual(50);
      expect(positioning.percentileRank).toBeLessThanOrEqual(80);
    });

    it('should identify budget position for low-priced property', () => {
      const budgetProperty = { ...sampleProperty, averageDailyRate: 100 };
      const positioning = analyzePricePositioning(budgetProperty, competitors);

      expect(positioning.position).toBe('budget');
    });

    it('should identify luxury position for high-priced property', () => {
      const luxuryProperty = { ...sampleProperty, averageDailyRate: 400 };
      const positioning = analyzePricePositioning(luxuryProperty, competitors);

      expect(positioning.position).toBe('luxury');
    });

    it('should calculate price index relative to market', () => {
      const positioning = analyzePricePositioning(sampleProperty, competitors);

      // Property at $250, market average ~$225
      expect(positioning.priceIndex).toBeGreaterThan(100);
      expect(positioning.priceIndex).toBeLessThan(120);
    });

    it('should identify value-leader for high quality low price', () => {
      const valueProperty = {
        ...sampleProperty,
        averageDailyRate: 180,
        reviewScore: 8.5,
      };
      const positioning = analyzePricePositioning(valueProperty, competitors);

      expect(positioning.competitiveAdvantage).toBe('value-leader');
    });

    it('should provide optimal price range', () => {
      const positioning = analyzePricePositioning(sampleProperty, competitors);

      expect(positioning.optimalPriceRange.min).toBeGreaterThan(0);
      expect(positioning.optimalPriceRange.max).toBeGreaterThan(
        positioning.optimalPriceRange.min
      );
      expect(positioning.optimalPriceRange.optimal).toBeGreaterThan(0);
    });

    it('should recommend price increase for underpriced quality', () => {
      const underpricedProperty = {
        ...sampleProperty,
        averageDailyRate: 150,
        reviewScore: 9.0,
      };
      const positioning = analyzePricePositioning(underpricedProperty, competitors);

      expect(positioning.recommendations.length).toBeGreaterThan(0);
      expect(
        positioning.recommendations.some((r) => r.toLowerCase().includes('increase'))
      ).toBe(true);
    });
  });

  describe('analyzeSentimentBenchmark', () => {
    it('should analyze sentiment benchmark', () => {
      const benchmark = analyzeSentimentBenchmark(sampleProperty, competitors);

      expect(benchmark.propertyScore).toBeGreaterThan(0);
      expect(benchmark.propertyScore).toBeLessThanOrEqual(100);
      expect(benchmark.marketAverage).toBeGreaterThan(0);
      expect(benchmark.topCompetitorScore).toBeGreaterThan(0);
      expect(benchmark.percentileRank).toBeGreaterThanOrEqual(0);
      expect(benchmark.percentileRank).toBeLessThanOrEqual(100);
    });

    it('should calculate sentiment gap correctly', () => {
      const benchmark = analyzeSentimentBenchmark(sampleProperty, competitors);

      const expectedGap = benchmark.propertyScore - benchmark.marketAverage;
      expect(benchmark.sentimentGap).toBe(expectedGap);
    });

    it('should identify strength areas', () => {
      const benchmark = analyzeSentimentBenchmark(sampleProperty, competitors);

      expect(benchmark.strengthAreas).toBeInstanceOf(Array);
      benchmark.strengthAreas.forEach((area) => {
        expect(area.category).toBeTruthy();
        expect(area.score).toBeGreaterThan(0);
        expect(area.ranking).toBeGreaterThan(0);
      });
    });

    it('should identify weakness areas', () => {
      const benchmark = analyzeSentimentBenchmark(sampleProperty, competitors);

      expect(benchmark.weaknessAreas).toBeInstanceOf(Array);
      benchmark.weaknessAreas.forEach((area) => {
        expect(area.category).toBeTruthy();
        expect(area.score).toBeGreaterThanOrEqual(0);
        expect(area.ranking).toBeGreaterThan(0);
      });
    });

    it('should recommend improvements for below-market sentiment', () => {
      const lowRatedProperty = { ...sampleProperty, reviewScore: 6.5 };
      const benchmark = analyzeSentimentBenchmark(lowRatedProperty, competitors);

      expect(benchmark.recommendations.length).toBeGreaterThan(0);
      expect(
        benchmark.recommendations.some((r) => r.toLowerCase().includes('improve'))
      ).toBe(true);
    });

    it('should identify top competitor score', () => {
      const benchmark = analyzeSentimentBenchmark(sampleProperty, competitors);

      // Top competitor has 9.0 rating = 90 score
      expect(benchmark.topCompetitorScore).toBe(90);
    });
  });

  describe('analyzeOccupancyComparison', () => {
    it('should analyze occupancy comparison', () => {
      const comparison = analyzeOccupancyComparison(sampleProperty, competitors);

      expect(comparison.propertyOccupancy).toBe(75);
      expect(comparison.marketAverage).toBeGreaterThan(0);
      expect(comparison.topCompetitorOccupancy).toBeGreaterThan(0);
      expect(comparison.percentileRank).toBeGreaterThanOrEqual(0);
      expect(comparison.percentileRank).toBeLessThanOrEqual(100);
    });

    it('should calculate occupancy gap', () => {
      const comparison = analyzeOccupancyComparison(sampleProperty, competitors);

      const expectedGap = comparison.propertyOccupancy - comparison.marketAverage;
      expect(comparison.occupancyGap).toBeCloseTo(expectedGap, 0);
    });

    it('should calculate penetration index', () => {
      const comparison = analyzeOccupancyComparison(sampleProperty, competitors);

      expect(comparison.penetrationIndex).toBeGreaterThan(0);
      expect(comparison.penetrationIndex).toBeLessThan(200);
    });

    it('should estimate potential revenue', () => {
      const lowOccupancyProperty = { ...sampleProperty, occupancyRate: 50 };
      const comparison = analyzeOccupancyComparison(lowOccupancyProperty, competitors);

      expect(comparison.potentialRevenue).toBeGreaterThan(0);
    });

    it('should recommend action for low occupancy', () => {
      const lowOccupancyProperty = { ...sampleProperty, occupancyRate: 50 };
      const comparison = analyzeOccupancyComparison(lowOccupancyProperty, competitors);

      expect(comparison.recommendations.length).toBeGreaterThan(0);
      expect(
        comparison.recommendations.some(
          (r) => r.toLowerCase().includes('occupancy') || r.toLowerCase().includes('marketing')
        )
      ).toBe(true);
    });
  });

  describe('analyzeAmenities', () => {
    it('should analyze amenity gaps', () => {
      const analysis = analyzeAmenities(sampleProperty, competitors);

      expect(analysis.propertyAmenities).toBe(sampleProperty.amenities);
      expect(analysis.commonAmenities).toBeInstanceOf(Array);
      expect(analysis.missingAmenities).toBeInstanceOf(Array);
      expect(analysis.uniqueAmenities).toBeInstanceOf(Array);
      expect(analysis.amenityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.amenityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate market penetration for amenities', () => {
      const analysis = analyzeAmenities(sampleProperty, competitors);

      analysis.commonAmenities.forEach((amenity) => {
        expect(amenity.marketPenetration).toBeGreaterThanOrEqual(0);
        expect(amenity.marketPenetration).toBeLessThanOrEqual(100);
        expect(typeof amenity.hasAmenity).toBe('boolean');
      });
    });

    it('should identify missing amenities', () => {
      const limitedAmenityProperty = {
        ...sampleProperty,
        amenities: ['wifi', 'parking'],
      };
      const analysis = analyzeAmenities(limitedAmenityProperty, competitors);

      expect(analysis.missingAmenities.length).toBeGreaterThan(0);
    });

    it('should identify unique amenities', () => {
      const uniqueAmenityProperty = {
        ...sampleProperty,
        amenities: [...sampleProperty.amenities, 'rooftop-bar', 'helipad'],
      };
      const analysis = analyzeAmenities(uniqueAmenityProperty, competitors);

      expect(analysis.uniqueAmenities.length).toBeGreaterThan(0);
    });

    it('should calculate amenity score correctly', () => {
      const fullAmenityProperty = {
        ...sampleProperty,
        amenities: ['wifi', 'pool', 'gym', 'restaurant', 'parking', 'breakfast', 'spa'],
      };
      const analysis = analyzeAmenities(fullAmenityProperty, competitors);

      expect(analysis.amenityScore).toBeGreaterThan(70);
    });

    it('should recommend adding missing amenities', () => {
      const limitedAmenityProperty = {
        ...sampleProperty,
        amenities: ['wifi'],
      };
      const analysis = analyzeAmenities(limitedAmenityProperty, competitors);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(
        analysis.recommendations.some((r) => r.toLowerCase().includes('add'))
      ).toBe(true);
    });
  });

  describe('calculateMarketPosition', () => {
    it('should calculate market position', () => {
      const pricePositioning = analyzePricePositioning(sampleProperty, competitors);
      const sentimentBenchmark = analyzeSentimentBenchmark(sampleProperty, competitors);
      const occupancyComparison = analyzeOccupancyComparison(sampleProperty, competitors);
      const amenityAnalysis = analyzeAmenities(sampleProperty, competitors);

      const position = calculateMarketPosition(
        sampleProperty,
        competitors,
        pricePositioning,
        sentimentBenchmark,
        occupancyComparison,
        amenityAnalysis
      );

      expect(position.overallRank).toBeGreaterThan(0);
      expect(position.overallRank).toBeLessThanOrEqual(5); // 1 property + 4 competitors
      expect(position.totalProperties).toBe(5);
      expect(position.competitiveScore).toBeGreaterThan(0);
      expect(position.competitiveScore).toBeLessThanOrEqual(100);
      expect(position.marketSegment).toBeTruthy();
    });

    it('should identify leader segment for top-ranked property', () => {
      const topProperty = {
        ...sampleProperty,
        averageDailyRate: 300,
        occupancyRate: 90,
        reviewScore: 9.5,
      };

      const pricePositioning = analyzePricePositioning(topProperty, competitors);
      const sentimentBenchmark = analyzeSentimentBenchmark(topProperty, competitors);
      const occupancyComparison = analyzeOccupancyComparison(topProperty, competitors);
      const amenityAnalysis = analyzeAmenities(topProperty, competitors);

      const position = calculateMarketPosition(
        topProperty,
        competitors,
        pricePositioning,
        sentimentBenchmark,
        occupancyComparison,
        amenityAnalysis
      );

      expect(position.overallRank).toBeLessThanOrEqual(2);
      expect(['leader', 'challenger']).toContain(position.marketSegment);
    });

    it('should provide SWOT analysis', () => {
      const pricePositioning = analyzePricePositioning(sampleProperty, competitors);
      const sentimentBenchmark = analyzeSentimentBenchmark(sampleProperty, competitors);
      const occupancyComparison = analyzeOccupancyComparison(sampleProperty, competitors);
      const amenityAnalysis = analyzeAmenities(sampleProperty, competitors);

      const position = calculateMarketPosition(
        sampleProperty,
        competitors,
        pricePositioning,
        sentimentBenchmark,
        occupancyComparison,
        amenityAnalysis
      );

      expect(position.strengths).toBeInstanceOf(Array);
      expect(position.weaknesses).toBeInstanceOf(Array);
      expect(position.opportunities).toBeInstanceOf(Array);
      expect(position.threats).toBeInstanceOf(Array);
    });

    it('should identify strengths for high-performing property', () => {
      const strongProperty = {
        ...sampleProperty,
        occupancyRate: 88,
        reviewScore: 9.0,
      };

      const pricePositioning = analyzePricePositioning(strongProperty, competitors);
      const sentimentBenchmark = analyzeSentimentBenchmark(strongProperty, competitors);
      const occupancyComparison = analyzeOccupancyComparison(strongProperty, competitors);
      const amenityAnalysis = analyzeAmenities(strongProperty, competitors);

      const position = calculateMarketPosition(
        strongProperty,
        competitors,
        pricePositioning,
        sentimentBenchmark,
        occupancyComparison,
        amenityAnalysis
      );

      expect(position.strengths.length).toBeGreaterThan(0);
    });

    it('should identify weaknesses for low-performing property', () => {
      const weakProperty = {
        ...sampleProperty,
        occupancyRate: 50,
        reviewScore: 6.5,
        amenities: ['wifi'],
      };

      const pricePositioning = analyzePricePositioning(weakProperty, competitors);
      const sentimentBenchmark = analyzeSentimentBenchmark(weakProperty, competitors);
      const occupancyComparison = analyzeOccupancyComparison(weakProperty, competitors);
      const amenityAnalysis = analyzeAmenities(weakProperty, competitors);

      const position = calculateMarketPosition(
        weakProperty,
        competitors,
        pricePositioning,
        sentimentBenchmark,
        occupancyComparison,
        amenityAnalysis
      );

      expect(position.weaknesses.length).toBeGreaterThan(0);
    });
  });

  describe('estimateMarketShare', () => {
    it('should estimate market share', () => {
      const share = estimateMarketShare(sampleProperty, competitors);

      expect(share.estimatedMarketShare).toBeGreaterThan(0);
      expect(share.estimatedMarketShare).toBeLessThan(100);
      expect(share.roomNightsShare).toBeGreaterThan(0);
      expect(share.revenueShare).toBeGreaterThan(0);
      expect(share.topCompetitorShare).toBeGreaterThan(0);
      expect(share.marketConcentration).toBeTruthy();
    });

    it('should calculate room nights share', () => {
      const share = estimateMarketShare(sampleProperty, competitors);

      // Property: 200 rooms, Total: 910 rooms
      const expectedShare = (200 / 910) * 100;
      expect(share.roomNightsShare).toBeCloseTo(expectedShare, 0);
    });

    it('should calculate revenue share', () => {
      const share = estimateMarketShare(sampleProperty, competitors);

      expect(share.revenueShare).toBeGreaterThan(0);
      expect(share.revenueShare).toBeLessThan(100);
    });

    it('should identify market concentration', () => {
      const share = estimateMarketShare(sampleProperty, competitors);

      expect(['fragmented', 'moderate', 'concentrated']).toContain(
        share.marketConcentration
      );
    });

    it('should recommend actions based on market share', () => {
      const share = estimateMarketShare(sampleProperty, competitors);

      expect(share.recommendations).toBeInstanceOf(Array);
      expect(share.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify revenue vs market share gap', () => {
      const premiumProperty = {
        ...sampleProperty,
        averageDailyRate: 350,
        occupancyRate: 70,
      };
      const share = estimateMarketShare(premiumProperty, competitors);

      // Premium pricing should result in higher revenue share than market share
      if (share.revenueShare > share.estimatedMarketShare) {
        expect(
          share.recommendations.some((r) => r.toLowerCase().includes('revenue'))
        ).toBe(true);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should provide comprehensive competitive intelligence', () => {
      const intelligence = analyzeCompetitiveIntelligence(competitorSet);

      // Verify all components present
      expect(intelligence.pricePositioning.position).toBeTruthy();
      expect(intelligence.sentimentBenchmark.propertyScore).toBeGreaterThan(0);
      expect(intelligence.occupancyComparison.propertyOccupancy).toBe(75);
      expect(intelligence.amenityAnalysis.amenityScore).toBeGreaterThan(0);
      expect(intelligence.marketPosition.overallRank).toBeGreaterThan(0);
      expect(intelligence.marketShare.estimatedMarketShare).toBeGreaterThan(0);
      expect(intelligence.strategicRecommendations.length).toBeGreaterThan(0);
    });

    it('should handle edge case of single competitor', () => {
      const singleCompetitorSet: CompetitorSet = {
        property: sampleProperty,
        competitors: [competitors[0]],
      };

      const intelligence = analyzeCompetitiveIntelligence(singleCompetitorSet);

      expect(intelligence.competitorCount).toBe(1);
      expect(intelligence.competitiveIndex).toBeGreaterThan(0);
    });

    it('should handle property with no amenities', () => {
      const noAmenityProperty = { ...sampleProperty, amenities: [] };
      const set: CompetitorSet = {
        property: noAmenityProperty,
        competitors,
      };

      const intelligence = analyzeCompetitiveIntelligence(set);

      expect(intelligence.amenityAnalysis.missingAmenities.length).toBeGreaterThan(0);
      expect(intelligence.amenityAnalysis.amenityScore).toBeLessThan(50);
    });

    it('should provide different recommendations for different positions', () => {
      const budgetProperty = {
        ...sampleProperty,
        averageDailyRate: 100,
        stars: 2,
      };
      const luxuryProperty = {
        ...sampleProperty,
        averageDailyRate: 400,
        stars: 5,
      };

      const budgetIntel = analyzeCompetitiveIntelligence({
        property: budgetProperty,
        competitors,
      });
      const luxuryIntel = analyzeCompetitiveIntelligence({
        property: luxuryProperty,
        competitors,
      });

      expect(budgetIntel.strategicRecommendations).not.toEqual(
        luxuryIntel.strategicRecommendations
      );
    });

    it('should calculate consistent competitive index', () => {
      const intelligence = analyzeCompetitiveIntelligence(competitorSet);

      expect(intelligence.competitiveIndex).toBeGreaterThanOrEqual(0);
      expect(intelligence.competitiveIndex).toBeLessThanOrEqual(100);
      expect(intelligence.competitiveIndex).toBe(
        intelligence.marketPosition.competitiveScore
      );
    });
  });
});
