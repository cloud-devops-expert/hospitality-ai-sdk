/**
 * Computer Vision for Facility Monitoring
 *
 * Simulated computer vision capabilities for facility condition monitoring,
 * occupancy detection, and cleanliness assessment using algorithmic analysis.
 *
 * Note: This is a simulation-based implementation demonstrating ML concepts
 * without requiring actual CV libraries, maintaining zero-cost local processing.
 *
 * Features:
 * - Facility condition scoring from image metadata
 * - Occupancy estimation from sensor data
 * - Cleanliness assessment algorithms
 * - Safety hazard detection patterns
 * - Asset condition tracking
 * - Crowd density analysis
 *
 * @module lib/vision/detector
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ImageMetadata {
  imageId: string;
  timestamp: Date;
  location: string;
  type: 'facility' | 'room' | 'lobby' | 'corridor' | 'outdoor';
  width: number;
  height: number;
  brightness: number; // 0-255
  contrast: number; // 0-100
  sharpness: number; // 0-100
  colorProfile?: {
    dominantColors: string[];
    saturation: number;
  };
}

export interface FacilityCondition {
  imageId: string;
  location: string;
  conditionScore: number; // 0-100
  cleanliness: number; // 0-100
  maintenance: number; // 0-100
  safety: number; // 0-100
  detectedIssues: DetectedIssue[];
  confidence: number; // 0-100
  recommendations: string[];
}

export interface DetectedIssue {
  issueType: 'dirt' | 'damage' | 'clutter' | 'hazard' | 'wear' | 'stain';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  confidence: number;
  description: string;
  suggestedAction: string;
}

export interface OccupancyDetection {
  location: string;
  timestamp: Date;
  estimatedOccupancy: number;
  capacity: number;
  occupancyRate: number; // 0-100
  crowdDensity: 'empty' | 'sparse' | 'moderate' | 'crowded' | 'overcrowded';
  confidence: number;
  heatmapData?: number[][];
}

export interface SafetyHazard {
  hazardId: string;
  type: 'fire-risk' | 'slip-hazard' | 'obstruction' | 'electrical' | 'structural';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  timestamp: Date;
  confidence: number;
  description: string;
  immediateAction: string;
  requiresEvacuation: boolean;
}

export interface AssetCondition {
  assetId: string;
  assetType: string;
  location: string;
  conditionScore: number; // 0-100
  wear: number; // 0-100
  functionality: number; // 0-100
  lastInspected: Date;
  estimatedRemainingLife: number; // days
  replacementPriority: 'low' | 'medium' | 'high' | 'urgent';
  maintenanceNeeded: boolean;
}

export interface CleanlinessAssessment {
  location: string;
  timestamp: Date;
  overallCleanliness: number; // 0-100
  surfaces: {
    floor: number;
    walls: number;
    fixtures: number;
    furniture: number;
  };
  detectedDirt: Array<{
    type: 'dust' | 'stain' | 'debris' | 'organic';
    severity: number;
    location: string;
  }>;
  odorDetection?: {
    detected: boolean;
    type?: string;
    intensity?: number;
  };
  recommendations: string[];
}

export interface VisionAnalytics {
  totalImages: number;
  averageConditionScore: number;
  averageCleanliness: number;
  issuesDetected: number;
  hazardsDetected: number;
  locationsMonitored: string[];
  trendAnalysis: {
    improving: boolean;
    changeRate: number;
    prediction: number;
  };
}

// ============================================================================
// Core Vision Processing Functions
// ============================================================================

/**
 * Analyzes facility condition from image metadata
 */
