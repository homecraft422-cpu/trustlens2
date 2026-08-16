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
import { getMediaTypeFromMime, config, type MediaType } from "../config";
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
      try {
        const [row] = await db.select().from(users).where(eq(users.id, owner.userId!)).limit(1);
        userRow = row || null;
      } catch (error) {
        console.error("[usage] user lookup failed — assuming free plan:", error);
        userRow = null;
      }
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

  // Usage counting is best-effort: a failed lookup must never take down the
  // analyze flow. If the usage_events query fails we treat usage as 0 (the
  // friendliest outcome for the user) and log the real error for ops.
  let allEvents: any[] = [];
  try {
    allEvents = await db.select().from(usageEvents).where(baseCondition);
  } catch (error) {
    console.error("[usage] usage_events query failed — treating usage as 0:", error);
    allEvents = [];
  }

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
    try {
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
    } catch (error) {
      console.error("[usage] legacy job count failed — ignoring:", error);
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
  // ── FAIL-OPEN QUOTA CHECK ──
  // Reading usage from the database must NEVER block an analysis. If the
  // usage_events lookup fails (cold serverless DB, transient network drop,
  // missing table before migrations ran), we allow the analysis and log the
  // problem instead of returning a hard error to the user. Guests without an
  // account especially must always be able to try the tool.
  let detailed: DetailedUsage;
  try {
    detailed = await getDetailedUsage(owner);
  } catch (error) {
    console.error(
      "[quota] usage lookup failed — allowing analysis (fail-open):",
      error
    );
    const fallbackLimits = owner.userId ? config.limits.user : config.limits.guest;
    const limit = fallbackLimits[mediaType];
    return {
      allowed: true,
      used: 0,
      limit,
      remaining: limit,
    };
  }
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

  // Record media-specific usage event. Non-fatal: failing to log usage must
  // never block the analysis the user is waiting for.
  try {
    await db.insert(usageEvents).values({
      userId,
      guestId,
      eventType: `analysis_${mediaType}`,
      analysisJobId: job.id,
    });
  } catch (error) {
    console.error("[usage] could not record usage event (non-fatal):", error);
  }

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

/** Jobs stuck in a non-terminal state longer than this are safe to restart. */
const STALE_JOB_MS = 90_000;

/** In-process guard so the same job isn't analysed twice concurrently. */
const globalForRuns = globalThis as typeof globalThis & {
  __trustlensRunningJobs?: Map<string, Promise<AnalysisResult | null>>;
};

function runningJobs(): Map<string, Promise<AnalysisResult | null>> {
  if (!globalForRuns.__trustlensRunningJobs) {
    globalForRuns.__trustlensRunningJobs = new Map();
  }
  return globalForRuns.__trustlensRunningJobs;
}

/**
 * Force a job back to `processing` regardless of its current state.
 * Used when a previous run died mid-flight (serverless freeze, crash, redeploy)
 * and left the job parked in e.g. `analyzing` forever.
 */
async function forceRestartJob(jobId: string): Promise<void> {
  await db
    .update(analysisJobs)
    .set({
      status: "processing" as AnalysisJob["status"],
      startedAt: new Date(),
      errorCode: null,
      errorMessage: null,
    })
    .where(eq(analysisJobs.id, jobId));
}

/**
 * Re-run a job that appears stuck. Safe to call from a polling endpoint:
 * returns false when the job is terminal, still fresh, or already running.
 */
export async function resumeStalledJob(jobId: string): Promise<boolean> {
  if (runningJobs().has(jobId)) return false;

  const [job] = await db
    .select()
    .from(analysisJobs)
    .where(eq(analysisJobs.id, jobId))
    .limit(1);

  if (!job) return false;
  if (job.status === "completed" || job.status === "failed") return false;

  const since = new Date(job.startedAt || job.createdAt || Date.now()).getTime();
  if (Date.now() - since < STALE_JOB_MS) return false;

  console.warn(`[analysis] resuming stalled job ${jobId} (status=${job.status})`);
  runAnalysis(jobId, { force: true }).catch((err) =>
    console.error(`[analysis] resume of ${jobId} failed:`, err)
  );
  return true;
}

/**
 * Run analysis on a job.
 * Idempotent: concurrent calls share one run, completed jobs return the
 * existing result instead of failing, and stuck jobs can be forced to restart.
 */
export async function runAnalysis(
  jobId: string,
  options: { force?: boolean } = {}
): Promise<AnalysisResult | null> {
  const inFlight = runningJobs().get(jobId);
  if (inFlight) return inFlight;

  const run = executeAnalysis(jobId, options).finally(() => {
    runningJobs().delete(jobId);
  });
  runningJobs().set(jobId, run);
  return run;
}

async function executeAnalysis(
  jobId: string,
  options: { force?: boolean } = {}
): Promise<AnalysisResult | null> {
  // If the job already produced a result, hand it back — never re-fail it.
  const [existingResult] = await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.analysisJobId, jobId))
    .limit(1);
  if (existingResult) return existingResult;

  let started = await updateJobStatus(jobId, "processing", {
    startedAt: new Date(),
  });

  if (!started) {
    const [current] = await db
      .select()
      .from(analysisJobs)
      .where(eq(analysisJobs.id, jobId))
      .limit(1);

    if (!current) {
      console.error(`[analysis] job ${jobId} not found`);
      return null;
    }

    const since = new Date(current.startedAt || current.createdAt || Date.now()).getTime();
    const isStale = Date.now() - since > STALE_JOB_MS;
    const isTerminal = current.status === "completed" || current.status === "failed";

    if (options.force || (!isTerminal && isStale)) {
      // Previous attempt died mid-pipeline; take it over.
      await forceRestartJob(jobId);
      started = true;
    } else if (isTerminal) {
      return null;
    } else {
      // Another attempt is legitimately in progress on this instance.
      return null;
    }
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

    // Metadata extraction is best-effort. A missing width/duration must never
    // block detection — previously any hiccup here failed the whole analysis.
    let processingResult: Awaited<ReturnType<typeof processMedia>>;
    try {
      processingResult = await processMedia(job.assetId);
    } catch (error) {
      console.error(`[analysis] processMedia threw for job ${jobId}:`, error);
      processingResult = {
        success: false,
        assetId: job.assetId,
        validationPassed: false,
        metadataExtracted: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    if (!processingResult.success) {
      console.warn(
        `[analysis] metadata extraction degraded for job ${jobId}: ${processingResult.error}`
      );
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

    // Run detection via orchestrator for Image, Video, or Audio.
    // Media type is resolved from the *detected* mime first, then the declared
    // mime, then the filename — so an "application/octet-stream" upload from a
    // mobile browser still routes to the right analyzer instead of nothing.
    const resolvedMediaType = getMediaTypeFromMime(
      assetInfo.mimeType,
      assetInfo.originalFilename
    );

    const emptyAnalysis: DetectionAnalysis = {
      results: [],
      failures: [],
      evidence: [],
      providersUsed: [],
      hasMockResults: false,
      totalProcessingTimeMs: 0,
    };

    let analysis: DetectionAnalysis;
    try {
      if (resolvedMediaType === "video") {
        analysis = await orchestrator.analyzeVideo(assetInfo);
      } else if (resolvedMediaType === "audio") {
        analysis = await orchestrator.analyzeAudio(assetInfo);
      } else {
        analysis = await orchestrator.analyzeImage(assetInfo);
      }
    } catch (error) {
      console.error(`[analysis] orchestrator threw for job ${jobId}:`, error);
      analysis = emptyAnalysis;
    }

    if (analysis.results.length === 0) {
      const providerDetail =
        analysis.failures.length > 0
          ? analysis.failures
              .map((f) => `${f.provider}: ${f.errorCode}`)
              .join(", ")
          : "no providers are configured for this media type";

      await updateJobStatus(jobId, "failed", {
        errorCode: "no_provider_results",
        errorMessage: `Detection could not run (${providerDetail}).`,
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

    // A missing share-report row must not fail an otherwise good analysis.
    try {
      const [existingReport] = await db
        .select()
        .from(reports)
        .where(eq(reports.analysisResultId, result.id))
        .limit(1);

      if (!existingReport) {
        await db.insert(reports).values({
          analysisResultId: result.id,
          publicId: nanoid(12),
          isPublic: false,
        });
      }
    } catch (error) {
      console.error(`[analysis] report row creation failed for job ${jobId}:`, error);
    }

    const completed = await updateJobStatus(jobId, "completed", {
      completedAt: new Date(),
    });

    // The state machine only allows finalizing -> completed. If a concurrent
    // attempt moved the job elsewhere, force it: a result exists, so the job
    // is completed by definition and must never be shown as stuck/failed.
    if (!completed) {
      await db
        .update(analysisJobs)
        .set({
          status: "completed" as AnalysisJob["status"],
          completedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        })
        .where(eq(analysisJobs.id, jobId));
    }

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

/** Shape of the report payload served to the result page / embedded in upload responses. */
export interface AnalysisResultView {
  result: {
    id: string;
    verdict: string;
    aiInvolvementScore: number;
    manipulationScore: number;
    confidenceScore: number;
    classificationLevel: string;
    provenanceStatus: string;
    summary: string | null;
    createdAt: string;
  };
  providerSummary: {
    consensus: string;
    agreement: number | null;
    providerCount: number;
    providersUsed: string[];
    hasFailures: boolean;
    failures: Array<{ provider: string; errorCode: string }>;
  };
  signals: Array<{
    id: string;
    category: string;
    signalType: string;
    score: number | null;
    severity: string;
    title: string;
    description: string;
    timestampStart: number | null;
    timestampEnd: number | null;
    source: string | null;
  }>;
  report: { publicId: string; isPublic: boolean } | null;
  asset: Pick<Asset, "originalFilename" | "mimeType" | "fileSize" | "duration"> | null;
  isMockMode: boolean;
}

/**
 * Build the full report view for a job.
 *
 * Shared by `GET /api/v1/analyses/[id]/result` and the upload route
 * (`POST /api/v1/analyses`), so the report embedded in the upload response is
 * byte-for-byte the same shape the result page renders. Embedding the finished
 * report in the upload response lets the client show it even when a later
 * request lands on a different server instance (per-instance fallback store).
 */
export async function getAnalysisResultView(
  jobId: string
): Promise<AnalysisResultView | null> {
  const data = await getAnalysisResult(jobId);
  if (!data) return null;

  // Parse stored provider agreement metadata (safe — never contains secrets)
  let providerSummary: AnalysisResultView["providerSummary"] = {
    consensus: "single_provider",
    agreement: null,
    providerCount: 1,
    providersUsed: [],
    hasFailures: false,
    failures: [],
  };

  if (data.result.metadata) {
    try {
      const meta = JSON.parse(data.result.metadata);
      if (meta.providerAgreement) {
        providerSummary = {
          consensus: meta.providerAgreement.consensus,
          agreement: meta.providerAgreement.agreement,
          providerCount: meta.providerAgreement.providerCount,
          providersUsed: meta.providerAgreement.providersUsed || [],
          hasFailures: meta.providerAgreement.hasFailures || false,
          failures: (meta.failures || []).map(
            (f: { provider: string; errorCode: string }) => ({
              provider: f.provider,
              errorCode: f.errorCode,
            })
          ),
        };
      }
    } catch {
      // Ignore parse errors for old data
    }
  }

  return {
    result: {
      id: data.result.id,
      verdict: data.result.verdict,
      aiInvolvementScore: data.result.aiInvolvementScore,
      manipulationScore: data.result.manipulationScore,
      confidenceScore: data.result.confidenceScore,
      classificationLevel: data.result.classificationLevel,
      provenanceStatus: data.result.provenanceStatus,
      summary: data.result.summary,
      createdAt:
        data.result.createdAt instanceof Date
          ? data.result.createdAt.toISOString()
          : String(data.result.createdAt),
    },
    providerSummary,
    signals: data.signals.map((s) => ({
      id: s.id,
      category: s.category,
      signalType: s.signalType,
      score: s.score,
      severity: s.severity,
      title: s.title,
      description: s.description,
      timestampStart: s.timestampStart,
      timestampEnd: s.timestampEnd,
      source: s.source,
    })),
    report: data.report
      ? { publicId: data.report.publicId, isPublic: data.report.isPublic }
      : null,
    asset: data.asset
      ? {
          originalFilename: data.asset.originalFilename,
          mimeType: data.asset.mimeType,
          fileSize: data.asset.fileSize,
          duration: data.asset.duration,
        }
      : null,
    isMockMode: config.detection.mode === "mock",
  };
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
