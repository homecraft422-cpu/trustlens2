"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    setResult(null);
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview("");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setError("");
      setResult(null);
      setFile(f);
      if (f.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(f));
      } else {
        setPreview("");
      }
    }
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/v1/mock-analysis", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();

      if (data.id) {
        await new Promise(r => setTimeout(r, 2000));
        const resultRes = await fetch(`/api/v1/mock-analysis?id=${data.id}`);
        if (resultRes.ok) {
          const resultData = await resultRes.json();
          setResult(resultData);
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview("");
    setError("");
    setResult(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  const verdictColors: Record<string, { bg: string; text: string; label: string }> = {
    likely_authentic: { bg: "#dcfce7", text: "#166534", label: "Likely Authentic" },
    likely_ai_generated: { bg: "#fee2e2", text: "#991b1b", label: "Likely AI Generated" },
    possibly_manipulated: { bg: "#ffedd5", text: "#9a3412", label: "Possibly Manipulated" },
  };

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 768, margin: "0 auto", width: "100%", padding: "32px 16px" }}>
        <Link href="/" style={{ color: "#64748b", fontSize: 14, marginBottom: 24, display: "inline-block" }}>
          ← Back to Tools
        </Link>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🛡️</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Content Verification</h1>
          <p style={{ color: "#64748b" }}>Upload image, video, or audio to check for AI generation</p>
        </div>

        {/* Upload Box */}
        {!file ? (
          <div
            style={{
              background: "white",
              border: "2px dashed #cbd5e1",
              borderRadius: 16,
              padding: "48px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInput.current?.click()}
          >
            <input
              ref={fileInput}
              type="file"
              style={{ display: "none" }}
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a"
              onChange={onSelect}
            />
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#334155", marginBottom: 8 }}>
              Click or drag file here
            </p>
            <p style={{ fontSize: 14, color: "#94a3b8" }}>
              JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, M4A
            </p>
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
            {/* File info */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              {preview ? (
                <img src={preview} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  🎵
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                <p style={{ fontSize: 14, color: "#94a3b8" }}>{formatSize(file.size)}</p>
              </div>
              <button onClick={reset} style={{ padding: 8, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>
                ✕
              </button>
            </div>

            {/* Audio preview */}
            {file.type.startsWith("audio/") && (
              <audio src={URL.createObjectURL(file)} controls style={{ width: "100%", marginBottom: 16 }} />
            )}

            {/* Analyze button */}
            <button
              onClick={analyze}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: loading ? "#94a3b8" : "#4c6ef5",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? "⏳ Analyzing..." : "⚡ Analyze Now"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, color: "#991b1b" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Verdict */}
            {(() => {
              const v = verdictColors[result.verdict] || verdictColors.possibly_manipulated;
              return (
                <div style={{ background: v.bg, border: "1px solid", borderColor: v.bg, borderRadius: 16, padding: 24, marginBottom: 16 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: v.text, marginBottom: 8 }}>{v.label}</h2>
                  <p style={{ fontSize: 14, color: "#475569" }}>{result.summary}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>{result.metadata?.filename}</p>
                </div>
              );
            })()}

            {/* Scores */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
              {[
                { label: "AI Score", val: result.aiInvolvementScore },
                { label: "Manipulation", val: result.manipulationScore },
                { label: "Confidence", val: result.confidenceScore },
              ].map(s => (
                <div key={s.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: s.val > 0.6 ? "#dc2626" : s.val > 0.3 ? "#f59e0b" : "#16a34a" }}>
                    {Math.round(s.val * 100)}%
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
                  <div style={{ width: "100%", background: "#f1f5f9", borderRadius: 4, height: 6, marginTop: 8 }}>
                    <div style={{
                      height: 6,
                      borderRadius: 4,
                      background: s.val > 0.6 ? "#dc2626" : s.val > 0.3 ? "#f59e0b" : "#16a34a",
                      width: `${s.val * 100}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Signals */}
            {result.signals?.length > 0 && (
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Detection Signals</h3>
                {result.signals.map((sig: any, i: number) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: "#1e293b" }}>{sig.title}</span>
                      <span style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: sig.severity === "high" ? "#fee2e2" : sig.severity === "medium" ? "#ffedd5" : "#dcfce7",
                        color: sig.severity === "high" ? "#991b1b" : sig.severity === "medium" ? "#9a3412" : "#166534",
                      }}>{sig.severity}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b" }}>{sig.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 16 }}>
              <button onClick={reset} style={{ flex: 1, padding: 12, border: "1px solid #e2e8f0", borderRadius: 12, fontWeight: 600, background: "white", cursor: "pointer" }}>
                Check Another
              </button>
              <Link href="/" style={{ flex: 1, padding: 12, background: "#4c6ef5", color: "white", borderRadius: 12, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
                More Tools
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
