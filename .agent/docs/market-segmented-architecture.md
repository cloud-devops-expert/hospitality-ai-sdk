# Market-Segmented Architecture (HARD RULE)

**Status**: MANDATORY - This is the correct architecture for hospitality B2B SaaS
**Last Updated**: 2025-10-23
**Replaces**: Single-architecture approaches

## Executive Summary

**Key Insight**: "One thing does not replace the other because the main purpose is to have business continuity."

Different hotel segments have **fundamentally different needs**:

- **Small hotels** (<50 rooms, 60% of market): No IT department, need cloud SaaS with offline caching
- **Medium/Large hotels** (50+ rooms, 40% of market): Have IT department, need on-premise with OFFLINE operation

**Both segments need web + mobile apps**, but they connect differently:
- Small hotels: Apps connect to cloud
- Medium/Large hotels: Apps connect to LOCAL Greengrass server (greengrass.local)

## Market Segmentation

### Segment 1: Small Hotels (60% of market)

**Profile**:
- **Size**: <50 rooms (boutiques, B&Bs, independent hotels)
- **IT**: No IT department, no server room
- **Budget**: $50-150/month for software
- **Tech**: Owner or front desk manager uses laptop + phone
- **Business Continuity**: Can't afford downtime, but rely on cloud (multi-region redundancy)

**Needs**:
- ✅ Web app (staff dashboard)
- ✅ Mobile app (staff on-the-go)
- ✅ Works 80% offline (Service Workers, IndexedDB)
- ✅ Simple setup (no hardware installation)
- ✅ Low monthly cost
- ❌ Can't manage on-premise server
- ❌ Can't afford $400+ hardware upfront

**Architecture**: CLOUD-FIRST
```
┌────────────────────────────────────────────────┐
│          SMALL HOTEL ARCHITECTURE              │
│         (Cloud-First SaaS Model)               │
└────────────────────────────────────────────────┘

┌──────────────────────────┐
│  STAFF DEVICES           │
│  (Laptop, Phone, Tablet) │
│                          │
│  ┌────────────────────┐  │
│  │  Web App           │  │  ← Service Workers (offline cache)
│  │  (Next.js PWA)     │  │  ← IndexedDB (local data)
│  │                    │  │  ← Transformers.js (browser ML)
│  └──────────┬─────────┘  │
│             │            │
│  ┌──────────┴─────────┐  │
│  │  Mobile App        │  │  ← React Native/Expo
│  │  (iOS/Android)     │  │  ← TensorFlow Lite (mobile ML)
│  │                    │  │  ← SQLite (local cache)
│  └──────────┬─────────┘  │
│             │            │
└─────────────┼────────────┘
              ▼
        INTERNET
              ▼
┌─────────────────────────────────────────────────┐
│          CLOUD INFRASTRUCTURE (AWS)             │
│  ┌───────────────────────────────────────────┐  │
│  │  Next.js API (Vercel/CloudFront)          │  │
│  │  ├─ Rate limiting per tenant              │  │
│  │  ├─ API key validation                    │  │
│  │  └─ Request routing                       │  │
│  └───────────────┬───────────────────────────┘  │
│                  │                               │
│       ┌──────────┼──────────┐                    │
│       ▼          ▼          ▼                    │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐       │
│  │Browser  │ │  Cloud  │ │   Aurora     │       │
│  │ML Cache │ │   ML    │ │  Serverless  │       │
│  │(Skip if │ │         │ │  (RLS)       │       │
│  │cached)  │ │         │ │              │       │
│  └─────────┘ └─────────┘ └──────────────┘       │
│               │                                  │
│       ┌───────┴────────┐                         │
│       ▼                ▼                         │
│  ┌──────────┐   ┌─────────────┐                 │
│  │ Timefold │   │ ML Services │                 │
│  │(ECS)     │   │(Lambda/ECS) │                 │
│  │          │   │             │                 │
│  │Room      │   │Sentiment    │                 │
│  │allocation│   │Vision       │                 │
│  │          │   │Speech       │                 │
│  └──────────┘   └─────────────┘                 │
└─────────────────────────────────────────────────┘
```

**Component Breakdown**:

