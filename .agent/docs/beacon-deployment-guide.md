# Beacon Deployment Guide for Hotels

## Overview

This guide explains how to deploy Bluetooth beacons at your property to enable location-aware guest services.

**Total Time**: 2-4 hours
**Total Cost**: $500-1,000 (one-time)
**Skill Level**: Easy (DIY-friendly)

---

## What You'll Need

### Hardware

| Item | Quantity | Unit Cost | Total | Vendor |
|------|----------|-----------|-------|--------|
| **Kontakt.io Beacons** | 20 | $25 | $500 | [kontakt.io](https://kontakt.io/) |
| **3M Command Strips** | 1 pack | $10 | $10 | Amazon, hardware store |
| **Smartphone** (for testing) | 1 | - | - | Android with Chrome browser |

**Total**: ~$510

### Software

- **Kontakt.io Web Panel** (free tier)
- **Web Bluetooth API** (built into Chrome)
- **Your hospitality app** (web or mobile)

---

## Step 1: Purchase Beacons (Week 1)

### Recommended: Kontakt.io Beacon Pro

**Why Kontakt.io**:
- ✅ Enterprise-grade reliability
- ✅ 1-2 year battery life (CR2032, replaceable)
- ✅ Web-based management console
- ✅ iBeacon + Eddystone support
- ✅ Waterproof (IP65 rating)
- ✅ Excellent documentation

**Order**:
1. Go to [kontakt.io/store](https://kontakt.io/store)
2. Select "Beacon Pro" (20-pack for discount)
3. Shipping: 3-5 business days

**Alternative (Budget)**:
- Generic iBeacon from AliExpress: $5-10 each
- Estimote Beacons: $30-50 each (premium option)

---

## Step 2: Plan Beacon Placement (Week 1)

### Beacon Coverage Map

**General Rules**:
- 1 beacon per 10-20 square meters
- Beacons 5-10 meters apart
- Height: 2-3 meters (ceiling or high wall)
- Avoid metal surfaces (blocks signal)
- Avoid direct line of sight to guest (body blocks signal)

### 50-Room Hotel Example (20 beacons)

#### Zone 1: Restaurant (5 beacons)

```
Restaurant Floor Plan (20m × 15m)
┌────────────────────────────────────┐
│  [B1]              [B2]      Bar   │
│   Tables 1-4        Tables 5-8     │
│                                    │
│  [B3]              [B4]            │
│   Tables 9-12       Tables 13-16   │
│                                    │
│   [B5] Entrance                    │
└────────────────────────────────────┘

B1-B4: Table zone beacons (detect which table guest is at)
B5: Entrance beacon (welcome message)
```

**Metadata**:
- B1: `{ zone: 'restaurant', area: 'tables-1-4', tableNumbers: [1,2,3,4] }`
- B2: `{ zone: 'restaurant', area: 'tables-5-8', tableNumbers: [5,6,7,8] }`
- B3: `{ zone: 'restaurant', area: 'tables-9-12', tableNumbers: [9,10,11,12] }`
- B4: `{ zone: 'restaurant', area: 'tables-13-16', tableNumbers: [13,14,15,16] }`
- B5: `{ zone: 'restaurant', area: 'entrance' }`

#### Zone 2: Spa/Pool (3 beacons)

```
Spa Floor Plan (15m × 10m)
┌────────────────────────────┐
│   [B6] Reception            │
│                             │
│   [B7] Pool Area            │
│                             │
│   [B8] Gym                  │
└────────────────────────────┘

B6: Spa reception (check-in)
B7: Pool area (access control)
B8: Gym (access control)
```

**Metadata**:
- B6: `{ zone: 'spa', area: 'reception' }`
- B7: `{ zone: 'spa', area: 'pool', accessControl: true }`
- B8: `{ zone: 'spa', area: 'gym', accessControl: true }`

#### Zone 3: Lobby (3 beacons)

```
Lobby Floor Plan (20m × 15m)
┌────────────────────────────┐
│  [B9]  [B10]   [B11]       │
│  Front  Concierge  Lounge  │
│  Desk                      │
└────────────────────────────┘

B9: Front desk (check-in/check-out)
B10: Concierge (ask questions)
B11: Lounge area (wait, relax)
```

#### Zone 4: VIP Rooms (5 beacons)

```
VIP Suite Floor Plan (10m × 8m per suite)
┌─────────────────┐
│  [B12] Room 201 │  (Ceiling, center of room)
│   VIP Suite     │
└─────────────────┘

Repeat for rooms: 202, 203, 204, 205
```

**Metadata**:
- B12: `{ zone: 'room', area: 'room-201', roomNumber: 201, roomType: 'vip-suite' }`
- B13-B16: Similar for rooms 202-205

#### Zone 5: Common Areas (4 beacons)

```
Elevator Lobby Floor Plan (each floor)
┌────────────────────┐
│  [B17] Floor 1     │  (Elevator lobby)
│                    │
│  [B18] Floor 2     │  (Elevator lobby)
└────────────────────┘

Plus:
B19: Business center
B20: Gift shop
```

---

## Step 3: Configure Beacons (Week 2)

### Using Kontakt.io Web Panel

1. **Create Account**:
   - Go to [panel.kontakt.io](https://panel.kontakt.io)
   - Sign up (free tier)
   - Verify email

2. **Add Beacons**:
   - Click "Add Device"
   - Scan QR code on beacon (or enter UUID manually)
   - Repeat for all 20 beacons

3. **Configure Each Beacon**:

   **Example: Restaurant Table Beacon (B1)**
   ```
   Name: restaurant-tables-1-4
   UUID: f7826da6-4fa2-4e98-8024-bc5b71e0893e
   Major: 1
   Minor: 1
   Tx Power: -4 dBm (default)
   Advertising Interval: 200ms (default)
   ```

   **Example: Spa Pool Beacon (B7)**
   ```
   Name: spa-pool
   UUID: f7826da6-4fa2-4e98-8024-bc5b71e0893e
   Major: 2
   Minor: 1
   Tx Power: -4 dBm
   Advertising Interval: 200ms
   ```

4. **Save Configuration**:
   - Click "Apply Changes"
   - Beacon will update via Bluetooth (takes ~30 seconds)

### Configuration Matrix

| Beacon ID | Zone | Area | UUID | Major | Minor | Metadata |
|-----------|------|------|------|-------|-------|----------|
| B1 | restaurant | tables-1-4 | f7826da6... | 1 | 1 | `{ tableNumbers: [1,2,3,4] }` |
| B2 | restaurant | tables-5-8 | f7826da6... | 1 | 2 | `{ tableNumbers: [5,6,7,8] }` |
| B3 | restaurant | tables-9-12 | f7826da6... | 1 | 3 | `{ tableNumbers: [9,10,11,12] }` |
| B4 | restaurant | tables-13-16 | f7826da6... | 1 | 4 | `{ tableNumbers: [13,14,15,16] }` |
| B5 | restaurant | entrance | f7826da6... | 1 | 5 | `{}` |
| B6 | spa | reception | f7826da6... | 2 | 1 | `{}` |
| B7 | spa | pool | f7826da6... | 2 | 2 | `{ accessControl: true, amenity: 'pool' }` |
| B8 | spa | gym | f7826da6... | 2 | 3 | `{ accessControl: true, amenity: 'gym' }` |
| B9 | lobby | front-desk | f7826da6... | 3 | 1 | `{}` |
| B10 | lobby | concierge | f7826da6... | 3 | 2 | `{}` |
| B11 | lobby | lounge | f7826da6... | 3 | 3 | `{}` |
| B12 | room | room-201 | f7826da6... | 4 | 201 | `{ roomNumber: 201, roomType: 'vip-suite' }` |
| B13 | room | room-202 | f7826da6... | 4 | 202 | `{ roomNumber: 202, roomType: 'vip-suite' }` |
| B14 | room | room-203 | f7826da6... | 4 | 203 | `{ roomNumber: 203, roomType: 'vip-suite' }` |
| B15 | room | room-204 | f7826da6... | 4 | 204 | `{ roomNumber: 204, roomType: 'vip-suite' }` |
| B16 | room | room-205 | f7826da6... | 4 | 205 | `{ roomNumber: 205, roomType: 'vip-suite' }` |
| B17 | common | elevator-floor-1 | f7826da6... | 5 | 1 | `{ floor: 1 }` |
| B18 | common | elevator-floor-2 | f7826da6... | 5 | 2 | `{ floor: 2 }` |
| B19 | common | business-center | f7826da6... | 5 | 3 | `{}` |
| B20 | common | gift-shop | f7826da6... | 5 | 4 | `{}` |

**Note**: Use same UUID for all beacons at your property. Only major/minor differ.

---

## Step 4: Install Beacons (Week 2)

### Installation Steps

**For each beacon**:

1. **Choose Location**:
   - High wall or ceiling (2-3 meters height)
   - Avoid metal surfaces
   - Avoid direct sunlight (battery life)
   - Clear line of sight to guest area

2. **Clean Surface**:
   - Wipe with alcohol pad
   - Let dry for 30 seconds

3. **Attach 3M Command Strip**:
   - Peel backing from one side
   - Press onto beacon (back side)
   - Hold for 30 seconds

4. **Mount Beacon**:
   - Peel other side of Command Strip
   - Press beacon onto wall/ceiling
   - Hold firmly for 30 seconds
   - Wait 1 hour before testing (adhesive sets)

5. **Verify Signal**:
   - Open Kontakt.io app on phone
   - Check beacon is broadcasting
   - Note RSSI (signal strength)

### Installation Tips

**Restaurant**:
- Mount on ceiling, centered above table zones
- Avoid near kitchen (metal equipment interferes)
- Test signal at each table (should be -65 dBm or stronger)

**Spa/Pool**:
- Use waterproof enclosure (beacons are IP65, but extra protection helps)
- Mount above water level (pool area)
- Test signal in changing room (guests will be checking app there)

**Guest Rooms**:
- Mount on ceiling, center of room
- Avoid near bathroom (tiles block signal)
- Test signal at bed (where guest will be using app)

**Common Areas**:
- Mount on walls, 2-3 meters high
- Avoid near metal signs or fixtures
- Test signal in seating areas

---

## Step 5: Add Beacons to Database (Week 2)

### SQL Script

```sql
-- Insert beacon registry for demo hotel
-- Note: Replace UUIDs with your actual beacon UUIDs

INSERT INTO beacons (beacon_id, tenant_id, uuid, major, minor, zone, area, coordinates, metadata, features, created_by) VALUES
  -- Restaurant beacons
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 1, 1, 'restaurant', 'tables-1-4', '{"x": 5, "y": 5, "floor": 1}', '{"tableNumbers": [1,2,3,4]}', ARRAY['orders'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 1, 2, 'restaurant', 'tables-5-8', '{"x": 15, "y": 5, "floor": 1}', '{"tableNumbers": [5,6,7,8]}', ARRAY['orders'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 1, 3, 'restaurant', 'tables-9-12', '{"x": 5, "y": 12, "floor": 1}', '{"tableNumbers": [9,10,11,12]}', ARRAY['orders'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 1, 4, 'restaurant', 'tables-13-16', '{"x": 15, "y": 12, "floor": 1}', '{"tableNumbers": [13,14,15,16]}', ARRAY['orders'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 1, 5, 'restaurant', 'entrance', '{"x": 10, "y": 0, "floor": 1}', '{}', ARRAY['wayfinding'], 'system-user-id'),

  -- Spa beacons
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 2, 1, 'spa', 'reception', '{"x": 0, "y": 0, "floor": 1}', '{}', ARRAY['access-control'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 2, 2, 'spa', 'pool', '{"x": 7, "y": 5, "floor": 1}', '{"accessControl": true, "amenity": "pool"}', ARRAY['access-control'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 2, 3, 'spa', 'gym', '{"x": 7, "y": 8, "floor": 1}', '{"accessControl": true, "amenity": "gym"}', ARRAY['access-control'], 'system-user-id'),

  -- Lobby beacons
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 3, 1, 'lobby', 'front-desk', '{"x": 5, "y": 0, "floor": 1}', '{}', ARRAY['concierge'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 3, 2, 'lobby', 'concierge', '{"x": 10, "y": 0, "floor": 1}', '{}', ARRAY['concierge'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 3, 3, 'lobby', 'lounge', '{"x": 15, "y": 5, "floor": 1}', '{}', ARRAY['concierge'], 'system-user-id'),

  -- Room beacons (VIP suites)
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 4, 201, 'room', 'room-201', '{"x": 10, "y": 5, "floor": 2}', '{"roomNumber": 201, "roomType": "vip-suite"}', ARRAY['room-service'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 4, 202, 'room', 'room-202', '{"x": 10, "y": 10, "floor": 2}', '{"roomNumber": 202, "roomType": "vip-suite"}', ARRAY['room-service'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 4, 203, 'room', 'room-203', '{"x": 10, "y": 15, "floor": 2}', '{"roomNumber": 203, "roomType": "vip-suite"}', ARRAY['room-service'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 4, 204, 'room', 'room-204', '{"x": 10, "y": 20, "floor": 2}', '{"roomNumber": 204, "roomType": "vip-suite"}', ARRAY['room-service'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 4, 205, 'room', 'room-205', '{"x": 10, "y": 25, "floor": 2}', '{"roomNumber": 205, "roomType": "vip-suite"}', ARRAY['room-service'], 'system-user-id'),

  -- Common area beacons
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 5, 1, 'common', 'elevator-floor-1', '{"x": 0, "y": 10, "floor": 1}', '{"floor": 1}', ARRAY['wayfinding'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 5, 2, 'common', 'elevator-floor-2', '{"x": 0, "y": 10, "floor": 2}', '{"floor": 2}', ARRAY['wayfinding'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 5, 3, 'common', 'business-center', '{"x": 20, "y": 5, "floor": 1}', '{}', ARRAY['concierge'], 'system-user-id'),
  (uuid_generate_v7(), 'hotel-abc-123', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', 5, 4, 'common', 'gift-shop', '{"x": 20, "y": 10, "floor": 1}', '{}', ARRAY[], 'system-user-id');
```

---

## Step 6: Test Location Detection (Week 2)

### Using Web App (Android Chrome)

1. **Open Guest Portal**:
   ```
   https://yourdomain.com/guest-portal
   ```

2. **Grant Bluetooth Permission**:
   - Click "Enable Location Services"
   - Browser prompts: "yourdomain.com wants to pair with a Bluetooth device"
   - Click "Allow"

3. **Walk to Restaurant**:
   - App should detect "restaurant" zone
   - Show "Welcome to our restaurant!" message
   - Display table-specific menu

4. **Test Order Flow**:
   - Sit at table 5
   - App should show "You're at Table 5"
   - Select items from menu
   - Place order
   - Order should arrive in kitchen with table number

5. **Walk to Spa**:
   - App should detect "spa" zone
   - Show "Request Pool Access" button
   - Tap button → request sent to staff

### Testing Checklist

- [ ] Beacon detected in restaurant (zone: 'restaurant')
- [ ] Correct table identified (e.g., "Table 5")
- [ ] Restaurant menu shown
- [ ] Order sent via WebRTC P2P (50ms)
- [ ] Kitchen received order with table number
- [ ] Beacon detected in spa (zone: 'spa')
- [ ] Spa access request sent to staff
- [ ] Beacon detected in lobby (zone: 'lobby')
- [ ] Concierge feature available
- [ ] Beacon detected in room (zone: 'room', area: 'room-201')
- [ ] Room service menu shown

---

## Step 7: Train Staff (Week 3)

### Staff Training Checklist

**For front desk staff**:
- [ ] Explain beacons enable location-aware guest services
- [ ] Show guest portal (web app or mobile app)
- [ ] Demo: Guest orders food at table → kitchen receives order
- [ ] Demo: Guest requests spa access → staff approves/denies
- [ ] Explain battery life (1-2 years, CR2032 replacement)

**For restaurant staff**:
- [ ] Explain orders arrive automatically with table number
- [ ] Show kitchen display (WebRTC P2P integration)
- [ ] Demo: Guest places order → appears on kitchen display in 50ms
- [ ] No need to ask "what table are you at?"

**For housekeeping**:
- [ ] Explain beacons help guests order room service
- [ ] Show room service orders (tagged with room number)
- [ ] Deliver to correct room (no mistakes)

### Guest Instructions (QR Code)

Print QR codes at each table:

```
┌─────────────────────────────────┐
│  [QR CODE]                      │
│                                 │
│  Order from Your Table          │
│                                 │
│  1. Scan this QR code           │
│  2. Allow Bluetooth access      │
│  3. Browse menu                 │
│  4. Place order                 │
│  5. Food arrives in 15-20 min   │
│                                 │
│  Questions? Ask our staff!      │
└─────────────────────────────────┘
```

---

## Maintenance

### Monthly Checks

- [ ] Check beacon status in Kontakt.io panel
- [ ] Note battery levels (replace if <20%)
- [ ] Test location detection in each zone
- [ ] Verify orders arrive with correct table/room numbers

### Battery Replacement

**When**: Battery level <20% (check Kontakt.io panel)

**How**:
1. Unclip beacon from wall (Command Strip remains)
2. Open battery compartment (twist or slide)
3. Replace CR2032 battery (available at any store, $2-5)
4. Close compartment
5. Reattach to wall

**Frequency**: Every 1-2 years

### Troubleshooting

**Beacon not detected**:
- Check battery level
- Verify beacon is powered on (LED blinks)
- Check Bluetooth is enabled on guest device
- Move closer to beacon (within 5 meters)
- Check beacon configuration in Kontakt.io panel

**Incorrect location detected**:
- Multiple beacons too close together
- Guest between two beacons (ambiguous)
- Solution: Use zone-based detection (not precise coordinates)

**Orders missing table number**:
- Beacon metadata missing `tableNumber` field
- Update beacon configuration in database
- Restart guest portal app

---

## Cost-Benefit Analysis

### Total Investment

| Item | Cost |
|------|------|
| 20 Kontakt.io beacons | $500 |
| 3M Command Strips | $10 |
| Kontakt.io management platform | $0-50/month |
| **Year 1 Total** | **$510-1,110** |
| **Year 2+ Total** | **$0-600/year** |

### Benefits

| Benefit | Impact | Annual Value |
|---------|--------|--------------|
| **Increased restaurant orders** | +30% (guests can order from table) | **$5,000+** |
| **Reduced staff coordination** | 2 hours/day saved | **$10,000+** |
| **Fewer delivery mistakes** | -50% errors (orders tagged with location) | **$1,000+** |
| **Improved guest satisfaction** | +10 NPS | **Priceless** |
| **Contactless spa access** | Hygiene, convenience | **$2,000+** |

**ROI**: 6-12 months

---

## Next Steps

1. **Order beacons** (Week 1)
2. **Plan placement** (Week 1)
3. **Configure beacons** (Week 2)
4. **Install beacons** (Week 2)
5. **Add to database** (Week 2)
6. **Test location detection** (Week 2)
7. **Train staff** (Week 3)
8. **Go live!** (Week 3)

---

## Support

**Questions?**
- Documentation: `.agent/docs/beacon-technology-analysis.md`
- Kontakt.io support: [support.kontakt.io](https://support.kontakt.io)
- Web Bluetooth API: [developer.mozilla.org/Web_Bluetooth_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)

**Issues?**
- Check battery levels
- Verify beacon configuration
- Test Bluetooth on guest device
- Contact support: support@yourdomain.com
