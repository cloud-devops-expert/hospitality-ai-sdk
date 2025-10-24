/**
 * Speech Transcription Demo (Whisper)
 *
 * Transcribe audio to text using OpenAI's Whisper model (99 languages, free!)
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
  executionTime: number;
  modelUsed: string;
  wordCount: number;
}

export default function SpeechTranscriptionDemo() {
  const [selectedModel, setSelectedModel] = useState<string>('medium');
  const [selectedScenario, setSelectedScenario] = useState<string>('call-center');
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const models = [
    { id: 'tiny', name: 'Tiny', size: '39M', speed: '32x', use: 'Real-time, mobile' },
    { id: 'base', name: 'Base', size: '74M', speed: '16x', use: 'Fast transcription' },
    { id: 'small', name: 'Small', size: '244M', speed: '6x', use: 'Balanced' },
    { id: 'medium', name: 'Medium', size: '769M', speed: '2x', use: 'Production (recommended)' },
    { id: 'large', name: 'Large v3', size: '1.5B', speed: '1x', use: 'Highest accuracy' },
  ];

  const scenarios = [
    {
      id: 'call-center',
      name: 'Call Center',
      icon: '📞',
      audio: 'Guest complaint call',
      language: 'English',
      duration: 45,
    },
    {
      id: 'voice-note',
      name: 'Voice Note',
      icon: '🎙️',
      audio: 'Housekeeping voice report',
      language: 'English',
      duration: 30,
    },
    {
      id: 'medical',
      name: 'Medical Note',
      icon: '🏥',
      audio: 'Doctor patient note',
      language: 'English',
      duration: 60,
    },
    {
      id: 'multilingual',
      name: 'Multilingual',
      icon: '🌍',
      audio: 'Spanish guest inquiry',
      language: 'Spanish',
      duration: 35,
    },
  ];

  const sampleTranscriptions = {
    'call-center': {
      text: `Good afternoon, thank you for calling Grand Hotel. This is Sarah speaking. How may I assist you today?

Hi Sarah, this is room 305. I called about an hour ago regarding the air conditioning in my room. It's still not working properly, and the room is getting quite warm.

I sincerely apologize for the inconvenience, Mr. Chen. Let me check the status of your maintenance request right away. I see that our technician was scheduled to visit your room at 2 PM. It's currently 2:45 PM. Let me contact our maintenance department immediately to get an update for you.

Thank you, I appreciate that. We have a business meeting in the room at 4 PM, so it's quite urgent.

I completely understand the urgency. I'm going to personally ensure this gets resolved within the next 30 minutes. I'll have our head maintenance supervisor go to your room right away, and I'll also arrange to have some refreshments sent up to you complimentary while we resolve this. Would that be acceptable?

Yes, that would be great. Thank you for your help.

You're very welcome, Mr. Chen. You'll hear from us within 15 minutes. Is there anything else I can assist you with today?`,
      language: 'English (US)',
      confidence: 0.96,
    },
    'voice-note': {
      text: `This is Maria from housekeeping, time is 10:35 AM. Just finished cleaning room 204. Everything looks good. Changed all linens, restocked minibar, replaced toiletries. Guest left a note requesting extra pillows for tonight - I've made a note in the system and will bring them up after my lunch break at 2 PM.

Moving to room 206 next. This is a checkout room, so it'll need deep cleaning. Should take about 45 minutes. Will update again when that's done.`,
      language: 'English (US)',
      confidence: 0.94,
    },
    medical: {
      text: `Patient presents with mild dehydration following three days of gastrointestinal distress. Vital signs: blood pressure 118/76, heart rate 88 beats per minute, temperature 37.2 Celsius. Patient reports decreased oral intake due to nausea. Physical examination reveals dry mucous membranes, slightly decreased skin turgor.

Recommended treatment: intravenous fluid replacement, 1000 mL normal saline over two hours. Prescribing ondansetron 4 mg every 8 hours as needed for nausea. Patient advised to advance diet slowly, starting with clear liquids and progressing to bland foods as tolerated.

Follow-up appointment scheduled in 48 hours to reassess hydration status. Patient instructed to seek immediate medical attention if symptoms worsen or if unable to tolerate oral intake. Patient verbalized understanding of treatment plan and follow-up instructions.`,
      language: 'English (US)',
      confidence: 0.95,
    },
    multilingual: {
      text: `Hola, buenos días. Llamo desde la habitación trescientos doce. Tengo una pregunta sobre el desayuno. ¿A qué hora empieza el servicio de desayuno mañana? También quería saber si tienen opciones vegetarianas disponibles.

Mi esposa y yo somos vegetarianos y nos gustaría saber qué opciones tenemos. Además, ¿es posible reservar una mesa para dos personas a las ocho de la mañana?

Muchas gracias por su ayuda.

[Translation: Hello, good morning. I'm calling from room three hundred twelve. I have a question about breakfast. What time does breakfast service start tomorrow? I also wanted to know if you have vegetarian options available. My wife and I are vegetarians and we would like to know what options we have. Also, is it possible to reserve a table for two people at eight in the morning? Thank you very much for your help.]`,
      language: 'Spanish',
      confidence: 0.93,
    },
  };

  const transcribeAudio = async () => {
    setIsTranscribing(true);
    const startTime = performance.now();

    // Simulate Whisper processing
    const baseDelay = 1000;
    const modelMultiplier = {
      tiny: 0.3,
      base: 0.5,
      small: 0.8,
      medium: 1.5,
      large: 2.5,
    };

    await new Promise((resolve) =>
      setTimeout(resolve, baseDelay * modelMultiplier[selectedModel as keyof typeof modelMultiplier])
    );

    const scenario = scenarios.find((s) => s.id === selectedScenario)!;
    const transcription =
      sampleTranscriptions[selectedScenario as keyof typeof sampleTranscriptions];
    const endTime = performance.now();

    setResult({
      text: transcription.text,
      language: transcription.language,
      confidence: transcription.confidence,
      duration: scenario.duration,
      executionTime: endTime - startTime,
      modelUsed: `openai/whisper-${selectedModel}`,
      wordCount: transcription.text.split(/\s+/).length,
    });

    setIsTranscribing(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording
      setTimeout(() => {
        setIsRecording(false);
        transcribeAudio();
      }, 3000);
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
          <h1 className="text-4xl font-bold text-navy-900 dark:text-white mb-4">
            🎙️ Speech Transcription (Whisper)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Transcribe audio to text in 99 languages using OpenAI&apos;s Whisper (FREE!)
          </p>
        </div>

        {/* Key Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
            ✅ Why Whisper (FREE!)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">
                Whisper (Open Source)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 95-98% accuracy (WER 2-5%)</li>
                <li>• 99 languages supported</li>
                <li>• Robust to accents, noise</li>
                <li>• $0/month cost (self-hosted)</li>
                <li>• 6 model sizes (39M to 1.5B)</li>
                <li>• HIPAA-compliant (offline)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">
                Commercial APIs
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 96-99% accuracy (marginally better)</li>
                <li>• 50-120 languages</li>
                <li>• Cloud-only (internet required)</li>
                <li>• $0.006/minute = $360/year (1K hrs)</li>
                <li>• Data privacy concerns</li>
                <li>• Recurring costs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Area */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Input */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
              Audio Settings
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Whisper Model
                </label>
                <div className="space-y-2">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedModel === model.id
                          ? 'border-navy-900 dark:border-navy-600 bg-navy-50 dark:bg-navy-900'
                          : 'border-slate-200 dark:border-slate-700 hover:border-navy-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-navy-900 dark:text-white">
                            {model.name}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {model.use}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {model.size}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {model.speed} realtime
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Audio Scenario
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {scenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedScenario === scenario.id
                          ? 'border-navy-900 dark:border-navy-600 bg-navy-50 dark:bg-navy-900'
                          : 'border-slate-200 dark:border-slate-700 hover:border-navy-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{scenario.icon}</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {scenario.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {scenario.duration}s • {scenario.language}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={toggleRecording}
                  className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                    isRecording
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording (or use sample)'}
                </button>
              </div>
            </div>

            <button
              onClick={transcribeAudio}
              disabled={isTranscribing || isRecording}
              className="w-full py-3 bg-navy-900 dark:bg-navy-700 text-white rounded-lg font-semibold hover:bg-navy-800 dark:hover:bg-navy-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Use Cases
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Call center quality monitoring (save $10K-$25K/year)</li>
                <li>• Voice notes → text (housekeeping, maintenance)</li>
                <li>• Medical transcription (save 5-8 hrs/week per doctor)</li>
                <li>• Meeting transcription (management, training)</li>
                <li>• Multilingual guest support (99 languages)</li>
              </ul>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
              Transcription
            </h2>

            {result ? (
              <div className="space-y-6">
                {/* Transcription Text */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                    {result.text}
                  </pre>
                </div>

                {/* Metrics */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Language Detected:</span>
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {result.language}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Word Count:</span>
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {result.wordCount} words
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Audio Duration:</span>
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {result.duration}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Processing Time:</span>
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {result.executionTime.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Model:</span>
                    <span className="font-semibold text-navy-900 dark:text-white text-sm">
                      {result.modelUsed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cost:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      $0.00
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                    📋 Copy Text
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                    💾 Export
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>Select a model and scenario, then click &quot;Transcribe Audio&quot;</p>
              </div>
            )}
          </div>
        </div>

        {/* ROI Section */}
        <div className="bg-gradient-to-r from-navy-900 to-blue-800 dark:from-navy-800 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Expected ROI - All 21 Industries</h2>
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-4xl font-bold">$0</div>
              <div className="text-blue-200">Monthly Cost</div>
            </div>
            <div>
              <div className="text-4xl font-bold">95-98%</div>
              <div className="text-blue-200">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold">99</div>
              <div className="text-blue-200">Languages</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$6K-$17K</div>
              <div className="text-blue-200">Annual Savings</div>
            </div>
          </div>
          <div className="pt-6 border-t border-blue-700">
            <h3 className="font-semibold mb-2">Industry Applications:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-blue-100 text-sm">
              <div>
                <strong>Hotels (#1-6):</strong> Call center transcription, voice notes
              </div>
              <div>
                <strong>Healthcare (#15, #22-23):</strong> Clinical transcription (HIPAA), patient
                notes
              </div>
              <div>
                <strong>Restaurants (#17):</strong> Drive-through orders, kitchen verbal orders
              </div>
              <div>
                <strong>Language Schools (#21):</strong> Pronunciation assessment, lesson recording
              </div>
              <div>
                <strong>Casinos (#20):</strong> Security incidents, customer disputes
              </div>
              <div>
                <strong>Cruise Ships (#11):</strong> Safety announcements (multilingual)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
