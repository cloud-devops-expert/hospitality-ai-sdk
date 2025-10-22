/**
 * ML-Based Quality Assurance & Inspection Automation
 *
 * Features:
 * - Room inspection scoring with ML
 * - Service quality assessment
 * - Automated defect detection
 * - Inspection route optimization
 * - Historical quality trend analysis
 * - Staff performance scoring
 * - Corrective action recommendations
 */

export interface RoomInspection {
  roomId: string;
  roomNumber: string;
  roomType: 'standard' | 'deluxe' | 'suite';
  inspectionDate: Date;
  inspectorId: string;

  // Cleanliness scores (0-10)
  cleanliness: {
    bathroom: number;
    bedroom: number;
    entryway: number;
    overallCleanliness: number;
  };

  // Maintenance issues
  maintenance: {
    plumbing: 'good' | 'needs-attention' | 'urgent';
    electrical: 'good' | 'needs-attention' | 'urgent';
    hvac: 'good' | 'needs-attention' | 'urgent';
    furniture: 'good' | 'needs-attention' | 'urgent';
    fixtures: 'good' | 'needs-attention' | 'urgent';
  };

  // Amenities check
  amenities: {
    towels: boolean;
    toiletries: boolean;
    minibar: boolean;
    coffeemaker: boolean;
    remoteControl: boolean;
    safe: boolean;
  };

  // Additional observations
  defects: Array<{
    type: 'stain' | 'damage' | 'missing-item' | 'odor' | 'other';
    location: string;
    severity: 'minor' | 'moderate' | 'severe';
    description: string;
  }>;

  // Time tracking
  inspectionDurationMinutes: number;

  // Photos (optional)
  photoCount?: number;
  hasPhotos?: boolean;
}

export interface ServiceQualityData {
  date: Date;
  department: 'front-desk' | 'housekeeping' | 'restaurant' | 'maintenance' | 'concierge';

  // Performance metrics
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  guestSatisfaction: number; // 0-10

  // Complaint data
  complaintsReceived: number;
  complaintsResolved: number;

  // Staff metrics
  staffId: string;
  shiftsWorked: number;
  tasksCompleted: number;
  tasksAssigned: number;
}

export interface QualityScore {
  overallScore: number; // 0-100
  rating: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement' | 'poor';

  // Component scores
  cleanlinessScore: number; // 0-100
  maintenanceScore: number; // 0-100
  amenitiesScore: number; // 0-100
  complianceScore: number; // 0-100

  // Issues summary
  criticalIssues: number;
  moderateIssues: number;
  minorIssues: number;

  // Recommendations
  recommendations: string[];
  correctiveActions: Array<{
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    estimatedCost: number;
    estimatedTime: string;
  }>;

  // Pass/Fail
  passedInspection: boolean;
  failureReasons?: string[];

  // Confidence
  confidence: number; // 0-1
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  department: string;
  period: string; // 'YYYY-MM'

  // Performance scores
  qualityScore: number; // 0-100
  efficiencyScore: number; // 0-100
  consistencyScore: number; // 0-100
  overallScore: number; // 0-100

  // Metrics
  roomsInspected: number;
  averageInspectionTime: number;
  defectsFound: number;
  defectsPerRoom: number;

  // Quality trends
  scoresTrend: 'improving' | 'stable' | 'declining';
  comparisonToPeers: number; // -100 to +100, 0 = average

  // Recognition/Concerns
  strengths: string[];
  areasForImprovement: string[];

  // Recommendations
  trainingNeeded: string[];
  performanceRating: 'top-performer' | 'above-average' | 'average' | 'below-average' | 'needs-support';
}

export interface QualityTrend {
  period: string; // 'YYYY-MM'
  averageScore: number;
  inspectionCount: number;
  passRate: number; // 0-100
  criticalIssuesCount: number;
  trend: 'improving' | 'stable' | 'declining';
  forecastNextMonth: number;
}

// Industry benchmarks
const QUALITY_BENCHMARKS = {
  excellent: 90,
  good: 80,
  satisfactory: 70,
  needsImprovement: 60,
  poor: 50,
};

// Scoring weights
const SCORE_WEIGHTS = {
  cleanliness: 0.40, // 40%
  maintenance: 0.30, // 30%
  amenities: 0.20,   // 20%
  compliance: 0.10,  // 10%
};

