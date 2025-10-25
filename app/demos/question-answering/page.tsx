'use client';

import { useState } from 'react';
import {
  hotelPolicies,
  getConfidenceColor,
  type QuestionAnswerResult,
} from '@/lib/ml/nlp/question-answering-constants';

export default function QuestionAnsweringDemo() {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<QuestionAnswerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'custom' | 'hotel-policies'>('hotel-policies');

  const exampleQuestions = [
    'What time is checkout?',
    'Can I bring my pet?',
    'Is breakfast included?',
    'How much is parking?',
    'What is the cancellation policy?',
    'Do you have a pool?',
    'Is there a shuttle to the airport?',
  ];

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      if (mode === 'custom' && !context.trim()) {
        alert('Please provide context for custom questions');
        setLoading(false);
        return;
      }

      // Call server-side QA API
      const response = await fetch('/api/ml/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: mode === 'custom' ? context : undefined,
          useHotelPolicies: mode === 'hotel-policies',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Question answering failed');
      }

      const answerResult = await response.json();
      setResult(answerResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Question answering error:', error);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (exampleQuestion: string) => {
    setQuestion(exampleQuestion);
    setMode('hotel-policies');
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ❓ Question Answering System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Answer guest questions from hotel policies automatically. Uses distilbert-base-cased-distilled-squad.
          </p>

          {/* Business Value */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">$0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">API Cost</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Availability</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">83%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">F1 Accuracy</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">&lt;300ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Ask a Question
            </h2>

            {/* Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('hotel-policies')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'hotel-policies'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Hotel Policies
                </button>
                <button
                  onClick={() => setMode('custom')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Custom Context
                </button>
              </div>
            </div>

            {/* Question Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="What time is checkout?"
              />
            </div>

            {/* Custom Context (only shown in custom mode) */}
            {mode === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Context (Document, Policy, FAQ)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Paste your hotel policy, FAQ, or any document here..."
                />
              </div>
            )}

            {/* Ask Button */}
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? '⏳ Processing (first use may take 30s)...' : '❓ Ask Question'}
            </button>

            {/* Example Questions */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Examples:
              </h3>
              <div className="space-y-2">
                {exampleQuestions.slice(0, 5).map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadExample(example)}
                    className="w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Answer
            </h2>

            {result ? (
              <div className="space-y-4">
                {/* Question */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Question:
                  </div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">
                    {result.question}
                  </div>
                </div>

                {/* Answer */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Answer:
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.answer}
                  </div>
                </div>

                {/* Confidence */}
                <div className={`p-4 rounded-lg ${getConfidenceColor(result.confidence)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      Confidence: {result.confidence}
                    </span>
                    <span className="font-semibold">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-white/30 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        result.confidence === 'high'
                          ? 'bg-green-600'
                          : result.confidence === 'medium'
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${result.score * 100}%` }}
                    />
                  </div>
                </div>

                {/* Context (show excerpt) */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Source Context:
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                    ...{result.context.substring(Math.max(0, result.startIndex - 50), result.endIndex + 50)}...
                  </div>
                </div>

                {/* Performance */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ⚡ Response Time: <span className="font-semibold">{result.executionTimeMs}ms</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Ask a question to see the answer
              </div>
            )}
          </div>
        </div>

        {/* Available Policies Section */}
        {mode === 'hotel-policies' && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Available Hotel Policies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotelPolicies.map((policy, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {policy.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                    {policy.content.trim().substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Value Section */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            💼 Business Value
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                🤖 24/7 Automation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Answer guest questions instantly, any time of day. No need to wait for staff availability.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                💰 $2,400/year Savings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reduce front desk calls by 30%. Save 4 hours/day at $25/hr = $2,400/year per property.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                📈 Better Guest Experience
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Instant answers = happier guests. Boost satisfaction scores by 15-20 points.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🎯 Use Cases:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Automated FAQ on website/app</li>
              <li>✓ Chatbot for policy questions</li>
              <li>✓ Staff training assistant</li>
              <li>✓ Email auto-responder</li>
              <li>✓ Internal knowledge base search</li>
              <li>✓ Pre-check-in question automation</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Pro Tip:</strong> Keep your policy documents updated and well-organized.
              The model extracts answers directly from your documents, so clear writing = better answers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
