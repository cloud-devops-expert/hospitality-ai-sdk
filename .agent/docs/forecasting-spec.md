# Demand Forecasting System - Technical Specification

## Executive Summary

**Problem**: Hotels waste 20-30% of inventory, food, and supplies due to poor demand forecasting. Manual ordering based on intuition leads to overstocking (waste) or understocking (guest dissatisfaction).

**Solution**: Gradient Boosting (LightGBM) demand forecasting system that predicts daily demand for inventory, kitchen, laundry, and housekeeping with 87-90% accuracy, reducing waste by 15-25% and saving $1,000-3,000/month.

**ROI**: $1,500/month ($18,000/year) for typical 50-room property
- **Savings**: $1,800/month (waste reduction 25% → 8%, $1,500 + better guest satisfaction $300)
- **Cost**: $300/month (ML infrastructure, staff time for data entry)
- **NET**: $1,500/month

**Key Metric**: 87-90% forecast accuracy vs. 60-70% manual intuition

---

## 1. System Architecture

### Technology Choice: LightGBM (Gradient Boosting)

**Why LightGBM vs. TimesFM/Transformers**:

| Factor | LightGBM | TimesFM | Prophet (Facebook) |
|--------|----------|---------|-------------------|
| **Accuracy** | 87-90% | 90-95% | 80-85% |
| **Inference Time** | <100ms (CPU) | 1-2 seconds (GPU) | 200-500ms (CPU) |
| **Training Time** | 5-10 min | 30-60 min | 15-30 min |
| **Data Required** | 60-90 days | 30+ days (zero-shot) | 180+ days |
| **Cost** | $100-200/month | $400-800/month | $50-100/month |
| **Complexity** | Medium | High | Low |
| **Best For** | Tabular data | Complex patterns | Simple seasonality |

**Key Advantages**:
1. **Fast inference** - <100ms on CPU (no GPU required)
2. **Excellent for tabular data** - Hotel operations are structured
3. **Weekly retraining** - Adapts to seasonal patterns quickly
4. **Cost-effective** - 10-15x faster than transformers at similar accuracy
5. **CPU-only** - No GPU required (infrastructure savings)

**Tradeoff**: TimesFM gives 3-5% better accuracy but takes 10-15x longer and costs 2-4x more. Not justified for hotel operations (simple patterns).

---

## 2. Use Cases & Workflows

### Primary Use Cases

1. **Inventory Forecasting** (40% of value)
   - Toiletries (shampoo, soap, tissues)
   - Cleaning supplies (detergents, disinfectants)
   - Office supplies (paper, pens)
   - Minibar items (snacks, drinks)

2. **Kitchen Forecasting** (35% of value)
   - Breakfast meals (eggs, bread, bacon)
   - Ingredients (vegetables, meat, dairy)
   - Beverage consumption (coffee, juice, milk)
   - Restaurant covers (dinner reservations)

3. **Laundry Forecasting** (15% of value)
   - Linen loads (sheets, towels, pillowcases)
   - Uniform cleaning (staff uniforms)
   - Guest laundry requests

4. **Housekeeping Forecasting** (10% of value)
   - Room turnover demand
   - Staff scheduling
   - Cleaning supply consumption

### Workflow Example: Inventory Forecasting

**Scenario**: Hotel needs to forecast toiletry demand for next 7 days

**Traditional Workflow** (Before):
1. Inventory manager checks current stock (15 min)
2. Recalls last week's usage (subjective memory)
3. Considers upcoming bookings (if available)
4. Places order based on intuition ("feels like we need 200 units")
5. **Result**: 70% accuracy, 25% waste (over-ordering) or 15% stockouts (under-ordering)
6. **Total time**: 30-45 min per order, **Waste**: $500-800/month

**LightGBM Workflow** (After):
1. System generates morning forecasts (automated, <5 seconds)
2. Inventory manager reviews 7-day forecast + alerts
3. System suggests order quantities based on current stock
4. Manager approves or adjusts (2-3 min)
5. Evening: Manager records actual usage (2 min)
6. **Result**: 88% accuracy, 8% waste, near-zero stockouts
7. **Total time**: 5 minutes per day, **Savings**: $1,500/month

