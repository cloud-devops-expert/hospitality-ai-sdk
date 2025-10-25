# Inventory Management - Trend Tracking Specification

## 1. Executive Summary

**Problem**: Hotels manage 200-500 SKUs (food, beverages, linens, toiletries, cleaning supplies) with manual tracking leading to:
- 25% over-ordering (fear of stockouts)
- $800/month in expired/spoiled inventory
- 15% stockouts causing guest complaints
- 3 hours/week wasted on manual counts and ordering

**Solution**: Automated par level management with consumption-based reordering

**Real Value**:
- **For Staff**: Automated reorder alerts, mobile-friendly inventory counts, no manual calculations
- **For Manager**: Reduce waste by 80% ($640/month), eliminate stockouts, optimize cash flow
- **For GM**: Avoid guest complaints, reduce carrying costs, data-driven purchasing decisions

**Technology**: Statistical forecasting + exponential smoothing, NOT machine learning
- Par level calculation: Exponential moving average (EMA) of daily consumption
- Reorder point: `(avg_daily_consumption × lead_time) + safety_stock`
- Spoilage prediction: FIFO tracking with expiration date monitoring
- ABC analysis: Classify items by consumption value (80/20 rule)

**ROI**: $892/month savings ($10,704/year)
- Waste reduction: $640/month (80% fewer expirations)
- Stockout prevention: $150/month (fewer emergency orders)
- Labor savings: $102/month (3 hrs/week × $17/hr)
- System cost: $0 (zero API fees, simple statistics)

---

## 2. Core Concepts

### Real Problem (NOT "staff don't know how much to order")

**Actual Problem**: Manual inventory management is reactive and wasteful
- Staff over-order by 25% "just to be safe"
- No systematic tracking of actual consumption patterns
- Expiration dates not monitored (FIFO violations)
- Emergency orders cost 30-50% more than planned orders

**What Staff Actually Need**:
1. **Automated alerts**: "Milk: 5 gallons left, reorder 10 gallons (3-day lead time)"
2. **Expiration warnings**: "12 yogurt cups expire in 2 days - use first!"
3. **Mobile counting**: Tap buttons instead of clipboards and calculators
4. **Historical proof**: "Since we started using consumption-based ordering, waste dropped 78%"

### Document-Based Approach

**NOT a real-time inventory system** (that requires barcode scanners and $$)

**IS a simple daily tracking tool**:
- **Morning (8 AM)**: Staff do quick counts of key items (5-10 min)
  - High-value items: Daily (steaks, seafood, alcohol)
  - Medium-value: Every 2-3 days (dairy, produce)
  - Low-value: Weekly (paper towels, soap)

- **Throughout Day**: System monitors consumption patterns
  - Kitchen uses ingredients → consumption logged
  - Housekeeping uses linens → usage tracked
  - Front desk uses toiletries → quantities recorded

- **Evening (5 PM)**: System generates reorder recommendations
  - "Tomatoes: 15 lbs left, avg consumption 20 lbs/day, reorder 40 lbs"
  - "Hand soap: 8 bottles left, usage 3/day, reorder 15 bottles"

**System learns over time**:
- If tomato consumption spikes on weekends, system adjusts par levels
- If milk expires frequently, system reduces order quantity
- If steaks stock out on Friday nights, system increases buffer

---

## 3. JSON Schema - Daily Inventory Record

### Document Structure