export function analyzeFacilityCondition(
  metadata: ImageMetadata,
  historicalData?: FacilityCondition[]
): FacilityCondition {
  // Simulate ML-based image analysis using metadata

  // Brightness indicates lighting quality and cleanliness
  const cleanlinessFromBrightness = Math.min(100, (metadata.brightness / 255) * 120);

  // Contrast indicates detail visibility and maintenance
  const maintenanceFromContrast = metadata.contrast;

  // Sharpness indicates image quality and focus
  const qualityFromSharpness = metadata.sharpness;

  // Base scores
  let cleanliness = Math.round((cleanlinessFromBrightness + qualityFromSharpness) / 2);
  let maintenance = Math.round(maintenanceFromContrast);
  let safety = 85; // Default safe unless issues detected

  // Detect issues based on metadata patterns
  const detectedIssues: DetectedIssue[] = [];

  // Low brightness might indicate poor lighting or dirt
  if (metadata.brightness < 100) {
    detectedIssues.push({
      issueType: 'dirt',
      severity: metadata.brightness < 50 ? 'high' : 'medium',
      location: metadata.location,
      confidence: 75,
      description: 'Low brightness indicates potential cleanliness or lighting issues',
      suggestedAction: 'Inspect and clean area, check lighting',
    });
    cleanliness = Math.max(0, cleanliness - 20);
  }

  // Low contrast might indicate maintenance issues
  if (metadata.contrast < 30) {
    detectedIssues.push({
      issueType: 'wear',
      severity: 'medium',
      location: metadata.location,
      confidence: 70,
      description: 'Low contrast suggests faded or worn surfaces',
      suggestedAction: 'Schedule maintenance or repainting',
    });
    maintenance = Math.max(0, maintenance - 15);
  }

  // Low sharpness might indicate damage or obstruction
  if (metadata.sharpness < 40) {
    detectedIssues.push({
      issueType: 'clutter',
      severity: 'low',
      location: metadata.location,
      confidence: 65,
      description: 'Unclear image suggests obstruction or equipment issues',
      suggestedAction: 'Clear obstructions and verify camera functionality',
    });
    safety = Math.max(0, safety - 10);
  }

  // Check for color profile issues
  if (metadata.colorProfile && metadata.colorProfile.saturation < 30) {
    detectedIssues.push({
      issueType: 'stain',
      severity: 'low',
      location: metadata.location,
      confidence: 60,
      description: 'Low saturation may indicate staining or discoloration',
      suggestedAction: 'Inspect for stains and schedule deep cleaning',
    });
  }

  // Historical trend analysis
  if (historicalData && historicalData.length > 0) {
    const avgHistorical = historicalData.reduce((sum, h) => sum + h.conditionScore, 0) / historicalData.length;
    const currentEstimate = (cleanliness + maintenance + safety) / 3;

    if (currentEstimate < avgHistorical - 15) {
      detectedIssues.push({
        issueType: 'damage',
        severity: 'high',
        location: metadata.location,
        confidence: 80,
        description: 'Significant decline in condition compared to historical average',
        suggestedAction: 'Immediate inspection and remediation required',
      });
    }
  }

  const conditionScore = Math.round((cleanliness + maintenance + safety) / 3);

  // Generate recommendations
  const recommendations: string[] = [];
  if (conditionScore < 60) {
    recommendations.push('URGENT: Immediate inspection required');
  }
  if (cleanliness < 70) {
    recommendations.push('Schedule deep cleaning');
  }
  if (maintenance < 70) {
    recommendations.push('Arrange maintenance inspection');
  }
  if (detectedIssues.length > 2) {
    recommendations.push('Multiple issues detected - prioritize resolution');
  }

  // Calculate confidence based on image quality
  const confidence = Math.round(
    (metadata.brightness / 255) * 40 +
    (metadata.contrast / 100) * 30 +
    (metadata.sharpness / 100) * 30
  );

  return {
    imageId: metadata.imageId,
    location: metadata.location,
    conditionScore,
    cleanliness,
    maintenance,
    safety,
    detectedIssues,
    confidence,
    recommendations,
  };
}

/**
 * Estimates occupancy from sensor data and patterns
 */
