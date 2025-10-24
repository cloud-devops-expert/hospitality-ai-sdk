import { NextResponse } from 'next/server';
import { UnifiedUniFiClient } from '@/lib/integrations/unifi/unified-client';

const TARGET_MAC = '62:45:20:94:e6:42'; // A52s-de-Miguel

// Create client instance
const getClient = () => {
  const localUrl = process.env.UNIFI_IP
    ? (process.env.UNIFI_PORT
        ? `https://${process.env.UNIFI_IP}:${process.env.UNIFI_PORT}`
        : `https://${process.env.UNIFI_IP}:8443`)
    : undefined;

  return new UnifiedUniFiClient({
    cloudApiKey: process.env.UNIFI_CLOUD_KEY,
    localUrl,
    localUsername: process.env.UNIFI_USER,
    localPassword: process.env.UNIFI_PASS,
    localApiToken: process.env.UNIFI_LOCAL_TOKEN,
    site: 'default',
    debug: false,
  });
};

export async function GET() {
  try {
    const client = getClient();

    // Connect to UniFi
    await client.connect();

    // Get all access points
    const aps = await client.getAccessPoints();

    // Get all clients
    const clients = await client.getClients();

    // Find target phone
    const phone = clients.find(c => c.mac === TARGET_MAC);

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone not connected to WiFi' },
        { status: 404 }
      );
    }

    // Get location
    const location = await client.getGuestLocation(TARGET_MAC);

    if (!location) {
      return NextResponse.json(
        { error: 'Could not determine location' },
        { status: 404 }
      );
    }

    // Return data
    return NextResponse.json({
      location: {
        device: phone.hostname || 'Unknown',
        mac: phone.mac,
        ip: phone.ip,
        zone: location.zone,
        area: location.area,
        apName: location.apName,
        signal: phone.signal,
        timestamp: new Date().toISOString(),
      },
      aps: aps.map(ap => ({
        name: ap.name,
        ip: ap.ip,
        model: ap.model,
        clients: ap.clients,
        status: ap.status,
      })),
    });
  } catch (error) {
    console.error('Location API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