```typescript
interface DailyInventoryRecord {
  id: string;                    // "inv-2025-10-25-prop001"
  propertyId: string;            // "prop001"
  date: string;                  // "2025-10-25"

  // Morning counts
  morningCounts: ItemCount[];

  // Daily consumption (calculated or logged)
  consumption: ConsumptionRecord[];

  // Reorder recommendations
  reorderRecommendations: ReorderItem[];

  // Expiration warnings
  expirationWarnings: ExpirationWarning[];

  // System metrics
  metrics: InventoryMetrics;
  summary: DailySummary;
}

interface ItemCount {
  itemId: string;                // "ITEM-MILK-001"
  itemName: string;              // "Whole Milk (1 gallon)"
  category: 'food' | 'beverage' | 'linen' | 'toiletry' | 'cleaning' | 'other';
  currentQuantity: number;       // 5 gallons
  unit: string;                  // "gallon", "lb", "unit", "case"
  value: number;                 // $3.50/gallon
  totalValue: number;            // $17.50 (5 × $3.50)
  location: string;              // "Walk-in Cooler A"
  expirationDate?: string;       // "2025-10-30" (optional)
  lastCountDate: string;         // "2025-10-25"
}

interface ConsumptionRecord {
  itemId: string;                // "ITEM-MILK-001"
  itemName: string;
  quantityUsed: number;          // 18 gallons
  date: string;                  // "2025-10-25"
  usageSource: 'kitchen' | 'housekeeping' | 'front_desk' | 'other';
  notes?: string;                // "High usage due to Sunday brunch"
}

interface ReorderItem {
  itemId: string;                // "ITEM-MILK-001"
  itemName: string;              // "Whole Milk (1 gallon)"
  currentQuantity: number;       // 5 gallons
  parLevel: number;              // 30 gallons (avg daily × lead time + safety)
  reorderPoint: number;          // 12 gallons (trigger point)
  recommendedOrderQty: number;   // 25 gallons (to reach par level)
  urgency: 'critical' | 'high' | 'medium' | 'low';
  reason: string;                // "Below reorder point (5 < 12)"
  supplier: string;              // "Sysco"
  estimatedCost: number;         // $87.50 (25 × $3.50)
  leadTimeDays: number;          // 3 days
  expectedDelivery: string;      // "2025-10-28"
}

interface ExpirationWarning {
  itemId: string;                // "ITEM-YOGURT-001"
  itemName: string;              // "Greek Yogurt (6 oz)"
  quantity: number;              // 12 units
  expirationDate: string;        // "2025-10-27"
  daysUntilExpiration: number;   // 2 days
  estimatedDailyUsage: number;   // 4 units/day
  canConsumeBeforeExpiry: boolean; // false (12 units / 4 per day = 3 days > 2 days)
  recommendedAction: string;     // "Use in breakfast buffet or donate by Oct 26"
  potentialWaste: number;        // $18.00 (value if wasted)
}

interface InventoryMetrics {
  totalValue: number;            // $15,450 (total inventory value)

  turnover: {
    dailyConsumptionValue: number; // $850/day
    inventoryTurnoverDays: number; // 18.2 days ($15,450 / $850)
    targetTurnoverDays: number;    // 14 days (industry standard)
    status: 'optimal' | 'high' | 'low'; // "high" (carrying too much)
  };

  waste: {
    itemsExpiringSoon: number;     // 3 items (< 3 days)
    potentialWasteValue: number;   // $45 (if not used)
    actualWaste: number;           // $0 (nothing expired yet)
    wasteReductionVsBaseline: number; // 78% (vs manual tracking)
  };

  stockouts: {
    itemsAtReorderPoint: number;   // 5 items
    itemsBelowReorderPoint: number; // 2 items (critical)
    potentialStockouts: string[];  // ["Milk", "Tomatoes"]
  };

  abcAnalysis: {
    aItems: number;  // 15 items (70% of value, track daily)
    bItems: number;  // 50 items (20% of value, track every 2-3 days)
    cItems: number;  // 135 items (10% of value, track weekly)
  };
}

interface DailySummary {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor'; // "good"
  criticalReorders: number;      // 2 (need immediate attention)
  expirationRisk: number;        // 3 items
  estimatedWasteSavings: number; // $640/month (vs baseline)
  recommendations: string[];     // ["Order milk today (3-day lead time)", "Use yogurt before expiry"]
}
```

### Sample Daily Record

