import { NextResponse } from 'next/server';
import { UnifiedUniFiClient } from '@/lib/integrations/unifi/unified-client';
import { BarDispenserClient } from '@/lib/integrations/bar-dispenser/dispenser-client';

const TARGET_MAC = '62:45:20:94:e6:42'; // A52s-de-Miguel

// Singleton instances
let unifiClient: UnifiedUniFiClient | null = null;
let dispenserClient: BarDispenserClient | null = null;
let lastConnectTime = 0;
const RECONNECT_INTERVAL = 5 * 60 * 1000; // 5 minutes

const getClients = async () => {
  const now = Date.now();

  // Initialize dispenser client (stateless, always create)
  if (!dispenserClient) {
    dispenserClient = new BarDispenserClient();
  }

  // Reuse UniFi client if connected recently
  if (unifiClient && (now - lastConnectTime) < RECONNECT_INTERVAL) {
    return { unifiClient, dispenserClient };
  }

  const localUrl = process.env.UNIFI_IP
    ? (process.env.UNIFI_PORT
        ? `https://${process.env.UNIFI_IP}:${process.env.UNIFI_PORT}`
        : `https://${process.env.UNIFI_IP}:443`)
    : undefined;

  unifiClient = new UnifiedUniFiClient({
    cloudApiKey: process.env.UNIFI_CLOUD_KEY,
    localUrl,
    localUsername: process.env.UNIFI_USER,
    localPassword: process.env.UNIFI_PASS,
    localApiToken: process.env.UNIFI_LOCAL_TOKEN,
    site: 'default',
    debug: false,
  });

  await unifiClient.connect();
  lastConnectTime = now;

  return { unifiClient, dispenserClient };
};

export async function GET() {
  try {
    const { unifiClient, dispenserClient } = await getClients();

    // Get guest location
    const clients = await unifiClient.getClients();
    const guest = clients.find(c => c.mac === TARGET_MAC);

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not connected to WiFi' },
        { status: 404 }
      );
    }

    const location = await unifiClient.getGuestLocation(TARGET_MAC);

    if (!location) {
      return NextResponse.json(
        { error: 'Could not determine location' },
        { status: 404 }
      );
    }

    // Get beverages available in guest's current zone
    const beverages = dispenserClient.getBeveragesByZone(location.zone);
    const dispensers = dispenserClient.getDispensersByZone(location.zone);
    const popularDrinks = dispenserClient.getPopularDrinks(location.zone, 3);

    return NextResponse.json({
      guest: {
        device: guest.hostname || 'Unknown',
        mac: guest.mac,
        zone: location.zone,
        area: location.area,
      },
      menu: {
        zone: location.zone,
        dispensers: dispensers.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          status: d.status,
        })),
        beverages: beverages.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category,
          icon: b.icon,
          ingredients: b.ingredients,
          abv: b.abv,
          temperature: b.temperature,
          preparationTime: b.preparationTime,
          inventoryLevel: b.inventoryLevel,
        })),
        popularDrinks: popularDrinks.map(d => ({
          id: d.id,
          name: d.name,
          icon: d.icon,
        })),
      },
    });
  } catch (error) {
    console.error('Bar menu API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { beverageId } = await request.json();

    if (!beverageId) {
      return NextResponse.json(
        { error: 'Beverage ID required' },
        { status: 400 }
      );
    }

    const { unifiClient, dispenserClient } = await getClients();

    // Get guest location
    const clients = await unifiClient.getClients();
    const guest = clients.find(c => c.mac === TARGET_MAC);

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not connected to WiFi' },
        { status: 404 }
      );
    }

    const location = await unifiClient.getGuestLocation(TARGET_MAC);

    if (!location) {
      return NextResponse.json(
        { error: 'Could not determine location' },
        { status: 404 }
      );
    }

    // Order the drink
    const order = await dispenserClient.orderDrink(
      guest.mac,
      beverageId,
      location.zone,
      guest.hostname
    );

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        beverage: order.beverage.name,
        icon: order.beverage.icon,
        status: order.status,
        preparationTime: order.beverage.preparationTime,
        orderedAt: order.orderedAt,
      },
    });
  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
