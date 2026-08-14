/**
 * Security Headers Configuration
 * 
 * Adds HTTP security headers to all responses
 */

import { NextResponse } from 'next/server';

/**
 * Get security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Strict transport security (HTTPS only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.thehive.ai https://api.sightengine.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    
    // Remove X-Powered-By
    'X-Powered-By': '',
  };
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    } else {
      response.headers.delete(key);
    }
  });
  
  return response;
}

/**
 * Create a secure response with headers
 */
export function secureResponse(
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(body, init);
  return applySecurityHeaders(response);
}

/**
 * CORS configuration
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://trustlens.vercel.app', // Production URL
];

export function getCORSHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Allowed origins - NEVER use wildcard in production
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://trustlens.vercel.app',
    'https://trustlens2.vercel.app',
  ];
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (process.env.NODE_ENV === 'development' && origin) {
    // In development, allow localhost variations
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  }
  
  // Always set Vary header for proper caching
  headers['Vary'] = 'Origin';
  
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  headers['Access-Control-Allow-Credentials'] = 'true';
  headers['Access-Control-Max-Age'] = '86400';
  
  return headers;
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '';
    const headers = getCORSHeaders(origin);
    
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }
  
  return null;
}

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(
  response: NextResponse,
  origin?: string
): NextResponse {
  const headers = getCORSHeaders(origin);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export default {
  getSecurityHeaders,
  applySecurityHeaders,
  secureResponse,
  getCORSHeaders,
  handleCORS,
  applyCORSHeaders,
};