```json
{
  "id": "inv-2025-10-25-prop001",
  "propertyId": "prop001",
  "date": "2025-10-25",

  "morningCounts": [
    {
      "itemId": "ITEM-MILK-001",
      "itemName": "Whole Milk (1 gallon)",
      "category": "beverage",
      "currentQuantity": 5,
      "unit": "gallon",
      "value": 3.50,
      "totalValue": 17.50,
      "location": "Walk-in Cooler A",
      "expirationDate": "2025-10-30",
      "lastCountDate": "2025-10-25"
    }
  ],

  "consumption": [
    {
      "itemId": "ITEM-MILK-001",
      "itemName": "Whole Milk (1 gallon)",
      "quantityUsed": 18,
      "date": "2025-10-24",
      "usageSource": "kitchen",
      "notes": "High usage due to Sunday brunch"
    }
  ],

  "reorderRecommendations": [
    {
      "itemId": "ITEM-MILK-001",
      "itemName": "Whole Milk (1 gallon)",
      "currentQuantity": 5,
      "parLevel": 30,
      "reorderPoint": 12,
      "recommendedOrderQty": 25,
      "urgency": "high",
      "reason": "Below reorder point (5 < 12)",
      "supplier": "Sysco",
      "estimatedCost": 87.50,
      "leadTimeDays": 3,
      "expectedDelivery": "2025-10-28"
    }
  ],

  "expirationWarnings": [
    {
      "itemId": "ITEM-YOGURT-001",
      "itemName": "Greek Yogurt (6 oz)",
      "quantity": 12,
      "expirationDate": "2025-10-27",
      "daysUntilExpiration": 2,
      "estimatedDailyUsage": 4,
      "canConsumeBeforeExpiry": false,
      "recommendedAction": "Use in breakfast buffet or donate by Oct 26",
      "potentialWaste": 18.00
    }
  ],

  "metrics": {
    "totalValue": 15450,
    "turnover": {
      "dailyConsumptionValue": 850,
      "inventoryTurnoverDays": 18.2,
      "targetTurnoverDays": 14,
      "status": "high"
    },
    "waste": {
      "itemsExpiringSoon": 3,
      "potentialWasteValue": 45,
      "actualWaste": 0,
      "wasteReductionVsBaseline": 78
    },
    "stockouts": {
      "itemsAtReorderPoint": 5,
      "itemsBelowReorderPoint": 2,
      "potentialStockouts": ["Milk", "Tomatoes"]
    },
    "abcAnalysis": {
      "aItems": 15,
      "bItems": 50,
      "cItems": 135
    }
  },

  "summary": {
    "overallHealth": "good",
    "criticalReorders": 2,
    "expirationRisk": 3,
    "estimatedWasteSavings": 640,
    "recommendations": [
      "Order milk today (3-day lead time)",
      "Use yogurt before expiry"
    ]
  }
}
```

---

## 4. PostgreSQL Schema

### Table: `inventory_records`

```sql
CREATE TABLE inventory_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  date DATE NOT NULL,

  -- Morning counts (JSONB array)
  morning_counts JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Consumption records (JSONB array)
  consumption JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Reorder recommendations (JSONB array)
  reorder_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Expiration warnings (JSONB array)
  expiration_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metrics (JSONB)
  metrics JSONB,

  -- Summary (JSONB)
  summary JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(property_id, date)
);

-- Indexes for performance
CREATE INDEX idx_inventory_records_property_date ON inventory_records(property_id, date DESC);
CREATE INDEX idx_inventory_morning_counts ON inventory_records USING GIN(morning_counts);
CREATE INDEX idx_inventory_consumption ON inventory_records USING GIN(consumption);
CREATE INDEX idx_inventory_reorders ON inventory_records USING GIN(reorder_recommendations);
CREATE INDEX idx_inventory_expirations ON inventory_records USING GIN(expiration_warnings);
```

### Table: `inventory_items` (Master Catalog)

```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),

  -- Item Info
  item_id VARCHAR(50) NOT NULL,         -- "ITEM-MILK-001"
  item_name VARCHAR(200) NOT NULL,      -- "Whole Milk (1 gallon)"
  category VARCHAR(50) NOT NULL,        -- "food", "beverage", etc.
  unit VARCHAR(20) NOT NULL,            -- "gallon", "lb", "unit"

  -- Pricing
  cost_per_unit DECIMAL(10, 2) NOT NULL, -- $3.50
  supplier VARCHAR(200),                 -- "Sysco"
  supplier_sku VARCHAR(100),             -- Supplier's item code

  -- Par Levels (auto-calculated)
  par_level DECIMAL(10, 2),              -- 30 gallons
  reorder_point DECIMAL(10, 2),          -- 12 gallons
  avg_daily_consumption DECIMAL(10, 2),  -- 6 gallons/day (EMA)
  lead_time_days INT DEFAULT 3,          -- 3 days

  -- ABC Classification
  abc_category CHAR(1) DEFAULT 'C',      -- 'A', 'B', or 'C'
  annual_consumption_value DECIMAL(10, 2), -- $7,665 (365 days × 6 gal × $3.50)

  -- Storage
  storage_location VARCHAR(100),         -- "Walk-in Cooler A"
  shelf_life_days INT,                   -- 14 days (for perishables)

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(property_id, item_id)
);

-- Indexes
CREATE INDEX idx_inventory_items_property ON inventory_items(property_id);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_abc ON inventory_items(abc_category);
```

