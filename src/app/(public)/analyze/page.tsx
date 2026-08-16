"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import UploadDropzone from "@/components/UploadDropzone";
import UsageMeter, { type QuotaItem } from "@/components/UsageMeter";
import {
  Shield,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Image,
  Video,
  Music,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react";

interface Quotas {
  image: QuotaItem;
  video: QuotaItem;
  audio: QuotaItem;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("trustlens_guest_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("trustlens_guest_id", id);
  }
  return id;
}

/** Safe, user-facing explanations for internal failure codes. */
const FAILURE_MESSAGES: Record<string, string> = {
  media_processing_failed:
    "We couldn't read this file's contents. It may be corrupted or use an unsupported codec.",
  no_provider_results:
    "No detection engine was able to analyse this file. Please try again in a moment.",
  analysis_error:
    "Something went wrong while analysing this file. Please try again.",
};

function friendlyFailureMessage(code: string | undefined, fallback: string): string {
  if (code && FAILURE_MESSAGES[code]) return FAILURE_MESSAGES[code];
  return fallback;
}

/**
 * Cache a finished report in sessionStorage, keyed by job id. The upload API
 * embeds the full report in its response; saving it here lets the result page
 * render immediately even when the job row lives on another server instance
 * (the per-instance fallback store used when PostgreSQL is not configured).
 * Best-effort: storage being unavailable must never break the flow.
 */
function cacheReport(jobId: string, report: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`trustlens_result_${jobId}`, JSON.stringify(report));
  } catch {
    // Storage full/blocked — the result page falls back to the API.
  }
}

