/**
 * WebRTC Peer Connection Manager
 *
 * Manages WebRTC peer-to-peer connections for device-to-device communication.
 * Uses data channels for efficient, low-latency data transfer.
 *
 * Use Cases (Small Hotels):
 * - Sync data between staff devices without server
 * - Real-time state updates (inventory, room status)
 * - Offline collaboration (multiple tablets working together)
 * - Local broadcast (manager sends update to all staff)
 *
 * Architecture:
 * - Signaling via WebSocket (cloud-hosted)
 * - Data transfer via WebRTC data channels (P2P)
 * - STUN servers for NAT traversal (free Google STUN)
 * - No TURN needed (same WiFi network)
 *
 * Performance:
 * - Latency: 10-50ms (local network)
 * - Bandwidth: No cloud limits (local LAN speed)
 * - Cost: $0 for data transfer (P2P), ~$5/month for signaling
 */

import { EventEmitter } from 'events';

export interface PeerConnectionConfig {
  signalingUrl: string; // WebSocket URL for signaling server
  propertyId: string; // Property identifier (room for peer grouping)
  deviceId: string; // Unique device identifier
  deviceType?: 'web' | 'mobile' | 'tablet';
  iceServers?: RTCIceServer[]; // STUN/TURN servers
}

export interface DataChannelMessage {
  type: string;
  data: any;
  timestamp: number;
  from: string;
}

/**
 * WebRTC Peer Connection Manager
 *
 * Manages connections to multiple peers via WebRTC data channels.
 */
