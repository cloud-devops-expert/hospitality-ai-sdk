/**
 * UniFi Unified Client
 *
 * Tries UniFi Cloud API first (api.ui.com), falls back to local controller.
 *
 * Benefits of Cloud API:
 * - Works remotely (no VPN needed)
 * - Single authentication for all properties
 * - Centralized management
 * - Automatic failover to local if cloud unavailable
 *
 * Architecture:
 * 1. Try UniFi Cloud API (https://api.ui.com)
 * 2. If fails, fallback to local controller (https://192.168.x.x:8443)
 * 3. Cache which works for faster subsequent requests
 */

import https from 'https';
import http from 'http';

// Disable SSL verification for self-signed local controllers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

interface UniFiConfig {
  // Cloud API (preferred)
  cloudApiKey?: string; // Get from https://account.ui.com/

  // Local controller (fallback)
  localUrl?: string; // https://192.168.1.93:8443
  localUsername?: string;
  localPassword?: string;
  localApiToken?: string; // Local API token (for MFA-enabled accounts)

  // Site name (default: 'default')
  site?: string;

  // Debug logging
  debug?: boolean;
}

interface UniFiAccessPoint {
  id: string;
  name: string;
  model: string;
  mac: string;
  ip: string;
  location?: { x: number; y: number; floor?: string };
  ble?: {
    enabled: boolean;
    uuid?: string;
    major?: number;
    minor?: number;
  };
  clients: number;
  uptime: number;
  status: 'online' | 'offline';
}

interface UniFiClient {
  mac: string;
  ip: string;
  hostname: string;
  apMac: string;
  apName: string;
  rssi: number;
  signal: number;
  connectedAt: Date;
  lastSeen: Date;
  authorized: boolean;
  guestName?: string;
  guestEmail?: string;
}

type UniFiMode = 'cloud' | 'local' | 'unknown';

export class UnifiedUniFiClient {
  private config: Required<UniFiConfig>;
  private mode: UniFiMode = 'unknown';
  private cloudCookie: string | null = null;
  private localCookie: string | null = null;
  private isUniFiOS: boolean = false; // Track if using UniFi OS vs legacy

