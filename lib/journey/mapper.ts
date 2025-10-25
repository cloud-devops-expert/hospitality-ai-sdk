/**
 * Guest Journey Mapping Module
 *
 * End-to-end guest journey tracking and optimization.
 * Maps touchpoints, identifies bottlenecks, and provides
 * personalization recommendations.
 *
 * Zero-cost local processing approach.
 */

// ============================================================================
// Types
// ============================================================================

export type JourneyStage =
  | 'awareness'
  | 'research'
  | 'booking'
  | 'pre-arrival'
  | 'arrival'
  | 'check-in'
  | 'in-stay'
  | 'service-interaction'
  | 'amenity-usage'
  | 'check-out'
  | 'post-stay';

export type TouchpointType =
  | 'website'
  | 'mobile-app'
  | 'phone'
  | 'email'
  | 'social-media'
  | 'in-person'
  | 'kiosk'
  | 'room-service'
  | 'concierge'
  | 'housekeeping'
  | 'front-desk'
  | 'restaurant'
  | 'amenity';

export interface Touchpoint {
  id: string;
  stage: JourneyStage;
  type: TouchpointType;
  timestamp: Date;
  duration: number; // seconds
  outcome: 'success' | 'partial' | 'failure' | 'abandoned';
  satisfaction?: number; // 1-5
  notes?: string;
  metadata?: Record<string, any>;
}

export interface GuestJourney {
  guestId: string;
  journeyId: string;
  startDate: Date;
  endDate?: Date;
  touchpoints: Touchpoint[];
  guestProfile?: GuestProfile;
  preferences?: string[];
}

export interface GuestProfile {
  guestType: 'business' | 'leisure' | 'family' | 'couple' | 'group';
  loyaltyTier?: 'none' | 'silver' | 'gold' | 'platinum';
  previousStays: number;
  averageSpend: number;
  preferredChannels: TouchpointType[];
}

export interface JourneyAnalysis {
  journeyId: string;
  overallScore: number; // 0-100
  stageScores: Map<JourneyStage, StageScore>;
  touchpointScores: Map<string, TouchpointScore>;
  bottlenecks: Bottleneck[];
  highlights: string[];
  painPoints: string[];
  recommendations: string[];
  completionRate: number; // percentage
  totalDuration: number; // minutes
}

export interface StageScore {
  stage: JourneyStage;
  score: number; // 0-100
  touchpointCount: number;
  averageDuration: number;
  successRate: number; // percentage
  satisfactionAverage?: number;
  issues: string[];
}

export interface TouchpointScore {
  touchpointId: string;
  type: TouchpointType;
  score: number; // 0-100
  efficiency: number; // 0-100
  satisfaction: number; // 0-100
  impact: 'high' | 'medium' | 'low';
}

export interface Bottleneck {
  location: string;
  stage: JourneyStage;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  impactedGuests: number;
  averageDelay: number; // minutes
  recommendation: string;
}

export interface JourneyOptimization {
  currentScore: number;
  potentialScore: number;
  improvements: Improvement[];
  estimatedImpact: {
    satisfactionIncrease: number; // percentage
    timeReduction: number; // minutes
    conversionIncrease: number; // percentage
  };
  prioritizedActions: string[];
}

export interface Improvement {
  area: string;
  stage: JourneyStage;
  currentState: string;
  proposedState: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  priority: number; // 1-10
}

export interface PersonalizationRecommendation {
  guestId: string;
  recommendations: Array<{
    type: string;
    description: string;
    stage: JourneyStage;
    confidence: number; // 0-100
    expectedValue: number; // revenue impact
  }>;
  preferredChannels: TouchpointType[];
  optimalTiming: Map<JourneyStage, number>; // hours from start
}

export interface JourneyBenchmark {
  totalJourneys: number;
  averageScore: number;
  completionRate: number;
  averageDuration: number;
  topPerformingStages: JourneyStage[];
  underperformingStages: JourneyStage[];
  industryComparison: {
    score: number;
    percentile: number;
  };
}

// ============================================================================
// Core Journey Functions
// ============================================================================

/**
 * Analyzes a guest journey and provides comprehensive scoring
 */
