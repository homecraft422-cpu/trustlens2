import { db } from "@/db";
import {
  analysisJobs,
  analysisResults,
  analysisSignals,
  reports,
  usageEvents,
  assets,
  type AnalysisJob,
  type AnalysisResult,
  type AnalysisSignal,
  type Report,
  type Asset,
} from "@/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { DetectionOrchestrator } from "../detection/orchestrator";
import { computeScores } from "../detection/scoring";
import { isImageType, isVideoType, isAudioType, getMediaTypeFromMime, config, type MediaType } from "../config";
import { nanoid } from "nanoid";
import { processMedia } from "./media-processing-service";
import type { AssetInfo, DetectionAnalysis } from "../detection/types";
import { users, billingEvents } from "@/db/schema";
import {
  getPlan,
  getPlanLimits,
  isPlanActive,
  CREDIT_COSTS,
  type PlanId,
} from "../pricing";

const orchestrator = new DetectionOrchestrator();

// Valid state transitions for analysis jobs
const VALID_TRANSITIONS: Record<string, string[]> = {
  queued: ["processing", "failed"],
  processing: ["validating_media", "failed"],
  validating_media: ["extracting_metadata", "failed"],
  extracting_metadata: ["ready_for_detection", "failed"],
  ready_for_detection: ["analyzing", "failed"],
  analyzing: ["finalizing", "failed"],
  finalizing: ["completed", "failed"],
  completed: [],
  failed: [],
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface AnalysisOwner {
  userId: string | null;
  guestId: string | null;
}

export interface MediaTypeQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface DetailedUsage {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string } | null;
  period: "monthly" | "guest_session";
  monthName: string;
  resetDate: string;
  /** Active subscription plan (Model 1). "free" for guests / non-subscribers. */
  plan: {
    id: PlanId;
    name: string;
    isPaid: boolean;
    renewsAt: string | null;
    billingCycle: string | null;
  };
  /** Pay-as-you-go credit balance (Model 2). Always 0 for guests. */
  creditsBalance: number;
  creditCosts: typeof CREDIT_COSTS;
  limits: {
    image: MediaTypeQuota;
    video: MediaTypeQuota;
    audio: MediaTypeQuota;
  };
  total: {
    used: number;
    limit: number;
    remaining: number;
  };
}

/**
 * Get start date of current month in UTC
 */
export function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Get reset date (1st of next month) formatted as string
 */
export function getNextMonthResetDate(): { date: Date; formatted: string; monthName: string } {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  const currentMonthOptions: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };

  return {
    date: nextMonth,
    formatted: nextMonth.toLocaleDateString("en-US", options),
    monthName: now.toLocaleDateString("en-US", currentMonthOptions),
  };
}

/**
 * Get detailed usage breakdown for a user or guest
 */
