/**
 * Web Bluetooth API Beacon Scanner
 *
 * Scans for Bluetooth beacons (Eddystone) using Web Bluetooth API.
 * Works on Android Chrome, Chrome OS, Edge (not iOS Safari due to Apple restrictions).
 *
 * For iOS: Use React Native + `react-native-beacons-manager` library.
 * For fallback: Use WiFi-based location detection.
 *
 * Key Features:
 * - Real-time beacon detection
 * - Signal strength smoothing (Kalman filter)
 * - Distance estimation
 * - Zone detection
 * - Works offline (beacons are local)
 */

import type {
  BeaconDetection,
  BeaconScannerConfig,
  BeaconConfig,
  LocationContext,
  KalmanFilterState,
} from './types';

export class WebBluetoothBeaconScanner {
  private config: Required<BeaconScannerConfig>;
  private scanning = false;
  private detectedBeacons = new Map<string, BeaconDetection>();
  private beaconRegistry = new Map<string, BeaconConfig>(); // Local cache
  private kalmanFilters = new Map<string, KalmanFilterState>();
  private lastClosestBeacon: BeaconDetection | null = null;
  private lastZone: string | null = null;
  private scanController: AbortController | null = null;

  constructor(config: BeaconScannerConfig) {
    this.config = {
      ...config,
      scanMode: config.scanMode || 'active',
      scanInterval: config.scanInterval || 1000,
      signalSmoothingWindow: config.signalSmoothingWindow || 5,
      minRssi: config.minRssi ?? -90,
      maxDistance: config.maxDistance ?? 50,
      zones: config.zones || undefined,
      onBeaconDetected: config.onBeaconDetected || (() => {}),
      onBeaconLost: config.onBeaconLost || (() => {}),
      onClosestBeaconChanged: config.onClosestBeaconChanged || (() => {}),
      onZoneChanged: config.onZoneChanged || (() => {}),
      debug: config.debug || false,
    };
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Check if Web Bluetooth API is supported
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Request Bluetooth permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!WebBluetoothBeaconScanner.isSupported()) {
      throw new Error('Web Bluetooth API not supported in this browser');
    }

