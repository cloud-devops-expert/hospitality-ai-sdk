# UniFi Local Testing Guide

## What You Have

- ✅ UniFi Cloud Key (Network Controller)
- ✅ UniFi Access Points (WiFi + potential BLE beacons)

## Step 1: Find Your Cloud Key IP Address

### Option A: Check your router's DHCP clients
- Look for device named "Cloud Key" or "UCK-G2"
- Note the IP address (e.g., `192.168.1.50`)

### Option B: Use UniFi mobile app
1. Open UniFi app on phone
2. Look at controller address
3. Should show: `192.168.x.x:8443`

### Option C: Use discovery tool
```bash
# Install UniFi Discovery Tool
# Or just ping common addresses
ping 192.168.1.1
ping 192.168.1.50
ping 192.168.1.100

# Cloud Key usually responds to mDNS
ping unifi.local
```

**Write down your Cloud Key IP**: `_________________`

---

## Step 2: Access UniFi Controller Web UI

1. **Open browser** (Chrome recommended)
2. **Navigate to**: `https://YOUR_CLOUD_KEY_IP:8443`
   - Example: `https://192.168.1.50:8443`
3. **Accept SSL warning** (self-signed certificate)
4. **Login with your UniFi credentials**
   - Username: (your UniFi admin username)
   - Password: (your UniFi admin password)

**✅ Checkpoint**: You should see UniFi Network Controller dashboard

---

## Step 3: Check Your Access Points

1. **Go to Devices** (left sidebar)
2. **Find your Access Points**
3. **Note for each AP**:
   - Name (e.g., "Living Room", "Office")
   - Model (e.g., "U6-Lite", "U6-LR", "UAP-AC-PRO")
   - IP Address
   - Status (should be "Connected")

**List your APs**:
```
AP 1: Name: _____________ Model: _____________ IP: _____________
AP 2: Name: _____________ Model: _____________ IP: _____________
AP 3: Name: _____________ Model: _____________ IP: _____________
```

---

## Step 4: Check if Your APs Support BLE Beacons

**UniFi 6 Series** (has built-in BLE):
- ✅ U6-Lite
- ✅ U6-LR (Long Range)
- ✅ U6-Pro
- ✅ U6-Mesh
- ✅ U6-Extender
- ✅ U6-IW (In-Wall)

**Older Models** (NO built-in BLE):
- ❌ UAP-AC-PRO
- ❌ UAP-AC-LITE
- ❌ UAP-AC-HD
- ❌ UAP-nanoHD

**Do you have UniFi 6 APs?** (Yes/No): _____________

### If YES (UniFi 6 series):
✅ You can test beacon location detection immediately
→ Continue to Step 5

### If NO (older APs):
⚠️ You can still test WiFi-based coarse location
→ Skip to Step 6 (WiFi Location Only)

---

## Step 5: Enable BLE Beacons on UniFi 6 APs

### Via UniFi Controller Web UI

1. **Go to Settings** → **System** → **Advanced**
2. **Scroll to "Bluetooth LE"**
3. **Check if enabled**:
   - If you see "Enable Bluetooth LE" toggle → turn it ON
   - Click "Apply Changes"

4. **Configure each AP**:
   - Go to **Devices**
   - Click on a UniFi 6 AP
   - Go to **Settings** tab
   - Scroll to **Bluetooth LE**
   - **Enable BLE** (toggle ON)
   - **Configure**:
     - UUID: `f7826da6-4fa2-4e98-8024-bc5b71e0893e`
     - Major: `1` (increment for each AP: 1, 2, 3, etc.)
     - Minor: `1`
   - Click **Apply**

**BLE Configuration**:
```
AP 1: UUID: f7826da6-4fa2-4e98-8024-bc5b71e0893e  Major: 1  Minor: 1
AP 2: UUID: f7826da6-4fa2-4e98-8024-bc5b71e0893e  Major: 2  Minor: 1
AP 3: UUID: f7826da6-4fa2-4e98-8024-bc5b71e0893e  Major: 3  Minor: 1
```

