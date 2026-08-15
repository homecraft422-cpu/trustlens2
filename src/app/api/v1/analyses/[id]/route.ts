import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { ensureDbUsable } from "@/db";
import {
  getJobStatus,
  verifyJobOwnership,
  resumeStalledJob,
} from "@/lib/services/analysis-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe, user-facing explanations for internal failure codes. */
const FAILURE_MESSAGES: Record<string, string> = {
  media_processing_failed:
    "We couldn't read this file's contents. It may be corrupted or use an unsupported codec.",
  no_provider_results:
    "No detection engine was able to analyse this file. Please try again in a moment.",
  analysis_error:
    "Something went wrong while analysing this file. Please try again.",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Degrade to the in-memory store if PostgreSQL is unavailable/unmigrated.
  try {
    await ensureDbUsable();
  } catch {
    // never fatal
  }

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

  // Self-heal: if the worker died mid-pipeline (serverless freeze, redeploy),
  // the poll itself kicks the job back off instead of hanging forever.
  if (job.status !== "completed" && job.status !== "failed") {
    try {
      await resumeStalledJob(id);
    } catch (error) {
      console.error("[analyses] resume attempt failed:", error);
    }
  }

  // Return safe job status (no internal details)
  return NextResponse.json({
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    // Expose a safe, human-readable reason so the UI can explain the failure
    // instead of showing a bare error code.
    errorCode: job.status === "failed" ? job.errorCode : undefined,
    errorMessage:
      job.status === "failed"
        ? FAILURE_MESSAGES[job.errorCode || ""] ||
          "We couldn't complete this analysis. Please try again with a different file."
        : undefined,
  });
}
