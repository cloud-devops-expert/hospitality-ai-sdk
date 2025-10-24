/**
 * Location-Aware Guest Portal
 *
 * Combines WebRTC P2P + Beacon Location Detection for context-aware guest services.
 *
 * Features:
 * - Auto-detect guest location via beacons
 * - Show location-specific features (restaurant menu, spa access, etc.)
 * - Send orders/requests via WebRTC P2P (50ms, local network)
 * - Works only on property WiFi (security boundary)
 *
 * Flow:
 * 1. Guest connects to hotel WiFi
 * 2. Opens web app (or scans QR code)
 * 3. App scans for beacons (requests Bluetooth permission)
 * 4. Detects location (e.g., "table-5 in restaurant")
 * 5. Shows location-specific features (restaurant menu)
 * 6. Guest places order
 * 7. Order sent via WebRTC P2P to kitchen (50ms)
 * 8. Kitchen receives order with exact table location
 */

import { P2PConnection } from '../../lib/webrtc/p2p-connection';
import { WebBluetoothBeaconScanner } from '../../lib/beacon/web-bluetooth-scanner';
import type { BeaconDetection, LocationContext, LocationFeature } from '../../lib/beacon/types';

export class LocationAwareGuestPortal {
  private p2p: P2PConnection;
  private beaconScanner: WebBluetoothBeaconScanner;
  private currentLocation: LocationContext | null = null;
  private availableFeatures: Map<string, LocationFeature> = new Map();

  constructor(tenantId: string) {
    // Initialize WebRTC P2P connection
    this.p2p = new P2PConnection({
      signalingServers: [
        'ws://signaling.local:8080', // Local signaling (Phase 3)
        'wss://signaling.yourdomain.com', // Cloud signaling
      ],
      tenantId,
      deviceInfo: {
        type: 'guest',
        name: 'Guest Device',
        capabilities: ['orders', 'access-control', 'concierge'],
      },
      preferLocal: true,
      debug: true,
    });

    // Initialize beacon scanner
    this.beaconScanner = new WebBluetoothBeaconScanner({
      tenantId,
      scanMode: 'active',
      onBeaconDetected: this.handleBeaconDetected.bind(this),
      onBeaconLost: this.handleBeaconLost.bind(this),
      onZoneChanged: this.handleZoneChanged.bind(this),
      debug: true,
    });

    // Set up P2P event handlers
    this.setupP2PEvents();

    // Initialize available features
    this.initializeFeatures();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Initialize guest portal (connect P2P + start beacon scanning)
   */
  async initialize(): Promise<void> {
    console.log('🎯 Initializing location-aware guest portal...\n');

    // Step 1: Connect to WebRTC P2P network
    console.log('1️⃣ Connecting to property network (WebRTC P2P)...');
    try {
      await this.p2p.connect();
      console.log('✅ Connected to property network\n');
    } catch (error) {
      console.error('❌ Failed to connect to property network:', error);
      throw error;
    }

    // Step 2: Request Bluetooth permission
    console.log('2️⃣ Requesting Bluetooth permission...');
    const hasPermission = await this.beaconScanner.requestPermission();

    if (!hasPermission) {
      console.warn('⚠️ Bluetooth permission denied - location features will be limited\n');
      return;
    }

    console.log('✅ Bluetooth permission granted\n');

    // Step 3: Start beacon scanning
    console.log('3️⃣ Starting beacon scan...');
    try {
      await this.beaconScanner.startScanning();
      console.log('✅ Beacon scan started\n');
    } catch (error) {
      console.error('❌ Failed to start beacon scan:', error);
      throw error;
    }

    console.log('🎉 Guest portal ready!\n');
  }

  /**
   * Get current location
   */
  getLocation(): LocationContext | null {
    return this.beaconScanner.getLocationContext();
  }

  /**
   * Get features available at current location
   */
  getAvailableFeatures(): LocationFeature[] {
    const location = this.getLocation();

    if (!location || !location.zone) {
      return [];
    }

    const features: LocationFeature[] = [];

    for (const feature of this.availableFeatures.values()) {
      if (
        feature.enabled &&
        feature.requiredZones.includes(location.zone) &&
        this.meetsAccuracyRequirement(location, feature)
      ) {
        features.push(feature);
      }
    }

    return features;
  }

  /**
   * Place restaurant order (when in restaurant zone)
   */
  async placeRestaurantOrder(items: { itemId: string; name: string; quantity: number; notes?: string }[]): Promise<void> {
    const location = this.getLocation();

    if (!location || location.zone !== 'restaurant') {
      throw new Error('Restaurant ordering only available when in restaurant zone');
    }

    if (!location.closestBeacon) {
      throw new Error('Unable to determine table location');
    }

    const tableNumber = location.closestBeacon.metadata.tableNumber;

    console.log(`\n📝 Placing order at Table ${tableNumber}...`);

    const orderId = `order-${Date.now()}`;
    const total = items.reduce((sum, item) => sum + item.quantity * 12, 0); // Simple pricing

    // Send order via WebRTC P2P (local network, 50ms)
    this.p2p.send({
      type: 'order',
      order: {
        orderId,
        tableId: tableNumber,
        items,
        total,
        status: 'pending',
      },
    });

    console.log('✅ Order sent via WebRTC P2P!');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Table: ${tableNumber}`);
    console.log(`   Total: $${total}`);
    console.log(`   Latency: ~50ms (local P2P)\n`);

    // Background cloud sync
    await this.syncToCloud({ orderId, tableId: tableNumber, items, total });
  }

  /**
   * Request spa/pool access (when in spa zone)
   */
  async requestSpaAccess(amenity: 'pool' | 'gym' | 'sauna'): Promise<void> {
    const location = this.getLocation();

    if (!location || location.zone !== 'spa') {
      throw new Error('Spa access only available when in spa zone');
    }

    console.log(`\n🏊 Requesting ${amenity} access...`);

    // Send access request via WebRTC P2P to staff
    this.p2p.send({
      type: 'notification',
      notification: {
        notificationId: `access-${Date.now()}`,
        title: `${amenity.charAt(0).toUpperCase() + amenity.slice(1)} Access Request`,
        message: `Guest at ${location.area} requesting ${amenity} access`,
        priority: 'high',
      },
    });

    console.log('✅ Access request sent to staff via P2P');
    console.log('   Staff will approve/deny shortly\n');
  }

  /**
   * Order room service (when in guest room)
   */
  async orderRoomService(items: { itemId: string; name: string; quantity: number }[]): Promise<void> {
    const location = this.getLocation();

    if (!location || location.zone !== 'room') {
      throw new Error('Room service only available when in guest room');
    }

    const roomNumber = location.closestBeacon?.metadata.roomNumber;

    if (!roomNumber) {
      throw new Error('Unable to determine room number');
    }

    console.log(`\n🛎️ Ordering room service to Room ${roomNumber}...`);

    const orderId = `room-service-${Date.now()}`;
    const total = items.reduce((sum, item) => sum + item.quantity * 15, 0);

    // Send room service order via WebRTC P2P
    this.p2p.send({
      type: 'order',
      order: {
        orderId,
        tableId: roomNumber, // Room number
        items,
        total,
        status: 'pending',
      },
    });

    console.log('✅ Room service order sent via P2P!');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Room: ${roomNumber}`);
    console.log(`   Total: $${total}\n`);
  }