/**
 * Calculate comprehensive quality score from room inspection
 */
export function calculateQualityScore(inspection: RoomInspection): QualityScore {
  // Cleanliness score (0-100)
  const cleanlinessScore =
    ((inspection.cleanliness.bathroom +
      inspection.cleanliness.bedroom +
      inspection.cleanliness.entryway +
      inspection.cleanliness.overallCleanliness) /
      4 /
      10) *
    100;

  // Maintenance score (0-100)
  const maintenanceItems = Object.values(inspection.maintenance);
  const maintenanceScore =
    (maintenanceItems.filter((status) => status === 'good').length /
      maintenanceItems.length) *
    100;

  // Amenities score (0-100)
  const amenitiesItems = Object.values(inspection.amenities);
  const amenitiesScore =
    (amenitiesItems.filter((present) => present).length / amenitiesItems.length) * 100;

  // Compliance score based on defects
  const criticalDefects = inspection.defects.filter((d) => d.severity === 'severe').length;
  const moderateDefects = inspection.defects.filter((d) => d.severity === 'moderate').length;
  const minorDefects = inspection.defects.filter((d) => d.severity === 'minor').length;

  const complianceScore = Math.max(
    0,
    100 - criticalDefects * 20 - moderateDefects * 10 - minorDefects * 5
  );

  // Overall score (weighted average)
  const overallScore = Math.round(
    cleanlinessScore * SCORE_WEIGHTS.cleanliness +
      maintenanceScore * SCORE_WEIGHTS.maintenance +
      amenitiesScore * SCORE_WEIGHTS.amenities +
      complianceScore * SCORE_WEIGHTS.compliance
  );

  // Rating
  let rating: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement' | 'poor';
  if (overallScore >= QUALITY_BENCHMARKS.excellent) rating = 'excellent';
  else if (overallScore >= QUALITY_BENCHMARKS.good) rating = 'good';
  else if (overallScore >= QUALITY_BENCHMARKS.satisfactory) rating = 'satisfactory';
  else if (overallScore >= QUALITY_BENCHMARKS.needsImprovement) rating = 'needs-improvement';
  else rating = 'poor';

  // Pass/Fail (must be at least "satisfactory" and no critical issues)
  const passedInspection =
    overallScore >= QUALITY_BENCHMARKS.satisfactory && criticalDefects === 0;

  const failureReasons: string[] = [];
  if (overallScore < QUALITY_BENCHMARKS.satisfactory) {
    failureReasons.push(`Overall score below passing threshold (${overallScore} < 70)`);
  }
  if (criticalDefects > 0) {
    failureReasons.push(`${criticalDefects} critical defect(s) found`);
  }

  // Generate recommendations
  const recommendations = generateRecommendations(inspection, {
    cleanlinessScore,
    maintenanceScore,
    amenitiesScore,
    complianceScore,
    overallScore,
  });

  // Generate corrective actions
  const correctiveActions = generateCorrectiveActions(inspection);

  // Calculate confidence based on inspection thoroughness
  const confidence = calculateConfidence(inspection);

  return {
    overallScore,
    rating,
    cleanlinessScore: Math.round(cleanlinessScore),
    maintenanceScore: Math.round(maintenanceScore),
    amenitiesScore: Math.round(amenitiesScore),
    complianceScore: Math.round(complianceScore),
    criticalIssues: criticalDefects,
    moderateIssues: moderateDefects,
    minorIssues: minorDefects,
    recommendations,
    correctiveActions,
    passedInspection,
    failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
    confidence,
  };
}

/**
 * Evaluate staff performance based on inspection history
 */