  constructor(config: UniFiConfig) {
    this.config = {
      cloudApiKey: config.cloudApiKey || '',
      localUrl: config.localUrl || '',
      localUsername: config.localUsername || '',
      localPassword: config.localPassword || '',
      localApiToken: config.localApiToken || '',
      site: config.site || 'default',
      debug: config.debug || false,
    };
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Initialize connection (try cloud first, fallback to local)
   */
  async connect(): Promise<UniFiMode> {
    this.log('🔌 Connecting to UniFi...');

    // Try cloud first (if API key provided)
    if (this.config.cloudApiKey) {
      this.log('☁️  Trying UniFi Cloud API...');
      const cloudSuccess = await this.connectToCloud();

      if (cloudSuccess) {
        this.mode = 'cloud';
        this.log('✅ Connected via UniFi Cloud API');
        return 'cloud';
      }

      this.log('⚠️  Cloud API failed, falling back to local...');
    }

    // Fallback to local controller
    if (this.config.localUrl) {
      this.log('🏠 Trying local UniFi Controller...');
      const localSuccess = await this.connectToLocal();

      if (localSuccess) {
        this.mode = 'local';
        this.log('✅ Connected via local UniFi Controller');
        return 'local';
      }

      this.log('❌ Local controller failed');
    }

    throw new Error('Failed to connect to UniFi (cloud and local both failed)');
  }

  /**
   * Get list of Access Points
   */
  async getAccessPoints(): Promise<UniFiAccessPoint[]> {
    if (this.mode === 'cloud') {
      return this.getAccessPointsCloud();
    } else if (this.mode === 'local') {
      return this.getAccessPointsLocal();
    }

    throw new Error('Not connected. Call connect() first.');
  }

  /**
   * Get list of connected WiFi clients
   */
  async getClients(): Promise<UniFiClient[]> {
    if (this.mode === 'cloud') {
      return this.getClientsCloud();
    } else if (this.mode === 'local') {
      return this.getClientsLocal();
    }

    throw new Error('Not connected. Call connect() first.');
  }

  /**
   * Get guest location (which AP they're connected to)
   */
  async getGuestLocation(guestMac: string): Promise<{ zone: string; area: string; apName: string } | null> {
    const clients = await this.getClients();
    const aps = await this.getAccessPoints();

    const guest = clients.find(c => c.mac.toLowerCase() === guestMac.toLowerCase());
    if (!guest) return null;

    const ap = aps.find(a => a.mac === guest.apMac);
    if (!ap) return null;

    return {
      zone: this.mapAPToZone(ap.name),
      area: ap.name,
      apName: ap.name,
    };
  }

  /**
   * Check if guest is connected to property WiFi
   */
  async isGuestOnProperty(guestMac: string): Promise<boolean> {
    const clients = await this.getClients();
    return clients.some(c => c.mac.toLowerCase() === guestMac.toLowerCase() && c.authorized);
  }

  // ============================================================================
  // Private: UniFi Cloud API
  // ============================================================================

  private async connectToCloud(): Promise<boolean> {
    try {
      // UniFi Cloud API uses API key authentication (no login needed)
      // Just verify the API key works
      const response = await this.cloudRequest('/ea/sites');

      if (response && response.data) {
        return true;
      }

      return false;
    } catch (error) {
      this.log('Cloud connection error:', error);
      return false;
    }
  }

  private async cloudRequest(endpoint: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `https://api.ui.com${endpoint}`;

      https.get(url, {
        headers: {
          'x-api-key': this.config.cloudApiKey,
          'Content-Type': 'application/json',
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${data}`));
          }
        });
      }).on('error', reject);
    });
  }

  private async getAccessPointsCloud(): Promise<UniFiAccessPoint[]> {
    // Get all sites
    const sitesResponse = await this.cloudRequest('/ea/sites');
    const sites = sitesResponse.data || [];

    if (sites.length === 0) {
      return [];
    }

    // Get devices from first site (or configured site)
    const site = sites.find((s: any) => s.desc === this.config.site) || sites[0];
    const devicesResponse = await this.cloudRequest(`/ea/sites/${site._id}/devices`);
    const devices = devicesResponse.data || [];

    // Filter to APs and map
    return devices
      .filter((d: any) => d.type === 'uap')
      .map((ap: any) => this.mapAPData(ap));
  }

  private async getClientsCloud(): Promise<UniFiClient[]> {
    // Get all sites
    const sitesResponse = await this.cloudRequest('/ea/sites');
    const sites = sitesResponse.data || [];

    if (sites.length === 0) {
      return [];
    }

    // Get clients from first site
    const site = sites.find((s: any) => s.desc === this.config.site) || sites[0];
    const clientsResponse = await this.cloudRequest(`/ea/sites/${site._id}/clients`);
    const clients = clientsResponse.data || [];

    return clients.map((c: any) => this.mapClientData(c));
  }

  // ============================================================================
  // Private: Local UniFi Controller
  // ============================================================================

  private async connectToLocal(): Promise<boolean> {
    // If API token provided, use token-based auth (for MFA-enabled accounts)
    if (this.config.localApiToken) {
      this.log('Using API token authentication...');
      this.localCookie = `TOKEN=${this.config.localApiToken}`;

      // Test the token by making a simple API call
      try {
        this.isUniFiOS = true; // API tokens are UniFi OS only
        const response = await this.localRequest('/proxy/network/api/self');
        if (response && response.data) {
          this.log('✅ Connected via API token');
          return true;
        }
      } catch (error) {
        this.log('API token authentication failed:', error);
        return false;
      }
    }

    // Try UniFi OS path first (new Cloud Keys)
    try {
      this.log('Trying UniFi OS API path with username/password...');
      const response = await this.localRequest('/proxy/network/api/login', {
        method: 'POST',
        body: JSON.stringify({
          username: this.config.localUsername,
          password: this.config.localPassword,
        }),
      });

      if (response && response.meta && response.meta.rc === 'ok') {
        this.isUniFiOS = true;
        this.log('✅ Connected via UniFi OS API');
        return true;
      }
    } catch (error) {
      this.log('UniFi OS path failed, trying legacy path:', error);
    }

    // Fallback to legacy path (older controllers)
    try {
      this.log('Trying legacy API path...');
      const response = await this.localRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          username: this.config.localUsername,
          password: this.config.localPassword,
        }),
      });

      if (response && response.meta && response.meta.rc === 'ok') {
        this.isUniFiOS = false;
        this.log('✅ Connected via legacy API');
        return true;
      }

      return false;
    } catch (error) {
      this.log('Local connection error:', error);
      return false;
    }
  }

  private async localRequest(endpoint: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.config.localUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      // Extract port from URL or use defaults
      // url.port is empty string for default ports (80, 443), so parse from localUrl instead
      const baseUrl = new URL(this.config.localUrl);
      const port = baseUrl.port || (isHttps ? '443' : '80');

      const requestOptions = {
        hostname: url.hostname,
        port: parseInt(port),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.localCookie ? { 'Cookie': this.localCookie } : {}),
          ...options.headers,
        },
        rejectUnauthorized: false, // Accept self-signed cert
      };

      this.log(`Request: ${requestOptions.method} ${url.protocol}//${requestOptions.hostname}:${requestOptions.port}${requestOptions.path}`);

      const req = client.request(requestOptions, (res) => {
        let data = '';

        // Save cookie from login
        if (res.headers['set-cookie']) {
          this.localCookie = res.headers['set-cookie'][0].split(';')[0];
        }

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  private async getAccessPointsLocal(): Promise<UniFiAccessPoint[]> {
    const apiPath = this.isUniFiOS
      ? `/proxy/network/api/s/${this.config.site}/stat/device`
      : `/api/s/${this.config.site}/stat/device`;

    const response = await this.localRequest(apiPath);
    const devices = response.data || [];

    return devices
      .filter((d: any) => d.type === 'uap')
      .map((ap: any) => this.mapAPData(ap));
  }

  private async getClientsLocal(): Promise<UniFiClient[]> {
    const apiPath = this.isUniFiOS
      ? `/proxy/network/api/s/${this.config.site}/stat/sta`
      : `/api/s/${this.config.site}/stat/sta`;

    const response = await this.localRequest(apiPath);
    const clients = response.data || [];

    return clients.map((c: any) => this.mapClientData(c));
  }

  // ============================================================================
  // Private: Data Mapping (normalize cloud vs local responses)
  // ============================================================================

  private mapAPData(ap: any): UniFiAccessPoint {
    return {
      id: ap._id || ap.id,
      name: ap.name || 'Unnamed AP',
      model: ap.model,
      mac: ap.mac,
      ip: ap.ip,
      location: {
        x: ap.x || 0,
        y: ap.y || 0,
        floor: ap.map_id || undefined,
      },
      ble: {
        enabled: ap.ble_enabled || false,
        uuid: ap.ble_uuid || undefined,
        major: ap.ble_major || undefined,
        minor: ap.ble_minor || undefined,
      },
      clients: ap.num_sta || 0,
      uptime: ap.uptime || 0,
      status: ap.state === 1 ? 'online' : 'offline',
    };
  }

  private mapClientData(client: any): UniFiClient {
    return {
      mac: client.mac,
      ip: client.ip,
      hostname: client.hostname || client.name || 'Unknown',
      apMac: client.ap_mac,
      apName: client.ap_name || 'Unknown AP',
      rssi: client.rssi || 0,
      signal: client.signal || 0,
      connectedAt: new Date((client.first_seen || 0) * 1000),
      lastSeen: new Date((client.last_seen || 0) * 1000),
      authorized: client.authorized || false,
      guestName: client.name || undefined,
      guestEmail: client.email || undefined,
    };
  }

  // ============================================================================
  // Private: Utilities
  // ============================================================================

  private mapAPToZone(apName: string): string {
    const name = apName.toLowerCase();

    if (name.includes('bedroom')) {
      return 'room';
    }
    if (name.includes('office') || name.includes('workspace') || name.includes('business')) {
      return 'office';
    }
    if (name.includes('restaurant') || name.includes('dining') || name.includes('kitchen')) {
      return 'restaurant';
    }
    if (name.includes('spa') || name.includes('pool') || name.includes('gym') || name.includes('fitness')) {
      return 'spa';
    }
    if (name.includes('lobby') || name.includes('reception') || name.includes('front')) {
      return 'lobby';
    }
    if (name.includes('outside') || name.includes('outdoor') || name.includes('patio') || name.includes('garden')) {
      return 'unknown';
    }
    if (name.includes('room') || name.includes('floor')) {
      return 'room';
    }

    return 'unknown';
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[UnifiedUniFi]', ...args);
    }
  }
}
