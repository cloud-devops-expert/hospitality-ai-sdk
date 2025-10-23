/**
 * HostPMS Integration Tests
 * End-to-end tests for complete webhook + polling + mapper flow
 */

import crypto from 'crypto';
import {
  handleHostPMSWebhook,
  resetIdempotencyCache,
  type APIGatewayProxyEvent,
  type WebhookHandlerOptions,
} from '../webhook';
import {
  HostPMSOAuthClient,
  type HttpClient,
  type TokenStorage,
  type OAuthPollingConfig,
} from '../polling';
import {
  mapHostPMSToUnified,
  validateHostPMSReservation,
} from '../mapper';
import type {
  HostPMSWebhookEvent,
  HostPMSReservation,
  HostPMSOAuthToken,
  HostPMSReservationsResponse,
  UnifiedBooking,
} from '../types';

describe('HostPMS Integration End-to-End', () => {
  const PROPERTY_ID = 'PT-LIS-001';
  const CLIENT_ID = 'test-client-id';
  const CLIENT_SECRET = 'test-client-secret';
  const WEBHOOK_SECRET = 'test-webhook-secret';

  beforeEach(() => {
    resetIdempotencyCache();
  });

  // ==================== Webhook → Mapper Flow Tests ====================

  describe('Webhook to Unified Booking Flow', () => {
    it('should process webhook event and transform to unified booking', async () => {
      // 1. Create HostPMS webhook payload
      const hostpmsReservation: HostPMSReservation = {
        reservation_id: 'RSV-12345',
        property_id: PROPERTY_ID,
        guest: {
          name: 'João Silva',
          email: 'joao.silva@example.pt',
          phone: '+351912345678',
          country: 'PT',
        },
        room: {
          type: 'Quarto Duplo',
          number: '201',
        },
        dates: {
          check_in: '2024-03-20',
          check_out: '2024-03-25',
          created_at: '2024-03-01T10:00:00Z',
        },
        pricing: {
          total: 450.0,
          currency: 'EUR',
          rate_plan: 'Flexível',
        },
        status: 'confirmado',
        channel: 'booking_com',
        payment_method: 'credit_card',
      };

      const webhookEvent: HostPMSWebhookEvent = {
        event: 'reservation.created',
        timestamp: new Date().toISOString(),
        property_id: PROPERTY_ID,
        data: hostpmsReservation,
      };

      // 2. Create signed webhook request
      const payload = JSON.stringify(webhookEvent);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + payload;
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      const event: APIGatewayProxyEvent = {
        body: payload,
        headers: {
          'X-HostPMS-Signature': signature,
          'X-HostPMS-Timestamp': timestamp,
        },
        pathParameters: null,
        requestContext: {
          requestId: 'test-request-id',
          requestTime: new Date().toISOString(),
        },
      };

      // 3. Process webhook with transformation
      let receivedReservation: HostPMSReservation | null = null;

      const options: WebhookHandlerOptions = {
        webhookSecret: WEBHOOK_SECRET,
        propertyId: PROPERTY_ID,
        onEvent: async (webhookEvent) => {
          receivedReservation = webhookEvent.data as HostPMSReservation;
        },
      };

      const webhookResult = await handleHostPMSWebhook(event, options);

      // 4. Verify webhook processing
      expect(webhookResult.statusCode).toBe(200);
      expect(receivedReservation).not.toBeNull();

      // 5. Transform to unified booking
      const unifiedBooking = mapHostPMSToUnified(receivedReservation!);

      // 6. Verify transformation
      expect(unifiedBooking.external_id).toBe('RSV-12345');
      expect(unifiedBooking.source).toBe('hostpms');
      expect(unifiedBooking.hotel_id).toBe(PROPERTY_ID);
      expect(unifiedBooking.guest_name).toBe('João Silva');
      expect(unifiedBooking.guest_email).toBe('joao.silva@example.pt');
      expect(unifiedBooking.room_type).toBe('Double Room'); // Mapped from Portuguese
      expect(unifiedBooking.room_number).toBe('201');
      expect(unifiedBooking.status).toBe('confirmed'); // Mapped from Portuguese
      expect(unifiedBooking.channel).toBe('ota'); // booking_com → ota
      expect(unifiedBooking.total_amount).toBe(450.0);
      expect(unifiedBooking.currency).toBe('EUR');
      expect(unifiedBooking.lead_time).toBe(18); // Mar 1 10:00 → Mar 20 00:00
      expect(unifiedBooking.length_of_stay).toBe(5); // 5 nights
    });

    it('should handle multiple webhook event types', async () => {
      const eventTypes: Array<{
        type: 'reservation.created' | 'reservation.updated' | 'reservation.cancelled';
        status: 'confirmado' | 'cancelado';
      }> = [
        { type: 'reservation.created', status: 'confirmado' },
        { type: 'reservation.updated', status: 'confirmado' },
        { type: 'reservation.cancelled', status: 'cancelado' },
      ];

      for (const { type, status } of eventTypes) {
        const reservation: HostPMSReservation = {
          reservation_id: 'RSV-123',
          property_id: PROPERTY_ID,
          guest: { name: 'Test Guest' },
          room: { type: 'Suite', number: '101' },
          dates: {
            check_in: '2024-03-20',
            check_out: '2024-03-25',
            created_at: '2024-03-01T10:00:00Z',
          },
          pricing: { total: 500, currency: 'EUR' },
          status,
          channel: 'direto',
        };

        const webhookEvent: HostPMSWebhookEvent = {
          event: type,
          timestamp: new Date().toISOString(),
          property_id: PROPERTY_ID,
          data: reservation,
        };

        const payload = JSON.stringify(webhookEvent);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signedPayload = timestamp + payload;
        const signature = crypto
          .createHmac('sha256', WEBHOOK_SECRET)
          .update(signedPayload)
          .digest('hex');

        const event: APIGatewayProxyEvent = {
          body: payload,
          headers: {
            'X-HostPMS-Signature': signature,
            'X-HostPMS-Timestamp': timestamp,
          },
          pathParameters: null,
          requestContext: {
            requestId: `test-${type}`,
            requestTime: new Date().toISOString(),
          },
        };

        const options: WebhookHandlerOptions = {
          webhookSecret: WEBHOOK_SECRET,
          propertyId: PROPERTY_ID,
        };

        const result = await handleHostPMSWebhook(event, options);
        expect(result.statusCode).toBe(200);

        // Reset cache for next iteration
        resetIdempotencyCache();
      }
    });

    it('should reject invalid reservations before processing', async () => {
      const invalidReservation: HostPMSReservation = {
        reservation_id: '',
        property_id: PROPERTY_ID,
        guest: { name: '' }, // Invalid - missing name
        room: { type: '', number: '' }, // Invalid
        dates: {
          check_in: '2024-03-25',
          check_out: '2024-03-20', // Invalid - check out before check in
          created_at: '2024-03-01T10:00:00Z',
        },
        pricing: { total: -100, currency: 'EUR' }, // Invalid - negative amount
        status: 'confirmado',
        channel: 'direto',
      };

      const validation = validateHostPMSReservation(invalidReservation);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing reservation_id');
      expect(validation.errors).toContain('Missing guest.name');
      expect(validation.errors).toContain('check_out must be after check_in');
      expect(validation.errors).toContain('pricing.total cannot be negative');
    });
  });

  // ==================== Polling → Mapper Flow Tests ====================

  describe('Polling to Unified Booking Flow', () => {
    let mockHttpClient: jest.Mocked<HttpClient>;
    let mockTokenStorage: jest.Mocked<TokenStorage>;

    beforeEach(() => {
      mockHttpClient = {
        post: jest.fn(),
        get: jest.fn(),
      };

      mockTokenStorage = {
        getToken: jest.fn(),
        saveToken: jest.fn(),
        getLastSyncTime: jest.fn(),
        updateLastSyncTime: jest.fn(),
      };
    });

    it('should poll API, fetch reservations, and transform to unified bookings', async () => {
      const mockToken: HostPMSOAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000),
      };

      const hostpmsReservations: HostPMSReservation[] = [
        {
          reservation_id: 'RSV-001',
          property_id: PROPERTY_ID,
          guest: { name: 'Maria Santos' },
          room: { type: 'Quarto Individual', number: '101' },
          dates: {
            check_in: '2024-04-10',
            check_out: '2024-04-15',
            created_at: '2024-04-01T10:00:00Z',
          },
          pricing: { total: 300, currency: 'EUR' },
          status: 'confirmado',
          channel: 'direto',
        },
        {
          reservation_id: 'RSV-002',
          property_id: PROPERTY_ID,
          guest: { name: 'Pedro Costa' },
          room: { type: 'Suite Presidencial', number: '501' },
          dates: {
            check_in: '2024-04-15',
            check_out: '2024-04-20',
            created_at: '2024-04-05T14:00:00Z',
          },
          pricing: { total: 1200, currency: 'EUR' },
          status: 'pendente',
          channel: 'agencia',
        },
      ];

      const apiResponse: HostPMSReservationsResponse = {
        reservations: hostpmsReservations,
        total: 2,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockTokenStorage.getToken.mockResolvedValue(mockToken);
      mockTokenStorage.getLastSyncTime.mockResolvedValue(null);
      mockHttpClient.get.mockResolvedValue({ data: apiResponse });

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
      };

      const client = new HostPMSOAuthClient(config);

      // Poll for reservations
      const reservations = await client.fetchAllReservations();

      expect(reservations).toHaveLength(2);

      // Transform to unified bookings
      const unifiedBookings: UnifiedBooking[] = reservations.map((res) =>
        mapHostPMSToUnified(res)
      );

      // Verify first booking
      expect(unifiedBookings[0].external_id).toBe('RSV-001');
      expect(unifiedBookings[0].guest_name).toBe('Maria Santos');
      expect(unifiedBookings[0].room_type).toBe('Single Room');
      expect(unifiedBookings[0].status).toBe('confirmed');
      expect(unifiedBookings[0].channel).toBe('direct');
      expect(unifiedBookings[0].lead_time).toBe(8); // Apr 1 10:00 → Apr 10 00:00
      expect(unifiedBookings[0].length_of_stay).toBe(5);

      // Verify second booking
      expect(unifiedBookings[1].external_id).toBe('RSV-002');
      expect(unifiedBookings[1].guest_name).toBe('Pedro Costa');
      expect(unifiedBookings[1].room_type).toBe('Presidential Suite');
      expect(unifiedBookings[1].status).toBe('pending');
      expect(unifiedBookings[1].channel).toBe('agent');
      expect(unifiedBookings[1].lead_time).toBe(9); // Apr 5 14:00 → Apr 15 00:00
      expect(unifiedBookings[1].length_of_stay).toBe(5);
    });

    it('should perform incremental sync and process batch', async () => {
      const mockToken: HostPMSOAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
        created_at: Math.floor(Date.now() / 1000),
      };

      const lastSyncTime = new Date('2024-03-01T00:00:00Z');

      const hostpmsReservations: HostPMSReservation[] = [
        {
          reservation_id: 'RSV-NEW-001',
          property_id: PROPERTY_ID,
          guest: { name: 'New Guest' },
          room: { type: 'Quarto Duplo', number: '202' },
          dates: {
            check_in: '2024-03-20',
            check_out: '2024-03-22',
            created_at: '2024-03-15T10:00:00Z',
          },
          pricing: { total: 200, currency: 'EUR' },
          status: 'confirmado',
          channel: 'booking_com',
        },
      ];

      const apiResponse: HostPMSReservationsResponse = {
        reservations: hostpmsReservations,
        total: 1,
        page: 1,
        limit: 1000,
        has_more: false,
      };

      mockTokenStorage.getToken.mockResolvedValue(mockToken);
      mockTokenStorage.getLastSyncTime.mockResolvedValue(lastSyncTime);
      mockHttpClient.get.mockResolvedValue({ data: apiResponse });

      const processedBookings: UnifiedBooking[] = [];

      const config: OAuthPollingConfig = {
        property_id: PROPERTY_ID,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        httpClient: mockHttpClient,
        tokenStorage: mockTokenStorage,
        onBatchComplete: async (reservations) => {
          // Transform and store
          const unified = reservations.map((res) => mapHostPMSToUnified(res));
          processedBookings.push(...unified);
        },
      };

      const client = new HostPMSOAuthClient(config);
      const result = await client.performIncrementalSync();

      expect(result.success).toBe(true);
      expect(result.records_processed).toBe(1);
      expect(result.records_saved).toBe(1);
      expect(processedBookings).toHaveLength(1);
      expect(processedBookings[0].external_id).toBe('RSV-NEW-001');
      expect(processedBookings[0].room_type).toBe('Double Room');
      expect(mockTokenStorage.updateLastSyncTime).toHaveBeenCalled();
    });
  });

  // ==================== Data Validation Flow Tests ====================

  describe('Data Validation and Error Handling', () => {
    it('should validate Portuguese special characters', () => {
      const reservation: HostPMSReservation = {
        reservation_id: 'RSV-PT-001',
        property_id: PROPERTY_ID,
        guest: {
          name: 'José António Gonçalves',
          email: 'jose.goncalves@exemplo.pt',
        },
        room: { type: 'Quarto Duplo', number: '101' },
        dates: {
          check_in: '2024-03-20',
          check_out: '2024-03-25',
          created_at: '2024-03-01T10:00:00Z',
        },
        pricing: { total: 400, currency: 'EUR' },
        status: 'confirmado',
        channel: 'direto',
      };

      const unified = mapHostPMSToUnified(reservation);

      expect(unified.guest_name).toBe('José António Gonçalves');
      expect(unified.guest_email).toBe('jose.goncalves@exemplo.pt');
    });

    it('should handle Spanish room types', () => {
      const reservation: HostPMSReservation = {
        reservation_id: 'RSV-ES-001',
        property_id: 'ES-MAD-001',
        guest: { name: 'Carlos García' },
        room: { type: 'Habitación Doble', number: '301' },
        dates: {
          check_in: '2024-03-20',
          check_out: '2024-03-25',
          created_at: '2024-03-01T10:00:00Z',
        },
        pricing: { total: 350, currency: 'EUR' },
        status: 'confirmado',
        channel: 'direto',
      };

      const unified = mapHostPMSToUnified(reservation);

      expect(unified.room_type).toBe('Double Room'); // Spanish → English
    });

    it('should handle unknown room types gracefully', () => {
      const reservation: HostPMSReservation = {
        reservation_id: 'RSV-UNKNOWN-001',
        property_id: PROPERTY_ID,
        guest: { name: 'Test Guest' },
        room: { type: 'Quarto Personalizado VIP', number: '999' },
        dates: {
          check_in: '2024-03-20',
          check_out: '2024-03-25',
          created_at: '2024-03-01T10:00:00Z',
        },
        pricing: { total: 1000, currency: 'EUR' },
        status: 'confirmado',
        channel: 'direto',
      };

      const unified = mapHostPMSToUnified(reservation);

      // Should keep original if no mapping found
      expect(unified.room_type).toBe('Quarto Personalizado VIP');
    });

    it('should calculate ML features correctly for edge cases', () => {
      // Same-day booking
      const sameDayReservation: HostPMSReservation = {
        reservation_id: 'RSV-SAMEDAY',
        property_id: PROPERTY_ID,
        guest: { name: 'Walk-in Guest' },
        room: { type: 'Quarto Duplo', number: '101' },
        dates: {
          check_in: '2024-03-20',
          check_out: '2024-03-21',
          created_at: '2024-03-20T10:00:00Z',
        },
        pricing: { total: 100, currency: 'EUR' },
        status: 'confirmado',
        channel: 'direto',
      };

      const unified = mapHostPMSToUnified(sameDayReservation);

      expect(unified.lead_time).toBe(0); // Same day
      expect(unified.length_of_stay).toBe(1); // 1 night minimum
    });

    it('should handle long stays correctly', () => {
      const longStayReservation: HostPMSReservation = {
        reservation_id: 'RSV-LONG',
        property_id: PROPERTY_ID,
        guest: { name: 'Long Stay Guest' },
        room: { type: 'Apartamento', number: '501' },
        dates: {
          check_in: '2024-01-01',
          check_out: '2024-01-31',
          created_at: '2023-12-01T10:00:00Z',
        },
        pricing: { total: 2000, currency: 'EUR' },
        status: 'confirmado',
        channel: 'direto',
      };

      const unified = mapHostPMSToUnified(longStayReservation);

      expect(unified.lead_time).toBe(30); // 30 days (Dec 1 10:00 → Jan 1 00:00)
      expect(unified.length_of_stay).toBe(30); // 30 nights
    });
  });

  // ==================== Complete Integration Scenarios ====================

  describe('Complete Integration Scenarios', () => {
    it('should handle full hotel day workflow (webhooks + polling)', async () => {
      const processedBookings: UnifiedBooking[] = [];

      // Scenario: Hotel receives 3 webhooks during the day
      const webhookEvents: Array<{
        type: 'reservation.created' | 'reservation.updated' | 'reservation.check_in';
        reservation: HostPMSReservation;
      }> = [
        {
          type: 'reservation.created',
          reservation: {
            reservation_id: 'RSV-WEBHOOK-001',
            property_id: PROPERTY_ID,
            guest: { name: 'Webhook Guest 1' },
            room: { type: 'Quarto Duplo', number: '201' },
            dates: {
              check_in: '2024-03-25',
              check_out: '2024-03-27',
              created_at: '2024-03-20T10:00:00Z',
            },
            pricing: { total: 200, currency: 'EUR' },
            status: 'confirmado',
            channel: 'booking_com',
          },
        },
        {
          type: 'reservation.updated',
          reservation: {
            reservation_id: 'RSV-WEBHOOK-001',
            property_id: PROPERTY_ID,
            guest: { name: 'Webhook Guest 1 Updated' },
            room: { type: 'Suite', number: '301' }, // Upgraded
            dates: {
              check_in: '2024-03-25',
              check_out: '2024-03-27',
              created_at: '2024-03-20T10:00:00Z',
              updated_at: '2024-03-20T15:00:00Z',
            },
            pricing: { total: 350, currency: 'EUR' },
            status: 'confirmado',
            channel: 'booking_com',
          },
        },
        {
          type: 'reservation.check_in',
          reservation: {
            reservation_id: 'RSV-WEBHOOK-002',
            property_id: PROPERTY_ID,
            guest: { name: 'Checked In Guest' },
            room: { type: 'Quarto Individual', number: '101' },
            dates: {
              check_in: '2024-03-20',
              check_out: '2024-03-22',
              created_at: '2024-03-15T10:00:00Z',
            },
            pricing: { total: 150, currency: 'EUR' },
            status: 'check_in',
            channel: 'direto',
          },
        },
      ];

      // Process webhooks
      for (const { type, reservation } of webhookEvents) {
        const webhookEvent: HostPMSWebhookEvent = {
          event: type,
          timestamp: new Date().toISOString(),
          property_id: PROPERTY_ID,
          data: reservation,
        };

        const payload = JSON.stringify(webhookEvent);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signedPayload = timestamp + payload;
        const signature = crypto
          .createHmac('sha256', WEBHOOK_SECRET)
          .update(signedPayload)
          .digest('hex');

        const event: APIGatewayProxyEvent = {
          body: payload,
          headers: {
            'X-HostPMS-Signature': signature,
            'X-HostPMS-Timestamp': timestamp,
          },
          pathParameters: null,
          requestContext: {
            requestId: `test-${type}`,
            requestTime: new Date().toISOString(),
          },
        };

        const options: WebhookHandlerOptions = {
          webhookSecret: WEBHOOK_SECRET,
          propertyId: PROPERTY_ID,
          onEvent: async (webhookEvent) => {
            const unified = mapHostPMSToUnified(
              webhookEvent.data as HostPMSReservation
            );
            processedBookings.push(unified);
          },
        };

        const result = await handleHostPMSWebhook(event, options);
        expect(result.statusCode).toBe(200);

        // Reset for next webhook
        resetIdempotencyCache();
      }

      // Verify webhook processing
      expect(processedBookings).toHaveLength(3);
      expect(processedBookings[0].external_id).toBe('RSV-WEBHOOK-001');
      expect(processedBookings[1].guest_name).toBe('Webhook Guest 1 Updated');
      expect(processedBookings[1].room_type).toBe('Suite');
      expect(processedBookings[2].status).toBe('checked_in');
    });
  });
});
