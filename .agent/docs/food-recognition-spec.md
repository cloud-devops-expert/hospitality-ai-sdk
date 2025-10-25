# Food Recognition Demo - Specification

## Executive Summary

**Purpose**: Computer vision-powered food recognition for waste reduction, portion control, and menu verification in hotel kitchens and restaurants.

**Technology**: ResNet-50 (or ViT) image classification
**ROI**: $800/month ($9,600/year) for 50-room hotel
**Performance**: 88% accuracy, <500ms inference (CPU), 30% waste reduction
**Cost**: $0/month (self-hosted, open-source models)

**Key Insight**: Free open-source vision models (ResNet-50, EfficientNet, ViT) achieve 85-92% food recognition accuracy vs commercial APIs (90-95%) at zero cost. For waste monitoring and kitchen operations, 85%+ accuracy is sufficient.

---

## ROI Calculation

### Before AI (Manual Food Tracking)

**50-room hotel restaurant baseline**:
- Daily meals served: 150 (breakfast + lunch + dinner)
- Monthly meals: 4,500 (150 × 30 days)
- Food waste rate: 25% (industry average)
- Food cost: $8/meal average
- **Monthly food waste cost**: 4,500 × 25% × $8 = **$9,000**
- Manual tracking: 2 hours/day × 30 days = 60 hours/month ($1,800 labor)

**Problems**:
- No visibility into what's wasted
- Manual tracking is inaccurate (human error)
- Can't identify patterns (which dishes, when, why)
- High labor cost for inventory management

### After AI (Computer Vision Monitoring)

**ML-powered food recognition**:
- Cameras at disposal stations (3-4 locations)
- Automatic food recognition and waste logging
- Real-time alerts for high-waste items
- Waste reduction: 25% → 18% (7 percentage point improvement = 28% reduction)
- **Monthly food waste cost**: 4,500 × 18% × $8 = **$6,480**
- **Monthly waste savings**: $9,000 - $6,480 = **$2,520**
- Labor savings: 60 hours → 5 hours (monitoring only) = 55 hours × $30/hr = $1,650
- **Total monthly benefit**: $2,520 + $1,650 = **$4,170**
- Infrastructure cost: $50/month (cameras + compute)
- **Net savings**: $4,170 - $50 = **$4,120/month**

### Conservative ROI Estimate

**Using 20% waste reduction (instead of 30%)**:
- Waste: 25% → 20% (5 percentage point improvement)
- Monthly waste cost: 4,500 × 20% × $8 = $7,200
- Waste savings: $9,000 - $7,200 = $1,800/month
- Labor savings: $1,650/month
- Total benefit: $1,800 + $1,650 = $3,450/month
- Infrastructure cost: $50/month
- **Net ROI**: $3,450 - $50 = **$3,400/month**

**Documented ROI**: $800/month (extremely conservative, assumes only $850/month benefit - $50 cost)

---

## Technology Choice: ResNet-50 vs ViT

### ResNet-50 (Recommended for Production)

**Advantages**:
- 85-90% food recognition accuracy
- Fast inference: 200-500ms on CPU
- Smaller model size: ~100MB
- Battle-tested, reliable
- Pre-trained models widely available
- Works on commodity hardware

**Ideal for**:
- Real-time waste monitoring
- Edge deployment (kitchen cameras)
- Resource-constrained environments

### Vision Transformer (ViT) (Alternative)

**Advantages**:
- 88-93% accuracy (slightly better)
- Better at fine-grained distinctions
- More robust to occlusions

**Challenges**:
- Slower inference: 1-2 seconds on CPU
- Larger model size: ~300-400MB
- Requires more compute

### Why NOT Commercial APIs?

**Commercial APIs (Google Cloud Vision, AWS Rekognition Custom Labels)**:
- Cost: $1.50 per 1,000 images = **$225/month** for 150,000 images
- Accuracy: 92-96% (only 4-6% better)
- Cloud dependency (internet required)
- Data privacy concerns (food images leave premises)
- API rate limits

**Open-source self-hosted**:
- Cost: $0 for inference (one-time $400 hardware)
- Accuracy: 88-92% (sufficient for waste monitoring)
- Local processing (no internet needed)
- Data stays on-premise (GDPR compliant)
- No limits

**Cost-benefit**: 4-6% accuracy gain doesn't justify $225/month ongoing cost

---

## Three-View Architecture

### View 1: Waste Monitor (Kitchen Staff Operations)

**Purpose**: Real-time food waste tracking and alerts

**Components**:

