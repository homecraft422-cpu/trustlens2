import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { db } from "@/db";
import { users, billingEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PLANS, type PlanId } from "@/lib/pricing";

/**
 * POST /api/v1/billing/subscribe
 * Model 1: Freemium subscription — activate / change / cancel a plan.
 *
 * DEMO CHECKOUT: activates instantly without a payment gateway.
 * In production, plug Stripe / Razorpay here: create a checkout
 * session, then apply the plan inside the payment webhook instead.
 *
 * Body: { planId: "pro" | "business" | "free", billingCycle?: "monthly" | "yearly" }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value;
    const user = token ? await getSessionUserFromToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to subscribe to a plan.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const planId = body?.planId as PlanId | undefined;
    const billingCycle = body?.billingCycle === "yearly" ? "yearly" : "monthly";

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    // ─── Downgrade / cancel ───
    if (planId === "free") {
      await db
        .update(users)
        .set({ plan: "free", billingCycle: null, planStartedAt: null, planRenewsAt: null })
        .where(eq(users.id, user.id));

      await db.insert(billingEvents).values({
        userId: user.id,
        eventType: "cancellation",
        planId: "free",
        amountUSD: 0,
        description: "Subscription cancelled — downgraded to Free plan",
      });

      return NextResponse.json({
        success: true,
        plan: { id: "free", name: "Free", isPaid: false, renewsAt: null, billingCycle: null },
        message: "Your subscription has been cancelled. You are now on the Free plan.",
      });
    }

    const plan = PLANS[planId];
    const now = new Date();
    const renewsAt = new Date(now);
    if (billingCycle === "yearly") {
      renewsAt.setUTCFullYear(renewsAt.getUTCFullYear() + 1);
    } else {
      renewsAt.setUTCMonth(renewsAt.getUTCMonth() + 1);
    }

    const amountUSD =
      billingCycle === "yearly" ? plan.priceYearlyUSD * 12 : plan.priceMonthlyUSD;

    await db
      .update(users)
      .set({ plan: planId, billingCycle, planStartedAt: now, planRenewsAt: renewsAt })
      .where(eq(users.id, user.id));

    await db.insert(billingEvents).values({
      userId: user.id,
      eventType: "subscription",
      planId,
      amountUSD,
      description: `Subscribed to ${plan.name} plan (${billingCycle}) — $${amountUSD}${billingCycle === "yearly" ? "/yr" : "/mo"}`,
    });

    return NextResponse.json({
      success: true,
      plan: {
        id: planId,
        name: plan.name,
        isPaid: true,
        renewsAt: renewsAt.toISOString(),
        billingCycle,
      },
      message: `Welcome to TrustLens ${plan.name}! Your new limits are active immediately.`,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Failed to update subscription." }, { status: 500 });
  }
}
