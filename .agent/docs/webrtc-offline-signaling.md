# WebRTC Offline Signaling Architecture

**Last Updated**: 2025-10-23
**Status**: Complete PoC Implementation
**Audience**: Developers, Architects

## The Critical Question

**"What happens when WebRTC doesn't have internet for signaling?"**

This document answers that question and provides a complete solution for offline-capable WebRTC peer-to-peer communication.

---

## The Problem

### Original WebRTC Architecture (Cloud Signaling)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Cloud-Only Signaling                    │
│                                                                  │
│   Device A                Cloud                Device B          │
│   ┌─────────┐            ┌────┐              ┌─────────┐       │
│   │ Tablet 1│──────WS───>│    │<────WS───────│ Tablet 2│       │
│   └─────────┘            │    │              └─────────┘       │
│                          │ WS │                                  │
│                          │ API│                                  │
│                          └────┘                                  │
│                                                                  │
│   Problem: If internet fails → No signaling → No P2P!          │
└─────────────────────────────────────────────────────────────────┘
```

**Critical Issues**:
1. **No Internet = No P2P**: Cloud signaling requires internet
2. **Breaks Business Continuity**: Small hotels can't collaborate offline
3. **Contradicts Requirements**: "Business continuity is the main purpose"

### Why This Matters for Small Hotels

Small hotels (60% of market) rely on:
- **No Greengrass server** (no IT department, no local infrastructure)
- **WebRTC P2P** for local collaboration (room updates, inventory sync)
- **Business continuity** (must work when internet fails)

**Without offline signaling**: P2P collaboration fails when internet fails → Business continuity broken!

---

## The Solution: Local mDNS Signaling

### Architecture (Offline-Capable)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Local mDNS Signaling (No Internet!)          │
│                                                                  │
│   Device A                                     Device B          │
│   ┌─────────┐                                 ┌─────────┐       │
│   │ Tablet 1│                                 │ Tablet 2│       │
│   │         │                                 │         │       │
│   │ Server  │                                 │ Server  │       │
│   │ :8090   │                                 │ :8091   │       │
│   └─────────┘                                 └─────────┘       │
│        │                                            │            │
│        │  1. mDNS Advertisement                    │            │
│        │     "tablet-1._webrtc-peer._tcp.local."   │            │
│        │ <──────────────────────────────────────────            │
│        │                                                         │
│        │  2. mDNS Discovery                                     │
│        │ ──────────────────────────────────────────>           │
│        │                                                         │
│        │  3. HTTP POST /offer                                   │
│        │     http://tablet-1.local:8090/offer                   │
│        │ <──────────────────────────────────────────           │
│        │                                                         │
│        │  4. HTTP Response (Answer)                             │
│        │ ──────────────────────────────────────────>           │
│        │                                                         │
│        │  5. WebRTC P2P Connection Established!                 │
│        │ <═════════════════════════════════════════>           │
│                                                                  │
│   ✓ Works offline (no internet needed)                          │
│   ✓ Automatic discovery (mDNS)                                  │
│   ✓ Business continuity maintained!                             │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Each device runs a local signaling server**:
   - HTTP REST API on port 8090 (or 8091, 8092, etc.)
   - Endpoints: `/offer`, `/answer`, `/ice-candidate`

2. **Each device advertises via mDNS**:
   - Service type: `_webrtc-peer._tcp.local.`
   - Hostname: `tablet-1.local`, `tablet-2.local`, etc.
   - TXT records: deviceId, propertyId, deviceType

3. **Peer discovery via mDNS**:
   - Devices scan for `_webrtc-peer._tcp.local.` services
   - Filter by propertyId (only connect to same property)
   - Get IP address and port

4. **WebRTC signaling via HTTP**:
   - Device A sends offer to http://tablet-1.local:8090/offer
   - Device B responds with answer
   - ICE candidates exchanged
   - P2P connection established

5. **No internet needed**:
   - mDNS works on local network (multicast)
   - HTTP works on local network (LAN)
   - WebRTC data channels work on local network (P2P)

---

## Fallback Chain

**Priority** (automatic selection):
1. **Local mDNS Signaling** (PRIMARY): Offline-capable
2. **Cloud WebSocket Signaling** (FALLBACK): Requires internet

```typescript
const peer = createWebRTCPeerWithFallback({
  deviceId: 'tablet-front-desk',
  propertyId: 'property-123',
  cloudSignalingUrl: 'wss://signal.hospitality-ai.com', // Fallback
  preferLocal: true, // Try local first
});