**Time Savings**: 25-40 min per day (avg 30 min)
**Waste Reduction**: 25% → 8% (17% reduction)
**Annual Savings**: $18,000 (waste reduction + time savings)

---

## 3. Forecasting Model Architecture

### Input Features (Tabular Data)

**Temporal Features**:
```typescript
interface TemporalFeatures {
  day_of_week: number;          // 0-6 (Monday-Sunday)
  day_of_month: number;          // 1-31
  week_of_year: number;          // 1-52
  month: number;                 // 1-12
  is_weekend: boolean;           // Saturday/Sunday flag
  is_holiday: boolean;           // Public holiday flag
  days_to_holiday: number;       // Days until next holiday
}
```

**Operational Features**:
```typescript
interface OperationalFeatures {
  occupancy_rate: number;        // % of rooms occupied
  room_count: number;            // Number of rooms in operation
  event_bookings: number;        // Conference/event attendees
  avg_guest_stay: number;        // Average length of stay (days)
  restaurant_covers: number;     // Restaurant reservations
}
```

**Historical Features (Lagged)**:
```typescript
interface HistoricalFeatures {
  demand_lag_1: number;          // Yesterday's demand
  demand_lag_7: number;          // Same day last week
  demand_lag_14: number;         // Same day 2 weeks ago
  demand_lag_30: number;         // Same day last month
  rolling_avg_7: number;         // 7-day moving average
  rolling_avg_30: number;        // 30-day moving average
}
```

### LightGBM Model Configuration

```python
import lightgbm as lgb

# Training configuration
params = {
    'objective': 'regression',
    'metric': 'rmse',
    'boosting': 'gbdt',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'max_depth': 6,
    'min_data_in_leaf': 20,
    'verbose': -1
}

# Train model
model = lgb.train(
    params,
    train_set,
    num_boost_round=100,
    valid_sets=[valid_set],
    early_stopping_rounds=10
)

# Inference (prediction)
forecast = model.predict(future_features)
```

### Weekly Retraining Pipeline

**Frequency**: Every Sunday night (weekly retraining)
**Training data**: Last 90 days (rolling window)
**Validation**: Last 14 days (held out for accuracy measurement)

```typescript
async function weeklyRetraining(): Promise<void> {
  // 1. Load last 90 days of historical data
  const historicalData = await loadHistoricalData(90);

  // 2. Split train/validation (76 days train, 14 days validation)
  const { trainData, validData } = splitData(historicalData, 0.85);

  // 3. Train LightGBM model
  const model = await trainLightGBM(trainData, validData);

  // 4. Evaluate accuracy on validation set
  const accuracy = evaluateModel(model, validData);

  // 5. If accuracy > 85%, deploy new model
  if (accuracy > 0.85) {
    await deployModel(model);
    logModelMetrics({ accuracy, trainingDate: new Date() });
  }

  // 6. Generate next 7-day forecasts
  const forecasts = await generateForecasts(model, 7);
  await saveDailyForecasts(forecasts);
}
```

---

## 4. Data Model

### Daily Forecast Schema

```typescript
interface DailyForecast {
  id: string;                    // UUID
  date: string;                  // ISO 8601 date (YYYY-MM-DD)
  department: 'inventory' | 'kitchen' | 'laundry' | 'housekeeping';

  // Forecast
  predicted_demand: number;      // Predicted quantity
  confidence: number;            // 0.0-1.0 (based on forecast date distance)
  prediction_interval_lower: number; // 5th percentile (worst case)
  prediction_interval_upper: number; // 95th percentile (best case)

  // Actual (recorded at end of day)
  actual_demand?: number;        // Actual consumption (null until recorded)
  variance?: number;             // (actual - predicted) / predicted
  absolute_error?: number;       // |actual - predicted|

  // Context
  occupancy_rate: number;        // Occupancy % on this date
  day_of_week: string;           // Monday, Tuesday, etc.
  is_weekend: boolean;
  is_holiday: boolean;

  // Alerts
  alert_type?: 'high_demand' | 'low_demand' | 'unusual_pattern' | null;
  alert_message?: string;

  // Metadata
  model_version: string;         // e.g., "lgb-v2.3"
  generated_at: string;          // Timestamp of forecast generation
  recorded_at?: string;          // Timestamp of actual recording
}
```

### Weekly Aggregate Schema

