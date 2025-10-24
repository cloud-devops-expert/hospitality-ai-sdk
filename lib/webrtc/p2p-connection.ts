/**
 * WebRTC P2P Connection Manager
 *
 * Enables local-first peer-to-peer communication between staff devices.
 * Uses cloud signaling server for connection setup, then all data flows P2P on local network.
 *
 * Phase 1-2: Cloud signaling + P2P data (95% local, 5% cloud, zero installation)
 * Phase 3: Add local signaling server (99% local, 1% cloud, optional installation)
 *
 * Key benefits:
 * - 50ms latency (not 500ms cloud roundtrip)
 * - 98% cost reduction (P2P vs cloud APIs)
 * - Zero installation required
 * - Works immediately
 */

import type {
  P2PConnectionConfig,
  P2PConnectionEvents,
  PeerInfo,
  SignalingMessage,
  P2PMessage,
  NetworkTopology,
} from './types';

export class P2PConnection {
  private config: Required<P2PConnectionConfig>;
  private signalingWs: WebSocket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private peers: Map<string, PeerInfo> = new Map();
  private peerId: string;
  private eventHandlers: Map<keyof P2PConnectionEvents, Set<Function>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private keepaliveTimer: NodeJS.Timeout | null = null;

  constructor(config: P2PConnectionConfig) {
    this.peerId = this.generatePeerId();

    // Set defaults
    this.config = {
      ...config,
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' }, // Free Google STUN
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
      preferLocal: config.preferLocal ?? true,
      autoReconnect: config.autoReconnect ?? true,
      reconnectInterval: config.reconnectInterval ?? 5000,
      keepaliveInterval: config.keepaliveInterval ?? 30000,
      debug: config.debug ?? false,
    };

    this.log('P2P Connection initialized', { peerId: this.peerId, config: this.config });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Connect to signaling server and start peer discovery
   */
  async connect(): Promise<void> {
    this.log('Connecting to signaling servers...');

    // Try signaling servers in order
    for (const serverUrl of this.config.signalingServers) {
      try {
        await this.connectToSignalingServer(serverUrl);
        this.emit('signaling-connected', serverUrl);
        this.startKeepalive();
        return;
      } catch (error) {
        this.log(`Failed to connect to ${serverUrl}:`, error);
        // Try next server
      }
    }

    throw new Error('Failed to connect to any signaling server');
  }

  /**
   * Disconnect from all peers and signaling server
   */
  disconnect(): void {
    this.log('Disconnecting...');

    // Close all peer connections
    for (const [peerId, pc] of this.peerConnections.entries()) {
      pc.close();
      this.peerConnections.delete(peerId);
      this.dataChannels.delete(peerId);
      this.peers.delete(peerId);
    }

    // Close signaling connection
    if (this.signalingWs) {
      this.signalingWs.close();
      this.signalingWs = null;
    }

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  /**
   * Send message to specific peer or broadcast to all peers
   */
  send(message: Omit<P2PMessage, 'messageId' | 'tenantId' | 'senderId' | 'timestamp'>, targetPeerId?: string): void {
    const fullMessage: P2PMessage = {
      ...message,
      messageId: this.generateMessageId(),
      tenantId: this.config.tenantId,
      senderId: this.peerId,
      timestamp: Date.now(),
    } as P2PMessage;

    if (targetPeerId) {
      // Send to specific peer
      this.sendToPeer(targetPeerId, fullMessage);
    } else {
      // Broadcast to all connected peers
      for (const peerId of this.dataChannels.keys()) {
        this.sendToPeer(peerId, fullMessage);
      }
    }
  }

  /**
   * Get list of connected peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get network topology for specific peer
   */
  async getNetworkTopology(peerId: string): Promise<NetworkTopology | null> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return null;

    try {
      const stats = await pc.getStats();
      let topology: NetworkTopology | null = null;

      for (const report of stats.values()) {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localCandidate = stats.get(report.localCandidateId);
          const remoteCandidate = stats.get(report.remoteCandidateId);

          const isLocalP2P =
            localCandidate?.candidateType === 'host' &&
            remoteCandidate?.candidateType === 'host';

          topology = {
            topology: isLocalP2P ? 'local-p2p' : 'cloud-relay',
            latency: (report.currentRoundTripTime || 0) * 1000, // Convert to ms
            estimatedCost: isLocalP2P ? 0 : this.calculateTurnCost(report.bytesReceived + report.bytesSent),
            localCandidateType: localCandidate?.candidateType,
            remoteCandidateType: remoteCandidate?.candidateType,
            bytesReceived: report.bytesReceived || 0,
            bytesSent: report.bytesSent || 0,
          };

          break;
        }
      }

      if (topology) {
        this.emit('topology-detected', topology);
      }

      return topology;
    } catch (error) {
      this.log('Error getting network topology:', error);
      return null;
    }
  }