await peer.connect();

// Automatic behavior:
// 1. Try local mDNS signaling (no internet needed)
// 2. If local fails, try cloud signaling (requires internet)
// 3. If both fail, throw error

console.log('Signaling mode:', peer.getSignalingMode());
// "local" → Works offline!
// "cloud" → Requires internet (fallback)
```

### When to Use Each Method

| Scenario | Signaling Method | Works Offline? |
|----------|------------------|----------------|
| **Small hotel, same WiFi, no internet** | Local mDNS | ✅ Yes |
| **Small hotel, same WiFi, has internet** | Local mDNS (preferred) | ✅ Yes |
| **Small hotel, different networks** | Cloud WebSocket | ❌ No (needs internet) |
| **Staff device at home** | Cloud WebSocket | ❌ No (needs internet) |

---

## Implementation

### Device A (Receiver)

```typescript
import { createWebRTCPeerWithFallback } from '@/lib/sync/webrtc-peer-with-fallback';

const peer = createWebRTCPeerWithFallback({
  deviceId: 'tablet-1',
  propertyId: 'property-123',
  deviceType: 'tablet',
  localSignalingPort: 8090,
  preferLocal: true, // Try local first
  cloudSignalingUrl: 'wss://signal.hospitality-ai.com', // Fallback
});

// Listen for messages
peer.on('message', ({ peerId, message }) => {
  console.log(`Message from ${peerId}:`, message);
});

// Listen for peers
peer.on('peer-connected', (peerId) => {
  console.log(`Peer connected: ${peerId}`);
});

// Connect (automatically tries local → cloud)
await peer.connect();

console.log('Signaling mode:', peer.getSignalingMode());
// "local" → No internet needed!
```

### Device B (Initiator)

```typescript
const peer = createWebRTCPeerWithFallback({
  deviceId: 'tablet-2',
  propertyId: 'property-123',
  deviceType: 'tablet',
  localSignalingPort: 8091, // Different port
  preferLocal: true,
  cloudSignalingUrl: 'wss://signal.hospitality-ai.com',
});

await peer.connect();

// Send message to specific peer
peer.sendToPeer('tablet-1', {
  type: 'room-update',
  data: { roomId: '101', status: 'occupied' },
});

// Broadcast to all peers
peer.broadcast({
  type: 'inventory-update',
  data: { item: 'towels', quantity: 50 },
});
```

---

## Components

### 1. Local Signaling Server

**Location**: `lib/sync/webrtc-local-signaling.ts`

**Responsibilities**:
- HTTP REST API for WebRTC signaling
- Endpoints: `/health`, `/offer`, `/answer`, `/ice-candidate`
- mDNS advertisement
- Runs on each device

**Example**:
```typescript
import { LocalSignalingServer } from '@/lib/sync/webrtc-local-signaling';

const server = new LocalSignalingServer(
  'tablet-1',      // deviceId
  'property-123',  // propertyId
  'tablet',        // deviceType
  8090             // port
);

