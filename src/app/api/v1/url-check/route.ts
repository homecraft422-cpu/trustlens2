import { NextRequest, NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/urlcheck/service";
import { applyRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * URL Content Check API — real server-side analysis of any public URL.
 * SSRF-protected, deterministic, evidence-based.
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
    const result = await analyzeUrl(url);
    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const messages: Record<string, string> = {
      INVALID_URL: "That doesn't look like a valid URL. Include the full address, e.g. https://example.com/page.",
      UNSUPPORTED_PROTOCOL: "Only http:// and https:// URLs can be analyzed.",
      INVALID_DOMAIN: "That URL's domain doesn't look valid.",
      BLOCKED_LOCAL: "We can't analyze local or internal addresses.",
      BLOCKED_PRIVATE: "This URL resolves to a private network address and cannot be analyzed.",
    };
    return NextResponse.json(
      { error: messages[code] || "The URL could not be analyzed. Please try another one." },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "TrustLens URL Content Check API",
    version: "1.0.0",
    description:
      "Fetches a public URL server-side and analyzes its metadata, structure, transport security, and domain registration (RDAP). SSRF-protected.",
    usage: { endpoint: "/api/v1/url-check", method: "POST", body: { url: "string (required)" } },
  });
}
