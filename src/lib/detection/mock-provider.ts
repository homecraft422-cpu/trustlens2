/**
 * Mock Detection Provider
 *
 * Returns simulated detection results for development and testing.
 * All results are clearly marked as mock (isMock: true).
 *
 * NEVER use in production.
 */

import {
  DetectionProvider,
  DetectionResult,
  AssetInfo,
  EvidenceItem,
  Modality,
} from "./types";
import { nanoid } from "nanoid";

// ─── Helpers ─────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function eid(): string {
  return nanoid(8);
}

// ─── Scenario definitions ────────────────────────────────────

interface Scenario {
  ai: [number, number];
  manipulation: [number, number];
  confidence: [number, number];
  evidence: Omit<EvidenceItem, "id" | "source" | "providerMetadata">[];
}

const IMAGE_SCENARIOS: Scenario[] = [
  {
    ai: [0.05, 0.2],
    manipulation: [0.03, 0.15],
    confidence: [0.7, 0.9],
    evidence: [
      { category: "ai_detection", type: "unknown", title: "No strong AI-generation signals", description: "Pattern analysis did not detect significant AI-generation artifacts.", score: null, confidence: 0.85, severity: "low" },
      { category: "metadata", type: "metadata_anomaly", title: "EXIF metadata present", description: "Standard camera metadata was found in the file.", score: null, confidence: 0.9, severity: "low" },
      { category: "integrity", type: "integrity_ok", title: "No obvious file corruption", description: "File structure appears intact without signs of manipulation.", score: null, confidence: 0.88, severity: "low" },
    ],
  },
  {
    ai: [0.7, 0.95],
    manipulation: [0.1, 0.3],
    confidence: [0.65, 0.88],
    evidence: [
      { category: "ai_detection", type: "ai_generated", title: "AI-generation signals detected", description: "Visual patterns are consistent with known AI image generation models.", score: 0.88, confidence: 0.82, severity: "high" },
      { category: "ai_detection", type: "ai_generated", title: "Synthetic texture indicators", description: "Texture analysis revealed patterns commonly associated with AI-generated imagery.", score: 0.71, confidence: 0.75, severity: "medium" },
      { category: "metadata", type: "metadata_anomaly", title: "Missing camera metadata", description: "No standard camera EXIF data was found, which is common in AI-generated images.", score: 0.65, confidence: 0.7, severity: "medium" },
      { category: "provenance", type: "provenance_absent", title: "No verified provenance available", description: "No verified Content Credential was found in this file.", score: null, confidence: null, severity: "low" },
    ],
  },
  {
    ai: [0.3, 0.55],
    manipulation: [0.6, 0.85],
    confidence: [0.6, 0.82],
    evidence: [
      { category: "manipulation", type: "splice", title: "Possible manipulation signals", description: "Analysis detected regions that may have been altered or composited from different sources.", score: 0.78, confidence: 0.72, severity: "high" },
      { category: "manipulation", type: "compression_anomaly", title: "Inconsistent compression artifacts", description: "Different regions show varying compression levels, suggesting possible editing.", score: 0.55, confidence: 0.65, severity: "medium" },
      { category: "ai_detection", type: "ai_edited", title: "AI-assisted enhancement possible", description: "Some regions show signs consistent with AI-based enhancement or upscaling.", score: 0.35, confidence: 0.55, severity: "low" },
      { category: "metadata", type: "metadata_anomaly", title: "Editing software detected in metadata", description: "File metadata indicates the image was processed with editing software.", score: null, confidence: 0.8, severity: "low" },
    ],
  },
];

