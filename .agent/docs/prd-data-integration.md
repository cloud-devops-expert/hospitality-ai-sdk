# Product Requirements Document: External Data Integration

**Version:** 1.0
**Date:** October 23, 2025
**Status:** Draft
**Owner:** Product Team

---

## Executive Summary

The Hospitality AI SDK currently operates with synthetic demo data. To deliver production value, we need to integrate with external Property Management Systems (PMS), Channel Managers, Point of Sale (POS) systems, and other hospitality data sources. This PRD outlines the architecture, requirements, and implementation plan for a flexible, secure, and scalable data integration layer.

### Key Objectives
- Enable ingestion of real hotel operational data from multiple sources
- Support both real-time and batch data synchronization
- Maintain data quality, security, and privacy standards
- Provide a unified data model across disparate systems
- Enable seamless migration from demo to production data

---

## Problem Statement

### Current State
- All AI/ML modules use synthetic data generators
- No mechanism to connect to real hotel systems
- Limited ability to test with real-world data patterns
- Cannot deliver production-ready deployments

### Desired State
- Plug-and-play integration with major PMS vendors
- Automated data synchronization and validation
- Real-time event streaming for time-sensitive insights
- Historical data import for ML model training
- Unified data access layer for all SDK modules

---

## Goals & Success Metrics

### Business Goals
1. Enable production deployments for paying customers
2. Support top 10 PMS vendors (80% market coverage)
3. Reduce implementation time from weeks to days
4. Achieve 99.9% data synchronization accuracy

### Technical Goals
1. Sub-second latency for real-time data access
2. Support 10,000+ bookings/day ingestion rate
3. 99.95% uptime for integration services
4. Zero data loss during synchronization

### Success Metrics
| Metric | Target | Timeline |
|--------|--------|----------|
| PMS Integrations | 5 vendors | Q1 2026 |
| Data Sync Accuracy | 99.9% | Q1 2026 |
| API Response Time | <200ms | Q1 2026 |
| Customer Implementations | 10 hotels | Q2 2026 |
| Integration Setup Time | <4 hours | Q2 2026 |

---

## User Stories

### Hotel Manager
- **As a** hotel manager, **I want to** connect my PMS to the AI SDK **so that** I can get insights based on my actual data
- **As a** hotel manager, **I want to** see real-time occupancy forecasts **so that** I can make pricing decisions instantly
- **As a** hotel manager, **I want to** automatically sync guest data **so that** segmentation is always up-to-date

### IT Administrator
- **As an** IT admin, **I want to** configure integrations via UI **so that** I don't need to write code
- **As an** IT admin, **I want to** monitor data sync status **so that** I can troubleshoot issues quickly
- **As an** IT admin, **I want to** control data access permissions **so that** sensitive information is protected

### Developer
- **As a** developer, **I want to** use standardized APIs **so that** I can build custom integrations
- **As a** developer, **I want to** access webhooks for real-time events **so that** I can trigger automations
- **As a** developer, **I want to** test with sample data **so that** I can develop without production access

---

## Target Data Sources

### Priority 1: Core PMS Systems
1. **Opera Cloud** (Oracle) - 30% market share
2. **Cloudbeds** - 15% market share
3. **Mews** - 10% market share
4. **RMS Cloud** - 8% market share
5. **Stayntouch** - 7% market share

### Priority 2: Channel Managers
1. **SiteMinder**
2. **Channel Manager** (Booking.com)
3. **Expedia Connectivity**
4. **Airbnb API**

### Priority 3: Ancillary Systems
1. **POS Systems** (Micros, Square, Toast)
2. **Review Platforms** (TripAdvisor, Google Reviews, Booking.com)
3. **Revenue Management** (IDeaS, Duetto)
4. **Housekeeping** (Optii, Alice)

### Priority 4: Analytics & BI
1. **Google Analytics**
2. **Tableau**
3. **Power BI**
4. **Custom Data Warehouses**

---

## Functional Requirements

### FR-1: Integration Configuration
- **FR-1.1:** Web-based configuration UI for adding/removing integrations
- **FR-1.2:** Support for multiple authentication methods (API keys, OAuth 2.0, Basic Auth)
- **FR-1.3:** Connection testing and validation before activation
- **FR-1.4:** Integration templates for common PMS vendors
- **FR-1.5:** Custom field mapping for non-standard data structures

