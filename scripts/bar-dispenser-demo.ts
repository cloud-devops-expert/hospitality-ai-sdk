#!/usr/bin/env tsx
/**
 * Bar Dispenser Integration Demo
 *
 * Shows location-aware beverage menu that changes based on guest zone
 */

import dotenv from 'dotenv';
import { UnifiedUniFiClient } from '../lib/integrations/unifi/unified-client';
import { BarDispenserClient } from '../lib/integrations/bar-dispenser/dispenser-client';

dotenv.config({ path: '.env.local' });

const TARGET_MAC = '62:45:20:94:e6:42'; // A52s-de-Miguel

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        🍹 BAR DISPENSER INTEGRATION DEMO 🍹               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const localUrl = process.env.UNIFI_IP
    ? (process.env.UNIFI_PORT
        ? `https://${process.env.UNIFI_IP}:${process.env.UNIFI_PORT}`
        : `https://${process.env.UNIFI_IP}:8443`)
    : undefined;

  const unifiClient = new UnifiedUniFiClient({
    localUrl,
    localUsername: process.env.UNIFI_USER,
    localPassword: process.env.UNIFI_PASS,
    localApiToken: process.env.UNIFI_LOCAL_TOKEN,
    site: 'default',
    debug: false,
  });

  const dispenserClient = new BarDispenserClient();

  console.log('🔌 Connecting to UniFi...\n');
  await unifiClient.connect();

  let previousZone: string | null = null;

  console.log('🔄 Real-time beverage menu tracking started!');
  console.log('💡 Walk to different zones to see different drink menus!\n');
  console.log('Press Ctrl+C to stop\n');

  const showMenu = async () => {
    const clients = await unifiClient.getClients();
    const guest = clients.find(c => c.mac === TARGET_MAC);

    if (!guest) {
      console.log('⚠️  Guest not connected to WiFi');
      return;
    }

    const location = await unifiClient.getGuestLocation(TARGET_MAC);

    if (!location) {
      console.log('⚠️  Could not determine location');
      return;
    }

    const now = new Date().toLocaleTimeString();

    // Detect zone change
    if (location.zone !== previousZone) {
      if (previousZone !== null) {
        console.log(`\n${'━'.repeat(60)}`);
        console.log(`⏰ ${now}`);
        console.log(`🚶 ZONE CHANGED: ${previousZone || 'unknown'} → ${location.zone.toUpperCase()}`);
        console.log(`📍 Current location: ${location.area}`);
        console.log(`${'━'.repeat(60)}\n`);
      }

      // Get beverages for this zone
      const beverages = dispenserClient.getBeveragesByZone(location.zone);
      const dispensers = dispenserClient.getDispensersByZone(location.zone);

      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║              🍹 LOCATION-AWARE BAR MENU 🍹                ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log(`👤 Guest: ${guest.hostname || 'Unknown'}`);
      console.log(`📍 Zone: ${location.zone.toUpperCase()} - ${location.area}`);
      console.log(`📡 Access Point: ${location.apName}`);
      console.log(`⏰ Time: ${now}\n`);

      if (dispensers.length === 0) {
        console.log('❌ No beverage dispensers available in this zone\n');
      } else {
        console.log('🤖 Available Dispensers:\n');
        dispensers.forEach(dispenser => {
          console.log(`   ${getDispenserIcon(dispenser.type)} ${dispenser.name} (${dispenser.status})`);
        });
        console.log('');

        console.log('🍹 Available Beverages:\n');

        if (beverages.length === 0) {
          console.log('   No beverages available\n');
        } else {
          beverages.forEach((bev, index) => {
            const tempIcon = bev.temperature === 'hot' ? '🔥' : bev.temperature === 'cold' ? '❄️' : '🌡️';
            const abvInfo = bev.abv ? ` (${bev.abv}% ABV)` : '';
            const inventory = getInventoryStatus(bev.inventoryLevel);

            console.log(`   ${index + 1}. ${bev.icon} ${bev.name}${abvInfo}`);
            console.log(`      Category: ${bev.category} ${tempIcon}`);
            console.log(`      Ingredients: ${bev.ingredients.join(', ')}`);
            console.log(`      Prep time: ${bev.preparationTime}s | Inventory: ${inventory}`);
            console.log('');
          });
        }

        console.log(getZoneMessage(location.zone));
      }

      console.log('\n' + '━'.repeat(60));
      console.log('💡 Monitoring for zone changes...');
      console.log('━'.repeat(60) + '\n');

      previousZone = location.zone;
    } else {
      // Just show a heartbeat
      process.stdout.write(`\r⏰ ${now} | 📍 ${location.zone.toUpperCase()} | 📶 ${guest.signal} dBm`);
    }
  };

  // Initial check
  await showMenu();

  // Check every 3 seconds
  setInterval(async () => {
    try {
      await showMenu();
    } catch (error) {
      console.error('\n❌ Error:', error);
    }
  }, 3000);
}

function getDispenserIcon(type: string): string {
  const icons: Record<string, string> = {
    'cocktail-maker': '🍸',
    'beer-tap': '🍺',
    'wine-dispenser': '🍷',
    'coffee-machine': '☕',
    'soda-fountain': '🥤',
  };
  return icons[type] || '🤖';
}

function getInventoryStatus(level: number): string {
  if (level >= 80) return `${level}% ✅`;
  if (level >= 50) return `${level}% ⚠️`;
  return `${level}% 🔴 LOW`;
}

function getZoneMessage(zone: string): string {
  const messages: Record<string, string> = {
    'lobby': '━'.repeat(60) + '\n🏨 WELCOME TO THE LOBBY BAR!\n   Premium cocktails and spirits to start your stay.\n' + '━'.repeat(60),
    'office': '━'.repeat(60) + '\n💼 BUSINESS CENTER REFRESHMENTS\n   Coffee and energy drinks to fuel your productivity.\n' + '━'.repeat(60),
    'restaurant': '━'.repeat(60) + '\n🍽️  FINE DINING BEVERAGES\n   Wine and beer to complement your meal.\n' + '━'.repeat(60),
    'spa': '━'.repeat(60) + '\n💆 POOLSIDE REFRESHMENTS\n   Tropical cocktails and fresh drinks by the pool.\n' + '━'.repeat(60),
    'room': '━'.repeat(60) + '\n🛏️  IN-ROOM BEVERAGE SERVICE\n   Coffee and water available in your room.\n' + '━'.repeat(60),
    'unknown': '━'.repeat(60) + '\n📍 EXPLORE OUR PROPERTY\n   Find beverage stations in: Lobby, Restaurant, Pool, Rooms\n' + '━'.repeat(60),
  };

  return messages[zone] || messages['unknown'];
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
