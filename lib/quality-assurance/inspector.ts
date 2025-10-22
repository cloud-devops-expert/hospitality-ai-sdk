/**
 * Quality Assurance Automation Module
 *
 * Algorithmic simulation of quality inspection for hospitality operations.
 * Uses rule-based scoring and pattern detection for room inspections,
 * service quality assessment, and defect identification.
 *
 * Zero-cost local processing approach.
 */

// ============================================================================
// Types
// ============================================================================

export interface RoomInspectionInput {
  roomId: string;
  roomType: string;
  inspectionDate: Date;
  inspectorId: string;
  checklist: ChecklistItem[];
  photos?: InspectionPhoto[];
  previousIssues?: string[];
}

export interface ChecklistItem {
  category: 'cleanliness' | 'maintenance' | 'amenities' | 'safety' | 'presentation';
  item: string;
  status: 'pass' | 'fail' | 'needs-attention';
  notes?: string;
  severity?: 'minor' | 'moderate' | 'major' | 'critical';
}

export interface InspectionPhoto {
  photoId: string;
  category: string;
  timestamp: Date;
  hasIssue: boolean;
  issueDescription?: string;
}

export interface RoomInspectionScore {
  overall: number; // 0-100
  categoryScores: {
    cleanliness: number;
    maintenance: number;
    amenities: number;
    safety: number;
    presentation: number;
  };
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  passedInspection: boolean;
  defectsFound: Defect[];
  recommendations: string[];
}

export interface Defect {
  id: string;
  category: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  location: string;
  requiresImmediateAction: boolean;
  estimatedFixTime: number; // minutes
  assignedTo?: string;
}

export interface ServiceQualityInput {
  serviceType: 'front-desk' | 'housekeeping' | 'maintenance' | 'concierge' | 'room-service';
  staffId: string;
  guestFeedback?: number; // 1-5
  responseTime?: number; // minutes
  completionTime?: number;
  accuracy?: number; // 0-100
  professionalismScore?: number; // 1-5
  issuesResolved?: number;
  issuesEscalated?: number;
  timestamp: Date;
}

export interface ServiceQualityScore {
  overall: number; // 0-100
  metrics: {
    speed: number;
    accuracy: number;
    professionalism: number;
    effectiveness: number;
  };
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  strengths: string[];
  improvementAreas: string[];
  trainingNeeded?: string[];
}

export interface InspectionRoute {
  routeId: string;
  rooms: string[];
  estimatedTime: number; // minutes
  priority: 'high' | 'medium' | 'low';
  optimizationScore: number; // 0-100
  startLocation: string;
  sequence: RouteStep[];
}

export interface RouteStep {
  roomId: string;
  floor: number;
  estimatedDuration: number;
  priority: number;
  distance?: number;
}

