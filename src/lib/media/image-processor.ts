/**
 * Image Processor
 * 
 * Extracts metadata from images using Sharp.
 * Does NOT perform any AI analysis.
 */

import sharp from "sharp";

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  colorSpace?: string;
  density?: number;
}

export interface ImageProcessingResult {
  success: boolean;
  metadata?: ImageMetadata;
  error?: string;
}

/**
 * Extract metadata from an image buffer
 */
export async function extractImageMetadata(
  buffer: Buffer
): Promise<ImageProcessingResult> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return {
        success: false,
        error: "Could not determine image dimensions",
      };
    }

    return {
      success: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || "unknown",
        size: buffer.length,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space,
        density: metadata.density,
      },
    };
  } catch (error) {
    console.error("Image metadata extraction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process image",
    };
  }
}

/**
 * Validate image dimensions are within acceptable range
 */
export function validateImageDimensions(
  width: number,
  height: number,
  minDimension: number = 10,
  maxDimension: number = 20000
): { valid: boolean; error?: string } {
  if (width < minDimension || height < minDimension) {
    return {
      valid: false,
      error: `Image dimensions too small. Minimum is ${minDimension}x${minDimension} pixels.`,
    };
  }

  if (width > maxDimension || height > maxDimension) {
    return {
      valid: false,
      error: `Image dimensions too large. Maximum is ${maxDimension}x${maxDimension} pixels.`,
    };
  }

  return { valid: true };
}

/**
 * Get image orientation from EXIF data
 */
export async function getImageOrientation(
  buffer: Buffer
): Promise<number | null> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    return metadata.orientation || null;
  } catch {
    return null;
  }
}