```typescript
interface WeeklyForecastStats {
  week_start_date: string;       // ISO 8601 date (Monday)
  week_end_date: string;         // ISO 8601 date (Sunday)

  // Accuracy metrics
  total_forecasts: number;       // Number of forecasts generated
  forecasts_recorded: number;    // Number of actuals recorded
  avg_accuracy: number;          // Average prediction accuracy (1 - MAPE)
  avg_absolute_error: number;    // Average |actual - predicted|

  // Department breakdown
  inventory_accuracy: number;
  kitchen_accuracy: number;
  laundry_accuracy: number;
  housekeeping_accuracy: number;

  // Waste reduction
  estimated_waste_before: number; // Estimated waste without forecasting ($)
  estimated_waste_after: number;  // Actual waste with forecasting ($)
  waste_reduction_pct: number;    // % waste reduced
  weekly_savings: number;         // $ saved this week

  // Model performance
  model_version: string;
  last_retrained: string;
}
```

---

## 5. Algorithms & Logic

### Demand Prediction Algorithm

**Step 1: Feature Engineering**

```typescript
function engineerFeatures(date: Date, historicalData: DemandRecord[]): Features {
  // Temporal features
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  const weekOfYear = getWeekOfYear(date);
  const month = date.getMonth() + 1;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = checkHoliday(date);

  // Lagged features (historical demand)
  const demandLag1 = getHistoricalDemand(date, -1, historicalData);
  const demandLag7 = getHistoricalDemand(date, -7, historicalData);
  const rollingAvg7 = computeRollingAverage(date, 7, historicalData);

  // Operational features
  const occupancyRate = getOccupancyForecast(date);

  return {
    dayOfWeek,
    dayOfMonth,
    weekOfYear,
    month,
    isWeekend: isWeekend ? 1 : 0,
    isHoliday: isHoliday ? 1 : 0,
    demandLag1,
    demandLag7,
    rollingAvg7,
    occupancyRate,
  };
}
```

**Step 2: LightGBM Prediction**

```typescript
async function predictDemand(
  date: Date,
  department: string,
  model: LightGBMModel
): Promise<ForecastResult> {
  // Engineer features
  const features = engineerFeatures(date, historicalData);

  // Predict demand (LightGBM inference)
  const predicted = model.predict(features);

  // Compute prediction intervals (quantile regression)
  const lower = model.predict(features, quantile: 0.05);
  const upper = model.predict(features, quantile: 0.95);

  // Confidence degrades with forecast distance
  const daysAhead = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const confidence = 0.95 - (daysAhead - 1) * 0.03; // 95% for day 1, 92% for day 2, etc.

  return {
    date: date.toISOString().split('T')[0],
    department,
    predicted_demand: Math.round(predicted),
    confidence,
    prediction_interval_lower: Math.round(lower),
    prediction_interval_upper: Math.round(upper),
  };
}
```

### Alert Generation Logic

**Problem**: Detect unusual demand patterns that require attention

**Solution**: Multi-threshold alert system

```typescript
function generateAlerts(forecast: DailyForecast): Alert | null {
  // Get historical average for this day of week
  const historicalAvg = getHistoricalAverage(forecast.day_of_week, forecast.department);

  // Alert 1: High demand (>50% above average)
  if (forecast.predicted_demand > historicalAvg * 1.5) {
    return {
      type: 'high_demand',
      severity: 'warning',
      message: `${forecast.department} demand ${((forecast.predicted_demand / historicalAvg - 1) * 100).toFixed(0)}% above average - consider extra stock`,
    };
  }

  // Alert 2: Low demand (<50% of average)
  if (forecast.predicted_demand < historicalAvg * 0.5) {
    return {
      type: 'low_demand',
      severity: 'info',
      message: `${forecast.department} demand ${((1 - forecast.predicted_demand / historicalAvg) * 100).toFixed(0)}% below average - reduce orders`,
    };
  }

  // Alert 3: Unusual pattern (high variance week)
  const weekVariance = computeWeekVariance(forecast.date);
  if (weekVariance > 0.4) {
    return {
      type: 'unusual_pattern',
      severity: 'warning',
      message: `Demand pattern is volatile this week - review forecasts daily`,
    };
  }

  return null;
}
```

### Accuracy Measurement

**Problem**: Track forecast accuracy over time to measure system performance

