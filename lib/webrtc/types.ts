/**
 * WebRTC P2P Communication Types
 *
 * Enables local-first communication between staff devices using WebRTC Data Channels.
 * 95% of data flows peer-to-peer on local network, 5% via cloud signaling.
 */

// ============================================================================
// Signaling Messages (Cloud → Peers)
// ============================================================================

export type SignalingMessageType =
  | 'join'           // Peer joins tenant room
  | 'leave'          // Peer leaves tenant room
  | 'offer'          // WebRTC offer (SDP)
  | 'answer'         // WebRTC answer (SDP)
  | 'ice-candidate'  // ICE candidate
  | 'peers-list';    // List of available peers in tenant

export interface BaseSignalingMessage {
  type: SignalingMessageType;
  tenantId: string;
  peerId: string;
  timestamp: number;
}

export interface JoinMessage extends BaseSignalingMessage {
  type: 'join';
  deviceInfo: {
    type: 'staff' | 'pos' | 'printer' | 'kitchen-display' | 'guest';
    name: string;
    capabilities: string[]; // ['orders', 'printing', 'notifications']
  };
}

export interface LeaveMessage extends BaseSignalingMessage {
  type: 'leave';
}

export interface OfferMessage extends BaseSignalingMessage {
  type: 'offer';
  targetPeerId: string;
  sdp: string;
}

export interface AnswerMessage extends BaseSignalingMessage {
  type: 'answer';
  targetPeerId: string;
  sdp: string;
}

export interface IceCandidateMessage extends BaseSignalingMessage {
  type: 'ice-candidate';
  targetPeerId: string;
  candidate: RTCIceCandidateInit;
}

export interface PeersListMessage extends BaseSignalingMessage {
  type: 'peers-list';
  peers: PeerInfo[];
}

export type SignalingMessage =
  | JoinMessage
  | LeaveMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | PeersListMessage;

// ============================================================================
// P2P Data Messages (Local Network, Device → Device)
// ============================================================================

export type P2PMessageType =
  | 'order'          // Restaurant order
  | 'print'          // Print job
  | 'notification'   // Staff notification
  | 'room-assignment'// Housekeeping assignment
  | 'iot-command'    // IoT device command (thermostat, lock)
  | 'sync-request'   // Request data sync
  | 'sync-response'  // Response with data
  | 'ping'           // Keepalive
  | 'pong';          // Keepalive response

export interface BaseP2PMessage {
  type: P2PMessageType;
  messageId: string;
  tenantId: string;
  senderId: string;
  timestamp: number;
}

// Restaurant order (Guest → Staff → Kitchen Display)
export interface OrderMessage extends BaseP2PMessage {
  type: 'order';
  order: {
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
  };
}

// Print job (POS → Printer)
export interface PrintMessage extends BaseP2PMessage {
  type: 'print';
  printJob: {
    jobId: string;
    printerType: 'receipt' | 'kitchen' | 'label';
    format: 'esc-pos' | 'star' | 'pdf';
    content: string; // ESC/POS commands or base64 PDF
    copies?: number;
  };
}

// Staff notification
export interface NotificationMessage extends BaseP2PMessage {
  type: 'notification';
  notification: {
    notificationId: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    actionUrl?: string;
  };
}

// Housekeeping room assignment
export interface RoomAssignmentMessage extends BaseP2PMessage {
  type: 'room-assignment';
  assignment: {
    assignmentId: string;
    roomNumber: string;
    taskType: 'clean' | 'inspect' | 'maintenance';
    assignedTo: string; // Staff member ID
    dueTime: string; // ISO timestamp
    notes?: string;
  };
}

// IoT device command
export interface IoTCommandMessage extends BaseP2PMessage {
  type: 'iot-command';
  command: {
    commandId: string;
    deviceId: string;
    deviceType: 'thermostat' | 'lock' | 'light' | 'sensor';
    action: string; // 'set-temperature', 'unlock', 'turn-on', 'read-status'
    parameters: Record<string, unknown>;
  };
}