### FR-2: Data Synchronization
- **FR-2.1:** Real-time sync for critical events (bookings, cancellations, check-ins)
- **FR-2.2:** Scheduled batch sync for historical data (hourly, daily, weekly)
- **FR-2.3:** Incremental updates to minimize data transfer
- **FR-2.4:** Conflict resolution for duplicate/overlapping data
- **FR-2.5:** Automatic retry with exponential backoff for failed syncs

### FR-3: Data Transformation
- **FR-3.1:** Unified data schema across all source systems
- **FR-3.2:** Automatic data type conversion and validation
- **FR-3.3:** Custom transformation rules via configuration
- **FR-3.4:** Data enrichment (e.g., geocoding, currency conversion)
- **FR-3.5:** PII detection and masking

### FR-4: Data Quality
- **FR-4.1:** Validation rules for required fields
- **FR-4.2:** Duplicate detection and deduplication
- **FR-4.3:** Data anomaly detection (outliers, null values)
- **FR-4.4:** Data quality dashboard with metrics
- **FR-4.5:** Alerting for data quality issues

### FR-5: Real-Time Events
- **FR-5.1:** Webhook support for outbound events
- **FR-5.2:** WebSocket streaming for live data feeds
- **FR-5.3:** Event filtering and routing
- **FR-5.4:** Event replay for debugging
- **FR-5.5:** Rate limiting and throttling

### FR-6: Historical Data Import
- **FR-6.1:** Bulk CSV/Excel import for initial setup
- **FR-6.2:** API endpoints for programmatic data loading
- **FR-6.3:** Date range selection for partial imports
- **FR-6.4:** Progress tracking for long-running imports
- **FR-6.5:** Validation before committing imported data

### FR-7: Monitoring & Observability
- **FR-7.1:** Integration health dashboard
- **FR-7.2:** Sync status per data entity (bookings, guests, rooms)
- **FR-7.3:** Error logs with stack traces
- **FR-7.4:** Performance metrics (latency, throughput)
- **FR-7.5:** Alerting for integration failures

### FR-8: Data Export
- **FR-8.1:** Export processed data to external BI tools
- **FR-8.2:** Scheduled data dumps to S3/GCS
- **FR-8.3:** API access to aggregated data
- **FR-8.4:** Custom report generation
- **FR-8.5:** Data retention policies

---

## Technical Requirements

### TR-1: Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   External Systems                       │
│  PMS  │  Channel Manager  │  Reviews  │  POS  │  BI    │
└───────┴───────────────────┴───────────┴───────┴─────────┘
         │          │              │         │        │
         ▼          ▼              ▼         ▼        ▼
┌─────────────────────────────────────────────────────────┐
│              Integration Gateway (API Layer)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Authentication  │  Rate Limiting  │  Logging     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                Data Ingestion Pipeline                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Validation  │  Transformation  │  Enrichment    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Event Bus (Kafka/Redis)                │
│         Real-time event streaming & buffering            │
└─────────────────────────────────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────┐           ┌──────────────────────┐
│   Primary Database   │           │   Cache Layer        │
│   (PostgreSQL)       │           │   (Redis)            │
│   - Bookings         │           │   - Hot data         │
│   - Guests           │           │   - Aggregations     │
│   - Rooms            │           │   - Session data     │
│   - Reviews          │           │                      │
└──────────────────────┘           └──────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              AI/ML Processing Modules                    │
│  Forecast │ Pricing │ NoShow │ Segmentation │ NLU      │
└─────────────────────────────────────────────────────────┘
```

### TR-2: Technology Stack

**Integration Layer:**
- **API Gateway:** Express.js + tRPC for type-safe APIs
- **Message Queue:** Redis Streams or Apache Kafka for event processing
- **Job Scheduler:** BullMQ for batch jobs
- **Webhooks:** Fast, async webhook delivery with retry logic

**Data Storage:**
- **Primary DB:** PostgreSQL with TimescaleDB extension for time-series
- **Cache:** Redis for hot data and rate limiting
- **Object Storage:** S3-compatible storage for CSV imports/exports
- **Search:** Elasticsearch for full-text search (optional)

**Backend Services:**
- **Runtime:** Node.js 20+ with TypeScript
- **API Framework:** Next.js API routes + tRPC
- **Validation:** Zod for schema validation
- **ORM:** Prisma or Drizzle for type-safe database access

**Infrastructure:**
- **Deployment:** Docker containers, Kubernetes (optional)
- **Monitoring:** Prometheus + Grafana
- **Logging:** Structured JSON logs with Winston/Pino
- **Tracing:** OpenTelemetry for distributed tracing

### TR-3: Data Model (Unified Schema)

```typescript
// Core entities - unified across all PMS systems

