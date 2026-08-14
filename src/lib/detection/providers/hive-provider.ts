/**
 * Hive AI Detection Provider
 *
 * Integrates Hive's AI-Generated Media Detection and Audio Detection APIs
 * into the TRUSTLENS normalized DetectionProvider interface.
 *
 * Hive API models used:
 *  - ai_generated_media  (images + videos: AI generation + deepfake + C2PA)
 *  - ai_generated_audio  (audio: synthetic speech detection)
 *
 * This provider NEVER exposes raw Hive responses to users.
 * All results are normalized into DetectionResult / EvidenceItem.
 */

import {
  DetectionProvider,
  DetectionResult,
  AssetInfo,
  EvidenceItem,
  Modality,
  SignalType,
  SignalSeverity,
} from "../types";
import {
  HiveClient,
  HiveClientConfig,
  HiveAPIResponse,
  HiveOutputFrame,
  HiveClassScore,
  HiveApiError,
  getHiveConfig,
} from "./hive-client";
import { getStorage } from "../../storage";
import { nanoid } from "nanoid";

// ─── Helpers ─────────────────────────────────────────────────

function eid(): string {
  return nanoid(8);
}

/** Find a class score by name from Hive's output */
function findScore(classes: HiveClassScore[], className: string): number {
  const entry = classes.find((c) => c.class === className);
  return entry?.score ?? 0;
}

