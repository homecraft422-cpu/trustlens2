/**
 * Next.js Edge Middleware — Security, privacy & crawl control
 *
 * Responsibilities (previously DISABLED — re-enabled):
 *   1. Security headers on every response (CSP, HSTS, X-Frame-Options,
 *      X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
 *   2. `noindex` meta on private/auth pages so Google never indexes
 *      dashboards, admin, session pages or API responses.
 *   3. Cheap path-level rate limiting for sensitive API routes
 *      (in-memory; a shared Redis/Upstash store can be dropped in later).
 *   4. Block obviously hostile requests (path traversal, PHP shells, etc.).
 *
 * CSP note: the sandbox/preview and the production site are served over
 * https, and the preview host is iframed by the Arena preview environment —
 * so `frame-ancestors` explicitly allows `https://*.e2b.app` and HTTPS.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Security headers ──────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(self), microphone=(self), geolocation=(), browsing-topics=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "on",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    // Next.js hydration uses inline scripts; ad networks inject their own.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.effectivecpmnetwork.com https://*.highperformanceformat.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://*.e2b.app",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "media-src 'self' blob: data: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https://*.e2b.app https://*.effectivecpmnetwork.com https://*.highperformanceformat.com https://*.googlesyndication.com https://googleads.g.doubleclick.net",
    "frame-ancestors 'self' https://*.e2b.app https:",
    "upgrade-insecure-requests",
  ].join("; "),
};

// ─── Routes that must never be indexed ─────────────────────────────────────

const NOINDEX_PREFIXES = [
  "/admin",
  "/dashboard",
  "/login",
  "/signup",
  "/settings",
  "/reports",
  "/result",
  "/test",
  "/api/",
];

const NOINDEX_EXACT = ["/report"];

// ─── Path-level rate limiting (in-memory, best-effort) ────────────────────

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = {
  auth: 10, // /api/auth/*
  upload: 8, // /api/v1/analyses
  generic: 120, // everything else under /api
} as const;

const hitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimited(request: NextRequest): boolean {
  const url = request.nextUrl.pathname;
  if (!url.startsWith("/api/")) return false;

  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = (forwarded.split(",")[0] || "unknown").trim();
  const keyPrefix = url.startsWith("/api/auth/")
    ? "auth"
    : url.startsWith("/api/v1/analyses")
      ? "upload"
      : "generic";
  const max = RATE_MAX[keyPrefix as keyof typeof RATE_MAX] ?? RATE_MAX.generic;

  const now = Date.now();
  const record = hitStore.get(keyPrefix + ":" + ip);
  if (!record || now > record.resetAt) {
    hitStore.set(keyPrefix + ":" + ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  record.count += 1;
  if (record.count > max) {
    // Prevent unbounded growth of the map.
    if (hitStore.size > 20_000) hitStore.clear();
    return true;
  }
  return false;
}

// ─── Hostile request patterns ──────────────────────────────────────────────

const HOSTILE_PATTERNS = [
  /\.\.\/\.\./, // path traversal
  /\.(php|asp|aspx|jsp|cgi|sh|bat)(\?|$)/i, // script shells
  /(union\s+select|select\s+.*\s+from|insert\s+into)/i, // naive SQLi
  /<script[\s>]/i, // reflected XSS in path
];

function looksHostile(request: NextRequest): boolean {
  const path = request.nextUrl.pathname;
  return HOSTILE_PATTERNS.some((re) => re.test(path));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block hostile requests early.
  if (looksHostile(request)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // Rate-limit API traffic.
  if (rateLimited(request)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const response = NextResponse.next();

  // Security headers on everything (HTML pages + API responses).
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Suppress framework-identifying header.
  response.headers.delete("x-powered-by");

  // noindex for private/auth/API routes.
  const shouldNoindex =
    NOINDEX_PREFIXES.some((p) => pathname.startsWith(p)) ||
    NOINDEX_EXACT.some((p) => pathname === p);
  if (shouldNoindex && pathname !== "/api/health") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  // Run on everything except static assets (Next serves those straight from
  // the CDN cache, and middleware would only add latency).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|css|js|woff2?)$).*)",
  ],
};