---

## 5. Daily Workflow

### Morning (8:00 AM) - Quick Counts

**Staff count high-priority items** (5-10 minutes):
```typescript
// Mobile app interface
interface QuickCountForm {
  itemName: string;         // "Whole Milk (1 gallon)"
  currentQuantity: number;  // Tap +/- buttons or type number
  location: string;         // Auto-filled from master catalog
  expirationDate?: Date;    // Optional for perishables
}

// Example: Staff opens "Quick Count" screen
// Sees list of A-items (high value, count daily):
[
  { name: "Whole Milk", current: 5, location: "Cooler A" },
  { name: "NY Strip Steak", current: 12, location: "Freezer B" },
  { name: "Salmon Fillet", current: 8, location: "Cooler A" },
  ...
]

// Staff taps each item, adjusts count, submits
// Total time: 5-10 minutes (vs 30+ minutes with clipboard)
```

### Algorithm - Par Level Calculation

**Exponential Moving Average (EMA)** for consumption forecasting:
```typescript
function calculateParLevels(
  item: InventoryItem,
  consumptionHistory: ConsumptionRecord[]
): ParLevelResult {
  // 1. Calculate average daily consumption (EMA)
  const alpha = 0.3; // Smoothing factor (30% weight to recent data)
  let avgDailyConsumption = item.avgDailyConsumption || 0;

  for (const record of consumptionHistory.slice(-30)) { // Last 30 days
    avgDailyConsumption = alpha * record.quantityUsed + (1 - alpha) * avgDailyConsumption;
  }

  // 2. Calculate standard deviation (for safety stock)
  const consumptionValues = consumptionHistory.slice(-30).map(r => r.quantityUsed);
  const stdDev = calculateStdDev(consumptionValues);

  // 3. Determine safety stock (1.65 × stdDev = 95% service level)
  const safetyStock = 1.65 * stdDev;

  // 4. Calculate reorder point
  // Formula: (avg_daily_consumption × lead_time) + safety_stock
  const reorderPoint = (avgDailyConsumption * item.leadTimeDays) + safetyStock;

  // 5. Calculate par level (max inventory to carry)
  // Formula: reorder_point + avg_daily_consumption × review_period
  const reviewPeriod = 7; // Weekly review for most items
  const parLevel = reorderPoint + (avgDailyConsumption * reviewPeriod);

  return {
    avgDailyConsumption,
    safetyStock,
    reorderPoint,
    parLevel,
    confidence: calculateConfidence(consumptionHistory),
  };
}

function calculateStdDev(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}
```

### Reorder Recommendations

**Daily generation** (evening or on-demand):
```typescript
function generateReorderRecommendations(
  items: InventoryItem[],
  currentCounts: ItemCount[]
): ReorderItem[] {
  const recommendations: ReorderItem[] = [];

  for (const item of items) {
    const currentCount = currentCounts.find(c => c.itemId === item.id);
    if (!currentCount) continue;

    const currentQty = currentCount.currentQuantity;

    // Check if below reorder point
    if (currentQty <= item.reorderPoint) {
      const recommendedOrderQty = Math.ceil(item.parLevel - currentQty);

      // Determine urgency
      let urgency: 'critical' | 'high' | 'medium' | 'low';
      const daysOfSupply = currentQty / item.avgDailyConsumption;

      if (daysOfSupply < 1) urgency = 'critical';
      else if (daysOfSupply < item.leadTimeDays) urgency = 'high';
      else if (daysOfSupply < item.leadTimeDays * 1.5) urgency = 'medium';
      else urgency = 'low';

      recommendations.push({
        itemId: item.id,
        itemName: item.itemName,
        currentQuantity: currentQty,
        parLevel: item.parLevel,
        reorderPoint: item.reorderPoint,
        recommendedOrderQty,
        urgency,
        reason: `Below reorder point (${currentQty} < ${item.reorderPoint})`,
        supplier: item.supplier,
        estimatedCost: recommendedOrderQty * item.costPerUnit,
        leadTimeDays: item.leadTimeDays,
        expectedDelivery: addDays(new Date(), item.leadTimeDays).toISOString().split('T')[0],
      });
    }
  }

  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}
```

### Expiration Monitoring

