# mDNS Service Discovery Guide

**Last Updated**: 2025-10-23
**Status**: Complete PoC Implementation
**Audience**: DevOps, IT Staff, Developers

## Overview

This guide covers the implementation of **mDNS (Multicast DNS) service discovery** for automatic Greengrass server detection on local networks. This enables web and mobile apps to automatically find the Greengrass server without manual IP configuration.

### What is mDNS?

mDNS (Multicast DNS), also known as **Bonjour** (Apple), **Avahi** (Linux), or **Zeroconf** (generic), is a protocol that allows devices to discover services on a local network without a DNS server.

- **Service**: `_hospitality._tcp.local.`
- **Hostname**: `greengrass.local`
- **Port**: 8000 (API gateway)

### Why mDNS for Hospitality AI?

**Problem**: Medium/Large hotels deploy Greengrass servers on-premise. Staff devices (tablets, phones) need to connect to this server, but:
- Server IP may change (DHCP, network reconfigs)
- Manual IP entry is error-prone
- IT staff waste time configuring devices

**Solution**: mDNS automatic discovery
- Apps discover `greengrass.local` automatically
- No manual configuration needed
- Works across subnet changes
- Zero-configuration networking

**Use Case**: Medium/Large hotels (40% of market) where web/mobile apps connect to Greengrass server instead of cloud.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Property WiFi (VLAN 20)                   │
│                                                                 │
│  ┌──────────────────┐      mDNS Query       ┌────────────────┐ │
│  │   Staff Tablet   │ ──────────────────────> │   Greengrass   │ │
│  │  (iPad/Android)  │ <───────────────────── │     Server     │ │
│  │                  │   mDNS Response        │ (Intel NUC)    │ │
│  │ discovers:       │                        │                │ │
│  │ greengrass.local │                        │ advertises:    │ │
│  │ 192.168.20.10    │                        │ greengrass.local│ │
│  │ port 8000        │                        │ 192.168.20.10  │ │
│  └──────────────────┘                        │ port 8000      │ │
│                                              └────────────────┘ │
│  ┌──────────────────┐                                          │
│  │   Staff Phone    │                                          │
│  │  (React Native)  │                                          │
│  │                  │──┐                                       │
│  │ discovers via    │  │                                       │
│  │ native mDNS APIs │  └──> Same mDNS service                 │
│  └──────────────────┘                                          │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  Staff Laptop    │                                          │
│  │  (Web Browser)   │                                          │
│  │                  │──┐                                       │
│  │ uses OS-level    │  │                                       │
│  │ .local resolution│  └──> Same mDNS service                 │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Greengrass Server** (advertiser):
   - Runs Python mDNS service (`zeroconf` library)
   - Advertises service: `_hospitality._tcp.local.`
   - Registers hostname: `greengrass.local`
   - Broadcasts on multicast address `224.0.0.251:5353`

2. **Client Devices** (discovery):
   - **Browser**: Uses OS-level `.local` resolution (Bonjour/Avahi)
   - **React Native**: Uses native mDNS APIs (NSNetService/NsdManager)
   - Queries for `_hospitality._tcp.local.` services
   - Receives IP address and port

3. **Fallbacks**:
   - If mDNS fails, scan common local IPs
   - Manual IP entry as final fallback
   - Cache discovered server for 24 hours

---

## Server-Side Setup (Greengrass)

### 1. Install Dependencies

The Greengrass component automatically installs `zeroconf`:

```bash
# Manual installation for testing
python3 -m pip install zeroconf==0.131.0
```

### 2. Deploy mDNS Component

**Option A: Local Development/Testing**

```bash
cd lib/greengrass/components/mdns-advertiser

# Run directly
python3 mdns_service.py
```

**Option B: Greengrass Deployment**

```bash
# 1. Upload artifacts to S3
aws s3 cp lib/greengrass/components/mdns-advertiser/mdns_service.py \
  s3://hospitality-ai-greengrass-artifacts/mdns-advertiser/1.0.0/

aws s3 cp lib/greengrass/components/mdns-advertiser/requirements.txt \
  s3://hospitality-ai-greengrass-artifacts/mdns-advertiser/1.0.0/

# 2. Create component
aws greengrassv2 create-component-version \
  --inline-recipe fileb://lib/greengrass/components/mdns-advertiser/recipe.yaml \
  --region us-east-1

# 3. Deploy to thing group
aws greengrassv2 create-deployment \
  --target-arn "arn:aws:iot:us-east-1:ACCOUNT:thinggroup/HospitalityAI" \
  --components '{
    "com.hospitality-ai.mdns-advertiser": {
      "componentVersion": "1.0.0",
      "configurationUpdate": {
        "merge": "{\"ServiceName\":\"Hospitality AI - Property 123\",\"Port\":8000}"
      }
    }
  }'
```

