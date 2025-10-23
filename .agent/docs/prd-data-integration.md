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

### TR-1: Architecture (AWS-Based)

```
┌──────────────────────────────────────────────────────────────┐
│                     External Systems                          │
│   Opera PMS  │  Cloudbeds  │  Mews  │  Reviews  │  POS      │
└──────────────┴──────────────┴────────┴──────────┴────────────┘
        │              │            │         │          │
        ▼              ▼            ▼         ▼          ▼
┌──────────────────────────────────────────────────────────────┐
│          AWS API Gateway + Lambda (Integration Layer)         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  WAF │ Cognito Auth │ Rate Limiting │ Request Logging │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  Amazon S3 (Raw Data Lake)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ s3://hotel-data/raw/{source}/{year}/{month}/{day}/     │  │
│  │ - Immutable raw payloads (JSON/XML)                     │  │
│  │ - Versioned for audit trail                             │  │
│  │ - Lifecycle: Standard → IA → Glacier (90d → 1y → 7y)   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼ (S3 Event Notification)
┌──────────────────────────────────────────────────────────────┐
│                   AWS Glue (ETL Pipeline)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. Glue Crawler: Discover schema                        │  │
│  │ 2. Glue Job: Transform & Validate                       │  │
│  │    - Normalize data to unified schema                   │  │
│  │    - Deduplicate using composite keys                   │  │
│  │    - Enrich with external data                          │  │
│  │    - Mask PII (email, phone)                            │  │
│  │ 3. Write to RDS + Processed S3                          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────┐  ┌───────────────────────────┐
│  Amazon RDS PostgreSQL      │  │  S3 (Processed Data)      │
│  - production.bookings      │  │  s3://hotel-data/         │
│  - production.guests        │  │     processed/parquet/    │
│  - production.rooms         │  │  - Columnar format        │
│  - production.reviews       │  │  - Partitioned by date    │
│  - production.transactions  │  │  - For Athena/Redshift    │
│  - TimescaleDB hypertables  │  └───────────────────────────┘
└─────────────────────────────┘
                    │
                    ▼ (CDC via DMS or Triggers)
┌──────────────────────────────────────────────────────────────┐
│            Amazon EventBridge + Kinesis Data Streams          │
│  - Real-time event routing for booking changes               │
│  - Triggers for AI/ML pipeline updates                       │
└──────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────┐  ┌───────────────────────────┐
│  ElastiCache (Redis)        │  │  Lambda + Step Functions  │
│  - Hot data caching         │  │  - AI/ML Model Inference  │
│  - Session management       │  │  - Forecast │ Pricing     │
│  - Rate limiting state      │  │  - NoShow   │ Segment     │
└─────────────────────────────┘  └───────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Application Layer (ECS/Amplify)             │
│  Next.js API + UI │ Real-time Dashboards │ Alert Engine     │
└──────────────────────────────────────────────────────────────┘
```

### TR-2: Technology Stack (AWS-Optimized)

**Integration Layer:**
- **API Gateway:** AWS API Gateway + Lambda for serverless endpoints
- **Event Bus:** Amazon EventBridge for event routing
- **Message Queue:** Amazon SQS for async processing, SNS for pub/sub
- **Stream Processing:** Amazon Kinesis Data Streams for real-time data
- **Job Scheduler:** AWS Step Functions + EventBridge Scheduler

**Data Storage (Raw → Processed Pipeline):**
- **Raw Data Lake:** Amazon S3 (landing zone for all incoming data)
  - Lifecycle policies: Intelligent-Tiering → Glacier for archive
  - Versioning enabled for audit trail
  - Event notifications to trigger ETL
- **ETL Processing:** AWS Glue
  - Glue Crawlers for schema discovery
  - Glue Jobs (Python/Spark) for transformations
  - Glue Data Catalog for metadata management
- **Primary DB:** Amazon RDS PostgreSQL 15+ or Aurora PostgreSQL
  - TimescaleDB extension for time-series
  - Read replicas for analytics queries
  - Automated backups with PITR
- **Cache:** Amazon ElastiCache (Redis) for hot data
- **Data Warehouse:** Amazon Redshift for analytics (optional)
- **Search:** Amazon OpenSearch for full-text search (optional)

**Backend Services:**
- **Runtime:** Node.js 20+ on AWS Lambda (serverless)
- **API Framework:** Next.js on AWS Amplify or ECS Fargate
- **Validation:** Zod for schema validation
- **ORM:** Prisma with RDS Data API or Drizzle

