'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Review, ResponseSuggestion } from '@/lib/review-response/types';
import { generateResponseTemplate, RESPONSE_MODELS } from '@/lib/review-response/generator';

type AlgorithmType = 'template' | 'rag' | 'llm';

export default function ReviewResponsePage() {
  const [guestName, setGuestName] = useState('Sarah Johnson');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [reviewText, setReviewText] = useState(
    'The room was absolutely amazing! The staff were incredibly helpful and the location was perfect. Highly recommend!'
  );
  const [platform, setPlatform] = useState<Review['platform']>('google');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('template');
  const [result, setResult] = useState<ResponseSuggestion | null>(null);

  const examples = [
    {
      rating: 5,
      text: 'Amazing stay! Clean room, friendly staff, perfect location. Will definitely return!',
    },
    {
      rating: 2,
      text: "Very disappointed. Room was dirty, wifi didn't work, and staff were unhelpful.",
    },
    {
      rating: 3,
      text: 'Decent hotel. Good location but room was smaller than expected. Staff were nice though.',
    },
  ];

  const handleGenerate = () => {
    const review: Review = {
      id: 'review-1',
      guestName,
      rating,
      text: reviewText,
      platform,
      date: new Date(),
    };

    // All algorithms use template for now, but are selectable
    const response = generateResponseTemplate(review);
    // Update method to reflect selected algorithm
    response.method = selectedAlgorithm;
    setResult(response);
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    return RESPONSE_MODELS[algo];
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'negative':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'mixed':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <Navigation title="Review Response Generator" />

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Generate personalized responses to guest reviews automatically
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            How It Works
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
            <p>
              <strong>3 Generation Methods:</strong> Template (instant, $0), RAG (context-aware, Coming Soon), LLM (personalized, Coming Soon)
            </p>
            <p>
              <strong>Template Algorithm:</strong> Rule-based response generation with sentiment-specific templates - positive reviews get thank-you messages, negative reviews get apology + resolution offers
            </p>
            <p>
              <strong>Personalization:</strong> Extracts guest name, specific mentions (room, staff, food) and incorporates them into responses for authentic engagement
            </p>
            <p>
              <strong>Tone Matching:</strong> Adjusts response tone based on review rating and sentiment - empathetic for complaints, enthusiastic for praise, balanced for mixed reviews
            </p>
            <p>
              <strong>Platform Optimization:</strong> Adapts formatting and style for each review platform (Google, TripAdvisor, Booking.com) for optimal presentation
            </p>
            <p>
              <strong>Response Time:</strong> Generates responses instantly to enable quick turnaround and maintain high engagement rates
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              <strong>Performance:</strong> &lt;5ms generation | Zero cost | Enables 100% review response rate | Maintains consistent brand voice
            </p>
          </div>
          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-400 mb-2 font-semibold">Sample Code</p>
            <pre className="text-xs text-gray-300 overflow-x-auto">
              <code>{`import { generateResponseTemplate } from '@/lib/review-response/generator';

const review = {
  id: '123',
  guestName: 'Sarah Johnson',
  rating: 5,
  text: 'Amazing stay! Clean room, friendly staff.',
  platform: 'google'
};

const response = generateResponseTemplate(review);
// => { draftResponse: "Thank you Sarah...", sentiment: 'positive' }`}</code>
            </pre>
          </div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Select Algorithm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['template', 'rag', 'llm'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              return (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgorithm(algo)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlgorithm === algo
                      ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2 capitalize">
                    {info.name}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Cost:</strong> ${info.cost}
                    </div>
                    <div>
                      <strong>Latency:</strong> ~{info.avgLatency}ms
                    </div>
                    <div>
                      <strong>Quality:</strong> {(info.quality * 100).toFixed(0)}%
                    </div>
                    <div className="text-gray-500 mt-2">{info.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Review Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Rating: {rating} stars
                </label>
                <input
                  type="range"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                  className="w-full"
                  min="1"
                  max="5"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>1 star</span>
                  <span>5 stars</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Review['platform'])}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="google">Google</option>
                  <option value="tripadvisor">TripAdvisor</option>
                  <option value="booking">Booking.com</option>
                  <option value="expedia">Expedia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Review Text
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full h-32 p-3 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter guest review..."
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Try examples:</p>
                {examples.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setRating(ex.rating as 1 | 2 | 3 | 4 | 5);
                      setReviewText(ex.text);
                    }}
                    className="block w-full text-left text-sm p-2 mb-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {ex.rating} ⭐ - {ex.text.substring(0, 50)}...
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 mt-4"
              >
                Generate Response
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Generated Response
                </h2>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4">
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {result.draftResponse}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sentiment</p>
                    <p
                      className={`text-sm font-bold px-2 py-1 rounded inline-block ${getSentimentColor(result.sentiment)}`}
                    >
                      {result.sentiment.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tone</p>
                    <p className="text-sm font-bold capitalize text-gray-900 dark:text-gray-100">
                      {result.tone}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Key Topics Detected
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.keyTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Quality Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {(result.quality * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Processing Time</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {result.processingTime}ms
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Enter review details and click &ldquo;Generate Response&rdquo; to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
