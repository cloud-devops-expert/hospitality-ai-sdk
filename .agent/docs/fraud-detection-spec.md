# Fraud Detection Demo - Specification

## Executive Summary

**Purpose**: Real-time booking fraud detection using XGBoost gradient boosting to prevent chargebacks, party damage, and fraudulent reservations.

**Technology**: XGBoost (supervised learning) + rule-based triggers
**ROI**: $1,200/month ($14,400/year) for 50-room hotel
**Performance**: 82-88% fraud detection rate, 12% false positive rate, <80ms inference
**Cost**: $150/month infrastructure (CPU-only)

**Key Insight**: Traditional ML (XGBoost) outperforms both rule-based systems (50% detection) and unsupervised methods (Isolation Forest 60-70%) because we have labeled fraud data from historical chargebacks, party damage incidents, and no-shows.

---

## ROI Calculation

### Before AI (Manual Review Only)

**50-room hotel baseline**:
- Monthly bookings: 800 (50 rooms × 80% occupancy × 20 booking/room/month)
- Fraud rate: 3% (24 fraudulent bookings/month)
- Average fraud loss per incident: $800 (chargeback + damage + staff time)
- **Monthly fraud losses**: 24 × $800 = **$19,200**
- Manual review capacity: 50 bookings/month (5% of volume)
- Manual detection rate: 40% (10 fraudulent bookings caught)
- **Net monthly losses**: (24 - 10) × $800 = **$11,200**

### After AI (XGBoost Detection)

**ML-powered fraud prevention**:
- All 800 bookings scored automatically (<80ms per booking)
- High-risk bookings (15% = 120 bookings) flagged for review
- ML detection rate: 85% (20 of 24 fraudulent bookings caught)
- False positive rate: 12% (96 clean bookings flagged unnecessarily)
- Staff reviews: 120 bookings/month (96 false + 24 real = 120 total)
- Manual review time: 5 min/booking × 120 = 10 hours/month ($300 labor)
- **Prevented losses**: 20 × $800 = **$16,000/month**
- Remaining fraud: 4 × $800 = **$3,200/month**
- **Net savings**: $11,200 - $3,200 - $300 = **$7,700/month**

### Conservative ROI Estimate

**Using 60% improvement (conservative)**:
- Baseline losses: $11,200/month (manual only)
- AI-prevented losses: $11,200 × 60% = **$6,720/month**
- Staff review cost: $300/month
- Infrastructure cost: $150/month
- **Net ROI**: $6,720 - $300 - $150 = **$6,270/month**

**Documented ROI**: $1,200/month (extremely conservative, assumes only preventing 2 fraud incidents/month at $800 each = $1,600 - $400 costs)

---

## Technology Choice: XGBoost vs Isolation Forest

### Why XGBoost (Supervised Learning)

**Advantages**:
- 82-88% detection rate (labeled data from historical chargebacks)
- 12% false positive rate (precise targeting)
- Feature importance insights (understand fraud patterns)
- Handles imbalanced data well (3% fraud rate)
- Fast inference: <80ms on CPU
- Cost: $100-150/month (CPU-only)

**Requirements**:
- Labeled historical data (chargebacks, damage incidents, no-shows)
- Periodic retraining (weekly or monthly)
- Feature engineering for booking patterns

### Why NOT Isolation Forest (Unsupervised Learning)

**Limitations**:
- 60-70% detection rate (detects anomalies, not necessarily fraud)
- 25-35% false positive rate (too many false alarms)
- No feature importance (black box)
- Doesn't learn from labeled fraud cases
- Good for NEW fraud patterns, poor for known patterns

**Best Use**: Complement to XGBoost for detecting novel fraud types

### Combined Approach (Recommended)

1. **XGBoost (Primary)**: 85% detection of known fraud patterns
2. **Rule-Based Triggers**: Catch obvious red flags (e.g., >10 rooms booked in 1 hour)
3. **Isolation Forest (Secondary)**: Flag novel patterns for manual review
4. **Staff Review**: Final decision on high-risk bookings

---

## Three-View Architecture

### View 1: Pending Reviews (Staff Operations)

**Purpose**: Actionable fraud review queue for front desk staff

**Components**:

1. **Pending High-Risk Bookings** (Priority Queue)
   - 15-20 bookings awaiting review
   - Risk score: 0-100 (65+ requires review)
   - Color-coded by urgency: Critical (>85), High (75-85), Medium (65-75)
   - Countdown timer: Hours until check-in
   - Quick actions: Approve, Require Deposit, Request ID, Decline

2. **Booking Details Card**
   - Guest info: Name, email, phone, country
   - Booking details: Rooms, guests, nights, value, payment method
   - Historical context: Previous stays, cancellations, chargebacks
   - Risk factors: Top 5 contributing factors with weights

3. **Risk Score Breakdown**
   - Overall risk score: 0-100
   - Category scores: Booking pattern (30%), Payment (25%), Guest history (20%), Timing (15%), Value (10%)
   - Feature importance: Which factors drove the score
   - Similar fraud cases: Past incidents with similar patterns

4. **Decision Workflow**
   - **Approve** (risk <65): Accept booking, standard monitoring
   - **Require Deposit** (risk 65-75): Request 50% deposit + ID verification
   - **Request ID Verification** (risk 75-85): Hold booking pending ID + credit card photo
   - **Decline/Manual Review** (risk >85): Contact guest for clarification or decline

**Sample Data**:
```typescript
interface PendingReview {
  id: string;
  bookingReference: string;
  guestName: string;
  riskScore: number;           // 0-100 (65+ requires review)
  riskLevel: 'critical' | 'high' | 'medium';
  hoursUntilCheckIn: number;   // Urgency indicator
  bookingDetails: {
    rooms: number;
    guests: number;
    nights: number;
    totalValue: number;
    paymentMethod: string;
    isInternational: boolean;
    isFirstTime: boolean;
  };
  riskFactors: Array<{
    factor: string;
    weight: number;             // 0-1 (contribution to risk score)
    description: string;
  }>;
  recommendation: 'approve' | 'require_deposit' | 'require_id' | 'decline';
  similarFraudCases: number;    // Count of similar past fraud incidents
}
```

### View 2: Performance Metrics (Manager Focus)

**Purpose**: Prove ROI and track fraud prevention effectiveness

**Components**:

1. **ROI Card**
   - Monthly savings: $1,200 ($14,400/year)
   - Fraud prevented: $1,600/month (2 incidents at $800 each)
   - System cost: $150/month (infrastructure) + $250/month (staff review time)
   - Net ROI: $1,200/month
   - Payback period: <1 month

2. **Detection Performance**
   - **Before AI**: 40% fraud detection, $11,200/month losses
   - **After AI**: 85% fraud detection, $3,200/month losses
   - **Improvement**: 71% reduction in fraud losses

3. **Accuracy Metrics**
   - True Positive Rate: 85% (detected 20 of 24 fraud cases)
   - False Positive Rate: 12% (flagged 96 clean bookings)
   - Precision: 17% (20 fraud / 120 flagged = 20/120)
   - Recall: 85% (20 detected / 24 total fraud)
   - F1 Score: 0.28 (harmonic mean of precision/recall)

   **Note**: Low precision is ACCEPTABLE in fraud detection because:
   - Cost of missing fraud ($800) >> Cost of false review (5 min × $30/hr = $2.50)
   - 96 false positives × $2.50 = $240/month << $16,000 prevented
   - Industry standard: 10-20% false positive rate is excellent

4. **Monthly Breakdown**
   - Total bookings processed: 800
   - High-risk flagged: 120 (15%)
   - Fraud prevented: 20 bookings ($16,000)
   - False alarms: 96 bookings (12%)
   - Staff review time: 10 hours ($300)
   - Missed fraud: 4 bookings ($3,200)
   - **Net savings**: $7,700/month (realistic) or $1,200/month (conservative)

5. **Cost Analysis**
   ```
   Monthly Costs:
   - XGBoost infrastructure: $100/month (CPU inference)
   - Data storage: $20/month (PostgreSQL)
   - Model retraining: $30/month (weekly batch jobs)
   - Staff review time: $300/month (10 hours)
   - TOTAL: $450/month

   Monthly Benefits:
   - Fraud prevented: $1,600/month (2 incidents at $800)
   - Chargeback reduction: $500/month (fewer disputes)
   - Damage prevention: $1,000/month (party/property damage)
   - Staff efficiency: $200/month (automated screening)
   - TOTAL: $3,300/month

   Net ROI: $3,300 - $450 = $2,850/month
   (Documented as $1,200/month conservative estimate)
   ```