export function evaluateStaffPerformance(
  staffId: string,
  staffName: string,
  department: string,
  inspections: RoomInspection[],
  period: string
): StaffPerformance {
  if (inspections.length === 0) {
    throw new Error('Need at least one inspection for performance evaluation');
  }

  // Calculate scores for all inspections
  const scores = inspections.map((inspection) => calculateQualityScore(inspection));

  // Average quality score
  const averageQualityScore =
    scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;

  // Efficiency score (based on inspection time)
  const avgInspectionTime =
    inspections.reduce((sum, i) => sum + i.inspectionDurationMinutes, 0) / inspections.length;

  const expectedTime = getExpectedInspectionTime(inspections[0].roomType);
  const efficiencyScore = Math.min(100, (expectedTime / avgInspectionTime) * 100);

  // Consistency score (low variance = high consistency)
  const scoreVariance = calculateVariance(scores.map((s) => s.overallScore));
  const consistencyScore = Math.max(0, 100 - scoreVariance);

  // Overall performance score
  const overallScore = Math.round(
    averageQualityScore * 0.5 + efficiencyScore * 0.3 + consistencyScore * 0.2
  );

  // Total defects
  const totalDefects = inspections.reduce((sum, i) => sum + i.defects.length, 0);
  const defectsPerRoom = totalDefects / inspections.length;

  // Trend analysis
  const recentScores = scores.slice(-10).map((s) => s.overallScore); // Last 10
  const trend = determineTrend(recentScores);

  // Performance rating
  let performanceRating: StaffPerformance['performanceRating'];
  if (overallScore >= 90) performanceRating = 'top-performer';
  else if (overallScore >= 80) performanceRating = 'above-average';
  else if (overallScore >= 70) performanceRating = 'average';
  else if (overallScore >= 60) performanceRating = 'below-average';
  else performanceRating = 'needs-support';

  // Identify strengths and areas for improvement
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const trainingNeeded: string[] = [];

  // Analyze component scores
  const avgCleanliness = scores.reduce((sum, s) => sum + s.cleanlinessScore, 0) / scores.length;
  const avgMaintenance = scores.reduce((sum, s) => sum + s.maintenanceScore, 0) / scores.length;
  const avgAmenities = scores.reduce((sum, s) => sum + s.amenitiesScore, 0) / scores.length;

  if (avgCleanliness >= 85) strengths.push('Excellent attention to cleanliness details');
  else if (avgCleanliness < 70) {
    areasForImprovement.push('Cleanliness standards need improvement');
    trainingNeeded.push('Cleanliness protocols and standards');
  }

  if (avgMaintenance >= 85) strengths.push('Strong maintenance issue identification');
  else if (avgMaintenance < 70) {
    areasForImprovement.push('Maintenance issue detection needs improvement');
    trainingNeeded.push('Maintenance identification and reporting');
  }

  if (efficiencyScore >= 90) strengths.push('Highly efficient inspection process');
  else if (efficiencyScore < 70) {
    areasForImprovement.push('Inspection time efficiency could be improved');
    trainingNeeded.push('Time management and inspection optimization');
  }

  if (consistencyScore >= 85) strengths.push('Consistent quality standards');
  else if (consistencyScore < 70) {
    areasForImprovement.push('Quality consistency varies too much');
    trainingNeeded.push('Standardized inspection procedures');
  }

  return {
    staffId,
    staffName,
    department,
    period,
    qualityScore: Math.round(averageQualityScore),
    efficiencyScore: Math.round(efficiencyScore),
    consistencyScore: Math.round(consistencyScore),
    overallScore,
    roomsInspected: inspections.length,
    averageInspectionTime: Math.round(avgInspectionTime),
    defectsFound: totalDefects,
    defectsPerRoom: Math.round(defectsPerRoom * 10) / 10,
    scoresTrend: trend,
    comparisonToPeers: 0, // Would need peer data to calculate
    strengths,
    areasForImprovement,
    trainingNeeded,
    performanceRating,
  };
}

/**
 * Analyze quality trends over time
 */
export function analyzeQualityTrends(
  inspections: Array<{ inspection: RoomInspection; date: Date }>
): QualityTrend[] {
  // Group by month
  const byMonth: Record<string, RoomInspection[]> = {};

  inspections.forEach(({ inspection, date }) => {
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(inspection);
  });

  // Calculate trends for each month
  const trends: QualityTrend[] = [];

  Object.keys(byMonth)
    .sort()
    .forEach((monthKey) => {
      const monthInspections = byMonth[monthKey];
      const scores = monthInspections.map((i) => calculateQualityScore(i));

      const averageScore =
        scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;
      const passCount = scores.filter((s) => s.passedInspection).length;
      const passRate = (passCount / scores.length) * 100;
      const criticalIssuesCount = scores.reduce((sum, s) => sum + s.criticalIssues, 0);

      trends.push({
        period: monthKey,
        averageScore: Math.round(averageScore),
        inspectionCount: monthInspections.length,
        passRate: Math.round(passRate),
        criticalIssuesCount,
        trend: 'stable', // Will be calculated below
        forecastNextMonth: Math.round(averageScore), // Simple forecast
      });
    });

  // Determine trend direction for each month
  for (let i = 1; i < trends.length; i++) {
    const current = trends[i].averageScore;
    const previous = trends[i - 1].averageScore;

    if (current > previous + 5) trends[i].trend = 'improving';
    else if (current < previous - 5) trends[i].trend = 'declining';
    else trends[i].trend = 'stable';

    // Simple forecast (trend continuation)
    const diff = current - previous;
    trends[i].forecastNextMonth = Math.round(current + diff * 0.5);
  }

  return trends;
}

