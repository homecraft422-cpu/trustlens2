/**
 * Media Processing Service
 * 
 * Coordinates media validation, metadata extraction, and preparation
 * for downstream detection providers.
 */

import { db } from "@/db";
import { assets, type Asset } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStorage } from "../storage";
import {
  validateFileBuffer,
  extractImageMetadata,
  extractVideoMetadata,
  isValidImageType,
  isValidVideoType,
} from "../media";

export interface MediaProcessingResult {
  success: boolean;
  assetId: string;
  validationPassed: boolean;
  metadataExtracted: boolean;
  error?: string;
  metadata?: {
    width: number | null;
    height: number | null;
    duration: number | null;
    format: string | null;
    videoCodec: string | null;
    audioCodec: string | null;
    frameRate: number | null;
  };
}

/**
 * Process uploaded media: validate and extract metadata
 */
export async function processMedia(assetId: string): Promise<MediaProcessingResult> {
  try {
    // Get asset
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    if (!asset) {
      return {
        success: false,
        assetId,
        validationPassed: false,
        metadataExtracted: false,
        error: "Asset not found",
      };
    }

    // Update metadata status to extracting
    await db
      .update(assets)
      .set({ metadataStatus: "extracting" })
      .where(eq(assets.id, assetId));

    // Download file from storage
    const storage = getStorage();
    const buffer = await storage.download(asset.storageKey);

    if (!buffer) {
      await db
        .update(assets)
        .set({
          metadataStatus: "failed",
          metadataError: "File not found in storage",
        })
        .where(eq(assets.id, assetId));

      return {
        success: false,
        assetId,
        validationPassed: false,
        metadataExtracted: false,
        error: "File not found in storage",
      };
    }

    // Validate file
    const validation = await validateFileBuffer(
      buffer,
      asset.mimeType,
      asset.originalFilename
    );

    await db
      .update(assets)
      .set({
        isValidFile: validation.isValid,
        detectedMimeType: validation.detectedMimeType,
        validationError: validation.error || null,
      })
      .where(eq(assets.id, assetId));

    if (!validation.isValid) {
      await db
        .update(assets)
        .set({
          metadataStatus: "failed",
          metadataError: validation.error,
        })
        .where(eq(assets.id, assetId));

      return {
        success: false,
        assetId,
        validationPassed: false,
        metadataExtracted: false,
        error: validation.error,
      };
    }

    // Extract metadata based on file type
    const detectedMime = validation.detectedMimeType || asset.mimeType;
    let metadata: MediaProcessingResult["metadata"] = {
      width: null,
      height: null,
      duration: null,
      format: null,
      videoCodec: null,
      audioCodec: null,
      frameRate: null,
    };

    if (isValidImageType(detectedMime)) {
      const imageResult = await extractImageMetadata(buffer);

      if (imageResult.success && imageResult.metadata) {
        metadata = {
          width: imageResult.metadata.width,
          height: imageResult.metadata.height,
          duration: null,
          format: imageResult.metadata.format,
          videoCodec: null,
          audioCodec: null,
          frameRate: null,
        };
      }
    } else if (isValidVideoType(detectedMime)) {
      const videoResult = await extractVideoMetadata(buffer);

      if (videoResult.success && videoResult.metadata) {
        metadata = {
          width: videoResult.metadata.width,
          height: videoResult.metadata.height,
          duration: videoResult.metadata.duration,
          format: videoResult.metadata.format,
          videoCodec: videoResult.metadata.videoCodec,
          audioCodec: videoResult.metadata.audioCodec,
          frameRate: videoResult.metadata.frameRate,
        };
      }
    }

    // Update asset with extracted metadata
    await db
      .update(assets)
      .set({
        metadataStatus: "completed",
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        format: metadata.format,
        videoCodec: metadata.videoCodec,
        audioCodec: metadata.audioCodec,
        frameRate: metadata.frameRate,
      })
      .where(eq(assets.id, assetId));

    return {
      success: true,
      assetId,
      validationPassed: true,
      metadataExtracted: true,
      metadata,
    };
  } catch (error) {
    console.error("Media processing error:", error);

    // Update asset with error
    await db
      .update(assets)
      .set({
        metadataStatus: "failed",
        metadataError: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(assets.id, assetId));

    return {
      success: false,
      assetId,
      validationPassed: false,
      metadataExtracted: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get processed asset with full metadata
 */
export async function getProcessedAsset(assetId: string): Promise<Asset | null> {
  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);

  return asset || null;
}

/**
 * Check if an asset is ready for detection
 */
export function isAssetReadyForDetection(asset: Asset): boolean {
  return (
    asset.storageStatus === "verified" &&
    asset.metadataStatus === "completed" &&
    asset.isValidFile === true
  );
}
