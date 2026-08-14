"use client";

import Link from "next/link";
import { Image, Video, Music, Sparkles, ArrowRight, ShieldCheck, Calendar, Coins, Crown } from "lucide-react";

export interface QuotaItem {
  used: number;
  limit: number;
  remaining: number;
}

export interface PlanInfo {
  id: string;
  name: string;
  isPaid: boolean;
  renewsAt: string | null;
  billingCycle: string | null;
}

interface UsageMeterProps {
  limits?: {
    image: QuotaItem;
    video: QuotaItem;
    audio: QuotaItem;
  };
  // Fallbacks for total or legacy callers
  used?: number;
  limit?: number;
  isAuthenticated?: boolean;
  resetDate?: string;
  monthName?: string;
  plan?: PlanInfo;
  creditsBalance?: number;
}

export default function UsageMeter({
  limits,
  used = 0,
  limit = 20,
  isAuthenticated = false,
  resetDate,
  monthName,
  plan,
  creditsBalance = 0,
}: UsageMeterProps) {
  // If specific media quotas are provided:
  const imageQuota = limits?.image || {
    used: 0,
    limit: isAuthenticated ? 10 : 2,
    remaining: isAuthenticated ? 10 : 2,
  };
  const videoQuota = limits?.video || {
    used: 0,
    limit: isAuthenticated ? 5 : 1,
    remaining: isAuthenticated ? 5 : 1,
  };
  const audioQuota = limits?.audio || {
    used: 0,
    limit: isAuthenticated ? 5 : 1,
    remaining: isAuthenticated ? 5 : 1,
  };

  const getProgressColor = (rem: number, lim: number) => {
    const pct = rem / lim;
    if (pct > 0.5) return "bg-emerald-500";
    if (pct > 0.2) return "bg-amber-500";
    return "bg-red-500";
  };

  const getTextColor = (rem: number) => {
    if (rem > 0) return "text-slate-800";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      {/* Plan Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {plan?.isPaid ? (
            <Crown className="w-5 h-5 text-amber-500" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-brand-600" />
          )}
          <span className="text-sm font-bold text-slate-900">
            {isAuthenticated
              ? plan?.isPaid
                ? `${plan.name} Plan Quota`
                : "Monthly Plan Quota"
              : "Free Guest Quota"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && creditsBalance > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
              <Coins className="w-3 h-3" /> {creditsBalance} credits
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
            {isAuthenticated
              ? `${imageQuota.limit} Img • ${videoQuota.limit} Vid • ${audioQuota.limit} Aud / mo`
              : "2 Img • 1 Vid • 1 Aud"}
          </span>
        </div>
      </div>

      {/* 3-Column Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Images */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Image className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Images</span>
            </div>
            <span className={`text-xs font-bold ${getTextColor(imageQuota.remaining)}`}>
              {imageQuota.remaining} left
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1.5 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(imageQuota.remaining, imageQuota.limit)}`}
              style={{
                width: `${Math.min(100, Math.max(0, (imageQuota.used / imageQuota.limit) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-600 font-medium">
            <span>Used: {imageQuota.used}</span>
            <span>Limit: {imageQuota.limit}</span>
          </div>
        </div>

        {/* Videos */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Videos</span>
            </div>
            <span className={`text-xs font-bold ${getTextColor(videoQuota.remaining)}`}>
              {videoQuota.remaining} left
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1.5 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(videoQuota.remaining, videoQuota.limit)}`}
              style={{
                width: `${Math.min(100, Math.max(0, (videoQuota.used / videoQuota.limit) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-600 font-medium">
            <span>Used: {videoQuota.used}</span>
            <span>Limit: {videoQuota.limit}</span>
          </div>
        </div>

        {/* Audio */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Audio</span>
            </div>
            <span className={`text-xs font-bold ${getTextColor(audioQuota.remaining)}`}>
              {audioQuota.remaining} left
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1.5 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(audioQuota.remaining, audioQuota.limit)}`}
              style={{
                width: `${Math.min(100, Math.max(0, (audioQuota.used / audioQuota.limit) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-600 font-medium">
            <span>Used: {audioQuota.used}</span>
            <span>Limit: {audioQuota.limit}</span>
          </div>
        </div>
      </div>

      {/* Call to action for guests or Reset info for users */}
      {!isAuthenticated ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-900">Want more scans?</span>
              <p className="text-slate-600">
                Create a free account for 10 images, 5 videos, and 5 audios every month!
              </p>
            </div>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
          >
            Sign Up Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {monthName ? `${monthName} usage.` : "Current cycle."}{" "}
              {resetDate ? `Quota automatically resets on ${resetDate}.` : "Quota resets on the 1st of every month."}
              {plan?.isPaid && plan.renewsAt
                ? ` Plan renews on ${new Date(plan.renewsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
                : ""}
            </span>
          </div>

          {/* Upgrade CTA for free-plan users */}
          {!plan?.isPaid && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">Need more checks?</span>
                  <p className="text-slate-600">
                    Go Pro for 100 images, 20 videos & 30 audios/month — or buy credits that never expire.
                  </p>
                </div>
              </div>
              <Link
                href="/pricing"
                className="shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
              >
                View Pricing
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
