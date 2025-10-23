# Architecture Summary - Quick Reference

**Last Updated**: 2025-10-23
**Status**: FINAL - Market-Segmented Architecture

## TL;DR

**Different hotels need different architectures** based on size and IT capabilities:

- **Small Hotels** (60% of market): Cloud SaaS with browser/mobile ML
- **Medium/Large Hotels** (40% of market): On-premise Greengrass with OFFLINE operation

Both need web + mobile apps, but they connect differently.

## Architecture Decision Tree

```
Is hotel <50 rooms with no IT department?
│
├─ YES → Small Hotel (Cloud-First)
│         - Web + mobile apps (cloud-hosted)
│         - Browser ML (Transformers.js) + Mobile ML (TensorFlow Lite)
│         - Cloud APIs (Timefold, Aurora Serverless)
│         - Cost: $99/month
│         - Offline: 80% (Service Workers caching)
│
└─ NO → Medium/Large Hotel (On-Premise-First)
          - Greengrass server (Intel NUC $580)
          - Web + mobile apps connect to greengrass.local
          - All ML on-premise
          - Cost: $299/month + $680 setup
          - Offline: 100% (full replica, no internet needed)
```

## Key Principles

1. **"One thing does not replace the other because the main purpose is to have business continuity."**
   - Small hotels: Can't afford downtime → Cloud redundancy
   - Medium/Large hotels: Can't afford downtime → OFFLINE operation

2. **Cloudflare Workers DON'T help with business continuity**
   - Still cloud-dependent (require internet)
   - Small hotels: Browser ML is faster (50-200ms vs 100-400ms)
   - Medium/Large hotels: Need 100% offline (can't use Workers)

3. **Both segments need web + mobile apps**
   - Small: Apps → Cloud
   - Medium/Large: Apps → greengrass.local (on-premise)

## Small Hotels (60% of Market)

**Profile**: <50 rooms, no IT department, boutique/B&B

**Stack**:
- Next.js web app (Vercel/CloudFront)
- React Native mobile app (Expo)
- Browser ML: Transformers.js (sentiment, OCR)
- Mobile ML: TensorFlow Lite (photo processing)
- Cloud: Timefold (ECS), Aurora Serverless (RLS), Lambda/ECS (ML)

**Cost**: $99/month ($50 cloud infra + $49 margin)

**Offline**: 80% (Service Workers cache 24h of data)

**Business Continuity**: Multi-region cloud, offline caching, read-only mode when internet down

## Medium/Large Hotels (40% of Market)

**Profile**: 50+ rooms, have IT department, full-service hotels/resorts

**Stack**:
- Greengrass server: Intel NUC ($580) in server room
- Web + mobile apps connect to greengrass.local (NOT cloud)
- On-premise ML: Sentiment, vision, speech, optimization (all on Greengrass)
- Local PostgreSQL replica (syncs with cloud every 15 min)
- IoT integration: Room sensors, thermostats, door locks (MQTT)

**Cost**: $299/month + $680 setup ($22 AWS + $277 margin)

**Offline**: 100% (works without internet!)

**Business Continuity**: OFFLINE-CAPABLE, local replica, no cloud dependency

## Technology Comparison

| Technology | Small Hotels | Medium/Large Hotels |
|-----------|-------------|---------------------|
| **Web App** | Next.js (cloud) | Next.js (connects to greengrass.local) |
| **Mobile App** | React Native (cloud) | React Native (connects to greengrass IP) |
| **Browser ML** | Transformers.js (70% ops) | Not primary (apps use local server) |
| **On-Premise** | ❌ None | ✅ Greengrass (Intel NUC) |
| **ML Inference** | Browser + Cloud | On-Premise (Greengrass) |
| **Database** | Cloud (Aurora RLS) | Local replica + Cloud sync |
| **Offline** | 80% (cached) | 100% (full replica) |
| **IoT** | ❌ Limited | ✅ Full (MQTT, sensors) |
| **Timefold** | Cloud (ECS) | On-Premise (Greengrass) |

## Cost Breakdown (Year 1 - 100 Properties)

**60 Small Hotels**:
- Revenue: $71,280 ($99/month × 60 × 12)
- Costs: $36,000 (cloud infra)
- Gross Profit: $35,280 (49% margin)

**40 Medium/Large Hotels**:
- Revenue: $143,520 ($299/month × 40 × 12)
- Setup Fees: $27,200 ($680 × 40, one-time)
- Costs: $37,760 (hardware $23K + AWS $11K + install $4K)
- Gross Profit: $132,960 (78% margin)

**Year 1 Total**:
- Revenue: $242,000
- Gross Profit: $168,240 (69% margin)
- EBITDA: ~$120,000 (50% margin after OpEx)

## Implementation Roadmap

**Month 1-3: Small Hotels (HIGHEST PRIORITY - 60% of market)**:
- ✅ Next.js web app with Service Workers
- ✅ React Native mobile app with TensorFlow Lite
- ✅ Browser ML (Transformers.js)
- ✅ Cloud APIs (Timefold ECS, Aurora Serverless, Lambda ML)

**Month 2-4: Medium/Large Hotels (HIGH PRIORITY - 40% of market)**:
- ✅ Greengrass components (sentiment, vision, speech, Timefold)
- ✅ PostgreSQL local replica (bi-directional sync)
- ✅ IoT integration (MQTT, sensors)
- ✅ Web/mobile apps configured for greengrass.local

**Month 4-6: Both Segments**:
- Model optimization (ONNX for browser, quantization for Greengrass)
- Cross-property analytics
- Model training pipeline

## Why This Architecture Works

1. **Serves 100% of market** (both small and medium/large)
2. **Each segment gets optimal solution** (cloud vs on-premise)
3. **Business continuity addressed** (cloud redundancy vs offline operation)
4. **Cost-effective** (69% gross margin)
5. **Realistic** (hotels want what they understand and can manage)

## What We're NOT Using

❌ **Cloudflare Workers**: Don't help with business continuity (still cloud-dependent)
❌ **Single architecture**: Can't serve both segments with one approach
❌ **Cloud-only**: Medium/Large hotels need offline operation
❌ **On-premise-only**: Small hotels can't afford/manage servers

## References

**MANDATORY READING**:
- `.agent/docs/market-segmented-architecture.md` - Complete architecture (1,100+ lines)
- `.agent/docs/iot-greengrass-architecture.md` - Greengrass technical details
- `.agent/docs/local-first-ml-architecture.md` - Browser/mobile ML implementation
- `.claude/CLAUDE.md` - RULE 16 (Market-Segmented Architecture hard rule)

**Financial**:
- `.agent/docs/financial-projections.md` - Revenue model
- `.agent/docs/industry-coverage.md` - TAM/SAM/SOM analysis

**Implementation**:
- `.agent/docs/implementation-roadmap.md` - 24-month plan
- `lib/greengrass/` - Greengrass proof-of-concept

---

**Final Recommendation**: Build for BOTH segments in parallel:

1. **Months 1-3**: Focus on small hotels (60% of market, easier to build, cloud SaaS)
2. **Months 2-4**: Add medium/large hotels (40% of market, higher revenue per customer)
3. **Month 4+**: Optimize both, cross-sell features

**This is the correct architecture.** It serves the entire market with appropriate solutions for each segment, addresses business continuity, and generates strong margins (69% gross, 50% EBITDA).
