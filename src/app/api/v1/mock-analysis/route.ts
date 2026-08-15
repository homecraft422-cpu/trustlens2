import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { checkMediaQuota, createAnalysisJob, getDetailedUsage, spendCreditsForAnalysis } from "@/lib/services/analysis-service";
import { getMediaTypeFromMime, config } from "@/lib/config";
import { db } from "@/db";
import { assets, usageEvents } from "@/db/schema";

interface MockAnalysisResult {
  id: string;
  status: "completed" | "processing" | "failed";
  verdict: string;
  aiInvolvementScore: number;
  manipulationScore: number;
  confidenceScore: number;
  classificationLevel: string;
  provenanceStatus: string;
  summary: string;
  signals: Array<{
    id: string;
    category: string;
    signalType: string;
    score: number | null;
    severity: string;
    title: string;
    description: string;
    source: string;
  }>;
  metadata: {
    filename: string;
    mimeType: string;
    fileSize: number;
    analyzedAt: string;
    processingTimeMs: number;
    isMock: boolean;
  };
}

const analysisStore = new Map<string, MockAnalysisResult>();

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getModality(mimeType: string, filename?: string): "image" | "video" | "audio" {
  return getMediaTypeFromMime(mimeType, filename);
}

function generateMockResult(
  id: string,
  filename: string,
  mimeType: string,
  fileSize: number
): MockAnalysisResult {
  const modality = getModality(mimeType, filename);
  const rand = Math.random();

  let verdict: string;
  let aiScore: number;
  let manipScore: number;
  let confidence: number;
  let classification: string;
  let provenance: string;
  let summary: string;
  let signals: MockAnalysisResult["signals"];

  if (rand < 0.35) {
    verdict = "likely_authentic";
    aiScore = 0.05 + Math.random() * 0.18;
    manipScore = 0.03 + Math.random() * 0.12;
    confidence = 0.75 + Math.random() * 0.2;
    classification = "level_1";
    provenance = "not_verified";
    summary = `This ${modality} appears to be authentic. Analysis did not detect significant indicators of AI generation or manipulation. Natural characteristics and expected noise patterns are consistent with genuine ${modality} content.`;
    signals = [
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "unknown",
        score: null,
        severity: "low",
        title: "No strong AI-generation signals",
        description: `Pattern analysis did not detect synthetic artifacts in this ${modality}.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "metadata",
        signalType: "metadata_anomaly",
        score: null,
        severity: "low",
        title: "Standard metadata structure",
        description: "File structure matches typical capture software without suspicious anomalies.",
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "integrity",
        signalType: "integrity_ok",
        score: null,
        severity: "low",
        title: "File integrity verified",
        description: "File structure appears complete and uncorrupted.",
        source: "mock_provider",
      },
    ];
  } else if (rand < 0.7) {
    verdict = "likely_ai_generated";
    aiScore = 0.72 + Math.random() * 0.25;
    manipScore = 0.1 + Math.random() * 0.25;
    confidence = 0.65 + Math.random() * 0.28;
    classification = "level_4";
    provenance = "not_verified";
    summary = `This ${modality} shows strong indicators of AI generation. Pattern recognition matched structural characteristics commonly produced by generative neural network models.`;
    signals = [
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "ai_generated",
        score: 0.86,
        severity: "high",
        title: `AI-generation patterns detected in ${modality}`,
        description: `Generative model artifacts and statistical distributions detected.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "ai_generated",
        score: 0.74,
        severity: "medium",
        title: "Synthetic texture / harmonic indicators",
        description: `Revealed repeating frequencies and synthetic synthesis characteristics.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "metadata",
        signalType: "metadata_anomaly",
        score: 0.65,
        severity: "medium",
        title: "Missing original hardware metadata",
        description: "Absence of standard device capture tags typical in AI generated files.",
        source: "mock_provider",
      },
    ];
  } else {
    verdict = "possibly_manipulated";
    aiScore = 0.35 + Math.random() * 0.35;
    manipScore = 0.65 + Math.random() * 0.3;
    confidence = 0.6 + Math.random() * 0.25;
    classification = "level_3";
    provenance = "detected_unverified";
    summary = `This ${modality} shows signs of editing or composite manipulation. Inconsistencies were found across content segments.`;
    signals = [
      {
        id: generateId(),
        category: "manipulation",
        signalType: "splice",
        score: 0.81,
        severity: "high",
        title: "Potential manipulation boundary signals",
        description: `Analysis detected regions or segments that may have been edited or composited.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "manipulation",
        signalType: "compression_anomaly",
        score: 0.58,
        severity: "medium",
        title: "Inconsistent compression artifacts",
        description: "Different segments show varying compression profiles, suggesting re-saving.",
        source: "mock_provider",
      },
    ];
  }

  return {
    id,
    status: "completed",
    verdict,
    aiInvolvementScore: Math.round(aiScore * 100) / 100,
    manipulationScore: Math.round(manipScore * 100) / 100,
    confidenceScore: Math.round(confidence * 100) / 100,
    classificationLevel: classification,
    provenanceStatus: provenance,
    summary,
    signals,
    metadata: {
      filename,
      mimeType,
      fileSize,
      analyzedAt: new Date().toISOString(),
      processingTimeMs: Math.floor(1500 + Math.random() * 1500),
      isMock: true,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value;
    const user = token ? await getSessionUserFromToken(token) : null;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const guestId = (formData.get("guestId") as string | null) || `guest_mock_${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const mediaType = getMediaTypeFromMime(file.type, file.name);

    // Check media quota
    const owner = {
      userId: user?.id || null,
      guestId: user ? null : guestId,
    };

    // Fail-open: if the quota lookup itself breaks (DB hiccup), let the
    // analysis run instead of blocking the user with an error.
    let quotaCheck: Awaited<ReturnType<typeof checkMediaQuota>>;
    try {
      quotaCheck = await checkMediaQuota(owner, mediaType);
    } catch (error) {
      console.error("[mock-analysis] quota check failed — continuing (fail-open):", error);
      const limit = config.limits[owner.userId ? "user" : "guest"][mediaType];
      quotaCheck = { allowed: true, used: 0, limit, remaining: limit };
    }
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: quotaCheck.message,
          code: quotaCheck.code,
          mediaType,
          used: quotaCheck.used,
          limit: quotaCheck.limit,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // Record usage (non-fatal — never block the analysis over bookkeeping)
    try {
      await db.insert(usageEvents).values({
        userId: owner.userId,
        guestId: owner.guestId,
        eventType: `analysis_${mediaType}`,
      });
    } catch (error) {
      console.error("[mock-analysis] could not record usage event (non-fatal):", error);
    }

    // Model 2: deduct pay-as-you-go credits when plan quota is exhausted
    let creditsInfo: { usedCredits: boolean; creditsBalance?: number } = { usedCredits: false };
    if (quotaCheck.usingCredits && owner.userId) {
      try {
        const spend = await spendCreditsForAnalysis(owner.userId, mediaType);
        creditsInfo = { usedCredits: true, creditsBalance: spend.newBalance };
      } catch (error) {
        console.error("[mock-analysis] credit deduction failed (non-fatal):", error);
      }
    }

    const analysisId = generateId();
    const result = generateMockResult(
      analysisId,
      file.name,
      file.type || `application/${mediaType}`,
      file.size
    );

    analysisStore.set(analysisId, result);

    return NextResponse.json({
      id: analysisId,
      status: "processing",
      message: "Analysis started",
      mediaType,
      remaining: Math.max(0, quotaCheck.remaining - 1),
      ...creditsInfo,
    });
  } catch (error) {
    console.error("Mock Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to process analysis. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Analysis ID required" },
      { status: 400 }
    );
  }

  const result = analysisStore.get(id);
  if (!result) {
    const quickResult = generateMockResult(id, "uploaded_file", "image/jpeg", 0);
    analysisStore.set(id, quickResult);
    return NextResponse.json(quickResult);
  }

  return NextResponse.json(result);
}
