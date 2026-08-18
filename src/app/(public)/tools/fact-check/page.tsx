"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  MessageSquare,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Zap,
  Info,
  ExternalLink,
  Scale,
  Globe2,
  BookOpen,
} from "lucide-react";

interface FactCheckResult {
  claim: string;
  verdict: "true" | "false" | "misleading" | "partially_true" | "unverified";
  confidence: number;
  explanation: string;
  sources: Array<{
    title: string;
    url: string;
    reliability: "high" | "medium" | "low";
    rating?: string;
    publisher?: string;
    reviewDate?: string;
  }>;
  manipulationIndicators: string[];
  context: string;
  evidence: Array<{ text: string; url?: string }>;
  analysisSource: "google_fact_check_tools" | "wikipedia" | "none";
  metadata: { analyzedAt: string; language: string; apiStatus: string };
}

const VERDICT_META: Record<
  FactCheckResult["verdict"],
  { label: string; icon: typeof CheckCircle2; classes: string; iconClasses: string }
> = {
  true: {
    label: "True",
    icon: CheckCircle2,
    classes: "bg-emerald-50 border-emerald-200 text-emerald-900",
    iconClasses: "bg-emerald-100 text-emerald-600",
  },
  false: {
    label: "False",
    icon: XCircle,
    classes: "bg-red-50 border-red-200 text-red-900",
    iconClasses: "bg-red-100 text-red-600",
  },
  misleading: {
    label: "Misleading",
    icon: AlertCircle,
    classes: "bg-orange-50 border-orange-200 text-orange-900",
    iconClasses: "bg-orange-100 text-orange-600",
  },
  partially_true: {
    label: "Partially True",
    icon: Scale,
    classes: "bg-amber-50 border-amber-200 text-amber-900",
    iconClasses: "bg-amber-100 text-amber-600",
  },
  unverified: {
    label: "Unverified",
    icon: Info,
    classes: "bg-slate-50 border-slate-200 text-slate-800",
    iconClasses: "bg-slate-100 text-slate-500",
  },
};

const SAMPLE_CLAIMS = [
  "Chandrayaan-3 landed on the Moon's south pole in August 2023",
  "Drinking warm water cures COVID-19",
  "5G mobile networks cause health problems",
  "India's GDP growth was over 8% in FY2024",
  "UPI processed more than 10 billion transactions in a single month",
];

export default function FactCheckPage() {
  const [claim, setClaim] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [apiNote, setApiNote] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!claim.trim()) {
      setError("Please enter a claim to fact-check.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setApiNote(null);

    try {
      const res = await fetch("/api/v1/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claim.trim(), language: "en" }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Fact-check failed. Please try again.");
      }

      setResult(data as FactCheckResult);
      if (data.metadata?.apiStatus === "ok") {
        setApiNote("Checked against professional fact-checking organisations via the Google Fact Check Tools API.");
      } else if (data.metadata?.apiStatus === "fallback") {
        setApiNote("No professional rating was found for this exact claim — showing related reference material instead.");
      } else {
        setApiNote("Couldn't reach professional fact-check sources right now. Showing the analysis and guidance only.");
      }
    } catch (err: any) {
      console.error("Fact-check error:", err);
      setError(err.message || "Something went wrong during fact-checking.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Fact Checker
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Paste a claim, headline, or statement. We search professional
            fact-checking sources and reference material — and tell you honestly
            when a claim cannot be verified.
          </p>
        </div>

        {/* Input */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label htmlFor="claim" className="text-sm font-bold text-slate-900">
            Enter the claim to check
          </label>
          <textarea
            id="claim"
            rows={4}
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="e.g. ‘A study proved that drinking coffee cures migraines’"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Max 5,000 characters · checked against professional fact-checkers
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking sources…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Check claim
                </>
              )}
            </button>
          </div>

          {/* Sample claims */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_CLAIMS.map((sample) => (
                <button
                  key={sample}
                  onClick={() => setClaim(sample)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {sample}
                </button>
              ))}
            </div>
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
            {apiNote && (
              <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
                <Globe2 className="mt-0.5 h-4 w-4 shrink-0" />
                {apiNote}
              </div>
            )}

            {/* Verdict card */}
            <div className={`rounded-3xl border p-6 sm:p-8 ${VERDICT_META[result.verdict].classes}`}>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${VERDICT_META[result.verdict].iconClasses}`}
                >
                  {(() => {
                    const Icon = VERDICT_META[result.verdict].icon;
                    return <Icon className="h-7 w-7" />;
                  })()}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                    Verdict
                  </div>
                  <div className="text-2xl font-extrabold">
                    {VERDICT_META[result.verdict].label}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    Evidence strength
                  </div>
                  <div className="text-xl font-extrabold">
                    {Math.round(result.confidence * 100)}%
                  </div>
                </div>
              </div>
              <p className="mt-4 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Evidence */}
            {result.evidence.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <BookOpen className="h-4 w-4 text-brand-600" />
                  Evidence found
                </h2>
                <ul className="space-y-3">
                  {result.evidence.map((item, i) => (
                    <li key={i} className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                      {item.text}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                        >
                          View source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Context + indicators */}
            {result.context && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-base font-bold text-slate-900">Context</h2>
                <p className="text-sm leading-relaxed text-slate-600">{result.context}</p>
              </div>
            )}

            {result.manipulationIndicators.length > 0 && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="mb-3 text-base font-bold text-amber-900">
                  Claim-style red flags
                </h2>
                <ul className="space-y-2">
                  {result.manipulationIndicators.map((indicator, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-900">
                  Sources ({result.sources.length})
                </h2>
                <ul className="space-y-3">
                  {result.sources.map((source, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900">
                          {source.title}
                        </div>
                        {source.publisher && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {source.publisher}
                            {source.reviewDate ? ` · ${source.reviewDate.slice(0, 10)}` : ""}
                          </div>
                        )}
                      </div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          Read <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="rounded-2xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-500">
              <Zap className="mr-1 inline h-3.5 w-3.5 text-brand-500" />
              Fact-checking is probabilistic: always read the linked sources and
              consult primary documents before acting on any claim. “Unverified”
              is an honest answer — it does not mean the claim is false.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