// Handle incoming offers
server.onOffer(async (offer) => {
  // Create WebRTC answer
  const pc = new RTCPeerConnection();
  await pc.setRemoteDescription(offer.sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  return {
    from: 'tablet-1',
    to: offer.from,
    sdp: answer,
    iceCandidates: [],
  };
});

await server.start();
// Server running on http://0.0.0.0:8090
// Advertised as: tablet-1._webrtc-peer._tcp.local.
```

### 2. Local Peer Discovery

**Location**: `lib/sync/webrtc-local-signaling.ts`

**Responsibilities**:
- mDNS scanning for `_webrtc-peer._tcp.local.` services
- Filter by propertyId
- Notify when peers found/lost

**Example**:
```typescript
import { LocalPeerDiscovery } from '@/lib/sync/webrtc-local-signaling';

const discovery = new LocalPeerDiscovery('property-123');

discovery.onPeerFound(async (peer) => {
  console.log('Found peer:', peer.id);
  console.log('IP:', peer.ip);
  console.log('Port:', peer.port);

  // Connect to peer
  // ...
});

discovery.onPeerRemoved((peerId) => {
  console.log('Peer lost:', peerId);
});

await discovery.start();
// Scanning for _webrtc-peer._tcp.local. services...
```

### 3. WebRTC Peer with Fallback

**Location**: `lib/sync/webrtc-peer-with-fallback.ts`

**Responsibilities**:
- Manages local + cloud signaling fallback
- Creates WebRTC peer connections
- Manages data channels
- Auto-reconnect

**Example**:
```typescript
import { createWebRTCPeerWithFallback } from '@/lib/sync/webrtc-peer-with-fallback';

const peer = createWebRTCPeerWithFallback({
  deviceId: 'tablet-1',
  propertyId: 'property-123',
  preferLocal: true, // Try local first
});

await peer.connect();
// Automatically tries:
// 1. Local mDNS signaling (offline-capable)
// 2. Cloud signaling (fallback)

peer.broadcast({ type: 'test', data: 'Hello!' });
```

---

## Network Requirements

### Firewall Rules (Local Signaling)

**Each device needs**:
- **Inbound UDP 5353** (mDNS multicast)
- **Inbound TCP 8090-8099** (Local signaling servers)
- **Outbound UDP 49152-65535** (WebRTC data channels)

```bash
# Allow mDNS
sudo ufw allow 5353/udp

# Allow local signaling servers
sudo ufw allow 8090:8099/tcp

# Allow WebRTC ephemeral ports
sudo ufw allow 49152:65535/udp
```

### WiFi Requirements

**Must be on same WiFi network**:
- mDNS only works on local subnet (no routing)
- HTTP signaling only works on local network
- WebRTC P2P works best on local network (no NAT)

**If on different networks**:
- Local signaling won't work (mDNS doesn't route)
- Must use cloud signaling (requires internet)

---

## Testing

### Test Local Signaling (No Internet)

**Setup**:
1. Disconnect internet on router
2. Keep WiFi on (local network only)
3. Start Device A (signaling server)
4. Start Device B (discovery + connect)

**Expected Behavior**:
- ✅ Device B discovers Device A via mDNS
- ✅ Device B connects to Device A via HTTP
- ✅ WebRTC P2P connection established
- ✅ Data channels working
- ✅ No internet needed!

**Test Script**:
```typescript
// Device A
const peerA = createWebRTCPeerWithFallback({
  deviceId: 'device-a',
  propertyId: 'test',
  localSignalingPort: 8090,
  preferLocal: true,
});

await peerA.connect();
console.log('Device A waiting for peers...');

peerA.on('message', ({ peerId, message }) => {
  console.log('Device A received:', message);
});

// Device B
const peerB = createWebRTCPeerWithFallback({
  deviceId: 'device-b',
  propertyId: 'test',
  localSignalingPort: 8091,
  preferLocal: true,
});

await peerB.connect();

peerB.on('peer-connected', (peerId) => {
  console.log('Device B connected to:', peerId);

  // Send test message
  peerB.sendToPeer(peerId, {
    type: 'test',
    data: 'Hello from Device B!',
  });
});
```

### Test Cloud Fallback (With Internet)

**Setup**:
1. Connect internet
2. Disable local signaling (set `preferLocal: false`)
3. Start cloud signaling server
4. Connect devices

**Expected Behavior**:
- ✅ Devices connect to cloud signaling
- ✅ WebRTC P2P connection established via cloud
- ✅ Works across different networks

---

## Cost Analysis

### Local Signaling (Offline)

| Component | Cost |
|-----------|------|
| **Local signaling server** | $0 (runs on device) |
| **mDNS** | $0 (built-in protocol) |
| **HTTP signaling** | $0 (local network) |
| **WebRTC data** | $0 (P2P, no server relay) |
| **Total** | **$0/month** |

**Benefits**:
- Zero cost
- No internet needed
- Business continuity maintained

### Cloud Signaling (Fallback)

| Component | Cost | Scale |
|-----------|------|-------|
| **API Gateway WebSocket** | $1.00/million messages | 100 hotels |
| **Lambda (signaling)** | $0.20/million requests | 100 hotels |
| **Data transfer** | $0.09/GB | 100 hotels |
| **Total** | **~$5/month** | 100 hotels |

**When Needed**:
- Devices on different networks
- Remote access (staff at home)
- Internet available

### Combined Cost (Best of Both)

- **On-site (same WiFi)**: Local signaling ($0)
- **Remote (different networks)**: Cloud signaling (~$5/100 hotels)
- **Blended**: **~$2/month** for 100 hotels

**ROI**: Near-zero cost, business continuity maintained!

---

## Troubleshooting

### Problem: Local Signaling Not Working

**Symptoms**:
- Devices don't discover each other
- Connection timeout errors
- `getSignalingMode()` returns "none"

**Solutions**:

1. **Check WiFi**:
   - Both devices on same WiFi network?
   - mDNS requires same subnet

2. **Check firewall**:
   ```bash
   sudo ufw allow 5353/udp    # mDNS
   sudo ufw allow 8090/tcp    # Signaling server
   ```

3. **Check mDNS resolution**:
   ```bash
   # macOS/Linux
   dns-sd -B _webrtc-peer._tcp local.

   # Should show:
   # tablet-1._webrtc-peer._tcp.local.
   ```

4. **Check signaling server**:
   ```bash
   curl http://tablet-1.local:8090/health
   # Should return: {"status": "ok", "deviceId": "tablet-1"}
   ```

### Problem: WebRTC Connection Fails

**Symptoms**:
- Signaling works (offer/answer exchanged)
- ICE connection state: "failed"
- No data channel connection

**Solutions**:

1. **Check STUN servers**:
   ```typescript
   const peer = createWebRTCPeerWithFallback({
     // ...
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       { urls: 'stun:stun1.l.google.com:19302' },
     ],
   });
   ```

2. **Check network**:
   - Same WiFi? Should work without STUN
   - Different networks? May need TURN server

3. **Check ICE candidates**:
   - Are local candidates generated?
   - Are remote candidates received?

---

## Conclusion

The local mDNS signaling architecture solves the critical problem:

**"What happens when WebRTC doesn't have internet for signaling?"**

**Answer**: It works anyway! ✅

### Key Benefits

1. **Offline-Capable**: No internet needed for local P2P
2. **Business Continuity**: Works when internet fails
3. **Zero Cost**: No cloud infrastructure needed for local
4. **Automatic**: mDNS discovery, no manual configuration
5. **Resilient**: Falls back to cloud if local unavailable

### Use Cases

- ✅ **Small hotels**: Staff collaboration without server
- ✅ **Internet outages**: Continue working offline
- ✅ **Disaster recovery**: Local operations during emergencies
- ✅ **Cost optimization**: Zero cost for on-site collaboration

---

## References

- **mDNS Specification**: [RFC 6762](https://tools.ietf.org/html/rfc6762)
- **WebRTC Specification**: [webrtc.org](https://webrtc.org/)
- **HTTP Signaling**: [MDN WebRTC signaling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)

**Internal Documentation**:
- `.agent/docs/webrtc-p2p-rxdb-sync-guide.md` - Original WebRTC architecture
- `.agent/docs/market-segmented-architecture.md` - Why small hotels need P2P
- `.agent/docs/mdns-discovery-guide.md` - mDNS infrastructure