**Solution**: Mean Absolute Percentage Error (MAPE)

```typescript
function calculateAccuracy(forecasts: DailyForecast[]): number {
  // Filter forecasts with recorded actuals
  const recordedForecasts = forecasts.filter(f => f.actual_demand !== null);

  if (recordedForecasts.length === 0) return 0;

  // Calculate MAPE (Mean Absolute Percentage Error)
  const mapeSum = recordedForecasts.reduce((sum, forecast) => {
    const absolutePercentageError = Math.abs(
      (forecast.actual_demand! - forecast.predicted_demand) / forecast.actual_demand!
    );
    return sum + absolutePercentageError;
  }, 0);

  const mape = mapeSum / recordedForecasts.length;

  // Convert MAPE to accuracy (1 - MAPE)
  const accuracy = 1 - mape;

  return accuracy; // e.g., 0.88 = 88% accuracy
}
```

---

## 6. ROI Calculation (Detailed)

### Waste Reduction Calculation

**Baseline** (Before Forecasting):
- Manual ordering based on intuition
- Avg accuracy: 60-70% (high variance)
- Over-ordering: 20-30% waste (spoilage, expiration)
- Under-ordering: 10-15% stockouts (guest dissatisfaction)

**After Forecasting**:
- LightGBM-based ordering
- Avg accuracy: 87-90%
- Over-ordering: 5-8% waste (minimal)
- Under-ordering: 2-3% stockouts (rare)

**Calculations** (50-room hotel, $6,000/month operational spending):

| Category | Before | After | Savings |
|----------|--------|-------|---------|
| **Inventory Waste** | $1,800 (30%) | $480 (8%) | **$1,320** |
| **Kitchen Waste** | $900 (15%) | $240 (4%) | **$660** |
| **Stockout Impact** | $300 (guest dissatisfaction) | $50 (rare) | **$250** |
| **Staff Time** | 5 hours/week | 1 hour/week | **$400** |
| **Total Monthly Cost** | $3,000 | $770 | **$2,230** |

**Infrastructure Cost**: $300/month (model hosting, data storage)
**Net ROI**: $2,230 - $300 = **$1,930/month**

**Conservative estimate for demo**: $1,500/month ($18,000/year)

---

## 7. Performance Targets

### Forecast Accuracy

**Overall Accuracy**: 87-90% (measured by 1 - MAPE)

**By Department**:
- **Inventory**: 88-92% (most predictable, stable patterns)
- **Kitchen**: 85-90% (weather-dependent, seasonal)
- **Laundry**: 85-88% (occupancy-driven)
- **Housekeeping**: 82-87% (variable due to guest requests)

**By Forecast Horizon**:
- **Day 1**: 93-95% accuracy (most confident)
- **Day 3**: 88-92% accuracy
- **Day 7**: 85-88% accuracy (seasonal patterns dominant)

### Inference Speed

**LightGBM Inference Time**:
- **CPU (Intel Xeon)**: 50-100ms per forecast
- **Greengrass (Intel NUC)**: 80-150ms per forecast
- **Daily batch**: <5 seconds for all departments (28 forecasts per day × 7 days = 196 forecasts)

**Target**: <5 seconds for daily forecast generation (acceptable for morning batch)

### Training Time

**Weekly Retraining**:
- **Training data**: 90 days (2,160 records per department)
- **Training time**: 5-10 minutes per department (CPU)
- **Total weekly retraining**: 20-40 minutes (all 4 departments)

**Target**: <1 hour for weekly retraining (Sunday night batch job)

---

## 8. Implementation Notes

### Model Deployment

**Options**:

1. **Greengrass (On-premise)** - For medium/large hotels
   - Full Python stack (LightGBM, scikit-learn, pandas)
   - CPU-only (no GPU required)
   - Daily forecasts: <5 seconds
   - Weekly retraining: 30 min (Sunday night)
   - $400 hardware + $22/month AWS

2. **Cloud Lambda (Serverless)** - For small hotels
   - Python Lambda function with LightGBM
   - Triggered daily (morning forecast generation)
   - Cold start: 2-3 seconds, warm: 500ms
   - $50-100/month (low volume)

3. **Browser (Transformers.js)** - Not suitable
   - LightGBM not available in browser
   - Would require ONNX export (complex)
   - Not recommended

