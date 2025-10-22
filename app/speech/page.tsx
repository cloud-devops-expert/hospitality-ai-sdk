'use client';

import { useState } from 'react';
import {
  analyzeSentiment,
  classifyComplaint,
  detectBookingIntent,
  analyzeCall,
  type CallTranscription,
} from '@/lib/speech/analyzer';

export default function SpeechPage() {
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeTranscription = () => {
    const transcription: CallTranscription = {
      callId: 'CALL-12345',
      transcript: "Hi, I'd like to book a room for 2 people next weekend. Also, the wifi in my current room is not working properly. Can you help?",
      duration: 180,
      timestamp: new Date(),
      language: 'en',
      speakerCount: 2,
    };

    const sentiment = analyzeSentiment(transcription);
    const complaint = classifyComplaint(transcription);
    const intent = detectBookingIntent(transcription);
    const callAnalysis = analyzeCall(transcription);

    setAnalysis({ sentiment, complaint, intent, callAnalysis });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🎤 Voice & Speech Analysis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Call transcription analysis and sentiment tracking
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Sample Transcription
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4">
            <p className="text-gray-700 dark:text-gray-300 italic">
              "Hi, I'd like to book a room for 2 people next weekend. Also, the wifi in my current room is not working properly. Can you help?"
            </p>
          </div>
          <button
            onClick={analyzeTranscription}
            className="w-full px-6 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold text-lg"
          >
            🔍 Analyze Transcription
          </button>
        </div>

        {analysis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-lg shadow p-6 ${
                analysis.sentiment.sentiment === 'positive' 
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : analysis.sentiment.sentiment === 'negative'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-gray-50 dark:bg-gray-900'
              }`}>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sentiment</div>
                <div className="text-3xl font-bold capitalize mb-2">
                  {analysis.sentiment.sentiment}
                </div>
                <div className="text-sm">Score: {analysis.sentiment.score}/10</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Booking Intent</div>
                <div className="text-3xl font-bold">
                  {analysis.intent.isBookingInquiry ? 'Yes' : 'No'}
                </div>
                {analysis.intent.isBookingInquiry && (
                  <div className="text-sm mt-2">
                    Confidence: {(analysis.intent.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Complaint</div>
                <div className="text-3xl font-bold">
                  {analysis.complaint.isComplaint ? 'Yes' : 'No'}
                </div>
                {analysis.complaint.isComplaint && (
                  <div className="text-sm mt-2">
                    Severity: {analysis.complaint.severity}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Call Analysis Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Emotional Tone</h3>
                  <p className="capitalize">{analysis.callAnalysis.emotionalTone}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Call Quality</h3>
                  <p>{analysis.callAnalysis.callQuality}/10</p>
                </div>
                {analysis.intent.extractedInfo.guestCount && (
                  <div>
                    <h3 className="font-semibold mb-2">Guest Count</h3>
                    <p>{analysis.intent.extractedInfo.guestCount} people</p>
                  </div>
                )}
                {analysis.complaint.isComplaint && (
                  <div>
                    <h3 className="font-semibold mb-2">Complaint Category</h3>
                    <p className="capitalize">{analysis.complaint.category}</p>
                  </div>
                )}
              </div>
            </div>

            {analysis.callAnalysis.actionItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Action Items
                </h2>
                <ul className="space-y-2">
                  {analysis.callAnalysis.actionItems.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500">→</span>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
