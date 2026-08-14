/**
 * Video Processor
 * 
 * Extracts metadata from videos.
 * Uses file-type for basic detection.
 * 
 * NOTE: Full ffprobe integration is deferred.
 * For V0.1, we extract what we can without external dependencies.
 */

import { fileTypeFromBuffer } from "file-type";

export interface VideoMetadata {
  duration: number | null;
  width: number | null;
  height: number | null;
  format: string;
  videoCodec: string | null;
  audioCodec: string | null;
  frameRate: number | null;
  size: number;
}

export interface VideoProcessingResult {
  success: boolean;
  metadata?: VideoMetadata;
  error?: string;
  partial?: boolean; // True if only partial metadata could be extracted
}

/**
 * Extract metadata from a video buffer
 * 
 * Note: Without ffprobe, we can only extract limited metadata.
 * Duration and codec information require ffprobe.
 */
export async function extractVideoMetadata(
  buffer: Buffer
): Promise<VideoProcessingResult> {
  try {
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected) {
      return {
        success: false,
        error: "Could not determine video format",
      };
    }

    // Basic metadata from file-type
    const metadata: VideoMetadata = {
      duration: null, // Requires ffprobe
      width: null, // Requires parsing video container
      height: null,
      format: detected.ext,
      videoCodec: null, // Requires ffprobe
      audioCodec: null, // Requires ffprobe
      frameRate: null, // Requires ffprobe
      size: buffer.length,
    };

    // Try to extract dimensions from MP4 header
    if (detected.mime === "video/mp4" || detected.mime === "video/quicktime") {
      const dimensions = extractMp4Dimensions(buffer);
      if (dimensions) {
        metadata.width = dimensions.width;
        metadata.height = dimensions.height;
      }
    }

    return {
      success: true,
      metadata,
      partial: true, // Indicate that full metadata extraction requires ffprobe
    };
  } catch (error) {
    console.error("Video metadata extraction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process video",
    };
  }
}

/**
 * Attempt to extract dimensions from MP4 container header
 * This is a basic parser that looks for the tkhd atom
 */
function extractMp4Dimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    // Look for 'tkhd' (track header) atom which contains dimensions
    const tkhdSignature = Buffer.from("tkhd");
    let pos = buffer.indexOf(tkhdSignature);

    if (pos === -1) return null;

    // tkhd atom structure:
    // - 1 byte version
    // - 3 bytes flags
    // - then depending on version (0 or 1):
    //   - v0: 4 bytes creation, 4 bytes modification, 4 bytes track_id, 4 bytes reserved, 4 bytes duration
    //   - v1: 8 bytes creation, 8 bytes modification, 4 bytes track_id, 4 bytes reserved, 8 bytes duration
    // - ... other fields
    // - 4 bytes width (16.16 fixed point)
    // - 4 bytes height (16.16 fixed point)

    const version = buffer[pos + 4];
    let offset: number;

    if (version === 0) {
      // Version 0: times are 4 bytes
      offset = pos + 4 + 1 + 3 + 4 + 4 + 4 + 4 + 4 + 36 + 36; // Skip to width/height
    } else {
      // Version 1: times are 8 bytes
      offset = pos + 4 + 1 + 3 + 8 + 8 + 4 + 4 + 8 + 36 + 36;
    }

    // Check bounds
    if (offset + 8 > buffer.length) return null;

    // Width and height are stored as 16.16 fixed-point numbers
    const width = buffer.readUInt32BE(offset) >> 16;
    const height = buffer.readUInt32BE(offset + 4) >> 16;

    if (width > 0 && height > 0 && width < 10000 && height < 10000) {
      return { width, height };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate video dimensions are within acceptable range
 */
export function validateVideoDimensions(
  width: number | null,
  height: number | null,
  maxDimension: number = 4096
): { valid: boolean; error?: string } {
  if (width === null || height === null) {
    // Can't validate without dimensions, allow through
    return { valid: true };
  }

  if (width > maxDimension || height > maxDimension) {
    return {
      valid: false,
      error: `Video dimensions too large. Maximum is ${maxDimension}x${maxDimension} pixels.`,
    };
  }

  return { valid: true };
}

/**
 * Validate video duration (when available)
 */
export function validateVideoDuration(
  duration: number | null,
  maxDuration: number = 60
): { valid: boolean; error?: string } {
  if (duration === null) {
    // Can't validate without duration, allow through
    return { valid: true };
  }

  if (duration > maxDuration) {
    return {
      valid: false,
      error: `Video too long. Maximum duration is ${maxDuration} seconds.`,
    };
  }

  return { valid: true };
}
