#!/usr/bin/env tsx
/**
 * Location-Aware Guest Portal Demo
 *
 * Demonstrates WiFi-based location detection with context-aware features.
 * Uses actual UniFi setup to track guest location and provide relevant services.
 *
 * Usage:
 *   npm run demo:location
 */

import dotenv from 'dotenv';
import { UnifiedUniFiClient } from '../lib/integrations/unifi/unified-client';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface LocationContext {
  zone: string;
  area: string;
  apName: string;
  device: {
    hostname: string;
    mac: string;
    ip: string;
    signal: number;
  };
}

interface LocationService {
  title: string;
  description: string;
  available: boolean;
  action: string;
}

/**
 * Get location-aware services based on guest's current zone
 */
function getServicesForZone(zone: string, area: string): LocationService[] {
  const services: Record<string, LocationService[]> = {
    'room': [
      {
        title: '🛏️ Room Service',
        description: 'Order breakfast, snacks, or beverages to your room',
        available: true,
        action: 'Order Now'
      },
      {
        title: '🌡️ Climate Control',
        description: 'Adjust temperature and lighting in your room',
        available: true,
        action: 'Adjust Settings'
      },
      {
        title: '🧹 Housekeeping',
        description: 'Request housekeeping or do not disturb',
        available: true,
        action: 'Make Request'
      },
      {
        title: '📺 In-Room Entertainment',
        description: 'Access streaming services and room controls',
        available: true,
        action: 'Open Menu'
      }
    ],
    'office': [
      {
        title: '💼 Business Services',
        description: 'Printing, scanning, and document services',
        available: true,
        action: 'Access Services'
      },
      {
        title: '📞 Meeting Rooms',
        description: 'Book conference rooms and meeting spaces',
        available: true,
        action: 'Book Room'
      },
      {
        title: '☕ Office Refreshments',
        description: 'Order coffee, tea, or snacks to office area',
        available: true,
        action: 'Order Now'
      },
      {
        title: '🖨️ Print Queue',
        description: 'Send documents to nearby printers',
        available: true,
        action: 'Print Document'
      }
    ],
    'lobby': [
      {
        title: '🔑 Check-In/Out',
        description: 'Express check-in or check-out services',
        available: true,
        action: 'Start Process'
      },
      {
        title: '🚕 Transportation',
        description: 'Book taxi, rideshare, or airport shuttle',
        available: true,
        action: 'Book Ride'
      },
      {
        title: '🗺️ Local Guide',
        description: 'Explore nearby restaurants, attractions, events',
        available: true,
        action: 'Explore'
      },
      {
        title: '🎫 Concierge',
        description: 'Get recommendations and book activities',
        available: true,
        action: 'Ask Concierge'
      }
    ],
    'restaurant': [
      {
        title: '🍽️ Order Food',
        description: 'Browse menu and place orders',
        available: true,
        action: 'View Menu'
      },
      {
        title: '📋 View Menu',
        description: 'See today\'s specials and full menu',
        available: true,
        action: 'Open Menu'
      },
      {
        title: '💳 Request Bill',
        description: 'Get your bill or split payment',
        available: true,
        action: 'Request Bill'
      },
      {
        title: '👨‍🍳 Call Waiter',
        description: 'Request assistance from staff',
        available: true,
        action: 'Call Waiter'
      }
    ],
    'spa': [
      {
        title: '💆 Book Treatment',
        description: 'Schedule massage, facial, or other spa services',
        available: true,
        action: 'Book Now'
      },
      {
        title: '🧖 Pool & Sauna',
        description: 'Access pool towels and locker services',
        available: true,
        action: 'Get Towel'
      },
      {
        title: '🍹 Poolside Service',
        description: 'Order drinks and snacks to your lounge chair',
        available: true,
        action: 'Order'
      },
      {
        title: '📅 View Schedule',
        description: 'See spa hours and class schedules',
        available: true,
        action: 'View Schedule'
      }
    ],
    'unknown': [
      {
        title: '🏨 Property Guide',
        description: 'Explore all hotel services and amenities',
        available: true,
        action: 'Explore'
      },
      {
        title: '📱 Mobile Key',
        description: 'Use your phone to unlock your room',
        available: true,
        action: 'Activate'
      },
      {
        title: '🔔 Notifications',
        description: 'View messages from hotel staff',
        available: true,
        action: 'View'
      },
      {
        title: '❓ Help',
        description: 'Contact front desk or get assistance',
        available: true,
        action: 'Get Help'
      }
    ]
  };

  return services[zone] || services['unknown'];
}

/**
 * Render guest portal for specific location
 */
function renderGuestPortal(location: LocationContext): void {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║            🏨 HOSPITALITY AI - GUEST PORTAL               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Guest info
  console.log('👤 Guest Information:');
  console.log(`   Device: ${location.device.hostname || 'Unknown Device'}`);
  console.log(`   IP: ${location.device.ip}`);
  console.log(`   Signal: ${location.device.signal} dBm (${getSignalQuality(location.device.signal)})`);
  console.log('');

  // Location info
  console.log('📍 Your Location:');
  console.log(`   Zone: ${capitalizeZone(location.zone)}`);
  console.log(`   Area: ${location.area}`);
  console.log(`   Access Point: ${location.apName}`);
  console.log('');

  // Contextual greeting
  console.log('━'.repeat(60));
  console.log(getGreeting(location.zone));
  console.log('━'.repeat(60));
  console.log('');

  // Location-aware services
  console.log('🎯 Available Services:');
  console.log('');

  const services = getServicesForZone(location.zone, location.area);
  services.forEach((service, index) => {
    console.log(`${index + 1}. ${service.title}`);
    console.log(`   ${service.description}`);
    console.log(`   ${service.available ? '✅' : '❌'} [${service.action}]`);
    console.log('');
  });

  // Footer
  console.log('━'.repeat(60));
  console.log('💡 Tip: Services change based on your location');
  console.log('   Walk to different areas to see more options!');
  console.log('━'.repeat(60));
}

