/**
 * =====================================================
 * Rate Limiter Utility
 * =====================================================
 * Simple in-memory rate limiter for API endpoints.
 * Uses a sliding window algorithm to track requests per time window.
 *
 * For production with multiple servers, consider using Redis instead.
 * =====================================================
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory store for rate limit tracking
 * Key format: `${identifier}:${window}`
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup old entries every 5 minutes to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // 5 minutes

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window
   * @default 10
   */
  maxRequests?: number;

  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;

  /**
   * Unique identifier for the rate limit key (e.g., API key, IP address, user ID)
   */
  identifier: string;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Number of requests remaining in the current window
   */
  remaining: number;

  /**
   * Maximum requests allowed
   */
  limit: number;

  /**
   * Time in milliseconds until the rate limit resets
   */
  resetAt: number;

  /**
   * Time in seconds until the rate limit resets (for Retry-After header)
   */
  retryAfter: number;
}

/**
 * Check if a request is allowed based on rate limits
 *
 * @param options - Rate limit configuration options
 * @returns Rate limit result indicating if request is allowed
 *
 * @example
 * ```typescript
 * const result = await checkRateLimit({
 *   identifier: apiKey,
 *   maxRequests: 10,
 *   windowMs: 60000, // 1 minute
 * });
 *
 * if (!result.allowed) {
 *   return Response.json(
 *     { error: 'Rate limit exceeded', retry_after: result.retryAfter },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export async function checkRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const {
    maxRequests = 10,
    windowMs = 60000, // 1 minute default
    identifier,
  } = options;

  const now = Date.now();
  const windowKey = `${identifier}:${Math.floor(now / windowMs)}`;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(windowKey);

  if (!entry || entry.resetAt < now) {
    // Create new entry for this window
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(windowKey, entry);
  }

  // Increment request count
  entry.count++;

  // Calculate remaining requests
  const remaining = Math.max(0, maxRequests - entry.count);
  const allowed = entry.count <= maxRequests;
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // Convert to seconds

  return {
    allowed,
    remaining,
    limit: maxRequests,
    resetAt: entry.resetAt,
    retryAfter: allowed ? 0 : retryAfter,
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual override
 *
 * @param identifier - The unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  // Remove all entries for this identifier
  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${identifier}:`)) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get current rate limit status without incrementing the counter
 *
 * @param options - Rate limit configuration options
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  options: RateLimitOptions
): Omit<RateLimitResult, 'allowed'> {
  const {
    maxRequests = 10,
    windowMs = 60000,
    identifier,
  } = options;

  const now = Date.now();
  const windowKey = `${identifier}:${Math.floor(now / windowMs)}`;

  const entry = rateLimitStore.get(windowKey);

  if (!entry || entry.resetAt < now) {
    return {
      remaining: maxRequests,
      limit: maxRequests,
      resetAt: now + windowMs,
      retryAfter: 0,
    };
  }

  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  return {
    remaining,
    limit: maxRequests,
    resetAt: entry.resetAt,
    retryAfter,
  };
}

/**
 * Clear all rate limit entries
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get the total number of tracked rate limit entries
 * Useful for monitoring memory usage
 */
export function getRateLimitStoreSize(): number {
  return rateLimitStore.size;
}
