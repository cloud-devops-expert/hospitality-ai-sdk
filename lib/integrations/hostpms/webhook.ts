/**
 * HostPMS Webhook Handler
 * Receives and processes webhook events from HostPMS with HMAC verification
 */

import crypto from 'crypto';
import type {
  HostPMSWebhookEvent,
  HostPMSEventType,
  WebhookVerificationResult,
} from './types';

/**
 * API Gateway Lambda Event (simplified types for AWS Lambda)
 */
export interface APIGatewayProxyEvent {
  body: string;
  headers: Record<string, string>;
  pathParameters: Record<string, string> | null;
  requestContext: {
    requestId: string;
    requestTime: string;
  };
}

export interface APIGatewayProxyResult {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

/**
 * Webhook Handler Options
 */
export interface WebhookHandlerOptions {
  webhookSecret: string;
  propertyId: string;
  maxAgeSeconds?: number; // Max age for timestamp validation (default: 300s)
  onEvent?: (event: HostPMSWebhookEvent) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

/**
 * Verify HMAC-SHA256 signature for webhook
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): WebhookVerificationResult {
  try {
    // 1. Validate inputs
    if (!payload || !signature || !timestamp || !secret) {
      return {
        valid: false,
        error: 'Missing required parameters for signature verification',
      };
    }

    // 2. Check timestamp age (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);
    const ageSeconds = now - webhookTime;

    if (isNaN(webhookTime)) {
      return {
        valid: false,
        error: 'Invalid timestamp format',
        age_seconds: 0,
      };
    }

    // Reject if timestamp is more than 5 minutes old or in the future
    if (ageSeconds > 300 || ageSeconds < -30) {
      return {
        valid: false,
        error: `Timestamp too old or in future (age: ${ageSeconds}s)`,
        age_seconds: ageSeconds,
      };
    }

    // 3. Compute HMAC signature
    // HostPMS sends: HMAC-SHA256(timestamp + payload, secret)
    const signedPayload = timestamp + payload;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // 4. Validate signature format and length before comparison
    // SHA-256 produces 64-character hex string
    if (signature.length !== 64 || !/^[a-f0-9]+$/i.test(signature)) {
      return {
        valid: false,
        error: 'Invalid signature format',
        age_seconds: ageSeconds,
      };
    }

    // 5. Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      return {
        valid: false,
        error: 'Signature mismatch',
        age_seconds: ageSeconds,
      };
    }

    return {
      valid: true,
      age_seconds: ageSeconds,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Generate idempotency key from webhook payload
 */
export function generateIdempotencyKey(
  propertyId: string,
  eventType: HostPMSEventType,
  payload: string
): string {
  // Use SHA-256 hash of propertyId + eventType + payload
  return crypto
    .createHash('sha256')
    .update(`${propertyId}:${eventType}:${payload}`)
    .digest('hex');
}

/**
 * Parse and validate webhook event
 */
export function parseWebhookEvent(
  payload: string
): { valid: boolean; event?: HostPMSWebhookEvent; error?: string } {
  try {
    const event = JSON.parse(payload) as HostPMSWebhookEvent;

    // Validate required fields
    if (!event.event) {
      return { valid: false, error: 'Missing event type' };
    }

    if (!event.timestamp) {
      return { valid: false, error: 'Missing timestamp' };
    }

    if (!event.property_id) {
      return { valid: false, error: 'Missing property_id' };
    }

    if (!event.data) {
      return { valid: false, error: 'Missing event data' };
    }

    // Validate event type
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

    if (!validEventTypes.includes(event.event)) {
      return {
        valid: false,
        error: `Invalid event type: ${event.event}`,
      };
    }

    return { valid: true, event };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON payload',
    };
  }
}

/**
 * In-memory idempotency cache (for testing/development)
 * In production, use DynamoDB or Redis
 */
class IdempotencyCache {
  private cache: Map<string, number> = new Map();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 7 * 24 * 60 * 60 * 1000) {
    // Default 7 days
    this.ttlMs = ttlMs;
  }

  has(key: string): boolean {
    const timestamp = this.cache.get(key);
    if (!timestamp) {
      return false;
    }

    // Check if expired
    if (Date.now() - timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  set(key: string): void {
    this.cache.set(key, Date.now());
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Singleton instance for testing
const idempotencyCache = new IdempotencyCache();

/**
 * Main webhook handler function
 */
export async function handleHostPMSWebhook(
  event: APIGatewayProxyEvent,
  options: WebhookHandlerOptions
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();

  try {
    // 1. Extract headers
    const signature = event.headers['x-hostpms-signature'] || event.headers['X-HostPMS-Signature'];
    const timestamp = event.headers['x-hostpms-timestamp'] || event.headers['X-HostPMS-Timestamp'];

    if (!signature || !timestamp) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required headers: X-HostPMS-Signature, X-HostPMS-Timestamp',
        }),
      };
    }

    // 2. Verify HMAC signature
    const verification = verifyWebhookSignature(
      event.body,
      signature,
      timestamp,
      options.webhookSecret
    );

    if (!verification.valid) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Invalid webhook signature',
          details: verification.error,
        }),
      };
    }

    // 3. Parse webhook event
    const parseResult = parseWebhookEvent(event.body);

    if (!parseResult.valid || !parseResult.event) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid webhook payload',
          details: parseResult.error,
        }),
      };
    }

    const webhookEvent = parseResult.event;

    // 4. Verify property ID matches
    if (webhookEvent.property_id !== options.propertyId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Property ID mismatch',
        }),
      };
    }

    // 5. Check idempotency (prevent duplicate processing)
    const idempotencyKey = generateIdempotencyKey(
      webhookEvent.property_id,
      webhookEvent.event,
      event.body
    );

    if (idempotencyCache.has(idempotencyKey)) {
      // Already processed - return success but don't reprocess
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Webhook already processed (idempotent)',
          idempotencyKey,
        }),
        headers: {
          'X-Idempotency-Key': idempotencyKey,
        },
      };
    }

    // 6. Store idempotency key
    idempotencyCache.set(idempotencyKey);

    // 7. Process the webhook event (async)
    if (options.onEvent) {
      await options.onEvent(webhookEvent);
    }

    // 8. Return success response (must be <3 seconds for HostPMS)
    const processingTime = Date.now() - startTime;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook received successfully',
        event: webhookEvent.event,
        propertyId: webhookEvent.property_id,
        processingTimeMs: processingTime,
        idempotencyKey,
      }),
      headers: {
        'X-Idempotency-Key': idempotencyKey,
        'X-Processing-Time-Ms': processingTime.toString(),
      },
    };
  } catch (error) {
    // Log error
    if (options.onError) {
      await options.onError(error instanceof Error ? error : new Error(String(error)));
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * AWS Lambda handler wrapper
 * This is the entry point for AWS Lambda deployment
 */
export function createLambdaHandler(options: WebhookHandlerOptions) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return handleHostPMSWebhook(event, options);
  };
}

/**
 * Utility: Reset idempotency cache (for testing)
 */
export function resetIdempotencyCache(): void {
  idempotencyCache.clear();
}

/**
 * Utility: Get idempotency cache size (for monitoring)
 */
export function getIdempotencyCacheSize(): number {
  return idempotencyCache.size();
}
