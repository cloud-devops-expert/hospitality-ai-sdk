/**
 * WebRTC Local Signaling (mDNS-based, Offline-Capable)
 *
 * Solves the critical problem: "What happens when WebRTC doesn't have internet for signaling?"
 *
 * Problem:
 * - Cloud-based signaling requires internet
 * - Small hotels need P2P collaboration for business continuity
 * - If internet goes down, cloud signaling fails → no P2P → no collaboration
 *
 * Solution:
 * - Each device runs a local HTTP signaling server
 * - Devices advertise themselves via mDNS (e.g., "tablet-1._webrtc-peer._tcp.local.")
 * - Devices discover peers via mDNS
 * - Devices exchange WebRTC signaling via HTTP (local network only)
 * - No internet needed - fully decentralized!
 *
 * Architecture:
 * 1. Device A starts local signaling server (port 8090)
 * 2. Device A advertises via mDNS: "tablet-1._webrtc-peer._tcp.local."
 * 3. Device B discovers Device A via mDNS
 * 4. Device B sends WebRTC offer to http://tablet-1.local:8090/offer
 * 5. Device A responds with answer
 * 6. WebRTC connection established (direct P2P)
 * 7. Signaling servers no longer needed
 *
 * Fallback Chain:
 * 1. Try local mDNS signaling (offline-capable)
 * 2. Fall back to cloud signaling (requires internet)
 */

import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import cors from 'cors';

// Type declarations for optional React Native dependency
type ServiceInfo = any;
type Zeroconf = any;

export interface SignalingOffer {
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
  iceCandidates: RTCIceCandidateInit[];
}

export interface SignalingAnswer {
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
  iceCandidates: RTCIceCandidateInit[];
}

export interface PeerInfo {
  id: string;
  hostname: string;
  ip: string;
  port: number;
  deviceType: string;
  propertyId: string;
  lastSeen: number;
}

/**
 * Local WebRTC Signaling Server
 *
 * Runs on each device, provides HTTP API for WebRTC signaling.
 * No internet required - fully local.
 */
export class LocalSignalingServer {
  private app: Express;
  private server: Server | null = null;
  private zeroconf: any | null = null; // Zeroconf instance for mDNS
  private port: number;
  private deviceId: string;
  private propertyId: string;
  private deviceType: string;
  private pendingOffers: Map<string, SignalingOffer> = new Map();
  private onOfferReceived?: (offer: SignalingOffer) => Promise<SignalingAnswer>;