**FIFO enforcement** with expiration warnings:
```typescript
function generateExpirationWarnings(
  items: InventoryItem[],
  currentCounts: ItemCount[]
): ExpirationWarning[] {
  const warnings: ExpirationWarning[] = [];
  const today = new Date();

  for (const count of currentCounts) {
    if (!count.expirationDate) continue; // Skip non-perishables

    const expirationDate = new Date(count.expirationDate);
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Warn if expiring within 3 days
    if (daysUntilExpiration <= 3 && daysUntilExpiration >= 0) {
      const item = items.find(i => i.id === count.itemId);
      if (!item) continue;

      const estimatedDailyUsage = item.avgDailyConsumption;
      const canConsumeBeforeExpiry = count.currentQuantity <= (estimatedDailyUsage * daysUntilExpiration);

      warnings.push({
        itemId: count.itemId,
        itemName: count.itemName,
        quantity: count.currentQuantity,
        expirationDate: count.expirationDate,
        daysUntilExpiration,
        estimatedDailyUsage,
        canConsumeBeforeExpiry,
        recommendedAction: canConsumeBeforeExpiry
          ? `Will be used before expiry (${count.currentQuantity} units / ${estimatedDailyUsage.toFixed(1)} per day)`
          : `Prioritize usage or donate by ${addDays(expirationDate, -1).toLocaleDateString()}`,
        potentialWaste: canConsumeBeforeExpiry ? 0 : count.currentQuantity * item.costPerUnit,
      });
    }
  }

  return warnings;
}
```

### ABC Analysis

**Classify items by annual consumption value** (80/20 rule):
```typescript
function performABCAnalysis(items: InventoryItem[]): void {
  // 1. Calculate annual consumption value for each item
  const itemsWithValue = items.map(item => ({
    ...item,
    annualValue: item.avgDailyConsumption * 365 * item.costPerUnit,
  }));

  // 2. Sort by annual value (descending)
  itemsWithValue.sort((a, b) => b.annualValue - a.annualValue);

  // 3. Calculate cumulative percentage
  const totalValue = itemsWithValue.reduce((sum, item) => sum + item.annualValue, 0);
  let cumulativeValue = 0;

  // 4. Classify items
  for (const item of itemsWithValue) {
    cumulativeValue += item.annualValue;
    const cumulativePercent = (cumulativeValue / totalValue) * 100;

    if (cumulativePercent <= 70) {
      item.abcCategory = 'A'; // Top 70% of value (track daily)
    } else if (cumulativePercent <= 90) {
      item.abcCategory = 'B'; // Next 20% of value (track every 2-3 days)
    } else {
      item.abcCategory = 'C'; // Bottom 10% of value (track weekly)
    }

    // Update database
    updateItem(item);
  }
}

// Example results:
// A-items (15 items): Steaks, seafood, wine, cheese - 70% of annual value
// B-items (50 items): Chicken, vegetables, dairy - 20% of annual value
// C-items (135 items): Spices, condiments, paper goods - 10% of annual value
```

---

## 6. ROI Calculations

### Monthly Savings Breakdown

**Waste Reduction**: $640/month
- Before: $800/month in expired/spoiled inventory (25% over-ordering)
- After: $160/month waste (reduced to 5% through expiration tracking)
- Savings: $640/month (80% reduction)

**Stockout Prevention**: $150/month
- Before: 4 emergency orders/month × $50/order = $200 (rush fees + premium pricing)
- After: 1 emergency order/month × $50 = $50
- Savings: $150/month

**Labor Savings**: $102/month
- Before: 3 hours/week on manual counts and calculations = 12 hrs/month × $17/hr = $204
- After: 30 min/week on mobile quick counts = 2 hrs/month × $17/hr = $34
- Savings: $170/month (but conservative attribution: $102/month to this system)

**Carrying Cost Reduction**: Not counted (requires capital analysis)
- Optimal inventory turnover: 14 days (industry standard)
- Current turnover: 18 days (carrying $15,450 for 4 extra days)
- Potential savings: ~$50/month in reduced capital tied up

**Total Savings**: $892/month ($10,704/year)

**System Cost**: $0/month (zero API fees)
- Uses exponential moving average (EMA) - simple statistics
- No ML inference costs
- Storage: PostgreSQL (already in use)

---

## 7. Three Views (UI Design)

### Staff View (Mobile-Friendly)