### Database Schema

```sql
-- Daily forecasts (one per department per day)
CREATE TABLE daily_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  date DATE NOT NULL,
  department VARCHAR(50) NOT NULL,

  predicted_demand INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  prediction_interval_lower INTEGER NOT NULL,
  prediction_interval_upper INTEGER NOT NULL,

  actual_demand INTEGER,
  variance DECIMAL(5,2),
  absolute_error INTEGER,

  occupancy_rate DECIMAL(3,2) NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  is_weekend BOOLEAN DEFAULT FALSE,
  is_holiday BOOLEAN DEFAULT FALSE,

  alert_type VARCHAR(50),
  alert_message TEXT,

  model_version VARCHAR(50) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_at TIMESTAMPTZ,

  UNIQUE(date, department)
);

-- Weekly aggregates (one per week)
CREATE TABLE weekly_forecast_stats (
  week_start_date DATE PRIMARY KEY,
  week_end_date DATE NOT NULL,

  total_forecasts INTEGER NOT NULL,
  forecasts_recorded INTEGER NOT NULL,
  avg_accuracy DECIMAL(4,2) NOT NULL,
  avg_absolute_error DECIMAL(6,2) NOT NULL,

  inventory_accuracy DECIMAL(4,2),
  kitchen_accuracy DECIMAL(4,2),
  laundry_accuracy DECIMAL(4,2),
  housekeeping_accuracy DECIMAL(4,2),

  estimated_waste_before DECIMAL(10,2) NOT NULL,
  estimated_waste_after DECIMAL(10,2) NOT NULL,
  waste_reduction_pct DECIMAL(5,2) NOT NULL,
  weekly_savings DECIMAL(10,2) NOT NULL,

  model_version VARCHAR(50) NOT NULL,
  last_retrained TIMESTAMPTZ
);
```

---

## 9. UI Design (Three-View Architecture)

### View 1: Forecasts (Staff Operations)

**Purpose**: Show today's and upcoming 7-day forecasts for all departments with alerts

**Layout**:
- **Top**: Current date + department tabs (Inventory, Kitchen, Laundry, Housekeeping)
- **Middle**: 7-day forecast table per department
  - Date, Day of week, Predicted demand, Confidence, Alerts
  - Color-coded: Green (normal), Yellow (high demand), Red (unusual)
- **Bottom**: Quick actions
  - "Record Today's Actual" button
  - "Adjust Forecast" (override if needed)

**Key Features**:
- Alert badges (high demand, low demand, unusual pattern)
- Confidence indicators (95% day 1, decreasing to 85% day 7)
- Historical average comparison ("15% above average")

### View 2: Performance (Manager ROI)

**Purpose**: Show forecast accuracy, waste reduction, ROI metrics

**Layout**:
- **Top**: ROI card ($1,500/month savings)
  - Waste reduction: $1,320/month (inventory)
  - Staff time savings: $400/month
  - Infrastructure cost: -$300/month
  - NET: $1,500/month
- **Middle**: Department accuracy breakdown
  - Inventory: 90% accuracy
  - Kitchen: 88% accuracy
  - Laundry: 87% accuracy
  - Housekeeping: 85% accuracy
- **Bottom**: Before/After comparison
  - Waste: 25% → 8% (17% reduction)
  - Accuracy: 65% → 88% (23% improvement)
  - Stockouts: 12% → 3% (9% reduction)

### View 3: Historical (7-Day Forecast vs Actual)

**Purpose**: Show last 7 days forecast accuracy, demonstrate system learning

**Layout**:
- **Table**: Daily forecast vs actual (7 rows)
  - Date
  - Department
  - Predicted
  - Actual
  - Error %
  - Savings
- **Insights**: System observations
  - "Kitchen accuracy improved from 85% to 90% this week"
  - "Weekend demand 40% higher than weekdays (expected pattern detected)"
  - "Inventory forecast within 5% for 6 out of 7 days (excellent)"

---

## 10. Sample Data (Demo)

### Today's Forecasts (4 Departments)

