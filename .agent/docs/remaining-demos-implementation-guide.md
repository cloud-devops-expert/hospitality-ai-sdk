# Remaining Demos Implementation Guide

## Overview

This document provides implementation patterns for the remaining 11 ML demos to be refactored using the established three-view architecture.

**Status**: Implementation guide for demos 15-25
**Estimated Additional ROI**: $5,000-7,000/month
**Projected Total ROI**: $15,000-18,000/month when all 25 demos complete

---

## Remaining Demos Summary

### Computer Vision (3 demos)
1. **Food Recognition** - Kitchen waste reduction
2. **PPE Detection** - Safety compliance
3. **Image Generation** - Marketing materials (low priority)

### NLP (7 demos)
4. **Speech Transcription** - Meeting notes automation
5. **Document Extraction** - Invoice/ID processing (OCR)
6. **Entity Extraction** - Structured data extraction
7. **Question Answering** - Guest FAQ automation
8. **Text Summarization** - Review/meeting summaries
9. **Semantic Search** - Knowledge base search

### ML/Security (2 demos)
10. **Recommendation System** - Personalized guest experiences
11. **Fraud Detection** - Payment/booking fraud prevention

---

## Demo 15: Food Recognition (Computer Vision)

### Quick Summary
- **ROI**: $800/month ($9,600/year)
- **Technology**: ResNet-50 or EfficientNet (image classification)
- **Use Case**: Kitchen waste reduction, portion control, inventory tracking
- **Accuracy**: 88-92% food item identification

### Three-View Architecture

**View 1: Recognition (Staff Operations)**
- Upload/capture food photo
- Real-time classification (food item, portion size)
- Waste tracking (before disposal)
- Quick actions: "Log Waste", "Adjust Recipe", "Order More"

**View 2: Performance (Manager ROI)**
- ROI Card: $800/month savings
- Before/After:
  - Waste: 15% → 6% (9% reduction)
  - Monthly waste cost: $5,300 → $2,100
  - Inventory accuracy: 75% → 92%
- Top wasted items chart
- Waste by meal type (breakfast/lunch/dinner)

**View 3: Historical (7-Day Trends)**
- Daily waste tracking table
- Insights: "Pasta portions reduced 30% (pattern detected)"
- Cost savings: $180/week average

### Key Implementation Notes
- Model: ResNet-50 fine-tuned on food-101 dataset
- Inference: 200-500ms on CPU, <100ms on GPU
- Integration: Camera API or file upload
- Database: Daily waste records with food_item, weight, reason

---

## Demo 16: PPE Detection (Computer Vision)

### Quick Summary
- **ROI**: $650/month ($7,800/year)
- **Technology**: YOLOv8 (object detection)
- **Use Case**: Safety compliance (hard hats, vests, gloves), insurance reduction
- **Accuracy**: 93-96% PPE detection

### Three-View Architecture

**View 1: Monitoring (Staff Operations)**
- Live camera feed or uploaded images
- Real-time PPE detection (bounding boxes)
- Compliance alerts (missing PPE)
- Quick actions: "Send Alert", "Log Violation", "Mark Resolved"

**View 2: Performance (Manager ROI)**
- ROI Card: $650/month savings (insurance -15%, incident reduction)
- Compliance rate: 78% → 95%
- Incident reduction: 12 → 2 per month
- Cost avoidance: $450/month (insurance) + $200/month (incidents)

**View 3: Historical (7-Day Trends)**
- Daily compliance rate table
- Insights: "Kitchen compliance improved 22% (training effective)"
- Violation patterns by area/shift

### Key Implementation Notes
- Model: YOLOv8-nano for real-time detection
- Inference: 30-50ms per frame (real-time capable)
- Integration: RTSP camera streams or static images
- Database: Violation records with timestamp, location, PPE_type, resolved_at

---

## Demo 17: Speech Transcription (NLP)

### Quick Summary
- **ROI**: $550/month ($6,600/year)
- **Technology**: Whisper (OpenAI)
- **Use Case**: Meeting notes, guest request transcription, multilingual support
- **Accuracy**: 92-96% transcription accuracy

