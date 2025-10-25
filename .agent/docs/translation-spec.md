# Translation System - Technical Specification

## Executive Summary

**Problem**: Hotels need to communicate with international guests in 200+ languages, but hiring multilingual staff or using commercial translation services is expensive ($0.10-0.20 per word = $2,000-8,000/month for typical property).

**Solution**: Self-hosted NLLB-200 (No Language Left Behind) translation system that handles 200 languages at zero API cost, saving $500-2,000/month while maintaining 85-95% translation quality.

**ROI**: $720/month ($8,640/year) for typical 50-room property
- **Savings**: $900/month (eliminates translation service costs)
- **Cost**: $180/month (staff time for review/approval, infrastructure)
- **NET**: $720/month

**Key Metric**: Zero API cost vs. $0.10-0.20 per word for commercial services

---

## 1. System Architecture

### Technology Choice: NLLB-200 (Meta)

**Why NLLB-200 vs. Commercial APIs**:

| Factor | NLLB-200 | Google Translate | DeepL |
|--------|----------|------------------|-------|
| **Languages** | 200 | 133 | 31 |
| **Cost** | $0/month | $20 per 1M chars | $25 per 1M chars |
| **Quality** | 85-95% | 90-98% | 92-98% |
| **Privacy** | Self-hosted (GDPR) | Cloud (privacy concerns) | Cloud (privacy concerns) |
| **Offline** | ✅ Works offline | ❌ Requires internet | ❌ Requires internet |
| **Low-resource languages** | ✅ Best-in-class | ❌ Poor support | ❌ Very limited |

**Key Advantages**:
1. **Zero marginal cost** - Translate unlimited text at no additional cost
2. **Best low-resource language support** - Thai, Vietnamese, Arabic, Hindi, etc.
3. **GDPR compliant** - Guest data never leaves your infrastructure
4. **Offline capability** - Works without internet (business continuity)
5. **No vendor lock-in** - Open-source model

**Tradeoff**: 5-10% lower quality on common language pairs (eng→spa, eng→fra) compared to commercial APIs, but acceptable for hotel communications.

---

## 2. Use Cases & Workflows

### Primary Use Cases

1. **Pre-Arrival Communications** (40% of volume)
   - Booking confirmations
   - Pre-arrival emails
   - Check-in instructions
   - Special requests confirmation

2. **Guest Communications** (35% of volume)
   - Welcome messages
   - Room service menus
   - Activity schedules
   - Event invitations

3. **Safety & Compliance** (15% of volume)
   - Emergency instructions
   - Safety signage
   - Health regulations
   - Fire evacuation procedures

4. **Review Responses** (10% of volume)
   - Responding to reviews in guest's native language
   - Thank you messages
   - Apology messages

### Workflow Example: Booking Confirmation Translation

**Scenario**: Chinese guest books room, needs confirmation in Mandarin

**Traditional Workflow** (Before):
1. Front desk receives booking (Chinese guest)
2. Staff identifies need for Mandarin confirmation
3. Options:
   - a) Use Google Translate (free but privacy concerns) - 5 min
   - b) Ask bilingual staff member (if available) - 15-30 min
   - c) Hire translation service ($25-50 per document) - 24-48 hours
4. Manual copy/paste into email template
5. Send confirmation
6. **Total time**: 5 min - 48 hours, **Cost**: $0-50 per document

**NLLB-200 Workflow** (After):
1. Front desk receives booking (Chinese guest)
2. System detects guest language preference (from booking)
3. Staff selects "Booking Confirmation" template
4. System translates template to Mandarin (NLLB-200, 2-5 seconds)
5. Staff reviews translation (1 min)
6. Click "Approve & Send"
7. **Total time**: 2 minutes, **Cost**: $0.00

**Time Savings**: 3-45 min per document (avg 10 min)
**Cost Savings**: $0-50 per document (avg $15-20)

---

## 3. Translation Quality Tiers

### Tier 1: Auto-Approve (50% of translations)
**Quality threshold**: 90%+ confidence, common language pairs
**Languages**: English ↔ Spanish/French/German/Italian/Portuguese
**Use cases**: Standard templates (booking confirmations, welcome emails)
**Workflow**: Translate → Auto-approve → Send (no human review)

