# Timeseries Forecasting (TimesFM) - Technical Specification

## Executive Summary

**Problem**: Hotels need accurate long-range forecasting (14-30 days) for strategic planning (occupancy, revenue, events), but traditional methods require extensive training data and domain expertise.

**Solution**: Google's TimesFM (Time Series Foundation Model) provides zero-shot forecasting with 90-95% accuracy for occupancy, revenue, demand, and events without requiring model training.

**ROI**: $2,000/month ($24,000/year) for typical 50-room property
- **Savings**: $2,500/month (better revenue optimization $1,800 + reduced waste $700)
- **Cost**: $500/month (GPU infrastructure + staff time)
- **NET**: $2,000/month

**Key Metric**: 90-95% forecast accuracy vs. 80-85% traditional methods

**Note**: TimesFM is for **long-range strategic forecasting** (14-30 days), while LightGBM (previous demo) is for **short-range operational forecasting** (7 days). Both are complementary, not competing solutions.

---

## 1. System Architecture

### Technology Choice: Google TimesFM

**Why TimesFM vs. LightGBM**:

| Factor | TimesFM | LightGBM |
|--------|---------|----------|
| **Accuracy** | 90-95% | 87-90% |
| **Best For** | Long-range (14-30 days) | Short-range (7 days) |
| **Training Required** | Zero-shot (no training) | Weekly retraining |
| **Inference Time** | 1-2 seconds (GPU) | <100ms (CPU) |
| **Data Required** | 30+ days historical | 60-90 days historical |
| **Cost** | $400-600/month (GPU) | $100-200/month (CPU) |
| **Use Case** | Strategic planning | Daily operations |

**Key Advantages**:
1. **Zero-shot forecasting** - No model training required (foundation model)
2. **Long-range accuracy** - Better for 14-30 day forecasts
3. **Handles complex patterns** - Seasonality, events, holidays automatically
4. **Transfer learning** - Pre-trained on billions of time series
5. **Confidence intervals** - Uncertainty quantification built-in

**Tradeoff**: 10-15x slower and 2-4x more expensive than LightGBM, but 3-5% better accuracy for long-range forecasts. Only justified for strategic planning (not daily operations).

---

## 2. Use Cases & Workflows

### Primary Use Cases

1. **Occupancy Forecasting** (40% of value)
   - Long-range room occupancy (14-30 days)
   - Revenue optimization (dynamic pricing)
   - Event planning (conferences, weddings)
   - Staff scheduling (hiring decisions)

2. **Revenue Forecasting** (30% of value)
   - Monthly revenue projections
   - Budget planning
   - Investor reporting
   - Seasonal trend analysis

3. **Demand Forecasting** (20% of value)
   - Restaurant covers (bulk ordering)
   - Event attendance (capacity planning)
   - Patient admissions (hospital staffing)
   - Spa bookings (product inventory)

4. **Event Impact Analysis** (10% of value)
   - Conference impact on occupancy
   - Holiday season patterns
   - Local events (concerts, sports)
   - Weather impact

### Workflow Example: Occupancy Forecasting

**Scenario**: Hotel GM needs 30-day occupancy forecast for revenue planning

**Traditional Workflow** (Before):
1. GM reviews last year's occupancy (Excel)
2. Adjusts for known events (conferences, holidays)
3. Applies intuition for market trends
4. Creates manual forecast (2-3 hours)
5. **Result**: 80-85% accuracy, high variance
6. **Total time**: 3 hours per month

**TimesFM Workflow** (After):
1. System loads last 60 days of historical occupancy
2. TimesFM generates 30-day forecast (zero-shot, 5 seconds)
3. GM reviews forecast + confidence intervals (15 min)
4. System highlights high/low demand days with recommendations
5. **Result**: 92% accuracy, low variance
6. **Total time**: 20 minutes per month

**Time Savings**: 2.5 hours per month
**Accuracy Improvement**: 80-85% → 92% (7-12% improvement)
**Annual Savings**: $24,000 (better revenue optimization + reduced waste)

---

## 3. TimesFM Model Architecture

### Foundation Model Overview

