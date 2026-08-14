"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Upload,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Shield,
  Eye,
  TrendingUp,
  Zap,
  Info,
  Music,
  ArrowRight,
} from "lucide-react";

const ACCEPTED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "video/mp4", "video/quicktime", "video/webm",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
  "audio/flac", "audio/aac", "audio/m4a", "audio/webm", "audio/mp4",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AnalysisResult {
  id: string;
  verdict: string;
  aiInvolvementScore: number;
  manipulationScore: number;
  confidenceScore: number;
  summary: string;
  signals: Array<{
    id: string;
    category: string;
    signalType: string;
    score: number | null;
    severity: string;
    title: string;
    description: string;
    source: string;
  }>;
  metadata: {
    filename: string;
    mimeType: string;
    fileSize: number;
    analyzedAt: string;
    processingTimeMs: number;
    isMock: boolean;
  };
}

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): "image" | "video" | "audio" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/") || file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) return "audio";
    return "image";
  };

  const validateFile = (file: File): string | null => {
    const isSupported =
      ACCEPTED_TYPES.includes(file.type) ||
      file.name.match(/\.(jpg|jpeg|png|webp|mp4|mov|webm|mp3|wav|ogg|flac|aac|m4a)$/i);

    if (!isSupported) {
      return "This file type isn't supported. Please upload JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, or M4A.";
    }

    const fileType = getFileType(file);
    if (fileType === "image" && file.size > MAX_IMAGE_SIZE) {
      return "Image file is too large. Maximum size is 10 MB.";
    }
    if (fileType === "video" && file.size > MAX_VIDEO_SIZE) {
      return "Video file is too large. Maximum size is 100 MB.";
    }
    if (fileType === "audio" && file.size > MAX_AUDIO_SIZE) {
      return "Audio file is too large. Maximum size is 50 MB.";
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    setResult(null);
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setSelectedFile(file);

    const fileType = getFileType(file);
    if (fileType === "image") {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("guestId", `guest_${Date.now()}`);

      // Use mock analysis API
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
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const resultRes = await fetch(`/api/v1/mock-analysis?id=${id}`);
        if (resultRes.ok) {
          const data = await resultRes.json();
          if (data.status === "completed") {
            setResult(data);
            setIsAnalyzing(false);
            setIsUploading(false);
            return;
          }
        }
      }

      throw new Error("Analysis timed out. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsAnalyzing(false);
      setIsUploading(false);
    }
  };

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case "likely_authentic":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50 border-green-200",
          label: "Likely Authentic",
          desc: "Strong evidence that content is genuine.",
        };
      case "likely_ai_generated":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 border-red-200",
          label: "Likely AI Generated",
          desc: "Strong indicators of synthetic content.",
        };
      case "possibly_manipulated":
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bg: "bg-orange-50 border-orange-200",
          label: "Possibly Manipulated",
          desc: "Some indicators of editing or alteration.",
        };
      default:
        return {
          icon: Info,
          color: "text-slate-600",
          bg: "bg-slate-50 border-slate-200",
          label: "Insufficient Evidence",
          desc: "Not enough data for reliable verdict.",
        };
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

  const fileType = selectedFile ? getFileType(selectedFile) : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Content Verification
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Upload an image, video, or audio file to analyze for AI generation, manipulation, and authenticity.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Supported Formats
            </p>
            <p className="text-xs text-blue-700 mt-1">
              <strong>Images:</strong> JPG, PNG, WEBP (up to 10MB) •{" "}
              <strong>Videos:</strong> MP4, MOV, WEBM (up to 100MB) •{" "}
              <strong>Audio:</strong> MP3, WAV, OGG, FLAC, AAC, M4A (up to 50MB)
            </p>
          </div>
        </div>

        {!result ? (
          <>
            {/* Upload Area */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
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
                    accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <Upload className="w-12 h-12 text-brand-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-700 mb-1">
                    Drop your file here
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    or click to browse
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileImage className="w-4 h-4" />
                      Images
                    </span>
                    <span className="flex items-center gap-1">
                      <FileVideo className="w-4 h-4" />
                      Videos
                    </span>
                    <span className="flex items-center gap-1">
                      <FileAudio className="w-4 h-4" />
                      Audio
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover border border-slate-200"
                      />
                    ) : fileType === "audio" ? (
                      <div className="w-20 h-20 rounded-lg bg-green-50 flex items-center justify-center border border-green-200">
                        <Music className="w-8 h-8 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-200">
                        <FileVideo className="w-8 h-8 text-purple-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {fileType === "image" ? (
                          <FileImage className="w-4 h-4 text-brand-500" />
                        ) : fileType === "video" ? (
                          <FileVideo className="w-4 h-4 text-purple-500" />
                        ) : (
                          <FileAudio className="w-4 h-4 text-green-500" />
                        )}
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {selectedFile.name}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatSize(selectedFile.size)} • {fileType?.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={handleRemove}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      disabled={isUploading}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Audio Player */}
                  {fileType === "audio" && (
                    <div className="mb-4">
                      <audio
                        src={URL.createObjectURL(selectedFile)}
                        controls
                        className="w-full"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isAnalyzing ? "Analyzing..." : "Uploading..."}
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Analyze Content
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* What We Check */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                What We Analyze
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Eye, title: "AI Involvement", desc: "Detect AI-generated content" },
                  { icon: Shield, title: "Manipulation", desc: "Find editing and alterations" },
                  { icon: TrendingUp, title: "Confidence", desc: "Evidence strength analysis" },
                  { icon: Info, title: "Provenance", desc: "Check origin and metadata" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <item.icon className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Results */
          <div className="space-y-6 animate-fade-in">
            {/* Verdict */}
            {(() => {
              const v = getVerdictInfo(result.verdict);
              return (
                <div className={`rounded-2xl border p-6 ${v.bg}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <v.icon className={`w-8 h-8 ${v.color}`} />
                    <div>
                      <h2 className={`text-xl font-bold ${v.color}`}>{v.label}</h2>
                      <p className="text-sm text-slate-600">{v.desc}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {result.metadata.filename} • Analyzed {new Date(result.metadata.analyzedAt).toLocaleString()}
                  </p>
                </div>
              );
            })()}

            {/* Score Cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "AI Involvement", score: result.aiInvolvementScore, icon: Zap },
                { label: "Manipulation", score: result.manipulationScore, icon: AlertCircle },
                { label: "Confidence", score: result.confidenceScore, icon: TrendingUp },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <item.icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                    {Math.round(item.score * 100)}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${getScoreBg(item.score)}`}
                      style={{ width: `${item.score * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-2">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Summary</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Signals */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Detection Signals</h3>
              <div className="space-y-4">
                {result.signals.map((signal) => (
                  <div key={signal.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-slate-800">{signal.title}</h4>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        signal.severity === "high" ? "bg-red-100 text-red-700" :
                        signal.severity === "medium" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {signal.severity}
                      </span>
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

            {/* Disclaimer */}
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Important:</strong> AI-content detection is probabilistic. Results are estimates and should not be treated as absolute proof. This is a demo analysis using mock data.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button onClick={handleRemove} className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
                Analyze Another
              </button>
              <Link href="/" className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-semibold text-center hover:bg-brand-700">
                More Tools
              </Link>
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
