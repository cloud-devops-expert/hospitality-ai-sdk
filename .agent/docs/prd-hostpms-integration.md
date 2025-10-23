# Product Requirements Document: HostPMS Integration

**Project:** Hospitality AI SDK - HostPMS Connector
**Version:** 1.0
**Date:** October 23, 2025
**Status:** Active Development
**Owner:** Integration Team
**Target Market:** Portugal, Spain, Southern Europe

---

## Executive Summary

Implement a production-ready integration with HostPMS, a cloud-based Property Management System popular in the Portuguese and Spanish hospitality markets. This integration will enable hotels using HostPMS to seamlessly connect their operational data with the Hospitality AI SDK for AI-powered forecasting, pricing optimization, and guest intelligence.

### Key Objectives
- Enable real-time data synchronization via webhooks
- Provide reliable backup via API polling (hourly)
- Support Portuguese/Spanish language field mapping
- Handle EUR currency and Portuguese tax structures
- Ensure GDPR compliance for EU guest data
- Achieve <30 second data lag for critical events
- Target 99.9% uptime and data accuracy

---

## Problem Statement

### Current State
- Portuguese hotels using HostPMS have no AI-powered analytics
- Manual data export/import is time-consuming and error-prone
- No real-time insights for pricing and forecasting decisions
- Language barriers (Portuguese field names) prevent integration with international tools

### Desired State
- One-click integration setup (< 30 minutes)
- Automatic real-time data sync
- Portuguese → English field mapping in ETL pipeline
- AI/ML models trained on hotel's actual historical data
- Proactive insights delivered to hotel managers

---

## Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Integration Setup Time | < 30 minutes | Phase 1 |
| Data Sync Latency (webhooks) | < 30 seconds | Phase 2 |
| Data Sync Accuracy | 99.9% | Phase 3 |
| First 10 Production Hotels | Portugal market | Q1 2026 |
| API Uptime | 99.9% | Ongoing |
| ETL Job Success Rate | > 99% | Phase 3 |

---

## User Stories

### Hotel Manager (Primary User)
- **As a** hotel manager in Portugal, **I want to** connect my HostPMS account **so that** I can get AI-powered forecasts based on my real data
- **As a** hotel manager, **I want** automatic data sync **so that** I don't have to manually export/import data
- **As a** hotel manager, **I want** to see insights in my language (Portuguese) **so that** I can easily understand recommendations

### IT Administrator (Secondary User)
- **As an** IT admin, **I want** a simple OAuth setup **so that** I don't need technical knowledge to configure the integration
- **As an** IT admin, **I want** to monitor sync status **so that** I can troubleshoot issues quickly
- **As an** IT admin, **I want** to revoke access easily **so that** I maintain data security

### Developer (Internal User)
- **As a** developer, **I want** standardized data schemas **so that** AI models work across all PMS integrations
- **As a** developer, **I want** comprehensive logging **so that** I can debug integration issues
- **As a** developer, **I want** test environments **so that** I can develop safely without affecting production

---

## Technical Requirements

### TR-1: HostPMS API Specifications

**Base URL:** `https://api.hostpms.com/v3`

**Authentication:** OAuth 2.0 Client Credentials
```
POST /oauth/token
{
  "grant_type": "client_credentials",
  "client_id": "string",
  "client_secret": "string"
}

Response:
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Key Endpoints:**

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/properties/{id}/reservations` | GET | Fetch bookings | 100/min |
| `/properties/{id}/guests` | GET | Fetch guest profiles | 100/min |
| `/properties/{id}/rooms` | GET | Fetch room inventory | 100/min |
| `/properties/{id}/payments` | GET | Fetch transactions | 100/min |
| `/webhooks/subscribe` | POST | Register webhook | - |
| `/webhooks/unsubscribe` | POST | Remove webhook | - |