// Data sync (for offline-first)
export interface SyncRequestMessage extends BaseP2PMessage {
  type: 'sync-request';
  request: {
    requestId: string;
    collection: string; // 'orders', 'reservations', 'guests'
    lastSyncTimestamp?: string;
  };
}

export interface SyncResponseMessage extends BaseP2PMessage {
  type: 'sync-response';
  response: {
    requestId: string;
    collection: string;
    data: unknown[];
    hasMore: boolean;
  };
}

export interface PingMessage extends BaseP2PMessage {
  type: 'ping';
}

export interface PongMessage extends BaseP2PMessage {
  type: 'pong';
}

export type P2PMessage =
  | OrderMessage
  | PrintMessage
  | NotificationMessage
  | RoomAssignmentMessage
  | IoTCommandMessage
  | SyncRequestMessage
  | SyncResponseMessage
  | PingMessage
  | PongMessage;

// ============================================================================
// Peer Info
// ============================================================================

export interface PeerInfo {
  peerId: string;
  tenantId: string;
  deviceInfo: {
    type: 'staff' | 'pos' | 'printer' | 'kitchen-display' | 'guest';
    name: string;
    capabilities: string[];
  };
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  networkTopology?: 'local-p2p' | 'cloud-relay' | 'unknown';
  latency?: number; // milliseconds
  connectedAt: number; // timestamp
}

// ============================================================================
// Connection Config
// ============================================================================

export interface P2PConnectionConfig {
  // Signaling servers (try in order, fallback to next if unavailable)
  signalingServers: string[]; // ['ws://signaling.local:8080', 'wss://signaling.yourdomain.com']

  // Tenant context
  tenantId: string;

  // Device info
  deviceInfo: {
    type: 'staff' | 'pos' | 'printer' | 'kitchen-display' | 'guest';
    name: string;
    capabilities: string[]; // ['orders', 'printing', 'notifications']
  };

  // WebRTC ICE servers
  iceServers?: RTCIceServer[]; // Default: Google STUN

  // Preferences
  preferLocal?: boolean; // Prefer local P2P over cloud relay (default: true)
  autoReconnect?: boolean; // Auto-reconnect on disconnect (default: true)
  reconnectInterval?: number; // ms (default: 5000)

  // Keepalive
  keepaliveInterval?: number; // ms (default: 30000)

  // Debug
  debug?: boolean;
}

// ============================================================================
// Network Topology
// ============================================================================

export interface NetworkTopology {
  topology: 'local-p2p' | 'cloud-relay' | 'unknown';
  latency: number; // milliseconds
  estimatedCost: number; // USD per GB
  localCandidateType?: string; // 'host', 'srflx', 'relay'
  remoteCandidateType?: string;
  bytesReceived: number;
  bytesSent: number;
}

// ============================================================================
// Connection Events
// ============================================================================

export interface P2PConnectionEvents {
  // Connection lifecycle
  'connection-state-changed': (state: RTCPeerConnectionState) => void;
  'connected': (peer: PeerInfo) => void;
  'disconnected': (peerId: string) => void;
  'reconnecting': () => void;

  // Signaling events
  'signaling-connected': (serverUrl: string) => void;
  'signaling-disconnected': () => void;
  'signaling-error': (error: Error) => void;

  // Peer discovery
  'peers-discovered': (peers: PeerInfo[]) => void;
  'peer-joined': (peer: PeerInfo) => void;
  'peer-left': (peerId: string) => void;

  // Messages
  'message': (message: P2PMessage, fromPeerId: string) => void;
  'order': (order: OrderMessage, fromPeerId: string) => void;
  'print': (printJob: PrintMessage, fromPeerId: string) => void;
  'notification': (notification: NotificationMessage, fromPeerId: string) => void;
  'room-assignment': (assignment: RoomAssignmentMessage, fromPeerId: string) => void;
  'iot-command': (command: IoTCommandMessage, fromPeerId: string) => void;

  // Network topology
  'topology-detected': (topology: NetworkTopology) => void;

  // Errors
  'error': (error: Error) => void;
}
