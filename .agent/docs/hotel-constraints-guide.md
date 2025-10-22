# Hotel Room Allocation - Hard & Soft Constraints Guide

## Overview

This guide explains how to model hotel room allocation as a constraint satisfaction problem using Timefold Solver, with 20 rooms, VIP guests, preferences, and amenities.

---

## Constraint Types

### Hard Constraints (Must NEVER be violated)

- Score format: `-1hard` per violation
- **Score MUST be 0hard** for a valid solution
- These are non-negotiable business rules or legal requirements

### Soft Constraints (Preferences to optimize)

- Score format: `+50soft` per match (or `-50soft` per penalty)
- **Maximize soft score** while keeping hard score at 0
- Trade-offs can be made between different soft constraints

---

## Hotel Room Model (20 Rooms)

```
2 Ocean View Suites (Floors 10)
  - R101: Suite, Floor 10, Ocean, Accessible, Balcony, Kitchenette ($500)
  - R102: Suite, Floor 10, Ocean, Balcony, Kitchenette ($450)

4 Ocean View Deluxe (Floors 8-9)
  - R201: Deluxe, Floor 9, Ocean, Accessible, Balcony ($350)
  - R202: Deluxe, Floor 9, Ocean, Balcony ($300)
  - R203: Deluxe, Floor 8, Ocean, Balcony ($300)
  - R204: Deluxe, Floor 8, Ocean ($280)

4 City View Deluxe (Floors 6-7)
  - R301: Deluxe, Floor 7, City, Accessible, Balcony ($280)
  - R302: Deluxe, Floor 7, City, Balcony, Pet-Friendly ($280)
  - R303: Deluxe, Floor 6, City, Kitchenette ($250)
  - R304: Deluxe, Floor 6, City ($250)

6 Garden View Standard (Floors 3-5)
  - R401: Standard, Floor 5, Garden, Accessible ($200)
  - R402: Standard, Floor 5, Garden, Pet-Friendly ($200)
  - R403: Standard, Floor 4, Garden ($180)
  - R404: Standard, Floor 4, Garden, Smoking ($180)
  - R405: Standard, Floor 3, Garden ($180)
  - R406: Standard, Floor 3, Garden ($180)

4 Courtyard View Standard (Floors 1-2)
  - R501: Standard, Floor 2, Courtyard, Accessible ($150)
  - R502: Standard, Floor 2, Courtyard ($150)
  - R503: Standard, Floor 1, Courtyard, Smoking ($150)
  - R504: Standard, Floor 1, Courtyard ($150)
```

**Room Distribution**:

- Accessible rooms: 4 (R101, R201, R301, R401, R501)
- Pet-friendly rooms: 2 (R302, R402)
- Smoking rooms: 2 (R404, R503)
- Balcony rooms: 7
- Kitchenette rooms: 3

---

## Hard Constraints (5 total)

### 1. Room Type Match

**Rule**: Guest MUST receive the room type they requested (Standard, Deluxe, or Suite)

**Why Hard**: Contractual obligation - guest paid for specific room type

**Example**:

```java
// VALID
Guest requests DELUXE → Gets R201 (Deluxe) ✅

// INVALID (Hard constraint violation)
Guest requests SUITE → Gets R201 (Deluxe) ❌
Score: -1hard/-0soft
```

**Code**:

```java
Constraint roomTypeMatch(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getAssignedRoom().getType() != booking.getRequestedRoomType())
        .penalize(HardSoftScore.ONE_HARD)
        .asConstraint("Room type must match request");
}
```

---

### 2. No Double Booking

**Rule**: No two guests can be assigned the same room on overlapping dates

**Why Hard**: Physical impossibility + legal liability

**Example**:

```java
// VALID
Guest A: R201, Oct 25-27
Guest B: R201, Oct 28-30  ✅ (No overlap)

// INVALID (Hard constraint violation)
Guest A: R201, Oct 25-27
Guest B: R201, Oct 26-29  ❌ (Oct 26-27 overlaps)
Score: -1hard/-0soft
```

**Code**:

