/**
 * Staff Scheduling Optimization
 */

export interface StaffMember {
  id: string;
  name: string;
  role: 'front-desk' | 'housekeeping' | 'maintenance';
  hoursPerWeek: number;
  availability: boolean[];
}

export interface ScheduleResult {
  shifts: Array<{ date: Date; staff: StaffMember[]; coverage: number }>;
  totalCost: number;
  method: 'fixed' | 'occupancy' | 'demand';
  processingTime?: number;
}

export function scheduleStaffOccupancyBased(staff: StaffMember[], occupancyRate: number, days: number = 7): ScheduleResult {
  const startTime = Date.now();
  const shifts = [];

  // Simple scheduling: more staff on high occupancy days
  const staffNeeded = Math.ceil(staff.length * (occupancyRate / 100));

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    shifts.push({
      date,
      staff: staff.slice(0, staffNeeded),
      coverage: staffNeeded / staff.length,
    });
  }

  const totalCost = staffNeeded * days * 120; // $120 per shift

  return {
    shifts,
    totalCost,
    method: 'occupancy',
    processingTime: Date.now() - startTime,
  };
}

export const SCHEDULING_MODELS = {
  'fixed': { name: 'Fixed Ratios', cost: 0, avgLatency: 1, accuracy: 0.65, description: 'Industry standard levels' },
  'occupancy': { name: 'Occupancy-Based', cost: 0, avgLatency: 15, accuracy: 0.78, description: 'Dynamic staffing' },
  'demand': { name: 'Demand Forecasting', cost: 0, avgLatency: 40, accuracy: 0.86, description: 'Multi-factor prediction' },
};