**1. Web App (Next.js PWA)**
- Hosted on Vercel or CloudFront
- Service Workers for offline caching (last 24h of data)
- IndexedDB for local data storage (bookings, guest profiles)
- Transformers.js for browser ML (sentiment analysis, basic OCR)
- Works 80% offline, syncs when online
- Progressive Web App (installable on desktop)

**2. Mobile App (React Native/Expo)**
- iOS + Android native apps
- TensorFlow Lite for mobile ML (photo processing, OCR)
- SQLite for local cache (offline operation)
- Background sync when network available
- Expo OTA updates (no app store delays)

**3. Cloud APIs (AWS)**
- Aurora Serverless (PostgreSQL with RLS for multi-tenancy)
- Timefold on ECS (room allocation optimization)
- Lambda/ECS for ML (vision, speech when browser can't handle)
- S3 for document storage
- CloudWatch for monitoring

**Cost Model (Small Hotels)**:
```
MONTHLY COST PER PROPERTY:
- Aurora Serverless (RLS, multi-tenant): $20/month (shared across all tenants)
- Lambda/ECS (ML inference): $10/month (70% reduced by browser ML)
- Timefold ECS: $15/month (complex optimization)
- S3, CloudFront, misc: $5/month
- Total: ~$50/month per property (Starter tier)

ANNUAL COST (100 small hotels):
- Year 1: $60K ($50/month × 100 properties × 12 months)
- Marginal cost to add new property: ~$50/month
```

**Business Continuity Strategy**:
- Multi-region cloud deployment (us-east-1, us-west-2)
- Service Workers cache last 24h of critical data
- IndexedDB stores bookings, guest profiles offline
- When internet down: Read-only mode (view bookings, can't create new)
- CloudWatch alarms for downtime (auto-failover to standby region)

---

### Segment 2: Medium/Large Hotels (40% of market)

**Profile**:
- **Size**: 50+ rooms (full-service hotels, resorts, chains)
- **IT**: Have IT department, server room, network infrastructure
- **Budget**: Can afford $400-1000 upfront hardware + $100-300/month software
- **Tech**: IT manager, network admin, staff with desktop computers
- **Business Continuity**: MUST have offline operation (can't rely on internet)

**Needs**:
- ✅ On-premise server (OFFLINE operation!)
- ✅ Web app + mobile app (connect to LOCAL server, not cloud)
- ✅ Local database cache (PostgreSQL replica)
- ✅ IoT integration (room sensors, thermostats, door locks)
- ✅ All ML on-premise (<50ms latency)
- ✅ Works 100% offline (no internet needed)
- ✅ Cloud only for backups, cross-property analytics

**Architecture**: ON-PREMISE-FIRST

```
┌──────────────────────────────────────────────────────────┐
│          MEDIUM/LARGE HOTEL ARCHITECTURE                 │
│         (On-Premise-First with Cloud Sync)               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  PROPERTY NETWORK (LAN)                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │            AWS IoT GREENGRASS CORE                 │  │
│  │             (Intel NUC in server room)              │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Python ML Stack                             │  │  │
│  │  │  ├─ Sentiment (Transformers/DistilBERT)      │  │  │
│  │  │  ├─ Vision (YOLOv8 for room inspection)      │  │  │
│  │  │  ├─ Speech (Whisper for voice commands)      │  │  │
│  │  │  ├─ Forecasting (Prophet for occupancy)      │  │  │
│  │  │  └─ Optimization (Timefold for allocation)   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Local PostgreSQL Database (Replica)         │  │  │
│  │  │  ├─ Bookings, guests, rooms                  │  │  │
│  │  │  ├─ Syncs with cloud every 15 min            │  │  │
│  │  │  └─ Conflict resolution (local wins)         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  IoT Integration                             │  │  │
│  │  │  ├─ Room sensors (temperature, occupancy)    │  │  │
│  │  │  ├─ Smart thermostats (Nest, Ecobee)         │  │  │
│  │  │  ├─ Door locks (Salto, Assa Abloy)           │  │  │
│  │  │  └─ MQTT broker (local message bus)          │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                    │  │
│  │  FastAPI Server (http://greengrass.local:8000)    │  │
│  └────────────┬───────────────────────────────────────┘  │
│               │                                          │
│       ┌───────┴────────┐                                 │
│       ▼                ▼                                 │
│  ┌─────────┐    ┌──────────────┐                        │
│  │  STAFF  │    │  ON-PREMISE  │                        │
│  │ DEVICES │    │     PMS      │                        │
│  │         │    │  (Opera,etc) │                        │
│  │ Web app │◄───┤              │                        │
│  │connects │    │ Queries      │                        │
│  │to LOCAL │    │ greengrass   │                        │
│  │server   │    │ .local       │                        │
│  └─────────┘    └──────────────┘                        │
│                                                          │
└──────────────────┬───────────────────────────────────────┘
                   │
              INTERNET (Optional)
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│            CLOUD (AWS) - OPTIONAL                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Cross-Property Analytics (SageMaker)              │  │
│  │  ├─ Chain-wide benchmarking                        │  │
│  │  ├─ Model training (quarterly updates)             │  │
│  │  └─ Historical reporting                           │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Backups (S3)                                      │  │
│  │  ├─ Database snapshots (daily)                     │  │
│  │  ├─ Configuration backups                          │  │
│  │  └─ Disaster recovery                              │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Software Updates (IoT Core)                       │  │
│  │  ├─ OTA component updates                          │  │
│  │  ├─ Model updates (quarterly)                      │  │
│  │  └─ Security patches                               │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Component Breakdown**:

**1. AWS IoT Greengrass Core (On-Premise Server)**
- **Hardware**: Intel NUC 13 Pro ($580)
  - Intel Core i5-1340P (12 cores)
  - 16GB RAM
  - 512GB NVMe SSD
  - 1 Gbps ethernet
  - Sits in hotel server room

- **Software Stack**:
  - Ubuntu Server 22.04 LTS
  - AWS IoT Greengrass Core v2
  - Python 3.11
  - PostgreSQL 15 (local replica)
  - MQTT broker (Mosquitto)

- **ML Components** (Greengrass components):
  - Sentiment analysis (Transformers/DistilBERT)
  - Computer vision (YOLOv8 for room inspection)
  - Speech recognition (Whisper for voice commands)
  - Forecasting (Prophet for occupancy prediction)
  - Optimization (Timefold for room allocation)

- **Performance**:
  - Inference latency: <50ms (local network)
  - PMS integration: <20ms (local database query)
  - Throughput: 100+ req/sec
  - Uptime: 99.9% (local operation, no cloud dependency)

**2. Local Database (PostgreSQL Replica)**
- Full replica of cloud database (bookings, guests, rooms)
- Bi-directional sync with cloud (every 15 minutes)
- Conflict resolution: Local wins (property has authority)
- Works 100% offline (no cloud needed)
- Automatic backup to cloud (daily snapshots)

**3. IoT Integration**
- Room sensors (temperature, occupancy, humidity)
- Smart thermostats (Nest, Ecobee integration)
- Smart door locks (Salto, Assa Abloy integration)
- MQTT broker (local message bus for IoT devices)
- Real-time event processing (maintenance alerts, energy optimization)

**4. Web + Mobile Apps (Connect to LOCAL Server)**
- **Web app**: Connects to `http://greengrass.local:8000` (NOT cloud!)
- **Mobile app**: Connects to `http://<greengrass-ip>:8000` (property LAN)
- Same apps as small hotels, but configured for local endpoint
- No internet needed (100% offline operation)
- Faster response times (<100ms vs 500ms cloud)

**5. On-Premise PMS Integration**
- PMS queries Greengrass API via local network (<20ms)
- No cloud roundtrip (500ms saved per request)
- Works when internet is down
- Better security (data never leaves property)

**Cost Model (Medium/Large Hotels)**:
```
ONE-TIME COSTS:
- Intel NUC 13 Pro: $580 (hardware)
- Installation: $100 (IT staff setup, or remote support)
- Total upfront: $680 per property

MONTHLY COSTS:
- AWS IoT Core: $17/month (device connection)
- Data transfer: $5/month (lightweight sync)
- Total: $22/month per property

ANNUAL COST (100 medium/large hotels):
- Year 1: $68K (hardware) + $26K (AWS) = $94K
- Year 2: $26K (AWS only, no new hardware)
- Year 3: $26K (AWS only)
- 3-Year Total: $146K (100 properties)

MARGINAL COST PER INFERENCE:
- Sentiment analysis: $0 (runs on-premise)
- Vision: $0 (runs on-premise)
- Speech: $0 (runs on-premise)
- Optimization: $0 (runs on-premise after model loaded)
- Total: Near-$0 marginal cost
```

**Business Continuity Strategy (OFFLINE-CAPABLE)**:
- **100% offline operation** (no internet needed)
- Local database replica (all critical data on-premise)
- Local ML inference (no cloud API calls)
- IoT integration works locally (MQTT broker on Greengrass)
- When internet down:
  - ✅ All operations continue normally
  - ✅ ML inference works
  - ✅ Database queries work
  - ✅ PMS integration works
  - ✅ IoT devices work
  - ⏸️ Cloud sync pauses (resumes when online)
  - ⏸️ Cross-property analytics unavailable
- High availability option: 2x Greengrass devices (active-active)
- Disaster recovery: Daily backups to cloud (S3)

---

## Comparison: Small vs Medium/Large Hotels

| Criterion | Small Hotels (60%) | Medium/Large Hotels (40%) |
|-----------|-------------------|--------------------------|
| **Size** | <50 rooms | 50+ rooms |
| **IT Department** | ❌ No | ✅ Yes |
| **Primary Architecture** | Cloud SaaS | On-Premise Greengrass |
| **Hardware** | None | Intel NUC ($580) |
| **Monthly Cost** | $50-150 | $22 (after hardware) |
| **Upfront Cost** | $0 | $680 |
| **Offline Operation** | 80% (cached data) | 100% (full replica) |
| **Latency** | 200-1000ms (cloud) | <50ms (local network) |
| **ML Inference** | Browser/Mobile + Cloud | On-Premise (Greengrass) |
| **Business Continuity** | Multi-region cloud | OFFLINE-CAPABLE |
| **IoT Integration** | ❌ Limited | ✅ Full (MQTT, sensors) |
| **PMS Integration** | Cloud API (500ms) | Local network (<20ms) |
| **Data Residency** | Cloud (multi-tenant) | On-Premise (single-tenant) |
| **Security** | Cloud (shared infra) | On-Premise (owned hardware) |
| **Setup Complexity** | Low (SaaS signup) | Medium (IT staff setup) |

## Why Cloudflare Workers DON'T Help

**User's insight**: "Cloudflare Workers do not contribute for business continuity."

**Why this is correct**:

1. **Still Cloud-Dependent**
   - Cloudflare Workers run on Cloudflare's edge (200+ data centers)
   - If internet down, Workers are unreachable
   - No offline operation capability

2. **No Help for Small Hotels**
   - Small hotels already use browser/mobile ML (runs on device)
   - For complex operations, they need cloud APIs anyway (Timefold, database)
   - Workers add latency (100-400ms) vs browser (50-200ms)

3. **No Help for Medium/Large Hotels**
   - Need **100% offline operation** (on-premise Greengrass)
   - Workers require internet connection
   - Can't access local IoT devices
   - Can't integrate with on-premise PMS
   - Can't query local database

4. **When Workers MIGHT Make Sense** (future consideration):
   - Multi-tenant request routing (assign small hotel requests to nearest cloud region)
   - Global CDN for static assets (faster page loads)
   - DDoS protection (rate limiting)
   - But NOT for ML inference or business continuity

## Implementation Priority

**Month 1-3: Small Hotels (HIGHEST PRIORITY - 60% of market)**
- ✅ Build Next.js web app with Service Workers
- ✅ Build React Native mobile app with TensorFlow Lite
- ✅ Implement browser ML (Transformers.js for sentiment)
- ✅ Deploy Timefold on AWS ECS (room allocation)
- ✅ Set up Aurora Serverless with RLS (multi-tenant database)
- ✅ Cloud ML services (Lambda/ECS for vision, speech)

**Month 2-4: Medium/Large Hotels (HIGH PRIORITY - 40% of market)**
- ✅ Build AWS IoT Greengrass components (sentiment, vision, speech)
- ✅ Configure web/mobile apps to connect to greengrass.local
- ✅ Set up PostgreSQL local replica (bi-directional sync)
- ✅ Implement IoT integration (MQTT, room sensors)
- ✅ Deploy Timefold on Greengrass (on-premise optimization)
- ✅ Pilot with 5 properties, scale to 50

**Month 4-6: Both Segments**
- Optimize browser ML models (ONNX quantization)
- Optimize Greengrass ML models (model compression)
- Cross-property analytics (both segments)
- Model training pipeline (quarterly updates)

## Pricing Strategy

**Small Hotels (Starter Tier - $99/month)**:
- Up to 50 rooms
- Web + mobile apps
- Browser/mobile ML (sentiment, OCR)
- Cloud APIs (Timefold, database, storage)
- 80% offline operation (cached data)
- Email support

**Medium Hotels (Professional Tier - $299/month)**:
- 50-200 rooms
- On-premise Greengrass server (included)
- 100% offline operation
- IoT integration (up to 50 devices)
- Priority support
- **One-time setup fee**: $680 (hardware + installation)

**Large Hotels (Enterprise Tier - Custom)**:
- 200+ rooms
- Multiple Greengrass servers (HA setup)
- Unlimited IoT devices
- Custom integrations (PMS, channel managers)
- Dedicated account manager
- **One-time setup fee**: $1,500-3,000 (hardware + custom setup)

## Cost Projections (Year 1 - 100 Customers)

**Breakdown: 60 Small + 40 Medium/Large**

**Small Hotels (60 properties)**:
- Revenue: $99/month × 60 × 12 months = $71,280
- Costs: $50/month × 60 × 12 months = $36,000 (cloud infra)
- **Gross Profit**: $35,280 (49% margin)

**Medium/Large Hotels (40 properties)**:
- Revenue: $299/month × 40 × 12 months = $143,520
- Setup fees: $680 × 40 = $27,200 (one-time)
- Costs:
  - Hardware: $580 × 40 = $23,200 (one-time)
  - AWS IoT: $22/month × 40 × 12 months = $10,560
  - Installation: $100 × 40 = $4,000 (one-time)
- **Gross Profit**: $143,520 + $27,200 - $23,200 - $10,560 - $4,000 = $132,960 (78% margin)

**Year 1 Total (100 properties)**:
- Revenue: $71,280 + $143,520 + $27,200 = $242,000
- Costs: $36,000 + $23,200 + $10,560 + $4,000 = $73,760
- **Gross Profit**: $168,240 (69% margin)
- **EBITDA**: ~$120,000 (50% margin after OpEx)

## Summary

**Market-Segmented Architecture is the ONLY correct approach**:

1. **Small Hotels** (60% of market):
   - Cloud-first SaaS (web + mobile apps)
   - Browser/mobile ML (70% of operations)
   - Cloud APIs for complex tasks (30%)
   - Business continuity: Multi-region cloud + offline caching
   - Cost: $99/month per property

2. **Medium/Large Hotels** (40% of market):
   - On-premise-first (Greengrass server)
   - Web/mobile apps connect to LOCAL server (greengrass.local)
   - 100% OFFLINE operation (business continuity!)
   - All ML on-premise (<50ms latency)
   - IoT integration (sensors, thermostats, locks)
   - Cost: $299/month + $680 setup fee

**Key Principle**: "The main purpose is to have business continuity"
- Small hotels: Cloud redundancy (can't manage on-premise)
- Medium/Large hotels: OFFLINE operation (can't rely on cloud)
- **Cloudflare Workers don't help** (still cloud-dependent)

**Both segments need web + mobile apps**, but they connect differently:
- Small: Apps → Cloud
- Medium/Large: Apps → greengrass.local (on-premise)

**This architecture serves 100% of the market** with appropriate solutions for each segment.

---

**References**:
- `.agent/docs/iot-greengrass-architecture.md` - Greengrass technical details
- `.agent/docs/local-first-ml-architecture.md` - Browser/mobile ML implementation
- `.agent/docs/financial-projections.md` - Revenue model
