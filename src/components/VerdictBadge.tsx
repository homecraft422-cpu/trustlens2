"use client";

import { ShieldCheck, ShieldAlert, ShieldQuestion, AlertTriangle, HelpCircle, ShieldX } from "lucide-react";

const verdictConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck }> = {
  likely_authentic: {
    label: "LIKELY AUTHENTIC",
    color: "text-trust-green",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: ShieldCheck,
  },
  possibly_manipulated: {
    label: "POSSIBLY MANIPULATED",
    color: "text-trust-orange",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: ShieldAlert,
  },
  likely_ai_generated: {
    label: "LIKELY AI-GENERATED",
    color: "text-trust-red",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertTriangle,
  },
  unverified: {
    label: "INCONCLUSIVE",
    color: "text-trust-yellow",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: ShieldQuestion,
  },
  insufficient_evidence: {
    label: "INSUFFICIENT EVIDENCE",
    color: "text-trust-gray",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: HelpCircle,
  },
  detection_unavailable: {
    label: "DETECTION UNAVAILABLE",
    color: "text-trust-gray",
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: ShieldX,
  },
};

export default function VerdictBadge({ verdict }: { verdict: string }) {
  const cfg = verdictConfig[verdict] || verdictConfig.insufficient_evidence;
  const Icon = cfg.icon;

  return (
    <div className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl ${cfg.bg} ${cfg.border} border-2`}>
      <Icon className={`w-6 h-6 ${cfg.color}`} />
      <span className={`text-lg font-bold tracking-wide ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}