**Note**: Same UUID for all APs, different Major value

---

## Step 6: Enable UniFi API Access

### Create Local API User (Recommended)

1. **Go to Settings** → **Admins**
2. **Add New Admin**:
   - Name: `hospitality-api`
   - Email: (your email)
   - Role: **Read Only** (sufficient for API access)
   - Password: (create strong password)
3. **Click Create**

**Write down credentials**:
```
API Username: hospitality-api
API Password: _______________________
```

---

## Step 7: Test UniFi API Connection

### Option A: Using curl (Terminal)

```bash
# Replace with your Cloud Key IP
UNIFI_URL="https://192.168.1.50:8443"
UNIFI_USERNAME="hospitality-api"
UNIFI_PASSWORD="your-password"

# Login to UniFi API
curl -k -c /tmp/unifi-cookie.txt \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$UNIFI_USERNAME\",\"password\":\"$UNIFI_PASSWORD\"}" \
  "$UNIFI_URL/api/login"

# Should return: {"meta":{"rc":"ok"},"data":[]}

# Get list of Access Points
curl -k -b /tmp/unifi-cookie.txt \
  "$UNIFI_URL/api/s/default/stat/device" \
  | jq '.data[] | {name: .name, model: .model, mac: .mac, ip: .ip}'

# Get connected WiFi clients
curl -k -b /tmp/unifi-cookie.txt \
  "$UNIFI_URL/api/s/default/stat/sta" \
  | jq '.data[] | {hostname: .hostname, ip: .ip, ap_mac: .ap_mac}'
```

**Expected Output**:
```json
{
  "name": "Living Room",
  "model": "U6-Lite",
  "mac": "00:11:22:33:44:55",
  "ip": "192.168.1.51"
}
```

### Option B: Using Node.js Script

Create a test script:

```typescript
// scripts/test-unifi-connection.ts

import fetch from 'node-fetch';

async function testUniFiConnection() {
  const UNIFI_URL = 'https://192.168.1.50:8443'; // YOUR CLOUD KEY IP
  const USERNAME = 'hospitality-api';
  const PASSWORD = 'your-password';

  // Disable SSL certificate validation (self-signed cert)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  console.log('🔌 Connecting to UniFi Controller...\n');

  // Step 1: Login
  const loginResponse = await fetch(`${UNIFI_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed:', loginResponse.status);
    return;
  }

  const cookie = loginResponse.headers.get('set-cookie');
  console.log('✅ Logged in to UniFi Controller\n');

  // Step 2: Get Access Points
  const devicesResponse = await fetch(`${UNIFI_URL}/api/s/default/stat/device`, {
    headers: { Cookie: cookie || '' },
  });

  const devicesData = await devicesResponse.json();
  const accessPoints = devicesData.data.filter((d: any) => d.type === 'uap');

  console.log(`📡 Found ${accessPoints.length} Access Point(s):\n`);

  for (const ap of accessPoints) {
    console.log(`  Name: ${ap.name}`);
    console.log(`  Model: ${ap.model}`);
    console.log(`  IP: ${ap.ip}`);
    console.log(`  MAC: ${ap.mac}`);
    console.log(`  BLE Enabled: ${ap.ble_enabled || false}`);
    if (ap.ble_enabled) {
      console.log(`  BLE UUID: ${ap.ble_uuid}`);
      console.log(`  BLE Major: ${ap.ble_major}`);
      console.log(`  BLE Minor: ${ap.ble_minor}`);
    }
    console.log('');
  }

  // Step 3: Get Connected Clients
  const clientsResponse = await fetch(`${UNIFI_URL}/api/s/default/stat/sta`, {
    headers: { Cookie: cookie || '' },
  });

  const clientsData = await clientsResponse.json();
  console.log(`👥 Connected WiFi Clients: ${clientsData.data.length}\n`);

  for (const client of clientsData.data.slice(0, 5)) {
    console.log(`  Hostname: ${client.hostname || 'Unknown'}`);
    console.log(`  IP: ${client.ip}`);
    console.log(`  MAC: ${client.mac}`);
    console.log(`  Connected to AP: ${client.ap_mac}`);
    console.log(`  Signal: ${client.signal || 'N/A'} dBm`);
    console.log('');
  }
}