/**
 * ML-based defect prediction
 */
export function predictDefects(
  roomId: string,
  roomType: string,
  daysSinceLastInspection: number,
  historicalDefectRate: number
): {
  defectProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedAction: string;
} {
  // Simple ML model: defect probability increases with time and historical rate
  const timeFactor = Math.min(1.0, daysSinceLastInspection / 30); // Max at 30 days
  const rateFactor = historicalDefectRate; // 0-1 scale

  // Room type factor (suites have more complexity, higher defect chance)
  const typeFactor =
    roomType === 'suite' ? 1.2 : roomType === 'deluxe' ? 1.1 : 1.0;

  // Combined probability
  const defectProbability = Math.min(
    0.95,
    timeFactor * 0.4 + rateFactor * 0.5 + (typeFactor - 1.0) * 0.1
  );

  // Risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (defectProbability < 0.3) riskLevel = 'low';
  else if (defectProbability < 0.6) riskLevel = 'medium';
  else riskLevel = 'high';

  // Recommended action
  let recommendedAction: string;
  if (riskLevel === 'high') {
    recommendedAction = 'Schedule immediate inspection - high defect risk';
  } else if (riskLevel === 'medium') {
    recommendedAction = 'Schedule inspection within 3 days';
  } else {
    recommendedAction = 'Continue with standard inspection schedule';
  }

  return {
    defectProbability: Math.round(defectProbability * 100) / 100,
    riskLevel,
    recommendedAction,
  };
}

// Helper functions

function generateRecommendations(
  inspection: RoomInspection,
  scores: {
    cleanlinessScore: number;
    maintenanceScore: number;
    amenitiesScore: number;
    complianceScore: number;
    overallScore: number;
  }
): string[] {
  const recommendations: string[] = [];

  // Cleanliness recommendations
  if (scores.cleanlinessScore < 70) {
    recommendations.push(
      '⚠️ URGENT: Deep cleaning required - cleanliness below acceptable standards'
    );
  } else if (scores.cleanlinessScore < 80) {
    recommendations.push('Improve cleaning procedures, especially in bathroom and bedroom');
  }

  // Maintenance recommendations
  if (scores.maintenanceScore < 70) {
    recommendations.push(
      '⚠️ URGENT: Multiple maintenance issues require immediate attention'
    );
  }

  // Check specific maintenance issues
  Object.entries(inspection.maintenance).forEach(([system, status]) => {
    if (status === 'urgent') {
      recommendations.push(`CRITICAL: ${system} requires urgent repair`);
    } else if (status === 'needs-attention') {
      recommendations.push(`Schedule ${system} maintenance soon`);
    }
  });

  // Amenities recommendations
  if (scores.amenitiesScore < 80) {
    const missingAmenities = Object.entries(inspection.amenities)
      .filter(([_, present]) => !present)
      .map(([amenity]) => amenity);

    if (missingAmenities.length > 0) {
      recommendations.push(`Restock missing amenities: ${missingAmenities.join(', ')}`);
    }
  }

  // Critical defects
  const severeDefects = inspection.defects.filter((d) => d.severity === 'severe');
  if (severeDefects.length > 0) {
    severeDefects.forEach((defect) => {
      recommendations.push(
        `⚠️ CRITICAL DEFECT: ${defect.type} at ${defect.location} - ${defect.description}`
      );
    });
  }

  // Overall performance
  if (scores.overallScore >= 90) {
    recommendations.push('✅ EXCELLENT: Room meets all quality standards');
  } else if (scores.overallScore < 70) {
    recommendations.push(
      '❌ FAILED: Room does not meet minimum quality standards - requires comprehensive attention'
    );
  }

  return recommendations;
}

