'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function VsCanary() {
  const [rooms, setRooms] = useState(50);

  const calculateSavings = (rooms: number) => {
    // Canary Technologies: Guest management platform
    // Pricing: $500-2,000/month depending on modules and property size
    const canaryMonth = rooms <= 30 ? 500 : rooms <= 100 ? 1200 : 2000;
    const canaryYear = canaryMonth * 12;

    // Our pricing: Significantly lower
    const ourPriceMonth = rooms <= 10 ? 0 : rooms <= 30 ? 150 / 12 : rooms <= 100 ? 350 / 12 : 500 / 12;
    const ourPriceYear = rooms <= 10 ? 0 : rooms <= 30 ? 150 : rooms <= 100 ? 350 : 500;

    const savingsYear = canaryYear - ourPriceYear;
    const savingsPercent = ((savingsYear / canaryYear) * 100).toFixed(0);

    return {
      canaryYear,
      canaryMonth,
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
      <div className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-800 dark:to-red-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-sm font-semibold mb-2">COMPARISON</div>
          <h1 className="text-5xl font-bold mb-4">
            Hospitality AI SDK vs Canary Technologies
          </h1>
          <p className="text-xl text-orange-100 mb-6">
            Same guest management features, 95-98% cheaper, works offline
          </p>
          <div className="flex gap-4">
            <Link
              href="/demos"
              className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Try Free Demo
            </Link>
            <a
              href="#calculator"
              className="px-6 py-3 bg-orange-700 text-white rounded-lg font-semibold hover:bg-orange-800 transition-colors"
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
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              95%
            </div>
            <div className="text-gray-600 dark:text-gray-400">Offline-Capable</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
              $0
            </div>
            <div className="text-gray-600 dark:text-gray-400">Setup Fees</div>
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
                    Canary Technologies
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-orange-600 dark:text-orange-400">
                    Hospitality AI SDK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (30 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $6,000/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $150/year (98% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (50 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $14,400/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $350/year (98% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Pricing (100 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $24,000/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $500/year (98% savings)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Guest Messaging
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ SMS/Web chat
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ SMS/Web/WhatsApp
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Contactless Check-in
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ Mobile app
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ PWA (no app install)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Upsell Management
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ Manual rules
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    ✓ AI-powered suggestions
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
                    Setup Time
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    1-2 weeks
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    5 minutes
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    SMS Translation
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    Limited languages
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    200 languages (NLLB-200)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Calculator */}
        <div id="calculator" className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Calculate Your Savings vs Canary
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Rooms
              </label>
              <input
                type="range"
                min="10"
                max="200"
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
                <span className="text-gray-700 dark:text-gray-300">Canary:</span>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  ${savings.canaryYear.toLocaleString()}/year
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
            Why Hotels Are Switching from Canary
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  95-98% Cost Reduction
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Canary charges $500-2,000/month. We charge $0-500/year. Same guest
                  management features at 2% of the cost.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🔒</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Guest Data Stays Private
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Local-first architecture. Guest messages and data never leave your property.
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
                  95% of operations work without internet. Check-in, messaging, upsells - all
                  work offline. Critical for business continuity.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🌍</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  200 Languages Built-In
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automatic guest message translation in 200 languages using NLLB-200.
                  No extra fees, no API costs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Deep Dive */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🎯 Feature-by-Feature Breakdown
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Guest Messaging
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Canary Technologies:
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• SMS and web chat</li>
                    <li>• Cloud-based only</li>
                    <li>• Limited language support</li>
                    <li>• $0.03/message SMS cost</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Hospitality AI SDK:
                  </div>
                  <ul className="space-y-1 text-green-600 dark:text-green-400">
                    <li>✓ SMS, web, WhatsApp, Telegram</li>
                    <li>✓ Works offline (95%)</li>
                    <li>✓ 200 languages (auto-translate)</li>
                    <li>✓ SMS via your provider (same $0.03/msg)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Contactless Check-in
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Canary Technologies:
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Native mobile app required</li>
                    <li>• App store approval delays</li>
                    <li>• Internet connection required</li>
                    <li>• Branded Canary interface</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Hospitality AI SDK:
                  </div>
                  <ul className="space-y-1 text-green-600 dark:text-green-400">
                    <li>✓ Progressive Web App (no install)</li>
                    <li>✓ Deploy instantly (no approval)</li>
                    <li>✓ Works offline with sync</li>
                    <li>✓ Your hotel branding</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Upsell Management
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Canary Technologies:
                  </div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Manual rule configuration</li>
                    <li>• Static offer templates</li>
                    <li>• Basic analytics</li>
                    <li>• No AI optimization</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Hospitality AI SDK:
                  </div>
                  <ul className="space-y-1 text-green-600 dark:text-green-400">
                    <li>✓ AI-powered suggestions</li>
                    <li>✓ Dynamic personalization</li>
                    <li>✓ Advanced analytics + ML</li>
                    <li>✓ Automatic optimization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-800 dark:to-red-800 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Save {savings.savingsPercent}% on Guest Management?
          </h2>
          <p className="text-xl text-orange-100 mb-6">
            Join hotels cutting costs with local-first guest management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demos"
              className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Try Free Demo
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-orange-700 text-white rounded-lg font-semibold hover:bg-orange-800 transition-colors"
            >
              Schedule Demo Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