testUniFiConnection().catch(console.error);
```

**Run it**:
```bash
tsx scripts/test-unifi-connection.ts
```

**✅ Checkpoint**: You should see your APs and connected clients listed

---

## Step 8: Test Beacon Detection (If you have UniFi 6 APs)

### Using Android Phone + Chrome Browser

1. **Connect phone to your WiFi**
2. **Open Chrome** on Android
3. **Navigate to**: `chrome://flags`
4. **Enable**: "Experimental Web Platform features"
5. **Restart Chrome**

6. **Create test HTML file**:

```html
<!-- test-beacon-scanner.html -->
<!DOCTYPE html>
<html>
<head>
  <title>UniFi Beacon Test</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial; padding: 20px; }
    button { padding: 15px 30px; font-size: 18px; margin: 10px 0; }
    .beacon { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
    .close { background: #4CAF50; color: white; }
    .far { background: #ff9800; color: white; }
  </style>
</head>
<body>
  <h1>UniFi Beacon Scanner</h1>

  <button onclick="requestPermission()">1. Request Bluetooth Permission</button>
  <button onclick="startScanning()">2. Start Scanning</button>
  <button onclick="stopScanning()">3. Stop Scanning</button>

  <div id="status"></div>
  <div id="beacons"></div>

  <script>
    let scan = null;

    async function requestPermission() {
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [],
        });
        document.getElementById('status').innerHTML = '✅ Bluetooth permission granted';
      } catch (error) {
        document.getElementById('status').innerHTML = '❌ Permission denied: ' + error;
      }
    }

    async function startScanning() {
      try {
        document.getElementById('status').innerHTML = '🔍 Scanning for beacons...';

        scan = await navigator.bluetooth.requestLEScan({
          filters: [
            { services: ['0000feaa-0000-1000-8000-00805f9b34fb'] }, // Eddystone
          ],
          keepRepeatedDevices: true,
        });

        navigator.bluetooth.addEventListener('advertisementreceived', (event) => {
          const rssi = event.rssi;
          const device = event.device;

          // Calculate approximate distance
          const txPower = -59; // Typical calibrated value
          const distance = Math.pow(10, (txPower - rssi) / 20);

          const beaconDiv = document.createElement('div');
          beaconDiv.className = 'beacon ' + (distance < 2 ? 'close' : 'far');
          beaconDiv.innerHTML = `
            <strong>${device.name || 'Unknown Beacon'}</strong><br>
            RSSI: ${rssi} dBm<br>
            Distance: ${distance.toFixed(1)} meters<br>
            Time: ${new Date().toLocaleTimeString()}
          `;

          const beaconsDiv = document.getElementById('beacons');
          beaconsDiv.insertBefore(beaconDiv, beaconsDiv.firstChild);

          // Keep only last 10 detections
          while (beaconsDiv.children.length > 10) {
            beaconsDiv.removeChild(beaconsDiv.lastChild);
          }
        });

        document.getElementById('status').innerHTML = '✅ Scanning active';
      } catch (error) {
        document.getElementById('status').innerHTML = '❌ Scan failed: ' + error;
      }
    }

    function stopScanning() {
      if (scan) {
        scan.stop();
        document.getElementById('status').innerHTML = '⏸️ Scanning stopped';
      }
    }
  </script>
</body>
</html>
```

7. **Open file in Chrome on Android**
8. **Click "Request Bluetooth Permission"** → Allow
9. **Click "Start Scanning"**
10. **Walk near your UniFi 6 APs**
11. **You should see beacons detected** with RSSI and distance

