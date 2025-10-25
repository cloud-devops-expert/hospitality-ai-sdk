# Strategic Recommendations - Competitive Positioning

**Date:** October 25, 2025
**Purpose:** Actionable strategies to win hospitality AI market
**Target:** Small/independent hotels (60% of market, drastically underserved)

---

## Executive Summary

**Market Opportunity:** $4.2B+ by 2031 (60% of properties priced out of current AI solutions)

**Our Competitive Advantages:**
1. **10-100x cheaper** ($150-2,000/year vs. $10,000-150,000/year)
2. **Only local-first solution** (competitors are 100% cloud-only)
3. **Privacy-first by design** (data never leaves property)
4. **Offline-capable** (95% operations without internet)
5. **No vendor lock-in** (open standards, export anytime)

**Recommended Strategy:** "Land and Expand"
- **Phase 1 (Months 1-6):** Win small hotels with free/low-cost browser ML
- **Phase 2 (Months 6-12):** Upsell medium hotels to on-premise Greengrass
- **Phase 3 (Months 12-24):** Enterprise sales to large hotels/chains

---

## Immediate Actions (Next 30 Days)

### 1. Build Competitive Proof Points

#### **Action 1.1: Browser ML Sentiment Analysis Demo**
- **What:** Live in-browser sentiment analysis (Transformers.js)
- **Why:** Proves "TrustYou $4,200/year → $0, works offline"
- **Where:** `/app/demos/sentiment-analysis-browser`
- **Timeline:** 3-5 days
- **Success Metric:** <100ms latency, works offline, 80%+ accuracy

**Implementation:**
```typescript
// Use existing lib/sentiment/traditional.ts as baseline
// Add Transformers.js for ML enhancement
// Deploy at sentiment-analysis.hospitality-ai-sdk.com
```

**Marketing Message:**
> "Process 1,000 reviews in 8 seconds. In your browser. For free. Forever."
> "TrustYou charges $4,200/year. We charge $0. Same results, your data stays private."

---

#### **Action 1.2: Traditional Algorithm ROI Calculator**
- **What:** Interactive calculator showing cost savings
- **Why:** Proves "70% of operations don't need AI"
- **Where:** `/app/demos/roi-calculator`
- **Timeline:** 2-3 days
- **Success Metric:** 10+ hotel signups/week

**Features:**
- Input: Hotel size, current tech stack
- Output: 5-year cost comparison (us vs. competitors)
- Examples: RoomPriceGenie, Duetto, TrustYou comparisons

**Marketing Message:**
> "Room allocation: $15,000/year (Duetto) → $0 (our constraint solver)"
> "Dynamic pricing: $10,000/year (Atomize) → $0 (our multi-factor algorithm)"

---

#### **Action 1.3: Competitive Comparison Pages**
- **What:** SEO-optimized comparison pages
- **Why:** Capture bottom-of-funnel searches
- **Where:** `/app/compare/[competitor]`
- **Timeline:** 5-7 days
- **Success Metric:** Rank #1 for "[Competitor] alternative" within 3 months

**Pages to Create:**
1. `/compare/roompricegenie` - "RoomPriceGenie Alternative: $0-350/year vs. $588/year"
2. `/compare/duetto` - "Duetto Alternative: 95% Cost Savings"
3. `/compare/trustyou` - "TrustYou Alternative: Free Browser ML"
4. `/compare/canary` - "Canary Technologies Alternative: On-Premise Privacy"

**SEO Strategy:**
- Target: "[Competitor] alternative for small hotels"
- Target: "[Competitor] pricing vs [Our Solution]"
- Target: "cheap hotel revenue management software"

---

### 2. Content Marketing Blitz

#### **Action 2.1: Blog Series - "The Hidden Cost of Cloud AI"**
- **Post 1:** "Why Small Hotels Can't Afford SaaS AI (And What to Do About It)"
  - Stats: 62% cite budget constraints
  - Problem: $5,000-50,000/year minimum
  - Solution: Local-first AI at <$500/year

- **Post 2:** "Business Continuity: What Happens When Your Internet Dies?"
  - Real story: Hotel loses internet, can't check in guests (cloud PMS)
  - Solution: 95% offline operations with Greengrass

