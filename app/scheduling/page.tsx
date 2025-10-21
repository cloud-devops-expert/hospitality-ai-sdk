'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { StaffMember, ScheduleResult, scheduleStaffOccupancyBased, SCHEDULING_MODELS } from '@/lib/scheduling/optimizer';

export default function SchedulingPage() {
  const [staffCount, setStaffCount] = useState(15);
  const [occupancyRate, setOccupancyRate] = useState(75);
  const [result, setResult] = useState<ScheduleResult | null>(null);

  const handleSchedule = () => {
    const staff: StaffMember[] = Array.from({ length: staffCount }, (_, i) => ({
      id: `staff-${i}`,
      name: `Staff ${i + 1}`,
      role: i < 5 ? 'front-desk' : i < 12 ? 'housekeeping' : 'maintenance',
      hoursPerWeek: 40,
      availability: [true, true, true, true, true, true, true],
    }));

    const schedule = scheduleStaffOccupancyBased(staff, occupancyRate);
    setResult(schedule);
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <Navigation title="Staff Scheduling" />
        <p className="text-gray-600 dark:text-gray-400 mb-8">Optimize staff schedules based on demand forecast</p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(SCHEDULING_MODELS).map(([key, model]) => (
              <div key={key} className="p-4 border rounded">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{model.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{(model.accuracy * 100).toFixed(0)}% accuracy</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Staff Count: {staffCount}</label>
              <input type="range" value={staffCount} onChange={(e) => setStaffCount(Number(e.target.value))} className="w-full" min="5" max="50" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Expected Occupancy: {occupancyRate}%</label>
              <input type="range" value={occupancyRate} onChange={(e) => setOccupancyRate(Number(e.target.value))} className="w-full" min="0" max="100" />
            </div>
            <button onClick={handleSchedule} className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-700">Generate Schedule</button>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Schedule (7 Days)</h2>
            <div className="space-y-3">
              {result.shifts.map((shift, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{shift.date.toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{shift.staff.length} staff scheduled • Coverage: {(shift.coverage * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Weekly Cost: ${result.totalCost}</p>
          </div>
        )}
      </div>
    </div>
  );
}
