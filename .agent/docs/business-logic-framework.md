# Business Logic Framework

## Overview

This document defines the core business rules, domain logic, and operational constraints that govern the Hospitality AI SDK. These rules ensure the SDK produces accurate, industry-compliant, and operationally sound recommendations.

## Core Business Domains

### 1. Revenue Management

#### 1.1 Dynamic Pricing Rules

**Base Price Calculation**:
```typescript
base_price = (base_rate × seasonality_factor × day_of_week_factor) + room_type_premium
```

**Demand Multiplier**:
- High demand (>85% occupancy): 1.2-1.5x
- Medium demand (60-85% occupancy): 1.0-1.2x
- Low demand (<60% occupancy): 0.8-1.0x
- Critical low (<40% occupancy): 0.6-0.8x

**Constraints**:
- MIN: `base_rate × 0.6` (never drop below 60% of base)
- MAX: `base_rate × 2.5` (never exceed 250% of base)
- STEP: Price changes in $5-10 increments (avoid odd pricing)
- FLOOR: Absolute minimum rate to cover costs

**Competitor Adjustment**:
```typescript
if (our_price > avg_competitor_price × 1.15) {
  suggested_price = avg_competitor_price × 1.10
} else if (our_price < avg_competitor_price × 0.85) {
  suggested_price = avg_competitor_price × 0.90
}
```

**Event-Based Pricing**:
- Major events (conferences, festivals): +40-80%
- Minor events (local sports): +20-30%
- Holiday periods: +15-25%
- Corporate events: +10-15%

**Last-Minute Pricing**:
- T-7 days: Normal pricing
- T-3 days: -5-10% if <70% occupancy
- T-1 day: -15-20% if <60% occupancy
- Same-day: -20-30% if <50% occupancy

**Length of Stay Optimization**:
```typescript
los_discount = {
  1-2 nights: 0%,
  3-4 nights: -5%,
  5-7 nights: -10%,
  8-14 nights: -15%,
  15+ nights: -20%
}
```

#### 1.2 Yield Management

**Overbooking Formula**:
```typescript
safe_overbooking_level =
  total_rooms × (
    avg_cancellation_rate + avg_noshow_rate - buffer_factor
  )
```

**Buffer Factor by Property Type**:
- Luxury hotels: 0.02 (2% buffer, cautious)
- Business hotels: 0.01 (1% buffer)
- Budget hotels: 0.005 (0.5% buffer)
- Vacation rentals: 0 (no overbooking)

**Restrictions**:
```typescript
// Minimum stay requirements
if (high_demand_period && occupancy > 80%) {
  min_stay = 2-3 nights
}

// Closed to arrival (CTA)
if (next_day_occupancy > 95% && current_occupancy < 80%) {
  close_to_arrival = true  // Force guests to book longer stays
}

// Closed to departure (CTD)
if (previous_day_occupancy > 95% && current_occupancy < 80%) {
  close_to_departure = true  // Prevent checkout into high-demand day
}
```

### 2. Room Allocation

#### 2.1 Assignment Priority

**Priority Scoring** (0-100):
```typescript
priority_score = (
  loyalty_tier_score × 0.30 +
  booking_value_score × 0.25 +
  stay_duration_score × 0.15 +
  preference_match_score × 0.15 +
  special_occasion_score × 0.10 +
  channel_score × 0.05
)
```

**Loyalty Tiers**:
- Platinum: 100 points
- Gold: 75 points
- Silver: 50 points
- Member: 25 points
- Non-member: 0 points

**Booking Value Score**:
```typescript
booking_value_score = min(100, (total_revenue / avg_booking_revenue) × 50)
```

**Room Type Matching Rules**:
1. Never downgrade a guest (exception: with consent + compensation)
2. Upgrade based on: Loyalty > Value > Availability
3. Keep VIPs away from elevator/ice machine/laundry
4. Family preference: Adjacent or connecting rooms
5. Couples: Higher floors (better views)
6. Business travelers: Closer to elevator, quiet wing
7. Long stays: Away from high-traffic areas

#### 2.2 Operational Constraints

**Housekeeping Constraints**:
```typescript
// Room must be cleaned X hours before check-in
cleaning_buffer_hours = 2

// Max rooms per housekeeper per day
max_rooms_per_housekeeper = 14

// Stayover priority over checkouts
if (same_day_checkout && next_day_arrival) {
  clean_stayover_first = true
}
```

**Maintenance Blocks**:
```typescript
// Rooms in maintenance cannot be allocated
if (room.status === 'maintenance') {
  available = false
  estimated_completion_date = required
}

// Buffer after maintenance
post_maintenance_buffer_hours = 4  // Deep clean + QA
```

### 3. Inventory Management

#### 3.1 Room Inventory Rules