**Infrastructure (Managed Services):**
- **Deployment:** AWS ECS Fargate (containers) or Lambda (serverless)
- **Networking:** VPC with private subnets, NAT Gateway
- **Monitoring:** Amazon CloudWatch + X-Ray for tracing
- **Logging:** CloudWatch Logs with structured JSON
- **Secrets:** AWS Secrets Manager for API keys/credentials
- **IAM:** Fine-grained access control with IAM roles
- **CDN:** Amazon CloudFront for API caching (optional)

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

## Integration Patterns & Real-World Examples

### Integration Ownership & Responsibility

**Key Question: Who configures the integration?**

The **onus of integration configuration** depends on the integration pattern and vendor capabilities:

#### Scenario 1: Vendor Provides Partner API (OAuth)
**Examples:** Cloudbeds, Mews, Stayntouch
**Ownership:** Hotel/Our System (80% effort by us)

```
1. Hotel admin logs into OUR platform
2. Clicks "Connect Cloudbeds"
3. OAuth redirect to Cloudbeds login
4. Hotel authorizes our app (one-time)
5. We receive OAuth token, store in Secrets Manager
6. We configure sync settings (frequency, entities)
```

**Hotel Responsibility:**
- Grant OAuth permission (5 minutes)
- Provide property ID from their PMS

**Our Responsibility:**
- Build OAuth flow
- Store credentials securely
- Configure sync jobs
- Handle errors and retries

---

#### Scenario 2: Vendor Provides API, No Partner Program
**Examples:** Opera Cloud (Oracle), RMS Cloud
**Ownership:** Hotel IT + Our System (50/50 effort)

```
1. Hotel IT generates API key in their PMS admin
2. Hotel provides us: API key, endpoint URL, property code
3. Our admin configures integration via UI
4. We test connection and validate data
5. Hotel approves go-live
```

**Hotel Responsibility:**
- Generate API credentials from their PMS (15-30 min)
- Provide correct property identifiers
- Approve field mappings
- Verify test data accuracy

**Our Responsibility:**
- Build API client for vendor
- Provide configuration UI
- Map fields to unified schema
- Monitor sync health

---

#### Scenario 3: Direct Database Access (On-Premise Legacy Systems ONLY)
**Examples:** Old on-premise Opera PMS v4/v5, Fidelio, custom SQL databases
**Ownership:** Hotel IT (70% effort)

**IMPORTANT:** This scenario is **ONLY** for on-premise systems where the hotel physically hosts the database in their server room or datacenter. This is NOT for cloud/SaaS systems like Opera Cloud, Cloudbeds, or Mews.

```
1. Hotel IT creates dedicated read-only database user for us
2. Hotel IT whitelists our AWS NAT Gateway IP addresses
3. Hotel IT provides:
   - Database connection string (host, port, database name)
   - Read-only credentials (username, password)
   - VPN config (if database not publicly accessible)
   - Schema documentation or data dictionary
4. Our team builds custom SQL connector (one-time)
5. Schedule sync jobs with hotel approval
```

**Example: On-Premise Opera PMS (Not Cloud)**
```sql
-- Hotel DBA creates read-only user in Oracle database
CREATE USER opera_integration IDENTIFIED BY 'securePassword123';

-- Grant SELECT only (no write access)
GRANT SELECT ON opera_owner.RESERVATION TO opera_integration;
GRANT SELECT ON opera_owner.GUEST TO opera_integration;
GRANT SELECT ON opera_owner.ROOM TO opera_integration;
GRANT SELECT ON opera_owner.ROOM_TYPE TO opera_integration;

-- Connection string hotel provides:
jdbc:oracle:thin:@hotel-db-server.local:1521/OPERA
```

**Our Pull Mechanism (Direct SQL):**
```python
# AWS Glue Job (PySpark)
# Runs every 15 minutes to pull data from hotel's on-premise database

from awsglue.context import GlueContext
from pyspark.sql import SparkSession
import psycopg2

# Connect to hotel's on-premise Oracle database via VPN
connection_props = {
    "user": secret_manager.get_secret("opera-db-user"),
    "password": secret_manager.get_secret("opera-db-password"),
    "driver": "oracle.jdbc.driver.OracleDriver"
}

jdbc_url = "jdbc:oracle:thin:@hotel-db.local:1521/OPERA"

# Pull reservations modified since last sync (incremental)
query = f"""
    (SELECT
        r.RESERVATION_ID,
        r.HOTEL_CODE,
        g.GUEST_NAME,
        r.ROOM_TYPE,
        r.ARRIVAL_DATE,
        r.DEPARTURE_DATE,
        r.STATUS,
        r.LAST_UPDATE_DATE
    FROM opera_owner.RESERVATION r
    JOIN opera_owner.GUEST g ON r.GUEST_ID = g.GUEST_ID
    WHERE r.LAST_UPDATE_DATE > TIMESTAMP '{last_sync_time}'
    ORDER BY r.LAST_UPDATE_DATE ASC) AS reservations
"""

# Spark reads directly from hotel's database
df = spark.read.jdbc(
    url=jdbc_url,
    table=query,
    properties=connection_props
)

# Save raw data to S3 (our data lake)
df.write.json(f"s3://hotel-data-raw/opera-onprem/{hotel_id}/{timestamp}.json")

# Continue with normal ETL pipeline...
```