/** Determine severity from a probability score */
function scoreSeverity(score: number): SignalSeverity {
  if (score >= 0.9) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

/** Known Hive source classes that represent AI generators */
const AI_GENERATOR_CLASSES = new Set([
  "flux", "midjourney", "dalle", "stablediffusion", "stablediffusionxl",
  "adobefirefly", "sora", "pika", "kling", "luma", "runway", "hailuo",
  "recraft", "leonardo", "ideogram", "imagen", "imagen4", "4o", "grok",
  "wan", "veo3", "hunyuan", "cosmos", "hedra", "mochi", "pixart", "glide",
  "gan", "lcm", "stablecascade", "deepfloyd", "kandinsky", "wuerstchen",
  "titan", "sana", "emu3", "omnigen", "janus", "dmd2", "switti", "infinity",
  "bingimagecreator", "luminagpt", "var", "hallo", "liveportrait", "mcnet",
  "pyramidflows", "sadtalker", "aniportrait", "cogvideos", "makeittalk",
  "sdxlinpaint", "stablediffusioninpaint", "flashvideo", "transpixar",
  "amused", "vqdiffusion", "other_image_generators",
]);

/** Format a generator class name for display */
function formatGeneratorName(cls: string): string {
  const names: Record<string, string> = {
    "flux": "Flux", "midjourney": "Midjourney", "dalle": "DALL-E",
    "stablediffusion": "Stable Diffusion", "stablediffusionxl": "Stable Diffusion XL",
    "adobefirefly": "Adobe Firefly", "sora": "Sora", "pika": "Pika",
    "kling": "Kling", "luma": "Luma", "runway": "Runway", "hailuo": "Hailuo",
    "recraft": "Recraft", "leonardo": "Leonardo", "ideogram": "Ideogram",
    "imagen": "Imagen", "imagen4": "Imagen 4", "4o": "GPT-4o", "grok": "Grok",
    "wan": "Wan", "veo3": "Veo 3", "hunyuan": "Hunyuan",
    "other_image_generators": "Other AI generator",
    "gan": "GAN-based model",
  };
  return names[cls] || cls;
}

// ─── Provider ────────────────────────────────────────────────

export class HiveDetectionProvider implements DetectionProvider {
  readonly name = "hive";
  readonly version: string;
  private client: HiveClient;

  constructor(cfg?: HiveClientConfig) {
    const config = cfg || getHiveConfig();
    this.client = new HiveClient(config);
    this.version = "v2";
  }

  getSupportedModalities(): Modality[] {
    return ["image", "video", "audio"];
  }

  supportsModality(modality: Modality): boolean {
    return ["image", "video", "audio"].includes(modality);
  }

  // ─── Image ───────────────────────────────────────────────

  async analyzeImage(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();

    const buffer = await this.downloadAsset(asset);

    const response = await this.client.analyzeMedia(
      buffer,
      asset.originalFilename,
      ["ai_generated_media"]
    );

    return this.normalizeMediaResult(response, "image", start);
  }

  // ─── Video ───────────────────────────────────────────────

  async analyzeVideo(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();

    const buffer = await this.downloadAsset(asset);

    const response = await this.client.analyzeMedia(
      buffer,
      asset.originalFilename,
      ["ai_generated_media"]
    );

    return this.normalizeMediaResult(response, "video", start);
  }

  // ─── Audio ───────────────────────────────────────────────

  async analyzeAudio(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();

    const buffer = await this.downloadAsset(asset);

    const response = await this.client.analyzeMedia(
      buffer,
      asset.originalFilename,
      ["ai_generated_audio"]
    );

    return this.normalizeAudioResult(response, start);
  }

  // ─── Asset download ──────────────────────────────────────

  private async downloadAsset(asset: AssetInfo): Promise<Buffer> {
    const storage = getStorage();
    const buffer = await storage.download(asset.storageKey);
    if (!buffer) {
      throw new HiveApiError(
        "Could not download asset from storage",
        null,
        "storage_error",
        false
      );
    }
    return buffer;
  }

  // ─── Normalize AI-Generated Media result ─────────────────

  private normalizeMediaResult(
    response: HiveAPIResponse,
    modality: Modality,
    startTime: number
  ): DetectionResult {
    const evidence: EvidenceItem[] = [];
    const limitations: string[] = [];

    // Get the first status entry
    const statusEntry = response.status?.[0];
    if (!statusEntry || statusEntry.status.code !== "0") {
      throw new HiveApiError(
        `Hive returned non-success: ${statusEntry?.status?.message || "unknown"}`,
        null,
        "provider_response_error",
        false
      );
    }

    const outputFrames = statusEntry.response.output;
    if (!outputFrames || outputFrames.length === 0) {
      throw new HiveApiError(
        "Hive returned empty output",
        null,
        "empty_response",
        false
      );
    }

    const modelVersion = statusEntry.response.input.model_version;

    // For images: single frame. For videos: multiple frames.
    let maxAiScore = 0;
    let maxDeepfakeScore = 0;
    let totalAiScore = 0;
    let frameCount = 0;

    for (const frame of outputFrames) {
      const aiGenerated = findScore(frame.classes, "ai_generated");
      const deepfake = findScore(frame.classes, "deepfake");

      maxAiScore = Math.max(maxAiScore, aiGenerated);
      maxDeepfakeScore = Math.max(maxDeepfakeScore, deepfake);
      totalAiScore += aiGenerated;
      frameCount++;

      // Process C2PA data from first frame
      if (frame.algorithmic_tags?.c2pa && evidence.length === 0) {
        const c2pa = frame.algorithmic_tags.c2pa;
        if (c2pa.claim_generator || c2pa.actions_software_agent) {
          evidence.push({
            id: eid(),
            category: "provenance",
            type: "provenance_verified",
            title: "Content Credentials detected (C2PA)",
            description:
              `C2PA metadata found. Generator: ${c2pa.claim_generator || "unknown"}, ` +
              `Agent: ${c2pa.actions_software_agent || "unknown"}, ` +
              `Action: ${c2pa.actions_action || "unknown"}.`,
            score: null,
            confidence: null,
            severity: "low",
            source: this.name,
            providerMetadata: { c2pa },
          });
        }
      }
    }

    const avgAiScore = frameCount > 0 ? totalAiScore / frameCount : 0;
    // For images use the single score; for videos use max across frames
    const effectiveAiScore = modality === "image" ? avgAiScore : maxAiScore;

    // Create AI generation evidence
    if (effectiveAiScore > 0.1) {
      evidence.push({
        id: eid(),
        category: "ai_detection",
        type: "ai_generated",
        title: effectiveAiScore >= 0.9
          ? "Strong AI-generation signal detected"
          : effectiveAiScore >= 0.5
            ? "Possible AI-generation signal detected"
            : "Weak AI-generation signal detected",
        description:
          `AI-generation probability: ${(effectiveAiScore * 100).toFixed(1)}%. ` +
          "This estimate is based on pattern analysis by the detection model.",
        score: effectiveAiScore,
        confidence: effectiveAiScore >= 0.9 ? 0.95 : effectiveAiScore >= 0.5 ? 0.8 : 0.6,
        severity: scoreSeverity(effectiveAiScore),
        source: this.name,
      });
    } else {
      evidence.push({
        id: eid(),
        category: "ai_detection",
        type: "unknown",
        title: "No strong AI-generation signal",
        description:
          "The detection model did not find strong evidence of AI generation.",
        score: effectiveAiScore,
        confidence: 0.85,
        severity: "low",
        source: this.name,
      });
    }

    // Source attribution — find the top-scoring generator
    const firstFrame = outputFrames[0];
    const generatorScores = firstFrame.classes
      .filter((c) => AI_GENERATOR_CLASSES.has(c.class) && c.score > 0.05)
      .sort((a, b) => b.score - a.score);

    if (generatorScores.length > 0 && effectiveAiScore > 0.5) {
      const top = generatorScores[0];
      evidence.push({
        id: eid(),
        category: "ai_detection",
        type: "ai_generated",
        title: "Possible AI generator identified",
        description:
          `Detection signal is most consistent with ${formatGeneratorName(top.class)} ` +
          `(signal strength: ${(top.score * 100).toFixed(1)}%). ` +
          "Generator attribution is probabilistic and should not be treated as absolute proof.",
        score: top.score,
        confidence: top.score >= 0.8 ? 0.85 : 0.6,
        severity: "medium",
        source: this.name,
        providerMetadata: {
          topGenerators: generatorScores.slice(0, 3).map((g) => ({
            generator: g.class,
            score: g.score,
          })),
        },
      });
    }

    // Deepfake evidence
    if (maxDeepfakeScore > 0.3) {
      evidence.push({
        id: eid(),
        category: "manipulation",
        type: "deepfake",
        title: maxDeepfakeScore >= 0.7
          ? "Deepfake signal detected"
          : "Possible deepfake signal",
        description:
          `Deepfake detection probability: ${(maxDeepfakeScore * 100).toFixed(1)}%. ` +
          "This indicates possible face manipulation or synthesis.",
        score: maxDeepfakeScore,
        confidence: maxDeepfakeScore >= 0.7 ? 0.9 : 0.65,
        severity: scoreSeverity(maxDeepfakeScore),
        source: this.name,
      });
    }

    // No C2PA found → note absence (not proof of AI)
    const hasC2paEvidence = evidence.some(
      (e) => e.category === "provenance" && e.type === "provenance_verified"
    );
    if (!hasC2paEvidence) {
      evidence.push({
        id: eid(),
        category: "provenance",
        type: "provenance_absent",
        title: "No Content Credentials found",
        description:
          "No C2PA Content Credentials were found. " +
          "This does not mean the media is AI-generated.",
        score: null,
        confidence: null,
        severity: "low",
        source: this.name,
      });
    }

    // Compute manipulation probability (deepfake is the primary manipulation signal)
    const manipulationProbability = maxDeepfakeScore;

    // Confidence: how reliable the detection is
    // Higher AI probability + deepfake consistency = higher confidence
    const confidence = Math.min(
      0.95,
      0.6 + (effectiveAiScore > 0.9 ? 0.2 : 0) + (frameCount > 1 ? 0.1 : 0.05)
    );

    limitations.push("AI detection is probabilistic and may not be accurate for all content types.");
    if (modality === "video" && frameCount <= 1) {
      limitations.push("Limited frame data available for video analysis.");
    }

    return {
      provider: this.name,
      providerVersion: modelVersion ? `model-v${modelVersion}` : this.version,
      modality,
      aiProbability: effectiveAiScore,
      manipulationProbability,
      confidence,
      evidence,
      processingTimeMs: Date.now() - startTime,
      limitations,
      isMock: false,
    };
  }

  // ─── Normalize Audio result ──────────────────────────────

  private normalizeAudioResult(
    response: HiveAPIResponse,
    startTime: number
  ): DetectionResult {
    const evidence: EvidenceItem[] = [];
    const limitations: string[] = [];

    const statusEntry = response.status?.[0];
    if (!statusEntry || statusEntry.status.code !== "0") {
      throw new HiveApiError(
        `Hive returned non-success: ${statusEntry?.status?.message || "unknown"}`,
        null,
        "provider_response_error",
        false
      );
    }

    const outputChunks = statusEntry.response.output;
    if (!outputChunks || outputChunks.length === 0) {
      throw new HiveApiError(
        "Hive returned empty audio output",
        null,
        "empty_response",
        false
      );
    }

    // Audio: Hive returns 10-second chunks with ai_generated / not_ai_generated
    let maxAiAudioScore = 0;
    let totalAiAudioScore = 0;
    let chunkCount = 0;

    for (const chunk of outputChunks) {
      const aiScore = findScore(chunk.classes, "ai_generated");
      maxAiAudioScore = Math.max(maxAiAudioScore, aiScore);
      totalAiAudioScore += aiScore;
      chunkCount++;

      // Create per-chunk evidence with timestamps (Hive provides `time` in seconds)
      if (aiScore > 0.3 && chunk.time !== undefined) {
        evidence.push({
          id: eid(),
          category: "audio",
          type: "voice_synthesis",
          title: aiScore >= 0.7
            ? "Synthetic speech signal detected"
            : "Possible synthetic speech signal",
          description:
            `AI-generated audio probability: ${(aiScore * 100).toFixed(1)}% ` +
            `for chunk starting at ${chunk.time}s.`,
          score: aiScore,
          confidence: aiScore >= 0.7 ? 0.85 : 0.6,
          severity: scoreSeverity(aiScore),
          source: this.name,
          timestampStart: chunk.time,
          timestampEnd: chunk.time + 10,
        });
      }
    }

    const avgAiAudioScore = chunkCount > 0 ? totalAiAudioScore / chunkCount : 0;

    // Overall audio evidence
    if (evidence.length === 0) {
      evidence.push({
        id: eid(),
        category: "audio",
        type: maxAiAudioScore > 0.3 ? "voice_synthesis" : "unknown",
        title: maxAiAudioScore > 0.3
          ? "Possible synthetic audio detected"
          : "No strong synthetic audio signal",
        description:
          maxAiAudioScore > 0.3
            ? `Overall AI-generated audio probability: ${(avgAiAudioScore * 100).toFixed(1)}%.`
            : "Audio analysis did not detect strong synthetic speech signals.",
        score: avgAiAudioScore,
        confidence: 0.75,
        severity: maxAiAudioScore > 0.5 ? "medium" : "low",
        source: this.name,
      });
    }

    const confidence = Math.min(0.95, 0.65 + (chunkCount > 3 ? 0.15 : 0.05));

    limitations.push("Audio detection accuracy varies with recording quality and length.");

    return {
      provider: this.name,
      providerVersion: this.version,
      modality: "audio",
      aiProbability: avgAiAudioScore,
      manipulationProbability: 0,
      confidence,
      evidence,
      processingTimeMs: Date.now() - startTime,
      limitations,
      isMock: false,
    };
  }
}