interface Booking {
  id: string;
  externalId: string; // PMS booking ID
  source: 'opera' | 'cloudbeds' | 'mews' | 'manual';

  // Guest information
  guestId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;

  // Room details
  roomId: string;
  roomNumber: string;
  roomType: string;

  // Dates
  checkInDate: Date;
  checkOutDate: Date;
  bookedAt: Date;

  // Pricing
  totalAmount: number;
  currency: string;
  depositPaid: number;

  // Status
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

  // ML features
  leadTime: number; // days between booking and check-in
  lengthOfStay: number;
  previousStays: number;
  previousNoShows: number;

  // Metadata
  channel: 'direct' | 'ota' | 'agent' | 'walk_in';
  paymentMethod: 'credit_card' | 'cash' | 'invoice' | 'points';
  specialRequests?: string;

  // Sync metadata
  syncedAt: Date;
  version: number;
}

interface Guest {
  id: string;
  externalId: string;
  source: string;

  // Personal info
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;

  // Preferences
  preferredRoomType?: string;
  loyaltyTier?: 'none' | 'silver' | 'gold' | 'platinum';

  // History
  totalStays: number;
  totalSpend: number;
  avgRoomRate: number;
  firstStay: Date;
  lastStay: Date;

  // ML features
  avgDaysInAdvance: number;
  roomUpgrades: number;
  amenityUsage: number;
  noShowCount: number;
  cancellationCount: number;

  // Segments
  segment?: string;
  lifetimeValue: number;

  syncedAt: Date;
}

interface Room {
  id: string;
  externalId: string;
  source: string;

  number: string;
  floor: number;
  type: string;

  status: 'clean' | 'dirty' | 'maintenance' | 'occupied' | 'blocked';

  // Capacity
  maxOccupancy: number;
  bedType: string;

  // Amenities
  amenities: string[];

  // Pricing
  baseRate: number;

  syncedAt: Date;
}

interface Review {
  id: string;
  externalId: string;
  source: 'google' | 'tripadvisor' | 'booking' | 'expedia' | 'internal';

  guestId?: string;
  bookingId?: string;

  rating: number; // 1-5
  title?: string;
  text: string;

  reviewDate: Date;
  stayDate?: Date;

  // ML outputs
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  topics: string[];

  // Response
  responseText?: string;
  respondedAt?: Date;

  syncedAt: Date;
}
```

### TR-4: API Specifications

**Integration Management API:**
```typescript
// POST /api/integrations/configure
interface ConfigureIntegrationRequest {
  type: 'pms' | 'channel_manager' | 'pos' | 'reviews';
  vendor: string; // 'opera', 'cloudbeds', etc.
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    baseUrl?: string;
  };
  syncSchedule: {
    realTime: boolean;
    batchInterval: '1h' | '6h' | '12h' | '24h';
  };
  fieldMapping?: Record<string, string>;
}

// GET /api/integrations/status
interface IntegrationStatus {
  id: string;
  type: string;
  vendor: string;
  status: 'active' | 'error' | 'paused';
  lastSync: Date;
  nextSync: Date;
  recordsSynced: number;
  errors: IntegrationError[];
}

// POST /api/integrations/{id}/sync
// Trigger manual sync

// GET /api/integrations/{id}/logs
// Retrieve sync logs
```

**Data Ingestion API:**
```typescript
// POST /api/ingest/bookings
interface IngestBookingsRequest {
  source: string;
  bookings: Booking[];
  mode: 'upsert' | 'insert' | 'update';
}

// POST /api/ingest/guests
// POST /api/ingest/rooms
// POST /api/ingest/reviews

