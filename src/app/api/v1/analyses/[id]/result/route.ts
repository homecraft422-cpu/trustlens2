import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { ensureDbUsable } from "@/db";
import {
  getAnalysisResultView,
  verifyJobOwnership,
} from "@/lib/services/analysis-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Degrade to the in-memory store if PostgreSQL is unavailable/unmigrated.
  try {
    await ensureDbUsable();
  } catch {
    // never fatal
  }
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

  const view = await getAnalysisResultView(id);
  if (!view) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  return NextResponse.json(view);
}
