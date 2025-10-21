import Link from 'next/link'

export default function Home() {
  const features = [
    {
      name: 'Sentiment Analysis',
      description: 'Analyze guest reviews and feedback using AI and traditional NLP methods',
      href: '/sentiment',
      color: 'bg-blue-500'
    },
    {
      name: 'Room Allocation',
      description: 'Optimize room assignments using rule-based and AI-assisted algorithms',
      href: '/allocation',
      color: 'bg-green-500'
    },
    {
      name: 'Dynamic Pricing',
      description: 'Smart pricing strategies using traditional algorithms and AI forecasting',
      href: '/pricing',
      color: 'bg-purple-500'
    },
    {
      name: 'Demand Forecast',
      description: 'Predict occupancy and demand using statistical methods and ML models',
      href: '/forecast',
      color: 'bg-orange-500'
    }
  ]

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">Hospitality AI SDK</h1>
          <p className="text-xl text-gray-600">
            Cost-effective AI solutions for hospitality management
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Mix of LLMs, traditional algorithms, and local-first approaches
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.name}
              href={feature.href}
              className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-l-4"
              style={{ borderLeftColor: feature.color.replace('bg-', '') }}
            >
              <div className="flex items-start">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-white font-bold text-xl mr-4`}>
                  {feature.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2 text-gray-900">
                    {feature.name}
                  </h2>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Built with Next.js, TypeScript, and Vercel AI SDK</p>
          <p className="mt-2">Focus on sustainability and cost reduction</p>
        </footer>
      </div>
    </main>
  )
}
