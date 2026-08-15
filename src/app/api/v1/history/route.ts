import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { getUserHistory } from "@/lib/services/analysis-service";
import { ensureDbUsable } from "@/db";

export async function GET(req: NextRequest) {
  // Degrade to the in-memory store if PostgreSQL is unavailable/unmigrated.
  try {
    await ensureDbUsable();
  } catch {
    // never fatal
  }

  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;
  const guestId = req.nextUrl.searchParams.get("guestId");

  const owner = {
    userId: user?.id || null,
    guestId: user ? null : guestId,
  };

  if (!owner.userId && !owner.guestId) {
    return NextResponse.json({ items: [] });
  }

  // History is best-effort: a broken store must never hard-fail the page.
  let items: any[] = [];
  try {
    items = await getUserHistory(owner, 50, 0);
  } catch (error) {
    console.error("[history] failed to load history (returning empty):", error);
    items = [];
  }

  // Return sanitized data
  return NextResponse.json({
    items: items.map((item) => ({
      job: {
        id: item.job.id,
        status: item.job.status,
        createdAt: item.job.createdAt,
      },
      result: item.result
        ? {
            verdict: item.result.verdict,
            aiInvolvementScore: item.result.aiInvolvementScore,
            manipulationScore: item.result.manipulationScore,
            confidenceScore: item.result.confidenceScore,
          }
        : null,
      asset: item.asset
        ? {
            originalFilename: item.asset.originalFilename,
            mimeType: item.asset.mimeType,
            fileSize: item.asset.fileSize,
          }
        : null,
      report: item.report
        ? {
            publicId: item.report.publicId,
          }
        : null,
    })),
  });
}
