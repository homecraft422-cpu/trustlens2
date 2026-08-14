/**
 * TRUSTLENS Detection Engine — Core Types
 *
 * Normalized types that all detection providers must produce.
 * The application code depends ONLY on these types, never on
 * provider-specific structures.
 */

// ─── Modality ────────────────────────────────────────────────

export type Modality = "image" | "video" | "audio";

// ─── Signal types ────────────────────────────────────────────

/** Canonical signal types across all providers */
export type SignalType =
  | "ai_generated"
  | "ai_edited"
  | "deepfake"
  | "face_manipulation"
  | "voice_synthesis"
  | "voice_cloning"
  | "lip_sync"
  | "splice"
  | "copy_move"
  | "inpainting"
  | "metadata_anomaly"
  | "compression_anomaly"
  | "provenance_verified"
  | "provenance_absent"
  | "integrity_ok"
  | "integrity_issue"
  | "unknown";

export type SignalSeverity = "low" | "medium" | "high" | "critical";

export type EvidenceCategory =
  | "ai_detection"
  | "manipulation"
  | "audio"
  | "provenance"
  | "metadata"
  | "integrity"
  | "temporal";

// ─── Evidence ────────────────────────────────────────────────

export interface EvidenceItem {
  /** Unique id within this analysis */
  id: string;
  /** Broad category */
  category: EvidenceCategory;
  /** Specific signal type */
  type: SignalType;
  /** Human-readable title */
  title: string;
  /** Detailed explanation */
  description: string;
  /** Signal strength 0-1 (null if not quantifiable) */
  score: number | null;
  /** How confident the provider is in this specific evidence 0-1 */
  confidence: number | null;
  /** Severity */
  severity: SignalSeverity;
  /** Which provider produced this */
  source: string;
  /** Temporal: start timestamp in seconds (video/audio) */
  timestampStart?: number;
  /** Temporal: end timestamp in seconds (video/audio) */
  timestampEnd?: number;
  /** Video: frame number */
  frameNumber?: number;
  /** Arbitrary provider-specific metadata (never exposed to users) */
  providerMetadata?: Record<string, unknown>;
}

// ─── Detection Result (per-provider) ─────────────────────────

export interface DetectionResult {
  /** Provider identifier */
  provider: string;
  /** Provider version if available */
  providerVersion: string | null;
  /** What modality was analyzed */
  modality: Modality;
  /** AI generation probability 0-1 */
  aiProbability: number;
  /** Manipulation probability 0-1 */
  manipulationProbability: number;
  /** Provider's overall confidence in its results 0-1 */
  confidence: number;
  /** Detailed evidence items */
  evidence: EvidenceItem[];
  /** Time the provider took in ms */
  processingTimeMs: number | null;
  /** Provider-reported limitations for this analysis */
  limitations: string[];
  /** Whether this result came from a mock/demo provider */
  isMock: boolean;
}

// ─── Provider Failure ────────────────────────────────────────

export interface ProviderFailure {
  provider: string;
  errorCode: string;
  /** User-safe error message (no secrets / stack traces) */
  messageSafe: string;
  /** Is this error likely transient? */
  retryable: boolean;
  /** Internal-only detail */
  internalDetail?: string;
}

// ─── Detection Analysis (aggregated) ─────────────────────────

export interface DetectionAnalysis {
  /** All successful provider results */
  results: DetectionResult[];
  /** All provider failures */
  failures: ProviderFailure[];
  /** Merged, de-duplicated evidence from all providers */
  evidence: EvidenceItem[];
  /** Which providers were invoked */
  providersUsed: string[];
  /** Whether any results are mock */
  hasMockResults: boolean;
  /** Total processing wall-clock time in ms */
  totalProcessingTimeMs: number;
}

// ─── Asset Info ──────────────────────────────────────────────

export interface AssetInfo {
  id: string;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
  storageKey: string;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
}

// ─── Provider Interface ──────────────────────────────────────

export interface DetectionProvider {
  /** Unique, stable identifier for this provider */
  readonly name: string;
  /** Semver or arbitrary version string */
  readonly version: string;
  /** Which modalities this provider can handle */
  getSupportedModalities(): Modality[];
  /** Quick capability check */
  supportsModality(modality: Modality): boolean;

  /** Analyze an image asset */
  analyzeImage(asset: AssetInfo): Promise<DetectionResult>;
  /** Analyze a video asset */
  analyzeVideo(asset: AssetInfo): Promise<DetectionResult>;
  /** Analyze an audio asset (optional) */
  analyzeAudio?(asset: AssetInfo): Promise<DetectionResult>;
}

// ─── Provenance Analyzer ─────────────────────────────────────

export interface ProvenanceResult {
  /** Was any provenance information found? */
  found: boolean;
  /** Is the provenance cryptographically verified? */
  verified: boolean;
  /** Standard used (e.g. "c2pa") */
  standard: string | null;
  /** Issuer / signer if available */
  issuer: string | null;
  /** Evidence items produced */
  evidence: EvidenceItem[];
  /** Limitations */
  limitations: string[];
}

export interface ProvenanceAnalyzer {
  readonly name: string;
  analyze(asset: AssetInfo): Promise<ProvenanceResult>;
}