```typescript
const todaysForecasts = [
  {
    date: '2024-10-25',
    department: 'inventory',
    predicted_demand: 125,
    confidence: 0.93,
    alert: { type: 'high_demand', message: '18% above average - consider extra toiletries' },
  },
  {
    date: '2024-10-25',
    department: 'kitchen',
    predicted_demand: 180,
    confidence: 0.91,
    alert: null,
  },
  {
    date: '2024-10-25',
    department: 'laundry',
    predicted_demand: 75,
    confidence: 0.90,
    alert: null,
  },
  {
    date: '2024-10-25',
    department: 'housekeeping',
    predicted_demand: 48,
    confidence: 0.88,
    alert: { type: 'unusual_pattern', message: 'High variance expected - review daily' },
  },
];
```

### 7-Day Forecast vs Actual

```typescript
const last7Days = [
  { date: '2024-10-19', dept: 'Inventory', predicted: 118, actual: 122, error: 3.3, savings: '$42' },
  { date: '2024-10-20', dept: 'Kitchen', predicted: 165, actual: 158, error: 4.2, savings: '$38' },
  { date: '2024-10-21', dept: 'Laundry', predicted: 72, actual: 70, error: 2.8, savings: '$28' },
  { date: '2024-10-22', dept: 'Inventory', predicted: 130, actual: 135, error: 3.7, savings: '$45' },
  { date: '2024-10-23', dept: 'Kitchen', predicted: 220, actual: 212, error: 3.6, savings: '$52' },
  { date: '2024-10-24', dept: 'Laundry', predicted: 88, actual: 85, error: 3.4, savings: '$35' },
  { date: '2024-10-25', dept: 'Inventory', predicted: 125, actual: null, error: null, savings: '-' },
];
```

---

## 11. Future Enhancements

1. **Multi-step Forecasting** - Predict 14-30 days ahead for bulk ordering
2. **Event Detection** - Automatically detect conferences, holidays, events
3. **Weather Integration** - Incorporate weather forecasts (impacts kitchen/laundry)
4. **Cross-Property Learning** - Share models across hotel chain (if 10+ properties)
5. **Causal Inference** - Measure impact of promotions, events on demand

---

## 12. Comparison with Other Solutions

### vs. Manual Forecasting (Intuition)

| Factor | LightGBM | Manual (Intuition) |
|--------|----------|-------------------|
| **Accuracy** | 87-90% | 60-70% |
| **Time Required** | 5 min/day | 30-45 min/day |
| **Waste** | 8% | 25% |
| **Consistency** | High | Variable (staff-dependent) |
| **Scalability** | Unlimited | Limited |

**Verdict**: LightGBM wins on all metrics.

### vs. Simple Moving Average

| Factor | LightGBM | Moving Average |
|--------|----------|---------------|
| **Accuracy** | 87-90% | 70-75% |
| **Seasonality Handling** | Excellent | Poor |
| **Event Detection** | Good | None |
| **Cost** | $300/month | $0/month |

**Verdict**: LightGBM worth the cost (12-17% accuracy improvement = $1,200/month savings).

### vs. TimesFM (Transformers)

| Factor | LightGBM | TimesFM |
|--------|----------|---------|
| **Accuracy** | 87-90% | 90-95% |
| **Inference Time** | <100ms | 1-2 seconds |
| **Cost** | $300/month | $800/month |
| **Complexity** | Medium | High |

**Verdict**: LightGBM wins on cost/speed, only 3-5% accuracy tradeoff. TimesFM only justified at scale (100+ hotels).

---

## 13. Key Takeaways

1. **LightGBM is optimal for hotel demand forecasting** - 87-90% accuracy at 10-15x speed of transformers
2. **Waste reduction is primary ROI** - 25% → 8% waste = $1,320/month savings (inventory alone)
3. **Weekly retraining** - Model adapts to seasonal patterns quickly (not monthly)
4. **CPU-only** - No GPU required (infrastructure savings)
5. **Document-based approach** - Daily forecasts generated morning, actuals recorded evening
6. **ROI from efficiency** - Primary savings from waste reduction (85%), secondary from time savings (15%)
7. **Typical ROI**: $1,500/month for 50-room property ($18,000/year)

**Bottom Line**: Gradient Boosting (LightGBM) is the right choice for hotel demand forecasting. Transformers (TimesFM) offer marginal accuracy improvements (3-5%) at 2-4x cost and 10-15x latency - not justified unless operating at scale (100+ hotels).
