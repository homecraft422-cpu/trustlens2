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
import { eq, desc, and, sql } from "drizzle-orm";
import { DetectionOrchestrator } from "../detection/orchestrator";
import { computeScores } from "../detection/scoring";
import { isImageType, isVideoType } from "../config";
import { nanoid } from "nanoid";
import { processMedia } from "./media-processing-service";
import type { AssetInfo, DetectionAnalysis } from "../detection/types";

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

/**
 * Create a new analysis job
 */
export async function createAnalysisJob(
  assetId: string,
  userId: string | null,
  guestId: string | null
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
    // Return existing job (idempotency)
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

  // Record usage event with job reference
  await db.insert(usageEvents).values({
    userId,
    guestId,
    eventType: "analysis_created",
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
  // Update to processing
  const started = await updateJobStatus(jobId, "processing", {
    startedAt: new Date(),
  });

  if (!started) {
    console.error(`Failed to start analysis for job ${jobId}`);
    return null;
  }

  try {
    // Get job and asset info
    const [job] = await db
      .select()
      .from(analysisJobs)
      .where(eq(analysisJobs.id, jobId))
      .limit(1);

    if (!job) throw new Error("Job not found");

    // Update to validating_media
    await updateJobStatus(jobId, "validating_media");

    // Update to extracting_metadata and process media
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

    // Get updated asset with metadata
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, job.assetId))
      .limit(1);

    if (!asset) throw new Error("Asset not found");

    // Update storage status to verified
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

    // Update to ready_for_detection
    await updateJobStatus(jobId, "ready_for_detection");

    // Update to analyzing
    await updateJobStatus(jobId, "analyzing");

    // Run detection via orchestrator
    const analysis: DetectionAnalysis = isImageType(assetInfo.mimeType)
      ? await orchestrator.analyzeImage(assetInfo)
      : isVideoType(assetInfo.mimeType)
        ? await orchestrator.analyzeVideo(assetInfo)
        : { results: [], failures: [], evidence: [], providersUsed: [], hasMockResults: false, totalProcessingTimeMs: 0 };

    if (analysis.results.length === 0) {
      await updateJobStatus(jobId, "failed", {
        errorCode: "no_provider_results",
        errorMessage: analysis.failures.length > 0
          ? "Detection providers were unavailable."
          : "No detection providers returned results.",
        completedAt: new Date(),
      });
      return null;
    }

    // Update to finalizing
    await updateJobStatus(jobId, "finalizing");

    // Compute scores from normalized analysis (includes fusion + verdict)
    const scores = computeScores(analysis);

    // Build metadata: provider agreement + per-provider scores (no secrets)
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

    // Save result
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

    // Save evidence as analysis signals
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

    // Create report (initially private)
    await db.insert(reports).values({
      analysisResultId: result.id,
      publicId: nanoid(12),
      isPublic: false,
    });

    // Complete
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
 * Get job status (public info only)
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
    jobs.map(async (job) => {
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
 * Get usage count
 */
export async function getUsageCount(owner: AnalysisOwner): Promise<number> {
  if (!owner.userId && !owner.guestId) {
    return 0;
  }

  const condition = owner.userId
    ? eq(usageEvents.userId, owner.userId)
    : eq(usageEvents.guestId, owner.guestId!);

  const [count] = await db
    .select({ count: sql<number>`count(distinct ${usageEvents.analysisJobId})::int` })
    .from(usageEvents)
    .where(and(condition, eq(usageEvents.eventType, "analysis_created")));

  return count?.count || 0;
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

  // Verify ownership
  const isOwner =
    (owner.userId && asset.userId === owner.userId) ||
    (owner.guestId && asset.guestId === owner.guestId);

  if (!isOwner) return false;

  // Soft delete
  await db
    .update(assets)
    .set({ deletedAt: new Date(), storageStatus: "deleted" })
    .where(eq(assets.id, assetId));

  // Note: Actual file deletion from storage should be handled by a cleanup job

  return true;
}
