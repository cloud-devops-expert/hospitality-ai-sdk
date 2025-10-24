# Beacon Technology Analysis for Guest Portal

## Overview

Beacons enable **precise indoor positioning** for location-aware guest services. Combined with WebRTC P2P, this creates a powerful local-first guest portal.

## Technology Stack

### 1. Beacon Protocols

#### iBeacon (Apple)
- **Range**: 1cm - 70m
- **Accuracy**: ±1-3 meters
- **Battery Life**: 1-2 years (CR2032 battery)
- **Cost**: $10-30 per beacon
- **Support**: iOS native, Android via libraries
- **Use Case**: General proximity detection

#### Eddystone (Google, open source)
- **Range**: 1cm - 100m
- **Accuracy**: ±1-3 meters
- **Battery Life**: 1-2 years
- **Cost**: $10-30 per beacon
- **Support**: iOS/Android via libraries
- **Features**: Multiple frame types (URL, UID, TLM)
- **Use Case**: Web-based interactions (Physical Web)

#### AltBeacon (Open source)
- **Range**: Similar to iBeacon
- **Cost**: $10-30 per beacon
- **Support**: iOS/Android
- **Use Case**: Vendor-neutral alternative

### 2. Vendor Comparison

| Vendor | Technology | Cost/Beacon | Battery Life | Range | Features |
|--------|-----------|-------------|--------------|-------|----------|
| **Estimote** | iBeacon, Eddystone | $20-50 | 1-2 years | 70m | Cloud management, mesh networking |
| **Kontakt.io** | iBeacon, Eddystone | $15-40 | 1-2 years | 100m | Enterprise management, analytics |
| **Gimbal** | Proprietary | $25-60 | 2-3 years | 50m | Privacy-focused, geofencing |
| **Radius Networks** | iBeacon, AltBeacon | $10-30 | 1-2 years | 70m | Developer-friendly, open source |
| **Generic (AliExpress)** | iBeacon, Eddystone | $5-15 | 6-12 months | 50m | Budget option, basic features |

### 3. Recommended Vendor: **Kontakt.io**

**Why**:
- ✅ Enterprise-grade reliability
- ✅ Multi-protocol support (iBeacon + Eddystone)
- ✅ Web-based management console
- ✅ API for programmatic configuration
- ✅ Strong battery life (1-2 years)
- ✅ Reasonable cost ($15-40 per beacon)
- ✅ Excellent documentation
- ✅ Used by hotels, stadiums, airports

**Cost for 50-room hotel**:
- 20 beacons (restaurant, spa, lobby, key rooms) × $25 = **$500 one-time**
- Management platform: **$0-50/month** (free tier available)

---

## Web API Integration

### Option 1: Web Bluetooth API (Recommended for Web Apps)

**Pros**:
- ✅ Native browser support (Chrome, Edge, Opera)
- ✅ No app installation required
- ✅ Direct beacon scanning from web app
- ✅ Low latency (<100ms)
- ✅ Works on Android Chrome, Chrome OS

**Cons**:
- ❌ Not supported on iOS Safari (iOS limitation, not technical)
- ❌ Requires HTTPS
- ❌ User must grant Bluetooth permission

**Browser Support**:
- ✅ Chrome (Android, Desktop, Chrome OS)
- ✅ Edge (Desktop)
- ✅ Opera (Android, Desktop)
- ❌ Safari (iOS - Apple blocks Web Bluetooth API)
- ❌ Firefox (disabled by default)

**Workaround for iOS**: Use native mobile app (React Native) or fallback to WiFi-based location

### Option 2: Native Mobile App (React Native)

**Pros**:
- ✅ Works on iOS and Android
- ✅ Background beacon scanning
- ✅ Better battery optimization
- ✅ More reliable signal processing

**Cons**:
- ❌ Requires app installation
- ❌ More complex to develop

**Libraries**:
- `react-native-beacons-manager` (iBeacon + Eddystone)
- `react-native-ibeacon` (iOS only)

### Option 3: Hybrid Approach (Recommended)

**Strategy**:
1. **iOS users**: Native mobile app (React Native + iBeacon)
2. **Android users**: Web app (Web Bluetooth API + Eddystone)
3. **Fallback**: WiFi-based location (IP range, mDNS)

---

## Beacon Placement Strategy

### 50-Room Hotel Example

**Zone 1: Restaurant (5 beacons)**
- 1 beacon per table area (4 beacons for 4 table zones)
- 1 beacon at entrance/bar

**Zone 2: Spa/Pool (3 beacons)**
- 1 beacon at spa reception
- 1 beacon at pool area
- 1 beacon at gym

**Zone 3: Lobby (3 beacons)**
- 1 beacon at front desk
- 1 beacon at concierge
- 1 beacon at lounge area

