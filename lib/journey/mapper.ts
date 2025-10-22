/**
 * Guest Journey Mapping
 *
 * End-to-end guest experience tracking and optimization using ML-based
 * journey analysis, touchpoint scoring, and bottleneck identification.
 *
 * Features:
 * - Multi-stage journey tracking (booking → post-stay)
 * - Touchpoint satisfaction scoring
 * - Pain point and bottleneck identification
 * - Cross-module integration
 * - Next best action prediction
 * - Journey optimization recommendations
 *
 * @module lib/journey/mapper
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export type JourneyStage =
  | 'booking'
  | 'pre-arrival'
  | 'arrival'
  | 'check-in'
  | 'in-stay'
  | 'check-out'
  | 'post-stay';

export type TouchpointChannel =
  | 'web'
  | 'mobile'
  | 'phone'
  | 'email'
  | 'in-person'
  | 'chat'
  | 'social';

export interface JourneyTouchpoint {
  stage: JourneyStage;
  timestamp: Date;
  action: string;
  channel: TouchpointChannel;
  satisfaction?: number; // 0-10 scale
  durationMinutes?: number;
  issues?: string[];
  metadata?: Record<string, any>;
}

export interface GuestJourney {
  guestId: string;
  reservationId: string;
  touchpoints: JourneyTouchpoint[];
  startDate: Date;
  endDate: Date;
  overallSatisfaction: number; // 0-100
  completionRate: number; // 0-100
  painPoints: PainPoint[];
  highlights: string[];
  stageScores: Record<JourneyStage, number>;
  totalDurationHours: number;
  channelDistribution: Record<TouchpointChannel, number>;
  recommendations: string[];
}

export interface PainPoint {
  stage: JourneyStage;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impactScore: number; // 0-100
  timestamp: Date;
  resolution?: {
    resolved: boolean;
    resolutionTime?: number; // minutes
    satisfaction?: number;
  };
}

export interface JourneyAnalytics {
  totalJourneys: number;
  averageSatisfaction: number;
  completionRate: number;
  stagePerformance: Record<JourneyStage, StageMetrics>;
  commonPainPoints: Array<{
    issue: string;
    frequency: number;
    averageImpact: number;
    stage: JourneyStage;
  }>;
  channelEffectiveness: Record<TouchpointChannel, ChannelMetrics>;
  bottlenecks: Bottleneck[];
  optimizationScore: number; // 0-100
  dropOffPoints: Array<{
    stage: JourneyStage;
    dropOffRate: number;
    reason?: string;
  }>;
}

export interface StageMetrics {
  averageSatisfaction: number;
  averageDuration: number;
  completionRate: number;
  issueCount: number;
  touchpointCount: number;
}

export interface ChannelMetrics {
  usageCount: number;
  averageSatisfaction: number;
  averageDuration: number;
  issueRate: number;
}

export interface Bottleneck {
  stage: JourneyStage;
  description: string;
  impact: number; // 0-100
  affectedJourneys: number;
  averageDelay: number; // minutes
  recommendations: string[];
}

export interface NextBestAction {
  action: string;
  channel: TouchpointChannel;
  timing: 'immediate' | 'within-hour' | 'within-day' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number; // 0-100
  expectedImpact: number; // 0-100
  reasoning: string;
}

export interface JourneyOptimization {
  currentScore: number;
  targetScore: number;
  improvements: Array<{
    stage: JourneyStage;
    currentPerformance: number;
    targetPerformance: number;
    actions: string[];
    estimatedImpact: number;
  }>;
  quickWins: string[];
  strategicInitiatives: string[];
  estimatedSatisfactionGain: number;
}

// ============================================================================
// Core Journey Mapping
// ============================================================================

/**
 * Maps a guest's complete journey from touchpoints
 */
