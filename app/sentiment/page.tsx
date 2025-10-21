'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { analyzeTraditional, SentimentResult } from '@/lib/sentiment/traditional';
import { analyzeBrowserML } from '@/lib/sentiment/ml-browser';
import { analyzeHybrid, HybridAnalysisResult } from '@/lib/sentiment/hybrid';

type AlgorithmType = 'traditional' | 'browser-ml' | 'hybrid';

export default function SentimentPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<HybridAnalysisResult | SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('traditional');

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
      let analysis;
      switch (selectedAlgorithm) {
        case 'traditional':
          analysis = analyzeTraditional(text);
          break;
        case 'browser-ml':
          analysis = await analyzeBrowserML(text);
          break;
        case 'hybrid':
          analysis = await analyzeHybrid(text);
          break;
      }
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    switch (algo) {
      case 'traditional':
        return { cost: '$0', latency: '~5ms', accuracy: '72%', description: 'Keyword-based analysis' };
      case 'browser-ml':
        return { cost: '$0', latency: '~50ms', accuracy: '75%', description: 'Browser-based ML model' };
      case 'hybrid':
        return { cost: '$0-0.50/1K', latency: '~180ms avg', accuracy: '84%', description: 'Smart escalation' };
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'negative': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <Navigation title="Sentiment Analysis" />

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Analyze guest reviews using different algorithms - compare traditional, ML, and hybrid approaches
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Algorithm</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['traditional', 'browser-ml', 'hybrid'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              return (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgorithm(algo)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlgorithm === algo
                      ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 capitalize mb-2">
                    {algo.replace('-', ' ')}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>Cost:</strong> {info.cost}</div>
                    <div><strong>Latency:</strong> {info.latency}</div>
                    <div><strong>Accuracy:</strong> {info.accuracy}</div>
                    <div className="text-gray-500 dark:text-gray-500 mt-2">{info.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Guest Review or Feedback
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              placeholder="Enter guest review or feedback here..."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 dark:hover:bg-brand-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>

          <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Try examples:</p>
            <div className="grid grid-cols-1 gap-2">
              {examples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setText(example)}
                  className="text-left text-sm text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 hover:bg-blue-50 dark:hover:bg-gray-700 p-2 rounded"
                >
                  {example.substring(0, 80)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Analysis Result</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sentiment</p>
                <p className={`text-2xl font-bold px-3 py-1 rounded inline-block ${getSentimentColor(result.sentiment)}`}>
                  {result.sentiment.toUpperCase()}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {result.score.toFixed(2)}
                  <span className="text-sm text-gray-500 dark:text-gray-500 ml-2">(-1 to 1)</span>
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Processing Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {result.processingTime}ms
                </p>
              </div>
            </div>

            {'usedAI' in result && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Method Used</p>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  result.usedAI ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }`}>
                  {result.usedAI ? 'AI-Powered' : 'Traditional (Cost-Effective)'}
                </span>
              </div>
            )}

            {result.keywords && result.keywords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Keywords Detected</p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((keyword, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-brand-900 dark:text-brand-300 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {'traditionalResult' in result && result.traditionalResult && (
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Traditional analysis would have given: <strong className="text-gray-900 dark:text-gray-100">{result.traditionalResult.sentiment}</strong> (confidence: {(result.traditionalResult.confidence * 100).toFixed(0)}%)
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="text-brand-600 dark:text-brand-400 mr-2">1.</span>
              <span><strong>Traditional First:</strong> Quick keyword-based analysis (no API costs)</span>
            </li>
            <li className="flex items-start">
              <span className="text-brand-600 dark:text-brand-400 mr-2">2.</span>
              <span><strong>Smart Escalation:</strong> Only use AI for complex/ambiguous cases</span>
            </li>
            <li className="flex items-start">
              <span className="text-brand-600 dark:text-brand-400 mr-2">3.</span>
              <span><strong>Cost Effective:</strong> ~70% of reviews handled by traditional method</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
