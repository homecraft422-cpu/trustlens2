"use client";

import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

interface ProviderSummaryProps {
  consensus: string;
  agreement: number | null;
  providerCount: number;
  providersUsed: string[];
  hasFailures: boolean;
  failures?: Array<{ provider: string; errorCode: string }>;
}

const consensusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  strong_agreement: {
    label: "Strong agreement",
    color: "text-trust-green",
    icon: CheckCircle,
  },
  partial_agreement: {
    label: "Partial agreement",
    color: "text-trust-yellow",
    icon: Info,
  },
  disagreement: {
    label: "Providers disagree",
    color: "text-trust-orange",
    icon: AlertTriangle,
  },
  single_provider: {
    label: "Single provider",
    color: "text-slate-500",
    icon: Info,
  },
  insufficient_data: {
    label: "No provider data",
    color: "text-trust-gray",
    icon: XCircle,
  },
};

const providerLabels: Record<string, string> = {
  hive: "Hive AI",
  sightengine: "Sightengine",
  mock_provider: "Demo Provider",
  c2pa_analyzer: "C2PA Analyzer",
};

export default function ProviderSummary({
  consensus,
  agreement,
  providerCount,
  providersUsed,
  hasFailures,
  failures,
}: ProviderSummaryProps) {
  const cfg = consensusConfig[consensus] || consensusConfig.single_provider;
  const Icon = cfg.icon;

  return (
    <div className="rounded-xl border border-slate-200 p-6 bg-white">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Detection Providers
      </h3>

      {/* Consensus */}
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${cfg.color}`} />
        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
        {agreement !== null && (
          <span className="text-xs text-slate-400 ml-1">
            ({Math.round(agreement * 100)}% agreement)
          </span>
        )}
      </div>

      {/* Providers used */}
      <div className="space-y-2 mb-3">
        {providersUsed
          .filter((p) => p !== "c2pa_analyzer")
          .map((p) => (
            <div key={p} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-trust-green" />
              <span className="text-sm text-slate-700">
                {providerLabels[p] || p}
              </span>
            </div>
          ))}

        {/* Show failed providers */}
        {failures?.map((f) => (
          <div key={f.provider} className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">
              {providerLabels[f.provider] || f.provider}{" "}
              <span className="text-xs">(unavailable)</span>
            </span>
          </div>
        ))}
      </div>

      {/* Provider count */}
      <p className="text-xs text-slate-400">
        Analyzed by {providerCount} detection provider{providerCount !== 1 ? "s" : ""}.
        {hasFailures && " Some providers were temporarily unavailable."}
      </p>

      {consensus === "disagreement" && (
        <p className="text-xs text-trust-orange mt-2">
          Detection providers produced materially different results.
          This analysis should be treated with additional caution.
        </p>
      )}
    </div>
  );
}