export async function getDetailedUsage(owner: AnalysisOwner, userData?: any): Promise<DetailedUsage> {
  const isAuth = !!owner.userId;
  const { formatted: resetDate, monthName } = getNextMonthResetDate();

  // ─── Resolve subscription plan & credits (paid tiers) ───
  let userRow: any = null;
  if (isAuth) {
    if (userData && userData.plan !== undefined) {
      userRow = userData;
    } else {
      const [row] = await db.select().from(users).where(eq(users.id, owner.userId!)).limit(1);
      userRow = row || null;
    }
  }

  const planActive = isPlanActive(userRow?.plan, userRow?.planRenewsAt);
  const effectivePlanId: PlanId = planActive ? (userRow.plan as PlanId) : "free";
  const planDef = getPlan(effectivePlanId);
  const creditsBalance = isAuth ? Math.max(0, userRow?.creditsBalance ?? 0) : 0;

  const planInfo = {
    id: effectivePlanId,
    name: planDef.name,
    isPaid: effectivePlanId !== "free",
    renewsAt: planActive && userRow?.planRenewsAt ? new Date(userRow.planRenewsAt).toISOString() : null,
    billingCycle: planActive ? userRow?.billingCycle ?? null : null,
  };

  // Guests use guest limits; signed-in users use their plan's limits
  // (free plan limits mirror the legacy config.limits.user values).
  const limits = isAuth
    ? effectivePlanId === "free"
      ? config.limits.user
      : getPlanLimits(effectivePlanId)
    : config.limits.guest;

  if (!owner.userId && !owner.guestId) {
    return {
      isAuthenticated: false,
      user: null,
      period: "guest_session",
      monthName,
      resetDate,
      plan: planInfo,
      creditsBalance: 0,
      creditCosts: CREDIT_COSTS,
      limits: {
        image: { used: 0, limit: limits.image, remaining: limits.image },
        video: { used: 0, limit: limits.video, remaining: limits.video },
        audio: { used: 0, limit: limits.audio, remaining: limits.audio },
      },
      total: {
        used: 0,
        limit: limits.image + limits.video + limits.audio,
        remaining: limits.image + limits.video + limits.audio,
      },
    };
  }

  // Determine query conditions
  let baseCondition;
  if (isAuth) {
    const monthStart = getCurrentMonthStart();
    baseCondition = and(eq(usageEvents.userId, owner.userId!), gte(usageEvents.createdAt, monthStart));
  } else {
    baseCondition = eq(usageEvents.guestId, owner.guestId!);
  }

  const allEvents = await db.select().from(usageEvents).where(baseCondition);

  let imageUsed = 0;
  let videoUsed = 0;
  let audioUsed = 0;

  for (const ev of allEvents) {
    if (ev.eventType === "analysis_image" || ev.eventType === "image") imageUsed++;
    else if (ev.eventType === "analysis_video" || ev.eventType === "video") videoUsed++;
    else if (ev.eventType === "analysis_audio" || ev.eventType === "audio") audioUsed++;
  }

  // If no media-specific events found (legacy events), count from jobs & assets
  if (imageUsed === 0 && videoUsed === 0 && audioUsed === 0 && allEvents.length > 0) {
    const jobsCondition = isAuth
      ? and(eq(analysisJobs.userId, owner.userId!), gte(analysisJobs.createdAt, getCurrentMonthStart()))
      : eq(analysisJobs.guestId, owner.guestId!);

    const jobs = await db.select().from(analysisJobs).where(jobsCondition);

    for (const j of jobs) {
      const [asset] = await db.select().from(assets).where(eq(assets.id, j.assetId)).limit(1);
      if (asset) {
        const type = getMediaTypeFromMime(asset.mimeType, asset.originalFilename);
        if (type === "image") imageUsed++;
        else if (type === "video") videoUsed++;
        else if (type === "audio") audioUsed++;
      }
    }
  }

  const imageRemaining = Math.max(0, limits.image - imageUsed);
  const videoRemaining = Math.max(0, limits.video - videoUsed);
  const audioRemaining = Math.max(0, limits.audio - audioUsed);
  const totalLimit = limits.image + limits.video + limits.audio;
  const totalUsed = imageUsed + videoUsed + audioUsed;
  const totalRemaining = imageRemaining + videoRemaining + audioRemaining;

  return {
    isAuthenticated: isAuth,
    user: userData ? { id: userData.id, email: userData.email, name: userData.name } : null,
    period: isAuth ? "monthly" : "guest_session",
    monthName,
    resetDate,
    plan: planInfo,
    creditsBalance,
    creditCosts: CREDIT_COSTS,
    limits: {
      image: { used: imageUsed, limit: limits.image, remaining: imageRemaining },
      video: { used: videoUsed, limit: limits.video, remaining: videoRemaining },
      audio: { used: audioUsed, limit: limits.audio, remaining: audioRemaining },
    },
    total: {
      used: totalUsed,
      limit: totalLimit,
      remaining: totalRemaining,
    },
  };
}

/**
 * Check if the owner has remaining quota for a specific media type
 */