### View 3: Historical Performance (7-Day Trends)

**Purpose**: Show system learning and continuous improvement

**Components**:

1. **Daily Performance Table**
   ```
   | Date   | Bookings | Flagged | Fraud | Detected | Missed | Accuracy | Savings |
   |--------|----------|---------|-------|----------|--------|----------|---------|
   | Oct 25 | 112      | 18      | 3     | 3        | 0      | 100%     | $2,400  |
   | Oct 24 | 118      | 16      | 4     | 3        | 1      | 75%      | $1,800  |
   | Oct 23 | 105      | 14      | 2     | 2        | 0      | 100%     | $1,600  |
   | Oct 22 | 122      | 21      | 5     | 4        | 1      | 80%      | $2,800  |
   | Oct 21 | 98       | 12      | 2     | 2        | 0      | 100%     | $1,600  |
   | Oct 20 | 115      | 17      | 3     | 2        | 1      | 67%      | $1,400  |
   | Oct 19 | 130      | 22      | 5     | 4        | 1      | 80%      | $2,800  |
   | TOTAL  | 800      | 120     | 24    | 20       | 4      | 83%      | $14,400 |
   ```

2. **Weekly Insights** (System Learning)
   - "New fraud pattern detected: Last-minute bookings (>$2,000) with prepaid cards - added to model"
   - "False positive rate decreased from 15% to 12% after retraining"
   - "Party risk pattern refined: Guest-to-room ratio >5 on weekends"
   - "International bookings (<24h) require extra verification"
   - "Model accuracy improved from 78% to 85% this month"

3. **Trend Visualization**
   - Weekly detection rate: 78% → 85% (improving)
   - Weekly false positive rate: 18% → 12% (improving)
   - Weekly fraud losses: $15,200 → $3,200 (improving)
   - Model confidence: 72% → 88% (improving)

---

## Fraud Detection Algorithm

### Feature Engineering (30+ Features)

**Booking Pattern Features (30% weight)**:
1. Hours until check-in (last-minute risk)
2. Booking lead time (same-day vs advance)
3. Rooms-to-guests ratio (unusual patterns)
4. Guests-per-room ratio (party risk)
5. Nights stayed (single-night vs multi-night)
6. Day of week (weekends higher risk)
7. Booking time (late night higher risk)
8. Booking value per night (unusually high)
9. Multiple rooms same booking (party indicator)
10. Room type distribution (all suites = suspicious)

**Payment Features (25% weight)**:
1. Payment method (prepaid card = high risk, credit card = low risk)
2. Payment country vs IP country mismatch
3. Card type (corporate, personal, prepaid)
4. Payment processor response time (slow = manual entry)
5. Multiple failed payment attempts
6. Chargeback history on card network

**Guest History Features (20% weight)**:
1. First-time guest (higher risk)
2. Previous stays count (loyalty indicator)
3. Previous cancellations (pattern of no-shows)
4. Previous chargebacks (red flag)
5. Previous damage incidents (high risk)
6. Average booking value (sudden spike suspicious)
7. Booking frequency (regular vs sporadic)

**Geographic Features (15% weight)**:
1. International booking (higher risk)
2. IP country vs billing country mismatch
3. Distance from hotel (local vs international)
4. High-risk countries list (fraud hotspots)
5. VPN/proxy detection (hiding location)

**Value Features (10% weight)**:
1. Total booking value (>$2,000 higher risk)
2. Value per night (>$800/night suspicious)
3. Value vs market rate (20%+ above suspicious)
4. Upsells/extras (excessive add-ons)

### XGBoost Model Configuration

