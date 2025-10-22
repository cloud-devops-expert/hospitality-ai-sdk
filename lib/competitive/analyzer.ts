/**
 * Competitive Intelligence Module
 *
 * Market positioning analysis, competitive price monitoring,
 * and strategic recommendations for hospitality businesses.
 *
 * Zero-cost local processing approach.
 */

// ============================================================================
// Types
// ============================================================================

export interface CompetitorData {
  competitorId: string;
  name: string;
  category: 'budget' | 'midscale' | 'upscale' | 'luxury';
  location: string;
  distance: number; // km
  roomCount: number;
  amenities: string[];
  pricing?: CompetitorPricing;
  reviews?: CompetitorReviews;
  occupancy?: number; // percentage
}

export interface CompetitorPricing {
  baseRate: number;
  averageRate: number;
  peakRate: number;
  lastUpdated: Date;
}

export interface CompetitorReviews {
  averageRating: number; // 1-5
  totalReviews: number;
  recentRating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface MarketAnalysis {
  marketSize: number;
  totalRooms: number;
  averageOccupancy: number;
  averageRate: number;
  marketSegments: Map<string, SegmentData>;
  competitiveSet: CompetitorData[];
  marketTrends: {
    occupancyTrend: 'increasing' | 'stable' | 'decreasing';
    pricingTrend: 'increasing' | 'stable' | 'decreasing';
    demandLevel: 'high' | 'medium' | 'low';
  };
}

export interface SegmentData {
  segment: string;
  roomCount: number;
  marketShare: number; // percentage
  averageRate: number;
  averageOccupancy: number;
}

export interface PositioningAnalysis {
  currentPosition: {
    pricePercentile: number; // 0-100
    qualityPercentile: number;
    valueScore: number; // 0-100
  };
  competitiveAdvantages: string[];
  competitiveDisadvantages: string[];
  marketGaps: string[];
  recommendations: string[];
}

export interface PriceComparison {
  yourPrice: number;
  marketAverage: number;
  variance: number; // percentage
  competitorPrices: Array<{
    competitorId: string;
    name: string;
    price: number;
    difference: number; // percentage
  }>;
  pricePosition: 'premium' | 'competitive' | 'value' | 'discount';
  recommendation: string;
}

export interface AmenityGapAnalysis {
  yourAmenities: string[];
  competitorAmenities: Map<string, number>; // amenity -> count
  missingAmenities: Array<{
    amenity: string;
    prevalence: number; // percentage
    estimatedCost: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  uniqueAmenities: string[];
  overallScore: number; // 0-100
}

export interface MarketShareEstimate {
  estimatedShare: number; // percentage
  shareBySegment: Map<string, number>;
  competitorShares: Map<string, number>;
  trend: 'gaining' | 'stable' | 'losing';
  projectedShare: number; // 6 months
}

export interface StrategicRecommendations {
  pricingStrategy: string;
  positioningStrategy: string;
  amenityInvestments: string[];
  marketingFocus: string[];
  competitiveActions: Array<{
    action: string;
    priority: number;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
  }>;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Analyzes market position relative to competitors
 */
export function analyzeMarketPosition(
  yourData: Partial<CompetitorData>,
  competitors: CompetitorData[]
): MarketAnalysis {
  if (competitors.length === 0) {
    throw new Error('At least one competitor required for market analysis');
  }

  const allProperties = [...competitors, yourData as CompetitorData];
  
  const marketSize = competitors.length + 1;
  const totalRooms = allProperties.reduce((sum, c) => sum + (c.roomCount || 0), 0);
  
  const avgOccupancy = Math.round(
    allProperties
      .filter(c => c.occupancy !== undefined)
      .reduce((sum, c) => sum + (c.occupancy || 0), 0) /
    allProperties.filter(c => c.occupancy !== undefined).length
  );

  const avgRate = Math.round(
    allProperties
      .filter(c => c.pricing?.averageRate)
      .reduce((sum, c) => sum + (c.pricing?.averageRate || 0), 0) /
    allProperties.filter(c => c.pricing?.averageRate).length
  );

  // Segment analysis
  const marketSegments = new Map<string, SegmentData>();
  const categories = ['budget', 'midscale', 'upscale', 'luxury'];
  
  categories.forEach(category => {
    const segmentProperties = allProperties.filter(p => p.category === category);
    if (segmentProperties.length > 0) {
      const segmentRooms = segmentProperties.reduce((sum, p) => sum + (p.roomCount || 0), 0);
      marketSegments.set(category, {
        segment: category,
        roomCount: segmentRooms,
        marketShare: Math.round((segmentRooms / totalRooms) * 100),
        averageRate: Math.round(
          segmentProperties.reduce((sum, p) => sum + (p.pricing?.averageRate || 0), 0) / segmentProperties.length
        ),
        averageOccupancy: Math.round(
          segmentProperties
            .filter(p => p.occupancy !== undefined)
            .reduce((sum, p) => sum + (p.occupancy || 0), 0) /
          segmentProperties.filter(p => p.occupancy !== undefined).length || 0
        ),
      });
    }
  });

  // Determine trends
  const marketTrends = {
    occupancyTrend: avgOccupancy > 75 ? 'increasing' as const : 
                    avgOccupancy > 60 ? 'stable' as const : 'decreasing' as const,
    pricingTrend: 'stable' as const,
    demandLevel: avgOccupancy > 80 ? 'high' as const : 
                 avgOccupancy > 65 ? 'medium' as const : 'low' as const,
  };

  return {
    marketSize,
    totalRooms,
    averageOccupancy: avgOccupancy,
    averageRate: avgRate,
    marketSegments,
    competitiveSet: competitors,
    marketTrends,
  };
}

/**
 * Analyzes competitive positioning
 */
export function analyzePositioning(
  yourData: Partial<CompetitorData>,
  competitors: CompetitorData[]
): PositioningAnalysis {
  const yourPrice = yourData.pricing?.averageRate || 0;
  const yourRating = yourData.reviews?.averageRating || 0;

  // Calculate percentiles
  const prices = competitors
    .filter(c => c.pricing?.averageRate)
    .map(c => c.pricing!.averageRate)
    .sort((a, b) => a - b);
  
  const ratings = competitors
    .filter(c => c.reviews?.averageRating)
    .map(c => c.reviews!.averageRating)
    .sort((a, b) => a - b);

  const pricePercentile = calculatePercentile(yourPrice, prices);
  const qualityPercentile = calculatePercentile(yourRating, ratings);
  
  const valueScore = Math.round((qualityPercentile - pricePercentile + 100) / 2);

  // Identify advantages/disadvantages
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const gaps: string[] = [];

  if (qualityPercentile > 75) {
    advantages.push('Superior quality ratings compared to competitors');
  } else if (qualityPercentile < 25) {
    disadvantages.push('Quality ratings below market average');
  }

  if (valueScore > 70) {
    advantages.push('Excellent value proposition (quality vs price)');
  }

  if (pricePercentile < 30) {
    advantages.push('Competitive pricing advantage');
  } else if (pricePercentile > 80) {
    disadvantages.push('Premium pricing may limit market reach');
  }

  // Market gaps
  if (pricePercentile > 60 && qualityPercentile < 60) {
    gaps.push('Opportunity: Premium pricing without matching quality');
  }
  if (pricePercentile < 40 && qualityPercentile > 60) {
    gaps.push('Strong position: High quality at competitive prices');
  }

  const recommendations = generatePositioningRecommendations(
    pricePercentile,
    qualityPercentile,
    valueScore
  );

  return {
    currentPosition: {
      pricePercentile,
      qualityPercentile,
      valueScore,
    },
    competitiveAdvantages: advantages,
    competitiveDisadvantages: disadvantages,
    marketGaps: gaps,
    recommendations,
  };
}

/**
 * Compares pricing against competitors
 */
export function comparePricing(
  yourPrice: number,
  competitors: CompetitorData[]
): PriceComparison {
  const competitorPrices = competitors
    .filter(c => c.pricing?.averageRate)
    .map(c => ({
      competitorId: c.competitorId,
      name: c.name,
      price: c.pricing!.averageRate,
      difference: Math.round(((c.pricing!.averageRate - yourPrice) / yourPrice) * 100),
    }))
    .sort((a, b) => a.price - b.price);

  const marketAverage = Math.round(
    competitorPrices.reduce((sum, c) => sum + c.price, 0) / competitorPrices.length
  );

  const variance = Math.round(((yourPrice - marketAverage) / marketAverage) * 100);

  // Determine price position
  let pricePosition: PriceComparison['pricePosition'];
  if (yourPrice > marketAverage * 1.2) {
    pricePosition = 'premium';
  } else if (yourPrice > marketAverage * 1.05) {
    pricePosition = 'competitive';
  } else if (yourPrice > marketAverage * 0.85) {
    pricePosition = 'value';
  } else {
    pricePosition = 'discount';
  }

  const recommendation = generatePricingRecommendation(variance, pricePosition);

  return {
    yourPrice,
    marketAverage,
    variance,
    competitorPrices,
    pricePosition,
    recommendation,
  };
}

/**
 * Analyzes amenity gaps vs competitors
 */
export function analyzeAmenityGaps(
  yourAmenities: string[],
  competitors: CompetitorData[]
): AmenityGapAnalysis {
  const amenityCounts = new Map<string, number>();

  // Count amenity prevalence
  competitors.forEach(comp => {
    comp.amenities.forEach(amenity => {
      amenityCounts.set(amenity, (amenityCounts.get(amenity) || 0) + 1);
    });
  });

  const competitorAmenities = amenityCounts;

  // Identify missing amenities
  const missingAmenities: AmenityGapAnalysis['missingAmenities'] = [];
  const amenityCosts: Record<string, number> = {
    'pool': 50000,
    'gym': 30000,
    'spa': 100000,
    'restaurant': 75000,
    'wifi': 5000,
    'parking': 40000,
    'business-center': 15000,
    'conference-rooms': 50000,
  };

  amenityCounts.forEach((count, amenity) => {
    if (!yourAmenities.includes(amenity)) {
      const prevalence = Math.round((count / competitors.length) * 100);
      const estimatedCost = amenityCosts[amenity.toLowerCase()] || 10000;
      
      let priority: 'high' | 'medium' | 'low';
      if (prevalence > 70) {
        priority = 'high';
      } else if (prevalence > 40) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      missingAmenities.push({
        amenity,
        prevalence,
        estimatedCost,
        priority,
      });
    }
  });

  // Sort by prevalence
  missingAmenities.sort((a, b) => b.prevalence - a.prevalence);

  // Identify unique amenities
  const uniqueAmenities = yourAmenities.filter(amenity =>
    !Array.from(amenityCounts.keys()).includes(amenity)
  );

  // Calculate overall amenity score
  const totalPossibleAmenities = new Set([...yourAmenities, ...Array.from(amenityCounts.keys())]).size;
  const overallScore = Math.round((yourAmenities.length / totalPossibleAmenities) * 100);

  return {
    yourAmenities,
    competitorAmenities,
    missingAmenities,
    uniqueAmenities,
    overallScore,
  };
}

/**
 * Estimates market share
 */
export function estimateMarketShare(
  yourData: Partial<CompetitorData>,
  competitors: CompetitorData[],
  marketAnalysis: MarketAnalysis
): MarketShareEstimate {
  const yourRooms = yourData.roomCount || 0;
  const yourOccupancy = yourData.occupancy || 70;

  // Calculate actual room nights
  const yourRoomNights = yourRooms * (yourOccupancy / 100) * 365;
  
  let totalMarketRoomNights = yourRoomNights;
  const competitorShares = new Map<string, number>();

  competitors.forEach(comp => {
    const compRoomNights = (comp.roomCount || 0) * ((comp.occupancy || 70) / 100) * 365;
    totalMarketRoomNights += compRoomNights;
    competitorShares.set(comp.competitorId, 0);
  });

  const estimatedShare = Math.round((yourRoomNights / totalMarketRoomNights) * 100);

  // Calculate competitor shares
  competitors.forEach(comp => {
    const compRoomNights = (comp.roomCount || 0) * ((comp.occupancy || 70) / 100) * 365;
    const share = Math.round((compRoomNights / totalMarketRoomNights) * 100);
    competitorShares.set(comp.competitorId, share);
  });

  // Segment share
  const shareBySegment = new Map<string, number>();
  if (yourData.category) {
    shareBySegment.set(yourData.category, estimatedShare);
  }

  // Determine trend
  const trend: MarketShareEstimate['trend'] = 
    yourOccupancy > marketAnalysis.averageOccupancy ? 'gaining' :
    yourOccupancy < marketAnalysis.averageOccupancy - 5 ? 'losing' : 'stable';

  // Project 6 months
  const trendMultiplier = trend === 'gaining' ? 1.05 : trend === 'losing' ? 0.95 : 1;
  const projectedShare = Math.round(estimatedShare * trendMultiplier);

  return {
    estimatedShare,
    shareBySegment,
    competitorShares,
    trend,
    projectedShare,
  };
}

/**
 * Generates strategic recommendations
 */
export function generateStrategicRecommendations(
  positioning: PositioningAnalysis,
  priceComparison: PriceComparison,
  amenityGaps: AmenityGapAnalysis,
  marketShare: MarketShareEstimate
): StrategicRecommendations {
  const actions: StrategicRecommendations['competitiveActions'] = [];

  // Pricing strategy
  let pricingStrategy = '';
  if (priceComparison.pricePosition === 'premium') {
    pricingStrategy = 'Maintain premium positioning with value-add services';
  } else if (priceComparison.pricePosition === 'discount') {
    pricingStrategy = 'Consider gradual price increases to improve margin';
  } else {
    pricingStrategy = 'Maintain competitive pricing with dynamic adjustments';
  }

  // Positioning strategy
  let positioningStrategy = '';
  if (positioning.currentPosition.valueScore > 70) {
    positioningStrategy = 'Emphasize value proposition in marketing';
  } else {
    positioningStrategy = 'Improve quality-price balance';
  }

  // Amenity investments
  const amenityInvestments = amenityGaps.missingAmenities
    .filter(a => a.priority === 'high')
    .slice(0, 3)
    .map(a => `Add ${a.amenity} (${a.prevalence}% of competitors have it)`);

  // Marketing focus
  const marketingFocus: string[] = [];
  if (amenityGaps.uniqueAmenities.length > 0) {
    marketingFocus.push(`Highlight unique amenities: ${amenityGaps.uniqueAmenities.join(', ')}`);
  }
  if (marketShare.trend === 'gaining') {
    marketingFocus.push('Capitalize on growing market share');
  }

  // Competitive actions
  if (positioning.currentPosition.qualityPercentile < 50) {
    actions.push({
      action: 'Improve service quality and guest satisfaction',
      priority: 10,
      effort: 'high',
      impact: 'high',
    });
  }

  if (amenityGaps.missingAmenities.some(a => a.priority === 'high')) {
    actions.push({
      action: 'Invest in high-priority missing amenities',
      priority: 8,
      effort: 'high',
      impact: 'medium',
    });
  }

  if (marketShare.trend === 'losing') {
    actions.push({
      action: 'Implement retention and acquisition campaigns',
      priority: 9,
      effort: 'medium',
      impact: 'high',
    });
  }

  return {
    pricingStrategy,
    positioningStrategy,
    amenityInvestments,
    marketingFocus,
    competitiveActions: actions.sort((a, b) => b.priority - a.priority),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculatePercentile(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 50;
  
  let count = 0;
  for (const v of sortedValues) {
    if (v < value) count++;
  }
  
  return Math.round((count / sortedValues.length) * 100);
}

function generatePositioningRecommendations(
  pricePercentile: number,
  qualityPercentile: number,
  valueScore: number
): string[] {
  const recommendations: string[] = [];

  if (pricePercentile > 70 && qualityPercentile < 70) {
    recommendations.push('Price is high relative to quality - improve services or adjust pricing');
  }

  if (pricePercentile < 30 && qualityPercentile > 70) {
    recommendations.push('Strong value position - consider premium pricing opportunities');
  }

  if (valueScore > 80) {
    recommendations.push('Excellent value proposition - leverage in marketing');
  } else if (valueScore < 40) {
    recommendations.push('Poor value perception - address pricing or quality');
  }

  if (qualityPercentile < 50) {
    recommendations.push('Focus on improving guest satisfaction and service quality');
  }

  return recommendations;
}

function generatePricingRecommendation(variance: number, position: string): string {
  if (variance > 20) {
    return 'Your pricing is significantly above market - ensure quality justifies premium';
  } else if (variance < -20) {
    return 'Your pricing is well below market - opportunity to increase rates';
  } else if (variance > 10) {
    return 'Slightly above market average - maintain quality to justify pricing';
  } else if (variance < -10) {
    return 'Below market average - good value position';
  } else {
    return 'Competitively priced with market - monitor competitor changes';
  }
}
