import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { getJobStatus, verifyJobOwnership } from "@/lib/services/analysis-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get user/guest for ownership check
  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;
  const guestId = req.nextUrl.searchParams.get("guestId");

  const owner = {
    userId: user?.id || null,
    guestId: user ? null : guestId,
  };

  // Get job
  const job = await getJobStatus(id);
  if (!job) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  // Verify ownership
  const isOwner = await verifyJobOwnership(id, owner);
  if (!isOwner) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  // Return safe job status (no internal details)
  return NextResponse.json({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    // Only expose error code, not internal message
    errorCode: job.status === "failed" ? job.errorCode : undefined,
  });
}