### Three-View Architecture

**View 1: Transcription (Staff Operations)**
- Upload audio file or record live
- Real-time transcription with speaker diarization
- Edit/approve transcript
- Quick actions: "Save Notes", "Send Summary", "Create Task"

**View 2: Performance (Manager ROI)**
- ROI Card: $550/month savings
- Before/After:
  - Meeting notes time: 30 min → 5 min (83% reduction)
  - Monthly time savings: 20 hours
  - Cost savings: $500/month + $50/month (better follow-up)
- Transcription volume by type (meetings, requests, calls)

**View 3: Historical (7-Day Trends)**
- Daily transcription table (count, duration, avg accuracy)
- Insights: "95% accuracy on guest requests (multilingual)"
- Time savings: $120/week average

### Key Implementation Notes
- Model: Whisper-large-v3 (best accuracy) or Whisper-medium (faster)
- Inference: 0.5x realtime on GPU, 2x realtime on CPU
- Languages: 99 languages supported
- Database: Transcription records with audio_file, transcript_text, language, accuracy

---

## Demo 18: Document Extraction (OCR)

### Quick Summary
- **ROI**: $720/month ($8,640/year)
- **Technology**: Tesseract OCR + LayoutLM (document understanding)
- **Use Case**: Invoice processing, ID scanning, form digitization
- **Accuracy**: 94-98% text extraction

### Three-View Architecture

**View 1: Extraction (Staff Operations)**
- Upload document image (invoice, ID, form)
- Real-time OCR + structured extraction
- Manual correction interface
- Quick actions: "Approve", "Edit Fields", "Reject"

**View 2: Performance (Manager ROI)**
- ROI Card: $720/month savings
- Before/After:
  - Invoice processing time: 8 min → 1 min (87% reduction)
  - Monthly invoices: 400 × 7 min saved = 46.7 hours
  - Error rate: 5% → 1% (4% reduction)
- Document types processed (invoices, IDs, forms)

**View 3: Historical (7-Day Trends)**
- Daily extraction table (documents, accuracy, time saved)
- Insights: "Invoice extraction 98% accurate (field-level)"
- Cost savings: $165/week average

### Key Implementation Notes
- Model: Tesseract for OCR, LayoutLM for structured extraction
- Inference: 1-3 seconds per document
- Document types: Invoices, IDs, receipts, forms
- Database: Extracted_documents with document_type, extracted_fields (JSONB), confidence

---

## Demo 19: Entity Extraction (NLP)

### Quick Summary
- **ROI**: $450/month ($5,400/year)
- **Technology**: spaCy NER or BERT-NER
- **Use Case**: Extract names, dates, amounts from guest messages, contracts
- **Accuracy**: 90-94% entity recognition

### Three-View Architecture

**View 1: Extraction (Staff Operations)**
- Paste text or select email/message
- Real-time entity highlighting (names, dates, amounts, locations)
- Click to create structured record
- Quick actions: "Create Guest Profile", "Add Calendar Event", "Log Amount"

**View 2: Performance (Manager ROI)**
- ROI Card: $450/month savings
- Before/After:
  - Data entry time: 5 min → 30 sec (90% reduction)
  - Monthly messages: 300 × 4.5 min saved = 22.5 hours
- Entity types extracted (names, dates, amounts, locations)

**View 3: Historical (7-Day Trends)**
- Daily extraction table (messages, entities, accuracy)
- Insights: "95% accuracy on guest names, 92% on dates"
- Time savings: $105/week average

### Key Implementation Notes
- Model: spaCy en_core_web_lg or BERT-NER fine-tuned
- Inference: 50-200ms per document
- Entity types: PERSON, DATE, MONEY, GPE (location), ORG
- Database: Entity_extractions with source_text, entities (JSONB), confidence

---

## Demo 20: Question Answering (NLP)

### Quick Summary
- **ROI**: $620/month ($7,440/year)
- **Technology**: RAG (Retrieval-Augmented Generation) with BERT + GPT-4o-mini
- **Use Case**: Guest FAQ automation, staff knowledge base
- **Accuracy**: 88-92% answer quality

### Three-View Architecture

