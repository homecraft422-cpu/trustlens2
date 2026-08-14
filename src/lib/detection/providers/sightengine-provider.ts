/**
 * Sightengine Detection Provider
 *
 * Integrates Sightengine's AI-Generated Image/Video Detection and
 * Deepfake Detection APIs into the TRUSTLENS DetectionProvider interface.
 *
 * Sightengine API:
 *  - POST /1.0/check.json   (images: models=genai,deepfake)
 *  - POST /1.0/video/check-sync.json (short videos: models=genai,deepfake)
 *
 * Response shape:
 *   { status: "success", type: { ai_generated: 0.xx, ai_generators: {...} }, deepfake: { score: 0.xx }, ... }
 *
 * This provider NEVER exposes raw Sightengine responses to users.
 */

import {
  DetectionProvider,
  DetectionResult,
  AssetInfo,
  EvidenceItem,
  Modality,
  SignalSeverity,
} from "../types";
import {
  SightengineClient,
  SightengineClientConfig,
  SightengineResponse,
  SightengineApiError,
  getSightengineConfig,
} from "./sightengine-client";
import { getStorage } from "../../storage";
import { nanoid } from "nanoid";

// ─── Helpers ─────────────────────────────────────────────────

function eid(): string {
  return nanoid(8);
}

function severity(score: number): SignalSeverity {
  if (score >= 0.9) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

const GENERATOR_LABELS: Record<string, string> = {
  dalle: "DALL-E",
  firefly: "Adobe Firefly",
  flux: "Flux",
  gan: "GAN",
  gpt: "GPT",
  higgsfield: "Higgsfield",
  ideogram: "Ideogram",
  imagen: "Imagen",
  kling: "Kling",
  midjourney: "Midjourney",
  qwen: "Qwen",
  recraft: "Recraft",
  reve: "Reve",
  seedream: "SeeDream",
  stable_diffusion: "Stable Diffusion",
  wan: "Wan",
  z_image: "Z-Image",
  other: "Other generator",
};

function formatGenerator(key: string): string {
  return GENERATOR_LABELS[key] || key;
}

// ─── Provider ────────────────────────────────────────────────

export class SightengineDetectionProvider implements DetectionProvider {
  readonly name = "sightengine";
  readonly version = "v1.0";
  private client: SightengineClient;

  constructor(cfg?: SightengineClientConfig) {
    const config = cfg || getSightengineConfig();
    this.client = new SightengineClient(config);
  }

  getSupportedModalities(): Modality[] {
    return ["image", "video"];
  }

  supportsModality(modality: Modality): boolean {
    return modality === "image" || modality === "video";
  }

  // ─── Image ───────────────────────────────────────────────

  async analyzeImage(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    const buffer = await this.downloadAsset(asset);

    const response = await this.client.analyzeImage(
      buffer,
      asset.originalFilename,
      "genai,deepfake"
    );

    return this.normalizeResponse(response, "image", start);
  }

  // ─── Video ───────────────────────────────────────────────

  async analyzeVideo(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    const buffer = await this.downloadAsset(asset);

    const response = await this.client.analyzeVideo(
      buffer,
      asset.originalFilename,
      "genai,deepfake"
    );

    return this.normalizeResponse(response, "video", start);
  }

  // Audio: Sightengine does not offer speech detection — omitted
  // (provider.analyzeAudio remains undefined per the interface)

  // ─── Download ────────────────────────────────────────────

  private async downloadAsset(asset: AssetInfo): Promise<Buffer> {
    const storage = getStorage();
    const buffer = await storage.download(asset.storageKey);
    if (!buffer) {
      throw new SightengineApiError(
        "Could not download asset from storage",
        null,
        "storage_error",
        false
      );
    }
    return buffer;
  }

  // ─── Normalize ───────────────────────────────────────────

  private normalizeResponse(
    res: SightengineResponse,
    modality: Modality,
    startTime: number
  ): DetectionResult {
    const evidence: EvidenceItem[] = [];
    const limitations: string[] = [];

    // AI generation score
    const aiScore = res.type?.ai_generated ?? 0;

    if (aiScore > 0.1) {
      evidence.push({
        id: eid(),
        category: "ai_detection",
        type: "ai_generated",
        title:
          aiScore >= 0.9
            ? "Strong AI-generation signal detected"
            : aiScore >= 0.5
              ? "Possible AI-generation signal detected"
              : "Weak AI-generation signal detected",
        description:
          `AI-generation probability: ${(aiScore * 100).toFixed(1)}%. ` +
          "Based on pixel-level analysis by the detection model.",
        score: aiScore,
        confidence: aiScore >= 0.9 ? 0.95 : aiScore >= 0.5 ? 0.8 : 0.6,
        severity: severity(aiScore),
        source: this.name,
        providerMetadata: { requestId: res.request?.id },
      });
    } else {
      evidence.push({
        id: eid(),
        category: "ai_detection",
        type: "unknown",
        title: "No strong AI-generation signal",
        description:
          "The detection model did not find strong evidence of AI generation.",
        score: aiScore,
        confidence: 0.85,
        severity: "low",
        source: this.name,
      });
    }

    // Generator attribution
    const generators = res.type?.ai_generators;
    if (generators && aiScore > 0.5) {
      const sorted = Object.entries(generators)
        .filter(([, v]) => v > 0.05)
        .sort(([, a], [, b]) => b - a);

      if (sorted.length > 0) {
        const [topKey, topScore] = sorted[0];
        evidence.push({
          id: eid(),
          category: "ai_detection",
          type: "ai_generated",
          title: "Possible AI generator identified",
          description:
            `Detection signal is most consistent with ${formatGenerator(topKey)} ` +
            `(signal strength: ${(topScore * 100).toFixed(1)}%). ` +
            "Generator attribution is probabilistic and should not be treated as absolute proof.",
          score: topScore,
          confidence: topScore >= 0.8 ? 0.85 : 0.6,
          severity: "medium",
          source: this.name,
          providerMetadata: {
            topGenerators: sorted.slice(0, 3).map(([k, v]) => ({
              generator: k,
              score: v,
            })),
          },
        });
      }
    }

    // Deepfake score
    const deepfakeScore = res.deepfake?.score ?? 0;

    if (deepfakeScore > 0.3) {
      evidence.push({
        id: eid(),
        category: "manipulation",
        type: "deepfake",
        title:
          deepfakeScore >= 0.7
            ? "Deepfake signal detected"
            : "Possible deepfake signal",
        description:
          `Deepfake detection probability: ${(deepfakeScore * 100).toFixed(1)}%. ` +
          "This indicates possible face manipulation or synthesis.",
        score: deepfakeScore,
        confidence: deepfakeScore >= 0.7 ? 0.9 : 0.65,
        severity: severity(deepfakeScore),
        source: this.name,
      });
    }

    // Provenance: Sightengine is pixel-only, no C2PA support
    evidence.push({
      id: eid(),
      category: "provenance",
      type: "provenance_absent",
      title: "No Content Credentials analyzed",
      description:
        "This provider performs pixel-level analysis only. " +
        "No provenance or Content Credentials were checked by this provider. " +
        "This does not mean the media is AI-generated.",
      score: null,
      confidence: null,
      severity: "low",
      source: this.name,
    });

    const manipulationProbability = deepfakeScore;
    const confidence = Math.min(
      0.95,
      0.65 + (aiScore > 0.9 ? 0.2 : 0) + (deepfakeScore > 0.5 ? 0.05 : 0)
    );

    limitations.push(
      "Detection is pixel-based and probabilistic. No metadata or provenance is used."
    );
    if (modality === "video") {
      limitations.push(
        "Video analysis quality depends on resolution and encoding."
      );
    }

    return {
      provider: this.name,
      providerVersion: this.version,
      modality,
      aiProbability: aiScore,
      manipulationProbability,
      confidence,
      evidence,
      processingTimeMs: Date.now() - startTime,
      limitations,
      isMock: false,
    };
  }
}
