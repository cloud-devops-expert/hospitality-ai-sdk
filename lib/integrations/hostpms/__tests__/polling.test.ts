/**
 * HostPMS OAuth Polling Handler Tests
 */

import {
  HostPMSOAuthClient,
  type HttpClient,
  type TokenStorage,
  type OAuthPollingConfig,
} from '../polling';
import type {
  HostPMSOAuthToken,
  HostPMSReservation,
  HostPMSReservationsResponse,
} from '../types';

describe('HostPMS OAuth Polling Handler', () => {
  const PROPERTY_ID = 'PT-LIS-001';
  const CLIENT_ID = 'test-client-id';
  const CLIENT_SECRET = 'test-client-secret';

  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockTokenStorage: jest.Mocked<TokenStorage>;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
    };

    // Create mock token storage
    mockTokenStorage = {
      getToken: jest.fn(),
      saveToken: jest.fn(),
      getLastSyncTime: jest.fn(),
      updateLastSyncTime: jest.fn(),
    };
  });

  // ==================== OAuth Token Management Tests ====================

  describe('OAuth Token Management', () => {
    it('should request new token on first call', async () => {
      const mockToken: HostPMSOAuthToken = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000),
      };

      mockTokenStorage.getToken.mockResolvedValue(null);
      mockHttpClient.post.mockResolvedValue({ data: mockToken });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const accessToken = await client.getAccessToken();

      expect(accessToken).toBe('test-access-token');
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.hostpms.com/oauth/v1/tokens',
        {
          grant_type: 'client_credentials',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(mockTokenStorage.saveToken).toHaveBeenCalledWith(
        PROPERTY_ID,
        expect.objectContaining({
          access_token: 'test-access-token',
          created_at: expect.any(Number),
        })
      );
    });

    it('should reuse valid cached token', async () => {
      const mockToken: HostPMSOAuthToken = {
        access_token: 'cached-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000), // Created now
      };

      mockTokenStorage.getToken.mockResolvedValue(mockToken);

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const accessToken = await client.getAccessToken();

      expect(accessToken).toBe('cached-token');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should refresh expired token', async () => {
      // Token expired 10 minutes ago
      const expiredToken: HostPMSOAuthToken = {
        access_token: 'expired-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000) - 4200, // Expired
      };

      const newToken: HostPMSOAuthToken = {
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000),
      };

      mockTokenStorage.getToken.mockResolvedValue(expiredToken);
      mockHttpClient.post.mockResolvedValue({ data: newToken });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const accessToken = await client.getAccessToken();

      expect(accessToken).toBe('new-token');
      expect(mockHttpClient.post).toHaveBeenCalled();
      expect(mockTokenStorage.saveToken).toHaveBeenCalledWith(
        PROPERTY_ID,
        expect.objectContaining({ access_token: 'new-token' })
      );
    });

    it('should refresh token proactively (5-minute buffer)', async () => {
      // Token expires in 4 minutes (within 5-minute buffer)
      const soonToExpireToken: HostPMSOAuthToken = {
        access_token: 'soon-to-expire',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000) - 3360, // Expires in 4 min
      };

      const newToken: HostPMSOAuthToken = {
        access_token: 'refreshed-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000),
      };

      mockTokenStorage.getToken.mockResolvedValue(soonToExpireToken);
      mockHttpClient.post.mockResolvedValue({ data: newToken });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const accessToken = await client.getAccessToken();

      expect(accessToken).toBe('refreshed-token');
      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it('should handle OAuth token request errors', async () => {
      mockTokenStorage.getToken.mockResolvedValue(null);
      mockHttpClient.post.mockRejectedValue(new Error('OAuth server error'));

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);

      await expect(client.getAccessToken()).rejects.toThrow(
        'Failed to obtain OAuth token'
      );
    });
  });

  // ==================== Reservation Fetching Tests ====================

  describe('Reservation Fetching', () => {
    const mockToken: HostPMSOAuthToken = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
      created_at: Math.floor(Date.now() / 1000),
    };

    const mockReservation: HostPMSReservation = {
      reservation_id: 'RSV-123',
      property_id: PROPERTY_ID,
      guest: { name: 'João Silva' },
      room: { type: 'Quarto Duplo', number: '201' },
      dates: {
        check_in: '2024-03-20',
        check_out: '2024-03-25',
        created_at: '2024-03-01T10:00:00Z',
      },
      pricing: { total: 450, currency: 'EUR' },
      status: 'confirmado',
      channel: 'booking_com',
    };

    beforeEach(() => {
      mockTokenStorage.getToken.mockResolvedValue(mockToken);
    });

    it('should fetch reservations from API', async () => {
      const mockResponse: HostPMSReservationsResponse = {
        reservations: [mockReservation],
        total: 1,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.fetchReservations();

      expect(result.reservations).toHaveLength(1);
      expect(result.reservations[0].reservation_id).toBe('RSV-123');
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `https://api.hostpms.com/api/v1/properties/${PROPERTY_ID}/reservations`,
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          params: {
            limit: 1000,
            offset: 0,
          },
        })
      );
    });

    it('should support incremental sync with updatedSince', async () => {
      const mockResponse: HostPMSReservationsResponse = {
        reservations: [mockReservation],
        total: 1,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const updatedSince = new Date('2024-03-01T00:00:00Z');
      const result = await client.fetchReservations({ updatedSince });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            updated_since: updatedSince.toISOString(),
          }),
        })
      );
    });

    it('should support pagination with limit and offset', async () => {
      const mockResponse: HostPMSReservationsResponse = {
        reservations: [mockReservation],
        total: 100,
        page: 2,
        limit: 50,
        has_more: true,
      };

      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.fetchReservations({ limit: 50, offset: 50 });

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: {
            limit: 50,
            offset: 50,
          },
        })
      );
    });

    it('should handle API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API error'));

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);

      await expect(client.fetchReservations()).rejects.toThrow(
        'Failed to fetch reservations'
      );
    });
  });

  // ==================== Automatic Pagination Tests ====================

  describe('Automatic Pagination', () => {
    const mockToken: HostPMSOAuthToken = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
      created_at: Math.floor(Date.now() / 1000),
    };

    beforeEach(() => {
      mockTokenStorage.getToken.mockResolvedValue(mockToken);
    });

    it('should fetch all pages automatically', async () => {
      const page1: HostPMSReservationsResponse = {
        reservations: [
          { reservation_id: 'RSV-1' } as HostPMSReservation,
          { reservation_id: 'RSV-2' } as HostPMSReservation,
        ],
        total: 4,
        page: 1,
        limit: 2,
        has_more: true,
      };

      const page2: HostPMSReservationsResponse = {
        reservations: [
          { reservation_id: 'RSV-3' } as HostPMSReservation,
          { reservation_id: 'RSV-4' } as HostPMSReservation,
        ],
        total: 4,
        page: 2,
        limit: 2,
        has_more: false,
      };

      mockHttpClient.get
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: page2 });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.fetchAllReservations();

      expect(result).toHaveLength(4);
      expect(result[0].reservation_id).toBe('RSV-1');
      expect(result[3].reservation_id).toBe('RSV-4');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    });

    it('should respect maxPages limit', async () => {
      const mockPage: HostPMSReservationsResponse = {
        reservations: [{ reservation_id: 'RSV-1' } as HostPMSReservation],
        total: 100,
        page: 1,
        limit: 1,
        has_more: true,
      };

      mockHttpClient.get.mockResolvedValue({ data: mockPage });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.fetchAllReservations({ maxPages: 3 });

      expect(mockHttpClient.get).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should call onReservation callback for each reservation', async () => {
      const mockResponse: HostPMSReservationsResponse = {
        reservations: [
          { reservation_id: 'RSV-1' } as HostPMSReservation,
          { reservation_id: 'RSV-2' } as HostPMSReservation,
        ],
        total: 2,
        page: 1,
        limit: 10,
        has_more: false,
      };

      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const onReservation = jest.fn().mockResolvedValue(undefined);

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
        onReservation,
      };

      const client = new HostPMSOAuthClient(config);
      await client.fetchAllReservations();

      expect(onReservation).toHaveBeenCalledTimes(2);
      expect(onReservation).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ reservation_id: 'RSV-1' })
      );
      expect(onReservation).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ reservation_id: 'RSV-2' })
      );
    });
  });

  // ==================== Incremental Sync Tests ====================

  describe('Incremental Sync', () => {
    const mockToken: HostPMSOAuthToken = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
      created_at: Math.floor(Date.now() / 1000),
    };

    beforeEach(() => {
      mockTokenStorage.getToken.mockResolvedValue(mockToken);
    });

    it('should perform incremental sync successfully', async () => {
      const lastSyncTime = new Date('2024-03-01T00:00:00Z');
      const mockReservations = [
        { reservation_id: 'RSV-1' } as HostPMSReservation,
      ];

      const mockResponse: HostPMSReservationsResponse = {
        reservations: mockReservations,
        total: 1,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockTokenStorage.getLastSyncTime.mockResolvedValue(lastSyncTime);
      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.performIncrementalSync();

      expect(result.success).toBe(true);
      expect(result.records_processed).toBe(1);
      expect(result.records_saved).toBe(1);
      expect(result.records_failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockTokenStorage.updateLastSyncTime).toHaveBeenCalledWith(
        PROPERTY_ID,
        expect.any(Date)
      );
    });

    it('should handle first sync (no last sync time)', async () => {
      const mockResponse: HostPMSReservationsResponse = {
        reservations: [{ reservation_id: 'RSV-1' } as HostPMSReservation],
        total: 1,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockTokenStorage.getLastSyncTime.mockResolvedValue(null);
      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.performIncrementalSync();

      expect(result.success).toBe(true);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({
            updated_since: expect.anything(),
          }),
        })
      );
    });

    it('should call onBatchComplete callback', async () => {
      const mockReservations = [
        { reservation_id: 'RSV-1' } as HostPMSReservation,
      ];

      const mockResponse: HostPMSReservationsResponse = {
        reservations: mockReservations,
        total: 1,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockTokenStorage.getLastSyncTime.mockResolvedValue(null);
      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const onBatchComplete = jest.fn().mockResolvedValue(undefined);

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
        onBatchComplete,
      };

      const client = new HostPMSOAuthClient(config);
      await client.performIncrementalSync();

      expect(onBatchComplete).toHaveBeenCalledWith(mockReservations);
    });

    it('should handle batch processing errors', async () => {
      const mockResponse: HostPMSReservationsResponse = {
        reservations: [{ reservation_id: 'RSV-1' } as HostPMSReservation],
        total: 1,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockTokenStorage.getLastSyncTime.mockResolvedValue(null);
      mockHttpClient.get.mockResolvedValue({ data: mockResponse });

      const onBatchComplete = jest
        .fn()
        .mockRejectedValue(new Error('Batch processing failed'));

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
        onBatchComplete,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.performIncrementalSync();

      expect(result.success).toBe(false);
      expect(result.records_processed).toBe(1);
      expect(result.records_failed).toBe(1);
      expect(result.errors).toContain('Batch processing failed: Batch processing failed');
    });

    it('should call onError callback on errors', async () => {
      mockTokenStorage.getLastSyncTime.mockResolvedValue(null);
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      const onError = jest.fn().mockResolvedValue(undefined);

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
        onError,
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.performIncrementalSync();

      expect(result.success).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ==================== Retry Logic Tests ====================

  describe('Retry Logic', () => {
    const mockToken: HostPMSOAuthToken = {
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
      created_at: Math.floor(Date.now() / 1000),
    };

    beforeEach(() => {
      mockTokenStorage.getToken.mockResolvedValue(mockToken);
    });

    it('should retry failed operations with exponential backoff', async () => {
      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
        retryDelayMs: 10, // Short delay for testing
      };

      const client = new HostPMSOAuthClient(config);

      let attemptCount = 0;
      const testFn = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary error');
        }
        return Promise.resolve('success');
      });

      const result = await client.withRetry(testFn, 3);

      expect(result).toBe('success');
      expect(testFn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries exceeded', async () => {
      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
        retryDelayMs: 10,
      };

      const client = new HostPMSOAuthClient(config);

      const testFn = jest.fn().mockRejectedValue(new Error('Permanent error'));

      await expect(client.withRetry(testFn, 2)).rejects.toThrow(
        'Permanent error'
      );
      expect(testFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  // ==================== Configuration Tests ====================

  describe('Configuration', () => {
    it('should use default base URL if not provided', async () => {
      const mockToken: HostPMSOAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000),
      };

      mockTokenStorage.getToken.mockResolvedValue(null);
      mockHttpClient.post.mockResolvedValue({ data: mockToken });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      await client.getAccessToken();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://api.hostpms.com/oauth/v1/tokens',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use custom base URL if provided', async () => {
      const mockToken: HostPMSOAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000),
      };

      mockTokenStorage.getToken.mockResolvedValue(null);
      mockHttpClient.post.mockResolvedValue({ data: mockToken });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        base_url: 'https://custom-api.example.com',
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);
      await client.getAccessToken();

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'https://custom-api.example.com/oauth/v1/tokens',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});