**✅ Checkpoint**: Beacons detected when near UniFi 6 APs

---

## Step 9: Test WiFi Location Detection

### Check Which AP Your Phone is Connected To

```bash
# On Cloud Key, check connected clients
curl -k -b /tmp/unifi-cookie.txt \
  "https://192.168.1.50:8443/api/s/default/stat/sta" \
  | jq '.data[] | select(.hostname == "YOUR_PHONE_HOSTNAME") | {hostname, ip, ap_mac, signal}'
```

**Or via UniFi Controller Web UI**:
1. Go to **Clients**
2. Find your phone (look for hostname or IP)
3. Note which AP it's connected to
4. **Walk around your space**
5. **Watch client roam to different APs**

**✅ Checkpoint**: You can see which AP your phone is connected to

---

## Step 10: Map APs to Zones

For testing, create a simple zone mapping:

```typescript
// Map your APs to logical zones
const apZoneMapping = {
  '00:11:22:33:44:55': 'living-room',  // AP 1 MAC → zone
  '66:77:88:99:AA:BB': 'office',       // AP 2 MAC → zone
  'CC:DD:EE:FF:00:11': 'kitchen',      // AP 3 MAC → zone
};

// When guest connects to AP with MAC '00:11:22:33:44:55'
// → location: { zone: 'living-room', area: 'Living Room AP' }
```

---

## Step 11: Test Complete Integration

### Run Full Test Script

```typescript
// scripts/test-unifi-integration.ts

import { UniFiClient } from '../lib/integrations/unifi/client';

async function testCompleteIntegration() {
  const unifi = new UniFiClient('https://192.168.1.50:8443');

  // Step 1: Login
  console.log('1️⃣ Logging in to UniFi...');
  await unifi.login('hospitality-api', 'your-password');
  console.log('✅ Logged in\n');

  // Step 2: Get Access Points
  console.log('2️⃣ Fetching Access Points...');
  const aps = await unifi.getAccessPoints('default');
  console.log(`✅ Found ${aps.length} APs\n`);

  for (const ap of aps) {
    console.log(`📡 ${ap.name}`);
    console.log(`   Model: ${ap.model}`);
    console.log(`   IP: ${ap.ip}`);
    console.log(`   BLE Enabled: ${ap.ble.enabled}`);
    if (ap.ble.enabled) {
      console.log(`   BLE UUID: ${ap.ble.uuid}`);
      console.log(`   BLE Major: ${ap.ble.major}`);
    }
    console.log('');
  }

  // Step 3: Get Connected Clients
  console.log('3️⃣ Fetching Connected Clients...');
  const clients = await unifi.getClients('default');
  console.log(`✅ Found ${clients.length} connected clients\n`);

  for (const client of clients.slice(0, 5)) {
    console.log(`👤 ${client.hostname || 'Unknown'}`);
    console.log(`   IP: ${client.ip}`);
    console.log(`   Connected to: ${client.apName}`);
    console.log(`   Signal: ${client.signal} dBm`);

    // Determine zone based on AP
    const ap = aps.find(a => a.mac === client.apMac);
    const zone = ap ? mapAPToZone(ap.name) : 'unknown';
    console.log(`   Zone: ${zone}`);
    console.log('');
  }

  // Step 4: Monitor for your phone
  console.log('4️⃣ Looking for your phone...');
  const yourPhoneMAC = 'YOUR_PHONE_MAC'; // Replace with your phone's MAC
  const yourPhone = clients.find(c => c.mac === yourPhoneMAC);

  if (yourPhone) {
    console.log(`\n📱 Found your phone!`);
    console.log(`   Connected to: ${yourPhone.apName}`);
    console.log(`   Signal: ${yourPhone.signal} dBm`);

    const ap = aps.find(a => a.mac === yourPhone.apMac);
    console.log(`   Location: ${mapAPToZone(ap?.name || '')}`);
  } else {
    console.log(`\n⚠️ Your phone not found. Make sure it's connected to WiFi.`);
  }
}

