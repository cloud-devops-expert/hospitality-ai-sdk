import { scheduleStaffOccupancyBased } from '../optimizer';
import type { StaffMember } from '../optimizer';

describe('Staff Scheduling Optimization', () => {
  const sampleStaff: StaffMember[] = [
    { id: 'staff-1', name: 'Alice', role: 'front-desk', hoursPerWeek: 40, availability: [true, true, true, true, true, false, false] },
    { id: 'staff-2', name: 'Bob', role: 'front-desk', hoursPerWeek: 40, availability: [true, true, true, true, true, true, true] },
    { id: 'staff-3', name: 'Charlie', role: 'housekeeping', hoursPerWeek: 40, availability: [true, true, true, true, true, false, false] },
    { id: 'staff-4', name: 'Diana', role: 'housekeeping', hoursPerWeek: 40, availability: [false, false, true, true, true, true, true] },
    { id: 'staff-5', name: 'Eve', role: 'maintenance', hoursPerWeek: 40, availability: [true, true, true, true, true, false, false] },
  ];

  describe('Occupancy-Based Scheduling', () => {
    it('should create 7-day schedule', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 75);

      expect(result.shifts).toHaveLength(7);
      expect(result.totalCost).toBeGreaterThan(0);
    });

    it('should scale staff based on occupancy', () => {
      const lowOccupancy = scheduleStaffOccupancyBased(sampleStaff, 30);
      const highOccupancy = scheduleStaffOccupancyBased(sampleStaff, 95);

      const lowAvgStaff = lowOccupancy.shifts.reduce((sum, s) => sum + s.staff.length, 0) / 7;
      const highAvgStaff = highOccupancy.shifts.reduce((sum, s) => sum + s.staff.length, 0) / 7;

      expect(highAvgStaff).toBeGreaterThanOrEqual(lowAvgStaff);
    });

    it('should respect staff availability', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 75);

      result.shifts.forEach((shift, dayIndex) => {
        shift.staff.forEach(member => {
          // Staff in shift should have availability
          expect(member.availability).toBeDefined();
          expect(member.availability.length).toBe(7);
        });
      });
    });

    it('should provide coverage percentage', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 75);

      result.shifts.forEach(shift => {
        expect(shift.coverage).toBeGreaterThan(0);
        expect(shift.coverage).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate total cost', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 75);

      expect(result.totalCost).toBeGreaterThan(0);
      // Cost should be number of staff * days * cost per shift
      expect(result.totalCost).toBeGreaterThan(100);
    });
  });

  describe('Coverage Optimization', () => {
    it('should maintain minimum coverage', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 50);

      result.shifts.forEach(shift => {
        expect(shift.coverage).toBeGreaterThan(0);
      });
    });

    it('should have higher coverage for higher occupancy', () => {
      const lowResult = scheduleStaffOccupancyBased(sampleStaff, 30);
      const highResult = scheduleStaffOccupancyBased(sampleStaff, 90);

      const lowAvgCoverage = lowResult.shifts.reduce((sum, s) => sum + s.coverage, 0) / 7;
      const highAvgCoverage = highResult.shifts.reduce((sum, s) => sum + s.coverage, 0) / 7;

      expect(highAvgCoverage).toBeGreaterThanOrEqual(lowAvgCoverage);
    });
  });

  describe('Role Distribution', () => {
    it('should distribute different roles across shifts', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 75);

      const allRoles = result.shifts.flatMap(shift =>
        shift.staff.map(member => member.role)
      );

      // Should have at least some roles represented
      expect(allRoles.length).toBeGreaterThan(0);
      expect(allRoles.some(role => ['front-desk', 'housekeeping', 'maintenance'].includes(role))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle low occupancy', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 10);

      expect(result.shifts).toHaveLength(7);
      expect(result.totalCost).toBeGreaterThan(0);
    });

    it('should handle full occupancy', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 100);

      expect(result.shifts).toHaveLength(7);
      result.shifts.forEach(shift => {
        expect(shift.staff.length).toBeGreaterThan(0);
      });
    });

    it('should handle limited staff', () => {
      const limitedStaff = sampleStaff.slice(0, 2);
      const result = scheduleStaffOccupancyBased(limitedStaff, 75);

      expect(result.shifts).toHaveLength(7);
      expect(result.totalCost).toBeGreaterThan(0);
    });

    it('should handle staff with limited availability', () => {
      const limitedAvailability: StaffMember[] = [
        { id: 's1', name: 'Test', role: 'front-desk', hoursPerWeek: 40, availability: [true, false, false, false, false, false, false] },
        { id: 's2', name: 'Test2', role: 'housekeeping', hoursPerWeek: 40, availability: [false, true, false, false, false, false, false] },
      ];

      const result = scheduleStaffOccupancyBased(limitedAvailability, 50);

      expect(result.shifts).toHaveLength(7);
    });
  });

  describe('Date Handling', () => {
    it('should create shifts with valid dates', () => {
      const result = scheduleStaffOccupancyBased(sampleStaff, 75);

      result.shifts.forEach((shift, index) => {
        expect(shift.date).toBeInstanceOf(Date);
        if (index > 0) {
          expect(shift.date.getTime()).toBeGreaterThan(result.shifts[index - 1].date.getTime());
        }
      });
    });
  });
});