export async function checkMediaQuota(
  owner: AnalysisOwner,
  mediaType: MediaType
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** True when the plan quota is exhausted and this analysis will consume pay-as-you-go credits. */
  usingCredits?: boolean;
  creditCost?: number;
  creditsBalance?: number;
  message?: string;
  code?: "LIMIT_REACHED_GUEST" | "LIMIT_REACHED_USER";
}> {
  const detailed = await getDetailedUsage(owner);
  const quota = detailed.limits[mediaType];

  if (quota.remaining <= 0) {
    // ─── Model 2 fallback: pay-as-you-go credits ───
    if (owner.userId) {
      const creditCost = CREDIT_COSTS[mediaType];
      if (detailed.creditsBalance >= creditCost) {
        return {
          allowed: true,
          used: quota.used,
          limit: quota.limit,
          remaining: 0,
          usingCredits: true,
          creditCost,
          creditsBalance: detailed.creditsBalance,
        };
      }
    }

    if (!owner.userId) {
      return {
        allowed: false,
        used: quota.used,
        limit: quota.limit,
        remaining: 0,
        code: "LIMIT_REACHED_GUEST",
        message: `You have used your free limit of ${quota.limit} ${mediaType} ${quota.limit === 1 ? "check" : "checks"}. Please sign in or create an account for 10 images, 5 videos, and 5 audios per month!`,
      };
    } else {
      const upgradeHint =
        detailed.plan.id === "free"
          ? " Upgrade to Pro from the Pricing page, or buy pay-as-you-go credits to continue instantly."
          : " Buy pay-as-you-go credits from the Pricing page to continue instantly.";
      return {
        allowed: false,
        used: quota.used,
        limit: quota.limit,
        remaining: 0,
        code: "LIMIT_REACHED_USER",
        message: `You have reached your monthly limit of ${quota.limit} ${mediaType} analyses on the ${detailed.plan.name} plan. Your quota resets on ${detailed.resetDate}.${upgradeHint}`,
      };
    }
  }

  return {
    allowed: true,
    used: quota.used,
    limit: quota.limit,
    remaining: quota.remaining,
  };
}

/**
 * Deduct pay-as-you-go credits for one analysis (Model 2).
 * Called only when checkMediaQuota returned usingCredits=true.
 */
export async function spendCreditsForAnalysis(
  userId: string,
  mediaType: MediaType
): Promise<{ success: boolean; newBalance: number }> {
  const creditCost = CREDIT_COSTS[mediaType];
  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const balance = Math.max(0, userRow?.creditsBalance ?? 0);

  if (!userRow || balance < creditCost) {
    return { success: false, newBalance: balance };
  }

  const newBalance = balance - creditCost;
  await db.update(users).set({ creditsBalance: newBalance }).where(eq(users.id, userId));
  await db.insert(billingEvents).values({
    userId,
    eventType: "credit_spend",
    credits: -creditCost,
    description: `Spent ${creditCost} credit${creditCost === 1 ? "" : "s"} on ${mediaType} analysis (plan quota exhausted)`,
  });

  return { success: true, newBalance };
}

/**
 * Create a new analysis job
 */
export async function createAnalysisJob(
  assetId: string,
  userId: string | null,
  guestId: string | null,
  mediaType: MediaType = "image"
): Promise<AnalysisJob> {
  // Check for existing active job for this asset
  const [existingJob] = await db
    .select()
    .from(analysisJobs)
    .where(
      and(
        eq(analysisJobs.assetId, assetId),
        sql`${analysisJobs.status} NOT IN ('completed', 'failed')`
      )
    )
    .limit(1);

  if (existingJob) {
    return existingJob;
  }

  const [job] = await db
    .insert(analysisJobs)
    .values({
      assetId,
      userId,
      guestId,
      status: "queued",
      jobType: "full_analysis",
    })
    .returning();

  // Record media-specific usage event
  await db.insert(usageEvents).values({
    userId,
    guestId,
    eventType: `analysis_${mediaType}`,
    analysisJobId: job.id,
  });

  return job;
}

/**
 * Safely update job status with transition validation
 */
