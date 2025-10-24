#!/usr/bin/env tsx
/**
 * Test UniFi Unified Client (Cloud + Local Fallback)
 *
 * Tries UniFi Cloud API first, falls back to local controller.
 *
 * Usage:
 *   # Option 1: Using .env.local file (recommended)
 *   npm run unifi:test
 *
 *   # Option 2: Cloud API (preferred)
 *   UNIFI_CLOUD_KEY=your-api-key tsx scripts/test-unifi-unified.ts
 *
 *   # Option 3: Local controller (fallback)
 *   UNIFI_IP=192.168.1.93 UNIFI_USER=admin UNIFI_PASS=yourpass tsx scripts/test-unifi-unified.ts
 *
 *   # Option 4: Both (tries cloud first, falls back to local)
 *   UNIFI_CLOUD_KEY=your-api-key UNIFI_IP=192.168.1.93 UNIFI_USER=admin UNIFI_PASS=yourpass tsx scripts/test-unifi-unified.ts
 */

import dotenv from 'dotenv';
import { UnifiedUniFiClient } from '../lib/integrations/unifi/unified-client';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   UniFi Unified Client Test                       ║');
  console.log('║   (Cloud API + Local Controller Fallback)         ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Initialize client with both cloud and local config
  const localUrl = process.env.UNIFI_IP
    ? (process.env.UNIFI_PORT
        ? `https://${process.env.UNIFI_IP}:${process.env.UNIFI_PORT}`
        : `https://${process.env.UNIFI_IP}:8443`)
    : undefined;

  console.log(`Local URL: ${localUrl}\n`);

  const client = new UnifiedUniFiClient({
    // Cloud API (preferred)
    cloudApiKey: process.env.UNIFI_CLOUD_KEY,

    // Local controller (fallback)
    localUrl,
    localUsername: process.env.UNIFI_USER,
    localPassword: process.env.UNIFI_PASS,
    localApiToken: process.env.UNIFI_LOCAL_TOKEN, // For MFA-enabled accounts

    // Options
    site: 'default',
    debug: true,
  });

  // Step 1: Connect (tries cloud first, falls back to local)
  console.log('━'.repeat(60));
  console.log('Step 1: Connecting to UniFi...\n');

  let mode: 'cloud' | 'local' | 'unknown';
  try {
    mode = await client.connect();
    console.log(`\n✅ Connected via: ${mode.toUpperCase()}\n`);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   Cloud API:');
    console.log('     1. Get API key from: https://account.ui.com/');
    console.log('     2. Set UNIFI_CLOUD_KEY environment variable');
    console.log('   Local Controller:');
    console.log('     1. Set UNIFI_IP (e.g., 192.168.1.93)');
    console.log('     2. Set UNIFI_USER and UNIFI_PASS');
    console.log('     3. Verify controller is accessible\n');
    process.exit(1);
  }

  // Step 2: Get Access Points
  console.log('━'.repeat(60));
  console.log('Step 2: Fetching Access Points...\n');

  const aps = await client.getAccessPoints();

  console.log(`✅ Found ${aps.length} Access Point(s):\n`);

  for (const ap of aps) {
    console.log(`📡 ${ap.name}`);
    console.log(`   Model: ${ap.model}`);
    console.log(`   IP: ${ap.ip}`);
    console.log(`   MAC: ${ap.mac}`);
    console.log(`   Status: ${ap.status}`);
    console.log(`   Clients: ${ap.clients}`);

    if (ap.ble?.enabled) {
      console.log(`   BLE Enabled: ✅`);
      console.log(`   BLE UUID: ${ap.ble.uuid}`);
      console.log(`   BLE Major: ${ap.ble.major}`);
      console.log(`   BLE Minor: ${ap.ble.minor}`);
    } else {
      console.log(`   BLE Enabled: ❌ (WiFi location only)`);
    }

    console.log('');
  }

  if (aps.length === 0) {
    console.log('⚠️  No Access Points found.\n');
    return;
  }

  // Step 3: Get Connected Clients
  console.log('━'.repeat(60));
  console.log('Step 3: Fetching Connected WiFi Clients...\n');

  const clients = await client.getClients();

  console.log(`✅ Found ${clients.length} connected client(s):\n`);

  for (const c of clients.slice(0, 10)) {
    console.log(`👤 ${c.hostname}`);
    console.log(`   IP: ${c.ip}`);
    console.log(`   MAC: ${c.mac}`);
    console.log(`   Connected to AP: ${c.apName}`);
    console.log(`   Signal: ${c.signal} dBm`);

    // Get location
    const location = await client.getGuestLocation(c.mac);
    if (location) {
      console.log(`   Zone: ${location.zone}`);
      console.log(`   Area: ${location.area}`);
    }

    console.log('');
  }

  if (clients.length === 0) {
    console.log('⚠️  No clients connected. Connect a device to WiFi first.\n');
  }

  // Step 4: Test Guest Location Lookup
  if (clients.length > 0) {
    console.log('━'.repeat(60));
    console.log('Step 4: Testing Guest Location Lookup...\n');

    const testClient = clients[0];
    console.log(`Testing with: ${testClient.hostname} (${testClient.mac})\n`);

    // Check if on property
    const isOnProperty = await client.isGuestOnProperty(testClient.mac);
    console.log(`Is guest on property WiFi? ${isOnProperty ? '✅ Yes' : '❌ No'}`);

    // Get location
    const location = await client.getGuestLocation(testClient.mac);
    if (location) {
      console.log(`Guest location:`);
      console.log(`   Zone: ${location.zone}`);
      console.log(`   Area: ${location.area}`);
      console.log(`   AP: ${location.apName}`);
    }

    console.log('');
  }

  // Step 5: Connection Summary
  console.log('━'.repeat(60));
  console.log('Summary:\n');

  console.log(`Connection Mode: ${mode.toUpperCase()}`);

  if (mode === 'cloud') {
    console.log('✅ Using UniFi Cloud API (recommended)');
    console.log('   Benefits:');
    console.log('   - Works remotely (no VPN needed)');
    console.log('   - Centralized management');
    console.log('   - Automatic updates');
    console.log('');
  } else if (mode === 'local') {
    console.log('✅ Using Local UniFi Controller');
    console.log('   Note: Only accessible on local network');
    console.log('   Recommendation: Set up UniFi Cloud API for remote access');
    console.log('');
  }

  console.log(`Access Points: ${aps.length}`);
  console.log(`Connected Clients: ${clients.length}`);
  console.log(`BLE Beacons: ${aps.filter(ap => ap.ble?.enabled).length} enabled`);

  if (aps.some(ap => !ap.ble?.enabled)) {
    console.log('');
    console.log('💡 Tip: Some APs don\'t have BLE beacons enabled.');
    console.log('   WiFi-based location will still work (zone-level accuracy).');
    console.log('   For table-level accuracy, enable BLE on UniFi 6 series APs.');
  }

  console.log('');
  console.log('━'.repeat(60));
  console.log('✅ Test complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
