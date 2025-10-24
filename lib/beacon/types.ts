/**
 * Beacon Location Detection Types
 *
 * Enables precise indoor positioning using Bluetooth beacons (iBeacon, Eddystone).
 * Combined with WebRTC P2P for local-first guest portal.
 */

// ============================================================================
// Beacon Detection
// ============================================================================

export interface BeaconDetection {
  beaconId: string; // Unique identifier in our database
  uuid: string; // iBeacon UUID or Eddystone namespace
  major: number; // iBeacon major (or derived from Eddystone)
  minor: number; // iBeacon minor (or derived from Eddystone)
  rssi: number; // Signal strength (negative dBm, e.g., -65)
  distance: number; // Estimated distance in meters
  accuracy: 'immediate' | 'near' | 'far' | 'unknown'; // Distance category
  zone: string; // 'restaurant', 'spa', 'lobby', 'room'
  area: string; // 'table-1', 'pool', 'concierge', 'room-205'
  coordinates?: { x: number; y: number; floor?: number }; // Optional floor plan coordinates
  metadata: Record<string, any>; // Custom data (tableNumber, amenity, etc.)
  detectedAt: number; // Timestamp
}

// ============================================================================
// Beacon Registry (Database)
// ============================================================================

export interface BeaconConfig {
  beaconId: string;
  tenantId: string;

  // Hardware identifiers
  uuid: string; // iBeacon UUID or Eddystone namespace
  major: number;
  minor: number;

  // Location
  zone: string; // 'restaurant', 'spa', 'lobby', 'room'
  area: string; // 'table-1', 'pool', 'concierge', 'room-205'
  coordinates?: { x: number; y: number; floor?: number };

  // Configuration
  transmitPower: number; // dBm (typically -4 to +4)
  advertisingInterval: number; // Milliseconds (typically 100-1000)

  // Business logic
  metadata: Record<string, any>; // { tableNumber: 1, capacity: 4, amenity: 'pool' }
  features: string[]; // ['orders', 'access-control', 'concierge']

  // Status
  isActive: boolean;
  batteryLevel?: number; // Percentage
  lastSeen?: string; // ISO timestamp
}

// ============================================================================
// Beacon Scanner Configuration
// ============================================================================

export interface BeaconScannerConfig {
  tenantId: string;

  // Scan parameters
  scanMode: 'passive' | 'active'; // Passive: listen only, Active: request scan
  scanInterval?: number; // Milliseconds between scans (default: 1000)
  signalSmoothingWindow?: number; // Number of readings to average (default: 5)

  // Filtering
  minRssi?: number; // Ignore beacons weaker than this (default: -90)
  maxDistance?: number; // Ignore beacons farther than this (default: 50m)
  zones?: string[]; // Only detect beacons in these zones (default: all)

  // Callbacks
  onBeaconDetected?: (beacon: BeaconDetection) => void;
  onBeaconLost?: (beaconId: string) => void;
  onClosestBeaconChanged?: (beacon: BeaconDetection | null) => void;
  onZoneChanged?: (zone: string | null) => void;

  // Debug
  debug?: boolean;
}

// ============================================================================
// Location Context
// ============================================================================

export interface LocationContext {
  // Current location
  zone: string | null; // 'restaurant', 'spa', 'lobby', 'room'
  area: string | null; // 'table-1', 'pool', 'concierge', 'room-205'
  coordinates?: { x: number; y: number; floor?: number };

  // Detected beacons
  closestBeacon: BeaconDetection | null;
  nearbyBeacons: BeaconDetection[]; // Sorted by distance

  // Confidence
  accuracy: 'high' | 'medium' | 'low' | 'unknown';
  lastUpdated: number; // Timestamp

  // Network context (for guest portal)
  isOnPropertyWiFi: boolean;
  wifiSsid?: string;
}

// ============================================================================
// Location-Aware Features
// ============================================================================

export type LocationFeatureType =
  | 'restaurant-ordering' // Order food at table
  | 'spa-access' // Request pool/gym access
  | 'room-service' // In-room orders
  | 'concierge' // Ask for recommendations
  | 'wayfinding' // Navigate to location
  | 'notifications'; // Location-based messages

export interface LocationFeature {
  type: LocationFeatureType;
  enabled: boolean;
  requiredZones: string[]; // Feature only available in these zones
  minAccuracy: 'high' | 'medium' | 'low'; // Minimum accuracy required
  metadata?: Record<string, any>;
}

// ============================================================================
// Beacon Protocol Support
// ============================================================================

export type BeaconProtocol = 'ibeacon' | 'eddystone' | 'altbeacon';

export interface IBeaconData {
  uuid: string; // 128-bit UUID
  major: number; // 16-bit unsigned integer
  minor: number; // 16-bit unsigned integer
  txPower: number; // Calibrated transmission power at 1m
}

export interface EddystoneData {
  frameType: 'uid' | 'url' | 'tlm' | 'eid';
  namespace?: string; // Eddystone-UID namespace (10 bytes)
  instance?: string; // Eddystone-UID instance (6 bytes)
  url?: string; // Eddystone-URL
  txPower?: number; // Calibrated transmission power at 0m
}

// ============================================================================
// Kalman Filter (Signal Smoothing)
// ============================================================================

export interface KalmanFilterState {
  estimate: number; // Current estimate
  errorCovariance: number; // Estimate uncertainty
  processNoise: number; // How much we expect the signal to change
  measurementNoise: number; // How noisy the RSSI measurements are
}

// ============================================================================
// Trilateration (Multi-Beacon Positioning)
// ============================================================================

export interface TrilaterationInput {
  beacons: {
    beaconId: string;
    x: number;
    y: number;
    distance: number;
  }[];
}

export interface TrilaterationOutput {
  x: number;
  y: number;
  accuracy: number; // Estimated error in meters
}