### Tier 2: Quick Review (40% of translations)
**Quality threshold**: 80-90% confidence, medium-frequency pairs
**Languages**: English ↔ Mandarin/Japanese/Korean/Arabic/Russian
**Use cases**: Guest requests, menu translations
**Workflow**: Translate → Staff review (1-2 min) → Approve → Send

### Tier 3: Expert Review (10% of translations)
**Quality threshold**: <80% confidence, rare language pairs
**Languages**: English ↔ Swahili/Bengali/Farsi/Tagalog/etc.
**Use cases**: Safety instructions, legal notices, complaints
**Workflow**: Translate → Bilingual staff/service review (5-10 min) → Approve → Send

---

## 4. Data Model

### Translation Record Schema

```typescript
interface TranslationRecord {
  id: string;                    // UUID
  date: string;                  // ISO 8601 date (YYYY-MM-DD)
  guest_id?: string;             // Optional guest reference

  // Translation details
  source_text: string;           // Original text
  source_language: string;       // ISO 639-3 code (eng_Latn)
  target_language: string;       // ISO 639-3 code (spa_Latn)
  translated_text: string;       // NLLB-200 output

  // Metadata
  document_type: 'booking_confirmation' | 'welcome_email' | 'guest_request' |
                 'safety_instruction' | 'menu' | 'review_response' | 'other';
  character_count: number;       // Length of source text
  confidence: number;            // 0.0-1.0 (NLLB-200 confidence)

  // Quality & workflow
  quality_tier: 'auto_approve' | 'quick_review' | 'expert_review';
  workflow_status: 'pending' | 'approved' | 'rejected' | 'sent';
  reviewed_by?: string;          // Staff member ID
  staff_rating?: number;         // 1-5 star quality rating (optional)

  // Performance
  translation_time_ms: number;   // NLLB-200 inference time
  review_time_seconds?: number;  // Human review time (if applicable)

  // Cost tracking
  commercial_equivalent_cost: number; // What this would cost via Google/DeepL
  actual_cost: number;           // Always $0.00 (infrastructure cost amortized)
}
```

### Daily Aggregate Schema

```typescript
interface DailyTranslationStats {
  date: string;                  // ISO 8601 date (YYYY-MM-DD)

  // Volume
  total_translations: number;    // Total documents translated
  total_characters: number;      // Total characters processed

  // Language distribution (top 5 language pairs)
  language_pairs: {
    [pair: string]: number;      // "eng_Latn → spa_Latn": 45
  };

  // Quality tiers
  auto_approved: number;         // Tier 1 count
  quick_review: number;          // Tier 2 count
  expert_review: number;         // Tier 3 count
  rejected: number;              // Failed translations

  // Document types
  document_types: {
    booking_confirmation: number;
    welcome_email: number;
    guest_request: number;
    safety_instruction: number;
    menu: number;
    review_response: number;
    other: number;
  };

  // Performance
  avg_translation_time_ms: number;
  avg_review_time_seconds: number;
  avg_staff_rating: number;      // Average quality rating (1-5 stars)

  // ROI
  commercial_equivalent_cost: number; // What this would cost via Google/DeepL
  actual_cost: number;           // Always $0.00
  monthly_savings: number;       // Cumulative savings
}
```

---

## 5. Algorithms & Logic

### Language Detection

**Problem**: Guest emails often don't specify language, need auto-detection

**Solution**: Use `franc` (lightweight language detector) or NLLB-200 built-in detection

```typescript
import { franc } from 'franc-min';

function detectLanguage(text: string): string {
  // franc returns ISO 639-3 codes (e.g., "spa" for Spanish)
  const detectedLang = franc(text);

  // Map to NLLB-200 codes (e.g., "spa_Latn" for Spanish)
  const nllbCode = mapToNLLBCode(detectedLang);

  return nllbCode;
}

function mapToNLLBCode(iso639: string): string {
  const mapping: Record<string, string> = {
    'spa': 'spa_Latn',     // Spanish (Latin script)
    'fra': 'fra_Latn',     // French
    'deu': 'deu_Latn',     // German
    'zho': 'zho_Hans',     // Chinese (Simplified)
    'jpn': 'jpn_Jpan',     // Japanese
    'kor': 'kor_Hang',     // Korean
    'ara': 'arb_Arab',     // Arabic
    'rus': 'rus_Cyrl',     // Russian
    // ... 200 languages
  };

  return mapping[iso639] || 'eng_Latn'; // Default to English
}
```

