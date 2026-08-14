import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { getUsageCount } from "@/lib/services/analysis-service";
import { config } from "@/lib/config";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;
  const guestId = req.nextUrl.searchParams.get("guestId");

  const owner = {
    userId: user?.id || null,
    guestId: user ? null : guestId,
  };

  const used = await getUsageCount(owner);
  const limit = owner.userId ? config.limits.user : config.limits.guest;

  return NextResponse.json({
    used,
    limit,
    remaining: Math.max(0, limit - used),
    isAuthenticated: !!owner.userId,
  });
}