### 3. Configure Component

Edit component configuration in Greengrass deployment:

```json
{
  "ServiceName": "Hospitality AI - Grand Hotel",
  "ServiceType": "_hospitality._tcp.local.",
  "Port": 8000,
  "Properties": {
    "version": "1.0.0",
    "api": "v1",
    "endpoints": "sentiment,vision,speech,allocation,forecast",
    "manufacturer": "Hospitality AI SDK",
    "model": "AWS IoT Greengrass Core v2",
    "security": "network-isolated"
  }
}
```

### 4. Verify Server is Advertising

**On macOS:**
```bash
dns-sd -B _hospitality._tcp local.
dns-sd -L "Hospitality AI - Greengrass" _hospitality._tcp local.
ping greengrass.local
```

**On Linux:**
```bash
avahi-browse -r _hospitality._tcp
avahi-resolve -n greengrass.local
ping greengrass.local
```

**On Windows:**
```bash
dns-sd -B _hospitality._tcp local.
ping greengrass.local
```

### 5. Check Logs

```bash
sudo tail -f /greengrass/v2/logs/com.hospitality-ai.mdns-advertiser.log
```

Expected output:
```
2025-10-23 10:30:15 - INFO - Starting mDNS advertiser for Greengrass...
2025-10-23 10:30:15 - INFO - Local IP address: 192.168.20.10
2025-10-23 10:30:15 - INFO - Advertising mDNS service: Hospitality AI - Greengrass
2025-10-23 10:30:15 - INFO -   Type: _hospitality._tcp.local.
2025-10-23 10:30:15 - INFO -   Hostname: greengrass.local
2025-10-23 10:30:15 - INFO -   IP: 192.168.20.10
2025-10-23 10:30:15 - INFO -   Port: 8000
2025-10-23 10:30:15 - INFO - mDNS service successfully advertised!
2025-10-23 10:30:15 - INFO - Staff devices can now discover this server as 'greengrass.local'
```

---

## Client-Side Setup (Web Apps)

### 1. Install in Next.js Project

The mDNS discovery client is already included in `lib/client/`.

### 2. Use Discovery Component

```typescript
// app/dashboard/page.tsx
import { GreengrassDiscovery } from '@/lib/client/GreengrassDiscovery';

export default function DashboardPage() {
  const handleServerFound = (server) => {
    console.log('Connected to Greengrass:', server);
    // Initialize API client with server URL
  };

  const handleServerLost = () => {
    console.log('Lost connection to Greengrass');
    // Show offline mode UI
  };

  return (
    <div>
      <h1>Staff Dashboard</h1>
      <GreengrassDiscovery
        onServerFound={handleServerFound}
        onServerLost={handleServerLost}
        autoConnect={true}
      />
      {/* Rest of dashboard */}
    </div>
  );
}
```

### 3. Use Discovery Hook

```typescript
// components/SentimentAnalyzer.tsx
import { useGreengrassDiscovery } from '@/lib/client/GreengrassDiscovery';

export function SentimentAnalyzer() {
  const { server, discovering, getApiUrl } = useGreengrassDiscovery();

  const analyzeSentiment = async (text: string) => {
    if (!server) {
      throw new Error('Not connected to Greengrass');
    }

    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    return response.json();
  };

  if (discovering) return <div>Connecting...</div>;
  if (!server) return <div>Not connected</div>;

  return (
    <div>
      <h2>Sentiment Analyzer</h2>
      <p>Connected to {server.hostname}</p>
      {/* Analyzer UI */}
    </div>
  );
}
```

### 4. Manual Testing

Open browser console and test:

```javascript
// Discover server
const result = await discoverGreengrassServer({ timeout: 5000 });
console.log('Discovery result:', result);

// Check if on property network
const onNetwork = await isOnPropertyNetwork();
console.log('On property network:', onNetwork);

// Get API URL
const apiUrl = await getGreengrassUrl();
console.log('API URL:', apiUrl);
```

