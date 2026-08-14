import { NextRequest, NextResponse } from "next/server";
import {
  consumeMagicLinkToken,
  createSession,
  getOrCreateUserByEmail,
  markEmailVerified,
  normalizeEmail,
} from "@/lib/auth";
import { config } from "@/lib/config";

function buildErrorUrl(reason: string) {
  const url = new URL("/login", config.app.url);
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
  try {
    const requestUrl = new URL(req.url);
    const token = requestUrl.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.redirect(buildErrorUrl("missing"), 303);
    }

    const record = await consumeMagicLinkToken(token);
    if (!record) {
      return NextResponse.redirect(buildErrorUrl("invalid"), 303);
    }

    const email = normalizeEmail(record.email);
    const user = await getOrCreateUserByEmail(email);
    if (user && !user.emailVerifiedAt) {
      await markEmailVerified(user.id);
    }

    const session = await createSession(user.id);
    const response = NextResponse.redirect(new URL(safeRedirectPath(record.redirectPath), config.app.url), 303);

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
    return NextResponse.redirect(buildErrorUrl("server"), 303);
  }
}