- **Post 3:** "GDPR Compliance: Why On-Premise AI Matters in 2025"
  - EU AI Act requirements (DPIA, audit logs)
  - Cloud vendors: "Data stored in unknown countries"
  - Solution: Your property = your data

**Timeline:** 1 post/week for 3 weeks
**Distribution:** LinkedIn, Hotel Tech Report, Hospitality Net, Reddit (r/hospitalitymanagement)

---

#### **Action 2.2: Case Study - "From $44,200/year to $1,264/year"**
- **Target:** Medium hotel (100 rooms) using Duetto + Canary + TrustYou
- **Problem:** High costs, data privacy concerns, internet dependency
- **Solution:** Greengrass deployment (Intel NUC + AWS)
- **Results:**
  - 97% cost reduction (Year 1)
  - 95% offline operations
  - <50ms latency (vs. 500ms cloud)
  - GDPR compliant (data on-premise)

**Timeline:** Partner with 1-2 beta hotels (Months 2-4)
**Distribution:** HITEC 2026 booth, Hotel Management Magazine, LinkedIn

---

#### **Action 2.3: Video Series - "5-Minute AI Demos"**
- **Episode 1:** Browser sentiment analysis (live demo, TrustYou comparison)
- **Episode 2:** Room allocation algorithm (Duetto comparison)
- **Episode 3:** Dynamic pricing (RoomPriceGenie comparison)
- **Episode 4:** Greengrass setup (Intel NUC unboxing to first inference)

**Format:** Screen recording + voiceover, <5 minutes each
**Platform:** YouTube, LinkedIn, Twitter
**Timeline:** 1 video/week for 4 weeks

---

### 3. Partnership Strategy

#### **Action 3.1: Partner with PMS Vendors (Oracle/Amadeus Competitors)**
- **Target:** Mews, Cloudbeds, WebRezPro, RoomKeyPMS
- **Value Prop:** "Add AI revenue management for <$500/year (vs. Duetto at $15K)"
- **Integration:** REST API → PMS webhooks → our pricing engine
- **Revenue Share:** 20% to PMS, 80% to us

**Timeline:** Reach out to 5 PMS vendors by Month 2
**Success Metric:** 1 partnership signed by Month 4

---

#### **Action 3.2: Partner with IoT Hardware Vendors**
- **Target:** Advantech, Intel IoT, NVIDIA Jetson partners
- **Value Prop:** "Bundle Greengrass + hardware for hotels"
- **Package:** Intel NUC + pre-configured Greengrass image + 1-year support
- **Pricing:** $999 (hardware + software) vs. $400 (DIY)

**Timeline:** Reach out to 3 hardware vendors by Month 3
**Success Metric:** Co-marketing agreement by Month 5

---

#### **Action 3.3: Partner with Hospitality Consultants**
- **Target:** Revenue management consultants, hotel tech advisors
- **Value Prop:** "White-label our solution for your clients"
- **Revenue Share:** 30% to consultant, 70% to us
- **Support:** We provide tech, they provide customer relationship

**Timeline:** Reach out to 10 consultants by Month 2
**Success Metric:** 2 white-label partners by Month 4

---

## Short-Term Strategy (Months 1-6)

### Goal: Win 100 Small Hotels (<50 rooms)

#### **Pricing Strategy**

```
┌─────────────────────────────────────────────────────────────┐
│ FREE TIER                                                    │
├─────────────────────────────────────────────────────────────┤
│ - Traditional algorithms (pricing, allocation, forecasting) │
│ - Basic sentiment analysis (keyword-based)                  │
│ - Up to 100 API calls/month                                 │
│ - Community support                                          │
│                                                              │
│ Price: $0/year                                               │
│ Target: 10-20 room properties                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STARTER TIER                                                 │
├─────────────────────────────────────────────────────────────┤
│ - Everything in Free +                                       │
│ - Browser ML (Transformers.js sentiment)                    │
│ - Up to 1,000 API calls/month                               │
│ - Email support                                              │
│                                                              │
│ Price: $150/year (~$12/month)                                │
│ Target: 20-30 room properties                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PRO TIER                                                     │
├─────────────────────────────────────────────────────────────┤
│ - Everything in Starter +                                    │
│ - Mobile app (TensorFlow Lite)                              │
│ - Up to 5,000 API calls/month                               │
│ - Priority email support                                     │
│                                                              │
│ Price: $350/year (~$29/month)                                │
│ Target: 30-50 room properties                               │
└─────────────────────────────────────────────────────────────┘
```

