"use client";

import { useEffect, useState, use } from "react";
import Header from "@/components/Header";
import VerdictBadge from "@/components/VerdictBadge";
import ScoreCard from "@/components/ScoreCard";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import ClassificationLevel from "@/components/ClassificationLevel";
import FindingsSummary from "@/components/FindingsSummary";
import ProvenanceCard from "@/components/ProvenanceCard";
import EvidenceList from "@/components/EvidenceList";
import VideoTimeline from "@/components/VideoTimeline";
import ShareReportButton from "@/components/ShareReportButton";
import MockBanner from "@/components/MockBanner";
import ProviderSummary from "@/components/ProviderSummary";
import { Shield, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProviderSummaryData {
  consensus: string;
  agreement: number | null;
  providerCount: number;
  providersUsed: string[];
  hasFailures: boolean;
  failures?: Array<{ provider: string; errorCode: string }>;
}

interface AnalysisData {
  result: {
    id: string;
    verdict: string;
    aiInvolvementScore: number;
    manipulationScore: number;
    confidenceScore: number;
    classificationLevel: string;
    provenanceStatus: string;
    summary: string;
    createdAt: string;
  };
  providerSummary?: ProviderSummaryData;
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
    source?: string;
  }>;
  report: { publicId: string; isPublic: boolean } | null;
  asset: {
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    duration: number | null;
  } | null;
  isMockMode: boolean;
}

function getGuestId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("trustlens_guest_id") || "";
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guestId = getGuestId();
    const url = `/api/v1/analyses/${resolvedParams.id}/result${guestId ? `?guestId=${encodeURIComponent(guestId)}` : ""}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Result not found");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

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

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">Result Not Found</h2>
            <p className="text-slate-500 mb-4">The analysis may still be processing or the link is invalid.</p>
            <Link href="/analyze" className="text-brand-600 font-medium hover:underline">Start New Analysis</Link>
          </div>
        </main>
      </div>
    );
  }

  const { result, providerSummary: ps, signals, report, asset, isMockMode } = data;
  const isVideo = asset?.mimeType?.startsWith("video/");

  const timelineSignals = signals
    .filter((s) => s.timestampStart != null && s.timestampEnd != null && s.timestampStart! >= 0 && s.timestampEnd! > s.timestampStart!)
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
        <Link href="/analyze" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          New Analysis
        </Link>

        {isMockMode && (
          <div className="mb-6"><MockBanner /></div>
        )}

        {/* Report Header */}
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

          <p className="text-slate-600 text-sm leading-relaxed mb-4">{result.summary}</p>

          {asset && (
            <div className="text-xs text-slate-400">
              {asset.originalFilename} • {(asset.fileSize / (1024 * 1024)).toFixed(1)} MB • {new Date(result.createdAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in">
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

        {/* Provider Summary */}
        {ps && (
          <div className="mb-6 animate-fade-in">
            <ProviderSummary
              consensus={ps.consensus}
              agreement={ps.agreement}
              providerCount={ps.providerCount}
              providersUsed={ps.providersUsed}
              hasFailures={ps.hasFailures}
              failures={ps.failures}
            />
          </div>
        )}

        {/* Findings Summary */}
        <div className="mb-6 animate-fade-in">
          <FindingsSummary signals={signals} provenanceStatus={result.provenanceStatus} />
        </div>

        {/* Video Timeline */}
        {isVideo && (
          <div className="mb-6 animate-fade-in">
            <VideoTimeline signals={timelineSignals} duration={asset?.duration ?? null} />
          </div>
        )}

        {/* Classification */}
        <div className="mb-6 animate-fade-in">
          <ClassificationLevel level={result.classificationLevel} />
        </div>

        {/* Provenance */}
        <div className="mb-6 animate-fade-in">
          <ProvenanceCard status={result.provenanceStatus} />
        </div>

        {/* Evidence Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Why Did We Say This?
          </h3>
          <EvidenceList signals={signals} />
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 animate-fade-in">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Important:</strong> AI-content detection is probabilistic.
            Results are estimates based on available signals and should not be
            treated as absolute proof. AI-assisted content is not necessarily
            deceptive or false. Absence of provenance does not prove that
            content is fake.
            {ps && ps.providerCount > 1 && " Multi-provider analysis combines independent assessments; agreement level does not guarantee accuracy."}
          </p>
        </div>

        {/* Share */}
        {report && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Share Report
            </h3>
            <ShareReportButton publicId={report.publicId} isPublic={report.isPublic} />
            <p className="mt-3 text-xs text-slate-400">
              Shared reports include the analysis summary and findings but do not expose private information or raw uploads.
            </p>
          </div>
        )}

        <div className="text-center mt-8 text-xs text-slate-400">
          Analyzed with TRUSTLENS
        </div>
      </main>
    </div>
  );
}
