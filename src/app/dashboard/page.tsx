"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Coins,
  FileSearch,
  Image,
  Info,
  LockKeyhole,
  Mail,
  Music,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  UserRound,
  Video,
  XCircle,
  Zap,
} from "lucide-react";

type RangeKey = "7d" | "30d" | "90d";
type MediaType = "image" | "video" | "audio";

type Quota = { used: number; limit: number; remaining: number };

interface DashboardData {
  account: {
    id: string;
    name: string;
    email: string;
    initials: string;
    authProvider: string;
    accountType: string;
    memberSince: string;
  };
  range: RangeKey;
  period: { from: string; to: string; days: number };
  plan: {
    id: string;
    name: string;
    isPaid: boolean;
    renewsAt: string | null;
    billingCycle: string | null;
  };
  creditsBalance: number;
  usage: {
    monthName: string;
    resetDate: string;
    limits: Record<MediaType, Quota>;
    total: Quota;
    usedPercent: number;
  };
  summary: {
    allTimeAnalyses: number;
    periodAnalyses: number;
    completedReports: number;
    flagged: number;
    authentic: number;
    inconclusive: number;
    avgConfidence: number;
    avgAiScore: number;
    avgManipulationScore: number;
    completionRate: number;
    flaggedRate: number;
  };
  activity: Array<{ label: string; date: string; count: number }>;
  typeBreakdown: Record<MediaType, number>;
  verdictBreakdown: {
    likely_authentic: number;
    likely_ai_generated: number;
    possibly_manipulated: number;
    unverified: number;
    insufficient_evidence: number;
  };
  statusBreakdown: { completed: number; processing: number; failed: number };
  confidenceBuckets: { high: number; medium: number; low: number };
  recent: Array<{
    id: string;
    status: string;
    createdAt: string;
    filename: string;
    mediaType: MediaType;
    verdict: string | null;
    confidence: number | null;
    publicId: string | null;
  }>;
  insights: {
    mostUsedType: MediaType | null;
    mostUsedTypeCount: number;
    busiestLabel: string | null;
    busiestCount: number;
  };
  isMockMode: boolean;
  generatedAt: string;
}

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const MEDIA_META: Record<MediaType, { label: string; short: string; color: string; icon: typeof Image }> = {
  image: { label: "Image analyses", short: "Images", color: "#2563eb", icon: Image },
  video: { label: "Video analyses", short: "Videos", color: "#7c3aed", icon: Video },
  audio: { label: "Audio analyses", short: "Audio", color: "#059669", icon: Music },
};

