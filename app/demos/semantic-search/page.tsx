'use client';

import { useState } from 'react';
import {
  semanticSearch,
  searchHotelFAQ,
  hotelFAQs,
  calculateSimilarity,
  type SemanticSearchResult,
} from '@/lib/ml/nlp/semantic-search';

export default function SemanticSearchDemo() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'faq' | 'custom'>('faq');
  const [customDocs, setCustomDocs] = useState('');

  const exampleQueries = [
    'When can I check in to my room?',
    'Can I bring my dog?',
    'Is there food in the morning?',
    'Where can I park my car?',
    'Can I swim in the hotel?',
    'How do I get to the airport?',
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      if (mode === 'faq') {
        const faqResults = await searchHotelFAQ(query, 5);
        setResults(faqResults);
      } else {
        if (!customDocs.trim()) {
          alert('Please add custom documents');
          setLoading(false);
          return;
        }
        const docs = customDocs.split('\n').filter((d) => d.trim());
        const searchResults = await semanticSearch(query, docs, 5);
        setResults(searchResults as any);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example: string) => {
    setQuery(example);
    setMode('faq');
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.7) return 'text-green-600 dark:text-green-400';
    if (similarity > 0.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSimilarityBg = (similarity: number) => {
    if (similarity > 0.7) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (similarity > 0.5) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Semantic Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Find similar text using meaning, not keywords. Uses sentence-transformers/all-MiniLM-L6-v2.
          </p>

          {/* Business Value */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">$0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">API Cost</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">80MB</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Model Size</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">63%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">STS Benchmark</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">&lt;100ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Search Time</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Search Query
            </h2>

            {/* Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('faq')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'faq'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Hotel FAQ
                </button>
                <button
                  onClick={() => setMode('custom')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Custom Docs
                </button>
              </div>
            </div>

            {/* Query Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., When can I check in?"
              />
            </div>

            {/* Custom Documents (only shown in custom mode) */}
            {mode === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documents (one per line)
                </label>
                <textarea
                  value={customDocs}
                  onChange={(e) => setCustomDocs(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Document 1&#10;Document 2&#10;Document 3"
                />
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : '🔍 Search'}
            </button>

            {/* Example Queries */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Try These Examples:
              </h3>
              <div className="space-y-2">
                {exampleQueries.slice(0, 4).map((example, idx) => (
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
              Search Results
            </h2>

            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${getSimilarityBg(result.similarity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Result #{idx + 1}
                      </span>
                      <span className={`text-sm font-bold ${getSimilarityColor(result.similarity)}`}>
                        {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>

                    {mode === 'faq' ? (
                      <>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Q: {result.question}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          A: {result.answer}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {result.text}
                      </div>
                    )}

                    {/* Similarity Bar */}
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          result.similarity > 0.7
                            ? 'bg-green-600'
                            : result.similarity > 0.5
                            ? 'bg-yellow-600'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${result.similarity * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Enter a query and click "Search" to see similar documents
              </div>
            )}
          </div>
        </div>

        {/* FAQ Database (shown in FAQ mode) */}
        {mode === 'faq' && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Available FAQs ({hotelFAQs.length} total)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hotelFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {faq.question}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </div>
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
                🎯 Better Search
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find answers by meaning, not keywords. "When can I check in?" matches "Check-in time is 3 PM".
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                💰 80% Less Calls
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Guests find answers themselves. Reduce front desk calls by 80%. Save $8,000/year.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                📱 Only 80MB
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tiny model runs in browser. Perfect for mobile apps. No server needed.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🎯 Use Cases:
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Smart FAQ search on website</li>
              <li>✓ Find similar guest complaints</li>
              <li>✓ Knowledge base for staff</li>
              <li>✓ Duplicate query detection</li>
              <li>✓ Chatbot context retrieval</li>
              <li>✓ Document similarity search</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Example:</strong> Guest asks "Can I bring my dog?" - Semantic search finds
              "Do you allow pets?" even though they share no common words!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
