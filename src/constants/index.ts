/**
 * ============================================
 * TRUSTLENS CONSTANTS
 * ============================================
 * All magic numbers and strings in one place.
 * NEVER hardcode values in components.
 * ============================================
 */

import type { ContentType, MimeType, FileExtension } from "@/types";

// ─── File Limits ────────────────────────────────
export const FILE_LIMITS = {
  image: { maxSize: 10 * 1024 * 1024, label: "10 MB" },
  video: { maxSize: 100 * 1024 * 1024, label: "100 MB" },
  audio: { maxSize: 50 * 1024 * 1024, label: "50 MB" },
} as const;

// ─── Supported Types ────────────────────────────
export const SUPPORTED_MIMES: Record<ContentType, MimeType[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/m4a"],
  text: [],
  url: [],
};

export const SUPPORTED_EXTENSIONS: FileExtension[] = [
  ".jpg", ".jpeg", ".png", ".webp",
  ".mp4", ".mov", ".webm",
  ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a",
];

export const ACCEPT_STRING = SUPPORTED_EXTENSIONS.join(",");

// ─── API Routes ─────────────────────────────────
export const API_ROUTES = {
  ANALYZE: "/api/v1/mock-analysis",
  FACT_CHECK: "/api/v1/fact-check",
  AUTH_ME: "/api/auth/me",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_SIGNUP: "/api/auth/signup",
  USAGE: "/api/v1/usage",
  REPORTS: "/api/v1/reports",
} as const;

// ─── Polling ────────────────────────────────────
export const POLL_INTERVAL_MS = 1000;
export const POLL_MAX_ATRETRY = 30;

// ─── Verdict Display ────────────────────────────
export const VERDICT_CONFIG = {
  likely_authentic: {
    label: "Likely Authentic",
    emoji: "✅",
    bg: "#dcfce7",
    text: "#166534",
    border: "#86efac",
  },
  likely_ai_generated: {
    label: "Likely AI Generated",
    emoji: "⚠️",
    bg: "#fee2e2",
    text: "#991b1b",
    border: "#fca5a5",
  },
  possibly_manipulated: {
    label: "Possibly Manipulated",
    emoji: "⚠️",
    bg: "#ffedd5",
    text: "#9a3412",
    border: "#fdba74",
  },
  unverified: {
    label: "Unverified",
    emoji: "❓",
    bg: "#f1f5f9",
    text: "#475569",
    border: "#cbd5e1",
  },
  insufficient_evidence: {
    label: "Insufficient Evidence",
    emoji: "❓",
    bg: "#f1f5f9",
    text: "#475569",
    border: "#cbd5e1",
  },
} as const;

// ─── Severity Display ───────────────────────────
export const SEVERITY_CONFIG = {
  low: { bg: "#dcfce7", text: "#166534", label: "Low" },
  medium: { bg: "#ffedd5", text: "#9a3412", label: "Medium" },
  high: { bg: "#fee2e2", text: "#991b1b", label: "High" },
  critical: { bg: "#fef2f2", text: "#7f1d1d", label: "Critical" },
} as const;

// ─── Score Colors ───────────────────────────────
export function getScoreColor(score: number): string {
  if (score < 0.3) return "#16a34a";
  if (score < 0.6) return "#f59e0b";
  return "#dc2626";
}

export function getScoreBg(score: number): string {
  if (score < 0.3) return "#dcfce7";
  if (score < 0.6) return "#fef3c7";
  return "#fee2e2";
}

// ─── Tools Config ───────────────────────────────
export const TOOLS_LIST = [
  { href: "/analyze", label: "Image & Video Check", icon: "🖼️", desc: "Verify images and videos" },
  { href: "/tools/audio-check", label: "Audio Analysis", icon: "🎵", desc: "Detect AI audio & cloning" },
  { href: "/tools/fact-check", label: "Fact Checker", icon: "✅", desc: "Verify claims & headlines" },
  { href: "/tools/social-check", label: "Social Media Check", icon: "📱", desc: "Verify social posts" },
  { href: "/tools/url-check", label: "URL Content Check", icon: "🌐", desc: "Analyze web pages" },
  { href: "/tools/batch-process", label: "Batch Processing", icon: "📦", desc: "Analyze multiple files" },
  { href: "/tools/content-fingerprint", label: "Content Fingerprint", icon: "🔍", desc: "Track content origin" },
  { href: "/dashboard", label: "Analytics Dashboard", icon: "📊", desc: "View insights & trends" },
] as const;
