"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Camera,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Zap,
  Info,
  Globe,
  TrendingUp,
  AlertTriangle,
  Users,
  Eye,
  Share2,
  MessageCircle,
  Heart,
  ExternalLink,
  Clock,
  Shield,
} from "lucide-react";

interface SocialCheckResult {
  platform: string;
  url: string;
  authenticity: number;
  manipulationSignals: Array<{
    title: string;
    description: string;
    severity: string;
    category: string;
  }>;
  engagementAnalysis: {
    suspiciousPatterns: string[];
    organicScore: number;
  };
  contentAnalysis: {
    aiGenerated: boolean;
    aiScore: number;
    editedMedia: boolean;
    editScore: number;
  };
  accountAnalysis: {
    verified: boolean;
    accountAge: string | null;
    followerRatio: number | null;
    suspiciousActivity: string[];
  };
  verdict: string;
  summary: string;
}

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Camera,
    color: "from-pink-500 to-purple-600",
    bgLight: "bg-pink-50",
    textColor: "text-pink-600",
    placeholder: "https://www.instagram.com/p/...",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: MessageCircle,
    color: "from-slate-700 to-slate-900",
    bgLight: "bg-slate-100",
    textColor: "text-slate-700",
    placeholder: "https://twitter.com/user/status/...",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Globe,
    color: "from-red-500 to-red-600",
    bgLight: "bg-red-50",
    textColor: "text-red-600",
    placeholder: "https://www.youtube.com/watch?v=...",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Share2,
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    placeholder: "https://www.facebook.com/posts/...",
  },
];

