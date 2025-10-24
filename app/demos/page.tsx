/**
 * Demos Landing Page
 *
 * Showcases all operational ML demos
 */

import Link from 'next/link';

export default function DemosPage() {
  const demos = [
    {
      title: 'Operations ROI Calculator',
      description:
        'See complete ROI across all 5 operational areas. $84K-$140K/year savings for 100-room hotel.',
      path: '/demos/operations-roi',
      icon: '💰',
      savings: '$84K-$140K/year',
      implemented: true,
    },
    {
      title: 'Inventory Forecasting',
      description:
        'Demand forecasting, automatic reorder, and waste prediction with local-first ML.',
      path: '/demos/inventory',
      icon: '📦',
      savings: '$18K-$30K/year',
      implemented: true,
    },
    {
      title: 'Kitchen Operations',
      description: 'Prep quantity forecasting, waste reduction, and staff scheduling optimization.',
      path: '/demos/kitchen',
      icon: '🍽️',
      savings: '$24K-$36K/year',
      implemented: false,
    },
    {
      title: 'Laundry Optimization',
      description: 'Load optimization, off-peak scheduling, and linen tracking.',
      path: '/demos/laundry',
      icon: '🧺',
      savings: '$9.6K-$14.4K/year',
      implemented: false,
    },
    {
      title: 'Predictive Maintenance',
      description: 'Equipment failure prediction, maintenance scheduling, and ROI calculation.',
      path: '/demos/maintenance',
      icon: '🔧',
      savings: '$18K-$36K/year',
      implemented: false,
    },
    {
      title: 'Housekeeping Optimization',
      description: 'Room prioritization, staff assignment, and route optimization.',
      path: '/demos/housekeeping',
      icon: '🧹',
      savings: '$14.4K-$24K/year',
      implemented: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-navy-900 dark:text-white mb-4">
            🏨 Hotel Operations ML Demos
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Interactive demos showcasing local-first ML for hospitality operations
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-3 shadow-md">
              <div className="text-sm text-slate-500 dark:text-slate-400">Total Savings</div>
              <div className="text-2xl font-bold text-navy-900 dark:text-white">
                $84K-$140K/year
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-3 shadow-md">
              <div className="text-sm text-slate-500 dark:text-slate-400">Implementation</div>
              <div className="text-2xl font-bold text-navy-900 dark:text-white">2 days</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-3 shadow-md">
              <div className="text-sm text-slate-500 dark:text-slate-400">Cost</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">$0</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg px-6 py-3 shadow-md">
              <div className="text-sm text-slate-500 dark:text-slate-400">ROI</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">∞</div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
            🎯 Local-First Benefits
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">
                Instant Results
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                &lt;10ms execution time. Zero API calls. Works entirely in your browser.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">
                Complete Privacy
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Data never leaves your server. Zero third-party data sharing.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">📴</div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Works Offline</h3>
              <p className="text-slate-600 dark:text-slate-300">
                No internet required. 99.99% reliability with zero dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <div
              key={demo.path}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{demo.icon}</div>
                  {demo.implemented ? (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded-full">
                      Live Demo
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-2">
                  {demo.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{demo.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {demo.savings}
                  </div>
                  {demo.implemented ? (
                    <Link
                      href={demo.path}
                      className="px-4 py-2 bg-navy-900 dark:bg-navy-700 text-white rounded-lg hover:bg-navy-800 dark:hover:bg-navy-600 transition-colors"
                    >
                      Try Demo →
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-navy-900 to-blue-800 dark:from-navy-800 dark:to-blue-900 rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            All demos use the same local-first approach: zero API calls, zero cost, instant results.
            Start with the Operations ROI Calculator to see the complete business value.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/demos/operations-roi"
              className="px-6 py-3 bg-white text-navy-900 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              View Complete ROI
            </Link>
            <Link
              href="/demos/inventory"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
            >
              Try Inventory Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
