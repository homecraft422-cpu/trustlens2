import {
  StorageService,
  StorageProvider,
  StorageUploadOptions,
  StorageUploadResult,
  StorageSignedUrlOptions,
  StorageMetadata,
} from "./types";
import { LocalStorageProvider } from "./local-provider";

export * from "./types";
export { LocalStorageProvider } from "./local-provider";

/**
 * Storage service implementation that wraps a provider
 */
class StorageServiceImpl implements StorageService {
  private provider: StorageProvider;

  constructor(provider: StorageProvider) {
    this.provider = provider;
  }

  get name(): string {
    return this.provider.name;
  }

  generateKey(assetId: string, prefix: string = "assets"): string {
    // Use asset ID as part of the key for organization
    // Format: assets/{assetId}/original
    return `${prefix}/${assetId}/original`;
  }

  async upload(
    buffer: Buffer,
    key: string,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    return this.provider.upload(buffer, key, options);
  }

  async download(key: string): Promise<Buffer | null> {
    return this.provider.download(key);
  }

  async getSignedReadUrl(
    key: string,
    options?: StorageSignedUrlOptions
  ): Promise<string | null> {
    return this.provider.getSignedReadUrl(key, options);
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    options?: StorageSignedUrlOptions
  ): Promise<string | null> {
    if (this.provider.getSignedUploadUrl) {
      return this.provider.getSignedUploadUrl(key, contentType, options);
    }
    return null;
  }

  async delete(key: string): Promise<boolean> {
    return this.provider.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    return this.provider.getMetadata(key);
  }
}

/**
 * Get the configured storage service based on environment
 */
export function getStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "s3") {
    // S3 provider would be initialized here
    // For now, fall back to local
    console.warn("S3 storage not yet implemented, using local storage");
  }

  return new StorageServiceImpl(new LocalStorageProvider());
}

// Singleton instance
let storageServiceInstance: StorageService | null = null;

export function getStorage(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = getStorageService();
  }
  return storageServiceInstance;
}
