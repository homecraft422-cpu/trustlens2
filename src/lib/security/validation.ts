/**
 * Input Validation with Zod
 * 
 * Server-side validation for all API inputs
 */

import { z } from 'zod';

// ============================================
// Common Validation Schemas
// ============================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .toLowerCase()
  .trim();

// Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .trim()
  .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters');

// Guest ID validation
export const guestIdSchema = z
  .string()
  .regex(/^guest_[a-zA-Z0-9]{32}$/, 'Invalid guest ID format')
  .optional();

// ============================================
// File Upload Validation
// ============================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
  'audio/flac', 'audio/aac', 'audio/m4a', 'audio/webm', 'audio/mp4',
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export const fileUploadSchema = z.object({
  mimeType: z.string().refine(
    (type) => [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES].includes(type),
    'Unsupported file type'
  ),
  fileSize: z.number().positive('File size must be positive'),
  filename: z.string().min(1).max(500),
}).refine(
  (data) => {
    if (ALLOWED_IMAGE_TYPES.includes(data.mimeType)) {
      return data.fileSize <= MAX_IMAGE_SIZE;
    }
    if (ALLOWED_VIDEO_TYPES.includes(data.mimeType)) {
      return data.fileSize <= MAX_VIDEO_SIZE;
    }
    if (ALLOWED_AUDIO_TYPES.includes(data.mimeType)) {
      return data.fileSize <= MAX_AUDIO_SIZE;
    }
    return false;
  },
  'File size exceeds limit for this file type'
);

// ============================================
// Analysis Validation
// ============================================

export const analysisRequestSchema = z.object({
  guestId: guestIdSchema,
});

// ============================================
// Fact Check Validation
// ============================================

export const factCheckRequestSchema = z.object({
  claim: z
    .string()
    .min(1, 'Claim is required')
    .max(5000, 'Claim too long (max 5000 characters)')
    .trim(),
  language: z.enum(['en', 'hi']).optional().default('en'),
  region: z.enum(['IN', 'US', 'UK', 'GLOBAL']).optional().default('IN'),
});

// ============================================
// Auth Validation
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

// ============================================
// Report Validation
// ============================================

export const publicIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid report ID format');

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validate input against a schema and return errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((e) => e.message);
  return { success: false, errors };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  return filename
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\0/g, '')
    .trim()
    .substring(0, 255);
}

/**
 * Check for SQL injection patterns
 */
export function hasSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(\'|\"|;|--)/,
  ];
  
  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate request body size
 */
export function validateBodySize(body: unknown, maxSizeBytes: number = 1024 * 1024): boolean {
  const size = new TextEncoder().encode(JSON.stringify(body)).length;
  return size <= maxSizeBytes;
}

export default validateInput;
