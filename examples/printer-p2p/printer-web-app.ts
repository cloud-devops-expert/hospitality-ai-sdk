/**
 * Printer Web App - WebRTC P2P Example
 *
 * Lightweight web app that runs on a device connected to receipt printer.
 * Receives print jobs via WebRTC P2P from POS devices.
 *
 * Latency: 50ms (POS → Printer via P2P, not 500ms cloud API)
 * Cost: $0 (no cloud API calls)
 *
 * Deployment options:
 * 1. Electron app (Windows/Mac desktop app)
 * 2. Browser kiosk mode (lightweight computer next to printer)
 * 3. Raspberry Pi with Chromium
 * 4. Intel NUC with web browser
 *
 * Printer support:
 * - ESC/POS (Epson, Star, most thermal printers)
 * - Star PRNT (Star Micronics)
 * - PDF (for office printers via browser print API)
 */

import { P2PConnection } from '../../lib/webrtc/p2p-connection';
import type { PrintMessage } from '../../lib/webrtc/types';

interface PrintJob {
  jobId: string;
  printerType: 'receipt' | 'kitchen' | 'label';
  format: 'esc-pos' | 'star' | 'pdf';
  content: string;
  copies?: number;
  receivedAt: number;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  error?: string;
}

export class PrinterWebApp {
  private connection: P2PConnection;
  private printQueue: Map<string, PrintJob> = new Map();
  private printerName: string;
  private printerType: 'receipt' | 'kitchen' | 'label';