**Hotel Responsibility:**
- Create read-only database user (30 min)
- Configure firewall/VPN access to allow our AWS IPs (1-2 hours)
- Provide schema documentation (or we reverse-engineer)
- Approve data access scope and security review
- Maintain database uptime (this is their server)

**Our Responsibility:**
- Build custom SQL connector for their specific schema (2-4 weeks dev time)
- Secure credential storage (AWS Secrets Manager)
- Configure VPN if required (AWS Client VPN)
- ETL job configuration
- Handle database downtime/connectivity issues
- Ongoing maintenance

**Challenges with Direct DB Access:**
- Hotel's firewall may block external connections
- VPN setup can be complex
- Database downtime affects our sync
- Schema changes can break our queries
- Security concerns (giving external party DB access)

**Why This is Rare:**
- Most hotels have moved to cloud PMS (no DB access)
- High security risk for hotels
- Maintenance burden (schema changes)
- We only do this for large enterprise clients

---

#### Scenario 4: CSV/SFTP Export (No API)
**Examples:** Very old PMS, custom Excel workflows
**Ownership:** Hotel Staff (60% effort)

```
1. Hotel exports CSV from their PMS daily
2. Hotel uploads to our SFTP or S3 bucket
3. Our system detects new file (S3 event)
4. Glue job parses and validates CSV
5. Data ingested into RDS
```

**Hotel Responsibility:**
- Export CSV daily (can be automated with PMS scheduler)
- Upload to our SFTP/S3 (or we poll their SFTP)
- Follow CSV schema template

**Our Responsibility:**
- Provide CSV template
- Build robust parser (handles variations)
- Data validation and error reporting
- Automated ingestion pipeline

---

### Integration Pattern Examples

### Pattern 1: Pull-based Sync (Polling) - Opera Cloud

**Real-World Example: Oracle Opera Cloud PMS**

**Important Clarification: Cloud PMS vs On-Premise**

**Opera Cloud is a SaaS (Cloud) System:**
- Oracle hosts the database (hotel has NO database access)
- Hotel only has access via Oracle's web interface
- Data access for integrations: **REST API only**
- "Pull" = We call Oracle's API periodically to fetch updates

**This is NOT direct database access** - we use Oracle's published REST API endpoints.

---

**Setup Process:**

**Step 1: Hotel Requests API Access from Oracle**
- Hotel contacts Oracle support or partner manager
- Oracle creates API credentials for the hotel's property
- Oracle provides: `clientId`, `clientSecret`, `hotelId`, `endpoint URL`
- Timeline: 3-7 business days (Oracle provisioning)

**Step 2: Hotel Shares Credentials with Us**
- Hotel logs into our platform
- Enters Opera Cloud credentials in integration form:
  ```
  Hotel ID: LAXDT (property code from Opera)
  Client ID: abc123-xyz789
  Client Secret: ••••••••••••
  Environment: production (vs test/staging)
  Region: us-east-1 (or eu-west-1)
  ```

**Step 3: We Configure Sync Schedule**
- We test API connection
- Configure sync frequency (15min, 1h, etc.)
- Set which entities to sync (bookings, guests, rooms, etc.)

---

**How the API "Pull" Works:**

