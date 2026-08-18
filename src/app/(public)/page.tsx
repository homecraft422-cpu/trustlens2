import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Search,
  FileCheck,
  BarChart3,
  Eye,
  ArrowRight,
  Image,
  Video,
  Music,
  MessageSquare,
  Globe,
  Camera,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Gauge,
  Link2,
  Activity,
} from "lucide-react";
import Header from "@/components/Header";
import { SITE_NAME, SITE_DESCRIPTION, getSiteUrl } from "@/lib/seo";
import { getRecentPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Free AI Content Detection, Deepfake & Manipulation Checker`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Verify Before You Believe`,
    description: SITE_DESCRIPTION,
    type: "website",
    url: getSiteUrl(),
  },
};

const TOOLS = [
  {
    id: "image-check",
    title: "Image Verification",
    desc: "Detect AI-generated or manipulated images with detailed evidence",
    icon: Image,
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    href: "/analyze",
    badge: "Popular",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "video-check",
    title: "Video Verification",
    desc: "Analyze videos for deepfakes, face swaps, and manipulation",
    icon: Video,
    color: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-50",
    textColor: "text-purple-600",
    href: "/analyze",
    badge: null,
    badgeColor: "",
  },
  {
    id: "audio-check",
    title: "Audio Analysis",
    desc: "Detect AI-generated speech, voice cloning, and synthetic audio",
    icon: Music,
    color: "from-green-500 to-green-600",
    bgLight: "bg-green-50",
    textColor: "text-green-600",
    href: "/tools/audio-check",
    badge: "New",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    id: "fact-check",
    title: "Fact Checker",
    desc: "Verify claims against professional fact-checking sources",
    icon: MessageSquare,
    color: "from-orange-500 to-orange-600",
    bgLight: "bg-orange-50",
    textColor: "text-orange-600",
    href: "/tools/fact-check",
    badge: "Live API",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    id: "social-check",
    title: "Social Media Post Check",
    desc: "Real analysis of YouTube, Instagram, X, TikTok & Facebook links",
    icon: Camera,
    color: "from-pink-500 to-pink-600",
    bgLight: "bg-pink-50",
    textColor: "text-pink-600",
    href: "/tools/social-check",
    badge: "Live API",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  {
    id: "url-check",
    title: "URL Content Check",
    desc: "Server-side page analysis with domain age & security checks",
    icon: Globe,
    color: "from-cyan-500 to-cyan-600",
    bgLight: "bg-cyan-50",
    textColor: "text-cyan-600",
    href: "/tools/url-check",
    badge: "Live API",
    badgeColor: "bg-cyan-100 text-cyan-700",
  },
];

const TRUST_PRINCIPLES = [
  {
    title: "Evidence, not empty claims",
    desc: "See the signals and reasoning behind every assessment.",
    icon: FileCheck,
  },
  {
    title: "Uncertainty stays visible",
    desc: "Confidence and limitations are shown clearly—never hidden.",
    icon: Eye,
  },
  {
    title: "Your content stays yours",
    desc: "Uploads are not used to train our models without explicit permission.",
    icon: Lock,
  },
  {
    title: "Human judgment comes first",
    desc: "TrustLens informs your decision; it does not make it for you.",
    icon: Shield,
  },
];

const STATS = [
  { value: "30+", label: "Forensic signals per file" },
  { value: "12+", label: "Media formats supported" },
  { value: "100 MB", label: "Max video analysis size" },
  { value: "100%", label: "Free to start" },
];

const FAQS = [
  {
    q: "How accurate is AI content detection?",
    a: "No AI detector is 100% accurate. TrustLens reports AI-involvement and manipulation scores as probabilities with a confidence level, and always shows the underlying evidence. We never claim absolute certainty — and we tell you when evidence is insufficient.",
  },
  {
    q: "What file types can I analyze?",
    a: "Images (JPG, PNG, WEBP), videos (MP4, MOV, WEBM up to 100 MB), and audio (MP3, WAV, OGG, FLAC, AAC, M4A up to 50 MB). Claims and URLs can be checked with our Fact Checker and URL Check tools.",
  },
  {
    q: "Is TrustLens free?",
    a: "Yes. Guests can run a limited number of checks without an account, and free accounts get recurring monthly credits. Paid plans exist for heavy usage, but the tools are fully usable without paying.",
  },
  {
    q: "Do you keep my uploaded files?",
    a: "Uploaded media is processed only to produce your analysis report. It is not used to train AI models and is not sold. You can request deletion of your data at any time — see our Data Rights page.",
  },
  {
    q: "Can TrustLens tell me if something is definitely fake?",
    a: "No tool can prove a file is 'definitely' fake, and we don't pretend to. We combine metadata forensics, statistical analysis, and (when configured) neural detection APIs, then present an honest verdict with evidence and limitations.",
  },
];

export default function HomePage() {
  const siteUrl = getSiteUrl();
  const recentPosts = getRecentPosts(3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: siteUrl,
        logo: `${siteUrl}/icon.svg`,
        description: SITE_DESCRIPTION,
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@trustlens.ai",
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-brand-50/20 to-blue-50/30" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-200/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-14">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              Evidence-first content verification
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
              Trust What You Can{" "}
              <span className="bg-gradient-to-r from-brand-600 to-blue-600 bg-clip-text text-transparent">
                Verify
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Examine suspicious images, videos, audio, claims, and links with
              transparent evidence, clear confidence levels, and honest
              limitations—so every decision starts with context, not guesswork.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/analyze"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30"
              >
                <Zap className="w-5 h-5" />
                Start Verification
              </Link>
              <a
                href="#tools"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-colors"
              >
                Explore Tools
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl mx-auto">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 py-4 text-center shadow-sm"
              >
                <div className="text-2xl font-extrabold text-brand-600">{stat.value}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust principles */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                The TRUSTLENS promise
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Built to earn your trust through clarity—not demand it through big claims.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRUST_PRINCIPLES.map((principle) => (
                <div
                  key={principle.title}
                  className="bg-white/85 backdrop-blur-sm rounded-2xl border border-slate-200/70 p-5 text-left shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                    <principle.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{principle.title}</h2>
                  <p className="text-xs text-slate-500 leading-5 mt-1.5">{principle.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="tools" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Verification Tools
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Choose the right tool for your content. Each tool is specialized
              for specific verification needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-brand-200 transition-all duration-300 hover:-translate-y-1"
              >
                {tool.badge && (
                  <span
                    className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-0.5 rounded-full ${tool.badgeColor}`}
                  >
                    {tool.badge}
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-xl ${tool.bgLight} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <tool.icon className={`w-6 h-6 ${tool.textColor}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {tool.desc}
                </p>
                <div className="flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Tool
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Three simple steps to verify any content.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                step: "1",
                title: "Upload or Paste",
                desc: "Upload an image, video, audio file, or paste a URL/claim text. We support all major formats.",
              },
              {
                icon: Gauge,
                step: "2",
                title: "Deep Analysis",
                desc: "Our engine checks metadata, statistics, provenance, AI-generation signals, manipulation, and facts — across multiple providers.",
              },
              {
                icon: FileCheck,
                step: "3",
                title: "Get Your Report",
                desc: "Receive a detailed trust report with scores, evidence, and clear explanations — no jargon.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-brand-600" />
                </div>
                <div className="text-xs font-bold text-brand-500 mb-2">
                  STEP {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Analyze */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What We Analyze
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              We separate AI detection from manipulation detection — because AI
              involvement does not automatically mean deception.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Eye,
                title: "AI Involvement",
                desc: "How likely the content contains AI-generated or AI-assisted components.",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: Shield,
                title: "Manipulation",
                desc: "How likely the original media has been altered deceptively.",
                color: "text-orange-600 bg-orange-50",
              },
              {
                icon: Lock,
                title: "Provenance",
                desc: "Whether verifiable origin/history information is available (incl. C2PA).",
                color: "text-green-600 bg-green-50",
              },
              {
                icon: Activity,
                title: "Confidence",
                desc: "How strong the available evidence is to support the analysis.",
                color: "text-purple-600 bg-purple-50",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Levels */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Understanding Trust Levels
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Our verdict system is designed to be transparent and nuanced.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                level: "Likely Authentic",
                icon: CheckCircle2,
                color: "text-green-600 bg-green-50",
                desc: "Strong evidence that content is genuine",
              },
              {
                level: "Possibly Manipulated",
                icon: AlertTriangle,
                color: "text-orange-600 bg-orange-50",
                desc: "Some indicators of editing or alteration",
              },
              {
                level: "Likely AI Generated",
                icon: XCircle,
                color: "text-red-600 bg-red-50",
                desc: "Strong indicators of synthetic content",
              },
              {
                level: "Insufficient Evidence",
                icon: HelpCircle,
                color: "text-slate-600 bg-slate-50",
                desc: "Not enough data for reliable verdict",
              },
            ].map((item) => (
              <div
                key={item.level}
                className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{item.level}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500">
              Honest answers about accuracy, privacy, and how verification works.
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-md transition-shadow"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-bold text-slate-900">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
      {recentPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  From the blog
                </h2>
                <p className="mt-2 text-slate-500">
                  Practical guides on spotting AI media and verifying information.
                </p>
              </div>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                All articles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
                >
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}
                    {post.readingMinutes} min
                  </span>
                  <h3 className="mt-2 text-base font-extrabold leading-snug text-slate-900 group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  <p className="mt-2 flex-1 line-clamp-3 text-sm text-slate-500">
                    {post.description}
                  </p>
                  <span className="mt-3 text-xs font-bold text-brand-600">
                    Read article →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Teaser */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold text-white mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            FREE TIER — NO CREDIT CARD REQUIRED
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Fair pricing, built for everyone
          </h2>
          <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
            Start free, understand exactly what is included, and upgrade only when your
            workflow grows. Clear limits, flexible plans, and no inflated promises.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-2xl bg-white text-brand-700 font-bold text-sm hover:bg-brand-50 transition-colors shadow-lg"
            >
              View Plans & Pricing
            </Link>
            <Link
              href="/analyze"
              className="px-8 py-3.5 rounded-2xl bg-brand-500/40 border border-white/30 text-white font-bold text-sm hover:bg-brand-500/60 transition-colors"
            >
              Try Free Check
            </Link>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            Built on Transparency
          </h2>
          <div className="space-y-4 text-left">
            {[
              "AI-content detection is probabilistic. We never claim absolute certainty.",
              "AI involvement does not automatically mean the content is fake or deceptive.",
              "Absence of provenance does not prove that content is fake.",
              "We explain our reasoning — you decide what to trust.",
              "Your uploaded content is processed securely and never used for training.",
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"
              >
                <Shield className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
            >
              <Zap className="w-5 h-5" />
              Start Verifying Content
            </Link>
            <Link
              href="/api/v1/fact-check"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              <Link2 className="w-5 h-5" />
              Explore the APIs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