**Zone 4: Key Rooms (5 beacons)**
- 1 beacon per VIP suite (5 suites)

**Zone 5: Common Areas (4 beacons)**
- 1 beacon at elevator lobby (each floor: 2 floors)
- 1 beacon at business center
- 1 beacon at gift shop

**Total**: 20 beacons × $25 = **$500 one-time cost**

---

## Beacon Configuration

### Kontakt.io Beacon Configuration

```json
{
  "beacons": [
    {
      "beaconId": "restaurant-table-1",
      "uuid": "f7826da6-4fa2-4e98-8024-bc5b71e0893e",
      "major": 1,
      "minor": 1,
      "location": {
        "zone": "restaurant",
        "area": "table-1",
        "coordinates": { "x": 10, "y": 5 }
      },
      "transmitPower": -4,
      "interval": 200,
      "metadata": {
        "tableNumber": 1,
        "capacity": 4,
        "menu": "dinner-menu"
      }
    },
    {
      "beaconId": "spa-pool",
      "uuid": "f7826da6-4fa2-4e98-8024-bc5b71e0893e",
      "major": 2,
      "minor": 1,
      "location": {
        "zone": "spa",
        "area": "pool",
        "coordinates": { "x": 20, "y": 10 }
      },
      "transmitPower": -4,
      "interval": 200,
      "metadata": {
        "amenity": "pool",
        "accessControl": true
      }
    }
  ]
}
```

---

## Use Cases with Beacons

### Use Case 1: Table-Specific Restaurant Menu

**Scenario**: Guest sits at table 5, scans QR code (or auto-detects beacon)

**Flow**:
```
Guest Device
    ├─ Scans QR code (or opens app)
    ├─ Detects beacon "restaurant-table-5" via Web Bluetooth
    ├─ Determines exact table location
    ├─ Shows table-specific menu
    ├─ Places order via WebRTC P2P → Kitchen Display
    └─ Receives order confirmation
```

**Benefits**:
- ✅ No need to ask "what table are you at?"
- ✅ Menu personalized to table (e.g., patio vs. indoor)
- ✅ Orders tagged with exact table location
- ✅ Staff knows exact delivery location

---

### Use Case 2: Spa/Pool Access Control

**Scenario**: Guest approaches pool, requests access via app

**Flow**:
```
Guest Device
    ├─ Detects beacon "spa-pool" via Web Bluetooth
    ├─ Shows "Request Pool Access" button
    ├─ Guest taps button
    ├─ Request sent via WebRTC P2P → Staff iPad
    ├─ Staff approves/denies (checks reservation)
    └─ Door lock opens via IoT command (if approved)
```

**Benefits**:
- ✅ Contactless access control
- ✅ Only works when guest is physically at pool
- ✅ Staff can verify guest before granting access
- ✅ Audit trail (who accessed when)

---

### Use Case 3: Room Service (In-Room Orders)

**Scenario**: Guest in room 205, orders room service

**Flow**:
```
Guest Device
    ├─ Detects beacon "room-205" via Web Bluetooth
    ├─ Shows room service menu
    ├─ Places order via WebRTC P2P → Kitchen
    ├─ Order tagged with room number (from beacon)
    └─ Staff delivers to correct room
```

**Benefits**:
- ✅ No need to manually enter room number
- ✅ Order automatically tagged with room location
- ✅ Prevents delivery mistakes

---

### Use Case 4: Concierge (Lobby Assistance)

**Scenario**: Guest in lobby, needs recommendations

**Flow**:
```
Guest Device
    ├─ Detects beacon "lobby-concierge" via Web Bluetooth
    ├─ Shows "Ask Concierge" button
    ├─ Guest types question or uses voice
    ├─ Question sent via WebRTC P2P → Concierge iPad
    ├─ Concierge responds (text or call)
    └─ Guest receives personalized recommendations
```

**Benefits**:
- ✅ No need to approach desk (shy guests)
- ✅ Concierge knows guest is nearby
- ✅ Can offer proactive assistance

---

## Beacon Data Structure

### Beacon Registry (PostgreSQL Table)

