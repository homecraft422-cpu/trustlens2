"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
} from "lucide-react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file: File): "image" | "video" | "audio" {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) return "audio";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "image";
}

const ACCEPTED = ".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setResult(null);
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }, [preview]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("guestId", "guest_" + Date.now());

      setProgress(30);

      // Send to API
      const response = await fetch("/api/v1/mock-analysis", {
        method: "POST",
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed. Please try again.");
      }

      const data = await response.json();
      setProgress(80);

      if (data.id) {
        // Poll for result
        let attempts = 0;
        while (attempts < 20) {
          await new Promise(r => setTimeout(r, 500));
          attempts++;
          
          const resultRes = await fetch(`/api/v1/mock-analysis?id=${data.id}`);
          if (resultRes.ok) {
            const resultData = await resultRes.json();
            if (resultData.status === "completed" || resultData.verdict) {
              setProgress(100);
              setResult(resultData);
              setIsAnalyzing(false);
              return;
            }
          }
        }
        throw new Error("Analysis timed out");
      } else {
        throw new Error("No analysis ID received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsAnalyzing(false);
      setProgress(0);
    }
  }, [selectedFile]);

  const getVerdictInfo = (verdict: string) => {
    switch (verdict) {
      case "likely_authentic":
        return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Likely Authentic", desc: "Strong evidence that content is genuine." };
      case "likely_ai_generated":
        return { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Likely AI Generated", desc: "Strong indicators of synthetic content." };
      case "possibly_manipulated":
        return { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Possibly Manipulated", desc: "Some indicators of editing or alteration." };
      default:
        return { icon: Info, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", label: "Insufficient Evidence", desc: "Not enough data for reliable verdict." };
    }
  };

  const getScoreColor = (score: number) => score < 0.3 ? "text-green-600" : score < 0.6 ? "text-orange-500" : "text-red-600";
  const getScoreBg = (score: number) => score < 0.3 ? "bg-green-500" : score < 0.6 ? "bg-orange-500" : "bg-red-500";

  const fileType = selectedFile ? getFileType(selectedFile) : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Content Verification</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Upload an image, video, or audio file to analyze for AI generation, manipulation, and authenticity.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Supported Formats</p>
            <p className="text-xs text-blue-700 mt-1">
              <strong>Images:</strong> JPG, PNG, WEBP (10MB) • <strong>Videos:</strong> MP4, MOV, WEBM (100MB) • <strong>Audio:</strong> MP3, WAV, OGG, FLAC, AAC, M4A (50MB)
            </p>
          </div>
        </div>

        {!result ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                  isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept={ACCEPTED}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <Upload className="w-12 h-12 text-brand-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-slate-700 mb-1">Drop your file here</p>
                <p className="text-sm text-slate-500 mb-4">or click to browse</p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><FileImage className="w-4 h-4" /> Images</span>
                  <span className="flex items-center gap-1"><FileVideo className="w-4 h-4" /> Videos</span>
                  <span className="flex items-center gap-1"><FileAudio className="w-4 h-4" /> Audio</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-4 mb-4">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
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
                      {fileType === "image" ? <FileImage className="w-4 h-4 text-brand-500" /> : 
                       fileType === "video" ? <FileVideo className="w-4 h-4 text-purple-500" /> : 
                       <FileAudio className="w-4 h-4 text-green-500" />}
                      <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                    </div>
                    <p className="text-xs text-slate-500">{formatSize(selectedFile.size)} • {fileType?.toUpperCase()}</p>
                  </div>
                  <button onClick={handleRemove} className="p-1 text-slate-400 hover:text-slate-600" disabled={isAnalyzing}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {fileType === "audio" && preview && (
                  <div className="mb-4">
                    <audio src={preview} controls className="w-full" />
                  </div>
                )}

                {isAnalyzing && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Analyzing...</span>
                      <span className="text-sm font-medium text-brand-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-brand-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Zap className="w-5 h-5" /> Analyze Content</>
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
                  <div className="flex items-center gap-3 mb-2">
                    <v.icon className={`w-8 h-8 ${v.color}`} />
                    <div>
                      <h2 className={`text-xl font-bold ${v.color}`}>{v.label}</h2>
                      <p className="text-sm text-slate-600">{v.desc}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {result.metadata.filename} • {new Date(result.metadata.analyzedAt).toLocaleString()}
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "AI Involvement", score: result.aiInvolvementScore, icon: Zap },
                { label: "Manipulation", score: result.manipulationScore, icon: AlertCircle },
                { label: "Confidence", score: result.confidenceScore, icon: TrendingUp },
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
                {result.signals.map((signal) => (
                  <div key={signal.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
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
              <p className="text-xs text-slate-500"><strong>Important:</strong> AI-content detection is probabilistic. Results are estimates.</p>
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