function mapAPToZone(apName: string): string {
  // Simple mapping based on AP name
  if (apName.toLowerCase().includes('living')) return 'living-room';
  if (apName.toLowerCase().includes('office')) return 'office';
  if (apName.toLowerCase().includes('kitchen')) return 'kitchen';
  if (apName.toLowerCase().includes('bedroom')) return 'bedroom';
  return 'unknown';
}

testCompleteIntegration().catch(console.error);
```

**Run it**:
```bash
tsx scripts/test-unifi-integration.ts
```

**Expected Output**:
```
1️⃣ Logging in to UniFi...
✅ Logged in

2️⃣ Fetching Access Points...
✅ Found 3 APs

📡 Living Room
   Model: U6-Lite
   IP: 192.168.1.51
   BLE Enabled: true
   BLE UUID: f7826da6-4fa2-4e98-8024-bc5b71e0893e
   BLE Major: 1

📡 Office
   Model: U6-LR
   IP: 192.168.1.52
   BLE Enabled: true
   BLE UUID: f7826da6-4fa2-4e98-8024-bc5b71e0893e
   BLE Major: 2

3️⃣ Fetching Connected Clients...
✅ Found 5 connected clients

👤 iPhone
   IP: 192.168.1.100
   Connected to: Living Room
   Signal: -45 dBm
   Zone: living-room

📱 Found your phone!
   Connected to: Living Room
   Signal: -45 dBm
   Location: living-room
```

---

## Troubleshooting

### Issue: Can't access Cloud Key at https://IP:8443

**Solution**:
- Check Cloud Key is powered on (LED should be blue)
- Check you're on same network as Cloud Key
- Try `http://IP` (port 80) or `https://IP:443`
- Try `unifi.local:8443`

### Issue: API login fails (401 Unauthorized)

**Solution**:
- Double-check username and password
- Make sure API user has "Read Only" or "Admin" role
- Try logging in via web UI first to confirm credentials

### Issue: No BLE settings in UniFi Controller

**Solution**:
- Check AP model (only UniFi 6 series has BLE)
- Update UniFi Controller firmware (need 6.0+)
- Update AP firmware to latest

### Issue: Beacons not detected on Android

**Solution**:
- Enable "Experimental Web Platform features" in `chrome://flags`
- Check Bluetooth is ON on phone
- Grant Location permission to Chrome (required for Bluetooth)
- Try moving closer to AP (<3 meters)

### Issue: Can't see connected clients

**Solution**:
- Make sure your phone is connected to WiFi (not mobile data)
- Check UniFi Controller → Clients tab
- Client may take 30-60 seconds to appear after connecting

---

## Next Steps

Once you have this working locally:

1. **Create API integration library** (`lib/integrations/unifi/client.ts`)
2. **Map your rooms to zones** (living-room → restaurant, office → spa, etc.)
3. **Test beacon detection** on Android Chrome
4. **Test WiFi location** by walking between APs
5. **Integrate with WebRTC P2P** for local orders
6. **Build guest portal UI** that shows location-aware features

---

## Summary

**What You're Testing**:
1. ✅ UniFi API connection (fetch APs, clients)
2. ✅ BLE beacon detection (if UniFi 6 APs)
3. ✅ WiFi coarse location (which AP client connected to)
4. ✅ Real-time client roaming (AP switches when you walk around)
5. ✅ Zone mapping (AP name → logical zone)

**Hardware You Need**:
- ✅ UniFi Cloud Key (you have it)
- ✅ UniFi Access Points (you have them)
- ✅ Android phone with Chrome (for beacon testing)
- ✅ Same WiFi network (for API access)

**No Additional Hardware Required!** Everything you need is already in place.

Let me know what model APs you have and I can help you configure them!