### Quality Tier Assignment

**Problem**: Determine which translations need human review

**Solution**: Multi-factor scoring based on language pair, document type, confidence

```typescript
function determineQualityTier(
  sourceLang: string,
  targetLang: string,
  documentType: string,
  confidence: number
): 'auto_approve' | 'quick_review' | 'expert_review' {

  // Tier 1: Auto-approve (high-confidence, common pairs)
  if (confidence >= 0.90 && isCommonPair(sourceLang, targetLang) &&
      isStandardTemplate(documentType)) {
    return 'auto_approve';
  }

  // Tier 3: Expert review (safety-critical or low confidence)
  if (documentType === 'safety_instruction' || confidence < 0.75) {
    return 'expert_review';
  }

  // Tier 2: Quick review (everything else)
  return 'quick_review';
}

function isCommonPair(source: string, target: string): boolean {
  const commonPairs = [
    'eng_Latn → spa_Latn',
    'eng_Latn → fra_Latn',
    'eng_Latn → deu_Latn',
    'eng_Latn → zho_Hans',
    'eng_Latn → jpn_Jpan',
    // Top 20 language pairs (80% of hotel translations)
  ];

  return commonPairs.includes(`${source} → ${target}`);
}

function isStandardTemplate(documentType: string): boolean {
  return ['booking_confirmation', 'welcome_email'].includes(documentType);
}
```

### Cost Savings Calculation

**Problem**: Calculate ROI vs. commercial translation services

**Solution**: Compare NLLB-200 ($0) vs. Google Translate/DeepL pricing

```typescript
function calculateTranslationSavings(characterCount: number): number {
  // Commercial translation service pricing
  const GOOGLE_TRANSLATE_COST = 20 / 1_000_000;  // $20 per 1M characters
  const DEEPL_COST = 25 / 1_000_000;             // $25 per 1M characters

  // Average of commercial services
  const avgCostPerChar = (GOOGLE_TRANSLATE_COST + DEEPL_COST) / 2;

  // What this translation would cost
  const commercialCost = characterCount * avgCostPerChar;

  // NLLB-200 cost (zero marginal cost)
  const nllbCost = 0.00;

  return commercialCost - nllbCost;
}

// Example: 1000-character booking confirmation
const savings = calculateTranslationSavings(1000);
// savings = $0.0225 per document (2.25 cents)
// At 200 documents/month: $4.50/month savings
// At scale (1000 hotels, 200k docs/month): $4,500/month savings
```

---

## 6. ROI Calculation (Detailed)

### Typical Hotel Scenarios

**Small Hotel (20-40 rooms)**:
- **Volume**: 50 translations/month (avg 800 characters each)
- **Commercial cost**: 50 × 800 × $0.0000225 = $0.90/month (negligible)
- **ROI**: Minimal savings, but eliminates privacy concerns and internet dependency

**Medium Hotel (50-100 rooms)**:
- **Volume**: 200 translations/month (avg 800 characters each)
- **Commercial cost**: 200 × 800 × $0.0000225 = $3.60/month
- **Staff time savings**: 200 × 10 min = 2,000 min = 33 hours/month × $25/hour = $825/month
- **ROI**: $825/month (primarily from staff efficiency, not API cost avoidance)

**Large Hotel (100+ rooms)**:
- **Volume**: 500 translations/month (avg 800 characters each)
- **Commercial cost**: 500 × 800 × $0.0000225 = $9.00/month
- **Staff time savings**: 500 × 10 min = 5,000 min = 83 hours/month × $25/hour = $2,075/month
- **ROI**: $2,075/month

