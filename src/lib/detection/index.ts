/**
 * Detection Engine Module
 */

export * from "./types";
export { DetectionOrchestrator } from "./orchestrator";
export { DetectionProviderRegistry } from "./registry";
export { MockDetectionProvider } from "./mock-provider";
export { HiveDetectionProvider } from "./providers/hive-provider";
export { SightengineDetectionProvider } from "./providers/sightengine-provider";
export { C2paProvenanceAnalyzer } from "./provenance/c2pa-analyzer";
export { fuseProviderResults, type FusionResult, type ConsensusLevel, type ProviderScore } from "./fusion";
export { determineVerdict, type VerdictOutput, verdictToDbEnum } from "./verdict";
export {
  computeScores,
  type ScoringOutput,
  type Verdict,
  type ClassificationLevel,
  type ProvenanceStatus,
} from "./scoring";
