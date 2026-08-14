/**
 * ============================================
 * TRUSTLENS CORE UTILITIES
 * ============================================
 * Pure functions only. No side effects.
 * Safe to import anywhere.
 * ============================================
 */

import type { ContentType } from "@/types";
import { SUPPORTED_MIMES, FILE_LIMITS } from "@/constants";

// ─── File Helpers ───────────────────────────────

/** Detect content type from file */
export function getContentType(file: File): ContentType {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) return "audio";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "image";
}

/** Check if file is supported */
export function isFileSupported(file: File): boolean {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const validExt = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm", ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"].includes(ext);
  const validMime = Object.values(SUPPORTED_MIMES).flat().includes(file.type as any);
  return validExt || validMime;
}

/** Validate file size */
export function validateFileSize(file: File): string | null {
  const type = getContentType(file);
  if (type === "text" || type === "url") return null;
  const limit = FILE_LIMITS[type as keyof typeof FILE_LIMITS];
  if (!limit) return null;
  if (file.size > limit.maxSize) {
    return `File too large. Max size for ${type} is ${limit.label}.`;
  }
  return null;
}

/** Format bytes to human readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

/** Format seconds to mm:ss */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Score Helpers ──────────────────────────────

/** Get score as percentage string */
export function scorePercent(score: number): string {
  return Math.round(score * 100) + "%";
}

/** Clamp score between 0 and 1 */
export function clampScore(score: number): number {
  return Math.max(0, Math.min(1, score));
}

// ─── ID Helpers ─────────────────────────────────

/** Generate a random ID */
export function generateId(prefix = ""): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${ts}_${rand}` : `${ts}_${rand}`;
}

/** Generate guest ID */
export function getGuestId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("trustlens_guest_id");
  if (!id) {
    id = "guest_" + generateId();
    localStorage.setItem("trustlens_guest_id", id);
  }
  return id;
}

// ─── Date Helpers ───────────────────────────────

/** Format date for display */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time (e.g., "2 hours ago") */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── URL Helpers ────────────────────────────────

/** Extract domain from URL */
export function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/** Validate URL format */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str.startsWith("http") ? str : `https://${str}`);
    return true;
  } catch {
    return false;
  }
}