export function mapGuestJourney(
  guestId: string,
  reservationId: string,
  touchpoints: JourneyTouchpoint[]
): GuestJourney {
  if (touchpoints.length === 0) {
    throw new Error('At least one touchpoint is required');
  }

  // Sort touchpoints by timestamp
  const sortedTouchpoints = [...touchpoints].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const startDate = sortedTouchpoints[0].timestamp;
  const endDate = sortedTouchpoints[sortedTouchpoints.length - 1].timestamp;

  // Calculate stage scores
  const stageScores = calculateStageScores(sortedTouchpoints);

  // Identify pain points
  const painPoints = identifyPainPoints(sortedTouchpoints);

  // Identify highlights
  const highlights = identifyHighlights(sortedTouchpoints);

  // Calculate overall satisfaction
  const overallSatisfaction = calculateOverallSatisfaction(
    sortedTouchpoints,
    painPoints
  );

  // Calculate completion rate (did they complete all expected stages?)
  const completionRate = calculateCompletionRate(sortedTouchpoints);

  // Calculate total duration
  const totalDurationHours =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  // Channel distribution
  const channelDistribution = calculateChannelDistribution(sortedTouchpoints);

  // Generate recommendations
  const recommendations = generateJourneyRecommendations(
    sortedTouchpoints,
    painPoints,
    stageScores
  );

  return {
    guestId,
    reservationId,
    touchpoints: sortedTouchpoints,
    startDate,
    endDate,
    overallSatisfaction,
    completionRate,
    painPoints,
    highlights,
    stageScores,
    totalDurationHours,
    channelDistribution,
    recommendations,
  };
}

/**
 * Analyzes multiple guest journeys for patterns and insights
 */
export function analyzeJourneys(journeys: GuestJourney[]): JourneyAnalytics {
  if (journeys.length === 0) {
    throw new Error('At least one journey is required for analysis');
  }

  const totalJourneys = journeys.length;

  // Average satisfaction
  const averageSatisfaction =
    journeys.reduce((sum, j) => sum + j.overallSatisfaction, 0) / totalJourneys;

  // Completion rate
  const completionRate =
    journeys.reduce((sum, j) => sum + j.completionRate, 0) / totalJourneys;

  // Stage performance
  const stagePerformance = analyzeStagePerformance(journeys);

  // Common pain points
  const commonPainPoints = analyzeCommonPainPoints(journeys);

  // Channel effectiveness
  const channelEffectiveness = analyzeChannelEffectiveness(journeys);

  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(journeys);

  // Calculate optimization score
  const optimizationScore = calculateOptimizationScore(
    averageSatisfaction,
    completionRate,
    bottlenecks,
    stagePerformance
  );

  // Identify drop-off points
  const dropOffPoints = identifyDropOffPoints(journeys);

  return {
    totalJourneys,
    averageSatisfaction,
    completionRate,
    stagePerformance,
    commonPainPoints,
    channelEffectiveness,
    bottlenecks,
    optimizationScore,
    dropOffPoints,
  };
}

/**
 * Predicts the next best action for an ongoing journey
 */
export function predictNextBestAction(
  journey: Partial<GuestJourney>,
  currentStage: JourneyStage,
  recentTouchpoints: JourneyTouchpoint[]
): NextBestAction {
  // Analyze recent satisfaction trends
  const satisfactionTrend = analyzeSatisfactionTrend(recentTouchpoints);

  // Check for unresolved issues
  const unresolvedIssues = recentTouchpoints.filter(
    (tp) => tp.issues && tp.issues.length > 0
  );

  // Determine action based on stage and context
  let action: string;
  let channel: TouchpointChannel;
  let timing: NextBestAction['timing'];
  let priority: NextBestAction['priority'];
  let expectedImpact: number;
  let reasoning: string;

  if (unresolvedIssues.length > 0) {
    // High priority: Address issues
    action = `Follow up on ${unresolvedIssues[0].issues![0]}`;
    channel = 'phone';
    timing = 'immediate';
    priority = 'urgent';
    expectedImpact = 85;
    reasoning = 'Unresolved issues detected that require immediate attention';
  } else if (satisfactionTrend < 6) {
    // Medium-low satisfaction
    action = 'Proactive check-in to ensure satisfaction';
    channel = currentStage === 'in-stay' ? 'in-person' : 'phone';
    timing = 'within-hour';
    priority = 'high';
    expectedImpact = 70;
    reasoning = 'Low satisfaction trend requires proactive intervention';
  } else if (currentStage === 'check-in') {
    action = 'Offer personalized welcome amenity';
    channel = 'in-person';
    timing = 'immediate';
    priority = 'medium';
    expectedImpact = 60;
    reasoning = 'Enhance check-in experience with personalized touch';
  } else if (currentStage === 'in-stay') {
    action = 'Send mid-stay satisfaction check-in';
    channel = 'mobile';
    timing = 'scheduled';
    priority = 'medium';
    expectedImpact = 55;
    reasoning = 'Regular touchpoint to ensure ongoing satisfaction';
  } else if (currentStage === 'check-out') {
    action = 'Request feedback and offer loyalty incentive';
    channel = 'email';
    timing = 'within-day';
    priority = 'medium';
    expectedImpact = 50;
    reasoning = 'Capture feedback while experience is fresh';
  } else {
    action = 'Send personalized follow-up';
    channel = 'email';
    timing = 'within-day';
    priority = 'low';
    expectedImpact = 40;
    reasoning = 'Maintain engagement post-stay';
  }

  // Calculate confidence based on data quality
  const confidence = Math.min(
    100,
    50 + recentTouchpoints.length * 10 + (journey.touchpoints?.length || 0) * 5
  );

  return {
    action,
    channel,
    timing,
    priority,
    confidence,
    expectedImpact,
    reasoning,
  };
}

