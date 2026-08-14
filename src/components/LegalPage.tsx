import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Mail, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";

interface ContentsItem {
  id: string;
  label: string;
}

interface LegalPageProps {
  title: string;
  description: string;
  badge: string;
  lastUpdated?: string;
  contents: ContentsItem[];
  children: ReactNode;
}

export default function LegalPage({
  title,
  description,
  badge,
  lastUpdated = "14 August 2026",
  contents,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to TRUSTLENS
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden lg:block lg:sticky lg:top-28">
            <nav
              aria-label={`${title} table of contents`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <FileText className="h-4 w-4" aria-hidden="true" />
                On this page
              </p>
              <ol className="space-y-1.5">
                {contents.map((item, index) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="group flex gap-2 rounded-lg px-2 py-1.5 text-sm leading-5 text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      <span className="w-5 shrink-0 text-xs font-bold text-slate-400 group-hover:text-brand-600">
                        {index + 1}.
                      </span>
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 px-6 py-10 text-white sm:px-10 sm:py-12">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-100">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {badge}
              </div>
              <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                {description}
              </p>
              <p className="mt-6 text-sm font-medium text-slate-400">
                Effective and last updated: {lastUpdated}
              </p>
            </header>

            <div className="px-6 py-9 sm:px-10 sm:py-12">
              <details className="mb-9 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:hidden">
                <summary className="cursor-pointer text-sm font-bold text-slate-800">
                  View table of contents
                </summary>
                <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                  {contents.map((item, index) => (
                    <li key={item.id}>
                      <a className="text-sm text-brand-700 hover:underline" href={`#${item.id}`}>
                        {index + 1}. {item.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>

              <div className="legal-content">{children}</div>

              <div className="mt-12 rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div>
                  <p className="font-bold text-slate-900">Questions about this document?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Contact us and include the policy name in your message.
                  </p>
                </div>
                <a
                  href="mailto:legal@trustlens.com"
                  className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 sm:mt-0"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  legal@trustlens.com
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function LegalCallout({
  title,
  children,
  tone = "blue",
}: {
  title: string;
  children: ReactNode;
  tone?: "blue" | "amber" | "green";
}) {
  const toneClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };

  return (
    <div className={`legal-callout ${toneClasses[tone]}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

export function PolicyLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href}>{children}</Link>;
}