#### **Marketing Channels**

**1. Content SEO (Organic)**
- Target keywords:
  - "cheap hotel revenue management software"
  - "RoomPriceGenie alternative"
  - "free hotel AI tools"
  - "hotel revenue management for small hotels"
- Goal: 1,000 organic visits/month by Month 6

**2. Product Hunt Launch**
- Title: "Local-First AI for Hotels: Enterprise Features at Indie Prices"
- Tagline: "Process guest reviews in your browser. For free. Forever."
- Goal: Top 5 Product of the Day

**3. LinkedIn Organic**
- Post case studies, cost comparisons, demos
- Target: Hotel owners, revenue managers, consultants
- Goal: 500 followers by Month 3, 2,000 by Month 6

**4. Reddit/Communities**
- r/hospitalitymanagement (21K members)
- r/hotels (45K members)
- Hotel Tech Report forums
- Goal: 10 signups/month from community engagement

**5. Hotel Tech Report Listing**
- Free listing with reviews
- Target: 5-star rating from 10+ customers by Month 6
- Compete directly with RoomPriceGenie (#2 RMS)

---

#### **Sales Process**

**Step 1: Self-Service Demo (5 minutes)**
- Visit sentiment-analysis.hospitality-ai-sdk.com
- Upload 10 sample reviews (or use demo data)
- See results instantly (browser ML)
- Compare to TrustYou pricing ($4,200/year)

**Step 2: Free Trial (30 days)**
- Sign up for Free tier (no credit card)
- Connect to PMS (optional, via REST API)
- Test traditional algorithms (pricing, allocation)
- Receive automated email tips

**Step 3: Upgrade to Starter ($150/year)**
- Unlock browser ML sentiment
- Get 1,000 API calls/month
- Email support within 24 hours

**Step 4: Success & Retention**
- Monthly email: "Your savings this month: $350 vs. RoomPriceGenie"
- Quarterly business review: ROI analysis
- Refer-a-friend: Get 1 month free for each referral

---

## Medium-Term Strategy (Months 6-12)

### Goal: Win 50 Medium Hotels (50-150 rooms)

#### **Product: AWS IoT Greengrass Deployment**

**What:**
- Intel NUC (8GB RAM, 256GB SSD) - $400 one-time
- Pre-configured Greengrass image (Python ML stack)
- Local PostgreSQL replica (Aurora sync)
- On-premise ML inference (<50ms latency)

**Why:**
- 95% offline operations (business continuity)
- GDPR/CCPA compliant (data on-premise)
- 97% cost reduction vs. cloud SaaS
- <50ms latency (vs. 500ms cloud)

**Pricing:**

```
┌─────────────────────────────────────────────────────────────┐
│ GREENGRASS STARTER                                           │
├─────────────────────────────────────────────────────────────┤
│ - Intel NUC (customer purchases) - $400 one-time            │
│ - Pre-configured Greengrass image - Free                    │
│ - AWS IoT Greengrass - $22/month                            │
│ - Cloud APIs (minimal) - $10/month                          │
│                                                              │
│ Year 1 Total: $400 + $384 = $784                            │
│ Year 2+ Total: $384/year                                    │
│                                                              │
│ Compare to Duetto: $15,000-40,000/year ❌                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ GREENGRASS PRO (with Support)                                │
├─────────────────────────────────────────────────────────────┤
│ - Everything in Starter +                                    │
│ - Managed Greengrass deployment (we set up)                 │
│ - Priority support (24-hour SLA)                            │
│ - Quarterly system health checks                            │
│                                                              │
│ Year 1 Total: $400 + $384 + $500 = $1,284                   │
│ Year 2+ Total: $884/year                                    │
│                                                              │
│ Compare to Duetto + Canary: $30,000-70,000/year ❌          │
└─────────────────────────────────────────────────────────────┘
```

#### **Go-to-Market**

**1. Webinar Series**
- Title: "How to Run AI Offline: AWS Greengrass for Hotels"
- Content:
  - Why medium hotels need on-premise AI (business continuity)
  - Intel NUC unboxing and setup (live demo)
  - First ML inference in 2-4 hours
  - Cost comparison: $1,284/year vs. $30,000/year
- Goal: 50 attendees/webinar, 10% conversion

**2. Partnership with Intel/Advantech**
- Bundle: Intel NUC + Greengrass image + 1-year support = $999
- Co-marketing: Intel blog, email list, LinkedIn
- Goal: 20 hotels via partnership channel

**3. Case Study Campaign**
- Find 3 beta hotels (50-100 rooms)
- Deploy Greengrass (we handle setup)
- Track metrics:
  - Uptime (99.9%+ target)
  - Latency (<50ms target)
  - Cost savings (97%+ target)
- Publish case studies (Hotel Management Magazine, HITEC)

**4. Direct Sales (B2B)**
- Hire 1 sales rep (commission-based)
- Target: Independent hotels, boutique chains
- Outreach: LinkedIn, email, phone
- Pitch: "Cut AI costs 97% without sacrificing features"
- Goal: 5 deals/month by Month 9

---

## Long-Term Strategy (Months 12-24)

### Goal: Win 20 Large Hotels/Chains (150+ rooms)

#### **Product: Enterprise Greengrass**

**What:**
- NVIDIA Jetson or GPU-enabled server - $1,200-3,000 one-time
- Enterprise Greengrass with GPU acceleration
- Multi-property federated learning
- White-label options
- Dedicated account manager

**Pricing:**

```
┌─────────────────────────────────────────────────────────────┐
│ ENTERPRISE                                                   │
├─────────────────────────────────────────────────────────────┤
│ - NVIDIA Jetson/GPU server - $1,200-3,000 one-time         │
│ - Enterprise Greengrass - $100/month                        │
│ - Multi-property analytics - $200/month                     │
│ - Dedicated support (4-hour SLA) - $2,000/year              │
│                                                              │
│ Year 1 Total: $2,000 + $3,600 + $2,000 = $7,600            │
│ Year 2+ Total: $5,600/year                                  │
│                                                              │
│ Compare to IDeaS + Amadeus: $100,000-200,000/year ❌        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ WHITE-LABEL                                                  │
├─────────────────────────────────────────────────────────────┤
│ - Custom branding                                            │
│ - On-premise model training                                 │
│ - Dedicated infrastructure                                   │
│ - Custom integrations                                        │
│                                                              │
│ Price: $20,000-50,000/year (negotiated)                     │
│                                                              │
│ Compare to IDeaS + Amadeus: $150,000-300,000/year ❌        │
└─────────────────────────────────────────────────────────────┘
```

#### **Go-to-Market**

**1. Conference Presence**
- **HITEC 2026** (March, Charlotte)
  - Booth with live demos (browser ML, Greengrass)
  - Speaking session: "Local-First AI: The Future of Hospitality Tech"
  - Goal: 100 leads, 10 enterprise deals

- **HX: The Hotel Experience 2026** (May, New York)
  - Sponsor breakfast: "Cut AI Costs 95%: A CTO's Guide"
  - Meeting room for 1:1 demos
  - Goal: 50 leads, 5 enterprise deals

**2. Enterprise Sales Team**
- Hire: 1 VP Sales, 2 Account Executives
- Target: Top 100 independent hotel groups, boutique chains
- Tools: Salesforce CRM, LinkedIn Sales Navigator
- Compensation: Base + 15% commission
- Goal: $500K ARR by Month 18, $2M ARR by Month 24

**3. PR Campaign**
- Press release: "Hospitality AI SDK Saves Hotels 95% on AI Costs"
- Media targets:
  - Hotel Management Magazine
  - Hospitality Technology
  - PhocusWire
  - Skift
- Pitch: David vs. Goliath story (indie startup vs. Oracle/Amadeus)

**4. Analyst Relations**
- Brief: Gartner, Forrester, IDC on local-first AI
- Goal: "Cool Vendor in Hospitality Tech" (Gartner)
- Target: Magic Quadrant inclusion by 2027

---

## Competitive Defense Strategy

### If RoomPriceGenie Drops Prices

**Scenario:** RoomPriceGenie drops from $588/year to $200/year to compete

**Response:**
1. **Emphasize offline mode:** "Still cloud-only, still fails when internet dies"
2. **Emphasize privacy:** "Still third-party cloud, still GDPR concerns"
3. **Emphasize free tier:** "We have $0/year option, they don't"
4. **Emphasize scalability:** "We scale to on-premise, they can't"

**Action:** Double down on messaging "Local-First = Business Continuity + Privacy"

---

### If Duetto Launches "Budget" Tier

**Scenario:** Duetto launches $2,000-5,000/year tier for small hotels

**Response:**
1. **Still 10x more expensive:** "$2,000/year vs. $150/year - same core features"
2. **Still cloud-only:** "No offline mode, no privacy guarantees"
3. **Still vendor lock-in:** "Proprietary data formats, expensive to leave"
4. **Target different segment:** "Duetto Budget = medium hotels, we serve small hotels"

**Action:** Focus on <50 room properties (Duetto won't go lower than medium)

---

### If TrustYou Launches "Free" Tier

**Scenario:** TrustYou offers free sentiment analysis (limited)

**Response:**
1. **Emphasize browser ML:** "Runs in your browser, no data sent to TrustYou"
2. **Emphasize speed:** "8 seconds vs. 60 seconds (cloud API)"
3. **Emphasize limits:** "TrustYou free = 10 reviews/month, ours = unlimited"
4. **Emphasize privacy:** "Your data stays on your device, TrustYou still sees it"

**Action:** Market "True privacy: Zero data sent to third parties"

---

## Key Performance Indicators (KPIs)

### Month 3 Targets
- **Free tier signups:** 50
- **Paid customers:** 10 (Starter/Pro)
- **MRR:** $300 ($3,600 ARR)
- **Website traffic:** 1,000/month
- **Content:** 10 blog posts, 3 case studies

### Month 6 Targets
- **Free tier signups:** 200
- **Paid customers:** 50 (Starter/Pro)
- **MRR:** $1,250 ($15,000 ARR)
- **Website traffic:** 3,000/month
- **Greengrass pilots:** 3 beta hotels

### Month 12 Targets
- **Free tier signups:** 500
- **Paid customers:** 150 (100 Starter/Pro, 50 Greengrass)
- **MRR:** $5,000+ ($60,000 ARR)
- **Website traffic:** 10,000/month
- **Enterprise pipeline:** 10 qualified leads

### Month 24 Targets
- **Paid customers:** 500+ (300 Starter/Pro, 150 Greengrass, 50 Enterprise)
- **ARR:** $500K+
- **Team:** 10 people (5 eng, 3 sales, 2 marketing)
- **Market share:** 5% of small hotel RMS market

---

## Resource Requirements

### Team (Phase 1: Months 1-6)

```
Current: Solo founder (eng + product + marketing)

Immediate Needs:
- Keep solo (bootstrap as long as possible)
- Contract: Content writer ($500/month for blog posts)
- Contract: Video editor ($300/month for demos)

Budget: $800/month (~$5K for 6 months)
```

### Team (Phase 2: Months 6-12)

```
Add:
- Full-time engineer ($120K/year) - Greengrass deployment
- Contract sales rep (commission-only) - B2B outreach
- Content marketer ($50K/year part-time) - SEO, case studies

Budget: ~$15K/month (~$180K for Year 1)
```

### Team (Phase 3: Months 12-24)

```
Add:
- VP Sales ($150K + commission)
- 2x Account Executives ($80K + commission each)
- 2x Engineers ($120K each)
- Marketing Manager ($90K)

Budget: ~$60K/month (~$720K for Year 2)
```

---

## Funding Strategy

### Bootstrap (Months 1-12)
- **Goal:** Reach $60K ARR without external funding
- **Burn:** <$20K total (mostly content/marketing)
- **Runway:** Profitable by Month 9 (50 paid customers × $25/month avg)

### Seed Round (Optional, Month 12-18)
- **Goal:** Raise $500K-1M for team expansion
- **Use:** Hire sales team, enterprise push, HITEC booth
- **Valuation:** $5M (based on $60K ARR, 10x revenue growth potential)
- **Investors:** Hospitality-focused VCs, angels with hotel industry experience

### Series A (Optional, Month 24+)
- **Goal:** Raise $3-5M for scale
- **Use:** International expansion, enterprise features, M&A
- **Valuation:** $30-50M (based on $500K ARR, path to $10M ARR)

**Preferred Strategy:** Bootstrap as long as possible, raise only for acceleration

---

## Risk Mitigation

### Risk 1: Competitors Launch Local-First Solutions

**Likelihood:** Medium (12-24 months)
**Impact:** High (erodes differentiation)

**Mitigation:**
- Move fast: Ship browser ML + Greengrass POC within 6 months
- Build moats: Open-source core (community), RLS at DB level (technical), first-mover advantage (time)
- Emphasize: "Original local-first AI for hotels" brand positioning

---

### Risk 2: Small Hotels Don't Adopt AI

**Likelihood:** Low (trend is toward AI adoption)
**Impact:** High (60% of target market)

**Mitigation:**
- Free tier: Zero friction to try ($0 cost)
- Education: Blog series on "How small hotels compete with chains using AI"
- Proof: Case studies showing 10-30% revenue boost from traditional algorithms alone

---

### Risk 3: AWS Greengrass Too Complex for Hotels

**Likelihood:** Medium (technical setup required)
**Impact:** Medium (limits medium hotel adoption)

**Mitigation:**
- Managed deployment: We handle setup ($500 one-time fee)
- Pre-configured image: Download, flash USB, boot NUC (30-minute setup)
- Partnership: Intel/Advantech bundle with turnkey solution
- Alternative: Offer cloud-hosted option for customers not ready for on-premise

---

### Risk 4: Traditional Algorithms Not Sufficient

**Likelihood:** Low (constraint satisfaction proven for allocation, multi-factor proven for pricing)
**Impact:** Medium (undermines "70% don't need AI" positioning)

**Mitigation:**
- Hybrid approach: Traditional + AI fallback (not traditional-only)
- Continuous improvement: Add more sophisticated algorithms over time
- Measurement: Track performance vs. competitors, publish benchmarks

---

## Success Metrics Summary

### Customer Acquisition
- **CAC:** <$100 (content marketing, organic)
- **LTV:** $1,000+ (5+ year retention at $150-350/year)
- **LTV:CAC:** 10:1+ (sustainable growth)
- **Payback:** <3 months

### Product-Market Fit
- **NPS:** 50+ (cost savings + privacy = high satisfaction)
- **Churn:** <5% annually (no vendor lock-in = high trust)
- **Expansion:** 30%+ customers upgrade within 12 months
- **Referrals:** 20%+ customers refer another hotel

### Market Position
- **Brand:** "Local-First AI for Hotels" (own the category)
- **SEO:** Rank #1 for "hotel AI alternative" by Month 6
- **Reviews:** 5-star average on Hotel Tech Report by Month 12
- **Market Share:** 5% of small hotel RMS market by Year 3

---

## Final Takeaways

### What to Do Right Now (This Week)

1. **Ship browser ML demo** (sentiment analysis, TrustYou comparison)
2. **Launch comparison pages** (RoomPriceGenie, Duetto, TrustYou alternatives)
3. **Write 1st blog post** ("Why Small Hotels Can't Afford SaaS AI")
4. **Create ROI calculator** (interactive, shareable)
5. **Post on LinkedIn** (demo video, cost comparison chart)

### What to Do This Month

1. **Product Hunt launch** ("Local-First AI for Hotels")
2. **Reach out to 5 PMS vendors** (partnership discussions)
3. **Start Greengrass POC** (1-2 beta hotels)
4. **Create case study template** (cost savings, privacy, offline mode)
5. **Set up analytics** (Google Analytics, Mixpanel, customer tracking)

### What to Do This Quarter

1. **Win 10 paid customers** (Starter/Pro tier)
2. **Deploy 1 Greengrass installation** (case study)
3. **Publish 10 blog posts** (SEO, thought leadership)
4. **Build email list** (500+ hotel owners/managers)
5. **Achieve $300 MRR** ($3,600 ARR run rate)

---

## The Big Picture

**We're not just building a product. We're creating a category.**

**"Local-First AI for Hotels"** = new market positioning that competitors can't copy without rebuilding their entire architecture.

**The opportunity is massive:**
- 60% of hotels priced out of current AI solutions
- $4.2B+ market by 2031
- Zero direct competition in local-first space

**The path is clear:**
1. Win small hotels with free/low-cost browser ML (Months 1-6)
2. Upsell medium hotels to on-premise Greengrass (Months 6-12)
3. Land enterprise customers with white-label solutions (Months 12-24)

**Let's ship and dominate this market.**
