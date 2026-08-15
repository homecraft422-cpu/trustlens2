/**
 * ============================================
 * TRUSTLENS CORE HOOKS
 * ============================================
 * Reusable React hooks. Import from @/hooks.
 * ============================================
 */

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from "react";
import type { AnalysisResult, AnalysisStatus } from "@/types";
import { API_ROUTES, POLL_INTERVAL_MS, POLL_MAX_ATRETRY } from "@/constants";
import { getGuestId } from "@/lib/core";

// ─── useFileUpload ──────────────────────────────
export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const selectFile = useCallback((f: File) => {
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
    setError("");
    setResult(null);
    setStatus("idle");
    setProgress(0);
  }, []);

  const clearFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setError("");
    setResult(null);
    setStatus("idle");
    setProgress(0);
  }, [preview]);

  const analyze = useCallback(async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(10);
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("guestId", getGuestId());

      setProgress(30);
      const res = await fetch(API_ROUTES.ANALYZE, { method: "POST", body: fd });
      setProgress(50);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const { id } = await res.json();
      setStatus("processing");
      setProgress(70);

      // Poll for result
      let attempts = 0;
      while (attempts < POLL_MAX_ATRETRY) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        attempts++;

        const resultRes = await fetch(`${API_ROUTES.ANALYZE}?id=${id}`);
        if (resultRes.ok) {
          const data = await resultRes.json();
          if (data.verdict) {
            setProgress(100);
            setStatus("completed");
            setResult(data);
            return;
          }
        }
      }
      throw new Error("Analysis timed out");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setStatus("failed");
    }
  }, [file]);

  return { file, preview, status, progress, error, result, selectFile, clearFile, analyze };
}

// ─── usePolling ─────────────────────────────────
export function usePolling(url: string, interval = 3000) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setLoading(true);
    const poll = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch {}
      setLoading(false);
    };
    poll();
    timerRef.current = setInterval(poll, interval);
  }, [url, interval]);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { data, loading, start, stop };
}

// ─── useClipboard ───────────────────────────────
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(ok);
      if (ok) setTimeout(() => setCopied(false), 2000);
      return ok;
    }
  }, []);

  return { copied, copy };
}

// ─── useMounted ─────────────────────────────────
/**
 * Only render after mount (prevents hydration mismatch).
 *
 * Implemented with `useSyncExternalStore` so we never call `setState`
 * synchronously inside an effect: on the server we always report `false`
 * (no subscribers), and on the client we report `true` as soon as hydration
 * subscribes. This is the canonical hydration-safe "am I mounted?" hook.
 */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {}, // subscribe → no-op; value never changes after mount
    () => true, // client snapshot
    () => false // server snapshot
  );
}
