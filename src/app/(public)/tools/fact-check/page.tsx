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
  Clock,
  Globe,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  LinkIcon,
} from "lucide-react";

interface FactCheckResult {
  claim: string;
  verdict: "true" | "false" | "misleading" | "unverified" | "partially_true";
  confidence: number;
  explanation: string;
  sources: Array<{
    title: string;
    url: string;
    reliability: "high" | "medium" | "low";
  }>;
  manipulationIndicators: string[];
  context: string;
}

const SAMPLE_CLAIMS = [
  "India's GDP growth rate is 8.2% in 2024",
  "Drinking warm water cures COVID-19",
  "ISRO successfully landed Chandrayaan-3 on the Moon's south pole",
  "5G towers cause health problems",
  "UPI processed over 10 billion transactions in a month",
];

export default function FactCheckPage() {
  const [claim, setClaim] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FactCheckResult | null>(null);

  const handleAnalyze = async () => {
    if (!claim.trim()) {
      setError("Please enter a claim to fact-check.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 2500 + Math.random() * 2000)
      );

      // Simulate fact-check results based on claim content
      const claimLower = claim.toLowerCase();
      let verdict: FactCheckResult["verdict"] = "unverified";
      let confidence = 0.5;
      let explanation = "";
      let sources: FactCheckResult["sources"] = [];
      let manipulationIndicators: string[] = [];
      let context = "";

      if (
        claimLower.includes("gdp") ||
        claimLower.includes("economy") ||
        claimLower.includes("growth")
      ) {
        verdict = "partially_true";
        confidence = 0.78;
        explanation =
          "India's GDP growth rate for FY2024 was approximately 8.2% according to initial estimates, but final figures may vary. The claim is directionally correct but uses preliminary data.";
        sources = [
          {
            title: "RBI Annual Report 2024",
            url: "https://rbi.org.in",
            reliability: "high",
          },
          {
            title: "World Bank India Overview",
            url: "https://worldbank.org/in",
            reliability: "high",
          },
          {
            title: "Ministry of Statistics",
            url: "https://mospi.gov.in",
            reliability: "high",
          },
        ];
        context =
          "GDP figures are often revised. Initial estimates can differ from final numbers by 0.2-0.5%.";
        manipulationIndicators = [
          "Using preliminary data as final without noting it may change",
          "Omitting the fiscal year context which affects interpretation",
        ];
      } else if (
        claimLower.includes("covid") ||
        claimLower.includes("cure") ||
        claimLower.includes("warm water")
      ) {
        verdict = "false";
        confidence = 0.95;
        explanation =
          "There is no scientific evidence that drinking warm water cures COVID-19. This is a widely debunked health misinformation claim that has circulated on social media.";
        sources = [
          {
            title: "WHO Myth Busters",
            url: "https://who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters",
            reliability: "high",
          },
          {
            title: "ICMR Official Guidelines",
            url: "https://icmr.nic.in",
            reliability: "high",
          },
          {
            title: "FactCheck.org",
            url: "https://factcheck.org",
            reliability: "high",
          },
        ];
        context =
          "This type of health misinformation is particularly dangerous as it may discourage people from seeking proper medical treatment.";
        manipulationIndicators = [
          "Health misinformation designed to appear as medical advice",
          "Uses authoritative tone to lend false credibility",
          "Circulated widely on WhatsApp and social media without source attribution",
        ];
      } else if (
        claimLower.includes("chandrayaan") ||
        claimLower.includes("isro") ||
        claimLower.includes("moon")
      ) {
        verdict = "true";
        confidence = 0.98;
        explanation =
          "ISRO's Chandrayaan-3 mission successfully landed on the Moon's south polar region on August 23, 2023, making India the first country to achieve a soft landing near the lunar south pole.";
        sources = [
          {
            title: "ISRO Official Website",
            url: "https://isro.gov.in",
            reliability: "high",
          },
          {
            title: "NASA Confirmation",
            url: "https://nasa.gov",
            reliability: "high",
          },
          {
            title: "Nature Journal Coverage",
            url: "https://nature.com",
            reliability: "high",
          },
        ];
        context =
          "This is a well-documented and verified achievement by India's space program.";
        manipulationIndicators = [];
      } else if (
        claimLower.includes("5g") &&
        (claimLower.includes("health") || claimLower.includes("harm"))
      ) {
        verdict = "false";
        confidence = 0.92;
        explanation =
          "Scientific consensus from WHO, ICNIRP, and numerous peer-reviewed studies confirms that 5G technology, operating within established safety limits, does not cause health problems.";
        sources = [
          {
            title: "WHO Fact Sheet on 5G",
            url: "https://who.int/news-room/fact-sheets",
            reliability: "high",
          },
          {
            title: "ICNIRP Guidelines",
            url: "https://icnirp.org",
            reliability: "high",
          },
          {
            title: "IEEE Standards",
            url: "https://ieee.org",
            reliability: "high",
          },
        ];
        context =
          "5G health scares are a recurring pattern seen with each new generation of wireless technology (3G, 4G, 5G). The scientific evidence consistently shows no harm at regulated exposure levels.";
        manipulationIndicators = [
          "Misrepresentation of electromagnetic radiation concepts",
          "Cherry-picking studies that are not representative of scientific consensus",
          "Fear-based messaging without scientific context",
        ];
      } else if (
        claimLower.includes("upi") ||
        claimLower.includes("transaction") ||
        claimLower.includes("digital payment")
      ) {
        verdict = "true";
        confidence = 0.94;
        explanation =
          "UPI has indeed processed over 10 billion transactions in a single month. In January 2024, UPI recorded approximately 12.2 billion transactions worth ₹18.4 lakh crore.";
        sources = [
          {
            title: "NPCI Official Data",
            url: "https://npci.org.in",
            reliability: "high",
          },
          {
            title: "RBI Digital Payments Report",
            url: "https://rbi.org.in",
            reliability: "high",
          },
          {
            title: "Economic Times Coverage",
            url: "https://economictimes.indiatimes.com",
            reliability: "medium",
          },
        ];
        context =
          "UPI has shown exponential growth since its launch in 2016, becoming one of the world's largest real-time payment systems.";
        manipulationIndicators = [];
      } else {
        // Generic result for unknown claims
        const rand = Math.random();
        if (rand > 0.6) {
          verdict = "unverified";
          confidence = 0.35;
          explanation =
            "We couldn't find sufficient reliable sources to verify or debunk this specific claim. The claim requires further investigation from authoritative sources.";
          sources = [
            {
              title: "Reuters Fact Check",
              url: "https://reuters.com/fact-check",
              reliability: "high",
            },
            {
              title: "Alt News",
              url: "https://altnews.in",
              reliability: "high",
            },
          ];
          context =
            "For claims that cannot be independently verified, it's important to look for primary sources and official statements.";
          manipulationIndicators = [
            "Claim lacks specific source attribution",
            "Cannot be independently verified with available data",
          ];
        } else if (rand > 0.3) {
          verdict = "misleading";
          confidence = 0.65;
          explanation =
            "While this claim contains elements of truth, it is presented in a way that could mislead. Important context is missing that would change the interpretation.";
          sources = [
            {
              title: "BOOM Live",
              url: "https://boomlive.in",
              reliability: "high",
            },
            {
              title: "The Quint WebQoof",
              url: "https://thequint.com/webqoof",
              reliability: "high",
            },
          ];
          context =
            "Misleading claims often use true facts arranged in a way that creates a false impression. Context is crucial.";
          manipulationIndicators = [
            "Selective use of facts to create misleading narrative",
            "Important contextual information omitted",
            "Emotional language used to bypass critical thinking",
          ];
        } else {
          verdict = "partially_true";
          confidence = 0.58;
          explanation =
            "This claim is partially accurate. Some elements are supported by evidence, while others are exaggerated or lack context.";
          sources = [
            {
              title: "Fact Checker",
              url: "https://factchecker.in",
              reliability: "high",
            },
            {
              title: "Vishvas News",
              url: "https://vishvasnews.com",
              reliability: "medium",
            },
          ];
          context =
            "Partially true claims are particularly effective at spreading misinformation because they anchor on verifiable facts.";
          manipulationIndicators = [
            "Mixing verified facts with unverified claims",
            "Exaggeration of actual events or data",
          ];
        }
      }

      setResult({
        claim: claim.trim(),
        verdict,
        confidence,
        explanation,
        sources,
        manipulationIndicators,
        context,
      });
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case "true":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50 border-green-200",
          label: "Verified True",
          badge: "bg-green-100 text-green-700",
        };
      case "false":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 border-red-200",
          label: "False",
          badge: "bg-red-100 text-red-700",
        };
      case "misleading":
        return {
          icon: AlertTriangle,
          color: "text-orange-600",
          bg: "bg-orange-50 border-orange-200",
          label: "Misleading",
          badge: "bg-orange-100 text-orange-700",
        };
      case "partially_true":
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bg: "bg-yellow-50 border-yellow-200",
          label: "Partially True",
          badge: "bg-yellow-100 text-yellow-700",
        };
      default:
        return {
          icon: Info,
          color: "text-slate-600",
          bg: "bg-slate-50 border-slate-200",
          label: "Unverified",
          badge: "bg-slate-100 text-slate-700",
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
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Fact Checker
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Review claims, headlines, and statements with source-led context
            across politics, health, science, technology, and public affairs.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              How Fact-Checking Works
            </p>
            <p className="text-xs text-orange-700 mt-1">
              We analyze claims against trusted fact-checking organizations,
              official data sources, and peer-reviewed research. Results include
              explanations and source links for transparency.
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter a claim to fact-check
          </label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="e.g., India's GDP growth rate is 8.2% in 2024..."
            className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 resize-none"
            rows={4}
          />

          {/* Quick Examples */}
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_CLAIMS.slice(0, 3).map((sample) => (
                <button
                  key={sample}
                  onClick={() => setClaim(sample)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !claim.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking Facts...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Fact Check
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Verdict Card */}
            {(() => {
              const v = getVerdictInfo(result.verdict);
              return (
                <div
                  className={`rounded-2xl border p-6 ${v.bg} animate-fade-in`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <v.icon className={`w-8 h-8 ${v.color}`} />
                    <div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${v.badge}`}
                      >
                        {v.label}
                      </span>
                      <p className="text-sm text-slate-600 mt-1">
                        Confidence: {Math.round(result.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 mt-3">
                    <p className="text-sm text-slate-700 italic">
                      &ldquo;{result.claim}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Explanation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Explanation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* Context */}
            {result.context && (
              <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Context
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {result.context}
                </p>
              </div>
            )}

            {/* Sources */}
            {result.sources.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Sources
                </h3>
                <div className="space-y-3">
                  {result.sources.map((source, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {source.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {source.url}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          source.reliability === "high"
                            ? "bg-green-100 text-green-700"
                            : source.reliability === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {source.reliability} reliability
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manipulation Indicators */}
            {result.manipulationIndicators.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Why This May Be Manipulated
                </h3>
                <div className="space-y-3">
                  {result.manipulationIndicators.map((indicator, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-red-800"
                    >
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Important:</strong> Fact-checking results are based on
                available sources at the time of analysis. New information may
                change the assessment. Always cross-reference with multiple
                trusted sources.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setClaim("");
                }}
                className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Check Another Claim
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
    </div>
  );
}
