import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { db } from "@/db";
import { analysisJobs, users } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { config } from "@/lib/config";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [totalJobs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analysisJobs);

  const [completedJobs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, "completed"));

  const [failedJobs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analysisJobs)
    .where(eq(analysisJobs.status, "failed"));

  const [totalUsers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);

  // Get recent jobs without exposing sensitive data
  const recentJobs = await db
    .select({
      id: analysisJobs.id,
      status: analysisJobs.status,
      createdAt: analysisJobs.createdAt,
      errorCode: analysisJobs.errorCode,
    })
    .from(analysisJobs)
    .orderBy(desc(analysisJobs.createdAt))
    .limit(20);

  return NextResponse.json({
    stats: {
      totalJobs: totalJobs.count,
      completedJobs: completedJobs.count,
      failedJobs: failedJobs.count,
      totalUsers: totalUsers.count,
    },
    detectionMode: config.detection.mode,
    recentJobs,
  });
}
