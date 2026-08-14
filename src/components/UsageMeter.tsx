"use client";

interface UsageMeterProps {
  used: number;
  limit: number;
  isAuthenticated: boolean;
}

export default function UsageMeter({ used, limit, isAuthenticated }: UsageMeterProps) {
  const remaining = Math.max(0, limit - used);
  const pct = Math.min((used / limit) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 90 ? "bg-trust-red" : pct >= 60 ? "bg-trust-yellow" : "bg-brand-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">
        {remaining} {isAuthenticated ? "" : "free "}check{remaining !== 1 ? "s" : ""} remaining
      </span>
    </div>
  );
}