export function analyzeGuestJourney(journey: GuestJourney): JourneyAnalysis {
  const touchpoints = journey.touchpoints;

  if (touchpoints.length === 0) {
    throw new Error('Journey must have at least one touchpoint');
  }

  // Calculate stage scores
  const stageScores = calculateStageScores(touchpoints);

  // Calculate touchpoint scores
  const touchpointScores = calculateTouchpointScores(touchpoints);

  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(touchpoints, stageScores);

  // Calculate overall score
  const overallScore = calculateOverallScore(stageScores, touchpointScores);

  // Identify highlights and pain points
  const highlights = identifyHighlights(touchpoints, stageScores);
  const painPoints = identifyPainPoints(touchpoints, stageScores, bottlenecks);

  // Generate recommendations
  const recommendations = generateRecommendations(
    stageScores,
    bottlenecks,
    journey.guestProfile
  );

  // Calculate completion rate
  const completionRate = calculateCompletionRate(touchpoints);

  // Calculate total duration
  const totalDuration = calculateTotalDuration(journey);

  return {
    journeyId: journey.journeyId,
    overallScore,
    stageScores,
    touchpointScores,
    bottlenecks,
    highlights,
    painPoints,
    recommendations,
    completionRate,
    totalDuration,
  };
}

/**
 * Optimizes a guest journey based on analysis
 */
export function optimizeJourney(
  journey: GuestJourney,
  analysis: JourneyAnalysis
): JourneyOptimization {
  const currentScore = analysis.overallScore;

  // Identify improvement opportunities
  const improvements = identifyImprovements(analysis, journey.guestProfile);

  // Calculate potential score with improvements
  const potentialScore = Math.min(
    100,
    currentScore + improvements.reduce((sum, imp) => {
      const impactValue = { low: 3, medium: 7, high: 15 };
      return sum + impactValue[imp.impact];
    }, 0)
  );

  // Estimate impact
  const estimatedImpact = {
    satisfactionIncrease: Math.round((potentialScore - currentScore) * 0.8),
    timeReduction: improvements
      .filter(imp => imp.area.includes('efficiency'))
      .reduce((sum, imp) => sum + 5, 0),
    conversionIncrease: improvements
      .filter(imp => imp.stage === 'booking')
      .reduce((sum, imp) => sum + 2, 0),
  };

  // Prioritize actions
  const prioritizedActions = improvements
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map(imp => `${imp.area}: ${imp.proposedState}`);

  return {
    currentScore,
    potentialScore,
    improvements,
    estimatedImpact,
    prioritizedActions,
  };
}

/**
 * Generates personalized recommendations based on guest profile and journey
 */
