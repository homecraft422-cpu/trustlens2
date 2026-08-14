/**
 * Application Configuration
 *
 * Centralized configuration for all application settings.
 * Values can be overridden via environment variables.
 */

export const config = {
  auth: {
    secret: process.env.AUTH_SECRET || "dev-secret-change-in-production",
    sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  detection: {
    mode: (process.env.DETECTION_MODE || "mock") as "mock" | "production",
    /** Which providers to use (comma-separated). Empty = all available. */
    providers: process.env.DETECTION_PROVIDERS || "",
  },

  hive: {
    apiKey: process.env.HIVE_API_KEY || "",
    baseUrl:
      process.env.HIVE_API_BASE_URL ||
      "https://api.thehive.ai/api/v2/task/sync",
    timeoutMs: parseInt(process.env.HIVE_TIMEOUT_MS || "60000", 10),
    maxRetries: parseInt(process.env.HIVE_MAX_RETRIES || "2", 10),
  },

  sightengine: {
    apiUser: process.env.SIGHTENGINE_API_USER || "",
    apiSecret: process.env.SIGHTENGINE_API_SECRET || "",
    endpoint:
      process.env.SIGHTENGINE_ENDPOINT ||
      "https://api.sightengine.com/1.0",
    timeoutMs: parseInt(process.env.SIGHTENGINE_TIMEOUT_MS || "30000", 10),
    maxRetries: parseInt(process.env.SIGHTENGINE_MAX_RETRIES || "1", 10),
  },

  limits: {
    guest: parseInt(process.env.GUEST_ANALYSIS_LIMIT || "3", 10),
    user: parseInt(process.env.USER_ANALYSIS_LIMIT || "10", 10),
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    maxAudioSize: 50 * 1024 * 1024, // 50MB
    maxVideoDuration: 60, // seconds
  },

  /**
   * Scoring Engine Thresholds — PROTOTYPE values.
   */
  scoring: {
    aiHighThreshold: parseFloat(process.env.AI_HIGH_THRESHOLD || "0.75"),
    aiMediumThreshold: parseFloat(process.env.AI_MEDIUM_THRESHOLD || "0.45"),
    manipulationHighThreshold: parseFloat(
      process.env.MANIPULATION_HIGH_THRESHOLD || "0.7"
    ),
    manipulationMediumThreshold: parseFloat(
      process.env.MANIPULATION_MEDIUM_THRESHOLD || "0.4"
    ),
    confidenceHighThreshold: parseFloat(
      process.env.CONFIDENCE_HIGH_THRESHOLD || "0.7"
    ),
    confidenceMediumThreshold: parseFloat(
      process.env.CONFIDENCE_MEDIUM_THRESHOLD || "0.3"
    ),
  },

  supportedImageTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ] as const,
  supportedVideoTypes: [
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ] as const,
  supportedAudioTypes: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/aac",
    "audio/m4a",
    "audio/webm",
    "audio/mp4",
  ] as const,
};

export function isImageType(mime: string): boolean {
  return (config.supportedImageTypes as readonly string[]).includes(mime);
}

export function isVideoType(mime: string): boolean {
  return (config.supportedVideoTypes as readonly string[]).includes(mime);
}

export function isAudioType(mime: string): boolean {
  return (config.supportedAudioTypes as readonly string[]).includes(mime);
}

export function isSupportedType(mime: string): boolean {
  return isImageType(mime) || isVideoType(mime) || isAudioType(mime);
}

export function getSupportedFormatsText(): string {
  return "JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, M4A";
}

/**
 * Validate configuration at startup.
 * In production mode, at least one provider must have credentials.
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.detection.mode === "production") {
    const hasHive = !!config.hive.apiKey;
    const hasSightengine = !!config.sightengine.apiUser && !!config.sightengine.apiSecret;

    if (!hasHive && !hasSightengine) {
      errors.push(
        "DETECTION_MODE=production requires at least one provider. " +
        "Set HIVE_API_KEY or SIGHTENGINE_API_USER + SIGHTENGINE_API_SECRET."
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
