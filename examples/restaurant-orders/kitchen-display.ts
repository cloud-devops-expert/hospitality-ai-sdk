/**
 * Restaurant Order Example - Kitchen Display
 *
 * Receives orders via WebRTC P2P from guest devices or staff iPads.
 *
 * Latency: 50ms (guest → kitchen via P2P)
 * Cost: $0 (no cloud API calls)
 *
 * Flow:
 * 1. Kitchen display connects to property network
 * 2. Receives orders via WebRTC P2P
 * 3. Displays order on screen
 * 4. Sends status updates back to guest/staff
 */

import { P2PConnection } from '../../lib/webrtc/p2p-connection';
import type { OrderMessage } from '../../lib/webrtc/types';

interface Order {
  orderId: string;
  tableId: number;
  guestName?: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    notes?: string;
  }[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  receivedAt: number;
}

export class KitchenDisplayApp {
  private connection: P2PConnection;
  private orders: Map<string, Order> = new Map();

  constructor(tenantId: string, kitchenName: string = 'Main Kitchen') {
    // Initialize P2P connection
    this.connection = new P2PConnection({
      signalingServers: [
        'ws://signaling.local:8080', // Local signaling (Phase 3, optional)
        'wss://signaling.yourdomain.com', // Cloud signaling (Phase 1-2)
      ],
      tenantId,
      deviceInfo: {
        type: 'kitchen-display',
        name: kitchenName,
        capabilities: ['orders', 'notifications'],
      },
      preferLocal: true,
      debug: true,
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.connection.on('connected', (peer) => {
      console.log('✅ Connected to peer:', peer.peerId, peer.deviceInfo.type);
    });

    this.connection.on('topology-detected', (topology) => {
      console.log('📡 Network topology:', {
        type: topology.topology,
        latency: `${topology.latency}ms`,
        cost: topology.estimatedCost === 0 ? 'FREE (local P2P)' : `$${topology.estimatedCost}/GB`,
      });

      if (topology.topology === 'local-p2p') {
        console.log('✅ Receiving orders locally (50ms, $0 cost)');
      }
    });

    this.connection.on('order', (orderMessage, fromPeerId) => {
      console.log('📥 New order received from:', fromPeerId);
      this.handleOrder(orderMessage, fromPeerId);
    });

    this.connection.on('error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  async connect(): Promise<void> {
    console.log('🔌 Connecting to property network...');
    await this.connection.connect();
    console.log('✅ Connected! Ready to receive orders.');
  }

  private handleOrder(orderMessage: OrderMessage, fromPeerId: string): void {
    const order: Order = {
      ...orderMessage.order,
      receivedAt: Date.now(),
    };

    this.orders.set(order.orderId, order);

    // Display order
    this.displayOrder(order);

    // Send confirmation back to guest/staff
    this.sendOrderConfirmation(order.orderId, fromPeerId);

    // Auto-confirm after 2 seconds (demo)
    setTimeout(() => {
      this.updateOrderStatus(order.orderId, 'confirmed');
    }, 2000);

    // Auto-start preparing after 5 seconds (demo)
    setTimeout(() => {
      this.updateOrderStatus(order.orderId, 'preparing');
    }, 5000);

    // Auto-mark ready after 10 seconds (demo)
    setTimeout(() => {
      this.updateOrderStatus(order.orderId, 'ready');
    }, 10000);
  }

  private displayOrder(order: Order): void {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║          NEW ORDER RECEIVED!           ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ Order ID: ${order.orderId.padEnd(29)}║`);
    console.log(`║ Table: ${String(order.tableId).padEnd(33)}║`);
    console.log('╠════════════════════════════════════════╣');
    console.log('║ Items:                                 ║');

    for (const item of order.items) {
      const itemLine = `${item.quantity}x ${item.name}`;
      console.log(`║   ${itemLine.padEnd(37)}║`);
      if (item.notes) {
        console.log(`║      Note: ${item.notes.padEnd(27)}║`);
      }
    }

    console.log('╠════════════════════════════════════════╣');
    console.log(`║ Total: $${String(order.total).padEnd(31)}║`);
    console.log(`║ Status: ${order.status.toUpperCase().padEnd(31)}║`);
    console.log('╚════════════════════════════════════════╝\n');
  }

  private sendOrderConfirmation(orderId: string, targetPeerId: string): void {
    console.log(`📤 Sending confirmation for order ${orderId} to ${targetPeerId}`);

    // Send notification via P2P
    this.connection.send(
      {
        type: 'notification',
        notification: {
          notificationId: `notif-${Date.now()}`,
          title: 'Order Received!',
          message: `Your order has been received by the kitchen.`,
          priority: 'normal',
        },
      },
      targetPeerId
    );
  }

  updateOrderStatus(orderId: string, status: Order['status']): void {
    const order = this.orders.get(orderId);
    if (!order) {
      console.warn(`Order ${orderId} not found`);
      return;
    }

    order.status = status;
    console.log(`📝 Order ${orderId} status updated: ${status.toUpperCase()}`);

    // Send notification to all connected peers (guest + staff)
    const statusMessages = {
      confirmed: 'Your order has been confirmed!',
      preparing: 'Your order is being prepared.',
      ready: 'Your order is ready!',
      delivered: 'Order delivered. Enjoy!',
    };

    this.connection.send({
      type: 'notification',
      notification: {
        notificationId: `notif-${Date.now()}`,
        title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: statusMessages[status] || `Order status: ${status}`,
        priority: status === 'ready' ? 'high' : 'normal',
      },
    });

    // Background cloud sync
    this.syncOrderStatusToCloud(orderId, status);
  }

  private async syncOrderStatusToCloud(orderId: string, status: string): Promise<void> {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        console.log('☁️ Order status synced to cloud');
      }
    } catch (error) {
      console.warn('⚠️ Cloud sync failed (status update still sent via P2P):', error);
    }
  }

  getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getOrdersByStatus(status: Order['status']): Order[] {
    return this.getOrders().filter((order) => order.status === status);
  }

  disconnect(): void {
    this.connection.disconnect();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('👨‍🍳 Kitchen Display App - WebRTC P2P Demo\n');

  // Kitchen display
  const kitchen = new KitchenDisplayApp('hotel-abc-123', 'Main Kitchen');

  // Connect to property network
  await kitchen.connect();

  console.log('\n✅ Kitchen display ready! Waiting for orders...\n');

  // Keep running
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down kitchen display...');
    kitchen.disconnect();
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default KitchenDisplayApp;
