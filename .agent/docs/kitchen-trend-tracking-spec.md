# Kitchen Operations: Document-Based Trend Tracking Specification

**Purpose**: Track predicted vs actual consumption to improve forecasting accuracy and prove ROI.

**Date**: 2025-01-25
**Status**: Production Ready

---

## 1. Overview

### Why Track Trends?

The kitchen forecasting system generates predictions, but without tracking **actual consumption**, we can't:
- **Prove** the system is working (chef needs data for blame protection)
- **Improve** predictions over time (machine learning requires feedback)
- **Calculate** ROI (management needs hard numbers)
- **Detect** patterns (Friday +8% demand, event accuracy 94%, etc.)

### How It Works

```
Daily Flow:
1. System predicts: "Breakfast Buffet: 85 servings"
2. Chef preps: 94 servings (85 × 1.1 buffer)
3. After service: Staff records leftovers: 1 serving (count what's LEFT in pan)
4. System calculates: Consumed = 94 - 1 = 93 servings
5. System updates: Accuracy = |85 - 93| / 93 = 91% accuracy
6. Next day: System learns from this data
```

**Why Record Leftovers (Not Consumption)?**
- ✅ **Easier for staff**: Count what's left in the pan/tray (visible)
- ✅ **More accurate**: No need to track who ate what
- ✅ **Faster data entry**: Single count per menu item
- ✅ **Natural workflow**: Staff already check leftovers for disposal
- ❌ **Tracking consumption** is hard: Requires counting every guest served

---

## 2. Data Structure

### Daily Record Schema

Each day's forecast and actual consumption is stored as a JSON document:

```typescript
interface DailyForecastRecord {
  // Identifiers
  id: string;                    // UUID v7 (time-sortable)
  propertyId: string;            // Hotel ID
  date: string;                  // ISO 8601 date: "2024-01-19"

  // Context (what factors influenced prediction)
  context: {
    occupancyRate: number;       // 75
    dayOfWeek: string;           // "Friday"
    isWeekend: boolean;          // false
    hasSpecialEvent: boolean;    // false
    eventType?: string;          // "conference" | "wedding" | null
    weatherCondition?: string;   // "sunny" | "rainy" | "cold"
    seasonalPeriod?: string;     // "summer_peak" | "winter_low"
  };

  // Predictions (what system forecasted)
  forecasts: {
    menuItemId: string;          // "B001"
    menuItemName: string;        // "Breakfast Buffet"
    category: string;            // "breakfast" | "lunch" | "dinner"

    // Predicted values
    predictedDemand: number;     // 85 servings
    recommendedPrepQty: number;  // 94 servings (85 × 1.1)
    safetyBuffer: number;        // 1.1 (10%)

    // Prediction metadata
    confidenceScore: number;     // 90 (0-100)
    baseDemandAvg: number;       // 85 (historical average)
    multipliers: {
      occupancy: number;         // 1.0
      dayType: number;           // 1.0 (weekday)
      event: number;             // 1.0 (no event)
    };

    // Cost estimation
    costPerServing: number;      // 8.00
    estimatedWasteCost: number;  // 12.00 (if over-prep by 30%)
  }[];

  // Actuals (what REALLY happened - filled after service)
  actuals: {
    menuItemId: string;          // "B001"

    // Actual values (recorded by staff)
    actualLeftovers: number;     // 1 serving (WHAT STAFF RECORDS - count what's in pan)
    actualPrepQty: number;       // 94 servings (what chef prepped)
    actualConsumption: number;   // 93 servings (CALCULATED: 94 - 1 = 93)

    // Stockout tracking
    stockoutOccurred: boolean;   // false (never ran out)
    stockoutTime?: string;       // null
    emergencyBatchMade: boolean; // false

    // Quality notes (optional)
    staffNotes?: string;         // "Ran low at 9:30 AM but didn't stockout"
    guestComplaints?: number;    // 0
  }[];

  // NOTE: Staff records actualLeftovers (easy: count what's left).
  //       System calculates actualConsumption = actualPrepQty - actualLeftovers

  // Calculated metrics (auto-generated after actuals are recorded)
  metrics: {
    menuItemId: string;

    // Accuracy calculations
    predictionError: number;     // abs(85 - 93) = 8 servings
    predictionAccuracy: number;  // 100 - (8/93 × 100) = 91.4%
    prepAccuracy: number;        // 100 - (1/94 × 100) = 98.9%

    // Waste calculations
    wastePercentage: number;     // (1/94) × 100 = 1.1%
    wasteCost: number;           // 1 × $8 = $8.00

    // Savings calculations
    traditionalPrepQty: number;  // 85 × 1.3 = 111 servings
    traditionalWaste: number;    // 111 - 93 = 18 servings
    wasteReduction: number;      // 18 - 1 = 17 servings saved
    costSavings: number;         // 17 × $8 = $136
  }[];

  // Aggregates (summary for the day)
  summary: {
    totalPredicted: number;      // 340 servings (all meals)
    totalActual: number;         // 348 servings
    totalWasted: number;         // 12 servings
    totalCostSavings: number;    // $420
    averageAccuracy: number;     // 94.8%
    stockoutEvents: number;      // 0
  };

  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp (when actuals recorded)
  createdBy: string;             // User ID (system or chef)
  status: 'predicted' | 'completed'; // Lifecycle state
}
```