**Inventory by Channel**:
```typescript
total_inventory = physical_rooms

channel_allocation = {
  direct: floor(total_inventory × 0.20),      // 20% for direct bookings
  ota: floor(total_inventory × 0.50),         // 50% for OTAs
  wholesale: floor(total_inventory × 0.15),   // 15% for wholesalers
  corporate: floor(total_inventory × 0.10),   // 10% for corporate
  group: floor(total_inventory × 0.05),       // 5% for groups
}
```

**Sell-Through Optimization**:
```typescript
// Release allocations 48h before arrival if not sold
if (days_until_arrival <= 2 && channel_booked < channel_allocation) {
  release_to_general_inventory(channel_allocation - channel_booked)
}
```

#### 3.2 Rate Plan Rules

**Rate Plan Hierarchy**:
1. **BAR** (Best Available Rate): Public rate, fully flexible
2. **Non-Refundable**: BAR × 0.90 (10% discount)
3. **Advance Purchase**: BAR × 0.85 (15% discount, 30+ days advance)
4. **Member Rate**: BAR × 0.92 (8% discount)
5. **Corporate Rate**: Negotiated, typically BAR × 0.85-0.90
6. **Group Rate**: Negotiated, typically BAR × 0.80-0.85

**Rate Plan Availability**:
```typescript
// Non-refundable only available if >14 days until arrival
if (days_until_arrival < 14) {
  non_refundable_rate = unavailable
}

// Member rates require authentication
if (!user.authenticated || !user.is_member) {
  member_rate = unavailable
}
```

### 4. Guest Lifecycle Management

#### 4.1 Booking Window Rules

**Lead Time Segmentation**:
```typescript
booking_window = {
  same_day: 0 days,           // Emergency bookings, high cancellation risk
  short_term: 1-7 days,       // Leisure or last-minute business
  medium_term: 8-30 days,     // Standard leisure or business
  long_term: 31-90 days,      // Planners, groups, events
  far_out: 90+ days,          // Conferences, destination events
}
```

**Cancellation Policy by Window**:
```typescript
if (booking_window === 'same_day' || booking_window === 'short_term') {
  cancellation_policy = 'strict'  // 24h notice or forfeit 1 night
} else if (booking_window === 'medium_term') {
  cancellation_policy = 'moderate'  // 48h notice
} else {
  cancellation_policy = 'flexible'  // 7 days notice
}
```

#### 4.2 No-Show Prediction

**Risk Factors**:
```typescript
noshow_risk_score = (
  booking_window_risk × 0.30 +      // Same-day bookings = high risk
  payment_method_risk × 0.25 +      // Virtual card = medium risk
  channel_risk × 0.20 +             // OTA = higher risk than direct
  past_behavior_risk × 0.15 +       // History of no-shows
  rate_plan_risk × 0.10             // Opaque rates = higher risk
)
```

**Risk Thresholds**:
- High risk (>70): Require pre-payment or deposit
- Medium risk (40-70): Flag for front desk follow-up
- Low risk (<40): Standard confirmation

**No-Show Handling**:
```typescript
if (guest_no_show && room_sold_to_walkin) {
  revenue_impact = 'minimized'
  charge_original_guest = first_night_rate
} else if (guest_no_show && room_not_sold) {
  revenue_impact = 'full_loss'
  charge_original_guest = full_stay_amount  // As per policy
}
```

### 5. Operational Workflows

#### 5.1 Housekeeping Optimization

**Room Cleaning Priority**:
```typescript
priority_queue = [
  { type: 'VIP_checkout', priority: 100, sla: '2 hours' },
  { type: 'same_day_arrival', priority: 90, sla: '3 hours before check-in' },
  { type: 'early_checkin_request', priority: 80, sla: '1 hour before requested time' },
  { type: 'stayover_vip', priority: 70, sla: '4 hours' },
  { type: 'checkout_regular', priority: 60, sla: 'before 6 PM' },
  { type: 'stayover_regular', priority: 50, sla: 'by end of shift' },
]
```

**Efficiency Rules**:
```typescript
// Group rooms by floor and wing to minimize travel
assign_rooms_to_housekeeper = (rooms) => {
  return cluster_by_proximity(rooms, max_distance = 50_meters)
}

// Balance workload
if (housekeeper.assigned_rooms > avg_assigned + 2) {
  redistribute_rooms()
}
```

#### 5.2 Maintenance Scheduling

**Preventive Maintenance Calendar**:
```typescript
maintenance_schedule = {
  daily: ['HVAC filter check', 'elevator inspection'],
  weekly: ['Pool chemistry', 'Fire alarm test'],
  monthly: ['Deep carpet clean', 'Equipment servicing'],
  quarterly: ['Mattress rotation', 'Window cleaning'],
  annual: ['Fire system certification', 'Elevator certification'],
}
```