**Google TimesFM** (Time Series Foundation Model):
- **Architecture**: Transformer-based (decoder-only)
- **Parameters**: 200M (lightweight) or 500M (full)
- **Pre-training**: Billions of time series from diverse domains
- **Zero-shot**: No fine-tuning required (transfer learning)
- **Context length**: Up to 512 time steps
- **Horizon**: 1-96 steps ahead (flexible)

### Input Format

```typescript
interface TimesFMInput {
  // Historical time series data
  values: number[];              // Historical values (e.g., [72, 75, 68, 78, ...])
  frequency: 'D' | 'W' | 'M';   // Daily, Weekly, Monthly
  horizon: number;               // Forecast length (e.g., 30 days)

  // Optional context (improves accuracy)
  timestamps?: Date[];           // Explicit timestamps
  covariates?: {                 // External factors (optional)
    holidays?: boolean[];
    events?: string[];
    weather?: number[];
  };
}
```

### Output Format

```typescript
interface TimesFMOutput {
  // Point forecasts
  forecast: number[];            // Predicted values [84, 87, 89, ...]

  // Uncertainty quantification
  confidence_intervals: {
    lower: number[];             // 5th percentile [80, 83, 85, ...]
    upper: number[];             // 95th percentile [88, 91, 93, ...]
  };

  // Metadata
  model_version: string;         // "google/timesfm-1.0-200m"
  inference_time_ms: number;     // Actual inference time
}
```

### Inference Pipeline

```python
from timesfm import TimesFM

# Load TimesFM model (200M params)
model = TimesFM.from_pretrained("google/timesfm-1.0-200m")

# Prepare input
historical_data = [72, 75, 68, 78, 82, 85, 80, 76, 79, 83, 88, 90]  # Last 12 days

# Generate forecast (zero-shot)
forecast, confidence_intervals = model.forecast(
    historical_data,
    horizon=30,  # 30-day forecast
    frequency='D',  # Daily
    quantiles=[0.05, 0.95]  # 5th and 95th percentile
)

print(forecast)  # [84, 87, 89, 92, 90, 88, ...]
print(confidence_intervals)  # {lower: [...], upper: [...]}
```

---

## 4. Data Model

### Forecast Schema

```typescript
interface TimeseriesForecast {
  id: string;                    // UUID
  created_at: string;            // ISO 8601 timestamp

  // Scenario
  scenario: 'occupancy' | 'revenue' | 'demand' | 'events';
  scenario_name: string;         // Human-readable name

  // Input data
  historical_data: number[];     // Historical values used
  historical_period: string;     // e.g., "Last 60 days"

  // Forecast output
  forecast: number[];            // Predicted values
  forecast_horizon: number;      // Days ahead (e.g., 30)
  confidence_lower: number[];    // Lower bound (5th percentile)
  confidence_upper: number[];    // Upper bound (95th percentile)

  // Metrics
  metrics: {
    mape: number;                // Mean Absolute Percentage Error (estimated)
    rmse: number;                // Root Mean Square Error (estimated)
    trend: 'increasing' | 'decreasing' | 'stable';
  };

  // Recommendations
  recommendations: string[];     // Action items based on forecast

  // Model metadata
  model_version: string;         // "google/timesfm-1.0-200m"
  inference_time_ms: number;     // Actual inference time
}
```

### Historical Accuracy Tracking

```typescript
interface ForecastAccuracy {
  forecast_id: string;           // Reference to original forecast
  forecast_date: string;         // When forecast was generated
  actual_values: number[];       // Actual observed values

  // Accuracy metrics
  actual_mape: number;           // Actual MAPE after observation
  actual_rmse: number;           // Actual RMSE after observation
  accuracy_percentage: number;   // 1 - MAPE

  // Error analysis
  mean_error: number;            // Average error (bias)
  max_error: number;             // Worst-case error
  error_distribution: {
    within_5pct: number;         // % of forecasts within 5% error
    within_10pct: number;        // % of forecasts within 10% error
  };
}
```

---

## 5. Algorithms & Logic

### Trend Detection

**Problem**: Identify if forecast shows increasing, decreasing, or stable trend

