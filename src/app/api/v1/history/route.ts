import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { getUserHistory } from "@/lib/services/analysis-service";

export async function GET(req: NextRequest) {
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

  const items = await getUserHistory(owner, 50, 0);

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