export function generatePersonalization(
  journey: GuestJourney,
  analysis: JourneyAnalysis
): PersonalizationRecommendation {
  const profile = journey.guestProfile;
  const recommendations: PersonalizationRecommendation['recommendations'] = [];

  // Business traveler recommendations
  if (profile?.guestType === 'business') {
    recommendations.push({
      type: 'express-checkin',
      description: 'Offer mobile check-in to skip front desk',
      stage: 'check-in',
      confidence: 90,
      expectedValue: 0,
    });

    recommendations.push({
      type: 'workspace',
      description: 'Highlight business center and meeting rooms',
      stage: 'in-stay',
      confidence: 85,
      expectedValue: 50,
    });
  }

  // Family recommendations
  if (profile?.guestType === 'family') {
    recommendations.push({
      type: 'family-amenities',
      description: 'Promote kids club and family-friendly activities',
      stage: 'pre-arrival',
      confidence: 88,
      expectedValue: 100,
    });

    recommendations.push({
      type: 'connecting-rooms',
      description: 'Suggest connecting rooms or suites',
      stage: 'booking',
      confidence: 92,
      expectedValue: 150,
    });
  }

  // Loyalty member recommendations
  if (profile?.loyaltyTier && profile.loyaltyTier !== 'none') {
    const tierValue = {
      silver: 50,
      gold: 100,
      platinum: 200,
    };

    recommendations.push({
      type: 'loyalty-perks',
      description: `Emphasize ${profile.loyaltyTier} tier benefits`,
      stage: 'pre-arrival',
      confidence: 95,
      expectedValue: tierValue[profile.loyaltyTier] || 0,
    });
  }

  // Based on pain points
  analysis.painPoints.forEach(pain => {
    if (pain.includes('wait time')) {
      recommendations.push({
        type: 'reduce-wait',
        description: 'Offer priority service or self-service options',
        stage: 'check-in',
        confidence: 80,
        expectedValue: 25,
      });
    }
  });

  // Determine preferred channels
  const channelCounts = new Map<TouchpointType, number>();
  journey.touchpoints.forEach(tp => {
    channelCounts.set(tp.type, (channelCounts.get(tp.type) || 0) + 1);
  });

  const preferredChannels = Array.from(channelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  // Calculate optimal timing for each stage
  const optimalTiming = new Map<JourneyStage, number>();
  const stages: JourneyStage[] = ['pre-arrival', 'check-in', 'in-stay', 'check-out'];

  stages.forEach((stage, index) => {
    optimalTiming.set(stage, index * 24); // Space out by days
  });

  return {
    guestId: journey.guestId,
    recommendations,
    preferredChannels,
    optimalTiming,
  };
}

/**
 * Benchmarks journey performance against historical data
 */
export function benchmarkJourneys(
  journeys: GuestJourney[],
  targetJourney?: GuestJourney
): JourneyBenchmark {
  if (journeys.length === 0) {
    throw new Error('At least one journey is required for benchmarking');
  }

  const analyses = journeys.map(j => analyzeGuestJourney(j));

  const totalJourneys = journeys.length;
  const averageScore = Math.round(
    analyses.reduce((sum, a) => sum + a.overallScore, 0) / totalJourneys
  );

  const averageCompletion = Math.round(
    analyses.reduce((sum, a) => sum + a.completionRate, 0) / totalJourneys
  );

  const averageDuration = Math.round(
    analyses.reduce((sum, a) => sum + a.totalDuration, 0) / totalJourneys
  );

  // Identify top and bottom performing stages
  const stagePerformance = new Map<JourneyStage, number[]>();

  analyses.forEach(analysis => {
    analysis.stageScores.forEach((score, stage) => {
      if (!stagePerformance.has(stage)) {
        stagePerformance.set(stage, []);
      }
      stagePerformance.get(stage)!.push(score.score);
    });
  });

  const stageAverages = Array.from(stagePerformance.entries()).map(
    ([stage, scores]) => ({
      stage,
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    })
  );

  const topPerformingStages = stageAverages
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)
    .map(s => s.stage);

  const underperformingStages = stageAverages
    .sort((a, b) => a.average - b.average)
    .slice(0, 3)
    .map(s => s.stage);

  // Industry comparison (simulated - would integrate with external data)
  const industryComparison = {
    score: averageScore,
    percentile: Math.min(95, Math.max(5, Math.round(averageScore * 0.9))),
  };

  return {
    totalJourneys,
    averageScore,
    completionRate: averageCompletion,
    averageDuration,
    topPerformingStages,
    underperformingStages,
    industryComparison,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateStageScores(touchpoints: Touchpoint[]): Map<JourneyStage, StageScore> {
  const stageMap = new Map<JourneyStage, Touchpoint[]>();

  // Group touchpoints by stage
  touchpoints.forEach(tp => {
    if (!stageMap.has(tp.stage)) {
      stageMap.set(tp.stage, []);
    }
    stageMap.get(tp.stage)!.push(tp);
  });

  const stageScores = new Map<JourneyStage, StageScore>();

  stageMap.forEach((tps, stage) => {
    const successCount = tps.filter(tp => tp.outcome === 'success').length;
    const successRate = (successCount / tps.length) * 100;

    const avgDuration = tps.reduce((sum, tp) => sum + tp.duration, 0) / tps.length;

    const satisfactions = tps.filter(tp => tp.satisfaction !== undefined).map(tp => tp.satisfaction!);
    const satisfactionAverage = satisfactions.length > 0
      ? satisfactions.reduce((sum, s) => sum + s, 0) / satisfactions.length
      : undefined;

    // Calculate stage score
    let score = successRate * 0.6;
    if (satisfactionAverage) {
      score += (satisfactionAverage / 5) * 40;
    } else {
      score += 30; // Default if no satisfaction data
    }

    // Identify issues
    const issues: string[] = [];
    if (successRate < 80) {
      issues.push(`Low success rate: ${Math.round(successRate)}%`);
    }
    if (avgDuration > 600) {
      // 10 minutes
      issues.push(`Long average duration: ${Math.round(avgDuration / 60)} minutes`);
    }
    if (satisfactionAverage && satisfactionAverage < 3.5) {
      issues.push(`Low satisfaction: ${satisfactionAverage.toFixed(1)}/5`);
    }

    stageScores.set(stage, {
      stage,
      score: Math.round(score),
      touchpointCount: tps.length,
      averageDuration: Math.round(avgDuration),
      successRate: Math.round(successRate),
      satisfactionAverage,
      issues,
    });
  });

  return stageScores;
}

function calculateTouchpointScores(
  touchpoints: Touchpoint[]
): Map<string, TouchpointScore> {
  const scores = new Map<string, TouchpointScore>();

  touchpoints.forEach(tp => {
    const efficiency = tp.outcome === 'success' ? 100 :
      tp.outcome === 'partial' ? 60 :
      tp.outcome === 'failure' ? 20 : 0;

    const satisfaction = tp.satisfaction ? (tp.satisfaction / 5) * 100 : 70;

    const score = Math.round((efficiency * 0.6) + (satisfaction * 0.4));

    const impact: TouchpointScore['impact'] =
      score >= 80 ? 'high' :
      score >= 60 ? 'medium' : 'low';

    scores.set(tp.id, {
      touchpointId: tp.id,
      type: tp.type,
      score,
      efficiency,
      satisfaction,
      impact,
    });
  });

  return scores;
}

function identifyBottlenecks(
  touchpoints: Touchpoint[],
  stageScores: Map<JourneyStage, StageScore>
): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  // Check for slow stages
  stageScores.forEach((score, stage) => {
    if (score.averageDuration > 600 && score.successRate < 90) {
      bottlenecks.push({
        location: stage,
        stage,
        severity: score.successRate < 70 ? 'major' : 'moderate',
        description: `${stage} stage has long duration (${Math.round(score.averageDuration / 60)} min) and ${Math.round(score.successRate)}% success rate`,
        impactedGuests: Math.round(score.touchpointCount * ((100 - score.successRate) / 100)),
        averageDelay: Math.round(score.averageDuration / 60),
        recommendation: `Streamline ${stage} process and add self-service options`,
      });
    }
  });

  // Check for failed touchpoints
  const failures = touchpoints.filter(tp => tp.outcome === 'failure' || tp.outcome === 'abandoned');

  if (failures.length > touchpoints.length * 0.1) {
    bottlenecks.push({
      location: 'multiple touchpoints',
      stage: failures[0]?.stage || 'booking',
      severity: 'moderate',
      description: `${failures.length} failed or abandoned touchpoints detected`,
      impactedGuests: failures.length,
      averageDelay: 0,
      recommendation: 'Review and improve problematic touchpoints',
    });
  }

  return bottlenecks;
}

function calculateOverallScore(
  stageScores: Map<JourneyStage, StageScore>,
  touchpointScores: Map<string, TouchpointScore>
): number {
  const stageAverage = Array.from(stageScores.values())
    .reduce((sum, s) => sum + s.score, 0) / stageScores.size;

  const touchpointAverage = Array.from(touchpointScores.values())
    .reduce((sum, s) => sum + s.score, 0) / touchpointScores.size;

  return Math.round((stageAverage * 0.6) + (touchpointAverage * 0.4));
}

function identifyHighlights(
  touchpoints: Touchpoint[],
  stageScores: Map<JourneyStage, StageScore>
): string[] {
  const highlights: string[] = [];

  // High scoring stages
  stageScores.forEach((score, stage) => {
    if (score.score >= 90) {
      highlights.push(`Excellent ${stage} experience (${score.score}/100)`);
    }
    if (score.satisfactionAverage && score.satisfactionAverage >= 4.5) {
      highlights.push(`Outstanding satisfaction in ${stage} (${score.satisfactionAverage.toFixed(1)}/5)`);
    }
  });

  // Perfect touchpoints
  const perfect = touchpoints.filter(tp => tp.outcome === 'success' && tp.satisfaction === 5);
  if (perfect.length > touchpoints.length * 0.3) {
    highlights.push(`${perfect.length} touchpoints with perfect satisfaction`);
  }

  return highlights;
}

function identifyPainPoints(
  touchpoints: Touchpoint[],
  stageScores: Map<JourneyStage, StageScore>,
  bottlenecks: Bottleneck[]
): string[] {
  const painPoints: string[] = [];

  // Low scoring stages
  stageScores.forEach((score, stage) => {
    if (score.score < 60) {
      painPoints.push(`${stage} needs improvement (${score.score}/100)`);
    }
    score.issues.forEach(issue => painPoints.push(`${stage}: ${issue}`));
  });

  // Bottlenecks
  bottlenecks.forEach(b => {
    if (b.severity === 'major' || b.severity === 'critical') {
      painPoints.push(b.description);
    }
  });

  return painPoints;
}

function generateRecommendations(
  stageScores: Map<JourneyStage, StageScore>,
  bottlenecks: Bottleneck[],
  profile?: GuestProfile
): string[] {
  const recommendations: string[] = [];

  // Address bottlenecks
  bottlenecks.forEach(b => {
    recommendations.push(b.recommendation);
  });

  // Improve low-scoring stages
  stageScores.forEach((score, stage) => {
    if (score.score < 70) {
      if (score.successRate < 80) {
        recommendations.push(`Improve ${stage} success rate through better UX and support`);
      }
      if (score.satisfactionAverage && score.satisfactionAverage < 3.5) {
        recommendations.push(`Enhance ${stage} experience to boost satisfaction`);
      }
    }
  });

  // Profile-specific recommendations
  if (profile?.guestType === 'business') {
    recommendations.push('Optimize for speed and efficiency for business travelers');
  }
  if ((profile?.previousStays ?? 0) > 5) {
    recommendations.push('Implement loyalty recognition throughout journey');
  }

  return recommendations.slice(0, 10); // Limit to top 10
}

function calculateCompletionRate(touchpoints: Touchpoint[]): number {
  const expectedStages: JourneyStage[] = [
    'booking',
    'pre-arrival',
    'check-in',
    'in-stay',
    'check-out',
    'post-stay',
  ];

  const completedStages = new Set(touchpoints.map(tp => tp.stage));
  const completed = expectedStages.filter(stage => completedStages.has(stage)).length;

  return Math.round((completed / expectedStages.length) * 100);
}

function calculateTotalDuration(journey: GuestJourney): number {
  if (journey.touchpoints.length === 0) return 0;

  const start = journey.startDate.getTime();
  const end = journey.endDate
    ? journey.endDate.getTime()
    : journey.touchpoints[journey.touchpoints.length - 1].timestamp.getTime();

  return Math.round((end - start) / 1000 / 60); // minutes
}

function identifyImprovements(
  analysis: JourneyAnalysis,
  profile?: GuestProfile
): Improvement[] {
  const improvements: Improvement[] = [];

  // Address low-scoring stages
  analysis.stageScores.forEach((score, stage) => {
    if (score.score < 70) {
      improvements.push({
        area: `${stage} experience`,
        stage,
        currentState: `Score: ${score.score}/100`,
        proposedState: 'Implement streamlined process and better UX',
        effort: 'medium',
        impact: score.score < 50 ? 'high' : 'medium',
        priority: score.score < 50 ? 9 : 6,
      });
    }
  });

  // Address bottlenecks
  analysis.bottlenecks.forEach(b => {
    improvements.push({
      area: `${b.location} efficiency`,
      stage: b.stage,
      currentState: b.description,
      proposedState: b.recommendation,
      effort: b.severity === 'critical' ? 'high' : 'medium',
      impact: b.severity === 'critical' || b.severity === 'major' ? 'high' : 'medium',
      priority: b.severity === 'critical' ? 10 : 7,
    });
  });

  return improvements.sort((a, b) => b.priority - a.priority);
}