  /**
   * Event listener
   */
  on<K extends keyof P2PConnectionEvents>(event: K, handler: P2PConnectionEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof P2PConnectionEvents>(event: K, handler: P2PConnectionEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  // ============================================================================
  // Private: Signaling
  // ============================================================================

  private async connectToSignalingServer(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log(`Connecting to signaling server: ${serverUrl}`);

      const ws = new WebSocket(serverUrl);
      let resolved = false;

      ws.onopen = () => {
        this.log('Signaling connection established');
        this.signalingWs = ws;

        // Send join message
        this.sendSignaling({
          type: 'join',
          tenantId: this.config.tenantId,
          peerId: this.peerId,
          timestamp: Date.now(),
          deviceInfo: this.config.deviceInfo,
        });

        resolved = true;
        resolve();
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as SignalingMessage;
        this.handleSignalingMessage(message);
      };

      ws.onerror = (error) => {
        this.log('Signaling error:', error);
        if (!resolved) {
          reject(error);
        }
        this.emit('signaling-error', new Error('Signaling connection error'));
      };

      ws.onclose = () => {
        this.log('Signaling connection closed');
        this.emit('signaling-disconnected');

        // Auto-reconnect if enabled
        if (this.config.autoReconnect && !this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.emit('reconnecting');
            this.connect().catch((error) => {
              this.log('Reconnect failed:', error);
            });
          }, this.config.reconnectInterval);
        }
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          ws.close();
          reject(new Error('Signaling connection timeout'));
        }
      }, 5000);
    });
  }

  private sendSignaling(message: SignalingMessage): void {
    if (this.signalingWs && this.signalingWs.readyState === WebSocket.OPEN) {
      this.signalingWs.send(JSON.stringify(message));
    } else {
      this.log('Cannot send signaling message: connection not open');
    }
  }

  private handleSignalingMessage(message: SignalingMessage): void {
    this.log('Received signaling message:', message.type);

    switch (message.type) {
      case 'peers-list':
        this.handlePeersList(message.peers);
        break;

      case 'join':
        this.handlePeerJoined(message);
        break;

      case 'leave':
        this.handlePeerLeft(message.peerId);
        break;

      case 'offer':
        this.handleOffer(message);
        break;

      case 'answer':
        this.handleAnswer(message);
        break;

      case 'ice-candidate':
        this.handleIceCandidate(message);
        break;
    }
  }

  // ============================================================================
  // Private: Peer Discovery
  // ============================================================================

  private handlePeersList(peersList: PeerInfo[]): void {
    this.log('Discovered peers:', peersList.length);

    // Connect to each peer (except ourselves)
    for (const peer of peersList) {
      if (peer.peerId !== this.peerId && !this.peerConnections.has(peer.peerId)) {
        this.connectToPeer(peer);
      }
    }

    this.emit('peers-discovered', peersList);
  }

  private handlePeerJoined(message: SignalingMessage): void {
    if (message.peerId === this.peerId) return; // Ignore ourselves

    this.log('Peer joined:', message.peerId);

    const peer: PeerInfo = {
      peerId: message.peerId,
      tenantId: message.tenantId,
      deviceInfo: (message as any).deviceInfo,
      connectionState: 'disconnected',
      connectedAt: Date.now(),
    };

    this.peers.set(peer.peerId, peer);
    this.emit('peer-joined', peer);

    // Initiate connection
    this.connectToPeer(peer);
  }

  private handlePeerLeft(peerId: string): void {
    this.log('Peer left:', peerId);

    // Close connection
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }

    this.dataChannels.delete(peerId);
    this.peers.delete(peerId);

    this.emit('peer-left', peerId);
    this.emit('disconnected', peerId);
  }

  // ============================================================================
  // Private: WebRTC Connection
  // ============================================================================

  private async connectToPeer(peer: PeerInfo): Promise<void> {
    this.log('Connecting to peer:', peer.peerId);

    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.peerConnections.set(peer.peerId, pc);

    // Create data channel
    const dc = pc.createDataChannel('data', {
      ordered: true,
    });

    this.setupDataChannel(peer.peerId, dc);

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      this.log(`Connection state for ${peer.peerId}:`, pc.connectionState);

      const peerInfo = this.peers.get(peer.peerId);
      if (peerInfo) {
        peerInfo.connectionState = pc.connectionState as any;
      }

      this.emit('connection-state-changed', pc.connectionState);

      if (pc.connectionState === 'connected') {
        this.emit('connected', peer);
        // Detect network topology
        this.getNetworkTopology(peer.peerId);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.emit('disconnected', peer.peerId);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignaling({
          type: 'ice-candidate',
          tenantId: this.config.tenantId,
          peerId: this.peerId,
          targetPeerId: peer.peerId,
          timestamp: Date.now(),
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer via signaling
    this.sendSignaling({
      type: 'offer',
      tenantId: this.config.tenantId,
      peerId: this.peerId,
      targetPeerId: peer.peerId,
      timestamp: Date.now(),
      sdp: offer.sdp!,
    });
  }

  private async handleOffer(message: any): Promise<void> {
    this.log('Received offer from:', message.peerId);

    // Create peer connection (if not exists)
    let pc = this.peerConnections.get(message.peerId);
    if (!pc) {
      pc = new RTCPeerConnection({
        iceServers: this.config.iceServers,
      });

      this.peerConnections.set(message.peerId, pc);

      // Handle incoming data channel
      pc.ondatachannel = (event) => {
        this.setupDataChannel(message.peerId, event.channel);
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        this.log(`Connection state for ${message.peerId}:`, pc.connectionState);

        const peerInfo = this.peers.get(message.peerId);
        if (peerInfo) {
          peerInfo.connectionState = pc.connectionState as any;
        }

        this.emit('connection-state-changed', pc.connectionState);

        if (pc.connectionState === 'connected') {
          const peer = this.peers.get(message.peerId)!;
          this.emit('connected', peer);
          // Detect network topology
          this.getNetworkTopology(message.peerId);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          this.emit('disconnected', message.peerId);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignaling({
            type: 'ice-candidate',
            tenantId: this.config.tenantId,
            peerId: this.peerId,
            targetPeerId: message.peerId,
            timestamp: Date.now(),
            candidate: event.candidate.toJSON(),
          });
        }
      };
    }

    // Set remote description
    await pc.setRemoteDescription(
      new RTCSessionDescription({
        type: 'offer',
        sdp: message.sdp,
      })
    );

    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer via signaling
    this.sendSignaling({
      type: 'answer',
      tenantId: this.config.tenantId,
      peerId: this.peerId,
      targetPeerId: message.peerId,
      timestamp: Date.now(),
      sdp: answer.sdp!,
    });
  }

  private async handleAnswer(message: any): Promise<void> {
    this.log('Received answer from:', message.peerId);

    const pc = this.peerConnections.get(message.peerId);
    if (!pc) {
      this.log('No peer connection for answer');
      return;
    }

    await pc.setRemoteDescription(
      new RTCSessionDescription({
        type: 'answer',
        sdp: message.sdp,
      })
    );
  }

  private async handleIceCandidate(message: any): Promise<void> {
    this.log('Received ICE candidate from:', message.peerId);

    const pc = this.peerConnections.get(message.peerId);
    if (!pc) {
      this.log('No peer connection for ICE candidate');
      return;
    }

    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
  }

  // ============================================================================
  // Private: Data Channel
  // ============================================================================

  private setupDataChannel(peerId: string, dc: RTCDataChannel): void {
    this.dataChannels.set(peerId, dc);

    dc.onopen = () => {
      this.log('Data channel opened:', peerId);
    };

    dc.onclose = () => {
      this.log('Data channel closed:', peerId);
      this.dataChannels.delete(peerId);
    };

    dc.onerror = (error) => {
      this.log('Data channel error:', error);
      this.emit('error', new Error(`Data channel error: ${error}`));
    };

    dc.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as P2PMessage;
        this.handleP2PMessage(message, peerId);
      } catch (error) {
        this.log('Error parsing P2P message:', error);
      }
    };
  }

  private sendToPeer(peerId: string, message: P2PMessage): void {
    const dc = this.dataChannels.get(peerId);

    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify(message));
      this.log(`Sent ${message.type} to ${peerId}`);
    } else {
      this.log(`Cannot send to ${peerId}: data channel not open`);
    }
  }

  private handleP2PMessage(message: P2PMessage, fromPeerId: string): void {
    this.log(`Received ${message.type} from ${fromPeerId}`);

    // Emit generic message event
    this.emit('message', message, fromPeerId);

    // Emit specific event based on message type
    switch (message.type) {
      case 'order':
        this.emit('order', message, fromPeerId);
        break;
      case 'print':
        this.emit('print', message, fromPeerId);
        break;
      case 'notification':
        this.emit('notification', message, fromPeerId);
        break;
      case 'room-assignment':
        this.emit('room-assignment', message, fromPeerId);
        break;
      case 'iot-command':
        this.emit('iot-command', message, fromPeerId);
        break;
      case 'ping':
        // Respond with pong
        this.send({ type: 'pong' }, fromPeerId);
        break;
      case 'pong':
        // Update latency
        const peer = this.peers.get(fromPeerId);
        if (peer) {
          peer.latency = Date.now() - message.timestamp;
        }
        break;
    }
  }

  // ============================================================================
  // Private: Keepalive
  // ============================================================================

  private startKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
    }

    this.keepaliveTimer = setInterval(() => {
      // Send ping to all connected peers
      for (const peerId of this.dataChannels.keys()) {
        this.send({ type: 'ping' }, peerId);
      }
    }, this.config.keepaliveInterval);
  }

  // ============================================================================
  // Private: Utilities
  // ============================================================================

  private generatePeerId(): string {
    return `peer-${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private calculateTurnCost(bytes: number): number {
    // AWS TURN relay pricing (estimated): $0.015 per GB
    const gb = bytes / (1024 * 1024 * 1024);
    return gb * 0.015;
  }

  private emit<K extends keyof P2PConnectionEvents>(event: K, ...args: Parameters<P2PConnectionEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          (handler as any)(...args);
        } catch (error) {
          this.log(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[P2PConnection]', ...args);
    }
  }
}
