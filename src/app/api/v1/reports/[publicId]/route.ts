import { NextRequest, NextResponse } from "next/server";
import { getPublicReport } from "@/lib/services/analysis-service";
import { config } from "@/lib/config";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  const data = await getPublicReport(publicId);

  if (!data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Return sanitized data for public consumption
  // No internal IDs, storage keys, user info, or sensitive metadata
  return NextResponse.json({
    result: {
      verdict: data.result.verdict,
      aiInvolvementScore: data.result.aiInvolvementScore,
      manipulationScore: data.result.manipulationScore,
      confidenceScore: data.result.confidenceScore,
      classificationLevel: data.result.classificationLevel,
      provenanceStatus: data.result.provenanceStatus,
      summary: data.result.summary,
      createdAt: data.result.createdAt,
    },
    signals: data.signals.map((s) => ({
      id: s.id,
      category: s.category,
      signalType: s.signalType,
      score: s.score,
      severity: s.severity,
      title: s.title,
      description: s.description,
      timestampStart: s.timestampStart,
      timestampEnd: s.timestampEnd,
      // Don't expose source provider name in public reports
    })),
    asset: data.asset
      ? {
          // Only expose filename for context, not internal data
          originalFilename: data.asset.originalFilename,
          mimeType: data.asset.mimeType,
          fileSize: data.asset.fileSize,
          duration: data.asset.duration,
        }
      : null,
    isMockMode: config.detection.mode === "mock",
  });
}