```python
import xgboost as xgb

# Model hyperparameters (tuned for fraud detection)
model = xgb.XGBClassifier(
    n_estimators=200,              # 200 trees for complex patterns
    max_depth=6,                   # Prevent overfitting
    learning_rate=0.05,            # Slow learning for stability
    subsample=0.8,                 # 80% data sampling
    colsample_bytree=0.8,          # 80% feature sampling
    scale_pos_weight=32,           # Handle 3% fraud imbalance (97/3)
    objective='binary:logistic',   # Binary classification
    eval_metric='aucpr',           # Optimize precision-recall
    early_stopping_rounds=10,      # Stop if no improvement
    random_state=42
)

# Training data
X_train = extract_features(historical_bookings)  # 30+ features
y_train = historical_bookings['is_fraud']        # Labeled fraud cases

# Train model
model.fit(X_train, y_train, verbose=True)

# Inference (<80ms on CPU)
risk_score = model.predict_proba(booking_features)[:, 1] * 100  # 0-100 score
```

### Risk Thresholds

```typescript
function determineAction(riskScore: number, bookingValue: number): Action {
  // Critical risk (>85): Manual review or decline
  if (riskScore >= 85) {
    return {
      action: 'manual_review',
      requirements: ['ID verification', 'Credit card photo', 'Phone verification'],
      deposit: bookingValue * 0.50,  // 50% deposit required
      recommendation: 'Consider declining if verification fails'
    };
  }

  // High risk (75-85): Require verification
  if (riskScore >= 75) {
    return {
      action: 'require_verification',
      requirements: ['ID verification', 'Credit card photo'],
      deposit: bookingValue * 0.30,  // 30% deposit
      recommendation: 'Approve after verification'
    };
  }

  // Medium risk (65-75): Require deposit
  if (riskScore >= 65) {
    return {
      action: 'require_deposit',
      requirements: ['Credit card authorization'],
      deposit: bookingValue * 0.20,  // 20% deposit
      recommendation: 'Standard verification'
    };
  }

  // Low risk (<65): Auto-approve
  return {
    action: 'approve',
    requirements: [],
    deposit: 0,
    recommendation: 'Accept booking with standard monitoring'
  };
}
```

### Rule-Based Overrides (Catch Obvious Fraud)

```typescript
// Hard rules that override ML score (instant high-risk)
function applyRuleOverrides(booking: Booking): number {
  let riskScore = booking.mlScore;  // Start with ML score

  // CRITICAL: Multiple high-risk factors together
  if (
    booking.hoursUntilCheckIn < 6 &&         // <6 hours to check-in
    booking.isFirstTime &&                   // First-time guest
    booking.paymentMethod === 'prepaid_card' && // Prepaid card
    booking.roomsCount >= 3                  // 3+ rooms
  ) {
    return 95;  // Override to critical risk
  }

  // HIGH: Unusual value patterns
  if (booking.bookingValue > 5000 && booking.nightsStay === 1) {
    riskScore = Math.max(riskScore, 85);  // Ensure at least high risk
  }

  // HIGH: Party pattern
  if (booking.guestsCount / booking.roomsCount > 5 && isDayBeforeWeekend(booking)) {
    riskScore = Math.max(riskScore, 80);
  }

  // HIGH: Multiple rooms, last minute, international, first time
  if (
    booking.roomsCount >= 3 &&
    booking.hoursUntilCheckIn < 24 &&
    booking.isInternational &&
    booking.isFirstTime
  ) {
    riskScore = Math.max(riskScore, 82);
  }

  return riskScore;
}
```

---

## Database Schema

### fraud_detection_records (Booking Scores)

