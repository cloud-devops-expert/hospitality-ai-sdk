/**
 * Network Detection and Server Prioritization
 *
 * Detects network conditions and determines optimal replication strategy:
 * - On-premise WiFi → Use Greengrass (fastest, most reliable)
 * - Internet → Use Cloud API (always available)
 * - Offline → Use WebRTC P2P (local collaboration)
 * - Large property → Consider multiple Greengrass servers
 *
 * Key Features:
 * - Automatic network detection (WiFi SSID, IP range, mDNS)
 * - Latency-based server prioritization
 * - Bandwidth estimation for large syncs
 * - Network change detection (switch WiFi networks)
 * - Adaptive strategy (adjust based on conditions)
 */

import { discoverGreengrassServer, isOnPropertyNetwork } from '../client/mdns-discovery';

export interface NetworkInfo {
  type: 'wifi' | 'cellular' | 'ethernet' | 'none';
  ssid?: string; // WiFi SSID
  ipAddress?: string; // Local IP address
  isOnPropertyNetwork: boolean; // Connected to property WiFi
  hasInternet: boolean; // Can reach internet
  bandwidth?: number; // Estimated bandwidth in Mbps
  latency?: number; // Network latency in ms
}

export interface ServerEndpoint {
  id: string;
  name: string;
  url: string;
  type: 'greengrass' | 'cloud' | 'property' | 'webrtc';
  latency: number;
  bandwidth: number;
  score: number; // Calculated priority score (higher = better)
  available: boolean;
}

export interface NetworkStrategy {
  primary: ServerEndpoint;
  fallbacks: ServerEndpoint[];
  enableP2P: boolean;
  syncInterval: number; // How often to sync (ms)
  batchSize: number; // Documents per batch
  compress: boolean; // Compress payloads
}

/**
 * Network Detector
 *
 * Detects network conditions and recommends optimal replication strategy.
 */
export class NetworkDetector {
  private lastNetworkInfo: NetworkInfo | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Detect current network conditions
   */
  async detectNetwork(): Promise<NetworkInfo> {
    const networkInfo: NetworkInfo = {
      type: 'none',
      isOnPropertyNetwork: false,
      hasInternet: false,
    };

    // 1. Check if on property network (can reach Greengrass)
    try {
      const onProperty = await isOnPropertyNetwork('greengrass.local', 8000, 2000);
      networkInfo.isOnPropertyNetwork = onProperty;

      if (onProperty) {
        networkInfo.type = 'wifi'; // Assume WiFi if on property network
        // TODO: Get actual WiFi SSID (requires native API)
        // networkInfo.ssid = await getWiFiSSID();
      }
    } catch (error) {
      // Not on property network
    }

    // 2. Check internet connectivity
    try {
      const hasInternet = await this.checkInternet();
      networkInfo.hasInternet = hasInternet;

      if (hasInternet && !networkInfo.isOnPropertyNetwork) {
        // Has internet but not on property network
        // Could be cellular or external WiFi
        networkInfo.type = this.guessNetworkType();
      }
    } catch (error) {
      // No internet
    }

    // 3. Get local IP address
    try {
      networkInfo.ipAddress = await this.getLocalIP();
    } catch (error) {
      // Cannot determine IP
    }

    // 4. Estimate bandwidth and latency
    if (networkInfo.isOnPropertyNetwork) {
      networkInfo.bandwidth = await this.estimateBandwidth('http://greengrass.local:8000');
      networkInfo.latency = await this.measureLatency('http://greengrass.local:8000');
    } else if (networkInfo.hasInternet) {
      networkInfo.bandwidth = await this.estimateBandwidth('https://api.hospitality-ai.com');
      networkInfo.latency = await this.measureLatency('https://api.hospitality-ai.com');
    }

    this.lastNetworkInfo = networkInfo;
    return networkInfo;
  }

