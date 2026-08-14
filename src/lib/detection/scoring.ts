/**
 * Scoring Engine
 *
 * IMPORTANT: This is a PROTOTYPE scoring model.
 * It has NOT been scientifically validated against real-world datasets.
 *
 * Consumes a DetectionAnalysis (multi-provider) and produces:
 *  - Fused scores via FusionEngine
 *  - Verdict via VerdictEngine
 *  - A unified ScoringOutput for storage and display
 */

import { DetectionAnalysis } from "./types";
import { fuseProviderResults, type FusionResult, type ConsensusLevel, type ProviderScore } from "./fusion";
import {
  determineVerdict,
  verdictToDbEnum,
  type ClassificationLevel,
  type ProvenanceStatus,
  classificationDescriptions,
} from "./verdict";

// ─── Re-export for consumers ─────────────────────────────────

export type { ClassificationLevel, ProvenanceStatus, ConsensusLevel, ProviderScore };
export { classificationDescriptions };

// ─── DB-compatible verdict type ──────────────────────────────

export type Verdict =
  | "likely_authentic"
  | "possibly_manipulated"
  | "likely_ai_generated"
  | "unverified"
  | "insufficient_evidence";

// ─── Output ──────────────────────────────────────────────────

export interface ScoringOutput {
  /** AI involvement percentage (0-100) */
  aiInvolvementScore: number;
  /** Manipulation likelihood percentage (0-100) */
  manipulationScore: number;
  /** Evidence confidence percentage (0-100) */
  confidenceScore: number;
  /** AI classification level */
  classificationLevel: ClassificationLevel;
  /** DB-compatible verdict */
  verdict: Verdict;
  /** Provenance status */
  provenanceStatus: ProvenanceStatus;
  /** Human-readable summary */
  summary: string;
  /** Provider agreement info */
  providerAgreement: {
    consensus: ConsensusLevel;
    agreement: number | null;
    providerCount: number;
    providersUsed: string[];
    providerScores: ProviderScore[];
    hasFailures: boolean;
  };
}

// ─── Main scoring function ───────────────────────────────────

export function computeScores(analysis: DetectionAnalysis): ScoringOutput {
  // Step 1: Fuse provider results
  const fusion = fuseProviderResults(analysis.results, analysis.failures);

  // Step 2: Determine verdict
  const verdictOutput = determineVerdict(fusion, analysis.evidence);

  // Step 3: Map to DB-compatible verdict enum
  const dbVerdict = verdictToDbEnum(verdictOutput.verdict) as Verdict;

  return {
    aiInvolvementScore: Math.round(fusion.aiGenerationScore * 100),
    manipulationScore: Math.round(fusion.manipulationScore * 100),
    confidenceScore: Math.round(fusion.confidence * 100),
    classificationLevel: verdictOutput.classificationLevel,
    verdict: dbVerdict,
    provenanceStatus: verdictOutput.provenanceStatus,
    summary: verdictOutput.summary,
    providerAgreement: {
      consensus: fusion.consensus,
      agreement: fusion.agreement,
      providerCount: fusion.providerCount,
      providersUsed: fusion.providersUsed,
      providerScores: fusion.providerScores,
      hasFailures: fusion.hasFailures,
    },
  };
}