export default function AnalyzePage() {
  const router = useRouter();
  const [quotas, setQuotas] = useState<Quotas | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaExceededModal, setQuotaExceededModal] = useState<{
    mediaType: "image" | "video" | "audio";
    message: string;
    isGuest: boolean;
  } | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const guestId = getGuestId();
      const res = await fetch(`/api/v1/usage?guestId=${encodeURIComponent(guestId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.limits) {
          setQuotas(data.limits);
        }
        setIsAuthenticated(!!data.isAuthenticated);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Load quota once on mount. `fetchUsage` only calls `setState` after its
  // awaited fetch resolves, so this is an async data-load (no synchronous
  // setState-in-effect cascade); the compiler rule is a false positive here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsage();
  }, [fetchUsage]);

  const handleFileSelected = async (file: File) => {
    setError(null);
    setAnalysisStatus("Uploading file...");
    setIsUploading(true);

    const guestId = getGuestId();

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (!isAuthenticated && guestId) {
        formData.append("guestId", guestId);
      }

      // Submit to analysis API. Uploads (esp. video) can be slow — give them
      // a generous ceiling instead of letting the browser hang forever.
      const controller = new AbortController();
      const uploadTimeout = setTimeout(() => controller.abort(), 180_000);

      let res: Response;
      try {
        res = await fetch("/api/v1/analyses", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (networkError: any) {
        clearTimeout(uploadTimeout);
        if (networkError?.name === "AbortError") {
          throw new Error(
            "The upload took too long and was cancelled. Try a smaller or shorter file."
          );
        }
        throw new Error(
          "We couldn't reach the server. Check your connection and try again."
        );
      }
      clearTimeout(uploadTimeout);

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error(
            data.error ||
              "This file is too large for the server. Try a shorter or compressed version."
          );
        }
        if (res.status === 429) {
          const mediaType = data.mediaType || "image";
          setQuotaExceededModal({
            mediaType,
            message: data.error || "Analysis limit reached.",
            isGuest: !isAuthenticated,
          });
          setIsUploading(false);
          setAnalysisStatus(null);
          return;
        }
        const detail = data.detail && data.detail !== data.error ? ` (${data.detail})` : "";
        throw new Error((data.error || "Failed to start analysis") + detail);
      }

      const jobId = data.jobId;

      if (!jobId) {
        throw new Error("The server didn't return an analysis ID. Please try again.");
      }

      // If the analysis already finished and failed, show the real reason
      // instead of redirecting to a report that does not exist.
      if (data.status === "failed") {
        throw new Error(
          friendlyFailureMessage(
            data.errorCode,
            data.errorMessage ||
              "Analysis processing failed. Please try again with a different file."
          )
        );
      }

      // The API now waits for the analysis when it can, so this is often
      // already done by the time we get here. The response carries the
      // finished report; cache it so the result page can render it even if a
      // later request lands on a different server instance.
      if (data.status === "completed") {
        setAnalysisStatus("Finalizing trust report...");
        if (data.result) {
          cacheReport(jobId, data.result);
        }
        fetchUsage();
        router.push(`/result/${jobId}`);
        return;
      }

      setAnalysisStatus("Validating & running AI detection...");

      // Poll job status until completed
      let attempts = 0;
      const maxAttempts = 90; // up to ~3 minutes for long videos

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempts < 20 ? 1000 : 2000));
        attempts++;

        let statusRes: Response;
        try {
          statusRes = await fetch(
            `/api/v1/analyses/${jobId}${!isAuthenticated && guestId ? `?guestId=${encodeURIComponent(guestId)}` : ""}`,
            { cache: "no-store" }
          );
        } catch {
          continue; // transient network blip — keep polling
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === "completed") {
            setAnalysisStatus("Finalizing trust report...");
            // Refresh usage counts
            fetchUsage();
            // Redirect to result page
            router.push(`/result/${jobId}`);
            return;
          } else if (statusData.status === "failed") {
            throw new Error(
              statusData.errorMessage ||
                statusData.errorCode ||
                "Analysis processing failed. Please try again with a different file."
            );
          } else if (statusData.status === "analyzing") {
            setAnalysisStatus("Deep scanning across AI detection models...");
          } else if (statusData.status === "finalizing") {
            setAnalysisStatus("Finalizing trust report...");
          }
        }
      }

      // If timed out polling, redirect anyway
      router.push(`/result/${jobId}`);
    } catch (err: any) {
      console.error("Analysis submission error:", err);
      setError(err.message || "Something went wrong during analysis.");
      setIsUploading(false);
      setAnalysisStatus(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-brand-100">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Verify Content Authenticity
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Upload an image, video, or audio file to detect AI generation, synthetic deepfakes, and manipulation.
          </p>
        </div>

        {/* Quota Overview Bar */}
        {quotas && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isAuthenticated ? "Monthly Remaining:" : "Free Tier Remaining:"}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                    quotas.image.remaining > 0 ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Images: {quotas.image.remaining}/{quotas.image.limit}</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                    quotas.video.remaining > 0 ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Videos: {quotas.video.remaining}/{quotas.video.limit}</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                    quotas.audio.remaining > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Audio: {quotas.audio.remaining}/{quotas.audio.limit}</span>
                </div>

                {!isAuthenticated && (
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 ml-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Get 10+ scans →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Dropzone Component */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm mb-8">
          <UploadDropzone
            onFileSelected={handleFileSelected}
            isUploading={isUploading}
            error={error}
          />

          {isUploading && analysisStatus && (
            <div className="mt-6 p-4 rounded-2xl bg-brand-50 border border-brand-100 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-brand-600 animate-spin shrink-0" />
              <div className="text-sm font-semibold text-brand-900">{analysisStatus}</div>
            </div>
          )}
        </div>

        {/* Quota Rules Explainer Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-4">How Verification Limits Work</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-500">Guest User (No Account)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">10 Img • 5 Vid • 5 Aud</span>
              </div>
              <p className="text-xs text-slate-600">
                You can try TrustLens immediately without signing in. Once you use your guest credits, create a free account to unlock monthly credits.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-emerald-800">Signed-In Free Account</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">10 Img • 5 Vid • 5 Aud / mo</span>
              </div>
              <p className="text-xs text-emerald-900">
                Sign in to receive recurring monthly quotas that automatically reset on the 1st of every month, plus full report history.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Quota Exceeded Modal */}
      {quotaExceededModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              {quotaExceededModal.isGuest ? "Free Guest Limit Reached" : "Monthly Limit Reached"}
            </h3>

            <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed">
              {quotaExceededModal.message}
            </p>

            {quotaExceededModal.isGuest ? (
              <div className="space-y-3">
                <Link
                  href="/signup?redirect=/analyze"
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Sign Up Free (Get 10 Images + 5 Videos + 5 Audios)
                </Link>
                <Link
                  href="/login?redirect=/analyze"
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-4 rounded-xl font-semibold text-sm transition-colors"
                >
                  Already have an account? Sign In
                </Link>
                <button
                  onClick={() => setQuotaExceededModal(null)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-2 cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-center">
                  Your monthly quota will reset automatically on the 1st of next month.
                </div>
                <button
                  onClick={() => setQuotaExceededModal(null)}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Got It
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
