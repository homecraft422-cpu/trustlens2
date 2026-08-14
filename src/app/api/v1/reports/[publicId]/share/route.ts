import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { enableSharing } from "@/lib/services/analysis-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;

  // Get user/guest for ownership check
  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;

  // Try to get guestId from request body or query
  let guestId: string | null = null;
  try {
    const body = await req.json();
    guestId = body.guestId || null;
  } catch {
    guestId = req.nextUrl.searchParams.get("guestId");
  }

  const owner = {
    userId: user?.id || null,
    guestId: user ? null : guestId,
  };

  if (!owner.userId && !owner.guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enable sharing with ownership verification
  const success = await enableSharing(publicId, owner);

  if (!success) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, publicId });
}
