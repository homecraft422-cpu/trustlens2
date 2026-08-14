/**
 * Hive AI HTTP Client
 *
 * Isolated HTTP layer for calling Hive API endpoints.
 * Handles authentication, timeouts, retries, and error normalization.
 *
 * NEVER exposes API keys outside this module.
 *
 * Hive API docs: https://docs.thehive.ai/reference
 */

// ─── Configuration ───────────────────────────────────────────

export interface HiveClientConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
}

export function getHiveConfig(): HiveClientConfig {
  return {
    apiKey: process.env.HIVE_API_KEY || "",
    baseUrl: process.env.HIVE_API_BASE_URL || "https://api.thehive.ai/api/v2/task/sync",
    timeoutMs: parseInt(process.env.HIVE_TIMEOUT_MS || "60000", 10),
    maxRetries: parseInt(process.env.HIVE_MAX_RETRIES || "2", 10),
  };
}

// ─── Hive API Response Types ─────────────────────────────────

export interface HiveClassScore {
  class: string;
  score: number;
}

export interface HiveC2paData {
  claim_generator?: string;
  actions_software_agent?: string;
  actions_action?: string;
  actions_digital_source_type?: string;
}

export interface HiveAlgorithmicTags {
  c2pa?: HiveC2paData;
  xmp?: Record<string, string>;
  exif?: Record<string, string>;
}

export interface HiveOutputFrame {
  classes: HiveClassScore[];
  time?: number;
  algorithmic_tags?: HiveAlgorithmicTags;
}

export interface HiveInputMedia {
  type: string;
  mime_type?: string;
  mimetype?: string;
  width?: number;
  height?: number;
  num_frames?: number;
  duration?: number;
}

export interface HiveInput {
  id: string;
  model: string;
  model_version?: number;
  media?: HiveInputMedia;
}

export interface HiveStatusResponse {
  status: {
    code: string;
    message: string;
  };
  response: {
    input: HiveInput;
    output: HiveOutputFrame[];
  };
}

export interface HiveAPIResponse {
  status: HiveStatusResponse[];
}

// ─── Error types ─────────────────────────────────────────────

export class HiveApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly errorCode: string,
    public readonly retryable: boolean,
    public readonly rawBody?: string
  ) {
    super(message);
    this.name = "HiveApiError";
  }
}

// ─── Client ──────────────────────────────────────────────────

export class HiveClient {
  private config: HiveClientConfig;

  constructor(config: HiveClientConfig) {
    this.config = config;
    if (!this.config.apiKey) {
      throw new Error("HIVE_API_KEY is required for production detection mode");
    }
  }

  /**
   * Submit media to Hive AI-Generated Image/Video Detection model.
   * Hive v2 sync endpoint: POST with multipart form data.
   *
   * The `models` field specifies which detection model(s) to run.
   */
  async analyzeMedia(
    buffer: Buffer,
    filename: string,
    models: string[]
  ): Promise<HiveAPIResponse> {
    return this.callWithRetry(async () => {
      const formData = new FormData();

      const blob = new Blob([new Uint8Array(buffer)], { type: "application/octet-stream" });
      formData.append("media", blob, filename);

      // Hive v2 accepts a JSON array of model names
      for (const model of models) {
        formData.append("models", model);
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs
      );

      try {
        const response = await fetch(this.config.baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Token ${this.config.apiKey}`,
            Accept: "application/json",
          },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw this.classifyHttpError(response.status, body);
        }

        const json = await response.json();
        return json as HiveAPIResponse;
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof HiveApiError) throw error;

        if (error instanceof DOMException && error.name === "AbortError") {
          throw new HiveApiError(
            "Hive API request timed out",
            null,
            "timeout",
            true
          );
        }

        throw new HiveApiError(
          error instanceof Error ? error.message : "Network error",
          null,
          "network_error",
          true
        );
      }
    });
  }

  /**
   * Retry wrapper with exponential backoff.
   * Only retries on retryable errors.
   */
  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof HiveApiError && !error.retryable) {
          throw error; // Non-retryable, bail immediately
        }

        if (attempt < this.config.maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(
            `Hive API attempt ${attempt + 1} failed, retrying in ${delayMs}ms: ${lastError.message}`
          );
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Classify HTTP status codes into structured errors.
   */
  private classifyHttpError(status: number, body: string): HiveApiError {
    switch (status) {
      case 401:
      case 403:
        return new HiveApiError(
          "Hive API authentication failed",
          status,
          "auth_failed",
          false
        );
      case 400:
        return new HiveApiError(
          "Invalid request to Hive API",
          status,
          "invalid_request",
          false,
          body
        );
      case 413:
        return new HiveApiError(
          "File too large for Hive API",
          status,
          "file_too_large",
          false
        );
      case 415:
        return new HiveApiError(
          "Unsupported media type",
          status,
          "unsupported_media",
          false
        );
      case 429:
        return new HiveApiError(
          "Hive API rate limit exceeded",
          status,
          "rate_limited",
          true
        );
      default:
        if (status >= 500) {
          return new HiveApiError(
            `Hive API server error (${status})`,
            status,
            "server_error",
            true,
            body
          );
        }
        return new HiveApiError(
          `Hive API error (${status})`,
          status,
          "unknown_error",
          false,
          body
        );
    }
  }
}
