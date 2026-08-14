"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

interface Signal {
  id: string;
  category: string;
  signalType: string;
  score: number | null;
  severity: string;
  title: string;
  description: string;
  timestampStart?: number | null;
  timestampEnd?: number | null;
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "high":
    case "critical":
      return <AlertTriangle className="w-5 h-5 text-trust-red" />;
    case "medium":
      return <AlertTriangle className="w-5 h-5 text-trust-orange" />;
    case "low":
      return <Info className="w-5 h-5 text-trust-yellow" />;
    default:
      return <CheckCircle className="w-5 h-5 text-trust-green" />;
  }
}

function getSeverityBg(severity: string) {
  switch (severity) {
    case "high":
    case "critical":
      return "bg-red-50 border-red-100";
    case "medium":
      return "bg-orange-50 border-orange-100";
    case "low":
      return "bg-yellow-50 border-yellow-100";
    default:
      return "bg-green-50 border-green-100";
  }
}

export default function EvidenceList({ signals }: { signals: Signal[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No specific evidence was available for this analysis.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <div
          key={signal.id}
          className={`rounded-lg border p-4 transition-all ${getSeverityBg(signal.severity)}`}
        >
          <button
            className="w-full flex items-start gap-3 text-left"
            onClick={() => toggle(signal.id)}
            aria-expanded={expanded.has(signal.id)}
          >
            {getSeverityIcon(signal.severity)}
            <div className="flex-1">
              <span className="font-medium text-slate-800">{signal.title}</span>
              {signal.timestampStart != null && signal.timestampEnd != null && (
                <span className="ml-2 text-xs text-slate-500">
                  {formatTime(signal.timestampStart)}–{formatTime(signal.timestampEnd)}
                </span>
              )}
            </div>
            {expanded.has(signal.id) ? (
              <ChevronUp className="w-4 h-4 text-slate-400 mt-0.5" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5" />
            )}
          </button>
          {expanded.has(signal.id) && (
            <div className="mt-3 ml-8 text-sm text-slate-600 animate-fade-in">
              <p>{signal.description}</p>
              {signal.score != null && (
                <p className="mt-1 text-xs text-slate-400">
                  Signal strength: {Math.round(signal.score * 100)}%
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
