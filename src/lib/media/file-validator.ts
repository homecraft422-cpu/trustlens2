/**
 * File Validator
 * 
 * Validates uploaded files using magic number detection.
 * Does NOT trust browser-provided MIME types.
 */

import { fileTypeFromBuffer } from "file-type";

export interface FileValidationResult {
  isValid: boolean;
  detectedMimeType: string | null;
  detectedExtension: string | null;
  error?: string;
}

// Supported MIME types with their expected magic signatures
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const SUPPORTED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

/**
 * Validate a file buffer by checking its magic bytes
 */
export async function validateFileBuffer(
  buffer: Buffer,
  declaredMimeType: string,
  filename: string
): Promise<FileValidationResult> {
  try {
    // Detect file type from magic bytes
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected) {
      return {
        isValid: false,
        detectedMimeType: null,
        detectedExtension: null,
        error: "Could not determine file type. The file may be corrupted or unsupported.",
      };
    }

    const { mime, ext } = detected;

    // Check if detected type is supported
    const isSupported = SUPPORTED_IMAGE_TYPES.has(mime) || SUPPORTED_VIDEO_TYPES.has(mime);

    if (!isSupported) {
      return {
        isValid: false,
        detectedMimeType: mime,
        detectedExtension: ext,
        error: `File type "${mime}" is not supported. Please upload JPG, PNG, WEBP, MP4, MOV, or WEBM.`,
      };
    }

    // Check for MIME type spoofing
    // Allow some flexibility for similar types (e.g., video/quicktime vs video/mp4)
    const isMimeMatch = isMimeTypeCompatible(declaredMimeType, mime);

    if (!isMimeMatch) {
      return {
        isValid: false,
        detectedMimeType: mime,
        detectedExtension: ext,
        error: `File content does not match declared type. Expected "${declaredMimeType}" but detected "${mime}".`,
      };
    }

    // Check file extension consistency
    const declaredExt = getExtension(filename).toLowerCase();
    const extMatch = isExtensionCompatible(declaredExt, ext, mime);

    if (!extMatch) {
      // This is a warning, not a hard failure
      console.warn(
        `Extension mismatch: file "${filename}" has extension "${declaredExt}" but content is "${ext}"`
      );
    }

    return {
      isValid: true,
      detectedMimeType: mime,
      detectedExtension: ext,
    };
  } catch (error) {
    console.error("File validation error:", error);
    return {
      isValid: false,
      detectedMimeType: null,
      detectedExtension: null,
      error: "Failed to validate file. Please try again.",
    };
  }
}

/**
 * Check if declared MIME type is compatible with detected type
 */
function isMimeTypeCompatible(declared: string, detected: string): boolean {
  // Exact match
  if (declared === detected) return true;

  // Known compatible pairs
  const compatiblePairs: Record<string, string[]> = {
    "video/quicktime": ["video/mp4"],
    "video/mp4": ["video/quicktime"],
    "image/jpg": ["image/jpeg"],
    "image/jpeg": ["image/jpg"],
  };

  const compatible = compatiblePairs[declared];
  if (compatible && compatible.includes(detected)) return true;

  return false;
}

/**
 * Check if extension is compatible with detected type
 */
function isExtensionCompatible(ext: string, detectedExt: string, mime: string): boolean {
  if (ext === detectedExt) return true;

  // Known compatible extensions
  const compatibleExts: Record<string, string[]> = {
    jpg: ["jpeg"],
    jpeg: ["jpg"],
    mov: ["mp4"],
    mp4: ["mov"],
  };

  const compatible = compatibleExts[ext];
  if (compatible && compatible.includes(detectedExt)) return true;

  return false;
}

/**
 * Extract file extension from filename
 */
function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * Check if MIME type is a supported image type
 */
export function isValidImageType(mime: string): boolean {
  return SUPPORTED_IMAGE_TYPES.has(mime);
}

/**
 * Check if MIME type is a supported video type
 */
export function isValidVideoType(mime: string): boolean {
  return SUPPORTED_VIDEO_TYPES.has(mime);
}

/**
 * Check if MIME type is any supported type
 */
export function isValidMediaType(mime: string): boolean {
  return isValidImageType(mime) || isValidVideoType(mime);
}
