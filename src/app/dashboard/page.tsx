"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalysisChart from "@/components/advanced/AnalysisChart";
import UsageMeter, { type QuotaItem } from "@/components/UsageMeter";
import {
  Shield,
  BarChart3,
  TrendingUp,
  Users,
  Image,
  Video,
  Music,
  MessageSquare,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Globe,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";

interface DashboardStats {
  totalAnalyses: number;
  todayAnalyses: number;
  fakeDetected: number;
  authenticFound: number;
  avgConfidence: number;
  topThreats: Array<{ name: string; count: number; trend: "up" | "down" }>;
}

interface AnalysisHistory {
  id: string;
  type: "image" | "video" | "audio" | "fact" | "social";
  filename: string;
  verdict: string;
  score: number;
  timestamp: string;
  status: "completed" | "processing" | "failed";
}

interface UserUsage {
  isAuthenticated: boolean;
  limits: {
    image: QuotaItem;
    video: QuotaItem;
    audio: QuotaItem;
  };
  resetDate: string;
  monthName: string;
  plan?: {
    id: string;
    name: string;
    isPaid: boolean;
    renewsAt: string | null;
    billingCycle: string | null;
  };
  creditsBalance?: number;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("trustlens_guest_id") || "";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const [selectedMetric, setSelectedMetric] = useState<string>("all");

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      const guestId = getGuestId();
      const usagePromise = fetch(`/api/v1/usage?guestId=${encodeURIComponent(guestId)}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null);

      const [usageData] = await Promise.all([
        usagePromise,
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);

      if (usageData && usageData.limits) {
        setUserUsage(usageData);
      }

      setStats({
        totalAnalyses: 1247 + Math.floor(Math.random() * 200),
        todayAnalyses: 45 + Math.floor(Math.random() * 30),
        fakeDetected: 312 + Math.floor(Math.random() * 50),
        authenticFound: 935 + Math.floor(Math.random() * 100),
        avgConfidence: 78 + Math.floor(Math.random() * 15),
        topThreats: [
          { name: "Deepfake Videos", count: 89, trend: "up" },
          { name: "AI Generated Images", count: 156, trend: "up" },
          { name: "Voice Cloning", count: 34, trend: "down" },
          { name: "Manipulated Stats", count: 67, trend: "up" },
        ],
      });

      const mockHistory: AnalysisHistory[] = Array.from({ length: 15 }, (_, i) => {
        const types: AnalysisHistory["type"][] = ["image", "video", "audio", "fact", "social"];
        const verdicts = ["likely_authentic", "likely_ai_generated", "possibly_manipulated", "unverified"];
        const statuses: AnalysisHistory["status"][] = ["completed", "completed", "completed", "processing", "failed"];
        const filenames = [
          "photo_2024.jpg",
          "interview_clip.mp4",
          "speech_recording.mp3",
          "news_claim_text",
          "instagram_post_url",
          "twitter_thread",
          "youtube_video.mp4",
          "voice_message.ogg",
        ];

        return {
          id: `analysis_${i + 1}`,
          type: types[Math.floor(Math.random() * types.length)],
          filename: filenames[Math.floor(Math.random() * filenames.length)],
          verdict: verdicts[Math.floor(Math.random() * verdicts.length)],
          score: Math.floor(Math.random() * 100),
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)],
        };
      });

      setHistory(mockHistory);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return Image;
      case "video": return Video;
      case "audio": return Music;
      case "fact": return MessageSquare;
      case "social": return Globe;
      default: return Eye;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "image": return "bg-blue-100 text-blue-600";
      case "video": return "bg-purple-100 text-purple-600";
      case "audio": return "bg-green-100 text-green-600";
      case "fact": return "bg-orange-100 text-orange-600";
      case "social": return "bg-pink-100 text-pink-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "likely_authentic": return "text-green-600 bg-green-50";
      case "likely_ai_generated": return "text-red-600 bg-red-50";
      case "possibly_manipulated": return "text-orange-600 bg-orange-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case "likely_authentic": return "Authentic";
      case "likely_ai_generated": return "AI Generated";
      case "possibly_manipulated": return "Manipulated";
      default: return "Unverified";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "processing": return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const chartData = [
    { label: "Mon", value: 65, color: "#4c6ef5" },
    { label: "Tue", value: 78, color: "#4c6ef5" },
    { label: "Wed", value: 52, color: "#4c6ef5" },
    { label: "Thu", value: 89, color: "#4c6ef5" },
    { label: "Fri", value: 94, color: "#4c6ef5" },
    { label: "Sat", value: 72, color: "#4c6ef5" },
    { label: "Sun", value: 68, color: "#4c6ef5" },
  ];

  const threatData = [
    { label: "Deepfakes", value: 35, color: "#ef4444" },
    { label: "AI Images", value: 42, color: "#f59e0b" },
    { label: "Voice Clone", value: 15, color: "#8b5cf6" },
    { label: "Manipulation", value: 28, color: "#06b6d4" },
  ];

  const sourceData = [
    { label: "Instagram", value: 245 },
    { label: "Twitter", value: 189 },
    { label: "WhatsApp", value: 156 },
    { label: "YouTube", value: 134 },
    { label: "Facebook", value: 98 },
    { label: "Other", value: 78 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              Analytics Dashboard
            </h1>
            <p className="text-slate-500 text-sm">
              Overview of your verification quotas, activities, and global insights
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              {(["day", "week", "month"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? "bg-brand-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Quota Card */}
        {userUsage && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 mb-8 shadow-sm">
            <UsageMeter
              limits={userUsage.limits}
              isAuthenticated={userUsage.isAuthenticated}
              resetDate={userUsage.resetDate}
              monthName={userUsage.monthName}
              plan={userUsage.plan}
              creditsBalance={userUsage.creditsBalance || 0}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Total Analyses",
              value: stats?.totalAnalyses || 0,
              icon: BarChart3,
              trend: "+12.5%",
              trendUp: true,
              color: "text-blue-600 bg-blue-50",
            },
            {
              label: "Today",
              value: stats?.todayAnalyses || 0,
              icon: Calendar,
              trend: "+8.2%",
              trendUp: true,
              color: "text-green-600 bg-green-50",
            },
            {
              label: "Fake Detected",
              value: stats?.fakeDetected || 0,
              icon: XCircle,
              trend: "+5.1%",
              trendUp: true,
              color: "text-red-600 bg-red-50",
            },
            {
              label: "Authentic",
              value: stats?.authenticFound || 0,
              icon: CheckCircle2,
              trend: "+15.3%",
              trendUp: true,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              label: "Avg Confidence",
              value: `${stats?.avgConfidence || 0}%`,
              icon: TrendingUp,
              trend: "+2.1%",
              trendUp: true,
              color: "text-purple-600 bg-purple-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="w-4 h-4" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trendUp ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.trend}
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <AnalysisChart
            data={chartData}
            title="Analyses This Week"
            type="bar"
            height={220}
          />
          <AnalysisChart
            data={threatData}
            title="Threat Distribution"
            type="doughnut"
            height={220}
          />
        </div>

        {/* Source Analysis & Threats */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AnalysisChart
              data={sourceData}
              title="Top Sources Analyzed"
              type="line"
              height={200}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Top Threats
            </h3>
            <div className="space-y-4">
              {stats?.topThreats.map((threat, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        threat.trend === "up"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {threat.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {threat.count} detected
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      threat.trend === "up" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {threat.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {threat.trend === "up" ? "Increasing" : "Decreasing"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Check Image / Video",
              icon: Image,
              href: "/analyze",
              color: "bg-blue-600 hover:bg-blue-700",
            },
            {
              title: "Audio Analysis",
              icon: Music,
              href: "/tools/audio-check",
              color: "bg-green-600 hover:bg-green-700",
            },
            {
              title: "Fact Check",
              icon: MessageSquare,
              href: "/tools/fact-check",
              color: "bg-orange-600 hover:bg-orange-700",
            },
            {
              title: "My Reports",
              icon: Globe,
              href: "/reports",
              color: "bg-purple-600 hover:bg-purple-700",
            },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`${action.color} text-white rounded-2xl p-4 flex items-center gap-3 transition-all shadow-md`}
            >
              <action.icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{action.title}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