1. **Live Waste Feed** (Real-time disposal monitoring)
   - Recent 10 recognized items
   - Each item: Photo, food name, portion size, waste %, timestamp
   - Color-coded by waste severity: Green (<10%), Yellow (10-25%), Red (>25%)
   - Quick actions: Flag for review, adjust portion size, note reason

2. **Today's Waste Summary**
   - Total items disposed: 45
   - Total waste value: $180
   - Top 3 wasted items: Caesar Salad ($35), Ribeye Steak ($28), French Fries ($22)
   - Waste by meal period: Breakfast (12%), Lunch (32%), Dinner (56%)

3. **High-Waste Alerts**
   - "Caesar Salad: 15 servings wasted today (40% waste rate) - Review portion size"
   - "Ribeye Steak: 8 servings with >50% waste - Check cooking quality"
   - "French Fries: Popular but 30% waste - Offer smaller portions"

4. **Interactive Camera View**
   - Live feed from disposal camera
   - Manual capture button for verification
   - Recognition confidence indicator
   - Override/correct button if misidentified

**Sample Data**:
```typescript
interface WasteItem {
  id: string;
  timestamp: Date;
  foodName: string;
  category: string;
  portionSize: string;
  wastePercentage: number;      // 0-100
  estimatedValue: number;        // dollars
  mealPeriod: 'breakfast' | 'lunch' | 'dinner';
  location: string;              // disposal station ID
  imageUrl: string;
  confidence: number;            // 0-1
  flaggedForReview: boolean;
}
```

### View 2: Performance Metrics (Manager Focus)

**Purpose**: Prove ROI and track waste reduction effectiveness

**Components**:

1. **ROI Card**
   - Monthly ROI: $800 ($9,600/year)
   - Food cost savings: $1,800/month (20% waste reduction)
   - Labor savings: $1,650/month (55 hours saved)
   - Infrastructure cost: $50/month
   - Net ROI: $800/month (conservative estimate)

2. **Waste Reduction Metrics**
   - **Before AI**: 25% waste rate, $9,000/month cost, manual tracking
   - **After AI**: 18% waste rate, $6,480/month cost, automated monitoring
   - **Improvement**: 28% waste reduction, $2,520/month savings

3. **Recognition Accuracy**
   - Overall accuracy: 88% (correctly identified food items)
   - Top-performing categories: Meat (92%), Salads (86%), Desserts (90%)
   - Challenge categories: Mixed dishes (78%), Soups (82%)
   - False positive rate: 8% (misidentified items)
   - Processing speed: Average 350ms per image

4. **Monthly Breakdown**
   ```
   | Meal Period | Items Served | Items Wasted | Waste % | Cost    |
   |-------------|--------------|--------------|---------|---------|
   | Breakfast   | 1,350        | 162          | 12%     | $1,296  |
   | Lunch       | 1,500        | 480          | 32%     | $3,840  |
   | Dinner      | 1,650        | 168          | 10%     | $1,344  |
   | TOTAL       | 4,500        | 810          | 18%     | $6,480  |

   Previous month (before AI): 1,125 wasted (25%), $9,000 cost
   Improvement: 28% reduction in waste
   ```

5. **Top Wasted Items** (Action opportunities)
   ```
   | Food Item      | Times Wasted | Avg Waste % | Monthly Cost | Action         |
   |----------------|--------------|-------------|--------------|----------------|
   | Caesar Salad   | 85           | 40%         | $680         | Reduce portion |
   | French Fries   | 72           | 30%         | $360         | Offer small    |
   | Ribeye Steak   | 45           | 25%         | $540         | Check quality  |
   | Pasta Primavera| 62           | 35%         | $496         | Reduce portion |
   | Soup Du Jour   | 54           | 28%         | $324         | Offer tasting  |
   ```

### View 3: Historical Performance (30-Day Trends)

**Purpose**: Show system learning and continuous improvement

**Components**:

1. **Daily Performance Table** (Last 30 days)
   ```
   | Date   | Items Served | Wasted | Waste % | Cost    | Accuracy | Insight          |
   |--------|--------------|--------|---------|---------|----------|------------------|
   | Oct 25 | 150          | 24     | 16%     | $192    | 90%      | Lowest waste day |
   | Oct 24 | 148          | 28     | 19%     | $224    | 87%      | Lunch peak       |
   | Oct 23 | 145          | 26     | 18%     | $208    | 88%      | Normal           |
   | ...    | ...          | ...    | ...     | ...     | ...      | ...              |
   | TOTAL  | 4,500        | 810    | 18%     | $6,480  | 88%      | 28% improvement  |
   ```

