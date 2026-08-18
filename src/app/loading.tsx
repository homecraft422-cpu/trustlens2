import { Shield } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white px-4">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <Shield className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">Loading…</p>
    </div>
  );
}
