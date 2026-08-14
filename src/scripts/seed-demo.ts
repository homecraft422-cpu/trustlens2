import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createHash } from "crypto";
import {
  users,
  assets,
  analysisJobs,
  analysisResults,
  analysisSignals,
  reports,
} from "../db/schema";
import { nanoid } from "nanoid";

interface DemoSignal {
  category: string;
  signalType: string;
  score: number;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  timestampStart?: number;
  timestampEnd?: number;
}

interface Demo {
  filename: string;
  mimeType: string;
  fileSize: number;
  duration: number | null;
  verdict: "likely_authentic" | "possibly_manipulated" | "likely_ai_generated" | "unverified" | "insufficient_evidence";
  aiScore: number;
  manipScore: number;
  confidenceScore: number;
  classificationLevel: "level_0" | "level_1" | "level_2" | "level_3" | "level_4" | "level_5";
  provenanceStatus: "verified" | "not_verified" | "unavailable" | "detected_unverified";
  summary: string;
  signals: DemoSignal[];
}

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const authSecret =
    process.env.AUTH_SECRET || "trustlens-dev-secret-change-in-production";

  console.log("Seeding database...");

  // Create admin user
  const passwordHash = createHash("sha256")
    .update("admin123" + authSecret)
    .digest("hex");

  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@trustlens.dev",
      name: "Admin",
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();

  const userId = adminUser?.id || null;
  console.log("Created admin user:", userId || "(already exists)");

  // Demo reports
  const demos: Demo[] = [
    {
      filename: "family-photo-2024.jpg",
      mimeType: "image/jpeg",
      fileSize: 2400000,
      duration: null,
      verdict: "likely_authentic",
      aiScore: 8,
      manipScore: 5,
      confidenceScore: 82,
      classificationLevel: "level_0",
      provenanceStatus: "not_verified",
      summary:
        "Analysis suggests the content is likely authentic with no strong evidence of AI generation or manipulation.",
      signals: [
        {
          category: "ai_detection",
          signalType: "pattern_analysis",
          score: 0.08,
          severity: "info",
          title: "No strong AI-generation signals",
          description:
            "Pattern analysis did not detect significant AI-generation artifacts.",
        },
        {
          category: "metadata",
          signalType: "exif_analysis",
          score: 0.12,
          severity: "info",
          title: "EXIF metadata present",
          description: "Standard camera metadata was found in the file.",
        },
      ],
    },
    {
      filename: "portrait-studio.png",
      mimeType: "image/png",
      fileSize: 4800000,
      duration: null,
      verdict: "likely_ai_generated",
      aiScore: 89,
      manipScore: 12,
      confidenceScore: 78,
      classificationLevel: "level_5",
      provenanceStatus: "unavailable",
      summary: "Analysis detected strong signals consistent with AI-generated content.",
      signals: [
        {
          category: "ai_detection",
          signalType: "generative_pattern",
          score: 0.91,
          severity: "high",
          title: "AI-generation signals detected",
          description:
            "Visual patterns are consistent with known AI image generation models.",
        },
        {
          category: "metadata",
          signalType: "exif_analysis",
          score: 0.65,
          severity: "medium",
          title: "Missing camera metadata",
          description:
            "No standard camera EXIF data was found.",
        },
      ],
    },
    {
      filename: "news-clip.mp4",
      mimeType: "video/mp4",
      fileSize: 28000000,
      duration: 47,
      verdict: "possibly_manipulated",
      aiScore: 42,
      manipScore: 71,
      confidenceScore: 65,
      classificationLevel: "level_2",
      provenanceStatus: "not_verified",
      summary:
        "Analysis detected signals that suggest the content may have been manipulated.",
      signals: [
        {
          category: "manipulation",
          signalType: "splice_detection",
          score: 0.78,
          severity: "high",
          title: "Possible visual manipulation",
          description: "Some frames show signs of alteration.",
          timestampStart: 15,
          timestampEnd: 35,
        },
        {
          category: "audio",
          signalType: "voice_analysis",
          score: 0.22,
          severity: "info",
          title: "Natural speech patterns",
          description: "Audio appears to contain natural speech.",
        },
      ],
    },
  ];

  for (const demo of demos) {
    console.log(`Creating demo: ${demo.filename}`);

    const [asset] = await db
      .insert(assets)
      .values({
        userId,
        originalFilename: demo.filename,
        mimeType: demo.mimeType,
        fileSize: demo.fileSize,
        storageKey: `demo/${demo.filename}`,
        storageProvider: "demo",
        storageStatus: "verified",
        metadataStatus: "completed",
        duration: demo.duration,
        isValidFile: true,
      })
      .returning();

    const [job] = await db
      .insert(analysisJobs)
      .values({
        assetId: asset.id,
        userId,
        status: "completed",
        jobType: "full_analysis",
        completedAt: new Date(),
      })
      .returning();

    const [result] = await db
      .insert(analysisResults)
      .values({
        analysisJobId: job.id,
        verdict: demo.verdict,
        aiInvolvementScore: demo.aiScore,
        manipulationScore: demo.manipScore,
        confidenceScore: demo.confidenceScore,
        classificationLevel: demo.classificationLevel,
        provenanceStatus: demo.provenanceStatus,
        summary: demo.summary,
      })
      .returning();

    const signalValues = demo.signals.map((s) => ({
      analysisResultId: result.id,
      category: s.category,
      signalType: s.signalType,
      score: s.score,
      severity: s.severity,
      title: s.title,
      description: s.description,
      timestampStart: s.timestampStart ?? null,
      timestampEnd: s.timestampEnd ?? null,
      source: "demo_provider",
    }));

    await db.insert(analysisSignals).values(signalValues);

    await db.insert(reports).values({
      analysisResultId: result.id,
      publicId: nanoid(12),
      isPublic: true,
    });
  }

  console.log("✅ Demo data seeded successfully");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