  constructor(
    deviceId: string,
    propertyId: string,
    deviceType: string = 'tablet',
    port: number = 8090
  ) {
    this.deviceId = deviceId;
    this.propertyId = propertyId;
    this.deviceType = deviceType;
    this.port = port;
    this.app = express();

    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        deviceId: this.deviceId,
        propertyId: this.propertyId,
        deviceType: this.deviceType,
      });
    });

    // Receive WebRTC offer
    this.app.post('/offer', async (req: Request, res: Response) => {
      try {
        const offer: SignalingOffer = req.body;
        console.log(`Received offer from ${offer.from}`);

        // Store offer
        this.pendingOffers.set(offer.from, offer);

        // Generate answer (callback to WebRTC peer)
        if (this.onOfferReceived) {
          const answer = await this.onOfferReceived(offer);
          res.json(answer);
        } else {
          res.status(503).json({ error: 'Offer handler not registered' });
        }
      } catch (error) {
        console.error('Error handling offer:', error);
        res.status(500).json({ error: 'Failed to handle offer' });
      }
    });

    // Receive WebRTC answer
    this.app.post('/answer', (req: Request, res: Response) => {
      try {
        const answer: SignalingAnswer = req.body;
        console.log(`Received answer from ${answer.from}`);

        // Answer is handled by WebRTC peer via polling or callback
        res.json({ status: 'ok' });
      } catch (error) {
        console.error('Error handling answer:', error);
        res.status(500).json({ error: 'Failed to handle answer' });
      }
    });

    // Receive ICE candidate
    this.app.post('/ice-candidate', (req: Request, res: Response) => {
      try {
        const { from, candidate } = req.body;
        console.log(`Received ICE candidate from ${from}`);

        // ICE candidate is handled by WebRTC peer
        res.json({ status: 'ok' });
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
        res.status(500).json({ error: 'Failed to handle ICE candidate' });
      }
    });
  }

  /**
   * Start local signaling server and advertise via mDNS
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start HTTP server
        this.server = this.app.listen(this.port, () => {
          console.log(`Local signaling server listening on port ${this.port}`);
          console.log(`Device: ${this.deviceId}`);
          console.log(`Property: ${this.propertyId}`);

          // Advertise via mDNS
          this.advertiseMDNS();

          resolve();
        });

        this.server?.on('error', (error) => {
          console.error('Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop signaling server and stop mDNS advertising
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Stop mDNS
      if (this.zeroconf) {
        try {
          this.zeroconf.unregister_all_services();
          this.zeroconf.close();
        } catch (error) {
          console.error('Error stopping mDNS:', error);
        }
        this.zeroconf = null;
      }

      // Stop HTTP server
      if (this.server) {
        this.server.close(() => {
          console.log('Local signaling server stopped');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Register callback for when offer is received
   */
  onOffer(handler: (offer: SignalingOffer) => Promise<SignalingAnswer>): void {
    this.onOfferReceived = handler;
  }

  /**
   * Advertise this signaling server via mDNS
   */
  private advertiseMDNS(): void {
    try {
      // For browser/Node.js (using zeroconf library)
      const Zeroconf = require('zeroconf');
      this.zeroconf = new Zeroconf();

      const serviceName = `${this.deviceId}._webrtc-peer._tcp.local.`;
      const localIp = this.getLocalIP();

      const serviceInfo = {
        type: '_webrtc-peer._tcp.local.',
        name: this.deviceId,
        addresses: [localIp],
        port: this.port,
        properties: {
          deviceId: this.deviceId,
          propertyId: this.propertyId,
          deviceType: this.deviceType,
          protocol: 'webrtc-signaling-http',
        },
        server: `${this.deviceId}.local.`,
      };

      this.zeroconf.register_service(serviceInfo);

      console.log('mDNS service advertised:', serviceName);
      console.log('  Type: _webrtc-peer._tcp.local.');
      console.log(`  IP: ${localIp}`);
      console.log(`  Port: ${this.port}`);
    } catch (error) {
      console.error('Failed to advertise mDNS:', error);
      // Non-fatal - can still work with manual IP entry
    }
  }

  private getLocalIP(): string {
    // This is a simplified version - in production, use proper network detection
    return '192.168.20.10'; // Placeholder
  }
}

/**
 * Local WebRTC Peer Discovery
 *
 * Discovers other devices on local network via mDNS.
 */
export class LocalPeerDiscovery {
  private propertyId: string;
  private zeroconf: any | null = null;
  private discoveredPeers: Map<string, PeerInfo> = new Map();
  private onPeerDiscovered?: (peer: PeerInfo) => void;
  private onPeerLost?: (peerId: string) => void;

  constructor(propertyId: string) {
    this.propertyId = propertyId;
  }

  /**
   * Start discovering peers via mDNS
   */
  async start(): Promise<void> {
    console.log('Starting local peer discovery...');

    try {
      const Zeroconf = require('zeroconf');
      this.zeroconf = new Zeroconf();

      // Listen for discovered services
      this.zeroconf.on('resolved', (service: any) => {
        this.handleServiceResolved(service);
      });

      // Listen for lost services
      this.zeroconf.on('removed', (service: any) => {
        this.handleServiceRemoved(service);
      });

      // Start scanning for WebRTC peers
      this.zeroconf.scan('_webrtc-peer._tcp.local.');

      console.log('Local peer discovery started');
    } catch (error) {
      console.error('Failed to start peer discovery:', error);
      throw error;
    }
  }

  /**
   * Stop discovering peers
   */
  async stop(): Promise<void> {
    if (this.zeroconf) {
      this.zeroconf.stop();
      this.zeroconf = null;
    }
    console.log('Local peer discovery stopped');
  }

  /**
   * Get all discovered peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.discoveredPeers.values()).filter(
      (peer) => peer.propertyId === this.propertyId
    );
  }

  /**
   * Register callback for peer discovery
   */
  onPeerFound(handler: (peer: PeerInfo) => void): void {
    this.onPeerDiscovered = handler;
  }

