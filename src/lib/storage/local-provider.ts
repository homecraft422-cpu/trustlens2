import {
  StorageProvider,
  StorageUploadOptions,
  StorageUploadResult,
  StorageSignedUrlOptions,
  StorageMetadata,
} from "./types";
import { promises as fs } from "fs";
import path from "path";

/**
 * Local filesystem storage provider for development
 * 
 * Files are stored in the .storage directory at the project root.
 * This should NOT be used in production.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private baseDir: string;

  constructor(baseDir: string = ".storage") {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitized = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.baseDir, sanitized);
  }

  async upload(
    buffer: Buffer,
    key: string,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    // Write metadata
    const metaPath = `${filePath}.meta.json`;
    await fs.writeFile(
      metaPath,
      JSON.stringify({
        contentType: options.contentType,
        originalFilename: options.originalFilename,
        size: buffer.length,
        uploadedAt: new Date().toISOString(),
      })
    );

    return {
      storageKey: key,
      size: buffer.length,
    };
  }

  async download(key: string): Promise<Buffer | null> {
    try {
      const filePath = this.getFilePath(key);
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async getSignedReadUrl(
    key: string,
    _options?: StorageSignedUrlOptions
  ): Promise<string | null> {
    // In local mode, we return a local API path
    const exists = await this.exists(key);
    if (!exists) return null;

    // Return a path served by a local API route
    return `/api/v1/storage/${encodeURIComponent(key)}`;
  }

  async getSignedUploadUrl(
    _key: string,
    _contentType: string,
    _options?: StorageSignedUrlOptions
  ): Promise<string | null> {
    // Local storage doesn't support direct upload
    // Files are uploaded through the API
    return null;
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);

      // Also delete metadata
      const metaPath = `${filePath}.meta.json`;
      try {
        await fs.unlink(metaPath);
      } catch {
        // Metadata may not exist
      }

      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    try {
      const filePath = this.getFilePath(key);
      const stats = await fs.stat(filePath);

      // Try to read metadata file
      const metaPath = `${filePath}.meta.json`;
      let contentType = "application/octet-stream";

      try {
        const metaContent = await fs.readFile(metaPath, "utf-8");
        const meta = JSON.parse(metaContent);
        contentType = meta.contentType || contentType;
      } catch {
        // Metadata file may not exist
      }

      return {
        size: stats.size,
        contentType,
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }
}