**Key Insight**: ROI comes from **staff efficiency**, not API cost savings (Google Translate API is very cheap at $20/million chars). The real value is:
1. **Time savings**: 5-15 min per translation eliminated
2. **Privacy compliance**: Guest data stays on-premise (GDPR)
3. **Offline capability**: Works without internet (business continuity)
4. **No vendor lock-in**: Open-source model

### Monthly ROI Breakdown (50-room hotel)

**Baseline** (Before NLLB-200):
- Manual translation methods (Google Translate, bilingual staff, translation services)
- Avg time per translation: 10-15 minutes (including copy/paste, formatting)
- Privacy concerns with cloud services
- Internet dependency

**After NLLB-200**:
- Automated translation with optional human review
- Avg time per translation: 1-2 minutes (review only)
- GDPR-compliant (self-hosted)
- Works offline

**Calculations** (200 translations/month, typical 50-room property):

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| **Time per translation** | 12 min | 1.5 min | 10.5 min |
| **Monthly time** | 2,400 min (40 hrs) | 300 min (5 hrs) | 2,100 min (35 hrs) |
| **Labor cost** | $1,000 | $125 | **$875** |
| **Translation services** | $200 | $0 | **$200** |
| **Privacy risk** | High (cloud) | Low (self-hosted) | N/A |
| **Internet required** | Yes | No | N/A |
| **Total monthly cost** | $1,200 | $125 | **$1,075** |

**Annual ROI**: $1,075 × 12 = **$12,900 per year**

**Infrastructure Cost**: ~$50/month (model hosting on CPU)
**Net ROI**: $1,025/month ($12,300/year)

**Conservative estimate for demo**: $720/month ($8,640/year)

---

## 7. Performance Targets

### Translation Speed

**NLLB-200 Inference Time** (on typical hardware):
- **CPU (Intel Xeon)**: 500-2000ms per document (depending on length)
- **GPU (NVIDIA T4)**: 100-500ms per document
- **Greengrass (Intel NUC)**: 800-1500ms per document

**Target**: <2 seconds for 90% of translations (acceptable for async workflow)

### Quality Metrics

**Translation Accuracy**:
- **Tier 1 (common pairs)**: 90-95% quality (comparable to commercial APIs)
- **Tier 2 (medium pairs)**: 85-90% quality (acceptable for hotel communications)
- **Tier 3 (rare pairs)**: 75-85% quality (requires human review)

**Staff Approval Rate**:
- **Target**: 85%+ approval rate (15% rejection/edit)
- **Measurement**: Track staff ratings (1-5 stars) on reviewed translations

### Throughput

**Daily Volume**:
- **Small hotel**: 5-10 translations/day
- **Medium hotel**: 10-30 translations/day
- **Large hotel**: 30-50 translations/day

**Peak Load**: 2-3× average during high season (handle gracefully with queue)

---

## 8. Implementation Notes

### Model Deployment

**Options**:

1. **Browser (Transformers.js)** - For small hotels
   - NLLB-200-distilled-600M (600MB model)
   - Runs in browser via WebAssembly (ONNX runtime)
   - 2-5 second inference on modern laptops
   - Zero infrastructure cost

2. **Greengrass (On-premise)** - For medium/large hotels
   - Full Python stack (Hugging Face Transformers)
   - NLLB-200-distilled-600M or 1.3B model
   - GPU acceleration optional (NVIDIA T4 reduces latency to 100-500ms)
   - $400 hardware + $22/month AWS

3. **Cloud API (Fallback)** - For rare languages
   - Google Translate API for ultra-rare languages not in NLLB-200
   - Only used when NLLB-200 confidence < 70%
   - <5% of translations

### Database Schema

