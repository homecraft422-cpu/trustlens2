"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const ref = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    setResult(null);
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
  }

  function drop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    setError("");
    setResult(null);
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : "");
  }

  async function go() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/v1/mock-analysis", { method: "POST", body: fd });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
      const { id } = await r.json();
      await new Promise(w => setTimeout(w, 2000));
      const res = await fetch(`/api/v1/mock-analysis?id=${id}`);
      if (res.ok) setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function cls() {
    setFile(null);
    setPreview("");
    setError("");
    setResult(null);
    if (ref.current) ref.current.value = "";
  }

  const fmt = (b: number) => b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(2) + " MB";

  const vc: Record<string, [string, string, string]> = {
    likely_authentic: ["#dcfce7", "#166534", "Likely Authentic ✓"],
    likely_ai_generated: ["#fee2e2", "#991b1b", "Likely AI Generated ⚠"],
    possibly_manipulated: ["#ffedd5", "#9a3412", "Possibly Manipulated ⚠"],
    insufficient_evidence: ["#f1f5f9", "#475569", "Insufficient Evidence"],
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 768, margin: "0 auto", padding: "32px 16px", width: "100%" }}>
        <Link href="/" style={{ color: "#64748b", fontSize: 14, display: "inline-block", marginBottom: 24 }}>← Back</Link>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🛡️</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: "8px 0" }}>Content Verification</h1>
          <p style={{ color: "#64748b" }}>Upload image, video, or audio to check for AI generation</p>
        </div>

        {!file ? (
          <div
            onDrop={drop}
            onDragOver={e => e.preventDefault()}
            onClick={() => ref.current?.click()}
            style={{ background: "#fff", border: "2px dashed #cbd5e1", borderRadius: 16, padding: 48, textAlign: "center", cursor: "pointer" }}
          >
            <input ref={ref} type="file" hidden accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a" onChange={pick} />
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#334155", marginBottom: 8 }}>Click or drag file here</p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, M4A</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              {preview ? <img src={preview} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover" }} /> : <div style={{ width: 72, height: 72, borderRadius: 12, background: "#f1f5f9", display: "grid", placeItems: "center", fontSize: 32 }}>🎵</div>}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>{fmt(file.size)}</p>
              </div>
              <button onClick={cls} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", padding: 4 }}>✕</button>
            </div>
            {file.type.startsWith("audio/") && <audio src={URL.createObjectURL(file)} controls style={{ width: "100%", marginBottom: 16 }} />}
            <button onClick={go} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "#94a3b8" : "#4c6ef5", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
              {loading ? "⏳ Analyzing..." : "⚡ Analyze Now"}
            </button>
          </div>
        )}

        {error && <div style={{ marginTop: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, color: "#991b1b" }}>❌ {error}</div>}

        {result && (
          <div style={{ marginTop: 24 }}>
            {(() => { const [bg, fg, lbl] = vc[result.verdict] || vc.insufficient_evidence; return (
              <div style={{ background: bg, borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: fg, marginBottom: 8 }}>{lbl}</h2>
                <p style={{ fontSize: 14, color: "#475569" }}>{result.summary}</p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>{result.metadata?.filename}</p>
              </div>
            ); })()}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
              {[["AI Score", result.aiInvolvementScore], ["Manipulation", result.manipulationScore], ["Confidence", result.confidenceScore]].map(([l, v]: any) => (
                <div key={l} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: v > 0.6 ? "#dc2626" : v > 0.3 ? "#f59e0b" : "#16a34a" }}>{Math.round(v * 100)}%</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{l}</div>
                  <div style={{ background: "#f1f5f9", borderRadius: 4, height: 5, marginTop: 8 }}><div style={{ height: 5, borderRadius: 4, background: v > 0.6 ? "#dc2626" : v > 0.3 ? "#f59e0b" : "#16a34a", width: v * 100 + "%" }} /></div>
                </div>
              ))}
            </div>
            {result.signals?.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Detection Signals</h3>
                {result.signals.map((s: any, i: number) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500 }}>{s.title}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: s.severity === "high" ? "#fee2e2" : "#ffedd5", color: s.severity === "high" ? "#991b1b" : "#9a3412" }}>{s.severity}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{s.description}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={cls} style={{ flex: 1, padding: 12, border: "1px solid #e2e8f0", borderRadius: 12, fontWeight: 600, background: "#fff", cursor: "pointer" }}>Check Another</button>
              <Link href="/" style={{ flex: 1, padding: 12, background: "#4c6ef5", color: "#fff", borderRadius: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>More Tools</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