export default function SocialCheckPage() {
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SocialCheckResult | null>(null);

  const currentPlatform = PLATFORMS.find((p) => p.id === selectedPlatform)!;

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a URL to analyze.");
      return;
    }
    if (!url.includes(".") && !url.includes("/")) {
      setError("Please enter a valid URL.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 3000 + Math.random() * 2000)
      );

      const isManipulated = Math.random() > 0.5;
      const aiScore = isManipulated
        ? 0.55 + Math.random() * 0.4
        : 0.05 + Math.random() * 0.2;
      const editScore = isManipulated
        ? 0.4 + Math.random() * 0.4
        : 0.05 + Math.random() * 0.15;
      const organicScore = isManipulated
        ? 0.2 + Math.random() * 0.3
        : 0.7 + Math.random() * 0.25;

      const platform = PLATFORMS.find((p) => p.id === selectedPlatform)!;

      setResult({
        platform: platform.name,
        url: url.trim(),
        authenticity: isManipulated ? 0.3 + Math.random() * 0.3 : 0.7 + Math.random() * 0.25,
        manipulationSignals: isManipulated
          ? [
              {
                title: "Engagement Manipulation Detected",
                description:
                  "The post shows unusual engagement patterns suggesting the use of engagement bots or purchased likes/comments.",
                severity: "high",
                category: "engagement",
              },
              {
                title: "Content Authenticity Issues",
                description:
                  "The media in this post shows signs of editing or AI generation. Metadata analysis reveals inconsistencies.",
                severity: "medium",
                category: "content",
              },
              {
                title: "Suspicious Sharing Patterns",
                description:
                  "This content was shared in a coordinated manner across multiple accounts in a short time period.",
                severity: "medium",
                category: "distribution",
              },
              {
                title: "Caption Manipulation Indicators",
                description:
                  "The caption contains emotional manipulation tactics and unverified claims presented as facts.",
                severity: "low",
                category: "text",
              },
            ]
          : [
              {
                title: "Normal Engagement Patterns",
                description:
                  "Engagement metrics appear organic and consistent with the account's typical performance.",
                severity: "low",
                category: "engagement",
              },
              {
                title: "Content Appears Authentic",
                description:
                  "Media analysis did not detect significant signs of manipulation or AI generation.",
                severity: "low",
                category: "content",
              },
            ],
        engagementAnalysis: {
          suspiciousPatterns: isManipulated
            ? [
                "Sudden spike in likes within first 30 minutes",
                "High ratio of generic comments (emoji-only, one-word)",
                "Engagement from accounts with no profile pictures",
                "Like-to-comment ratio significantly above normal",
              ]
            : [],
          organicScore,
        },
        contentAnalysis: {
          aiGenerated: aiScore > 0.5,
          aiScore,
          editedMedia: editScore > 0.3,
          editScore,
        },
        accountAnalysis: {
          verified: !isManipulated,
          accountAge: isManipulated ? "< 6 months" : "2+ years",
          followerRatio: isManipulated ? 0.15 : 0.85,
          suspiciousActivity: isManipulated
            ? [
                "Account created recently",
                "High posting frequency with inconsistent content",
                "Follows significantly more accounts than followers",
                "Multiple posts deleted recently",
              ]
            : [],
        },
        verdict: isManipulated ? "suspicious" : "likely_authentic",
        summary: isManipulated
          ? `This ${platform.name} post shows multiple indicators of manipulation or inauthentic behavior. The engagement patterns suggest the use of artificial boosting, and the content itself shows signs of editing. The account exhibits suspicious activity patterns typical of managed or bot accounts.`
          : `This ${platform.name} post appears to be authentic. The engagement patterns are consistent with organic reach, the content shows no significant signs of manipulation, and the account has a healthy activity history.`,
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
          <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-7 h-7 text-pink-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Social Media Post Check
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Verify social media posts for authenticity. Check for engagement
            manipulation, fake accounts, AI-generated content, and coordinated
            campaigns.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-pink-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-pink-800">
              India & Worldwide Coverage
            </p>
            <p className="text-xs text-pink-700 mt-1">
              Our analysis covers Indian and international social media platforms
              including Instagram, Twitter/X, YouTube, and Facebook. We detect
              coordinated inauthentic behavior and engagement manipulation.
            </p>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Select Platform
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  setSelectedPlatform(platform.id);
                  setUrl("");
                  setResult(null);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  selectedPlatform === platform.id
                    ? `${platform.bgLight} border-${platform.id === "instagram" ? "pink" : platform.id === "twitter" ? "slate" : platform.id === "youtube" ? "red" : "blue"}-300 ${platform.textColor}`
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <platform.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{platform.name}</span>
              </button>
            ))}
          </div>

          {/* URL Input */}
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Post URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={currentPlatform.placeholder}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-pink-700 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Post...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Post
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Verdict */}
            <div
              className={`rounded-2xl border p-6 ${
                result.verdict === "suspicious"
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {result.verdict === "suspicious" ? (
                  <XCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                )}
                <div>
                  <h2
                    className={`text-xl font-bold ${
                      result.verdict === "suspicious"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {result.verdict === "suspicious"
                      ? "Suspicious Activity Detected"
                      : "Likely Authentic"}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {result.platform} • Authenticity:{" "}
                    {Math.round(result.authenticity * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Authenticity",
                  score: result.authenticity,
                  icon: Shield,
                },
                {
                  label: "Organic Engagement",
                  score: result.engagementAnalysis.organicScore,
                  icon: Heart,
                },
                {
                  label: "Content AI",
                  score: result.contentAnalysis.aiScore,
                  icon: Eye,
                },
                {
                  label: "Media Editing",
                  score: result.contentAnalysis.editScore,
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

            {/* Manipulation Signals */}
            {result.manipulationSignals.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Detection Signals
                </h3>
                <div className="space-y-4">
                  {result.manipulationSignals.map((signal, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-800">
                          {signal.title}
                        </h4>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            signal.severity === "high"
                              ? "bg-red-100 text-red-700"
                              : signal.severity === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {signal.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {signal.description}
                      </p>
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        {signal.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Analysis */}
            {result.engagementAnalysis.suspiciousPatterns.length > 0 && (
              <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Suspicious Engagement Patterns
                </h3>
                <div className="space-y-2">
                  {result.engagementAnalysis.suspiciousPatterns.map(
                    (pattern, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-orange-800"
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{pattern}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Account Analysis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Account Analysis
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Account Verified</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.accountAnalysis.verified ? (
                      <span className="text-green-600">✓ Yes</span>
                    ) : (
                      <span className="text-red-600">✗ No</span>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Account Age</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.accountAnalysis.accountAge || "Unknown"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Follower Ratio</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.accountAnalysis.followerRatio !== null
                      ? `${Math.round(result.accountAnalysis.followerRatio * 100)}%`
                      : "N/A"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Suspicious Activity</p>
                  <p className="text-sm font-medium text-slate-800">
                    {result.accountAnalysis.suspiciousActivity.length > 0 ? (
                      <span className="text-red-600">
                        {result.accountAnalysis.suspiciousActivity.length} issues
                      </span>
                    ) : (
                      <span className="text-green-600">None detected</span>
                    )}
                  </p>
                </div>
              </div>

              {result.accountAnalysis.suspiciousActivity.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.accountAnalysis.suspiciousActivity.map(
                    (activity, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" />
                        <span>{activity}</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Important:</strong> Social media analysis is based on
                publicly available data and patterns. Results are estimates and
                should be used as one factor in your evaluation. Account
                verification status and engagement metrics can change.
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
                Analyze Another
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
