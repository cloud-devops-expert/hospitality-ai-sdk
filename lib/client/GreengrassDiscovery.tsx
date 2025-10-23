/**
 * Greengrass Server Discovery Component
 *
 * React component for discovering AWS IoT Greengrass server on local network.
 * Automatically discovers server using mDNS and provides manual fallback.
 *
 * Usage in medium/large hotels where web/mobile apps connect to greengrass.local
 * instead of cloud APIs.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  discoverGreengrassServer,
  isOnPropertyNetwork,
  setManualServer,
  clearCachedServer,
  getGreengrassUrl,
  type GreengrassServer,
  type DiscoveryResult,
} from './mdns-discovery';

export interface GreengrassDiscoveryProps {
  onServerFound?: (server: GreengrassServer) => void;
  onServerLost?: () => void;
  autoConnect?: boolean;
}

export function GreengrassDiscovery({
  onServerFound,
  onServerLost,
  autoConnect = true,
}: GreengrassDiscoveryProps) {
  const [discovering, setDiscovering] = useState(true);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualIp, setManualIp] = useState('192.168.20.10');
  const [manualPort, setManualPort] = useState(8000);
  const [error, setError] = useState<string | null>(null);

  // Auto-discover on mount
  useEffect(() => {
    if (autoConnect) {
      handleDiscover();
    }
  }, [autoConnect]);

  // Monitor connection (check every 30 seconds)
  useEffect(() => {
    if (!result?.server) return;

    const interval = setInterval(async () => {
      const connected = await isOnPropertyNetwork(
        result.server!.hostname,
        result.server!.port
      );

      if (!connected) {
        console.warn('Lost connection to Greengrass server');
        clearCachedServer();
        setResult(null);
        onServerLost?.();
        setError('Lost connection to Greengrass server. Please reconnect to property WiFi.');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [result?.server, onServerLost]);

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);

    try {
      const discoveryResult = await discoverGreengrassServer({
        timeout: 5000,
        scanLocalNetwork: true,
        preferredSubnets: ['192.168.20', '192.168.1', '10.0.0'],
      });

      setResult(discoveryResult);

      if (discoveryResult.server) {
        console.log('Greengrass server found:', discoveryResult);
        onServerFound?.(discoveryResult.server);
      } else {
        setError(discoveryResult.error || 'Server not found');
        setManualMode(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
      setManualMode(true);
    } finally {
      setDiscovering(false);
    }
  };

  const handleManualConnect = () => {
    try {
      const server = setManualServer(manualIp, manualPort);
      setResult({
        server,
        method: 'manual',
        latency: 0,
      });
      onServerFound?.(server);
      setManualMode(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Manual connection failed');
    }
  };

  const handleRetry = () => {
    clearCachedServer();
    setManualMode(false);
    setError(null);
    handleDiscover();
  };

  if (discovering) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Discovering Greengrass Server
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Searching for greengrass.local on property network...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result?.server && !manualMode) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Connected to Greengrass Server
              </h3>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Hostname:</dt>
                  <dd className="text-gray-900 dark:text-white font-mono">
                    {result.server.hostname}
                  </dd>
                </div>
                <div className="flex items-center space-x-2">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Port:</dt>
                  <dd className="text-gray-900 dark:text-white font-mono">
                    {result.server.port}
                  </dd>
                </div>
                <div className="flex items-center space-x-2">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Method:</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {result.method === 'mdns' && '🔍 mDNS Auto-Discovery'}
                    {result.method === 'scan' && '📡 Network Scan'}
                    {result.method === 'cache' && '💾 Cached'}
                    {result.method === 'manual' && '⚙️ Manual Configuration'}
                  </dd>
                </div>
                <div className="flex items-center space-x-2">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">Latency:</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {result.latency.toFixed(0)}ms
                  </dd>
                </div>
                {result.server.properties && (
                  <>
                    <div className="flex items-center space-x-2">
                      <dt className="font-medium text-gray-600 dark:text-gray-400">Version:</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {result.server.properties.version || 'N/A'}
                      </dd>
                    </div>
                    <div className="flex items-center space-x-2">
                      <dt className="font-medium text-gray-600 dark:text-gray-400">Endpoints:</dt>
                      <dd className="text-gray-900 dark:text-white text-xs">
                        {result.server.properties.endpoints || 'N/A'}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </div>
          <button
            onClick={() => setManualMode(true)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Change Server
          </button>
        </div>
      </div>
    );
  }

  if (manualMode || error) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Server Not Found
              </h3>
              {error && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Manual Configuration
            </h4>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="ip"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Server IP Address
                </label>
                <input
                  type="text"
                  id="ip"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  placeholder="192.168.20.10"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="port"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Port
                </label>
                <input
                  type="number"
                  id="port"
                  value={manualPort}
                  onChange={(e) => setManualPort(parseInt(e.target.value))}
                  placeholder="8000"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleManualConnect}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Connect
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Retry Auto-Discovery
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Hook for using Greengrass discovery in any component.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { server, discovering, discover } = useGreengrassDiscovery();
 *
 *   if (discovering) return <div>Discovering...</div>;
 *   if (!server) return <div>Not connected</div>;
 *
 *   return <div>Connected to {server.hostname}</div>;
 * }
 * ```
 */
export function useGreengrassDiscovery() {
  const [server, setServer] = useState<GreengrassServer | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discover = async () => {
    setDiscovering(true);
    setError(null);

    try {
      const result = await discoverGreengrassServer();
      if (result.server) {
        setServer(result.server);
      } else {
        setError(result.error || 'Server not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const getApiUrl = async () => {
    if (server) {
      return `${server.protocol}://${server.hostname}:${server.port}`;
    }
    return getGreengrassUrl();
  };

  return {
    server,
    discovering,
    error,
    discover,
    getApiUrl,
  };
}