```sql
CREATE TABLE beacons (
  beacon_id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),

  -- Beacon hardware identifiers
  uuid UUID NOT NULL, -- iBeacon/Eddystone UUID
  major INTEGER NOT NULL, -- iBeacon major
  minor INTEGER NOT NULL, -- iBeacon minor

  -- Location metadata
  zone VARCHAR(50) NOT NULL, -- 'restaurant', 'spa', 'lobby', 'room'
  area VARCHAR(100) NOT NULL, -- 'table-1', 'pool', 'concierge', 'room-205'
  coordinates JSONB, -- { "x": 10, "y": 5, "floor": 1 }

  -- Configuration
  transmit_power INTEGER DEFAULT -4, -- dBm
  advertising_interval INTEGER DEFAULT 200, -- ms

  -- Business logic
  metadata JSONB, -- { "tableNumber": 1, "capacity": 4, "amenity": "pool" }

  -- Features enabled
  features TEXT[] DEFAULT ARRAY['orders', 'access-control', 'concierge'],

  -- Status
  is_active BOOLEAN DEFAULT true,
  battery_level INTEGER, -- Percentage (if reported)
  last_seen TIMESTAMPTZ, -- Last time beacon was detected

  -- RLS
  valid_period TZTIMERANGE DEFAULT TZTIMERANGE(CURRENT_TIMESTAMP, NULL),
  created_by UUID NOT NULL REFERENCES users(user_id),

  UNIQUE(tenant_id, uuid, major, minor)
);

-- RLS policies
ALTER TABLE beacons ENABLE ROW LEVEL SECURITY;

CREATE POLICY beacons_tenant_isolation ON beacons
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## Web Bluetooth API Implementation

### Scanning for Beacons

```typescript
// lib/beacon/web-bluetooth-scanner.ts

export interface BeaconDetection {
  beaconId: string;
  uuid: string;
  major: number;
  minor: number;
  rssi: number; // Signal strength
  distance: number; // Estimated distance in meters
  zone: string;
  area: string;
  metadata: Record<string, any>;
}

export class WebBluetoothBeaconScanner {
  private scanning = false;
  private detectedBeacons = new Map<string, BeaconDetection>();