**Webhook Events:**
- `reservation.created`
- `reservation.updated`
- `reservation.cancelled`
- `reservation.check_in`
- `reservation.check_out`
- `reservation.no_show`
- `payment.received`
- `guest.created`
- `room.status_changed`

**Webhook Signature Verification:**
```
HMAC-SHA256(timestamp.body, webhook_secret)
Header: X-HostPMS-Signature
Header: X-HostPMS-Timestamp
```

---

### TR-2: Data Schema Mapping

**HostPMS Reservation Schema (Portuguese):**
```json
{
  "reservation_id": "RSV-12345",
  "property_id": "PT-LIS-001",
  "guest": {
    "name": "João Silva",
    "email": "joao.silva@example.pt",
    "phone": "+351912345678",
    "country": "PT",
    "nif": "123456789"
  },
  "room": {
    "type": "Quarto Duplo",
    "number": "201",
    "floor": 2
  },
  "dates": {
    "check_in": "2024-03-20",
    "check_out": "2024-03-25",
    "created_at": "2024-03-01T10:30:00Z"
  },
  "pricing": {
    "total": 450.00,
    "currency": "EUR",
    "rate_plan": "Flexível",
    "iva": 103.50,
    "taxa_turistica": 10.00
  },
  "status": "confirmado",
  "channel": "booking_com",
  "payment_method": "credit_card",
  "special_requests": "Quarto silencioso"
}
```

**Unified Schema (English):**
```json
{
  "id": "uuid-generated",
  "external_id": "RSV-12345",
  "source": "hostpms",
  "hotel_id": "PT-LIS-001",
  "guest_name": "João Silva",
  "guest_email": "joao.silva@example.pt",
  "guest_phone": "+351912345678",
  "room_number": "201",
  "room_type": "Double Room",
  "check_in_date": "2024-03-20",
  "check_out_date": "2024-03-25",
  "booked_at": "2024-03-01T10:30:00Z",
  "total_amount": 450.00,
  "currency": "EUR",
  "status": "confirmed",
  "channel": "ota",
  "payment_method": "credit_card",
  "lead_time": 19,
  "length_of_stay": 5,
  "synced_at": "2024-03-15T14:30:00Z",
  "version": 1
}
```

**Field Mapping Rules:**
```typescript
const STATUS_MAPPING = {
  'confirmado': 'confirmed',
  'cancelado': 'cancelled',
  'check_in': 'checked_in',
  'check_out': 'checked_out',
  'no_show': 'no_show'
};

const CHANNEL_MAPPING = {
  'direto': 'direct',
  'booking_com': 'ota',
  'expedia': 'ota',
  'airbnb': 'ota',
  'agencia': 'agent'
};

const ROOM_TYPE_MAPPING = {
  'Quarto Duplo': 'Double Room',
  'Quarto Twin': 'Twin Room',
  'Suite': 'Suite',
  'Quarto Individual': 'Single Room'
};
```

---

