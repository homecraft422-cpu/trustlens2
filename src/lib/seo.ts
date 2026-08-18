/**
 * Central SEO helpers — site URL, canonical base, public route list.
 * Used by sitemap.ts, robots.ts, layout metadata and JSON-LD blocks so the
 * canonical domain never drifts between files.
 */

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://trustlens.ai"
  ).replace(/\/$/, "");
}

export const SITE_NAME = "TrustLens";

export const SITE_DESCRIPTION =
  "Free AI content detection & verification: analyze images, videos, audio, claims and links for AI generation, deepfakes and manipulation with transparent evidence and confidence scores.";

/** Public, indexable routes (excluding auth/dashboard/admin/API). */
export const PUBLIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/analyze", priority: 0.95, changeFrequency: "weekly" as const },
  { path: "/tools/audio-check", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/tools/fact-check", priority: 0.85, changeFrequency: "monthly" as const },
  { path: "/tools/url-check", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/tools/social-check", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/tools/batch-process", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/tools/content-fingerprint", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/acceptable-use", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/data-rights", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/security", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/accessibility", priority: 0.3, changeFrequency: "yearly" as const },
] as const;
