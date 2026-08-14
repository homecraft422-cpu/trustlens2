import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { db } from "@/db";
import { users, billingEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCreditPack } from "@/lib/pricing";

/**
 * POST /api/v1/billing/credits
 * Model 2: Pay-as-you-go — purchase a credit pack.
 *
 * DEMO CHECKOUT: credits are added instantly without a payment
 * gateway. In production, plug Stripe / Razorpay here and add the
 * credits inside the payment webhook instead.
 *
 * Body: { packId: "pack_starter" | "pack_value" | "pack_power" }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value;
    const user = token ? await getSessionUserFromToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to buy credits.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const pack = getCreditPack(body?.packId);

    if (!pack) {
      return NextResponse.json({ error: "Invalid credit pack selected." }, { status: 400 });
    }

    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const currentBalance = Math.max(0, row?.creditsBalance ?? 0);
    const newBalance = currentBalance + pack.credits;

    await db.update(users).set({ creditsBalance: newBalance }).where(eq(users.id, user.id));

    await db.insert(billingEvents).values({
      userId: user.id,
      eventType: "credit_purchase",
      packId: pack.id,
      credits: pack.credits,
      amountUSD: pack.priceUSD,
      description: `Purchased ${pack.name} — ${pack.credits} credits for $${pack.priceUSD}`,
    });

    return NextResponse.json({
      success: true,
      creditsAdded: pack.credits,
      creditsBalance: newBalance,
      message: `${pack.credits} credits added! Credits never expire and are used automatically when your monthly quota runs out.`,
    });
  } catch (error) {
    console.error("Credit purchase error:", error);
    return NextResponse.json({ error: "Failed to purchase credits." }, { status: 500 });
  }
}