```typescript
// Lambda function triggered every 15 minutes by EventBridge
export const handler = async (event: EventBridgeEvent) => {
  const integration = await getIntegration('opera-cloud-hotel123');

  // 1. Get OAuth token from Opera Cloud (tokens expire after 1 hour)
  const tokenResponse = await axios.post(
    `${integration.baseUrl}/oauth/v1/tokens`,
    {
      grant_type: 'client_credentials',
      client_id: integration.clientId,
      client_secret: integration.clientSecret
    }
  );

  const accessToken = tokenResponse.data.access_token;

  // 2. Fetch reservations modified since last sync
  // This calls Oracle's REST API (we do NOT access their database directly)
  const lastSync = await getLastSyncTime(integration.id);
  const response = await axios.get(
    `${integration.baseUrl}/rsv/v1/hotels/${integration.hotelId}/reservations`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-app-key': integration.appKey,
        'Content-Type': 'application/json'
      },
      params: {
        // Opera Cloud filters: only get records modified since last sync
        modifiedSince: lastSync.toISOString(),
        limit: 1000,  // Max per request
        offset: 0
      }
    }
  );

  // Response from Opera API looks like:
  // {
  //   "reservations": [
  //     {
  //       "reservationId": "12345",
  //       "hotelId": "LAXDT",
  //       "guestName": { "firstName": "John", "lastName": "Smith" },
  //       "roomType": "KING",
  //       "arrival": "2024-03-15",
  //       "departure": "2024-03-18",
  //       "status": "RESERVED",
  //       ...
  //     },
  //     ...
  //   ],
  //   "hasMore": true,  // Pagination indicator
  //   "nextOffset": 1000
  // }

  // 3. Handle pagination (Opera returns max 1000 records per call)
  let allReservations = response.data.reservations;
  let nextOffset = response.data.nextOffset;

  while (response.data.hasMore) {
    const nextPage = await axios.get(
      `${integration.baseUrl}/rsv/v1/hotels/${integration.hotelId}/reservations`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}`, ... },
        params: {
          modifiedSince: lastSync.toISOString(),
          limit: 1000,
          offset: nextOffset
        }
      }
    );

    allReservations = allReservations.concat(nextPage.data.reservations);
    nextOffset = nextPage.data.nextOffset;

    if (!nextPage.data.hasMore) break;
  }

  // 4. Save RAW API response to S3 (immutable audit trail)
  await s3.putObject({
    Bucket: 'hotel-data-raw',
    Key: `opera/${integration.hotelId}/${new Date().toISOString()}.json`,
    Body: JSON.stringify({
      source: 'opera-cloud',
      syncTimestamp: new Date().toISOString(),
      lastSyncTimestamp: lastSync.toISOString(),
      recordCount: allReservations.length,
      rawResponse: response.data  // Original API response
    }),
    Metadata: {
      source: 'opera-cloud',
      syncType: 'incremental',
      recordCount: allReservations.length.toString()
    }
  }).promise();

  // 5. Trigger Glue job for ETL
  // Glue will read the raw JSON, transform to our unified schema, dedupe, and load to RDS
  await glue.startJobRun({
    JobName: 'opera-bookings-etl',
    Arguments: {
      '--S3_INPUT_PATH': `s3://hotel-data-raw/opera/${integration.hotelId}/${new Date().toISOString()}.json`,
      '--HOTEL_ID': integration.hotelId,
      '--SYNC_TIMESTAMP': new Date().toISOString()
    }
  }).promise();

  // 6. Update sync metadata in DynamoDB
  await updateLastSyncTime(integration.id, new Date());

  return {
    statusCode: 200,
    recordsFound: allReservations.length,
    nextSyncIn: '15 minutes'
  };
};

