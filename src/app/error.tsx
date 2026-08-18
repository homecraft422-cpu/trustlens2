"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        An unexpected error occurred while loading this page. You can try again —
        if the problem persists, contact support at support@trustlens.ai.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-700"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Home className="h-4 w-4" /> Back to home
        </Link>
      </div>
    </div>
  );
}
