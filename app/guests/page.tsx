'use client';

import { useState, useEffect } from 'react';
import {
  Guest,
  SegmentedGuest,
  segmentGuests,
  calculateSegmentStats,
  getSegmentDefinition,
} from '@/lib/guests/segmentation';

export default function GuestsPage() {
  const [guests, setGuests] = useState<SegmentedGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    setLoading(true);
    try {
      // Generate synthetic guests for demo
      const syntheticGuests = generateSyntheticGuests(100);
      const segmented = await segmentGuests(syntheticGuests);
      setGuests(segmented);
    } catch (error) {
      console.error('Failed to load guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateSegmentStats(guests);

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      !searchQuery ||
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = !selectedSegment || guest.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  const getSegmentColor = (segmentName: string) => {
    const colors: Record<string, string> = {
      'Budget Travelers': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'Value Seekers': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'Premium Guests': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'Luxury Travelers':
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    return colors[segmentName] || colors['Value Seekers'];
  };

  const getSegmentIcon = (segmentName: string) => {
    const icons: Record<string, string> = {
      'Budget Travelers': '💵',
      'Value Seekers': '🎯',
      'Premium Guests': '⭐',
      'Luxury Travelers': '👑',
    };
    return icons[segmentName] || '👤';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing guest profiles...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            👥 Guest Intelligence Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            AI-powered guest segmentation and insights
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.segments.map((segment) => {
            const definition = getSegmentDefinition(segment.name);
            return (
              <div
                key={segment.name}
                onClick={() =>
                  setSelectedSegment(
                    selectedSegment === segment.name ? null : segment.name
                  )
                }
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl ${
                  selectedSegment === segment.name
                    ? 'ring-2 ring-blue-500 scale-105'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{getSegmentIcon(segment.name)}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getSegmentColor(segment.name)}`}
                  >
                    {segment.percentage.toFixed(0)}%
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">
                  {segment.name}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {segment.count}
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Avg Spend: ${segment.avgSpend.toFixed(0)}</p>
                  <p>Avg Stays: {segment.avgStays.toFixed(1)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Segment Details */}
        {selectedSegment && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  {getSegmentIcon(selectedSegment)} {selectedSegment}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {getSegmentDefinition(selectedSegment)?.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedSegment(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Characteristics */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Characteristics
                </h3>
                <ul className="space-y-2">
                  {getSegmentDefinition(selectedSegment)?.characteristics.map(
                    (char, i) => (
                      <li
                        key={i}
                        className="flex items-start text-gray-700 dark:text-gray-300"
                      >
                        <span className="mr-2">•</span>
                        <span>{char}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Recommended Actions */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  Recommended Actions
                </h3>
                <ul className="space-y-2">
                  {getSegmentDefinition(selectedSegment)?.recommendedActions.map(
                    (action, i) => (
                      <li
                        key={i}
                        className="flex items-start text-gray-700 dark:text-gray-300"
                      >
                        <span className="mr-2">✓</span>
                        <span>{action}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests by name or email..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSegment(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !selectedSegment
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Segments
              </button>
              <button
                onClick={loadGuests}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Showing <strong>{filteredGuests.length}</strong> guest
            {filteredGuests.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Guest List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Segment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Spending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-xl">
                            {getSegmentIcon(guest.segment)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {guest.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {guest.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSegmentColor(guest.segment)}`}
                      >
                        {guest.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>{guest.totalStays} stays</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {guest.roomUpgrades} upgrades
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium">
                        ${guest.totalSpend.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Avg: ${guest.avgRoomRate.toFixed(0)}/night
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                          View
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                          Message
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate synthetic guests
function generateSyntheticGuests(count: number): Guest[] {
  const firstNames = [
    'John',
    'Emily',
    'Michael',
    'Sarah',
    'David',
    'Emma',
    'James',
    'Olivia',
    'Robert',
    'Sophia',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Brown',
    'Davis',
    'Wilson',
    'Garcia',
    'Martinez',
    'Anderson',
  ];

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return {
      id: `GUEST-${i + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      totalStays: Math.floor(Math.random() * 20) + 1,
      totalSpend: Math.random() * 5000 + 500,
      avgRoomRate: Math.random() * 200 + 80,
      avgDaysInAdvance: Math.random() * 60,
      roomUpgrades: Math.floor(Math.random() * 5),
      amenityUsage: Math.random(),
      lastStay: new Date(
        Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000
      ),
      reviewScore: Math.random() * 2 + 3, // 3-5 stars
    };
  });
}
