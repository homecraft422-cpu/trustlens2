/**
 * Detection Orchestrator
 *
 * Coordinates multiple detection providers for a single asset.
 * Collects results, handles failures gracefully, and returns
 * a normalized DetectionAnalysis.
 *
 * Provider registration:
 *   mock mode       → MockDetectionProvider only
 *   production mode → Hive (if HIVE_API_KEY set)
 *                   → Sightengine (if SIGHTENGINE_API_USER + SIGHTENGINE_API_SECRET set)
 *                   → C2PA provenance analyzer
 *
 * One provider failure must NEVER crash the entire analysis.
 * Production mode NEVER falls back to Mock.
 */

import {
  DetectionProvider,
  DetectionResult,
  DetectionAnalysis,
  ProviderFailure,
  EvidenceItem,
  AssetInfo,
  Modality,
} from "./types";
import { DetectionProviderRegistry } from "./registry";
import { LocalDetectionProvider } from "./providers/local-provider";
import { C2paProvenanceAnalyzer } from "./provenance/c2pa-analyzer";
import { config } from "../config";

export class DetectionOrchestrator {
  private registry: DetectionProviderRegistry;

  constructor() {
    this.registry = new DetectionProviderRegistry();

    if (config.detection.mode === "mock") {
      // ── Local mode ─────────────────────────────────────────
      // Built-in deterministic heuristic engine: real file metadata and
      // statistical analysis. Same file always produces the same report.
      this.registry.register(new LocalDetectionProvider());

    } else if (config.detection.mode === "production") {
      // ── Production mode ────────────────────────────────────

      // Hive
      if (process.env.HIVE_API_KEY) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { HiveDetectionProvider } = require("./providers/hive-provider");
          this.registry.register(new HiveDetectionProvider());
        } catch (e) {
          console.error("[detection] Failed to initialize Hive provider:", e);
        }
      }

      // Sightengine
      if (process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { SightengineDetectionProvider } = require("./providers/sightengine-provider");
          this.registry.register(new SightengineDetectionProvider());
        } catch (e) {
          console.error("[detection] Failed to initialize Sightengine provider:", e);
        }
      }

      // Warn if no detection providers available
      if (this.registry.count === 0) {
        console.error(
          "DETECTION_MODE=production but no provider credentials are set. " +
          "Set HIVE_API_KEY and/or SIGHTENGINE_API_USER + SIGHTENGINE_API_SECRET."
        );
      }

      // Provenance
      this.registry.registerProvenanceAnalyzer(new C2paProvenanceAnalyzer());
    }
  }

  // ─── Public analysis entry points ────────────────────────

  async analyzeImage(asset: AssetInfo): Promise<DetectionAnalysis> {
    return this.analyze("image", asset);
  }

  async analyzeVideo(asset: AssetInfo): Promise<DetectionAnalysis> {
    return this.analyze("video", asset);
  }

  async analyzeAudio(asset: AssetInfo): Promise<DetectionAnalysis> {
    return this.analyze("audio", asset);
  }

  // ─── Core orchestration ──────────────────────────────────

  private async analyze(
    modality: Modality,
    asset: AssetInfo
  ): Promise<DetectionAnalysis> {
    const wallStart = Date.now();

    const providers = this.registry.getForModality(modality);

    if (providers.length === 0) {
      return {
        results: [],
        failures: [],
        evidence: [],
        providersUsed: [],
        hasMockResults: false,
        totalProcessingTimeMs: Date.now() - wallStart,
      };
    }

    const results: DetectionResult[] = [];
    const failures: ProviderFailure[] = [];
    const providersUsed: string[] = [];

    // Run each provider independently
    for (const provider of providers) {
      providersUsed.push(provider.name);
      try {
        const result = await this.invokeProvider(provider, modality, asset);
        results.push(result);

        console.log(
          `[detection] provider=${provider.name} modality=${modality} ` +
          `asset=${asset.id} ai=${result.aiProbability.toFixed(3)} ` +
          `manip=${result.manipulationProbability.toFixed(3)} ` +
          `confidence=${result.confidence.toFixed(3)} ` +
          `latency=${result.processingTimeMs}ms ` +
          `evidence=${result.evidence.length} mock=${result.isMock}`
        );
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown error";
        const errorCode =
          (error as { errorCode?: string })?.errorCode || "provider_error";
        const retryable =
          (error as { retryable?: boolean })?.retryable ?? true;

        console.error(
          `[detection] FAIL provider=${provider.name} modality=${modality} ` +
          `asset=${asset.id} code=${errorCode} retryable=${retryable}`
        );

        failures.push({
          provider: provider.name,
          errorCode,
          messageSafe: `Detection provider "${provider.name}" was unavailable for this analysis.`,
          retryable,
          internalDetail: detail,
        });
      }
    }

    // Run provenance analyzers
    const provenanceAnalyzers = this.registry.getProvenanceAnalyzers();
    for (const analyzer of provenanceAnalyzers) {
      try {
        const provenanceResult = await analyzer.analyze(asset);
        if (provenanceResult.evidence.length > 0) {
          results.push({
            provider: analyzer.name,
            providerVersion: null,
            modality,
            aiProbability: 0,
            manipulationProbability: 0,
            confidence: provenanceResult.verified ? 0.95 : 0.5,
            evidence: provenanceResult.evidence,
            processingTimeMs: null,
            limitations: provenanceResult.limitations,
            isMock: false,
          });
        }
      } catch (error) {
        console.error(
          `[detection] provenance analyzer ${analyzer.name} failed:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Merge evidence from all results
    const allEvidence: EvidenceItem[] = [];
    for (const r of results) {
      allEvidence.push(...r.evidence);
    }

    return {
      results,
      failures,
      evidence: allEvidence,
      providersUsed,
      hasMockResults: results.some((r) => r.isMock),
      totalProcessingTimeMs: Date.now() - wallStart,
    };
  }

  // ─── Provider invocation ─────────────────────────────────

  private async invokeProvider(
    provider: DetectionProvider,
    modality: Modality,
    asset: AssetInfo
  ): Promise<DetectionResult> {
    switch (modality) {
      case "image":
        return provider.analyzeImage(asset);
      case "video":
        return provider.analyzeVideo(asset);
      case "audio":
        if (!provider.analyzeAudio) {
          throw new Error(
            `Provider ${provider.name} does not support audio analysis`
          );
        }
        return provider.analyzeAudio(asset);
      default:
        throw new Error(`Unsupported modality: ${modality}`);
    }
  }

  /** Get the underlying registry for inspection */
  getRegistry(): DetectionProviderRegistry {
    return this.registry;
  }
}
