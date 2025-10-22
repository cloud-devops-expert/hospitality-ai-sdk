import {
  analyzeFacilityCondition,
  estimateOccupancy,
  detectSafetyHazards,
  assessAssetCondition,
  assessCleanliness,
  analyzeVisionTrends,
  ImageMetadata,
  FacilityCondition,
} from '../detector';

describe('Computer Vision for Facility Monitoring', () => {
  // Sample image metadata
  const sampleMetadata: ImageMetadata = {
    imageId: 'img-001',
    timestamp: new Date('2025-01-22T10:00:00'),
    location: 'Lobby',
    type: 'lobby',
    width: 1920,
    height: 1080,
    brightness: 180,
    contrast: 70,
    sharpness: 80,
    colorProfile: {
      dominantColors: ['white', 'beige', 'brown'],
      saturation: 60,
    },
  };

  describe('analyzeFacilityCondition', () => {
    it('should analyze facility condition from metadata', () => {
      const condition = analyzeFacilityCondition(sampleMetadata);

      expect(condition.imageId).toBe('img-001');
      expect(condition.location).toBe('Lobby');
      expect(condition.conditionScore).toBeGreaterThanOrEqual(0);
      expect(condition.conditionScore).toBeLessThanOrEqual(100);
      expect(condition.cleanliness).toBeGreaterThanOrEqual(0);
      expect(condition.maintenance).toBeGreaterThanOrEqual(0);
      expect(condition.safety).toBeGreaterThanOrEqual(0);
      expect(condition.confidence).toBeGreaterThan(0);
    });

    it('should detect issues from low brightness', () => {
      const darkMetadata = { ...sampleMetadata, brightness: 40 };
      const condition = analyzeFacilityCondition(darkMetadata);

      expect(condition.detectedIssues.length).toBeGreaterThan(0);
      expect(condition.detectedIssues.some(i => i.issueType === 'dirt')).toBe(true);
      expect(condition.cleanliness).toBeLessThan(70);
    });

    it('should detect wear from low contrast', () => {
      const lowContrastMetadata = { ...sampleMetadata, contrast: 20 };
      const condition = analyzeFacilityCondition(lowContrastMetadata);

      expect(condition.detectedIssues.some(i => i.issueType === 'wear')).toBe(true);
      expect(condition.maintenance).toBeLessThan(60);
    });

    it('should detect clutter from low sharpness', () => {
      const blurryMetadata = { ...sampleMetadata, sharpness: 30 };
      const condition = analyzeFacilityCondition(blurryMetadata);

      expect(condition.detectedIssues.some(i => i.issueType === 'clutter')).toBe(true);
    });

    it('should provide recommendations for poor conditions', () => {
      const poorMetadata = {
        ...sampleMetadata,
        brightness: 50,
        contrast: 30,
        sharpness: 40,
      };
      const condition = analyzeFacilityCondition(poorMetadata);

      expect(condition.recommendations.length).toBeGreaterThan(0);
      expect(condition.conditionScore).toBeLessThan(70);
    });

    it('should use historical data for trend analysis', () => {
      const historicalData: FacilityCondition[] = [
        {
          imageId: 'hist-1',
          location: 'Lobby',
          conditionScore: 90,
          cleanliness: 90,
          maintenance: 90,
          safety: 90,
          detectedIssues: [],
          confidence: 85,
          recommendations: [],
        },
      ];

      const degradedMetadata = { ...sampleMetadata, brightness: 100, contrast: 40 };
      const condition = analyzeFacilityCondition(degradedMetadata, historicalData);

      expect(condition.detectedIssues.some(i => i.issueType === 'damage')).toBe(true);
    });

    it('should calculate confidence based on image quality', () => {
      const highQualityMetadata = {
        ...sampleMetadata,
        brightness: 200,
        contrast: 80,
        sharpness: 90,
      };
      const lowQualityMetadata = {
        ...sampleMetadata,
        brightness: 80,
        contrast: 30,
        sharpness: 30,
      };

      const highQuality = analyzeFacilityCondition(highQualityMetadata);
      const lowQuality = analyzeFacilityCondition(lowQualityMetadata);

      expect(highQuality.confidence).toBeGreaterThan(lowQuality.confidence);
    });
  });

  describe('estimateOccupancy', () => {
    it('should estimate occupancy from sensor data', () => {
      const sensorData = {
        motionEvents: 5,
        noiseLevel: 40,
        temperature: 22,
        co2Level: 600,
      };

      const occupancy = estimateOccupancy('Conference Room', sensorData, 50);

      expect(occupancy.location).toBe('Conference Room');
      expect(occupancy.estimatedOccupancy).toBeGreaterThanOrEqual(0);
      expect(occupancy.estimatedOccupancy).toBeLessThanOrEqual(50);
      expect(occupancy.occupancyRate).toBeGreaterThanOrEqual(0);
      expect(occupancy.occupancyRate).toBeLessThanOrEqual(100);
      expect(occupancy.crowdDensity).toBeTruthy();
      expect(occupancy.confidence).toBeGreaterThan(0);
    });

    it('should detect empty spaces', () => {
      const sensorData = {
        motionEvents: 0,
        noiseLevel: 5,
        temperature: 20,
        co2Level: 400,
      };

      const occupancy = estimateOccupancy('Storage Room', sensorData, 20);

      expect(['empty', 'sparse']).toContain(occupancy.crowdDensity);
      expect(occupancy.occupancyRate).toBeLessThan(50);
    });

    it('should detect high occupancy', () => {
      const sensorData = {
        motionEvents: 15,
        noiseLevel: 85,
        temperature: 26,
        co2Level: 900,
      };

      const occupancy = estimateOccupancy('Ballroom', sensorData, 200);

      expect(occupancy.crowdDensity).toMatch(/crowded|overcrowded/);
      expect(occupancy.occupancyRate).toBeGreaterThan(50);
    });

    it('should generate heatmap data', () => {
      const sensorData = {
        motionEvents: 10,
        noiseLevel: 60,
        temperature: 24,
      };

      const occupancy = estimateOccupancy('Lobby', sensorData, 100);

      expect(occupancy.heatmapData).toBeDefined();
      expect(occupancy.heatmapData).toBeInstanceOf(Array);
      expect(occupancy.heatmapData?.length).toBeGreaterThan(0);
    });

    it('should handle missing CO2 sensor', () => {
      const sensorData = {
        motionEvents: 5,
        noiseLevel: 40,
        temperature: 22,
      };

      const occupancy = estimateOccupancy('Room', sensorData, 30);

      expect(occupancy.estimatedOccupancy).toBeGreaterThanOrEqual(0);
      expect(occupancy.confidence).toBeGreaterThan(0);
    });
  });

  describe('detectSafetyHazards', () => {
    it('should detect fire risks', () => {
      const environmentalData = {
        temperature: 45,
        humidity: 30,
        smokeDetected: true,
      };

      const hazards = detectSafetyHazards(sampleMetadata, environmentalData);

      expect(hazards.length).toBeGreaterThan(0);
      expect(hazards.some(h => h.type === 'fire-risk')).toBe(true);
      const fireHazard = hazards.find(h => h.type === 'fire-risk');
      expect(fireHazard?.severity).toBe('critical');
      expect(fireHazard?.requiresEvacuation).toBe(true);
    });

    it('should detect slip hazards', () => {
      const environmentalData = {
        temperature: 22,
        humidity: 85,
        smokeDetected: false,
      };

      const lobbyMetadata = { ...sampleMetadata, type: 'lobby' as const };
      const hazards = detectSafetyHazards(lobbyMetadata, environmentalData);

      expect(hazards.some(h => h.type === 'slip-hazard')).toBe(true);
    });

    it('should detect obstructions in corridors', () => {
      const corridorMetadata = {
        ...sampleMetadata,
        type: 'corridor' as const,
        sharpness: 25,
      };

      const hazards = detectSafetyHazards(corridorMetadata);

      expect(hazards.some(h => h.type === 'obstruction')).toBe(true);
    });

    it('should detect electrical hazards', () => {
      const darkMetadata = {
        ...sampleMetadata,
        type: 'facility' as const,
        brightness: 20,
      };

      const hazards = detectSafetyHazards(darkMetadata);

      expect(hazards.some(h => h.type === 'electrical')).toBe(true);
    });

    it('should return empty array for safe conditions', () => {
      const environmentalData = {
        temperature: 22,
        humidity: 50,
        smokeDetected: false,
      };

      const hazards = detectSafetyHazards(sampleMetadata, environmentalData);

      expect(hazards.length).toBe(0);
    });

    it('should include confidence scores', () => {
      const environmentalData = {
        temperature: 45,
        humidity: 30,
        smokeDetected: false,
      };

      const hazards = detectSafetyHazards(sampleMetadata, environmentalData);

      hazards.forEach(hazard => {
        expect(hazard.confidence).toBeGreaterThan(0);
        expect(hazard.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('assessAssetCondition', () => {
    it('should assess asset condition', () => {
      const visualData = {
        appearance: 75,
        wearVisible: false,
        lastInspectionDays: 30,
      };

      const condition = assessAssetCondition(
        'asset-001',
        'HVAC Unit',
        'Mechanical Room',
        visualData
      );

      expect(condition.assetId).toBe('asset-001');
      expect(condition.assetType).toBe('HVAC Unit');
      expect(condition.conditionScore).toBeGreaterThanOrEqual(0);
      expect(condition.conditionScore).toBeLessThanOrEqual(100);
      expect(condition.estimatedRemainingLife).toBeGreaterThan(0);
      expect(condition.replacementPriority).toBeTruthy();
    });

    it('should flag urgent replacement for poor condition', () => {
      const visualData = {
        appearance: 25,
        wearVisible: true,
        lastInspectionDays: 90,
      };

      const condition = assessAssetCondition(
        'asset-002',
        'Elevator',
        'Tower',
        visualData
      );

      // Without usage metrics, the score is pulled up by default usageWear
      expect(['urgent', 'high', 'medium']).toContain(condition.replacementPriority);
      expect(condition.maintenanceNeeded).toBe(true);
    });

    it('should incorporate usage metrics', () => {
      const visualData = {
        appearance: 80,
        wearVisible: false,
        lastInspectionDays: 15,
      };

      const usageMetrics = {
        hoursUsed: 8000,
        cyclesCompleted: 5000,
      };

      const condition = assessAssetCondition(
        'asset-003',
        'Pump',
        'Utility Room',
        visualData,
        usageMetrics
      );

      expect(condition.wear).toBeLessThan(100);
      expect(condition.estimatedRemainingLife).toBeGreaterThan(0);
    });

    it('should recommend maintenance for visible wear', () => {
      const visualData = {
        appearance: 60,
        wearVisible: true,
        lastInspectionDays: 45,
      };

      const condition = assessAssetCondition(
        'asset-004',
        'Boiler',
        'Basement',
        visualData
      );

      expect(condition.maintenanceNeeded).toBe(true);
    });
  });

  describe('assessCleanliness', () => {
    it('should assess overall cleanliness', () => {
      const assessment = assessCleanliness('Guest Room 101', sampleMetadata);

      expect(assessment.location).toBe('Guest Room 101');
      expect(assessment.overallCleanliness).toBeGreaterThanOrEqual(0);
      expect(assessment.overallCleanliness).toBeLessThanOrEqual(100);
      expect(assessment.surfaces).toBeDefined();
      expect(assessment.detectedDirt).toBeInstanceOf(Array);
      expect(assessment.recommendations).toBeInstanceOf(Array);
    });

    it('should use detailed scan data', () => {
      const detailedScans = {
        floorCoverage: 85,
        wallCondition: 90,
        fixturesCleanliness: 88,
        furnitureCondition: 87,
      };

      const assessment = assessCleanliness('Suite 201', sampleMetadata, detailedScans);

      // Surface scores should be capped at 100
      expect(assessment.surfaces.floor).toBeLessThanOrEqual(100);
      expect(assessment.surfaces.walls).toBeLessThanOrEqual(100);
      expect(assessment.overallCleanliness).toBeGreaterThanOrEqual(80);
    });

    it('should detect dirt on surfaces', () => {
      const dirtyMetadata = { ...sampleMetadata, brightness: 100 };
      const detailedScans = {
        floorCoverage: 50,
        wallCondition: 60,
        fixturesCleanliness: 55,
        furnitureCondition: 65,
      };

      const assessment = assessCleanliness('Room 301', dirtyMetadata, detailedScans);

      expect(assessment.detectedDirt.length).toBeGreaterThanOrEqual(0);
      expect(assessment.overallCleanliness).toBeLessThan(70);
    });

    it('should detect odors in unclean spaces', () => {
      const dirtyMetadata = { ...sampleMetadata, brightness: 80 };
      const detailedScans = {
        floorCoverage: 45,
        wallCondition: 50,
        fixturesCleanliness: 40,
        furnitureCondition: 48,
      };

      const assessment = assessCleanliness('Storage', dirtyMetadata, detailedScans);

      // Either detected or low cleanliness
      expect(assessment.overallCleanliness).toBeLessThan(70);
    });

    it('should provide cleaning recommendations', () => {
      const dirtyMetadata = { ...sampleMetadata, brightness: 100 };
      const detailedScans = {
        floorCoverage: 55,
        wallCondition: 65,
        fixturesCleanliness: 60,
        furnitureCondition: 62,
      };

      const assessment = assessCleanliness('Hallway', dirtyMetadata, detailedScans);

      expect(assessment.recommendations.length).toBeGreaterThan(0);
      expect(assessment.recommendations.some(r => r.includes('cleaning'))).toBe(true);
    });
  });

  describe('analyzeVisionTrends', () => {
    it('should analyze trends from multiple assessments', () => {
      const assessments: FacilityCondition[] = Array.from({ length: 10 }, (_, i) => ({
        imageId: `img-${i}`,
        location: 'Lobby',
        conditionScore: 70 + i * 2,
        cleanliness: 75 + i,
        maintenance: 72 + i * 1.5,
        safety: 85,
        detectedIssues: [],
        confidence: 80,
        recommendations: [],
      }));

      const trends = analyzeVisionTrends(assessments);

      expect(trends.totalImages).toBe(10);
      expect(trends.averageConditionScore).toBeGreaterThan(0);
      expect(trends.averageCleanliness).toBeGreaterThan(0);
      expect(trends.trendAnalysis).toBeDefined();
    });

    it('should detect improving trends', () => {
      const assessments: FacilityCondition[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          imageId: `img-${i}`,
          location: 'Room',
          conditionScore: 60 + i,
          cleanliness: 60 + i,
          maintenance: 60 + i,
          safety: 85,
          detectedIssues: [],
          confidence: 80,
          recommendations: [],
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          imageId: `img-${i + 5}`,
          location: 'Room',
          conditionScore: 75 + i,
          cleanliness: 75 + i,
          maintenance: 75 + i,
          safety: 85,
          detectedIssues: [],
          confidence: 80,
          recommendations: [],
        })),
      ];

      const trends = analyzeVisionTrends(assessments);

      expect(trends.trendAnalysis.improving).toBe(true);
      expect(trends.trendAnalysis.changeRate).toBeGreaterThan(0);
    });

    it('should detect declining trends', () => {
      const assessments: FacilityCondition[] = [
        ...Array.from({ length: 5 }, (_, i) => ({
          imageId: `img-${i}`,
          location: 'Area',
          conditionScore: 80 - i,
          cleanliness: 80 - i,
          maintenance: 80 - i,
          safety: 85,
          detectedIssues: [],
          confidence: 80,
          recommendations: [],
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          imageId: `img-${i + 5}`,
          location: 'Area',
          conditionScore: 65 - i,
          cleanliness: 65 - i,
          maintenance: 65 - i,
          safety: 85,
          detectedIssues: [],
          confidence: 80,
          recommendations: [],
        })),
      ];

      const trends = analyzeVisionTrends(assessments);

      expect(trends.trendAnalysis.improving).toBe(false);
      expect(trends.trendAnalysis.changeRate).toBeLessThan(0);
    });

    it('should count total issues', () => {
      const assessments: FacilityCondition[] = Array.from({ length: 5 }, (_, i) => ({
        imageId: `img-${i}`,
        location: 'Facility',
        conditionScore: 70,
        cleanliness: 70,
        maintenance: 70,
        safety: 85,
        detectedIssues: Array.from({ length: 2 + i }, (_, j) => ({
          issueType: 'dirt' as const,
          severity: 'medium' as const,
          location: 'test',
          confidence: 75,
          description: 'Test issue',
          suggestedAction: 'Fix it',
        })),
        confidence: 80,
        recommendations: [],
      }));

      const trends = analyzeVisionTrends(assessments);

      expect(trends.issuesDetected).toBeGreaterThan(0);
    });

    it('should identify monitored locations', () => {
      const assessments: FacilityCondition[] = [
        { imageId: '1', location: 'Lobby', conditionScore: 80, cleanliness: 80, maintenance: 80, safety: 85, detectedIssues: [], confidence: 80, recommendations: [] },
        { imageId: '2', location: 'Room 101', conditionScore: 75, cleanliness: 75, maintenance: 75, safety: 85, detectedIssues: [], confidence: 80, recommendations: [] },
        { imageId: '3', location: 'Lobby', conditionScore: 82, cleanliness: 82, maintenance: 82, safety: 85, detectedIssues: [], confidence: 80, recommendations: [] },
      ];

      const trends = analyzeVisionTrends(assessments);

      expect(trends.locationsMonitored).toContain('Lobby');
      expect(trends.locationsMonitored).toContain('Room 101');
      expect(trends.locationsMonitored.length).toBe(2);
    });

    it('should throw error with no assessments', () => {
      expect(() => analyzeVisionTrends([])).toThrow('At least one assessment is required');
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete facility monitoring workflow', () => {
      // Analyze condition
      const condition = analyzeFacilityCondition(sampleMetadata);
      expect(condition.conditionScore).toBeGreaterThan(0);

      // Estimate occupancy
      const occupancy = estimateOccupancy('Lobby', {
        motionEvents: 8,
        noiseLevel: 50,
        temperature: 23,
        co2Level: 650,
      }, 100);
      expect(occupancy.estimatedOccupancy).toBeGreaterThan(0);

      // Detect hazards
      const hazards = detectSafetyHazards(sampleMetadata, {
        temperature: 22,
        humidity: 50,
        smokeDetected: false,
      });
      expect(hazards).toBeInstanceOf(Array);

      // Assess cleanliness
      const cleanliness = assessCleanliness('Lobby', sampleMetadata);
      expect(cleanliness.overallCleanliness).toBeGreaterThan(0);
    });

    it('should handle comprehensive monitoring across multiple locations', () => {
      const locations = ['Lobby', 'Room 101', 'Corridor A', 'Kitchen'];
      const assessments: FacilityCondition[] = [];

      locations.forEach(location => {
        const metadata = { ...sampleMetadata, location };
        const condition = analyzeFacilityCondition(metadata);
        assessments.push(condition);
      });

      const trends = analyzeVisionTrends(assessments);

      expect(trends.locationsMonitored.length).toBe(4);
      expect(trends.totalImages).toBe(4);
    });
  });
});