**View 1: Q&A (Staff/Guest Operations)**
- Ask question in natural language
- Real-time answer retrieval + generation
- Source citation (which document/FAQ)
- Quick actions: "Helpful?", "Refine", "Create FAQ Entry"

**View 2: Performance (Manager ROI)**
- ROI Card: $620/month savings
- Before/After:
  - Response time: 5 min (staff lookup) → 10 sec (AI)
  - Monthly questions: 800 × 4.83 min saved = 64 hours
  - Answer quality: Staff 95%, AI 90% (acceptable)
- Top question categories

**View 3: Historical (7-Day Trends)**
- Daily Q&A table (questions, answer quality, time saved)
- Insights: "90% of questions answered without escalation"
- Cost savings: $140/week average

### Key Implementation Notes
- Model: BERT for retrieval, GPT-4o-mini for answer generation
- RAG: Vector database (pgvector) for knowledge base
- Inference: 1-2 seconds (retrieval + generation)
- Database: QA_records with question, answer, sources, feedback_score

---

## Demo 21: Text Summarization (NLP)

### Quick Summary
- **ROI**: $480/month ($5,760/year)
- **Technology**: BART or T5 (abstractive summarization)
- **Use Case**: Review summaries, meeting notes, report generation
- **Accuracy**: 85-90% summary quality

### Three-View Architecture

**View 1: Summarization (Staff Operations)**
- Paste long text or select document
- Generate summary (3 lengths: short/medium/long)
- Edit/refine summary
- Quick actions: "Copy", "Email", "Save to KB"

**View 2: Performance (Manager ROI)**
- ROI Card: $480/month savings
- Before/After:
  - Summary time: 15 min → 2 min (87% reduction)
  - Monthly summaries: 150 × 13 min saved = 32.5 hours
- Document types summarized (reviews, meetings, reports)

**View 3: Historical (7-Day Trends)**
- Daily summarization table (documents, quality, time saved)
- Insights: "Meeting notes summarized in avg 90 seconds"
- Cost savings: $110/week average

### Key Implementation Notes
- Model: BART-large-cnn or T5-base
- Inference: 2-5 seconds per document
- Summary lengths: Short (3 sentences), Medium (1 paragraph), Long (3 paragraphs)
- Database: Summaries with source_text, summary_text, summary_length, quality_rating

---

## Demo 22: Semantic Search (NLP)

### Quick Summary
- **ROI**: $520/month ($6,240/year)
- **Technology**: Sentence-BERT (semantic embeddings) + pgvector
- **Use Case**: Knowledge base search, similar guest query matching
- **Accuracy**: 92-96% relevant results

### Three-View Architecture

**View 1: Search (Staff Operations)**
- Natural language search query
- Semantic results (not just keyword matching)
- Relevance scores + snippets
- Quick actions: "Open Document", "Refine Search", "Add to KB"

**View 2: Performance (Manager ROI)**
- ROI Card: $520/month savings
- Before/After:
  - Search time: 3 min (keyword search) → 15 sec (semantic)
  - Monthly searches: 600 × 2.75 min saved = 27.5 hours
  - Result relevance: 65% → 94% (29% improvement)
- Search categories (policies, FAQs, SOPs)

**View 3: Historical (7-Day Trends)**
- Daily search table (queries, results, avg relevance)
- Insights: "94% of searches return relevant results in top 3"
- Cost savings: $120/week average

### Key Implementation Notes
- Model: all-MiniLM-L6-v2 (sentence embeddings)
- Vector DB: pgvector extension for PostgreSQL
- Inference: <100ms per search
- Database: Knowledge_base with text, embedding (vector), metadata

---

## Demo 23: Recommendation System (ML)

### Quick Summary
- **ROI**: $900/month ($10,800/year)
- **Technology**: Collaborative filtering + content-based
- **Use Case**: Personalized guest experiences (rooms, activities, dining)
- **Accuracy**: 82-88% recommendation relevance

### Three-View Architecture

**View 1: Recommendations (Staff Operations)**
- Select guest or view auto-generated recommendations
- Personalized suggestions (rooms, activities, restaurants)
- Explanation (why recommended)
- Quick actions: "Send Offer", "Book", "Save for Later"

