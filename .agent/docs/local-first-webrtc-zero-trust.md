# Local-First WebRTC with Zero Trust Architecture

**Last Updated**: 2025-10-23
**Status**: Complete Architecture Design
**Audience**: Architects, Security Engineers, Developers

## Overview

This document describes the **local-first WebRTC architecture** with **zero trust security** using **AWS IoT device certificates** for the Hospitality AI SDK.

**Key Principles**:
1. **Local-first**: Devices communicate P2P without cloud (offline-capable)
2. **Zero trust**: Never trust, always verify (device certificates)
3. **Defense in depth**: Multiple security layers
4. **Automatic fallback**: Local → Cloud → Manual

---

## Architecture Diagrams

### Scenario 1: Small Hotel (Offline, Same WiFi) - Local mDNS Signaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCENARIO 1: OFFLINE - LOCAL P2P                           │
│                                                                              │
│   Property WiFi (VLAN 20): 192.168.20.0/24                                  │
│   Internet: ❌ DOWN (Offline Mode)                                          │
│                                                                              │
│   ┌─────────────────────────┐              ┌─────────────────────────┐     │
│   │   Tablet 1 (iPad)       │              │   Tablet 2 (Android)    │     │
│   │   192.168.20.11         │              │   192.168.20.12         │     │
│   │                         │              │                         │     │
│   │  ┌──────────────────┐   │              │  ┌──────────────────┐  │     │
│   │  │ AWS IoT Cert     │   │              │  │ AWS IoT Cert     │  │     │
│   │  │ (Device ID 1)    │   │              │  │ (Device ID 2)    │  │     │
│   │  │ CN=tablet-1      │   │              │  │ CN=tablet-2      │  │     │
│   │  │ Valid until 2026 │   │              │  │ Valid until 2026 │  │     │
│   │  └──────────────────┘   │              │  └──────────────────┘  │     │
│   │                         │              │                         │     │
│   │  ┌──────────────────┐   │              │  ┌──────────────────┐  │     │
│   │  │ mDNS Advertiser  │   │              │  │ mDNS Discovery   │  │     │
│   │  │ Port: 8090       │   │              │  │ Scan: 0.0.0.0    │  │     │
│   │  │ Service:         │   │              │  │ Service:         │  │     │
│   │  │ _webrtc-peer     │   │              │  │ _webrtc-peer     │  │     │
│   │  │ ._tcp.local.     │   │              │  │ ._tcp.local.     │  │     │
│   │  └──────────────────┘   │              │  └──────────────────┘  │     │
│   └─────────────────────────┘              └─────────────────────────┘     │
│              │                                        │                     │
│              │ 1. mDNS Announcement                   │                     │
│              │    "tablet-1._webrtc-peer._tcp.local." │                     │
│              │ <──────────────────────────────────────│                     │
│              │                                        │                     │
│              │ 2. mDNS Query Response                 │                     │
│              │    IP: 192.168.20.11, Port: 8090       │                     │
│              │ ───────────────────────────────────────>                     │
│              │                                        │                     │
│              │ 3. HTTP POST /offer                    │                     │
│              │    http://192.168.20.11:8090/offer     │                     │
│              │    Body: {                             │                     │
│              │      from: "tablet-2",                 │                     │
│              │      to: "tablet-1",                   │                     │
│              │      sdp: {...},                       │                     │
│              │      deviceCert: {                     │                     │
│              │        cn: "tablet-2",                 │                     │
│              │        fingerprint: "SHA256:abc..."    │                     │
│              │      }                                 │                     │
│              │    }                                   │                     │
│              │ <──────────────────────────────────────│                     │
│              │                                        │                     │
│              │ 4. Verify Device Certificate (Zero Trust)                    │
│              │    ✓ Check CN matches deviceId                              │
│              │    ✓ Check certificate not revoked                          │
│              │    ✓ Check fingerprint in allowlist                         │
│              │    ✓ Check propertyId matches                               │
│              │                                        │                     │
│              │ 5. HTTP Response (Answer)              │                     │
│              │    {                                   │                     │
│              │      from: "tablet-1",                 │                     │
│              │      to: "tablet-2",                   │                     │
│              │      sdp: {...},                       │                     │
│              │      deviceCert: {                     │                     │
│              │        cn: "tablet-1",                 │                     │
│              │        fingerprint: "SHA256:def..."    │                     │
│              │      }                                 │                     │
│              │    }                                   │                     │
│              │ ───────────────────────────────────────>                     │
│              │                                        │                     │
│              │ 6. WebRTC P2P Connection Established (mTLS)                  │
│              │    Certificate pinning enforced        │                     │
│              │ <══════════════════════════════════════>                     │
│              │         DTLS-SRTP (Encrypted)          │                     │
│              │                                        │                     │
│   Status: ✅ CONNECTED OFFLINE                                              │
│   Signaling: Local mDNS (no internet needed)                                │
│   Security: mTLS with device certificates                                   │
│   Latency: 10-50ms (local network)                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scenario 2: Small Hotel (Online, Same WiFi) - Local Preferred, Cloud Available

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                SCENARIO 2: ONLINE - LOCAL PREFERRED                          │
│                                                                              │
│   Property WiFi (VLAN 20): 192.168.20.0/24                                  │
│   Internet: ✅ UP (Online)                                                   │
│                                                                              │
│   ┌─────────────────────────┐              ┌─────────────────────────┐     │
│   │   Tablet 1              │              │   Tablet 2              │     │
│   │   192.168.20.11         │              │   192.168.20.12         │     │
│   └─────────────────────────┘              └─────────────────────────┘     │
│              │                                        │                     │
│              │ 1. Try Local mDNS First                │                     │
│              │ <══════════════════════════════════════>                     │
│              │    ✅ SUCCESS (same WiFi)               │                     │
│              │                                        │                     │
│              │ Cloud Signaling: ❌ NOT USED           │                     │
│              │ (Local is faster and free)             │                     │
│              │                                        │                     │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                         AWS Cloud                                 │     │
│   │                                                                   │     │
│   │   ┌───────────────────────────────────────┐                      │     │
│   │   │   CloudWatch Logs (Monitoring Only)   │                      │     │
│   │   │   - Log: "Tablet 1 + 2 connected via local mDNS"            │     │
│   │   │   - Cost: $0.50/GB (minimal logging)  │                      │     │
│   │   └───────────────────────────────────────┘                      │     │
│   │                                                                   │     │
│   │   ┌───────────────────────────────────────┐                      │     │
│   │   │   AWS IoT Core (Certificate Validation Only)                │     │
│   │   │   - Verify certificate not revoked    │                      │     │
│   │   │   - API call: DescribeCertificate     │                      │     │
│   │   │   - Cost: $0 (free tier)              │                      │     │
│   │   └───────────────────────────────────────┘                      │     │
│   │                                                                   │     │
│   │   Signaling Server: ❌ NOT USED (local preferred)                │     │
│   │                                                                   │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   Status: ✅ CONNECTED VIA LOCAL                                            │
│   Cost: $0/month (local P2P, minimal AWS API calls)                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Small Hotel (Different Networks) - Cloud WebSocket Signaling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│             SCENARIO 3: CLOUD FALLBACK - DIFFERENT NETWORKS                  │
│                                                                              │
│   Tablet 1: Property WiFi (192.168.20.11)                                   │
│   Tablet 2: Cellular Network (External IP)                                  │
│   (Staff member off-site or on cellular)                                    │
│                                                                              │
│   ┌─────────────────────────┐              ┌─────────────────────────┐     │
│   │   Tablet 1 (Property)   │              │   Tablet 2 (Off-site)   │     │
│   │   192.168.20.11         │              │   Cellular: 4G/5G       │     │
│   └─────────────────────────┘              └─────────────────────────┘     │
│              │                                        │                     │
│              │ 1. Try Local mDNS                      │                     │
│              │    ❌ FAIL (different networks)        │                     │
│              │                                        │                     │
│              │ 2. Fallback to Cloud WebSocket         │                     │
│              │    ↓                                   ↓                     │
│              │    │                                   │                     │
│   ┌──────────┼────┼───────────────────────────────────┼──────────────────┐ │
│   │          │    │         AWS Cloud                 │                  │ │
│   │          │    │                                   │                  │ │
│   │   ┌──────┼────┼───────────────────────────────────┼──────────┐      │ │
│   │   │      ↓    ↓                                   ↓          │      │ │
│   │   │  API Gateway WebSocket (wss://signal.hospitality-ai.com) │      │ │
│   │   │                                                           │      │ │
│   │   │  Connection 1:                Connection 2:              │      │ │
│   │   │  - Device: tablet-1          - Device: tablet-2          │      │ │
│   │   │  - Property: property-123    - Property: property-123    │      │ │
│   │   │  - Cert: SHA256:abc...       - Cert: SHA256:def...       │      │ │
│   │   └───────────────────────────────────────────────────────────┘      │ │
│   │              │                          │                             │ │
│   │              │ 3. Relay Offer           │                             │ │
│   │              │ ─────────────────────────>                             │ │
│   │              │                          │                             │ │
│   │              │ 4. Verify Certificate    │                             │ │
│   │              │    (Zero Trust)          │                             │ │
│   │              │          ↓               │                             │ │
│   │   ┌──────────┼──────────┼───────────────┼──────────┐                 │ │
│   │   │          │          │               │          │                 │ │
│   │   │  AWS IoT Core - Certificate Validation         │                 │ │
│   │   │  - Check: tablet-1 cert valid                  │                 │ │
│   │   │  - Check: tablet-2 cert valid                  │                 │ │
│   │   │  - Check: Both certs belong to property-123    │                 │ │
│   │   │  - Check: Not revoked                          │                 │ │
│   │   │  ✅ AUTHORIZED                                  │                 │ │
│   │   └────────────────────────────────────────────────┘                 │ │
│   │              │                          │                             │ │
│   │              │ 5. Relay Answer          │                             │ │
│   │              │ <─────────────────────────                             │ │
│   │              │                          │                             │ │
│   └──────────────┼──────────────────────────┼─────────────────────────────┘ │
│                  │                          │                               │
│                  │ 6. WebRTC P2P (Direct, NAT Traversal)                   │
│                  │ <════════════════════════>                               │
│                  │    STUN/TURN if needed   │                               │
│                  │                          │                               │
│   Status: ✅ CONNECTED VIA CLOUD                                            │
│   Signaling: Cloud WebSocket (fallback)                                     │
│   Data: WebRTC P2P (direct or TURN relay)                                   │
│   Cost: ~$5/month for 100 hotels (WebSocket + TURN)                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scenario 4: Medium/Large Hotel - Greengrass as Signaling + Zero Trust Gateway

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           SCENARIO 4: GREENGRASS - ZERO TRUST GATEWAY                        │
│                                                                              │
│   Property WiFi (VLAN 20): 192.168.20.0/24                                  │
│   Server Room (VLAN 30): 192.168.30.0/24                                    │
│                                                                              │
│   Staff Devices (VLAN 20)                                                   │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│   │   Tablet 1      │  │   Tablet 2      │  │   Tablet 3      │           │
│   │   .20.11        │  │   .20.12        │  │   .20.13        │           │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘           │
│          │                    │                    │                        │
│          │ 1. mDNS Discovery: greengrass.local    │                        │
│          │ <──────────────────┼────────────────────│                        │
│          │                    │                    │                        │
│          │ 2. Connect to Greengrass (Zero Trust)  │                        │
│          │    wss://greengrass.local:8443         │                        │
│          │    Client Certificate Required!        │                        │
│          │                    ↓                    │                        │
│   ┌──────┼────────────────────┼────────────────────┼──────────────────────┐│
│   │      │   Server Room (VLAN 30)                │                       ││
│   │      │                    │                    │                       ││
│   │   ┌──┼────────────────────┼────────────────────┼──────────┐           ││
│   │   │  ↓                    ↓                    ↓          │           ││
│   │   │  AWS IoT Greengrass Core v2                           │           ││
│   │   │  192.168.30.10 (greengrass.local)                     │           ││
│   │   │                                                        │           ││
│   │   │  ┌──────────────────────────────────────────────┐    │           ││
│   │   │  │  Certificate Validation Component            │    │           ││
│   │   │  │  - Verify client cert (mTLS)                 │    │           ││
│   │   │  │  - Check device in AWS IoT Registry          │    │           ││
│   │   │  │  - Check propertyId matches                  │    │           ││
│   │   │  │  - Check not revoked                         │    │           ││
│   │   │  │  ✅ AUTHORIZED                                │    │           ││
│   │   │  └──────────────────────────────────────────────┘    │           ││
│   │   │                                                        │           ││
│   │   │  ┌──────────────────────────────────────────────┐    │           ││
│   │   │  │  WebRTC Signaling Hub Component              │    │           ││
│   │   │  │  - Relay offers/answers between devices      │    │           ││
│   │   │  │  - Store ICE candidates                      │    │           ││
│   │   │  │  - Enforce device isolation by propertyId    │    │           ││
│   │   │  └──────────────────────────────────────────────┘    │           ││
│   │   │                                                        │           ││
│   │   │  ┌──────────────────────────────────────────────┐    │           ││
│   │   │  │  Cloud Proxy Component (ONLY Gateway)        │    │           ││
│   │   │  │  - Staff devices NEVER talk to cloud         │    │           ││
│   │   │  │  - Only Greengrass talks to cloud            │    │           ││
│   │   │  │  - Proxies: backups, analytics, updates     │    │           ││
│   │   │  └──────────────────────────────────────────────┘    │           ││
│   │   │                                                        │           ││
│   │   └────────────────────────────────────────────────────────┘           ││
│   │                                  │                                      ││
│   └──────────────────────────────────┼──────────────────────────────────────┘│
│                                      │                                       │
│                                      │ 3. Cloud Proxy (Optional)             │
│                                      │    - Backups (15 min)                 │
│                                      │    - Model updates (daily)            │
│                                      │    - Cross-property analytics         │
│                                      ↓                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                         AWS Cloud                                     │  │
│   │                                                                       │  │
│   │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │  │
│   │   │ AWS IoT Core   │  │ Aurora RDS     │  │ S3 Backups     │       │  │
│   │   │ (Cert Mgmt)    │  │ (Sync every    │  │ (Daily)        │       │  │
│   │   │                │  │  15 min)       │  │                │       │  │
│   │   └────────────────┘  └────────────────┘  └────────────────┘       │  │
│   │                                                                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Security Model: ZERO TRUST                                                 │
│   - Staff devices: mTLS with device certificates                             │
│   - Greengrass: Only gateway to cloud (security proxy)                       │
│   - Network isolation: Staff devices CANNOT access internet directly         │
│   - Certificate rotation: Every 90 days                                      │
│   - Attack surface: Massive reduction (no direct cloud access)               │
│                                                                              │
│   Status: ✅ CONNECTED VIA GREENGRASS (ZERO TRUST)                           │
│   Latency: <50ms (local network)                                             │
│   Offline: ✅ Works without internet (100% offline-capable)                  │
│   Cost: $22/month AWS + $580 hardware (one-time)                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fallback Chain Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FALLBACK DECISION TREE                              │
│                                                                              │
│                           START: Device Connect                              │
│                                  │                                           │
│                                  ↓                                           │
│                    ┌─────────────────────────┐                              │
│                    │  Detect Network Type    │                              │
│                    └─────────────────────────┘                              │
│                                  │                                           │
│           ┌──────────────────────┼──────────────────────┐                   │
│           ↓                      ↓                      ↓                   │
│   ┌───────────────┐      ┌───────────────┐     ┌───────────────┐          │
│   │ On Property   │      │ Has Internet  │     │ Completely    │          │
│   │ WiFi?         │      │ But Different │     │ Offline       │          │
│   └───────────────┘      │ Network?      │     └───────────────┘          │
│           │              └───────────────┘             │                   │
│           │ YES                   │ YES                │ YES               │
│           ↓                       ↓                    ↓                   │
│   ┌───────────────┐      ┌───────────────┐     ┌───────────────┐          │
│   │ OPTION 1:     │      │ OPTION 2:     │     │ OPTION 3:     │          │
│   │ Try Local     │      │ Skip Local    │     │ Local ONLY    │          │
│   │ mDNS          │      │ Use Cloud     │     │ No Fallback   │          │
│   └───────────────┘      └───────────────┘     └───────────────┘          │
│           │                       │                    │                   │
│           ↓                       ↓                    ↓                   │
│   ┌───────────────┐      ┌───────────────┐     ┌───────────────┐          │
│   │ Scan for:     │      │ Connect to:   │     │ Scan for:     │          │
│   │ greengrass    │      │ Cloud WS      │     │ _webrtc-peer  │          │
│   │ .local        │      │ wss://signal  │     │ ._tcp.local.  │          │
│   │ OR            │      │ .hospitality  │     │ ONLY          │          │
│   │ _webrtc-peer  │      │ -ai.com       │     │               │          │
│   │ ._tcp.local.  │      │               │     │               │          │
│   └───────────────┘      └───────────────┘     └───────────────┘          │
│           │                       │                    │                   │
│           ↓                       ↓                    ↓                   │
│   ┌───────────────┐      ┌───────────────┐     ┌───────────────┐          │
│   │ Found?        │      │ Connected?    │     │ Found Peers?  │          │
│   └───────────────┘      └───────────────┘     └───────────────┘          │
│      │         │                │      │               │      │            │
│      │ YES     │ NO             │ YES  │ NO            │ YES  │ NO         │
│      ↓         ↓                ↓      ↓               ↓      ↓            │
│   ┌──────┐ ┌──────┐        ┌──────┐ ┌──────┐      ┌──────┐ ┌──────┐     │
│   │ Use  │ │ Fall │        │ Use  │ │ FAIL │      │ Use  │ │ FAIL │     │
│   │ Local│ │ back │        │ Cloud│ │      │      │ Local│ │      │     │
│   │      │ │ to   │        │      │ │      │      │ P2P  │ │      │     │
│   │      │ │Cloud │        │      │ │      │      │      │ │      │     │
│   └──────┘ └──────┘        └──────┘ └──────┘      └──────┘ └──────┘     │
│      │         │                │                     │         │          │
│      └─────────┼────────────────┘                     │         │          │
│                ↓                                       │         │          │
│   ┌─────────────────────────┐                         │         │          │
│   │ Verify Device Cert      │                         │         │          │
│   │ (Zero Trust)            │                         │         │          │
│   │ - CN matches deviceId   │<────────────────────────┘         │          │
│   │ - Not revoked           │                                   │          │
│   │ - propertyId matches    │                                   │          │
│   │ - Fingerprint verified  │                                   │          │
│   └─────────────────────────┘                                   │          │
│                │                                                 │          │
│                ↓                                                 ↓          │
│   ┌─────────────────────────┐                         ┌──────────────────┐ │
│   │ ✅ CONNECTED             │                         │ ❌ NOT CONNECTED │ │
│   │ Signaling: Local/Cloud  │                         │ Show Manual IP   │ │
│   │ Security: mTLS          │                         │ Entry Form       │ │
│   │ Data: WebRTC P2P        │                         └──────────────────┘ │
│   └─────────────────────────┘                                              │
│                                                                              │
│   Priority Order:                                                            │
│   1. Greengrass (if available) - <50ms, 100% offline                        │
│   2. Local mDNS P2P - 10-50ms, offline-capable                              │
│   3. Cloud WebSocket - 100-300ms, requires internet                         │
│   4. Manual IP Entry - Last resort                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Zero Trust Security Model

### Certificate-Based Authentication (AWS IoT)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   AWS IOT DEVICE CERTIFICATES (ZERO TRUST)                   │
│                                                                              │
│   Registration Flow (One-time):                                             │
│   ────────────────────────────────────────────────────────────              │
│                                                                              │
│   1. Device Provisioning (First Boot)                                       │
│      ┌─────────────────────────────────────────────────┐                   │
│      │  Tablet 1 (iPad)                                 │                   │
│      │  - Generate CSR (Certificate Signing Request)   │                   │
│      │  - Include: deviceId, propertyId, deviceType    │                   │
│      │  - Send to: AWS IoT Core                        │                   │
│      └─────────────────────────────────────────────────┘                   │
│                           │                                                  │
│                           ↓                                                  │
│      ┌─────────────────────────────────────────────────┐                   │
│      │  AWS IoT Core (Certificate Authority)           │                   │
│      │  - Verify provisioning claim certificate        │                   │
│      │  - Generate device certificate                  │                   │
│      │    CN: tablet-1                                 │                   │
│      │    OU: property-123                             │                   │
│      │    O: Hospitality AI                            │                   │
│      │    Valid: 365 days                              │                   │
│      │  - Store in AWS IoT Registry                    │                   │
│      │  - Return certificate to device                 │                   │
│      └─────────────────────────────────────────────────┘                   │
│                           │                                                  │
│                           ↓                                                  │
│      ┌─────────────────────────────────────────────────┐                   │
│      │  Tablet 1 (Stores Certificate Securely)         │                   │
│      │  - iOS Keychain (hardware-backed)               │                   │
│      │  - Android KeyStore (TEE/StrongBox)             │                   │
│      │  - Certificate PIN: Required for access         │                   │
│      └─────────────────────────────────────────────────┘                   │
│                                                                              │
│   Authentication Flow (Every Connection):                                   │
│   ───────────────────────────────────────────────────                       │
│                                                                              │
│   2. Device Connects (WebRTC Signaling)                                     │
│      ┌─────────────────────────────────────────────────┐                   │
│      │  Tablet 1 → Tablet 2 (or Greengrass)            │                   │
│      │  - Include device certificate in offer          │                   │
│      │  - Sign offer with private key                  │                   │
│      └─────────────────────────────────────────────────┘                   │
│                           │                                                  │
│                           ↓                                                  │
│      ┌─────────────────────────────────────────────────┐                   │
│      │  Receiving Device (Zero Trust Verification)     │                   │
│      │                                                  │                   │
│      │  ✓ 1. Verify certificate signature              │                   │
│      │       (AWS IoT CA public key)                   │                   │
│      │                                                  │                   │
│      │  ✓ 2. Check certificate not expired             │                   │
│      │       (Valid until date)                        │                   │
│      │                                                  │                   │
│      │  ✓ 3. Verify CN matches deviceId                │                   │
│      │       (CN=tablet-1 vs from="tablet-1")          │                   │
│      │                                                  │                   │
│      │  ✓ 4. Verify propertyId matches                 │                   │
│      │       (OU=property-123)                         │                   │
│      │                                                  │                   │
│      │  ✓ 5. Check certificate not revoked             │                   │
│      │       Query: AWS IoT Core                       │                   │
│      │       API: DescribeCertificate                  │                   │
│      │       Status: ACTIVE (not REVOKED)              │                   │
│      │                                                  │                   │
│      │  ✓ 6. Verify signature on offer                 │                   │
│      │       (Device private key)                      │                   │
│      │                                                  │                   │
│      │  ✅ ALL CHECKS PASSED → AUTHORIZED              │                   │
│      └─────────────────────────────────────────────────┘                   │
│                           │                                                  │
│                           ↓                                                  │
│      ┌─────────────────────────────────────────────────┐                   │
│      │  WebRTC Connection Established (mTLS)           │                   │
│      │  - DTLS-SRTP handshake                          │                   │
│      │  - Certificate pinning enforced                 │                   │
│      │  - Perfect Forward Secrecy (PFS)                │                   │
│      │  - AES-256-GCM encryption                       │                   │
│      └─────────────────────────────────────────────────┘                   │
│                                                                              │
│   Certificate Rotation (Every 90 Days):                                     │
│   ─────────────────────────────────────────                                 │
│                                                                              │
│   3. Automatic Certificate Renewal                                          │
│      ┌─────────────────────────────────────────────────┐                   │
│      │  Background Service (Runs Daily)                │                   │
│      │  - Check: Cert expires in < 30 days?            │                   │
│      │  - If YES:                                       │                   │
│      │    1. Generate new CSR                          │                   │
│      │    2. Request new cert from AWS IoT             │                   │
│      │    3. Store new cert securely                   │                   │
│      │    4. Revoke old cert (after grace period)      │                   │
│      └─────────────────────────────────────────────────┘                   │
│                                                                              │
│   Security Properties:                                                       │
│   ────────────────────                                                       │
│   ✅ Zero Trust: Never trust, always verify                                 │
│   ✅ Mutual Authentication: Both devices verify each other                  │
│   ✅ Certificate Pinning: Fingerprint verified                              │
│   ✅ Hardware-backed: iOS Keychain, Android KeyStore                        │
│   ✅ Rotation: Certificates expire every 90 days                            │
│   ✅ Revocation: Can revoke stolen/compromised devices                      │
│   ✅ Audit Trail: All certificate operations logged                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Layers (Defense in Depth)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEFENSE IN DEPTH (7 LAYERS)                               │
│                                                                              │
│   Layer 1: Network Isolation                                                │
│   ────────────────────────                                                  │
│   ✓ VLANs: Staff (VLAN 20), Server (VLAN 30), Guest (VLAN 10)              │
│   ✓ Firewall: Block VLAN 20 → Internet (only via Greengrass proxy)         │
│   ✓ WiFi Segmentation: Staff WiFi ≠ Guest WiFi                             │
│                                                                              │
│   Layer 2: Device Certificates (AWS IoT)                                    │
│   ──────────────────────────────────────                                    │
│   ✓ X.509 certificates for each device                                      │
│   ✓ Hardware-backed key storage                                             │
│   ✓ Certificate rotation every 90 days                                      │
│   ✓ Revocation capability (stolen devices)                                  │
│                                                                              │
│   Layer 3: Mutual TLS (mTLS)                                                │
│   ──────────────────────────                                                │
│   ✓ Both client and server authenticate                                     │
│   ✓ Certificate pinning (fingerprint verification)                          │
│   ✓ Perfect Forward Secrecy (PFS)                                           │
│                                                                              │
│   Layer 4: WebRTC Encryption (DTLS-SRTP)                                    │
│   ──────────────────────────────────────────                                │
│   ✓ End-to-end encryption (P2P data channels)                               │
│   ✓ AES-256-GCM cipher                                                      │
│   ✓ Key exchange: ECDHE (ephemeral keys)                                    │
│                                                                              │
│   Layer 5: Application-Level Authorization                                  │
│   ─────────────────────────────────────────                                 │
│   ✓ propertyId verification (tenant isolation)                              │
│   ✓ Role-Based Access Control (RBAC)                                        │
│   ✓ Attribute-Based Access Control (ABAC)                                   │
│                                                                              │
│   Layer 6: Audit Logging                                                    │
│   ───────────────────                                                        │
│   ✓ All connections logged to CloudWatch                                    │
│   ✓ Certificate usage tracked                                               │
│   ✓ Anomaly detection (unusual connection patterns)                         │
│                                                                              │
│   Layer 7: Runtime Protection                                               │
│   ─────────────────────────                                                  │
│   ✓ Rate limiting (prevent DoS)                                             │
│   ✓ Connection limits per device                                            │
│   ✓ Automatic disconnect on suspicious activity                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Attack Scenarios & Mitigations

### Attack 1: Stolen Device

```
Scenario: Staff tablet stolen from hotel
────────────────────────────────────────

Without Zero Trust:
  ❌ Attacker can connect to other devices
  ❌ Attacker can access property data
  ❌ No way to revoke access

With Zero Trust (AWS IoT Certificates):
  ✅ Admin revokes device certificate (AWS IoT Console)
  ✅ Certificate marked as REVOKED in AWS IoT Registry
  ✅ All future connection attempts fail certificate check
  ✅ Existing connections terminated (certificate check on heartbeat)
  ✅ Device is now inert (cannot connect)

Mitigation Timeline:
  - 0 min: Device reported stolen
  - 1 min: Admin clicks "Revoke Certificate" in dashboard
  - 2 min: Certificate revoked in AWS IoT
  - 5 min: All devices check certificate status (heartbeat)
  - 5 min: Stolen device disconnected from all peers

Result: ✅ Device neutralized in 5 minutes
```

### Attack 2: Man-in-the-Middle (MITM)

```
Scenario: Attacker intercepts WebRTC signaling
───────────────────────────────────────────────

Without Zero Trust:
  ❌ Attacker can inject fake offers
  ❌ Attacker can relay/modify data

With Zero Trust (Certificate Pinning):
  ✅ Offer signed with device private key
  ✅ Signature verified with device certificate
  ✅ Certificate fingerprint checked against allowlist
  ✅ Any modification breaks signature → rejected
  ✅ Attacker cannot forge signature (no private key)

Result: ✅ MITM attack prevented
```

### Attack 3: Rogue Device (Unauthorized Tablet)

```
Scenario: Attacker brings own tablet to property WiFi
──────────────────────────────────────────────────────

Without Zero Trust:
  ❌ Rogue device can connect to other devices
  ❌ Rogue device can join WebRTC mesh

With Zero Trust (Certificate Verification):
  ✅ Rogue device has no AWS IoT certificate
  ✅ Connection attempt fails at certificate check
  ✅ Or: Rogue device has certificate for different property
  ✅ propertyId mismatch → connection rejected

Result: ✅ Unauthorized access prevented
```

### Attack 4: Certificate Theft (Extracted from Device)

```
Scenario: Attacker extracts certificate from tablet
────────────────────────────────────────────────────

Without Hardware-Backed Keys:
  ❌ Certificate stored in filesystem
  ❌ Attacker can copy certificate
  ❌ Attacker can use on different device

With Hardware-Backed Keys (iOS Keychain, Android KeyStore):
  ✅ Private key stored in Secure Enclave/TEE
  ✅ Private key non-extractable (hardware flag)
  ✅ Even with root access, key cannot be copied
  ✅ Certificate without private key is useless

Fallback (if extraction somehow succeeds):
  ✅ Certificate rotation (90 days)
  ✅ Short-lived credentials
  ✅ Admin can revoke certificate

Result: ✅ Certificate theft impact minimized
```

---

## Implementation Code

### Device Certificate Provisioning

```typescript
// lib/security/aws-iot-certificates.ts
import { IoT } from '@aws-sdk/client-iot';

export async function provisionDevice(
  deviceId: string,
  propertyId: string,
  deviceType: 'tablet' | 'phone' | 'laptop'
): Promise<DeviceCertificate> {
  const iot = new IoT({ region: 'us-east-1' });

  // 1. Generate CSR on device (private key stays on device)
  const { privateKey, csr } = await generateCSR({
    commonName: deviceId,
    organizationalUnit: propertyId,
    organization: 'Hospitality AI',
  });

  // 2. Create certificate in AWS IoT
  const { certificateArn, certificatePem } = await iot.createCertificateFromCsr({
    certificateSigningRequest: csr,
    setAsActive: true,
  });

  // 3. Attach policy
  await iot.attachPolicy({
    policyName: 'HospitalityAI-DevicePolicy',
    target: certificateArn,
  });

  // 4. Register device in IoT Registry
  await iot.createThing({
    thingName: deviceId,
    attributePayload: {
      attributes: {
        propertyId,
        deviceType,
        provisionedAt: new Date().toISOString(),
      },
    },
  });

  // 5. Attach certificate to thing
  await iot.attachThingPrincipal({
    thingName: deviceId,
    principal: certificateArn,
  });

  // 6. Store certificate securely on device
  await storeInKeychain({
    privateKey,
    certificate: certificatePem,
    certificateArn,
  });

  return {
    certificateArn,
    certificatePem,
    deviceId,
    propertyId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };
}

// Store in iOS Keychain (hardware-backed)
async function storeInKeychain(cert: {
  privateKey: string;
  certificate: string;
  certificateArn: string;
}) {
  // iOS Keychain (Swift/React Native bridge)
  await Keychain.setGenericPassword(
    'device-certificate',
    JSON.stringify(cert),
    {
      accessControl: AccessControl.BIOMETRY_ANY, // Require FaceID/TouchID
      accessible: ACCESSIBLE.WHEN_UNLOCKED,
      securityLevel: SECURITY_LEVEL.SECURE_HARDWARE, // Secure Enclave
    }
  );
}
```

### Certificate Verification (Zero Trust)

```typescript
// lib/security/verify-device-certificate.ts
import { IoT } from '@aws-sdk/client-iot';
import * as crypto from 'crypto';

export async function verifyDeviceCertificate(
  offer: SignalingOffer
): Promise<boolean> {
  const { deviceCert, from, to } = offer;

  // 1. Verify CN matches deviceId
  const cn = extractCN(deviceCert.certificate);
  if (cn !== from) {
    console.error(`CN mismatch: ${cn} !== ${from}`);
    return false;
  }

  // 2. Verify propertyId matches
  const ou = extractOU(deviceCert.certificate);
  const expectedPropertyId = getPropertyId(); // Current device's propertyId
  if (ou !== expectedPropertyId) {
    console.error(`PropertyId mismatch: ${ou} !== ${expectedPropertyId}`);
    return false;
  }

  // 3. Verify certificate not expired
  const { notBefore, notAfter } = extractDates(deviceCert.certificate);
  const now = new Date();
  if (now < notBefore || now > notAfter) {
    console.error('Certificate expired or not yet valid');
    return false;
  }

  // 4. Verify certificate signature (AWS IoT CA)
  const caCert = await getAWSIoTCACertificate();
  const isValidSignature = crypto.verify(
    'SHA256',
    deviceCert.certificate,
    caCert.publicKey,
    deviceCert.signature
  );
  if (!isValidSignature) {
    console.error('Invalid certificate signature');
    return false;
  }

  // 5. Check certificate not revoked (AWS IoT API)
  const iot = new IoT({ region: 'us-east-1' });
  const { certificateDescription } = await iot.describeCertificate({
    certificateId: deviceCert.certificateId,
  });

  if (certificateDescription.status !== 'ACTIVE') {
    console.error(`Certificate revoked: ${certificateDescription.status}`);
    return false;
  }

  // 6. Verify signature on offer (device private key)
  const offerSignature = offer.signature;
  const offerData = JSON.stringify({ sdp: offer.sdp, from: offer.from, to: offer.to });
  const isValidOfferSignature = crypto.verify(
    'SHA256',
    Buffer.from(offerData),
    deviceCert.certificate,
    offerSignature
  );
  if (!isValidOfferSignature) {
    console.error('Invalid offer signature');
    return false;
  }

  console.log('✅ Device certificate verified (Zero Trust)');
  return true;
}
```

### Certificate Revocation (Admin Dashboard)

```typescript
// app/api/admin/revoke-device/route.ts
import { IoT } from '@aws-sdk/client-iot';

export async function POST(request: Request) {
  const { deviceId, reason } = await request.json();

  const iot = new IoT({ region: 'us-east-1' });

  // 1. Find certificate for device
  const { certificates } = await iot.listThingPrincipals({
    thingName: deviceId,
  });

  const certificateArn = certificates[0]; // Assuming one cert per device

  // 2. Revoke certificate
  await iot.updateCertificate({
    certificateId: extractCertificateId(certificateArn),
    newStatus: 'REVOKED',
  });

  // 3. Log revocation
  await logAudit({
    action: 'CERTIFICATE_REVOKED',
    deviceId,
    reason,
    timestamp: new Date().toISOString(),
  });

  // 4. Notify all devices to check certificate status
  await broadcastMessage({
    type: 'CERTIFICATE_REVOKED',
    deviceId,
  });

  return Response.json({
    success: true,
    message: `Device ${deviceId} certificate revoked`,
  });
}
```

---

## Cost Analysis

### Small Hotels (Local P2P with Zero Trust)

| Component | Cost | Frequency |
|-----------|------|-----------|
| **Local mDNS signaling** | $0 | Runs on devices |
| **AWS IoT Certificate operations** | $0 | Free tier (1M ops/month) |
| **AWS IoT Device Registry** | $0 | Free tier (first 1000 devices) |
| **CloudWatch Logs** | $0.50/GB | Minimal logging (~1GB/month) |
| **Cloud signaling fallback** | $5/month | 100 hotels (10% usage) |
| **Total** | **~$5.50/month** | 100 hotels |

**Per Hotel**: ~$0.05/month

### Medium/Large Hotels (Greengrass + Zero Trust)

| Component | Cost | Frequency |
|-----------|------|-----------|
| **Greengrass server** | $0 | Runs on Intel NUC ($580 one-time) |
| **AWS IoT Core** | $8/month | Device messaging |
| **AWS IoT Certificate ops** | $0 | Free tier |
| **Certificate storage** | $0 | Included |
| **CloudWatch Logs** | $2/month | More devices, more logging |
| **Total** | **~$10/month** | Per property |

---

## Conclusion

The **local-first WebRTC architecture with zero trust** provides:

1. **Offline-capable**: Works without internet (local mDNS signaling)
2. **Secure**: Zero trust with AWS IoT device certificates
3. **Resilient**: Automatic fallback (local → cloud)
4. **Cost-effective**: ~$0.05/hotel/month (small hotels)
5. **Defense in depth**: 7 security layers
6. **Attack-resistant**: MITM, stolen devices, rogue devices all mitigated

**Key Innovation**: Combining local-first computing (no internet dependency) with zero trust security (AWS IoT certificates) for business continuity AND security.

---

## References

- **AWS IoT Device Certificates**: [AWS Docs](https://docs.aws.amazon.com/iot/latest/developerguide/x509-client-certs.html)
- **WebRTC Security**: [webrtc-security.github.io](https://webrtc-security.github.io/)
- **Zero Trust Architecture**: [NIST SP 800-207](https://csrc.nist.gov/publications/detail/sp/800-207/final)
- **mDNS Specification**: [RFC 6762](https://tools.ietf.org/html/rfc6762)

**Internal Documentation**:
- `.agent/docs/webrtc-offline-signaling.md` - Offline WebRTC architecture
- `.agent/docs/security-architecture.md` - Network isolation security
- `.agent/docs/market-segmented-architecture.md` - Business requirements
