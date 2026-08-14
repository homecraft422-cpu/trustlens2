import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { db } from "@/db";
import { assets } from "@/db/schema";
import {
  createAnalysisJob,
  runAnalysis,
  getUsageCount,
} from "@/lib/services/analysis-service";
import { isSupportedType, isImageType, isVideoType, config } from "@/lib/config";
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

    // Basic MIME type check (will be verified by magic bytes later)
    if (!isSupportedType(file.type)) {
      return NextResponse.json(
        {
          error:
            "This file type isn't supported. Please upload JPG, PNG, WEBP, MP4, MOV, or WEBM.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (isImageType(file.type) && file.size > config.limits.maxImageSize) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }
    if (isVideoType(file.type) && file.size > config.limits.maxVideoSize) {
      return NextResponse.json(
        { error: "Video file is too large. Maximum size is 100 MB." },
        { status: 400 }
      );
    }

    // Determine owner
    const userId = user?.id || null;
    const effectiveGuestId = userId ? null : guestId;

    // Validate guest ID format
    if (!userId && effectiveGuestId && !effectiveGuestId.startsWith("guest_")) {
      return NextResponse.json(
        { error: "Invalid guest identifier" },
        { status: 400 }
      );
    }

    // Check usage limits
    const owner = { userId, guestId: effectiveGuestId };
    const usageCount = await getUsageCount(owner);
    const limit = userId ? config.limits.user : config.limits.guest;

    if (usageCount >= limit) {
      if (!userId) {
        return NextResponse.json(
          {
            error: "You've used all your free checks. Create an account to continue.",
            code: "LIMIT_REACHED_GUEST",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "You've reached your analysis limit.", code: "LIMIT_REACHED" },
        { status: 429 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content (magic bytes)
    const validation = await validateFileBuffer(buffer, file.type, file.name);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid file" },
        { status: 400 }
      );
    }

    // Generate asset ID first (used in storage key)
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
        mimeType: file.type,
        fileSize: file.size,
        storageKey,
        storageProvider: storage.name,
        storageStatus: "uploaded",
        detectedMimeType: validation.detectedMimeType,
        isValidFile: true,
      })
      .returning();

    // Create analysis job
    const job = await createAnalysisJob(asset.id, userId, effectiveGuestId);

    // Run analysis asynchronously
    runAnalysis(job.id).catch((err) => {
      console.error("Background analysis failed:", err);
    });

    return NextResponse.json({
      jobId: job.id,
      assetId: asset.id,
      status: "queued",
    });
  } catch (error) {
    console.error("Analysis creation error:", error);
    return NextResponse.json(
      { error: "Failed to create analysis. Please try again." },
      { status: 500 }
    );
  }
}
