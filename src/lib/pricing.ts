/**
 * ============================================
 * TRUSTLENS PRICING ENGINE
 * ============================================
 * Two straightforward ways to use the service: predictable monthly
 * subscriptions and optional pay-as-you-go credits. Prices and limits are
 * defined here so the UI, quota engine, and billing records stay consistent.
 *
 * MODEL 1 — FREEMIUM SUBSCRIPTION (predictable recurring access)
 *   Free     → signed-in monthly limits
 *   Pro      → expanded limits for regular individual use
 *   Business → higher limits and team-oriented features
 *
 * MODEL 2 — PAY-AS-YOU-GO CREDITS (high-margin, no commitment)
 *   Credits never expire. Used automatically once the monthly
 *   plan quota is exhausted — so users are never hard-blocked.
 *
 * UNIT ECONOMICS (provider cost basis, production mode):
 *   - Image check  ≈ $0.006 (Sightengine ~2 ops @ $0.003)
 *   - Video check  ≈ $0.12  (~30 frames + audio track)
 *   - Audio check  ≈ $0.06  per clip
 *
 *   Pro $9/mo  → max quota cost ≈ $4.80 → ≥47% gross margin
 *                (typical utilization <60% → real margin ~70%)
 *   Business $39/mo → max quota cost ≈ $24 → ≥38% margin
 *                (typical utilization → ~65% margin)
 *   Credits: image 1 cr ($0.05-0.08 revenue vs $0.006 cost → ~90%),
 *            video 5 cr, audio 2 cr → 50-70% margin.
 * ============================================
 */

export type PlanId = "free" | "pro" | "business";

export interface MediaLimits {
  image: number;
  video: number;
  audio: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthlyUSD: number;
  priceMonthlyINR: number;
  /** Discounted yearly price (per month equivalent shown in UI) */
  priceYearlyUSD: number;
  priceYearlyINR: number;
  limits: MediaLimits;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUSD: number;
  priceINR: number;
  perCreditUSD: number;
  savingsLabel?: string;
  popular?: boolean;
}

/** How many credits one analysis consumes (Model 2). */
export const CREDIT_COSTS: Record<"image" | "video" | "audio", number> = {
  image: 1,
  video: 5,
  audio: 2,
};

/**
 * Subscription plans (Model 1).
 * Free limits intentionally mirror the existing config.limits.user values.
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "For casual verification",
    priceMonthlyUSD: 0,
    priceMonthlyINR: 0,
    priceYearlyUSD: 0,
    priceYearlyINR: 0,
    limits: { image: 10, video: 5, audio: 5 },
    features: [
      "10 image checks / month",
      "5 video deepfake checks / month",
      "5 audio analyses / month",
      "Saved history & shareable reports",
      "Community support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For creators, journalists & analysts",
    priceMonthlyUSD: 9,
    priceMonthlyINR: 749,
    priceYearlyUSD: 7, // ~22% off, billed yearly
    priceYearlyINR: 599,
    limits: { image: 100, video: 20, audio: 30 },
    features: [
      "100 image checks / month",
      "20 video deepfake checks / month",
      "30 audio analyses / month",
      "Priority analysis queue",
      "PDF & CSV report exports",
      "Full provenance (C2PA) details",
      "Email support",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For teams, newsrooms & platforms",
    priceMonthlyUSD: 39,
    priceMonthlyINR: 3299,
    priceYearlyUSD: 31, // ~20% off, billed yearly
    priceYearlyINR: 2599,
    limits: { image: 500, video: 100, audio: 150 },
    features: [
      "500 image checks / month",
      "100 video deepfake checks / month",
      "150 audio analyses / month",
      "Everything in Pro",
      "API access (coming soon)",
      "Batch processing priority",
      "Dedicated support & SLA",
    ],
    badge: "Best Value",
  },
};

/**
 * Pay-as-you-go credit packs (Model 2).
 * Credits never expire and are consumed automatically after the
 * monthly plan quota runs out (image=1, audio=2, video=5 credits).
 */
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_starter",
    name: "Starter Pack",
    credits: 50,
    priceUSD: 4,
    priceINR: 349,
    perCreditUSD: 0.08,
  },
  {
    id: "pack_value",
    name: "Value Pack",
    credits: 200,
    priceUSD: 12,
    priceINR: 999,
    perCreditUSD: 0.06,
    savingsLabel: "Save 25%",
    popular: true,
  },
  {
    id: "pack_power",
    name: "Power Pack",
    credits: 500,
    priceUSD: 25,
    priceINR: 2099,
    perCreditUSD: 0.05,
    savingsLabel: "Save 37%",
  },
];

export function getPlan(planId: string | null | undefined): Plan {
  if (planId === "pro" || planId === "business") return PLANS[planId];
  return PLANS.free;
}

export function getCreditPack(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === packId);
}

/** Plan limits for a given plan id (used by the quota engine). */
export function getPlanLimits(planId: string | null | undefined): MediaLimits {
  return getPlan(planId).limits;
}

/** Whether a subscription is currently active. */
export function isPlanActive(
  planId: string | null | undefined,
  renewsAt: Date | string | null | undefined
): boolean {
  if (!planId || planId === "free") return false;
  if (!renewsAt) return false;
  const ts = new Date(renewsAt).getTime();
  return !isNaN(ts) && ts > Date.now();
}