**View 2: Performance (Manager ROI)**
- ROI Card: $900/month savings
- Before/After:
  - Upsell conversion: 8% → 18% (10% increase)
  - Monthly upsell revenue: $4,200 → $9,450
  - Guest satisfaction: 7.8 → 8.6 (0.8 increase)
- Recommendation types (rooms, activities, dining)

**View 3: Historical (7-Day Trends)**
- Daily recommendation table (sent, accepted, revenue)
- Insights: "Spa recommendations accepted 22% of the time"
- Revenue lift: $210/week average

### Key Implementation Notes
- Model: Matrix factorization (ALS) + content-based (TF-IDF)
- Inference: <50ms per recommendation
- Personalization: Guest history + similar guest patterns
- Database: Recommendations with guest_id, item_id, score, reason, accepted

---

## Demo 24: Fraud Detection (ML)

### Quick Summary
- **ROI**: $1,200/month ($14,400/year)
- **Technology**: XGBoost (anomaly detection)
- **Use Case**: Payment fraud, booking fraud, chargeback prevention
- **Accuracy**: 94-97% fraud detection

### Three-View Architecture

**View 1: Monitoring (Staff Operations)**
- Real-time fraud alerts (high-risk transactions)
- Risk scores + indicators
- Investigation tools (guest history, patterns)
- Quick actions: "Approve", "Decline", "Request Verification", "Flag for Review"

**View 2: Performance (Manager ROI)**
- ROI Card: $1,200/month savings
- Before/After:
  - Fraud losses: $2,800 → $800 per month (71% reduction)
  - False positives: 18% → 5% (13% reduction)
  - Detection time: 24 hours → real-time
- Fraud types detected (payment, booking, identity)

**View 3: Historical (7-Day Trends)**
- Daily fraud table (transactions, fraud detected, prevented losses)
- Insights: "97% fraud detection rate with 5% false positive"
- Losses prevented: $280/week average

### Key Implementation Notes
- Model: XGBoost with 50+ features (amount, location, device, time, patterns)
- Inference: <50ms per transaction
- Thresholds: Low (<30%), Medium (30-70%), High (>70%) risk
- Database: Transactions with fraud_score, risk_level, indicators, outcome

---

## Demo 25: Image Generation (Computer Vision) - Low Priority

### Quick Summary
- **ROI**: $200/month ($2,400/year) - Low business value
- **Technology**: Stable Diffusion or DALL-E
- **Use Case**: Marketing materials, social media posts (niche use case)
- **Note**: Lowest priority - manual creation often higher quality

### Three-View Architecture

**View 1: Generation (Marketing Operations)**
- Text prompt input
- Image generation (multiple variations)
- Style controls (realistic, artistic, etc.)
- Quick actions: "Download", "Regenerate", "Edit Prompt"

**View 2: Performance (Manager ROI)**
- ROI Card: $200/month savings (minimal)
- Before/After:
  - Creation time: 30 min (designer) → 2 min (AI)
  - Monthly images: 40 × 28 min saved = 18.7 hours
  - Cost: Designer $25/hour vs AI $0.02/image
- Image types generated (social media, emails, flyers)

**View 3: Historical (7-Day Trends)**
- Daily generation table (images, usage, cost)
- Insights: "Social media images most generated (65%)"
- Cost savings: $45/week average

### Key Implementation Notes
- Model: Stable Diffusion 2.1 or DALL-E 3 (if budget allows)
- Inference: 10-30 seconds per image (GPU required)
- Use case: Niche - most hotels use stock photos or designers
- Priority: Lowest (implement last)

---

## Implementation Order (Priority Ranked)

Based on ROI and business impact:

1. **Fraud Detection** ($1,200/month) - Highest ROI, prevents losses
2. **Recommendation System** ($900/month) - Revenue generation
3. **Food Recognition** ($800/month) - Waste reduction
4. **Document Extraction** ($720/month) - High time savings
5. **PPE Detection** ($650/month) - Safety compliance
6. **Question Answering** ($620/month) - Guest/staff efficiency
7. **Speech Transcription** ($550/month) - Meeting automation
8. **Semantic Search** ($520/month) - Knowledge base
9. **Text Summarization** ($480/month) - Review/meeting notes
10. **Entity Extraction** ($450/month) - Data entry automation
11. **Image Generation** ($200/month) - Low priority

