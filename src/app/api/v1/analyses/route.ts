import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { db } from "@/db";
import { assets } from "@/db/schema";
import {
  createAnalysisJob,
  runAnalysis,
  checkMediaQuota,
  spendCreditsForAnalysis,
} from "@/lib/services/analysis-service";
import {
  isSupportedType,
  getMediaTypeFromMime,
  config,
} from "@/lib/config";
import { getStorage } from "@/lib/storage";
import { validateFileBuffer } from "@/lib/media/file-validator";

// The upload pipeline needs Node APIs (Buffer, sharp, file-type, fs).
export const runtime = "nodejs";
// Uploading + running detection can take a while on cold starts.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Stages, so a failure tells the user (and the logs) exactly what broke. */
type Stage =
  | "read_form"
  | "validate_input"
  | "quota"
  | "read_file"
  | "validate_file"
  | "storage"
  | "database"
  | "job";

const STAGE_MESSAGES: Record<Stage, string> = {
  read_form:
    "We couldn't read the uploaded file. If it's a large video, try a smaller file or a more stable connection.",
  validate_input: "That file couldn't be accepted. Please try a different file.",
  quota: "We couldn't check your remaining quota. Please try again in a moment.",
  read_file:
    "The upload was interrupted before the whole file arrived. Please try again.",
  validate_file: "We couldn't read this file's contents. It may be corrupted.",
  storage: "We couldn't save your file for analysis. Please try again.",
  database:
    "We couldn't save this analysis. The database may be unavailable — please try again shortly.",
  job: "We couldn't start the analysis. Please try again.",
};

function errorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function fail(stage: Stage, error: unknown, status = 500) {
  const detail = errorDetail(error);
  console.error(`[analyses] stage=${stage} failed:`, error);
  return NextResponse.json(
    {
      error: STAGE_MESSAGES[stage],
      stage,
      // Surface the real reason so users can report something actionable and
      // so this is debuggable in production without server log access.
      detail,
    },
    { status }
  );
}

/** Body-size rejections from the host proxy surface as opaque parse errors. */
function looksLikeBodyTooLarge(error: unknown): boolean {
  const message = errorDetail(error).toLowerCase();
  return (
    message.includes("body exceeded") ||
    message.includes("request entity too large") ||
    message.includes("payload too large") ||
    message.includes("content length")
  );
}

function safeFilename(name: string): string {
  const cleaned = (name || "upload")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim();
  const base = cleaned.length > 0 ? cleaned : "upload";
  // assets.original_filename is varchar(500)
  return base.length > 200 ? base.slice(-200) : base;
}

function safeMime(mime: string | null | undefined, fallback: string): string {
  const value = (mime || "").split(";")[0].trim().toLowerCase();
  if (!value || value.length > 100) return fallback;
  return value;
}

