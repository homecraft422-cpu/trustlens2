/**
 * Secure Error Handling
 * 
 * Prevents leaking internal errors to users
 */

import { NextResponse } from 'next/server';

// Error types
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Error response interface
interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

// Map error codes to HTTP status codes
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

// User-friendly error messages (safe to show to users)
const SAFE_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.BAD_REQUEST]: 'The request was invalid. Please check your input.',
  [ErrorCode.UNAUTHORIZED]: 'Please sign in to continue.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please try again later.',
  [ErrorCode.VALIDATION_ERROR]: 'The input provided is invalid.',
  [ErrorCode.INTERNAL_ERROR]: 'Something went wrong. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
};

/**
 * Create a secure error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  details?: unknown,
  requestId?: string
): NextResponse {
  const status = ERROR_STATUS_MAP[code];
  const safeMessage = message || SAFE_ERROR_MESSAGES[code];
  
  // In production, don't include details
  const includeDetails = process.env.NODE_ENV === 'development';
  
  const response: ErrorResponse = {
    error: code,
    code,
    message: safeMessage,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
    ...(includeDetails && details && { details }),
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Handle unknown errors safely
 */
export function handleError(error: unknown, context?: string): NextResponse {
  // Log the full error server-side
  const errorId = generateErrorId();
  
  console.error(`[${errorId}] Error${context ? ` in ${context}` : ''}:`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
  
  // Return safe error to user
  return createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    undefined,
    undefined,
    errorId
  );
}

/**
 * Generate unique error ID for tracking
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validation error helper
 */
export function validationError(errors: string[]): NextResponse {
  return createErrorResponse(
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    { errors }
  );
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(message?: string): NextResponse {
  return createErrorResponse(
    ErrorCode.UNAUTHORIZED,
    message
  );
}

/**
 * Forbidden error helper
 */
export function forbiddenError(message?: string): NextResponse {
  return createErrorResponse(
    ErrorCode.FORBIDDEN,
    message
  );
}

/**
 * Not found error helper
 */
export function notFoundError(resource?: string): NextResponse {
  return createErrorResponse(
    ErrorCode.NOT_FOUND,
    resource ? `${resource} not found` : undefined
  );
}

/**
 * Rate limit error helper
 */
export function rateLimitError(retryAfter: number): NextResponse {
  const response = createErrorResponse(
    ErrorCode.RATE_LIMITED,
    `Too many requests. Please try again in ${retryAfter} seconds.`
  );
  
  response.headers.set('Retry-After', String(retryAfter));
  
  return response;
}

/**
 * Wrap async handler with error handling
 */
export function withErrorHandling(
  handler: (req: Request, context?: unknown) => Promise<NextResponse>
) {
  return async (req: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleError(error, req.url);
    }
  };
}

/**
 * Sanitize error message for logging
 */
export function sanitizeForLog(input: unknown): string {
  if (typeof input === 'string') {
    // Remove potential sensitive data
    return input
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***')
      .replace(/secret[=:]\s*\S+/gi, 'secret=***');
  }
  return String(input);
}

export default {
  createErrorResponse,
  handleError,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  rateLimitError,
  withErrorHandling,
  sanitizeForLog,
};