---

## 3. Data Collection Workflow

### Morning: Generate Predictions

**When**: 5:00 AM daily (automated)

```typescript
// Pseudo-code
async function generateDailyForecast() {
  const today = new Date().toISOString().split('T')[0];

  // Get context
  const occupancy = await getExpectedOccupancy(today);
  const events = await getScheduledEvents(today);
  const weather = await getWeatherForecast(today);

  // Generate predictions
  const forecasts = await predictDemandForAllMenuItems({
    occupancy,
    dayOfWeek: getDayOfWeek(today),
    hasSpecialEvent: events.length > 0,
    weatherCondition: weather.condition,
  });

  // Create record
  const record: DailyForecastRecord = {
    id: generateUUIDv7(),
    propertyId: getCurrentPropertyId(),
    date: today,
    context: { occupancy, ... },
    forecasts: forecasts,
    actuals: [], // Empty - will be filled after service
    metrics: [], // Empty - will be calculated after actuals
    summary: {}, // Empty - will be calculated after actuals
    status: 'predicted',
    createdAt: new Date().toISOString(),
  };

  // Save to database
  await db.collection('daily_forecasts').insertOne(record);

  // Generate Chef's Prep Sheet (PDF/Email)
  await generatePrepSheet(record);

  return record;
}
```

### Evening: Record Actuals

**When**: After each meal service (8 PM for breakfast, 2 PM for lunch, 9 PM for dinner)

**Who**: Kitchen staff or manager