// EventBridge schedule: rate(15 minutes) for bookings
// For static data (room types, rate codes): rate(6 hours)
```

---

**Key Points About Pull/Polling:**

1. **We Call Them (Not Vice Versa)**
   - Our Lambda function initiates the API call every 15 minutes
   - We're the "client", Opera Cloud is the "server"
   - We control the sync frequency

2. **Incremental Updates Only**
   - We pass `modifiedSince` parameter to get only changed records
   - Opera Cloud's API filters on their side
   - We don't re-fetch unchanged data (efficient)

3. **No Real-Time Events**
   - If a booking is created at 2:00 PM, we might not fetch it until 2:15 PM
   - This is why polling is "near real-time" (not instant)
   - For true real-time, we'd need webhooks (Pattern 2)

4. **Rate Limits**
   - Opera Cloud: ~100 requests/minute per hotel
   - We must respect their limits or get throttled (429 errors)
   - Our code includes exponential backoff for retries

---

**Why Pull Instead of Push for Opera Cloud?**

Opera Cloud **does support webhooks** for some events (OXI interface), but:
- Requires enterprise-level contract with Oracle
- Complex setup (hotel IT must configure in Opera)
- Webhook reliability issues reported by partners
- Not all data types support webhooks

**Therefore:** Most partners use polling as the reliable, standard approach.

---

**Data Flow Visualization:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Oracle Cloud (SaaS)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Opera Cloud Database (Oracle's Infrastructure)        │ │
│  │  - Hotel has NO access to this database               │ │
│  │  - Only Oracle engineers can access                   │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                         │
│                     ▼                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Opera Cloud REST API (Public Interface)              │ │
│  │  - /rsv/v1/hotels/{id}/reservations                   │ │
│  │  - /fof/v1/hotels/{id}/folios                         │ │
│  │  - /crm/v1/hotels/{id}/profiles                       │ │
│  └──────────────────┬─────────────────────────────────────┘ │
└─────────────────────┼─────────────────────────────────────────┘
                      │ HTTPS GET (OAuth 2.0)
                      │ Every 15 minutes
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Our AWS Infrastructure                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Lambda Function (Polling Job)                         │ │
│  │  - Triggered by EventBridge (cron schedule)           │ │
│  │  - Calls Opera API with OAuth token                   │ │
│  │  - Fetches records modified since last sync           │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                         │
│                     ▼                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  S3 Raw Data Lake                                      │ │
│  │  s3://hotel-data/raw/opera/LAXDT/2024-03-15T14:30.json│ │
│  │  - Immutable raw API responses                        │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                         │
│                     ▼                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Glue ETL Job                                          │ │
│  │  - Transform Opera schema → Unified schema            │ │
│  │  - Deduplicate using composite keys                   │ │
│  │  - Enrich data                                         │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                         │
│                     ▼                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  RDS PostgreSQL                                        │ │
│  │  production.bookings table                             │ │
│  │  - Clean, unified data ready for AI/ML                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

**Comparison: Cloud PMS vs On-Premise PMS**

| Aspect | Cloud (Opera Cloud) | On-Premise (Old Opera) |
|--------|---------------------|------------------------|
| **Database Location** | Oracle's datacenter | Hotel's server room |
| **Hotel DB Access** | ❌ None | ✅ Full access (if granted) |
| **Integration Method** | REST API only | API or direct DB |
| **Credentials** | API key from Oracle | DB credentials or API key |
| **Setup Time** | 3-7 days (Oracle provisioning) | 1-2 hours (hotel IT creates user) |
| **Data Access Speed** | API rate limits (~100/min) | Direct DB (faster) |
| **Pattern** | Pull (polling) or Push (webhooks) | Pull (DB query) or Push (triggers) |

---

**Who Owns What:**
- **Hotel:** Requests API access from Oracle (3-7 days), shares credentials with us (15 min)
- **Us:** Build connector (1-2 weeks), configure sync (1 hour), maintain sync jobs

---

### Pattern 2: Push-based Sync (Webhooks) - Cloudbeds

**Real-World Example: Cloudbeds PMS**

**Setup Process:**
1. Hotel clicks "Connect Cloudbeds" in our UI
2. OAuth redirect → Hotel authorizes our app
3. We receive OAuth token + webhook URL from Cloudbeds
4. Cloudbeds automatically sends events to our webhook endpoint

**Implementation (AWS-Based):**
```typescript
// API Gateway → Lambda
export const handler = async (event: APIGatewayProxyEvent) => {
  const { integrationId, eventType } = event.pathParameters;

  // 1. Verify Cloudbeds HMAC signature
  const signature = event.headers['X-Cloudbeds-Signature'];
  const isValid = crypto
    .createHmac('sha256', await getWebhookSecret(integrationId))
    .update(event.body)
    .digest('hex') === signature;

  if (!isValid) {
    return { statusCode: 401, body: 'Invalid signature' };
  }

  const payload = JSON.parse(event.body);

  // 2. Save raw webhook payload to S3 immediately
  await s3.putObject({
    Bucket: 'hotel-data-raw',
    Key: `cloudbeds/${integrationId}/${eventType}/${Date.now()}.json`,
    Body: event.body,
    Metadata: {
      source: 'cloudbeds',
      event: eventType,
      receivedAt: new Date().toISOString()
    }
  }).promise();

  // 3. Publish to EventBridge for async processing
  await eventBridge.putEvents({
    Entries: [{
      Source: 'hospitality.integration',
      DetailType: `cloudbeds.${eventType}`,
      Detail: JSON.stringify({
        integrationId,
        eventType,
        s3Path: `s3://hotel-data-raw/cloudbeds/${integrationId}/${eventType}/${Date.now()}.json`,
        payload
      })
    }]
  }).promise();

  // 4. Respond immediately (Cloudbeds requires <5s response)
  return { statusCode: 200, body: 'OK' };
};

