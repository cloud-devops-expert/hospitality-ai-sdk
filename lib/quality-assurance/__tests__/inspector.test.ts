/**
 * Tests for Quality Assurance Automation Module
 */

import {
  scoreRoomInspection,
  assessServiceQuality,
  optimizeInspectionRoute,
  evaluateStaffPerformance,
  analyzeQualityTrends,
  type RoomInspectionInput,
  type ChecklistItem,
  type ServiceQualityInput,
  type StaffPerformance,
} from '../inspector';

describe('Quality Assurance Automation Module', () => {
  describe('scoreRoomInspection', () => {
    it('should score a perfect room inspection', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-101',
        roomType: 'deluxe',
        inspectionDate: new Date(),
        inspectorId: 'inspector-1',
        checklist: [
          { category: 'cleanliness', item: 'Floor cleaned', status: 'pass' },
          { category: 'cleanliness', item: 'Bathroom spotless', status: 'pass' },
          { category: 'maintenance', item: 'AC working', status: 'pass' },
          { category: 'amenities', item: 'TV functional', status: 'pass' },
          { category: 'safety', item: 'Smoke detector working', status: 'pass' },
          { category: 'presentation', item: 'Bed made', status: 'pass' },
        ],
      };

      const score = scoreRoomInspection(input);

      expect(score.overall).toBe(100);
      expect(score.rating).toBe('excellent');
      expect(score.passedInspection).toBe(true);
      expect(score.defectsFound.length).toBe(0);
      expect(score.categoryScores.cleanliness).toBe(100);
      expect(score.categoryScores.maintenance).toBe(100);
      expect(score.categoryScores.safety).toBe(100);
    });

    it('should score a failing room inspection', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-102',
        roomType: 'standard',
        inspectionDate: new Date(),
        inspectorId: 'inspector-1',
        checklist: [
          { category: 'cleanliness', item: 'Floor dirty', status: 'fail', severity: 'major' },
          { category: 'cleanliness', item: 'Bathroom messy', status: 'fail', severity: 'moderate' },
          { category: 'maintenance', item: 'AC broken', status: 'fail', severity: 'critical' },
          { category: 'safety', item: 'Smoke detector missing', status: 'fail', severity: 'critical' },
        ],
      };

      const score = scoreRoomInspection(input);

      expect(score.overall).toBeLessThan(50);
      expect(score.rating).toBe('poor');
      expect(score.passedInspection).toBe(false);
      expect(score.defectsFound.length).toBe(4);
      expect(score.defectsFound.some(d => d.severity === 'critical')).toBe(true);
      expect(score.defectsFound.some(d => d.requiresImmediateAction)).toBe(true);
    });

    it('should handle needs-attention items', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-103',
        roomType: 'suite',
        inspectionDate: new Date(),
        inspectorId: 'inspector-2',
        checklist: [
          { category: 'cleanliness', item: 'Minor dust', status: 'needs-attention', severity: 'minor' },
          { category: 'presentation', item: 'Pillows uneven', status: 'needs-attention', severity: 'minor' },
          { category: 'maintenance', item: 'Light bulb dim', status: 'needs-attention', severity: 'minor' },
        ],
      };

      const score = scoreRoomInspection(input);

      expect(score.overall).toBeGreaterThan(60);
      expect(score.overall).toBeLessThan(90);
      expect(score.defectsFound.length).toBe(3);
      expect(score.defectsFound.every(d => d.severity === 'minor')).toBe(true);
    });

    it('should apply weighted category scores correctly', () => {
      const inputWithPoorSafety: RoomInspectionInput = {
        roomId: 'room-104',
        roomType: 'deluxe',
        inspectionDate: new Date(),
        inspectorId: 'inspector-1',
        checklist: [
          { category: 'cleanliness', item: 'Perfect', status: 'pass' },
          { category: 'maintenance', item: 'Perfect', status: 'pass' },
          { category: 'amenities', item: 'Perfect', status: 'pass' },
          { category: 'presentation', item: 'Perfect', status: 'pass' },
          { category: 'safety', item: 'Fire exit blocked', status: 'fail', severity: 'critical' },
        ],
      };

      const score = scoreRoomInspection(inputWithPoorSafety);

      // Safety has 30% weight, so failing it should significantly impact overall score
      expect(score.overall).toBeLessThan(80);
      expect(score.passedInspection).toBe(false);
    });

    it('should detect recurring issues', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-105',
        roomType: 'standard',
        inspectionDate: new Date(),
        inspectorId: 'inspector-3',
        checklist: [
          { category: 'maintenance', item: 'AC not cooling properly', status: 'fail', severity: 'moderate' },
        ],
        previousIssues: ['AC not cooling properly', 'AC making noise'],
      };

      const score = scoreRoomInspection(input);

      expect(score.recommendations.some(r => r.includes('Recurring issues'))).toBe(true);
    });

    it('should recommend urgent action for critical defects', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-106',
        roomType: 'suite',
        inspectionDate: new Date(),
        inspectorId: 'inspector-1',
        checklist: [
          { category: 'safety', item: 'Gas leak detected', status: 'fail', severity: 'critical' },
        ],
      };

      const score = scoreRoomInspection(input);

      expect(score.recommendations.some(r => r.includes('URGENT'))).toBe(true);
    });

    it('should calculate estimated fix time for defects', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-107',
        roomType: 'standard',
        inspectionDate: new Date(),
        inspectorId: 'inspector-2',
        checklist: [
          { category: 'cleanliness', item: 'Stain on carpet', status: 'fail', severity: 'minor' },
          { category: 'maintenance', item: 'Door lock broken', status: 'fail', severity: 'major' },
        ],
      };

      const score = scoreRoomInspection(input);

      expect(score.defectsFound.length).toBe(2);
      expect(score.defectsFound[0].estimatedFixTime).toBeGreaterThan(0);
      expect(score.defectsFound[1].estimatedFixTime).toBeGreaterThan(score.defectsFound[0].estimatedFixTime);
    });

    it('should handle empty checklist gracefully', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-108',
        roomType: 'deluxe',
        inspectionDate: new Date(),
        inspectorId: 'inspector-1',
        checklist: [],
      };

      const score = scoreRoomInspection(input);

      expect(score.overall).toBe(100);
      expect(score.passedInspection).toBe(true);
    });
  });

  describe('assessServiceQuality', () => {
    it('should assess excellent service quality', () => {
      const input: ServiceQualityInput = {
        serviceType: 'front-desk',
        staffId: 'staff-001',
        responseTime: 2, // 2 minutes (expected is 5)
        accuracy: 95,
        professionalismScore: 5,
        issuesResolved: 10,
        issuesEscalated: 0,
        timestamp: new Date(),
      };

      const quality = assessServiceQuality(input);

      expect(quality.overall).toBeGreaterThan(90);
      expect(quality.rating).toBe('excellent');
      expect(quality.strengths.length).toBeGreaterThan(0);
      expect(quality.improvementAreas.length).toBe(0);
    });

    it('should assess poor service quality', () => {
      const input: ServiceQualityInput = {
        serviceType: 'housekeeping',
        staffId: 'staff-002',
        responseTime: 90, // 90 minutes (expected is 30)
        accuracy: 40,
        professionalismScore: 2,
        issuesResolved: 2,
        issuesEscalated: 8,
        timestamp: new Date(),
      };

      const quality = assessServiceQuality(input);

      expect(quality.overall).toBeLessThan(60);
      expect(quality.rating).toBe('poor');
      expect(quality.improvementAreas.length).toBeGreaterThan(0);
      expect(quality.trainingNeeded).toBeDefined();
      expect(quality.trainingNeeded!.length).toBeGreaterThan(0);
    });

    it('should identify specific strength areas', () => {
      const input: ServiceQualityInput = {
        serviceType: 'concierge',
        staffId: 'staff-003',
        responseTime: 5,
        accuracy: 90,
        professionalismScore: 5,
        issuesResolved: 15,
        issuesEscalated: 2,
        timestamp: new Date(),
      };

      const quality = assessServiceQuality(input);

      expect(quality.strengths).toContain('Fast response time');
      expect(quality.strengths).toContain('High accuracy in service delivery');
      expect(quality.strengths).toContain('Excellent professional conduct');
      expect(quality.strengths).toContain('Effective problem resolution');
    });

    it('should recommend training for specific areas', () => {
      const input: ServiceQualityInput = {
        serviceType: 'room-service',
        staffId: 'staff-004',
        responseTime: 120,
        accuracy: 50,
        professionalismScore: 2,
        issuesResolved: 3,
        issuesEscalated: 7,
        timestamp: new Date(),
      };

      const quality = assessServiceQuality(input);

      expect(quality.trainingNeeded).toBeDefined();
      expect(quality.trainingNeeded).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Time management'),
          expect.stringContaining('Service standards'),
          expect.stringContaining('Customer service'),
          expect.stringContaining('Problem-solving'),
        ])
      );
    });

    it('should handle missing optional parameters', () => {
      const input: ServiceQualityInput = {
        serviceType: 'maintenance',
        staffId: 'staff-005',
        timestamp: new Date(),
      };

      const quality = assessServiceQuality(input);

      expect(quality.overall).toBeGreaterThan(0);
      expect(quality.rating).toBeTruthy();
      expect(quality.metrics.speed).toBe(75); // Default
      expect(quality.metrics.accuracy).toBe(80); // Default
    });

    it('should score different service types appropriately', () => {
      const frontDesk: ServiceQualityInput = {
        serviceType: 'front-desk',
        staffId: 'staff-001',
        responseTime: 10, // Expected: 5 minutes
        timestamp: new Date(),
      };

      const maintenance: ServiceQualityInput = {
        serviceType: 'maintenance',
        staffId: 'staff-002',
        responseTime: 10, // Expected: 60 minutes
        timestamp: new Date(),
      };

      const frontDeskQuality = assessServiceQuality(frontDesk);
      const maintenanceQuality = assessServiceQuality(maintenance);

      // Maintenance response of 10 min should score better than front-desk response of 10 min
      expect(maintenanceQuality.metrics.speed).toBeGreaterThan(frontDeskQuality.metrics.speed);
    });
  });

  describe('optimizeInspectionRoute', () => {
    it('should optimize route by minimizing floor changes', () => {
      const rooms = [
        { roomId: 'room-301', floor: 3, priority: 'medium' as const },
        { roomId: 'room-102', floor: 1, priority: 'medium' as const },
        { roomId: 'room-103', floor: 1, priority: 'medium' as const },
        { roomId: 'room-302', floor: 3, priority: 'medium' as const },
        { roomId: 'room-201', floor: 2, priority: 'medium' as const },
      ];

      const route = optimizeInspectionRoute(rooms, 1);

      // Should group by floor
      expect(route.rooms.length).toBe(5);
      expect(route.optimizationScore).toBeGreaterThan(0);

      // Check that same-floor rooms are adjacent
      const floors = route.sequence.map(s => s.floor);
      const floorChanges = floors.reduce((count, floor, idx) => {
        if (idx > 0 && floor !== floors[idx - 1]) return count + 1;
        return count;
      }, 0);

      expect(floorChanges).toBeLessThanOrEqual(4); // At most 4 changes for 5 rooms on 3 floors
    });

    it('should prioritize high-priority rooms', () => {
      const rooms = [
        { roomId: 'room-low', floor: 1, priority: 'low' as const },
        { roomId: 'room-high1', floor: 1, priority: 'high' as const },
        { roomId: 'room-high2', floor: 1, priority: 'high' as const },
        { roomId: 'room-medium', floor: 1, priority: 'medium' as const },
      ];

      const route = optimizeInspectionRoute(rooms, 1);

      // High priority rooms should come first on same floor
      expect(route.sequence[0].priority).toBe(3); // high
      expect(route.sequence[1].priority).toBe(3); // high
    });

    it('should calculate estimated time accurately', () => {
      const rooms = [
        { roomId: 'room-101', floor: 1, priority: 'high' as const }, // 25 min
        { roomId: 'room-102', floor: 1, priority: 'medium' as const }, // 20 min
        { roomId: 'room-201', floor: 2, priority: 'low' as const }, // 15 min
      ];

      const route = optimizeInspectionRoute(rooms);

      // 25 + 20 + 15 = 60 minutes for inspections
      // + 1 minute same floor + 3 minutes floor change = 64 total
      expect(route.estimatedTime).toBeGreaterThanOrEqual(60);
      expect(route.estimatedTime).toBeLessThanOrEqual(70);
    });

    it('should determine route priority correctly', () => {
      const highPriorityRooms = [
        { roomId: 'room-101', floor: 1, priority: 'high' as const },
        { roomId: 'room-102', floor: 1, priority: 'high' as const },
        { roomId: 'room-103', floor: 1, priority: 'high' as const },
        { roomId: 'room-104', floor: 1, priority: 'low' as const },
      ];

      const lowPriorityRooms = [
        { roomId: 'room-101', floor: 1, priority: 'low' as const },
        { roomId: 'room-102', floor: 1, priority: 'low' as const },
        { roomId: 'room-103', floor: 1, priority: 'low' as const },
      ];

      const highRoute = optimizeInspectionRoute(highPriorityRooms);
      const lowRoute = optimizeInspectionRoute(lowPriorityRooms);

      expect(highRoute.priority).toBe('high'); // >30% high priority
      expect(lowRoute.priority).toBe('low');
    });

    it('should start from specified floor', () => {
      const rooms = [
        { roomId: 'room-101', floor: 1, priority: 'medium' as const },
        { roomId: 'room-301', floor: 3, priority: 'medium' as const },
        { roomId: 'room-501', floor: 5, priority: 'medium' as const },
      ];

      const routeFrom1 = optimizeInspectionRoute(rooms, 1);
      const routeFrom5 = optimizeInspectionRoute(rooms, 5);

      // Route from floor 1 should start with floor 1
      expect(routeFrom1.sequence[0].floor).toBe(1);

      // Route from floor 5 should start with floor 5
      expect(routeFrom5.sequence[0].floor).toBe(5);
    });
  });

  describe('evaluateStaffPerformance', () => {
    it('should evaluate excellent staff performance', () => {
      const inspections = [
        { inspectorId: 'staff-001', score: 95, defectsFound: 3, duration: 18, expectedDuration: 20 },
        { inspectorId: 'staff-001', score: 92, defectsFound: 4, duration: 19, expectedDuration: 20 },
        { inspectorId: 'staff-001', score: 97, defectsFound: 2, duration: 17, expectedDuration: 20 },
        { inspectorId: 'staff-001', score: 93, defectsFound: 3, duration: 18, expectedDuration: 20 },
      ];

      const staffInfo = {
        staffId: 'staff-001',
        name: 'John Doe',
        role: 'Senior Inspector',
      };

      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const performance = evaluateStaffPerformance(inspections, staffInfo, period);

      expect(performance.metrics.inspectionsCompleted).toBe(4);
      expect(performance.metrics.averageScore).toBeGreaterThan(90);
      expect(performance.metrics.timeEfficiency).toBeGreaterThan(100);
      expect(performance.rating).toBe('excellent');
    });

    it('should evaluate poor staff performance', () => {
      const inspections = [
        { inspectorId: 'staff-002', score: 55, defectsFound: 1, duration: 35, expectedDuration: 20 },
        { inspectorId: 'staff-002', score: 60, defectsFound: 0, duration: 40, expectedDuration: 20 },
        { inspectorId: 'staff-002', score: 58, defectsFound: 1, duration: 38, expectedDuration: 20 },
      ];

      const staffInfo = {
        staffId: 'staff-002',
        name: 'Jane Smith',
        role: 'Junior Inspector',
      };

      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const performance = evaluateStaffPerformance(inspections, staffInfo, period);

      expect(performance.metrics.averageScore).toBeLessThan(70);
      expect(performance.metrics.timeEfficiency).toBeLessThan(80);
      expect(performance.rating).toBe('poor');
      expect(performance.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect improving trend', () => {
      const inspections = [
        // First half - lower scores
        { inspectorId: 'staff-003', score: 70, defectsFound: 2, duration: 25, expectedDuration: 20 },
        { inspectorId: 'staff-003', score: 72, defectsFound: 3, duration: 24, expectedDuration: 20 },
        // Second half - higher scores
        { inspectorId: 'staff-003', score: 85, defectsFound: 4, duration: 20, expectedDuration: 20 },
        { inspectorId: 'staff-003', score: 88, defectsFound: 5, duration: 19, expectedDuration: 20 },
      ];

      const staffInfo = {
        staffId: 'staff-003',
        name: 'Bob Johnson',
        role: 'Inspector',
      };

      const performance = evaluateStaffPerformance(
        inspections,
        staffInfo,
        { start: new Date('2025-01-01'), end: new Date('2025-01-31') }
      );

      expect(performance.trend).toBe('improving');
      expect(performance.recommendations.some(r => r.includes('positive improvement'))).toBe(true);
    });

    it('should detect declining trend', () => {
      const inspections = [
        // First half - higher scores
        { inspectorId: 'staff-004', score: 90, defectsFound: 5, duration: 18, expectedDuration: 20 },
        { inspectorId: 'staff-004', score: 88, defectsFound: 4, duration: 19, expectedDuration: 20 },
        // Second half - lower scores
        { inspectorId: 'staff-004', score: 72, defectsFound: 2, duration: 25, expectedDuration: 20 },
        { inspectorId: 'staff-004', score: 70, defectsFound: 1, duration: 26, expectedDuration: 20 },
      ];

      const staffInfo = {
        staffId: 'staff-004',
        name: 'Alice Williams',
        role: 'Inspector',
      };

      const performance = evaluateStaffPerformance(
        inspections,
        staffInfo,
        { start: new Date('2025-01-01'), end: new Date('2025-01-31') }
      );

      expect(performance.trend).toBe('declining');
      expect(performance.recommendations.some(r => r.includes('declining'))).toBe(true);
    });

    it('should provide specific recommendations', () => {
      const inspections = [
        { inspectorId: 'staff-005', score: 65, defectsFound: 0, duration: 25, expectedDuration: 20 },
        { inspectorId: 'staff-005', score: 68, defectsFound: 1, duration: 26, expectedDuration: 20 },
      ];

      const staffInfo = {
        staffId: 'staff-005',
        name: 'Charlie Brown',
        role: 'Inspector',
      };

      const performance = evaluateStaffPerformance(
        inspections,
        staffInfo,
        { start: new Date('2025-01-01'), end: new Date('2025-01-31') }
      );

      // Low defects per inspection should trigger recommendation
      expect(performance.recommendations.some(r => r.includes('thorough in defect identification'))).toBe(true);
    });

    it('should throw error with no inspections', () => {
      expect(() => {
        evaluateStaffPerformance(
          [],
          { staffId: 'staff-006', name: 'Test', role: 'Inspector' },
          { start: new Date(), end: new Date() }
        );
      }).toThrow('At least one inspection is required');
    });
  });

  describe('analyzeQualityTrends', () => {
    it('should analyze quality trends over time', () => {
      const inspections = [
        {
          roomId: 'room-101',
          roomType: 'deluxe',
          score: 85,
          timestamp: new Date('2025-01-01'),
          defects: [{ category: 'cleanliness', description: 'Minor dust' }],
        },
        {
          roomId: 'room-102',
          roomType: 'standard',
          score: 90,
          timestamp: new Date('2025-01-02'),
          defects: [],
        },
        {
          roomId: 'room-103',
          roomType: 'deluxe',
          score: 78,
          timestamp: new Date('2025-01-03'),
          defects: [{ category: 'maintenance', description: 'AC issue' }],
        },
      ];

      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const trends = analyzeQualityTrends(inspections, period);

      expect(trends.totalInspections).toBe(3);
      expect(trends.averageScore).toBeGreaterThan(75);
      expect(trends.passRate).toBeGreaterThan(50);
      expect(trends.roomTypePerformance.size).toBeGreaterThan(0);
    });

    it('should identify top issues', () => {
      const inspections = [
        {
          roomId: 'room-101',
          roomType: 'standard',
          score: 75,
          timestamp: new Date(),
          defects: [
            { category: 'cleanliness', description: 'Dirty bathroom' },
            { category: 'maintenance', description: 'Broken AC' },
          ],
        },
        {
          roomId: 'room-102',
          roomType: 'standard',
          score: 80,
          timestamp: new Date(),
          defects: [{ category: 'cleanliness', description: 'Dirty bathroom' }],
        },
        {
          roomId: 'room-103',
          roomType: 'standard',
          score: 82,
          timestamp: new Date(),
          defects: [{ category: 'cleanliness', description: 'Dirty bathroom' }],
        },
      ];

      const trends = analyzeQualityTrends(inspections, {
        start: new Date(),
        end: new Date(),
      });

      expect(trends.topIssues.length).toBeGreaterThan(0);
      expect(trends.topIssues[0].issue).toContain('Dirty bathroom');
      expect(trends.topIssues[0].count).toBe(3);
    });

    it('should detect increasing issue trends', () => {
      const inspections = [
        // First half - fewer instances
        {
          roomId: 'room-101',
          roomType: 'standard',
          score: 85,
          timestamp: new Date(),
          defects: [{ category: 'maintenance', description: 'AC problem' }],
        },
        {
          roomId: 'room-102',
          roomType: 'standard',
          score: 87,
          timestamp: new Date(),
          defects: [],
        },
        // Second half - more instances
        {
          roomId: 'room-103',
          roomType: 'standard',
          score: 80,
          timestamp: new Date(),
          defects: [{ category: 'maintenance', description: 'AC problem' }],
        },
        {
          roomId: 'room-104',
          roomType: 'standard',
          score: 78,
          timestamp: new Date(),
          defects: [{ category: 'maintenance', description: 'AC problem' }],
        },
      ];

      const trends = analyzeQualityTrends(inspections, {
        start: new Date(),
        end: new Date(),
      });

      const acIssue = trends.topIssues.find(i => i.issue.includes('AC problem'));
      expect(acIssue).toBeDefined();
      expect(acIssue!.trend).toBe('increasing');
    });

    it('should calculate room type performance', () => {
      const inspections = [
        { roomId: 'room-101', roomType: 'deluxe', score: 95, timestamp: new Date(), defects: [] },
        { roomId: 'room-102', roomType: 'deluxe', score: 92, timestamp: new Date(), defects: [] },
        { roomId: 'room-201', roomType: 'standard', score: 75, timestamp: new Date(), defects: [] },
        { roomId: 'room-202', roomType: 'standard', score: 78, timestamp: new Date(), defects: [] },
      ];

      const trends = analyzeQualityTrends(inspections, {
        start: new Date(),
        end: new Date(),
      });

      expect(trends.roomTypePerformance.get('deluxe')).toBeGreaterThan(90);
      expect(trends.roomTypePerformance.get('standard')).toBeLessThan(80);
    });

    it('should detect quality improvement', () => {
      const inspections = [
        // First half - lower scores
        { roomId: 'room-101', roomType: 'standard', score: 70, timestamp: new Date(), defects: [] },
        { roomId: 'room-102', roomType: 'standard', score: 72, timestamp: new Date(), defects: [] },
        // Second half - higher scores
        { roomId: 'room-103', roomType: 'standard', score: 85, timestamp: new Date(), defects: [] },
        { roomId: 'room-104', roomType: 'standard', score: 88, timestamp: new Date(), defects: [] },
      ];

      const trends = analyzeQualityTrends(inspections, {
        start: new Date(),
        end: new Date(),
      });

      expect(trends.improvementRate).toBeGreaterThan(5);
      expect(trends.prediction).toContain('upward');
    });

    it('should detect quality decline', () => {
      const inspections = [
        // First half - higher scores
        { roomId: 'room-101', roomType: 'standard', score: 90, timestamp: new Date(), defects: [] },
        { roomId: 'room-102', roomType: 'standard', score: 88, timestamp: new Date(), defects: [] },
        // Second half - lower scores
        { roomId: 'room-103', roomType: 'standard', score: 70, timestamp: new Date(), defects: [] },
        { roomId: 'room-104', roomType: 'standard', score: 72, timestamp: new Date(), defects: [] },
      ];

      const trends = analyzeQualityTrends(inspections, {
        start: new Date(),
        end: new Date(),
      });

      expect(trends.improvementRate).toBeLessThan(-5);
      expect(trends.prediction).toContain('declining');
    });

    it('should calculate pass rate correctly', () => {
      const inspections = [
        { roomId: 'room-101', roomType: 'standard', score: 80, timestamp: new Date(), defects: [] }, // Pass
        { roomId: 'room-102', roomType: 'standard', score: 90, timestamp: new Date(), defects: [] }, // Pass
        { roomId: 'room-103', roomType: 'standard', score: 60, timestamp: new Date(), defects: [] }, // Fail
        { roomId: 'room-104', roomType: 'standard', score: 70, timestamp: new Date(), defects: [] }, // Fail
      ];

      const trends = analyzeQualityTrends(inspections, {
        start: new Date(),
        end: new Date(),
      });

      expect(trends.passRate).toBe(50); // 2 out of 4 passed (score >= 75)
    });

    it('should throw error with no inspections', () => {
      expect(() => {
        analyzeQualityTrends([], {
          start: new Date(),
          end: new Date(),
        });
      }).toThrow('At least one inspection is required');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete room inspection workflow', () => {
      const input: RoomInspectionInput = {
        roomId: 'room-501',
        roomType: 'presidential-suite',
        inspectionDate: new Date('2025-01-22'),
        inspectorId: 'inspector-001',
        checklist: [
          { category: 'cleanliness', item: 'Living area spotless', status: 'pass' },
          { category: 'cleanliness', item: 'Bedroom pristine', status: 'pass' },
          { category: 'cleanliness', item: 'Bathroom sparkling', status: 'pass' },
          { category: 'maintenance', item: 'All appliances working', status: 'pass' },
          { category: 'maintenance', item: 'Climate control optimal', status: 'pass' },
          { category: 'amenities', item: 'Mini-bar stocked', status: 'pass' },
          { category: 'amenities', item: 'Entertainment system functional', status: 'pass' },
          { category: 'safety', item: 'Fire safety equipment present', status: 'pass' },
          { category: 'safety', item: 'Emergency exits clear', status: 'pass' },
          { category: 'presentation', item: 'Luxury linens', status: 'pass' },
          { category: 'presentation', item: 'Fresh flowers arranged', status: 'pass' },
        ],
      };

      const score = scoreRoomInspection(input);

      expect(score.overall).toBe(100);
      expect(score.rating).toBe('excellent');
      expect(score.passedInspection).toBe(true);
      expect(score.defectsFound.length).toBe(0);
      expect(score.recommendations[0]).toContain('maintain current service levels');
    });

    it('should handle multi-staff performance comparison', () => {
      const staff1Inspections = [
        { inspectorId: 'staff-001', score: 95, defectsFound: 4, duration: 18, expectedDuration: 20 },
        { inspectorId: 'staff-001', score: 93, defectsFound: 5, duration: 19, expectedDuration: 20 },
      ];

      const staff2Inspections = [
        { inspectorId: 'staff-002', score: 75, defectsFound: 2, duration: 25, expectedDuration: 20 },
        { inspectorId: 'staff-002', score: 78, defectsFound: 3, duration: 24, expectedDuration: 20 },
      ];

      const perf1 = evaluateStaffPerformance(
        staff1Inspections,
        { staffId: 'staff-001', name: 'Top Performer', role: 'Senior Inspector' },
        { start: new Date(), end: new Date() }
      );

      const perf2 = evaluateStaffPerformance(
        staff2Inspections,
        { staffId: 'staff-002', name: 'Average Performer', role: 'Inspector' },
        { start: new Date(), end: new Date() }
      );

      expect(perf1.metrics.averageScore).toBeGreaterThan(perf2.metrics.averageScore);
      expect(perf1.metrics.timeEfficiency).toBeGreaterThan(perf2.metrics.timeEfficiency);
      expect(perf1.rating).toBe('excellent');
      expect(perf2.rating).toBe('good');
    });

    it('should optimize complex multi-floor inspection route', () => {
      const rooms = [];
      // Create 15 rooms across 5 floors
      for (let floor = 1; floor <= 5; floor++) {
        for (let room = 1; room <= 3; room++) {
          rooms.push({
            roomId: `room-${floor}0${room}`,
            floor,
            priority: (floor === 1 || room === 1) ? 'high' as const : 'medium' as const,
          });
        }
      }

      const route = optimizeInspectionRoute(rooms, 1);

      expect(route.rooms.length).toBe(15);
      expect(route.optimizationScore).toBeGreaterThan(50);
      expect(route.estimatedTime).toBeGreaterThan(200); // At least 15 * 15 minutes
      expect(route.priority).toBe('high'); // Many high priority rooms
    });

    it('should handle service quality workflow with full metrics', () => {
      const input: ServiceQualityInput = {
        serviceType: 'housekeeping',
        staffId: 'staff-hk-001',
        guestFeedback: 4.5,
        responseTime: 25,
        completionTime: 45,
        accuracy: 92,
        professionalismScore: 5,
        issuesResolved: 12,
        issuesEscalated: 1,
        timestamp: new Date(),
      };

      const quality = assessServiceQuality(input);

      expect(quality.overall).toBeGreaterThan(85);
      expect(quality.rating).toEqual(expect.stringMatching(/excellent|good/));
      expect(quality.metrics.speed).toBeGreaterThan(80);
      expect(quality.metrics.accuracy).toBe(92);
      expect(quality.metrics.professionalism).toBe(100);
      expect(quality.metrics.effectiveness).toBeGreaterThan(90);
      expect(quality.strengths.length).toBeGreaterThan(2);
    });

    it('should provide actionable insights from quality trend analysis', () => {
      const inspections = [];
      // Create 20 inspections with realistic progression
      for (let i = 0; i < 20; i++) {
        // Scores improve over time
        const baseScore = 70 + (i * 1.5);
        inspections.push({
          roomId: `room-${100 + i}`,
          roomType: i % 2 === 0 ? 'standard' : 'deluxe',
          score: Math.min(100, Math.round(baseScore)),
          timestamp: new Date(2025, 0, i + 1),
          defects: i < 10 ? [
            { category: 'cleanliness', description: 'Minor issues' },
            { category: 'maintenance', description: 'Small repairs needed' },
          ] : [],
        });
      }

      const trends = analyzeQualityTrends(inspections, {
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 31),
      });

      expect(trends.totalInspections).toBe(20);
      expect(trends.improvementRate).toBeGreaterThan(10);
      expect(trends.prediction).toContain('upward');
      expect(trends.roomTypePerformance.size).toBe(2);
    });
  });
});
