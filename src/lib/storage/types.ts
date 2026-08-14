/**
 * Storage Service Abstraction
 * 
 * This abstraction allows swapping between different storage backends:
 * - LocalStorageProvider (development - filesystem)
 * - S3StorageProvider (production - AWS S3 / Cloudflare R2)
 */

export interface StorageUploadOptions {
  contentType: string;
  originalFilename: string;
}

export interface StorageUploadResult {
  storageKey: string;
  size: number;
}

export interface StorageSignedUrlOptions {
  expiresIn?: number; // seconds, default 3600
}

export interface StorageMetadata {
  size: number;
  contentType: string;
  lastModified: Date;
}

export interface StorageProvider {
  /** Provider name for logging/debugging */
  readonly name: string;

  /**
   * Upload a file buffer to storage
   */
  upload(
    buffer: Buffer,
    key: string,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult>;

  /**
   * Download a file from storage
   */
  download(key: string): Promise<Buffer | null>;

  /**
   * Generate a signed URL for secure read access
   */
  getSignedReadUrl(
    key: string,
    options?: StorageSignedUrlOptions
  ): Promise<string | null>;

  /**
   * Generate a signed URL for direct upload (browser -> storage)
   */
  getSignedUploadUrl?(
    key: string,
    contentType: string,
    options?: StorageSignedUrlOptions
  ): Promise<string | null>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata without downloading
   */
  getMetadata(key: string): Promise<StorageMetadata | null>;
}

export interface StorageService extends StorageProvider {
  /**
   * Generate a unique storage key for a new upload
   */
  generateKey(assetId: string, prefix?: string): string;
}