// Separate Lambda triggered by EventBridge for processing
export const processCloudbedsEvent = async (event: any) => {
  const { s3Path, payload, eventType } = event.detail;

  // Trigger Glue job for transformation
  await glue.startJobRun({
    JobName: 'cloudbeds-webhook-etl',
    Arguments: {
      '--S3_INPUT_PATH': s3Path,
      '--EVENT_TYPE': eventType
    }
  }).promise();
};
```

**Who Owns What:**
- Hotel: Click "Authorize" button (2 min)
- Us: Build OAuth integration (1 week), webhook handler (3 days)

---

### Pattern 3: Hybrid Sync - Mews

**Real-World Example: Mews PMS (REST API + Webhooks)**

**Setup Process:**
1. Hotel generates API access token in Mews
2. Hotel configures webhook URL in Mews admin panel
3. We receive critical events via webhook, poll for full reconciliation

**Implementation:**
```typescript
// Real-time: Webhook for critical events
// POST /webhooks/mews/booking.created
export const handleMewsWebhook = async (event: APIGatewayProxyEvent) => {
  const payload = JSON.parse(event.body);

  // Save to S3
  await saveRawDataToS3('mews', 'webhook', payload);

  // Process immediately for critical events
  if (payload.type === 'Reservation.Created' || payload.type === 'Reservation.Cancelled') {
    await triggerGlueJob('mews-realtime-etl', payload);
  }

  return { statusCode: 200, body: 'OK' };
};

// Batch: Full sync every 6 hours for reconciliation
// EventBridge: cron(0 */6 * * ? *)
export const batchSyncMews = async () => {
  const integration = await getIntegration('mews');

  // Get all reservations modified in last 7 days (safety buffer)
  const response = await axios.post(
    `${integration.baseUrl}/reservations/getAll`,
    {
      AccessToken: integration.accessToken,
      StartUtc: subDays(new Date(), 7).toISOString(),
      EndUtc: new Date().toISOString()
    }
  );

  // Save to S3
  await saveRawDataToS3('mews', 'batch-sync', response.data);

  // Trigger Glue job with deduplication enabled
  await triggerGlueJob('mews-batch-etl', {
    deduplicationEnabled: true,
    s3Path: `s3://hotel-data-raw/mews/batch-sync/...`
  });
};
```

**Who Owns What:**
- Hotel: Generate token + configure webhook URL (15 min)
- Us: Build dual-mode connector (2 weeks)

---

### Pattern 4: CSV/SFTP Import - Legacy PMS

**Real-World Example: Old On-Premise PMS with Scheduled Exports**

**Setup Process:**
1. Hotel IT configures PMS to export CSV daily at 2 AM
2. Hotel IT uploads to our S3 bucket OR we poll their SFTP
3. S3 event triggers Glue job automatically

**Implementation:**
```typescript
// S3 Event Notification → Lambda → Glue
export const handleCsvUpload = async (event: S3Event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  // Validate CSV structure before processing
  const csvContent = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  const isValid = await validateCsvSchema(csvContent.Body.toString());

  if (!isValid) {
    await sendAlert('CSV validation failed', key);
    return { statusCode: 400, body: 'Invalid CSV' };
  }

  // Trigger Glue job
  await glue.startJobRun({
    JobName: 'csv-bookings-etl',
    Arguments: {
      '--S3_INPUT_PATH': `s3://${bucket}/${key}`,
      '--SOURCE': 'legacy-pms',
      '--UPLOAD_DATE': new Date().toISOString()
    }
  }).promise();

  return { statusCode: 200, body: 'Processing started' };
};
```

**Who Owns What:**
- Hotel: Configure daily CSV export (30 min setup, then automated)
- Us: Build CSV parser + validation (1 week)

---

### TR-6: Deduplication Strategies

**Problem:** Data arrives from multiple sources (webhook + polling) and can create duplicates.

**Solution:** Multi-layer deduplication in Glue ETL jobs:

#### Layer 1: Composite Key Deduplication
```python
# AWS Glue Job (PySpark)
from awsglue.transforms import *
from pyspark.sql.functions import *
from pyspark.sql.window import Window

# Read raw data from S3
raw_bookings = glueContext.create_dynamic_frame.from_catalog(
    database="hospitality_raw",
    table_name="bookings_raw"
).toDF()

# Define composite key: source + externalId + hotelId
raw_bookings = raw_bookings.withColumn(
    "composite_key",
    concat_ws(":", col("source"), col("external_id"), col("hotel_id"))
)