**What They See**:
```
📱 Quick Count - October 25, 2025

TODAY'S ITEMS TO COUNT (A-items - 15 items)

🥛 Whole Milk (1 gallon)
   Location: Cooler A
   Current: [5] ← Tap to edit
   Expiry: Oct 30 (5 days)
   [Submit Count]

🥩 NY Strip Steak (12 oz)
   Location: Freezer B
   Current: [12] ← Tap to edit
   [Submit Count]

🐟 Salmon Fillet (8 oz)
   Location: Cooler A
   Current: [8] ← Tap to edit
   Expiry: Oct 27 (2 days) ⚠️
   [Submit Count]

...

✅ 12/15 counted today
⏱️ Time saved: 25 minutes vs clipboard

---

REORDER ALERTS (2 critical)

🚨 CRITICAL - Whole Milk
   Current: 5 gal | Need: 25 gal
   Order by: TODAY (3-day lead time)
   Supplier: Sysco
   Cost: $87.50
   [Create Order] [Snooze]

⚠️ HIGH - Tomatoes (Roma)
   Current: 8 lbs | Need: 20 lbs
   Order by: Tomorrow
   [Create Order]

---

EXPIRATION WARNINGS (3 items)

⏰ Greek Yogurt (6 oz) - 2 days
   Qty: 12 units | Usage: 4/day
   ⚠️ Won't use all before expiry
   Action: Use in buffet or donate
   Waste risk: $18

✓ Salmon Fillet - 2 days
   Qty: 8 units | Usage: 5/day
   ✓ Will use before expiry
```

### Manager View (Desktop Dashboard)

**What They See**:
```
📊 Inventory Performance - Last 30 Days

ROI Summary:
┌─────────────────────────────────────────────────────┐
│ Monthly Savings:        $892                        │
│ Waste Reduction:        $640 (80% fewer expirations)│
│ Stockout Prevention:    $150 (75% fewer emergencies)│
│ Labor Savings:          $102 (3 hrs/week → 30 min)  │
│ System Cost:            $0 (zero API fees)          │
└─────────────────────────────────────────────────────┘

Inventory Health:
Total Value: $15,450
Turnover: 18.2 days (target: 14 days) - slightly high

Waste Metrics:
Before: $800/month (25% over-ordering)
After:  $160/month (5% waste rate)
Reduction: 80% ✅

ABC Analysis:
A-items (15): $10,815 annual value (70%) - count daily
B-items (50): $3,090 annual value (20%) - count every 2-3 days
C-items (135): $1,545 annual value (10%) - count weekly

Critical Actions:
• 2 items need immediate reorder (milk, tomatoes)
• 3 items expiring in 2 days (yogurt, salmon, chicken)
```

### Historical View (Trends & Insights)

**What They See**:
```
📈 Last 30 Days Performance

Date       | Inventory Value | Waste | Stockouts | Turnover Days
-----------|----------------|-------|-----------|---------------
Oct 24     | $15,450        | $12   | 0         | 18.2
Oct 23     | $15,200        | $0    | 0         | 17.9
Oct 22     | $15,800        | $45   | 1 (milk)  | 18.6
...

System Insights:
✅ Waste reduced by 78% vs baseline ($800 → $160/month)
✅ Stockouts down 75% (4 → 1 per month)
✅ Labor time reduced 83% (3 hrs/week → 30 min/week)
💡 Milk consumption spikes on weekends (+40%) - adjust par levels
⚠️ Salmon waste increased in Oct - reduce order quantity from 12 to 8
📊 Inventory turnover improving: 18.2 days (vs 21 days baseline)
```

---

## 8. API Endpoints

### POST `/api/inventory/quick-count`

Submit morning quick count for an item.

**Request**:
```json
{
  "propertyId": "prop001",
  "date": "2025-10-25",
  "itemId": "ITEM-MILK-001",
  "currentQuantity": 5,
  "expirationDate": "2025-10-30"
}
```

**Response**:
```json
{
  "success": true,
  "itemName": "Whole Milk (1 gallon)",
  "updated": true,
  "alerts": [
    {
      "type": "reorder",
      "urgency": "high",
      "message": "Below reorder point (5 < 12). Order 25 gallons."
    }
  ]
}
```

### GET `/api/inventory/reorder-recommendations`

Get current reorder recommendations.

**Response**:
```json
{
  "recommendations": [
    {
      "itemName": "Whole Milk",
      "currentQuantity": 5,
      "recommendedOrderQty": 25,
      "urgency": "high",
      "estimatedCost": 87.50,
      "expectedDelivery": "2025-10-28"
    }
  ],
  "totalCost": 245.50
}
```