```sql
-- Translation records (one per document)
CREATE TABLE translation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  date DATE NOT NULL,
  guest_id UUID,

  source_text TEXT NOT NULL,
  source_language VARCHAR(20) NOT NULL,
  target_language VARCHAR(20) NOT NULL,
  translated_text TEXT NOT NULL,

  document_type VARCHAR(50) NOT NULL,
  character_count INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,

  quality_tier VARCHAR(20) NOT NULL,
  workflow_status VARCHAR(20) NOT NULL,
  reviewed_by UUID,
  staff_rating INTEGER,

  translation_time_ms INTEGER NOT NULL,
  review_time_seconds INTEGER,

  commercial_equivalent_cost DECIMAL(10,4) NOT NULL,
  actual_cost DECIMAL(10,4) DEFAULT 0.00,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregates (one per day)
CREATE TABLE daily_translation_stats (
  date DATE PRIMARY KEY,
  total_translations INTEGER NOT NULL,
  total_characters INTEGER NOT NULL,
  language_pairs JSONB NOT NULL,
  auto_approved INTEGER NOT NULL,
  quick_review INTEGER NOT NULL,
  expert_review INTEGER NOT NULL,
  rejected INTEGER NOT NULL,
  document_types JSONB NOT NULL,
  avg_translation_time_ms INTEGER NOT NULL,
  avg_review_time_seconds DECIMAL(6,2),
  avg_staff_rating DECIMAL(3,2),
  commercial_equivalent_cost DECIMAL(10,2) NOT NULL,
  actual_cost DECIMAL(10,2) DEFAULT 0.00,
  monthly_savings DECIMAL(10,2) NOT NULL
);
```

---

## 9. UI Design (Three-View Architecture)

### View 1: Translation (Staff Operations)

**Purpose**: Interactive translator for staff to translate guest communications

**Layout**:
- **Left**: Pending communications queue (3-5 documents needing translation)
  - Guest name, document type, source language, urgency
  - Click to translate
- **Right**: Interactive translator
  - Language pair selector (From → To)
  - Source text input
  - "Translate" button
  - Translation output with confidence score
  - Approve/Edit/Reject buttons

**Key Features**:
- Sample documents (booking confirmation, welcome email, safety instructions)
- Language auto-detection (detect source language from text)
- Template library (pre-translated common messages)

### View 2: Performance (Manager ROI)

**Purpose**: Show ROI metrics, language distribution, quality stats

**Layout**:
- **Top**: ROI card ($720/month savings)
  - Staff time savings: $825/month
  - Translation service elimination: $75/month
  - Infrastructure cost: -$180/month
  - NET: $720/month
- **Middle**: Language pair distribution (pie chart or bar chart)
  - English → Spanish: 35%
  - English → Mandarin: 20%
  - English → French: 15%
  - English → German: 10%
  - Others: 20%
- **Bottom**: Quality metrics
  - Auto-approved: 45% (Tier 1)
  - Quick review: 40% (Tier 2)
  - Expert review: 12% (Tier 3)
  - Rejected: 3%

### View 3: Historical (7-Day Trends)

**Purpose**: Show translation activity over last 7 days, identify patterns

**Layout**:
- **Table**: Daily translation stats (7 rows)
  - Date
  - Total translations
  - Top language pair
  - Avg review time
  - Staff rating (1-5 stars)
  - Savings
- **Insights**: System observations
  - "Spanish translations peaked on Tuesday (45 documents) due to Mexican holiday bookings"
  - "Average staff rating increased from 4.2 to 4.6 stars over past 7 days"
  - "Japanese translations now 95% auto-approved (up from 70% last month)"

---

## 10. Sample Data (Demo)

### Pending Communications Queue

```typescript
const pendingTranslations = [
  {
    id: 'trans-001',
    guestName: 'Wei Zhang',
    documentType: 'booking_confirmation',
    sourceLanguage: 'eng_Latn',
    targetLanguage: 'zho_Hans',
    priority: 'high',
    text: 'Your reservation at Grand Hotel has been confirmed...',
  },
  {
    id: 'trans-002',
    guestName: 'María González',
    documentType: 'welcome_email',
    sourceLanguage: 'eng_Latn',
    targetLanguage: 'spa_Latn',
    priority: 'medium',
    text: 'Welcome to Grand Hotel! We are delighted to have you...',
  },
  {
    id: 'trans-003',
    guestName: 'Jean Dupont',
    documentType: 'safety_instruction',
    sourceLanguage: 'eng_Latn',
    targetLanguage: 'fra_Latn',
    priority: 'high',
    text: 'Emergency Procedures: In case of fire, please...',
  },
];
```