  /**
   * Ask concierge (when in lobby)
   */
  async askConcierge(question: string): Promise<void> {
    const location = this.getLocation();

    if (!location || location.zone !== 'lobby') {
      throw new Error('Concierge service only available when in lobby');
    }

    console.log(`\n💬 Asking concierge: "${question}"...`);

    // Send question via WebRTC P2P to concierge
    this.p2p.send({
      type: 'notification',
      notification: {
        notificationId: `concierge-${Date.now()}`,
        title: 'Concierge Request',
        message: question,
        priority: 'normal',
      },
    });

    console.log('✅ Question sent to concierge via P2P');
    console.log('   Concierge will respond shortly\n');
  }

  /**
   * Shutdown guest portal
   */
  shutdown(): void {
    console.log('\n👋 Shutting down guest portal...');
    this.beaconScanner.stopScanning();
    this.p2p.disconnect();
    console.log('✅ Guest portal shutdown complete\n');
  }

  // ============================================================================
  // Private: Beacon Event Handlers
  // ============================================================================

  private handleBeaconDetected(beacon: BeaconDetection): void {
    console.log(`\n📍 Location detected:`);
    console.log(`   Zone: ${beacon.zone}`);
    console.log(`   Area: ${beacon.area}`);
    console.log(`   Distance: ${beacon.distance.toFixed(1)}m`);
    console.log(`   Accuracy: ${beacon.accuracy}`);

    // Update current location
    this.currentLocation = this.beaconScanner.getLocationContext();

    // Show available features
    const features = this.getAvailableFeatures();
    if (features.length > 0) {
      console.log(`\n✨ Available features:`);
      for (const feature of features) {
        console.log(`   - ${feature.type}`);
      }
    }

    console.log('');
  }

  private handleBeaconLost(beaconId: string): void {
    console.log(`\n📍 Left beacon area: ${beaconId}\n`);
  }

  private handleZoneChanged(zone: string | null): void {
    console.log(`\n🗺️ Zone changed: ${zone || 'unknown'}\n`);

    if (zone) {
      this.showZoneWelcomeMessage(zone);
    }
  }

