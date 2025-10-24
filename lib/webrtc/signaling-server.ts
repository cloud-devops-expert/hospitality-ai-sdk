/**
 * WebRTC Signaling Server (Standalone WebSocket Server)
 *
 * Cloud signaling server for coordinating WebRTC P2P connections.
 * This runs as a separate process from Next.js (can be deployed to AWS, Heroku, etc.)
 *
 * Architecture:
 * - Staff devices connect via WebSocket (wss://signaling.yourdomain.com)
 * - Server coordinates WebRTC offer/answer/ICE candidates
 * - Once connected, all data flows P2P (local network)
 * - Server only handles connection setup (~1KB per connection)
 *
 * Cost: ~$5-10/month for entire fleet (10,000 hotels)
 * - Tiny signaling messages (~1KB per connection setup)
 * - No data transfer after P2P connection established
 *
 * Usage:
 *   node lib/webrtc/signaling-server.ts
 *   # or
 *   tsx lib/webrtc/signaling-server.ts
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { SignalingMessage, PeerInfo } from './types';

interface ConnectedPeer {
  ws: WebSocket;
  peerId: string;
  tenantId: string;
  deviceInfo: {
    type: 'staff' | 'pos' | 'printer' | 'kitchen-display' | 'guest';
    name: string;
    capabilities: string[];
  };
  connectedAt: number;
}

export class SignalingServer {
  private wss: WebSocketServer;
  private peers: Map<string, ConnectedPeer> = new Map(); // peerId → peer
  private tenantPeers: Map<string, Set<string>> = new Map(); // tenantId → Set<peerId>

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('listening', () => {
      console.log(`[SignalingServer] Listening on ws://localhost:${port}`);
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[SignalingServer] New connection');

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as SignalingMessage;
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[SignalingServer] Error parsing message:', error);
          ws.send(
            JSON.stringify({
              type: 'error',
              error: 'Invalid message format',
            })
          );
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('[SignalingServer] WebSocket error:', error);
      });
    });

    this.wss.on('error', (error) => {
      console.error('[SignalingServer] Server error:', error);
    });

    // Periodic cleanup of stale connections
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 60000); // Every minute
  }

  private handleMessage(ws: WebSocket, message: SignalingMessage): void {
    console.log(`[SignalingServer] Received ${message.type} from ${message.peerId}`);

    switch (message.type) {
      case 'join':
        this.handleJoin(ws, message as any);
        break;

      case 'leave':
        this.handleLeave(message.peerId);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relayToTarget(message as any);
        break;

      default:
        console.warn('[SignalingServer] Unknown message type:', message.type);
    }
  }

  private handleJoin(ws: WebSocket, message: any): void {
    const { peerId, tenantId, deviceInfo } = message;

    // Store peer
    const peer: ConnectedPeer = {
      ws,
      peerId,
      tenantId,
      deviceInfo,
      connectedAt: Date.now(),
    };

    this.peers.set(peerId, peer);

    // Add to tenant room
    if (!this.tenantPeers.has(tenantId)) {
      this.tenantPeers.set(tenantId, new Set());
    }
    this.tenantPeers.get(tenantId)!.add(peerId);

    console.log(`[SignalingServer] Peer ${peerId} joined tenant ${tenantId}`);

    // Send current peers list to new peer
    const tenantPeersList = this.getPeersInTenant(tenantId);
    ws.send(
      JSON.stringify({
        type: 'peers-list',
        peerId: 'server',
        tenantId,
        timestamp: Date.now(),
        peers: tenantPeersList,
      })
    );

    // Notify other peers in tenant about new peer
    this.broadcastToTenant(
      tenantId,
      {
        type: 'join',
        peerId,
        tenantId,
        timestamp: Date.now(),
        deviceInfo,
      },
      peerId // Exclude new peer from broadcast
    );

    console.log(`[SignalingServer] Tenant ${tenantId} now has ${tenantPeersList.length} peers`);
  }

  private handleLeave(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    console.log(`[SignalingServer] Peer ${peerId} left tenant ${peer.tenantId}`);

    // Remove from tenant room
    const tenantPeerIds = this.tenantPeers.get(peer.tenantId);
    if (tenantPeerIds) {
      tenantPeerIds.delete(peerId);

      // Clean up empty tenant rooms
      if (tenantPeerIds.size === 0) {
        this.tenantPeers.delete(peer.tenantId);
      }
    }

    // Remove peer
    this.peers.delete(peerId);

    // Notify other peers
    this.broadcastToTenant(peer.tenantId, {
      type: 'leave',
      peerId,
      tenantId: peer.tenantId,
      timestamp: Date.now(),
    });
  }

  private handleDisconnect(ws: WebSocket): void {
    // Find peer by WebSocket
    for (const [peerId, peer] of this.peers.entries()) {
      if (peer.ws === ws) {
        this.handleLeave(peerId);
        break;
      }
    }
  }

  private relayToTarget(message: any): void {
    const { targetPeerId } = message;

    const targetPeer = this.peers.get(targetPeerId);
    if (!targetPeer) {
      console.warn(`[SignalingServer] Target peer ${targetPeerId} not found`);
      return;
    }

    // Relay message to target peer
    if (targetPeer.ws.readyState === WebSocket.OPEN) {
      targetPeer.ws.send(JSON.stringify(message));
      console.log(`[SignalingServer] Relayed ${message.type} to ${targetPeerId}`);
    }
  }

  private broadcastToTenant(tenantId: string, message: any, excludePeerId?: string): void {
    const peerIds = this.tenantPeers.get(tenantId);
    if (!peerIds) return;

    for (const peerId of peerIds) {
      if (peerId === excludePeerId) continue;

      const peer = this.peers.get(peerId);
      if (peer && peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(JSON.stringify(message));
      }
    }
  }

  private getPeersInTenant(tenantId: string): PeerInfo[] {
    const peerIds = this.tenantPeers.get(tenantId);
    if (!peerIds) return [];

    const peersList: PeerInfo[] = [];

    for (const peerId of peerIds) {
      const peer = this.peers.get(peerId);
      if (peer) {
        peersList.push({
          peerId: peer.peerId,
          tenantId: peer.tenantId,
          deviceInfo: peer.deviceInfo,
          connectionState: 'disconnected', // Will be updated after WebRTC connection
          connectedAt: peer.connectedAt,
        });
      }
    }

    return peersList;
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [peerId, peer] of this.peers.entries()) {
      // Remove peers that have been disconnected for >5 minutes
      if (peer.ws.readyState !== WebSocket.OPEN) {
        const timeSinceConnect = now - peer.connectedAt;
        if (timeSinceConnect > staleThreshold) {
          console.log(`[SignalingServer] Cleaning up stale peer: ${peerId}`);
          this.handleLeave(peerId);
        }
      }
    }
  }

  public getStats() {
    return {
      totalPeers: this.peers.size,
      totalTenants: this.tenantPeers.size,
      tenants: Array.from(this.tenantPeers.entries()).map(([tenantId, peerIds]) => ({
        tenantId,
        peerCount: peerIds.size,
      })),
    };
  }

  public close(): void {
    console.log('[SignalingServer] Shutting down...');
    this.wss.close();
  }
}

// ============================================================================
// Standalone Server (for development/deployment)
// ============================================================================

if (require.main === module) {
  const port = parseInt(process.env.SIGNALING_PORT || '8080', 10);
  const server = new SignalingServer(port);

  // Log stats every 30 seconds
  setInterval(() => {
    const stats = server.getStats();
    console.log('[SignalingServer] Stats:', stats);
  }, 30000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[SignalingServer] Received SIGINT, shutting down...');
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[SignalingServer] Received SIGTERM, shutting down...');
    server.close();
    process.exit(0);
  });
}

export default SignalingServer;
