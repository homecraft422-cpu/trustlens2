/**
 * ============================================
 * TRUSTLENS CORE TYPES
 * ============================================
 * Single source of truth for all types.
 * NEVER delete this file. Only ADD new types.
 * ============================================
 */

// ─── Content Types ──────────────────────────────
export type ContentType = "image" | "video" | "audio" | "text" | "url";

export type FileExtension =
  | ".jpg" | ".jpeg" | ".png" | ".webp"
  | ".mp4" | ".mov" | ".webm"
  | ".mp3" | ".wav" | ".ogg" | ".flac" | ".aac" | ".m4a";

export type MimeType =
  | "image/jpeg" | "image/png" | "image/webp"
  | "video/mp4" | "video/quicktime" | "video/webm"
  | "audio/mpeg" | "audio/wav" | "audio/ogg"
  | "audio/flac" | "audio/aac" | "audio/m4a";

// ─── Analysis Types ─────────────────────────────
export type Verdict =
  | "likely_authentic"
  | "likely_ai_generated"
  | "possibly_manipulated"
  | "unverified"
  | "insufficient_evidence";

export type Severity = "low" | "medium" | "high" | "critical";

export type AnalysisStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

// ─── Data Structures ────────────────────────────
export interface Signal {
  id: string;
  category: string;
  signalType: string;
  score: number | null;
  severity: Severity;
  title: string;
  description: string;
  source: string;
}

export interface AnalysisResult {
  id: string;
  verdict: Verdict;
  aiInvolvementScore: number;
  manipulationScore: number;
  confidenceScore: number;
  summary: string;
  signals: Signal[];
  metadata: AnalysisMetadata;
}

export interface AnalysisMetadata {
  filename: string;
  mimeType: string;
  fileSize: number;
  analyzedAt: string;
  processingTimeMs: number;
  isMock: boolean;
}

// ─── Upload Types ───────────────────────────────
export interface UploadState {
  file: File | null;
  preview: string;
  status: AnalysisStatus;
  progress: number;
  error: string;
  result: AnalysisResult | null;
}

// ─── API Types ──────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ─── User Types ─────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

// ─── Report Types ───────────────────────────────
export interface Report {
  id: string;
  publicId: string;
  isPublic: boolean;
  createdAt: string;
}
