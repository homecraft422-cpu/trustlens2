import { Shield } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-brand-600" />
              <span className="text-lg font-bold tracking-tight text-slate-900">
                TRUST<span className="text-brand-600">LENS</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs">
              Detect. Verify. Explain. Analyze content for AI generation, manipulation, and provenance.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Product</h4>
              <div className="flex flex-col gap-2">
                <Link href="/analyze" className="text-sm text-slate-500 hover:text-slate-700">Check Content</Link>
                <Link href="/reports" className="text-sm text-slate-500 hover:text-slate-700">My Reports</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Account</h4>
              <div className="flex flex-col gap-2">
                <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">Sign In</Link>
                <Link href="/signup" className="text-sm text-slate-500 hover:text-slate-700">Get Started</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} TRUSTLENS. AI-content detection is probabilistic. Results are estimates based on available signals.
          </p>
        </div>
      </div>
    </footer>
  );
}
