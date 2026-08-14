import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { db } from "@/db";
import { users, billingEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getPlan, isPlanActive, PLANS, CREDIT_PACKS, CREDIT_COSTS } from "@/lib/pricing";

/**
 * GET /api/v1/billing
 * Returns the current user's plan, credit balance, and billing history.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value;
    const user = token ? await getSessionUserFromToken(token) : null;

    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        plan: { id: "free", name: "Free", isPaid: false, renewsAt: null, billingCycle: null },
        creditsBalance: 0,
        creditCosts: CREDIT_COSTS,
        plans: PLANS,
        creditPacks: CREDIT_PACKS,
        history: [],
      });
    }

    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const planActive = isPlanActive(row?.plan, row?.planRenewsAt);
    const planId = planActive ? row.plan : "free";
    const planDef = getPlan(planId);

    let history: any[] = [];
    try {
      history = await db
        .select()
        .from(billingEvents)
        .where(eq(billingEvents.userId, user.id))
        .orderBy(desc(billingEvents.createdAt))
        .limit(20);
    } catch {
      history = [];
    }

    return NextResponse.json({
      isAuthenticated: true,
      plan: {
        id: planId,
        name: planDef.name,
        isPaid: planId !== "free",
        renewsAt: planActive && row?.planRenewsAt ? new Date(row.planRenewsAt).toISOString() : null,
        billingCycle: planActive ? row?.billingCycle ?? null : null,
      },
      creditsBalance: Math.max(0, row?.creditsBalance ?? 0),
      creditCosts: CREDIT_COSTS,
      plans: PLANS,
      creditPacks: CREDIT_PACKS,
      history: history.map((h) => ({
        id: h.id,
        eventType: h.eventType,
        planId: h.planId ?? null,
        packId: h.packId ?? null,
        credits: h.credits ?? null,
        amountUSD: h.amountUSD ?? null,
        description: h.description,
        createdAt: h.createdAt,
      })),
    });
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json({ error: "Failed to load billing info" }, { status: 500 });
  }
}
