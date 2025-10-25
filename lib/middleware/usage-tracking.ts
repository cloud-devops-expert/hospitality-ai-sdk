/**
 * Usage Tracking Middleware
 *
 * Lightweight middleware that tracks API usage without blocking requests.
 * Adds <1ms overhead per request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackRequest } from '@/lib/metrics/usage-tracker';
import { extractRLSContext } from '@/lib/database/drizzle-rls-client';

// Next.js route handler types
type NextRouteContext = { params?: Record<string, string | string[]> };
type NextRouteHandler = (
  req: NextRequest,
  context?: NextRouteContext
) => Promise<NextResponse> | NextResponse;

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
export function withUsageTracking(handler: NextRouteHandler): NextRouteHandler {
  return async (req: NextRequest, routeContext?: NextRouteContext) => {
    const startTime = Date.now();
    let tenantContext: { tenantId: string; userId?: string } | null = null;

    // Extract tenant context (if available)
    try {
      tenantContext = extractRLSContext(req as any);
    } catch {
      // If extraction fails, skip tracking (e.g., public endpoints)
    }

    try {
      // Execute handler
      const response = await handler(req, routeContext);
      const durationMs = Date.now() - startTime;

      // Track usage (fire and forget - don't await)
      if (tenantContext) {
        const responseSize =
          parseInt(response.headers.get('content-length') || '0') || 0;

        trackRequest(
          tenantContext.tenantId,
          tenantContext.userId,
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
      if (tenantContext) {
        const durationMs = Date.now() - startTime;
        trackRequest(
          tenantContext.tenantId,
          tenantContext.userId,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Extract tenant from headers or JWT
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    const userId = req.headers['x-user-id'] || req.user?.id;

    // Intercept response to get size
    const originalSend = res.send;
    let responseSize = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