  constructor(
    tenantId: string,
    printerName: string = 'Receipt Printer 1',
    printerType: 'receipt' | 'kitchen' | 'label' = 'receipt'
  ) {
    this.printerName = printerName;
    this.printerType = printerType;

    // Initialize P2P connection
    this.connection = new P2PConnection({
      signalingServers: [
        'ws://signaling.local:8080', // Local signaling (Phase 3, optional)
        'wss://signaling.yourdomain.com', // Cloud signaling (Phase 1-2)
      ],
      tenantId,
      deviceInfo: {
        type: 'printer',
        name: printerName,
        capabilities: ['printing'],
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

      // If connected to POS, we can receive print jobs
      if (peer.deviceInfo.type === 'pos' || peer.deviceInfo.type === 'staff') {
        console.log('🖨️ Ready to receive print jobs!');
      }
    });

    this.connection.on('topology-detected', (topology) => {
      console.log('📡 Network topology:', {
        type: topology.topology,
        latency: `${topology.latency}ms`,
        cost: topology.estimatedCost === 0 ? 'FREE (local P2P)' : `$${topology.estimatedCost}/GB`,
      });

      if (topology.topology === 'local-p2p') {
        console.log('✅ Print jobs will arrive locally (50ms, $0 cost)');
      }
    });

    this.connection.on('print', (printMessage, fromPeerId) => {
      console.log('📥 Print job received from:', fromPeerId);
      this.handlePrintJob(printMessage, fromPeerId);
    });

    this.connection.on('error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  async connect(): Promise<void> {
    console.log('🔌 Connecting to property network...');
    await this.connection.connect();
    console.log('✅ Connected! Ready to receive print jobs.');
  }

  private async handlePrintJob(printMessage: PrintMessage, fromPeerId: string): Promise<void> {
    const printJob: PrintJob = {
      ...printMessage.printJob,
      receivedAt: Date.now(),
      status: 'pending',
    };

    this.printQueue.set(printJob.jobId, printJob);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         NEW PRINT JOB RECEIVED!        ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║ Job ID: ${printJob.jobId.padEnd(31)}║`);
    console.log(`║ Type: ${printJob.printerType.padEnd(33)}║`);
    console.log(`║ Format: ${printJob.format.padEnd(31)}║`);
    console.log(`║ Copies: ${String(printJob.copies || 1).padEnd(31)}║`);
    console.log('╚════════════════════════════════════════╝\n');

    // Print the job
    await this.print(printJob);

    // Send confirmation back to POS
    this.sendPrintConfirmation(printJob.jobId, printJob.status, fromPeerId);
  }

  private async print(printJob: PrintJob): Promise<void> {
    try {
      printJob.status = 'printing';
      console.log('🖨️ Printing...');

      // Dispatch to appropriate printer handler
      switch (printJob.format) {
        case 'esc-pos':
          await this.printESCPOS(printJob);
          break;
        case 'star':
          await this.printStar(printJob);
          break;
        case 'pdf':
          await this.printPDF(printJob);
          break;
        default:
          throw new Error(`Unsupported printer format: ${printJob.format}`);
      }

      printJob.status = 'completed';
      console.log('✅ Print job completed!');
    } catch (error) {
      printJob.status = 'failed';
      printJob.error = error instanceof Error ? error.message : String(error);
      console.error('❌ Print job failed:', printJob.error);
    }
  }

  /**
   * Print ESC/POS receipt (Epson, most thermal printers)
   */
  private async printESCPOS(printJob: PrintJob): Promise<void> {
    console.log('📄 Printing ESC/POS receipt...');

    // In a real implementation:
    // 1. Use Web USB API to connect to printer
    // 2. Send ESC/POS commands via USB
    // 3. Example: https://github.com/NielsLeenheer/EscPosEncoder

    // For demo, decode ESC/POS commands and simulate
    const escposCommands = printJob.content;

    console.log('ESC/POS Commands:');
    console.log('─────────────────────────────────────────');
    console.log(this.decodeESCPOS(escposCommands));
    console.log('─────────────────────────────────────────');

    // Simulate printing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In real app, would use:
    // const encoder = new EscPosEncoder();
    // const result = encoder
    //   .initialize()
    //   .text(escposCommands)
    //   .cut()
    //   .encode();
    // await navigator.usb.requestDevice(...);
    // await device.transferOut(endpointNumber, result);
  }

  /**
   * Print Star PRNT receipt (Star Micronics printers)
   */
  private async printStar(printJob: PrintJob): Promise<void> {
    console.log('📄 Printing Star PRNT receipt...');

    // In real implementation:
    // Use Star Micronics SDK: https://www.starmicronics.com/support/sdk.aspx

    console.log(printJob.content);

    // Simulate printing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Print PDF (office printers, via browser print API)
   */
  private async printPDF(printJob: PrintJob): Promise<void> {
    console.log('📄 Printing PDF...');

    // In browser environment:
    if (typeof window !== 'undefined') {
      // Decode base64 PDF
      const pdfBlob = this.base64ToBlob(printJob.content, 'application/pdf');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Open print dialog
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 5000);
    } else {
      console.log('PDF content (base64):', printJob.content.substring(0, 100) + '...');
    }

    // Simulate printing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private sendPrintConfirmation(jobId: string, status: string, targetPeerId: string): void {
    console.log(`📤 Sending print confirmation for job ${jobId} to ${targetPeerId}`);

    // Send notification via P2P
    this.connection.send(
      {
        type: 'notification',
        notification: {
          notificationId: `notif-${Date.now()}`,
          title: status === 'completed' ? 'Print Successful' : 'Print Failed',
          message:
            status === 'completed'
              ? `Print job ${jobId} completed.`
              : `Print job ${jobId} failed.`,
          priority: status === 'failed' ? 'high' : 'normal',
        },
      },
      targetPeerId
    );

    // Background cloud sync
    this.syncPrintStatusToCloud(jobId, status);
  }

  private async syncPrintStatusToCloud(jobId: string, status: string): Promise<void> {
    try {
      const response = await fetch(`/api/print-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        console.log('☁️ Print status synced to cloud');
      }
    } catch (error) {
      console.warn('⚠️ Cloud sync failed (status update still sent via P2P):', error);
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private decodeESCPOS(escpos: string): string {
    // Simple ESC/POS decoder for demo
    // In real implementation, would properly parse ESC/POS byte commands

    return escpos
      .replace(/\x1B\x40/g, '[INIT]')
      .replace(/\x1B\x61\x01/g, '[CENTER]')
      .replace(/\x1B\x61\x00/g, '[LEFT]')
      .replace(/\x1B\x21\x08/g, '[BOLD]')
      .replace(/\x1B\x21\x00/g, '[NORMAL]')
      .replace(/\x1D\x56\x42\x00/g, '[CUT]')
      .replace(/\n/g, '\n');
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  getPrintQueue(): PrintJob[] {
    return Array.from(this.printQueue.values());
  }

  disconnect(): void {
    this.connection.disconnect();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('🖨️ Printer Web App - WebRTC P2P Demo\n');

  // Printer web app
  const printer = new PrinterWebApp('hotel-abc-123', 'Front Desk Receipt Printer', 'receipt');

  // Connect to property network
  await printer.connect();

  console.log('\n✅ Printer ready! Waiting for print jobs...\n');

  // Keep running
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down printer...');
    printer.disconnect();
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default PrinterWebApp;