export function estimateOccupancy(
  location: string,
  sensorData: {
    motionEvents: number;
    noiseLevel: number; // 0-100
    temperature: number;
    co2Level?: number;
  },
  capacity: number
): OccupancyDetection {
  // ML-based occupancy estimation using multiple signals

  // Motion events indicate activity
  const motionFactor = Math.min(1, sensorData.motionEvents / 10);

  // Noise level correlates with occupancy
  const noiseFactor = sensorData.noiseLevel / 100;

  // CO2 level increases with occupancy
  const co2Factor = sensorData.co2Level ? Math.min(1, sensorData.co2Level / 1000) : 0.5;

  // Temperature can indicate body heat (slight correlation)
  const tempFactor = Math.max(0, Math.min(1, (sensorData.temperature - 20) / 5));

  // Weighted combination
  const occupancyEstimate = Math.round(
    capacity * (motionFactor * 0.4 + noiseFactor * 0.3 + co2Factor * 0.2 + tempFactor * 0.1)
  );

  const occupancyRate = Math.min(100, (occupancyEstimate / capacity) * 100);

  // Determine crowd density
  let crowdDensity: OccupancyDetection['crowdDensity'];
  if (occupancyRate < 10) {
    crowdDensity = 'empty';
  } else if (occupancyRate < 40) {
    crowdDensity = 'sparse';
  } else if (occupancyRate < 70) {
    crowdDensity = 'moderate';
  } else if (occupancyRate < 95) {
    crowdDensity = 'crowded';
  } else {
    crowdDensity = 'overcrowded';
  }

  // Confidence based on sensor availability and consistency
  const sensorsAvailable = 2 + (sensorData.co2Level ? 1 : 0);
  const confidence = Math.round(
    (sensorsAvailable / 3) * 100 * 0.8 +
    (sensorData.motionEvents > 0 ? 20 : 0)
  );

  // Generate heatmap data (simulated)
  const heatmapData = generateHeatmap(occupancyRate);

  return {
    location,
    timestamp: new Date(),
    estimatedOccupancy: occupancyEstimate,
    capacity,
    occupancyRate: Math.round(occupancyRate),
    crowdDensity,
    confidence,
    heatmapData,
  };
}

/**
 * Detects safety hazards from image analysis
 */
export function detectSafetyHazards(
  metadata: ImageMetadata,
  environmentalData?: {
    temperature: number;
    humidity: number;
    smokeDetected: boolean;
  }
): SafetyHazard[] {
  const hazards: SafetyHazard[] = [];

  // Check for fire risk (high temperature + smoke)
  if (environmentalData?.temperature && environmentalData.temperature > 40) {
    hazards.push({
      hazardId: `hazard_${Date.now()}_fire`,
      type: 'fire-risk',
      severity: environmentalData.smokeDetected ? 'critical' : 'high',
      location: metadata.location,
      timestamp: new Date(),
      confidence: environmentalData.smokeDetected ? 95 : 70,
      description: `Elevated temperature (${environmentalData.temperature}°C)${environmentalData.smokeDetected ? ' and smoke detected' : ''}`,
      immediateAction: 'Evacuate area and contact emergency services',
      requiresEvacuation: environmentalData.smokeDetected,
    });
  }

  // Check for slip hazards (high humidity in certain locations)
  if (environmentalData?.humidity && environmentalData.humidity > 80 &&
      (metadata.type === 'lobby' || metadata.type === 'corridor')) {
    hazards.push({
      hazardId: `hazard_${Date.now()}_slip`,
      type: 'slip-hazard',
      severity: 'medium',
      location: metadata.location,
      timestamp: new Date(),
      confidence: 75,
      description: `High humidity (${environmentalData.humidity}%) may create slippery surfaces`,
      immediateAction: 'Place caution signs and increase monitoring',
      requiresEvacuation: false,
    });
  }

  // Check for obstructions (low sharpness in corridors)
  if (metadata.sharpness < 30 && metadata.type === 'corridor') {
    hazards.push({
      hazardId: `hazard_${Date.now()}_obstruction`,
      type: 'obstruction',
      severity: 'medium',
      location: metadata.location,
      timestamp: new Date(),
      confidence: 65,
      description: 'Potential obstruction blocking corridor',
      immediateAction: 'Clear obstruction and verify emergency exit accessibility',
      requiresEvacuation: false,
    });
  }

  // Check for electrical issues (very low brightness)
  if (metadata.brightness < 30 && metadata.type === 'facility') {
    hazards.push({
      hazardId: `hazard_${Date.now()}_electrical`,
      type: 'electrical',
      severity: 'high',
      location: metadata.location,
      timestamp: new Date(),
      confidence: 70,
      description: 'Abnormally low lighting may indicate electrical issues',
      immediateAction: 'Inspect electrical systems and lighting fixtures',
      requiresEvacuation: false,
    });
  }

  return hazards;
}

