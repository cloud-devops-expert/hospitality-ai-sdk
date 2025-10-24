# Ubiquiti UniFi Integration Guide

## Overview

Ubiquiti UniFi is the **#1 WiFi solution for small-to-medium hotels** (60%+ market share in <50 room properties). They provide:

- **WiFi Access Points** with built-in BLE beacons
- **Captive Portal** for guest WiFi authentication
- **Network Controller** with APIs for management
- **IoT Gateway** for smart room devices

**Perfect for our use case**: Most hotels we target already have UniFi infrastructure.

---

## Why Ubiquiti UniFi?

### Market Fit

**Target Market**: Small-to-medium hotels (<50 rooms, 60% of market)

**Why they use UniFi**:
- ✅ **Affordable**: $100-150 per AP (vs $500+ for Cisco Meraki)
- ✅ **Easy to manage**: Single controller for entire property
- ✅ **Reliable**: Enterprise-grade at consumer price
- ✅ **No licensing fees**: Unlike Meraki ($100/year per AP)
- ✅ **Self-hosted**: Controller runs on-premise or cloud

**Market Share**:
- Small hotels (<20 rooms): **70%** use UniFi
- Medium hotels (20-50 rooms): **50%** use UniFi
- Large hotels (50+ rooms): **20%** use UniFi (shift to Meraki/Aruba)

### Technical Capabilities

**WiFi + Beacons**:
- UniFi 6 APs have built-in BLE beacons (iBeacon/Eddystone)
- 1 AP per 1000-1500 sq ft → perfect beacon density for hotels
- Configure beacon UUID/major/minor via UniFi Controller

**Captive Portal**:
- Guest WiFi requires login (email, room number, etc.)
- Can redirect to our guest portal after authentication
- API to verify guest is on property WiFi

**Network Controller**:
- REST API for all UniFi management
- WebSocket for real-time events (guest connects, disconnects)
- Can query connected clients, location (per AP)

**IoT Support**:
- UniFi Connect (smart home integration)
- MQTT support (for room sensors, thermostats, locks)

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Hotel UniFi Infrastructure                  │
│                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ UniFi AP      │  │ UniFi AP      │  │ UniFi AP   │ │
│  │ (Restaurant)  │  │ (Spa/Pool)    │  │ (Lobby)    │ │
│  │               │  │               │  │            │ │
│  │ WiFi + BLE    │  │ WiFi + BLE    │  │ WiFi + BLE │ │
│  │ Beacon        │  │ Beacon        │  │ Beacon     │ │
│  └───────┬───────┘  └───────┬───────┘  └──────┬─────┘ │
│          │                  │                  │        │
│          └──────────────────┴──────────────────┘        │
│                             │                           │
│                    ┌────────▼────────┐                  │
│                    │ UniFi Network   │                  │
│                    │   Controller    │                  │
│                    │  (self-hosted)  │                  │
│                    └────────┬────────┘                  │
│                             │                           │
└─────────────────────────────┼───────────────────────────┘
                              │
                              │ UniFi API (HTTPS)
                              │
                              ▼
                  ┌────────────────────────┐
                  │   Our Platform         │
                  │                        │
                  │ 1. Authenticate        │ ← UniFi API login
                  │ 2. Fetch AP list       │ ← GET /api/s/{site}/stat/device
                  │ 3. Get beacon configs  │ ← AP BLE settings
                  │ 4. Monitor clients     │ ← WebSocket events
                  │ 5. Map to zones        │ ← Our software
                  └────────┬───────────────┘
                           │
                           │ Network context + Beacons
                           ▼
                  ┌────────────────────────┐
                  │    Guest Device        │
                  │   (Web App/Mobile)     │
                  │                        │
                  │ 1. Connect to WiFi     │ ← UniFi Captive Portal
                  │ 2. Detect beacons      │ ← Web Bluetooth API
                  │ 3. Verify on-property  │ ← Check client in UniFi
                  │ 4. Enable features     │ ← Our guest portal
                  │ 5. WebRTC P2P orders   │ ← Local network
                  └────────────────────────┘