```sql
CREATE TABLE fraud_detection_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  booking_id VARCHAR(50) NOT NULL UNIQUE,
  guest_id UUID,

  -- Booking details
  booking_date TIMESTAMPTZ NOT NULL,
  check_in_date DATE NOT NULL,
  hours_until_checkin INTEGER NOT NULL,
  rooms_count INTEGER NOT NULL,
  guests_count INTEGER NOT NULL,
  nights_stay INTEGER NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  is_international BOOLEAN NOT NULL,
  is_first_time BOOLEAN NOT NULL,

  -- Risk scoring
  ml_risk_score INTEGER NOT NULL,           -- 0-100 from XGBoost
  rule_risk_score INTEGER NOT NULL,         -- 0-100 from rule overrides
  final_risk_score INTEGER NOT NULL,        -- 0-100 final score
  risk_level VARCHAR(20) NOT NULL,          -- critical/high/medium/low

  -- Risk factors
  risk_factors JSONB NOT NULL,              -- Array of {factor, weight, description}
  feature_importance JSONB,                 -- Top 10 features that contributed
  similar_fraud_cases INTEGER DEFAULT 0,    -- Count of similar past fraud

  -- Decision workflow
  recommendation VARCHAR(50) NOT NULL,      -- approve/require_deposit/require_id/decline
  staff_decision VARCHAR(50),               -- approve/require_deposit/require_id/decline
  staff_notes TEXT,
  decided_by VARCHAR(100),
  decided_at TIMESTAMPTZ,

  -- Outcome tracking
  is_fraud BOOLEAN,                         -- NULL until confirmed
  fraud_type VARCHAR(50),                   -- chargeback/damage/noshow/other
  fraud_loss DECIMAL(10,2),                 -- Actual loss if fraud occurred
  confirmed_at TIMESTAMPTZ,

  -- Performance metrics
  processing_time_ms INTEGER NOT NULL,
  model_version VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_risk_level (risk_level, created_at),
  INDEX idx_booking_date (booking_date),
  INDEX idx_fraud_outcome (is_fraud, fraud_type)
);
```

### fraud_detection_daily_stats (Performance Aggregates)

```sql
CREATE TABLE fraud_detection_daily_stats (
  date DATE PRIMARY KEY,

  -- Volume metrics
  total_bookings INTEGER NOT NULL,
  flagged_bookings INTEGER NOT NULL,        -- Risk score >= 65
  critical_risk_count INTEGER NOT NULL,     -- Risk score >= 85
  high_risk_count INTEGER NOT NULL,         -- Risk score 75-85
  medium_risk_count INTEGER NOT NULL,       -- Risk score 65-75

  -- Detection performance
  confirmed_fraud_cases INTEGER NOT NULL,
  detected_fraud_cases INTEGER NOT NULL,    -- TP: Flagged and confirmed fraud
  missed_fraud_cases INTEGER NOT NULL,      -- FN: Not flagged but was fraud
  false_alarms INTEGER NOT NULL,            -- FP: Flagged but not fraud
  true_negatives INTEGER NOT NULL,          -- TN: Not flagged, not fraud

  -- Accuracy metrics
  detection_rate DECIMAL(5,2) NOT NULL,     -- Recall: TP / (TP + FN)
  false_positive_rate DECIMAL(5,2) NOT NULL, -- FP / (FP + TN)
  precision DECIMAL(5,2) NOT NULL,          -- TP / (TP + FP)
  f1_score DECIMAL(5,2),                    -- Harmonic mean of precision/recall

  -- Financial impact
  fraud_prevented_value DECIMAL(10,2) NOT NULL,  -- Value of detected fraud
  fraud_missed_value DECIMAL(10,2) NOT NULL,     -- Value of missed fraud
  daily_savings DECIMAL(10,2) NOT NULL,          -- Prevented - cost

  -- Operational metrics
  avg_review_time_minutes INTEGER,
  staff_hours_spent DECIMAL(5,2),
  staff_cost DECIMAL(10,2),

  -- System performance
  avg_risk_score DECIMAL(5,2),
  avg_processing_time_ms INTEGER NOT NULL,
  model_version VARCHAR(20) NOT NULL,

  -- Learning insights
  insights JSONB NOT NULL,                  -- Array of daily insights
  new_patterns_detected INTEGER DEFAULT 0,  -- Novel fraud patterns

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### fraud_patterns (Known Fraud Signatures)

```sql
CREATE TABLE fraud_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  pattern_name VARCHAR(100) NOT NULL,
  pattern_description TEXT NOT NULL,

  -- Pattern features
  feature_signature JSONB NOT NULL,         -- Key features that define pattern
  min_risk_score INTEGER NOT NULL,          -- Minimum risk score to trigger

  -- Detection history
  first_detected_date DATE NOT NULL,
  detection_count INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,
  confidence DECIMAL(5,2) NOT NULL,         -- Pattern reliability

  -- Response
  recommended_action VARCHAR(50) NOT NULL,
  staff_guidance TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample patterns
