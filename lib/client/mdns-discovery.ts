/**
 * Browser mDNS Discovery Client
 *
 * Discovers AWS IoT Greengrass server on local network using mDNS/Bonjour.
 * Browsers rely on OS-level mDNS resolution (.local domains).
 *
 * Supported platforms:
 * - macOS: Bonjour (built-in)
 * - Linux: Avahi (usually installed)
 * - Windows: Bonjour Print Services (may need installation)
 *
 * Discovery strategy:
 * 1. Try greengrass.local (OS-level mDNS)
 * 2. Scan common local IPs if .local fails
 * 3. Manual IP entry as final fallback
 */

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
  timeout?: number; // Timeout in milliseconds (default: 5000)
  scanLocalNetwork?: boolean; // Enable local IP scanning (default: true)
  preferredSubnets?: string[]; // Preferred subnets to scan (e.g., ['192.168.20', '192.168.1'])
}

export interface DiscoveryResult {
  server: GreengrassServer | null;
  method: 'mdns' | 'scan' | 'manual' | 'cache';
  latency: number;
  error?: string;
}

/**
 * Check if we're on the property network by attempting to reach Greengrass server.
 */
export async function isOnPropertyNetwork(
  hostname: string = 'greengrass.local',
  port: number = 8000,
  timeout: number = 2000
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`http://${hostname}:${port}/health`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false; // Not on property network
  }
}

/**
 * Try to connect to a specific host and verify it's a Greengrass server.
 */
async function tryConnect(
  host: string,
  port: number = 8000,
  timeout: number = 2000
): Promise<GreengrassServer | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = performance.now();
    const response = await fetch(`http://${host}:${port}/health`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const latency = performance.now() - startTime;

    // Verify this is a Greengrass server
    if (data.service === 'hospitality-ai-greengrass' || data.type === 'greengrass') {
      return {
        hostname: host,
        ip: host, // Will be resolved to IP by browser
        port,
        protocol: 'http',
        properties: {
          version: data.version,
          api: data.api,
          endpoints: data.endpoints?.join(','),
          manufacturer: data.manufacturer,
          model: data.model,
          security: data.security,
        },
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Scan common local IP addresses to find Greengrass server.
 * This is a fallback when .local resolution doesn't work.
 */
async function scanLocalNetwork(
  preferredSubnets: string[] = ['192.168.20', '192.168.1', '10.0.0'],
  timeout: number = 1000
): Promise<GreengrassServer | null> {
  const hostsToTry: string[] = [];

  // Build list of IPs to try
  for (const subnet of preferredSubnets) {
    // Try common server IPs first
    hostsToTry.push(`${subnet}.10`, `${subnet}.20`, `${subnet}.100`, `${subnet}.1`);

    // Then try other common IPs
    for (let i = 2; i <= 254; i++) {
      if (![1, 10, 20, 100].includes(i)) {
        hostsToTry.push(`${subnet}.${i}`);
      }
    }
  }

  // Try hosts in parallel (batch of 10 at a time to avoid overwhelming browser)
  const batchSize = 10;
  for (let i = 0; i < hostsToTry.length; i += batchSize) {
    const batch = hostsToTry.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((host) => tryConnect(host, 8000, timeout))
    );

    // Return first successful connection
    const server = results.find((r) => r !== null);
    if (server) {
      return server;
    }
  }

  return null;
}

/**
 * Discover Greengrass server on local network using mDNS.
 *
 * @param options Discovery options
 * @returns Discovery result with server info, method, and latency
 *
 * @example
 * ```typescript
 * const result = await discoverGreengrassServer({ timeout: 5000 });
 *
 * if (result.server) {
 *   console.log(`Found server at ${result.server.hostname}:${result.server.port}`);
 *   console.log(`Discovery method: ${result.method}, latency: ${result.latency}ms`);
 *
 *   // Connect to server
 *   const apiUrl = `${result.server.protocol}://${result.server.hostname}:${result.server.port}`;
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
    timeout = 5000,
    scanLocalNetwork: enableScan = true,
    preferredSubnets = ['192.168.20', '192.168.1', '10.0.0'],
  } = options;

  const startTime = performance.now();

  // 1. Check cache first
  const cached = getCachedServer();
  if (cached) {
    // Verify cached server is still reachable
    const server = await tryConnect(cached.hostname, cached.port, 2000);
    if (server) {
      return {
        server,
        method: 'cache',
        latency: performance.now() - startTime,
      };
    }
    // Cache is stale, clear it
    clearCachedServer();
  }

  // 2. Try greengrass.local (OS-level mDNS)
  console.log('Trying greengrass.local (OS-level mDNS)...');
  const mdnsServer = await tryConnect('greengrass.local', 8000, timeout);
  if (mdnsServer) {
    cacheServer(mdnsServer);
    return {
      server: mdnsServer,
      method: 'mdns',
      latency: performance.now() - startTime,
    };
  }

  // 3. Scan local network if enabled
  if (enableScan) {
    console.log('mDNS failed, scanning local network...');
    const scannedServer = await scanLocalNetwork(preferredSubnets, 1000);
    if (scannedServer) {
      cacheServer(scannedServer);
      return {
        server: scannedServer,
        method: 'scan',
        latency: performance.now() - startTime,
      };
    }
  }

  // 4. Not found
  return {
    server: null,
    method: 'manual',
    latency: performance.now() - startTime,
    error: 'Greengrass server not found. Please check:\n' +
           '1. You are connected to the property WiFi network\n' +
           '2. Greengrass server is running\n' +
           '3. mDNS/Bonjour is enabled on your device',
  };
}

/**
 * Manually set Greengrass server (fallback when auto-discovery fails).
 */
export function setManualServer(
  hostname: string,
  port: number = 8000,
  protocol: 'http' | 'https' = 'http'
): GreengrassServer {
  const server: GreengrassServer = {
    hostname,
    ip: hostname, // Assume hostname is IP
    port,
    protocol,
  };

  cacheServer(server);
  return server;
}

/**
 * Cache discovered server in localStorage for faster reconnection.
 */
function cacheServer(server: GreengrassServer): void {
  try {
    localStorage.setItem('greengrass-server', JSON.stringify({
      ...server,
      cachedAt: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to cache server:', error);
  }
}

/**
 * Get cached server from localStorage.
 */
function getCachedServer(): GreengrassServer | null {
  try {
    const cached = localStorage.getItem('greengrass-server');
    if (!cached) {
      return null;
    }

    const data = JSON.parse(cached);
    const age = Date.now() - (data.cachedAt || 0);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
      clearCachedServer();
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
export function clearCachedServer(): void {
  try {
    localStorage.removeItem('greengrass-server');
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

  return `${result.server.protocol}://${result.server.hostname}:${result.server.port}`;
}
