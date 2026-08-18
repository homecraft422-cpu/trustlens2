import { NextRequest, NextResponse } from "next/server";
import { checkClaim } from "@/lib/factcheck/service";
import { applyRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface FactCheckRequest {
  claim: string;
  language?: string;
  region?: string;
}

/**
 * Fact Checker API — real verification against professional fact-checking
 * sources (Google Fact Check Tools API when GOOGLE_FACTCHECK_API_KEY is set)
 * with a Wikipedia fallback. Never returns invented verdicts.
 */
export async function POST(request: NextRequest) {
  // Basic abuse protection (in-memory; per-server-instance).
  const limit = applyRateLimit(request, "factCheck");
  if (!limit.allowed && limit.response) {
    return limit.response;
  }

  let body: FactCheckRequest;
  try {
    body = (await request.json()) as FactCheckRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const claim = (body.claim || "").trim();
  if (!claim) {
    return NextResponse.json({ error: "Claim is required" }, { status: 400 });
  }
  if (claim.length > 5000) {
    return NextResponse.json(
      { error: "Claim is too long. Maximum 5000 characters." },
      { status: 400 }
    );
  }
  if (!/^[a-z]{2,5}$/i.test(body.language || "en")) {
    return NextResponse.json(
      { error: "Language must be a BCP-47 tag like 'en' or 'hi'." },
      { status: 400 }
    );
  }

  try {
    const result = await checkClaim(claim, {
      language: body.language || "en",
      region: body.region || "GLOBAL",
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    console.error("[fact-check] service error:", error);
    return NextResponse.json(
      {
        error: "The fact-check service is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "TrustLens Fact Checker API",
    version: "2.0.0",
    description:
      "Verifies claims against professional fact-checking organisations (Google Fact Check Tools) with a Wikipedia reference fallback. No fabricated verdicts.",
    usage: {
      endpoint: "/api/v1/fact-check",
      method: "POST",
      body: {
        claim: "string (required) - The claim to fact-check (max 5000 chars)",
        language: "string (optional) - Language code (default: en)",
        region: "string (optional) - Region code (default: GLOBAL)",
      },
    },
    configuration: {
      googleFactCheckTools:
        "Set GOOGLE_FACTCHECK_API_KEY for professional ratings (free API key from Google).",
      wikipediaFallback: "Enabled by default; disable with FACTCHECK_WIKIPEDIA_FALLBACK=false",
    },
  });
}
