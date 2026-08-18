"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  Globe,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ExternalLink,
  LinkIcon,
  FileText,
  Lock,
  CalendarDays,
  Image,
  Search,
  Info,
} from "lucide-react";

interface UrlCheckResult {
  url: string;
  finalUrl: string;
  domain: string;
  reachable: boolean;
  https: boolean;
  httpStatus: number | null;
  pageTitle: string;
  metaDescription: string;
  generator: string;
  language: string;
  wordCount: number;
  headingCount: number;
  imageCount: number;
  linkCount: number;
  hasStructuredData: boolean;
  securityHeaders: {
    hsts: boolean;
    xContentTypeOptions: boolean;
    xFrameOptions: boolean;
    referrerPolicy: boolean;
    contentSecurityPolicy: boolean;
  };
  domainAnalysis: {
    registrar: string | null;
    registrationDate: string | null;
    ageYears: number | null;
    isNewDomain: boolean;
  };
  credibilityScore: number; // 0..100
  signals: Array<{ title: string; description: string; severity: "low" | "medium" | "high" }>;
  summary: string;
  analyzedAt: string;
}

function scoreTone(score: number) {
  if (score >= 70) return { label: "Low risk", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", bar: "bg-emerald-500" };
  if (score >= 45) return { label: "Mixed signals", icon: ShieldQuestion, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", bar: "bg-amber-500" };
  return { label: "High risk", icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", bar: "bg-red-500" };
}

export default function URLCheckPage() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlCheckResult | null>(null);

  const handleAnalyze = async () => {
    const raw = url.trim();
    if (!raw) {
      setError("Please enter a URL to analyze.");
      return;
    }
    const cleanUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      new URL(cleanUrl);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com/article).");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v1/url-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "URL analysis failed. Please try again.");
      }
      setResult(data as UrlCheckResult);
    } catch (err: any) {
      console.error("URL check error:", err);
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tone = result ? scoreTone(result.credibilityScore) : null;
  const domainTone = result?.domainAnalysis.isNewDomain
    ? { label: "Very new domain", icon: ShieldAlert, cls: "text-red-600 bg-red-50" }
    : result?.domainAnalysis.ageYears !== null
      ? { label: "Established domain", icon: ShieldCheck, cls: "text-emerald-600 bg-emerald-50" }
      : { label: "Domain age unknown", icon: ShieldQuestion, cls: "text-slate-500 bg-slate-50" };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
            <Globe className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            URL Content Check
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            We fetch the page live and analyze its transport security, page
            structure, and domain registration (via the IANA RDAP registry) to
            give you an evidence-based risk assessment.
          </p>
        </div>

        {/* Input */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label htmlFor="url-input" className="text-sm font-bold text-slate-900">
            Enter URL to analyze
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                placeholder="https://example.com/article"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>
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
                  Analyze URL
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {["https://www.bbc.com", "https://example.com", "https://www.who.int"].map((s) => (
              <button
                key={s}
                onClick={() => setUrl(s)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {s}
              </button>
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
        {result && tone && (
          <div className="mt-6 animate-fade-in space-y-5">
            {/* Verdict */}
            <div className={`rounded-3xl border p-6 sm:p-8 ${tone.bg}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80">
                  {(() => {
                    const Icon = tone.icon;
                    return <Icon className={`h-7 w-7 ${tone.color}`} />;
                  })()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                    Credibility assessment
                  </div>
                  <div className="truncate text-xl font-extrabold text-slate-900">
                    {tone.label} · {result.credibilityScore}/100
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {result.finalUrl}
                  </div>
                </div>
                <div className="ml-auto w-full max-w-[200px]">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full ${tone.bar} transition-all`}
                      style={{ width: `${result.credibilityScore}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <span>0</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">{result.summary}</p>
            </div>

            {/* Page facts */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <FileText className="h-4 w-4 text-brand-600" />
                Page analysis
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Page title", value: result.pageTitle || "—" },
                  { label: "Description", value: result.metaDescription || "—" },
                  { label: "Words on page", value: String(result.wordCount) },
                  { label: "Headings", value: String(result.headingCount) },
                  { label: "Images", value: String(result.imageCount) },
                  { label: "Links", value: String(result.linkCount) },
                  { label: "Generator", value: result.generator || "—" },
                  { label: "Language", value: result.language || "—" },
                  { label: "HTTP status", value: result.httpStatus !== null ? String(result.httpStatus) : "—" },
                  { label: "Structured data", value: result.hasStructuredData ? "Yes" : "No" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-semibold text-slate-800" title={item.value}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport security */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <Lock className="h-4 w-4 text-brand-600" />
                Transport & security headers
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { label: "HTTPS / TLS", value: result.https, good: true },
                  { label: "HSTS (Strict-Transport-Security)", value: result.securityHeaders.hsts, good: true },
                  { label: "Content-Security-Policy", value: result.securityHeaders.contentSecurityPolicy, good: true },
                  { label: "X-Frame-Options", value: result.securityHeaders.xFrameOptions, good: true },
                  { label: "X-Content-Type-Options", value: result.securityHeaders.xContentTypeOptions, good: true },
                  { label: "Referrer-Policy", value: result.securityHeaders.referrerPolicy, good: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${item.value ? "text-emerald-600" : "text-red-500"}`}>
                      {item.value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {item.value ? "Yes" : "No"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Domain */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                Domain intelligence (RDAP)
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${domainTone.cls}`}>
                  {(() => {
                    const Icon = domainTone.icon;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  {domainTone.label}
                </span>
                {result.domainAnalysis.registrationDate && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Registered {result.domainAnalysis.registrationDate.slice(0, 10)}
                  </span>
                )}
                {result.domainAnalysis.ageYears !== null && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    ~{result.domainAnalysis.ageYears} years old
                  </span>
                )}
                {result.domainAnalysis.registrar && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Registrar: {result.domainAnalysis.registrar}
                  </span>
                )}
              </div>
            </div>

            {/* Signals */}
            {result.signals.length > 0 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                  <ShieldAlert className="h-4 w-4 text-brand-600" />
                  Findings
                </h2>
                <ul className="space-y-3">
                  {result.signals.map((signal, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                      <span
                        className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          signal.severity === "high"
                            ? "bg-red-500"
                            : signal.severity === "medium"
                              ? "bg-amber-500"
                              : "bg-slate-300"
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

            <p className="rounded-2xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-500">
              <Info className="mr-1 inline h-3.5 w-3.5 text-brand-500" />
              This analysis reflects technical and registration signals — it
              cannot determine whether the content itself is true. Always verify
              claims with professional fact-checkers and primary sources.{" "}
              {result.finalUrl !== result.url && (
                <span>
                  Note: the URL redirected from <span className="font-semibold">{result.url}</span>.
                </span>
              )}
              {result.domainAnalysis.isNewDomain && (
                <span>
                  {" "}
                  <a
                    href={`https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(result.url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700"
                  >
                    Check Google Safe Browsing <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              )}
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-xs text-brand-800">
          <Image className="h-4 w-4 shrink-0" />
          Looking for image/video/audio authenticity instead? Use the{" "}
          <Link href="/analyze" className="font-bold underline">Media Analyzer</Link>.
        </div>
      </main>
    </div>
  );
}