```java
Constraint noDoubleBooking(ConstraintFactory factory) {
    return factory
        .forEachUniquePair(GuestBooking.class,
            Joiners.equal(GuestBooking::getAssignedRoom))
        .filter((booking1, booking2) ->
            datesOverlap(
                booking1.getCheckIn(), booking1.getCheckOut(),
                booking2.getCheckIn(), booking2.getCheckOut()))
        .penalize(HardSoftScore.ONE_HARD)
        .asConstraint("No double booking");
}
```

---

### 3. Accessibility Required

**Rule**: Guests requiring accessible rooms MUST get accessible rooms

**Why Hard**: ADA/legal compliance + moral obligation

**Example**:

```java
// VALID
Guest needs accessible → Gets R201 (Accessible) ✅

// INVALID (Hard constraint violation)
Guest needs accessible → Gets R202 (Not accessible) ❌
Score: -1hard/-0soft
```

**Available Accessible Rooms**: R101, R201, R301, R401, R501

**Code**:

```java
Constraint accessibilityRequired(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getGuest().getPreferences().isNeedsAccessible() &&
            !booking.getAssignedRoom().isAccessible())
        .penalize(HardSoftScore.ONE_HARD)
        .asConstraint("Accessibility requirement must be met");
}
```

---

### 4. Smoking Policy Match

**Rule**: Smoking guests MUST get smoking-allowed rooms

**Why Hard**: Hotel policy + fire safety + legal regulations

**Example**:

```java
// VALID
Guest smokes → Gets R404 (Smoking room) ✅
Guest doesn't smoke → Gets R404 (OK, just not preferred) ✅

// INVALID (Hard constraint violation)
Guest smokes → Gets R201 (Non-smoking) ❌
Score: -1hard/-0soft
```

**Available Smoking Rooms**: R404, R503

**Code**:

```java
Constraint smokingPolicyMatch(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking -> {
            boolean guestSmokes = booking.getGuest().getPreferences().isPrefersSmoking();
            boolean roomAllows = booking.getAssignedRoom().isSmokingAllowed();
            return guestSmokes && !roomAllows;  // Violation
        })
        .penalize(HardSoftScore.ONE_HARD)
        .asConstraint("Smoking policy must be satisfied");
}
```

---

### 5. Pet Policy Match

**Rule**: Guests with pets MUST get pet-friendly rooms

**Why Hard**: Hotel policy + allergies + damage liability

**Example**:

```java
// VALID
Guest has pet → Gets R302 (Pet-friendly) ✅

// INVALID (Hard constraint violation)
Guest has pet → Gets R301 (Not pet-friendly) ❌
Score: -1hard/-0soft
```

**Available Pet-Friendly Rooms**: R302, R402

**Code**:

```java
Constraint petPolicyMatch(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getGuest().getPreferences().isHasPet() &&
            !booking.getAssignedRoom().isPetFriendly())
        .penalize(HardSoftScore.ONE_HARD)
        .asConstraint("Pet policy must be satisfied");
}
```

---

## Soft Constraints (9 total)

### 1. VIP Ocean View Priority

**Rule**: VIP guests should get ocean view rooms when possible

**Weight**: +100 soft points (very important)

**Why Soft**: VIP satisfaction = repeat business + referrals

**Example**:

```java
// Best outcome
VIP guest → R101 (Ocean view suite)
Score: 0hard/+100soft ✅

// Acceptable outcome
VIP guest → R301 (City view deluxe)
Score: 0hard/+0soft (no bonus, but valid)

// Will be penalized vs ocean view option
```

**Code**:

```java
Constraint vipOceanViewPriority(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getGuest().isVip() &&
            booking.getAssignedRoom().getView() == View.OCEAN)
        .reward(HardSoftScore.ofSoft(100))
        .asConstraint("VIP ocean view priority");
}
```

---

### 2. View Preference Match

**Rule**: Match guest's preferred view when possible

**Weight**: +50 soft points

**Example**:

```java
// Guest prefers ocean view
Best:  Gets R201 (Ocean) → +50 soft
OK:    Gets R301 (City)  → +0 soft
Score difference: 50 points
```

