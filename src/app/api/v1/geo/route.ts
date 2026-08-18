import { NextResponse } from "next/server";
import { isEeaCountry } from "@/lib/ads";

export const dynamic = "force-dynamic";

/**
 * Lightweight country detection for cookie-consent decisions.
 * Uses the country headers the hosting proxy/edge already attaches
 * (Cloudflare: cf-ipcountry, Vercel/Next: x-vercel-ip-country).
 * No third-party API call, no user tracking.
 */
export async function GET(request: Request) {
  const country =
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-country") ||
    "";

  return NextResponse.json(
    {
      country: country || null,
      inEea: isEeaCountry(country),
    },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
