'use client';

import Link from 'next/link';

export default function CompetitorsPage() {
  const competitors = [
    {
      name: 'RoomPriceGenie',
      slug: 'roompricegenie',
      category: 'Revenue Management',
      savings: '84-100%',
      gradient: 'from-blue-600 to-purple-600',
      description: 'Dynamic pricing and revenue optimization',
      keyBenefits: ['Works Offline', 'Free for <10 rooms', '5-minute setup'],
    },
    {
      name: 'TrustYou',
      slug: 'trustyou',
      category: 'Sentiment Analysis',
      savings: '90-95%',
      gradient: 'from-green-600 to-teal-600',
      description: 'Guest review sentiment analysis and categorization',
      keyBenefits: ['Zero API costs', 'Browser ML', '95% offline'],
    },
    {
      name: 'Duetto',
      slug: 'duetto',
      category: 'Revenue Management',
      savings: '99%+',
      gradient: 'from-purple-600 to-pink-600',
      description: 'Enterprise revenue management and pricing',
      keyBenefits: ['No lock-in', '5-min setup', 'All hotel sizes'],
    },
    {
      name: 'Canary Technologies',
      slug: 'canary',
      category: 'Guest Management',
      savings: '95-98%',
      gradient: 'from-orange-600 to-red-600',
      description: 'Contactless check-in and guest messaging',
      keyBenefits: ['200 languages', 'PWA (no app)', 'Offline-capable'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-sm font-semibold mb-2">COMPETITOR COMPARISONS</div>
          <h1 className="text-5xl font-bold mb-4">
            Why Hotels Choose Us Over Enterprise SaaS
          </h1>
          <p className="text-xl text-blue-100 mb-6">
            Same features, 90-99% cheaper, works offline, local-first privacy
          </p>
          <div className="flex gap-4">
            <Link
              href="/demos"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Try Free Demo
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Schedule Demo Call
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              90-99%
            </div>
            <div className="text-gray-600 dark:text-gray-400">Cost Savings</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              95%
            </div>
            <div className="text-gray-600 dark:text-gray-400">Offline-Capable</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              5min
            </div>
            <div className="text-gray-600 dark:text-gray-400">Setup Time</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
              $0
            </div>
            <div className="text-gray-600 dark:text-gray-400">Free Tier</div>
          </div>
        </div>

        {/* Competitor Cards */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Compare Against Your Current Provider
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {competitors.map((competitor) => (
              <Link
                key={competitor.slug}
                href={`/vs/${competitor.slug}`}
                className="group"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${competitor.gradient} mb-2`}>
                        {competitor.category}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {competitor.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {competitor.savings}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        savings
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {competitor.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    {competitor.keyBenefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                        {benefit}
                      </div>
                    ))}
                  </div>

                  <div className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                    See Detailed Comparison →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Why Switch Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Why Hotels Are Switching to Local-First AI
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-4xl">💰</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  90-99% Cost Reduction
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Enterprise SaaS charges $500-15,000/month. We charge $0-500/year. Same
                  functionality, fraction of the cost.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-4xl">🔒</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Your Data Stays Private
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Local-first architecture. Guest data, pricing, reviews - all processed on your
                  property. GDPR compliant by design.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-4xl">📴</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Works Offline (95%)
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Critical operations work without internet. No downtime when connection drops.
                  Business continuity guaranteed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-4xl">⚡</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  5-Minute Setup
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No consultants, no onboarding fees, no training needed. Start using it today,
                  not in 3 months.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Market Comparison: Traditional SaaS vs Local-First
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Enterprise SaaS
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Hospitality AI SDK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Annual Cost (50 rooms)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    $6,000-36,000/year
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    $150-350/year
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Setup Time
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    1-3 months
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    5 minutes
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    Contract Length
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    1-3 years minimum
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                    Month-to-month
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
                    ✓ Yes (95%)
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
                    Vendor Lock-in
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                    High
                  </td>
                  <td className="px-6 py-4 text-center text-green-600 dark:text-green-400">
                    None (open standards)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Example */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Real-World ROI Example
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                50-Room Hotel Using Enterprise SaaS
              </h3>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>RoomPriceGenie:</span>
                  <span className="font-semibold">$948/year</span>
                </div>
                <div className="flex justify-between">
                  <span>TrustYou:</span>
                  <span className="font-semibold">$6,300/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Canary Technologies:</span>
                  <span className="font-semibold">$14,400/year</span>
                </div>
                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total Annual Cost:</span>
                  <span className="text-red-600 dark:text-red-400">$21,648</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border-2 border-green-500">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Same Hotel Using Hospitality AI SDK
              </h3>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Revenue Management:</span>
                  <span className="font-semibold">$150/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Sentiment Analysis:</span>
                  <span className="font-semibold">$0/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest Management:</span>
                  <span className="font-semibold">$150/year</span>
                </div>
                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total Annual Cost:</span>
                  <span className="text-green-600 dark:text-green-400">$300</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  $21,348 saved per year
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  98.6% cost reduction • $106,740 saved over 5 years
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Cut Costs by 90-99%?
          </h2>
          <p className="text-xl text-blue-100 mb-6">
            Join hotels switching to local-first AI for cost savings, privacy, and offline capability
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
