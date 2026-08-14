"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import VerdictBadge from "@/components/VerdictBadge";
import { FileImage, FileVideo, Loader2, Search, FolderOpen } from "lucide-react";
import Link from "next/link";

interface HistoryItem {
  job: {
    id: string;
    status: string;
    createdAt: string;
  };
  result: {
    verdict: string;
    aiInvolvementScore: number;
    manipulationScore: number;
    confidenceScore: number;
  } | null;
  asset: {
    originalFilename: string;
    mimeType: string;
    fileSize: number;
  } | null;
  report: {
    publicId: string;
  } | null;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("trustlens_guest_id") || "";
}

const verdictLabels: Record<string, string> = {
  likely_authentic: "Likely Authentic",
  possibly_manipulated: "Possibly Manipulated",
  likely_ai_generated: "Likely AI-Generated",
  unverified: "Unverified",
  insufficient_evidence: "Insufficient Evidence",
};

export default function ReportsPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  useEffect(() => {
    const guestId = getGuestId();
    fetch(`/api/v1/history?guestId=${encodeURIComponent(guestId)}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    if (filter === "image" && !item.asset?.mimeType?.startsWith("image/")) return false;
    if (filter === "video" && !item.asset?.mimeType?.startsWith("video/")) return false;
    if (search && !item.asset?.originalFilename?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Reports</h1>
        <p className="text-slate-500 mb-8">View your analysis history.</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "image", "video"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No reports yet</h3>
            <p className="text-slate-500 mb-4">Upload content to start your first analysis.</p>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700 transition-colors"
            >
              Check Content
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <Link
                key={item.job.id}
                href={item.job.status === "completed" ? `/result/${item.job.id}` : "#"}
                className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {item.asset?.mimeType?.startsWith("video/") ? (
                      <FileVideo className="w-6 h-6 text-slate-400" />
                    ) : (
                      <FileImage className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.asset?.originalFilename || "Unknown file"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.result ? (
                        <>
                          <span className="text-xs text-slate-500">
                            {verdictLabels[item.result.verdict] || item.result.verdict}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">
                            AI: {item.result.aiInvolvementScore}%
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">
                            Manipulation: {item.result.manipulationScore}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 capitalize">{item.job.status}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(item.job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