  /**
   * Discover and prioritize available servers
   */
  async discoverServers(): Promise<ServerEndpoint[]> {
    const servers: ServerEndpoint[] = [];

    // 1. Try Greengrass (on-premise)
    try {
      const result = await discoverGreengrassServer({ timeout: 3000 });
      if (result.server) {
        const latency = await this.measureLatency(`http://${result.server.hostname}:8000`);
        const bandwidth = await this.estimateBandwidth(`http://${result.server.hostname}:8000`);

        servers.push({
          id: 'greengrass',
          name: 'Greengrass (On-Premise)',
          url: `http://${result.server.hostname}:8000`,
          type: 'greengrass',
          latency: latency || 50,
          bandwidth: bandwidth || 1000, // Assume 1Gbps LAN
          score: this.calculateScore('greengrass', latency || 50, bandwidth || 1000),
          available: true,
        });
      }
    } catch (error) {
      // Greengrass not available
    }

    // 2. Cloud API (always try)
    try {
      const latency = await this.measureLatency('https://api.hospitality-ai.com');
      const bandwidth = await this.estimateBandwidth('https://api.hospitality-ai.com');

      if (latency !== null) {
        servers.push({
          id: 'cloud',
          name: 'Cloud API',
          url: 'https://api.hospitality-ai.com',
          type: 'cloud',
          latency,
          bandwidth: bandwidth || 100, // Assume 100Mbps internet
          score: this.calculateScore('cloud', latency, bandwidth || 100),
          available: true,
        });
      }
    } catch (error) {
      // Cloud not available
    }

    // 3. Sort by score (highest first)
    servers.sort((a, b) => b.score - a.score);

    return servers;
  }

  /**
   * Recommend replication strategy based on network conditions
   */
  async recommendStrategy(): Promise<NetworkStrategy> {
    const network = await this.detectNetwork();
    const servers = await this.discoverServers();

    if (servers.length === 0) {
      // No servers available - offline mode with P2P
      return {
        primary: {
          id: 'none',
          name: 'Offline',
          url: '',
          type: 'webrtc',
          latency: 0,
          bandwidth: 0,
          score: 0,
          available: false,
        },
        fallbacks: [],
        enableP2P: true, // Enable P2P for local collaboration
        syncInterval: 60000, // 1 minute (will queue for later)
        batchSize: 10,
        compress: true,
      };
    }

    const primary = servers[0];
    const fallbacks = servers.slice(1);

    // Adaptive settings based on network
    let syncInterval = 30000; // 30 seconds (default)
    let batchSize = 50;
    let compress = false;
    let enableP2P = false;

    if (primary.type === 'greengrass') {
      // On-premise: Fast sync, large batches, no compression
      syncInterval = 5000; // 5 seconds
      batchSize = 100;
      compress = false;
      enableP2P = false; // Not needed (have fast server)
    } else if (primary.type === 'cloud') {
      // Cloud: Moderate sync, medium batches, compress if slow
      syncInterval = 15000; // 15 seconds
      batchSize = 50;
      compress = network.bandwidth ? network.bandwidth < 10 : true; // Compress if <10Mbps
      enableP2P = true; // Enable P2P for small hotels
    }

    return {
      primary,
      fallbacks,
      enableP2P,
      syncInterval,
      batchSize,
      compress,
    };
  }