```

---

## UniFi API Integration

### Step 1: Authentication

```typescript
// lib/integrations/unifi/client.ts

export class UniFiClient {
  private baseUrl: string; // https://unifi.hotel.com:8443
  private cookie: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Authenticate with UniFi Controller
   */
  async login(username: string, password: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('UniFi authentication failed');
    }

    // Extract session cookie
    this.cookie = response.headers.get('set-cookie') || null;
  }

  /**
   * Make authenticated request to UniFi API
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': this.cookie || '',
      },
    });

    if (!response.ok) {
      throw new Error(`UniFi API error: ${response.status}`);
    }

    return response.json();
  }
}
```

---

### Step 2: Fetch Access Points (WiFi + Beacons)

```typescript
/**
 * Get list of UniFi Access Points
 */
async getAccessPoints(site: string = 'default'): Promise<UniFiAccessPoint[]> {
  const response = await this.request(`/api/s/${site}/stat/device`);

  // Filter to APs only (not switches, gateways, etc.)
  const accessPoints = response.data.filter((device: any) => device.type === 'uap');

  return accessPoints.map((ap: any) => ({
    id: ap._id,
    mac: ap.mac,
    name: ap.name,
    model: ap.model, // e.g., 'U6-Lite', 'U6-LR', 'U6-Pro'
    ip: ap.ip,

    // Location (configured in UniFi Controller)
    location: {
      x: ap.x || 0,
      y: ap.y || 0,
      floor: ap.map_id || 'default',
    },

    // BLE Beacon configuration
    ble: {
      enabled: ap.ble_enabled || false,
      uuid: ap.ble_uuid || null,
      major: ap.ble_major || 1,
      minor: ap.ble_minor || 1,
    },

    // Stats
    clients: ap.num_sta || 0, // Connected clients
    uptime: ap.uptime || 0,
    status: ap.state === 1 ? 'online' : 'offline',
  }));
}

interface UniFiAccessPoint {
  id: string;
  mac: string;
  name: string;
  model: string;
  ip: string;
  location: { x: number; y: number; floor: string };
  ble: { enabled: boolean; uuid: string | null; major: number; minor: number };
  clients: number;
  uptime: number;
  status: 'online' | 'offline';
}
```

---

### Step 3: Configure Beacons (Enable BLE on APs)

```typescript
/**
 * Enable BLE beacon on UniFi AP
 */
