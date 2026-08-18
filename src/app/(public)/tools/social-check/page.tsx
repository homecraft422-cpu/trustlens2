"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  Camera,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Search,
  ExternalLink,
  Globe,
  ShieldCheck,
  Info,
  Play,
  UserRound,
  CalendarDays,
} from "lucide-react";

interface SocialCheckResult {
  platform: string;
  url: string;
  platformLabel: string;
  postType: string | null;
  embed: {
    title: string | null;
    authorName: string | null;
    thumbnailUrl: string | null;
    authorUrl: string | null;
  };
  pageAnalysis: {
    reachable: boolean;
    https: boolean;
    credibilityScore: number;
    domainAnalysis: {
      registrar: string | null;
      registrationDate: string | null;
      ageYears: number | null;
      isNewDomain: boolean;
    };
    signals: Array<{ title: string; description: string; severity: string }>;
  } | null;
  summary: string;
  caveats: string[];
  analyzedAt: string;
}

const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "X / Twitter" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
];

export default function SocialCheckPage() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SocialCheckResult | null>(null);

  const handleAnalyze = async () => {
    const raw = url.trim();
    if (!raw) {
      setError("Please paste a link to a social media post.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v1/social-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed. Please try again.");
      }
      setResult(data as SocialCheckResult);
    } catch (err: any) {
      console.error("Social check error:", err);
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 ring-1 ring-pink-100">
            <Camera className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Social Media Post Check
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Paste a link to a YouTube, Instagram, X, TikTok, Facebook, or
            LinkedIn post. We identify the platform, pull real video metadata
            where available, and check the page and domain for warning signs.
          </p>
        </div>

        {/* Input */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label htmlFor="social-url" className="text-sm font-bold text-slate-900">
            Post URL
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="social-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="https://youtube.com/watch?v=… or https://instagram.com/p/…"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Check post
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Supports:</span>
            {PLATFORM_OPTIONS.map((p) => (
              <span key={p.value} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {p.label}
              </span>
            ))}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="mt-6 animate-fade-in space-y-5">
            {/* Post summary */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-pink-50 px-3 py-1.5 text-xs font-bold text-pink-700">
                  {result.platformLabel}
                </span>
                {result.postType && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    {result.postType}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    result.pageAnalysis?.credibilityScore && result.pageAnalysis.credibilityScore >= 70
                      ? "bg-emerald-50 text-emerald-700"
                      : result.pageAnalysis?.credibilityScore && result.pageAnalysis.credibilityScore >= 45
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  Domain credibility: {result.pageAnalysis?.credibilityScore ?? "—"}/100
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{result.summary}</p>
            </div>

            {/* YouTube embed metadata */}
            {result.embed?.title && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <Play className="h-4 w-4 text-brand-600" />
                  Video metadata (YouTube oEmbed)
                </h2>
                <div className="flex flex-col gap-4 sm:flex-row">
                  {result.embed.thumbnailUrl && (
                    <img
                      src={result.embed.thumbnailUrl}
                      alt="Video thumbnail"
                      className="h-24 w-40 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">{result.embed.title}</div>
                    {result.embed.authorName && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <UserRound className="h-3.5 w-3.5" />
                        {result.embed.authorUrl ? (
                          <a
                            href={result.embed.authorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-brand-600 hover:text-brand-700"
                          >
                            {result.embed.authorName}
                          </a>
                        ) : (
                          result.embed.authorName
                        )}
                      </div>
                    )}
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      Open original post <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Domain analysis */}
            {result.pageAnalysis && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <Globe className="h-4 w-4 text-brand-600" />
                  Page & domain checks
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-slate-600">Page reachable</span>
                    <span className={`text-xs font-bold ${result.pageAnalysis.reachable ? "text-emerald-600" : "text-red-500"}`}>
                      {result.pageAnalysis.reachable ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-slate-600">HTTPS</span>
                    <span className={`text-xs font-bold ${result.pageAnalysis.https ? "text-emerald-600" : "text-red-500"}`}>
                      {result.pageAnalysis.https ? "Yes" : "No"}
                    </span>
                  </div>
                  {result.pageAnalysis.domainAnalysis.registrationDate && (
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3.5 py-2.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">
                        Domain registered {result.pageAnalysis.domainAnalysis.registrationDate.slice(0, 10)}
                      </span>
                    </div>
                  )}
                  {result.pageAnalysis.domainAnalysis.isNewDomain && (
                    <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-3.5 py-2.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="text-xs font-bold text-red-600">Very new domain</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signals */}
            {result.pageAnalysis && result.pageAnalysis.signals.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  Findings
                </h2>
                <ul className="space-y-2.5">
                  {result.pageAnalysis.signals.map((signal, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3.5">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          signal.severity === "high" ? "bg-red-500" : signal.severity === "medium" ? "bg-amber-500" : "bg-slate-300"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">{signal.title}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{signal.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Caveats */}
            {result.caveats.length > 0 && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900">
                  <Info className="h-4 w-4" />
                  What this check can and cannot tell you
                </h2>
                <ul className="space-y-1.5">
                  {result.caveats.map((caveat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-amber-800">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                      {caveat}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
          <Info className="mr-1 inline h-3.5 w-3.5 text-brand-500" />
          Platforms restrict third-party access to private data (followers,
          engagement, account history). Instead of guessing, we report only
          verifiable signals and point you to the checks that matter: the
          account itself, its age, and whether reputable sources cover the post.
        </div>
      </main>
    </div>
  );
}
