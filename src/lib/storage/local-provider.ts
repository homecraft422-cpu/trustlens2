import {
  StorageProvider,
  StorageUploadOptions,
  StorageUploadResult,
  StorageSignedUrlOptions,
  StorageMetadata,
} from "./types";
import { promises as fs } from "fs";
import { existsSync, mkdirSync } from "fs";
import os from "os";
import path from "path";

/**
 * Filesystem storage provider with automatic fallbacks.
 *
 * Why this is defensive:
 *   Serverless/containerised hosts (Vercel, Netlify, Cloud Run, Docker with a
 *   read-only rootfs) do NOT allow writing next to the app bundle. The previous
 *   implementation always wrote to `<cwd>/.storage`, so `upload()` threw
 *   EROFS/EACCES, the /api/v1/analyses POST handler hit its catch-all and the
 *   user saw "Failed to create analysis. Please try again." for EVERY image,
 *   video and audio upload.
 *
 * Resolution order for the base directory:
 *   1. STORAGE_DIR env (explicit override, e.g. a mounted volume)
 *   2. <cwd>/.storage         — only when it is actually writable (dev)
 *   3. <os.tmpdir()>/trustlens-storage — always writable on serverless
 *   4. in-memory map          — last-resort so an upload never hard-fails
 */

type MemoryEntry = {
  buffer: Buffer;
  contentType: string;
  originalFilename: string;
  uploadedAt: Date;
};

const globalForStorage = globalThis as typeof globalThis & {
  __trustlensMemoryStorage?: Map<string, MemoryEntry>;
  __trustlensStorageBaseDir?: string | null;
};

function memoryStore(): Map<string, MemoryEntry> {
  if (!globalForStorage.__trustlensMemoryStorage) {
    globalForStorage.__trustlensMemoryStorage = new Map<string, MemoryEntry>();
  }
  return globalForStorage.__trustlensMemoryStorage;
}

function isWritableDir(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    require("fs").writeFileSync(probe, "ok");
    require("fs").unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function resolveBaseDir(preferred?: string): string | null {
  if (globalForStorage.__trustlensStorageBaseDir !== undefined) {
    return globalForStorage.__trustlensStorageBaseDir;
  }

  const candidates: string[] = [];
  if (process.env.STORAGE_DIR) candidates.push(path.resolve(process.env.STORAGE_DIR));
  if (preferred) candidates.push(path.resolve(process.cwd(), preferred));
  candidates.push(path.join(os.tmpdir(), "trustlens-storage"));

  for (const candidate of candidates) {
    if (isWritableDir(candidate)) {
      globalForStorage.__trustlensStorageBaseDir = candidate;
      return candidate;
    }
  }

  console.warn(
    "⚠️ No writable storage directory found (tried STORAGE_DIR, ./.storage, os.tmpdir()). " +
      "Falling back to in-memory storage for this instance."
  );
  globalForStorage.__trustlensStorageBaseDir = null;
  return null;
}

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private preferred: string;

  constructor(baseDir: string = ".storage") {
    this.preferred = baseDir;
  }

  private get baseDir(): string | null {
    return resolveBaseDir(this.preferred);
  }

  private getFilePath(key: string): string | null {
    const base = this.baseDir;
    if (!base) return null;
    // Sanitize key to prevent directory traversal
    const sanitized = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(base, sanitized);
  }

  async upload(
    buffer: Buffer,
    key: string,
    options: StorageUploadOptions
  ): Promise<StorageUploadResult> {
    // Always keep a copy in memory for the current instance. Detection runs
    // moments after upload, so this guarantees the pipeline can read the bytes
    // back even if the filesystem write is rejected by the host.
    memoryStore().set(key, {
      buffer,
      contentType: options.contentType,
      originalFilename: options.originalFilename,
      uploadedAt: new Date(),
    });
    this.pruneMemory();

    const filePath = this.getFilePath(key);
    if (filePath) {
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);
        await fs.writeFile(
          `${filePath}.meta.json`,
          JSON.stringify({
            contentType: options.contentType,
            originalFilename: options.originalFilename,
            size: buffer.length,
            uploadedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        // Never fail the upload because the disk is read-only — the in-memory
        // copy above is enough to complete the analysis.
        console.warn(
          `⚠️ Filesystem write failed for "${key}" (${
            error instanceof Error ? error.message : String(error)
          }). Using in-memory storage instead.`
        );
      }
    }

    return { storageKey: key, size: buffer.length };
  }

  /** Keep the memory fallback bounded (~40 most recent objects, 256 MB cap). */
  private pruneMemory(): void {
    const store = memoryStore();
    const MAX_ENTRIES = 40;
    const MAX_BYTES = 256 * 1024 * 1024;

    let total = 0;
    for (const entry of store.values()) total += entry.buffer.length;

    if (store.size <= MAX_ENTRIES && total <= MAX_BYTES) return;

    const entries = Array.from(store.entries()).sort(
      (a, b) => a[1].uploadedAt.getTime() - b[1].uploadedAt.getTime()
    );

    while (entries.length && (store.size > MAX_ENTRIES || total > MAX_BYTES)) {
      const [oldestKey, oldest] = entries.shift()!;
      total -= oldest.buffer.length;
      store.delete(oldestKey);
    }
  }

  async download(key: string): Promise<Buffer | null> {
    const filePath = this.getFilePath(key);
    if (filePath) {
      try {
        return await fs.readFile(filePath);
      } catch {
        // fall through to memory
      }
    }
    const entry = memoryStore().get(key);
    return entry ? entry.buffer : null;
  }

  async getSignedReadUrl(
    key: string,
    _options?: StorageSignedUrlOptions
  ): Promise<string | null> {
    const exists = await this.exists(key);
    if (!exists) return null;
    return `/api/v1/storage/${encodeURIComponent(key)}`;
  }

  async getSignedUploadUrl(
    _key: string,
    _contentType: string,
    _options?: StorageSignedUrlOptions
  ): Promise<string | null> {
    // Local storage doesn't support direct upload; files go through the API.
    return null;
  }

  async delete(key: string): Promise<boolean> {
    let deleted = memoryStore().delete(key);

    const filePath = this.getFilePath(key);
    if (filePath) {
      try {
        await fs.unlink(filePath);
        deleted = true;
      } catch {
        // ignore
      }
      try {
        await fs.unlink(`${filePath}.meta.json`);
      } catch {
        // ignore
      }
    }

    return deleted;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    if (filePath && existsSync(filePath)) return true;
    return memoryStore().has(key);
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    const filePath = this.getFilePath(key);
    if (filePath) {
      try {
        const stats = await fs.stat(filePath);
        let contentType = "application/octet-stream";
        try {
          const meta = JSON.parse(await fs.readFile(`${filePath}.meta.json`, "utf-8"));
          contentType = meta.contentType || contentType;
        } catch {
          // metadata file may not exist
        }
        return { size: stats.size, contentType, lastModified: stats.mtime };
      } catch {
        // fall through to memory
      }
    }

    const entry = memoryStore().get(key);
    if (!entry) return null;
    return {
      size: entry.buffer.length,
      contentType: entry.contentType,
      lastModified: entry.uploadedAt,
    };
  }
}
