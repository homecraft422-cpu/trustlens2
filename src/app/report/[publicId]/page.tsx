"use client";

import { useEffect, useState, use } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerdictBadge from "@/components/VerdictBadge";
import ScoreCard from "@/components/ScoreCard";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import ClassificationLevel from "@/components/ClassificationLevel";
import FindingsSummary from "@/components/FindingsSummary";
import ProvenanceCard from "@/components/ProvenanceCard";
import EvidenceList from "@/components/EvidenceList";
import VideoTimeline from "@/components/VideoTimeline";
import MockBanner from "@/components/MockBanner";
import { Shield, Loader2, AlertCircle, Lock } from "lucide-react";
import Link from "next/link";

interface ReportData {
  result: {
    verdict: string;
    aiInvolvementScore: number;
    manipulationScore: number;
    confidenceScore: number;
    classificationLevel: string;
    provenanceStatus: string;
    summary: string;
    createdAt: string;
  };
  signals: Array<{
    id: string;
    category: string;
    signalType: string;
    score: number | null;
    severity: string;
    title: string;
    description: string;
    timestampStart: number | null;
    timestampEnd: number | null;
  }>;
  asset: {
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    duration: number | null;
  } | null;
  isMockMode: boolean;
}

export default function PublicReportPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const resolvedParams = use(params);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not_found" | "error" | null>(null);

  useEffect(() => {
    fetch(`/api/v1/reports/${resolvedParams.publicId}`)
      .then((r) => {
        if (r.status === 404) {
          throw new Error("not_found");
        }
        if (!r.ok) throw new Error("error");
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        setError(e.message === "not_found" ? "not_found" : "error");
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.publicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </main>
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              Report Not Available
            </h2>
            <p className="text-slate-500 mb-4">
              This report may not be shared publicly or the link is invalid.
            </p>
            <Link
              href="/"
              className="text-brand-600 font-medium hover:underline"
            >
              Go to TRUSTLENS
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              Something Went Wrong
            </h2>
            <p className="text-slate-500 mb-4">
              Unable to load this report. Please try again later.
            </p>
            <Link
              href="/"
              className="text-brand-600 font-medium hover:underline"
            >
              Go to TRUSTLENS
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { result, signals, asset, isMockMode } = data;
  const isVideo = asset?.mimeType?.startsWith("video/");

  // Prepare timeline signals
  const timelineSignals = signals
    .filter(
      (s) =>
        s.timestampStart != null &&
        s.timestampEnd != null &&
        s.timestampStart >= 0 &&
        s.timestampEnd > s.timestampStart
    )
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      severity: s.severity,
      timestampStart: s.timestampStart!,
      timestampEnd: s.timestampEnd!,
    }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {isMockMode && (
          <div className="mb-6">
            <MockBanner />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-brand-600" />
            <span className="text-sm font-bold tracking-widest text-brand-600 uppercase">
              Content Trust Report
            </span>
          </div>

          <div className="mb-4">
            <VerdictBadge verdict={result.verdict} />
          </div>

          <div className="mb-4">
            <ConfidenceBadge score={result.confidenceScore} />
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {result.summary}
          </p>

          <div className="text-xs text-slate-400">
            Analyzed: {new Date(result.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <ScoreCard
            label="AI Involvement"
            score={result.aiInvolvementScore}
            tooltip="Estimated likelihood that one or more analyzed components were generated or significantly modified using AI."
            color="blue"
          />
          <ScoreCard
            label="Manipulation"
            score={result.manipulationScore}
            tooltip="Estimated likelihood that existing content has been altered or manipulated."
            color="orange"
          />
          <ScoreCard
            label="Evidence Confidence"
            score={result.confidenceScore}
            tooltip="How strongly the available signals support the analysis."
            color="green"
          />
        </div>

        <div className="mb-6">
          <FindingsSummary
            signals={signals}
            provenanceStatus={result.provenanceStatus}
          />
        </div>

        {/* Video Timeline - only show for video content */}
        {isVideo && (
          <div className="mb-6">
            <VideoTimeline
              signals={timelineSignals}
              duration={asset?.duration ?? null}
            />
          </div>
        )}

        <div className="mb-6">
          <ClassificationLevel level={result.classificationLevel} />
        </div>

        <div className="mb-6">
          <ProvenanceCard status={result.provenanceStatus} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Why Did We Say This?
          </h3>
          <EvidenceList signals={signals} />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Important:</strong> AI-content detection is probabilistic.
            Results are estimates based on available signals and should not be
            treated as absolute proof.
          </p>
        </div>

        <div className="text-center text-xs text-slate-400">
          Analyzed with{" "}
          <Link href="/" className="text-brand-600 hover:underline">
            TRUSTLENS
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
