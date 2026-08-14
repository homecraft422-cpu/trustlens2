import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usageEvents } from "@/db/schema";
import { getSessionUserFromToken } from "@/lib/auth";
import { config, getMediaTypeFromMime, type MediaType } from "@/lib/config";
import { getDetailedUsage, getUserHistory } from "@/lib/services/analysis-service";

const RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

type DashboardRange = keyof typeof RANGE_DAYS;

function toPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value)));
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatBucketLabel(date: Date, range: DashboardRange): string {
  return date.toLocaleDateString("en-IN", {
    month: range === "7d" ? undefined : "short",
    weekday: range === "7d" ? "short" : undefined,
    day: range === "7d" ? undefined : "numeric",
    timeZone: "UTC",
  });
}

function getEventMediaType(eventType: string): MediaType | null {
  if (eventType === "image" || eventType === "analysis_image") return "image";
  if (eventType === "video" || eventType === "analysis_video") return "video";
  if (eventType === "audio" || eventType === "analysis_audio") return "audio";
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value;
    const user = token ? await getSessionUserFromToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to view your personal dashboard.", code: "AUTH_REQUIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const requestedRange = req.nextUrl.searchParams.get("range");
    const range: DashboardRange =
      requestedRange && requestedRange in RANGE_DAYS
        ? (requestedRange as DashboardRange)
        : "30d";
    const days = RANGE_DAYS[range];
    const now = new Date();
    const today = startOfUtcDay(now);
    const periodStart = new Date(today);
    periodStart.setUTCDate(periodStart.getUTCDate() - (days - 1));

    const owner = { userId: user.id, guestId: null };
    const [usage, history, allUsageEvents] = await Promise.all([
      getDetailedUsage(owner, user),
      getUserHistory(owner, 500, 0),
      db.select().from(usageEvents).where(eq(usageEvents.userId, user.id)),
    ]);

    const periodEvents = allUsageEvents.filter(
      (event: any) => new Date(event.createdAt).getTime() >= periodStart.getTime()
    );
    const periodHistory = history.filter(
      (item) => new Date(item.job.createdAt).getTime() >= periodStart.getTime()
    );

    const typeBreakdown: Record<MediaType, number> = { image: 0, video: 0, audio: 0 };
    for (const event of periodEvents) {
      const mediaType = getEventMediaType(event.eventType);
      if (mediaType) typeBreakdown[mediaType] += 1;
    }

    // Legacy jobs may not have usage events. Count their type only when the
    // period has no canonical events, avoiding duplicate main-analysis counts.
    if (periodEvents.length === 0 && periodHistory.length > 0) {
      for (const item of periodHistory) {
        if (!item.asset) continue;
        const type = getMediaTypeFromMime(item.asset.mimeType, item.asset.originalFilename);
        typeBreakdown[type] += 1;
      }
    }

    const verdictBreakdown = {
      likely_authentic: 0,
      likely_ai_generated: 0,
      possibly_manipulated: 0,
      unverified: 0,
      insufficient_evidence: 0,
    };
    const statusBreakdown = { completed: 0, processing: 0, failed: 0 };
    const confidenceBuckets = { high: 0, medium: 0, low: 0 };
    let confidenceTotal = 0;
    let confidenceCount = 0;
    let aiScoreTotal = 0;
    let manipulationTotal = 0;

    for (const item of periodHistory) {
      if (item.job.status === "completed") statusBreakdown.completed += 1;
      else if (item.job.status === "failed") statusBreakdown.failed += 1;
      else statusBreakdown.processing += 1;

      if (!item.result) continue;
      const verdict = item.result.verdict as keyof typeof verdictBreakdown;
      if (verdict in verdictBreakdown) verdictBreakdown[verdict] += 1;
      else verdictBreakdown.unverified += 1;

      const confidence = toPercent(item.result.confidenceScore);
      confidenceTotal += confidence;
      confidenceCount += 1;
      aiScoreTotal += toPercent(item.result.aiInvolvementScore);
      manipulationTotal += toPercent(item.result.manipulationScore);
      if (confidence >= 75) confidenceBuckets.high += 1;
      else if (confidence >= 45) confidenceBuckets.medium += 1;
      else confidenceBuckets.low += 1;
    }

    const bucketSize = range === "7d" ? 1 : range === "30d" ? 3 : 7;
    const activity = [];
    for (let offset = 0; offset < days; offset += bucketSize) {
      const bucketStart = new Date(periodStart);
      bucketStart.setUTCDate(bucketStart.getUTCDate() + offset);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setUTCDate(bucketEnd.getUTCDate() + bucketSize);
      const count = periodEvents.filter((event: any) => {
        const timestamp = new Date(event.createdAt).getTime();
        return timestamp >= bucketStart.getTime() && timestamp < bucketEnd.getTime();
      }).length;
      activity.push({
        label: formatBucketLabel(bucketStart, range),
        date: bucketStart.toISOString(),
        count,
      });
    }

    const recent = history.slice(0, 5).map((item) => ({
      id: item.job.id,
      status: item.job.status,
      createdAt: item.job.createdAt,
      filename: item.asset?.originalFilename || "Untitled analysis",
      mediaType: item.asset
        ? getMediaTypeFromMime(item.asset.mimeType, item.asset.originalFilename)
        : "image",
      verdict: item.result?.verdict || null,
      confidence: item.result ? toPercent(item.result.confidenceScore) : null,
      publicId: item.report?.publicId || null,
    }));

    const completedWithResult = confidenceCount;
    const flagged =
      verdictBreakdown.likely_ai_generated + verdictBreakdown.possibly_manipulated;
    const authentic = verdictBreakdown.likely_authentic;
    const periodAnalysisCount =
      periodEvents.length > 0 ? periodEvents.length : periodHistory.length;
    const allTimeAnalysisCount =
      allUsageEvents.length > 0 ? allUsageEvents.length : history.length;

    const mostUsedType = (Object.entries(typeBreakdown) as Array<[MediaType, number]>).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const busiestBucket = [...activity].sort((a, b) => b.count - a.count)[0];
    const usedPercent = usage.total.limit
      ? Math.round((usage.total.used / usage.total.limit) * 100)
      : 0;

    return NextResponse.json(
      {
        account: {
          id: user.id,
          name: user.name || user.email.split("@")[0],
          email: user.email,
          initials: (user.name || user.email)
            .split(/\s|@/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part: string) => part[0]?.toUpperCase())
            .join(""),
          authProvider: user.authProvider || "email",
          accountType: user.email.toLowerCase().endsWith("@gmail.com") ? "Gmail account" : "Email account",
          memberSince: user.createdAt,
        },
        range,
        period: {
          from: periodStart.toISOString(),
          to: now.toISOString(),
          days,
        },
        plan: usage.plan,
        creditsBalance: usage.creditsBalance,
        usage: {
          monthName: usage.monthName,
          resetDate: usage.resetDate,
          limits: usage.limits,
          total: usage.total,
          usedPercent,
        },
        summary: {
          allTimeAnalyses: allTimeAnalysisCount,
          periodAnalyses: periodAnalysisCount,
          completedReports: completedWithResult,
          flagged,
          authentic,
          inconclusive:
            verdictBreakdown.unverified + verdictBreakdown.insufficient_evidence,
          avgConfidence: confidenceCount ? Math.round(confidenceTotal / confidenceCount) : 0,
          avgAiScore: confidenceCount ? Math.round(aiScoreTotal / confidenceCount) : 0,
          avgManipulationScore: confidenceCount
            ? Math.round(manipulationTotal / confidenceCount)
            : 0,
          completionRate: periodHistory.length
            ? Math.round((statusBreakdown.completed / periodHistory.length) * 100)
            : 0,
          flaggedRate: completedWithResult
            ? Math.round((flagged / completedWithResult) * 100)
            : 0,
        },
        activity,
        typeBreakdown,
        verdictBreakdown,
        statusBreakdown,
        confidenceBuckets,
        recent,
        insights: {
          mostUsedType: mostUsedType?.[1] ? mostUsedType[0] : null,
          mostUsedTypeCount: mostUsedType?.[1] || 0,
          busiestLabel: busiestBucket?.count ? busiestBucket.label : null,
          busiestCount: busiestBucket?.count || 0,
        },
        isMockMode: config.detection.mode === "mock",
        generatedAt: now.toISOString(),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Unable to load your dashboard right now.", code: "DASHBOARD_ERROR" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
