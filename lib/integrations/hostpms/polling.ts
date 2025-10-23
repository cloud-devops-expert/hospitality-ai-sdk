/**
 * HostPMS OAuth Polling Handler
 * Periodically polls HostPMS API for reservation updates using OAuth 2.0
 */

import type {
  HostPMSOAuthToken,
  HostPMSReservation,
  HostPMSReservationsResponse,
  HostPMSClientOptions,
  SyncResult,
} from './types';

/**
 * HTTP Client Interface (for dependency injection / testing)
 */
export interface HttpClient {
  post<T = any>(url: string, data: any, config?: any): Promise<{ data: T }>;
  get<T = any>(url: string, config?: any): Promise<{ data: T }>;
}

/**
 * Token Storage Interface (for dependency injection)
 */
export interface TokenStorage {
  getToken(propertyId: string): Promise<HostPMSOAuthToken | null>;
  saveToken(propertyId: string, token: HostPMSOAuthToken): Promise<void>;
  getLastSyncTime(propertyId: string): Promise<Date | null>;
  updateLastSyncTime(propertyId: string, timestamp: Date): Promise<void>;
}

/**
 * OAuth Client Configuration
 */
export interface OAuthPollingConfig extends HostPMSClientOptions {
  httpClient?: HttpClient;
  tokenStorage?: TokenStorage;
  maxRetries?: number;
  retryDelayMs?: number;
  maxRecordsPerPage?: number;
  maxPages?: number;
  onReservation?: (reservation: HostPMSReservation) => Promise<void>;
  onBatchComplete?: (reservations: HostPMSReservation[]) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

/**
 * OAuth Token Manager
 */
export class HostPMSOAuthClient {
  private config: OAuthPollingConfig;
  private httpClient: HttpClient;
  private tokenStorage: TokenStorage;
  private baseUrl: string;

  constructor(config: OAuthPollingConfig) {
    this.config = config;
    this.baseUrl = config.base_url || 'https://api.hostpms.com';
    this.httpClient = config.httpClient || this.createDefaultHttpClient();
    this.tokenStorage = config.tokenStorage || this.createDefaultTokenStorage();
  }

  /**
   * Get valid OAuth access token (with automatic refresh)
   */
  async getAccessToken(): Promise<string> {
    const propertyId = this.config.property_id;

    // Try to get cached token
    const cachedToken = await this.tokenStorage.getToken(propertyId);

    if (cachedToken && this.isTokenValid(cachedToken)) {
      return cachedToken.access_token;
    }

    // Token expired or not found - request new token
    const newToken = await this.requestNewToken();
    await this.tokenStorage.saveToken(propertyId, newToken);

    return newToken.access_token;
  }

  /**
   * Check if token is still valid (with 5-minute buffer)
   */
  private isTokenValid(token: HostPMSOAuthToken): boolean {
    if (!token.created_at) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = token.created_at + token.expires_in;
    const bufferSeconds = 300; // 5 minutes

    return now < expiresAt - bufferSeconds;
  }