// POST /api/ingest/bulk
interface BulkIngestRequest {
  source: string;
  entityType: 'booking' | 'guest' | 'room' | 'review';
  format: 'csv' | 'json';
  data: string | object[];
}
```

**Webhook Configuration:**
```typescript
// POST /api/webhooks/subscribe
interface WebhookSubscription {
  url: string;
  events: ('booking.created' | 'booking.updated' | 'guest.created')[];
  secret: string; // for HMAC signature verification
  retryPolicy: {
    maxRetries: number;
    backoff: 'exponential' | 'linear';
  };
}
```

### TR-5: Security Requirements

**Authentication & Authorization:**
- OAuth 2.0 for user authentication
- API key rotation every 90 days
- Role-based access control (RBAC)
- IP whitelisting for webhook endpoints
- HMAC signatures for webhook payloads

**Data Security:**
- TLS 1.3 for all API communications
- Encryption at rest (AES-256)
- PII tokenization for sensitive fields
- GDPR compliance for guest data
- PCI DSS compliance for payment data

**Compliance:**
- SOC 2 Type II certification
- GDPR data processing agreement
- Right to erasure (delete guest data)
- Data retention policies (7 years for bookings)
- Audit logging for all data access

---

## Integration Patterns

### Pattern 1: Pull-based Sync (Polling)
**Use Case:** PMS systems without webhook support

```typescript
async function pollBookings(integration: Integration) {
  const lastSync = await getLastSyncTime(integration.id);
  const newBookings = await integration.api.getBookings({
    updatedSince: lastSync
  });

  await processBookings(newBookings);
  await updateLastSyncTime(integration.id, new Date());
}

// Schedule: Every 15 minutes for bookings, hourly for static data
```

### Pattern 2: Push-based Sync (Webhooks)
**Use Case:** Modern PMS with real-time webhooks

```typescript
app.post('/webhooks/:integrationId/:event', async (req, res) => {
  // Verify signature
  const isValid = verifyHmacSignature(req);
  if (!isValid) return res.status(401).send('Invalid signature');

  // Process event
  await eventBus.publish({
    type: req.params.event,
    payload: req.body,
    source: req.params.integrationId
  });

  res.status(200).send('OK');
});
```

### Pattern 3: Hybrid Sync
**Use Case:** Critical events via webhook, full sync via polling

```typescript
// Real-time: booking.created, booking.cancelled
webhookHandler('booking.created', processBookingCreated);

// Batch: full reconciliation every 6 hours
schedule('0 */6 * * *', syncAllBookings);
```

### Pattern 4: CSV Import
**Use Case:** Initial data load or offline systems

```typescript
async function importBookingsFromCSV(file: File) {
  const stream = createReadStream(file.path);
  const parser = parse({ columns: true });

  stream
    .pipe(parser)
    .pipe(validateBooking())
    .pipe(transformToUnifiedSchema())
    .pipe(batchInsert({ batchSize: 1000 }));
}
```

---

## Implementation Phases

### Phase 1: Foundation (4 weeks)
**Goal:** Core integration infrastructure

**Deliverables:**
- [ ] Unified data schema (PostgreSQL + Prisma)
- [ ] Integration configuration UI
- [ ] Basic REST API for data ingestion
- [ ] Authentication & rate limiting
- [ ] Logging & monitoring setup

**Success Criteria:**
- Can manually ingest CSV files
- Data model supports 3 core entities (Booking, Guest, Room)
- Basic dashboard shows sync status

### Phase 2: PMS Connectors (6 weeks)
**Goal:** Support top 3 PMS vendors

**Deliverables:**
- [ ] Opera Cloud integration (API + webhook)
- [ ] Cloudbeds integration (API + webhook)
- [ ] Mews integration (API + webhook)
- [ ] Automated sync scheduler
- [ ] Data validation & quality checks
- [ ] Error handling & retry logic

**Success Criteria:**
- 3 PMS integrations live
- 99% sync accuracy
- <5 minute data lag for real-time events

### Phase 3: Advanced Features (4 weeks)
**Goal:** Real-time events and webhooks

**Deliverables:**
- [ ] WebSocket streaming for live data
- [ ] Webhook delivery system
- [ ] Event replay mechanism
- [ ] Conflict resolution for duplicate data
- [ ] Performance optimization (caching, indexing)

**Success Criteria:**
- <1 second event delivery
- 99.9% webhook delivery rate
- Support 10,000 events/day

### Phase 4: Additional Integrations (Ongoing)
**Goal:** Expand ecosystem coverage

**Deliverables:**
- [ ] 5 more PMS integrations
- [ ] Channel manager integrations (SiteMinder, etc.)
- [ ] Review platform integrations (TripAdvisor, Google)
- [ ] POS integrations (Micros, Square)
- [ ] BI tool exports (Tableau, Power BI)

**Success Criteria:**
- 10+ integrations live
- 80% market coverage
- Self-service integration SDK for partners

---

## Migration Strategy

### Demo to Production Migration

**Step 1: Parallel Run**
- Keep synthetic data generators
- Ingest real data in parallel
- Compare outputs for accuracy
- Flag discrepancies for review

**Step 2: Feature Flags**
```typescript
const useRealData = process.env.ENABLE_REAL_DATA === 'true';