export interface StaffPerformance {
  staffId: string;
  name: string;
  role: string;
  period: { start: Date; end: Date };
  metrics: {
    inspectionsCompleted: number;
    averageScore: number;
    defectsFound: number;
    timeEfficiency: number; // percentage
    accuracyRate: number; // percentage
  };
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface QualityTrends {
  period: { start: Date; end: Date };
  totalInspections: number;
  averageScore: number;
  passRate: number; // percentage
  topIssues: Array<{ issue: string; count: number; trend: 'increasing' | 'stable' | 'decreasing' }>;
  roomTypePerformance: Map<string, number>;
  improvementRate: number; // percentage change
  prediction: string;
}

// ============================================================================
// Room Inspection Functions
// ============================================================================

/**
 * Scores a room inspection based on checklist results
 */
export function scoreRoomInspection(input: RoomInspectionInput): RoomInspectionScore {
  const categoryScores = {
    cleanliness: 0,
    maintenance: 0,
    amenities: 0,
    safety: 0,
    presentation: 0,
  };

  const categoryCounts = {
    cleanliness: 0,
    maintenance: 0,
    amenities: 0,
    safety: 0,
    presentation: 0,
  };

  const defects: Defect[] = [];

  // Score each category
  input.checklist.forEach(item => {
    categoryCounts[item.category]++;

    let itemScore = 0;
    if (item.status === 'pass') {
      itemScore = 100;
    } else if (item.status === 'needs-attention') {
      itemScore = 70;
    } else {
      itemScore = 0;
    }

    // Apply severity penalty
    if (item.severity) {
      const severityPenalty = {
        minor: 0.9,
        moderate: 0.7,
        major: 0.5,
        critical: 0,
      };
      itemScore *= severityPenalty[item.severity];
    }

    categoryScores[item.category] += itemScore;

    // Create defect for failed or needs-attention items
    if (item.status !== 'pass') {
      defects.push({
        id: `defect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: item.category,
        description: `${item.item}${item.notes ? `: ${item.notes}` : ''}`,
        severity: item.severity || 'moderate',
        location: input.roomId,
        requiresImmediateAction: item.severity === 'critical' || item.category === 'safety',
        estimatedFixTime: estimateFixTime(item.category, item.severity || 'moderate'),
      });
    }
  });

  // Calculate average scores per category
  Object.keys(categoryScores).forEach(category => {
    const cat = category as keyof typeof categoryScores;
    if (categoryCounts[cat] > 0) {
      categoryScores[cat] = Math.round(categoryScores[cat] / categoryCounts[cat]);
    } else {
      categoryScores[cat] = 100; // If no items in category, assume perfect
    }
  });

  // Calculate overall score with weighted categories
  const weights = {
    cleanliness: 0.25,
    maintenance: 0.20,
    amenities: 0.15,
    safety: 0.30, // Highest weight
    presentation: 0.10,
  };

  const overall = Math.round(
    Object.keys(categoryScores).reduce((sum, category) => {
      const cat = category as keyof typeof categoryScores;
      return sum + categoryScores[cat] * weights[cat];
    }, 0)
  );

  // Determine rating
  let rating: RoomInspectionScore['rating'];
  if (overall >= 90) {
    rating = 'excellent';
  } else if (overall >= 75) {
    rating = 'good';
  } else if (overall >= 60) {
    rating = 'fair';
  } else {
    rating = 'poor';
  }

  // Determine if inspection passed
  const passedInspection = overall >= 75 &&
    categoryScores.safety >= 85 &&
    !defects.some(d => d.severity === 'critical');

  // Generate recommendations
  const recommendations = generateInspectionRecommendations(
    categoryScores,
    defects,
    input.previousIssues
  );

  return {
    overall,
    categoryScores,
    rating,
    passedInspection,
    defectsFound: defects,
    recommendations,
  };
}

/**
 * Assesses service quality based on performance metrics
 */
export function assessServiceQuality(input: ServiceQualityInput): ServiceQualityScore {
  const metrics = {
    speed: 0,
    accuracy: 0,
    professionalism: 0,
    effectiveness: 0,
  };

  // Speed score (based on response time)
  if (input.responseTime !== undefined) {
    const expectedTime = getExpectedResponseTime(input.serviceType);
    const speedRatio = expectedTime / input.responseTime;
    metrics.speed = Math.min(100, Math.round(speedRatio * 100));
  } else {
    metrics.speed = 75; // Default if not provided
  }

  // Accuracy score
  if (input.accuracy !== undefined) {
    metrics.accuracy = input.accuracy;
  } else {
    metrics.accuracy = 80; // Default
  }

  // Professionalism score
  if (input.professionalismScore !== undefined) {
    metrics.professionalism = input.professionalismScore * 20; // Convert 1-5 to 0-100
  } else {
    metrics.professionalism = 80; // Default
  }

  // Effectiveness score (based on resolution rate)
  if (input.issuesResolved !== undefined && input.issuesEscalated !== undefined) {
    const totalIssues = input.issuesResolved + input.issuesEscalated;
    if (totalIssues > 0) {
      metrics.effectiveness = Math.round((input.issuesResolved / totalIssues) * 100);
    } else {
      metrics.effectiveness = 100;
    }
  } else {
    metrics.effectiveness = 85; // Default
  }

  // Calculate overall score
  const overall = Math.round(
    (metrics.speed * 0.25) +
    (metrics.accuracy * 0.25) +
    (metrics.professionalism * 0.25) +
    (metrics.effectiveness * 0.25)
  );

  // Determine rating
  let rating: ServiceQualityScore['rating'];
  if (overall >= 90) {
    rating = 'excellent';
  } else if (overall >= 75) {
    rating = 'good';
  } else if (overall >= 60) {
    rating = 'fair';
  } else {
    rating = 'poor';
  }

  // Identify strengths and improvement areas
  const strengths: string[] = [];
  const improvementAreas: string[] = [];
  const trainingNeeded: string[] = [];

  if (metrics.speed >= 85) {
    strengths.push('Fast response time');
  } else if (metrics.speed < 60) {
    improvementAreas.push('Response time needs improvement');
    trainingNeeded.push('Time management and prioritization');
  }

  if (metrics.accuracy >= 85) {
    strengths.push('High accuracy in service delivery');
  } else if (metrics.accuracy < 60) {
    improvementAreas.push('Service accuracy needs attention');
    trainingNeeded.push('Service standards and procedures');
  }

  if (metrics.professionalism >= 85) {
    strengths.push('Excellent professional conduct');
  } else if (metrics.professionalism < 60) {
    improvementAreas.push('Professionalism could be improved');
    trainingNeeded.push('Customer service and communication skills');
  }

  if (metrics.effectiveness >= 85) {
    strengths.push('Effective problem resolution');
  } else if (metrics.effectiveness < 60) {
    improvementAreas.push('Issue resolution effectiveness needs work');
    trainingNeeded.push('Problem-solving and decision-making');
  }

  return {
    overall,
    metrics,
    rating,
    strengths,
    improvementAreas,
    trainingNeeded: trainingNeeded.length > 0 ? trainingNeeded : undefined,
  };
}

/**
 * Optimizes inspection route for efficiency
 */
export function optimizeInspectionRoute(
  rooms: Array<{ roomId: string; floor: number; priority: 'high' | 'medium' | 'low' }>,
  startFloor: number = 1
): InspectionRoute {
  // Sort rooms by floor first, then priority
  const priorityScore = { high: 3, medium: 2, low: 1 };

  const sortedRooms = [...rooms].sort((a, b) => {
    // Same floor: sort by priority
    if (a.floor === b.floor) {
      return priorityScore[b.priority] - priorityScore[a.priority];
    }
    // Different floors: sort by floor, starting from startFloor
    return Math.abs(a.floor - startFloor) - Math.abs(b.floor - startFloor);
  });

  // Create route sequence
  const sequence: RouteStep[] = sortedRooms.map(room => ({
    roomId: room.roomId,
    floor: room.floor,
    estimatedDuration: getEstimatedInspectionDuration(room.priority),
    priority: priorityScore[room.priority],
  }));

  // Calculate total estimated time
  const estimatedTime = sequence.reduce((total, step) => total + step.estimatedDuration, 0) +
    calculateTravelTime(sequence);

  // Calculate optimization score based on floor changes and priority order
  const floorChanges = sequence.reduce((count, step, idx) => {
    if (idx > 0 && step.floor !== sequence[idx - 1].floor) {
      return count + 1;
    }
    return count;
  }, 0);

  // Lower floor changes = higher optimization
  const maxPossibleChanges = rooms.length - 1;
  const optimizationScore = Math.round((1 - (floorChanges / Math.max(maxPossibleChanges, 1))) * 100);

  // Determine overall priority
  const highPriorityCount = rooms.filter(r => r.priority === 'high').length;
  const priority = highPriorityCount > rooms.length * 0.3 ? 'high' :
    highPriorityCount > rooms.length * 0.1 ? 'medium' : 'low';

  return {
    routeId: `route-${Date.now()}`,
    rooms: sortedRooms.map(r => r.roomId),
    estimatedTime,
    priority,
    optimizationScore,
    startLocation: `Floor ${startFloor}`,
    sequence,
  };
}

/**
 * Evaluates staff performance over a period
 */
export function evaluateStaffPerformance(
  inspections: Array<{
    inspectorId: string;
    score: number;
    defectsFound: number;
    duration: number;
    expectedDuration: number;
  }>,
  staffInfo: { staffId: string; name: string; role: string },
  period: { start: Date; end: Date }
): StaffPerformance {
  if (inspections.length === 0) {
    throw new Error('At least one inspection is required');
  }

  const metrics = {
    inspectionsCompleted: inspections.length,
    averageScore: Math.round(
      inspections.reduce((sum, i) => sum + i.score, 0) / inspections.length
    ),
    defectsFound: inspections.reduce((sum, i) => sum + i.defectsFound, 0),
    timeEfficiency: Math.round(
      (inspections.reduce((sum, i) => {
        return sum + (i.expectedDuration / i.duration);
      }, 0) / inspections.length) * 100
    ),
    accuracyRate: Math.round(
      (inspections.filter(i => i.score >= 75).length / inspections.length) * 100
    ),
  };

  // Determine rating
  let rating: StaffPerformance['rating'];
  const performanceScore = (
    (metrics.averageScore * 0.4) +
    (metrics.timeEfficiency * 0.3) +
    (metrics.accuracyRate * 0.3)
  );

  if (performanceScore >= 90) {
    rating = 'excellent';
  } else if (performanceScore >= 75) {
    rating = 'good';
  } else if (performanceScore >= 60) {
    rating = 'fair';
  } else {
    rating = 'poor';
  }

  // Determine trend (compare first half to second half)
  const midpoint = Math.floor(inspections.length / 2);
  const firstHalf = inspections.slice(0, midpoint);
  const secondHalf = inspections.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, i) => sum + i.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, i) => sum + i.score, 0) / secondHalf.length;

  let trend: StaffPerformance['trend'];
  if (secondAvg > firstAvg * 1.05) {
    trend = 'improving';
  } else if (secondAvg < firstAvg * 0.95) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (metrics.averageScore < 75) {
    recommendations.push('Focus on inspection thoroughness and attention to detail');
  } else if (metrics.averageScore >= 90) {
    recommendations.push('Maintain excellent inspection standards');
  }

  if (metrics.timeEfficiency < 80) {
    recommendations.push('Work on inspection efficiency without compromising quality');
  } else if (metrics.timeEfficiency >= 110) {
    recommendations.push('Ensure adequate time spent on thorough inspections');
  }

  if (metrics.defectsFound / metrics.inspectionsCompleted < 2) {
    recommendations.push('May need to be more thorough in defect identification');
  } else if (metrics.defectsFound / metrics.inspectionsCompleted > 10) {
    recommendations.push('Review defect reporting standards to ensure accuracy');
  }

  if (trend === 'declining') {
    recommendations.push('Performance declining - consider refresher training');
  } else if (trend === 'improving') {
    recommendations.push('Showing positive improvement - keep up the good work');
  }

  return {
    ...staffInfo,
    period,
    metrics,
    rating,
    trend,
    recommendations,
  };
}

/**
 * Analyzes quality trends over time
 */
export function analyzeQualityTrends(
  inspections: Array<{
    roomId: string;
    roomType: string;
    score: number;
    timestamp: Date;
    defects: Array<{ category: string; description: string }>;
  }>,
  period: { start: Date; end: Date }
): QualityTrends {
  if (inspections.length === 0) {
    throw new Error('At least one inspection is required');
  }

  const totalInspections = inspections.length;
  const averageScore = Math.round(
    inspections.reduce((sum, i) => sum + i.score, 0) / totalInspections
  );

  const passRate = Math.round(
    (inspections.filter(i => i.score >= 75).length / totalInspections) * 100
  );

  // Analyze top issues
  const issueMap = new Map<string, { count: number; recentCount: number }>();
  const midpoint = Math.floor(inspections.length / 2);

  inspections.forEach((inspection, idx) => {
    inspection.defects.forEach(defect => {
      const issue = `${defect.category}: ${defect.description}`;
      const existing = issueMap.get(issue) || { count: 0, recentCount: 0 };
      existing.count++;
      if (idx >= midpoint) {
        existing.recentCount++;
      }
      issueMap.set(issue, existing);
    });
  });

  const topIssues = Array.from(issueMap.entries())
    .map(([issue, data]) => {
      const firstHalfRate = (data.count - data.recentCount) / midpoint;
      const secondHalfRate = data.recentCount / (inspections.length - midpoint);

      let trend: 'increasing' | 'stable' | 'decreasing';
      if (secondHalfRate > firstHalfRate * 1.2) {
        trend = 'increasing';
      } else if (secondHalfRate < firstHalfRate * 0.8) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }

      return { issue, count: data.count, trend };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Analyze room type performance
  const roomTypePerformance = new Map<string, number>();
  const roomTypeScores = new Map<string, number[]>();

  inspections.forEach(inspection => {
    const scores = roomTypeScores.get(inspection.roomType) || [];
    scores.push(inspection.score);
    roomTypeScores.set(inspection.roomType, scores);
  });

  roomTypeScores.forEach((scores, roomType) => {
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    roomTypePerformance.set(roomType, Math.round(avg));
  });

  // Calculate improvement rate
  const firstHalf = inspections.slice(0, midpoint);
  const secondHalf = inspections.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, i) => sum + i.score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, i) => sum + i.score, 0) / secondHalf.length;

  const improvementRate = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);

  // Generate prediction
  let prediction: string;
  if (improvementRate > 5) {
    prediction = 'Quality trending upward - maintain current improvement initiatives';
  } else if (improvementRate < -5) {
    prediction = 'Quality declining - review processes and provide additional training';
  } else {
    prediction = 'Quality stable - focus on consistency and addressing top issues';
  }

  return {
    period,
    totalInspections,
    averageScore,
    passRate,
    topIssues,
    roomTypePerformance,
    improvementRate,
    prediction,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function estimateFixTime(category: string, severity: string): number {
  const baseTime = {
    cleanliness: 15,
    maintenance: 30,
    amenities: 20,
    safety: 45,
    presentation: 10,
  };

  const severityMultiplier = {
    minor: 0.5,
    moderate: 1,
    major: 2,
    critical: 3,
  };

  return Math.round(
    (baseTime[category as keyof typeof baseTime] || 20) *
    (severityMultiplier[severity as keyof typeof severityMultiplier] || 1)
  );
}

function generateInspectionRecommendations(
  categoryScores: Record<string, number>,
  defects: Defect[],
  previousIssues?: string[]
): string[] {
  const recommendations: string[] = [];

  // Check for critical defects
  const criticalDefects = defects.filter(d => d.severity === 'critical');
  if (criticalDefects.length > 0) {
    recommendations.push('URGENT: Address critical defects immediately before room use');
  }

  // Check category scores
  Object.entries(categoryScores).forEach(([category, score]) => {
    if (score < 60) {
      recommendations.push(`${category.charAt(0).toUpperCase() + category.slice(1)} requires immediate attention`);
    } else if (score < 75) {
      recommendations.push(`Improve ${category} standards to meet requirements`);
    }
  });

  // Check for recurring issues
  if (previousIssues && previousIssues.length > 0) {
    const recurringIssues = defects.filter(d =>
      previousIssues.some(prev => prev.toLowerCase().includes(d.description.toLowerCase()))
    );
    if (recurringIssues.length > 0) {
      recommendations.push('Recurring issues detected - implement preventive measures');
    }
  }

  // If too many defects
  if (defects.length > 5) {
    recommendations.push('Multiple defects found - conduct thorough room servicing');
  }

  // Safety priority
  if (categoryScores.safety < 85) {
    recommendations.push('Safety score below acceptable threshold - prioritize safety improvements');
  }

  if (recommendations.length === 0) {
    recommendations.push('Room meets quality standards - maintain current service levels');
  }

  return recommendations;
}

function getExpectedResponseTime(serviceType: string): number {
  const expectedTimes = {
    'front-desk': 5, // 5 minutes
    'housekeeping': 30,
    'maintenance': 60,
    'concierge': 10,
    'room-service': 45,
  };

  return expectedTimes[serviceType as keyof typeof expectedTimes] || 30;
}

function getEstimatedInspectionDuration(priority: string): number {
  const durations = {
    high: 25, // minutes
    medium: 20,
    low: 15,
  };

  return durations[priority as keyof typeof durations] || 20;
}

function calculateTravelTime(sequence: RouteStep[]): number {
  let travelTime = 0;

  for (let i = 1; i < sequence.length; i++) {
    const prev = sequence[i - 1];
    const current = sequence[i];

    // Floor change costs 3 minutes, same floor costs 1 minute
    if (prev.floor !== current.floor) {
      travelTime += 3;
    } else {
      travelTime += 1;
    }
  }

  return travelTime;
}
