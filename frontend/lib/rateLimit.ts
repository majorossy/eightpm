/**
 * Rate Limiting Utility for Next.js API Routes
 *
 * Implements a sliding window rate limiter using in-memory storage.
 * For production with multiple instances, consider using Redis or Upstash.
 *
 * Usage:
 * ```ts
 * import { rateLimit, RateLimitConfig } from '@/lib/rateLimit';
 *
 * const limiter = rateLimit({ limit: 10, windowMs: 60000 });
 *
 * export async function GET(request: NextRequest) {
 *   const rateLimitResult = await limiter.check(request);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *   // ... handle request
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique identifier for this limiter (for logging) */
  name?: string;
  /** Custom function to extract identifier (default: IP address) */
  keyGenerator?: (request: NextRequest) => string;
  /** Whether to include rate limit headers in response */
  headers?: boolean;
  /** Custom message for rate limit exceeded */
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  response?: NextResponse;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limit data
// Key: identifier (IP or custom key)
// Value: Map of endpoint -> { count, resetTime }
const rateLimitStore = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup interval to prevent memory leaks (run every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    rateLimitStore.forEach((endpoints, key) => {
      const endpointsToDelete: string[] = [];

      endpoints.forEach((entry, endpoint) => {
        if (entry.resetTime < now) {
          endpointsToDelete.push(endpoint);
        }
      });

      endpointsToDelete.forEach(endpoint => endpoints.delete(endpoint));

      if (endpoints.size === 0) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => rateLimitStore.delete(key));
  }, 5 * 60 * 1000); // Every 5 minutes

  // Don't prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Extract IP address from request
 * Handles various proxy headers and falls back to 'anonymous'
 */
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback - can't determine IP
  return 'anonymous';
}

/**
 * Create a rate limiter with the specified configuration
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    limit,
    windowMs,
    name = 'default',
    keyGenerator = getClientIP,
    headers = true,
    message = 'Too many requests. Please try again later.',
  } = config;

  // Start cleanup if not already running
  startCleanup();

  return {
    /**
     * Check if the request is within rate limits
     * @param request The incoming request
     * @param endpointKey Optional key to differentiate endpoints sharing the same limiter
     * @returns RateLimitResult with success status and optional error response
     */
    async check(request: NextRequest, endpointKey?: string): Promise<RateLimitResult> {
      const identifier = keyGenerator(request);
      const endpoint = endpointKey || name;
      const now = Date.now();

      // Get or create entry for this identifier
      let identifierMap = rateLimitStore.get(identifier);
      if (!identifierMap) {
        identifierMap = new Map();
        rateLimitStore.set(identifier, identifierMap);
      }

      // Get or create entry for this endpoint
      let entry = identifierMap.get(endpoint);
      if (!entry || entry.resetTime < now) {
        // Create new window
        entry = {
          count: 0,
          resetTime: now + windowMs,
        };
        identifierMap.set(endpoint, entry);
      }

      // Increment count
      entry.count++;

      const remaining = Math.max(0, limit - entry.count);
      const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

      // Check if over limit
      if (entry.count > limit) {
        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message,
            retryAfter: resetSeconds,
          },
          { status: 429 }
        );

        if (headers) {
          response.headers.set('X-RateLimit-Limit', limit.toString());
          response.headers.set('X-RateLimit-Remaining', '0');
          response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
          response.headers.set('Retry-After', resetSeconds.toString());
        }

        return {
          success: false,
          limit,
          remaining: 0,
          reset: entry.resetTime,
          response,
        };
      }

      return {
        success: true,
        limit,
        remaining,
        reset: entry.resetTime,
      };
    },

    /**
     * Add rate limit headers to a successful response
     */
    addHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
      if (headers) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.reset.toString());
      }
      return response;
    },

    /**
     * Get current stats for an identifier (useful for debugging)
     */
    getStats(identifier: string, endpointKey?: string): RateLimitEntry | null {
      const endpoint = endpointKey || name;
      const identifierMap = rateLimitStore.get(identifier);
      if (!identifierMap) return null;
      return identifierMap.get(endpoint) || null;
    },

    /**
     * Reset rate limit for an identifier (useful for testing)
     */
    reset(identifier: string, endpointKey?: string): void {
      const endpoint = endpointKey || name;
      const identifierMap = rateLimitStore.get(identifier);
      if (identifierMap) {
        identifierMap.delete(endpoint);
      }
    },
  };
}

// =============================================================================
// Pre-configured rate limiters for common use cases
// =============================================================================

/**
 * Search API rate limiter
 * More generous limits since search is a core feature
 * 30 requests per minute per IP
 */
export const searchRateLimit = rateLimit({
  name: 'search',
  limit: 30,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many search requests. Please wait a moment before searching again.',
});

/**
 * General API rate limiter
 * Standard limits for most endpoints
 * 60 requests per minute per IP
 */
export const apiRateLimit = rateLimit({
  name: 'api',
  limit: 60,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Heavy endpoint rate limiter
 * For endpoints that are expensive (tapers, venues)
 * 10 requests per minute per IP
 */
export const heavyRateLimit = rateLimit({
  name: 'heavy',
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'This endpoint is rate limited. Please try again in a minute.',
});

/**
 * Strict rate limiter
 * For sensitive operations
 * 5 requests per minute per IP
 */
export const strictRateLimit = rateLimit({
  name: 'strict',
  limit: 5,
  windowMs: 60 * 1000, // 1 minute
});

// =============================================================================
// Helper to wrap an entire route handler with rate limiting
// =============================================================================

type RouteHandler = (request: NextRequest, context?: unknown) => Promise<NextResponse>;

/**
 * Wrap an API route handler with rate limiting
 *
 * Usage:
 * ```ts
 * export const GET = withRateLimit(searchRateLimit, async (request) => {
 *   // ... handle request
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withRateLimit(
  limiter: ReturnType<typeof rateLimit>,
  handler: RouteHandler
): RouteHandler {
  return async (request: NextRequest, context?: unknown) => {
    const result = await limiter.check(request);

    if (!result.success) {
      return result.response!;
    }

    const response = await handler(request, context);
    return limiter.addHeaders(response, result);
  };
}
