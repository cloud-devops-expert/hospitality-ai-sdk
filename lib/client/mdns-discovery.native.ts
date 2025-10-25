/**
 * React Native mDNS Discovery Client
 *
 * Discovers AWS IoT Greengrass server on local network using native mDNS/Bonjour.
 * Uses platform-specific APIs:
 * - iOS: NSNetService/NSNetServiceBrowser (via react-native-zeroconf)
 * - Android: NsdManager (via react-native-zeroconf)
 *
 * Installation:
 * ```bash
 * npm install react-native-zeroconf
 * cd ios && pod install
 * ```
 *
 * Permissions:
 * - iOS: Add "Bonjour services" in Info.plist
 * - Android: Add INTERNET and ACCESS_NETWORK_STATE permissions
 */

// @ts-ignore - react-native-zeroconf is optional dependency for mobile apps
import Zeroconf from 'react-native-zeroconf';
// @ts-ignore - @react-native-async-storage/async-storage is optional dependency
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GreengrassServer {
  hostname: string;
  ip: string;
  port: number;
  protocol: 'http' | 'https';
  properties?: {
    version?: string;
    api?: string;
    endpoints?: string;
    manufacturer?: string;
    model?: string;
    security?: string;
  };
}

export interface DiscoveryOptions {
  timeout?: number; // Timeout in milliseconds (default: 10000)
  serviceType?: string; // Service type (default: '_hospitality._tcp.')
}

export interface DiscoveryResult {
  server: GreengrassServer | null;
  method: 'mdns' | 'manual' | 'cache';
  latency: number;
  error?: string;
}

// Cache key for AsyncStorage
const CACHE_KEY = '@greengrass-server';

/**
 * Discover Greengrass server on local network using native mDNS.
 *
 * @param options Discovery options
 * @returns Discovery result with server info, method, and latency
 *
 * @example
 * ```typescript
 * const result = await discoverGreengrassServer({ timeout: 10000 });
 *
 * if (result.server) {
 *   console.log(`Found server at ${result.server.hostname}:${result.server.port}`);
 *   console.log(`IP: ${result.server.ip}, latency: ${result.latency}ms`);
 *
 *   // Connect to server
 *   const apiUrl = `${result.server.protocol}://${result.server.ip}:${result.server.port}`;
 *   const response = await fetch(`${apiUrl}/api/sentiment`, {
 *     method: 'POST',
 *     body: JSON.stringify({ text: 'Great service!' }),
 *   });
 * } else {
 *   console.error(`Server not found: ${result.error}`);
 *   // Show manual IP entry form
 * }
 * ```
 */
export async function discoverGreengrassServer(
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const {
    timeout = 10000,
    serviceType = '_hospitality._tcp.',
  } = options;

  const startTime = Date.now();

  // 1. Check cache first
  const cached = await getCachedServer();
  if (cached) {
    // Verify cached server is still reachable
    const reachable = await isServerReachable(cached.ip, cached.port, 2000);
    if (reachable) {
      return {
        server: cached,
        method: 'cache',
        latency: Date.now() - startTime,
      };
    }
    // Cache is stale, clear it
    await clearCachedServer();
  }

  // 2. Scan for mDNS services
  console.log(`Scanning for ${serviceType} services...`);

  return new Promise((resolve) => {
    const zeroconf = new Zeroconf();
    let resolved = false;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        zeroconf.stop();
        resolve({
          server: null,
          method: 'manual',
          latency: Date.now() - startTime,
          error: 'Greengrass server not found. Please check:\n' +
                 '1. You are connected to the property WiFi network\n' +
                 '2. Greengrass server is running\n' +
                 '3. mDNS/Bonjour is enabled on your device',
        });
      }
    }, timeout);

    // Service resolved handler
    zeroconf.on('resolved', async (service: any) => {
      console.log('Service resolved:', service);

      // Check if this is our Greengrass server
      if (service.name && service.name.includes('Hospitality AI')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          zeroconf.stop();

          const server: GreengrassServer = {
            hostname: service.host || 'greengrass.local',
            ip: service.addresses?.[0] || service.host,
            port: service.port || 8000,
            protocol: 'http',
            properties: {
              version: service.txt?.version,
              api: service.txt?.api,
              endpoints: service.txt?.endpoints,
              manufacturer: service.txt?.manufacturer,
              model: service.txt?.model,
              security: service.txt?.security,
            },
          };

          await cacheServer(server);

          resolve({
            server,
            method: 'mdns',
            latency: Date.now() - startTime,
          });
        }
      }
    });

    // Error handler
    zeroconf.on('error', (error: any) => {
      console.error('mDNS error:', error);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        zeroconf.stop();
        resolve({
          server: null,
          method: 'manual',
          latency: Date.now() - startTime,
          error: `mDNS discovery failed: ${error.message || error}`,
        });
      }
    });

    // Start scanning
    try {
      zeroconf.scan(serviceType, 'local.');
    } catch (error) {
      console.error('Failed to start mDNS scan:', error);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({
          server: null,
          method: 'manual',
          latency: Date.now() - startTime,
          error: `Failed to start mDNS scan: ${error}`,
        });
      }
    }
  });
}

/**
 * Check if a server is reachable.
 */
async function isServerReachable(
  ip: string,
  port: number,
  timeout: number = 2000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`http://${ip}:${port}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Check if we're on the property network.
 */
export async function isOnPropertyNetwork(
  hostname: string = 'greengrass.local',
  port: number = 8000,
  timeout: number = 2000
): Promise<boolean> {
  return isServerReachable(hostname, port, timeout);
}

/**
 * Manually set Greengrass server (fallback when auto-discovery fails).
 */
export async function setManualServer(
  ip: string,
  port: number = 8000,
  protocol: 'http' | 'https' = 'http'
): Promise<GreengrassServer> {
  const server: GreengrassServer = {
    hostname: 'greengrass.local',
    ip,
    port,
    protocol,
  };

  await cacheServer(server);
  return server;
}

/**
 * Cache discovered server in AsyncStorage.
 */
async function cacheServer(server: GreengrassServer): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      ...server,
      cachedAt: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to cache server:', error);
  }
}

/**
 * Get cached server from AsyncStorage.
 */
async function getCachedServer(): Promise<GreengrassServer | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const data = JSON.parse(cached);
    const age = Date.now() - (data.cachedAt || 0);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
      await clearCachedServer();
      return null;
    }

    return data as GreengrassServer;
  } catch (error) {
    return null;
  }
}

/**
 * Clear cached server.
 */
export async function clearCachedServer(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear cached server:', error);
  }
}

/**
 * Get Greengrass API URL (auto-discover if needed).
 *
 * @example
 * ```typescript
 * // In your API client
 * const apiUrl = await getGreengrassUrl();
 * const response = await fetch(`${apiUrl}/api/sentiment`, {
 *   method: 'POST',
 *   body: JSON.stringify({ text: 'Great service!' }),
 * });
 * ```
 */
export async function getGreengrassUrl(): Promise<string> {
  const result = await discoverGreengrassServer();

  if (!result.server) {
    throw new Error('Greengrass server not found. Are you on the property network?');
  }

  // Use IP address instead of hostname for React Native
  return `${result.server.protocol}://${result.server.ip}:${result.server.port}`;
}

/**
 * Stop all active mDNS scans.
 * Call this when your app goes to background or unmounts.
 */
export function stopScanning(): void {
  const zeroconf = new Zeroconf();
  zeroconf.stop();
}
