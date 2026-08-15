import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { getDetailedUsage } from "@/lib/services/analysis-service";
import { config } from "@/lib/config";
import { ensureDbUsable } from "@/db";

export async function GET(req: NextRequest) {
  try {
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

    const usage = await getDetailedUsage(owner, user);

    return NextResponse.json({
      ...usage,
      // Legacy compatibility fields
      used: usage.total.used,
      limit: usage.total.limit,
      remaining: usage.total.remaining,
      isAuthenticated: usage.isAuthenticated,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      {
        isAuthenticated: false,
        user: null,
        period: "guest_session",
        plan: { id: "free", name: "Free", isPaid: false, renewsAt: null, billingCycle: null },
        creditsBalance: 0,
        limits: {
          image: { used: 0, limit: config.limits.guest.image, remaining: config.limits.guest.image },
          video: { used: 0, limit: config.limits.guest.video, remaining: config.limits.guest.video },
          audio: { used: 0, limit: config.limits.guest.audio, remaining: config.limits.guest.audio },
        },
        total: { used: 0, limit: config.limits.guest.total, remaining: config.limits.guest.total },
        used: 0,
        limit: config.limits.guest.total,
        remaining: config.limits.guest.total,
      },
      { status: 200 }
    );
  }
}