async function updateJobStatus(
  jobId: string,
  newStatus: string,
  extra?: Partial<AnalysisJob>
): Promise<boolean> {
  const [job] = await db
    .select({ status: analysisJobs.status })
    .from(analysisJobs)
    .where(eq(analysisJobs.id, jobId))
    .limit(1);

  if (!job) return false;

  if (!canTransition(job.status, newStatus)) {
    console.warn(
      `Invalid job state transition: ${job.status} -> ${newStatus} for job ${jobId}`
    );
    return false;
  }

  await db
    .update(analysisJobs)
    .set({ status: newStatus as AnalysisJob["status"], ...extra })
    .where(eq(analysisJobs.id, jobId));

  return true;
}

/**
 * Run analysis on a job
 */
export async function runAnalysis(jobId: string): Promise<AnalysisResult | null> {
  const started = await updateJobStatus(jobId, "processing", {
    startedAt: new Date(),
  });

  if (!started) {
    console.error(`Failed to start analysis for job ${jobId}`);
    return null;
  }

  try {
    const [job] = await db
      .select()
      .from(analysisJobs)
      .where(eq(analysisJobs.id, jobId))
      .limit(1);

    if (!job) throw new Error("Job not found");

    await updateJobStatus(jobId, "validating_media");
    await updateJobStatus(jobId, "extracting_metadata");

    const processingResult = await processMedia(job.assetId);

    if (!processingResult.success) {
      await updateJobStatus(jobId, "failed", {
        errorCode: "media_processing_failed",
        errorMessage: processingResult.error || "Media processing failed",
        completedAt: new Date(),
      });
      return null;
    }

    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, job.assetId))
      .limit(1);

    if (!asset) throw new Error("Asset not found");

    await db
      .update(assets)
      .set({ storageStatus: "verified" })
      .where(eq(assets.id, asset.id));

    const assetInfo: AssetInfo = {
      id: asset.id,
      mimeType: asset.detectedMimeType || asset.mimeType,
      fileSize: asset.fileSize,
      originalFilename: asset.originalFilename,
      storageKey: asset.storageKey,
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
    };

    await updateJobStatus(jobId, "ready_for_detection");
    await updateJobStatus(jobId, "analyzing");

    // Run detection via orchestrator for Image, Video, or Audio
    let analysis: DetectionAnalysis;
    if (isImageType(assetInfo.mimeType)) {
      analysis = await orchestrator.analyzeImage(assetInfo);
    } else if (isVideoType(assetInfo.mimeType)) {
      analysis = await orchestrator.analyzeVideo(assetInfo);
    } else if (isAudioType(assetInfo.mimeType)) {
      analysis = await orchestrator.analyzeAudio(assetInfo);
    } else {
      analysis = {
        results: [],
        failures: [],
        evidence: [],
        providersUsed: [],
        hasMockResults: false,
        totalProcessingTimeMs: 0,
      };
    }

    if (analysis.results.length === 0) {
      await updateJobStatus(jobId, "failed", {
        errorCode: "no_provider_results",
        errorMessage:
          analysis.failures.length > 0
            ? "Detection providers were unavailable."
            : "No detection providers returned results.",
        completedAt: new Date(),
      });
      return null;
    }

    await updateJobStatus(jobId, "finalizing");

    const scores = computeScores(analysis);

    const resultMetadata = {
      providerAgreement: {
        consensus: scores.providerAgreement.consensus,
        agreement: scores.providerAgreement.agreement,
        providerCount: scores.providerAgreement.providerCount,
        providersUsed: scores.providerAgreement.providersUsed,
        hasFailures: scores.providerAgreement.hasFailures,
      },
      providerResults: scores.providerAgreement.providerScores.map((ps) => ({
        provider: ps.provider,
        providerVersion: ps.providerVersion,
        aiProbability: ps.aiProbability,
        manipulationProbability: ps.manipulationProbability,
        confidence: ps.confidence,
        evidenceCount: ps.evidenceCount,
        isMock: ps.isMock,
        limitations: ps.limitations,
      })),
      totalProcessingTimeMs: analysis.totalProcessingTimeMs,
      failures: analysis.failures.map((f) => ({
        provider: f.provider,
        errorCode: f.errorCode,
        retryable: f.retryable,
      })),
    };

    const [result] = await db
      .insert(analysisResults)
      .values({
        analysisJobId: jobId,
        verdict: scores.verdict,
        aiInvolvementScore: scores.aiInvolvementScore,
        manipulationScore: scores.manipulationScore,
        confidenceScore: scores.confidenceScore,
        classificationLevel: scores.classificationLevel,
        provenanceStatus: scores.provenanceStatus,
        summary: scores.summary,
        metadata: JSON.stringify(resultMetadata),
      })
      .returning();

    const signalRows = analysis.evidence.map((e) => ({
      analysisResultId: result.id,
      category: e.category,
      signalType: e.type,
      score: e.score,
      severity: e.severity,
      title: e.title,
      description: e.description,
      timestampStart: e.timestampStart ?? null,
      timestampEnd: e.timestampEnd ?? null,
      source: e.source,
    }));

    if (signalRows.length > 0) {
      await db.insert(analysisSignals).values(signalRows);
    }

    await db.insert(reports).values({
      analysisResultId: result.id,
      publicId: nanoid(12),
      isPublic: false,
    });

    await updateJobStatus(jobId, "completed", {
      completedAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("Analysis failed:", error);

    await db
      .update(analysisJobs)
      .set({
        status: "failed",
        errorCode: "analysis_error",
        errorMessage:
          error instanceof Error ? error.message : "An unexpected error occurred",
        completedAt: new Date(),
      })
      .where(eq(analysisJobs.id, jobId));

    return null;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<AnalysisJob | null> {
  const [job] = await db
    .select()
    .from(analysisJobs)
    .where(eq(analysisJobs.id, jobId))
    .limit(1);
  return job || null;
}

/**
 * Check if a user/guest owns a job
 */
export async function verifyJobOwnership(
  jobId: string,
  owner: AnalysisOwner
): Promise<boolean> {
  const [job] = await db
    .select({ userId: analysisJobs.userId, guestId: analysisJobs.guestId })
    .from(analysisJobs)
    .where(eq(analysisJobs.id, jobId))
    .limit(1);

  if (!job) return false;

  if (owner.userId) {
    return job.userId === owner.userId;
  }
  if (owner.guestId) {
    return job.guestId === owner.guestId;
  }
  return false;
}

export interface AnalysisResultData {
  result: AnalysisResult;
  signals: AnalysisSignal[];
  report: Report | null;
  job: AnalysisJob | null;
  asset: Pick<Asset, "originalFilename" | "mimeType" | "fileSize" | "duration" | "width" | "height"> | null;
}

/**
 * Get analysis result
 */
export async function getAnalysisResult(
  jobId: string
): Promise<AnalysisResultData | null> {
  const [result] = await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.analysisJobId, jobId))
    .limit(1);

  if (!result) return null;

  const signals = await db
    .select()
    .from(analysisSignals)
    .where(eq(analysisSignals.analysisResultId, result.id));

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.analysisResultId, result.id))
    .limit(1);

  const [job] = await db
    .select()
    .from(analysisJobs)
    .where(eq(analysisJobs.id, jobId))
    .limit(1);

  let assetInfo: AnalysisResultData["asset"] = null;
  if (job) {
    const [asset] = await db
      .select({
        originalFilename: assets.originalFilename,
        mimeType: assets.mimeType,
        fileSize: assets.fileSize,
        duration: assets.duration,
        width: assets.width,
        height: assets.height,
      })
      .from(assets)
      .where(eq(assets.id, job.assetId))
      .limit(1);
    assetInfo = asset || null;
  }

  return {
    result,
    signals,
    report: report || null,
    job: job || null,
    asset: assetInfo,
  };
}

