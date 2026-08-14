"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Layers,
  ArrowLeft,
  Upload,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Zap,
} from "lucide-react";

interface BatchFile {
  id: string;
  file: File;
  preview: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  result: {
    verdict: string;
    aiScore: number;
    confidence: number;
  } | null;
  error: string | null;
}

export default function BatchProcessPage() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): "image" | "video" | "audio" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "audio";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return FileImage;
      case "video": return FileVideo;
      case "audio": return FileAudio;
      default: return FileImage;
    }
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const batchFiles: BatchFile[] = fileArray.map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      status: "pending",
      result: null,
      error: null,
    }));
    setFiles((prev) => [...prev, ...batchFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((file) => { if (file.preview) URL.revokeObjectURL(file.preview); });
    setFiles([]);
    setProcessingProgress(0);
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    const pendingFiles = files.filter((f) => f.status === "pending");
    const totalFiles = pendingFiles.length;
    let processed = 0;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "processing" } : f));

      try {
        const formData = new FormData();
        formData.append("file", files[i].file);

        const res = await fetch("/api/v1/mock-analysis", { method: "POST", body: formData });
        
        if (!res.ok) throw new Error("Upload failed");

        const { id } = await res.json();

        // Wait for result
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

        const resultRes = await fetch(`/api/v1/mock-analysis?id=${id}`);
        if (resultRes.ok) {
          const data = await resultRes.json();
          setFiles((prev) => prev.map((f, idx) => idx === i ? {
            ...f,
            status: "completed",
            result: {
              verdict: data.verdict,
              aiScore: data.aiInvolvementScore,
              confidence: data.confidenceScore,
            },
          } : f));
        } else {
          throw new Error("Failed to get result");
        }
      } catch (err) {
        setFiles((prev) => prev.map((f, idx) => idx === i ? {
          ...f,
          status: "failed",
          error: err instanceof Error ? err.message : "Processing failed",
        } : f));
      }

      processed++;
      setProcessingProgress(Math.round((processed / totalFiles) * 100));
    }

    setIsProcessing(false);
  };

  const exportResults = () => {
    const completedFiles = files.filter((f) => f.status === "completed" && f.result);
    const csvContent = [
      "Filename,Type,Verdict,AI Score,Confidence",
      ...completedFiles.map((f) => {
        const type = getFileType(f.file);
        return `${f.file.name},${type},${f.result!.verdict},${Math.round(f.result!.aiScore * 100)}%,${Math.round(f.result!.confidence * 100)}%`;
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trustlens_batch_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const completedCount = files.filter((f) => f.status === "completed").length;
  const failedCount = files.filter((f) => f.status === "failed").length;
  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Batch Processing</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Analyze multiple files at once. Upload images, videos, and audio files for bulk verification.
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a"
              onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
            />
            <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-700 mb-1">Drop multiple files here</p>
            <p className="text-sm text-slate-500 mb-3">or click to browse (up to 50 files)</p>
            <p className="text-xs text-slate-400">Images, Videos, Audio files supported</p>
          </div>
        </div>

        {/* Stats Bar */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{files.length}</div>
                  <div className="text-xs text-slate-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
                  <div className="text-xs text-slate-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-xs text-slate-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-xs text-slate-500">Failed</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {completedCount > 0 && (
                  <button onClick={exportResults} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                )}
                <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              </div>
            </div>

            {isProcessing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Processing...</span>
                  <span className="text-sm font-medium text-brand-600">{processingProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-brand-600 h-2 rounded-full transition-all duration-300" style={{ width: `${processingProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700">Files ({files.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {files.map((batchFile) => {
                const type = getFileType(batchFile.file);
                const TypeIcon = getTypeIcon(type);
                return (
                  <div key={batchFile.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                    {batchFile.preview ? (
                      <img src={batchFile.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${type === "video" ? "bg-purple-50" : type === "audio" ? "bg-green-50" : "bg-blue-50"}`}>
                        <TypeIcon className={`w-6 h-6 ${type === "video" ? "text-purple-500" : type === "audio" ? "text-green-500" : "text-blue-500"}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{batchFile.file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(batchFile.file.size)} • {type.toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {batchFile.status === "pending" && <span className="text-xs text-slate-500">Pending</span>}
                      {batchFile.status === "processing" && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          <span className="text-xs text-blue-500">Processing</span>
                        </div>
                      )}
                      {batchFile.status === "completed" && batchFile.result && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${batchFile.result.verdict === "likely_authentic" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {batchFile.result.verdict === "likely_authentic" ? "Authentic" : "AI Generated"}
                          </span>
                        </div>
                      )}
                      {batchFile.status === "failed" && (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-500">Failed</span>
                        </div>
                      )}
                      {!isProcessing && (
                        <button onClick={() => removeFile(batchFile.id)} className="p-1 text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={processFiles}
              disabled={isProcessing || pendingCount === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing {processingProgress}%</>
              ) : (
                <><Zap className="w-5 h-5" /> Process {pendingCount} Files</>
              )}
            </button>
            <Link href="/" className="py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50">
              Back to Tools
            </Link>
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="text-center py-12">
            <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No files added yet</h3>
            <p className="text-sm text-slate-500 mb-6">Upload multiple files to analyze them in batch</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700"
            >
              <Upload className="w-5 h-5" /> Select Files
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