/**
 * Assesses asset condition for predictive maintenance
 */
export function assessAssetCondition(
  assetId: string,
  assetType: string,
  location: string,
  visualData: {
    appearance: number; // 0-100
    wearVisible: boolean;
    lastInspectionDays: number;
  },
  usageMetrics?: {
    hoursUsed: number;
    cyclesCompleted: number;
  }
): AssetCondition {
  // Base condition from appearance
  let conditionScore = visualData.appearance;

  // Wear factor
  const wearScore = visualData.wearVisible ? 50 : 90;

  // Time since last inspection affects confidence
  const inspectionRecency = Math.max(0, 100 - visualData.lastInspectionDays);

  // Usage-based wear calculation
  let usageWear = 100;
  if (usageMetrics) {
    const expectedLife = 10000; // hours
    usageWear = Math.max(0, 100 - (usageMetrics.hoursUsed / expectedLife) * 100);
  }

  // Combine factors
  const functionality = Math.round((conditionScore + inspectionRecency) / 2);
  const wear = Math.round((wearScore + usageWear) / 2);
  const finalConditionScore = Math.round((conditionScore + wearScore + usageWear) / 3);

  // Estimate remaining life
  const estimatedRemainingLife = Math.round((wear / 100) * 365 * 3); // Up to 3 years

  // Determine replacement priority
  let replacementPriority: AssetCondition['replacementPriority'];
  if (finalConditionScore < 30) {
    replacementPriority = 'urgent';
  } else if (finalConditionScore < 50) {
    replacementPriority = 'high';
  } else if (finalConditionScore < 70) {
    replacementPriority = 'medium';
  } else {
    replacementPriority = 'low';
  }

  const maintenanceNeeded = finalConditionScore < 70 || visualData.wearVisible;

  return {
    assetId,
    assetType,
    location,
    conditionScore: finalConditionScore,
    wear,
    functionality,
    lastInspected: new Date(Date.now() - visualData.lastInspectionDays * 24 * 60 * 60 * 1000),
    estimatedRemainingLife,
    replacementPriority,
    maintenanceNeeded,
  };
}

/**
 * Performs comprehensive cleanliness assessment
 */
