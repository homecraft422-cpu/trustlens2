/**
 * Verdict Engine
 *
 * Determines the final human-readable verdict from fused scores,
 * provider agreement, and evidence.
 *
 * IMPORTANT: This is a PROTOTYPE verdict model.
 * Never claims absolute certainty.
 */

import { FusionResult, ConsensusLevel } from "./fusion";
import { EvidenceItem } from "./types";
import { config } from "../config";

// ─── Verdict types ───────────────────────────────────────────

export type Verdict =
  | "likely_ai_generated"
  | "possibly_ai_generated"
  | "inconclusive"
  | "likely_authentic"
  | "possibly_manipulated"
  | "detection_unavailable"
  | "insufficient_evidence";

export type ProvenanceStatus =
  | "verified"
  | "not_verified"
  | "unavailable"
  | "detected_unverified";

export type ClassificationLevel =
  | "level_0"
  | "level_1"
  | "level_2"
  | "level_3"
  | "level_4"
  | "level_5";

// ─── Verdict output ──────────────────────────────────────────

export interface VerdictOutput {
  verdict: Verdict;
  classificationLevel: ClassificationLevel;
  provenanceStatus: ProvenanceStatus;
  summary: string;
}

export const classificationDescriptions: Record<ClassificationLevel, string> = {
  level_0: "No meaningful AI evidence detected",
  level_1: "AI-assisted",
  level_2: "AI-enhanced",
  level_3: "AI-generated component",
  level_4: "Heavily synthetic",
  level_5: "Predominantly synthetic",
};

// ─── Verdict labels for DB enum compatibility ─────────────

/** Map the new verdict to the DB enum value */
export function verdictToDbEnum(v: Verdict): string {
  switch (v) {
    case "likely_ai_generated": return "likely_ai_generated";
    case "possibly_ai_generated": return "unverified"; // maps to existing enum
    case "inconclusive": return "unverified";
    case "likely_authentic": return "likely_authentic";
    case "possibly_manipulated": return "possibly_manipulated";
    case "detection_unavailable": return "insufficient_evidence";
    case "insufficient_evidence": return "insufficient_evidence";
  }
}

// ─── Main function ───────────────────────────────────────────

export function determineVerdict(
  fusion: FusionResult,
  evidence: EvidenceItem[]
): VerdictOutput {
  const { aiGenerationScore, manipulationScore, confidence, consensus, providerCount } = fusion;
  const {
    aiHighThreshold,
    aiMediumThreshold,
    manipulationHighThreshold,
    manipulationMediumThreshold,
    confidenceMediumThreshold,
  } = config.scoring;

  // No providers → unavailable
  if (providerCount === 0) {
    return {
      verdict: "detection_unavailable",
      classificationLevel: "level_0",
      provenanceStatus: determineProvenance(evidence),
      summary: "No detection providers were available. Analysis could not be completed.",
    };
  }

  // Low confidence → insufficient evidence
  if (confidence < confidenceMediumThreshold) {
    return {
      verdict: "insufficient_evidence",
      classificationLevel: determineClassification(aiGenerationScore),
      provenanceStatus: determineProvenance(evidence),
      summary: "Insufficient evidence was available to draw a reliable conclusion about this content.",
    };
  }

  // Provider disagreement → inconclusive (never force a binary verdict)
  if (consensus === "disagreement" && providerCount >= 2) {
    return {
      verdict: "inconclusive",
      classificationLevel: determineClassification(aiGenerationScore),
      provenanceStatus: determineProvenance(evidence),
      summary:
        "Detection providers produced materially different results. " +
        "The analysis is inconclusive and should not be treated as reliable.",
    };
  }

  // Strong AI signal
  if (aiGenerationScore >= aiHighThreshold) {
    // If partial agreement with high AI, downgrade to "possibly"
    if (consensus === "partial_agreement") {
      return {
        verdict: "possibly_ai_generated",
        classificationLevel: determineClassification(aiGenerationScore),
        provenanceStatus: determineProvenance(evidence),
        summary:
          "Detection providers indicate possible AI generation, though results are not fully consistent across all providers.",
      };
    }
    return {
      verdict: "likely_ai_generated",
      classificationLevel: determineClassification(aiGenerationScore),
      provenanceStatus: determineProvenance(evidence),
      summary: "Analysis detected strong signals consistent with AI-generated content.",
    };
  }

  // Manipulation signal
  if (manipulationScore >= manipulationHighThreshold) {
    return {
      verdict: "possibly_manipulated",
      classificationLevel: determineClassification(aiGenerationScore),
      provenanceStatus: determineProvenance(evidence),
      summary: "Analysis detected signals that suggest the content may have been manipulated or altered.",
    };
  }

  // Medium signals → possibly AI or unverified
  if (aiGenerationScore >= aiMediumThreshold) {
    return {
      verdict: "possibly_ai_generated",
      classificationLevel: determineClassification(aiGenerationScore),
      provenanceStatus: determineProvenance(evidence),
      summary:
        "Analysis detected moderate AI-related signals. The content may contain AI-generated or AI-assisted components.",
    };
  }

  if (manipulationScore >= manipulationMediumThreshold) {
    return {
      verdict: "possibly_manipulated",
      classificationLevel: determineClassification(aiGenerationScore),
      provenanceStatus: determineProvenance(evidence),
      summary:
        "Analysis detected some manipulation signals, but the evidence is not strong enough for a definitive assessment.",
    };
  }

  // Low signals → likely authentic
  return {
    verdict: "likely_authentic",
    classificationLevel: determineClassification(aiGenerationScore),
    provenanceStatus: determineProvenance(evidence),
    summary:
      "Analysis suggests the content is likely authentic with no strong evidence of AI generation or manipulation.",
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function determineClassification(aiScore: number): ClassificationLevel {
  if (aiScore < 0.1) return "level_0";
  if (aiScore < 0.25) return "level_1";
  if (aiScore < 0.45) return "level_2";
  if (aiScore < 0.65) return "level_3";
  if (aiScore < 0.85) return "level_4";
  return "level_5";
}

function determineProvenance(evidence: EvidenceItem[]): ProvenanceStatus {
  let hasProvenance = false;
  let isVerified = false;
  for (const e of evidence) {
    if (e.category === "provenance") {
      hasProvenance = true;
      if (e.type === "provenance_verified") isVerified = true;
    }
  }
  if (isVerified) return "verified";
  if (hasProvenance) return "not_verified";
  return "unavailable";
}
