"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalysisChart from "@/components/advanced/AnalysisChart";
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const [selectedMetric, setSelectedMetric] = useState<string>("all");

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

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

    const mockHistory: AnalysisHistory[] = Array.from({ length: 20 }, (_, i) => {
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
    setIsLoading(false);
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-slate-500">
              Track your content verification activities and insights
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
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

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
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
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

        {/* Source Analysis */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <AnalysisChart
              data={sourceData}
              title="Top Sources Analyzed"
              type="line"
              height={200}
            />
          </div>

          {/* Top Threats */}
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

        {/* Recent Analyses Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Recent Analyses
              </h3>
              <div className="flex items-center gap-2">
                {["all", "image", "video", "audio", "fact", "social"].map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedMetric(filter)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        selectedMetric === filter
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Verdict
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history
                  .filter(
                    (h) => selectedMetric === "all" || h.type === selectedMetric
                  )
                  .slice(0, 10)
                  .map((item) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}
                          >
                            <TypeIcon className="w-4 h-4" />
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">
                            {item.filename}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerdictColor(item.verdict)}`}
                          >
                            {getVerdictLabel(item.verdict)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  item.score > 70
                                    ? "bg-green-500"
                                    : item.score > 40
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">
                              {item.score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">{getStatusIcon(item.status)}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/result/${item.id}`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "New Image Check",
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
              title: "Social Check",
              icon: Globe,
              href: "/tools/social-check",
              color: "bg-pink-600 hover:bg-pink-700",
            },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-lg`}
            >
              <action.icon className="w-5 h-5" />
              <span className="font-medium">{action.title}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
