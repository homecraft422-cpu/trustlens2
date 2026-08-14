/**
 * Next.js Middleware
 * 
 * Applies security measures to all requests
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers to apply
const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Allow clipboard, camera, microphone for user interactions
  'Permissions-Policy': 'camera=self, microphone=self, clipboard-read=self, clipboard-write=self',
};

// Rate limiting store (in-memory for demo, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations - generous for demo
const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  '/api/auth': { windowMs: 15 * 60 * 1000, max: 20 },
  '/api/v1/analyses': { windowMs: 60 * 1000, max: 30 },
  '/api/v1/mock-analysis': { windowMs: 60 * 1000, max: 50 },
  '/api/v1/fact-check': { windowMs: 60 * 1000, max: 50 },
  default: { windowMs: 60 * 1000, max: 100 },
};

/**
 * Get client IP
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
 * Check rate limit
 */
function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number; resetTime: number } {
  let config = RATE_LIMITS.default;
  for (const [route, routeConfig] of Object.entries(RATE_LIMITS)) {
    if (route !== 'default' && path.startsWith(route)) {
      config = routeConfig;
      break;
    }
  }

  const key = `${ip}:${path}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetTime: now + config.windowMs };
  }

  if (record.count >= config.max) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: config.max - record.count, resetTime: record.resetTime };
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  
  // Skip middleware for static files, images, fonts, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js')
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const { allowed, remaining, resetTime } = checkRateLimit(clientIP, pathname);
    
    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // Add rate limit headers and security headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // Apply security headers to page responses
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