function generateCorrectiveActions(
  inspection: RoomInspection
): QualityScore['correctiveActions'] {
  const actions: QualityScore['correctiveActions'] = [];

  // Critical defects
  inspection.defects.forEach((defect) => {
    if (defect.severity === 'severe') {
      actions.push({
        action: `Repair ${defect.type} at ${defect.location}: ${defect.description}`,
        priority: 'immediate',
        estimatedCost: estimateRepairCost(defect.type, defect.severity),
        estimatedTime: '2-4 hours',
      });
    }
  });

  // Urgent maintenance
  Object.entries(inspection.maintenance).forEach(([system, status]) => {
    if (status === 'urgent') {
      actions.push({
        action: `Repair ${system} system`,
        priority: 'immediate',
        estimatedCost: estimateRepairCost(system as any, 'severe'),
        estimatedTime: '4-8 hours',
      });
    } else if (status === 'needs-attention') {
      actions.push({
        action: `Service ${system} system`,
        priority: 'high',
        estimatedCost: estimateRepairCost(system as any, 'moderate'),
        estimatedTime: '1-2 hours',
      });
    }
  });

  // Missing amenities
  const missingAmenities = Object.entries(inspection.amenities)
    .filter(([_, present]) => !present)
    .map(([amenity]) => amenity);

  if (missingAmenities.length > 0) {
    actions.push({
      action: `Restock amenities: ${missingAmenities.join(', ')}`,
      priority: 'high',
      estimatedCost: missingAmenities.length * 5,
      estimatedTime: '15-30 minutes',
    });
  }

  // Cleanliness issues
  const lowCleanlinessAreas: string[] = [];
  if (inspection.cleanliness.bathroom < 7) lowCleanlinessAreas.push('bathroom');
  if (inspection.cleanliness.bedroom < 7) lowCleanlinessAreas.push('bedroom');
  if (inspection.cleanliness.entryway < 7) lowCleanlinessAreas.push('entryway');

  if (lowCleanlinessAreas.length > 0) {
    actions.push({
      action: `Deep clean: ${lowCleanlinessAreas.join(', ')}`,
      priority: 'high',
      estimatedCost: 50,
      estimatedTime: '1-2 hours',
    });
  }

  return actions;
}

function calculateConfidence(inspection: RoomInspection): number {
  let confidence = 0.8; // Base confidence

  // More inspection time = higher confidence (up to optimal time)
  const expectedTime = getExpectedInspectionTime(inspection.roomType);
  const timeRatio = inspection.inspectionDurationMinutes / expectedTime;
  if (timeRatio >= 0.8 && timeRatio <= 1.5) {
    confidence += 0.1;
  }

  // Photos increase confidence
  if (inspection.hasPhotos && inspection.photoCount && inspection.photoCount > 0) {
    confidence += 0.05;
  }

  // Detailed defect descriptions increase confidence
  const hasDetailedDefects = inspection.defects.every((d) => d.description.length > 10);
  if (hasDetailedDefects) {
    confidence += 0.05;
  }

  return Math.min(0.98, confidence);
}

function getExpectedInspectionTime(roomType: string): number {
  const times: Record<string, number> = {
    standard: 15, // 15 minutes
    deluxe: 20,   // 20 minutes
    suite: 30,    // 30 minutes
  };
  return times[roomType] || 15;
}

function estimateRepairCost(
  type: string,
  severity: 'minor' | 'moderate' | 'severe'
): number {
  const baseCosts: Record<string, number> = {
    stain: 50,
    damage: 200,
    'missing-item': 30,
    odor: 100,
    plumbing: 150,
    electrical: 200,
    hvac: 300,
    furniture: 250,
    fixtures: 100,
    other: 100,
  };

  const multipliers = {
    minor: 0.5,
    moderate: 1.0,
    severe: 2.0,
  };

  const baseCost = baseCosts[type] || 100;
  return Math.round(baseCost * multipliers[severity]);
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function determineTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
  if (scores.length < 2) return 'stable';

  // Simple linear regression to find trend
  const n = scores.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = scores;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  if (slope > 2) return 'improving';
  if (slope < -2) return 'declining';
  return 'stable';
}

export const QUALITY_SCORING_WEIGHTS = SCORE_WEIGHTS;
export const QUALITY_RATING_BENCHMARKS = QUALITY_BENCHMARKS;