const bookings = useRealData
  ? await db.bookings.findMany()
  : generateSyntheticBookings();
```

**Step 3: Gradual Rollout**
- 10% of customers on real data (week 1)
- 50% of customers on real data (week 2)
- 100% of customers on real data (week 4)

**Step 4: Deprecate Synthetic Data**
- Move generators to dev/test only
- Remove from production builds
- Archive for testing purposes

---

## Data Quality Framework

### Validation Rules

```typescript
const bookingSchema = z.object({
  guestName: z.string().min(2).max(100),
  checkInDate: z.date().refine(d => d >= new Date(), {
    message: "Check-in cannot be in the past"
  }),
  totalAmount: z.number().positive(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional()
});

// Validate on ingestion
function validateBooking(booking: unknown) {
  return bookingSchema.parse(booking);
}
```

### Anomaly Detection

```typescript
// Detect outliers in pricing
async function detectPriceAnomalies(bookings: Booking[]) {
  const avgPrice = mean(bookings.map(b => b.totalAmount));
  const stdDev = standardDeviation(bookings.map(b => b.totalAmount));

  return bookings.filter(b => {
    const zScore = (b.totalAmount - avgPrice) / stdDev;
    return Math.abs(zScore) > 3; // 3 standard deviations
  });
}
```

### Duplicate Detection

```typescript
// Find duplicate bookings across systems
async function findDuplicates(newBooking: Booking) {
  return db.bookings.findMany({
    where: {
      guestName: newBooking.guestName,
      checkInDate: {
        gte: subDays(newBooking.checkInDate, 1),
        lte: addDays(newBooking.checkInDate, 1)
      },
      roomNumber: newBooking.roomNumber
    }
  });
}
```

---

## Monitoring & Alerting

### Key Metrics

**Integration Health:**
- Sync success rate (target: 99.5%)
- API response time (target: <200ms p95)
- Webhook delivery rate (target: 99.9%)
- Data lag (target: <5 minutes for real-time)

**Data Quality:**
- Validation error rate (target: <0.1%)
- Duplicate detection rate
- Missing field rate (target: <1%)
- Schema evolution compatibility

**System Performance:**
- Ingestion throughput (bookings/second)
- Database query latency
- Cache hit rate (target: >90%)
- Background job queue depth

### Alert Conditions

**Critical Alerts (PagerDuty):**
- Integration down for >5 minutes
- Sync failure rate >10%
- Data loss detected
- Security breach attempted

**Warning Alerts (Email):**
- Sync lag >30 minutes
- Validation error rate >1%
- API rate limit approaching
- Disk space <20%

### Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────┐
│             Integration Health Dashboard                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Opera      │  │  Cloudbeds   │  │    Mews      │ │
│  │   ✅ Active  │  │  ✅ Active   │  │  ⚠️  Warning │ │
│  │   2m ago     │  │  1m ago      │  │  15m ago     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  Last 24 Hours:                                         │
│  ├─ Bookings synced: 1,247                             │
│  ├─ Guests synced: 892                                 │
│  ├─ Rooms synced: 156                                  │
│  └─ Errors: 3 (0.2%)                                   │
│                                                          │
│  Performance:                                           │
│  ├─ Avg sync time: 1.2s                                │
│  ├─ API latency (p95): 180ms                           │
│  └─ Cache hit rate: 94%                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| PMS API changes break integration | Medium | High | Version pinning, automated tests, monitoring |
| Rate limiting by external APIs | High | Medium | Implement caching, batch requests, queue management |
| Data schema incompatibility | Medium | High | Flexible mapping, validation layer, manual override |
| Webhook delivery failures | Medium | Medium | Retry logic, dead letter queue, monitoring |
| Data loss during sync | Low | Critical | Transaction boundaries, audit logs, backups |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Vendor API pricing changes | Medium | Medium | Budget buffers, alternative vendors, negotiate contracts |
| Customer data privacy concerns | Low | High | GDPR compliance, security audits, transparency |
| Integration complexity delays launch | High | Medium | Phased rollout, MVP scope, dedicated team |
| Competing solutions emerge | Medium | Medium | Differentiation on AI quality, faster innovation |

---

## Dependencies

### External Dependencies
- **PMS API access** - Requires contracts with vendors
- **Webhook infrastructure** - Public-facing endpoints (domain, SSL)
- **Cloud resources** - PostgreSQL, Redis, S3 compatible storage
- **Monitoring tools** - Prometheus, Grafana, Sentry

### Internal Dependencies
- **AI/ML modules** - Must adapt to real data (vs synthetic)
- **Authentication system** - OAuth 2.0 implementation
- **Admin dashboard** - UI for integration management
- **Documentation** - Integration guides for each PMS

---

## Open Questions

1. **Data Residency**: Where should customer data be stored (US, EU, Asia)? Multi-region?
2. **Pricing Model**: Charge per integration, per sync, or flat fee?
3. **Self-Service**: Allow customers to configure integrations or require onboarding?
4. **On-Premise**: Support for self-hosted deployments or cloud-only?
5. **Backwards Compatibility**: How long to support deprecated PMS API versions?
6. **Batch Size**: Optimal batch size for bulk imports (100, 1000, 10000)?
7. **SLA**: What uptime guarantee should we offer (99.9%, 99.95%)?

---

## Appendix

### A. PMS Vendor Comparison

| Vendor | API Quality | Webhook Support | Documentation | Market Share |
|--------|-------------|-----------------|---------------|--------------|
| Opera Cloud | ⭐⭐⭐⭐ | ✅ Yes | Excellent | 30% |
| Cloudbeds | ⭐⭐⭐⭐⭐ | ✅ Yes | Excellent | 15% |
| Mews | ⭐⭐⭐⭐⭐ | ✅ Yes | Excellent | 10% |
| RMS Cloud | ⭐⭐⭐ | ❌ No | Good | 8% |
| Stayntouch | ⭐⭐⭐⭐ | ✅ Yes | Good | 7% |

### B. Sample PMS API Endpoints

**Opera Cloud:**
```
GET /rsv/v1/hotels/{hotelId}/reservations
POST /rsv/v1/hotels/{hotelId}/reservations
GET /crm/v0/hotels/{hotelId}/profiles
```

**Cloudbeds:**
```
GET /api/v1.1/getReservations
POST /api/v1.1/postReservation
GET /api/v1.1/getGuest
```

**Mews:**
```
POST /api/connector/v1/reservations/getAll
POST /api/connector/v1/customers/getAll
POST /api/connector/v1/resources/getAll
```

### C. Cost Estimates

**Infrastructure (Monthly):**
- PostgreSQL (managed): $100-300
- Redis: $50-150
- API Gateway: $50-100
- Object Storage: $20-50
- Monitoring: $50-100
- **Total: $270-700/month**

**API Costs (per 10,000 requests):**
- PMS APIs: $0-50 (varies by vendor)
- Webhook delivery: $0 (self-hosted)
- External services: $10-30
- **Total: $10-80 per 10k requests**

### D. Reference Architecture Diagram

See `architecture-data-integration.png` (to be created)

### E. Integration Checklist

**Per PMS Integration:**
- [ ] API credentials obtained
- [ ] Test environment access
- [ ] Webhook endpoint configured
- [ ] Data mapping documented
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Customer validation
- [ ] Production deployment

---

## Approval & Sign-off

| Role | Name | Status | Date |
|------|------|--------|------|
| Product Manager | TBD | Draft | 2025-10-23 |
| Engineering Lead | TBD | Pending | - |
| Security Officer | TBD | Pending | - |
| Legal/Compliance | TBD | Pending | - |
| Executive Sponsor | TBD | Pending | - |

---

**Next Steps:**
1. Review and approve PRD
2. Create technical design document
3. Set up development environment
4. Begin Phase 1 implementation
5. Schedule weekly sync meetings

---

*Document Version History:*
- v1.0 (2025-10-23): Initial draft