**Solution**: Linear regression on forecast values

```typescript
function detectTrend(forecast: number[]): 'increasing' | 'decreasing' | 'stable' {
  // Perform linear regression
  const n = forecast.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = forecast;

  // Calculate slope (β1)
  const meanX = x.reduce((a, b) => a + b) / n;
  const meanY = y.reduce((a, b) => a + b) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += (x[i] - meanX) ** 2;
  }

  const slope = numerator / denominator;

  // Classify trend based on slope
  if (slope > 0.5) return 'increasing';
  if (slope < -0.5) return 'decreasing';
  return 'stable';
}
```

### Recommendation Generation

**Problem**: Generate actionable recommendations based on forecast

**Solution**: Rule-based system with threshold logic

```typescript
function generateRecommendations(
  forecast: number[],
  scenario: string,
  trend: string
): string[] {
  const recommendations: string[] = [];

  // Calculate key statistics
  const avgForecast = forecast.reduce((a, b) => a + b) / forecast.length;
  const maxForecast = Math.max(...forecast);
  const minForecast = Math.min(...forecast);
  const variance = (maxForecast - minForecast) / avgForecast;

  // Scenario-specific recommendations
  if (scenario === 'occupancy') {
    if (trend === 'increasing' && maxForecast > 90) {
      recommendations.push('High demand expected - consider dynamic pricing (+15-25%)');
      recommendations.push('Staff up housekeeping for peak days');
    }

    if (variance > 0.3) {
      recommendations.push('High variance detected - adjust staffing schedules dynamically');
    }

    if (minForecast < 50) {
      recommendations.push('Low occupancy days detected - promote last-minute deals');
    }
  }

  if (scenario === 'restaurant-demand') {
    if (trend === 'increasing') {
      recommendations.push(`Order ${Math.round((avgForecast / 100) * 115)}% of normal ingredients for peak`);
      recommendations.push('Schedule additional servers for high-demand days');
    }
  }

  return recommendations;
}
```

### Accuracy Measurement (Retrospective)

**Problem**: Measure forecast accuracy after actual values are observed

**Solution**: Calculate MAPE (Mean Absolute Percentage Error)

```typescript
function calculateActualAccuracy(
  forecast: number[],
  actual: number[]
): { mape: number; rmse: number; accuracy: number } {
  const n = Math.min(forecast.length, actual.length);

  // MAPE (Mean Absolute Percentage Error)
  let mapeSum = 0;
  for (let i = 0; i < n; i++) {
    if (actual[i] !== 0) {
      mapeSum += Math.abs((actual[i] - forecast[i]) / actual[i]);
    }
  }
  const mape = (mapeSum / n) * 100;  // As percentage

  // RMSE (Root Mean Square Error)
  let rmseSum = 0;
  for (let i = 0; i < n; i++) {
    rmseSum += (actual[i] - forecast[i]) ** 2;
  }
  const rmse = Math.sqrt(rmseSum / n);

  // Accuracy (1 - MAPE)
  const accuracy = 100 - mape;

  return { mape, rmse, accuracy };
}
```

---

## 6. ROI Calculation (Detailed)

### Revenue Optimization Improvement

**Baseline** (Before TimesFM):
- Manual forecasting (80-85% accuracy)
- Static pricing (fixed rates)
- Reactive inventory management
- Average occupancy: 75%
- Average daily rate (ADR): $150

**After TimesFM**:
- Automated forecasting (92% accuracy)
- Dynamic pricing (7-12% improvement)
- Proactive inventory management
- Average occupancy: 78% (3% improvement)
- Average daily rate (ADR): $165 (10% improvement)

**Calculations** (50-room hotel):

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Avg Occupancy** | 75% | 78% | +3% |
| **Avg Daily Rate** | $150 | $165 | +10% |
| **Monthly Revenue** | $168,750 | $193,050 | **+$24,300** |
| **Waste Reduction** | $1,500 | $800 | **+$700** |
| **Total Monthly Gain** | - | - | **$25,000** |

**ROI Calculation**:
- **Savings**: $25,000/month × 10% attribution to forecasting = $2,500/month
- **Cost**: $500/month (GPU infrastructure + staff time)
- **NET ROI**: $2,000/month ($24,000/year)

