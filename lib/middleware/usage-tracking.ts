/**
 * Usage Tracking Middleware
 *
 * Lightweight middleware that tracks API usage without blocking requests.
 * Adds <1ms overhead per request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackRequest } from '@/lib/metrics/usage-tracker';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';

/**
 * Wrap API handler with usage tracking
 *
 * @example
 * ```typescript
 * export const GET = withUsageTracking(async (req) => {
 *   // Your handler code
 *   return NextResponse.json({ data: [] });
 * });
 * ```
 */
export function withUsageTracking(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    let context: { tenantId: string; userId?: string } | null = null;

    // Extract tenant context (if available)
    try {
      context = extractRLSContext(req);
    } catch {
      // If extraction fails, skip tracking (e.g., public endpoints)
    }

    try {
      // Execute handler
      const response = await handler(req, ...args);
      const durationMs = Date.now() - startTime;

      // Track usage (fire and forget - don't await)
      if (context) {
        const responseSize =
          parseInt(response.headers.get('content-length') || '0') || 0;

        trackRequest(
          context.tenantId,
          context.userId,
          { url: req.url, method: req.method },
          durationMs,
          responseSize
        ).catch((err) => {
          console.error('[Usage] Track failed:', err);
        });
      }

      return response;
    } catch (error) {
      // Track error (optional)
      if (context) {
        const durationMs = Date.now() - startTime;
        trackRequest(
          context.tenantId,
          context.userId,
          { url: req.url, method: req.method },
          durationMs,
          0
        ).catch(() => {
          // Ignore tracking errors
        });
      }

      throw error;
    }
  };
}

/**
 * Express.js middleware variant
 */
export function expressUsageTracking() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Extract tenant from headers or JWT
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    const userId = req.headers['x-user-id'] || req.user?.id;

    // Intercept response to get size
    const originalSend = res.send;
    let responseSize = 0;

    res.send = function (data: any) {
      responseSize = Buffer.byteLength(data || '');
      return originalSend.call(this, data);
    };

    res.on('finish', () => {
      if (tenantId) {
        const durationMs = Date.now() - startTime;
        trackRequest(
          tenantId,
          userId,
          { url: req.originalUrl, method: req.method },
          durationMs,
          responseSize
        ).catch((err) => {
          console.error('[Usage] Track failed:', err);
        });
      }
    });

    next();
  };
}