    try {
      // Request Bluetooth access (user must approve)
      await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      });

      return true;
    } catch (error) {
      this.log('Bluetooth permission denied:', error);
      return false;
    }
  }

  /**
   * Start scanning for beacons
   */
  async startScanning(): Promise<void> {
    if (this.scanning) {
      this.log('Already scanning');
      return;
    }

    this.log('Starting beacon scan...');

    // Load beacon registry from database
    await this.loadBeaconRegistry();

    // Start Bluetooth LE scan
    this.scanController = new AbortController();

    try {
      // @ts-ignore - requestLEScan is experimental
      const scan = await navigator.bluetooth.requestLEScan({
        filters: [
          { services: ['0000feaa-0000-1000-8000-00805f9b34fb'] }, // Eddystone UUID
        ],
        keepRepeatedDevices: true,
      });

      this.scanning = true;

      // Listen for advertisement packets
      navigator.bluetooth.addEventListener(
        'advertisementreceived',
        this.handleAdvertisement.bind(this),
        { signal: this.scanController.signal }
      );

      // Periodic cleanup of stale beacons
      this.startStaleBeaconCleanup();

      this.log('Beacon scan started');
    } catch (error) {
      this.log('Failed to start scan:', error);
      throw error;
    }
  }

  /**
   * Stop scanning for beacons
   */
  stopScanning(): void {
    if (!this.scanning) return;

    this.log('Stopping beacon scan...');

    if (this.scanController) {
      this.scanController.abort();
      this.scanController = null;
    }

    this.scanning = false;
    this.detectedBeacons.clear();
    this.kalmanFilters.clear();

    this.log('Beacon scan stopped');
  }

  /**
   * Get current location context
   */
  getLocationContext(): LocationContext {
    const closestBeacon = this.getClosestBeacon();
    const nearbyBeacons = this.getNearbyBeacons();

    return {
      zone: closestBeacon?.zone || null,
      area: closestBeacon?.area || null,
      coordinates: closestBeacon?.coordinates,
      closestBeacon,
      nearbyBeacons,
      accuracy: this.calculateLocationAccuracy(closestBeacon, nearbyBeacons),
      lastUpdated: Date.now(),
      isOnPropertyWiFi: this.isOnPropertyWiFi(),
    };
  }

  /**
   * Get closest beacon
   */
  getClosestBeacon(): BeaconDetection | null {
    if (this.detectedBeacons.size === 0) return null;

    let closest: BeaconDetection | null = null;
    let minDistance = Infinity;

    for (const beacon of this.detectedBeacons.values()) {
      if (beacon.distance < minDistance) {
        minDistance = beacon.distance;
        closest = beacon;
      }
    }

    return closest;
  }

  /**
   * Get all nearby beacons (sorted by distance)
   */
  getNearbyBeacons(maxDistance?: number): BeaconDetection[] {
    const limit = maxDistance || this.config.maxDistance;

    return Array.from(this.detectedBeacons.values())
      .filter((b) => b.distance <= limit)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get beacons in specific zone
   */
  getBeaconsInZone(zone: string): BeaconDetection[] {
    return Array.from(this.detectedBeacons.values())
      .filter((b) => b.zone === zone)
      .sort((a, b) => a.distance - b.distance);
  }

  // ============================================================================
  // Private: Beacon Detection
  // ============================================================================

  private async handleAdvertisement(event: any): Promise<void> {
    const device = event.device;
    const rssi = event.rssi;
    const serviceData = event.serviceData;

    // Parse Eddystone frame
    const eddystoneUuid = '0000feaa-0000-1000-8000-00805f9b34fb';
    const data = serviceData?.get(eddystoneUuid);

    if (!data) return;

    const frame = new Uint8Array(data.buffer);
    const frameType = frame[0];

    // Only handle Eddystone-UID frames (0x00)
    if (frameType !== 0x00) return;

    // Extract namespace (10 bytes) and instance (6 bytes)
    const namespace = this.bytesToHex(frame.slice(2, 12));
    const instance = this.bytesToHex(frame.slice(12, 18));

    // Look up beacon in registry
    const beaconConfig = await this.lookupBeaconConfig(namespace, instance);

    if (!beaconConfig) {
      this.log(`Unknown beacon: ${namespace}:${instance}`);
      return;
    }

    // Filter by zone if specified
    if (this.config.zones && !this.config.zones.includes(beaconConfig.zone)) {
      return;
    }

    // Filter by minimum RSSI
    if (rssi < this.config.minRssi!) {
      return;
    }

    // Smooth RSSI using Kalman filter
    const smoothedRssi = this.applyKalmanFilter(beaconConfig.beaconId, rssi);

    // Calculate distance
    const distance = this.calculateDistance(smoothedRssi, beaconConfig.transmitPower);

    // Filter by maximum distance
    if (distance > this.config.maxDistance!) {
      return;
    }

    // Create beacon detection
    const beacon: BeaconDetection = {
      beaconId: beaconConfig.beaconId,
      uuid: beaconConfig.uuid,
      major: beaconConfig.major,
      minor: beaconConfig.minor,
      rssi: smoothedRssi,
      distance,
      accuracy: this.categorizeDistance(distance),
      zone: beaconConfig.zone,
      area: beaconConfig.area,
      coordinates: beaconConfig.coordinates,
      metadata: beaconConfig.metadata,
      detectedAt: Date.now(),
    };

    // Update detected beacons
    const isNew = !this.detectedBeacons.has(beacon.beaconId);
    this.detectedBeacons.set(beacon.beaconId, beacon);

    // Notify callbacks
    if (isNew || this.hasSignificantChange(beacon)) {
      this.config.onBeaconDetected!(beacon);
    }

    // Check for closest beacon change
    this.checkClosestBeaconChange();

    // Check for zone change
    this.checkZoneChange();
  }

  // ============================================================================
  // Private: Beacon Registry
  // ============================================================================

  private async loadBeaconRegistry(): Promise<void> {
    try {
      const response = await fetch(`/api/beacons?tenantId=${this.config.tenantId}`);

      if (!response.ok) {
        throw new Error(`Failed to load beacon registry: ${response.status}`);
      }

      const beacons: BeaconConfig[] = await response.json();

      for (const beacon of beacons) {
        const key = `${beacon.uuid}:${beacon.major}:${beacon.minor}`;
        this.beaconRegistry.set(key, beacon);
      }

      this.log(`Loaded ${beacons.length} beacons from registry`);
    } catch (error) {
      this.log('Failed to load beacon registry:', error);
      throw error;
    }
  }

  private async lookupBeaconConfig(
    namespace: string,
    instance: string
  ): Promise<BeaconConfig | null> {
    // For Eddystone, we use namespace as UUID and derive major/minor from instance
    const uuid = namespace;
    const major = parseInt(instance.substring(0, 4), 16);
    const minor = parseInt(instance.substring(4, 8), 16);

    const key = `${uuid}:${major}:${minor}`;
    return this.beaconRegistry.get(key) || null;
  }

  // ============================================================================
  // Private: Signal Processing
  // ============================================================================

  private applyKalmanFilter(beaconId: string, measurement: number): number {
    // Initialize Kalman filter if not exists
    if (!this.kalmanFilters.has(beaconId)) {
      this.kalmanFilters.set(beaconId, {
        estimate: measurement,
        errorCovariance: 1,
        processNoise: 0.01, // How much we expect RSSI to change
        measurementNoise: 2, // How noisy RSSI measurements are
      });
      return measurement;
    }

    const filter = this.kalmanFilters.get(beaconId)!;

    // Prediction step
    const predictedEstimate = filter.estimate;
    const predictedErrorCovariance = filter.errorCovariance + filter.processNoise;

    // Update step
    const kalmanGain =
      predictedErrorCovariance / (predictedErrorCovariance + filter.measurementNoise);
    const estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
    const errorCovariance = (1 - kalmanGain) * predictedErrorCovariance;

    // Update filter state
    filter.estimate = estimate;
    filter.errorCovariance = errorCovariance;

    return estimate;
  }

  private calculateDistance(rssi: number, txPower: number): number {
    // Path loss formula: RSSI = TxPower - 10 * n * log10(distance)
    // Solving for distance: distance = 10 ^ ((TxPower - RSSI) / (10 * n))
    // where n = path loss exponent (2 for free space, 2-4 for indoor)

    const n = 2.5; // Indoor path loss exponent
    const distance = Math.pow(10, (txPower - rssi) / (10 * n));

    // Clamp to reasonable range
    return Math.max(0.1, Math.min(100, distance));
  }

  private categorizeDistance(distance: number): 'immediate' | 'near' | 'far' | 'unknown' {
    if (distance < 1) return 'immediate'; // < 1m
    if (distance < 5) return 'near'; // 1-5m
    if (distance < 20) return 'far'; // 5-20m
    return 'unknown'; // > 20m
  }

  // ============================================================================
  // Private: Location Context
  // ============================================================================

  private calculateLocationAccuracy(
    closestBeacon: BeaconDetection | null,
    nearbyBeacons: BeaconDetection[]
  ): 'high' | 'medium' | 'low' | 'unknown' {
    if (!closestBeacon) return 'unknown';

    if (closestBeacon.accuracy === 'immediate' && nearbyBeacons.length >= 3) {
      return 'high'; // Very close to beacon + multiple beacons for triangulation
    }

    if (closestBeacon.accuracy === 'near' && nearbyBeacons.length >= 2) {
      return 'medium'; // Close to beacon + multiple beacons
    }

    if (closestBeacon.accuracy === 'far' || nearbyBeacons.length < 2) {
      return 'low'; // Far from beacon or not enough beacons
    }

    return 'unknown';
  }

  private isOnPropertyWiFi(): boolean {
    // Check if connected to property WiFi (implementation depends on platform)
    // For web apps, this is not directly accessible
    // For mobile apps, use WiFi info APIs

    // Placeholder: always return true if we're detecting beacons
    return this.detectedBeacons.size > 0;
  }

  // ============================================================================
  // Private: Change Detection
  // ============================================================================

  private checkClosestBeaconChange(): void {
    const currentClosest = this.getClosestBeacon();

    if (this.lastClosestBeacon?.beaconId !== currentClosest?.beaconId) {
      this.log('Closest beacon changed:', this.lastClosestBeacon, '→', currentClosest);
      this.config.onClosestBeaconChanged!(currentClosest);
      this.lastClosestBeacon = currentClosest;
    }
  }

  private checkZoneChange(): void {
    const currentZone = this.getClosestBeacon()?.zone || null;

    if (this.lastZone !== currentZone) {
      this.log('Zone changed:', this.lastZone, '→', currentZone);
      this.config.onZoneChanged!(currentZone);
      this.lastZone = currentZone;
    }
  }

  private hasSignificantChange(beacon: BeaconDetection): boolean {
    const previous = this.detectedBeacons.get(beacon.beaconId);

    if (!previous) return true;

    // Significant if distance changed by > 1 meter
    const distanceChange = Math.abs(beacon.distance - previous.distance);
    return distanceChange > 1;
  }

  // ============================================================================
  // Private: Stale Beacon Cleanup
  // ============================================================================

  private startStaleBeaconCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5000; // 5 seconds

      for (const [beaconId, beacon] of this.detectedBeacons.entries()) {
        if (now - beacon.detectedAt > staleThreshold) {
          this.log('Beacon lost:', beaconId);
          this.detectedBeacons.delete(beaconId);
          this.kalmanFilters.delete(beaconId);
          this.config.onBeaconLost!(beaconId);
        }
      }

      // Recheck closest beacon and zone after cleanup
      this.checkClosestBeaconChange();
      this.checkZoneChange();
    }, this.config.scanInterval!);
  }

  // ============================================================================
  // Private: Utilities
  // ============================================================================

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[BeaconScanner]', ...args);
    }
  }
}