---

## Client-Side Setup (React Native)

### 1. Install Dependencies

```bash
# Install mDNS library
npm install react-native-zeroconf

# Install AsyncStorage for caching
npm install @react-native-async-storage/async-storage

# iOS
cd ios && pod install
```

### 2. Configure Permissions

**iOS** (`ios/YourApp/Info.plist`):
```xml
<key>NSBonjourServices</key>
<array>
  <string>_hospitality._tcp</string>
</array>
<key>NSLocalNetworkUsageDescription</key>
<string>We need access to your local network to discover the Greengrass server on property.</string>
```

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
```

### 3. Use Discovery Component

```typescript
// screens/DashboardScreen.tsx
import { GreengrassDiscovery } from '@/lib/client/GreengrassDiscovery.native';

export function DashboardScreen() {
  const handleServerFound = (server) => {
    console.log('Connected to Greengrass:', server);
    // Initialize API client
  };

  const handleServerLost = () => {
    console.log('Lost connection');
    // Show offline mode
  };

  return (
    <View>
      <Text>Staff Dashboard</Text>
      <GreengrassDiscovery
        onServerFound={handleServerFound}
        onServerLost={handleServerLost}
        autoConnect={true}
      />
    </View>
  );
}
```

### 4. Use Discovery Hook

```typescript
// components/SentimentAnalyzer.tsx
import { useGreengrassDiscovery } from '@/lib/client/GreengrassDiscovery.native';

export function SentimentAnalyzer() {
  const { server, discovering, discover, getApiUrl } = useGreengrassDiscovery();

  useEffect(() => {
    discover(); // Start discovery on mount
  }, []);

  const analyzeSentiment = async (text: string) => {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/api/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return response.json();
  };

  if (discovering) return <ActivityIndicator />;
  if (!server) return <Text>Not connected</Text>;

  return (
    <View>
      <Text>Connected to {server.hostname}</Text>
      {/* Analyzer UI */}
    </View>
  );
}
```

---

## Network Requirements

### Firewall Rules

**Greengrass Server**:
- Allow **UDP 5353** (mDNS multicast) on property network (VLAN 20)
- Allow **TCP 8000** (API gateway) from property network
- Block internet access from guest network (VLAN 10)

```bash
# Linux firewall (ufw)
sudo ufw allow proto udp from 192.168.20.0/24 to any port 5353
sudo ufw allow proto tcp from 192.168.20.0/24 to any port 8000

# Or iptables
sudo iptables -A INPUT -p udp -s 192.168.20.0/24 --dport 5353 -j ACCEPT
sudo iptables -A INPUT -p tcp -s 192.168.20.0/24 --dport 8000 -j ACCEPT
```

### VLAN Configuration

```
VLAN 10 (Guest WiFi):  192.168.10.0/24  - NO ACCESS to Greengrass
VLAN 20 (Staff WiFi):  192.168.20.0/24  - CAN ACCESS Greengrass
VLAN 30 (Server Room): 192.168.30.0/24  - Greengrass lives here
```

**Routing Rules**:
- VLAN 20 → VLAN 30: ALLOW (staff can reach servers)
- VLAN 10 → VLAN 30: DENY (guests cannot reach servers)
- VLAN 30 → Internet: ALLOW via Greengrass only (security proxy)

### DNS Configuration

Ensure mDNS resolution is enabled on all platforms:

**Linux** (`/etc/nsswitch.conf`):
```
hosts: files mdns4_minimal [NOTFOUND=return] dns mdns4
```

**macOS**: Bonjour is built-in, no configuration needed

**Windows**: Requires [Bonjour Print Services](https://support.apple.com/kb/DL999)

---

## Security Considerations

### 1. Network Isolation (CRITICAL)

**Apps ONLY work on property WiFi**:
- mDNS queries restricted to VLAN 20 (staff network)
- Greengrass ONLY advertises on property network interface
- Staff devices cannot discover Greengrass from outside

**Implementation**:
```python
# mdns_service.py - Bind to property network interface only
def advertise_service():
    # Only advertise on property network (VLAN 20)
    local_ip = get_local_ip_on_interface('eth1')  # Property network interface
    # Do NOT advertise on eth0 (WAN/internet)
