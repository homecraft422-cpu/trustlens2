/**
 * Sightengine HTTP Client
 *
 * Isolated HTTP layer for calling Sightengine API endpoints.
 * Handles authentication, timeouts, retries, and error normalization.
 *
 * NEVER exposes API credentials outside this module.
 *
 * Sightengine API:
 *  - Images:  POST https://api.sightengine.com/1.0/check.json
 *  - Videos:  POST https://api.sightengine.com/1.0/video/check-sync.json  (short sync)
 *
 * Auth: multipart fields `api_user` + `api_secret`
 * Model: `models=genai,deepfake` (comma-separated)
 */

// ─── Configuration ───────────────────────────────────────────

export interface SightengineClientConfig {
  apiUser: string;
  apiSecret: string;
  endpoint: string;
  timeoutMs: number;
  maxRetries: number;
}

export function getSightengineConfig(): SightengineClientConfig {
  return {
    apiUser: process.env.SIGHTENGINE_API_USER || "",
    apiSecret: process.env.SIGHTENGINE_API_SECRET || "",
    endpoint:
      process.env.SIGHTENGINE_ENDPOINT ||
      "https://api.sightengine.com/1.0",
    timeoutMs: parseInt(process.env.SIGHTENGINE_TIMEOUT_MS || "30000", 10),
    maxRetries: parseInt(process.env.SIGHTENGINE_MAX_RETRIES || "1", 10),
  };
}

// ─── Response types ──────────────────────────────────────────

export interface SightengineGenerators {
  [key: string]: number;
}

export interface SightengineType {
  ai_generated: number;
  ai_generators?: SightengineGenerators;
}

export interface SightengineDeepfake {
  score?: number;
}

export interface SightengineRequest {
  id: string;
  timestamp: number;
  operations: number;
}

export interface SightengineMedia {
  id: string;
  uri: string;
}

export interface SightengineResponse {
  status: "success" | "failure";
  request?: SightengineRequest;
  type?: SightengineType;
  deepfake?: SightengineDeepfake;
  weapon?: unknown;
  media?: SightengineMedia;
  error?: {
    type: string;
    code: number;
    message: string;
  };
}

// ─── Errors ──────────────────────────────────────────────────

export class SightengineApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly errorCode: string,
    public readonly retryable: boolean,
    public readonly rawBody?: string
  ) {
    super(message);
    this.name = "SightengineApiError";
  }
}

// ─── Client ──────────────────────────────────────────────────

export class SightengineClient {
  private config: SightengineClientConfig;

  constructor(config: SightengineClientConfig) {
    this.config = config;
    if (!this.config.apiUser || !this.config.apiSecret) {
      throw new Error(
        "SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET are required"
      );
    }
  }

  /**
   * Analyze an image via Sightengine check.json
   */
  async analyzeImage(
    buffer: Buffer,
    filename: string,
    models: string = "genai,deepfake"
  ): Promise<SightengineResponse> {
    const url = `${this.config.endpoint}/check.json`;
    return this.submitMedia(url, buffer, filename, "media", models);
  }

  /**
   * Analyze a video via Sightengine video/check-sync.json (short videos)
   * Sightengine sync video endpoint handles short clips.
   */
  async analyzeVideo(
    buffer: Buffer,
    filename: string,
    models: string = "genai,deepfake"
  ): Promise<SightengineResponse> {
    // For short videos, Sightengine offers a sync endpoint
    const url = `${this.config.endpoint}/video/check-sync.json`;
    return this.submitMedia(url, buffer, filename, "media", models);
  }

  /**
   * Core multipart submit with retries
   */
  private async submitMedia(
    url: string,
    buffer: Buffer,
    filename: string,
    fieldName: string,
    models: string
  ): Promise<SightengineResponse> {
    return this.callWithRetry(async () => {
      const formData = new FormData();

      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/octet-stream",
      });
      formData.append(fieldName, blob, filename);
      formData.append("models", models);
      formData.append("api_user", this.config.apiUser);
      formData.append("api_secret", this.config.apiSecret);

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs
      );

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw this.classifyHttpError(response.status, body);
        }

        const json = (await response.json()) as SightengineResponse;

        if (json.status === "failure") {
          throw new SightengineApiError(
            json.error?.message || "Sightengine returned failure",
            null,
            json.error?.type || "api_failure",
            false
          );
        }

        return json;
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof SightengineApiError) throw error;

        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          throw new SightengineApiError(
            "Sightengine request timed out",
            null,
            "timeout",
            true
          );
        }

        throw new SightengineApiError(
          error instanceof Error ? error.message : "Network error",
          null,
          "network_error",
          true
        );
      }
    });
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof SightengineApiError &&
          !error.retryable
        ) {
          throw error;
        }

        if (attempt < this.config.maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.warn(
            `[sightengine] attempt ${attempt + 1} failed, retrying in ${delayMs}ms: ${lastError.message}`
          );
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Classify HTTP errors
   */
  private classifyHttpError(
    status: number,
    body: string
  ): SightengineApiError {
    switch (status) {
      case 401:
      case 403:
        return new SightengineApiError(
          "Sightengine authentication failed",
          status,
          "auth_failed",
          false
        );
      case 400:
        return new SightengineApiError(
          "Invalid request to Sightengine",
          status,
          "invalid_request",
          false,
          body
        );
      case 413:
        return new SightengineApiError(
          "File too large for Sightengine",
          status,
          "file_too_large",
          false
        );
      case 429:
        return new SightengineApiError(
          "Sightengine rate limit exceeded",
          status,
          "rate_limited",
          true
        );
      default:
        if (status >= 500) {
          return new SightengineApiError(
            `Sightengine server error (${status})`,
            status,
            "server_error",
            true,
            body
          );
        }
        return new SightengineApiError(
          `Sightengine error (${status})`,
          status,
          "unknown_error",
          false,
          body
        );
    }
  }
}