INSERT INTO fraud_patterns (pattern_name, pattern_description, feature_signature, min_risk_score, first_detected_date, confidence, recommended_action, staff_guidance) VALUES
('Last-Minute Party Booking',
 'Multiple rooms booked <24h before check-in on weekend with high guest count',
 '{"hours_until_checkin": "<24", "rooms_count": ">=3", "guests_per_room": ">4", "day": "Fri/Sat"}',
 85,
 '2024-01-15',
 0.92,
 'require_verification',
 'Request ID, phone verification, and 50% deposit. Common pattern for unauthorized parties.'),

('High-Value Prepaid Card',
 'Booking value >$2,000 paid with prepaid card by first-time international guest',
 '{"booking_value": ">2000", "payment_method": "prepaid_card", "is_first_time": true, "is_international": true}',
 88,
 '2024-02-10',
 0.87,
 'manual_review',
 'High chargeback risk. Verify card and ID before accepting. Consider declining if guest refuses verification.');
```

---

## Sample Data (7-Day Historical Performance)

```typescript
const HISTORICAL_DATA: DailyStats[] = [
  {
    date: '2024-10-25',
    day: 'Fri',
    totalBookings: 112,
    flaggedBookings: 18,
    confirmedFraud: 3,
    detectedFraud: 3,
    missedFraud: 0,
    falseAlarms: 15,
    detectionRate: 100,
    falsePositiveRate: 13.4,
    precision: 16.7,
    avgRiskScore: 72.5,
    fraudPreventedValue: 2400,
    dailySavings: 2100,
    insight: 'Perfect detection day - all 3 fraud cases flagged. Weekend party pattern detected.'
  },
  {
    date: '2024-10-24',
    day: 'Thu',
    totalBookings: 118,
    flaggedBookings: 16,
    confirmedFraud: 4,
    detectedFraud: 3,
    missedFraud: 1,
    falseAlarms: 13,
    detectionRate: 75,
    falsePositiveRate: 11.0,
    precision: 18.8,
    avgRiskScore: 69.8,
    fraudPreventedValue: 2400,
    dailySavings: 1950,
    insight: 'Missed 1 fraud case - new pattern: local guest with stolen card. Added to training data.'
  },
  {
    date: '2024-10-23',
    day: 'Wed',
    totalBookings: 105,
    flaggedBookings: 14,
    confirmedFraud: 2,
    detectedFraud: 2,
    missedFraud: 0,
    falseAlarms: 12,
    detectionRate: 100,
    falsePositiveRate: 11.4,
    precision: 14.3,
    avgRiskScore: 68.2,
    fraudPreventedValue: 1600,
    dailySavings: 1300,
    insight: 'Low fraud day. Model confidence improved to 88% after last week retraining.'
  },
  {
    date: '2024-10-22',
    day: 'Tue',
    totalBookings: 122,
    flaggedBookings: 21,
    confirmedFraud: 5,
    detectedFraud: 4,
    missedFraud: 1,
    falseAlarms: 17,
    detectionRate: 80,
    falsePositiveRate: 13.9,
    precision: 19.0,
    avgRiskScore: 74.1,
    fraudPreventedValue: 3200,
    dailySavings: 2750,
    insight: 'High fraud day - convention in town. 80% detection rate, 1 missed (local prepaid card).'
  },
  {
    date: '2024-10-21',
    day: 'Mon',
    totalBookings: 98,
    flaggedBookings: 12,
    confirmedFraud: 2,
    detectedFraud: 2,
    missedFraud: 0,
    falseAlarms: 10,
    detectionRate: 100,
    falsePositiveRate: 10.2,
    precision: 16.7,
    avgRiskScore: 67.5,
    fraudPreventedValue: 1600,
    dailySavings: 1250,
    insight: 'Excellent detection. False positive rate down to 10.2% (improving).'
  },
  {
    date: '2024-10-20',
    day: 'Sun',
    totalBookings: 115,
    flaggedBookings: 17,
    confirmedFraud: 3,
    detectedFraud: 2,
    missedFraud: 1,
    falseAlarms: 15,
    detectionRate: 67,
    falsePositiveRate: 13.0,
    precision: 11.8,
    avgRiskScore: 71.3,
    fraudPreventedValue: 1600,
    dailySavings: 1200,
    insight: 'Missed 1 fraud - new pattern: business traveler with multiple failed payments. Pattern added.'
  },
  {
    date: '2024-10-19',
    day: 'Sat',
    totalBookings: 130,
    flaggedBookings: 22,
    confirmedFraud: 5,
    detectedFraud: 4,
    missedFraud: 1,
    falseAlarms: 18,
    detectionRate: 80,
    falsePositiveRate: 13.8,
    precision: 18.2,
    avgRiskScore: 73.8,
    fraudPreventedValue: 3200,
    dailySavings: 2800,
    insight: 'Weekend surge - party bookings increased. 4 of 5 fraud cases detected.'
  }
];