export interface PublicReportData {
  result: AnalysisResult;
  signals: AnalysisSignal[];
  report: Report;
  asset: Pick<Asset, "originalFilename" | "mimeType" | "fileSize" | "duration"> | null;
}

/**
 * Get public report by publicId
 */
export async function getPublicReport(
  publicId: string
): Promise<PublicReportData | null> {
  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.publicId, publicId), eq(reports.isPublic, true)))
    .limit(1);

  if (!report) return null;

  const [result] = await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.id, report.analysisResultId))
    .limit(1);

  if (!result) return null;

  const signals = await db
    .select()
    .from(analysisSignals)
    .where(eq(analysisSignals.analysisResultId, result.id));

  const [job] = await db
    .select()
    .from(analysisJobs)
    .where(eq(analysisJobs.id, result.analysisJobId))
    .limit(1);

  let assetInfo: PublicReportData["asset"] = null;
  if (job) {
    const [asset] = await db
      .select({
        originalFilename: assets.originalFilename,
        mimeType: assets.mimeType,
        fileSize: assets.fileSize,
        duration: assets.duration,
      })
      .from(assets)
      .where(eq(assets.id, job.assetId))
      .limit(1);
    assetInfo = asset || null;
  }

  return { result, signals, report, asset: assetInfo };
}