  /**
   * Monitor network changes and emit events
   */
  async startMonitoring(
    onChange: (oldNetwork: NetworkInfo, newNetwork: NetworkInfo) => void,
    interval: number = 30000
  ): Promise<void> {
    // Initial detection
    await this.detectNetwork();

    // Monitor for changes
    this.checkInterval = setInterval(async () => {
      const newNetwork = await this.detectNetwork();

      if (this.hasNetworkChanged(this.lastNetworkInfo, newNetwork)) {
        console.log('Network changed:', {
          old: this.lastNetworkInfo,
          new: newNetwork,
        });
        onChange(this.lastNetworkInfo!, newNetwork);
      }
    }, interval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Private methods

  private async checkInternet(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async getLocalIP(): Promise<string | undefined> {
    try {
      // This is a hack - create a dummy peer connection to get local IP
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.createDataChannel('');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      return new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const ipMatch = event.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
              pc.close();
              resolve(ipMatch[1]);
            }
          }
        };

        setTimeout(() => {
          pc.close();
          resolve(undefined);
        }, 3000);
      });
    } catch (error) {
      return undefined;
    }
  }

  private guessNetworkType(): 'wifi' | 'cellular' | 'ethernet' {
    // In browser, we can't reliably detect network type
    // In React Native, use NetInfo library
    // For now, assume WiFi
    return 'wifi';
  }

  private async measureLatency(url: string): Promise<number | null> {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${url}/health`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      return Date.now() - start;
    } catch (error) {
      return null;
    }
  }

  private async estimateBandwidth(url: string): Promise<number | null> {
    try {
      // Download a small test file (1KB) and measure speed
      const testSize = 1024; // 1KB
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${url}/bandwidth-test`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeout);

      if (!response.ok) return null;

      await response.arrayBuffer();
      const duration = (Date.now() - start) / 1000; // seconds

      // Calculate Mbps
      const mbps = (testSize * 8) / (duration * 1000000);
      return mbps;
    } catch (error) {
      return null;
    }
  }

  private calculateScore(
    type: 'greengrass' | 'cloud' | 'property' | 'webrtc',
    latency: number,
    bandwidth: number
  ): number {
    // Score formula (higher = better):
    // - Greengrass: High base score, bonus for low latency
    // - Cloud: Medium base score
    // - P2P: Low base score (unreliable)

    let baseScore = 0;
    switch (type) {
      case 'greengrass':
        baseScore = 1000;
        break;
      case 'cloud':
        baseScore = 500;
        break;
      case 'property':
        baseScore = 750;
        break;
      case 'webrtc':
        baseScore = 250;
        break;
    }

    // Penalize high latency (0-200ms range)
    const latencyPenalty = Math.min(latency, 200) * 2;

    // Bonus for high bandwidth (0-1000Mbps range)
    const bandwidthBonus = Math.min(bandwidth, 1000) / 2;

    return baseScore - latencyPenalty + bandwidthBonus;
  }

  private hasNetworkChanged(oldNetwork: NetworkInfo | null, newNetwork: NetworkInfo): boolean {
    if (!oldNetwork) return true;

    return (
      oldNetwork.type !== newNetwork.type ||
      oldNetwork.isOnPropertyNetwork !== newNetwork.isOnPropertyNetwork ||
      oldNetwork.hasInternet !== newNetwork.hasInternet
    );
  }
}

/**
 * Create network detector
 *
 * @example
 * ```typescript
 * const detector = createNetworkDetector();
 *
 * // Detect current network
 * const network = await detector.detectNetwork();
 * console.log('Network:', network);
 * // {
 * //   type: 'wifi',
 * //   isOnPropertyNetwork: true,
 * //   hasInternet: true,
 * //   bandwidth: 1000,
 * //   latency: 12
 * // }
 *
 * // Get recommended strategy
 * const strategy = await detector.recommendStrategy();
 * console.log('Primary server:', strategy.primary.name);
 * console.log('Sync interval:', strategy.syncInterval, 'ms');
 * console.log('Enable P2P:', strategy.enableP2P);
 *
 * // Monitor network changes
 * await detector.startMonitoring((oldNet, newNet) => {
 *   console.log('Network changed!');
 *   if (newNet.isOnPropertyNetwork && !oldNet.isOnPropertyNetwork) {
 *     console.log('Connected to property WiFi - switching to Greengrass');
 *   }
 * });
 * ```
 */
export function createNetworkDetector(): NetworkDetector {
  return new NetworkDetector();
}
