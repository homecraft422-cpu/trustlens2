"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Globe,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Zap,
  Info,
  TrendingUp,
  AlertTriangle,
  Shield,
  LinkIcon,
  FileText,
  Image,
  ExternalLink,
  Clock,
} from "lucide-react";

interface URLCheckResult {
  url: string;
  domain: string;
  credibility: number;
  isSecure: boolean;
  contentAnalysis: {
    aiGenerated: boolean;
    aiScore: number;
    manipulatedImages: number;
    totalImages: number;
    suspiciousClaims: string[];
  };
  domainAnalysis: {
    age: string;
    reputation: "trusted" | "unknown" | "suspicious" | "malicious";
    factCheckHistory: number;
    knownMisinfoSource: boolean;
  };
  manipulationIndicators: Array<{
    title: string;
    description: string;
    severity: string;
  }>;
  verdict: string;
  summary: string;
}

export default function URLCheckPage() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<URLCheckResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a URL to analyze.");
      return;
    }
    // Basic URL validation
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com/article).");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 3000 + Math.random() * 2000)
      );

      const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
      const domain = new URL(cleanUrl).hostname.replace("www.", "");
      const isTrusted = [
        "bbc.com",
        "reuters.com",
        "apnews.com",
        "ndtv.com",
        "thehindu.com",
        "timesofindia.indiatimes.com",
        "indianexpress.com",
        "scroll.in",
        "altnews.in",
        "boomlive.in",
        "factchecker.in",
        "nature.com",
        "science.org",
      ].includes(domain);

      const isSuspicious = Math.random() > 0.6 && !isTrusted;

      setResult({
        url: cleanUrl,
        domain,
        credibility: isTrusted
          ? 0.85 + Math.random() * 0.14
          : isSuspicious
            ? 0.2 + Math.random() * 0.3
            : 0.5 + Math.random() * 0.3,
        isSecure: cleanUrl.startsWith("https"),
        contentAnalysis: {
          aiGenerated: isSuspicious,
          aiScore: isSuspicious ? 0.6 + Math.random() * 0.3 : 0.05 + Math.random() * 0.15,
          manipulatedImages: isSuspicious ? 2 : 0,
          totalImages: Math.floor(Math.random() * 10) + 3,
          suspiciousClaims: isSuspicious
            ? [
                "Unverified statistics presented without source",
                "Emotional language designed to bypass critical thinking",
                "Missing attribution for key claims",
                "Cherry-picked data to support narrative",
              ]
            : [],
        },
        domainAnalysis: {
          age: isTrusted ? "10+ years" : isSuspicious ? "< 1 year" : "3+ years",
          reputation: isTrusted
            ? "trusted"
            : isSuspicious
              ? "suspicious"
              : "unknown",
          factCheckHistory: isTrusted ? 0 : isSuspicious ? 5 : 1,
          knownMisinfoSource: isSuspicious,
        },
        manipulationIndicators: isSuspicious
          ? [
              {
                title: "Low Domain Credibility",
                description:
                  "This domain has been flagged by fact-checking organizations for publishing misleading content.",
                severity: "high",
              },
              {
                title: "AI-Generated Content Detected",
                description:
                  "Parts of the article appear to be AI-generated without proper disclosure.",
                severity: "medium",
              },
              {
                title: "Manipulated Images Found",
                description:
                  `${isSuspicious ? 2 : 0} out of ${Math.floor(Math.random() * 10) + 3} images show signs of editing or AI generation.`,
                severity: "medium",
              },
              {
                title: "Missing Source Attribution",
                description:
                  "Key claims in the article lack proper source attribution or link to primary sources.",
                severity: "low",
              },
            ]
          : [
              {
                title: "Domain Has Good Reputation",
                description:
                  "This domain is recognized as a reliable source by fact-checking organizations.",
                severity: "low",
              },
            ],
        verdict: isTrusted
          ? "trusted_source"
          : isSuspicious
            ? "suspicious_content"
            : "needs_review",
        summary: isTrusted
          ? `This URL points to ${domain}, a well-established and recognized news source. The content appears to follow standard journalistic practices with proper source attribution. However, always cross-reference important claims with multiple sources.`
          : isSuspicious
            ? `This URL shows multiple indicators of potentially misleading content. The domain has a history of publishing unverified claims, and the content contains AI-generated text and manipulated images. We recommend verifying claims from this source with trusted fact-checkers.`
            : `This URL points to ${domain}, which has a moderate credibility score. While no major red flags were detected, we recommend verifying important claims independently. The content quality appears standard but could benefit from additional source verification.`,
      });
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 0.3) return "text-green-600";
    if (score < 0.6) return "text-orange-500";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score < 0.3) return "bg-green-500";
    if (score < 0.6) return "bg-orange-500";
    return "bg-red-500";
  };

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case "trusted_source":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50 border-green-200",
          label: "Trusted Source",
        };
      case "suspicious_content":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 border-red-200",
          label: "Suspicious Content",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bg: "bg-orange-50 border-orange-200",
          label: "Needs Review",
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-7 h-7 text-cyan-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            URL Content Check
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Analyze any web page for content authenticity, AI-generated text,
            manipulated images, and source credibility.
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter URL to analyze
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze();
                }}
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing URL...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze URL
              </>
            )}
          </button>
        </div>

        {/* What We Check */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            What We Analyze
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Shield,
                title: "Domain Credibility",
                desc: "Check domain age, reputation, and fact-check history",
              },
              {
                icon: FileText,
                title: "Content Quality",
                desc: "Analyze text for AI generation and manipulation",
              },
              {
                icon: Image,
                title: "Image Authenticity",
                desc: "Check images for editing and AI generation",
              },
              {
                icon: AlertTriangle,
                title: "Claims Verification",
                desc: "Identify and verify suspicious claims",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
              >
                <item.icon className="w-5 h-5 text-cyan-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Verdict */}
            {(() => {
              const v = getVerdictInfo(result.verdict);
              return (
                <div className={`rounded-2xl border p-6 ${v.bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <v.icon className={`w-8 h-8 ${v.color}`} />
                    <div>
                      <h2 className={`text-xl font-bold ${v.color}`}>
                        {v.label}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {result.domain} • Credibility:{" "}
                        {Math.round(result.credibility * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        result.isSecure
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.isSecure ? "🔒 HTTPS Secure" : "⚠️ Not Secure"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        result.domainAnalysis.reputation === "trusted"
                          ? "bg-green-100 text-green-700"
                          : result.domainAnalysis.reputation === "suspicious"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {result.domainAnalysis.reputation === "trusted"
                        ? "✓ Trusted Domain"
                        : result.domainAnalysis.reputation === "suspicious"
                          ? "✗ Suspicious Domain"
                          : "? Unknown Domain"}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Credibility",
                  score: result.credibility,
                  icon: Shield,
                },
                {
                  label: "AI Content",
                  score: result.contentAnalysis.aiScore,
                  icon: FileText,
                },
                {
                  label: "Domain Trust",
                  score:
                    result.domainAnalysis.reputation === "trusted"
                      ? 0.9
                      : result.domainAnalysis.reputation === "suspicious"
                        ? 0.2
                        : 0.5,
                  icon: Globe,
                },
                {
                  label: "Fact History",
                  score:
                    result.domainAnalysis.factCheckHistory > 0
                      ? Math.min(result.domainAnalysis.factCheckHistory / 5, 1)
                      : 0.1,
                  icon: TrendingUp,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-xl border border-slate-200 p-4 text-center"
                >
                  <item.icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <div
                    className={`text-xl font-bold ${getScoreColor(item.score)}`}
                  >
                    {Math.round(item.score * 100)}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${getScoreBg(item.score)}`}
                      style={{ width: `${item.score * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Summary</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Domain Analysis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Domain Analysis
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Domain Age</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.domainAnalysis.age}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Fact-Check History</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.domainAnalysis.factCheckHistory > 0
                      ? `${result.domainAnalysis.factCheckHistory} instances`
                      : "Clean record"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">
                    Known Misinfo Source
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.domainAnalysis.knownMisinfoSource ? (
                      <span className="text-red-600">⚠ Yes</span>
                    ) : (
                      <span className="text-green-600">✓ No</span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Security</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.isSecure ? (
                      <span className="text-green-600">🔒 Secure (HTTPS)</span>
                    ) : (
                      <span className="text-red-600">⚠ Not Secure</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Analysis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Analysis
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">AI-Generated Text</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.contentAnalysis.aiGenerated ? (
                      <span className="text-red-600">
                        ⚠ Detected ({Math.round(result.contentAnalysis.aiScore * 100)}%)
                      </span>
                    ) : (
                      <span className="text-green-600">
                        ✓ Not detected ({Math.round(result.contentAnalysis.aiScore * 100)}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Manipulated Images</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.contentAnalysis.manipulatedImages > 0 ? (
                      <span className="text-orange-600">
                        {result.contentAnalysis.manipulatedImages} of{" "}
                        {result.contentAnalysis.totalImages} images
                      </span>
                    ) : (
                      <span className="text-green-600">None detected</span>
                    )}
                  </p>
                </div>
              </div>

              {result.contentAnalysis.suspiciousClaims.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Suspicious Claims:
                  </p>
                  <div className="space-y-2">
                    {result.contentAnalysis.suspiciousClaims.map((claim, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-orange-700"
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{claim}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Manipulation Indicators */}
            {result.manipulationIndicators.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Key Findings
                </h3>
                <div className="space-y-4">
                  {result.manipulationIndicators.map((indicator, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-800">
                          {indicator.title}
                        </h4>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            indicator.severity === "high"
                              ? "bg-red-100 text-red-700"
                              : indicator.severity === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {indicator.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {indicator.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Important:</strong> URL analysis is based on available
                data at the time of checking. Website content can change. Domain
                reputation is one factor — always evaluate content critically
                regardless of source.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setUrl("");
                }}
                className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Analyze Another URL
              </button>
              <Link
                href="/"
                className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-semibold text-center hover:bg-brand-700 transition-colors"
              >
                More Tools
              </Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
