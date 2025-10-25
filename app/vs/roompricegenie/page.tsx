'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function VsRoomPriceGenie() {
  const [rooms, setRooms] = useState(30);

  const calculateSavings = (rooms: number) => {
    const roomPriceGenieYear = rooms <= 10 ? 588 : rooms <= 30 ? 948 : 1428;
    const ourPriceYear = rooms <= 10 ? 0 : rooms <= 30 ? 150 : 350;
    const savingsYear = roomPriceGenieYear - ourPriceYear;
    const savingsPercent = ((savingsYear / roomPriceGenieYear) * 100).toFixed(0);

    return {
      roomPriceGenieYear,
      ourPriceYear,
      savingsYear,
      savingsPercent,
      savings5Year: savingsYear * 5,
    };
  };

  const savings = calculateSavings(rooms);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-sm font-semibold mb-2">COMPARISON</div>
          <h1 className="text-5xl font-bold mb-4">
            Hospitality AI SDK vs RoomPriceGenie
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            Same revenue optimization results, 40-100% cheaper, works offline
          </p>
          <div className="flex gap-4">
            <Link
              href="/demos"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Try Free Demo
            </Link>
            <a
              href="#calculator"
              className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Calculate Savings
            </a>
          </div>
        </div>
      </div>

      {/* Quick Comparison */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {savings.savingsPercent}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">Cost Savings</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              ✓
            </div>
            <div className="text-gray-600 dark:text-gray-400">Works Offline</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              $0
            </div>
            <div className="text-gray-600 dark:text-gray-400">Free Tier Available</div>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-12">
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Feature Comparison
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    RoomPriceGenie
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Hospitality AI SDK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (10 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $588/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $0/year (Free)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (30 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $948/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $150/year (84% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (50 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $1,428/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $350/year (76% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Works Offline
                  </td>
                  <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                    ✗ No
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ Yes
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Data Privacy
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    Cloud-only
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    Local-first
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Free Tier
                  </td>
                  <td className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                    ✗ No
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ Yes (&lt;10 rooms)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Setup Time
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    2-3 days
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    5 minutes
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Vendor Lock-in
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    Yes (SaaS)
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    No (Open standards)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Business Continuity
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    Internet required
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    95% offline-capable
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Calculator */}
        <div id="calculator" className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Calculate Your Savings
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Rooms
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {rooms} rooms
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">RoomPriceGenie:</span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  ${savings.roomPriceGenieYear.toLocaleString()}/year
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Our Solution:</span>
                <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                  ${savings.ourPriceYear.toLocaleString()}/year
                </span>
              </div>
              <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Annual Savings:
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${savings.savingsYear.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    5-Year Savings:
                  </span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ${savings.savings5Year.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Switch Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Why Hotels Are Switching to Us
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Massive Cost Savings
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Save 40-100% on revenue management costs. Free tier for hotels under 10 rooms.
                  No hidden fees or surprise charges.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🔒</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Your Data Stays Private
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Local-first architecture means your pricing data never leaves your property.
                  GDPR compliant by design.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">📴</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Works Offline
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  95% of operations work without internet. No downtime when your connection drops.
                  Critical for business continuity.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">⚡</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Instant Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  5-minute setup vs days of onboarding. Start optimizing prices today,
                  not next week.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Save {savings.savingsPercent}% on Revenue Management?
          </h2>
          <p className="text-xl text-blue-100 mb-6">
            Join hundreds of hotels cutting costs with local-first AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demos"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Try Free Demo
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Schedule Demo Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
