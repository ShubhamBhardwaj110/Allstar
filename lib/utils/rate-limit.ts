/**
 * In-memory rate limiter using sliding window algorithm
 * Stores request counts in memory - resets on server restart
 * For production, use Upstash Redis for persistence
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check if a request should be allowed based on rate limit
 * @param identifier - Unique identifier (userId, IP, etc.)
 * @param config - Rate limit configuration
 * @returns Result with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Entry doesn't exist or has expired
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Entry exists and hasn't expired
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      success: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  return {
    success: false,
    remaining: 0,
    resetTime: entry.resetTime,
    retryAfter,
  };
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // API endpoints - 100 requests per hour
  API: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000,
  },

  // Strict - 10 requests per hour (sensitive operations)
  STRICT: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },

  // Generous - 1000 requests per hour
  GENEROUS: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000,
  },

  // Auth endpoints - 5 attempts per 15 minutes
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },

  // Quote API - 200 requests per hour
  QUOTE_API: {
    maxRequests: 200,
    windowMs: 60 * 60 * 1000,
  },
};
