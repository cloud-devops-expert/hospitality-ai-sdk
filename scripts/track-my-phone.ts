#!/usr/bin/env tsx
/**
 * Track My Phone - Location Demo
 *
 * Tracks your Samsung A52s phone specifically
 */

import dotenv from 'dotenv';
import { UnifiedUniFiClient } from '../lib/integrations/unifi/unified-client';

dotenv.config({ path: '.env.local' });

const TARGET_MAC = '62:45:20:94:e6:42'; // A52s-de-Miguel

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         📱 TRACKING: A52s-de-Miguel (Your Phone)          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

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
    debug: false,
  });

  console.log('🔌 Connecting to UniFi...\n');
  await client.connect();

  let previousZone: string | null = null;

  console.log('🔄 Real-time tracking started!');
  console.log('💡 Walk around with your phone to see location changes!\n');
  console.log('Press Ctrl+C to stop\n');

  const showLocation = async () => {
    const clients = await client.getClients();
    const phone = clients.find(c => c.mac === TARGET_MAC);

    if (!phone) {
      console.log('⚠️  Phone not connected to WiFi');
      return;
    }

    const location = await client.getGuestLocation(TARGET_MAC);

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
        console.log(`🚶 LOCATION CHANGED: ${previousZone || 'unknown'} → ${location.zone.toUpperCase()}`);
        console.log(`📍 You moved to: ${location.area}`);
        console.log(`${'━'.repeat(60)}\n`);
      }

      // Show guest portal
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║            🏨 HOSPITALITY AI - GUEST PORTAL               ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('👤 Device: A52s-de-Miguel (Your Phone)');
      console.log(`📍 Location: ${location.zone.toUpperCase()} - ${location.area}`);
      console.log(`📡 Access Point: ${location.apName}`);
      console.log(`📶 Signal: ${phone.signal} dBm (${getSignalQuality(phone.signal)})`);
      console.log(`🕐 Time: ${now}\n`);

      console.log(getGreeting(location.zone));
      console.log('');

      const services = getServicesForZone(location.zone);
      console.log('🎯 Available Services:\n');

      services.forEach((service, index) => {
        console.log(`${index + 1}. ${service}`);
      });

      console.log('\n' + '━'.repeat(60));
      console.log('💡 Checking for location changes every 3 seconds...');
      console.log('━'.repeat(60) + '\n');

      previousZone = location.zone;
    } else {
      // Just show a heartbeat
      process.stdout.write(`\r⏰ ${now} | 📍 ${location.zone.toUpperCase()} | 📶 ${phone.signal} dBm`);
    }
  };

  // Initial check
  await showLocation();

  // Check every 3 seconds
  setInterval(async () => {
    try {
      await showLocation();
    } catch (error) {
      console.error('\n❌ Error:', error);
    }
  }, 3000);
}

function getSignalQuality(signal: number): string {
  if (signal >= -50) return 'Excellent ⭐⭐⭐⭐⭐';
  if (signal >= -60) return 'Good ⭐⭐⭐⭐';
  if (signal >= -70) return 'Fair ⭐⭐⭐';
  return 'Weak ⭐⭐';
}

function getGreeting(zone: string): string {
  const greetings: Record<string, string> = {
    'room': '━'.repeat(60) + '\n🛏️  WELCOME TO YOUR ROOM!\n   Relax and enjoy your stay.\n' + '━'.repeat(60),
    'office': '━'.repeat(60) + '\n💼 BUSINESS CENTER DETECTED\n   Productive work environment ready.\n' + '━'.repeat(60),
    'lobby': '━'.repeat(60) + '\n🏨 WELCOME TO THE LOBBY!\n   How can we assist you today?\n' + '━'.repeat(60),
    'restaurant': '━'.repeat(60) + '\n🍽️  HUNGRY?\n   Browse our menu and order from here!\n' + '━'.repeat(60),
    'spa': '━'.repeat(60) + '\n💆 TIME TO RELAX!\n   Book a treatment or enjoy the facilities.\n' + '━'.repeat(60),
    'unknown': '━'.repeat(60) + '\n👋 WELCOME!\n   Explore our property and discover amenities.\n' + '━'.repeat(60),
  };

  return greetings[zone] || greetings['unknown'];
}

function getServicesForZone(zone: string): string[] {
  const services: Record<string, string[]> = {
    'room': [
      '🛏️  Room Service - Order breakfast, snacks, or beverages',
      '🌡️  Climate Control - Adjust temperature and lighting',
      '🧹 Housekeeping - Request cleaning or do not disturb',
      '📺 In-Room Entertainment - Streaming and room controls',
    ],
    'office': [
      '💼 Business Services - Printing, scanning, documents',
      '📞 Meeting Rooms - Book conference and meeting spaces',
      '☕ Office Refreshments - Coffee, tea, and snacks',
      '🖨️  Print Queue - Send documents to nearby printers',
    ],
    'lobby': [
      '🔑 Check-In/Out - Express check-in or check-out',
      '🚕 Transportation - Book taxi, rideshare, or shuttle',
      '🗺️  Local Guide - Explore restaurants and attractions',
      '🎫 Concierge - Get recommendations and book activities',
    ],
    'restaurant': [
      '🍽️  Order Food - Browse menu and place orders',
      '📋 View Menu - See today\'s specials and full menu',
      '💳 Request Bill - Get your bill or split payment',
      '👨‍🍳 Call Waiter - Request assistance from staff',
    ],
    'spa': [
      '💆 Book Treatment - Massage, facial, or spa services',
      '🧖 Pool & Sauna - Access towels and locker services',
      '🍹 Poolside Service - Drinks and snacks to your chair',
      '📅 View Schedule - Spa hours and class schedules',
    ],
    'unknown': [
      '🏨 Property Guide - Explore all hotel services',
      '📱 Mobile Key - Use your phone to unlock your room',
      '🔔 Notifications - View messages from hotel staff',
      '❓ Help - Contact front desk or get assistance',
    ],
  };

  return services[zone] || services['unknown'];
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
