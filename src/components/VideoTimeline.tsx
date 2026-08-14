"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

interface TimelineSignal {
  id: string;
  title: string;
  description: string;
  severity: string;
  timestampStart: number;
  timestampEnd: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "high":
    case "critical":
      return "bg-red-400";
    case "medium":
      return "bg-orange-400";
    case "low":
      return "bg-yellow-400";
    default:
      return "bg-emerald-400";
  }
}

function getSeverityDot(severity: string): string {
  switch (severity) {
    case "high":
    case "critical":
      return "🔴";
    case "medium":
      return "🟠";
    case "low":
      return "🟡";
    default:
      return "🟢";
  }
}

interface VideoTimelineProps {
  signals: TimelineSignal[];
  duration: number | null;
}

export default function VideoTimeline({ signals, duration }: VideoTimelineProps) {
  const [selected, setSelected] = useState<TimelineSignal | null>(null);

  // Filter to only signals with valid timestamps
  const validSignals = signals.filter(
    (s) =>
      typeof s.timestampStart === "number" &&
      typeof s.timestampEnd === "number" &&
      s.timestampStart >= 0 &&
      s.timestampEnd > s.timestampStart
  );

  // If no valid timestamped signals, don't render timeline
  if (validSignals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-6 bg-white">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Video Timeline
        </h3>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Clock className="w-5 h-5" />
          <span>Timeline analysis is not available for this result.</span>
        </div>
      </div>
    );
  }

  // If duration is unknown, estimate from signals
  const totalDuration =
    duration ??
    Math.max(...validSignals.map((s) => s.timestampEnd)) + 5;

  return (
    <div className="rounded-xl border border-slate-200 p-6 bg-white">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Video Timeline
      </h3>

      {/* Duration note if estimated */}
      {duration === null && (
        <p className="text-xs text-slate-400 mb-3">
          Note: Video duration could not be determined. Timeline is estimated.
        </p>
      )}

      {/* Timeline bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>00:00</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
        <div className="relative h-6 bg-emerald-100 rounded-full overflow-hidden">
          {validSignals.map((s) => {
            const left = (s.timestampStart / totalDuration) * 100;
            const width =
              ((s.timestampEnd - s.timestampStart) / totalDuration) * 100;
            return (
              <button
                key={s.id}
                className={`absolute top-0 h-full ${getSeverityColor(s.severity)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                onClick={() => setSelected(s)}
                aria-label={`${s.title} at ${formatTime(s.timestampStart)}`}
              />
            );
          })}
        </div>
      </div>

      {/* Timeline segments */}
      <div className="space-y-2 mb-4">
        {validSignals.map((s) => (
          <button
            key={s.id}
            className={`w-full text-left flex items-start gap-2 p-2 rounded-lg transition-colors ${
              selected?.id === s.id ? "bg-slate-100" : "hover:bg-slate-50"
            }`}
            onClick={() => setSelected(s)}
          >
            <span className="text-sm">{getSeverityDot(s.severity)}</span>
            <div>
              <span className="text-sm font-medium text-slate-700">
                {formatTime(s.timestampStart)}–{formatTime(s.timestampEnd)}
              </span>
              <p className="text-sm text-slate-500">{s.title}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Selected detail */}
      {selected && (
        <div className="bg-slate-50 rounded-lg p-4 animate-fade-in">
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {formatTime(selected.timestampStart)}–{formatTime(selected.timestampEnd)}
          </p>
          <p className="text-sm font-medium text-slate-800 mb-1">{selected.title}</p>
          <p className="text-sm text-slate-500">{selected.description}</p>
        </div>
      )}
    </div>
  );
}
