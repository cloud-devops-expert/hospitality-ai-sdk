/**
 * React Native Greengrass Discovery Component
 *
 * Discovers AWS IoT Greengrass server on local network using native mDNS.
 * Works with Expo and bare React Native apps.
 *
 * Usage in medium/large hotels where mobile apps connect to Greengrass server
 * instead of cloud APIs.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  discoverGreengrassServer,
  isOnPropertyNetwork,
  setManualServer,
  clearCachedServer,
  getGreengrassUrl,
  stopScanning,
  type GreengrassServer,
  type DiscoveryResult,
} from './mdns-discovery.native';

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
  const [manualPort, setManualPort] = useState('8000');
  const [error, setError] = useState<string | null>(null);

  // Auto-discover on mount
  useEffect(() => {
    if (autoConnect) {
      handleDiscover();
    }

    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, [autoConnect]);

  // Monitor connection (check every 30 seconds)
  useEffect(() => {
    if (!result?.server) return;

    const interval = setInterval(async () => {
      const connected = await isOnPropertyNetwork(
        result.server!.ip,
        result.server!.port
      );

      if (!connected) {
        console.warn('Lost connection to Greengrass server');
        await clearCachedServer();
        setResult(null);
        onServerLost?.();
        setError('Lost connection to Greengrass server. Please reconnect to property WiFi.');
        Alert.alert(
          'Connection Lost',
          'Lost connection to Greengrass server. Please reconnect to property WiFi.',
          [{ text: 'OK', onPress: () => setManualMode(true) }]
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [result?.server, onServerLost]);

  const handleDiscover = async () => {
    setDiscovering(true);
    setError(null);

    try {
      const discoveryResult = await discoverGreengrassServer({
        timeout: 10000,
        serviceType: '_hospitality._tcp.',
      });

      setResult(discoveryResult);

      if (discoveryResult.server) {
        console.log('Greengrass server found:', discoveryResult);
        onServerFound?.(discoveryResult.server);
      } else {
        setError(discoveryResult.error || 'Server not found');
        setManualMode(true);
        Alert.alert(
          'Server Not Found',
          discoveryResult.error || 'Could not find Greengrass server. Please configure manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Discovery failed';
      setError(errorMsg);
      setManualMode(true);
      Alert.alert('Discovery Failed', errorMsg, [{ text: 'OK' }]);
    } finally {
      setDiscovering(false);
    }
  };

  const handleManualConnect = async () => {
    try {
      const port = parseInt(manualPort);
      if (isNaN(port) || port < 1 || port > 65535) {
        Alert.alert('Invalid Port', 'Please enter a valid port number (1-65535)');
        return;
      }

      const server = await setManualServer(manualIp, port);
      setResult({
        server,
        method: 'manual',
        latency: 0,
      });
      onServerFound?.(server);
      setManualMode(false);
      setError(null);
      Alert.alert('Connected', `Connected to ${manualIp}:${port}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Manual connection failed';
      setError(errorMsg);
      Alert.alert('Connection Failed', errorMsg);
    }
  };

  const handleRetry = async () => {
    await clearCachedServer();
    setManualMode(false);
    setError(null);
    handleDiscover();
  };

  if (discovering) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.title}>Discovering Greengrass Server</Text>
          <Text style={styles.subtitle}>
            Searching for greengrass.local on property network...
          </Text>
        </View>
      </View>
    );
  }

  if (result?.server && !manualMode) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconSuccess}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Connected to Greengrass</Text>
            </View>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hostname:</Text>
              <Text style={styles.detailValue}>{result.server.hostname}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IP Address:</Text>
              <Text style={styles.detailValue}>{result.server.ip}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Port:</Text>
              <Text style={styles.detailValue}>{result.server.port}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Method:</Text>
              <Text style={styles.detailValue}>
                {result.method === 'mdns' && '🔍 mDNS Auto-Discovery'}
                {result.method === 'cache' && '💾 Cached'}
                {result.method === 'manual' && '⚙️ Manual Configuration'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Latency:</Text>
              <Text style={styles.detailValue}>{result.latency.toFixed(0)}ms</Text>
            </View>
            {result.server.properties && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Version:</Text>
                  <Text style={styles.detailValue}>
                    {result.server.properties.version || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Endpoints:</Text>
                  <Text style={[styles.detailValue, styles.smallText]}>
                    {result.server.properties.endpoints || 'N/A'}
                  </Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => setManualMode(true)}
          >
            <Text style={styles.buttonSecondaryText}>Change Server</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (manualMode || error) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWarning}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Server Not Found</Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Manual Configuration</Text>

            <Text style={styles.label}>Server IP Address</Text>
            <TextInput
              style={styles.input}
              value={manualIp}
              onChangeText={setManualIp}
              placeholder="192.168.20.10"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Port</Text>
            <TextInput
              style={styles.input}
              value={manualPort}
              onChangeText={setManualPort}
              placeholder="8000"
              keyboardType="numeric"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleManualConnect}
              >
                <Text style={styles.buttonPrimaryText}>Connect</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleRetry}
              >
                <Text style={styles.buttonSecondaryText}>Retry Auto-Discovery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

/**
 * Hook for using Greengrass discovery in any component.
 *
 * @example
 * ```typescript
 * function MyScreen() {
 *   const { server, discovering, discover } = useGreengrassDiscovery();
 *
 *   if (discovering) return <Text>Discovering...</Text>;
 *   if (!server) return <Text>Not connected</Text>;
 *
 *   return <Text>Connected to {server.hostname}</Text>;
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
      return `${server.protocol}://${server.ip}:${server.port}`;
    }
    return getGreengrassUrl();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return {
    server,
    discovering,
    error,
    discover,
    getApiUrl,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  iconSuccess: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWarning: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  smallText: {
    fontSize: 12,
  },
  form: {
    marginTop: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  buttonSecondaryText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
});
