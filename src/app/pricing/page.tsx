"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Zap,
  Shield,
  Sparkles,
  Coins,
  TrendingUp,
  BadgeCheck,
  Infinity as InfinityIcon,
  CreditCard,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PLANS, CREDIT_PACKS, CREDIT_COSTS, type PlanId } from "@/lib/pricing";

interface BillingInfo {
  isAuthenticated: boolean;
  plan: {
    id: PlanId;
    name: string;
    isPaid: boolean;
    renewsAt: string | null;
    billingCycle: string | null;
  };
  creditsBalance: number;
}

type Cycle = "monthly" | "yearly";

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/billing");
      const data = await res.json();
      setBilling(data);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after an async fetch, not synchronously
    void loadBilling();
  }, [loadBilling]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const subscribe = async (planId: PlanId) => {
    if (!billing?.isAuthenticated) {
      router.push("/signup?next=/pricing");
      return;
    }
    setBusy(planId);
    try {
      const res = await fetch("/api/v1/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.message);
        await loadBilling();
      } else {
        showToast("error", data.error || "Something went wrong.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const buyCredits = async (packId: string) => {
    if (!billing?.isAuthenticated) {
      router.push("/signup?next=/pricing");
      return;
    }
    setBusy(packId);
    try {
      const res = await fetch("/api/v1/billing/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.message);
        await loadBilling();
      } else {
        showToast("error", data.error || "Something went wrong.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const currentPlanId = billing?.plan?.id || "free";
  const plans = [PLANS.free, PLANS.pro, PLANS.business];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Header />
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium max-w-lg ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? <BadgeCheck size={18} /> : <X size={18} />}
          {toast.text}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-14">
        {/* ─── Hero ─── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles size={14} /> Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Verify more. <span className="text-brand-600">Pay less.</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Up to <strong>5× cheaper</strong> than other deepfake detection platforms.
            Pick a monthly plan, or top up with credits that <strong>never expire</strong> — no
            commitment needed.
          </p>

          {billing?.isAuthenticated && (
            <div className="mt-6 inline-flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Shield size={16} className="text-brand-600" />
                Current plan: <strong className="text-slate-900">{billing.plan.name}</strong>
              </span>
              <span className="w-px h-4 bg-slate-200" />
              <span className="flex items-center gap-1.5 text-slate-700">
                <Coins size={16} className="text-amber-500" />
                Credits: <strong className="text-slate-900">{billing.creditsBalance}</strong>
              </span>
            </div>
          )}
        </div>

        {/* ─── Billing cycle toggle ─── */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                cycle === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                cycle === "yearly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Yearly
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                SAVE 20%+
              </span>
            </button>
          </div>
        </div>

        {/* ─── Model 1: Subscription plans ─── */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => {
            const price = cycle === "yearly" ? plan.priceYearlyUSD : plan.priceMonthlyUSD;
            const priceINR = cycle === "yearly" ? plan.priceYearlyINR : plan.priceMonthlyINR;
            const isCurrent = currentPlanId === plan.id;
            const isBusy = busy === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border p-7 flex flex-col bg-white transition-shadow hover:shadow-lg ${
                  plan.highlighted
                    ? "border-brand-500 shadow-md ring-2 ring-brand-500/20"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                      plan.highlighted
                        ? "bg-brand-600 text-white"
                        : "bg-slate-900 text-white"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">${price}</span>
                    <span className="text-slate-500 text-sm mb-1.5">/month</span>
                  </div>
                  {plan.id !== "free" && (
                    <p className="text-xs text-slate-400 mt-1">
                      ≈ ₹{priceINR}/mo{cycle === "yearly" ? " · billed yearly" : ""}
                    </p>
                  )}
                  {plan.id === "free" && (
                    <p className="text-xs text-slate-400 mt-1">Forever free · no card needed</p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-3 rounded-2xl bg-slate-100 text-slate-500 text-sm font-semibold text-center border border-slate-200">
                    ✓ Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={isBusy}
                    className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60 ${
                      plan.highlighted
                        ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                        : plan.id === "free"
                        ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isBusy
                      ? "Processing..."
                      : plan.id === "free"
                      ? billing?.plan?.isPaid
                        ? "Downgrade to Free"
                        : "Get Started Free"
                      : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Model 2: Pay-as-you-go credits ─── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <Coins size={14} /> Pay as you go
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              No subscription? <span className="text-amber-600">Buy credits.</span>
            </h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">
              Credits <strong>never expire</strong> and kick in automatically when your monthly
              quota runs out — you&apos;re never blocked mid-investigation.
            </p>
            <div className="mt-4 inline-flex flex-wrap justify-center items-center gap-3 text-xs text-slate-500">
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                🖼️ Image = {CREDIT_COSTS.image} credit
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                🎵 Audio = {CREDIT_COSTS.audio} credits
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                🎬 Video = {CREDIT_COSTS.video} credits
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {CREDIT_PACKS.map((pack) => {
              const isBusy = busy === pack.id;
              return (
                <div
                  key={pack.id}
                  className={`relative rounded-3xl border p-6 bg-white flex flex-col transition-shadow hover:shadow-lg ${
                    pack.popular
                      ? "border-amber-400 shadow-md ring-2 ring-amber-400/20"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500 text-white">
                      Most Popular
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Coins size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{pack.name}</h3>
                      <p className="text-xs text-slate-500">{pack.credits} credits</p>
                    </div>
                  </div>

                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">${pack.priceUSD}</span>
                    <span className="text-slate-400 text-xs mb-1">≈ ₹{pack.priceINR}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    ${pack.perCreditUSD.toFixed(2)}/credit
                    {pack.savingsLabel && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                        {pack.savingsLabel}
                      </span>
                    )}
                  </p>

                  <ul className="text-xs text-slate-600 space-y-1.5 mb-6 flex-1">
                    <li className="flex items-center gap-1.5">
                      <InfinityIcon size={13} className="text-emerald-500" /> Never expires
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Zap size={13} className="text-emerald-500" /> Auto-used after quota ends
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={13} className="text-emerald-500" /> ~{pack.credits} images or ~
                      {Math.floor(pack.credits / CREDIT_COSTS.video)} videos
                    </li>
                  </ul>

                  <button
                    onClick={() => buyCredits(pack.id)}
                    disabled={isBusy}
                    className={`w-full py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-60 ${
                      pack.popular
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isBusy ? "Processing..." : "Buy Credits"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Competitor comparison ─── */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
              <TrendingUp size={22} className="text-brand-600" /> How we compare
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Same detection quality, a fraction of the price.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Entry paid plan
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Free tier
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                    Pay-as-you-go
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-brand-50/40">
                  <td className="px-5 py-3.5 font-bold text-brand-700">🛡️ TrustLens</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">$9/mo</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-medium">✓ 20 checks/mo</td>
                  <td className="px-5 py-3.5 text-emerald-600 font-medium">✓ From $4, never expires</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-5 py-3.5 text-slate-700">DeepfakeDetector.ai</td>
                  <td className="px-5 py-3.5 text-slate-700">$49/mo</td>
                  <td className="px-5 py-3.5 text-slate-500">50 detections/mo</td>
                  <td className="px-5 py-3.5 text-red-500">✗ Subscription only</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-5 py-3.5 text-slate-700">TruthScan</td>
                  <td className="px-5 py-3.5 text-slate-700">$49/mo</td>
                  <td className="px-5 py-3.5 text-slate-500">Trial credits only</td>
                  <td className="px-5 py-3.5 text-red-500">✗ Plans only</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-5 py-3.5 text-slate-700">Sightengine</td>
                  <td className="px-5 py-3.5 text-slate-700">$29/mo</td>
                  <td className="px-5 py-3.5 text-slate-500">API only (dev tier)</td>
                  <td className="px-5 py-3.5 text-slate-500">Overage billing</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-slate-700">Reality Defender / Hive</td>
                  <td className="px-5 py-3.5 text-slate-700">Contact sales ($$$)</td>
                  <td className="px-5 py-3.5 text-red-500">✗ Demo only</td>
                  <td className="px-5 py-3.5 text-red-500">✗ Enterprise contracts</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Competitor pricing as publicly listed, August 2025. Subject to change.
          </p>
        </div>

        {/* ─── FAQ ─── */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How do the two pricing models work together?",
                a: "Your subscription plan gives you a monthly quota (e.g. Pro = 100 images, 20 videos, 30 audios). If you run out mid-month, your credit balance is used automatically — image costs 1 credit, audio 2, video 5. Credits never expire, so nothing is wasted.",
              },
              {
                q: "Can I use credits without a paid plan?",
                a: "Yes! Stay on the Free plan and just buy a credit pack whenever you need extra checks. It's perfect for occasional users who don't want a monthly commitment.",
              },
              {
                q: "What happens if I cancel my subscription?",
                a: "You keep your plan benefits until the end of the paid period, then drop back to the Free plan (10 images, 5 videos, 5 audios per month). Your credit balance is never touched — it stays yours forever.",
              },
              {
                q: "Is there a discount for yearly billing?",
                a: "Yes — Pro drops from $9 to $7/month and Business from $39 to $31/month when billed yearly (20%+ savings).",
              },
              {
                q: "Do you offer team or enterprise pricing?",
                a: "The Business plan covers most teams. For newsrooms, platforms, or API volume needs, reach out via the Contact page for custom volume pricing.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-slate-900 list-none">
                  {item.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* ─── Bottom CTA ─── */}
        <div className="text-center bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl px-8 py-12 text-white">
          <CreditCard size={32} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-extrabold mb-2">Start verifying for free</h2>
          <p className="text-brand-100 text-sm mb-6 max-w-md mx-auto">
            No credit card required. Upgrade only when you need more — or just top up credits.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/analyze"
              className="px-6 py-3 rounded-2xl bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors"
            >
              Try a free check
            </Link>
            {!billing?.isAuthenticated && (
              <Link
                href="/signup"
                className="px-6 py-3 rounded-2xl bg-brand-500/40 border border-white/30 text-white font-semibold text-sm hover:bg-brand-500/60 transition-colors"
              >
                Create free account
              </Link>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
