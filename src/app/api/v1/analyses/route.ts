import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { db } from "@/db";
import { assets } from "@/db/schema";
import {
  createAnalysisJob,
  runAnalysis,
  checkMediaQuota,
  spendCreditsForAnalysis,
  getDetailedUsage,
} from "@/lib/services/analysis-service";
import {
  isSupportedType,
  isImageType,
  isVideoType,
  isAudioType,
  getMediaTypeFromMime,
  config,
} from "@/lib/config";
import { getStorage } from "@/lib/storage";
import { validateFileBuffer } from "@/lib/media/file-validator";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value;
    const user = token ? await getSessionUserFromToken(token) : null;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const guestId = formData.get("guestId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Basic MIME / extension check
    if (!isSupportedType(file.type, file.name)) {
      return NextResponse.json(
        {
          error:
            "This file type isn't supported. Please upload JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, or M4A.",
        },
        { status: 400 }
      );
    }

    // Determine media type
    const mediaType = getMediaTypeFromMime(file.type, file.name);

    // Validate file size per media type
    if (mediaType === "image" && file.size > config.limits.maxImageSize) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }
    if (mediaType === "video" && file.size > config.limits.maxVideoSize) {
      return NextResponse.json(
        { error: "Video file is too large. Maximum size is 100 MB." },
        { status: 400 }
      );
    }
    if (mediaType === "audio" && file.size > config.limits.maxAudioSize) {
      return NextResponse.json(
        { error: "Audio file is too large. Maximum size is 50 MB." },
        { status: 400 }
      );
    }

    // Determine owner
    const userId = user?.id || null;
    const effectiveGuestId = userId ? null : (guestId || `guest_${crypto.randomUUID().replace(/-/g, "")}`);

    const owner = { userId, guestId: effectiveGuestId };

    // Check specific media quota: Free Guest (2 Img, 1 Vid, 1 Aud) vs Signed-in (10 Img, 5 Vid, 5 Aud / month)
    const quotaCheck = await checkMediaQuota(owner, mediaType);

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

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content
    const validation = await validateFileBuffer(buffer, file.type, file.name);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid file" },
        { status: 400 }
      );
    }

    // Generate asset ID
    const assetId = crypto.randomUUID();

    // Upload to storage
    const storage = getStorage();
    const storageKey = storage.generateKey(assetId);

    await storage.upload(buffer, storageKey, {
      contentType: validation.detectedMimeType || file.type,
      originalFilename: file.name,
    });

    // Create asset record
    const [asset] = await db
      .insert(assets)
      .values({
        id: assetId,
        userId,
        guestId: effectiveGuestId,
        originalFilename: file.name,
        mimeType: validation.detectedMimeType || file.type,
        fileSize: file.size,
        storageKey,
        storageProvider: storage.name,
        storageStatus: "uploaded",
        detectedMimeType: validation.detectedMimeType,
        isValidFile: true,
      })
      .returning();

    // Create analysis job with specific mediaType tracking
    const job = await createAnalysisJob(asset.id, userId, effectiveGuestId, mediaType);

    // Model 2: deduct pay-as-you-go credits when plan quota is exhausted
    let creditsInfo: { usedCredits: boolean; creditsBalance?: number } = { usedCredits: false };
    if (quotaCheck.usingCredits && userId) {
      const spend = await spendCreditsForAnalysis(userId, mediaType);
      creditsInfo = { usedCredits: true, creditsBalance: spend.newBalance };
    }

    // Run analysis asynchronously
    runAnalysis(job.id).catch((err) => {
      console.error("Background analysis failed:", err);
    });

    return NextResponse.json({
      jobId: job.id,
      assetId: asset.id,
      status: "queued",
      guestId: effectiveGuestId,
      mediaType,
      remaining: Math.max(0, quotaCheck.remaining - 1),
      ...creditsInfo,
    });
  } catch (error) {
    console.error("Analysis creation error:", error);
    return NextResponse.json(
      { error: "Failed to create analysis. Please try again." },
      { status: 500 }
    );
  }
}
