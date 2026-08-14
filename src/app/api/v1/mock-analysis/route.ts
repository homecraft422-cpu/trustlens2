import { NextRequest, NextResponse } from "next/server";

// Mock analysis API - works without database
// This provides demo functionality for all upload portals

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

// In-memory store for demo
const analysisStore = new Map<string, MockAnalysisResult>();

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getModality(mimeType: string): "image" | "video" | "audio" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "audio";
}

function generateMockResult(
  id: string,
  filename: string,
  mimeType: string,
  fileSize: number
): MockAnalysisResult {
  const modality = getModality(mimeType);
  const rand = Math.random();

  // Generate different scenarios based on random
  let verdict: string;
  let aiScore: number;
  let manipScore: number;
  let confidence: number;
  let classification: string;
  let provenance: string;
  let summary: string;
  let signals: MockAnalysisResult["signals"];

  if (rand < 0.3) {
    // Likely authentic
    verdict = "likely_authentic";
    aiScore = 0.05 + Math.random() * 0.2;
    manipScore = 0.03 + Math.random() * 0.15;
    confidence = 0.7 + Math.random() * 0.25;
    classification = "level_1";
    provenance = "not_verified";
    summary = `This ${modality} appears to be authentic. Analysis did not detect significant indicators of AI generation or manipulation. The content shows natural characteristics consistent with genuine ${modality} content.`;
    signals = [
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "unknown",
        score: null,
        severity: "low",
        title: "No strong AI-generation signals",
        description: `Pattern analysis did not detect significant AI-generation artifacts in this ${modality}.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "metadata",
        signalType: "metadata_anomaly",
        score: null,
        severity: "low",
        title: "Metadata analysis",
        description: "Standard metadata found in the file.",
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "integrity",
        signalType: "integrity_ok",
        score: null,
        severity: "low",
        title: "File integrity OK",
        description: "File structure appears intact without signs of manipulation.",
        source: "mock_provider",
      },
    ];
  } else if (rand < 0.6) {
    // Likely AI generated
    verdict = "likely_ai_generated";
    aiScore = 0.65 + Math.random() * 0.3;
    manipScore = 0.1 + Math.random() * 0.3;
    confidence = 0.6 + Math.random() * 0.3;
    classification = "level_4";
    provenance = "not_verified";
    summary = `This ${modality} shows strong indicators of AI generation. Visual/audio patterns are consistent with known AI generation models. Synthetic characteristics detected.`;
    signals = [
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "ai_generated",
        score: 0.82,
        severity: "high",
        title: "AI-generation signals detected",
        description: `Visual/audio patterns are consistent with known AI ${modality} generation models.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "ai_generated",
        score: 0.71,
        severity: "medium",
        title: "Synthetic texture/pattern indicators",
        description: `Analysis revealed patterns commonly associated with AI-generated ${modality}.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "metadata",
        signalType: "metadata_anomaly",
        score: 0.65,
        severity: "medium",
        title: "Missing original metadata",
        description: "No standard camera/recording metadata was found, common in AI-generated content.",
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "provenance",
        signalType: "provenance_absent",
        score: null,
        severity: "low",
        title: "No verified provenance",
        description: "No verified Content Credential was found in this file.",
        source: "mock_provider",
      },
    ];
  } else if (rand < 0.85) {
    // Possibly manipulated
    verdict = "possibly_manipulated";
    aiScore = 0.3 + Math.random() * 0.4;
    manipScore = 0.55 + Math.random() * 0.35;
    confidence = 0.55 + Math.random() * 0.3;
    classification = "level_3";
    provenance = "detected_unverified";
    summary = `This ${modality} shows signs of manipulation. Analysis detected regions or segments that may have been altered or composited from different sources.`;
    signals = [
      {
        id: generateId(),
        category: "manipulation",
        signalType: "splice",
        score: 0.78,
        severity: "high",
        title: "Possible manipulation signals",
        description: `Analysis detected regions that may have been altered or composited from different sources.`,
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "manipulation",
        signalType: "compression_anomaly",
        score: 0.55,
        severity: "medium",
        title: "Inconsistent compression artifacts",
        description: "Different regions show varying compression levels, suggesting possible editing.",
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "ai_edited",
        score: 0.45,
        severity: "medium",
        title: "AI-assisted enhancement possible",
        description: "Some regions show signs consistent with AI-based enhancement or upscaling.",
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "metadata",
        signalType: "metadata_anomaly",
        score: null,
        severity: "low",
        title: "Editing software detected",
        description: "File metadata indicates the content was processed with editing software.",
        source: "mock_provider",
      },
    ];
  } else {
    // Insufficient evidence
    verdict = "insufficient_evidence";
    aiScore = 0.3 + Math.random() * 0.4;
    manipScore = 0.2 + Math.random() * 0.3;
    confidence = 0.2 + Math.random() * 0.3;
    classification = "level_2";
    provenance = "unavailable";
    summary = `Analysis of this ${modality} produced inconclusive results. There is insufficient evidence to make a strong determination about authenticity or manipulation.`;
    signals = [
      {
        id: generateId(),
        category: "ai_detection",
        signalType: "unknown",
        score: null,
        severity: "low",
        title: "Inconclusive AI detection",
        description: "AI detection signals were mixed or below threshold.",
        source: "mock_provider",
      },
      {
        id: generateId(),
        category: "integrity",
        signalType: "integrity_ok",
        score: null,
        severity: "low",
        title: "File structure intact",
        description: "No obvious file corruption or structural issues detected.",
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
      processingTimeMs: Math.floor(2000 + Math.random() * 3000),
      isMock: true,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const guestId = formData.get("guestId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const supportedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/webp",
      "video/mp4", "video/quicktime", "video/webm",
      "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
      "audio/flac", "audio/aac", "audio/m4a", "audio/webm", "audio/mp4",
    ];

    const isSupported =
      supportedTypes.includes(file.type) ||
      file.name.match(/\.(jpg|jpeg|png|webp|mp4|mov|webm|mp3|wav|ogg|flac|aac|m4a)$/i);

    if (!isSupported) {
      return NextResponse.json(
        {
          error:
            "This file type isn't supported. Please upload images (JPG, PNG, WEBP), videos (MP4, MOV, WEBM), or audio (MP3, WAV, OGG, FLAC, AAC, M4A).",
        },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = file.type.startsWith("video/")
      ? 100 * 1024 * 1024
      : file.type.startsWith("audio/")
        ? 50 * 1024 * 1024
        : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${maxMB} MB.` },
        { status: 400 }
      );
    }

    // Generate analysis ID
    const analysisId = generateId();

    // Create mock result
    const result = generateMockResult(
      analysisId,
      file.name,
      file.type || "application/octet-stream",
      file.size
    );

    // Store result
    analysisStore.set(analysisId, result);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      id: analysisId,
      status: "processing",
      message: "Analysis started",
    });
  } catch (error) {
    console.error("Analysis error:", error);
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
    // If not found, generate a quick result (for demo)
    const quickResult = generateMockResult(
      id,
      "uploaded_file",
      "image/jpeg",
      0
    );
    analysisStore.set(id, quickResult);
    return NextResponse.json(quickResult);
  }

  return NextResponse.json(result);
}