```

### 2. Greengrass as Security Proxy

**Only Greengrass talks to cloud**:
- Staff devices NEVER access internet directly
- All cloud communication proxied through Greengrass
- Massive attack surface reduction

**Benefits**:
- Stolen/compromised staff device can't exfiltrate data
- Malware on staff device can't reach cloud
- Network isolation = defense in depth

### 3. Attack Scenarios

| Attack | Mitigation |
|--------|-----------|
| **mDNS spoofing** | Verify server certificate, check service properties |
| **Man-in-the-middle** | Use HTTPS for API calls (future: mTLS) |
| **Device theft** | Device only works on property network (inert outside) |
| **Malware on staff device** | Malware can't reach cloud (network isolation) |
| **Rogue Greengrass** | IT staff controls Greengrass deployment |

### 4. Production Hardening

**DO** (recommended for production):
- ✅ Use HTTPS/TLS for API gateway
- ✅ Implement mTLS (mutual TLS) for device authentication
- ✅ Rotate API keys regularly
- ✅ Monitor mDNS traffic for anomalies
- ✅ Deploy Greengrass on isolated VLAN

**DON'T** (security risks):
- ❌ Advertise Greengrass on guest WiFi (VLAN 10)
- ❌ Allow staff devices to access internet directly
- ❌ Use plain HTTP without TLS in production
- ❌ Share Greengrass IP outside property

---

## Troubleshooting

### Problem: Browser Can't Resolve `greengrass.local`

**Symptoms**:
- `ping greengrass.local` fails
- Browser shows "Server not found"
- Discovery timeout

**Solutions**:

1. **macOS**: Bonjour should be built-in
   - Check: `dns-sd -B _hospitality._tcp local.`
   - If fails, restart mDNSResponder: `sudo killall -HUP mDNSResponder`

2. **Linux**: Install and enable Avahi
   ```bash
   sudo apt-get install avahi-daemon avahi-utils
   sudo systemctl start avahi-daemon
   sudo systemctl enable avahi-daemon

   # Check /etc/nsswitch.conf
   # Should contain: hosts: files mdns4_minimal [NOTFOUND=return] dns mdns4
   ```

3. **Windows**: Install Bonjour Print Services
   - Download: https://support.apple.com/kb/DL999
   - Restart after installation
   - Check: `dns-sd -B _hospitality._tcp local.`

### Problem: React Native Can't Discover Service

**Symptoms**:
- `discoverGreengrassServer()` times out
- No services found

**Solutions**:

1. **iOS**: Check permissions in Info.plist
   ```xml
   <key>NSBonjourServices</key>
   <array>
     <string>_hospitality._tcp</string>
   </array>
   <key>NSLocalNetworkUsageDescription</key>
   <string>Required for Greengrass discovery</string>
   ```
   - User MUST grant local network permission when prompted

2. **Android**: Check permissions in AndroidManifest.xml
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   ```

3. **Both**: Verify WiFi connection
   ```typescript
   import NetInfo from '@react-native-community/netinfo';

   const state = await NetInfo.fetch();
   console.log('WiFi:', state.isConnected, state.type);
   ```

### Problem: mDNS Works, But API Calls Fail

**Symptoms**:
- Discovery succeeds
- `http://greengrass.local:8000/health` fails with 404 or timeout

**Solutions**:

1. **Check API gateway is running**:
   ```bash
   # On Greengrass server
   sudo /greengrass/v2/bin/greengrass-cli component list
   # Should show: com.hospitality-ai.api-gateway [RUNNING]
   ```

2. **Verify port 8000 is open**:
   ```bash
   sudo netstat -tlnp | grep 8000
   sudo lsof -i :8000
   ```

3. **Check firewall**:
   ```bash
   sudo ufw status
   # Should allow: 8000/tcp from 192.168.20.0/24
   ```

### Problem: Discovery Works, Then Stops

**Symptoms**:
- Initial discovery succeeds
- Later connections fail
- Cache shows stale server

**Solutions**:

1. **Clear cache**:
   ```typescript
   // Browser
   import { clearCachedServer } from '@/lib/client/mdns-discovery';
   clearCachedServer();

   // React Native
   import { clearCachedServer } from '@/lib/client/mdns-discovery.native';
   await clearCachedServer();
   ```

2. **Check Greengrass is still running**:
   ```bash
   sudo systemctl status greengrass
   ```

3. **Verify network connectivity**:
   - Staff device may have switched to guest WiFi (VLAN 10)
   - Check VLAN assignment