async enableBeacon(
  site: string,
  apId: string,
  config: {
    uuid: string;
    major: number;
    minor: number;
  }
): Promise<void> {
  await this.request(`/api/s/${site}/rest/device/${apId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ble_enabled: true,
      ble_uuid: config.uuid,
      ble_major: config.major,
      ble_minor: config.minor,
    }),
  });
}
```

**Example: Configure restaurant AP as beacon**:
```typescript
await unifi.enableBeacon('default', 'ap-restaurant-id', {
  uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
  major: 1,
  minor: 1,
});
```

---

### Step 4: Monitor Connected Clients

```typescript
/**
 * Get list of connected WiFi clients
 */
async getClients(site: string = 'default'): Promise<UniFiClient[]> {
  const response = await this.request(`/api/s/${site}/stat/sta`);

  return response.data.map((client: any) => ({
    mac: client.mac,
    ip: client.ip,
    hostname: client.hostname || 'Unknown',

    // Which AP is client connected to?
    apMac: client.ap_mac,
    apName: client.ap_name || 'Unknown',

    // Signal strength
    rssi: client.rssi || 0,
    signal: client.signal || 0,

    // Connection info
    connectedAt: new Date(client.first_seen * 1000),
    lastSeen: new Date(client.last_seen * 1000),

    // Guest info (if using captive portal)
    authorized: client.authorized || false,
    guestName: client.name || null,
    guestEmail: client.email || null,
  }));
}

interface UniFiClient {
  mac: string;
  ip: string;
  hostname: string;
  apMac: string;
  apName: string;
  rssi: number;
  signal: number;
  connectedAt: Date;
  lastSeen: Date;
  authorized: boolean;
  guestName: string | null;
  guestEmail: string | null;
}
```

---

### Step 5: Verify Guest is On-Property

```typescript
/**
 * Check if guest device is connected to property WiFi
 */
async isGuestOnProperty(site: string, guestMac: string): Promise<boolean> {
  const clients = await this.getClients(site);

  const guest = clients.find(c => c.mac === guestMac);

  return guest !== undefined && guest.authorized;
}

/**
 * Get guest's current location (which AP they're connected to)
 */
async getGuestLocation(site: string, guestMac: string): Promise<{ zone: string; area: string } | null> {
  const clients = await this.getClients(site);
  const accessPoints = await this.getAccessPoints(site);

  const guest = clients.find(c => c.mac === guestMac);
  if (!guest) return null;

  const ap = accessPoints.find(a => a.mac === guest.apMac);
  if (!ap) return null;

  // Map AP name to zone (configured in UniFi Controller)
  // Example AP names: "Restaurant-AP", "Spa-Pool-AP", "Lobby-AP"
  const zone = this.mapAPToZone(ap.name);

  return { zone, area: ap.name };
}

private mapAPToZone(apName: string): string {
  if (apName.includes('Restaurant')) return 'restaurant';
  if (apName.includes('Spa') || apName.includes('Pool')) return 'spa';
  if (apName.includes('Lobby')) return 'lobby';
  if (apName.includes('Room')) return 'room';
  return 'unknown';
}
```

---

### Step 6: WebSocket Events (Real-Time)

```typescript
/**
 * Subscribe to real-time UniFi events
 */
async subscribeToEvents(site: string, onEvent: (event: UniFiEvent) => void): Promise<void> {
  const ws = new WebSocket(`${this.baseUrl}/wss/s/${site}/events`, {
    headers: { 'Cookie': this.cookie || '' },
  });

  ws.on('message', (data: string) => {
    const event = JSON.parse(data);

    switch (event.key) {
      case 'EVT_WU_Connected':
        // Guest connected to WiFi
        onEvent({
          type: 'guest-connected',
          mac: event.msg.split(' ')[0],
          apName: event.ap,
          timestamp: event.time,
        });
        break;

      case 'EVT_WU_Disconnected':
        // Guest disconnected from WiFi
        onEvent({
          type: 'guest-disconnected',
          mac: event.msg.split(' ')[0],
          timestamp: event.time,
        });
        break;

      case 'EVT_WU_Roamed':
        // Guest moved to different AP (zone change!)
        onEvent({
          type: 'guest-roamed',
          mac: event.msg.split(' ')[0],
          fromAP: event.msg.split('from ')[1].split(' to ')[0],
          toAP: event.msg.split(' to ')[1],
          timestamp: event.time,
        });
        break;
    }
  });
}

interface UniFiEvent {
  type: 'guest-connected' | 'guest-disconnected' | 'guest-roamed';
  mac: string;
  apName?: string;
  fromAP?: string;
  toAP?: string;
  timestamp: number;
}
```

---

## Captive Portal Integration

### Step 1: Configure UniFi Captive Portal

**In UniFi Controller**:
1. Settings → Guest Control → Enable Guest Portal
2. Authentication: Email, Password, or Room Number
3. Redirect URL: `https://yourdomain.com/guest-portal?session={session_id}`
4. Customize portal (logo, colors, terms)

### Step 2: Handle Redirect from Captive Portal

```typescript
// app/guest-portal/page.tsx

export default async function GuestPortalPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    return <div>Please connect to hotel WiFi first</div>;
  }

  // Verify session with UniFi
  const guestInfo = await verifyUniFiSession(sessionId);

  if (!guestInfo) {
    return <div>Invalid session. Please reconnect to WiFi.</div>;
  }

  // Guest is authenticated and on property WiFi
  return (
    <GuestPortalUI
      guestMac={guestInfo.mac}
      guestEmail={guestInfo.email}
      currentZone={guestInfo.zone}
    />
  );
}
```

### Step 3: Authorize Guest Session

```typescript
/**
 * Verify UniFi guest session
 */
async function verifyUniFiSession(sessionId: string): Promise<GuestInfo | null> {
  const unifi = new UniFiClient(process.env.UNIFI_URL!);
  await unifi.login(process.env.UNIFI_USERNAME!, process.env.UNIFI_PASSWORD!);

  // Get guest info from session
  const response = await unifi.request(`/api/s/default/stat/guest/${sessionId}`);

  if (!response.data || response.data.length === 0) {
    return null;
  }

  const guest = response.data[0];

  return {
    mac: guest.mac,
    ip: guest.ip,
    email: guest.email || null,
    roomNumber: guest.room_number || null,
    zone: await unifi.getGuestLocation('default', guest.mac).then(l => l?.zone || 'unknown'),
  };
}

interface GuestInfo {
  mac: string;
  ip: string;
  email: string | null;
  roomNumber: string | null;
  zone: string;
}
```

---

## Combined: WiFi Location + Beacon Location

### Coarse Location (WiFi AP)

**Accuracy**: Per-room or per-zone (which AP guest is connected to)

```typescript
// Guest connected to "Restaurant-AP" → zone: 'restaurant'
const wifiLocation = await unifi.getGuestLocation('default', guestMac);
console.log(wifiLocation); // { zone: 'restaurant', area: 'Restaurant-AP' }
```

**Use case**: Know guest is "in restaurant" but not exact table

---

### Fine Location (BLE Beacon)

**Accuracy**: ±1-3 meters (which table, which area of room)

```typescript
// Guest device detects beacon with minor: 5 → Table 5
const beaconLocation = await beaconScanner.getLocationContext();
console.log(beaconLocation); // { zone: 'restaurant', area: 'table-5', distance: 1.2m }
```

**Use case**: Know guest is "at table 5" (precise)

---

### Hybrid Approach (Best)

```typescript
// Combine WiFi coarse location + beacon fine location
async function getGuestLocationHybrid(guestMac: string): Promise<LocationContext> {
  // Step 1: WiFi coarse location (fast, always available)
  const wifiLocation = await unifi.getGuestLocation('default', guestMac);

  // Step 2: Beacon fine location (slower, requires Bluetooth permission)
  const beaconLocation = await beaconScanner.getLocationContext();

  // Step 3: Combine (beacon overrides WiFi if available)
  return {
    zone: beaconLocation?.zone || wifiLocation?.zone || 'unknown',
    area: beaconLocation?.area || wifiLocation?.area || 'unknown',
    accuracy: beaconLocation ? 'high' : 'medium',
    method: beaconLocation ? 'beacon' : 'wifi',
  };
}
```

**Result**:
- Guest connects to WiFi → immediate coarse location (restaurant zone)
- Guest grants Bluetooth permission → upgrade to fine location (table 5)
- Best of both worlds: fast WiFi fallback + precise beacon location

---

## UniFi IoT Integration (Bonus)

### Smart Room Devices

UniFi supports MQTT for IoT devices (thermostats, locks, sensors):

```typescript
import mqtt from 'mqtt';

// Connect to UniFi MQTT broker
const client = mqtt.connect('mqtt://unifi.local:1883', {
  username: 'unifi-iot',
  password: process.env.UNIFI_IOT_PASSWORD,
});

// Subscribe to room sensor events
client.subscribe('unifi/room/+/sensor/#');

client.on('message', (topic, message) => {
  // topic: 'unifi/room/205/sensor/temperature'
  // message: '22.5'

  const roomNumber = topic.split('/')[2];
  const sensorType = topic.split('/')[4];
  const value = parseFloat(message.toString());

  console.log(`Room ${roomNumber} ${sensorType}: ${value}`);

  // Send to guest via WebRTC P2P
  p2pConnection.send({
    type: 'iot-command',
    command: {
      commandId: `sensor-${Date.now()}`,
      deviceId: `room-${roomNumber}-${sensorType}`,
      deviceType: 'sensor',
      action: 'read-status',
      parameters: { value },
    },
  });
});

// Control thermostat via MQTT
client.publish('unifi/room/205/thermostat/set', JSON.stringify({
  temperature: 23,
  mode: 'cool',
}));
```

---

## Deployment Checklist

### Phase 1: Discovery (Sales Call)

- [ ] Ask: "Do you use UniFi WiFi?" (likely yes for <50 room hotels)
- [ ] Request: UniFi Controller URL (https://unifi.hotel.com:8443)
- [ ] Request: API credentials (username/password, or create dedicated user)
- [ ] Check: UniFi version (must be 6.0+ for BLE beacons)

### Phase 2: API Integration (Week 1)

- [ ] Authenticate with UniFi Controller
- [ ] Fetch list of Access Points
- [ ] Check which APs have BLE enabled
- [ ] If not enabled, enable BLE on all APs (configure UUID/major/minor)
- [ ] Map APs to zones (restaurant, spa, lobby, etc.)

### Phase 3: Testing (Week 2)

- [ ] Hotel staff connects to WiFi
- [ ] Verify client appears in UniFi Controller
- [ ] Staff opens guest portal (redirect from captive portal)
- [ ] Verify zone detection (which AP they're connected to)
- [ ] Staff grants Bluetooth permission
- [ ] Verify beacon detection (fine location)
- [ ] Test ordering flow (WiFi + beacon → WebRTC P2P → kitchen)

### Phase 4: Captive Portal (Week 2)

- [ ] Configure UniFi captive portal
- [ ] Set redirect URL to our guest portal
- [ ] Test guest WiFi login flow
- [ ] Verify session authentication

### Phase 5: Go Live (Week 3)

- [ ] Enable guest portal for property
- [ ] Train staff on location-aware features
- [ ] Monitor via UniFi Controller (connected clients, roaming events)

---

## Code Example: Complete Integration

```typescript
// lib/integrations/unifi/hospitality-integration.ts

import { UniFiClient } from './client';
import { WebBluetoothBeaconScanner } from '../../beacon/web-bluetooth-scanner';
import { P2PConnection } from '../../webrtc/p2p-connection';

export class UniFiHospitalityIntegration {
  private unifi: UniFiClient;
  private beaconScanner: WebBluetoothBeaconScanner;
  private p2p: P2PConnection;

  constructor(config: {
    unifiUrl: string;
    unifiUsername: string;
    unifiPassword: string;
    tenantId: string;
  }) {
    // UniFi API client
    this.unifi = new UniFiClient(config.unifiUrl);

    // Beacon scanner (for fine location)
    this.beaconScanner = new WebBluetoothBeaconScanner({
      tenantId: config.tenantId,
      onZoneChanged: this.handleZoneChange.bind(this),
    });

    // WebRTC P2P (for local orders)
    this.p2p = new P2PConnection({
      signalingServers: ['wss://signaling.yourdomain.com'],
      tenantId: config.tenantId,
      deviceInfo: { type: 'guest', name: 'Guest Device', capabilities: ['orders'] },
    });
  }

  /**
   * Initialize integration
   */
  async initialize(guestMac: string): Promise<void> {
    // Step 1: Authenticate with UniFi
    await this.unifi.login(
      process.env.UNIFI_USERNAME!,
      process.env.UNIFI_PASSWORD!
    );

    // Step 2: Verify guest is on property WiFi
    const isOnProperty = await this.unifi.isGuestOnProperty('default', guestMac);
    if (!isOnProperty) {
      throw new Error('Guest not connected to property WiFi');
    }

    // Step 3: Get WiFi coarse location
    const wifiLocation = await this.unifi.getGuestLocation('default', guestMac);
    console.log('WiFi location:', wifiLocation);

    // Step 4: Start beacon scanning (fine location)
    await this.beaconScanner.startScanning();

    // Step 5: Connect to WebRTC P2P network
    await this.p2p.connect();

    console.log('✅ UniFi integration initialized');
  }

  /**
   * Get current location (WiFi + beacon hybrid)
   */
  async getCurrentLocation(guestMac: string) {
    const wifiLocation = await this.unifi.getGuestLocation('default', guestMac);
    const beaconLocation = this.beaconScanner.getLocationContext();

    return {
      zone: beaconLocation?.zone || wifiLocation?.zone || 'unknown',
      area: beaconLocation?.area || wifiLocation?.area || 'unknown',
      accuracy: beaconLocation?.closestBeacon ? 'high' : 'medium',
      method: beaconLocation?.closestBeacon ? 'beacon' : 'wifi',
    };
  }

  /**
   * Place order (location-aware)
   */
  async placeOrder(guestMac: string, items: any[]) {
    const location = await this.getCurrentLocation(guestMac);

    if (location.zone !== 'restaurant') {
      throw new Error('Restaurant ordering only available in restaurant zone');
    }

    const tableNumber = location.area.includes('table')
      ? parseInt(location.area.split('-')[1])
      : null;

    // Send order via WebRTC P2P (50ms, local network)
    this.p2p.send({
      type: 'order',
      order: {
        orderId: `order-${Date.now()}`,
        tableId: tableNumber,
        items,
        total: items.reduce((sum, item) => sum + item.quantity * item.price, 0),
        status: 'pending',
        location: location,
      },
    });

    console.log(`✅ Order placed for ${location.area} via WebRTC P2P`);
  }

  private handleZoneChange(zone: string | null): void {
    console.log(`🗺️ Zone changed: ${zone}`);

    // Trigger UI update based on zone
    // e.g., show restaurant menu when entering restaurant zone
  }
}
```

---

## Environment Variables

```bash
# .env

# UniFi Controller
UNIFI_URL=https://unifi.hotel.com:8443
UNIFI_USERNAME=admin
UNIFI_PASSWORD=your-password

# Or use dedicated API user (recommended)
UNIFI_API_USERNAME=hospitality-api
UNIFI_API_PASSWORD=secure-api-password

# UniFi Site (default: 'default')
UNIFI_SITE=default

# For IoT integration (optional)
UNIFI_MQTT_URL=mqtt://unifi.local:1883
UNIFI_IOT_PASSWORD=iot-password
```

---

## Summary

### What We Get from UniFi Integration

1. **WiFi Infrastructure** (already installed)
   - Access Points throughout property
   - Built-in BLE beacons (UniFi 6 series)
   - Network controller with API

2. **Captive Portal** (guest WiFi login)
   - Authenticate guests
   - Redirect to our guest portal
   - Verify guest is on-property

3. **Coarse Location** (which AP/zone)
   - Know guest is "in restaurant"
   - Real-time roaming events
   - No Bluetooth permission needed

4. **Fine Location** (beacon proximity)
   - Know guest is "at table 5"
   - ±1-3m accuracy
   - Requires Bluetooth permission

5. **IoT Gateway** (bonus)
   - Control smart room devices
   - MQTT for thermostats, locks, sensors

### Deployment

**Timeline**: 1-2 weeks (software-only API integration)
**Cost**: $0 (hotel already has UniFi)
**Hardware**: None (use existing infrastructure)

### Perfect for Our Strategy

✅ **Software-first**: Pure API integration, no hardware deployment
✅ **Ubiquitous**: 60%+ of target market already has UniFi
✅ **Zero cost**: Hotel already paid for WiFi infrastructure
✅ **Quick deployment**: 1-2 weeks vs 4-6 weeks for beacon installation

This makes UniFi integration our **primary path** for the small-to-medium hotel market (60% of total addressable market).