### TR-3: AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HostPMS Cloud                             │
│  - REST API v3 (https://api.hostpms.com/v3)                 │
│  - Webhooks with HMAC signatures                            │
└─────────────┬──────────────────────┬─────────────────────────┘
              │ Webhooks (real-time) │ API Polling (hourly)
              ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Infrastructure (eu-west-1)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Gateway                                          │  │
│  │  POST /webhooks/hostpms/{propertyId}/{event}         │  │
│  │  - WAF rules (rate limiting, geo-blocking)           │  │
│  │  - Request validation                                 │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Lambda: webhook-handler                             │  │
│  │  - Verify HMAC signature                             │  │
│  │  - Prevent replay attacks                            │  │
│  │  - Save to S3 raw bucket                             │  │
│  │  - Publish to EventBridge                            │  │
│  │  Runtime: Node.js 20                                 │  │
│  │  Timeout: 10 seconds                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  EventBridge Rule: hostpms-polling                   │  │
│  │  Schedule: cron(0 * * * ? *)  // Every hour          │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Lambda: polling-handler                             │  │
│  │  - Get OAuth token                                   │  │
│  │  - Fetch updated reservations                        │  │
│  │  - Save to S3 raw bucket                             │  │
│  │  - Trigger Glue ETL                                  │  │
│  │  Runtime: Node.js 20                                 │  │
│  │  Timeout: 5 minutes                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                     │
│                       ▼                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  S3: hotel-data-raw                                  │  │
│  │  s3://hotel-data-raw/hostpms/{propertyId}/          │  │
│  │  - webhooks/{event}/{timestamp}.json                 │  │
│  │  - polling/{timestamp}.json                          │  │
│  │  Lifecycle: 90d Standard → 365d IA → 7y Glacier     │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       ▼ S3 Event Notification               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Glue Job: hostpms-etl                               │  │
│  │  - Read raw JSON from S3                             │  │
│  │  - Map Portuguese → English                          │  │
│  │  - Validate data quality                             │  │
│  │  - Deduplicate (source + external_id + hotel_id)    │  │
│  │  - Write to processed S3 (Parquet)                   │  │
│  │  - Upsert to RDS PostgreSQL                          │  │
│  │  Runtime: Python 3.9, Spark 3.3                      │  │
│  │  Workers: 2 DPU (Data Processing Units)              │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│           ┌───────────┴─────────────┐                       │
│           ▼                         ▼                       │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │ RDS PostgreSQL   │    │ S3: hotel-data-processed     │  │
│  │ production.      │    │ Parquet files partitioned by:│  │
│  │  - bookings      │    │  - source (hostpms)          │  │
│  │  - guests        │    │  - year/month/day            │  │
│  │  - payments      │    │ For Athena queries           │  │
│  └──────────────────┘    └──────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Secrets Manager                                      │  │
│  │  - hostpms/{propertyId}/oauth-credentials            │  │
│  │  - hostpms/{propertyId}/webhook-secret               │  │
│  │  - rds/production/credentials                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DynamoDB: webhook-idempotency                       │  │
│  │  - Partition key: idempotency_key                    │  │
│  │  - TTL: 7 days                                       │  │
│  │  - Prevents duplicate webhook processing             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CloudWatch Logs + Metrics                           │  │
│  │  - Lambda execution logs                             │  │
│  │  - Glue job logs                                     │  │
│  │  - Custom metrics (sync success rate, latency)      │  │
│  │  - Alarms (error rate > 5%, latency > 30s)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation & Setup (Week 1)

**Deliverables:**
- [ ] AWS infrastructure setup (Terraform/CDK)
- [ ] S3 buckets with lifecycle policies
- [ ] Secrets Manager for credentials
- [ ] RDS PostgreSQL database schema
- [ ] DynamoDB idempotency table
- [ ] CloudWatch dashboards

**Acceptance Criteria:**
- Infrastructure deployed to eu-west-1
- Database tables created with indexes
- Secrets properly encrypted
- Monitoring dashboard accessible

---

### Phase 2: Webhook Integration (Week 2)

**Deliverables:**
- [ ] API Gateway REST API
- [ ] Lambda webhook handler (TypeScript)
- [ ] HMAC signature verification
- [ ] S3 raw data storage
- [ ] EventBridge event publishing
- [ ] Unit tests (>80% coverage)

**Acceptance Criteria:**
- Webhook receives HostPMS events
- Signature verification prevents unauthorized requests
- Raw payloads saved to S3 within 2 seconds
- Events published to EventBridge
- All unit tests passing

---

### Phase 3: API Polling (Week 2)

**Deliverables:**
- [ ] Lambda polling handler (TypeScript)
- [ ] OAuth 2.0 token management
- [ ] Incremental sync logic
- [ ] EventBridge scheduled rule (hourly)
- [ ] Error handling & retries
- [ ] Unit tests (>80% coverage)

**Acceptance Criteria:**
- Polling runs every hour automatically
- OAuth tokens refreshed before expiration
- Only fetches data modified since last sync
- Handles rate limiting gracefully
- All unit tests passing

---

### Phase 4: ETL Pipeline (Week 3)

**Deliverables:**
- [ ] Glue ETL job (PySpark)
- [ ] Portuguese → English field mapping
- [ ] Data validation rules
- [ ] Deduplication logic
- [ ] RDS upsert operations
- [ ] Parquet file generation
- [ ] Integration tests

**Acceptance Criteria:**
- ETL job transforms HostPMS data correctly
- Portuguese fields mapped to English
- Duplicates removed (99.9% accuracy)
- Data written to RDS and S3 Parquet
- Integration tests passing
- Processing time < 5 minutes for 1000 records

---

### Phase 5: Testing & Validation (Week 4)

**Deliverables:**
- [ ] End-to-end integration tests
- [ ] Load testing (1000 webhooks/min)
- [ ] Data accuracy validation
- [ ] Error scenario testing
- [ ] Documentation
- [ ] Runbook for operations

**Acceptance Criteria:**
- E2E tests cover all critical paths
- System handles 1000 webhooks/min
- Data accuracy > 99.9%
- All error scenarios documented
- Runbook approved by operations team

---

### Phase 6: Production Deployment (Week 5)

**Deliverables:**
- [ ] Production deployment
- [ ] First 3 pilot hotels onboarded
- [ ] Monitoring & alerting configured
- [ ] On-call rotation established
- [ ] Post-deployment validation

**Acceptance Criteria:**
- 3 hotels successfully integrated
- No critical issues in first 48 hours
- Monitoring shows <30s latency
- Data sync accuracy > 99.9%
- Zero data loss

---

## Testing Strategy

### Unit Tests
**Location:** `lib/integrations/hostpms/__tests__/`

**Coverage Requirements:**
- Webhook handler: >90%
- Polling handler: >90%
- Data mappers: >95%
- Utilities: >85%

**Test Cases:**
1. Webhook signature verification (valid/invalid)
2. OAuth token acquisition & refresh
3. Portuguese → English field mapping
4. Deduplication logic
5. Error handling

### Integration Tests
**Location:** `lib/integrations/hostpms/__tests__/integration/`

**Test Cases:**
1. Webhook → S3 → Glue → RDS (end-to-end)
2. Polling → S3 → Glue → RDS (end-to-end)
3. Duplicate webhook handling
4. API rate limiting handling
5. Network failure recovery

### Load Tests
**Tool:** Artillery.io or k6

**Scenarios:**
1. 100 concurrent webhooks
2. 1000 webhooks in 1 minute
3. Polling with 10,000 records
4. ETL job with 50,000 records

**Performance Targets:**
- Webhook response time: < 500ms (p99)
- Polling completion: < 5 minutes
- ETL processing: < 10 minutes for 10K records

---

## Security & Compliance

### GDPR Compliance
- [ ] Guest data encrypted at rest (S3, RDS)
- [ ] Encryption in transit (TLS 1.3)
- [ ] Data retention policies (7 years)
- [ ] Right to erasure (delete guest data)
- [ ] Audit logging (all data access logged)
- [ ] DPA (Data Processing Agreement) with HostPMS

### Security Best Practices
- [ ] Secrets in AWS Secrets Manager (not env vars)
- [ ] IAM roles with least privilege
- [ ] VPC private subnets for Lambda & RDS
- [ ] WAF rules on API Gateway
- [ ] CloudTrail audit logs enabled
- [ ] Automated security scanning (Snyk, AWS Inspector)

---

## Monitoring & Alerting

### Key Metrics
| Metric | Threshold | Alert |
|--------|-----------|-------|
| Webhook latency (p99) | > 1 second | Warning |
| Webhook error rate | > 5% | Critical |
| Polling job failures | > 2 consecutive | Critical |
| ETL job duration | > 15 minutes | Warning |
| Data sync lag | > 2 hours | Critical |
| RDS CPU usage | > 80% | Warning |
| Lambda errors | > 10 in 5 min | Critical |

### Dashboards
1. **Integration Health**
   - Webhook success rate
   - Polling success rate
   - ETL job status
   - Data sync lag

2. **Performance**
   - Webhook latency (p50, p95, p99)
   - API response times
   - ETL processing time
   - Database query performance

3. **Cost Tracking**
   - Lambda invocation costs
   - Glue DPU hours
   - S3 storage costs
   - RDS instance costs

---

## Cost Estimation

**Per Hotel (Monthly):**

| Service | Usage | Cost |
|---------|-------|------|
| Lambda (webhooks) | 10K invocations | $0.20 |
| Lambda (polling) | 720 invocations | $0.01 |
| API Gateway | 10K requests | $0.04 |
| S3 (raw) | 2 GB | $0.05 |
| S3 (processed) | 500 MB | $0.01 |
| Glue ETL | 100 runs × 2 DPU × 5 min | $3.00 |
| RDS (allocated) | Shared pool | - |
| Secrets Manager | 5 secrets | $0.20 |
| DynamoDB | On-demand | $0.05 |
| CloudWatch | Logs + Metrics | $0.50 |
| **Total** | | **$4.06/month** |

**For 100 Hotels:** ~$400/month

**Infrastructure (Shared):**
- RDS PostgreSQL (db.t4g.large): $150/month
- NAT Gateway: $32/month
- Data Transfer: ~$50/month

**Total Infrastructure:** ~$230/month

**Grand Total (100 hotels):** ~$630/month = **$6.30/hotel/month**

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| HostPMS API changes | High | Medium | Version API calls, monitor changelog |
| Webhook delivery failures | Medium | Low | Polling backup every hour |
| Data quality issues | High | Medium | Strict validation, data quality tests |
| Rate limiting by HostPMS | Medium | Low | Exponential backoff, queue requests |
| Cost overruns | Low | Medium | CloudWatch cost alarms, budget alerts |
| GDPR violations | High | Low | Legal review, DPA with HostPMS |

---

## Success Criteria

**Phase 1 (Foundation):** Week 1
- ✅ Infrastructure deployed
- ✅ Database schema ready
- ✅ Monitoring configured

**Phase 2 (Webhooks):** Week 2
- ✅ Webhooks receiving events
- ✅ <30s latency
- ✅ >99% success rate

**Phase 3 (Polling):** Week 2
- ✅ Hourly polling working
- ✅ Incremental sync accurate
- ✅ OAuth token management working

**Phase 4 (ETL):** Week 3
- ✅ Data correctly transformed
- ✅ Portuguese → English mapping
- ✅ Duplicates removed

**Phase 5 (Testing):** Week 4
- ✅ All tests passing
- ✅ Load tests successful
- ✅ Documentation complete

**Phase 6 (Production):** Week 5
- ✅ 3 pilot hotels live
- ✅ Zero critical issues
- ✅ Data accuracy > 99.9%

---

## Appendix

### A. HostPMS API Reference
- Official Docs: https://docs.hostpms.com/api/v3
- OAuth Guide: https://docs.hostpms.com/api/v3/authentication
- Webhooks Guide: https://docs.hostpms.com/api/v3/webhooks

### B. Field Mapping Reference
See TR-2 above for complete mapping tables

### C. Error Codes
| Code | Description | Action |
|------|-------------|--------|
| 401 | Invalid OAuth token | Refresh token |
| 429 | Rate limit exceeded | Exponential backoff |
| 500 | HostPMS server error | Retry up to 3 times |
| 503 | Service unavailable | Queue for later retry |

### D. Sample Payloads
See GitHub repo: `/docs/samples/hostpms/`

---

**Document Status:** Active Development
**Last Updated:** October 23, 2025
**Next Review:** Start of Phase 2