**Room Out-of-Order Priority**:
```typescript
// Critical: Safety hazards
if (issue_type === 'safety') {
  priority = 'immediate'
  max_resolution_time = 4_hours
}

// High: Revenue-impacting
else if (issue_type === 'cannot_sell') {
  priority = 'urgent'
  max_resolution_time = 24_hours
}

// Medium: Guest inconvenience
else if (issue_type === 'in_room_issue') {
  priority = 'high'
  max_resolution_time = 48_hours
}

// Low: Cosmetic
else {
  priority = 'normal'
  max_resolution_time = 7_days
}
```

### 6. Financial Rules

#### 6.1 Revenue Recognition

**Booking Lifecycle**:
```typescript
booking_stages = {
  tentative: { revenue_recognition: 0%, cancel_risk: 'high' },
  confirmed: { revenue_recognition: 0%, cancel_risk: 'medium' },
  guaranteed: { revenue_recognition: 50%, cancel_risk: 'low' },
  pre_paid: { revenue_recognition: 100%, cancel_risk: 'very_low' },
  checked_in: { revenue_recognition: 100%, cancel_risk: 'none' },
  checked_out: { revenue_recognition: 100%, cancel_risk: 'none' },
}
```

**Payment Collection Rules**:
```typescript
// When to charge
if (rate_plan === 'non_refundable') {
  charge_time = 'immediately'
} else if (days_until_arrival <= 7) {
  charge_time = '72_hours_before_arrival'
} else {
  charge_time = 'check_in'
}

// Authorization holds
if (booking_value > 500 && payment_method === 'credit_card') {
  authorization_hold = booking_value × 1.20  // 20% buffer for incidentals
}
```

#### 6.2 Cancellation & Refund Logic

**Cancellation Fees**:
```typescript
calculateCancellationFee = (booking, cancellation_time) => {
  const hours_before_arrival =
    (booking.arrival_date - cancellation_time) / (1000 * 60 * 60)

  if (booking.rate_plan === 'non_refundable') {
    return booking.total_amount  // No refund
  } else if (hours_before_arrival < 24) {
    return booking.room_rate × 1  // 1 night penalty
  } else if (hours_before_arrival < 48) {
    return booking.room_rate × 0.5  // 50% of 1 night
  } else if (hours_before_arrival < 7 * 24) {
    return booking.room_rate × 0.25  // 25% of 1 night
  } else {
    return 0  // Free cancellation
  }
}
```

**Modification Rules**:
```typescript
// Free modifications
if (modification_type === 'date_change' && hours_before_arrival > 48) {
  fee = 0
  apply_rate_difference = true
}

// Room type upgrade
else if (modification_type === 'room_upgrade') {
  fee = (new_room_rate - original_room_rate) × nights
  if (fee < 0) { fee = 0 }  // No refund for downgrade
}

// Guest name change
else if (modification_type === 'name_change') {
  fee = 0  // Usually free, check terms
}
```

### 7. Guest Experience Rules

#### 7.1 Upselling Priorities

**Upsell Timing**:
```typescript
upsell_opportunities = [
  { timing: 'booking', offers: ['room_upgrade', 'early_checkin', 'late_checkout'] },
  { timing: '48h_before_arrival', offers: ['spa_package', 'dinner_reservation'] },
  { timing: 'check_in', offers: ['room_upgrade', 'amenity_package'] },
  { timing: 'during_stay', offers: ['extended_stay', 'restaurant', 'services'] },
]
```

**Upsell Eligibility**:
```typescript
if (guest.total_spend < avg_guest_spend) {
  upsell_aggressiveness = 'high'
  upsell_discount = 15%  // Incentivize first-time upgrade
} else if (guest.loyalty_tier === 'platinum') {
  upsell_aggressiveness = 'low'  // Don't oversell VIPs
  upsell_discount = 5%  // Premium pricing
} else {
  upsell_aggressiveness = 'medium'
  upsell_discount = 10%
}
```

#### 7.2 Service Recovery

**Complaint Handling**:
```typescript
complaint_severity = {
  critical: {
    examples: ['safety', 'health', 'discrimination'],
    response_time: '<1 hour',
    escalation: 'GM immediately',
    compensation: 'full_refund + recovery_package',
  },
  high: {
    examples: ['room_not_ready', 'noise', 'cleanliness'],
    response_time: '<2 hours',
    escalation: 'Front Desk Manager',
    compensation: 'room_upgrade or 50% discount',
  },
  medium: {
    examples: ['amenity_missing', 'slow_service'],
    response_time: '<4 hours',
    escalation: 'Department head',
    compensation: 'comp_service or 25% discount',
  },
  low: {
    examples: ['preference_not_met', 'minor_inconvenience'],
    response_time: '<24 hours',
    escalation: 'Supervisor',
    compensation: 'loyalty_points or future_discount',
  },
}
```

### 8. Multi-Tenant Business Rules