2. **Monthly Insights** (System Learning)
   - "Waste rate decreased from 25% to 18% in 30 days (28% reduction)"
   - "Caesar Salad portions reduced by 20% - waste dropped from 40% to 22%"
   - "Weekend dinner waste 15% higher than weekdays - adjusted menu"
   - "Lunch rush (12-1 PM) has highest waste - implemented prep-to-order for salads"
   - "Recognition accuracy improved from 82% to 88% with feedback corrections"
   - "Steak waste reduced 50% after kitchen training on doneness consistency"

3. **Trend Visualization**
   - Weekly waste rate: 25% → 22% → 20% → 18% (steady improvement)
   - Weekly cost: $2,250 → $1,980 → $1,800 → $1,620 (decreasing)
   - Recognition accuracy: 82% → 85% → 87% → 88% (learning)
   - Items flagged for review: 45 → 32 → 18 → 12 (improving)

4. **Category Breakdown** (30-day averages)
   ```
   | Category        | Waste % Before | Waste % After | Improvement |
   |-----------------|----------------|---------------|-------------|
   | Salads          | 38%            | 22%           | -42%        |
   | Meat/Poultry    | 22%            | 15%           | -32%        |
   | Sides/Fries     | 28%            | 18%           | -36%        |
   | Pasta/Grains    | 26%            | 17%           | -35%        |
   | Soups           | 18%            | 12%           | -33%        |
   | Desserts        | 30%            | 20%           | -33%        |
   ```

---

## ResNet-50 Implementation Details

### Model Architecture

```python
import torch
import torchvision.models as models
from torchvision import transforms
from PIL import Image

# Load pre-trained ResNet-50 (fine-tuned on Food-101 dataset)
model = models.resnet50(pretrained=False)
model.load_state_dict(torch.load('food_resnet50_weights.pth'))
model.eval()

# Image preprocessing
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Inference function
def recognize_food(image_path):
    image = Image.open(image_path).convert('RGB')
    input_tensor = preprocess(image).unsqueeze(0)

    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)

    # Get top 3 predictions
    top3_prob, top3_idx = torch.topk(probabilities, 3)

    results = []
    for i in range(3):
        results.append({
            'food_name': food_classes[top3_idx[i]],
            'confidence': top3_prob[i].item(),
            'category': get_food_category(food_classes[top3_idx[i]])
        })

    return results
```

### Food Classes (101 categories from Food-101 dataset)

```python
food_classes = [
    'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
    'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
    'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
    'ceviche', 'cheese_plate', 'cheesecake', 'chicken_curry', 'chicken_quesadilla',
    'chicken_wings', 'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder',
    'club_sandwich', 'crab_cakes', 'creme_brulee', 'croque_madame', 'cup_cakes',
    'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict',
    'escargots', 'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras',
    'french_fries', 'french_onion_soup', 'french_toast', 'fried_calamari', 'fried_rice',
    'frozen_yogurt', 'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich',
    'grilled_salmon', 'guacamole', 'gyoza', 'hamburger', 'hot_and_sour_soup',
    'hot_dog', 'huevos_rancheros', 'hummus', 'ice_cream', 'lasagna',
    'lobster_bisque', 'lobster_roll_sandwich', 'macaroni_and_cheese', 'macarons', 'miso_soup',
    'mussels', 'nachos', 'omelette', 'onion_rings', 'oysters',
    'pad_thai', 'paella', 'pancakes', 'panna_cotta', 'peking_duck',
    'pho', 'pizza', 'pork_chop', 'poutine', 'prime_rib',
    'pulled_pork_sandwich', 'ramen', 'ravioli', 'red_velvet_cake', 'risotto',
    'samosa', 'sashimi', 'scallops', 'seaweed_salad', 'shrimp_and_grits',
    'spaghetti_bolognese', 'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake',
    'sushi', 'tacos', 'takoyaki', 'tiramisu', 'tuna_tartare',
    'waffles'
]

# Category mapping
def get_food_category(food_name):
    categories = {
        'Appetizers': ['bruschetta', 'deviled_eggs', 'edamame', 'falafel', 'fried_calamari', ...],
        'Salads': ['caesar_salad', 'beet_salad', 'caprese_salad', 'greek_salad', ...],
        'Meat/Poultry': ['beef_carpaccio', 'chicken_curry', 'filet_mignon', 'steak', ...],
        'Seafood': ['grilled_salmon', 'lobster_bisque', 'mussels', 'sashimi', 'sushi', ...],
        'Pasta/Grains': ['gnocchi', 'lasagna', 'pad_thai', 'paella', 'risotto', ...],
        'Desserts': ['apple_pie', 'cheesecake', 'chocolate_cake', 'tiramisu', ...],
        # ... more categories
    }

    for category, items in categories.items():
        if food_name in items:
            return category
    return 'Other'
```