export class WebRTCPeer extends EventEmitter {
  private ws: WebSocket | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private config: PeerConnectionConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: PeerConnectionConfig) {
    super();
    this.config = {
      ...config,
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }, // Free Google STUN
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }

  /**
   * Connect to signaling server and start peer discovery
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.signalingUrl);

        this.ws.onopen = () => {
          console.log('Connected to signaling server');

          // Register with signaling server
          this.send({
            type: 'register',
            data: {
              propertyId: this.config.propertyId,
              deviceType: this.config.deviceType,
              capabilities: ['data-channel', 'rxdb-sync'],
            },
          });

          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleSignalingMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('Signaling error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from signaling server');
          this.emit('disconnected');
          this.scheduleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from all peers and signaling server
   */
  disconnect(): void {
    // Close all peer connections
    this.peers.forEach((pc, peerId) => {
      pc.close();
      this.peers.delete(peerId);
    });

    // Close all data channels
    this.dataChannels.forEach((dc, peerId) => {
      dc.close();
      this.dataChannels.delete(peerId);
    });

    // Close signaling connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.emit('disconnected');
  }

  /**
   * Send message to specific peer
   */
  sendToPeer(peerId: string, message: DataChannelMessage): boolean {
    const channel = this.dataChannels.get(peerId);
    if (!channel || channel.readyState !== 'open') {
      console.warn(`Data channel to ${peerId} not open`);
      return false;
    }

    try {
      channel.send(JSON.stringify({
        ...message,
        from: this.config.deviceId,
        timestamp: Date.now(),
      }));
      return true;
    } catch (error) {
      console.error(`Failed to send to ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connected peers
   */
  broadcast(message: DataChannelMessage): number {
    let sentCount = 0;
    this.dataChannels.forEach((channel, peerId) => {
      if (this.sendToPeer(peerId, message)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  /**
   * Get list of connected peer IDs
   */
  getConnectedPeers(): string[] {
    return Array.from(this.dataChannels.keys()).filter(peerId => {
      const channel = this.dataChannels.get(peerId);
      return channel && channel.readyState === 'open';
    });
  }

  /**
   * Check if connected to at least one peer
   */
  isConnectedToPeers(): boolean {
    return this.getConnectedPeers().length > 0;
  }

  // Private methods

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'peers':
        // List of available peers
        await this.handlePeerList(message.peers || []);
        break;

      case 'offer':
        // Received WebRTC offer from peer
        await this.handleOffer(message.from, message.data);
        break;

      case 'answer':
        // Received WebRTC answer from peer
        await this.handleAnswer(message.from, message.data);
        break;

      case 'ice-candidate':
        // Received ICE candidate from peer
        await this.handleIceCandidate(message.from, message.data);
        break;

      case 'error':
        console.error('Signaling error:', message.error);
        this.emit('error', new Error(message.error));
        break;

      default:
        console.warn('Unknown signaling message type:', message.type);
    }
  }

  private async handlePeerList(peerIds: string[]): Promise<void> {
    console.log('Available peers:', peerIds);

    // Connect to new peers (we initiate the connection)
    for (const peerId of peerIds) {
      if (!this.peers.has(peerId)) {
        await this.connectToPeer(peerId);
      }
    }

    this.emit('peers-updated', peerIds);
  }

  private async connectToPeer(peerId: string): Promise<void> {
    console.log(`Connecting to peer: ${peerId}`);

    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.peers.set(peerId, pc);

    // Create data channel (we are the initiator)
    const channel = pc.createDataChannel('hospitality-ai', {
      ordered: true, // Guarantee message order
      maxRetransmits: 3, // Retry failed messages
    });

    this.setupDataChannel(peerId, channel);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'ice-candidate',
          to: peerId,
          data: event.candidate,
        });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state: ${pc.connectionState}`);
      this.emit('peer-state-changed', { peerId, state: pc.connectionState });

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peers.delete(peerId);
        this.dataChannels.delete(peerId);
      }
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer via signaling
    this.send({
      type: 'offer',
      to: peerId,
      data: offer,
    });
  }

  private async handleOffer(fromPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    console.log(`Received offer from: ${fromPeerId}`);

    // Create peer connection (we are the receiver)
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.peers.set(fromPeerId, pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'ice-candidate',
          to: fromPeerId,
          data: event.candidate,
        });
      }
    };

    // Handle data channel from remote
    pc.ondatachannel = (event) => {
      console.log(`Data channel received from: ${fromPeerId}`);
      this.setupDataChannel(fromPeerId, event.channel);
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`Peer ${fromPeerId} connection state: ${pc.connectionState}`);
      this.emit('peer-state-changed', { peerId: fromPeerId, state: pc.connectionState });

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peers.delete(fromPeerId);
        this.dataChannels.delete(fromPeerId);
      }
    };

    // Set remote description
    await pc.setRemoteDescription(offer);

    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer via signaling
    this.send({
      type: 'answer',
      to: fromPeerId,
      data: answer,
    });
  }

  private async handleAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    console.log(`Received answer from: ${fromPeerId}`);

    const pc = this.peers.get(fromPeerId);
    if (!pc) {
      console.warn(`No peer connection for ${fromPeerId}`);
      return;
    }

    await pc.setRemoteDescription(answer);
  }

  private async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(fromPeerId);
    if (!pc) {
      console.warn(`No peer connection for ${fromPeerId}`);
      return;
    }

    await pc.addIceCandidate(candidate);
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    this.dataChannels.set(peerId, channel);

    channel.onopen = () => {
      console.log(`Data channel opened with: ${peerId}`);
      this.emit('peer-connected', peerId);
    };

    channel.onclose = () => {
      console.log(`Data channel closed with: ${peerId}`);
      this.dataChannels.delete(peerId);
      this.emit('peer-disconnected', peerId);
    };

    channel.onerror = (error) => {
      console.error(`Data channel error with ${peerId}:`, error);
      this.emit('peer-error', { peerId, error });
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('message', { peerId, message });
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    console.log('Scheduling reconnect in 5 seconds...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('Attempting to reconnect...');
      this.connect().catch(error => {
        console.error('Reconnect failed:', error);
      });
    }, 5000);
  }
}

/**
 * Create WebRTC peer connection
 *
 * @example
 * ```typescript
 * const peer = createWebRTCPeer({
 *   signalingUrl: 'wss://signal.hospitality-ai.com',
 *   propertyId: 'property-123',
 *   deviceId: 'tablet-front-desk',
 *   deviceType: 'tablet',
 * });
 *
 * // Connect to peers
 * await peer.connect();
 *
 * // Listen for messages
 * peer.on('message', ({ peerId, message }) => {
 *   console.log(`Message from ${peerId}:`, message);
 * });
 *
 * // Send message to specific peer
 * peer.sendToPeer('tablet-2', {
 *   type: 'room-update',
 *   data: { roomId: '101', status: 'occupied' },
 * });
 *
 * // Broadcast to all peers
 * peer.broadcast({
 *   type: 'inventory-update',
 *   data: { item: 'towels', quantity: 50 },
 * });
 * ```
 */
export function createWebRTCPeer(config: PeerConnectionConfig): WebRTCPeer {
  return new WebRTCPeer(config);
}
