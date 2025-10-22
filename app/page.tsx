import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

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
      description:
        'Predict booking no-show risk with rule-based, logistic regression, and gradient boosting',
      href: '/no-show',
      status: 'new',
    },
    {
      name: 'Review Response Generator',
      description: 'Generate professional responses to guest reviews with sentiment analysis',
      href: '/review-response',
      status: 'new',
    },
    {
      name: 'Housekeeping Routes',
      description: 'Optimize cleaning routes with greedy, TSP, and genetic algorithms',
      href: '/housekeeping',
      status: 'new',
    },
    {
      name: 'Upsell Recommendations',
      description: 'Generate personalized upsell offers based on guest profiles',
      href: '/upsell',
      status: 'new',
    },
    {
      name: 'Energy Management',
      description: 'Optimize HVAC settings to reduce energy costs',
      href: '/energy',
      status: 'new',
    },
    {
      name: 'Staff Scheduling',
      description: 'Optimize staff schedules based on occupancy forecasts',
      href: '/scheduling',
      status: 'new',
    },
    {
      name: 'F&B Inventory',
      description: 'Forecast inventory needs to reduce waste and prevent stockouts',
      href: '/inventory',
      status: 'new',
    },
    {
      name: 'Complaint Classification',
      description: 'Automatically classify and route guest complaints',
      href: '/complaints',
      status: 'new',
    },
    {
      name: 'Maintenance Prediction',
      description: 'Predict equipment maintenance needs to prevent failures',
      href: '/maintenance',
      status: 'new',
    },
    {
      name: 'Check-in Time Prediction',
      description: 'Predict actual guest check-in times to optimize staffing',
      href: '/checkin',
      status: 'new',
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
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Core Features
          </h2>
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
            <span className="ml-3 text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full">
              NEW
            </span>
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
  );
}
