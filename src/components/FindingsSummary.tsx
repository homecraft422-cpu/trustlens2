import { AlertTriangle, CheckCircle, Circle } from "lucide-react";

interface Signal {
  severity: string;
  category: string;
  title: string;
}

export default function FindingsSummary({ signals, provenanceStatus }: { signals: Signal[]; provenanceStatus: string }) {
  const findings: { icon: React.ReactNode; text: string; status: "warning" | "ok" | "neutral" }[] = [];

  // AI detection signals
  const aiSignals = signals.filter((s) => s.category === "ai_detection");
  const hasHighAi = aiSignals.some((s) => s.severity === "high" || s.severity === "critical");
  const hasMediumAi = aiSignals.some((s) => s.severity === "medium");

  if (hasHighAi) {
    findings.push({ icon: <AlertTriangle className="w-5 h-5 text-trust-red" />, text: "AI-generation signals detected", status: "warning" });
  } else if (hasMediumAi) {
    findings.push({ icon: <AlertTriangle className="w-5 h-5 text-trust-orange" />, text: "Possible AI-assisted elements", status: "warning" });
  } else {
    findings.push({ icon: <CheckCircle className="w-5 h-5 text-trust-green" />, text: "No strong AI-generation signals", status: "ok" });
  }

  // Manipulation signals
  const manipSignals = signals.filter((s) => s.category === "manipulation");
  const hasHighManip = manipSignals.some((s) => s.severity === "high" || s.severity === "critical");

  if (hasHighManip) {
    findings.push({ icon: <AlertTriangle className="w-5 h-5 text-trust-orange" />, text: "Possible manipulation signals", status: "warning" });
  } else {
    findings.push({ icon: <CheckCircle className="w-5 h-5 text-trust-green" />, text: "No strong manipulation signals", status: "ok" });
  }

  // Audio signals for video
  const audioSignals = signals.filter((s) => s.category === "audio");
  const hasHighAudio = audioSignals.some((s) => s.severity === "high" || s.severity === "critical");
  if (audioSignals.length > 0) {
    if (hasHighAudio) {
      findings.push({ icon: <AlertTriangle className="w-5 h-5 text-trust-red" />, text: "Synthetic audio signals detected", status: "warning" });
    } else {
      findings.push({ icon: <CheckCircle className="w-5 h-5 text-trust-green" />, text: "Audio appears natural", status: "ok" });
    }
  }

  // Integrity
  const integritySignals = signals.filter((s) => s.category === "integrity");
  const hasIntegrityIssue = integritySignals.some((s) => s.severity === "high" || s.severity === "medium");
  if (!hasIntegrityIssue) {
    findings.push({ icon: <CheckCircle className="w-5 h-5 text-trust-green" />, text: "No obvious file corruption", status: "ok" });
  }

  // Provenance
  if (provenanceStatus === "verified") {
    findings.push({ icon: <CheckCircle className="w-5 h-5 text-trust-green" />, text: "Verified provenance available", status: "ok" });
  } else {
    findings.push({ icon: <Circle className="w-5 h-5 text-slate-400" />, text: "No verified provenance available", status: "neutral" });
  }

  return (
    <div className="rounded-xl border border-slate-200 p-6 bg-white">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">What We Found</h3>
      <div className="space-y-3">
        {findings.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            {f.icon}
            <span className="text-sm text-slate-700">{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