  async requestPermission(): Promise<boolean> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API not supported');
    }

    try {
      // Request Bluetooth access
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'],
      });

      return true;
    } catch (error) {
      console.error('Bluetooth permission denied:', error);
      return false;
    }
  }

  async startScanning(
    tenantId: string,
    onBeaconDetected: (beacon: BeaconDetection) => void
  ): Promise<void> {
    if (this.scanning) return;

    this.scanning = true;

    // Scan for Eddystone beacons (Web Bluetooth API works better with Eddystone)
    const scan = await navigator.bluetooth.requestLEScan({
      filters: [
        { services: ['0000feaa-0000-1000-8000-00805f9b34fb'] }, // Eddystone UUID
      ],
      keepRepeatedDevices: true,
    });

    navigator.bluetooth.addEventListener('advertisementreceived', async (event) => {
      const device = event.device;
      const rssi = event.rssi;

      // Parse Eddystone frame
      const beacon = await this.parseEddystoneFrame(event, tenantId);

      if (beacon) {
        beacon.rssi = rssi;
        beacon.distance = this.calculateDistance(rssi, -59); // -59 is typical calibrated RSSI at 1m

        this.detectedBeacons.set(beacon.beaconId, beacon);
        onBeaconDetected(beacon);
      }
    });
  }

  stopScanning(): void {
    this.scanning = false;
    // Note: Web Bluetooth API doesn't have explicit stop for LEScan
    // Beacons will stop being detected when page unloads
  }

  private async parseEddystoneFrame(
    event: BluetoothAdvertisingEvent,
    tenantId: string
  ): Promise<BeaconDetection | null> {
    const serviceData = event.serviceData;

    if (!serviceData) return null;

    // Parse Eddystone-UID frame
    const eddystoneUuid = '0000feaa-0000-1000-8000-00805f9b34fb';
    const data = serviceData.get(eddystoneUuid);

    if (!data) return null;

    const frame = new Uint8Array(data.buffer);
    const frameType = frame[0];

    if (frameType !== 0x00) return null; // Eddystone-UID

    // Extract namespace (10 bytes) and instance (6 bytes)
    const namespace = Array.from(frame.slice(2, 12))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const instance = Array.from(frame.slice(12, 18))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Look up beacon in database
    const beacon = await this.lookupBeacon(tenantId, namespace, instance);

    return beacon;
  }

  private async lookupBeacon(
    tenantId: string,
    namespace: string,
    instance: string
  ): Promise<BeaconDetection | null> {
    // Query database for beacon metadata
    const response = await fetch(`/api/beacons/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, namespace, instance }),
    });

    if (!response.ok) return null;

    return response.json();
  }

  private calculateDistance(rssi: number, calibratedRssi: number): number {
    // Path loss formula: RSSI = calibratedRssi - 10 * n * log10(distance)
    // where n = path loss exponent (typically 2-4, use 2 for open space)
    const n = 2;
    const distance = Math.pow(10, (calibratedRssi - rssi) / (10 * n));

    return Math.max(0.1, Math.min(100, distance)); // Clamp to 0.1m - 100m
  }

  getClosestBeacon(): BeaconDetection | null {
    if (this.detectedBeacons.size === 0) return null;

    let closest: BeaconDetection | null = null;
    let minDistance = Infinity;

    for (const beacon of this.detectedBeacons.values()) {
      if (beacon.distance < minDistance) {
        minDistance = beacon.distance;
        closest = beacon;
      }
    }

    return closest;
  }

  getBeaconsInZone(zone: string): BeaconDetection[] {
    return Array.from(this.detectedBeacons.values())
      .filter(b => b.zone === zone)
      .sort((a, b) => a.distance - b.distance);
  }
}
```

---

## Accuracy Considerations

### Signal Strength (RSSI) Variability

**Factors affecting accuracy**:
- **Physical obstacles**: Walls, furniture, people
- **Interference**: Other Bluetooth devices, WiFi
- **Beacon orientation**: Antenna direction
- **Human body**: Guest holding phone blocks signal

**Mitigation**:
- ✅ Use **multiple beacons** per zone (triangulation)
- ✅ Apply **Kalman filtering** to smooth RSSI values
- ✅ Use **zone-based** location (not precise coordinates)
- ✅ Combine with **WiFi-based** location (fallback)

### Distance Estimation

**Accuracy**:
- **< 1 meter**: ±0.5m (very close, highly accurate)
- **1-5 meters**: ±1-2m (close, accurate)
- **5-20 meters**: ±3-5m (medium, less accurate)
- **> 20 meters**: ±10m+ (far, unreliable)

**Best practice**:
- ✅ Use **zone-based** detection (not precise distance)
- ✅ "Guest is at table 5" (not "guest is 3.2m from beacon")
- ✅ Trigger actions when **distance < threshold** (e.g., < 3m)

---

## Cost-Benefit Analysis

### Investment

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| **Beacons** (Kontakt.io) | 20 | $25 | $500 |
| **Management Platform** | 1 property | $0-50/mo | $0-600/year |
| **Installation** (DIY) | - | - | $0 |
| **Total (Year 1)** | - | - | **$500-1,100** |
| **Total (Year 2+)** | - | - | **$0-600/year** |

### Benefits

| Benefit | Impact | Annual Value |
|---------|--------|--------------|
| **Increased restaurant orders** | +30% | $5,000+ |
| **Reduced staff coordination time** | 2 hours/day | $10,000+ |
| **Improved guest satisfaction** | +10 NPS | Priceless |
| **Contactless spa access** | Hygiene, convenience | $2,000+ |
| **Fewer delivery mistakes** | -50% errors | $1,000+ |

**ROI**: ~6-12 months

---

## Privacy & Security

### Guest Privacy

**Concerns**:
- ❌ Tracking guest movements without consent
- ❌ Storing location history
- ❌ Sharing data with third parties

**Solutions**:
- ✅ **Opt-in**: Guest must open app to enable beacon scanning
- ✅ **No persistent tracking**: Location detected only when app is open
- ✅ **Transparent**: Show "Using your location for [purpose]" message
- ✅ **Data minimization**: Only store current location, not history
- ✅ **GDPR compliance**: Right to delete, data portability

### Beacon Security

**Risks**:
- ❌ Beacon spoofing (malicious beacons)
- ❌ Signal jamming
- ❌ Unauthorized beacon configuration

**Solutions**:
- ✅ **Encrypted beacons**: Eddystone-EID (encrypted identifier)
- ✅ **Server-side validation**: Verify beacon metadata from database
- ✅ **Beacon management**: Cloud-based configuration, firmware updates
- ✅ **Physical security**: Beacons in tamper-proof enclosures

---

## Next Steps

1. **Beacon hardware** (Phase 2):
   - [ ] Order 5 Kontakt.io beacons for pilot (restaurant only)
   - [ ] Test signal strength and accuracy
   - [ ] Measure battery life

2. **Web Bluetooth integration** (Phase 2):
   - [ ] Implement `WebBluetoothBeaconScanner` class
   - [ ] Test on Android Chrome
   - [ ] Create iOS native app (React Native + iBeacon)

3. **Guest portal** (Phase 2):
   - [ ] Build table-specific menu UI
   - [ ] Integrate with WebRTC P2P for orders
   - [ ] Test end-to-end flow

4. **Deployment guide** (Phase 2):
   - [ ] Create beacon placement guide
   - [ ] Document installation process
   - [ ] Train hotel staff

---

## Conclusion

Beacons enable **precise indoor positioning** at low cost ($500 one-time for 20 beacons). Combined with **WebRTC P2P**, this creates a powerful **local-first guest portal** that:

- ✅ Works without internet (beacons + local P2P)
- ✅ Provides instant feedback (50ms latency)
- ✅ Reduces costs (no cloud API calls)
- ✅ Improves guest experience (location-aware services)

**Recommended approach**:
- Phase 1-2: WebRTC P2P only (WiFi-based location)
- Phase 2: Add beacons for pilot (5 beacons in restaurant)
- Phase 3: Scale beacons to entire property (20 beacons)
