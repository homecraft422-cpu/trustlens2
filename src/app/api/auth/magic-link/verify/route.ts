import { NextRequest, NextResponse } from "next/server";
import {
  consumeMagicLinkToken,
  createSession,
  getOrCreateUserByEmail,
  markEmailVerified,
  normalizeEmail,
} from "@/lib/auth";
import { config } from "@/lib/config";
import { resolveBaseUrl } from "@/lib/magic-link-helpers";

function buildErrorUrl(baseUrl: string, reason: string) {
  const url = new URL("/login", baseUrl);
  url.searchParams.set("magic", "error");
  url.searchParams.set("reason", reason);
  return url;
}

function safeRedirectPath(path?: string | null) {
  if (!path) return "/dashboard";
  if (path.startsWith("/") && !path.startsWith("//")) return path;
  return "/dashboard";
}

export async function GET(req: NextRequest) {
  // Redirect back to the host the link was actually opened on. Hardcoding
  // config.app.url sent users on preview/custom domains to localhost, so the
  // magic link appeared to do nothing.
  const baseUrl = resolveBaseUrl(req, { preferRequestHost: true });

  try {
    const requestUrl = new URL(req.url);
    const token = requestUrl.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.redirect(buildErrorUrl(baseUrl, "missing"), 303);
    }

    const record = await consumeMagicLinkToken(token);
    if (!record) {
      return NextResponse.redirect(buildErrorUrl(baseUrl, "invalid"), 303);
    }

    const email = normalizeEmail(record.email);
    const user = await getOrCreateUserByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await markEmailVerified(user.id);
    }

    const session = await createSession(user.id);
    const response = NextResponse.redirect(new URL(safeRedirectPath(record.redirectPath), baseUrl), 303);

    response.cookies.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
      maxAge: Math.floor(config.auth.sessionDuration / 1000),
      priority: "high",
    });

    return response;
  } catch (error) {
    console.error("Magic link verify error:", error);
    return NextResponse.redirect(buildErrorUrl(baseUrl, "server"), 303);
  }
}
