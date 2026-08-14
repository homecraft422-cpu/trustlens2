"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Upload, X, FileImage, FileVideo, FileAudio, AlertCircle, Loader2,
  CheckCircle2, XCircle, ArrowLeft, Shield, Zap, Info, TrendingUp,
} from "lucide-react";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Handle file selection
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

  // Handle drop
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

  // Upload and analyze
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

      // Get result
      if (data.id) {
        // Wait a bit then fetch result
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
    likely_authentic: { bg: "bg-green-50 border-green-200", text: "text-green-600", label: "Likely Authentic" },
    likely_ai_generated: { bg: "bg-red-50 border-red-200", text: "text-red-600", label: "Likely AI Generated" },
    possibly_manipulated: { bg: "bg-orange-50 border-orange-200", text: "text-orange-600", label: "Possibly Manipulated" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 mb-6 inline-block">
          ← Back to Tools
        </Link>

        <div className="text-center mb-8">
          <Shield className="w-10 h-10 text-brand-600 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Verification</h1>
          <p className="text-slate-500">Upload image, video, or audio to check for AI generation</p>
        </div>

        {/* Upload Box */}
        {!file ? (
          <div
            className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition-all"
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInput.current?.click()}
          >
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a"
              onChange={onSelect}
            />
            <Upload className="w-12 h-12 text-brand-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-700 mb-2">
              Click or drag file here
            </p>
            <p className="text-sm text-slate-500">
              JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, M4A
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {/* File info */}
            <div className="flex items-center gap-4 mb-4">
              {preview ? (
                <img src={preview} alt="" className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center">
                  <FileAudio className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-slate-800 truncate">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button onClick={reset} className="p-2 text-slate-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audio preview */}
            {file.type.startsWith("audio/") && (
              <audio src={URL.createObjectURL(file)} controls className="w-full mb-4" />
            )}

            {/* Analyze button */}
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Analyze Now
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Verdict */}
            {(() => {
              const v = verdictColors[result.verdict] || verdictColors.possibly_manipulated;
              return (
                <div className={`rounded-2xl border p-6 ${v.bg}`}>
                  <h2 className={`text-2xl font-bold ${v.text} mb-2`}>{v.label}</h2>
                  <p className="text-sm text-slate-600">{result.summary}</p>
                  <p className="text-xs text-slate-400 mt-2">{result.metadata?.filename}</p>
                </div>
              );
            })()}

            {/* Scores */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "AI Score", val: result.aiInvolvementScore },
                { label: "Manipulation", val: result.manipulationScore },
                { label: "Confidence", val: result.confidenceScore },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className={`text-3xl font-bold ${s.val > 0.6 ? "text-red-600" : s.val > 0.3 ? "text-orange-500" : "text-green-600"}`}>
                    {Math.round(s.val * 100)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${s.val > 0.6 ? "bg-red-500" : s.val > 0.3 ? "bg-orange-500" : "bg-green-500"}`}
                      style={{ width: `${s.val * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Signals */}
            {result.signals?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Detection Signals</h3>
                {result.signals.map((sig: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800">{sig.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sig.severity === "high" ? "bg-red-100 text-red-700" :
                        sig.severity === "medium" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>{sig.severity}</span>
                    </div>
                    <p className="text-xs text-slate-500">{sig.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button onClick={reset} className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50">
                Check Another
              </button>
              <Link href="/" className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold text-center hover:bg-brand-700">
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
