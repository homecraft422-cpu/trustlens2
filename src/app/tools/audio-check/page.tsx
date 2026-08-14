"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Music,
  Upload,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Volume2,
  Mic,
  Radio,
  FileAudio,
  X,
  Zap,
  Info,
  TrendingUp,
} from "lucide-react";

const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
  "audio/flac", "audio/aac", "audio/m4a", "audio/webm", "audio/mp4",
];

const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AnalysisResult {
  verdict: string;
  aiScore: number;
  manipulationScore: number;
  confidence: number;
  signals: Array<{
    title: string;
    description: string;
    severity: string;
    score: number | null;
  }>;
  summary: string;
}

export default function AudioCheckPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const isAudio =
      ACCEPTED_AUDIO_TYPES.includes(file.type) ||
      file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i);

    if (!isAudio) {
      return "This file type isn't supported. Please upload MP3, WAV, OGG, FLAC, AAC, or M4A.";
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return "Audio file is too large. Maximum size is 50 MB.";
    }
    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    setResult(null);
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setAudioPreview(url);

    // Get duration
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(audio.duration);
    });
    audio.addEventListener("error", () => {
      // If metadata fails, still allow analysis
      setAudioDuration(null);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setSelectedFile(null);
    setAudioPreview(null);
    setAudioDuration(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/v1/mock-analysis", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const { id } = await res.json();

      // Poll for result
      let attempts = 0;
      while (attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const resultRes = await fetch(`/api/v1/mock-analysis?id=${id}`);
        if (resultRes.ok) {
          const data = await resultRes.json();
          if (data.status === "completed") {
            // Convert to our format
            const isSynthetic = data.verdict === "likely_ai_generated";
            setResult({
              verdict: data.verdict,
              aiScore: data.aiInvolvementScore,
              manipulationScore: data.manipulationScore,
              confidence: data.confidenceScore,
              signals: data.signals.map((s: any) => ({
                title: s.title,
                description: s.description,
                severity: s.severity,
                score: s.score,
              })),
              summary: data.summary,
            });
            setIsAnalyzing(false);
            return;
          }
        }
      }

      throw new Error("Analysis timed out");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 0.3) return "text-green-600";
    if (score < 0.6) return "text-orange-500";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score < 0.3) return "bg-green-500";
    if (score < 0.6) return "bg-orange-500";
    return "bg-red-500";
  };

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case "likely_authentic":
        return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Likely Authentic", desc: "This audio appears to be genuine human speech." };
      case "likely_ai_generated":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Likely AI Generated", desc: "Strong indicators of synthetic or AI-generated audio." };
      case "possibly_manipulated":
        return { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Possibly Manipulated", desc: "Some indicators of audio manipulation detected." };
      default:
        return { icon: Info, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", label: "Insufficient Evidence", desc: "Not enough data for reliable verdict." };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Music className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Audio Analysis</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Detect AI-generated speech, voice cloning, and synthetic audio. Supports MP3, WAV, OGG, FLAC, AAC, and M4A formats.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Audio Detection Capabilities</p>
            <p className="text-xs text-green-700 mt-1">
              Our engine analyzes speech patterns, frequency spectrum, voice cloning artifacts, background noise, and prosody to detect AI-generated or manipulated audio.
            </p>
          </div>
        </div>

        {!result ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                  isDragging ? "border-green-500 bg-green-50" : "border-slate-300 hover:border-green-400 hover:bg-green-50/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".mp3,.wav,.ogg,.flac,.aac,.m4a,audio/*"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }}
                />
                <Upload className="w-10 h-10 text-green-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700 mb-1">Drop an audio file here</p>
                <p className="text-sm text-slate-500 mb-3">or click to browse</p>
                <p className="text-xs text-slate-400">MP3, WAV, OGG, FLAC, AAC, M4A • Up to 50 MB</p>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center border border-green-200">
                    <FileAudio className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Music className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatSize(selectedFile.size)}
                      {audioDuration && ` • ${formatDuration(audioDuration)}`}
                      {" • "}
                      {selectedFile.type.split("/")[1]?.toUpperCase() || "AUDIO"}
                    </p>
                  </div>
                  <button onClick={handleRemove} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {audioPreview && (
                  <div className="mb-4">
                    <audio src={audioPreview} controls className="w-full" />
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Audio...</>
                  ) : (
                    <><Zap className="w-5 h-5" /> Analyze Audio</>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {(() => {
              const v = getVerdictInfo(result.verdict);
              return (
                <div className={`rounded-2xl border p-6 ${v.bg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <v.icon className={`w-8 h-8 ${v.color}`} />
                    <div>
                      <h2 className={`text-xl font-bold ${v.color}`}>{v.label}</h2>
                      <p className="text-sm text-slate-600">{v.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "AI Generated", score: result.aiScore, icon: Zap },
                { label: "Manipulation", score: result.manipulationScore, icon: AlertCircle },
                { label: "Confidence", score: result.confidence, icon: TrendingUp },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <item.icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{Math.round(item.score * 100)}%</div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${getScoreBg(item.score)}`} style={{ width: `${item.score * 100}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-2">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Summary</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Detection Signals</h3>
              <div className="space-y-4">
                {result.signals.map((signal, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-slate-800">{signal.title}</h4>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        signal.severity === "high" ? "bg-red-100 text-red-700" :
                        signal.severity === "medium" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>{signal.severity}</span>
                    </div>
                    <p className="text-xs text-slate-500">{signal.description}</p>
                    {signal.score !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${getScoreBg(signal.score)}`} style={{ width: `${signal.score * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{Math.round(signal.score * 100)}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-500"><strong>Important:</strong> Audio detection is probabilistic. Results are estimates.</p>
            </div>

            <div className="flex gap-4">
              <button onClick={handleRemove} className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">Analyze Another</button>
              <Link href="/" className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-semibold text-center hover:bg-brand-700">More Tools</Link>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
