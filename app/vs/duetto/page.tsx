'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function VsDuetto() {
  const [rooms, setRooms] = useState(100);

  const calculateSavings = (rooms: number) => {
    // Duetto: Enterprise pricing (high-end revenue management)
    // $3,000-15,000/month depending on property size
    const duettoMonth = rooms <= 50 ? 3000 : rooms <= 150 ? 8000 : 15000;
    const duettoYear = duettoMonth * 12;

    // Our pricing: Dramatically lower
    const ourPriceMonth = rooms <= 10 ? 0 : rooms <= 30 ? 150 / 12 : rooms <= 100 ? 350 / 12 : 500 / 12;
    const ourPriceYear = rooms <= 10 ? 0 : rooms <= 30 ? 150 : rooms <= 100 ? 350 : 500;

    const savingsYear = duettoYear - ourPriceYear;
    const savingsPercent = ((savingsYear / duettoYear) * 100).toFixed(0);

    return {
      duettoYear,
      duettoMonth,
      ourPriceYear,
      ourPriceMonth: Math.round(ourPriceMonth),
      savingsYear,
      savingsPercent,
      savings5Year: savingsYear * 5,
    };
  };

  const savings = calculateSavings(rooms);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-sm font-semibold mb-2">COMPARISON</div>
          <h1 className="text-5xl font-bold mb-4">
            Hospitality AI SDK vs Duetto
          </h1>
          <p className="text-xl text-purple-100 mb-6">
            Same revenue optimization, 95-99% cheaper, works offline
          </p>
          <div className="flex gap-4">
            <Link
              href="/demos"
              className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              Try Free Demo
            </Link>
            <a
              href="#calculator"
              className="px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
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
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              95%
            </div>
            <div className="text-gray-600 dark:text-gray-400">Offline-Capable</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
              5min
            </div>
            <div className="text-gray-600 dark:text-gray-400">Setup Time</div>
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
                    Duetto
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                    Hospitality AI SDK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (50 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $36,000/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $150/year (99.6% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (100 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $96,000/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $350/year (99.6% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (150 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $180,000/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $500/year (99.7% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Dynamic Pricing
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ Cloud-based
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ Local algorithms
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Demand Forecasting
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ ML-powered
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ Statistical + ML
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
                    ✓ Yes (95% operations)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Implementation Time
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    2-3 months
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    5 minutes
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Contract Length
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    3-year minimum
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    Month-to-month
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
                    Target Market
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    Large chains only
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    All hotel sizes
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Calculator */}
        <div id="calculator" className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Calculate Your Savings vs Duetto
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Rooms
              </label>
              <input
                type="range"
                min="20"
                max="300"
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
                <span className="text-gray-700 dark:text-gray-300">Duetto:</span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  ${savings.duettoYear.toLocaleString()}/year
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
            Why Hotels Are Switching from Duetto
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  99%+ Cost Reduction
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Duetto charges $3,000-15,000/month. We charge $0-500/year. Same revenue
                  optimization algorithms, 99% less cost.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">⚡</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  5-Minute Setup vs 3 Months
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No consultants, no onboarding fees, no training needed. Start optimizing
                  prices today, not in Q3.
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
                  95% of operations work without internet. No downtime when connection drops.
                  Critical for business continuity.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🔓</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No Vendor Lock-In
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Month-to-month pricing vs 3-year contracts. Cancel anytime. Open standards,
                  not proprietary APIs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Comparison */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🔬 Technical Comparison
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Duetto Architecture
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Cloud-based revenue management</li>
                <li>✓ ML-powered pricing optimization</li>
                <li>✗ Requires internet connection</li>
                <li>✗ $3,000-15,000/month</li>
                <li>✗ 3-year contract minimum</li>
                <li>✗ 2-3 months implementation</li>
                <li>✗ Enterprise-only (excludes 60% of market)</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Our Architecture
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Local-first revenue management</li>
                <li>✓ Statistical + ML hybrid pricing</li>
                <li>✓ Works offline (95%)</li>
                <li>✓ $0-500/year (99%+ savings)</li>
                <li>✓ Month-to-month (no lock-in)</li>
                <li>✓ 5-minute setup</li>
                <li>✓ All hotel sizes (democratized access)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Market Access Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🌍 Democratizing Revenue Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Duetto targets large hotel chains with enterprise budgets. We serve ALL hotels:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Small Hotels
              </h3>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                &lt;10 rooms
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>FREE</strong> (vs $36,000/year Duetto minimum)
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Medium Hotels
              </h3>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                10-100 rooms
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>$150-350/year</strong> (vs $36,000-96,000/year)
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Large Hotels
              </h3>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                100+ rooms
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>$500/year</strong> (vs $180,000+/year)
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Save {savings.savingsPercent}% on Revenue Management?
          </h2>
          <p className="text-xl text-purple-100 mb-6">
            Join hotels cutting costs with local-first revenue optimization
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demos"
              className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              Try Free Demo
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
            >
              Schedule Demo Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