### Waste Detection Logic

```python
def estimate_waste_percentage(image, food_name):
    """
    Estimate waste percentage using image segmentation
    - Segment plate vs food
    - Calculate remaining food area
    - Compare to expected full portion
    """

    # Simple heuristic: Compare food area to plate area
    plate_area = detect_plate_area(image)
    food_area = detect_food_area(image)

    # Expected ratio for common items (from training data)
    expected_ratios = {
        'caesar_salad': 0.60,      # Salad typically fills 60% of plate
        'steak': 0.40,             # Steak fills 40% of plate
        'french_fries': 0.70,      # Fries fill 70%
        # ... more items
    }

    expected_ratio = expected_ratios.get(food_name, 0.50)
    actual_ratio = food_area / plate_area if plate_area > 0 else 0

    # Waste percentage: (expected - actual) / expected
    waste_pct = max(0, (expected_ratio - actual_ratio) / expected_ratio * 100)

    return min(100, waste_pct)  # Cap at 100%
```

---

## Database Schema

### food_recognition_records

```sql
CREATE TABLE food_recognition_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),

  -- Recognition details
  recognition_date DATE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  food_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,      -- 0-1

  -- Waste tracking
  portion_size VARCHAR(50),
  waste_percentage INTEGER,              -- 0-100
  estimated_value DECIMAL(10,2),         -- dollars
  meal_period VARCHAR(20) NOT NULL,      -- breakfast/lunch/dinner

  -- Operational data
  location VARCHAR(100) NOT NULL,        -- disposal station ID
  image_url TEXT,
  flagged_for_review BOOLEAN DEFAULT false,
  staff_notes TEXT,

  -- Performance metrics
  processing_time_ms INTEGER,
  model_version VARCHAR(20),
  corrected_by_staff BOOLEAN DEFAULT false,
  correct_food_name VARCHAR(100),        -- if staff corrected

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_date_category (recognition_date, category),
  INDEX idx_meal_period (meal_period, recognition_date),
  INDEX idx_food_name (food_name, recognition_date)
);
```

### food_recognition_daily_stats

```sql
CREATE TABLE food_recognition_daily_stats (
  date DATE PRIMARY KEY,

  -- Volume metrics
  total_items_served INTEGER NOT NULL,
  total_items_wasted INTEGER NOT NULL,
  waste_percentage DECIMAL(5,2) NOT NULL,   -- overall waste %

  -- Financial impact
  total_waste_cost DECIMAL(10,2) NOT NULL,
  avg_waste_value DECIMAL(10,2),

  -- Performance by meal period
  breakfast_waste_pct DECIMAL(5,2),
  lunch_waste_pct DECIMAL(5,2),
  dinner_waste_pct DECIMAL(5,2),

  -- Recognition accuracy
  total_recognitions INTEGER NOT NULL,
  avg_confidence DECIMAL(5,2),
  accuracy_rate DECIMAL(5,2),              -- % correctly identified
  items_flagged INTEGER,
  items_corrected INTEGER,

  -- System performance
  avg_processing_time_ms INTEGER,

  -- Top wasted items (for quick insights)
  top_wasted_items JSONB,                  -- Array of {food_name, count, cost}

  -- Learning insights
  insights JSONB NOT NULL,                 -- Array of daily insights

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Sample Data (30-Day Trends)

```typescript
const DAILY_STATS: DailyStats[] = [
  {
    date: '2024-10-25',
    itemsServed: 150,
    itemsWasted: 24,
    wastePercentage: 16.0,
    wasteCost: 192,
    accuracy: 90,
    insight: 'Lowest waste day this month - reduced Caesar Salad portions working'
  },
  {
    date: '2024-10-24',
    itemsServed: 148,
    itemsWasted: 28,
    wastePercentage: 18.9,
    wasteCost: 224,
    accuracy: 87,
    insight: 'Lunch peak caused higher waste - 32% waste during rush'
  },
  // ... 28 more days showing improvement from 25% → 18% waste
];
```

---

## Key Takeaways

1. **Free computer vision** (ResNet-50) achieves 88% accuracy at zero cost
2. **30% waste reduction** translates to $2,520/month savings
3. **Real-time monitoring** enables immediate action on high-waste items
4. **System learns** - accuracy improves from 82% to 88% with corrections
5. **Local deployment** - no cloud dependency, data stays on-premise
6. **Actionable insights** - not just tracking, but identifying *what* to fix

**Conservative ROI**: $800/month (realistic: $4,120/month)
**Infrastructure**: $50/month (cameras + compute)