### GET `/api/inventory/expiration-warnings`

Get items expiring soon.

**Response**:
```json
{
  "warnings": [
    {
      "itemName": "Greek Yogurt (6 oz)",
      "quantity": 12,
      "daysUntilExpiration": 2,
      "canConsumeBeforeExpiry": false,
      "potentialWaste": 18.00
    }
  ],
  "totalPotentialWaste": 63.00
}
```

---

## 9. Implementation Notes

### Technology Stack
- **Frontend**: Next.js (mobile-responsive for staff)
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with JSONB for flexibility
- **Algorithms**:
  - Exponential moving average (EMA) for consumption forecasting
  - Standard deviation for safety stock calculation
  - ABC analysis (Pareto principle)
- **Cost**: $0/month (zero API fees, simple statistics)

### Data Collection (Practical)

**Start Simple**:
1. **Week 1**: Import master item catalog (200-500 items, takes 2-3 hours)
2. **Week 2**: ABC analysis to identify high-value items (A-items: count daily)
3. **Week 3**: Staff do mobile quick counts (5-10 min/day vs 30 min/day clipboard)
4. **Week 4**: System starts generating reorder recommendations

**Progressive Enhancement**:
- **Month 1-3**: Manual counting (staff tap counts into mobile app)
- **Month 4+**: Optional barcode scanning integration

### Constraints (Realistic Limitations)

**This system CANNOT**:
- Automatically track consumption in real-time (requires POS/kitchen integration)
- Order from suppliers automatically (requires EDI integration)
- Handle complex recipes with Bill of Materials (requires recipe management system)

**This system CAN**:
- Reduce waste by 80% through expiration monitoring
- Prevent stockouts through consumption-based par levels
- Save 3 hours/week on manual inventory management
- Learn and improve par levels over time (EMA)
- Provide mobile-friendly quick counting interface

---

## 10. Success Metrics

### Immediate (Week 1)
- ✅ Master item catalog imported (200-500 items)
- ✅ ABC analysis completed (A/B/C classification)
- ✅ Staff using mobile quick count interface

### Short-term (Month 1)
- ✅ 50% reduction in waste (vs baseline)
- ✅ 50% reduction in stockouts
- ✅ Labor time reduced from 3 hrs/week to 1 hr/week

### Long-term (Month 6)
- ✅ 80% reduction in waste ($800 → $160/month)
- ✅ 75% reduction in emergency orders (4 → 1/month)
- ✅ Inventory turnover improved (21 → 14 days)
- ✅ System accuracy: 90%+ par level predictions

---

## 11. Comparison - NOT Machine Learning!

| Approach                  | Inventory Management (Correct) | ML-Based Forecasting (Overkill) |
|---------------------------|---------------------------------|---------------------------------|
| **Method**                | Exponential moving average (EMA) | Neural network forecasting |
| **Accuracy**              | 90%+ for stable items           | 92-95% (marginal improvement) |
| **Setup Time**            | 1 week                          | 3-6 months (training data) |
| **Explainability**        | Transparent (EMA formula)       | Black box |
| **Cost**                  | $0/month                        | $200-$400/month |
| **Maintenance**           | Zero (self-adjusting)           | Ongoing retraining |
| **Real-time**             | <10ms                           | 100-300ms |
| **Why Use This**          | Simple, effective, cheap        | Only for complex demand patterns |

**Key Insight**: Inventory management is a **statistical forecasting problem**, not a deep learning problem. Use exponential smoothing, not neural networks!

---

## 12. Future Enhancements

### Phase 1 (Month 1-3) - Core System
- ✅ Mobile quick count interface
- ✅ Reorder recommendations (consumption-based)
- ✅ Expiration monitoring (FIFO enforcement)
- ✅ ABC analysis (Pareto classification)
- ✅ Basic ROI tracking

### Phase 2 (Month 4-6) - Automation
- 🔧 Barcode scanning for faster counts
- 🔧 POS integration for automatic consumption tracking
- 🔧 Supplier EDI integration for one-click ordering

### Phase 3 (Month 7-12) - Advanced Analytics
- 📊 Seasonal demand forecasting (ML for complex patterns)
- 📊 Recipe costing with Bill of Materials
- 📊 Multi-property inventory sharing

---

**End of Specification**

This document serves as the complete reference for implementing inventory management trend tracking in the Hospitality AI SDK.
