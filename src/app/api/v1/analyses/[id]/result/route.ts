import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import {
  getAnalysisResult,
  verifyJobOwnership,
} from "@/lib/services/analysis-service";
import { config } from "@/lib/config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;
  const guestId = req.nextUrl.searchParams.get("guestId");

  const owner = {
    userId: user?.id || null,
    guestId: user ? null : guestId,
  };

  const isOwner = await verifyJobOwnership(id, owner);
  if (!isOwner) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  const data = await getAnalysisResult(id);
  if (!data) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  // Parse stored provider agreement metadata (safe — never contains secrets)
  let providerSummary = {
    consensus: "single_provider" as string,
    agreement: null as number | null,
    providerCount: 1,
    providersUsed: [] as string[],
    hasFailures: false,
    failures: [] as Array<{ provider: string; errorCode: string }>,
  };

  if (data.result.metadata) {
    try {
      const meta = JSON.parse(data.result.metadata);
      if (meta.providerAgreement) {
        providerSummary = {
          consensus: meta.providerAgreement.consensus,
          agreement: meta.providerAgreement.agreement,
          providerCount: meta.providerAgreement.providerCount,
          providersUsed: meta.providerAgreement.providersUsed || [],
          hasFailures: meta.providerAgreement.hasFailures || false,
          failures: (meta.failures || []).map((f: { provider: string; errorCode: string }) => ({
            provider: f.provider,
            errorCode: f.errorCode,
          })),
        };
      }
    } catch {
      // Ignore parse errors for old data
    }
  }

  return NextResponse.json({
    result: {
      id: data.result.id,
      verdict: data.result.verdict,
      aiInvolvementScore: data.result.aiInvolvementScore,
      manipulationScore: data.result.manipulationScore,
      confidenceScore: data.result.confidenceScore,
      classificationLevel: data.result.classificationLevel,
      provenanceStatus: data.result.provenanceStatus,
      summary: data.result.summary,
      createdAt: data.result.createdAt,
    },
    providerSummary,
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
      source: s.source,
    })),
    report: data.report
      ? { publicId: data.report.publicId, isPublic: data.report.isPublic }
      : null,
    asset: data.asset
      ? {
          originalFilename: data.asset.originalFilename,
          mimeType: data.asset.mimeType,
          fileSize: data.asset.fileSize,
          duration: data.asset.duration,
        }
      : null,
    isMockMode: config.detection.mode === "mock",
  });
}
