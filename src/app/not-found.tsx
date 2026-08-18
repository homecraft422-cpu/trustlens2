import Link from "next/link";
import { SearchX, Home, Zap } from "lucide-react";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <SearchX className="h-8 w-8" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
          Error 404
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-slate-600">
          The page you're looking for doesn't exist, was moved, or the link is
          outdated. Let's get you back to verifying content.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-700"
          >
            <Home className="h-4 w-4" /> Back to home
          </Link>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Zap className="h-4 w-4 text-brand-600" /> Analyze a file
          </Link>
        </div>
      </main>
    </div>
  );
}