/**
 * Get contextual greeting based on zone
 */
function getGreeting(zone: string): string {
  const greetings: Record<string, string> = {
    'room': '🛏️ Welcome to your room! Relax and enjoy your stay.',
    'office': '💼 Business center detected. Productive work environment ready.',
    'lobby': '🏨 Welcome to the lobby! How can we assist you today?',
    'restaurant': '🍽️ Hungry? Browse our menu and order from here!',
    'spa': '💆 Time to relax! Book a treatment or enjoy the facilities.',
    'unknown': '👋 Welcome! Explore our property and discover amenities nearby.'
  };

  return greetings[zone] || greetings['unknown'];
}

/**
 * Get signal quality description
 */
function getSignalQuality(signal: number): string {
  if (signal >= -50) return 'Excellent';
  if (signal >= -60) return 'Good';
  if (signal >= -70) return 'Fair';
  return 'Weak';
}

/**
 * Capitalize zone name
 */
function capitalizeZone(zone: string): string {
  return zone.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Monitor location changes in real-time
 */
async function monitorLocationChanges(
  client: UnifiedUniFiClient,
  targetMac: string
): Promise<void> {
  let previousZone: string | null = null;

  console.log('\n🔄 Starting real-time location monitoring...');
  console.log('💡 Walk around with your device to see location changes!\n');
  console.log('Press Ctrl+C to stop\n');

  setInterval(async () => {
    try {
      const location = await client.getGuestLocation(targetMac);

      if (!location) {
        console.log('⚠️  Device not connected to WiFi');
        return;
      }

      // Detect zone change
      if (location.zone !== previousZone) {
        console.log(`\n🚶 Location changed: ${previousZone || 'unknown'} → ${location.zone}`);
        console.log(`   Moving to: ${location.area}\n`);

        // Fetch full client details
        const clients = await client.getClients();
        const device = clients.find(c => c.mac === targetMac);

        if (device) {
          const locationContext: LocationContext = {
            zone: location.zone,
            area: location.area,
            apName: location.apName,
            device: {
              hostname: device.hostname,
              mac: device.mac,
              ip: device.ip,
              signal: device.signal
            }
          };

          renderGuestPortal(locationContext);
        }

        previousZone = location.zone;
      }
    } catch (error) {
      console.error('Error monitoring location:', error);
    }
  }, 5000); // Check every 5 seconds
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Location-Aware Guest Portal Demo                    ║');
  console.log('║       Real UniFi Setup - WiFi Location Tracking           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize UniFi client
  const localUrl = process.env.UNIFI_IP
    ? (process.env.UNIFI_PORT
        ? `https://${process.env.UNIFI_IP}:${process.env.UNIFI_PORT}`
        : `https://${process.env.UNIFI_IP}:8443`)
    : undefined;

  const client = new UnifiedUniFiClient({
    localUrl,
    localUsername: process.env.UNIFI_USER,
    localPassword: process.env.UNIFI_PASS,
    localApiToken: process.env.UNIFI_LOCAL_TOKEN,
    site: 'default',
    debug: false, // Disable debug for cleaner output
  });

  // Connect
  console.log('🔌 Connecting to UniFi...\n');
  const mode = await client.connect();
  console.log(`✅ Connected via: ${mode.toUpperCase()}\n`);

  // Get connected clients
  console.log('👥 Finding connected devices...\n');
  const clients = await client.getClients();

  if (clients.length === 0) {
    console.log('⚠️  No clients connected. Connect a device to WiFi first.\n');
    process.exit(1);
  }

  // Filter to real devices (exclude Cloud Key and unknown IPs)
  const realDevices = clients.filter(c =>
    c.ip &&
    c.ip !== '192.168.1.93' && // Exclude Cloud Key
    c.hostname !== 'UCK-G2-Plus'
  );

  console.log('📱 Available devices:\n');
  realDevices.forEach((device, index) => {
    console.log(`${index + 1}. ${device.hostname || 'Unknown'}`);
    console.log(`   IP: ${device.ip}`);
    console.log(`   MAC: ${device.mac}`);
    console.log(`   AP: ${device.apName}`);
    console.log('');
  });

  // Select first device for demo
  if (realDevices.length === 0) {
    console.log('⚠️  No real devices found (only Cloud Key). Connect your phone/laptop to WiFi.\n');
    process.exit(1);
  }

  const targetDevice = realDevices[0];
  console.log(`🎯 Tracking: ${targetDevice.hostname || 'Unknown Device'} (${targetDevice.mac})\n`);

  // Get initial location
  const location = await client.getGuestLocation(targetDevice.mac);

  if (!location) {
    console.log('⚠️  Could not determine device location.\n');
    process.exit(1);
  }

  const locationContext: LocationContext = {
    zone: location.zone,
    area: location.area,
    apName: location.apName,
    device: {
      hostname: targetDevice.hostname,
      mac: targetDevice.mac,
      ip: targetDevice.ip,
      signal: targetDevice.signal
    }
  };

  // Show initial portal
  renderGuestPortal(locationContext);

  // Start real-time monitoring
  await monitorLocationChanges(client, targetDevice.mac);
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