/**
 * Enable sharing for a report
 */
export async function enableSharing(
  publicId: string,
  owner: AnalysisOwner
): Promise<boolean> {
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.publicId, publicId))
    .limit(1);

  if (!report) return false;

  const [result] = await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.id, report.analysisResultId))
    .limit(1);

  if (!result) return false;

  const isOwner = await verifyJobOwnership(result.analysisJobId, owner);
  if (!isOwner) return false;

  await db
    .update(reports)
    .set({ isPublic: true })
    .where(eq(reports.id, report.id));

  return true;
}

export interface HistoryItem {
  job: AnalysisJob;
  result: AnalysisResult | null;
  asset: Pick<Asset, "originalFilename" | "mimeType" | "fileSize"> | null;
  report: Pick<Report, "publicId" | "isPublic"> | null;
}

/**
 * Get user's analysis history
 */
export async function getUserHistory(
  owner: AnalysisOwner,
  limit: number = 20,
  offset: number = 0
): Promise<HistoryItem[]> {
  if (!owner.userId && !owner.guestId) {
    return [];
  }

  const condition = owner.userId
    ? eq(analysisJobs.userId, owner.userId)
    : eq(analysisJobs.guestId, owner.guestId!);

  const jobs = await db
    .select()
    .from(analysisJobs)
    .where(condition)
    .orderBy(desc(analysisJobs.createdAt))
    .limit(limit)
    .offset(offset);

  const jobsWithDetails = await Promise.all(
    jobs.map(async (job: any) => {
      const [result] = await db
        .select()
        .from(analysisResults)
        .where(eq(analysisResults.analysisJobId, job.id))
        .limit(1);

      const [asset] = await db
        .select({
          originalFilename: assets.originalFilename,
          mimeType: assets.mimeType,
          fileSize: assets.fileSize,
        })
        .from(assets)
        .where(eq(assets.id, job.assetId))
        .limit(1);

      let reportInfo: HistoryItem["report"] = null;
      if (result) {
        const [report] = await db
          .select({ publicId: reports.publicId, isPublic: reports.isPublic })
          .from(reports)
          .where(eq(reports.analysisResultId, result.id))
          .limit(1);
        reportInfo = report || null;
      }

      return {
        job,
        result: result || null,
        asset: asset || null,
        report: reportInfo,
      };
    })
  );

  return jobsWithDetails;
}

/**
 * Get total usage count (compatibility helper)
 */
export async function getUsageCount(owner: AnalysisOwner): Promise<number> {
  const usage = await getDetailedUsage(owner);
  return usage.total.used;
}

/**
 * Delete an asset and its analysis data
 */
export async function deleteAsset(
  assetId: string,
  owner: AnalysisOwner
): Promise<boolean> {
  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);

  if (!asset) return false;

  const isOwner =
    (owner.userId && asset.userId === owner.userId) ||
    (owner.guestId && asset.guestId === owner.guestId);

  if (!isOwner) return false;

  await db
    .update(assets)
    .set({ deletedAt: new Date(), storageStatus: "deleted" })
    .where(eq(assets.id, assetId));

  return true;
}
