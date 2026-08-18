import { NextRequest, NextResponse } from "next/server";
import { analyzeSocialPost } from "@/lib/socialcheck/service";
import { applyRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Social Media Post Check API — real platform detection, YouTube oEmbed
 * metadata, and server-side page/domain analysis. No fabricated metrics.
 */
export async function POST(request: NextRequest) {
  const limit = applyRateLimit(request, "factCheck");
  if (!limit.allowed && limit.response) {
    return limit.response;
  }

  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = (body.url || "").trim();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  if (url.length > 2048) {
    return NextResponse.json({ error: "URL is too long (max 2048 characters)." }, { status: 400 });
  }

  try {
    const result = await analyzeSocialPost(url);
    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "INVALID_URL") {
      return NextResponse.json(
        { error: "That doesn't look like a valid URL. Include the full address, e.g. https://instagram.com/p/…" },
        { status: 400 }
      );
    }
    console.error("[social-check] error:", error);
    return NextResponse.json(
      { error: "The link could not be analyzed. Please try again shortly." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "TrustLens Social Media Post Check API",
    version: "1.0.0",
    description:
      "Detects the social platform, fetches real YouTube oEmbed metadata where applicable, and analyzes the public page/domain. Never fabricates engagement or account metrics.",
    usage: { endpoint: "/api/v1/social-check", method: "POST", body: { url: "string (required)" } },
  });
}
