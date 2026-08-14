import Link from "next/link";
import { Mail, Shield, ShieldCheck } from "lucide-react";

const FOOTER_GROUPS = [
  {
    title: "Verification Tools",
    links: [
      { href: "/analyze", label: "Image & Video Check" },
      { href: "/tools/audio-check", label: "Audio Analysis" },
      { href: "/tools/fact-check", label: "Fact Checker" },
      { href: "/tools/social-check", label: "Social Media Check" },
      { href: "/tools/url-check", label: "URL Content Check" },
      { href: "/tools/content-fingerprint", label: "Content Fingerprint" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/pricing", label: "Pricing & Plans" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/reports", label: "My Reports" },
      { href: "/about", label: "About TRUSTLENS" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/disclaimer", label: "Analysis Disclaimer" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/acceptable-use", label: "Acceptable Use Policy" },
      { href: "/refund-policy", label: "Refund & Cancellation" },
    ],
  },
  {
    title: "Trust & Support",
    links: [
      { href: "/data-rights", label: "Data Rights & Deletion" },
      { href: "/security", label: "Security" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "mailto:support@trustlens.com", label: "Support" },
      { href: "mailto:security@trustlens.com", label: "Report a Vulnerability" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-950 text-slate-400" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,1fr)] lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1 lg:pr-5">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white" aria-label="TRUSTLENS home">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-blue-700 shadow-lg shadow-brand-950/40">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                TRUST<span className="text-brand-400">LENS</span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
              Content verification for a more transparent internet. Analyze images, videos,
              audio, claims, social posts, and URLs—then review the evidence before you decide.
            </p>
            <div className="mt-5 inline-flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-3 text-xs leading-5 text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>Results are probabilistic, not proof. Always verify important decisions independently.</span>
            </div>
            <a
              href="mailto:support@trustlens.com"
              className="mt-5 flex w-fit items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              support@trustlens.com
            </a>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white">
                {group.title}
              </h2>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        className="text-sm leading-5 text-slate-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm leading-5 text-slate-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-11 flex flex-col gap-4 border-t border-slate-800 pt-6 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TRUSTLENS. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="transition-colors hover:text-slate-300">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-slate-300">Terms</Link>
            <Link href="/cookies" className="transition-colors hover:text-slate-300">Cookies</Link>
            <Link href="/disclaimer" className="transition-colors hover:text-slate-300">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
