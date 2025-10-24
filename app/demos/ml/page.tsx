/**
 * ML Demos Landing Page
 *
 * Showcases all battle-tested ML implementations
 */

import Link from 'next/link';

export default function MLDemosPage() {
  const mlDemos = [
    {
      title: 'BERT Sentiment Analysis',
      description:
        '85-90% accuracy, CPU-only, $0 cost. Analyze guest reviews without generative AI.',
      path: '/demos/sentiment',
      icon: '🤖',
      technology: 'BERT (Hugging Face)',
      cost: '$0/month',
      accuracy: '85-90%',
      implemented: true,
      category: 'traditional-ml',
    },
    {
      title: 'Entity Extraction (NER)',
      description:
        'Extract names, dates, emails, room numbers from text. Rule-based, no ML needed.',
      path: '/demos/entity-extraction',
      icon: '🔍',
      technology: 'Compromise (Rule-based)',
      cost: '$0/month',
      accuracy: '75-85%',
      implemented: true,
      category: 'traditional-ml',
    },
    {
      title: 'Fraud Detection',
      description:
        'Detect suspicious bookings using Isolation Forest. 75-85% fraud detection rate.',
      path: '/demos/fraud-detection',
      icon: '🚨',
      technology: 'Isolation Forest',
      cost: '$100-200/month',
      accuracy: '75-85%',
      implemented: true,
      category: 'traditional-ml',
    },
    {
      title: 'Demand Forecasting',
      description:
        '87-90% accuracy with LightGBM. Forecast inventory/kitchen demand, CPU-only.',
      path: '/demos/forecasting',
      icon: '📈',
      technology: 'LightGBM/XGBoost',
      cost: '$100-300/month',
      accuracy: '87-90%',
      implemented: true,
      category: 'traditional-ml',
    },
    {
      title: 'Housekeeping Optimization',
      description:
        'Optimal staff assignments and routes. Constraint solving, not ML. 100% satisfaction.',
      path: '/demos/housekeeping-optimization',
      icon: '🧹',
      technology: 'Constraint Solver',
      cost: '$0/month',
      accuracy: '100% optimal',
      implemented: true,
      category: 'operations-research',
    },
    {
      title: 'Review Response (LLM)',
      description:
        '95%+ quality responses. THIS is where generative AI excels! GPT-4o-mini/Claude.',
      path: '/demos/review-response',
      icon: '✨',
      technology: 'GPT-4o-mini / Claude',
      cost: '$50-200/month',
      accuracy: '95%+',
      implemented: true,
      category: 'generative-ai',
    },
  ];

  const categoryInfo = {
    'traditional-ml': {
      title: 'Traditional ML',
      description: 'Use these instead of generative AI for structured data tasks',
      color: 'blue',
    },
    'operations-research': {
      title: 'Operations Research',
      description: 'Not ML at all! Constraint solving for optimization problems',
      color: 'purple',
    },
    'generative-ai': {
      title: 'Generative AI (LLMs)',
      description: 'Use LLMs HERE - text generation and conversation',
      color: 'green',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to All Demos
          </Link>
          <h1 className="text-5xl font-bold text-navy-900 dark:text-white mb-4">
            🤖 Battle-Tested ML Demos
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl">
            7 production-ready implementations showing when to use traditional ML, operations
            research, and generative AI
          </p>
        </div>

        {/* Key Principle */}
        <div className="bg-gradient-to-r from-navy-900 to-blue-800 dark:from-navy-800 dark:to-blue-900 rounded-xl shadow-lg p-8 mb-12 text-white">
          <h2 className="text-3xl font-bold mb-4">💡 Core Principle</h2>
          <p className="text-xl text-blue-100 mb-6">
            "Use the right AI for the job, not the easy one."
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl font-bold">$76K-$197K</div>
              <div className="text-blue-200">Annual Savings</div>
            </div>
            <div>
              <div className="text-4xl font-bold">6x-47x</div>
              <div className="text-blue-200">ROI in Year 1</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$350-$1K</div>
              <div className="text-blue-200">Total Monthly Cost</div>
            </div>
          </div>
        </div>

        {/* Demos by Category */}
        {Object.entries(categoryInfo).map(([category, info]) => {
          const categoryDemos = mlDemos.filter((d) => d.category === category);

          return (
            <div key={category} className="mb-12">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">
                  {info.title}
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300">{info.description}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryDemos.map((demo) => (
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

                      <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                        {demo.description}
                      </p>

                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Technology:</span>
                          <span className="font-semibold text-navy-900 dark:text-white">
                            {demo.technology}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Accuracy:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {demo.accuracy}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Cost:</span>
                          <span className="font-semibold text-navy-900 dark:text-white">
                            {demo.cost}
                          </span>
                        </div>
                      </div>

                      {demo.implemented ? (
                        <Link
                          href={demo.path}
                          className="block w-full text-center px-4 py-2 bg-navy-900 dark:bg-navy-700 text-white rounded-lg hover:bg-navy-800 dark:hover:bg-navy-600 transition-colors"
                        >
                          Try Demo →
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg cursor-not-allowed"
                        >
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Call to Action */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-4">
            📚 Documentation
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">Strategic Docs</h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-2">
                <li>• Battle-Tested ML Models Guide</li>
                <li>• ML Without Generative AI Case Studies</li>
                <li>• Complete Implementation Summary</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">CLI Demos</h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-2">
                <li>• npm run demo:bert-sentiment</li>
                <li>• npm run demo:entity-extraction</li>
                <li>• npm run demo:fraud-detection</li>
                <li>• npm run demo:gradient-boosting</li>
                <li>• npm run demo:housekeeping</li>
                <li>• npm run demo:review-response</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