**Conservative estimate for demo**: $2,000/month ($24,000/year)

---

## 7. Performance Targets

### Forecast Accuracy

**Overall Accuracy**: 90-95% (measured by 1 - MAPE)

**By Scenario**:
- **Occupancy**: 92-95% (most predictable, strong patterns)
- **Revenue**: 90-93% (depends on pricing strategy)
- **Demand**: 88-92% (external factors like weather)
- **Events**: 85-90% (high variance, one-off events)

**By Forecast Horizon**:
- **Days 1-7**: 93-96% accuracy (very confident)
- **Days 8-14**: 91-94% accuracy (confident)
- **Days 15-21**: 89-92% accuracy (good)
- **Days 22-30**: 87-91% accuracy (acceptable for strategic planning)

### Inference Speed

**TimesFM Inference Time**:
- **GPU (NVIDIA T4)**: 1-2 seconds for 30-day forecast
- **CPU (Intel Xeon)**: 10-15 seconds for 30-day forecast
- **GPU (NVIDIA A100)**: 0.5-1 second for 30-day forecast

**Target**: <2 seconds on GPU (acceptable for monthly strategic planning)

---

## 8. Implementation Notes

### Model Deployment

**Recommended Setup**:

1. **Greengrass (On-premise) with GPU** - For large hotels
   - NVIDIA T4 GPU ($400 additional)
   - TimesFM 200M model
   - Monthly forecasts: 2 seconds
   - $800 hardware + $22/month AWS

2. **AWS SageMaker (Cloud GPU)** - For small/medium hotels
   - On-demand GPU inference
   - Pay-per-use ($0.50-1.00 per forecast)
   - $50-100/month for monthly forecasts

3. **Lambda with CPU (Fallback)** - For budget-conscious
   - TimesFM on CPU (10-15 seconds)
   - Acceptable for monthly batch jobs
   - $20-50/month

### Database Schema