# Deduplicate: Keep latest version based on sync timestamp
window_spec = Window.partitionBy("composite_key").orderBy(desc("synced_at"))
deduplicated = raw_bookings.withColumn("row_num", row_number().over(window_spec)) \
    .filter(col("row_num") == 1) \
    .drop("row_num")

# Write to processed S3 + RDS
deduplicated.write \
    .mode("overwrite") \
    .partitionBy("source", "sync_date") \
    .parquet("s3://hotel-data-processed/bookings/")
```

#### Layer 2: PostgreSQL Unique Constraints
```sql
-- In RDS PostgreSQL
CREATE TABLE production.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL,
  hotel_id VARCHAR(100) NOT NULL,

  -- ... other fields

  synced_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  -- Composite unique constraint prevents duplicates
  CONSTRAINT unique_booking_per_source UNIQUE (source, external_id, hotel_id)
);

-- Upsert logic in Glue job uses ON CONFLICT
INSERT INTO production.bookings (external_id, source, hotel_id, ...)
VALUES (?, ?, ?, ...)
ON CONFLICT (source, external_id, hotel_id)
DO UPDATE SET
  guest_name = EXCLUDED.guest_name,
  status = EXCLUDED.status,
  synced_at = NOW(),
  version = bookings.version + 1
WHERE
  -- Only update if incoming data is newer
  EXCLUDED.synced_at > bookings.synced_at;
```

#### Layer 3: Idempotency Keys for Webhooks
```typescript
// Lambda webhook handler
export const handleWebhook = async (event: APIGatewayProxyEvent) => {
  const idempotencyKey = event.headers['X-Idempotency-Key'] ||
    crypto.createHash('sha256').update(event.body).digest('hex');

  // Check if already processed (DynamoDB for fast lookup)
  const existing = await dynamoDB.getItem({
    TableName: 'webhook_idempotency',
    Key: { idempotencyKey }
  }).promise();

  if (existing.Item) {
    return { statusCode: 200, body: 'Already processed' };
  }

  // Process webhook
  await processWebhook(JSON.parse(event.body));

  // Store idempotency key (TTL 7 days)
  await dynamoDB.putItem({
    TableName: 'webhook_idempotency',
    Item: {
      idempotencyKey,
      processedAt: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    }
  }).promise();

  return { statusCode: 200, body: 'Processed' };
};
```

---

### TR-7: Storage Optimization for Multi-Year Data

**Challenge:** Hotels need 3-7 years of historical data for forecasting, but storage costs grow linearly.

**Solution:** Tiered storage + compression + aggregation

#### Strategy 1: S3 Lifecycle Policies
```hcl
# Terraform configuration
resource "aws_s3_bucket_lifecycle_configuration" "hotel_data" {
  bucket = aws_s3_bucket.hotel_data.id

  rule {
    id     = "raw-data-lifecycle"
    status = "Enabled"

    # Raw data retention
    transition {
      days          = 90
      storage_class = "STANDARD_IA"  # Infrequent Access (50% cheaper)
    }

    transition {
      days          = 365
      storage_class = "GLACIER_IR"  # Glacier Instant Retrieval (70% cheaper)
    }

    transition {
      days          = 1825  # 5 years
      storage_class = "DEEP_ARCHIVE"  # Deep Archive (95% cheaper)
    }

    expiration {
      days = 2555  # 7 years (compliance requirement)
    }
  }

  rule {
    id     = "processed-data-compression"
    status = "Enabled"

    # Processed data: Keep in Standard, but compress to Parquet
    filter {
      prefix = "processed/"
    }
  }
}
```

**Cost Savings:**
- Standard S3: $0.023/GB/month
- Standard-IA: $0.0125/GB/month (90+ days old)
- Glacier IR: $0.004/GB/month (1+ years old)
- Deep Archive: $0.00099/GB/month (5+ years old)

**Example:**
- 10 GB/month new data
- After 5 years: 600 GB total
  - Year 1: 120 GB × $0.023 = $2.76/mo
  - Year 2-3: 240 GB × $0.0125 = $3.00/mo
  - Year 4-5: 240 GB × $0.004 = $0.96/mo
  - **Total: $6.72/mo** (vs $13.80/mo all in Standard)

---

#### Strategy 2: Columnar Format (Parquet) + Compression
```python
# Glue job: Convert JSON to Parquet with Snappy compression
from awsglue.dynamicframe import DynamicFrame

# Read raw JSON
raw_df = spark.read.json("s3://hotel-data-raw/bookings/2024/01/")

