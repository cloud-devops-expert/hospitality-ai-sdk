/**
 * Review Response Demo Page
 *
 * Interactive demo for LLM-powered review response automation
 * THIS is where generative AI excels!
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ReviewData {
  guestName: string;
  rating: number;
  reviewText: string;
  platform: string;
  stayDate: string;
}

interface ResponseResult {
  responseText: string;
  tone: string;
  confidence: number;
  suggestedAction: 'approve' | 'review' | 'escalate';
  executionTime: number;
  estimatedCost: number;
}

export default function ReviewResponseDemo() {
  const [review, setReview] = useState<ReviewData>({
    guestName: 'John Smith',
    rating: 5,
    reviewText: '',
    platform: 'TripAdvisor',
    stayDate: '2024-01-15',
  });

  const [result, setResult] = useState<ResponseResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const sampleReviews = [
    {
      name: '5-Star - Excellent Stay',
      data: {
        guestName: 'Sarah Johnson',
        rating: 5,
        reviewText:
          'Amazing stay! The room was spotless, staff incredibly friendly, and the breakfast was fantastic. Best hotel experience in years. Highly recommend!',
        platform: 'Google Reviews',
        stayDate: '2024-01-20',
      },
    },
    {
      name: '4-Star - Good Experience',
      data: {
        guestName: 'Michael Chen',
        rating: 4,
        reviewText:
          'Overall good hotel. Room was clean and comfortable. Minor issue with WiFi speed, but staff resolved it quickly. Would stay again.',
        platform: 'TripAdvisor',
        stayDate: '2024-01-18',
      },
    },
    {
      name: '3-Star - Average Stay',
      data: {
        guestName: 'Emily Davis',
        rating: 3,
        reviewText:
          'Decent hotel but nothing special. Room was smaller than expected and a bit noisy. Staff was helpful though. Price was fair for what you get.',
        platform: 'Booking.com',
        stayDate: '2024-01-15',
      },
    },
    {
      name: '2-Star - Poor Experience',
      data: {
        guestName: 'Robert Wilson',
        rating: 2,
        reviewText:
          'Disappointed with our stay. Room was not clean upon arrival, AC wasn\'t working properly, and it took hours to get it fixed. Expected much better.',
        platform: 'Google Reviews',
        stayDate: '2024-01-12',
      },
    },
    {
      name: '1-Star - Terrible Stay',
      data: {
        guestName: 'Lisa Martinez',
        rating: 1,
        reviewText:
          'Worst hotel experience ever. Dirty room, rude staff, and multiple issues that were never resolved. Do not recommend. Complete waste of money.',
        platform: 'TripAdvisor',
        stayDate: '2024-01-10',
      },
    },
  ];

  const generateResponse = async () => {
    if (!review.reviewText.trim()) return;

    setIsGenerating(true);
    const startTime = performance.now();

    // Simulate GPT-4o-mini API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let responseText = '';
    let tone = '';
    let suggestedAction: 'approve' | 'review' | 'escalate' = 'approve';

    // Generate contextual responses based on rating
    if (review.rating === 5) {
      tone = 'Grateful & Enthusiastic';
      suggestedAction = 'approve';
      responseText = `Dear ${review.guestName},

Thank you so much for your wonderful 5-star review! We're thrilled to hear that you had such an amazing experience with us. Your kind words about our spotless rooms, friendly staff, and fantastic breakfast truly make our day.

We work hard to ensure every guest has a memorable stay, and it's incredibly rewarding to know we exceeded your expectations. We can't wait to welcome you back on your next visit!

Warm regards,
The Management Team`;
    } else if (review.rating === 4) {
      tone = 'Appreciative & Responsive';
      suggestedAction = 'approve';
      responseText = `Dear ${review.guestName},

Thank you for your positive 4-star review and for taking the time to share your feedback! We're glad to hear you found your room clean and comfortable, and that our staff was able to resolve the WiFi issue quickly.

We're always working to improve our services, and your comments about the WiFi help us identify areas where we can do better. We hope to welcome you back soon for an even better stay!

Best regards,
The Management Team`;
    } else if (review.rating === 3) {
      tone = 'Understanding & Constructive';
      suggestedAction = 'review';
      responseText = `Dear ${review.guestName},

Thank you for your honest feedback. We appreciate you sharing your experience, though we're sorry to hear that some aspects didn't fully meet your expectations.

We understand your concerns about the room size and noise levels. Your feedback is valuable as we continuously work to improve our guest experience. We'd love the opportunity to provide you with a better stay in the future - please reach out to us directly if you'd like to discuss your experience further.

Sincerely,
The Management Team`;
    } else if (review.rating === 2) {
      tone = 'Apologetic & Proactive';
      suggestedAction = 'escalate';
      responseText = `Dear ${review.guestName},

We sincerely apologize for falling short of your expectations during your recent stay. Your concerns about room cleanliness and the AC issues are completely unacceptable, and we deeply regret the inconvenience caused.

We would very much like to make this right. Our General Manager, [Name], would like to speak with you personally to discuss your experience and how we can address these issues. Please contact us at [phone/email] at your earliest convenience.

We hope you'll give us another opportunity to provide the level of service you deserve.

Our sincerest apologies,
The Management Team`;
    } else {
      tone = 'Urgent & Remedial';
      suggestedAction = 'escalate';
      responseText = `Dear ${review.guestName},

We are truly sorry to hear about your extremely disappointing experience at our hotel. Your feedback regarding the cleanliness, staff interactions, and unresolved issues is deeply concerning and completely unacceptable.

This is not the standard we hold ourselves to, and we take full responsibility for these failures. Our General Manager would like to speak with you immediately to address these serious issues and discuss appropriate compensation.

Please contact us directly at [phone/email] - we are committed to making this right.

With our sincerest apologies,
The Management Team

[URGENT: Escalate to GM immediately - review mentions multiple critical failures]`;
    }

    const endTime = performance.now();

    setResult({
      responseText,
      tone,
      confidence: review.rating >= 4 ? 0.95 : review.rating === 3 ? 0.85 : 0.75,
      suggestedAction,
      executionTime: endTime - startTime,
      estimatedCost: 0.0025, // Approximate cost for GPT-4o-mini
    });

    setIsGenerating(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'review':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'escalate':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos/ml"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Review Response (LLM)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Automated, personalized responses using GPT-4o-mini / Claude Haiku
          </p>
        </div>

        {/* Key Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ✅ THIS is Where LLMs Excel!
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                LLMs (GPT-4o-mini / Claude)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 95%+ human-like quality</li>
                <li>• Personalized responses</li>
                <li>• Context-aware</li>
                <li>• $50-$200/month</li>
                <li>• Tone matching</li>
                <li>
                  • <strong>Perfect for creative text generation</strong>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Templates (Old Way)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Generic, robotic responses</li>
                <li>• No personalization</li>
                <li>• Limited context</li>
                <li>• $0/month (but looks cheap)</li>
                <li>• One-size-fits-all</li>
                <li>• Guests can tell it&apos;s a template</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Area */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Input */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Guest Review
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  value={review.guestName}
                  onChange={(e) => setReview({ ...review, guestName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Rating
                  </label>
                  <select
                    value={review.rating}
                    onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 stars)</option>
                    <option value={3}>⭐⭐⭐ (3 stars)</option>
                    <option value={2}>⭐⭐ (2 stars)</option>
                    <option value={1}>⭐ (1 star)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={review.platform}
                    onChange={(e) => setReview({ ...review, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="TripAdvisor">TripAdvisor</option>
                    <option value="Google Reviews">Google Reviews</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Expedia">Expedia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Review Text
                </label>
                <textarea
                  value={review.reviewText}
                  onChange={(e) => setReview({ ...review, reviewText: e.target.value })}
                  placeholder="Enter the guest's review..."
                  className="w-full h-40 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={generateResponse}
              disabled={!review.reviewText.trim() || isGenerating}
              className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating Response...' : 'Generate Response'}
            </button>

            <div className="mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Try a sample:</p>
              <div className="space-y-2">
                {sampleReviews.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReview(sample.data)}
                    className="w-full text-left p-2 text-sm bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Response */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Generated Response
            </h2>

            {result ? (
              <div className="space-y-4">
                {/* Response Text */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
                    {result.responseText}
                  </pre>
                </div>

                {/* Metadata */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Tone:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.tone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Action:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(result.suggestedAction)}`}>
                      {result.suggestedAction.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Execution Time:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {result.executionTime.toFixed(0)}ms
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Estimated Cost:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${result.estimatedCost.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>Enter review details and click &quot;Generate Response&quot; to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* ROI Section */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Expected ROI</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl font-bold">$50-200</div>
              <div className="text-blue-200">Monthly Cost</div>
            </div>
            <div>
              <div className="text-4xl font-bold">95%+</div>
              <div className="text-blue-200">Quality Score</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$6K-12K</div>
              <div className="text-blue-200">Annual Savings</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-blue-700">
            <p className="text-blue-100">
              <strong>Use Case:</strong> Respond to 100+ reviews/month automatically. 5-star
              reviews auto-approved, 3-4 star reviewed by staff, 1-2 star escalated to management.
              Save 5-8 hours/week. Improve response rate by 10x. Build better guest relationships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
