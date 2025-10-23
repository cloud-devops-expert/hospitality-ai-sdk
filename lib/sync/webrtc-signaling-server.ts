/**
 * WebRTC Signaling Server
 *
 * Minimal signaling server for WebRTC peer discovery and connection setup.
 * Used in small hotels (no Greengrass) for device-to-device communication.
 *
 * Architecture:
 * - Cloud-hosted (AWS Lambda + API Gateway WebSocket for production)
 * - Peers connect via WebSocket for signaling only
 * - Actual data flows peer-to-peer (no server relay)
 * - Cost: ~$5/month for 1000 concurrent connections
 *
 * Use Cases:
 * - Small hotels: Staff devices sync without local server
 * - Offline collaboration: Multiple tablets share state locally
 * - Real-time updates: Changes propagate instantly to nearby devices
 *
 * Flow:
 * 1. Device A connects to signaling server
 * 2. Device B connects to signaling server
 * 3. Server notifies both of available peers
 * 4. Devices exchange WebRTC offers/answers via server
 * 5. Direct P2P connection established
 * 6. Server no longer needed (can disconnect)
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

export interface SignalingMessage {
  type: 'register' | 'offer' | 'answer' | 'ice-candidate' | 'peers' | 'error';
  from?: string;
  to?: string;
  data?: any;
  peers?: string[];
  error?: string;
}

export interface PeerInfo {
  id: string;
  propertyId?: string;
  deviceType?: 'web' | 'mobile' | 'tablet';
  capabilities?: string[];
  connectedAt: number;
  ws: WebSocket;
}

/**
 * WebRTC Signaling Server
 *
 * Manages peer discovery and WebRTC connection setup.
 */
export class SignalingServer {
  private wss: WebSocketServer;
  private peers: Map<string, PeerInfo> = new Map();
  private propertyRooms: Map<string, Set<string>> = new Map(); // propertyId -> Set<peerId>

  constructor(private port: number = 8080) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', this.handleConnection.bind(this));

    server.listen(port, () => {
      console.log(`WebRTC signaling server listening on port ${port}`);
    });
  }

  private handleConnection(ws: WebSocket) {
    const peerId = uuidv4();
    console.log(`Peer connected: ${peerId}`);

    ws.on('message', (data) => {
      try {
        const message: SignalingMessage = JSON.parse(data.toString());
        this.handleMessage(peerId, ws, message);
      } catch (error) {
        console.error('Invalid message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(peerId);
    });

    ws.on('error', (error) => {
      console.error(`Peer ${peerId} error:`, error);
      this.handleDisconnect(peerId);
    });
  }

  private handleMessage(peerId: string, ws: WebSocket, message: SignalingMessage) {
    switch (message.type) {
      case 'register':
        this.handleRegister(peerId, ws, message);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relayMessage(peerId, message);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private handleRegister(peerId: string, ws: WebSocket, message: SignalingMessage) {
    const { propertyId, deviceType, capabilities } = message.data || {};

    // Register peer
    this.peers.set(peerId, {
      id: peerId,
      propertyId,
      deviceType,
      capabilities,
      connectedAt: Date.now(),
      ws,
    });

    // Add to property room
    if (propertyId) {
      if (!this.propertyRooms.has(propertyId)) {
        this.propertyRooms.set(propertyId, new Set());
      }
      this.propertyRooms.get(propertyId)!.add(peerId);
    }

    console.log(`Peer registered: ${peerId} (property: ${propertyId}, type: ${deviceType})`);

    // Send peer list to new peer
    const peers = this.getPeersInProperty(propertyId);
    this.send(ws, {
      type: 'peers',
      peers: peers.filter(p => p !== peerId), // Exclude self
    });

    // Notify other peers about new peer
    this.broadcastToProperty(propertyId, {
      type: 'peers',
      peers: peers,
    }, peerId);
  }

  private relayMessage(fromPeerId: string, message: SignalingMessage) {
    const { to } = message;

    if (!to) {
      console.warn(`Message from ${fromPeerId} missing 'to' field`);
      return;
    }

    const toPeer = this.peers.get(to);
    if (!toPeer) {
      console.warn(`Peer ${to} not found for relay from ${fromPeerId}`);
      return;
    }

    // Relay message with 'from' field
    this.send(toPeer.ws, {
      ...message,
      from: fromPeerId,
    });

    console.log(`Relayed ${message.type} from ${fromPeerId} to ${to}`);
  }

  private handleDisconnect(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    console.log(`Peer disconnected: ${peerId}`);

    // Remove from property room
    if (peer.propertyId) {
      const room = this.propertyRooms.get(peer.propertyId);
      if (room) {
        room.delete(peerId);
        if (room.size === 0) {
          this.propertyRooms.delete(peer.propertyId);
        } else {
          // Notify remaining peers
          this.broadcastToProperty(peer.propertyId, {
            type: 'peers',
            peers: Array.from(room),
          });
        }
      }
    }

    // Remove peer
    this.peers.delete(peerId);
  }

  private getPeersInProperty(propertyId?: string): string[] {
    if (!propertyId) {
      return Array.from(this.peers.keys());
    }

    const room = this.propertyRooms.get(propertyId);
    return room ? Array.from(room) : [];
  }

  private broadcastToProperty(propertyId: string | undefined, message: SignalingMessage, excludePeerId?: string) {
    const peerIds = this.getPeersInProperty(propertyId);

    peerIds.forEach(peerId => {
      if (peerId === excludePeerId) return;

      const peer = this.peers.get(peerId);
      if (peer) {
        this.send(peer.ws, message);
      }
    });
  }

  private send(ws: WebSocket, message: SignalingMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.send(ws, { type: 'error', error });
  }

  /**
   * Get server statistics
   */
  getStats() {
    const stats = {
      totalPeers: this.peers.size,
      properties: this.propertyRooms.size,
      peersPerProperty: {} as Record<string, number>,
    };

    this.propertyRooms.forEach((room, propertyId) => {
      stats.peersPerProperty[propertyId] = room.size;
    });

    return stats;
  }

  /**
   * Close server
   */
  close() {
    this.wss.close();
  }
}

/**
 * Start signaling server
 *
 * For local development:
 * ```bash
 * ts-node lib/sync/webrtc-signaling-server.ts
 * ```
 *
 * For production (AWS Lambda):
 * - Use API Gateway WebSocket API
 * - Store peer state in DynamoDB
 * - Use Lambda for message routing
 */
export function startSignalingServer(port: number = 8080): SignalingServer {
  return new SignalingServer(port);
}

// CLI entry point
if (require.main === module) {
  const port = parseInt(process.env.PORT || '8080', 10);
  const server = startSignalingServer(port);

  // Log stats every 30 seconds
  setInterval(() => {
    const stats = server.getStats();
    console.log('Server stats:', stats);
  }, 30000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down signaling server...');
    server.close();
    process.exit(0);
  });
}