**UI**: Simple form (staff records what's LEFT, not consumed):

```
POST-SERVICE DATA ENTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date: Friday, January 19, 2024
Meal: Breakfast

📝 Instructions: Count what's LEFT in each pan/tray

Breakfast Buffet:
  Predicted: 85 servings
  Prepped: 94 servings

  👉 Leftovers (count what's in pan): [____1___] servings
  System will calculate: Consumed = 94 - 1 = 93 servings ✓
  👉 Did you run out? [No ✓] [Yes]
  👉 Notes (optional): [Ran low at 9:30 AM but didn't stockout_____]

Omelette Station:
  Predicted: 45 servings
  Prepped: 50 servings

  👉 Leftovers (count what's in pan): [____3___] servings
  System will calculate: Consumed = 50 - 3 = 47 servings ✓
  👉 Did you run out? [No ✓] [Yes]
  👉 Notes: [________________________________]

[Submit Data] [Save Draft]
```

**Key Advantage**: Staff just counts what's LEFT in the pan (easy, visible), not what was consumed (hard, requires tracking guests).

**Backend**:

```typescript
async function recordActualConsumption(date: string, actuals: ActualData[]) {
  // Find today's forecast record
  const record = await db.collection('daily_forecasts')
    .findOne({ date, propertyId: getCurrentPropertyId() });

  if (!record) {
    throw new Error(`No forecast found for ${date}`);
  }

  // Add actuals (staff recorded leftovers, we calculate consumption)
  record.actuals = actuals.map(a => {
    const prepQty = record.forecasts.find(f => f.menuItemId === a.menuItemId)!.recommendedPrepQty;
    const consumption = prepQty - a.actualLeftovers;  // Calculate consumption

    return {
      menuItemId: a.menuItemId,
      actualLeftovers: a.actualLeftovers,        // What staff counted (in pan)
      actualPrepQty: prepQty,                     // What chef prepped
      actualConsumption: consumption,             // Calculated: prepped - leftovers
      stockoutOccurred: a.stockoutOccurred,
      staffNotes: a.notes,
    };
  });

  // Calculate metrics
  record.metrics = calculateMetrics(record.forecasts, record.actuals);
  record.summary = calculateSummary(record.metrics);
  record.status = 'completed';
  record.updatedAt = new Date().toISOString();

  // Update database
  await db.collection('daily_forecasts').updateOne(
    { id: record.id },
    { $set: record }
  );

  // Trigger learning/retraining
  await updateForecastingModel(record);

  return record;
}
```

---

## 4. Storage Options

### Option A: PostgreSQL (Recommended for Production)

**Schema**:

```sql
-- Main forecasts table
CREATE TABLE daily_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  property_id UUID NOT NULL REFERENCES properties(id),
  date DATE NOT NULL,
  context JSONB NOT NULL,
  forecasts JSONB NOT NULL,
  actuals JSONB,
  metrics JSONB,
  summary JSONB,
  status VARCHAR(20) DEFAULT 'predicted',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by UUID REFERENCES users(id),

  UNIQUE(property_id, date)
);

-- Indexes for fast queries
CREATE INDEX idx_forecasts_property_date ON daily_forecasts(property_id, date DESC);
CREATE INDEX idx_forecasts_status ON daily_forecasts(status);
CREATE INDEX idx_forecasts_created_at ON daily_forecasts(created_at DESC);

-- Materialized view for fast analytics
CREATE MATERIALIZED VIEW forecast_accuracy_summary AS
SELECT
  property_id,
  DATE_TRUNC('week', date) as week,
  AVG((summary->>'averageAccuracy')::numeric) as avg_accuracy,
  SUM((summary->>'totalCostSavings')::numeric) as total_savings,
  SUM((summary->>'totalWasted')::numeric) as total_waste,
  COUNT(*) as days_tracked
FROM daily_forecasts
WHERE status = 'completed'
GROUP BY property_id, DATE_TRUNC('week', date);
```

**Queries**:

```sql
-- Get last 7 days for historical view
SELECT * FROM daily_forecasts
WHERE property_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- Calculate monthly accuracy
SELECT
  AVG((summary->>'averageAccuracy')::numeric) as monthly_accuracy,
  SUM((summary->>'totalCostSavings')::numeric) as monthly_savings
FROM daily_forecasts
WHERE property_id = $1
  AND date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'completed';

-- Detect patterns (Friday +8% demand)
SELECT
  TO_CHAR(date, 'Day') as day_of_week,
  AVG((summary->>'totalActual')::numeric) as avg_consumption,
  AVG((summary->>'averageAccuracy')::numeric) as avg_accuracy
FROM daily_forecasts
WHERE property_id = $1 AND status = 'completed'
GROUP BY TO_CHAR(date, 'Day')
ORDER BY
  CASE TO_CHAR(date, 'Day')
    WHEN 'Monday' THEN 1
    WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3
    WHEN 'Thursday' THEN 4
    WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6
    WHEN 'Sunday' THEN 7
  END;
```

### Option B: JSON Files (Good for Small Hotels)

**Structure**:

```
data/
  kitchen-forecasts/
    property-uuid/
      2024/
        01/
          2024-01-19.json  ← One file per day
          2024-01-20.json
          2024-01-21.json
        02/
          ...
```

**Pros**: Simple, no database needed, easy to backup/export
**Cons**: Slower queries, manual aggregation

**Code**:

```typescript
import fs from 'fs/promises';
import path from 'path';

async function saveForecast(record: DailyForecastRecord) {
  const date = new Date(record.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const fileName = `${record.date}.json`;

  const dir = path.join(
    'data', 'kitchen-forecasts',
    record.propertyId,
    String(year),
    month
  );

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, fileName),
    JSON.stringify(record, null, 2)
  );
}

async function getLastNDays(propertyId: string, days: number = 7) {
  const records: DailyForecastRecord[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    try {
      const filePath = path.join(
        'data', 'kitchen-forecasts',
        propertyId,
        String(date.getFullYear()),
        String(date.getMonth() + 1).padStart(2, '0'),
        `${dateStr}.json`
      );
      const data = await fs.readFile(filePath, 'utf-8');
      records.push(JSON.parse(data));
    } catch (err) {
      // File doesn't exist (no forecast for that day)
      continue;
    }
  }

  return records;
}
```

---

## 5. Machine Learning Improvement Loop

### How the System Learns

```typescript
async function updateForecastingModel(completedRecord: DailyForecastRecord) {
  // Extract features (what influenced demand)
  const features = {
    occupancyRate: completedRecord.context.occupancyRate,
    dayOfWeek: completedRecord.context.dayOfWeek,
    isWeekend: completedRecord.context.isWeekend,
    hasEvent: completedRecord.context.hasSpecialEvent,
    weather: completedRecord.context.weatherCondition,
  };

  // Extract actual consumption
  const actuals = completedRecord.actuals.map(a => ({
    menuItemId: a.menuItemId,
    actualConsumption: a.actualConsumption,
  }));

  // Update base demand averages (exponential moving average)
  for (const actual of actuals) {
    const menuItem = await db.collection('menu_items')
      .findOne({ id: actual.menuItemId });

    // EMA formula: new_avg = α × actual + (1-α) × old_avg
    // α = 0.1 (gives more weight to history)
    const alpha = 0.1;
    menuItem.avgDailyDemand =
      alpha * actual.actualConsumption +
      (1 - alpha) * menuItem.avgDailyDemand;

    await db.collection('menu_items').updateOne(
      { id: menuItem.id },
      { $set: { avgDailyDemand: menuItem.avgDailyDemand } }
    );
  }

  // Detect day-of-week patterns
  await updateDayOfWeekMultipliers(completedRecord);

  // Detect event patterns
  await updateEventMultipliers(completedRecord);

  // Adjust safety buffer based on accuracy
  await adjustSafetyBuffer(completedRecord);
}

async function updateDayOfWeekMultipliers(record: DailyForecastRecord) {
  const dayOfWeek = record.context.dayOfWeek;

  // Get last 4 occurrences of this day
  const historicalData = await db.collection('daily_forecasts')
    .find({
      propertyId: record.propertyId,
      'context.dayOfWeek': dayOfWeek,
      status: 'completed'
    })
    .sort({ date: -1 })
    .limit(4)
    .toArray();

  if (historicalData.length < 2) return; // Not enough data

  // Calculate average consumption for this day vs overall average
  const dayAvg = historicalData.reduce((sum, r) =>
    sum + r.summary.totalActual, 0) / historicalData.length;

  const overallAvg = await db.collection('daily_forecasts')
    .aggregate([
      { $match: { propertyId: record.propertyId, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$summary.totalActual' } } }
    ]).toArray();

  const multiplier = dayAvg / overallAvg[0].avg;

  // Save pattern
  await db.collection('forecast_patterns').updateOne(
    { propertyId: record.propertyId, type: 'dayOfWeek', value: dayOfWeek },
    { $set: { multiplier, updatedAt: new Date() } },
    { upsert: true }
  );

  console.log(`Detected ${dayOfWeek} pattern: ${multiplier.toFixed(2)}x multiplier`);
}

async function adjustSafetyBuffer(record: DailyForecastRecord) {
  // If accuracy is consistently high (>95%), reduce safety buffer
  const recentAccuracy = await db.collection('daily_forecasts')
    .find({
      propertyId: record.propertyId,
      status: 'completed'
    })
    .sort({ date: -1 })
    .limit(14)
    .toArray();

  const avgAccuracy = recentAccuracy.reduce((sum, r) =>
    sum + r.summary.averageAccuracy, 0) / recentAccuracy.length;

  const stockoutCount = recentAccuracy.reduce((sum, r) =>
    sum + r.summary.stockoutEvents, 0);

  let newBuffer = 1.10; // Default 10%

  if (avgAccuracy > 95 && stockoutCount === 0) {
    newBuffer = 1.08; // Reduce to 8%
  } else if (avgAccuracy > 90 && stockoutCount === 0) {
    newBuffer = 1.10; // Keep at 10%
  } else if (stockoutCount > 2) {
    newBuffer = 1.15; // Increase to 15% (too many stockouts)
  }

  await db.collection('forecast_settings').updateOne(
    { propertyId: record.propertyId },
    { $set: { safetyBuffer: newBuffer } },
    { upsert: true }
  );
}
```

---

## 6. API Endpoints

### Generate Daily Forecast

```typescript
POST /api/kitchen/forecasts/generate

Request:
{
  "date": "2024-01-19",
  "occupancyRate": 75,
  "hasSpecialEvent": false
}

Response:
{
  "id": "01HN9XYZ...",
  "date": "2024-01-19",
  "forecasts": [
    {
      "menuItemId": "B001",
      "menuItemName": "Breakfast Buffet",
      "predictedDemand": 85,
      "recommendedPrepQty": 94,
      "ingredients": [
        { "item": "Eggs", "qty": "7 dozen" },
        ...
      ]
    },
    ...
  ],
  "prepSheetUrl": "/api/kitchen/prep-sheet/01HN9XYZ..."
}
```

### Record Actual Leftovers (Post-Service)

```typescript
POST /api/kitchen/forecasts/:id/actuals

Request (staff records what's LEFT in pan):
{
  "actuals": [
    {
      "menuItemId": "B001",
      "actualLeftovers": 1,        // Staff counted: 1 serving left in pan
      "stockoutOccurred": false,
      "notes": "Ran low at 9:30 AM but didn't stockout"
    },
    ...
  ]
}

NOTE: System calculates consumption: prepped - leftovers = 94 - 1 = 93

Response:
{
  "id": "01HN9XYZ...",
  "date": "2024-01-19",
  "metrics": [
    {
      "menuItemId": "B001",
      "predictionAccuracy": 91.4,
      "wastePercentage": 1.1,
      "costSavings": 136
    },
    ...
  ],
  "summary": {
    "totalCostSavings": 420,
    "averageAccuracy": 94.8,
    "stockoutEvents": 0
  }
}
```

### Get Historical Data

```typescript
GET /api/kitchen/forecasts/historical?days=7

Response:
{
  "records": [
    {
      "date": "2024-01-19",
      "dayType": "Friday",
      "occupancy": 78,
      "predicted": 88,
      "actual": 93,
      "wasted": 4,
      "accuracy": 95,
      "costSavings": 136
    },
    ...
  ],
  "summary": {
    "avgAccuracy": 94.8,
    "totalSavings": 336,
    "totalWasted": 42,
    "stockoutEvents": 0
  }
}
```

---

## 7. Reporting & Insights

### Monthly Report Generation

```typescript
async function generateMonthlyReport(propertyId: string, month: string) {
  const records = await db.collection('daily_forecasts')
    .find({
      propertyId,
      date: { $regex: `^${month}` }, // e.g., "2024-01"
      status: 'completed'
    })
    .toArray();

  // Calculate aggregates
  const report = {
    month,
    daysTracked: records.length,

    // Accuracy metrics
    avgAccuracy: records.reduce((sum, r) => sum + r.summary.averageAccuracy, 0) / records.length,
    bestDay: records.sort((a, b) => b.summary.averageAccuracy - a.summary.averageAccuracy)[0],
    worstDay: records.sort((a, b) => a.summary.averageAccuracy - b.summary.averageAccuracy)[0],

    // Waste metrics
    totalWasted: records.reduce((sum, r) => sum + r.summary.totalWasted, 0),
    avgWastePerDay: records.reduce((sum, r) => sum + r.summary.totalWasted, 0) / records.length,

    // Cost savings
    totalSavings: records.reduce((sum, r) => sum + r.summary.totalCostSavings, 0),
    avgSavingsPerDay: records.reduce((sum, r) => sum + r.summary.totalCostSavings, 0) / records.length,

    // Stockout tracking
    stockoutEvents: records.reduce((sum, r) => sum + r.summary.stockoutEvents, 0),
    stockoutRate: (records.reduce((sum, r) => sum + r.summary.stockoutEvents, 0) / records.length) * 100,

    // Pattern detection
    dayOfWeekPatterns: await detectDayOfWeekPatterns(records),
    eventPatterns: await detectEventPatterns(records),
    trendDirection: detectTrendDirection(records), // "improving" | "stable" | "declining"
  };

  return report;
}
```

### Pattern Detection

```typescript
async function detectDayOfWeekPatterns(records: DailyForecastRecord[]) {
  const byDay: Record<string, number[]> = {};

  records.forEach(r => {
    const day = r.context.dayOfWeek;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(r.summary.totalActual);
  });

  const patterns = Object.entries(byDay).map(([day, consumptions]) => {
    const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
    const overallAvg = records.reduce((sum, r) => sum + r.summary.totalActual, 0) / records.length;
    const multiplier = avg / overallAvg;

    return {
      day,
      avgConsumption: Math.round(avg),
      multiplier: multiplier.toFixed(2),
      insight: multiplier > 1.1 ? `+${((multiplier - 1) * 100).toFixed(0)}% above average` :
               multiplier < 0.9 ? `-${((1 - multiplier) * 100).toFixed(0)}% below average` :
               "Normal"
    };
  });

  return patterns;
}
```

---

## 8. Best Practices

### Data Quality

1. **Record actuals same day** - Don't wait a week, memory fades
2. **Be honest with stockouts** - System can only learn if you tell it
3. **Add notes for anomalies** - "Conference group ate 2x expected" helps ML
4. **Don't adjust after recording** - Tampering breaks learning

### Privacy & Security

1. **Anonymize guest data** - Don't store "John ate 3 servings", store "3 servings consumed"
2. **Multi-tenant isolation** - One hotel shouldn't see another's data
3. **Audit trail** - Track who recorded actuals and when
4. **Backup regularly** - This data is gold, don't lose it

### Performance

1. **Archive old data** - After 2 years, move to cold storage
2. **Pre-calculate aggregates** - Don't recalculate monthly stats on every page load
3. **Use materialized views** - Refresh nightly, not on demand
4. **Index by date** - Most queries filter by date range

---

## 9. Production Checklist

Before deploying to production:

- [ ] Database schema created
- [ ] Daily forecast generation scheduled (5 AM cron job)
- [ ] Staff trained on actual consumption data entry
- [ ] Manager dashboard shows historical tracking
- [ ] Chef prep sheet generated and emailed/printed
- [ ] Monthly report generation automated (1st of month)
- [ ] Backup strategy in place (daily snapshots)
- [ ] Alerts configured (e.g., "No actuals recorded for 3 days")
- [ ] Pattern detection running (day-of-week, event multipliers)
- [ ] Safety buffer auto-adjustment enabled
- [ ] ROI tracking dashboard live

---

## 10. Example Workflow (Full Cycle)

**Day 1: Monday** (First time using system)

```
5:00 AM - System generates forecast
  → Breakfast Buffet: 85 servings predicted, prep 94
  → Chef receives prep sheet via email/print

5:30 AM - Chef starts prep
  → Follows prep sheet: 7 dozen eggs, 6 lbs bacon, etc.

7:00 AM - Breakfast service begins

10:00 AM - Breakfast service ends
  → Staff records: 15 servings LEFT in pan (leftovers)
  → System calculates: Consumed = 94 - 15 = 79 servings
  → System calculates: 93% accuracy, $120 wasted

11:00 AM - System learns
  → Monday pattern detected: -7% below weekday average
  → Next Monday: System will predict 79 instead of 85
```

**Day 2: Tuesday**

```
5:00 AM - System generates forecast (now smarter)
  → Uses Monday data: Predicts 83 servings
  → Chef preps 91 servings (83 × 1.1)

10:00 AM - Staff records: 6 servings LEFT in pan (leftovers)
  → System calculates: Consumed = 91 - 6 = 85 servings
  → System: 98% accuracy, $48 wasted (vs $120 traditional)
```

**Day 30: End of Month**

```
Monthly Report Generated:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Month: January 2024
Days Tracked: 30

Accuracy:
  - Average: 94.2%
  - Best Day: Friday 19th (97%)
  - Worst Day: Saturday 13th (88% - conference)

Waste:
  - Before: 750 servings/month (30% over-prep)
  - After: 180 servings/month (10% buffer)
  - Reduction: 570 servings (76% reduction!)

Cost Savings:
  - Total: $2,280 saved in one month
  - Annual projection: $27,360

Patterns Detected:
  - Friday: +8% demand (93 vs 86 avg)
  - Monday: -7% demand (79 vs 86 avg)
  - Events: +42% demand (accurate within 6%)

Recommendation:
  - System confidence HIGH
  - Reduce safety buffer to 8% for breakfast
  - Keep 10% for dinner (higher variance)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 11. Troubleshooting

### "System accuracy is only 70%"

**Possible causes**:
1. Not enough historical data (need 2+ weeks)
2. Actuals not being recorded consistently
3. External factors not tracked (weather, local events)
4. Menu items changed (new items have no history)

**Fix**: Review data quality, add more context factors

### "Staff not recording actuals"

**Possible causes**:
1. Process is too slow/complicated
2. No incentive to record data
3. Forgot or too busy

**Fix**: Simplify UI (mobile app, QR code scan), gamify with leaderboards, automated reminders

### "Predictions getting worse over time"

**Possible causes**:
1. Concept drift (guest behavior changed)
2. Menu items changed (prices, quality)
3. External factors (new competitor opened)

**Fix**: Reset base averages, retrain model, add new context factors

---

## Summary

This document-based approach provides:

✅ **For Chefs**: Blame protection via data ("I followed the system")
✅ **For Managers**: Hard ROI numbers ($2,400/month savings)
✅ **For ML**: Continuous learning (accuracy improves from 82% → 95%)
✅ **For Compliance**: Audit trail (who recorded what and when)

**Key Insight**: The data IS the value. Without tracking actuals, you're flying blind. With tracking, you have proof, patterns, and continuous improvement.
