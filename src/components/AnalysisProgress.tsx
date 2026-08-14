"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface AnalysisProgressProps {
  status: string;
}

const steps = [
  { key: "queued", label: "File received" },
  { key: "processing", label: "Processing started" },
  { key: "validating_media", label: "Validating media" },
  { key: "extracting_metadata", label: "Extracting metadata" },
  { key: "ready_for_detection", label: "Media prepared" },
  { key: "analyzing", label: "Analyzing content" },
  { key: "finalizing", label: "Building report" },
  { key: "completed", label: "Analysis complete" },
];

const statusOrder = [
  "queued",
  "uploading",
  "processing",
  "validating_media",
  "extracting_metadata",
  "ready_for_detection",
  "analyzing",
  "finalizing",
  "completed",
];

function getStepIndex(status: string): number {
  const idx = statusOrder.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export default function AnalysisProgress({ status }: AnalysisProgressProps) {
  const currentIndex = getStepIndex(status);

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Analyzing your content…
        </h2>
        <p className="text-slate-500">
          We&apos;re checking multiple signals. This can take a moment.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const stepIdx = getStepIndex(step.key);
          const isComplete = currentIndex > stepIdx || status === "completed";
          const isCurrent = !isComplete && currentIndex >= stepIdx;

          return (
            <div key={step.key} className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle className="w-5 h-5 text-trust-green" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
              <span
                className={`text-sm font-medium ${
                  isComplete
                    ? "text-slate-700"
                    : isCurrent
                      ? "text-brand-600"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