// Weekly totals
const WEEKLY_SUMMARY = {
  totalBookings: 800,
  flaggedBookings: 120,
  confirmedFraud: 24,
  detectedFraud: 20,
  missedFraud: 4,
  falseAlarms: 100,
  detectionRate: 83.3,        // 20/24
  falsePositiveRate: 12.8,    // 100/780
  precision: 16.7,            // 20/120
  fraudPreventedValue: 16000, // 20 × $800
  weeklySavings: 14400,       // After costs
  avgProcessingTime: 68       // milliseconds
};
```

---

## UI Component Structure

### Reusable Components
```typescript
import {
  ViewTabs,          // Three-view navigation
  ROICard,           // ROI metrics display
  ROIMetrics,        // Before/after comparison
  HistoricalTable,   // 7-day performance table
  InsightsBox,       // System insights display
  TableFormatters,   // Data formatting utilities
} from '@/components/demos/shared';
```

### Custom Components

1. **PendingReviewQueue**
   - List of high-risk bookings awaiting review
   - Priority sorting (risk score + hours until check-in)
   - Color-coded risk levels
   - Quick action buttons

2. **BookingDetailsCard**
   - Guest information
   - Booking details
   - Risk score breakdown
   - Risk factors list
   - Similar fraud cases

3. **RiskScoreGauge**
   - 0-100 gauge visualization
   - Color-coded zones: Green (0-64), Yellow (65-74), Orange (75-84), Red (85-100)
   - Confidence indicator

4. **DecisionWorkflow**
   - Action buttons: Approve, Require Deposit, Request ID, Decline
   - Decision history
   - Staff notes

---

## Model Training & Deployment

### Training Pipeline (Weekly Batch)

```python
# Weekly retraining script (runs Sunday 2am)
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

# 1. Load last 6 months of labeled data
bookings = load_bookings(start_date='2024-04-01', end_date='2024-10-25')
# Expected: ~14,400 bookings (800/month × 6 months)
# Expected fraud rate: ~3% (432 fraud cases)

# 2. Extract features (30+ features)
X = extract_features(bookings)
y = bookings['is_fraud'].astype(int)

# 3. Train/test split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# 4. Train XGBoost
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=32,  # 97/3 = 32.3 (handle imbalance)
    objective='binary:logistic',
    eval_metric='aucpr',
    early_stopping_rounds=10,
    random_state=42
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=True
)

# 5. Evaluate performance
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))

# Expected metrics (test set):
# - Precision: 15-20% (low is OK for fraud detection)
# - Recall: 80-90% (high is critical - catch most fraud)
# - F1: 0.25-0.35 (harmonic mean)
# - AUC-PR: 0.60-0.75 (area under precision-recall curve)

# 6. Feature importance analysis
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Features:")
print(feature_importance.head(10))

# Expected top features:
# 1. hours_until_checkin (18%)
# 2. payment_method (14%)
# 3. booking_value (12%)
# 4. is_first_time (10%)
# 5. rooms_count (8%)
# ... (30+ total features)

# 7. Save model
model.save_model(f'fraud_detection_v{version}.json')
upload_to_s3(f'fraud_detection_v{version}.json')

# 8. Update production model (blue-green deployment)
deploy_model(f'fraud_detection_v{version}.json')
```

### Inference API (Real-Time)

```typescript
// API endpoint: POST /api/fraud-detection/score
// Latency: <80ms (CPU inference)

import * as xgboost from 'xgboost-node';  // Node.js XGBoost bindings

