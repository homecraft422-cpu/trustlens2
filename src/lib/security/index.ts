/**
 * Security Module - Main Export
 * 
 * Centralized security utilities for the application
 */

export { applyRateLimit, rateLimitMiddleware } from './rate-limit';
export { validateInput, sanitizeString, hasSQLInjection, sanitizeFilename } from './validation';
export { applySecurityHeaders, secureResponse, getCORSHeaders, handleCORS } from './headers';
export { createErrorResponse, handleError, validationError, unauthorizedError, forbiddenError, notFoundError } from './error-handler';

// Re-export types
export type { } from './validation';

/**
 * Security middleware for Next.js API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from './rate-limit';
import { applySecurityHeaders } from './headers';
import { handleError } from './error-handler';

type ApiHandler = (req: NextRequest, context?: unknown) => Promise<NextResponse>;

interface SecurityOptions {
  rateLimit?: 'auth' | 'api' | 'analysis' | 'upload' | 'factCheck';
  requireAuth?: boolean;
}

/**
 * Wrap API handler with security measures
 */
export function withSecurity(
  handler: ApiHandler,
  options: SecurityOptions = {}
) {
  return async (req: NextRequest, context?: unknown): Promise<NextResponse> => {
    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimitResult = applyRateLimit(req, options.rateLimit);
        if (!rateLimitResult.allowed && rateLimitResult.response) {
          return applySecurityHeaders(rateLimitResult.response);
        }
      }

      // Call the actual handler
      const response = await handler(req, context);

      // Apply security headers to response
      return applySecurityHeaders(response);
    } catch (error) {
      // Handle errors safely
      const errorResponse = handleError(error, req.url);
      return applySecurityHeaders(errorResponse);
    }
  };
}

/**
 * Common security configurations
 */
export const securityConfigs = {
  auth: { rateLimit: 'auth' as const },
  api: { rateLimit: 'api' as const },
  analysis: { rateLimit: 'analysis' as const },
  upload: { rateLimit: 'upload' as const },
  factCheck: { rateLimit: 'factCheck' as const },
};
