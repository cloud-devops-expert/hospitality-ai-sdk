/**
 * Translation Demo (NLLB-200)
 *
 * Zero-cost multilingual guest communications using Meta's NLLB-200 (200 languages)
 * ROI: $720/month ($8,640/year) - Eliminates translation services & saves staff time
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ViewTabs,
  ROICard,
  ROIMetrics,
  HistoricalTable,
  InsightsBox,
  TableFormatters,
} from '@/components/demos/shared';

// ============================================================================
// TYPES
// ============================================================================

interface PendingTranslation {
  id: string;
  guestName: string;
  documentType: 'booking_confirmation' | 'welcome_email' | 'safety_instruction' | 'guest_request';
  sourceLanguage: string;
  targetLanguage: string;
  priority: 'high' | 'medium' | 'low';
  text: string;
  characterCount: number;
}

interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  characterCount: number;
  qualityTier: 'auto_approve' | 'quick_review' | 'expert_review';
  estimatedTime: number;
  commercialCost: number;
}

interface DailyStats {
  date: string;
  translations: number;
  topPair: string;
  avgReview: string;
  rating: number;
  savings: string;
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const PENDING_TRANSLATIONS: PendingTranslation[] = [
  {
    id: 'trans-001',
    guestName: 'Wei Zhang',
    documentType: 'booking_confirmation',
    sourceLanguage: 'English',
    targetLanguage: 'Mandarin Chinese (Simplified)',
    priority: 'high',
    text: `Dear Mr. Zhang,

Your reservation at Grand Hotel has been confirmed with the following details:

Check-in: October 28, 2024 at 3:00 PM
Check-out: October 31, 2024 at 11:00 AM
Room Type: Deluxe King Suite with City View
Confirmation Number: RES-2024-10567

Our concierge team is available 24/7 to assist you with any requests.

We look forward to welcoming you!

Best regards,
The Grand Hotel Team`,
    characterCount: 356,
  },
  {
    id: 'trans-002',
    guestName: 'María González',
    documentType: 'welcome_email',
    sourceLanguage: 'English',
    targetLanguage: 'Spanish (Latin America)',
    priority: 'medium',
    text: `Welcome to Grand Hotel!

We are delighted to have you as our guest and look forward to making your stay memorable.

Complimentary breakfast is served daily from 7:00 AM to 10:30 AM in the Garden Restaurant.

Pool hours: 6:00 AM - 10:00 PM
Fitness center: 24 hours
Spa bookings: Extension 555

Please don't hesitate to contact us if you need anything.

Enjoy your stay!`,
    characterCount: 298,
  },
  {
    id: 'trans-003',
    guestName: 'Jean Dupont',
    documentType: 'safety_instruction',
    sourceLanguage: 'English',
    targetLanguage: 'French (France)',
    priority: 'high',
    text: `Important Safety Information

Fire Exits: Located at both ends of each hallway. Please familiarize yourself with the nearest exit.

Emergency Phone: Dial 0 from your room phone for immediate assistance.

First Aid: Available at the front desk 24 hours.

In case of emergency, please follow staff instructions and proceed calmly to the designated assembly point in the main parking lot.

Your safety is our priority.`,
    characterCount: 387,
  },
];

const LANGUAGE_PAIRS = [
  { pair: 'English → Spanish', percentage: 35, count: 45 },
  { pair: 'English → Mandarin', percentage: 20, count: 26 },
  { pair: 'English → French', percentage: 15, count: 19 },
  { pair: 'English → German', percentage: 10, count: 13 },
  { pair: 'English → Japanese', percentage: 8, count: 10 },
  { pair: 'Others', percentage: 12, count: 15 },
];

const DOCUMENT_TYPES = [
  { type: 'Booking Confirmations', count: 48, percentage: 37 },
  { type: 'Welcome Emails', count: 42, percentage: 33 },
  { type: 'Guest Requests', count: 24, percentage: 19 },
  { type: 'Safety Instructions', count: 14, percentage: 11 },
];

const QUALITY_TIERS = [
  { tier: 'Auto-Approve (Tier 1)', count: 58, percentage: 45, description: 'Common pairs, standard templates' },
  { tier: 'Quick Review (Tier 2)', count: 51, percentage: 40, description: 'Medium pairs, 1-2 min review' },
  { tier: 'Expert Review (Tier 3)', count: 15, percentage: 12, description: 'Rare pairs, 5-10 min review' },
  { tier: 'Rejected', count: 4, percentage: 3, description: 'Low quality, sent to service' },
];

const LAST_7_DAYS: DailyStats[] = [
  { date: '2024-10-19', translations: 18, topPair: 'English → Spanish (8)', avgReview: '1.2 min', rating: 4.5, savings: '$32' },
  { date: '2024-10-20', translations: 15, topPair: 'English → Mandarin (6)', avgReview: '1.8 min', rating: 4.3, savings: '$27' },
  { date: '2024-10-21', translations: 22, topPair: 'English → Spanish (10)', avgReview: '1.1 min', rating: 4.6, savings: '$39' },
  { date: '2024-10-22', translations: 19, topPair: 'English → French (7)', avgReview: '1.4 min', rating: 4.4, savings: '$34' },
  { date: '2024-10-23', translations: 25, topPair: 'English → German (9)', avgReview: '1.3 min', rating: 4.5, savings: '$45' },
  { date: '2024-10-24', translations: 21, topPair: 'English → Japanese (8)', avgReview: '1.6 min', rating: 4.4, savings: '$38' },
  { date: '2024-10-25', translations: 20, topPair: 'English → Spanish (9)', avgReview: '1.2 min', rating: 4.7, savings: '$36' },
];

const INSIGHTS = [
  'Spanish translations peaked on Tuesday (22 documents) due to Latin American holiday season',
  'Average staff rating increased from 4.3 to 4.7 stars over past 7 days (improving quality)',
  'Japanese translations now 90% quick-review (up from 75% last month) - system learning',
  'Zero rejections for booking confirmations this week (100% approval rate)',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TranslationDemo() {
  const [currentView, setCurrentView] = useState<'translation' | 'performance' | 'historical'>('translation');
  const [selectedDoc, setSelectedDoc] = useState<PendingTranslation | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [translating, setTranslating] = useState(false);

  const handleSelectDocument = (doc: PendingTranslation) => {
    setSelectedDoc(doc);
    setSourceText(doc.text);
    setSourceLang(doc.sourceLanguage);
    setTargetLang(doc.targetLanguage);
    setResult(null);
  };

  const handleTranslate = () => {
    setTranslating(true);

    setTimeout(() => {
      // Simulate NLLB-200 translation with realistic results
      const translations: Record<string, string> = {
        'English-Mandarin Chinese (Simplified)': `尊敬的张先生，

您在Grand Hotel的预订已确认，详情如下：

入住时间：2024年10月28日下午3:00
退房时间：2024年10月31日上午11:00
房型：豪华特大床套房，城市景观
确认号：RES-2024-10567

我们的礼宾团队24/7全天候为您服务，协助您处理任何要求。

我们期待您的光临！

诚挚问候，
Grand Hotel团队`,
        'English-Spanish (Latin America)': `¡Bienvenido al Grand Hotel!

Estamos encantados de tenerle como nuestro huésped y esperamos hacer que su estadía sea memorable.

El desayuno de cortesía se sirve diariamente de 7:00 AM a 10:30 AM en el Restaurante Garden.

Horario de la piscina: 6:00 AM - 10:00 PM
Centro de fitness: 24 horas
Reservas de spa: Extensión 555

No dude en contactarnos si necesita algo.

¡Disfrute su estadía!`,
        'English-French (France)': `Informations Importantes sur la Sécurité

Sorties de Secours: Situées aux deux extrémités de chaque couloir. Veuillez vous familiariser avec la sortie la plus proche.

Téléphone d'Urgence: Composez le 0 depuis le téléphone de votre chambre pour une assistance immédiate.

Premiers Secours: Disponibles à la réception 24 heures sur 24.

En cas d'urgence, veuillez suivre les instructions du personnel et vous diriger calmement vers le point de rassemblement désigné dans le parking principal.

Votre sécurité est notre priorité.`,
      };

      const key = `${sourceLang}-${targetLang}`;
      const translated = translations[key] || '[Translation would appear here in production]';

      // Determine quality tier based on language pair
      let qualityTier: 'auto_approve' | 'quick_review' | 'expert_review' = 'quick_review';
      let confidence = 0.88;

      if (targetLang === 'Spanish (Latin America)') {
        qualityTier = 'auto_approve';
        confidence = 0.94;
      } else if (targetLang === 'French (France)') {
        qualityTier = 'quick_review';
        confidence = 0.88;
      } else if (targetLang === 'Mandarin Chinese (Simplified)') {
        qualityTier = 'quick_review';
        confidence = 0.86;
      }

      const characterCount = sourceText.length;
      const commercialCost = (characterCount / 1000000) * 22.5; // Avg of Google/DeepL ($20-25 per 1M chars)

      setResult({
        translatedText: translated,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        confidence,
        characterCount,
        qualityTier,
        estimatedTime: 1500 + Math.random() * 1000,
        commercialCost,
      });

      setTranslating(false);
    }, 1500);
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      auto_approve: { label: 'Auto-Approve', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      quick_review: { label: 'Quick Review', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      expert_review: { label: 'Expert Review', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    };
    return badges[tier as keyof typeof badges] || badges.quick_review;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      high: { label: 'High Priority', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      low: { label: 'Low', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
    };
    return badges[priority as keyof typeof badges];
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
            🌍 Translation (NLLB-200)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Zero-cost multilingual guest communications using Meta&apos;s NLLB-200 (200 languages)
          </p>
        </div>

        {/* View Tabs */}
        <ViewTabs
          currentView={currentView}
          views={[
            { id: 'translation', label: 'Translation', icon: '🌐' },
            { id: 'performance', label: 'Performance', icon: '📊' },
            { id: 'historical', label: 'Historical', icon: '📈' },
          ]}
          onChange={(view) => setCurrentView(view as any)}
        />

        {/* View 1: Translation (Staff Operations) */}
        {currentView === 'translation' && (
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Pending Translations Queue */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  📋 Pending Translations
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                  Documents awaiting translation (click to translate)
                </p>

                <div className="space-y-3">
                  {PENDING_TRANSLATIONS.map((doc) => {
                    const priority = getPriorityBadge(doc.priority);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectDocument(doc)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedDoc?.id === doc.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {doc.guestName}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {doc.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {doc.sourceLanguage} → {doc.targetLanguage}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {doc.characterCount} characters
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Key Benefits */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-3">✅ Why NLLB-200?</h3>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>• 200 languages (vs 133 for Google, 31 for DeepL)</li>
                  <li>• $0 API cost (vs $20-25 per 1M chars)</li>
                  <li>• 85-95% quality (acceptable for hotels)</li>
                  <li>• GDPR compliant (self-hosted, no cloud)</li>
                  <li>• Works offline (business continuity)</li>
                  <li>• No vendor lock-in (open-source)</li>
                </ul>
              </div>
            </div>

            {/* Right: Interactive Translator */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  🌐 Interactive Translator
                </h2>

                {/* Language Selector */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      From
                    </label>
                    <input
                      type="text"
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Source language"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      To
                    </label>
                    <input
                      type="text"
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Target language"
                    />
                  </div>
                </div>

                {/* Source Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Source Text
                  </label>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter text to translate or select from pending queue..."
                    className="w-full h-48 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {/* Translate Button */}
                <button
                  onClick={handleTranslate}
                  disabled={!sourceText.trim() || translating}
                  className="w-full py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors mb-4"
                >
                  {translating ? '⏳ Translating (NLLB-200)...' : '🌍 Translate with NLLB-200'}
                </button>

                {/* Translation Result */}
                {result && (
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Translation Output</h3>
                      <span className={`text-xs px-3 py-1 rounded ${getTierBadge(result.qualityTier).color}`}>
                        {getTierBadge(result.qualityTier).label}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
                        {result.translatedText}
                      </pre>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded">
                        <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {(result.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded">
                        <span className="text-slate-600 dark:text-slate-400">Time:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {result.estimatedTime.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded">
                        <span className="text-slate-600 dark:text-slate-400">Characters:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {result.characterCount}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded">
                        <span className="text-slate-600 dark:text-slate-400">NLLB Cost:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          $0.00
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded col-span-2">
                        <span className="text-slate-600 dark:text-slate-400">Commercial Cost (Google/DeepL):</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ${result.commercialCost.toFixed(4)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                        ✓ Approve
                      </button>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                        ✎ Edit
                      </button>
                      <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-semibold">
                        ✗ Reject
                      </button>
                    </div>

                    {/* Workflow Info */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                      <div className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                        {result.qualityTier === 'auto_approve' && '✓ Auto-Approve Workflow'}
                        {result.qualityTier === 'quick_review' && '⚡ Quick Review Workflow (1-2 min)'}
                        {result.qualityTier === 'expert_review' && '👨‍💼 Expert Review Workflow (5-10 min)'}
                      </div>
                      <div className="text-blue-800 dark:text-blue-300">
                        {result.qualityTier === 'auto_approve' && 'High confidence + common pair + standard template → Auto-approve & send'}
                        {result.qualityTier === 'quick_review' && 'Medium confidence → Quick staff review → Approve → Send'}
                        {result.qualityTier === 'expert_review' && 'Low confidence or safety-critical → Bilingual staff review → Approve'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View 2: Performance (Manager ROI) */}
        {currentView === 'performance' && (
          <div className="space-y-8">
            {/* ROI Card */}
            <ROICard
              monthlyROI={720}
              annualROI={8640}
              description="Zero-cost NLLB-200 translation eliminates commercial API costs and reduces staff time by 87%"
            />

            {/* Before/After Comparison */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📊 Before/After Comparison
              </h2>
              <ROIMetrics
                beforeMetrics={[
                  { label: 'Translation Method', value: 'Manual/Services' },
                  { label: 'Avg Time per Document', value: '12 minutes' },
                  { label: 'Monthly Labor Cost', value: '$1,000' },
                  { label: 'Service Costs', value: '$200/month' },
                  { label: 'Total Monthly Cost', value: '$1,200' },
                ]}
                afterMetrics={[
                  { label: 'Translation Method', value: 'NLLB-200 (Self-hosted)' },
                  { label: 'Avg Time per Document', value: '1.5 minutes' },
                  { label: 'Monthly Labor Cost', value: '$125' },
                  { label: 'API Cost', value: '$0.00' },
                  { label: 'Total Monthly Cost', value: '$125' },
                ]}
              />
            </div>

            {/* Language Pair Distribution */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🌐 Language Pair Distribution
                </h3>
                <div className="space-y-3">
                  {LANGUAGE_PAIRS.map((pair, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 dark:text-slate-300">{pair.pair}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {pair.count} ({pair.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${pair.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-900 dark:text-blue-200">
                  <strong>Total:</strong> 128 translations this month (avg 200 characters each)
                </div>
              </div>

              {/* Document Type Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📄 Document Type Distribution
                </h3>
                <div className="space-y-3">
                  {DOCUMENT_TYPES.map((doc, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700 dark:text-slate-300">{doc.type}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {doc.count} ({doc.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${doc.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Tier Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ⚡ Quality Tier Breakdown
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {QUALITY_TIERS.map((tier, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {tier.count}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {tier.tier}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {tier.description}
                    </div>
                    <div className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                      {tier.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">✅ Key Benefits</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold mb-2">$0</div>
                  <div className="text-blue-200">Monthly API Cost (vs $20-25/1M chars for commercial)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">87%</div>
                  <div className="text-blue-200">Staff Time Reduction (12 min → 1.5 min per document)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">200</div>
                  <div className="text-blue-200">Languages Supported (vs 133 Google, 31 DeepL)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 3: Historical (7-Day Trends) */}
        {currentView === 'historical' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📈 Last 7 Days Translation Activity
              </h2>

              <HistoricalTable
                columns={[
                  { header: 'Date', key: 'date', formatter: TableFormatters.date },
                  { header: 'Translations', key: 'translations', formatter: TableFormatters.number },
                  { header: 'Top Language Pair', key: 'topPair' },
                  { header: 'Avg Review Time', key: 'avgReview' },
                  {
                    header: 'Staff Rating',
                    key: 'rating',
                    formatter: (val: number) => (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold">{val.toFixed(1)}</span>
                      </div>
                    ),
                  },
                  { header: 'Daily Savings', key: 'savings', formatter: TableFormatters.currency },
                ]}
                data={LAST_7_DAYS}
              />

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Translations</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">140</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+12% vs last week</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Staff Rating</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">4.49 ★</div>
                  <div className="text-xs text-green-600 dark:text-green-400">+0.19 vs last week</div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Weekly Savings</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">$251</div>
                  <div className="text-xs text-green-600 dark:text-green-400">$1,025/month projected</div>
                </div>
              </div>
            </div>

            <InsightsBox insights={INSIGHTS} />

            {/* System Learning */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🧠 System Learning & Improvements
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    ✓ Quality Improvement Trend
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">
                    Staff ratings increased from 4.3 to 4.7 stars over past 7 days. Japanese and Mandarin
                    translations now require less manual editing (90% quick-review vs 75% last month).
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    📊 Usage Pattern Detection
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    Spanish translations peak on Tuesdays due to Latin American holiday season bookings.
                    System automatically prioritizes Spanish translations on high-volume days.
                  </div>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    🎯 Auto-Approve Rate Increasing
                  </div>
                  <div className="text-sm text-amber-800 dark:text-amber-300">
                    Booking confirmations now 100% auto-approved (up from 85% last month). Zero rejections
                    this week indicates high confidence in common language pairs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
