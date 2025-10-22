import {
  calculateQualityScore,
  evaluateStaffPerformance,
  analyzeQualityTrends,
  predictDefects,
  RoomInspection,
  QUALITY_SCORING_WEIGHTS,
  QUALITY_RATING_BENCHMARKS,
} from '../inspector';

describe('Quality Assurance & Inspection Automation', () => {
  const sampleInspection: RoomInspection = {
    roomId: 'room-001',
    roomNumber: '101',
    roomType: 'standard',
    inspectionDate: new Date('2025-01-15'),
    inspectorId: 'inspector-001',
    cleanliness: {
      bathroom: 8,
      bedroom: 9,
      entryway: 8,
      overallCleanliness: 8,
    },
    maintenance: {
      plumbing: 'good',
      electrical: 'good',
      hvac: 'good',
      furniture: 'good',
      fixtures: 'good',
    },
    amenities: {
      towels: true,
      toiletries: true,
      minibar: true,
      coffeemaker: true,
      remoteControl: true,
      safe: true,
    },
    defects: [],
    inspectionDurationMinutes: 15,
    hasPhotos: true,
    photoCount: 3,
  };

  describe('calculateQualityScore', () => {
    describe('Overall Scoring', () => {
      it('should calculate overall quality score correctly', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      });

      it('should rate excellent performance correctly', () => {
        const excellentInspection: RoomInspection = {
          ...sampleInspection,
          cleanliness: { bathroom: 10, bedroom: 10, entryway: 10, overallCleanliness: 10 },
        };

        const result = calculateQualityScore(excellentInspection);

        expect(result.rating).toBe('excellent');
        expect(result.overallScore).toBeGreaterThanOrEqual(90);
      });

      it('should rate poor performance correctly', () => {
        const poorInspection: RoomInspection = {
          ...sampleInspection,
          cleanliness: { bathroom: 3, bedroom: 4, entryway: 3, overallCleanliness: 3 },
          maintenance: {
            plumbing: 'urgent',
            electrical: 'needs-attention',
            hvac: 'urgent',
            furniture: 'needs-attention',
            fixtures: 'urgent',
          },
          amenities: {
            towels: false,
            toiletries: false,
            minibar: false,
            coffeemaker: false,
            remoteControl: false,
            safe: false,
          },
          defects: [
            {
              type: 'damage',
              location: 'bathroom',
              severity: 'severe',
              description: 'Broken toilet',
            },
          ],
        };

        const result = calculateQualityScore(poorInspection);

        expect(result.rating).toBe('poor');
        expect(result.overallScore).toBeLessThan(60);
      });
    });

    describe('Component Scores', () => {
      it('should calculate cleanliness score from sub-scores', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.cleanlinessScore).toBeGreaterThanOrEqual(0);
        expect(result.cleanlinessScore).toBeLessThanOrEqual(100);

        const expectedScore =
          ((sampleInspection.cleanliness.bathroom +
            sampleInspection.cleanliness.bedroom +
            sampleInspection.cleanliness.entryway +
            sampleInspection.cleanliness.overallCleanliness) /
            4 /
            10) *
          100;

        expect(result.cleanlinessScore).toBeCloseTo(expectedScore, -1); // Within 1 point
      });

      it('should calculate maintenance score based on system status', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.maintenanceScore).toBe(100); // All systems 'good'
      });

      it('should penalize maintenance score for issues', () => {
        const inspectionWithIssues: RoomInspection = {
          ...sampleInspection,
          maintenance: {
            plumbing: 'urgent',
            electrical: 'needs-attention',
            hvac: 'good',
            furniture: 'good',
            fixtures: 'good',
          },
        };

        const result = calculateQualityScore(inspectionWithIssues);

        expect(result.maintenanceScore).toBeLessThan(100);
        expect(result.maintenanceScore).toBeGreaterThanOrEqual(0);
      });

      it('should calculate amenities score correctly', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.amenitiesScore).toBe(100); // All amenities present
      });

      it('should penalize missing amenities', () => {
        const inspectionMissingAmenities: RoomInspection = {
          ...sampleInspection,
          amenities: {
            towels: true,
            toiletries: false,
            minibar: false,
            coffeemaker: true,
            remoteControl: true,
            safe: false,
          },
        };

        const result = calculateQualityScore(inspectionMissingAmenities);

        expect(result.amenitiesScore).toBeLessThan(100);
        expect(result.amenitiesScore).toBe(50); // 3 out of 6
      });

      it('should calculate compliance score based on defects', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.complianceScore).toBe(100); // No defects
      });

      it('should penalize compliance score for defects', () => {
        const inspectionWithDefects: RoomInspection = {
          ...sampleInspection,
          defects: [
            { type: 'stain', location: 'carpet', severity: 'minor', description: 'Small stain' },
            { type: 'damage', location: 'wall', severity: 'moderate', description: 'Dent in wall' },
            { type: 'odor', location: 'room', severity: 'severe', description: 'Strong odor' },
          ],
        };

        const result = calculateQualityScore(inspectionWithDefects);

        expect(result.complianceScore).toBeLessThan(100);
        // -5 for minor, -10 for moderate, -20 for severe = 100 - 35 = 65
        expect(result.complianceScore).toBe(65);
      });
    });

    describe('Defect Tracking', () => {
      it('should count defects by severity', () => {
        const inspectionWithDefects: RoomInspection = {
          ...sampleInspection,
          defects: [
            { type: 'stain', location: 'carpet', severity: 'minor', description: 'Small stain' },
            { type: 'stain', location: 'bedding', severity: 'minor', description: 'Tiny stain' },
            { type: 'damage', location: 'wall', severity: 'moderate', description: 'Scratch' },
            { type: 'odor', location: 'room', severity: 'severe', description: 'Strong odor' },
          ],
        };

        const result = calculateQualityScore(inspectionWithDefects);

        expect(result.minorIssues).toBe(2);
        expect(result.moderateIssues).toBe(1);
        expect(result.criticalIssues).toBe(1);
      });
    });

    describe('Pass/Fail Logic', () => {
      it('should pass inspection with good scores and no critical issues', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.passedInspection).toBe(true);
        expect(result.failureReasons).toBeUndefined();
      });

      it('should fail inspection with critical defects', () => {
        const inspectionWithCritical: RoomInspection = {
          ...sampleInspection,
          defects: [
            {
              type: 'damage',
              location: 'bathroom',
              severity: 'severe',
              description: 'Broken toilet',
            },
          ],
        };

        const result = calculateQualityScore(inspectionWithCritical);

        expect(result.passedInspection).toBe(false);
        expect(result.failureReasons).toBeDefined();
        expect(result.failureReasons?.length).toBeGreaterThan(0);
      });

      it('should fail inspection with low overall score', () => {
        const lowScoreInspection: RoomInspection = {
          ...sampleInspection,
          cleanliness: { bathroom: 2, bedroom: 2, entryway: 2, overallCleanliness: 2 },
          maintenance: {
            plumbing: 'needs-attention',
            electrical: 'needs-attention',
            hvac: 'good',
            furniture: 'needs-attention',
            fixtures: 'good',
          },
        };

        const result = calculateQualityScore(lowScoreInspection);

        expect(result.passedInspection).toBe(false);
        expect(result.failureReasons).toBeDefined();
      });
    });

    describe('Recommendations', () => {
      it('should generate recommendations based on performance', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.recommendations).toBeInstanceOf(Array);
        expect(result.recommendations.length).toBeGreaterThan(0);
      });

      it('should recommend urgent cleaning for low cleanliness', () => {
        const dirtyInspection: RoomInspection = {
          ...sampleInspection,
          cleanliness: { bathroom: 4, bedroom: 5, entryway: 4, overallCleanliness: 4 },
        };

        const result = calculateQualityScore(dirtyInspection);

        expect(
          result.recommendations.some((r) =>
            r.toLowerCase().includes('clean')
          )
        ).toBe(true);
      });

      it('should highlight critical defects in recommendations', () => {
        const criticalInspection: RoomInspection = {
          ...sampleInspection,
          defects: [
            {
              type: 'damage',
              location: 'bathroom',
              severity: 'severe',
              description: 'Broken shower',
            },
          ],
        };

        const result = calculateQualityScore(criticalInspection);

        expect(
          result.recommendations.some((r) => r.includes('CRITICAL'))
        ).toBe(true);
      });

      it('should congratulate excellent performance', () => {
        const excellentInspection: RoomInspection = {
          ...sampleInspection,
          cleanliness: { bathroom: 10, bedroom: 10, entryway: 10, overallCleanliness: 10 },
        };

        const result = calculateQualityScore(excellentInspection);

        expect(
          result.recommendations.some((r) => r.includes('EXCELLENT'))
        ).toBe(true);
      });
    });

    describe('Corrective Actions', () => {
      it('should generate corrective actions for issues', () => {
        const inspectionWithIssues: RoomInspection = {
          ...sampleInspection,
          maintenance: {
            ...sampleInspection.maintenance,
            plumbing: 'urgent',
          },
          defects: [
            { type: 'stain', location: 'carpet', severity: 'minor', description: 'Coffee stain' },
          ],
        };

        const result = calculateQualityScore(inspectionWithIssues);

        expect(result.correctiveActions).toBeInstanceOf(Array);
        expect(result.correctiveActions.length).toBeGreaterThan(0);
        expect(result.correctiveActions.every((a) => a.action && a.priority)).toBe(true);
      });

      it('should prioritize critical issues as immediate', () => {
        const criticalInspection: RoomInspection = {
          ...sampleInspection,
          defects: [
            {
              type: 'damage',
              location: 'room',
              severity: 'severe',
              description: 'Broken window',
            },
          ],
        };

        const result = calculateQualityScore(criticalInspection);

        expect(
          result.correctiveActions.some((a) => a.priority === 'immediate')
        ).toBe(true);
      });

      it('should estimate cost and time for each action', () => {
        const inspectionWithIssues: RoomInspection = {
          ...sampleInspection,
          maintenance: {
            ...sampleInspection.maintenance,
            electrical: 'needs-attention',
          },
        };

        const result = calculateQualityScore(inspectionWithIssues);

        result.correctiveActions.forEach((action) => {
          expect(action.estimatedCost).toBeGreaterThanOrEqual(0);
          expect(action.estimatedTime).toBeTruthy();
        });
      });
    });

    describe('Confidence Calculation', () => {
      it('should calculate confidence score', () => {
        const result = calculateQualityScore(sampleInspection);

        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });

      it('should have higher confidence with photos', () => {
        const withPhotos = { ...sampleInspection, hasPhotos: true, photoCount: 5 };
        const withoutPhotos = { ...sampleInspection, hasPhotos: false, photoCount: 0 };

        const result1 = calculateQualityScore(withPhotos);
        const result2 = calculateQualityScore(withoutPhotos);

        expect(result1.confidence).toBeGreaterThan(result2.confidence);
      });
    });
  });

  describe('evaluateStaffPerformance', () => {
    const staffInspections: RoomInspection[] = [
      { ...sampleInspection, inspectionDate: new Date('2025-01-01') },
      { ...sampleInspection, inspectionDate: new Date('2025-01-02') },
      { ...sampleInspection, inspectionDate: new Date('2025-01-03') },
      { ...sampleInspection, inspectionDate: new Date('2025-01-04') },
      { ...sampleInspection, inspectionDate: new Date('2025-01-05') },
    ];

    it('should evaluate staff performance from multiple inspections', () => {
      const result = evaluateStaffPerformance(
        'staff-001',
        'John Doe',
        'housekeeping',
        staffInspections,
        '2025-01'
      );

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate component scores', () => {
      const result = evaluateStaffPerformance(
        'staff-001',
        'John Doe',
        'housekeeping',
        staffInspections,
        '2025-01'
      );

      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.efficiencyScore).toBeGreaterThanOrEqual(0);
      expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
    });

    it('should track inspection metrics', () => {
      const result = evaluateStaffPerformance(
        'staff-001',
        'John Doe',
        'housekeeping',
        staffInspections,
        '2025-01'
      );

      expect(result.roomsInspected).toBe(5);
      expect(result.averageInspectionTime).toBeGreaterThan(0);
      expect(result.defectsFound).toBeGreaterThanOrEqual(0);
    });

    it('should assign performance rating', () => {
      const result = evaluateStaffPerformance(
        'staff-001',
        'John Doe',
        'housekeeping',
        staffInspections,
        '2025-01'
      );

      expect([
        'top-performer',
        'above-average',
        'average',
        'below-average',
        'needs-support',
      ]).toContain(result.performanceRating);
    });

    it('should identify strengths and areas for improvement', () => {
      const result = evaluateStaffPerformance(
        'staff-001',
        'John Doe',
        'housekeeping',
        staffInspections,
        '2025-01'
      );

      expect(result.strengths).toBeInstanceOf(Array);
      expect(result.areasForImprovement).toBeInstanceOf(Array);
      expect(result.trainingNeeded).toBeInstanceOf(Array);
    });

    it('should determine performance trend', () => {
      const result = evaluateStaffPerformance(
        'staff-001',
        'John Doe',
        'housekeeping',
        staffInspections,
        '2025-01'
      );

      expect(['improving', 'stable', 'declining']).toContain(result.scoresTrend);
    });

    it('should throw error with no inspections', () => {
      expect(() =>
        evaluateStaffPerformance('staff-001', 'John Doe', 'housekeeping', [], '2025-01')
      ).toThrow('Need at least one inspection');
    });
  });

  describe('analyzeQualityTrends', () => {
    const trendData = [
      {
        inspection: { ...sampleInspection, inspectionDate: new Date('2024-10-15') },
        date: new Date('2024-10-15'),
      },
      {
        inspection: { ...sampleInspection, inspectionDate: new Date('2024-10-20') },
        date: new Date('2024-10-20'),
      },
      {
        inspection: { ...sampleInspection, inspectionDate: new Date('2024-11-10') },
        date: new Date('2024-11-10'),
      },
      {
        inspection: { ...sampleInspection, inspectionDate: new Date('2024-11-25') },
        date: new Date('2024-11-25'),
      },
      {
        inspection: { ...sampleInspection, inspectionDate: new Date('2024-12-05') },
        date: new Date('2024-12-05'),
      },
    ];

    it('should group inspections by month', () => {
      const trends = analyzeQualityTrends(trendData);

      expect(trends.length).toBeGreaterThan(0);
      expect(trends.every((t) => t.period.match(/\d{4}-\d{2}/))).toBe(true);
    });

    it('should calculate monthly averages', () => {
      const trends = analyzeQualityTrends(trendData);

      trends.forEach((trend) => {
        expect(trend.averageScore).toBeGreaterThanOrEqual(0);
        expect(trend.averageScore).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate pass rate', () => {
      const trends = analyzeQualityTrends(trendData);

      trends.forEach((trend) => {
        expect(trend.passRate).toBeGreaterThanOrEqual(0);
        expect(trend.passRate).toBeLessThanOrEqual(100);
      });
    });

    it('should determine trend direction', () => {
      const trends = analyzeQualityTrends(trendData);

      trends.forEach((trend) => {
        expect(['improving', 'stable', 'declining']).toContain(trend.trend);
      });
    });

    it('should forecast next month score', () => {
      const trends = analyzeQualityTrends(trendData);

      trends.forEach((trend) => {
        expect(trend.forecastNextMonth).toBeGreaterThanOrEqual(0);
        expect(trend.forecastNextMonth).toBeLessThanOrEqual(100);
      });
    });

    it('should count critical issues', () => {
      const trends = analyzeQualityTrends(trendData);

      trends.forEach((trend) => {
        expect(trend.criticalIssuesCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('predictDefects', () => {
    it('should predict defect probability', () => {
      const prediction = predictDefects('room-101', 'standard', 15, 0.3);

      expect(prediction.defectProbability).toBeGreaterThanOrEqual(0);
      expect(prediction.defectProbability).toBeLessThanOrEqual(1);
    });

    it('should assign risk level', () => {
      const prediction = predictDefects('room-101', 'standard', 15, 0.3);

      expect(['low', 'medium', 'high']).toContain(prediction.riskLevel);
    });

    it('should recommend action based on risk', () => {
      const prediction = predictDefects('room-101', 'standard', 15, 0.3);

      expect(prediction.recommendedAction).toBeTruthy();
      expect(typeof prediction.recommendedAction).toBe('string');
    });

    it('should show higher risk with more days since inspection', () => {
      const recent = predictDefects('room-101', 'standard', 5, 0.3);
      const old = predictDefects('room-101', 'standard', 25, 0.3);

      expect(old.defectProbability).toBeGreaterThan(recent.defectProbability);
    });

    it('should show higher risk for suites than standard rooms', () => {
      const standard = predictDefects('room-101', 'standard', 15, 0.3);
      const suite = predictDefects('room-201', 'suite', 15, 0.3);

      expect(suite.defectProbability).toBeGreaterThan(standard.defectProbability);
    });

    it('should recommend immediate inspection for high risk', () => {
      const highRisk = predictDefects('room-101', 'suite', 30, 0.8);

      expect(highRisk.riskLevel).toBe('high');
      expect(highRisk.recommendedAction.toLowerCase()).toContain('immediate');
    });
  });

  describe('Constants and Exports', () => {
    it('should export scoring weights', () => {
      expect(QUALITY_SCORING_WEIGHTS).toBeDefined();
      expect(QUALITY_SCORING_WEIGHTS.cleanliness).toBe(0.4);
      expect(QUALITY_SCORING_WEIGHTS.maintenance).toBe(0.3);
      expect(QUALITY_SCORING_WEIGHTS.amenities).toBe(0.2);
      expect(QUALITY_SCORING_WEIGHTS.compliance).toBe(0.1);

      // Weights should sum to 1.0
      const sum = Object.values(QUALITY_SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should export rating benchmarks', () => {
      expect(QUALITY_RATING_BENCHMARKS).toBeDefined();
      expect(QUALITY_RATING_BENCHMARKS.excellent).toBe(90);
      expect(QUALITY_RATING_BENCHMARKS.good).toBe(80);
      expect(QUALITY_RATING_BENCHMARKS.satisfactory).toBe(70);
    });
  });
});
