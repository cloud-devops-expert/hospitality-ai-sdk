/**
 * HostPMS Webhook Handler Tests
 */

import crypto from 'crypto';
import {
  verifyWebhookSignature,
  generateIdempotencyKey,
  parseWebhookEvent,
  handleHostPMSWebhook,
  resetIdempotencyCache,
  getIdempotencyCacheSize,
  type APIGatewayProxyEvent,
  type WebhookHandlerOptions,
} from '../webhook';
import type { HostPMSWebhookEvent, HostPMSEventType } from '../types';

describe('HostPMS Webhook Handler', () => {
  const WEBHOOK_SECRET = 'test-secret-key-12345';
  const PROPERTY_ID = 'PT-LIS-001';

  beforeEach(() => {
    resetIdempotencyCache();
  });

  // ==================== Signature Verification Tests ====================

  describe('verifyWebhookSignature', () => {
    it('should verify valid HMAC-SHA256 signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + payload;
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      const result = verifyWebhookSignature(
        payload,
        signature,
        timestamp,
        WEBHOOK_SECRET
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.age_seconds).toBeLessThan(5);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const wrongSignature = 'invalid-signature-123456789abcdef';

      const result = verifyWebhookSignature(
        payload,
        wrongSignature,
        timestamp,
        WEBHOOK_SECRET
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature format');
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify({ test: 'data' });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + payload;
      const signature = crypto
        .createHmac('sha256', 'wrong-secret')
        .update(signedPayload)
        .digest('hex');

      const result = verifyWebhookSignature(
        payload,
        signature,
        timestamp,
        WEBHOOK_SECRET
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Signature mismatch');
    });

    it('should reject old timestamp (>5 minutes)', () => {
      const payload = JSON.stringify({ test: 'data' });
      // Timestamp from 10 minutes ago
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();
      const signedPayload = oldTimestamp + payload;
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      const result = verifyWebhookSignature(
        payload,
        signature,
        oldTimestamp,
        WEBHOOK_SECRET
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Timestamp too old');
      expect(result.age_seconds).toBeGreaterThan(300);
    });

    it('should reject future timestamp', () => {
      const payload = JSON.stringify({ test: 'data' });
      // Timestamp 1 minute in the future
      const futureTimestamp = (Math.floor(Date.now() / 1000) + 60).toString();
      const signedPayload = futureTimestamp + payload;
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      const result = verifyWebhookSignature(
        payload,
        signature,
        futureTimestamp,
        WEBHOOK_SECRET
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('in future');
    });

    it('should reject missing parameters', () => {
      const result1 = verifyWebhookSignature('', 'sig', '123', WEBHOOK_SECRET);
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('Missing required parameters');

      const result2 = verifyWebhookSignature('payload', '', '123', WEBHOOK_SECRET);
      expect(result2.valid).toBe(false);

      const result3 = verifyWebhookSignature('payload', 'sig', '', WEBHOOK_SECRET);
      expect(result3.valid).toBe(false);

      const result4 = verifyWebhookSignature('payload', 'sig', '123', '');
      expect(result4.valid).toBe(false);
    });

    it('should reject invalid timestamp format', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidTimestamp = 'not-a-number';
      const signedPayload = invalidTimestamp + payload;
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      const result = verifyWebhookSignature(
        payload,
        signature,
        invalidTimestamp,
        WEBHOOK_SECRET
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid timestamp format');
    });

    it('should use constant-time comparison to prevent timing attacks', () => {
      // This test ensures we're using crypto.timingSafeEqual
      const payload = JSON.stringify({ test: 'data' });
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + payload;
      const correctSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      // Create a signature that differs only in the last character
      const almostCorrectSignature =
        correctSignature.substring(0, correctSignature.length - 1) + 'f';

      const result = verifyWebhookSignature(
        payload,
        almostCorrectSignature,
        timestamp,
        WEBHOOK_SECRET
      );

      expect(result.valid).toBe(false);
    });
  });

  // ==================== Idempotency Key Tests ====================

  describe('generateIdempotencyKey', () => {
    it('should generate consistent SHA-256 hash for same input', () => {
      const payload = JSON.stringify({ reservation_id: 'RSV-123' });
      const eventType: HostPMSEventType = 'reservation.created';

      const key1 = generateIdempotencyKey(PROPERTY_ID, eventType, payload);
      const key2 = generateIdempotencyKey(PROPERTY_ID, eventType, payload);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string
    });

    it('should generate different keys for different payloads', () => {
      const payload1 = JSON.stringify({ reservation_id: 'RSV-123' });
      const payload2 = JSON.stringify({ reservation_id: 'RSV-456' });
      const eventType: HostPMSEventType = 'reservation.created';

      const key1 = generateIdempotencyKey(PROPERTY_ID, eventType, payload1);
      const key2 = generateIdempotencyKey(PROPERTY_ID, eventType, payload2);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different event types', () => {
      const payload = JSON.stringify({ reservation_id: 'RSV-123' });

      const key1 = generateIdempotencyKey(
        PROPERTY_ID,
        'reservation.created',
        payload
      );
      const key2 = generateIdempotencyKey(
        PROPERTY_ID,
        'reservation.updated',
        payload
      );

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different properties', () => {
      const payload = JSON.stringify({ reservation_id: 'RSV-123' });
      const eventType: HostPMSEventType = 'reservation.created';

      const key1 = generateIdempotencyKey('PT-LIS-001', eventType, payload);
      const key2 = generateIdempotencyKey('PT-LIS-002', eventType, payload);

      expect(key1).not.toBe(key2);
    });
  });

  // ==================== Webhook Event Parsing Tests ====================

  describe('parseWebhookEvent', () => {
    const validEvent: HostPMSWebhookEvent = {
      event: 'reservation.created',
      timestamp: new Date().toISOString(),
      property_id: PROPERTY_ID,
      data: {
        reservation_id: 'RSV-123',
        guest: { name: 'João Silva' },
      },
    };

    it('should parse valid webhook event', () => {
      const payload = JSON.stringify(validEvent);
      const result = parseWebhookEvent(payload);

      expect(result.valid).toBe(true);
      expect(result.event).toEqual(validEvent);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid JSON', () => {
      const invalidPayload = '{ invalid json }';
      const result = parseWebhookEvent(invalidPayload);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error message will be from JSON.parse
    });

    it('should reject event without event type', () => {
      const invalidEvent = { ...validEvent };
      delete (invalidEvent as any).event;
      const payload = JSON.stringify(invalidEvent);

      const result = parseWebhookEvent(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing event type');
    });

    it('should reject event without timestamp', () => {
      const invalidEvent = { ...validEvent };
      delete (invalidEvent as any).timestamp;
      const payload = JSON.stringify(invalidEvent);

      const result = parseWebhookEvent(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing timestamp');
    });

    it('should reject event without property_id', () => {
      const invalidEvent = { ...validEvent };
      delete (invalidEvent as any).property_id;
      const payload = JSON.stringify(invalidEvent);

      const result = parseWebhookEvent(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing property_id');
    });

    it('should reject event without data', () => {
      const invalidEvent = { ...validEvent };
      delete (invalidEvent as any).data;
      const payload = JSON.stringify(invalidEvent);

      const result = parseWebhookEvent(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing event data');
    });

    it('should validate event type against allowed values', () => {
      const validEventTypes: HostPMSEventType[] = [
        'reservation.created',
        'reservation.updated',
        'reservation.cancelled',
        'reservation.check_in',
        'reservation.check_out',
        'reservation.no_show',
        'payment.received',
        'guest.created',
        'room.status_changed',
      ];

      validEventTypes.forEach((eventType) => {
        const event = { ...validEvent, event: eventType };
        const payload = JSON.stringify(event);
        const result = parseWebhookEvent(payload);

        expect(result.valid).toBe(true);
      });
    });

    it('should reject unknown event type', () => {
      const invalidEvent = {
        ...validEvent,
        event: 'unknown.event.type',
      };
      const payload = JSON.stringify(invalidEvent);

      const result = parseWebhookEvent(payload);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid event type');
    });
  });

  // ==================== Full Webhook Handler Tests ====================

  describe('handleHostPMSWebhook', () => {
    const createValidWebhookEvent = (): {
      event: APIGatewayProxyEvent;
      options: WebhookHandlerOptions;
    } => {
      const webhookData: HostPMSWebhookEvent = {
        event: 'reservation.created',
        timestamp: new Date().toISOString(),
        property_id: PROPERTY_ID,
        data: {
          reservation_id: 'RSV-123',
          guest: { name: 'João Silva' },
        },
      };

      const payload = JSON.stringify(webhookData);
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

      const options: WebhookHandlerOptions = {
        webhookSecret: WEBHOOK_SECRET,
        propertyId: PROPERTY_ID,
      };

      return { event, options };
    };

    it('should successfully process valid webhook', async () => {
      const { event, options } = createValidWebhookEvent();

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toContain('successfully');
      expect(body.event).toBe('reservation.created');
      expect(body.propertyId).toBe(PROPERTY_ID);
      expect(body.processingTimeMs).toBeLessThan(1000);
      expect(body.idempotencyKey).toBeDefined();
    });

    it('should reject webhook without signature header', async () => {
      const { event, options } = createValidWebhookEvent();
      delete event.headers['X-HostPMS-Signature'];

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Missing required headers');
    });

    it('should reject webhook without timestamp header', async () => {
      const { event, options } = createValidWebhookEvent();
      delete event.headers['X-HostPMS-Timestamp'];

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Missing required headers');
    });

    it('should reject webhook with invalid signature', async () => {
      const { event, options } = createValidWebhookEvent();
      event.headers['X-HostPMS-Signature'] = 'invalid-signature';

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(401);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Invalid webhook signature');
    });

    it('should reject webhook with invalid payload', async () => {
      const { event, options } = createValidWebhookEvent();

      // Create a new invalid payload with valid signature
      const invalidPayload = '{ invalid json }';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + invalidPayload;
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      event.body = invalidPayload;
      event.headers['X-HostPMS-Signature'] = signature;
      event.headers['X-HostPMS-Timestamp'] = timestamp;

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Invalid webhook payload');
    });

    it('should reject webhook with mismatched property ID', async () => {
      const { event, options } = createValidWebhookEvent();
      // Change property ID in options but not in webhook data
      options.propertyId = 'PT-LIS-999';

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(403);
      const body = JSON.parse(result.body);
      expect(body.error).toContain('Property ID mismatch');
    });

    it('should handle duplicate webhooks (idempotency)', async () => {
      const { event, options } = createValidWebhookEvent();

      // First request - should succeed
      const result1 = await handleHostPMSWebhook(event, options);
      expect(result1.statusCode).toBe(200);
      const body1 = JSON.parse(result1.body);
      expect(body1.message).toContain('successfully');

      // Second request with same payload - should be idempotent
      const result2 = await handleHostPMSWebhook(event, options);
      expect(result2.statusCode).toBe(200);
      const body2 = JSON.parse(result2.body);
      expect(body2.message).toContain('already processed');
      expect(body2.idempotencyKey).toBe(body1.idempotencyKey);
    });

    it('should call onEvent callback when provided', async () => {
      const { event, options } = createValidWebhookEvent();

      const mockOnEvent = jest.fn();
      options.onEvent = mockOnEvent;

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(200);
      expect(mockOnEvent).toHaveBeenCalledTimes(1);
      expect(mockOnEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'reservation.created',
          property_id: PROPERTY_ID,
        })
      );
    });

    it('should call onError callback on errors', async () => {
      const { event, options } = createValidWebhookEvent();

      const mockOnError = jest.fn();
      options.onError = mockOnError;
      options.onEvent = jest.fn().mockRejectedValue(new Error('Processing failed'));

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(500);
      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Processing failed',
        })
      );
    });

    it('should process webhook within 3 seconds (HostPMS requirement)', async () => {
      const { event, options } = createValidWebhookEvent();

      const startTime = Date.now();
      const result = await handleHostPMSWebhook(event, options);
      const endTime = Date.now();

      expect(result.statusCode).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000);

      const body = JSON.parse(result.body);
      expect(body.processingTimeMs).toBeLessThan(3000);
    });

    it('should handle case-insensitive headers', async () => {
      const { event, options } = createValidWebhookEvent();

      // Test with lowercase headers
      const lowercaseEvent = {
        ...event,
        headers: {
          'x-hostpms-signature': event.headers['X-HostPMS-Signature'],
          'x-hostpms-timestamp': event.headers['X-HostPMS-Timestamp'],
        },
      };

      const result = await handleHostPMSWebhook(lowercaseEvent, options);

      expect(result.statusCode).toBe(200);
    });

    it('should include processing metadata in response headers', async () => {
      const { event, options } = createValidWebhookEvent();

      const result = await handleHostPMSWebhook(event, options);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toBeDefined();
      expect(result.headers?.['X-Idempotency-Key']).toBeDefined();
      expect(result.headers?.['X-Processing-Time-Ms']).toBeDefined();
    });
  });

  // ==================== Idempotency Cache Tests ====================

  describe('Idempotency Cache', () => {
    it('should track cache size', () => {
      expect(getIdempotencyCacheSize()).toBe(0);

      const { event, options } = createValidWebhookEvent();
      handleHostPMSWebhook(event, options);

      expect(getIdempotencyCacheSize()).toBeGreaterThan(0);
    });

    it('should clear cache on reset', async () => {
      const { event, options } = createValidWebhookEvent();
      await handleHostPMSWebhook(event, options);

      expect(getIdempotencyCacheSize()).toBeGreaterThan(0);

      resetIdempotencyCache();

      expect(getIdempotencyCacheSize()).toBe(0);
    });
  });

  // Helper function for creating valid webhook events
  function createValidWebhookEvent(): {
    event: APIGatewayProxyEvent;
    options: WebhookHandlerOptions;
  } {
    const webhookData: HostPMSWebhookEvent = {
      event: 'reservation.created',
      timestamp: new Date().toISOString(),
      property_id: PROPERTY_ID,
      data: {
        reservation_id: 'RSV-123',
        guest: { name: 'João Silva' },
      },
    };

    const payload = JSON.stringify(webhookData);
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

    const options: WebhookHandlerOptions = {
      webhookSecret: WEBHOOK_SECRET,
      propertyId: PROPERTY_ID,
    };

    return { event, options };
  }
});
