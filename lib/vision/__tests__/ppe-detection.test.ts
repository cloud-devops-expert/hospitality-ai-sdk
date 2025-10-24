/**
 * PPE Detection Tests
 */

import {
  detectPPE,
  detectPPEWithMetadata,
  detectPPEBatch,
  generateComplianceReport,
  PPEDetectionInput,
  PPEDetectionResult,
} from '../ppe-detection';

describe('PPE Detection', () => {
  describe('detectPPE', () => {
    it('should detect PPE from image data', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,test',
        scenario: 'kitchen',
        imageId: 'test-001',
        location: 'Kitchen',
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      expect(result.detected).toBeDefined();
      expect(Array.isArray(result.detected)).toBe(true);
      expect(result.missing).toBeDefined();
      expect(Array.isArray(result.missing)).toBe(true);
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
      expect(result.violationCount).toBeGreaterThanOrEqual(0);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.modelUsed).toBeDefined();
      expect(result.status).toMatch(/compliant|warning|violation/);
      expect(result.method).toMatch(/tensorflow\.js|rule-based|mock/);
    });

    it('should detect kitchen PPE scenario', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,kitchen',
        scenario: 'kitchen',
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      // Kitchen requires: Hair Net, Gloves, Apron
      expect(result.detected.length + result.missing.length).toBe(3);
    });

    it('should detect medical PPE scenario', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,medical',
        scenario: 'medical',
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      // Medical requires: Mask, Gloves, Gown
      expect(result.detected.length + result.missing.length).toBe(3);
    });

    it('should detect maintenance PPE scenario', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,maintenance',
        scenario: 'maintenance',
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      // Maintenance requires: Hard Hat, Safety Vest, Gloves
      expect(result.detected.length + result.missing.length).toBe(3);
    });

    it('should detect housekeeping PPE scenario', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,housekeeping',
        scenario: 'housekeeping',
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      // Housekeeping requires: Gloves, Uniform
      expect(result.detected.length + result.missing.length).toBe(2);
    });

    it('should calculate compliance score correctly', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,test',
        scenario: 'kitchen',
      };

      const result = await detectPPE(input);

      const totalRequired = result.detected.length + result.missing.length;
      const expectedScore = (result.detected.length / totalRequired) * 100;

      expect(result.complianceScore).toBeCloseTo(expectedScore, 0);
    });

    it('should set correct status based on compliance', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,test',
        scenario: 'medical',
      };

      const result = await detectPPE(input);

      if (result.complianceScore === 100) {
        expect(result.status).toBe('compliant');
      } else if (result.complianceScore >= 66.7) {
        expect(result.status).toBe('warning');
      } else {
        expect(result.status).toBe('violation');
      }
    });

    it('should count violations correctly', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,test',
        scenario: 'kitchen',
      };

      const result = await detectPPE(input);

      expect(result.violationCount).toBe(result.missing.length);
    });

    it('should handle custom required PPE', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,test',
        scenario: 'custom',
        requiredPPE: ['Gloves', 'Mask', 'Apron'],
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      expect(result.detected.length + result.missing.length).toBe(3);
    });
  });

  describe('detectPPEWithMetadata', () => {
    it('should include method metadata', async () => {
      const input: PPEDetectionInput = {
        imageData: 'data:image/png;base64,test',
        scenario: 'kitchen',
      };

      const result = await detectPPEWithMetadata(input);

      expect(result.methodUsed).toBeDefined();
      expect(result.methodUsed).toMatch(/tensorflow\.js|rule-based|mock/);
      expect(result.method).toBe(result.methodUsed);
    });
  });

  describe('detectPPEBatch', () => {
    it('should process multiple images', async () => {
      const inputs: PPEDetectionInput[] = [
        { imageData: 'data:image/png;base64,test1', scenario: 'kitchen' },
        { imageData: 'data:image/png;base64,test2', scenario: 'medical' },
        { imageData: 'data:image/png;base64,test3', scenario: 'maintenance' },
      ];

      const results = await detectPPEBatch(inputs);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.detected).toBeDefined();
        expect(result.missing).toBeDefined();
        expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle empty batch', async () => {
      const results = await detectPPEBatch([]);

      expect(results).toHaveLength(0);
    });

    it('should process large batches efficiently', async () => {
      const inputs: PPEDetectionInput[] = Array.from({ length: 10 }, (_, i) => ({
        imageData: `data:image/png;base64,batch${i}`,
        scenario: (i % 4 === 0 ? 'kitchen' : i % 4 === 1 ? 'medical' : i % 4 === 2 ? 'maintenance' : 'housekeeping') as PPEDetectionInput['scenario'],
      }));

      const startTime = Date.now();
      const results = await detectPPEBatch(inputs);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report from results', () => {
      const results: PPEDetectionResult[] = [
        {
          detected: ['Mask', 'Gloves', 'Gown'],
          missing: [],
          complianceScore: 100,
          violationCount: 0,
          executionTime: 50,
          modelUsed: 'test',
          status: 'compliant',
          method: 'mock',
        },
        {
          detected: ['Gloves'],
          missing: ['Hair Net', 'Apron'],
          complianceScore: 33.3,
          violationCount: 2,
          executionTime: 50,
          modelUsed: 'test',
          status: 'violation',
          method: 'mock',
        },
        {
          detected: ['Hair Net', 'Apron'],
          missing: ['Gloves'],
          complianceScore: 66.7,
          violationCount: 1,
          executionTime: 50,
          modelUsed: 'test',
          status: 'warning',
          method: 'mock',
        },
      ];

      const report = generateComplianceReport(results);

      expect(report.totalInspections).toBe(3);
      expect(report.compliantCount).toBe(1);
      expect(report.warningCount).toBe(1);
      expect(report.violationCount).toBe(1);
      expect(report.complianceRate).toBeCloseTo(33.33, 0);
      expect(report.commonViolations).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify common violations', () => {
      const results: PPEDetectionResult[] = Array.from({ length: 10 }, (_, i) => ({
        detected: i % 2 === 0 ? ['Mask'] : ['Mask', 'Gloves'],
        missing: i % 2 === 0 ? ['Gloves', 'Gown'] : ['Gown'],
        complianceScore: i % 2 === 0 ? 33.3 : 66.7,
        violationCount: i % 2 === 0 ? 2 : 1,
        executionTime: 50,
        modelUsed: 'test',
        status: i % 2 === 0 ? 'violation' : 'warning',
        method: 'mock',
      }));

      const report = generateComplianceReport(results);

      expect(report.commonViolations).toBeDefined();
      expect(report.commonViolations.length).toBeGreaterThan(0);

      // 'Gown' should be most common (appears in all 10 results)
      const mostCommon = report.commonViolations[0];
      expect(mostCommon.item).toBe('Gown');
      expect(mostCommon.count).toBe(10);
    });

    it('should calculate compliance rate correctly', () => {
      const results: PPEDetectionResult[] = [
        {
          detected: ['All'],
          missing: [],
          complianceScore: 100,
          violationCount: 0,
          executionTime: 50,
          modelUsed: 'test',
          status: 'compliant',
          method: 'mock',
        },
        {
          detected: ['All'],
          missing: [],
          complianceScore: 100,
          violationCount: 0,
          executionTime: 50,
          modelUsed: 'test',
          status: 'compliant',
          method: 'mock',
        },
        {
          detected: [],
          missing: ['All'],
          complianceScore: 0,
          violationCount: 3,
          executionTime: 50,
          modelUsed: 'test',
          status: 'violation',
          method: 'mock',
        },
      ];

      const report = generateComplianceReport(results);

      expect(report.compliantCount).toBe(2);
      expect(report.violationCount).toBe(1);
      expect(report.complianceRate).toBeCloseTo(66.67, 1);
    });

    it('should provide appropriate recommendations based on compliance', () => {
      const highCompliance: PPEDetectionResult[] = Array.from({ length: 10 }, () => ({
        detected: ['All'],
        missing: [],
        complianceScore: 100,
        violationCount: 0,
        executionTime: 50,
        modelUsed: 'test',
        status: 'compliant',
        method: 'mock',
      }));

      const report = generateComplianceReport(highCompliance);

      expect(report.complianceRate).toBe(100);
      expect(report.recommendations.some((r) => r.includes('Perfect') || r.includes('excellent'))).toBe(true);
    });

    it('should handle zero inspections', () => {
      const report = generateComplianceReport([]);

      expect(report.totalInspections).toBe(0);
      expect(report.complianceRate).toBeNaN(); // 0/0 = NaN
      expect(report.commonViolations).toHaveLength(0);
      expect(report.recommendations).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty image data', async () => {
      const input: PPEDetectionInput = {
        imageData: '',
        scenario: 'kitchen',
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      expect(result.detected).toBeDefined();
      expect(result.missing).toBeDefined();
    });

    it('should handle very long image data', async () => {
      const longData = 'data:image/png;base64,' + 'A'.repeat(10000);
      const input: PPEDetectionInput = {
        imageData: longData,
        scenario: 'medical',
      };

      const result = await detectPPE(input);

      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle all scenarios correctly', async () => {
      const scenarios: PPEDetectionInput['scenario'][] = ['kitchen', 'medical', 'maintenance', 'housekeeping'];

      for (const scenario of scenarios) {
        const input: PPEDetectionInput = {
          imageData: 'data:image/png;base64,test',
          scenario,
        };

        const result = await detectPPE(input);

        expect(result).toBeDefined();
        expect(result.status).toMatch(/compliant|warning|violation/);
      }
    });
  });
});
