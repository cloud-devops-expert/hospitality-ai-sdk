'use client';

import { useState } from 'react';
import Link from 'next/link';
import { analyzeHybrid, HybridAnalysisResult } from '@/lib/sentiment/hybrid';

export default function SentimentPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<HybridAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [forceAI, setForceAI] = useState(false);

  const examples = [
    "The room was absolutely amazing! Clean, comfortable, and the staff were incredibly helpful. Would definitely recommend!",
    "Terrible experience. The room was dirty, noisy, and overpriced. Very disappointing stay.",
    "The location was convenient and check-in was smooth. Room was okay, nothing special.",
    "I had mixed feelings about my stay. The view was beautiful but the bed was uncomfortable and WiFi kept dropping."
  ];

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const analysis = await analyzeHybrid(text, forceAI);
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Home
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Sentiment Analysis</h1>
          <p className="text-gray-600">
            Analyze guest reviews using hybrid approach: traditional keyword analysis + optional AI
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guest Review or Feedback
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter guest review or feedback here..."
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={forceAI}
                onChange={(e) => setForceAI(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Force AI analysis (requires API key)</span>
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>

          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Try examples:</p>
            <div className="grid grid-cols-1 gap-2">
              {examples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setText(example)}
                  className="text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded"
                >
                  {example.substring(0, 80)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Analysis Result</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Sentiment</p>
                <p className={`text-2xl font-bold px-3 py-1 rounded inline-block ${getSentimentColor(result.sentiment)}`}>
                  {result.sentiment.toUpperCase()}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.score.toFixed(2)}
                  <span className="text-sm text-gray-500 ml-2">(-1 to 1)</span>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {result.processingTime}ms
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Method Used</p>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                result.usedAI ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
              }`}>
                {result.usedAI ? 'AI-Powered' : 'Traditional (Cost-Effective)'}
              </span>
            </div>

            {result.keywords && result.keywords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Keywords Detected</p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((keyword, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.traditionalResult && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Traditional analysis would have given: <strong>{result.traditionalResult.sentiment}</strong> (confidence: {(result.traditionalResult.confidence * 100).toFixed(0)}%)
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">1.</span>
              <span><strong>Traditional First:</strong> Quick keyword-based analysis (no API costs)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">2.</span>
              <span><strong>Smart Escalation:</strong> Only use AI for complex/ambiguous cases</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">3.</span>
              <span><strong>Cost Effective:</strong> ~70% of reviews handled by traditional method</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