**Code**:

```java
Constraint viewPreference(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getAssignedRoom().getView() ==
            booking.getGuest().getPreferences().getPreferredView())
        .reward(HardSoftScore.ofSoft(50))
        .asConstraint("View preference matched");
}
```

---

### 3. Floor Preference Match

**Rule**: Match guest's floor preference (Low=1-3, Medium=4-8, High=9+)

**Weight**: +30 soft points

**Example**:

```java
// Guest prefers high floor
Best:  Gets R101 (Floor 10)  → +30 soft
OK:    Gets R301 (Floor 7)   → +0 soft
Bad:   Gets R501 (Floor 2)   → +0 soft (but worse than Floor 10)
```

**Code**:

```java
Constraint floorPreference(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking -> {
            int floor = booking.getAssignedRoom().getFloor();
            FloorPreference pref = booking.getGuest().getPreferences().getFloor();
            return matchesFloorPreference(floor, pref);
        })
        .reward(HardSoftScore.ofSoft(30))
        .asConstraint("Floor preference matched");
}
```

---

### 4. Balcony Preference

**Rule**: Give balcony rooms to guests who want them

**Weight**: +40 soft points

**Example**:

```java
// Guest wants balcony
Best:  Gets R201 (Has balcony)    → +40 soft
OK:    Gets R204 (No balcony)     → +0 soft
```

**Balcony Rooms**: R101, R102, R201, R202, R203, R301, R302

**Code**:

```java
Constraint balconyPreference(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getGuest().getPreferences().isWantsBalcony() &&
            booking.getAssignedRoom().isHasBalcony())
        .reward(HardSoftScore.ofSoft(40))
        .asConstraint("Balcony preference matched");
}
```

---

### 5. Kitchenette Preference

**Rule**: Give kitchenette rooms to guests who want them

**Weight**: +35 soft points

**Example**:

```java
// Guest wants kitchenette (extended stay)
Best:  Gets R101 (Has kitchenette)  → +35 soft
OK:    Gets R201 (No kitchenette)   → +0 soft
```

**Kitchenette Rooms**: R101, R102, R303

**Code**:

```java
Constraint kitchenettePreference(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getGuest().getPreferences().isWantsKitchenette() &&
            booking.getAssignedRoom().isHasKitchenette())
        .reward(HardSoftScore.ofSoft(35))
        .asConstraint("Kitchenette preference matched");
}
```

---

### 6. Quiet Location Preference

**Rule**: Guests wanting quiet should avoid floors 1-2 (near lobby, elevators, pool)

**Weight**: +25 soft points

**Example**:

```java
// Guest wants quiet
Best:  Gets R201 (Floor 9)   → +25 soft
OK:    Gets R501 (Floor 2)   → +0 soft (noisy area)
```

**Code**:

```java
Constraint quietLocationPreference(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getGuest().getPreferences().isWantsQuiet() &&
            booking.getAssignedRoom().getFloor() >= 3)
        .reward(HardSoftScore.ofSoft(25))
        .asConstraint("Quiet location preference");
}
```

---

### 7. Budget Constraint

**Rule**: Avoid assigning rooms that exceed guest's budget

**Weight**: -60 soft points (penalty)

**Example**:

```java
// Guest budget: $250/night
Best:  Gets R304 ($250)  → +0 soft
OK:    Gets R303 ($250)  → +0 soft
Bad:   Gets R201 ($350)  → -60 soft (over budget by $100)
```

**Code**:

```java
Constraint budgetConstraint(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getAssignedRoom().getBasePrice() >
            booking.getGuest().getBudgetMax())
        .penalize(HardSoftScore.ofSoft(60))
        .asConstraint("Budget exceeded");
}
```

---

### 8. Loyalty Tier Upgrade

**Rule**: Reward guests with loyalty upgrades based on tier

**Weight**: 70-90 soft points based on tier

**Tiers**:

- Platinum (Tier 3): +90 soft if get suite
- Gold (Tier 2): +80 soft if get deluxe/suite
- Silver (Tier 1): +70 soft if get deluxe

**Example**:

```java
// Platinum guest (Tier 3)
Best:  Gets R101 (Suite)     → +90 soft
Good:  Gets R201 (Deluxe)    → +0 soft
OK:    Gets R401 (Standard)  → +0 soft

// Gold guest (Tier 2)
Best:  Gets R201 (Deluxe)    → +80 soft
OK:    Gets R401 (Standard)  → +0 soft
```

**Code**:

```java
Constraint loyaltyTierUpgrade(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking -> {
            int tier = booking.getGuest().getLoyaltyTier();
            RoomType type = booking.getAssignedRoom().getType();

            if (tier == 3 && type == RoomType.SUITE) return true;
            if (tier == 2 && (type == RoomType.DELUXE || type == RoomType.SUITE)) return true;
            if (tier == 1 && type == RoomType.DELUXE) return true;
            return false;
        })
        .reward(booking -> HardSoftScore.ofSoft(60 + booking.getGuest().getLoyaltyTier() * 10))
        .asConstraint("Loyalty tier upgrade reward");
}
```

---

### 9. Minimize Room Changes

**Rule**: For consecutive bookings by same guest, keep them in same room

**Weight**: -80 soft points penalty per room change

**Why Important**: Guests hate packing/unpacking, moving rooms mid-stay

**Example**:

```java
// Guest has back-to-back bookings:
// Booking 1: Oct 25-27
// Booking 2: Oct 27-29 (check-out = check-in)

Best:  Both in R201  → +0 soft (no penalty)
Bad:   R201, then R202 → -80 soft (had to change rooms)
```

**Code**:

```java
Constraint minimizeRoomChanges(ConstraintFactory factory) {
    return factory
        .forEachUniquePair(GuestBooking.class,
            Joiners.equal(booking -> booking.getGuest().getId()))
        .filter((b1, b2) -> {
            boolean consecutive = b1.getCheckOut().equals(b2.getCheckIn()) ||
                                  b2.getCheckOut().equals(b1.getCheckIn());
            if (!consecutive) return false;

            return !b1.getAssignedRoom().getId().equals(b2.getAssignedRoom().getId());
        })
        .penalize(HardSoftScore.ofSoft(80))
        .asConstraint("Minimize room changes");
}
```

---

## Constraint Priority (Weight Summary)

### Hard Constraints (Infinite weight - cannot violate)

1. Room type match
2. No double booking
3. Accessibility required
4. Smoking policy match
5. Pet policy match

### Soft Constraints (Prioritized by weight)

1. **VIP ocean view** (+100) - Highest priority soft constraint
2. **Loyalty upgrade** (+70 to +90) - Based on tier
3. **Minimize room changes** (-80 penalty) - Guest convenience
4. **Budget** (-60 penalty) - Financial constraint
5. **View preference** (+50) - Guest satisfaction
6. **Balcony** (+40) - Amenity preference
7. **Kitchenette** (+35) - Extended stay needs
8. **Floor preference** (+30) - Location preference
9. **Quiet location** (+25) - Noise sensitivity

---

## Real-World Scenarios

### Scenario 1: VIP with Tight Budget

**Guest**: Alice (VIP, Budget $350)
**Preferences**: Ocean view, high floor, balcony
**Requested**: Deluxe room

**Options**:

```
Option A: R201 (Deluxe, Ocean, Floor 9, Balcony, $350)
  Score: 0hard/+190soft
  - VIP ocean view: +100
  - View match: +50
  - Balcony: +40
  - Budget OK: +0

Option B: R101 (Suite, Ocean, Floor 10, Balcony, $500)
  Score: -1hard/+240soft ❌ INVALID
  - Room type mismatch: -1hard (requested Deluxe, got Suite)
  - Cannot be used even though soft score higher

Winner: Option A ✅
```

**Lesson**: Hard constraints always win. VIP doesn't override room type contract.

---

### Scenario 2: Accessibility vs Budget

