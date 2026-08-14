/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse by limiting requests per IP/user
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations
const RATE_LIMITS = {
  // Auth endpoints: 5 requests per 15 minutes
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  // General API: 60 requests per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  // Analysis endpoints: 10 requests per minute
  analysis: { windowMs: 60 * 1000, maxRequests: 10 },
  // File upload: 5 requests per minute
  upload: { windowMs: 60 * 1000, maxRequests: 5 },
  // Fact check: 20 requests per minute
  factCheck: { windowMs: 60 * 1000, maxRequests: 20 },
};

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

/**
 * Check rate limit for a given key
 */
function checkRateLimit(key: string, config: { windowMs: number; maxRequests: number }): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): { allowed: boolean; response?: NextResponse } {
  const clientIP = getClientIP(request);
  const key = `${type}:${clientIP}`;
  const config = RATE_LIMITS[type];

  const { allowed, remaining, resetTime } = checkRateLimit(key, config);

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
          },
        }
      ),
    };
  }

  return { allowed: true };
}

/**
 * Rate limit middleware for Next.js
 */
export function rateLimitMiddleware(type: RateLimitType = 'api') {
  return (request: NextRequest) => {
    const result = applyRateLimit(request, type);
    if (!result.allowed) {
      return result.response;
    }
    return null; // Continue to handler
  };
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

export default applyRateLimit;
