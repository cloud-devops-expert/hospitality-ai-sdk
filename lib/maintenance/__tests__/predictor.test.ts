import { predictMaintenanceUsageBased } from '../predictor';
import type { Asset } from '../predictor';

describe('Maintenance Prediction', () => {
  const sampleAssets: Asset[] = [
    {
      id: '1',
      name: 'HVAC-1',
      type: 'hvac',
      ageMonths: 36,
      usageHours: 2000,
      lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Elevator-1',
      type: 'elevator',
      ageMonths: 48,
      usageHours: 3000,
      lastMaintenance: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Plumbing-1',
      type: 'plumbing',
      ageMonths: 12,
      usageHours: 1000,
      lastMaintenance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      name: 'Electrical-1',
      type: 'electrical',
      ageMonths: 24,
      usageHours: 1500,
      lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    },
  ];

  describe('Usage-Based Prediction', () => {
    it('should predict maintenance for each asset', () => {
      const predictions = sampleAssets.map((asset) => predictMaintenanceUsageBased(asset));

      expect(predictions).toHaveLength(sampleAssets.length);
      predictions.forEach((prediction) => {
        expect(prediction.daysUntilMaintenance).toBeGreaterThanOrEqual(0);
        expect(prediction.failureRisk).toBeGreaterThanOrEqual(0);
        expect(prediction.failureRisk).toBeLessThanOrEqual(1);
        expect(prediction.priority).toBeTruthy();
        expect(prediction.method).toBe('usage');
      });
    });

    it('should calculate days until maintenance based on usage', () => {
      const asset: Asset = {
        id: 'test',
        name: 'Test HVAC',
        type: 'hvac',
        ageMonths: 12,
        usageHours: 1000,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(asset);

      expect(prediction.daysUntilMaintenance).toBeGreaterThan(0);
    });

    it('should increase risk with higher usage', () => {
      const lowUsage: Asset = {
        id: 'test1',
        name: 'Low Usage',
        type: 'hvac',
        ageMonths: 12,
        usageHours: 500,
        lastMaintenance: new Date(),
      };

      const highUsage: Asset = {
        id: 'test2',
        name: 'High Usage',
        type: 'hvac',
        ageMonths: 12,
        usageHours: 2000,
        lastMaintenance: new Date(),
      };

      const lowResult = predictMaintenanceUsageBased(lowUsage);
      const highResult = predictMaintenanceUsageBased(highUsage);

      expect(highResult.failureRisk).toBeGreaterThan(lowResult.failureRisk);
    });
  });

  describe('Priority Classification', () => {
    it('should classify high priority for high risk', () => {
      const highRisk: Asset = {
        id: 'test',
        name: 'Failing Asset',
        type: 'hvac',
        ageMonths: 60,
        usageHours: 10000,
        lastMaintenance: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      };

      const prediction = predictMaintenanceUsageBased(highRisk);

      expect(prediction.priority).toBe('high');
      expect(prediction.failureRisk).toBeGreaterThan(0.7);
    });

    it('should classify medium priority for moderate risk', () => {
      const mediumRisk: Asset = {
        id: 'test',
        name: 'Medium Risk Asset',
        type: 'hvac',
        ageMonths: 24,
        usageHours: 1500,
        lastMaintenance: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      };

      const prediction = predictMaintenanceUsageBased(mediumRisk);

      expect(['medium', 'low']).toContain(prediction.priority);
    });

    it('should classify low priority for low risk', () => {
      const lowRisk: Asset = {
        id: 'test',
        name: 'New Asset',
        type: 'hvac',
        ageMonths: 6,
        usageHours: 100,
        lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      };

      const prediction = predictMaintenanceUsageBased(lowRisk);

      expect(prediction.priority).toBe('low');
      expect(prediction.failureRisk).toBeLessThan(0.3);
    });
  });

  describe('Asset Type Handling', () => {
    it('should handle HVAC assets', () => {
      const hvac: Asset = {
        id: 'test',
        name: 'HVAC',
        type: 'hvac',
        ageMonths: 24,
        usageHours: 2000,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(hvac);

      expect(prediction.asset.type).toBe('hvac');
      expect(prediction.daysUntilMaintenance).toBeGreaterThanOrEqual(0);
    });

    it('should handle elevator assets', () => {
      const elevator: Asset = {
        id: 'test',
        name: 'Elevator',
        type: 'elevator',
        ageMonths: 48,
        usageHours: 3000,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(elevator);

      expect(prediction.asset.type).toBe('elevator');
    });

    it('should handle plumbing assets', () => {
      const plumbing: Asset = {
        id: 'test',
        name: 'Plumbing',
        type: 'plumbing',
        ageMonths: 12,
        usageHours: 1000,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(plumbing);

      expect(prediction.asset.type).toBe('plumbing');
    });

    it('should handle electrical assets', () => {
      const electrical: Asset = {
        id: 'test',
        name: 'Electrical',
        type: 'electrical',
        ageMonths: 24,
        usageHours: 1500,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(electrical);

      expect(prediction.asset.type).toBe('electrical');
    });
  });

  describe('Failure Risk Calculation', () => {
    it('should calculate failure risk correctly', () => {
      const asset: Asset = {
        id: 'test',
        name: 'Test',
        type: 'hvac',
        ageMonths: 36,
        usageHours: 2000,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(asset);

      expect(prediction.failureRisk).toBeDefined();
      expect(prediction.failureRisk).toBeGreaterThanOrEqual(0);
      expect(prediction.failureRisk).toBeLessThanOrEqual(1);
    });

    it('should cap failure risk at 1', () => {
      const overused: Asset = {
        id: 'test',
        name: 'Overused',
        type: 'hvac',
        ageMonths: 120,
        usageHours: 50000,
        lastMaintenance: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };

      const prediction = predictMaintenanceUsageBased(overused);

      expect(prediction.failureRisk).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle brand new asset', () => {
      const newAsset: Asset = {
        id: 'test',
        name: 'Brand New',
        type: 'hvac',
        ageMonths: 0,
        usageHours: 0,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(newAsset);

      expect(prediction.daysUntilMaintenance).toBeGreaterThan(0);
      expect(prediction.failureRisk).toBe(0);
      expect(prediction.priority).toBe('low');
    });

    it('should handle asset needing immediate maintenance', () => {
      const critical: Asset = {
        id: 'test',
        name: 'Critical',
        type: 'hvac',
        ageMonths: 60,
        usageHours: 20000,
        lastMaintenance: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      };

      const prediction = predictMaintenanceUsageBased(critical);

      expect(prediction.daysUntilMaintenance).toBe(0);
      expect(prediction.priority).toBe('high');
    });

    it('should handle recent maintenance', () => {
      const justMaintained: Asset = {
        id: 'test',
        name: 'Just Maintained',
        type: 'hvac',
        ageMonths: 36,
        usageHours: 100,
        lastMaintenance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      };

      const prediction = predictMaintenanceUsageBased(justMaintained);

      expect(prediction.daysUntilMaintenance).toBeGreaterThan(30);
      expect(prediction.priority).toBe('low');
    });
  });

  describe('Return Values', () => {
    it('should return all required fields', () => {
      const asset: Asset = {
        id: 'test',
        name: 'Test',
        type: 'hvac',
        ageMonths: 24,
        usageHours: 1500,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(asset);

      expect(prediction.asset).toBe(asset);
      expect(prediction.daysUntilMaintenance).toBeDefined();
      expect(prediction.failureRisk).toBeDefined();
      expect(prediction.priority).toBeDefined();
      expect(prediction.method).toBe('usage');
      expect(prediction.processingTime).toBeDefined();
    });

    it('should have processing time', () => {
      const asset: Asset = {
        id: 'test',
        name: 'Test',
        type: 'hvac',
        ageMonths: 24,
        usageHours: 1500,
        lastMaintenance: new Date(),
      };

      const prediction = predictMaintenanceUsageBased(asset);

      expect(prediction.processingTime).toBeGreaterThanOrEqual(0);
    });
  });
});