interface FraudScoreRequest {
  bookingId: string;
  guestId?: string;
  hoursUntilCheckIn: number;
  bookingValue: number;
  nightsStay: number;
  guestsCount: number;
  roomsCount: number;
  paymentMethod: string;
  isInternational: boolean;
  isFirstTime: boolean;
  // ... 20+ more features
}

interface FraudScoreResponse {
  bookingId: string;
  riskScore: number;                    // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  recommendation: 'approve' | 'require_deposit' | 'require_id' | 'decline';
  similarFraudCases: number;
  confidence: number;
  processingTimeMs: number;
}

export async function scoreFraudRisk(
  request: FraudScoreRequest
): Promise<FraudScoreResponse> {
  const startTime = performance.now();

  // 1. Load model (cached in memory)
  const model = await loadModel('fraud_detection_latest.json');

  // 2. Extract features
  const features = extractFeatures(request);

  // 3. ML inference (<50ms)
  const mlScore = model.predict(features)[0] * 100;  // 0-100

  // 4. Apply rule overrides (catch obvious fraud)
  const finalScore = applyRuleOverrides(request, mlScore);

  // 5. Determine risk level and recommendation
  const riskLevel = getRiskLevel(finalScore);
  const recommendation = getRecommendation(finalScore, request.bookingValue);

  // 6. Extract top risk factors
  const riskFactors = extractRiskFactors(request, features, model);

  // 7. Find similar fraud cases
  const similarCases = await findSimilarFraudCases(features);

  // 8. Calculate confidence
  const confidence = model.getConfidence(features);

  const endTime = performance.now();

  // 9. Log to database (async)
  logFraudScore({
    ...request,
    mlScore,
    finalScore,
    riskLevel,
    recommendation,
    processingTimeMs: endTime - startTime
  });

  return {
    bookingId: request.bookingId,
    riskScore: finalScore,
    riskLevel,
    riskFactors,
    recommendation,
    similarFraudCases: similarCases.length,
    confidence,
    processingTimeMs: endTime - startTime
  };
}
```

---

## Implementation Checklist

### Phase 1: Data Collection (Week 1)
- [ ] Export 6 months of booking data
- [ ] Label historical fraud cases (chargebacks, damage, no-shows)
- [ ] Extract 30+ features from booking records
- [ ] Create PostgreSQL tables (fraud_detection_records, fraud_detection_daily_stats)
- [ ] Validate data quality (fraud rate 2-5%)

### Phase 2: Model Training (Week 2)
- [ ] Train XGBoost model on labeled data
- [ ] Evaluate performance (target: 80%+ recall, <15% FPR)
- [ ] Tune hyperparameters for precision-recall balance
- [ ] Extract feature importance
- [ ] Document fraud patterns

### Phase 3: UI Development (Week 3)
- [ ] Create three-view architecture (Pending, Performance, Historical)
- [ ] Build PendingReviewQueue component
- [ ] Build BookingDetailsCard component
- [ ] Build RiskScoreGauge component
- [ ] Build DecisionWorkflow component
- [ ] Add sample data for demo

### Phase 4: Integration (Week 4)
- [ ] Build real-time inference API (POST /api/fraud-detection/score)
- [ ] Integrate with booking system
- [ ] Add staff decision tracking
- [ ] Build weekly retraining pipeline
- [ ] Set up monitoring and alerts

### Phase 5: Validation (Week 5-8)
- [ ] A/B test: Manual review vs AI-assisted review
- [ ] Track detection rate, false positive rate, staff time saved
- [ ] Collect feedback from front desk staff
- [ ] Refine risk thresholds based on operational feedback
- [ ] Document ROI with real data

---

## Key Takeaways

1. **XGBoost beats Isolation Forest** because we have labeled fraud data (chargebacks, damage)
2. **Low precision is acceptable** when cost of missing fraud >> cost of false review
3. **Real-time inference** (<80ms) enables 100% booking screening
4. **Weekly retraining** adapts to new fraud patterns
5. **Rule overrides** catch obvious fraud instantly
6. **Three-view architecture** serves staff (operations), managers (ROI), and system learning

**Conservative ROI**: $1,200/month (2 fraud incidents prevented)
**Realistic ROI**: $7,700/month (71% fraud loss reduction)
**Infrastructure**: $150/month (CPU-only, no GPU needed)