export async function POST(req: NextRequest) {
  // ── 1. Session (never fatal: a broken session just means "guest") ─────────
  let user: Awaited<ReturnType<typeof getSessionUserFromToken>> | null = null;
  try {
    const token = req.cookies.get("session_token")?.value;
    user = token ? await getSessionUserFromToken(token) : null;
  } catch (error) {
    console.warn("[analyses] session lookup failed, continuing as guest:", error);
    user = null;
  }

  // ── 2. Parse the multipart body ───────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    if (looksLikeBodyTooLarge(error)) {
      return NextResponse.json(
        {
          error:
            "This file is too large for the server to accept. Try a shorter video/audio clip (under ~40 MB) or a compressed version.",
          stage: "read_form",
          code: "BODY_TOO_LARGE",
        },
        { status: 413 }
      );
    }
    return fail("read_form", error, 400);
  }

  const fileEntry = formData.get("file");
  const guestId = (formData.get("guestId") as string | null) || null;

  if (!fileEntry || typeof fileEntry === "string") {
    return NextResponse.json(
      { error: "No file uploaded.", stage: "validate_input" },
      { status: 400 }
    );
  }

  const file = fileEntry as File;

  if (!file.size) {
    return NextResponse.json(
      { error: "The uploaded file is empty. Please choose another file.", stage: "validate_input" },
      { status: 400 }
    );
  }

  const filename = safeFilename(file.name);
  let declaredMime = safeMime(file.type, "application/octet-stream");

  // Some mobile browsers / share sheets send "application/octet-stream" with no
  // usable extension. Sniff the magic bytes before rejecting a valid upload.
  if (!isSupportedType(declaredMime, filename)) {
    let sniffed: string | null = null;
    try {
      const head = Buffer.from(await file.slice(0, 4100).arrayBuffer());
      const detection = await validateFileBuffer(head, declaredMime, filename);
      sniffed = detection.detectedMimeType;
    } catch {
      sniffed = null;
    }

    if (sniffed && isSupportedType(sniffed, filename)) {
      declaredMime = safeMime(sniffed, declaredMime);
    } else {
      return NextResponse.json(
        {
          error:
            "This file type isn't supported. Please upload JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, or M4A.",
          stage: "validate_input",
        },
        { status: 400 }
      );
    }
  }

  const mediaType = getMediaTypeFromMime(declaredMime, filename);

  const sizeLimits = {
    image: config.limits.maxImageSize,
    video: config.limits.maxVideoSize,
    audio: config.limits.maxAudioSize,
  } as const;

  if (file.size > sizeLimits[mediaType]) {
    const mb = Math.round(sizeLimits[mediaType] / (1024 * 1024));
    return NextResponse.json(
      {
        error: `${mediaType[0].toUpperCase()}${mediaType.slice(1)} file is too large. Maximum size is ${mb} MB.`,
        stage: "validate_input",
      },
      { status: 400 }
    );
  }

  const userId = user?.id || null;
  const effectiveGuestId = userId
    ? null
    : (guestId || `guest_${crypto.randomUUID().replace(/-/g, "")}`).slice(0, 100);
  const owner = { userId, guestId: effectiveGuestId };

  // ── 3. Quota ──────────────────────────────────────────────────────────────
  let quotaCheck;
  try {
    quotaCheck = await checkMediaQuota(owner, mediaType);
  } catch (error) {
    return fail("quota", error);
  }

  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        error: quotaCheck.message,
        code: quotaCheck.code,
        mediaType,
        used: quotaCheck.used,
        limit: quotaCheck.limit,
        remaining: 0,
      },
      { status: 429 }
    );
  }

  // ── 4. Read bytes ─────────────────────────────────────────────────────────
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    if (looksLikeBodyTooLarge(error)) {
      return NextResponse.json(
        {
          error:
            "This file is too large for the server to accept. Try a shorter clip or a compressed version.",
          stage: "read_file",
          code: "BODY_TOO_LARGE",
        },
        { status: 413 }
      );
    }
    return fail("read_file", error, 400);
  }

  if (buffer.length === 0) {
    return NextResponse.json(
      { error: "The uploaded file is empty. Please choose another file.", stage: "read_file" },
      { status: 400 }
    );
  }

  // ── 5. Content validation (magic bytes) ───────────────────────────────────
  let detectedMime = declaredMime;
  try {
    const validation = await validateFileBuffer(buffer, declaredMime, filename);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid file.", stage: "validate_file" },
        { status: 400 }
      );
    }
    detectedMime = safeMime(validation.detectedMimeType, declaredMime);
  } catch (error) {
    // A validator crash must not block a perfectly good upload — fall back to
    // the declared type, which already passed the extension/MIME allow-list.
    console.warn("[analyses] file validation crashed, using declared type:", error);
  }

  // ── 6. Store the bytes ────────────────────────────────────────────────────
  const assetId = crypto.randomUUID();
  const storage = getStorage();
  const storageKey = storage.generateKey(assetId);

  try {
    await storage.upload(buffer, storageKey, {
      contentType: detectedMime,
      originalFilename: filename,
    });
  } catch (error) {
    return fail("storage", error);
  }

  // ── 7. Persist asset + job ────────────────────────────────────────────────
  let asset;
  try {
    [asset] = await db
      .insert(assets)
      .values({
        id: assetId,
        userId,
        guestId: effectiveGuestId,
        originalFilename: filename,
        mimeType: detectedMime,
        fileSize: buffer.length,
        storageKey,
        storageProvider: storage.name,
        storageStatus: "uploaded",
        detectedMimeType: detectedMime,
        isValidFile: true,
      })
      .returning();

    if (!asset) throw new Error("Asset insert returned no row");
  } catch (error) {
    return fail("database", error);
  }

  let job;
  try {
    job = await createAnalysisJob(asset.id, userId, effectiveGuestId, mediaType);
    if (!job) throw new Error("Job insert returned no row");
  } catch (error) {
    return fail("job", error);
  }

  // ── 8. Credits (never fatal — the job already exists) ─────────────────────
  let creditsInfo: { usedCredits: boolean; creditsBalance?: number } = { usedCredits: false };
  if (quotaCheck.usingCredits && userId) {
    try {
      const spend = await spendCreditsForAnalysis(userId, mediaType);
      creditsInfo = { usedCredits: true, creditsBalance: spend.newBalance };
    } catch (error) {
      console.error("[analyses] credit deduction failed:", error);
    }
  }

  // ── 9. Run detection ──────────────────────────────────────────────────────
  // Serverless hosts freeze the container once the response is sent, which used
  // to leave jobs stuck in "queued" forever. Wait for the analysis up to a
  // budget; if it's still running we return anyway and the status endpoint
  // resumes/heals the job on the next poll.
  let finalStatus: string = "queued";
  try {
    const analysisPromise = runAnalysis(job.id).catch((err) => {
      console.error("[analyses] background analysis failed:", err);
      return null;
    });
    const finished = await Promise.race([
      analysisPromise.then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), 25_000)),
    ]);
    finalStatus = finished ? "completed" : "processing";
  } catch (error) {
    console.error("[analyses] analysis dispatch error:", error);
  }

  return NextResponse.json({
    jobId: job.id,
    assetId: asset.id,
    status: finalStatus,
    guestId: effectiveGuestId,
    mediaType,
    remaining: Math.max(0, quotaCheck.remaining - 1),
    ...creditsInfo,
  });
}
