'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import {
  GuestProfile,
  UpsellResult,
  recommendUpsellsRuleBased,
  UPSELL_MODELS,
} from '@/lib/upsell/recommender';

type AlgorithmType = 'rule-based' | 'collaborative' | 'neural';

export default function UpsellPage() {
  const [guestType, setGuestType] = useState<GuestProfile['type']>('business');
  const [occasion, setOccasion] = useState<GuestProfile['occasion']>('none');
  const [budget, setBudget] = useState<GuestProfile['budget']>('mid-range');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('rule-based');
  const [result, setResult] = useState<UpsellResult | null>(null);

  const handleRecommend = () => {
    const profile: GuestProfile = {
      id: 'guest-1',
      type: guestType,
      occasion,
      budget,
      previousPurchases: [],
    };

    const recommendations = recommendUpsellsRuleBased(profile);
    setResult(recommendations);
  };

  const getAlgorithmInfo = (algo: AlgorithmType) => {
    return UPSELL_MODELS[algo];
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-pink-50 to-rose-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <Navigation title="Upsell Recommendations" />

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Generate personalized upsell offers to increase revenue per booking
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            How It Works
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
            <p>
              <strong>3 Recommendation Methods:</strong> Rule-Based (12% conversion, $0), Collaborative Filtering (Coming Soon), Neural Network (Coming Soon)
            </p>
            <p>
              <strong>Rule-Based Algorithm:</strong> Segment-specific recommendations using decision rules - Business travelers → late checkout + breakfast, Romance → champagne + spa, Families → extra bed + kid activities
            </p>
            <p>
              <strong>Budget-Aware Matching:</strong> Filters recommendations by guest budget tier (economy, mid-range, luxury) to avoid showing inappropriate offers
            </p>
            <p>
              <strong>Occasion Targeting:</strong> Special handling for anniversaries, birthdays, honeymoons with premium romantic packages
            </p>
            <p>
              <strong>Priority Scoring:</strong> Ranks recommendations by conversion likelihood and revenue potential - highest value offers shown first
            </p>
            <p>
              <strong>Revenue Impact:</strong> Typical upsell increases booking value by 15-25% through strategic add-on offerings
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              <strong>Performance:</strong> &lt;10ms generation time | 12% conversion rate | Zero cost | +20% average revenue per booking
            </p>
          </div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Select Algorithm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['rule-based', 'collaborative', 'neural'] as const).map((algo) => {
              const info = getAlgorithmInfo(algo);
              const isAvailable = algo === 'rule-based';
              return (
                <button
                  key={algo}
                  onClick={() => isAvailable && setSelectedAlgorithm(algo)}
                  disabled={!isAvailable}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAlgorithm === algo
                      ? 'border-brand-600 dark:border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                      : isAvailable
                        ? 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                        : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {info.name}
                    {!isAvailable && (
                      <span className="ml-2 text-xs text-gray-500">(Coming Soon)</span>
                    )}
                  </div>
                  <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                    <div>
                      <strong>Cost:</strong> ${info.cost}
                    </div>
                    <div>
                      <strong>Latency:</strong> ~{info.avgLatency}ms
                    </div>
                    <div>
                      <strong>Conversion:</strong> {(info.conversion * 100).toFixed(0)}%
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
              Guest Profile
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Guest Type
                </label>
                <select
                  value={guestType}
                  onChange={(e) => setGuestType(e.target.value as GuestProfile['type'])}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="business">Business Traveler</option>
                  <option value="leisure">Leisure</option>
                  <option value="family">Family</option>
                  <option value="couple">Couple</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Special Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value as GuestProfile['occasion'])}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="none">None</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="birthday">Birthday</option>
                  <option value="honeymoon">Honeymoon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Budget Level
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as GuestProfile['budget'])}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="economy">Economy</option>
                  <option value="mid-range">Mid-Range</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              <button
                onClick={handleRecommend}
                className="w-full bg-brand-600 dark:bg-brand-500 text-white py-2 px-4 rounded-lg hover:bg-brand-700 mt-4"
              >
                Generate Recommendations
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {result && result.recommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Recommended Offers
                </h2>

                <div className="space-y-4">
                  {result.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {rec.offer.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {rec.offer.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                            ${rec.offer.price}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {rec.reason}
                        </span>
                        <span className="text-xs bg-green-600 dark:bg-green-700 text-white px-2 py-1 rounded">
                          {(rec.expectedConversion * 100).toFixed(0)}% conversion
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Expected Revenue:</strong> $
                    {result.recommendations
                      .reduce((sum, r) => sum + r.offer.price * r.expectedConversion, 0)
                      .toFixed(2)}{' '}
                    per booking
                  </p>
                </div>
              </div>
            )}

            {!result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Configure guest profile and click &ldquo;Generate Recommendations&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