  /**
   * Request new OAuth token from HostPMS
   */
  private async requestNewToken(): Promise<HostPMSOAuthToken> {
    try {
      const response = await this.httpClient.post<HostPMSOAuthToken>(
        `${this.baseUrl}/oauth/v1/tokens`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.client_id,
          client_secret: this.config.client_secret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const token = response.data;
      token.created_at = Math.floor(Date.now() / 1000);

      return token;
    } catch (error) {
      throw new Error(
        `Failed to obtain OAuth token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch reservations from HostPMS API with pagination
   */
  async fetchReservations(options: {
    updatedSince?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<HostPMSReservationsResponse> {
    const accessToken = await this.getAccessToken();

    const params: Record<string, any> = {
      limit: options.limit || this.config.maxRecordsPerPage || 1000,
      offset: options.offset || 0,
    };

    if (options.updatedSince) {
      params.updated_since = options.updatedSince.toISOString();
    }

    try {
      const response = await this.httpClient.get<HostPMSReservationsResponse>(
        `${this.baseUrl}/api/v1/properties/${this.config.property_id}/reservations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch reservations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch all reservations with automatic pagination
   */
  async fetchAllReservations(options: {
    updatedSince?: Date;
    maxPages?: number;
  } = {}): Promise<HostPMSReservation[]> {
    const allReservations: HostPMSReservation[] = [];
    const maxPages = options.maxPages || this.config.maxPages || 100;
    let currentPage = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore && currentPage < maxPages) {
      const response = await this.fetchReservations({
        updatedSince: options.updatedSince,
        offset,
      });

      allReservations.push(...response.reservations);

      // Process individual reservations if callback provided
      if (this.config.onReservation) {
        for (const reservation of response.reservations) {
          await this.config.onReservation(reservation);
        }
      }

      hasMore = response.has_more;
      offset += response.reservations.length;
      currentPage++;

      // Respect rate limits - small delay between pages
      if (hasMore) {
        await this.delay(100); // 100ms delay
      }
    }

    return allReservations;
  }

  /**
   * Perform incremental sync (fetch only updated reservations since last sync)
   */
  async performIncrementalSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;
    let recordsSaved = 0;
    let recordsFailed = 0;

    try {
      // Get last sync timestamp
      const lastSyncTime = await this.tokenStorage.getLastSyncTime(
        this.config.property_id
      );

      // Fetch reservations updated since last sync
      const reservations = await this.fetchAllReservations({
        updatedSince: lastSyncTime || undefined,
      });

      recordsProcessed = reservations.length;

      // Process batch if callback provided
      if (this.config.onBatchComplete) {
        try {
          await this.config.onBatchComplete(reservations);
          recordsSaved = reservations.length;
        } catch (error) {
          recordsFailed = reservations.length;
          errors.push(
            `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        recordsSaved = reservations.length;
      }

      // Update last sync time
      await this.tokenStorage.updateLastSyncTime(
        this.config.property_id,
        new Date()
      );

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        records_processed: recordsProcessed,
        records_saved: recordsSaved,
        records_failed: recordsFailed,
        duration_ms: duration,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (this.config.onError) {
        await this.config.onError(
          error instanceof Error ? error : new Error(errorMessage)
        );
      }

      errors.push(errorMessage);

      return {
        success: false,
        records_processed: recordsProcessed,
        records_saved: recordsSaved,
        records_failed: recordsProcessed - recordsSaved,
        duration_ms: duration,
        errors,
      };
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    const baseDelay = this.config.retryDelayMs || 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s...
          const delay = baseDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create default HTTP client (for Node.js environments)
   * In production, use axios or similar library
   */
  private createDefaultHttpClient(): HttpClient {
    // This is a minimal implementation for testing
    // In production, you should inject a real HTTP client (axios, fetch, etc.)
    return {
      async post<T>(url: string, data: any, config?: any): Promise<{ data: T }> {
        throw new Error(
          'Default HTTP client not implemented. Please provide httpClient in config.'
        );
      },
      async get<T>(url: string, config?: any): Promise<{ data: T }> {
        throw new Error(
          'Default HTTP client not implemented. Please provide httpClient in config.'
        );
      },
    };
  }

  /**
   * Create default token storage (in-memory for testing)
   * In production, use DynamoDB or similar
   */
  private createDefaultTokenStorage(): TokenStorage {
    const tokenCache = new Map<string, HostPMSOAuthToken>();
    const syncTimeCache = new Map<string, Date>();

    return {
      async getToken(propertyId: string): Promise<HostPMSOAuthToken | null> {
        return tokenCache.get(propertyId) || null;
      },

      async saveToken(
        propertyId: string,
        token: HostPMSOAuthToken
      ): Promise<void> {
        tokenCache.set(propertyId, token);
      },

      async getLastSyncTime(propertyId: string): Promise<Date | null> {
        return syncTimeCache.get(propertyId) || null;
      },

      async updateLastSyncTime(
        propertyId: string,
        timestamp: Date
      ): Promise<void> {
        syncTimeCache.set(propertyId, timestamp);
      },
    };
  }
}

/**
 * AWS Lambda handler for scheduled polling (via EventBridge)
 */
export interface LambdaScheduledEvent {
  source: string;
  time: string;
  detail?: any;
}

export function createPollingLambdaHandler(config: OAuthPollingConfig) {
  return async (event: LambdaScheduledEvent): Promise<SyncResult> => {
    const client = new HostPMSOAuthClient(config);

    try {
      const result = await client.performIncrementalSync();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        records_processed: 0,
        records_saved: 0,
        records_failed: 0,
        duration_ms: 0,
        errors: [errorMessage],
      };
    }
  };
}
