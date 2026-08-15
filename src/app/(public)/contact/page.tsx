import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  CreditCard,
  LifeBuoy,
  LockKeyhole,
  Mail,
  Scale,
  Shield,
} from "lucide-react";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Contact TRUSTLENS",
  description: "Contact TRUSTLENS support, billing, privacy, legal, security, or accessibility teams.",
};

const contacts = [
  {
    icon: LifeBuoy,
    title: "Product & account support",
    email: "support@trustlens.com",
    text: "Sign-in, uploads, analysis status, reports, supported formats, and account questions.",
  },
  {
    icon: CreditCard,
    title: "Billing & refunds",
    email: "billing@trustlens.com",
    text: "Plans, credits, renewals, cancellations, transaction errors, and refund requests.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy & data requests",
    email: "privacy@trustlens.com",
    text: "Access, correction, deletion, consent, advertising choices, and privacy grievances.",
  },
  {
    icon: Shield,
    title: "Security reports",
    email: "security@trustlens.com",
    text: "Potential vulnerabilities, account compromise, phishing, and responsible disclosure.",
  },
  {
    icon: Scale,
    title: "Legal & rights concerns",
    email: "legal@trustlens.com",
    text: "Terms, legal notices, intellectual-property concerns, and formal correspondence.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    email: "accessibility@trustlens.com",
    text: "Report an accessibility barrier or request an alternative way to access a feature or document.",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
              <Mail className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Contact TRUSTLENS</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">How can we help?</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Choose the address that best matches your question. Include enough context for us to help,
              but never send a password, one-time code, full payment credential, or unnecessary sensitive media.
            </p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map(({ icon: Icon, title, email, text }) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
                  {email} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Help us respond efficiently</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                <li>Write from the email connected to your account when possible.</li>
                <li>Include the relevant analysis, report, error, or transaction reference.</li>
                <li>Describe what happened, what you expected, and when it occurred.</li>
                <li>Redact card, bank, identity, and unrelated personal information.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <h2 className="font-bold text-slate-950">Important resources</h2>
              <div className="mt-4 grid gap-2">
                {[
                  ["/data-rights", "Request access or deletion"],
                  ["/refund-policy", "Read the refund policy"],
                  ["/security", "Report a security issue safely"],
                  ["/disclaimer", "Understand analysis limitations"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-700">
                    {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
