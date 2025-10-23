/**
 * CloudWatch Metrics Middleware
 *
 * Tracks tenant API usage in CloudWatch for dashboards and alerts.
 * <2ms overhead per request (async publishing).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudWatchPublisher } from '@/lib/metrics/cloudwatch-publisher';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';

/**
 * Wrap API handler with CloudWatch metrics tracking
 *
 * @example
 * ```typescript
 * export const GET = withCloudWatchMetrics(async (req) => {
 *   // Your handler code
 *   return NextResponse.json({ data: [] });
 * });
 * ```
 */
export function withCloudWatchMetrics(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    let context: { tenantId: string; userId?: string } | null = null;

    // Extract tenant context
    try {
      context = extractRLSContext(req);
    } catch {
      // Skip tracking for public endpoints
    }

    try {
      // Execute handler
      const response = await handler(req, ...args);
      const durationMs = Date.now() - startTime;

      // Publish to CloudWatch (fire and forget - don't await)
      if (context) {
        const publisher = getCloudWatchPublisher();
        const url = new URL(req.url);

        publisher
          .publish({
            tenantId: context.tenantId,
            endpoint: url.pathname,
            method: req.method,
            durationMs,
            statusCode: response.status,
            bytesTransferred:
              parseInt(response.headers.get('content-length') || '0') || 0,
          })
          .catch((err) => {
            console.error('[CloudWatch] Publish failed:', err);
          });
      }

      return response;
    } catch (error) {
      // Track error metric
      if (context) {
        const publisher = getCloudWatchPublisher();
        const url = new URL(req.url);

        publisher
          .publish({
            tenantId: context.tenantId,
            endpoint: url.pathname,
            method: req.method,
            durationMs: Date.now() - startTime,
            statusCode: 500,
            bytesTransferred: 0,
          })
          .catch(() => {
            // Ignore secondary failures
          });
      }

      throw error;
    }
  };
}

/**
 * Express.js middleware variant
 */
export function expressCloudWatchMetrics() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Extract tenant from headers or JWT
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    const userId = req.headers['x-user-id'] || req.user?.id;

    // Intercept response to track status and size
    const originalSend = res.send;
    let responseSize = 0;

    res.send = function (data: any) {
      responseSize = Buffer.byteLength(data || '');
      return originalSend.call(this, data);
    };

    res.on('finish', () => {
      if (tenantId) {
        const durationMs = Date.now() - startTime;
        const publisher = getCloudWatchPublisher();

        publisher
          .publish({
            tenantId,
            endpoint: req.originalUrl || req.path,
            method: req.method,
            durationMs,
            statusCode: res.statusCode,
            bytesTransferred: responseSize,
          })
          .catch((err) => {
            console.error('[CloudWatch] Track failed:', err);
          });
      }
    });

    next();
  };
}