```sql
-- Timeseries forecasts (one per scenario per generation)
CREATE TABLE timeseries_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  scenario VARCHAR(50) NOT NULL,
  scenario_name VARCHAR(200) NOT NULL,

  historical_data JSONB NOT NULL,
  historical_period VARCHAR(100) NOT NULL,

  forecast JSONB NOT NULL,
  forecast_horizon INTEGER NOT NULL,
  confidence_lower JSONB NOT NULL,
  confidence_upper JSONB NOT NULL,

  metrics JSONB NOT NULL,
  recommendations JSONB NOT NULL,

  model_version VARCHAR(100) NOT NULL,
  inference_time_ms INTEGER NOT NULL
);

-- Forecast accuracy tracking (retrospective analysis)
CREATE TABLE forecast_accuracy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  forecast_id UUID REFERENCES timeseries_forecasts(id),
  forecast_date DATE NOT NULL,

  actual_values JSONB NOT NULL,
  actual_mape DECIMAL(5,2) NOT NULL,
  actual_rmse DECIMAL(8,2) NOT NULL,
  accuracy_percentage DECIMAL(5,2) NOT NULL,

  mean_error DECIMAL(8,2),
  max_error DECIMAL(8,2),
  error_distribution JSONB,

  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. UI Design (Three-View Architecture)

### View 1: Scenarios (Staff/Manager Operations)

**Purpose**: Generate forecasts for different scenarios interactively

**Layout**:
- **Top**: Scenario selector (4 cards: Occupancy, Revenue, Demand, Events)
- **Middle**: Interactive controls
  - Forecast horizon slider (7-30 days)
  - "Generate Forecast" button
- **Bottom**: Forecast results
  - Trend indicator (📈 increasing / 📉 decreasing / ➡️ stable)
  - Daily forecast values with confidence intervals
  - Action recommendations

**Key Features**:
- Visual trend indicators (emoji + color-coded)
- Confidence intervals shown as ranges
- Actionable recommendations based on forecast

### View 2: Performance (Manager ROI)

**Purpose**: Show forecast accuracy, ROI metrics, strategic insights

**Layout**:
- **Top**: ROI card ($2,000/month savings)
  - Revenue optimization: $1,800/month
  - Waste reduction: $700/month
  - Infrastructure cost: -$500/month
  - NET: $2,000/month
- **Middle**: Accuracy by scenario
  - Occupancy: 94% accuracy (MAPE 3.2%)
  - Revenue: 92% accuracy (MAPE 4.1%)
  - Demand: 90% accuracy (MAPE 5.3%)
  - Events: 88% accuracy (MAPE 6.8%)
- **Bottom**: Before/After comparison
  - Accuracy: 82% → 92% (10% improvement)
  - Revenue: $168k → $193k (+15%)
  - Waste: $1,500 → $800 (-47%)

### View 3: Historical (Retrospective Analysis)

**Purpose**: Track forecast accuracy over time, demonstrate system reliability

**Layout**:
- **Table**: Last 6 months of forecasts vs actuals
  - Month
  - Scenario
  - Forecasted avg
  - Actual avg
  - MAPE %
  - Accuracy %
- **Insights**: System observations
  - "Occupancy forecasts consistently 92-95% accurate over 6 months"
  - "Revenue forecasts improved from 88% to 94% accuracy (seasonal learning)"
  - "Event forecasts most challenging (85-90% accuracy) - acceptable for planning"

---

## 10. Sample Data (Demo)

### Occupancy Forecast

```typescript
const occupancyForecast = {
  scenario: 'Hotel Occupancy Rate',
  historical: [72, 75, 68, 78, 82, 85, 80, 76, 79, 83, 88, 90, 85, 81],  // Last 14 days
  forecast: [84, 87, 89, 92, 90, 88, 85, 83, 86, 89, 91, 94, 92, 89, 87, ...],  // Next 30 days
  confidence: {
    lower: [80, 83, 85, 88, 86, 84, 81, 79, 82, 85, 87, 90, 88, 85, 83, ...],
    upper: [88, 91, 93, 96, 94, 92, 89, 87, 90, 93, 95, 98, 96, 93, 91, ...],
  },
  metrics: {
    mape: 3.2,
    rmse: 2.8,
    trend: 'increasing',
  },
  recommendations: [
    'High demand expected - consider dynamic pricing (+15-25%)',
    'Staff up housekeeping for Fri-Sat peak (days 4-5, 11-12, 18-19)',
    'Promote last-minute deals for mid-week lulls (Tue-Wed)',
  ],
};
```

---

## 11. Comparison: TimesFM vs LightGBM

**When to use TimesFM**:
- Long-range forecasting (14-30 days)
- Strategic planning (revenue, budgets)
- Complex patterns (events, holidays)
- Minimal historical data (<60 days)
- Zero-shot capability needed

**When to use LightGBM**:
- Short-range forecasting (7 days)
- Daily operations (inventory, staffing)
- Fast inference required (<100ms)
- Cost-sensitive ($100-200/month)
- Tabular data with clear patterns

**Ideal Setup**: Use **both**
- **LightGBM** for daily operations (inventory, kitchen, laundry)
- **TimesFM** for monthly strategic planning (occupancy, revenue, budgets)
- Combined cost: $400-800/month
- Combined ROI: $3,500/month ($1,500 LightGBM + $2,000 TimesFM)

---

## 12. Key Takeaways

1. **TimesFM is for strategic planning** - 14-30 day forecasts for revenue optimization
2. **Zero-shot capability** - No model training required (foundation model)
3. **90-95% accuracy** - 3-5% better than LightGBM for long-range
4. **GPU recommended** - 1-2 seconds vs 10-15 seconds on CPU
5. **Complementary to LightGBM** - Both solve different problems (strategic vs operational)
6. **ROI from revenue optimization** - Dynamic pricing + better capacity planning
7. **Typical ROI**: $2,000/month for 50-room property ($24,000/year)

**Bottom Line**: TimesFM is the right choice for long-range strategic forecasting (occupancy, revenue, budgets). For daily operational forecasting (inventory, kitchen), use LightGBM. Together, they provide comprehensive forecasting coverage at $3,500/month ROI.
