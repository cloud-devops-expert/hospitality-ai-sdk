import {
  allocateInventoryFEFO,
  allocateInventoryFIFO,
  monitorExpirationDates,
  optimizeLocations,
  generateTraceabilityReport,
  calculateRotationEfficiency,
  LOT_MANAGEMENT_FEATURES,
  WarehouseLocation,
  Lot,
  AllocationRequest,
} from '../lot-location-manager';

describe('Lot and Location Management', () => {
  const createLocation = (overrides: Partial<WarehouseLocation> = {}): WarehouseLocation => ({
    id: 'loc-1',
    zone: 'cold-storage',
    aisle: 'A',
    shelf: '1',
    bin: 'B1',
    temperature: 4,
    capacity: 100,
    currentLoad: 50,
    pickingPriority: 2,
    ...overrides,
  });

  const createLot = (overrides: Partial<Lot> = {}): Lot => ({
    id: 'lot-1',
    itemId: 'item-eggs',
    itemName: 'Eggs (Dozen)',
    quantity: 50,
    unit: 'dozen',
    receivedDate: new Date('2024-01-01'),
    expirationDate: new Date('2024-01-15'),
    supplier: 'Fresh Farm Foods',
    batchNumber: 'BATCH-001',
    location: createLocation(),
    status: 'available',
    qualityScore: 95,
    ...overrides,
  });

  const createRequest = (overrides: Partial<AllocationRequest> = {}): AllocationRequest => ({
    itemId: 'item-eggs',
    quantity: 30,
    requestDate: new Date('2024-01-10'),
    purpose: 'kitchen',
    priority: 'normal',
    ...overrides,
  });

  describe('allocateInventoryFEFO', () => {
    it('should allocate lots based on expiration date (earliest first)', () => {
      const lots = [
        createLot({
          id: 'lot-1',
          expirationDate: new Date('2024-01-20'),
          quantity: 20,
        }),
        createLot({
          id: 'lot-2',
          expirationDate: new Date('2024-01-15'),
          quantity: 30,
        }),
        createLot({
          id: 'lot-3',
          expirationDate: new Date('2024-01-25'),
          quantity: 25,
        }),
      ];

      const request = createRequest({ quantity: 40 });
      const result = allocateInventoryFEFO(request, lots);

      expect(result.method).toBe('fefo');
      expect(result.lots.length).toBe(2);
      expect(result.lots[0].lot.id).toBe('lot-2'); // Expires Jan 15 (earliest)
      expect(result.lots[1].lot.id).toBe('lot-1'); // Expires Jan 20 (second)
      expect(result.totalAllocated).toBe(40);
      expect(result.shortfall).toBe(0);
    });

    it('should warn about near-expiration items', () => {
      const lots = [
        createLot({
          expirationDate: new Date('2024-01-11'), // 1 day until expiration
          quantity: 50,
        }),
      ];

      const request = createRequest({ requestDate: new Date('2024-01-10') });
      const result = allocateInventoryFEFO(request, lots);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('Critical'))).toBe(true);
    });

    it('should handle partial allocation across multiple lots', () => {
      const lots = [
        createLot({ id: 'lot-1', quantity: 10, expirationDate: new Date('2024-01-12') }),
        createLot({ id: 'lot-2', quantity: 15, expirationDate: new Date('2024-01-14') }),
        createLot({ id: 'lot-3', quantity: 20, expirationDate: new Date('2024-01-16') }),
      ];

      const request = createRequest({ quantity: 30 });
      const result = allocateInventoryFEFO(request, lots);

      expect(result.lots.length).toBe(3);
      expect(result.lots[0].quantityAllocated).toBe(10);
      expect(result.lots[1].quantityAllocated).toBe(15);
      expect(result.lots[2].quantityAllocated).toBe(5);
      expect(result.totalAllocated).toBe(30);
    });

    it('should handle shortfall when insufficient inventory', () => {
      const lots = [createLot({ quantity: 20 })];

      const request = createRequest({ quantity: 50 });
      const result = allocateInventoryFEFO(request, lots);

      expect(result.totalAllocated).toBe(20);
      expect(result.shortfall).toBe(30);
      expect(result.recommendations.some((r) => r.includes('Shortage'))).toBe(true);
    });

    it('should handle no available inventory', () => {
      const lots: Lot[] = [];

      const request = createRequest();
      const result = allocateInventoryFEFO(request, lots);

      expect(result.totalAllocated).toBe(0);
      expect(result.shortfall).toBe(30);
      expect(result.warnings.some((w) => w.includes('No available'))).toBe(true);
    });

    it('should prioritize perishable items over non-perishable', () => {
      const lots = [
        createLot({ id: 'lot-1', expirationDate: undefined, quantity: 50 }), // Non-perishable
        createLot({ id: 'lot-2', expirationDate: new Date('2024-01-20'), quantity: 40 }), // Perishable
      ];

      const request = createRequest({ quantity: 30 });
      const result = allocateInventoryFEFO(request, lots);

      expect(result.lots[0].lot.id).toBe('lot-2'); // Perishable first
    });

    it('should recommend immediate use for near-expiration items', () => {
      const lots = [
        createLot({
          expirationDate: new Date('2024-01-12'), // 2 days until expiration
          quantity: 30,
        }),
      ];

      const request = createRequest({ requestDate: new Date('2024-01-10') });
      const result = allocateInventoryFEFO(request, lots);

      expect(
        result.recommendations.some((r) => r.includes('immediately'))
      ).toBe(true);
    });

    it('should recommend consolidation when using many lots', () => {
      const lots = Array.from({ length: 5 }, (_, i) =>
        createLot({
          id: `lot-${i + 1}`,
          quantity: 10,
          expirationDate: new Date(`2024-01-${15 + i}`),
        })
      );

      const request = createRequest({ quantity: 35 });
      const result = allocateInventoryFEFO(request, lots);

      expect(result.lots.length).toBeGreaterThan(3);
      expect(
        result.recommendations.some((r) => r.includes('consolidating'))
      ).toBe(true);
    });

    it('should only allocate from available status lots', () => {
      const lots = [
        createLot({ id: 'lot-1', status: 'available', quantity: 20 }),
        createLot({ id: 'lot-2', status: 'expired', quantity: 30 }),
        createLot({ id: 'lot-3', status: 'quarantine', quantity: 25 }),
      ];

      const request = createRequest({ quantity: 40 });
      const result = allocateInventoryFEFO(request, lots);

      expect(result.totalAllocated).toBe(20);
      expect(result.shortfall).toBe(20);
    });
  });

  describe('allocateInventoryFIFO', () => {
    it('should allocate lots based on received date (oldest first)', () => {
      const lots = [
        createLot({
          id: 'lot-1',
          receivedDate: new Date('2024-01-05'),
          quantity: 20,
        }),
        createLot({
          id: 'lot-2',
          receivedDate: new Date('2024-01-01'),
          quantity: 30,
        }),
        createLot({
          id: 'lot-3',
          receivedDate: new Date('2024-01-10'),
          quantity: 25,
        }),
      ];

      const request = createRequest({ quantity: 40 });
      const result = allocateInventoryFIFO(request, lots);

      expect(result.method).toBe('fifo');
      expect(result.lots[0].lot.id).toBe('lot-2'); // Received Jan 1 (oldest)
      expect(result.lots[1].lot.id).toBe('lot-1'); // Received Jan 5 (second)
      expect(result.totalAllocated).toBe(40);
    });

    it('should handle full lot consumption', () => {
      const lots = [
        createLot({ id: 'lot-1', receivedDate: new Date('2024-01-01'), quantity: 50 }),
      ];

      const request = createRequest({ quantity: 50 });
      const result = allocateInventoryFIFO(request, lots);

      expect(result.lots[0].quantityAllocated).toBe(50);
      expect(result.totalAllocated).toBe(50);
      expect(result.shortfall).toBe(0);
    });

    it('should handle no available inventory', () => {
      const lots: Lot[] = [];

      const request = createRequest();
      const result = allocateInventoryFIFO(request, lots);

      expect(result.totalAllocated).toBe(0);
      expect(result.warnings.some((w) => w.includes('No available'))).toBe(true);
    });

    it('should include expiration info if available', () => {
      const lots = [
        createLot({
          receivedDate: new Date('2024-01-01'),
          expirationDate: new Date('2024-01-15'),
          quantity: 30,
        }),
      ];

      const request = createRequest({ requestDate: new Date('2024-01-10') });
      const result = allocateInventoryFIFO(request, lots);

      expect(result.lots[0].daysUntilExpiration).toBeDefined();
      expect(result.lots[0].daysUntilExpiration).toBe(5);
    });
  });

  describe('monitorExpirationDates', () => {
    it('should detect expired items', () => {
      const lots = [
        createLot({
          expirationDate: new Date('2024-01-05'), // Already expired
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('critical');
      expect(alerts[0].recommendedAction).toContain('DISCARD');
    });

    it('should detect items expiring today', () => {
      const lots = [
        createLot({
          expirationDate: new Date('2024-01-10'),
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('critical');
      expect(alerts[0].daysUntilExpiration).toBe(0);
      expect(alerts[0].recommendedAction).toContain('USE TODAY');
    });

    it('should flag critical risk for 1-2 days until expiration', () => {
      const lots = [
        createLot({
          id: 'lot-1',
          expirationDate: new Date('2024-01-11'), // 1 day
        }),
        createLot({
          id: 'lot-2',
          expirationDate: new Date('2024-01-12'), // 2 days
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(2);
      expect(alerts.every((a) => a.riskLevel === 'critical')).toBe(true);
    });

    it('should flag high risk for 3-5 days until expiration', () => {
      const lots = [
        createLot({
          expirationDate: new Date('2024-01-14'), // 4 days
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('high');
      expect(alerts[0].daysUntilExpiration).toBe(4);
    });

    it('should flag medium risk for 6-7 days', () => {
      const lots = [
        createLot({
          expirationDate: new Date('2024-01-17'), // 7 days
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('medium');
    });

    it('should flag low risk for 8-14 days', () => {
      const lots = [
        createLot({
          expirationDate: new Date('2024-01-20'), // 10 days
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(1);
      expect(alerts[0].riskLevel).toBe('low');
    });

    it('should skip non-perishable items', () => {
      const lots = [
        createLot({
          expirationDate: undefined, // Non-perishable
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(0);
    });

    it('should skip non-available status items', () => {
      const lots = [
        createLot({
          status: 'expired',
          expirationDate: new Date('2024-01-15'),
        }),
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts.length).toBe(0);
    });

    it('should sort alerts by risk level and expiration', () => {
      const lots = [
        createLot({ id: 'lot-1', expirationDate: new Date('2024-01-20') }), // Low
        createLot({ id: 'lot-2', expirationDate: new Date('2024-01-11') }), // Critical
        createLot({ id: 'lot-3', expirationDate: new Date('2024-01-14') }), // High
      ];

      const currentDate = new Date('2024-01-10');
      const alerts = monitorExpirationDates(lots, currentDate);

      expect(alerts[0].lot.id).toBe('lot-2'); // Critical first
      expect(alerts[1].lot.id).toBe('lot-3'); // High second
      expect(alerts[2].lot.id).toBe('lot-1'); // Low last
    });
  });

  describe('optimizeLocations', () => {
    it('should move critical expiration items to prep area', () => {
      const prepArea = createLocation({ id: 'prep-1', zone: 'prep-area', pickingPriority: 1 });
      const coldStorage = createLocation({ id: 'cold-1', zone: 'cold-storage' });

      const lots = [
        createLot({
          expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
          location: coldStorage,
        }),
      ];

      const locations = [prepArea, coldStorage];
      const optimizations = optimizeLocations(lots, locations);

      expect(optimizations.length).toBe(1);
      expect(optimizations[0].recommendedLocation.zone).toBe('prep-area');
      expect(optimizations[0].priority).toBe('urgent');
    });

    it('should move near-expiration items to high-priority picking', () => {
      const highPriority = createLocation({ id: 'high-1', pickingPriority: 1 });
      const lowPriority = createLocation({ id: 'low-1', pickingPriority: 3 });

      const lots = [
        createLot({
          expirationDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
          location: lowPriority,
        }),
      ];

      const locations = [highPriority, lowPriority];
      const optimizations = optimizeLocations(lots, locations);

      expect(optimizations.length).toBe(1);
      expect(optimizations[0].recommendedLocation.pickingPriority).toBe(1);
      expect(optimizations[0].priority).toBe('high');
    });

    it('should move items from receiving to proper storage', () => {
      const receiving = createLocation({ id: 'rec-1', zone: 'receiving' });
      const coldStorage = createLocation({ id: 'cold-1', zone: 'cold-storage' });

      const lots = [
        createLot({
          expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          location: receiving,
        }),
      ];

      const locations = [receiving, coldStorage];
      const optimizations = optimizeLocations(lots, locations);

      expect(optimizations.length).toBe(1);
      expect(optimizations[0].recommendedLocation.zone).toBe('cold-storage');
      expect(optimizations[0].priority).toBe('high');
    });

    it('should calculate picking time reduction', () => {
      const easyAccess = createLocation({ id: 'easy-1', pickingPriority: 1 });
      const hardAccess = createLocation({ id: 'hard-1', pickingPriority: 5 });

      const lots = [createLot({ location: hardAccess })];

      const locations = [easyAccess, hardAccess];
      const optimizations = optimizeLocations(lots, locations);

      expect(optimizations[0].estimatedPickingTimeReduction).toBeGreaterThan(0);
    });

    it('should skip non-available lots', () => {
      const lots = [createLot({ status: 'expired' })];
      const locations = [createLocation()];

      const optimizations = optimizeLocations(lots, locations);

      expect(optimizations.length).toBe(0);
    });

    it('should skip if no better location available', () => {
      const bestLocation = createLocation({ pickingPriority: 1, zone: 'prep-area' });

      const lots = [
        createLot({
          location: bestLocation,
          expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        }),
      ];

      const locations = [bestLocation];
      const optimizations = optimizeLocations(lots, locations);

      expect(optimizations.length).toBe(0);
    });

    it('should sort optimizations by priority', () => {
      const prep = createLocation({ id: 'prep-1', zone: 'prep-area', pickingPriority: 1 });
      const receiving = createLocation({ id: 'rec-1', zone: 'receiving', pickingPriority: 3 });
      const cold = createLocation({ id: 'cold-1', zone: 'cold-storage', pickingPriority: 2 });

      const lots = [
        createLot({
          id: 'lot-1',
          location: receiving,
          expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        }),
        createLot({
          id: 'lot-2',
          location: cold,
          expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        }),
      ];

      const locations = [prep, receiving, cold];
      const optimizations = optimizeLocations(lots, locations);

      expect(optimizations[0].priority).toBe('urgent'); // Critical expiration first
    });
  });

  describe('generateTraceabilityReport', () => {
    it('should generate report for found lot', () => {
      const lot = createLot({
        id: 'lot-123',
        receivedDate: new Date('2024-01-01'),
        expirationDate: new Date('2024-01-15'),
      });

      const report = generateTraceabilityReport('lot-123', [lot]);

      expect(report.found).toBe(true);
      expect(report.lot?.id).toBe('lot-123');
      expect(report.traceability).toBeDefined();
      expect(report.traceability?.supplier).toBe('Fresh Farm Foods');
    });

    it('should calculate days in storage', () => {
      const receivedDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const lot = createLot({ receivedDate });

      const report = generateTraceabilityReport(lot.id, [lot]);

      expect(report.traceability?.daysInStorage).toBeGreaterThanOrEqual(4);
      expect(report.traceability?.daysInStorage).toBeLessThanOrEqual(5);
    });

    it('should calculate days until expiration', () => {
      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const lot = createLot({ expirationDate });

      const report = generateTraceabilityReport(lot.id, [lot]);

      expect(report.traceability?.daysUntilExpiration).toBeGreaterThanOrEqual(6);
      expect(report.traceability?.daysUntilExpiration).toBeLessThanOrEqual(7);
    });

    it('should detect expired status', () => {
      const expirationDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const lot = createLot({ expirationDate });

      const report = generateTraceabilityReport(lot.id, [lot]);

      expect(report.traceability?.expirationStatus).toBe('expired');
    });

    it('should handle non-perishable items', () => {
      const lot = createLot({ expirationDate: undefined });

      const report = generateTraceabilityReport(lot.id, [lot]);

      expect(report.traceability?.expirationDate).toBeUndefined();
      expect(report.traceability?.daysUntilExpiration).toBeUndefined();
      expect(report.traceability?.expirationStatus).toBe('none');
    });

    it('should return error for lot not found', () => {
      const report = generateTraceabilityReport('non-existent', []);

      expect(report.found).toBe(false);
      expect(report.error).toContain('not found');
    });
  });

  describe('calculateRotationEfficiency', () => {
    it('should calculate good score for optimal rotation', () => {
      const lots = [
        createLot({ receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }),
        createLot({ receivedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }),
      ];

      const result = calculateRotationEfficiency(lots);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.metrics.expirationWasteRate).toBe(0);
      expect(result.metrics.averageAgeAtUse).toBeLessThan(7); // Fresh rotation
    });

    it('should penalize for expired lots', () => {
      const lots = [
        createLot({ status: 'available' }),
        createLot({ status: 'expired', quantity: 10 }),
      ];

      const result = calculateRotationEfficiency(lots);

      expect(result.metrics.expirationWasteRate).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('should calculate average age at use', () => {
      const lots = [
        createLot({ receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }),
        createLot({ receivedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }),
      ];

      const result = calculateRotationEfficiency(lots);

      expect(result.metrics.averageAgeAtUse).toBeGreaterThan(0);
    });

    it('should provide recommendations for high waste', () => {
      const lots = [
        ...Array.from({ length: 10 }, () => createLot({ status: 'available' })),
        ...Array.from({ length: 2 }, () => createLot({ status: 'expired' })),
      ];

      const result = calculateRotationEfficiency(lots);

      expect(result.recommendations.some((r) => r.includes('waste'))).toBe(true);
    });

    it('should provide recommendations for slow rotation', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const lots = [createLot({ receivedDate: oldDate })];

      const result = calculateRotationEfficiency(lots);

      expect(result.recommendations.some((r) => r.includes('Slow rotation'))).toBe(true);
    });

    it('should handle empty lot list', () => {
      const result = calculateRotationEfficiency([]);

      expect(result.score).toBeDefined();
      expect(result.metrics.expirationWasteRate).toBe(0);
    });
  });

  describe('LOT_MANAGEMENT_FEATURES', () => {
    it('should define FEFO allocation feature', () => {
      const feature = LOT_MANAGEMENT_FEATURES['fefo-allocation'];

      expect(feature).toBeDefined();
      expect(feature.name).toContain('FEFO');
      expect(feature.benefitCategory).toBe('waste-reduction');
    });

    it('should define expiration monitoring feature', () => {
      const feature = LOT_MANAGEMENT_FEATURES['expiration-monitoring'];

      expect(feature).toBeDefined();
      expect(feature.implementation).toBe('zero-cost');
    });

    it('should define all features with zero-cost implementation', () => {
      Object.values(LOT_MANAGEMENT_FEATURES).forEach((feature) => {
        expect(feature.implementation).toBe('zero-cost');
      });
    });

    it('should cover all major benefit categories', () => {
      const categories = Object.values(LOT_MANAGEMENT_FEATURES).map(
        (f) => f.benefitCategory
      );

      expect(categories).toContain('waste-reduction');
      expect(categories).toContain('efficiency');
      expect(categories).toContain('compliance');
    });
  });
});
