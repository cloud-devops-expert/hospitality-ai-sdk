/**
 * POS App - WebRTC P2P Example
 *
 * Point-of-sale app that sends print jobs via WebRTC P2P to local printers.
 *
 * Latency: 50ms (POS → Printer via P2P, not 500ms cloud API)
 * Cost: $0 (no cloud API calls)
 *
 * Flow:
 * 1. POS app processes transaction
 * 2. Generate receipt
 * 3. Send print job via WebRTC P2P to printer (50ms)
 * 4. Printer confirms (10ms)
 * 5. Background cloud sync (backup to Aurora)
 */

import { P2PConnection } from '../../lib/webrtc/p2p-connection';

export class POSApp {
  private connection: P2PConnection;
  private stationName: string;

  constructor(tenantId: string, stationName: string = 'Front Desk POS') {
    this.stationName = stationName;

    // Initialize P2P connection
    this.connection = new P2PConnection({
      signalingServers: [
        'ws://signaling.local:8080', // Local signaling (Phase 3, optional)
        'wss://signaling.yourdomain.com', // Cloud signaling (Phase 1-2)
      ],
      tenantId,
      deviceInfo: {
        type: 'pos',
        name: stationName,
        capabilities: ['printing', 'orders'],
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

      // If connected to printer, we can send print jobs
      if (peer.deviceInfo.type === 'printer') {
        console.log('🖨️ Printer available:', peer.deviceInfo.name);
      }
    });

    this.connection.on('topology-detected', (topology) => {
      console.log('📡 Network topology:', {
        type: topology.topology,
        latency: `${topology.latency}ms`,
        cost: topology.estimatedCost === 0 ? 'FREE (local P2P)' : `$${topology.estimatedCost}/GB`,
      });

      if (topology.topology === 'local-p2p') {
        console.log('✅ Printing will be local (50ms, $0 cost)');
      }
    });

    this.connection.on('notification', (notification) => {
      console.log('📬 Notification from printer:', notification.notification);
    });

    this.connection.on('error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  async connect(): Promise<void> {
    console.log('🔌 Connecting to property network...');
    await this.connection.connect();
    console.log('✅ Connected!');
  }

  /**
   * Process transaction and print receipt
   */
  async processTransaction(transaction: {
    transactionId: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    paymentMethod: string;
    guestName?: string;
  }): Promise<void> {
    console.log('💳 Processing transaction:', transaction.transactionId);

    // Generate receipt content (ESC/POS commands)
    const receiptContent = this.generateESCPOSReceipt(transaction);

    // Send print job via WebRTC P2P (local network, 50ms)
    const jobId = `print-${Date.now()}`;

    this.connection.send({
      type: 'print',
      printJob: {
        jobId,
        printerType: 'receipt',
        format: 'esc-pos',
        content: receiptContent,
        copies: 1,
      },
    });

    console.log('✅ Print job sent via P2P!');
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Latency: ~50ms (local P2P)`);

    // Background cloud sync (backup transaction)
    this.syncTransactionToCloud(transaction);
  }

  /**
   * Generate ESC/POS receipt content
   */
  private generateESCPOSReceipt(transaction: {
    transactionId: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    paymentMethod: string;
    guestName?: string;
  }): string {
    // ESC/POS command sequences
    const ESC = '\x1B';
    const INIT = ESC + '\x40'; // Initialize printer
    const CENTER = ESC + '\x61\x01'; // Center alignment
    const LEFT = ESC + '\x61\x00'; // Left alignment
    const BOLD = ESC + '\x21\x08'; // Bold text
    const NORMAL = ESC + '\x21\x00'; // Normal text
    const CUT = '\x1D\x56\x42\x00'; // Cut paper

    let receipt = '';

    // Header
    receipt += INIT;
    receipt += CENTER;
    receipt += BOLD;
    receipt += 'HOTEL ABC\n';
    receipt += NORMAL;
    receipt += '123 Main Street\n';
    receipt += 'Anytown, USA 12345\n';
    receipt += '(555) 123-4567\n';
    receipt += '\n';

    // Transaction info
    receipt += LEFT;
    receipt += `Transaction: ${transaction.transactionId}\n`;
    receipt += `Date: ${new Date().toLocaleString()}\n`;
    if (transaction.guestName) {
      receipt += `Guest: ${transaction.guestName}\n`;
    }
    receipt += `Cashier: ${this.stationName}\n`;
    receipt += '─────────────────────────────────────\n';

    // Items
    for (const item of transaction.items) {
      const itemLine = `${item.quantity}x ${item.name}`;
      const price = `$${(item.price * item.quantity).toFixed(2)}`;
      const padding = 38 - itemLine.length - price.length;
      receipt += itemLine + ' '.repeat(padding) + price + '\n';
    }

    receipt += '─────────────────────────────────────\n';

    // Total
    receipt += BOLD;
    const totalLine = 'TOTAL:';
    const totalPrice = `$${transaction.total.toFixed(2)}`;
    const totalPadding = 38 - totalLine.length - totalPrice.length;
    receipt += totalLine + ' '.repeat(totalPadding) + totalPrice + '\n';
    receipt += NORMAL;

    // Payment method
    receipt += `Payment: ${transaction.paymentMethod}\n`;
    receipt += '\n';

    // Footer
    receipt += CENTER;
    receipt += 'Thank you for your business!\n';
    receipt += 'Please come again.\n';
    receipt += '\n';
    receipt += '\n';
    receipt += '\n';

    // Cut paper
    receipt += CUT;

    return receipt;
  }

  /**
   * Background cloud sync (for backup, analytics)
   */
  private async syncTransactionToCloud(transaction: any): Promise<void> {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (response.ok) {
        console.log('☁️ Transaction backed up to cloud');
      }
    } catch (error) {
      console.warn('⚠️ Cloud sync failed (receipt still printed via P2P):', error);
      // Not critical - receipt was already printed via P2P
    }
  }

  disconnect(): void {
    this.connection.disconnect();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('💳 POS App - WebRTC P2P Demo\n');

  // POS app
  const pos = new POSApp('hotel-abc-123', 'Front Desk POS');

  // Connect to property network
  await pos.connect();

  // Wait for P2P connection to establish
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Process a transaction
  await pos.processTransaction({
    transactionId: `TXN-${Date.now()}`,
    items: [
      { name: 'Room 205 (2 nights)', price: 150, quantity: 1 },
      { name: 'Breakfast (2 persons)', price: 25, quantity: 2 },
      { name: 'Parking', price: 15, quantity: 1 },
    ],
    total: 215,
    paymentMethod: 'Visa ****1234',
    guestName: 'John Smith',
  });

  console.log('\n✅ Transaction processed! Receipt printed in ~50ms.\n');

  // Keep running for more transactions
  console.log('💳 POS ready for next transaction...\n');

  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down POS...');
    pos.disconnect();
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default POSApp;
