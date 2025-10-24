#!/usr/bin/env tsx
/**
 * Test UniFi WiFi-Based Location Detection
 *
 * Works with ANY UniFi AP (including older models like UAP-AC-LR)
 * No BLE beacons required - uses WiFi AP connection tracking
 *
 * Usage:
 *   UNIFI_IP=192.168.1.93 UNIFI_USER=admin UNIFI_PASS=yourpass tsx scripts/test-unifi-wifi-location.ts
 */

import https from 'https';

// Disable SSL certificate validation (self-signed cert)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const UNIFI_URL = `https://${process.env.UNIFI_IP || '192.168.1.93'}:8443`;
const USERNAME = process.env.UNIFI_USER || 'admin';
const PASSWORD = process.env.UNIFI_PASS || '';

interface UniFiAP {
  name: string;
  model: string;
  mac: string;
  ip: string;
  clients: number;
  status: string;
}

interface UniFiClient {
  hostname: string;
  ip: string;
  mac: string;
  apMac: string;
  apName: string;
  signal: number;
  connectedAt: Date;
}

let cookie: string = '';

async function request(endpoint: string, options: any = {}) {
  return new Promise<any>((resolve, reject) => {
    const url = `${UNIFI_URL}${endpoint}`;

    const req = https.request(url, {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookie,
      },
    }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }

        // Save cookie from login
        if (res.headers['set-cookie']) {
          cookie = res.headers['set-cookie'][0].split(';')[0];
        }

        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function login(): Promise<void> {
  console.log(`🔐 Logging in to UniFi Controller at ${UNIFI_URL}...\n`);

  try {
    await request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    console.log('✅ Successfully logged in!\n');
  } catch (error) {
    console.error('❌ Login failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log(`   1. Check Cloud Key is accessible: ping ${process.env.UNIFI_IP}`);
    console.log(`   2. Verify credentials: username="${USERNAME}"`);
    console.log(`   3. Try logging in via web UI: ${UNIFI_URL}`);
    process.exit(1);
  }
}

async function getAccessPoints(): Promise<UniFiAP[]> {
  console.log('📡 Fetching Access Points...\n');

  const response = await request('/api/s/default/stat/device');
  const devices = response.data || [];

  // Filter to APs only (not switches, gateways, etc.)
  const aps = devices
    .filter((d: any) => d.type === 'uap')
    .map((ap: any) => ({
      name: ap.name || 'Unnamed AP',
      model: ap.model,
      mac: ap.mac,
      ip: ap.ip,
      clients: ap.num_sta || 0,
      status: ap.state === 1 ? 'online' : 'offline',
    }));

  console.log(`✅ Found ${aps.length} Access Point(s):\n`);

  for (const ap of aps) {
    console.log(`   📍 ${ap.name}`);
    console.log(`      Model: ${ap.model}`);
    console.log(`      IP: ${ap.ip}`);
    console.log(`      Status: ${ap.status}`);
    console.log(`      Connected Clients: ${ap.clients}`);
    console.log('');
  }

  return aps;
}

async function getConnectedClients(aps: UniFiAP[]): Promise<UniFiClient[]> {
  console.log('👥 Fetching Connected WiFi Clients...\n');

  const response = await request('/api/s/default/stat/sta');
  const clientsData = response.data || [];

  const clients = clientsData.map((c: any) => {
    const ap = aps.find(a => a.mac === c.ap_mac);

    return {
      hostname: c.hostname || c.name || 'Unknown',
      ip: c.ip,
      mac: c.mac,
      apMac: c.ap_mac,
      apName: ap?.name || 'Unknown AP',
      signal: c.signal || c.rssi || 0,
      connectedAt: new Date((c.first_seen || 0) * 1000),
    };
  });

  console.log(`✅ Found ${clients.length} connected client(s):\n`);

  for (const client of clients) {
    console.log(`   👤 ${client.hostname}`);
    console.log(`      IP: ${client.ip}`);
    console.log(`      MAC: ${client.mac}`);
    console.log(`      Connected to AP: ${client.apName}`);
    console.log(`      Signal: ${client.signal} dBm`);
    console.log(`      Zone: ${mapAPToZone(client.apName)}`);
    console.log(`      Connected at: ${client.connectedAt.toLocaleString()}`);
    console.log('');
  }

  return clients;
}

function mapAPToZone(apName: string): string {
  // Map AP name to logical zone
  const name = apName.toLowerCase();

  if (name.includes('restaurant') || name.includes('dining') || name.includes('kitchen')) {
    return 'restaurant';
  }
  if (name.includes('spa') || name.includes('pool') || name.includes('gym') || name.includes('fitness')) {
    return 'spa';
  }
  if (name.includes('lobby') || name.includes('reception') || name.includes('front')) {
    return 'lobby';
  }
  if (name.includes('room') || name.includes('floor') || name.includes('bedroom')) {
    return 'room';
  }
  if (name.includes('office') || name.includes('back')) {
    return 'office';
  }

  return 'unknown';
}

async function monitorRealTime(aps: UniFiAP[]): Promise<void> {
  console.log('🔄 Monitoring clients in real-time (press Ctrl+C to stop)...\n');

  const clientLocations = new Map<string, string>(); // mac -> apMac

  setInterval(async () => {
    try {
      const response = await request('/api/s/default/stat/sta');
      const clientsData = response.data || [];

      for (const c of clientsData) {
        const previousAP = clientLocations.get(c.mac);
        const currentAP = c.ap_mac;

        if (previousAP && previousAP !== currentAP) {
          // Client roamed to different AP!
          const oldAP = aps.find(a => a.mac === previousAP);
          const newAP = aps.find(a => a.mac === currentAP);

          const oldZone = mapAPToZone(oldAP?.name || '');
          const newZone = mapAPToZone(newAP?.name || '');

          console.log(`🚶 Client roamed: ${c.hostname || c.ip}`);
          console.log(`   From: ${oldAP?.name} (${oldZone})`);
          console.log(`   To: ${newAP?.name} (${newZone})`);
          console.log(`   Time: ${new Date().toLocaleTimeString()}`);
          console.log('');
        }

        clientLocations.set(c.mac, currentAP);
      }
    } catch (error) {
      console.error('Error monitoring:', error);
    }
  }, 5000); // Check every 5 seconds
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   UniFi WiFi Location Detection Test              ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║ Cloud Key: ${UNIFI_URL.padEnd(42)}║`);
  console.log('╚════════════════════════════════════════════════════╝\n');

  if (!PASSWORD) {
    console.error('❌ Error: UNIFI_PASS environment variable not set\n');
    console.log('Usage:');
    console.log('  UNIFI_IP=192.168.1.93 UNIFI_USER=admin UNIFI_PASS=yourpass tsx scripts/test-unifi-wifi-location.ts\n');
    process.exit(1);
  }

  // Step 1: Login
  await login();

  // Step 2: Get Access Points
  const aps = await getAccessPoints();

  if (aps.length === 0) {
    console.log('⚠️  No Access Points found. Check UniFi Controller setup.\n');
    process.exit(1);
  }

  // Step 3: Get Connected Clients
  const clients = await getConnectedClients(aps);

  if (clients.length === 0) {
    console.log('⚠️  No clients connected. Connect a device to WiFi first.\n');
  }

  // Step 4: Monitor real-time (optional)
  console.log('═'.repeat(60));
  console.log('');
  console.log('💡 Test Instructions:');
  console.log('   1. Connect your phone to WiFi');
  console.log('   2. Find your device in the list above');
  console.log('   3. Note which AP and zone it\'s in');
  console.log('   4. Walk to different area (if you have multiple APs)');
  console.log('   5. Watch for roaming event (zone change)\n');
  console.log('═'.repeat(60));
  console.log('');

  await monitorRealTime(aps);
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
