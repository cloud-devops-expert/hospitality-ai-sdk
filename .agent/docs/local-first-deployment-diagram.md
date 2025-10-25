# Local-First ML Deployment Architecture

**Created:** 2025-10-25
**For:** Phase 4 ML Demos (Forecasting, Image Generation, Recommendations)

---

## Overview: Two Deployment Strategies

The Hospitality AI SDK uses **two different local-first architectures** depending on the use case:

1. **Browser/Mobile Local-First** - For guest-facing consumer apps (60% of market)
2. **AWS IoT Greengrass** - For B2B staff operations (40% of market)

---

## Architecture 1: Browser/Mobile Local-First (Guest-Facing Apps)

**Target Market:** Small Hotels (<50 rooms, no IT department) - 60% of market

### Three-Tier Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIER 1: BROWSER/DEVICE                          │
│                         95% of operations - $0 cost                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────┐    ┌───────────────────────────────┐ │
│  │    WEB BROWSER (Guest)       │    │    MOBILE APP (Guest)         │ │
│  │                              │    │                               │ │
│  │  Technologies:               │    │  Technologies:                │ │
│  │  • Transformers.js           │    │  • TensorFlow Lite            │ │
│  │  • TensorFlow.js             │    │  • ML Kit (Google)            │ │
│  │  • ONNX Runtime Web          │    │  • ONNX Runtime Mobile        │ │
│  │  • Web Workers               │    │  • React Native + Expo        │ │
│  │                              │    │                               │ │
│  │  Phase 4 ML Demos:           │    │  Phase 4 ML Demos:            │ │
│  │  ✅ Sentiment Analysis       │    │  ✅ Sentiment Analysis        │ │
│  │  ✅ Translation (59 langs)   │    │  ✅ Food Recognition          │ │
│  │  ✅ Question Answering       │    │  ✅ PPE Detection             │ │
│  │  ✅ Text Summarization       │    │  ✅ Room Inspection           │ │
│  │  ✅ Semantic Search          │    │  ✅ OCR (ID scanning)         │ │
│  │  ⚠️  Forecasting (limited)   │    │  ⚠️  Forecasting (limited)    │ │
│  │  ❌ Image Gen (placeholder)  │    │  ❌ Image Gen (placeholder)   │ │
│  │  ⚠️  Recommendations         │    │  ⚠️  Recommendations          │ │
│  │                              │    │                               │ │
│  │  Performance:                │    │  Performance:                 │ │
│  │  • Latency: 50-200ms         │    │  • Latency: 50-150ms          │ │
│  │  • Model Size: <50MB         │    │  • Model Size: <50MB          │ │
│  │  • Offline: ✅ Yes           │    │  • Offline: ✅ Yes            │ │
│  │  • Cost: $0                  │    │  • Cost: $0                   │ │
│  └──────────────┬───────────────┘    └───────────────┬───────────────┘ │
│                 │                                      │                 │
└─────────────────┼──────────────────────────────────────┼─────────────────┘
                  │                                      │
                  │  Fallback (if browser/device can't handle)
                  │                                      │
                  ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      TIER 2: EDGE COMPUTE                               │
│                      4% of operations - LOW cost                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  CLOUDFLARE WORKERS / VERCEL EDGE FUNCTIONS                    │    │
│  │                                                                 │    │
│  │  Technologies:                                                  │    │
│  │  • WebAssembly (WASM)                                          │    │
│  │  • ONNX Runtime (edge)                                         │    │
│  │  • Transformers.js (edge)                                      │    │
│  │  • Global CDN (50-100ms from any user)                         │    │
│  │                                                                 │    │
│  │  Phase 4 ML Demos:                                             │    │
│  │  ✅ Sentiment Analysis (lightweight models)                    │    │
│  │  ✅ Translation (cached results)                               │    │
│  │  ⚠️  Forecasting (statistical methods)                         │    │
│  │  ❌ Image Generation (too heavy for edge)                      │    │
│  │  ⚠️  Recommendations (cached, simple)                          │    │
│  │                                                                 │    │
│  │  Performance:                                                   │    │
│  │  • Latency: 100-400ms                                          │    │
│  │  • Cost: $0.50 per 1M requests                                 │    │
│  │  • Deployment: 300+ global edge locations                      │    │
│  └────────────────────────────┬───────────────────────────────────┘    │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │
                                  │  Fallback (rare, opt-in)
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   TIER 3: CLOUD APIs (LAST RESORT)                      │
│                   1% of operations - HIGHER cost                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  AWS CLOUD SERVICES (Opt-in Premium Features)                  │    │
│  │                                                                 │    │
│  │  Technologies:                                                  │    │
│  │  • AWS SageMaker (model training)                              │    │
│  │  • AWS Lambda (serverless ML)                                  │    │
│  │  • ECS/Fargate (containerized models)                          │    │
│  │  • OpenAI API (complex LLM tasks)                              │    │
│  │                                                                 │    │
│  │  Phase 4 ML Demos:                                             │    │
│  │  ✅ Image Generation (SDXL - Stable Diffusion XL)              │    │
│  │  ✅ Advanced Forecasting (Prophet, ARIMA)                      │    │
│  │  ✅ Deep Learning Recommendations (Neural CF)                  │    │
│  │  ⚠️  Complex NLP (GPT-4, Claude)                               │    │
│  │                                                                 │    │
│  │  Performance:                                                   │    │
│  │  • Latency: 800-2000ms                                         │    │
│  │  • Cost: $0.001-0.05 per request                               │    │
│  │  • Usage: User opts-in explicitly                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram (Browser Local-First)

```
┌──────────────┐
│ Guest Device │
│ (Browser)    │
└──────┬───────┘
       │
       │ 1. Request ML inference
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Decision: Can browser handle this?                      │
│ • Model size <50MB?          ✅ Yes → Browser           │
│ • Offline capability needed? ✅ Yes → Browser           │
│ • Privacy sensitive?         ✅ Yes → Browser           │
│ • Complex vision/gen AI?     ❌ No  → Edge/Cloud        │
└──────┬───────────────────────────────┬──────────────────┘
       │                               │
       │ 95% (Browser)                 │ 5% (Fallback)
       ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ Browser ML       │          │ Edge Compute     │
│ • Transformers.js│          │ • Cloudflare     │
│ • TensorFlow.js  │          │ • Vercel Edge    │
│ • <200ms         │          │ • <400ms         │
│ • $0 cost        │          │ • $0.50/1M       │
└──────┬───────────┘          └──────┬───────────┘
       │                             │
       │ Result                      │ Result
       │                             │
       ▼                             ▼
┌──────────────────────────────────────┐
│ Cache Result (IndexedDB)             │
│ • Offline access                     │
│ • Faster subsequent requests         │
└──────┬───────────────────────────────┘
       │
       │ 3. Return result to UI
       ▼
┌──────────────┐
│ Guest sees   │
│ ML result    │
│ <200ms       │
└──────────────┘
```

### Cost Comparison (Browser Local-First vs. Cloud)

| Scenario | Browser Local-First | Cloud-Heavy | Savings |
|----------|---------------------|-------------|---------|
| **100 properties, 1K guests each** | | | |
| Sentiment analysis (10K req/day) | $0 | $3,650/month | $43,800/year |
| Translation (5K req/day) | $0 | $1,000/month | $12,000/year |
| Question answering (3K req/day) | $0 | $540/month | $6,480/year |
| Food recognition (2K images/day) | $0 | $3,000/month | $36,000/year |
| **TOTAL** | **$0/month** | **$8,190/month** | **$98,280/year** |

**ROI:** 100% cost savings for local-first operations

---

## Architecture 2: AWS IoT Greengrass (B2B Staff Operations)

**Target Market:** Medium/Large Hotels (50+ rooms, have IT staff) - 40% of market

### Greengrass Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROPERTY PREMISES                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FRONT DESK / STAFF WORKSTATIONS                                │   │
│  │                                                                  │   │
│  │  • Front desk app (Next.js)                                     │   │
│  │  • Housekeeping app (iPad)                                      │   │
│  │  • Management dashboard (React)                                 │   │
│  │                                                                  │   │
│  │  Queries Greengrass via local network: http://greengrass.local │   │
│  └────────────────────────────┬─────────────────────────────────────┘   │
│                               │                                          │
│                               │ Local network (1 Gbps LAN)              │
│                               │ <50ms latency                            │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  AWS IOT GREENGRASS CORE DEVICE                                 │   │
│  │  (Intel NUC 13 Pro - $580)                                      │   │
│  │                                                                  │   │
│  │  Hardware:                                                       │   │
│  │  • CPU: Intel i5-1340P (12 cores)                               │   │
│  │  • RAM: 16GB DDR4                                               │   │
│  │  • Storage: 512GB NVMe SSD                                      │   │
│  │  • Network: 1 Gbps Ethernet                                     │   │
│  │  • Power: 28W                                                    │   │
│  │                                                                  │   │
│  │  Software Stack:                                                 │   │
│  │  • AWS IoT Greengrass Core v2.12                                │   │
│  │  • Ubuntu Server 22.04 LTS                                      │   │
│  │  • Python 3.11                                                   │   │
│  │  • PyTorch 2.1                                                   │   │
│  │  • TensorFlow 2.15                                              │   │
│  │  • Transformers 4.36                                            │   │
│  │  • scikit-learn 1.3                                             │   │
│  │  • FastAPI 0.104                                                │   │
│  │                                                                  │   │
│  │  Greengrass Components (Services):                              │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ com.hospitality.sentiment (Port 8001)                    │  │   │
│  │  │ • DistilBERT-base                                        │  │   │
│  │  │ • Sentiment analysis <50ms                               │  │   │
│  │  │ • Guest reviews, feedback                                │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ com.hospitality.vision (Port 8002)                       │  │   │
│  │  │ • YOLOv8 (object detection)                              │  │   │
│  │  │ • Room inspection <50ms                                  │  │   │
│  │  │ • PPE detection, facility monitoring                     │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ com.hospitality.speech (Port 8003)                       │  │   │
│  │  │ • Whisper Base (74M params)                              │  │   │
│  │  │ • Speech-to-text <4s (60s audio)                         │  │   │
│  │  │ • Voice commands, transcription                          │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ com.hospitality.forecasting (Port 8004)                  │  │   │
│  │  │ • Prophet / ARIMA / statsmodels                          │  │   │
│  │  │ • Occupancy forecasting <1s                              │  │   │
│  │  │ • Revenue, demand prediction                             │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ com.hospitality.recommendations (Port 8005)              │  │   │
│  │  │ • Collaborative filtering (scikit-learn)                 │  │   │
│  │  │ • Room/service recommendations <100ms                    │  │   │
│  │  │ • Upsell, upgrade suggestions                            │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ com.hospitality.api (Port 8000)                          │  │   │
│  │  │ • FastAPI gateway                                        │  │   │
│  │  │ • Routes to all ML services                              │  │   │
│  │  │ • Health checks, monitoring                              │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  Performance:                                                    │   │
│  │  • Latency: <50ms (local network)                               │   │
│  │  • Throughput: 100+ req/sec                                     │   │
│  │  • Uptime: 99.9%                                                 │   │
│  │  • Offline: ✅ Fully functional                                 │   │
│  └───────────────────┬──────────────────────────────────────────────┘   │
│                      │                                                   │
│                      │ Sync every 15 minutes (lightweight)              │
│                      ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ON-PREMISE PMS (Property Management System)                    │   │
│  │                                                                  │   │
│  │  • Guest profiles                                               │   │
│  │  • Bookings, reservations                                       │   │
│  │  • Room status                                                   │   │
│  │                                                                  │   │
│  │  Greengrass queries PMS via local network: <20ms               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ Internet (HTTPS only, Port 443)
                               │ Component updates, metrics sync
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD (MINIMAL)                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  AWS IoT Core                                                 │      │
│  │  • Device management                                          │      │
│  │  • Component deployment (S3 → Greengrass)                     │      │
│  │  • Monitoring (CloudWatch)                                    │      │
│  │  • Cost: $17/month per device                                │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  Cross-Property Analytics (Batch, 1% of operations)          │      │
│  │  • AWS SageMaker (model training, quarterly)                 │      │
│  │  • AWS Batch (historical reports, monthly)                   │      │
│  │  • Multi-property benchmarking                               │      │
│  │  • Cost: $100/month for 100 properties                       │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow (Greengrass B2B)

```
┌──────────────────┐
│ Front Desk Staff │
│ (Staff App)      │
└────────┬─────────┘
         │
         │ 1. Request ML inference (e.g., analyze guest feedback)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Staff App (Browser/iPad)                                        │
│                                                                  │
│ Makes HTTP request to Greengrass on local network:              │
│ POST http://greengrass.local:8001/analyze                       │
│ {                                                                │
│   "text": "The room was wonderful but check-in was slow",       │
│   "context": "guest_feedback"                                   │
│ }                                                                │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ 2. Request travels over LAN (1 Gbps, <5ms)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Greengrass Core Device (Intel NUC)                              │
│                                                                  │
│ FastAPI service receives request at Port 8001                   │
│ Forwards to Sentiment Component (com.hospitality.sentiment)     │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ 3. Local inference (Python, PyTorch, DistilBERT)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ ML Inference (On-Device)                                        │
│                                                                  │
│ • Load DistilBERT model (cached in memory)                      │
│ • Run inference on CPU (Intel i5)                               │
│ • Processing time: 42ms                                         │
│ • Result: {"sentiment": "mixed", "score": 0.68}                 │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ 4. Optional: Query PMS for guest context (local network)
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ On-Premise PMS (Property Management System)                     │
│                                                                  │
│ GET http://pms.local:8080/api/guests/12345                      │
│ • Guest name, loyalty status, booking history                   │
│ • <20ms latency (local database query)                          │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ 5. Return enriched result
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Response to Staff App                                           │
│                                                                  │
│ {                                                                │
│   "sentiment": "mixed",                                          │
│   "score": 0.68,                                                 │
│   "label": "MIXED",                                              │
│   "source": "greengrass-edge",                                   │
│   "latency_ms": 42,                                              │
│   "guest_context": {                                             │
│     "name": "John Smith",                                        │
│     "loyalty_status": "gold",                                    │
│     "previous_stays": 12                                         │
│   },                                                             │
│   "recommendation": "Contact guest immediately - VIP member"     │
│ }                                                                │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ 6. Display to staff (total: <100ms end-to-end)
         │
         ▼
┌──────────────────┐
│ Staff sees alert │
│ "VIP guest mixed │
│ feedback - call  │
│ manager"         │
└──────────────────┘
```

### Cost Comparison (Greengrass vs. Cloud-Heavy)

**Scenario:** 100 properties, 100 ML requests/day per property

| Year | Greengrass (On-Premise) | Cloud-Heavy (AWS APIs) | Savings |
|------|-------------------------|------------------------|---------|
| **Year 1** | | | |
| Hardware (one-time) | $58,000 | $0 | -$58,000 |
| AWS IoT Core | $20,400 | $0 | +$20,400 |
| Cloud APIs | $0 | $365,000 | **$365,000** |
| Lambda/ECS | $0 | $120,000 | **$120,000** |
| S3 Storage | $6,000 | $60,000 | **$54,000** |
| **Year 1 Total** | **$84,400** | **$545,000** | **$460,600 (84%)** |
| | | | |
| **Year 2** | | | |
| New devices (100) | $58,000 | $0 | -$58,000 |
| AWS IoT Core | $40,800 | $0 | +$40,800 |
| Cloud APIs | $0 | $730,000 | **$730,000** |
| Lambda/ECS | $0 | $240,000 | **$240,000** |
| S3 Storage | $12,000 | $120,000 | **$108,000** |
| **Year 2 Total** | **$110,800** | **$1,090,000** | **$979,200 (90%)** |
| | | | |
| **Year 3** | | | |
| New devices (100) | $58,000 | $0 | -$58,000 |
| AWS IoT Core | $61,200 | $0 | +$61,200 |
| Cloud APIs | $0 | $1,095,000 | **$1,095,000** |
| Lambda/ECS | $0 | $360,000 | **$360,000** |
| S3 Storage | $18,000 | $180,000 | **$162,000** |
| **Year 3 Total** | **$137,200** | **$1,635,000** | **$1,497,800 (92%)** |
| | | | |
| **3-Year Total** | **$332,400** | **$3,270,000** | **$2,937,600 (90%)** |

**ROI:** 9x return on investment over 3 years

---

## Phase 4 ML Demos: Deployment Mapping

| ML Demo | Browser Local-First | Greengrass (B2B) | Cloud (Fallback) |
|---------|---------------------|------------------|------------------|
| **Occupancy Forecasting** | ⚠️ Limited (statistical only) | ✅ **PRIMARY** (Prophet, ARIMA) | ✅ Advanced (SageMaker) |
| **Room Visualization (Image Gen)** | ❌ Placeholder only | ❌ Placeholder only | ✅ **PRIMARY** (SDXL, Stable Diffusion) |
| **Guest Recommendations** | ⚠️ Simple (collaborative) | ✅ **PRIMARY** (hybrid CF+CB) | ✅ Advanced (Neural CF) |
| **Sentiment Analysis** | ✅ **PRIMARY** (DistilBERT) | ✅ **PRIMARY** (DistilBERT) | ⚠️ Fallback (GPT-4) |
| **Food Recognition** | ✅ Good (ViT-base) | ✅ **PRIMARY** (YOLOv8) | ⚠️ Fallback (Google Vision) |
| **PPE Detection** | ⚠️ Limited (small DETR) | ✅ **PRIMARY** (DETR-ResNet) | ⚠️ Fallback (AWS Rekognition) |

**Legend:**
- ✅ **PRIMARY** - Best performance, use this tier
- ✅ Good - Acceptable performance
- ⚠️ Limited - Works but constrained
- ❌ Not suitable - Use higher tier

---

## Summary: Which Architecture When?

### Use **Browser/Mobile Local-First** when:
- ✅ Guest-facing consumer apps
- ✅ Small properties (<50 rooms, no IT staff)
- ✅ Privacy-sensitive operations (guest data)
- ✅ Offline capability required
- ✅ Simple ML tasks (sentiment, translation, basic vision)
- ✅ Zero marginal cost target

### Use **AWS IoT Greengrass** when:
- ✅ B2B staff operations
- ✅ Medium/large properties (50+ rooms, have IT)
- ✅ Complex ML tasks (forecasting, optimization, advanced vision)
- ✅ PMS integration required (<20ms local queries)
- ✅ Full Python ML stack needed (PyTorch, TensorFlow)
- ✅ On-premise data compliance (GDPR, HIPAA, PCI)

### Use **Cloud APIs** when:
- ⚠️ Model >100MB (can't fit on device)
- ⚠️ GPU required (user device doesn't have)
- ⚠️ User explicitly opts-in (premium feature)
- ⚠️ Batch processing (not real-time)
- ⚠️ Cross-property analytics

---

## Implementation Priority

### Phase 1 (Month 1-2): Browser Local-First
**Target:** Guest-facing apps (60% of market)

- [ ] Install Transformers.js
- [ ] Implement browser sentiment analysis
- [ ] Add TensorFlow.js for image classification
- [ ] Create Web Worker for background processing
- [ ] Test on Chrome, Firefox, Safari

**Deliverable:** 90%+ guest operations run in browser at $0 cost

### Phase 2 (Month 2-3): Greengrass Pilot
**Target:** B2B staff operations (40% of market)

- [ ] Develop Greengrass components (sentiment, vision, speech)
- [ ] Deploy 5 pilot devices (3x NUC, 1x Jetson, 1x Pi)
- [ ] Test on-premise PMS integration
- [ ] Measure performance (<50ms latency target)

**Deliverable:** 5 properties running on-premise ML

### Phase 3 (Month 3-6): Scale Both
**Target:** 100 properties (60 browser, 40 Greengrass)

- [ ] Browser: Mobile app (React Native + TensorFlow Lite)
- [ ] Greengrass: Deploy 40 devices
- [ ] Cloud: Batch processing only (1% of operations)

**Deliverable:** 95%+ operations local/edge, <5% cloud

---

**This diagram was created for the Phase 4 ML demos. For questions, see `.agent/docs/local-first-ml-architecture.md` or `.agent/docs/iot-greengrass-architecture.md`**
