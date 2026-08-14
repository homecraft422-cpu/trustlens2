import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  FileSearch,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "About TRUSTLENS",
  description: "Our mission, principles, and approach to transparent content verification.",
};

const principles = [
  {
    icon: Eye,
    title: "Explain the evidence",
    text: "We show confidence, signals, provenance, and limitations instead of hiding everything behind one score.",
  },
  {
    icon: Scale,
    title: "Avoid absolute claims",
    text: "Detection is probabilistic. AI involvement is not the same as deception, and uncertainty must remain visible.",
  },
  {
    icon: Shield,
    title: "Protect submitted content",
    text: "We minimize processing, use security safeguards, and do not train our own models on uploads without explicit permission.",
  },
  {
    icon: Users,
    title: "Keep humans in control",
    text: "TRUSTLENS supports better judgment; it does not replace journalists, forensic experts, or due process.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="overflow-hidden bg-slate-950 px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-xl shadow-brand-900/40">
              <Shield className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-300">About TRUSTLENS</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Verify before you believe—or share.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              TRUSTLENS brings media analysis, deepfake detection, provenance, fact-checking,
              and transparent reporting into one evidence-led verification workflow.
            </p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Our mission</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Make content verification clearer, faster, and more responsible.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                Synthetic and manipulated media are getting easier to create while reliable context remains
                fragmented. Our goal is not to declare truth from a black box. It is to help people collect useful
                signals, understand uncertainty, and decide what should be investigated next.
              </p>
              <p className="mt-4 text-base leading-7 text-slate-600">
                TRUSTLENS is designed for creators, readers, educators, journalists, analysts, newsrooms,
                organizations, and anyone who wants a more careful way to assess digital content.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-9">
              <h3 className="text-lg font-bold text-slate-950">One verification workspace</h3>
              <ul className="mt-5 space-y-4">
                {[
                  "Images and video for AI-generation or manipulation signals",
                  "Audio for synthetic voice and deepfake indicators",
                  "Claims, social posts, and URLs for context and source review",
                  "Metadata, content fingerprints, and available C2PA provenance",
                  "Confidence-aware reports that can be saved and shared",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">How we think</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Principles before predictions</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {principles.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-br from-brand-700 to-blue-800 p-8 text-white shadow-xl shadow-brand-900/20 sm:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <FileSearch className="h-7 w-7 text-brand-200" aria-hidden="true" />
                  <BarChart3 className="h-7 w-7 text-brand-200" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight">See the evidence for yourself.</h2>
                <p className="mt-3 max-w-2xl leading-7 text-brand-100">
                  Start with a free analysis, review how the confidence and findings are presented, and always
                  independently confirm decisions that matter.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:flex-col">
                <Link href="/analyze" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-800 hover:bg-brand-50">
                  Analyze content <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
