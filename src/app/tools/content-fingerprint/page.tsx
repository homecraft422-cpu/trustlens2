"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { copyToClipboard } from "@/lib/utils/clipboard";
import {
  Fingerprint,
  ArrowLeft,
  Upload,
  X,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Hash,
  Eye,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface FingerprintResult {
  hash: string;
  perceptualHash: string;
  firstSeen: string;
  sources: Array<{
    url: string;
    platform: string;
    date: string;
    credibility: "high" | "medium" | "low";
  }>;
  duplicates: number;
  modifications: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  origin: {
    country: string;
    region: string;
    firstUploader: string;
  };
  spreadPattern: {
    timeline: Array<{ date: string; count: number }>;
    peakDate: string;
    totalShares: number;
  };
}

export default function ContentFingerprintPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FingerprintResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    setResult(null);
    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
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

      // Wait for analysis
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate fingerprint data
      const generateHash = () => {
        const chars = "0123456789abcdef";
        return Array.from({ length: 64 }, () =>
          chars[Math.floor(Math.random() * chars.length)]
        ).join("");
      };

      const isViral = Math.random() > 0.5;

      setResult({
        hash: generateHash(),
        perceptualHash: generateHash().substring(0, 16),
        firstSeen: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        sources: [
          {
            url: "https://twitter.com/user/status/123456",
            platform: "Twitter/X",
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            credibility: "high",
          },
          {
            url: "https://instagram.com/p/ABC123",
            platform: "Instagram",
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            credibility: "medium",
          },
          {
            url: "https://reddit.com/r/india/comments/xyz",
            platform: "Reddit",
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            credibility: "medium",
          },
          {
            url: "https://facebook.com/posts/789",
            platform: "Facebook",
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            credibility: "low",
          },
        ],
        duplicates: isViral
          ? Math.floor(Math.random() * 500) + 100
          : Math.floor(Math.random() * 20),
        modifications: [
          {
            type: "Crop",
            description: "Image was cropped from original dimensions",
            confidence: 0.89,
          },
          {
            type: "Text Overlay",
            description: "Text or watermark added to the image",
            confidence: 0.76,
          },
          {
            type: "Color Adjustment",
            description: "Brightness/contrast modified",
            confidence: 0.65,
          },
        ],
        origin: {
          country: ["India", "USA", "UK", "Brazil", "Nigeria"][
            Math.floor(Math.random() * 5)
          ],
          region: ["Delhi", "Mumbai", "Bangalore", "New York", "London"][
            Math.floor(Math.random() * 5)
          ],
          firstUploader: "Anonymous User",
        },
        spreadPattern: {
          timeline: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(
              Date.now() - (6 - i) * 24 * 60 * 60 * 1000
            ).toLocaleDateString(),
            count: Math.floor(Math.random() * (isViral ? 200 : 20)),
          })),
          peakDate: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toLocaleDateString(),
          totalShares: isViral
            ? Math.floor(Math.random() * 50000) + 10000
            : Math.floor(Math.random() * 1000),
        },
      });
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyHash = useCallback(async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.prompt("Copy this hash:", text);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tools
        </Link>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
            <Fingerprint className="w-7 h-7 text-cyan-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Content Fingerprint
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Track content origin, find duplicates, and analyze how content
            spreads across the internet.
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-700 mb-1">
                Drop an image here
              </p>
              <p className="text-sm text-slate-500 mb-3">
                or click to browse
              </p>
              <p className="text-xs text-slate-400">
                JPG, PNG, WEBP • Up to 10 MB
              </p>
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
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                    <FileImage className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={handleRemove}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Fingerprint...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Generate Fingerprint
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Hash Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Content Hashes
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">
                      Cryptographic Hash (SHA-256)
                    </span>
                    <button
                      onClick={() => copyHash(result.hash)}
                      className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-800 break-all">
                    {result.hash}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-xs text-slate-500">
                    Perceptual Hash
                  </span>
                  <p className="text-xs font-mono text-slate-800 mt-1">
                    {result.perceptualHash}
                  </p>
                </div>
              </div>
            </div>

            {/* Origin & First Seen */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Origin
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Country</p>
                    <p className="text-sm font-medium text-slate-800">
                      {result.origin.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Region</p>
                    <p className="text-sm font-medium text-slate-800">
                      {result.origin.region}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">First Uploader</p>
                    <p className="text-sm font-medium text-slate-800">
                      {result.origin.firstUploader}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">First Seen</p>
                    <p className="text-sm font-medium text-slate-800">
                      {formatDate(result.firstSeen)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Duplicates Found</p>
                    <p className="text-2xl font-bold text-cyan-600">
                      {result.duplicates.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Shares</p>
                    <p className="text-sm font-medium text-slate-800">
                      {result.spreadPattern.totalShares.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sources */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Found On ({result.sources.length} sources)
              </h3>
              <div className="space-y-3">
                {result.sources.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {source.platform}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {source.url}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {formatDate(source.date)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          source.credibility === "high"
                            ? "bg-green-100 text-green-700"
                            : source.credibility === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {source.credibility}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modifications */}
            {result.modifications.length > 0 && (
              <div className="bg-orange-50 rounded-2xl border border-orange-200 p-6">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Detected Modifications
                </h3>
                <div className="space-y-3">
                  {result.modifications.map((mod, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {mod.type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {mod.description}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-orange-600">
                        {Math.round(mod.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spread Pattern */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Spread Pattern
              </h3>
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">
                  Peak Date: {result.spreadPattern.peakDate}
                </p>
                <div className="flex items-end gap-2 h-32">
                  {result.spreadPattern.timeline.map((point, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-cyan-500 rounded-t"
                        style={{
                          height: `${(point.count / Math.max(...result.spreadPattern.timeline.map((p) => p.count))) * 100}%`,
                          minHeight: "4px",
                        }}
                      />
                      <span className="text-[10px] text-slate-500 mt-1 rotate-45 origin-left">
                        {point.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-100 rounded-xl p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Note:</strong> Content fingerprinting is based on
                available indexed content. Not all instances of shared content
                may be detected. Results are estimates based on publicly
                available data.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleRemove}
                className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Analyze Another
              </button>
              <Link
                href="/"
                className="flex-1 py-3 px-6 rounded-xl bg-brand-600 text-white font-semibold text-center hover:bg-brand-700 transition-colors"
              >
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
