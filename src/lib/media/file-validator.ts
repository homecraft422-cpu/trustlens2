/**
 * File Validator
 * 
 * Validates uploaded files using magic number detection and extension matching.
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
  "image/jpg",
  "image/png",
  "image/webp",
]);

const SUPPORTED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
]);

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/mp4",
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

    // If magic bytes detection failed, try to fallback to declared extension/mime for audio/certain types
    const declaredExt = getExtension(filename).toLowerCase();
    
    if (!detected) {
      if (
        ["mp3", "wav", "ogg", "flac", "aac", "m4a", "webm", "mp4", "jpg", "jpeg", "png", "webp"].includes(declaredExt)
      ) {
        return {
          isValid: true,
          detectedMimeType: declaredMimeType || `audio/${declaredExt}`,
          detectedExtension: declaredExt,
        };
      }

      return {
        isValid: false,
        detectedMimeType: null,
        detectedExtension: null,
        error: "Could not determine file type. The file may be corrupted or unsupported.",
      };
    }

    const { mime, ext } = detected;

    // Check if detected type is supported
    const isSupported =
      SUPPORTED_IMAGE_TYPES.has(mime) ||
      SUPPORTED_VIDEO_TYPES.has(mime) ||
      SUPPORTED_AUDIO_TYPES.has(mime) ||
      mime.startsWith("audio/") ||
      mime.startsWith("image/") ||
      mime.startsWith("video/");

    if (!isSupported) {
      return {
        isValid: false,
        detectedMimeType: mime,
        detectedExtension: ext,
        error: `File type "${mime}" is not supported. Please upload JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, or M4A.`,
      };
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
  return SUPPORTED_IMAGE_TYPES.has(mime) || mime.startsWith("image/");
}

/**
 * Check if MIME type is a supported video type
 */
export function isValidVideoType(mime: string): boolean {
  return SUPPORTED_VIDEO_TYPES.has(mime) || mime.startsWith("video/");
}

/**
 * Check if MIME type is a supported audio type
 */
export function isValidAudioType(mime: string): boolean {
  return SUPPORTED_AUDIO_TYPES.has(mime) || mime.startsWith("audio/");
}

/**
 * Check if MIME type is any supported type
 */
export function isValidMediaType(mime: string): boolean {
  return isValidImageType(mime) || isValidVideoType(mime) || isValidAudioType(mime);
}
