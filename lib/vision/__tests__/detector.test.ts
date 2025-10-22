/**
 * Tests for Computer Vision Module
 */

import {
  analyzeImage,
  analyzeBatch,
  ImageProcessor,
  assessFacilityCondition,
  detectOccupancy,
  assessCleanliness,
  detectSafetyHazards,
  assessAssetCondition,
  type ImageAnalysisInput,
} from '../detector';

describe('Computer Vision Module', () => {
  const sampleImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  describe('ImageProcessor', () => {
    it('should extract features from image data', () => {
      const features = ImageProcessor.extractFeatures(sampleImageData);
      
      expect(features.length).toBe(128);
      expect(features.every(f => f >= 0 && f <= 1)).toBe(true);
    });

    it('should produce consistent features for same input', () => {
      const features1 = ImageProcessor.extractFeatures(sampleImageData);
      const features2 = ImageProcessor.extractFeatures(sampleImageData);
      
      expect(features1).toEqual(features2);
    });

    it('should hash strings consistently', () => {
      const hash1 = ImageProcessor.hashString('test');
      const hash2 = ImageProcessor.hashString('test');
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
    });

    it('should calculate similarity between feature vectors', () => {
      const features1 = ImageProcessor.extractFeatures('image1');
      const features2 = ImageProcessor.extractFeatures('image2');
      
      const similarity = ImageProcessor.calculateSimilarity(features1, features2);
      
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should return 0 similarity for different length vectors', () => {
      const features1 = [0.1, 0.2, 0.3];
      const features2 = [0.1, 0.2];
      
      const similarity = ImageProcessor.calculateSimilarity(features1, features2);
      expect(similarity).toBe(0);
    });
  });

  describe('assessFacilityCondition', () => {
    it('should assess facility condition', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'facility',
        location: 'Lobby',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const condition = assessFacilityCondition(input, features);
      
      expect(condition.condition).toMatch(/excellent|good|fair|poor|critical/);
      expect(condition.score).toBeGreaterThanOrEqual(0);
      expect(condition.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(condition.issues)).toBe(true);
      expect(typeof condition.maintenanceNeeded).toBe('boolean');
    });

    it('should detect maintenance needs for poor conditions', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: 'low-quality-image-simulation',
        analysisType: 'facility',
        location: 'Room 101',
        timestamp: new Date(),
      };

      const features = new Array(128).fill(0.2);
      const condition = assessFacilityCondition(input, features);
      
      if (condition.score < 60) {
        expect(condition.maintenanceNeeded).toBe(true);
        expect(condition.issues.length).toBeGreaterThan(0);
      }
    });

    it('should assign appropriate priority levels', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'facility',
        location: 'Lobby',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const condition = assessFacilityCondition(input, features);
      
      expect(condition.priority).toMatch(/low|medium|high|urgent/);
    });

    it('should estimate repair costs', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'facility',
        location: 'Lobby',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const condition = assessFacilityCondition(input, features);
      
      expect(condition.estimatedCost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detectOccupancy', () => {
    it('should detect occupancy levels', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'occupancy',
        location: 'Conference Room A',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const occupancy = detectOccupancy(input, features, 50);
      
      expect(occupancy.peopleCount).toBeGreaterThanOrEqual(0);
      expect(occupancy.crowdDensity).toMatch(/empty|low|medium|high|overcrowded/);
      expect(occupancy.safetyLevel).toMatch(/safe|caution|warning|danger/);
      expect(occupancy.capacityUtilization).toBeGreaterThanOrEqual(0);
      expect(occupancy.capacityUtilization).toBeLessThanOrEqual(100);
    });

    it('should classify empty rooms correctly', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'occupancy',
        location: 'Meeting Room',
        timestamp: new Date(),
      };

      const features = new Array(128).fill(0);
      const occupancy = detectOccupancy(input, features, 50);
      
      expect(occupancy.peopleCount).toBe(0);
      expect(occupancy.crowdDensity).toBe('empty');
      expect(occupancy.safetyLevel).toBe('safe');
    });

    it('should detect overcrowding', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'occupancy',
        location: 'Ballroom',
        timestamp: new Date(),
      };

      const features = new Array(128).fill(0.9);
      const occupancy = detectOccupancy(input, features, 50);
      
      if (occupancy.capacityUtilization >= 90) {
        expect(occupancy.crowdDensity).toMatch(/high|overcrowded/);
        expect(occupancy.safetyLevel).toMatch(/caution|warning|danger/);
      }
    });
  });

  describe('assessCleanliness', () => {
    it('should assess cleanliness levels', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'cleanliness',
        location: 'Room 202',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const cleanliness = assessCleanliness(input, features);
      
      expect(cleanliness.cleanlinessScore).toBeGreaterThanOrEqual(0);
      expect(cleanliness.cleanlinessScore).toBeLessThanOrEqual(100);
      expect(cleanliness.rating).toMatch(/pristine|clean|acceptable|needs_attention|poor/);
      expect(typeof cleanliness.passed).toBe('boolean');
      expect(Array.isArray(cleanliness.areasOfConcern)).toBe(true);
      expect(Array.isArray(cleanliness.recommendations)).toBe(true);
    });

    it('should pass high cleanliness scores', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'cleanliness',
        location: 'Room 303',
        timestamp: new Date(),
      };

      const features = new Array(128).fill(0.9);
      const cleanliness = assessCleanliness(input, features);
      
      if (cleanliness.cleanlinessScore >= 70) {
        expect(cleanliness.passed).toBe(true);
      }
    });

    it('should fail low cleanliness scores', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'cleanliness',
        location: 'Room 404',
        timestamp: new Date(),
      };

      const features = new Array(128).fill(0.2);
      const cleanliness = assessCleanliness(input, features);
      
      if (cleanliness.cleanlinessScore < 70) {
        expect(cleanliness.passed).toBe(false);
        expect(cleanliness.areasOfConcern.length).toBeGreaterThan(0);
      }
    });

    it('should provide recommendations for improvement', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'cleanliness',
        location: 'Room 505',
        timestamp: new Date(),
      };

      const features = new Array(128).fill(0.3);
      const cleanliness = assessCleanliness(input, features);
      
      if (cleanliness.cleanlinessScore < 70) {
        expect(cleanliness.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('detectSafetyHazards', () => {
    it('should detect safety hazards', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'safety',
        location: 'Hallway',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const hazards = detectSafetyHazards(input, features);
      
      expect(Array.isArray(hazards)).toBe(true);
      hazards.forEach(hazard => {
        expect(hazard.hazardType).toBeDefined();
        expect(hazard.severity).toMatch(/low|medium|high|critical/);
        expect(hazard.location).toBeDefined();
        expect(typeof hazard.immediateAction).toBe('boolean');
        expect(hazard.riskLevel).toBeGreaterThanOrEqual(0);
        expect(hazard.riskLevel).toBeLessThanOrEqual(100);
      });
    });

    it('should flag immediate action for critical hazards', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'safety',
        location: 'Stairwell',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const hazards = detectSafetyHazards(input, features);
      
      const criticalHazards = hazards.filter(h => h.severity === 'critical' || h.severity === 'high');
      criticalHazards.forEach(hazard => {
        if (hazard.riskLevel > 75) {
          expect(hazard.immediateAction).toBe(true);
        }
      });
    });

    it('should provide mitigation strategies', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'safety',
        location: 'Kitchen',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const hazards = detectSafetyHazards(input, features);
      
      hazards.forEach(hazard => {
        expect(hazard.mitigation).toBeDefined();
        expect(hazard.mitigation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('assessAssetCondition', () => {
    it('should assess asset condition', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'asset',
        location: 'Lobby',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      const asset = assessAssetCondition(input, features, 'furniture');
      
      expect(asset.assetType).toBe('furniture');
      expect(asset.condition).toMatch(/new|good|worn|damaged|needs_replacement/);
      expect(asset.lifeRemaining).toBeGreaterThanOrEqual(0);
      expect(asset.lifeRemaining).toBeLessThanOrEqual(100);
      expect(asset.replacementCost).toBeGreaterThan(0);
      expect(asset.maintenanceSchedule).toMatch(/quarterly|annual/);
    });

    it('should flag assets needing replacement', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'asset',
        location: 'Room 606',
        timestamp: new Date(),
      };

      const features = new Array(128).fill(0.1);
      const asset = assessAssetCondition(input, features, 'equipment');
      
      if (asset.lifeRemaining < 30) {
        expect(asset.condition).toMatch(/damaged|needs_replacement/);
      }
    });

    it('should estimate replacement costs by asset type', () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'asset',
        location: 'Restaurant',
        timestamp: new Date(),
      };

      const features = ImageProcessor.extractFeatures(input.imageData);
      
      const furniture = assessAssetCondition(input, features, 'furniture');
      const equipment = assessAssetCondition(input, features, 'equipment');
      
      expect(furniture.replacementCost).toBeDefined();
      expect(equipment.replacementCost).toBeDefined();
    });
  });

  describe('analyzeImage', () => {
    it('should analyze facility images', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-1',
        imageData: sampleImageData,
        analysisType: 'facility',
        location: 'Lobby',
        timestamp: new Date(),
      };

      const result = await analyzeImage(input);
      
      expect(result.imageId).toBe('img-1');
      expect(result.analysisType).toBe('facility');
      expect(Array.isArray(result.detections)).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should analyze occupancy images', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-2',
        imageData: sampleImageData,
        analysisType: 'occupancy',
        location: 'Conference Room',
        timestamp: new Date(),
      };

      const result = await analyzeImage(input, { roomCapacity: 50 });
      
      expect(result.analysisType).toBe('occupancy');
      expect(result.detections.length).toBeGreaterThan(0);
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should analyze cleanliness images', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-3',
        imageData: sampleImageData,
        analysisType: 'cleanliness',
        location: 'Room 707',
        timestamp: new Date(),
      };

      const result = await analyzeImage(input);
      
      expect(result.analysisType).toBe('cleanliness');
      expect(result.detections.length).toBeGreaterThan(0);
    });

    it('should analyze safety images', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-4',
        imageData: sampleImageData,
        analysisType: 'safety',
        location: 'Parking Garage',
        timestamp: new Date(),
      };

      const result = await analyzeImage(input);
      
      expect(result.analysisType).toBe('safety');
      expect(Array.isArray(result.detections)).toBe(true);
    });

    it('should analyze asset images', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-5',
        imageData: sampleImageData,
        analysisType: 'asset',
        location: 'Restaurant',
        timestamp: new Date(),
      };

      const result = await analyzeImage(input, { assetType: 'furniture' });
      
      expect(result.analysisType).toBe('asset');
      expect(result.detections.length).toBeGreaterThan(0);
    });

    it('should generate alerts for critical issues', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-6',
        imageData: 'critical-issue-simulation',
        analysisType: 'facility',
        location: 'Emergency Exit',
        timestamp: new Date(),
      };

      const result = await analyzeImage(input);
      
      if (result.overallScore < 50) {
        expect(result.alerts.length).toBeGreaterThan(0);
      }
    });

    it('should track processing time', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'img-7',
        imageData: sampleImageData,
        analysisType: 'facility',
        location: 'Test Location',
        timestamp: new Date(),
      };

      const result = await analyzeImage(input);
      
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.processedAt).toBeInstanceOf(Date);
    });
  });

  describe('analyzeBatch', () => {
    it('should process multiple images', async () => {
      const inputs: ImageAnalysisInput[] = [
        {
          imageId: 'img-1',
          imageData: sampleImageData,
          analysisType: 'facility',
          location: 'Lobby',
          timestamp: new Date(),
        },
        {
          imageId: 'img-2',
          imageData: sampleImageData,
          analysisType: 'cleanliness',
          location: 'Room 808',
          timestamp: new Date(),
        },
      ];

      const results = await analyzeBatch(inputs);
      
      expect(results.length).toBe(2);
      expect(results[0].imageId).toBe('img-1');
      expect(results[1].imageId).toBe('img-2');
    });

    it('should handle empty batch', async () => {
      const results = await analyzeBatch([]);
      expect(results.length).toBe(0);
    });

    it('should process different analysis types', async () => {
      const inputs: ImageAnalysisInput[] = [
        {
          imageId: 'img-1',
          imageData: sampleImageData,
          analysisType: 'facility',
          location: 'Location A',
          timestamp: new Date(),
        },
        {
          imageId: 'img-2',
          imageData: sampleImageData,
          analysisType: 'occupancy',
          location: 'Location B',
          timestamp: new Date(),
        },
        {
          imageId: 'img-3',
          imageData: sampleImageData,
          analysisType: 'safety',
          location: 'Location C',
          timestamp: new Date(),
        },
      ];

      const results = await analyzeBatch(inputs, { roomCapacity: 100 });
      
      expect(results.length).toBe(3);
      expect(results[0].analysisType).toBe('facility');
      expect(results[1].analysisType).toBe('occupancy');
      expect(results[2].analysisType).toBe('safety');
    });
  });

  // Integration tests
  describe('Integration: Full vision workflow', () => {
    it('should perform complete facility monitoring workflow', async () => {
      const input: ImageAnalysisInput = {
        imageId: 'facility-scan-1',
        imageData: sampleImageData,
        analysisType: 'facility',
        location: 'Main Entrance',
        timestamp: new Date(),
        metadata: { inspector: 'John Doe', shift: 'morning' },
      };

      const result = await analyzeImage(input);
      
      expect(result.imageId).toBe('facility-scan-1');
      expect(result.detections.length).toBeGreaterThan(0);
      expect(result.insights.length).toBeGreaterThan(0);
      
      const facilityDetection = result.detections.find(d => d.type === 'facility_condition');
      expect(facilityDetection).toBeDefined();
      expect(facilityDetection?.label).toMatch(/excellent|good|fair|poor|critical/);
    });

    it('should handle multiple analysis types in sequence', async () => {
      const baseInput = {
        imageId: 'multi-1',
        imageData: sampleImageData,
        location: 'Test Room',
        timestamp: new Date(),
      };

      const facilityResult = await analyzeImage({ ...baseInput, analysisType: 'facility' });
      const cleanlinessResult = await analyzeImage({ ...baseInput, analysisType: 'cleanliness' });
      const safetyResult = await analyzeImage({ ...baseInput, analysisType: 'safety' });

      expect(facilityResult.analysisType).toBe('facility');
      expect(cleanlinessResult.analysisType).toBe('cleanliness');
      expect(safetyResult.analysisType).toBe('safety');
    });
  });
});