### Problem: Multiple Greengrass Servers Found

**Symptoms**:
- Discovery returns wrong server
- Apps connect to wrong property

**Solutions**:

1. **Use unique service names**:
   - Property 1: "Hospitality AI - Grand Hotel"
   - Property 2: "Hospitality AI - Beach Resort"

2. **Filter by properties**:
   ```typescript
   const result = await discoverGreengrassServer();
   if (result.server?.properties?.manufacturer === 'Hospitality AI SDK') {
     // Correct server
   }
   ```

3. **Manual configuration** for multi-property setups

---

## Testing Procedures

### 1. Local Development Testing

**Server-side** (on Greengrass device):
```bash
cd lib/greengrass/components/mdns-advertiser
python3 mdns_service.py
```

**Client-side** (browser console):
```javascript
const result = await discoverGreengrassServer({ timeout: 5000 });
console.log('Found:', result.server);
```

### 2. Integration Testing

Create test script:

```typescript
// tests/mdns-integration.test.ts
import { discoverGreengrassServer, isOnPropertyNetwork } from '@/lib/client/mdns-discovery';

describe('mDNS Integration', () => {
  test('should discover Greengrass server', async () => {
    const result = await discoverGreengrassServer({ timeout: 10000 });
    expect(result.server).not.toBeNull();
    expect(result.server?.hostname).toBe('greengrass.local');
    expect(result.server?.port).toBe(8000);
  });

  test('should verify property network connection', async () => {
    const onNetwork = await isOnPropertyNetwork();
    expect(onNetwork).toBe(true);
  });

  test('should cache discovered server', async () => {
    const result1 = await discoverGreengrassServer();
    const result2 = await discoverGreengrassServer();
    expect(result2.method).toBe('cache');
    expect(result2.latency).toBeLessThan(result1.latency);
  });
});
```

Run tests:
```bash
npm test -- tests/mdns-integration.test.ts
```

### 3. End-to-End Testing

**Scenario 1: Fresh Installation**
1. Deploy Greengrass with mDNS component
2. Connect staff tablet to property WiFi
3. Open web app (should auto-discover)
4. Verify API calls work

**Scenario 2: Network Switch**
1. Connect to property WiFi (should work)
2. Switch to guest WiFi (should fail)
3. Switch back to property WiFi (should reconnect)

**Scenario 3: Offline Mode**
1. Connect to Greengrass (online)
2. Disconnect internet on Greengrass (should still work - offline!)
3. All local ML operations continue

**Scenario 4: Multiple Properties**
1. Deploy to Property A and Property B
2. Connect tablet to Property A WiFi
3. Should discover Property A server (not Property B)

### 4. Performance Testing

Measure discovery latency:

```typescript
const iterations = 10;
const results = [];

for (let i = 0; i < iterations; i++) {
  await clearCachedServer();
  const result = await discoverGreengrassServer();
  results.push(result.latency);
}

const avgLatency = results.reduce((a, b) => a + b) / results.length;
console.log(`Average discovery latency: ${avgLatency.toFixed(0)}ms`);
// Expected: <2000ms for mDNS, <100ms for cache
```

---

## FAQ

### Q: Does mDNS work across subnets?

**A**: No. mDNS uses multicast (224.0.0.251) which is not routed. It only works on the local subnet (VLAN 20).

**Workaround**: If Greengrass is on a different subnet (VLAN 30), configure router to forward mDNS:
- **Avahi reflector** (Linux): Reflects mDNS across VLANs
- **UniFi**: Enable "Multicast DNS" in network settings
- **MikroTik**: Use IGMP proxy

### Q: Can I use DNS instead of mDNS?

**A**: Yes! If you have a local DNS server:
1. Add A record: `greengrass.local → 192.168.20.10`
2. Apps will resolve via DNS instead of mDNS
3. Still need discovery for dynamic IPs

### Q: What if IT staff changes Greengrass IP?

**A**: mDNS handles this automatically:
- Greengrass advertises new IP via mDNS
- Clients discover new IP on next query
- No manual reconfiguration needed

### Q: Does mDNS work on mobile data?

**A**: No. mDNS only works on local WiFi. Apps MUST be on property network.

**This is a SECURITY FEATURE**: Staff devices only work on-site, not from outside.

### Q: Can guests discover the Greengrass server?