#### 8.1 Tenant Isolation

**Data Segregation**:
```typescript
// Every query must include tenant context
if (!query.includes('tenant_id')) {
  throw new Error('Tenant context required')
}

// Row-Level Security enforcement
current_setting('app.current_tenant_id') must equal record.tenant_id
```

**Cross-Tenant Operations (Explicitly Allowed)**:
```typescript
// Benchmarking (anonymized)
if (operation === 'benchmark' && data_anonymized === true) {
  allow_cross_tenant_read = true
}

// System administration
if (user.role === 'system_admin') {
  allow_cross_tenant_access = true
  log_access(user, tenant, operation)  // Audit trail
}
```

#### 8.2 Fair Use & Quotas

**Usage Limits by Tier**:
```typescript
quota_limits = {
  starter: {
    properties: 1,
    api_calls_per_month: 10_000,
    ml_operations_per_month: 1_000,
    storage_gb: 1,
  },
  growth: {
    properties: 5,
    api_calls_per_month: 100_000,
    ml_operations_per_month: 10_000,
    storage_gb: 10,
  },
  pro: {
    properties: 20,
    api_calls_per_month: 1_000_000,
    ml_operations_per_month: 100_000,
    storage_gb: 100,
  },
  enterprise: {
    properties: 'unlimited',
    api_calls_per_month: 'unlimited',
    ml_operations_per_month: 'unlimited',
    storage_gb: 1_000,
  },
}
```

**Throttling Rules**:
```typescript
// Rate limiting per tenant
if (tenant.api_calls_last_minute > 100) {
  return 429  // Too Many Requests
}

// Fair share enforcement
if (tenant.cpu_usage > avg_cpu_usage × 3) {
  throttle_factor = 0.5  // Slow down by 50%
  notify_tenant('approaching_limits')
}
```

### 9. Compliance & Regulatory

#### 9.1 Data Privacy (GDPR/CCPA)

**PII Handling**:
```typescript
pii_fields = [
  'guest_name', 'email', 'phone', 'address',
  'payment_info', 'passport_number', 'id_number'
]

// Data retention
if (booking.checkout_date < today - 3_years) {
  anonymize_guest_data(booking)
}

// Right to be forgotten
if (guest_requests_deletion) {
  delete_pii(guest)
  keep_anonymized_stats()  // For business analytics
}
```

#### 9.2 Accessibility Compliance

**ADA/Accessibility Rooms**:
```typescript
// Minimum accessible inventory
min_accessible_rooms = max(1, total_rooms × 0.05)

// Accessible room assignment
if (guest.requires_accessibility) {
  priority = 'highest'
  must_assign_accessible_room = true
}

// Never upsell accessible rooms to non-disabled guests
if (!guest.requires_accessibility && available_standard_rooms > 0) {
  do_not_assign_accessible_room = true
}
```

### 10. API Business Logic

#### 10.1 Rate Limiting

**Tier-Based Limits**:
```typescript
rate_limits = {
  starter: '100 req/min',
  growth: '500 req/min',
  pro: '2000 req/min',
  enterprise: '10000 req/min',
}
```

#### 10.2 Webhooks & Event Processing

**Event Priority**:
```typescript
event_priority = {
  booking_created: 'high',           // Immediate notification
  booking_modified: 'medium',        // Process within 5min
  booking_cancelled: 'high',         // Immediate inventory release
  payment_failed: 'critical',        // Immediate action required
  review_posted: 'low',              // Batch process hourly
  maintenance_reported: 'medium',    // Within 15min
}
```

## Implementation Guidelines

### Best Practices

1. **Always validate business rules at multiple layers**:
   - Client-side (UX feedback)
   - API gateway (security)
   - Business logic layer (enforcement)
   - Database (RLS, constraints)

2. **Make exceptions auditable**:
   ```typescript
   if (override_business_rule) {
     log_audit_trail(user, rule, reason, timestamp)
     require_manager_approval()
   }
   ```

3. **Configuration over hard-coding**:
   ```typescript
   // Good
   const max_discount = tenant.config.pricing.max_discount_percent

   // Bad
   const max_discount = 0.30  // Hard-coded 30%
   ```

4. **Graceful degradation**:
   ```typescript
   if (ml_service_unavailable) {
     fallback_to_algorithmic_method()
     log_warning('ML service down, using fallback')
   }
   ```

## Conclusion

These business rules ensure the Hospitality AI SDK produces recommendations that are:
- ✅ **Operationally sound**: Aligned with industry best practices
- ✅ **Financially responsible**: Protect revenue and minimize losses
- ✅ **Guest-centric**: Improve experience while maximizing value
- ✅ **Compliant**: Meet regulatory and accessibility requirements
- ✅ **Scalable**: Work across property types and sizes

All rules are **configurable** per tenant and can be customized based on property type, brand standards, and local regulations.