### Historical Data (7 Days)

```typescript
const last7Days = [
  { date: '2024-10-19', translations: 18, topPair: 'English → Spanish (8)', avgReview: '1.2 min', rating: 4.5, savings: '$32' },
  { date: '2024-10-20', translations: 15, topPair: 'English → Mandarin (6)', avgReview: '1.8 min', rating: 4.3, savings: '$27' },
  { date: '2024-10-21', translations: 22, topPair: 'English → Spanish (10)', avgReview: '1.1 min', rating: 4.6, savings: '$39' },
  { date: '2024-10-22', translations: 19, topPair: 'English → French (7)', avgReview: '1.4 min', rating: 4.4, savings: '$34' },
  { date: '2024-10-23', translations: 25, topPair: 'English → German (9)', avgReview: '1.3 min', rating: 4.5, savings: '$45' },
  { date: '2024-10-24', translations: 21, topPair: 'English → Japanese (8)', avgReview: '1.6 min', rating: 4.4, savings: '$38' },
  { date: '2024-10-25', translations: 20, topPair: 'English → Spanish (9)', avgReview: '1.2 min', rating: 4.7, savings: '$36' },
];
```

---

## 11. Future Enhancements

1. **Batch Translation** - Translate multiple documents at once (newsletters, menus)
2. **Template Library** - Pre-translate common messages (100+ templates)
3. **Quality Feedback Loop** - Use staff ratings to fine-tune confidence thresholds
4. **Guest Language Preferences** - Auto-detect preferred language from booking
5. **Multi-language Menus** - Generate menus in top 10 languages automatically
6. **Voice Translation** - Combine with speech-to-text for phone calls

---

## 12. Comparison with Other Solutions

### vs. Google Translate API

| Factor | NLLB-200 | Google Translate API |
|--------|----------|---------------------|
| **Cost** | $0/month | $20 per 1M chars |
| **Languages** | 200 | 133 |
| **Quality** | 85-95% | 90-98% |
| **Privacy** | Self-hosted | Cloud (concerns) |
| **Offline** | ✅ | ❌ |
| **Vendor lock-in** | None | High |

**Verdict**: NLLB-200 wins on cost, privacy, offline capability. Google wins on quality (5-10% better).

### vs. DeepL API

| Factor | NLLB-200 | DeepL API |
|--------|----------|-----------|
| **Cost** | $0/month | $25 per 1M chars |
| **Languages** | 200 | 31 |
| **Quality** | 85-95% | 92-98% |
| **Privacy** | Self-hosted | Cloud |
| **Offline** | ✅ | ❌ |

**Verdict**: NLLB-200 wins on cost, language coverage, privacy. DeepL wins on quality (7-13% better).

### vs. Human Translation Services

| Factor | NLLB-200 | Human Translation |
|--------|----------|-------------------|
| **Cost** | $0/month | $0.10-0.20 per word |
| **Speed** | 2-5 seconds | 24-48 hours |
| **Quality** | 85-95% | 98-100% |
| **Availability** | 24/7 | Business hours |
| **Scalability** | Unlimited | Limited |

**Verdict**: NLLB-200 wins on cost, speed, availability. Human wins on quality (15-20% better).

---

## 13. Key Takeaways

1. **Zero API cost** - NLLB-200 is free, self-hosted, no recurring fees
2. **200 languages** - Best-in-class coverage for low-resource languages
3. **Privacy compliant** - Guest data never leaves your infrastructure (GDPR)
4. **Offline capable** - Works without internet (business continuity)
5. **ROI from efficiency** - Primary savings from staff time (10 min → 1.5 min per translation)
6. **Quality tradeoff** - 5-10% lower quality than commercial APIs, but acceptable for hotel communications
7. **Three-tier workflow** - Auto-approve (50%), Quick review (40%), Expert review (10%)
8. **Typical ROI**: $720/month for 50-room property ($8,640/year)

**Bottom Line**: NLLB-200 is the right choice for hotels that value cost control, privacy, and multilingual support over marginal quality improvements from commercial APIs.
