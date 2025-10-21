import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  const coreFeatures = [
    {
      name: 'Sentiment Analysis',
      description: 'Analyze guest reviews using traditional, ML, and hybrid approaches',
      href: '/sentiment',
    },
    {
      name: 'Room Allocation',
      description: 'Optimize room assignments with rule-based and ML algorithms',
      href: '/allocation',
    },
    {
      name: 'Dynamic Pricing',
      description: 'Smart pricing using algorithmic, regression, and neural network models',
      href: '/pricing',
    },
    {
      name: 'Demand Forecast',
      description: 'Predict occupancy with statistical and ML time-series methods',
      href: '/forecast',
    },
  ];

  const newFeatures = [
    {
      name: 'No-Show Prediction',
      description: 'Predict booking no-show risk with rule-based, logistic regression, and gradient boosting',
      href: '/no-show',
      status: 'new'
    },
  ];

  const utilityFeatures = [
    {
      name: 'ML Benchmarks',
      description: 'Compare all algorithms: cost, latency, and accuracy metrics',
      href: '/benchmark',
    },
  ];

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 text-brand-900 dark:text-brand-200">
            Hospitality AI SDK
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Cost-effective AI solutions for hospitality management
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Mix of LLMs, traditional algorithms, and local-first approaches
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreFeatures.map((feature) => (
              <Link
                key={feature.name}
                href={feature.href}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border-l-4 border-brand-600 dark:border-brand-400 hover:scale-105"
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            New: Additional Use Cases
            <span className="ml-3 text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full">NEW</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newFeatures.map((feature) => (
              <Link
                key={feature.name}
                href={feature.href}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border-l-4 border-green-600 dark:border-green-400 hover:scale-105"
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>9 more use cases available:</strong> Review Response Generator, Housekeeping Routes, Upsell Recommendations,
              Energy Management, Staff Scheduling, F&B Inventory, Complaint Classification, Maintenance Prediction, Check-in Time Prediction
              <br />
              <span className="text-xs text-blue-700 dark:text-blue-300 mt-1 block">
                Library modules implemented • Demo pages coming soon • See .agent/docs/proposed-ml-demos.md for details
              </span>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Utilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {utilityFeatures.map((feature) => (
              <Link
                key={feature.name}
                href={feature.href}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border-l-4 border-purple-600 dark:border-purple-400 hover:scale-105"
              >
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  {feature.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Built with Next.js, TypeScript, and Vercel AI SDK</p>
          <p className="mt-2">Focus on sustainability and cost reduction</p>
        </footer>
      </div>
    </main>
  )
}