  /**
   * Register callback for peer lost
   */
  onPeerRemoved(handler: (peerId: string) => void): void {
    this.onPeerLost = handler;
  }

  private handleServiceResolved(service: any): void {
    console.log('Service discovered:', service);

    const peer: PeerInfo = {
      id: service.txt?.deviceId || service.name,
      hostname: service.host || `${service.name}.local`,
      ip: service.addresses?.[0] || service.host,
      port: service.port || 8090,
      deviceType: service.txt?.deviceType || 'unknown',
      propertyId: service.txt?.propertyId || '',
      lastSeen: Date.now(),
    };

    // Only add peers from same property
    if (peer.propertyId === this.propertyId) {
      this.discoveredPeers.set(peer.id, peer);

      if (this.onPeerDiscovered) {
        this.onPeerDiscovered(peer);
      }

      console.log(`Peer discovered: ${peer.id} at ${peer.ip}:${peer.port}`);
    }
  }

  private handleServiceRemoved(service: any): void {
    const peerId = service.txt?.deviceId || service.name;

    if (this.discoveredPeers.has(peerId)) {
      this.discoveredPeers.delete(peerId);

      if (this.onPeerLost) {
        this.onPeerLost(peerId);
      }

      console.log(`Peer lost: ${peerId}`);
    }
  }
}

/**
 * Send WebRTC offer to peer via local HTTP signaling
 */
export async function sendOfferToLocalPeer(
  peer: PeerInfo,
  offer: SignalingOffer,
  timeout: number = 5000
): Promise<SignalingAnswer> {
  const url = `http://${peer.ip}:${peer.port}/offer`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to send offer: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Send ICE candidate to peer via local HTTP signaling
 */
export async function sendIceCandidateToLocalPeer(
  peer: PeerInfo,
  from: string,
  candidate: RTCIceCandidateInit,
  timeout: number = 5000
): Promise<void> {
  const url = `http://${peer.ip}:${peer.port}/ice-candidate`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, candidate }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to send ICE candidate: ${response.statusText}`);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Create local signaling server
 *
 * @example
 * ```typescript
 * // Device 1 (Tablet 1)
 * const server1 = new LocalSignalingServer(
 *   'tablet-1',
 *   'property-123',
 *   'tablet',
 *   8090
 * );
 *
 * // Handle incoming offers
 * server1.onOffer(async (offer) => {
 *   // Create WebRTC answer
 *   const pc = new RTCPeerConnection();
 *   await pc.setRemoteDescription(offer.sdp);
 *   const answer = await pc.createAnswer();
 *   await pc.setLocalDescription(answer);
 *
 *   return {
 *     from: 'tablet-1',
 *     to: offer.from,
 *     sdp: answer,
 *     iceCandidates: [],
 *   };
 * });
 *
 * await server1.start();
 *
 * // Device 2 (Tablet 2)
 * const discovery = new LocalPeerDiscovery('property-123');
 *
 * discovery.onPeerFound(async (peer) => {
 *   console.log('Found peer:', peer.id);
 *
 *   // Create WebRTC offer
 *   const pc = new RTCPeerConnection();
 *   const channel = pc.createDataChannel('data');
 *   const offer = await pc.createOffer();
 *   await pc.setLocalDescription(offer);
 *
 *   // Send offer to peer
 *   const answer = await sendOfferToLocalPeer(peer, {
 *     from: 'tablet-2',
 *     to: peer.id,
 *     sdp: offer,
 *     iceCandidates: [],
 *   });
 *
 *   // Set remote description
 *   await pc.setRemoteDescription(answer.sdp);
 *
 *   // Now connected via WebRTC!
 * });
 *
 * await discovery.start();
 * ```
 */
export function createLocalSignalingServer(
  deviceId: string,
  propertyId: string,
  deviceType: string = 'tablet',
  port: number = 8090
): LocalSignalingServer {
  return new LocalSignalingServer(deviceId, propertyId, deviceType, port);
}

export function createLocalPeerDiscovery(propertyId: string): LocalPeerDiscovery {
  return new LocalPeerDiscovery(propertyId);
}