**Guest**: Carol (Needs accessible, Budget $200)
**Preferences**: Garden view, low floor
**Requested**: Standard room

**Options**:

```
Option A: R401 (Standard, Garden, Floor 5, Accessible, $200)
  Score: 0hard/+80soft ✅
  - Accessibility: Required (hard constraint met)
  - View match: +50
  - Floor match: +30
  - Budget OK: +0

Option B: R501 (Standard, Courtyard, Floor 2, Accessible, $150)
  Score: 0hard/+30soft
  - Accessibility: Required (hard constraint met)
  - View mismatch: +0
  - Floor match: +30
  - Under budget: +0 (not penalized, just not rewarded)

Winner: Option A (higher soft score) ✅
```

**Lesson**: Among valid solutions (0hard), choose highest soft score.

---

### Scenario 3: Pet Owner Dilemma

**Guest**: David (Has pet, Budget $220)
**Preferences**: Garden view
**Requested**: Standard room

**Options**:

```
Option A: R402 (Standard, Garden, Floor 5, Pet-friendly, $200)
  Score: 0hard/+50soft ✅
  - Pet policy: Required (hard constraint met)
  - View match: +50
  - Under budget: +0

Option B: R403 (Standard, Garden, Floor 4, $180)
  Score: -1hard/+50soft ❌ INVALID
  - Pet policy violation: -1hard (no pets allowed)
  - View match: +50
  - Cannot be used

Only Option: A ✅
```

**Lesson**: Hard constraints eliminate options. Only 2 pet-friendly rooms limit choices.

---

### Scenario 4: Consecutive Stay

**Guest**: Emma (Staying 6 nights)
**Bookings**:

- Booking 1: Oct 25-28 (3 nights)
- Booking 2: Oct 28-31 (3 nights)
  **Requested**: Standard room each time

**Options**:

```
Option A: R403 for both bookings
  Score: 0hard/+0soft ✅
  - No room change: +0 (no penalty)

Option B: R403 then R405
  Score: 0hard/-80soft
  - Room change penalty: -80
  - Guest has to pack/move mid-stay

Winner: Option A (avoid -80 penalty) ✅
```

**Lesson**: Solver will try to keep guest in same room for consecutive bookings.

---

## Constraint Tuning Tips

### Adjusting Weights

If you find VIPs not getting ocean views often enough:

```java
// Increase weight
.reward(HardSoftScore.ofSoft(150))  // was 100
```

If budget violations are too common:

```java
// Increase penalty
.penalize(HardSoftScore.ofSoft(100))  // was 60
```

### Adding New Constraints

Example: Prefer corner rooms for suites:

```java
Constraint cornerRoomForSuites(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getAssignedRoom().getType() == RoomType.SUITE &&
            booking.getAssignedRoom().isCornerRoom())
        .reward(HardSoftScore.ofSoft(20))
        .asConstraint("Corner room for suites");
}
```

### Combining Constraints

Bonus for VIP + Loyalty Platinum + Ocean View:

```java
Constraint vipPlatinumOceanBonus(ConstraintFactory factory) {
    return factory
        .forEach(GuestBooking.class)
        .filter(booking ->
            booking.getGuest().isVip() &&
            booking.getGuest().getLoyaltyTier() == 3 &&
            booking.getAssignedRoom().getView() == View.OCEAN)
        .reward(HardSoftScore.ofSoft(50))  // Extra bonus
        .asConstraint("VIP Platinum ocean bonus");
}
```

---

## Summary

**Hard Constraints** (5): Room type, No double booking, Accessibility, Smoking, Pets
**Soft Constraints** (9): VIP priority, Loyalty, Room changes, Budget, View, Balcony, Kitchenette, Floor, Quiet

**Score Format**: `0hard/+350soft` (perfect = 0 hard violations, maximize soft score)

**File Location**: `.agent/timefold-samples/hotel-room-allocation-example.java`

**Next Steps**:

1. Review the Java code example
2. Adapt constraint weights to your business priorities
3. Add custom constraints for your specific needs
4. Test with real booking data
5. Integrate with Next.js via REST API
