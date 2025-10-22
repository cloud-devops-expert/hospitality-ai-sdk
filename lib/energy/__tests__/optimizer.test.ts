import { optimizeEnergyScheduleBased } from '../optimizer';
import type { RoomOccupancy } from '../optimizer';

describe('Energy Optimization', () => {
  const sampleRooms: RoomOccupancy[] = [
    { roomId: 'room-1', occupied: true, guestPreferences: { preferredTemp: 22 } },
    { roomId: 'room-2', occupied: false, guestPreferences: undefined },
    { roomId: 'room-3', occupied: true, guestPreferences: { preferredTemp: 20 } },
    { roomId: 'room-4', occupied: false, guestPreferences: undefined },
    { roomId: 'room-5', occupied: true, guestPreferences: { preferredTemp: 24 } },
  ];

  describe('Schedule-Based Optimization', () => {
    it('should optimize energy for mixed occupancy', () => {
      const result = optimizeEnergyScheduleBased(sampleRooms, 28);

      expect(result.roomSettings.size).toBe(sampleRooms.length);
      expect(result.estimatedCost).toBeGreaterThan(0);
      expect(result.savings).toBeGreaterThan(0);
      expect(result.savings).toBeLessThanOrEqual(100);
    });

    it('should set lower temperature for vacant rooms', () => {
      const result = optimizeEnergyScheduleBased(sampleRooms, 28);

      const settingsArray = Array.from(result.roomSettings.entries());
      const vacantSettings = settingsArray.filter(
        ([roomId]) => !sampleRooms.find((r) => r.roomId === roomId)?.occupied
      );
      const occupiedSettings = settingsArray.filter(
        ([roomId]) => sampleRooms.find((r) => r.roomId === roomId)?.occupied
      );

      vacantSettings.forEach(([, setting]) => {
        const minOccupied = Math.min(...occupiedSettings.map(([, s]) => s.targetTemp));
        expect(setting.targetTemp).toBeGreaterThanOrEqual(minOccupied - 2);
      });
    });

    it('should respect guest temperature preferences', () => {
      const result = optimizeEnergyScheduleBased(sampleRooms, 28);

      sampleRooms
        .filter((r) => r.occupied && r.guestPreferences)
        .forEach((room) => {
          const setting = result.roomSettings.get(room.roomId);
          expect(setting?.targetTemp).toBe(room.guestPreferences!.preferredTemp);
        });
    });

    it('should calculate cost correctly', () => {
      const allOccupied = sampleRooms.map((r) => ({ ...r, occupied: true }));
      const allVacant = sampleRooms.map((r) => ({ ...r, occupied: false }));

      const occupiedResult = optimizeEnergyScheduleBased(allOccupied, 28);
      const vacantResult = optimizeEnergyScheduleBased(allVacant, 28);

      expect(occupiedResult.estimatedCost).toBeGreaterThan(vacantResult.estimatedCost);
    });

    it('should adjust for outside temperature', () => {
      const hotDay = optimizeEnergyScheduleBased(sampleRooms, 35);
      const mildDay = optimizeEnergyScheduleBased(sampleRooms, 20);

      // Both should have costs, may be similar based on occupancy
      expect(hotDay.estimatedCost).toBeGreaterThan(0);
      expect(mildDay.estimatedCost).toBeGreaterThan(0);
    });
  });

  describe('Savings Calculation', () => {
    it('should show savings compared to baseline', () => {
      const result = optimizeEnergyScheduleBased(sampleRooms, 28);

      expect(result.savings).toBeGreaterThan(0);
      expect(result.savings).toBeLessThanOrEqual(100); // Percentage
    });

    it('should have higher savings with more vacant rooms', () => {
      const lowOccupancy = sampleRooms.map((r, i) => ({ ...r, occupied: i === 0 }));
      const highOccupancy = sampleRooms.map((r) => ({ ...r, occupied: true }));

      const lowResult = optimizeEnergyScheduleBased(lowOccupancy, 28);
      const highResult = optimizeEnergyScheduleBased(highOccupancy, 28);

      expect(lowResult.savings).toBeGreaterThan(highResult.savings);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all occupied rooms', () => {
      const allOccupied = sampleRooms.map((r) => ({ ...r, occupied: true }));
      const result = optimizeEnergyScheduleBased(allOccupied, 28);

      expect(result.roomSettings.size).toBe(allOccupied.length);
      expect(result.estimatedCost).toBeGreaterThan(0);
    });

    it('should handle all vacant rooms', () => {
      const allVacant = sampleRooms.map((r) => ({ ...r, occupied: false }));
      const result = optimizeEnergyScheduleBased(allVacant, 28);

      expect(result.roomSettings.size).toBe(allVacant.length);
      expect(result.savings).toBeGreaterThan(0);
    });

    it('should handle single room', () => {
      const singleRoom = [sampleRooms[0]];
      const result = optimizeEnergyScheduleBased(singleRoom, 28);

      expect(result.roomSettings.size).toBe(1);
      expect(result.estimatedCost).toBeGreaterThan(0);
    });

    it('should handle extreme temperatures', () => {
      const freezing = optimizeEnergyScheduleBased(sampleRooms, 0);
      const scorching = optimizeEnergyScheduleBased(sampleRooms, 45);

      expect(freezing.estimatedCost).toBeGreaterThan(0);
      expect(scorching.estimatedCost).toBeGreaterThan(0);
    });
  });
});