**Total Additional ROI**: $6,690/month ($80,280/year)
**Combined Total (all 25 demos)**: $17,260/month ($207,120/year)

---

## Reusable Components Pattern

All 11 remaining demos should use these components:

```typescript
import {
  ViewTabs,
  ROICard,
  ROIMetrics,
  HistoricalTable,
  InsightsBox,
  TableFormatters,
} from '@/components/demos/shared';
```

### Standard View Structure

```typescript
const [currentView, setCurrentView] = useState<'operation' | 'performance' | 'historical'>('operation');

<ViewTabs
  currentView={currentView}
  views={[
    { id: 'operation', label: 'Operation', icon: '🎯' },
    { id: 'performance', label: 'Performance', icon: '📊' },
    { id: 'historical', label: 'Historical', icon: '📈' },
  ]}
  onChange={(view) => setCurrentView(view as any)}
/>
```

---

## Database Schema Pattern

All demos follow this pattern:

```sql
-- Daily records (operational data)
CREATE TABLE {demo_name}_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  date DATE NOT NULL,

  -- Demo-specific fields
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  confidence DECIMAL(3,2),

  -- Performance tracking
  processing_time_ms INTEGER,
  accuracy DECIMAL(5,2),

  -- Cost tracking
  cost DECIMAL(10,4) DEFAULT 0.00,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily aggregates (analytics)
CREATE TABLE {demo_name}_daily_stats (
  date DATE PRIMARY KEY,

  total_operations INTEGER NOT NULL,
  avg_accuracy DECIMAL(5,2),
  avg_processing_time_ms INTEGER,

  daily_cost DECIMAL(10,2),
  daily_savings DECIMAL(10,2),

  insights JSONB
);
```

---

## Spec Document Template

Each spec should include:

1. **Executive Summary** (Problem, Solution, ROI)
2. **System Architecture** (Technology choice, why not alternatives)
3. **Use Cases & Workflows** (Before/after examples)
4. **Model Architecture** (Technical details)
5. **Data Model** (PostgreSQL schemas)
6. **Algorithms & Logic** (Key functions explained)
7. **ROI Calculation** (Detailed formulas)
8. **Performance Targets** (Accuracy, speed, throughput)
9. **Implementation Notes** (Deployment options)
10. **UI Design** (Three-view architecture)
11. **Sample Data** (Demo examples)
12. **Comparison** (vs alternatives)
13. **Key Takeaways**

---

## Next Steps

1. **Review this guide** to understand patterns
2. **Prioritize remaining demos** (start with Fraud Detection)
3. **Create specs** using template (400-600 lines each)
4. **Implement demos** using three-view architecture (700-800 lines each)
5. **Commit after every 2 demos** (established pattern)
6. **Update progress doc** after each completion

---

## Success Criteria

Each completed demo must have:

- [ ] Comprehensive spec document (`.agent/docs/{demo}-spec.md`)
- [ ] Three-view architecture implemented
- [ ] ROI calculation with before/after metrics
- [ ] Historical table with 7-day sample data
- [ ] Insights demonstrating system learning
- [ ] Reusable components used consistently
- [ ] Sample data that tells a story
- [ ] Committed and pushed to repository

**Estimated time to complete**: 3-4 hours for all 11 demos (if following established patterns)

---

## Final Notes

The established pattern makes implementation straightforward:

1. **Spec first** - Clear technical architecture and ROI
2. **Three views** - Staff/Manager/Historical
3. **Sample data** - Realistic hotel operations
4. **System learning** - Show continuous improvement
5. **Commit frequency** - Every 1-2 demos

**Quality over speed**: Each demo should be production-ready, not just a proof-of-concept.

**Projected Final ROI**: $17,260/month ($207,120/year) across all 25 demos - compelling business case for hospitality AI adoption.
