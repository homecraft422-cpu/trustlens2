import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { config, isSupportedType, isImageType, isVideoType } from "@/lib/config";
import { getStorage } from "@/lib/storage";
import { validateFileBuffer } from "@/lib/media/file-validator";
import { DetectionOrchestrator } from "@/lib/detection/orchestrator";
import { computeScores } from "@/lib/detection/scoring";
import type { DetectionAnalysis, AssetInfo } from "@/lib/detection/types";

/**
 * POST /api/v1/admin/detection/test
 *
 * Admin-only endpoint to test detection providers with a real file.
 * Sends the file to every configured provider and returns normalized results.
 *
 * NEVER returns:
 * - raw provider API payloads
 * - API keys / credentials
 * - providerMetadata
 *
 * The uploaded file is stored temporarily and marked for cleanup.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    if (!isSupportedType(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, WEBP, MP4, MOV, or WEBM." },
        { status: 400 }
      );
    }

    // Validate size
    const maxSize = isImageType(file.type)
      ? config.limits.maxImageSize
      : config.limits.maxVideoSize;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${Math.round(maxSize / (1024 * 1024))} MB.` },
        { status: 400 }
      );
    }

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes
    const validation = await validateFileBuffer(buffer, file.type, file.name);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid file" },
        { status: 400 }
      );
    }

    // Store temporarily
    const tempAssetId = `test_${crypto.randomUUID()}`;
    const storage = getStorage();
    const storageKey = storage.generateKey(tempAssetId, "test-assets");

    await storage.upload(buffer, storageKey, {
      contentType: validation.detectedMimeType || file.type,
      originalFilename: file.name,
    });

    // Build AssetInfo
    const assetInfo: AssetInfo = {
      id: tempAssetId,
      mimeType: validation.detectedMimeType || file.type,
      fileSize: file.size,
      originalFilename: file.name,
      storageKey,
      duration: null,
      width: null,
      height: null,
    };

    // Determine modality
    const modality = isImageType(assetInfo.mimeType) ? "image" : "video";

    // Run detection through the real orchestrator
    const orchestrator = new DetectionOrchestrator();
    const analysis: DetectionAnalysis = modality === "image"
      ? await orchestrator.analyzeImage(assetInfo)
      : await orchestrator.analyzeVideo(assetInfo);

    // Compute scores
    const scores = computeScores(analysis);

    // Clean up test file (best effort)
    storage.delete(storageKey).catch(() => {});

    // Build safe response — NEVER expose raw provider responses or providerMetadata
    const providerResults = analysis.results
      .filter((r) => r.provider !== "c2pa_analyzer") // exclude provenance-only
      .map((r) => {
        // Find possible generator from evidence
        const generatorEvidence = r.evidence.find(
          (e) => e.title === "Possible AI generator identified"
        );
        let possibleGenerator: string | null = null;
        if (generatorEvidence?.providerMetadata) {
          const top = (generatorEvidence.providerMetadata as { topGenerators?: Array<{ generator: string }> })
            ?.topGenerators?.[0];
          if (top) possibleGenerator = top.generator;
        }

        return {
          provider: r.provider,
          providerVersion: r.providerVersion,
          modality: r.modality,
          aiProbability: r.aiProbability,
          manipulationProbability: r.manipulationProbability,
          confidence: r.confidence,
          processingTimeMs: r.processingTimeMs,
          evidenceCount: r.evidence.length,
          limitations: r.limitations,
          isMock: r.isMock,
          possibleGenerator,
        };
      });

    const providerFailures = analysis.failures.map((f) => ({
      provider: f.provider,
      errorCode: f.errorCode,
      messageSafe: f.messageSafe,
      retryable: f.retryable,
      // NEVER expose internalDetail
    }));

    return NextResponse.json({
      testId: tempAssetId,
      mediaType: modality,
      filename: file.name,
      fileSize: file.size,
      detectedMimeType: validation.detectedMimeType,
      detectionMode: config.detection.mode,

      // Per-provider results (normalized, no raw payloads)
      providerResults,
      providerFailures,

      // Fusion result
      fusion: {
        consensus: scores.providerAgreement.consensus,
        agreement: scores.providerAgreement.agreement,
        providerCount: scores.providerAgreement.providerCount,
        providersUsed: scores.providerAgreement.providersUsed,
        hasFailures: scores.providerAgreement.hasFailures,
      },

      // Final scores
      scores: {
        aiInvolvementScore: scores.aiInvolvementScore,
        manipulationScore: scores.manipulationScore,
        confidenceScore: scores.confidenceScore,
        classificationLevel: scores.classificationLevel,
        verdict: scores.verdict,
        provenanceStatus: scores.provenanceStatus,
        summary: scores.summary,
      },

      totalProcessingTimeMs: analysis.totalProcessingTimeMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[admin/detection/test] Error:", error);
    return NextResponse.json(
      {
        error: "Detection test failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