const VERDICT_META: Record<string, { label: string; color: string; className: string }> = {
  likely_authentic: {
    label: "Likely authentic",
    color: "#10b981",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  likely_ai_generated: {
    label: "Likely AI-generated",
    color: "#ef4444",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  possibly_manipulated: {
    label: "Possibly manipulated",
    color: "#f59e0b",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  unverified: {
    label: "Unverified",
    color: "#64748b",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    color: "#94a3b8",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", options || { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value)
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-52 rounded-3xl bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-80 rounded-3xl bg-slate-200 lg:col-span-2" />
          <div className="h-80 rounded-3xl bg-slate-200" />
        </div>
        <p className="mt-6 text-center text-sm font-medium text-slate-500">Loading your personal workspace…</p>
      </main>
    </div>
  );
}

function QuotaRing({ type, quota }: { type: MediaType; quota: Quota }) {
  const meta = MEDIA_META[type];
  const Icon = meta.icon;
  const percentage = quota.limit ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;
  const ringStyle = {
    background: `conic-gradient(${meta.color} ${percentage * 3.6}deg, #e2e8f0 0deg)`,
  } satisfies CSSProperties;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full" style={ringStyle}>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
          <Icon className="h-5 w-5" style={{ color: meta.color }} aria-hidden="true" />
          <span className="-mt-2 text-[11px] font-extrabold text-slate-700">{percentage}%</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{meta.short}</p>
        <p className="mt-1 text-xl font-extrabold text-slate-950">
          {quota.remaining} <span className="text-sm font-semibold text-slate-400">left</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{quota.used} of {quota.limit} used</p>
      </div>
    </div>
  );
}

function ActivityGraph({ data }: { data: DashboardData["activity"] }) {
  const width = 760;
  const height = 230;
  const paddingX = 34;
  const paddingTop = 20;
  const paddingBottom = 42;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;
  const maxValue = Math.max(1, ...data.map((point) => point.count));
  const points = data.map((point, index) => {
    const x = paddingX + (index * chartWidth) / Math.max(1, data.length - 1);
    const y = paddingTop + chartHeight - (point.count / maxValue) * chartHeight;
    return { ...point, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1].x},${paddingTop + chartHeight} L${points[0].x},${paddingTop + chartHeight} Z`
    : "";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-950">Your analysis activity</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Actual checks made from this signed-in account</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
          {data.reduce((sum, point) => sum + point.count, 0)} checks
        </span>
      </div>
      <div className="mt-5 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[230px] min-w-[640px] w-full"
          role="img"
          aria-label={`Analysis activity chart with ${data.reduce((sum, point) => sum + point.count, 0)} checks`}
        >
          <defs>
            <linearGradient id="activity-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c6ef5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4c6ef5" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((line) => {
            const y = paddingTop + (chartHeight * line) / 4;
            return (
              <line
                key={line}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 6"
              />
            );
          })}
          {areaPath && <path d={areaPath} fill="url(#activity-area)" />}
          {linePath && <path d={linePath} fill="none" stroke="#4c6ef5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((point, index) => (
            <g key={`${point.date}-${index}`}>
              <circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#4c6ef5" strokeWidth="3" />
              {point.count > 0 && (
                <text x={point.x} y={point.y - 12} textAnchor="middle" className="fill-slate-700 text-[11px] font-bold">
                  {point.count}
                </text>
              )}
              <text x={point.x} y={height - 13} textAnchor="middle" className="fill-slate-500 text-[10px]">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function VerdictDonut({ data }: { data: DashboardData["verdictBreakdown"] }) {
  const segments = Object.entries(data).map(([key, value]) => ({
    key,
    value,
    ...VERDICT_META[key],
  }));
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;
  const gradientStops = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = (cursor / Math.max(1, total)) * 100;
      cursor += segment.value;
      const end = (cursor / Math.max(1, total)) * 100;
      return `${segment.color} ${start}% ${end}%`;
    });
  const donutStyle = {
    background: total
      ? `conic-gradient(${gradientStops.join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)",
  } satisfies CSSProperties;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-extrabold text-slate-950">Verdict mix</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">Completed reports in the selected period</p>
      <div className="mt-6 flex items-center justify-center">
        <div className="relative grid h-44 w-44 place-items-center rounded-full" style={donutStyle}>
          <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-inner">
            <div>
              <p className="text-3xl font-black text-slate-950">{total}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reports</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-2.5">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate font-medium text-slate-600">{segment.label}</span>
            </div>
            <span className="font-extrabold text-slate-900">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </div>
  );
}

function SignedOutDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto flex max-w-5xl items-center justify-center px-4 py-20 sm:px-6">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-7 py-12 text-center text-white sm:px-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <LockKeyhole className="h-8 w-8 text-brand-300" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Your dashboard is personal</h1>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-300">
              Sign in with the email account you registered to see only your usage, analysis trends,
              confidence metrics, plan, and recent activity.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/login?redirect=%2Fdashboard" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-500">
                Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/signup?redirect=%2Fdashboard" className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15">
                Create free account
              </Link>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            {[
              [BarChart3, "Private analytics", "Real activity from your signed-in account—not platform-wide demo numbers."],
              [CircleGauge, "Personal quotas", "Image, video, and audio limits with monthly reset information."],
              [Shield, "Account separation", "Your dashboard is isolated from other users and from the Reports library."],
            ].map(([Icon, title, text]) => {
              const CardIcon = Icon as typeof BarChart3;
              return (
                <div key={String(title)} className="rounded-2xl bg-slate-50 p-5">
                  <CardIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                  <h2 className="mt-3 text-sm font-bold text-slate-900">{String(title)}</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{String(text)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch(`/api/v1/dashboard?range=${range}`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          if (active) setAuthRequired(true);
          return null;
        }
        if (!response.ok) throw new Error(payload.error || "Unable to load your dashboard.");
        return payload as DashboardData;
      })
      .then((payload) => {
        if (!active || !payload) return;
        setData(payload);
        setAuthRequired(false);
        setError("");
      })
      .catch((requestError) => {
        if (!active || requestError?.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load your dashboard.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [range, refreshKey]);

  const totalByType = useMemo(
    () => data ? Object.values(data.typeBreakdown).reduce((sum, value) => sum + value, 0) : 0,
    [data]
  );

  const handleRangeChange = (nextRange: RangeKey) => {
    if (nextRange === range) return;
    setLoading(true);
    setRange(nextRange);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
  };

  if (loading && !data && !authRequired) return <DashboardSkeleton />;
  if (authRequired) return <SignedOutDashboard />;

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto flex max-w-xl items-center justify-center px-4 py-24 text-center">
          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
            <XCircle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-extrabold text-slate-950">Dashboard could not load</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
            <button onClick={handleRefresh} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const memberSince = formatDate(data.account.memberSince, { month: "short", year: "numeric" });
  const periodLabel = `${data.period.days}-day view`;
  const confidenceTotal = Object.values(data.confidenceBuckets).reduce((sum, value) => sum + value, 0);
  const summaryCards = [
    {
      label: "All-time analyses",
      value: data.summary.allTimeAnalyses,
      helper: `${data.summary.periodAnalyses} in this period`,
      icon: BarChart3,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Needs review",
      value: data.summary.flagged,
      helper: `${data.summary.flaggedRate}% of completed reports`,
      icon: AlertTriangle,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Likely authentic",
      value: data.summary.authentic,
      helper: "Within the selected period",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Average confidence",
      value: `${data.summary.avgConfidence}%`,
      helper: data.summary.completedReports ? `${data.summary.completedReports} completed reports` : "No completed reports yet",
      icon: CircleGauge,
      tone: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-300/30 sm:px-8 sm:py-9">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-blue-700 text-lg font-black shadow-lg ring-1 ring-white/15 sm:h-16 sm:w-16 sm:text-xl">
                {data.account.initials || "TL"}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    <BadgeCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Signed in
                  </span>
                  {data.isMockMode && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-200">Demo detection mode</span>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
                  {greetingForNow()}, {firstName(data.account.name)}.
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate">{data.account.email}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" /> Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Plan</p>
                <p className="mt-1 font-extrabold text-white">{data.plan.name}</p>
                <p className="text-[11px] text-slate-400">{data.account.accountType}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Credits</p>
                <p className="mt-1 font-extrabold text-white">{data.creditsBalance}</p>
                <p className="text-[11px] text-slate-400">Pay-as-you-go</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Personal analytics</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Aggregated insights for {data.account.email}. Detailed files stay in My Reports.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Dashboard date range">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRangeChange(option.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${range === option.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                  aria-pressed={range === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800" role="status">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Showing the last loaded data. Refresh failed: {error}
          </div>
        )}

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard summary">
          {summaryCards.map(({ label, value, helper, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{periodLabel}</span>
              </div>
              <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
              <p className="mt-1 text-xs text-slate-500">{helper}</p>
            </div>
          ))}
        </section>

        {data.summary.allTimeAnalyses === 0 && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-r from-brand-50 to-blue-50 p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Your workspace is ready
                </span>
                <h2 className="mt-4 text-2xl font-extrabold text-slate-950">Run your first verification, {firstName(data.account.name)}.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Your charts use real activity from this account, so they start at zero instead of showing invented demo statistics.
                  Analyze an image, video, or audio file to build your personal dashboard.
                </p>
              </div>
              <Link href="/analyze" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700">
                <Zap className="h-4 w-4" aria-hidden="true" /> Start first analysis
              </Link>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-950">Monthly verification allowance</h2>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">{data.plan.name}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{data.usage.monthName} · resets {data.usage.resetDate}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Coins className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <strong className="text-slate-800">{data.usage.total.remaining}</strong> of {data.usage.total.limit} monthly checks remaining
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(Object.keys(MEDIA_META) as MediaType[]).map((type) => (
              <QuotaRing key={type} type={type} quota={data.usage.limits[type]} />
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
          <ActivityGraph data={data.activity} />
          <VerdictDonut data={data.verdictBreakdown} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-950">Formats you verify</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Personal mix for the selected period</p>
              </div>
              <FileSearch className="h-5 w-5 text-brand-600" aria-hidden="true" />
            </div>
            <div className="mt-7 space-y-6">
              {(Object.keys(MEDIA_META) as MediaType[]).map((type) => {
                const meta = MEDIA_META[type];
                const Icon = meta.icon;
                const count = data.typeBreakdown[type];
                const percentage = totalByType ? Math.round((count / totalByType) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden="true" />
                        <span className="text-sm font-bold text-slate-700">{meta.label}</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{count} · {percentage}%</span>
                    </div>
                    <ProgressBar value={percentage} color={meta.color} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-950">Analysis quality profile</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Confidence and risk signals—not certainty</p>
              </div>
              <CircleGauge className="h-5 w-5 text-purple-600" aria-hidden="true" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["Avg AI score", data.summary.avgAiScore, "#ef4444"],
                ["Manipulation", data.summary.avgManipulationScore, "#f59e0b"],
                ["Completion", data.summary.completionRate, "#10b981"],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="rounded-2xl bg-slate-50 p-3 text-center">
                  <p className="text-xl font-black text-slate-950">{Number(value)}%</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{String(label)}</p>
                  <div className="mt-3"><ProgressBar value={Number(value)} color={String(color)} /></div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Confidence distribution</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["High", data.confidenceBuckets.high, "bg-emerald-500"],
                  ["Medium", data.confidenceBuckets.medium, "bg-amber-500"],
                  ["Low", data.confidenceBuckets.low, "bg-slate-400"],
                ].map(([label, count, color]) => (
                  <div key={String(label)} className="rounded-xl border border-slate-200 p-3">
                    <div className={`h-1.5 rounded-full ${String(color)}`} style={{ width: `${confidenceTotal ? Math.max(10, (Number(count) / confidenceTotal) * 100) : 10}%` }} />
                    <p className="mt-2 text-lg font-black text-slate-900">{Number(count)}</p>
                    <p className="text-[11px] font-semibold text-slate-500">{String(label)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Scores summarize your reports. They do not measure truth or the reliability of the account holder.
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Personal insights">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><TrendingUp className="h-5 w-5" aria-hidden="true" /></div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Most used format</p>
            <p className="mt-1 text-lg font-extrabold capitalize text-slate-950">{data.insights.mostUsedType || "No activity yet"}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{data.insights.mostUsedTypeCount ? `${data.insights.mostUsedTypeCount} checks in this view` : "Run a check to unlock this insight"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-700"><Clock3 className="h-5 w-5" aria-hidden="true" /></div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Most active point</p>
            <p className="mt-1 text-lg font-extrabold text-slate-950">{data.insights.busiestLabel || "No pattern yet"}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{data.insights.busiestCount ? `${data.insights.busiestCount} analyses in that chart interval` : "More activity will reveal your pattern"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Activity className="h-5 w-5" aria-hidden="true" /></div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Monthly capacity</p>
            <p className="mt-1 text-lg font-extrabold text-slate-950">{100 - data.usage.usedPercent}% available</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Resets {data.usage.resetDate}; paid credits remain separate</p>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">Recent activity snapshot</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Only the latest five items appear here; use My Reports for search and full history.</p>
            </div>
            <Link href="/reports" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800">
              Open My Reports <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {data.recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileSearch className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-slate-700">No saved reports yet</p>
              <p className="mt-1 text-xs text-slate-500">Completed analyses will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent.map((item) => {
                const meta = MEDIA_META[item.mediaType];
                const Icon = meta.icon;
                const verdict = item.verdict ? VERDICT_META[item.verdict] : null;
                const destination = item.status === "completed" ? `/result/${item.id}` : "/reports";
                return (
                  <Link key={item.id} href={destination} className="group grid gap-3 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100" style={{ color: meta.color }}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800 group-hover:text-brand-700">{item.filename}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {verdict ? (
                      <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${verdict.className}`}>{verdict.label}</span>
                    ) : (
                      <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-600">{item.status}</span>
                    )}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      {item.confidence !== null ? `${item.confidence}% confidence` : "Pending"}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Analyze image or video", "/analyze", Image, "bg-blue-600 hover:bg-blue-700"],
            ["Check audio", "/tools/audio-check", Music, "bg-emerald-600 hover:bg-emerald-700"],
            ["Manage plan", "/pricing", Coins, "bg-amber-500 hover:bg-amber-600"],
            ["Account settings", "/settings", UserRound, "bg-slate-800 hover:bg-slate-900"],
          ].map(([label, href, Icon, tone]) => {
            const ActionIcon = Icon as typeof Image;
            return (
              <Link key={String(label)} href={String(href)} className={`flex items-center justify-between rounded-2xl p-4 text-sm font-bold text-white shadow-sm ${String(tone)}`}>
                <span className="flex items-center gap-2.5"><ActionIcon className="h-5 w-5" aria-hidden="true" /> {String(label)}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}
