'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Room, Guest, Booking, AllocationResult } from '@/lib/allocation/types';
import { allocateRoomRuleBased } from '@/lib/allocation/rule-based';

const SAMPLE_ROOMS: Room[] = [
  { id: '101', number: '101', type: 'single', floor: 1, accessible: true, smokingAllowed: false, view: 'courtyard', status: 'available', basePrice: 100 },
  { id: '201', number: '201', type: 'double', floor: 2, accessible: false, smokingAllowed: false, view: 'city', status: 'available', basePrice: 150 },
  { id: '301', number: '301', type: 'double', floor: 3, accessible: false, smokingAllowed: false, view: 'garden', status: 'available', basePrice: 160 },
  { id: '501', number: '501', type: 'suite', floor: 5, accessible: false, smokingAllowed: false, view: 'ocean', status: 'available', basePrice: 300 },
  { id: '802', number: '802', type: 'deluxe', floor: 8, accessible: false, smokingAllowed: false, view: 'ocean', status: 'available', basePrice: 400 },
  { id: '1001', number: '1001', type: 'suite', floor: 10, accessible: false, smokingAllowed: true, view: 'ocean', status: 'available', basePrice: 350 },
];

export default function AllocationPage() {
  const [guestName, setGuestName] = useState('');
  const [roomType, setRoomType] = useState<Room['type']>('double');
  const [vipStatus, setVipStatus] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [preferredView, setPreferredView] = useState<Room['view'] | ''>('');
  const [preferredFloor, setPreferredFloor] = useState<'low' | 'medium' | 'high' | ''>('');
  const [result, setResult] = useState<AllocationResult | null>(null);

  const handleAllocate = () => {
    const guest: Guest = {
      id: 'guest-1',
      name: guestName || 'Guest',
      preferences: {
        accessible: accessible || undefined,
        smoking: smoking || undefined,
        quiet: quiet || undefined,
        view: preferredView || undefined,
        floor: preferredFloor || undefined,
      },
      vipStatus,
      previousStays: vipStatus ? 10 : 2,
    };

    const booking: Booking = {
      id: 'booking-1',
      guestId: guest.id,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      requestedRoomType: roomType,
    };

    const allocation = allocateRoomRuleBased(booking, guest, SAMPLE_ROOMS);
    setResult(allocation);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation title="Room Allocation" />

      <div className="max-w-6xl mx-auto p-8">
        <header className="mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            Rule-based intelligent room assignment based on guest preferences
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Guest Preferences</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as Room['type'])}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="suite">Suite</option>
                  <option value="deluxe">Deluxe</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={vipStatus}
                    onChange={(e) => setVipStatus(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">VIP Guest</span>
                </label>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Must-Have Requirements</p>

                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={accessible}
                    onChange={(e) => setAccessible(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Accessible Room</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={smoking}
                    onChange={(e) => setSmoking(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Smoking Allowed</span>
                </label>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferences</p>

                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={quiet}
                    onChange={(e) => setQuiet(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Quiet Location</span>
                </label>

                <div className="mb-3">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Preferred View</label>
                  <select
                    value={preferredView}
                    onChange={(e) => setPreferredView(e.target.value as Room['view'] | '')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">No preference</option>
                    <option value="ocean">Ocean</option>
                    <option value="city">City</option>
                    <option value="garden">Garden</option>
                    <option value="courtyard">Courtyard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Preferred Floor</label>
                  <select
                    value={preferredFloor}
                    onChange={(e) => setPreferredFloor(e.target.value as 'low' | 'medium' | 'high' | '')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">No preference</option>
                    <option value="low">Low (1-3)</option>
                    <option value="medium">Medium (4-8)</option>
                    <option value="high">High (9+)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAllocate}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 dark:hover:bg-brand-600 mt-4"
              >
                Find Best Room
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && result.assignedRoom && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Assigned Room</h2>

                <div className="bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-500 dark:border-brand-600 rounded-lg p-4 mb-4">
                  <p className="text-3xl font-bold text-brand-700 dark:text-brand-400">Room {result.assignedRoom.number}</p>
                  <p className="text-lg text-gray-700 dark:text-gray-300 capitalize">{result.assignedRoom.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Floor</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{result.assignedRoom.floor}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">View</p>
                    <p className="font-semibold capitalize text-gray-900 dark:text-gray-100">{result.assignedRoom.view}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Price</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">${result.assignedRoom.basePrice}/night</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Match Score</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{result.score}/100</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {result.assignedRoom.accessible && (
                      <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded text-xs">Accessible</span>
                    )}
                    {result.assignedRoom.smokingAllowed && (
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs">Smoking</span>
                    )}
                    {!result.assignedRoom.smokingAllowed && (
                      <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded text-xs">Non-smoking</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Why This Room?</p>
                  <ul className="space-y-1">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                        <span className="text-brand-600 dark:text-brand-400 mr-2">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Available Rooms</h3>
              <div className="space-y-2">
                {SAMPLE_ROOMS.filter(r => r.status === 'available').map(room => (
                  <div
                    key={room.id}
                    className={`p-3 border rounded ${
                      result?.assignedRoom?.id === room.id
                        ? 'border-brand-500 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Room {room.number}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {room.type} • Floor {room.floor} • {room.view} view
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">${room.basePrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