  // ============================================================================
  // Private: P2P Event Handlers
  // ============================================================================

  private setupP2PEvents(): void {
    this.p2p.on('connected', (peer) => {
      console.log(`✅ Connected to ${peer.deviceInfo.type}: ${peer.deviceInfo.name}`);
    });

    this.p2p.on('notification', (notification) => {
      console.log(`\n📬 Notification from staff:`);
      console.log(`   ${notification.notification.title}`);
      console.log(`   ${notification.notification.message}\n`);
    });

    this.p2p.on('topology-detected', (topology) => {
      if (topology.topology === 'local-p2p') {
        console.log('✅ Using local P2P (50ms, $0 cost)');
      }
    });
  }

  // ============================================================================
  // Private: Feature Management
  // ============================================================================

  private initializeFeatures(): void {
    this.availableFeatures.set('restaurant-ordering', {
      type: 'restaurant-ordering',
      enabled: true,
      requiredZones: ['restaurant'],
      minAccuracy: 'medium',
    });

    this.availableFeatures.set('spa-access', {
      type: 'spa-access',
      enabled: true,
      requiredZones: ['spa'],
      minAccuracy: 'medium',
    });

    this.availableFeatures.set('room-service', {
      type: 'room-service',
      enabled: true,
      requiredZones: ['room'],
      minAccuracy: 'high', // Must be in correct room
    });

    this.availableFeatures.set('concierge', {
      type: 'concierge',
      enabled: true,
      requiredZones: ['lobby'],
      minAccuracy: 'low', // Just need to be in lobby area
    });
  }

  private meetsAccuracyRequirement(location: LocationContext, feature: LocationFeature): boolean {
    const accuracyLevels = { high: 3, medium: 2, low: 1, unknown: 0 };
    const requiredLevel = accuracyLevels[feature.minAccuracy];
    const actualLevel = accuracyLevels[location.accuracy];

    return actualLevel >= requiredLevel;
  }

  private showZoneWelcomeMessage(zone: string): void {
    const messages: Record<string, string> = {
      restaurant: '🍽️ Welcome to our restaurant! You can order directly from your table.',
      spa: '🏊 Welcome to our spa! You can request pool/gym access.',
      lobby: '👋 Welcome! Our concierge is here to help.',
      room: '🛏️ Welcome to your room! You can order room service.',
    };

    const message = messages[zone];
    if (message) {
      console.log(`\n${message}\n`);
    }
  }

  // ============================================================================
  // Private: Cloud Sync
  // ============================================================================

  private async syncToCloud(data: any): Promise<void> {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log('☁️ Order backed up to cloud');
      }
    } catch (error) {
      console.warn('⚠️ Cloud sync failed (order still sent via P2P):', error);
    }
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Location-Aware Guest Portal - WebRTC + Beacons  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const tenantId = 'demo-hotel-123';

  // Initialize guest portal
  const portal = new LocationAwareGuestPortal(tenantId);

  try {
    await portal.initialize();
  } catch (error) {
    console.error('Failed to initialize guest portal:', error);
    process.exit(1);
  }

  // Wait for location detection
  console.log('⏳ Waiting for location detection...\n');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Get current location
  const location = portal.getLocation();

  if (!location || !location.zone) {
    console.warn('⚠️ Unable to detect location - please move closer to a beacon\n');
    portal.shutdown();
    return;
  }

  console.log('📍 Current location detected!');
  console.log(`   Zone: ${location.zone}`);
  console.log(`   Area: ${location.area}`);
  console.log(`   Accuracy: ${location.accuracy}\n`);

  // Show available features
  const features = portal.getAvailableFeatures();
  console.log('✨ Available features:');
  for (const feature of features) {
    console.log(`   - ${feature.type}`);
  }
  console.log('');

  // Demo: Place restaurant order (if in restaurant)
  if (location.zone === 'restaurant') {
    await portal.placeRestaurantOrder([
      { itemId: 'burger', name: 'Classic Cheeseburger', quantity: 1, notes: 'No onions' },
      { itemId: 'fries', name: 'French Fries', quantity: 1 },
      { itemId: 'coke', name: 'Coca-Cola', quantity: 2 },
    ]);
  }

  // Demo: Request spa access (if in spa)
  if (location.zone === 'spa') {
    await portal.requestSpaAccess('pool');
  }

  // Demo: Ask concierge (if in lobby)
  if (location.zone === 'lobby') {
    await portal.askConcierge('What are the best restaurants nearby?');
  }

  // Keep running
  console.log('Press Ctrl+C to exit...\n');

  process.on('SIGINT', () => {
    portal.shutdown();
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default LocationAwareGuestPortal;