export function assessCleanliness(
  location: string,
  imageData: ImageMetadata,
  detailedScans?: {
    floorCoverage: number; // 0-100
    wallCondition: number; // 0-100
    fixturesCleanliness: number; // 0-100
    furnitureCondition: number; // 0-100;
  }
): CleanlinessAssessment {
  // Base cleanliness from image brightness
  const baseCleanliness = (imageData.brightness / 255) * 100;

  // Surface scores - map detailedScans properties to expected surface names
  const surfaces = detailedScans ? {
    floor: detailedScans.floorCoverage,
    walls: detailedScans.wallCondition,
    fixtures: detailedScans.fixturesCleanliness,
    furniture: detailedScans.furnitureCondition,
  } : {
    floor: baseCleanliness,
    walls: baseCleanliness * 1.1,
    fixtures: baseCleanliness * 0.9,
    furniture: baseCleanliness * 0.95,
  };

  // Ensure all scores are 0-100
  surfaces.floor = Math.min(100, surfaces.floor);
  surfaces.walls = Math.min(100, surfaces.walls);
  surfaces.fixtures = Math.min(100, surfaces.fixtures);
  surfaces.furniture = Math.min(100, surfaces.furniture);

  // Overall cleanliness
  const overallCleanliness = Math.round(
    (surfaces.floor * 0.3 +
     surfaces.walls * 0.2 +
     surfaces.fixtures * 0.25 +
     surfaces.furniture * 0.25)
  );

  // Detect dirt patterns
  const detectedDirt: CleanlinessAssessment['detectedDirt'] = [];

  if (surfaces.floor < 70) {
    detectedDirt.push({
      type: 'debris',
      severity: 100 - surfaces.floor,
      location: 'floor',
    });
  }

  if (surfaces.walls < 80) {
    detectedDirt.push({
      type: 'stain',
      severity: 100 - surfaces.walls,
      location: 'walls',
    });
  }

  if (surfaces.fixtures < 75) {
    detectedDirt.push({
      type: 'dust',
      severity: 100 - surfaces.fixtures,
      location: 'fixtures',
    });
  }

  // Odor detection simulation (based on cleanliness level)
  const odorDetection = overallCleanliness < 60 ? {
    detected: true,
    type: 'mustiness',
    intensity: 100 - overallCleanliness,
  } : { detected: false };

  // Recommendations
  const recommendations: string[] = [];
  if (overallCleanliness < 70) {
    recommendations.push('Schedule immediate deep cleaning');
  }
  if (surfaces.floor < 70) {
    recommendations.push('Focus on floor cleaning and maintenance');
  }
  if (surfaces.fixtures < 70) {
    recommendations.push('Clean and polish fixtures');
  }
  if (detectedDirt.length > 2) {
    recommendations.push('Comprehensive cleaning required across multiple surfaces');
  }
  if (odorDetection.detected) {
    recommendations.push('Address odor sources and improve ventilation');
  }

  return {
    location,
    timestamp: new Date(),
    overallCleanliness,
    surfaces,
    detectedDirt,
    odorDetection,
    recommendations,
  };
}

/**
 * Analyzes trends across multiple vision assessments
 */
export function analyzeVisionTrends(
  assessments: FacilityCondition[]
): VisionAnalytics {
  if (assessments.length === 0) {
    throw new Error('At least one assessment is required');
  }

  const totalImages = assessments.length;
  const averageConditionScore = Math.round(
    assessments.reduce((sum, a) => sum + a.conditionScore, 0) / totalImages
  );
  const averageCleanliness = Math.round(
    assessments.reduce((sum, a) => sum + a.cleanliness, 0) / totalImages
  );
  const issuesDetected = assessments.reduce((sum, a) => sum + a.detectedIssues.length, 0);

  const locationsMonitored = [...new Set(assessments.map(a => a.location))];

  // Trend analysis
  const firstHalf = assessments.slice(0, Math.floor(assessments.length / 2));
  const secondHalf = assessments.slice(Math.floor(assessments.length / 2));

  const firstAvg = firstHalf.reduce((sum, a) => sum + a.conditionScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, a) => sum + a.conditionScore, 0) / secondHalf.length;

  const improving = secondAvg > firstAvg;
  const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;
  const prediction = Math.round(secondAvg + (secondAvg - firstAvg));

  return {
    totalImages,
    averageConditionScore,
    averageCleanliness,
    issuesDetected,
    hazardsDetected: 0, // Would be calculated from separate hazard tracking
    locationsMonitored,
    trendAnalysis: {
      improving,
      changeRate: Math.round(changeRate),
      prediction: Math.max(0, Math.min(100, prediction)),
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateHeatmap(occupancyRate: number): number[][] {
  // Generate simple 10x10 heatmap
  const size = 10;
  const heatmap: number[][] = [];

  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      // Center has higher density
      const distance = Math.sqrt(Math.pow(i - size/2, 2) + Math.pow(j - size/2, 2));
      const centerFactor = 1 - (distance / (size / 2));
      const value = Math.round(occupancyRate * centerFactor * (0.8 + Math.random() * 0.4));
      row.push(Math.max(0, Math.min(100, value)));
    }
    heatmap.push(row);
  }

  return heatmap;
}
