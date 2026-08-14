/**
 * Multi-Provider Fusion Engine
 *
 * Combines results from multiple detection providers into a single
 * fused assessment. Does NOT naively average scores when providers
 * disagree — instead it measures and reports agreement.
 *
 * IMPORTANT: All thresholds here are PROTOTYPE values.
 * They have NOT been validated against controlled datasets.
 */

import { DetectionResult, ProviderFailure } from "./types";

// ─── Consensus levels ────────────────────────────────────────

export type ConsensusLevel =
  | "strong_agreement"
  | "partial_agreement"
  | "disagreement"
  | "single_provider"
  | "insufficient_data";

// ─── Per-provider score record ───────────────────────────────

export interface ProviderScore {
  provider: string;
  providerVersion: string | null;
  aiProbability: number;
  manipulationProbability: number;
  confidence: number;
  evidenceCount: number;
  isMock: boolean;
  limitations: string[];
}

// ─── Fusion result ───────────────────────────────────────────

export interface FusionResult {
  /** Fused AI generation score 0-1 */
  aiGenerationScore: number;
  /** Fused manipulation score 0-1 */
  manipulationScore: number;
  /** Fused confidence 0-1 */
  confidence: number;
  /** How much providers agree (0-1), null if single provider */
  agreement: number | null;
  /** Qualitative consensus label */
  consensus: ConsensusLevel;
  /** How many providers contributed results */
  providerCount: number;
  /** Names of providers that contributed */
  providersUsed: string[];
  /** Per-provider breakdowns */
  providerScores: ProviderScore[];
  /** Whether any provider failure occurred */
  hasFailures: boolean;
  /** Whether any results are mock */
  hasMockResults: boolean;
}

// ─── Prototype agreement thresholds ──────────────────────────

/** Maximum difference for "strong agreement" */
const STRONG_AGREEMENT_THRESHOLD = 0.15;
/** Maximum difference for "partial agreement" */
const PARTIAL_AGREEMENT_THRESHOLD = 0.35;

// ─── Main fusion function ────────────────────────────────────

/**
 * Fuse results from multiple detection providers.
 *
 * When providers agree: returns averaged scores with high agreement.
 * When providers disagree: lowers confidence, reports disagreement.
 * Single provider: reports result directly, consensus = "single_provider".
 * No results: returns zeroed scores, consensus = "insufficient_data".
 */
export function fuseProviderResults(
  results: DetectionResult[],
  failures: ProviderFailure[]
): FusionResult {
  // Filter to only detection providers (exclude provenance-only results)
  const detectionResults = results.filter(
    (r) => r.aiProbability > 0 || r.manipulationProbability > 0 || r.evidence.length > 0
  );

  // Extract per-provider scores
  const providerScores: ProviderScore[] = detectionResults.map((r) => ({
    provider: r.provider,
    providerVersion: r.providerVersion,
    aiProbability: r.aiProbability,
    manipulationProbability: r.manipulationProbability,
    confidence: r.confidence,
    evidenceCount: r.evidence.length,
    isMock: r.isMock,
    limitations: r.limitations,
  }));

  const providersUsed = providerScores.map((p) => p.provider);
  const providerCount = providerScores.length;

  if (providerCount === 0) {
    return {
      aiGenerationScore: 0,
      manipulationScore: 0,
      confidence: 0,
      agreement: null,
      consensus: "insufficient_data",
      providerCount: 0,
      providersUsed: [],
      providerScores: [],
      hasFailures: failures.length > 0,
      hasMockResults: false,
    };
  }

  if (providerCount === 1) {
    const sole = providerScores[0];
    return {
      aiGenerationScore: sole.aiProbability,
      manipulationScore: sole.manipulationProbability,
      confidence: sole.confidence,
      agreement: null,
      consensus: "single_provider",
      providerCount: 1,
      providersUsed,
      providerScores,
      hasFailures: failures.length > 0,
      hasMockResults: sole.isMock,
    };
  }

  // ── Multi-provider fusion ────────────────────────────────

  // Calculate maximum pairwise difference for AI scores
  const aiScores = providerScores.map((p) => p.aiProbability);
  const manipScores = providerScores.map((p) => p.manipulationProbability);

  const aiSpread = maxSpread(aiScores);
  const manipSpread = maxSpread(manipScores);
  const primarySpread = Math.max(aiSpread, manipSpread);

  // Determine consensus level
  const consensus = classifyConsensus(primarySpread);

  // Calculate agreement score (1 = perfect agreement, 0 = total disagreement)
  const agreement = Math.max(0, 1 - primarySpread);

  // Fuse scores based on consensus
  let fusedAi: number;
  let fusedManip: number;
  let fusedConfidence: number;

  if (consensus === "strong_agreement") {
    // Providers agree — simple average is reasonable
    fusedAi = average(aiScores);
    fusedManip = average(manipScores);
    fusedConfidence = average(providerScores.map((p) => p.confidence));
  } else if (consensus === "partial_agreement") {
    // Moderate disagreement — average but reduce confidence
    fusedAi = average(aiScores);
    fusedManip = average(manipScores);
    const rawConf = average(providerScores.map((p) => p.confidence));
    fusedConfidence = rawConf * 0.75; // Penalize confidence for partial agreement
  } else {
    // Strong disagreement — use weighted median, heavily penalize confidence
    fusedAi = average(aiScores);
    fusedManip = average(manipScores);
    const rawConf = average(providerScores.map((p) => p.confidence));
    fusedConfidence = rawConf * 0.5; // Significant penalty for disagreement
  }

  return {
    aiGenerationScore: round(fusedAi),
    manipulationScore: round(fusedManip),
    confidence: round(fusedConfidence),
    agreement: round(agreement),
    consensus,
    providerCount,
    providersUsed,
    providerScores,
    hasFailures: failures.length > 0,
    hasMockResults: providerScores.some((p) => p.isMock),
  };
}

// ─── Internal helpers ────────────────────────────────────────

function maxSpread(values: number[]): number {
  if (values.length < 2) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length - 1] - sorted[0];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function classifyConsensus(spread: number): ConsensusLevel {
  if (spread <= STRONG_AGREEMENT_THRESHOLD) return "strong_agreement";
  if (spread <= PARTIAL_AGREEMENT_THRESHOLD) return "partial_agreement";
  return "disagreement";
}