const VIDEO_SCENARIOS: Scenario[] = [
  {
    ai: [0.05, 0.2],
    manipulation: [0.05, 0.18],
    confidence: [0.65, 0.85],
    evidence: [
      { category: "ai_detection", type: "unknown", title: "No strong AI-generation signals in video", description: "Frame analysis did not detect significant AI-generation artifacts.", score: null, confidence: 0.8, severity: "low" },
      { category: "audio", type: "unknown", title: "Natural speech patterns", description: "Audio analysis suggests natural speech characteristics.", score: null, confidence: 0.78, severity: "low" },
      { category: "integrity", type: "integrity_ok", title: "No obvious file corruption", description: "Video file structure appears intact.", score: null, confidence: 0.85, severity: "low" },
    ],
  },
  {
    ai: [0.55, 0.75],
    manipulation: [0.4, 0.65],
    confidence: [0.6, 0.8],
    evidence: [
      { category: "ai_detection", type: "unknown", title: "Low visual AI signals", description: "Video frames appear to originate from real footage.", score: 0.15, confidence: 0.7, severity: "low", timestampStart: 0, timestampEnd: 14 },
      { category: "audio", type: "voice_synthesis", title: "Synthetic audio signals detected", description: "Audio characteristics are consistent with synthetic or AI-generated speech.", score: 0.85, confidence: 0.78, severity: "high", timestampStart: 14, timestampEnd: 47 },
      { category: "manipulation", type: "lip_sync", title: "Face/audio timing anomaly", description: "Some facial movement does not align naturally with the detected speech.", score: 0.62, confidence: 0.65, severity: "medium", timestampStart: 14, timestampEnd: 31 },
      { category: "provenance", type: "provenance_absent", title: "No verified provenance available", description: "No verified content credential was found.", score: null, confidence: null, severity: "low" },
    ],
  },
  {
    ai: [0.4, 0.7],
    manipulation: [0.55, 0.85],
    confidence: [0.55, 0.78],
    evidence: [
      { category: "ai_detection", type: "ai_edited", title: "Possible visual manipulation", description: "Some frames show signs of visual alteration or synthesis.", score: 0.58, confidence: 0.62, severity: "medium", timestampStart: 15, timestampEnd: 35 },
      { category: "manipulation", type: "splice", title: "Temporal inconsistency detected", description: "Frame timing analysis revealed possible splicing or insertion of content.", score: 0.75, confidence: 0.7, severity: "high", timestampStart: 15, timestampEnd: 35 },
      { category: "audio", type: "unknown", title: "Natural speech likely", description: "Audio appears to contain natural speech patterns.", score: 0.18, confidence: 0.65, severity: "low" },
      { category: "metadata", type: "compression_anomaly", title: "Multiple encoding passes detected", description: "Video appears to have been re-encoded multiple times, which can indicate editing.", score: 0.55, confidence: 0.6, severity: "medium" },
    ],
  },
];

// ─── Provider implementation ─────────────────────────────────

export class MockDetectionProvider implements DetectionProvider {
  readonly name = "mock_provider";
  readonly version = "0.1.0-demo";

  getSupportedModalities(): Modality[] {
    return ["image", "video", "audio"];
  }

  supportsModality(modality: Modality): boolean {
    return ["image", "video", "audio"].includes(modality);
  }

  async analyzeImage(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    // Simulate processing delay
    await delay(1500 + Math.random() * 2000);
    const scenario = pick(IMAGE_SCENARIOS);
    return this.buildResult("image", scenario, start);
  }

  async analyzeVideo(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    await delay(2000 + Math.random() * 3000);
    const scenario = pick(VIDEO_SCENARIOS);
    return this.buildResult("video", scenario, start);
  }

  async analyzeAudio(asset: AssetInfo): Promise<DetectionResult> {
    const start = Date.now();
    await delay(1000 + Math.random() * 1500);

    const isSynthetic = Math.random() > 0.5;
    const scenario: Scenario = {
      ai: isSynthetic ? [0.6, 0.9] : [0.05, 0.25],
      manipulation: [0.1, 0.3],
      confidence: [0.6, 0.85],
      evidence: [
        {
          category: "audio",
          type: isSynthetic ? "voice_synthesis" : "unknown",
          title: isSynthetic ? "Synthetic speech signals detected" : "Natural speech patterns detected",
          description: isSynthetic
            ? "Audio characteristics suggest AI-generated or text-to-speech synthesis."
            : "Audio appears to contain natural human speech patterns.",
          score: isSynthetic ? rand(0.7, 0.9) : rand(0.05, 0.2),
          confidence: rand(0.6, 0.85),
          severity: isSynthetic ? "high" : "low",
        },
      ],
    };
    return this.buildResult("audio", scenario, start);
  }

  private buildResult(modality: Modality, scenario: Scenario, startTime: number): DetectionResult {
    const evidence: EvidenceItem[] = scenario.evidence.map((e) => ({
      ...e,
      id: eid(),
      source: this.name,
    }));

    return {
      provider: this.name,
      providerVersion: this.version,
      modality,
      aiProbability: rand(scenario.ai[0], scenario.ai[1]),
      manipulationProbability: rand(scenario.manipulation[0], scenario.manipulation[1]),
      confidence: rand(scenario.confidence[0], scenario.confidence[1]),
      evidence,
      processingTimeMs: Date.now() - startTime,
      limitations: [
        "Results are simulated by a mock provider and do not reflect real AI detection.",
      ],
      isMock: true,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