# Write as Parquet with compression
raw_df.write \
    .mode("overwrite") \
    .option("compression", "snappy")  # 70-90% compression ratio
    .partitionBy("year", "month")  # Partition pruning for queries
    .parquet("s3://hotel-data-processed/bookings/")

# Query with Athena (only scans relevant partitions)
# SELECT * FROM bookings WHERE year=2024 AND month=1
```

**Storage Reduction:**
- JSON: 1 KB/booking
- Parquet + Snappy: 100-300 bytes/booking (70-90% reduction)
- 1M bookings: 1 GB (JSON) → 200 MB (Parquet)

---

#### Strategy 3: Pre-Aggregation for Old Data
```python
# Glue job: Aggregate bookings older than 2 years to daily summaries
from pyspark.sql.functions import *

# Keep detailed records for recent data (2 years)
recent_bookings = bookings_df.filter(col("check_in_date") >= date_sub(current_date(), 730))

# Aggregate old data to daily summaries
old_bookings_agg = bookings_df.filter(col("check_in_date") < date_sub(current_date(), 730)) \
    .groupBy("hotel_id", "date", "room_type") \
    .agg(
        count("*").alias("booking_count"),
        avg("total_amount").alias("avg_rate"),
        sum("total_amount").alias("total_revenue"),
        sum("length_of_stay").alias("total_room_nights")
    )

# Write aggregated data (99% smaller)
old_bookings_agg.write.parquet("s3://hotel-data-processed/bookings_daily_agg/")
```

**Storage Reduction:**
- Individual bookings (>2y old): 1 GB
- Daily aggregates: 10 MB (99% reduction)
- **Forecasting models don't need individual bookings from 3+ years ago**

---

#### Strategy 4: TimescaleDB Compression (PostgreSQL)
```sql
-- Enable TimescaleDB compression for old partitions
CREATE TABLE production.bookings (
  id UUID PRIMARY KEY,
  check_in_date DATE NOT NULL,
  -- ... other fields
);

-- Convert to hypertable (TimescaleDB)
SELECT create_hypertable('production.bookings', 'check_in_date', chunk_time_interval => INTERVAL '1 month');

-- Enable compression for chunks older than 6 months
ALTER TABLE production.bookings SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'hotel_id',
  timescaledb.compress_orderby = 'check_in_date DESC'
);

-- Automatically compress old chunks
SELECT add_compression_policy('production.bookings', INTERVAL '6 months');

-- Result: 90-95% compression for old data
```

**Storage Reduction:**
- Uncompressed: 100 GB (5 years of bookings)
- TimescaleDB compressed: 10 GB (90% reduction)
- **Queries still work transparently**

---

#### Strategy 5: Data Retention Policies
```typescript
// Define retention by entity type
const RETENTION_POLICIES = {
  bookings: {
    detailed: '3 years',  // Individual booking records
    aggregated: '7 years',  // Daily/monthly summaries
    compliance: '7 years'  // Required for accounting
  },
  guests: {
    active: '5 years',  // Guests with bookings in last 5y
    inactive: '2 years',  // Automatically anonymize after 2y of inactivity (GDPR)
  },
  reviews: {
    all: '7 years',  // Keep all reviews for sentiment trends
  },
  logs: {
    application: '90 days',
    audit: '7 years',
    integration: '1 year'
  }
};

// Glue job: Anonymize inactive guests
UPDATE production.guests
SET
  email = 'anonymized@example.com',
  phone = NULL,
  address = NULL,
  gdpr_anonymized = TRUE
WHERE
  last_stay_date < CURRENT_DATE - INTERVAL '2 years'
  AND gdpr_anonymized = FALSE;
```

---

#### Cost Optimization Summary

**For a medium hotel (500 rooms, 50K bookings/year):**

| Storage Layer | Initial | Year 1 | Year 3 | Year 5 | Savings |
|---------------|---------|--------|--------|--------|---------|
| S3 Raw (JSON) | $23/mo | $276/mo | $828/mo | $1,380/mo | Baseline |
| S3 Parquet + Lifecycle | $5/mo | $55/mo | $125/mo | $180/mo | **87% saved** |
| + RDS Compression | +$20/mo | +$25/mo | +$30/mo | +$35/mo | (Minimal growth) |
| + Pre-Aggregation | -$2/mo | -$10/mo | -$40/mo | -$80/mo | (Offset by agg) |
| **Total Cost** | **$23/mo** | **$70/mo** | **$115/mo** | **$135/mo** | **90% saved at Y5** |

**vs. Keeping all detailed data in RDS Standard:**
- Year 5: $1,500+/mo for RDS storage alone

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
