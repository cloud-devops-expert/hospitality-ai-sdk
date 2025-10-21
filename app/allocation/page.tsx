'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-green-600 hover:text-green-800 mb-4 inline-block">
          ← Back to Home
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Room Allocation</h1>
          <p className="text-gray-600">
            Rule-based intelligent room assignment based on guest preferences
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Guest Preferences</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as Room['type'])}
                  className="w-full p-2 border border-gray-300 rounded"
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
                    className="rounded"
                  />
                  <span className="text-sm font-medium">VIP Guest</span>
                </label>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Must-Have Requirements</p>

                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={accessible}
                    onChange={(e) => setAccessible(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Accessible Room</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={smoking}
                    onChange={(e) => setSmoking(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Smoking Allowed</span>
                </label>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preferences</p>

                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={quiet}
                    onChange={(e) => setQuiet(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Quiet Location</span>
                </label>

                <div className="mb-3">
                  <label className="block text-sm text-gray-700 mb-1">Preferred View</label>
                  <select
                    value={preferredView}
                    onChange={(e) => setPreferredView(e.target.value as Room['view'] | '')}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">No preference</option>
                    <option value="ocean">Ocean</option>
                    <option value="city">City</option>
                    <option value="garden">Garden</option>
                    <option value="courtyard">Courtyard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Preferred Floor</label>
                  <select
                    value={preferredFloor}
                    onChange={(e) => setPreferredFloor(e.target.value as 'low' | 'medium' | 'high' | '')}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
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
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 mt-4"
              >
                Find Best Room
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && result.assignedRoom && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Assigned Room</h2>

                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-4">
                  <p className="text-3xl font-bold text-green-700">Room {result.assignedRoom.number}</p>
                  <p className="text-lg text-gray-700 capitalize">{result.assignedRoom.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Floor</p>
                    <p className="font-semibold">{result.assignedRoom.floor}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">View</p>
                    <p className="font-semibold capitalize">{result.assignedRoom.view}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Price</p>
                    <p className="font-semibold">${result.assignedRoom.basePrice}/night</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Match Score</p>
                    <p className="font-semibold">{result.score}/100</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {result.assignedRoom.accessible && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Accessible</span>
                    )}
                    {result.assignedRoom.smokingAllowed && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Smoking</span>
                    )}
                    {!result.assignedRoom.smokingAllowed && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Non-smoking</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Why This Room?</p>
                  <ul className="space-y-1">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Available Rooms</h3>
              <div className="space-y-2">
                {SAMPLE_ROOMS.filter(r => r.status === 'available').map(room => (
                  <div
                    key={room.id}
                    className={`p-3 border rounded ${
                      result?.assignedRoom?.id === room.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Room {room.number}</p>
                        <p className="text-xs text-gray-600 capitalize">
                          {room.type} • Floor {room.floor} • {room.view} view
                        </p>
                      </div>
                      <p className="text-sm font-semibold">${room.basePrice}</p>
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
