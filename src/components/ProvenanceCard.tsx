import { ShieldCheck, ShieldX, ShieldQuestion, Shield } from "lucide-react";

const statusConfig: Record<string, { label: string; description: string; icon: typeof Shield; color: string }> = {
  verified: {
    label: "Verified Provenance",
    description: "A verified Content Credential was found for this file.",
    icon: ShieldCheck,
    color: "text-trust-green",
  },
  not_verified: {
    label: "No Verified Provenance Found",
    description: "No verified Content Credential was found in this file. This does not mean the content is fake.",
    icon: ShieldX,
    color: "text-trust-yellow",
  },
  unavailable: {
    label: "Provenance Unavailable",
    description: "Provenance information could not be analyzed for this file. Absence of provenance does not prove that content is fake.",
    icon: ShieldQuestion,
    color: "text-trust-gray",
  },
  detected_unverified: {
    label: "Provenance Detected But Unverified",
    description: "Provenance information was detected but could not be verified. This may indicate incomplete or tampered credentials.",
    icon: Shield,
    color: "text-trust-orange",
  },
};

export default function ProvenanceCard({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.unavailable;
  const Icon = cfg.icon;

  return (
    <div className="rounded-xl border border-slate-200 p-6 bg-white">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Provenance</h3>
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 mt-0.5 ${cfg.color}`} />
        <div>
          <p className="font-semibold text-slate-800">{cfg.label}</p>
          <p className="text-sm text-slate-500 mt-1">{cfg.description}</p>
        </div>
      </div>
    </div>
  );
}
