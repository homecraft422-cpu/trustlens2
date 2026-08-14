"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface ScoreCardProps {
  label: string;
  score: number;
  tooltip: string;
  color: "blue" | "orange" | "green";
}

const colorMap = {
  blue: { ring: "stroke-brand-500", text: "text-brand-600", bg: "bg-brand-50" },
  orange: { ring: "stroke-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
  green: { ring: "stroke-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
};

export default function ScoreCard({ label, score, tooltip, color }: ScoreCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const c = colorMap[color];
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative rounded-xl border border-slate-200 p-6 ${c.bg} flex flex-col items-center`}>
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            className={c.ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${c.text}`}>{score}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <button
          className="text-slate-400 hover:text-slate-600 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          aria-label={`Info about ${label}`}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg z-10 animate-fade-in">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}