**A**: No (if configured correctly):
- Greengrass only advertises on VLAN 20 (staff network)
- Guest WiFi is on VLAN 10 (isolated)
- Firewall blocks VLAN 10 → VLAN 30 traffic

### Q: What happens if mDNS discovery fails?

**A**: Multiple fallbacks:
1. **Cache**: Check cached server (valid for 24h)
2. **Scan**: Scan common local IPs (192.168.20.x, etc.)
3. **Manual**: Show IP entry form

### Q: How do I disable mDNS for a specific deployment?

**A**: Remove the mDNS component from deployment:

```bash
aws greengrassv2 create-deployment \
  --target-arn "arn:aws:iot:us-east-1:ACCOUNT:thinggroup/HospitalityAI" \
  --components '{}'
```

Then configure apps with static IP.

---

## Cost Analysis

### Infrastructure Costs

| Item | Cost | Frequency |
|------|------|-----------|
| **mDNS Component** | $0 | Free (runs on existing Greengrass) |
| **Network bandwidth** | $0 | Multicast (no cloud API calls) |
| **S3 artifact storage** | $0.01/month | One-time (store recipe/script) |
| **Development time** | $500 | One-time (already implemented) |

**Total**: ~$0/month per property (free!)

### Benefits

| Benefit | Value |
|---------|-------|
| **Reduced IT support time** | 30 min/property/year × $50/hr = **$25/year** saved |
| **Zero manual configuration** | Staff devices "just work" |
| **Network resilience** | Handles IP changes automatically |
| **Security** | Apps only work on property network |

**ROI**: Infinite (zero cost, positive value)

---

## Roadmap

### Current State (v1.0.0) ✅
- [x] Python mDNS advertiser (Greengrass component)
- [x] Browser discovery client (OS-level .local resolution)
- [x] React Native discovery client (native mDNS APIs)
- [x] Caching and fallbacks
- [x] Manual IP entry
- [x] Documentation

### Future Enhancements (v1.1.0+)

**Q1 2026**:
- [ ] **DNS-SD over DNS** - Discovery via regular DNS queries (works across subnets)
- [ ] **Service versioning** - Advertise API version, clients check compatibility
- [ ] **Multi-region discovery** - Discover multiple properties, let user choose
- [ ] **Healthcheck integration** - Auto-rediscover if server becomes unhealthy

**Q2 2026**:
- [ ] **mTLS** - Mutual TLS authentication between apps and Greengrass
- [ ] **Discovery metrics** - Track discovery success rate, latency
- [ ] **Admin dashboard** - View all discovered devices, connection status
- [ ] **API key distribution** - Distribute API keys via mDNS TXT records

**Q3 2026**:
- [ ] **WebRTC data channels** - Peer-to-peer communication between devices
- [ ] **Service mesh** - Multiple Greengrass servers, automatic failover
- [ ] **Zero-trust security** - Per-device certificates, granular access control

---

## Conclusion

The mDNS service discovery implementation provides:

1. **Zero-configuration** staff device onboarding
2. **Network resilience** (handles IP changes)
3. **Security** (network isolation, apps only work on-site)
4. **Cost savings** (zero infrastructure cost, reduced IT support)

**For medium/large hotels** (40% of market), this is a critical feature for on-premise Greengrass deployments. Staff simply connect to property WiFi and apps automatically discover the server.

**Next Steps**:
1. Deploy mDNS component to all Greengrass servers
2. Integrate discovery clients into web/mobile apps
3. Test across iOS, Android, Windows, macOS, Linux
4. Document for IT staff in hotel onboarding guide

---

## References

- **mDNS Specification**: [RFC 6762](https://tools.ietf.org/html/rfc6762)
- **DNS-SD Specification**: [RFC 6763](https://tools.ietf.org/html/rfc6763)
- **Zeroconf Library**: [python-zeroconf](https://github.com/jstasiak/python-zeroconf)
- **React Native Zeroconf**: [react-native-zeroconf](https://github.com/balthazar/react-native-zeroconf)
- **Avahi (Linux)**: [avahi.org](https://www.avahi.org/)
- **Bonjour (Apple)**: [Apple Bonjour](https://developer.apple.com/bonjour/)

**Internal Documentation**:
- `.agent/docs/market-segmented-architecture.md` - Why we need mDNS
- `.agent/docs/security-architecture.md` - Network isolation security
- `lib/greengrass/README.md` - Greengrass deployment guide
