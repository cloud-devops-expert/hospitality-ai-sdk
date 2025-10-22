# Quick Start Guide

## Installation

```bash
cd hospitality-ai-sdk
npm install
```

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Try the Features

### 1. Sentiment Analysis

Navigate to `/sentiment`

**Try this review:**

```
The room was absolutely amazing! Clean, comfortable, and the staff were incredibly helpful. Would definitely recommend!
```

**Expected Result:**

- Sentiment: POSITIVE
- Score: ~0.8
- Method: Traditional (no API cost)
- Processing time: ~5ms

### 2. Room Allocation

Navigate to `/allocation`

**Try this configuration:**

- Guest Name: John Doe
- Room Type: Double
- VIP Status: ✓ Checked
- Preferred View: Ocean
- Preferred Floor: High

**Expected Result:**

- Assigned Room: Room 802 (Deluxe, Ocean view, Floor 8)
- Match Score: 90/100
- Reasons: VIP ocean view priority, High floor preference matched

### 3. Dynamic Pricing

Navigate to `/pricing`

**Try this configuration:**

- Base Price: $200
- Room Type: Suite
- Check-in Date: Any Friday in July
- Occupancy Rate: 85%

**Expected Result:**

- Final Price: ~$450-500
- Adjustments: High season +30%, Friday +15%, High demand +15%, Suite premium +50%

### 4. Demand Forecast

Navigate to `/forecast`

**Settings:**

- Forecast Period: 14 days
- Click "Generate Forecast"

**Expected Result:**

- Predicted occupancy for next 14 days
- Trend detection (increasing/decreasing/stable)
- Seasonality pattern (weekly)
- Confidence scores for each prediction

## Enable AI Features (Optional)

1. Create `.env` file:

```bash
cp .env.example .env
```

2. Add your OpenAI API key:

```
OPENAI_API_KEY=sk-...your-key-here
NEXT_PUBLIC_ENABLE_LLM=true
```

3. Restart the dev server

4. In sentiment analysis, check "Force AI analysis" to use LLM

## Architecture Overview

### Cost-Effective Design

```
User Request
    ↓
[Traditional Processing] ← Always try first (free, fast)
    ↓
[Confidence Check]
    ↓
[AI Processing] ← Only if needed (costs money, slower)
    ↓
Result + Method Used
```

### File Structure

```
lib/
├── sentiment/
│   ├── traditional.ts    # Keyword-based analysis
│   ├── ai.ts             # LLM analysis (optional)
│   └── hybrid.ts         # Smart escalation logic
├── allocation/
│   ├── types.ts          # Type definitions
│   └── rule-based.ts     # Scoring algorithm
├── pricing/
│   └── traditional.ts    # Multi-factor pricing
└── forecast/
    └── statistical.ts    # Time-series analysis
```

## Understanding the Results

### Sentiment Analysis

**Score Range**: -1 (very negative) to 1 (very positive)

- 0.7 to 1.0: Very positive
- 0.2 to 0.7: Positive
- -0.2 to 0.2: Neutral
- -0.7 to -0.2: Negative
- -1.0 to -0.7: Very negative

**Confidence**: 0 to 1

- > 0.7: High confidence (reliable result)
- 0.3 to 0.7: Medium confidence
- < 0.3: Low confidence (escalate to AI)

### Room Allocation

**Match Score**: 0 to 100

- 80-100: Excellent match
- 60-80: Good match
- 40-60: Acceptable match
- < 40: Poor match (consider alternatives)

### Dynamic Pricing

**Price Adjustments**:

- Positive (red): Price increase
- Negative (green): Discount
- Each adjustment shows factor, amount, and percentage

### Demand Forecast

**Confidence**:

- > 80%: Reliable forecast
- 60-80%: Moderate confidence
- < 60%: Use with caution

**Trend**:

- ↗ Increasing: Demand going up
- ↘ Decreasing: Demand going down
- → Stable: No significant change

## Common Issues

### Module not found

```bash
npm install
```

### Port 3000 already in use

```bash
# Use different port
PORT=3001 npm run dev
```

### API key not working

- Check `.env` file exists in root directory
- Verify `OPENAI_API_KEY` format: `sk-...`
- Restart dev server after changing `.env`

## Next Steps

1. **Read Documentation**
   - `.agent/docs/architecture.md` - System design
   - `.agent/docs/use-cases.md` - Detailed use cases
   - `.agent/experiments/cost-analysis.md` - Cost breakdown

2. **Explore Code**
   - `lib/` - Core algorithms
   - `app/` - UI components and pages
   - `.agent/prompts/` - AI prompt templates

3. **Customize**
   - Modify keyword lists in `lib/sentiment/traditional.ts`
   - Adjust scoring weights in `lib/allocation/rule-based.ts`
   - Tune pricing factors in `lib/pricing/traditional.ts`
   - Configure forecast parameters in `lib/forecast/statistical.ts`

4. **Extend**
   - Add new pricing factors
   - Implement caching layer
   - Add batch processing API
   - Integrate with your hotel management system

## Production Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Environment Variables

Set in Vercel dashboard:

- `OPENAI_API_KEY` (optional)
- `NEXT_PUBLIC_ENABLE_LLM=true` (if using AI)

### Build

```bash
npm run build
npm start
```

## Support

- GitHub Issues: Report bugs and request features
- Documentation: Check `.agent/docs/` folder
- Examples: See demo pages in `app/` folder

---

**Happy coding!** Remember: The best solution is the one that works, ships, and doesn't break the bank.