/**
 * Generates comprehensive optimization recommendations
 */
export function optimizeJourney(
  analytics: JourneyAnalytics
): JourneyOptimization {
  const currentScore = analytics.optimizationScore;
  const targetScore = Math.min(100, currentScore + 20);

  const improvements = Object.entries(analytics.stagePerformance).map(
    ([stage, metrics]) => {
      const currentPerformance = metrics.averageSatisfaction;
      const targetPerformance = Math.min(100, currentPerformance + 15);

      const actions: string[] = [];

      if (metrics.averageDuration > 30 && stage !== 'in-stay') {
        actions.push(`Reduce ${stage} duration (currently ${metrics.averageDuration.toFixed(0)}min)`);
      }

      if (metrics.issueCount > analytics.totalJourneys * 0.2) {
        actions.push(`Address common issues in ${stage} (${metrics.issueCount} issues)`);
      }

      if (metrics.completionRate < 90) {
        actions.push(`Improve ${stage} completion rate (currently ${metrics.completionRate.toFixed(0)}%)`);
      }

      if (currentPerformance < 70) {
        actions.push(`Focus on improving ${stage} satisfaction (currently ${currentPerformance.toFixed(0)}%)`);
      }

      return {
        stage: stage as JourneyStage,
        currentPerformance,
        targetPerformance,
        actions,
        estimatedImpact: (targetPerformance - currentPerformance) * 0.8,
      };
    }
  );

  // Quick wins (high impact, low effort)
  const quickWins: string[] = [];

  if (analytics.averageSatisfaction < 80) {
    quickWins.push('Implement automated welcome messages');
    quickWins.push('Add self-service options for common requests');
  }

  analytics.bottlenecks.slice(0, 2).forEach((bottleneck) => {
    quickWins.push(`Address ${bottleneck.stage} bottleneck: ${bottleneck.description}`);
  });

  if (analytics.completionRate < 85) {
    quickWins.push('Simplify guest journey with guided workflows');
  }

  // Strategic initiatives (high impact, higher effort)
  const strategicInitiatives: string[] = [
    'Implement predictive analytics for proactive service',
    'Create personalized journey paths based on guest segments',
    'Integrate all touchpoints into unified guest profile',
  ];

  if (analytics.bottlenecks.length > 2) {
    strategicInitiatives.push('Redesign end-to-end journey to eliminate bottlenecks');
  }

  // Estimate satisfaction gain
  const estimatedSatisfactionGain = improvements.reduce(
    (sum, imp) => sum + imp.estimatedImpact,
    0
  ) / improvements.length;

  return {
    currentScore,
    targetScore,
    improvements,
    quickWins,
    strategicInitiatives,
    estimatedSatisfactionGain,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateStageScores(
  touchpoints: JourneyTouchpoint[]
): Record<JourneyStage, number> {
  const stages: JourneyStage[] = [
    'booking',
    'pre-arrival',
    'arrival',
    'check-in',
    'in-stay',
    'check-out',
    'post-stay',
  ];

  const scores: Record<JourneyStage, number> = {} as any;

  stages.forEach((stage) => {
    const stageTouchpoints = touchpoints.filter((tp) => tp.stage === stage);

    if (stageTouchpoints.length === 0) {
      scores[stage] = 0; // Stage not completed
    } else {
      const satisfactionSum = stageTouchpoints.reduce(
        (sum, tp) => sum + (tp.satisfaction || 7),
        0
      );
      const avgSatisfaction = satisfactionSum / stageTouchpoints.length;

      // Convert 0-10 scale to 0-100
      let score = (avgSatisfaction / 10) * 100;

      // Penalize for issues
      const issueCount = stageTouchpoints.reduce(
        (sum, tp) => sum + (tp.issues?.length || 0),
        0
      );
      score = Math.max(0, score - issueCount * 5);

      scores[stage] = Math.round(score);
    }
  });

  return scores;
}

function identifyPainPoints(touchpoints: JourneyTouchpoint[]): PainPoint[] {
  const painPoints: PainPoint[] = [];

  touchpoints.forEach((tp) => {
    if (tp.issues && tp.issues.length > 0) {
      tp.issues.forEach((issue) => {
        // Determine severity
        const satisfactionLevel = tp.satisfaction || 5;
        let severity: PainPoint['severity'];

        if (satisfactionLevel <= 3) {
          severity = 'critical';
        } else if (satisfactionLevel <= 5) {
          severity = 'high';
        } else if (satisfactionLevel <= 7) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        // Calculate impact score
        const impactScore = Math.max(0, 100 - satisfactionLevel * 10);

        painPoints.push({
          stage: tp.stage,
          issue,
          severity,
          impactScore,
          timestamp: tp.timestamp,
        });
      });
    }

    // Low satisfaction is also a pain point
    if (tp.satisfaction && tp.satisfaction < 5) {
      painPoints.push({
        stage: tp.stage,
        issue: `Low satisfaction during ${tp.action}`,
        severity: tp.satisfaction <= 3 ? 'critical' : 'high',
        impactScore: 100 - tp.satisfaction * 10,
        timestamp: tp.timestamp,
      });
    }
  });

  return painPoints;
}

function identifyHighlights(touchpoints: JourneyTouchpoint[]): string[] {
  const highlights: string[] = [];

  touchpoints.forEach((tp) => {
    if (tp.satisfaction && tp.satisfaction >= 9) {
      highlights.push(
        `Excellent ${tp.stage} experience: ${tp.action} (${tp.satisfaction}/10)`
      );
    }
  });

  return highlights;
}

function calculateOverallSatisfaction(
  touchpoints: JourneyTouchpoint[],
  painPoints: PainPoint[]
): number {
  const satisfactionSum = touchpoints.reduce(
    (sum, tp) => sum + (tp.satisfaction || 7),
    0
  );
  const avgSatisfaction = satisfactionSum / touchpoints.length;

  // Convert to 0-100 scale
  let score = (avgSatisfaction / 10) * 100;

  // Apply pain point penalty
  const criticalIssues = painPoints.filter((pp) => pp.severity === 'critical').length;
  const highIssues = painPoints.filter((pp) => pp.severity === 'high').length;

  score -= criticalIssues * 10;
  score -= highIssues * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateCompletionRate(touchpoints: JourneyTouchpoint[]): number {
  const expectedStages: JourneyStage[] = [
    'booking',
    'pre-arrival',
    'arrival',
    'check-in',
    'in-stay',
    'check-out',
    'post-stay',
  ];

  const completedStages = new Set(touchpoints.map((tp) => tp.stage));

  return Math.round((completedStages.size / expectedStages.length) * 100);
}

function calculateChannelDistribution(
  touchpoints: JourneyTouchpoint[]
): Record<TouchpointChannel, number> {
  const distribution: Record<TouchpointChannel, number> = {
    web: 0,
    mobile: 0,
    phone: 0,
    email: 0,
    'in-person': 0,
    chat: 0,
    social: 0,
  };

  touchpoints.forEach((tp) => {
    distribution[tp.channel]++;
  });

  return distribution;
}

function generateJourneyRecommendations(
  touchpoints: JourneyTouchpoint[],
  painPoints: PainPoint[],
  stageScores: Record<JourneyStage, number>
): string[] {
  const recommendations: string[] = [];

  // Address critical pain points
  const criticalPainPoints = painPoints.filter((pp) => pp.severity === 'critical');
  if (criticalPainPoints.length > 0) {
    recommendations.push(
      `Urgent: Address ${criticalPainPoints.length} critical issue(s) immediately`
    );
  }

  // Identify low-performing stages
  Object.entries(stageScores).forEach(([stage, score]) => {
    if (score < 60 && score > 0) {
      recommendations.push(`Improve ${stage} experience (current score: ${score}/100)`);
    }
  });

  // Check for long durations
  const longDurationTouchpoints = touchpoints.filter(
    (tp) => tp.durationMinutes && tp.durationMinutes > 30
  );
  if (longDurationTouchpoints.length > 0) {
    recommendations.push('Optimize processes to reduce wait times');
  }

  // Check for missing stages
  const completedStages = new Set(touchpoints.map((tp) => tp.stage));
  if (!completedStages.has('post-stay')) {
    recommendations.push('Implement post-stay follow-up for feedback and retention');
  }

  return recommendations;
}

function analyzeStagePerformance(
  journeys: GuestJourney[]
): Record<JourneyStage, StageMetrics> {
  const stages: JourneyStage[] = [
    'booking',
    'pre-arrival',
    'arrival',
    'check-in',
    'in-stay',
    'check-out',
    'post-stay',
  ];

  const performance: Record<JourneyStage, StageMetrics> = {} as any;

  stages.forEach((stage) => {
    const allStageTouchpoints = journeys.flatMap((j) =>
      j.touchpoints.filter((tp) => tp.stage === stage)
    );

    if (allStageTouchpoints.length === 0) {
      performance[stage] = {
        averageSatisfaction: 0,
        averageDuration: 0,
        completionRate: 0,
        issueCount: 0,
        touchpointCount: 0,
      };
      return;
    }

    const satisfactionSum = allStageTouchpoints.reduce(
      (sum, tp) => sum + (tp.satisfaction || 7),
      0
    );
    const averageSatisfaction = (satisfactionSum / allStageTouchpoints.length / 10) * 100;

    const durationSum = allStageTouchpoints.reduce(
      (sum, tp) => sum + (tp.durationMinutes || 0),
      0
    );
    const averageDuration = durationSum / allStageTouchpoints.length;

    const journeysWithStage = journeys.filter((j) =>
      j.touchpoints.some((tp) => tp.stage === stage)
    ).length;
    const completionRate = (journeysWithStage / journeys.length) * 100;

    const issueCount = allStageTouchpoints.reduce(
      (sum, tp) => sum + (tp.issues?.length || 0),
      0
    );

    performance[stage] = {
      averageSatisfaction: Math.round(averageSatisfaction),
      averageDuration: Math.round(averageDuration),
      completionRate: Math.round(completionRate),
      issueCount,
      touchpointCount: allStageTouchpoints.length,
    };
  });

  return performance;
}

function analyzeCommonPainPoints(
  journeys: GuestJourney[]
): Array<{
  issue: string;
  frequency: number;
  averageImpact: number;
  stage: JourneyStage;
}> {
  const issueMap = new Map<
    string,
    { count: number; totalImpact: number; stage: JourneyStage }
  >();

  journeys.forEach((journey) => {
    journey.painPoints.forEach((pp) => {
      const existing = issueMap.get(pp.issue);
      if (existing) {
        existing.count++;
        existing.totalImpact += pp.impactScore;
      } else {
        issueMap.set(pp.issue, {
          count: 1,
          totalImpact: pp.impactScore,
          stage: pp.stage,
        });
      }
    });
  });

  const painPoints = Array.from(issueMap.entries())
    .map(([issue, data]) => ({
      issue,
      frequency: data.count,
      averageImpact: Math.round(data.totalImpact / data.count),
      stage: data.stage,
    }))
    .sort((a, b) => b.frequency - a.frequency);

  return painPoints.slice(0, 10); // Top 10
}

function analyzeChannelEffectiveness(
  journeys: GuestJourney[]
): Record<TouchpointChannel, ChannelMetrics> {
  const channels: TouchpointChannel[] = [
    'web',
    'mobile',
    'phone',
    'email',
    'in-person',
    'chat',
    'social',
  ];

  const effectiveness: Record<TouchpointChannel, ChannelMetrics> = {} as any;

  channels.forEach((channel) => {
    const channelTouchpoints = journeys.flatMap((j) =>
      j.touchpoints.filter((tp) => tp.channel === channel)
    );

    if (channelTouchpoints.length === 0) {
      effectiveness[channel] = {
        usageCount: 0,
        averageSatisfaction: 0,
        averageDuration: 0,
        issueRate: 0,
      };
      return;
    }

    const satisfactionSum = channelTouchpoints.reduce(
      (sum, tp) => sum + (tp.satisfaction || 7),
      0
    );
    const averageSatisfaction = (satisfactionSum / channelTouchpoints.length / 10) * 100;

    const durationSum = channelTouchpoints.reduce(
      (sum, tp) => sum + (tp.durationMinutes || 0),
      0
    );
    const averageDuration = durationSum / channelTouchpoints.length;

    const issuesCount = channelTouchpoints.reduce(
      (sum, tp) => sum + (tp.issues?.length || 0),
      0
    );
    const issueRate = (issuesCount / channelTouchpoints.length) * 100;

    effectiveness[channel] = {
      usageCount: channelTouchpoints.length,
      averageSatisfaction: Math.round(averageSatisfaction),
      averageDuration: Math.round(averageDuration),
      issueRate: Math.round(issueRate),
    };
  });

  return effectiveness;
}

function identifyBottlenecks(journeys: GuestJourney[]): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  const stages: JourneyStage[] = [
    'booking',
    'pre-arrival',
    'arrival',
    'check-in',
    'in-stay',
    'check-out',
    'post-stay',
  ];

  stages.forEach((stage) => {
    const stageTouchpoints = journeys.flatMap((j) =>
      j.touchpoints.filter((tp) => tp.stage === stage)
    );

    if (stageTouchpoints.length === 0) return;

    const avgDuration =
      stageTouchpoints.reduce((sum, tp) => sum + (tp.durationMinutes || 0), 0) /
      stageTouchpoints.length;

    const issueCount = stageTouchpoints.reduce(
      (sum, tp) => sum + (tp.issues?.length || 0),
      0
    );

    const avgSatisfaction =
      stageTouchpoints.reduce((sum, tp) => sum + (tp.satisfaction || 7), 0) /
      stageTouchpoints.length;

    // Identify as bottleneck if:
    // 1. High average duration (>30 min for non-in-stay)
    // 2. High issue rate
    // 3. Low satisfaction
    const isBottleneck =
      (avgDuration > 30 && stage !== 'in-stay') ||
      issueCount > stageTouchpoints.length * 0.3 ||
      avgSatisfaction < 6;

    if (isBottleneck) {
      const affectedJourneys = journeys.filter((j) =>
        j.touchpoints.some(
          (tp) =>
            tp.stage === stage &&
            ((tp.durationMinutes && tp.durationMinutes > 30) ||
              (tp.issues && tp.issues.length > 0) ||
              (tp.satisfaction && tp.satisfaction < 6))
        )
      ).length;

      let description = '';
      if (avgDuration > 30 && stage !== 'in-stay') {
        description = `Long wait times (avg ${avgDuration.toFixed(0)}min)`;
      } else if (issueCount > stageTouchpoints.length * 0.3) {
        description = `High issue rate (${issueCount} issues)`;
      } else {
        description = `Low satisfaction (avg ${avgSatisfaction.toFixed(1)}/10)`;
      }

      const impact = Math.round(
        ((affectedJourneys / journeys.length) * 100 +
          Math.max(0, (avgDuration - 10) / 2) +
          (10 - avgSatisfaction) * 10) /
          3
      );

      const recommendations: string[] = [];
      if (avgDuration > 30) {
        recommendations.push('Streamline processes and reduce wait times');
        recommendations.push('Consider adding self-service options');
      }
      if (issueCount > 0) {
        recommendations.push('Address root causes of common issues');
        recommendations.push('Improve staff training and protocols');
      }
      if (avgSatisfaction < 6) {
        recommendations.push('Enhance guest experience touchpoints');
        recommendations.push('Implement proactive service recovery');
      }

      bottlenecks.push({
        stage,
        description,
        impact,
        affectedJourneys,
        averageDelay: Math.round(avgDuration),
        recommendations,
      });
    }
  });

  return bottlenecks.sort((a, b) => b.impact - a.impact);
}

function calculateOptimizationScore(
  averageSatisfaction: number,
  completionRate: number,
  bottlenecks: Bottleneck[],
  stagePerformance: Record<JourneyStage, StageMetrics>
): number {
  // Base score from satisfaction (0-50 points)
  let score = (averageSatisfaction / 100) * 50;

  // Completion rate (0-25 points)
  score += (completionRate / 100) * 25;

  // Penalize for bottlenecks (0-15 points deduction)
  const bottleneckPenalty = Math.min(15, bottlenecks.length * 5);
  score -= bottleneckPenalty;

  // Stage consistency (0-10 points)
  const stageScores = Object.values(stagePerformance).map((m) => m.averageSatisfaction);
  const stageVariance =
    stageScores.reduce((sum, s) => sum + Math.abs(s - averageSatisfaction), 0) /
    stageScores.length;
  const consistencyScore = Math.max(0, 10 - stageVariance / 10);
  score += consistencyScore;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function identifyDropOffPoints(
  journeys: GuestJourney[]
): Array<{ stage: JourneyStage; dropOffRate: number; reason?: string }> {
  const stages: JourneyStage[] = [
    'booking',
    'pre-arrival',
    'arrival',
    'check-in',
    'in-stay',
    'check-out',
    'post-stay',
  ];

  const dropOffPoints: Array<{
    stage: JourneyStage;
    dropOffRate: number;
    reason?: string;
  }> = [];

  stages.forEach((stage, index) => {
    if (index === stages.length - 1) return; // No drop-off after last stage

    const journeysReachingStage = journeys.filter((j) =>
      j.touchpoints.some((tp) => tp.stage === stage)
    ).length;

    const nextStage = stages[index + 1];
    const journeysReachingNextStage = journeys.filter((j) =>
      j.touchpoints.some((tp) => tp.stage === nextStage)
    ).length;

    const dropOffCount = journeysReachingStage - journeysReachingNextStage;
    const dropOffRate = (dropOffCount / journeysReachingStage) * 100;

    if (dropOffRate > 10) {
      // Significant drop-off
      // Analyze reasons
      const droppedJourneys = journeys.filter(
        (j) =>
          j.touchpoints.some((tp) => tp.stage === stage) &&
          !j.touchpoints.some((tp) => tp.stage === nextStage)
      );

      const commonIssues = droppedJourneys.flatMap((j) =>
        j.painPoints.filter((pp) => pp.stage === stage).map((pp) => pp.issue)
      );

      const mostCommonIssue = commonIssues.reduce((acc, issue) => {
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topIssue = Object.entries(mostCommonIssue).sort((a, b) => b[1] - a[1])[0];

      dropOffPoints.push({
        stage,
        dropOffRate: Math.round(dropOffRate),
        reason: topIssue ? topIssue[0] : 'Unknown',
      });
    }
  });

  return dropOffPoints;
}

function analyzeSatisfactionTrend(touchpoints: JourneyTouchpoint[]): number {
  if (touchpoints.length === 0) return 7;

  const recentTouchpoints = touchpoints.slice(-3); // Last 3 touchpoints
  const avgSatisfaction =
    recentTouchpoints.reduce((sum, tp) => sum + (tp.satisfaction || 7), 0) /
    recentTouchpoints.length;

  return avgSatisfaction;
}
