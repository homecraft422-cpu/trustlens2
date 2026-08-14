"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

const TOOLS = [
  {
    id: "image-check",
    title: "Image Verification",
    desc: "Detect AI-generated or manipulated images with detailed analysis",
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
    desc: "Verify claims, headlines, and statements against trusted sources",
    icon: MessageSquare,
    color: "from-orange-500 to-orange-600",
    bgLight: "bg-orange-50",
    textColor: "text-orange-600",
    href: "/tools/fact-check",
    badge: "New",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    id: "social-check",
    title: "Social Media Post Check",
    desc: "Verify Instagram, Twitter, YouTube posts for authenticity",
    icon: Camera,
    color: "from-pink-500 to-pink-600",
    bgLight: "bg-pink-50",
    textColor: "text-pink-600",
    href: "/tools/social-check",
    badge: "New",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  {
    id: "url-check",
    title: "URL Content Check",
    desc: "Analyze content from any URL for manipulation signals",
    icon: Globe,
    color: "from-cyan-500 to-cyan-600",
    bgLight: "bg-cyan-50",
    textColor: "text-cyan-600",
    href: "/tools/url-check",
    badge: null,
    badgeColor: "",
  },
];

const STATS = [
  { label: "Images Analyzed", value: "2.4M+", icon: Image },
  { label: "Videos Checked", value: "180K+", icon: Video },
  { label: "Accuracy Rate", value: "94.2%", icon: TrendingUp },
  { label: "Active Users", value: "150K+", icon: Users },
];

const TRUST_LEVELS = [
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
];

export default function HomePage() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section - Modern & Clean */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-brand-50/20 to-blue-50/30" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-200/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              India & Worldwide Content Verification
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
              Verify Before You{" "}
              <span className="bg-gradient-to-r from-brand-600 to-blue-600 bg-clip-text text-transparent">
                Believe
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              All-in-one platform to detect fake images, deepfake videos, AI
              audio, verify social media posts, and fact-check claims — for
              India and worldwide content.
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

          {/* Stats Bar */}
          <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 text-center hover:shadow-md transition-shadow"
              >
                <stat.icon className="w-5 h-5 text-brand-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid - PDF24 Style */}
      <section id="tools" className="py-16 bg-white">
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
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
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
      <section id="how-it-works" className="py-16 bg-slate-50">
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
                icon: BarChart3,
                step: "2",
                title: "Deep Analysis",
                desc: "Our AI engine checks for manipulation, AI generation, deepfakes, fact accuracy, and more.",
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

      {/* What We Check */}
      <section className="py-16 bg-white">
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
                desc: "Whether verifiable origin/history information is available.",
                color: "text-green-600 bg-green-50",
              },
              {
                icon: BarChart3,
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
      <section className="py-16 bg-slate-50">
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
            {TRUST_LEVELS.map((level) => (
              <div
                key={level.level}
                className="flex items-start gap-4 p-5 rounded-xl bg-white border border-slate-200"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${level.color}`}
                >
                  <level.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{level.level}</h3>
                  <p className="text-sm text-slate-500 mt-1">{level.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Promise */}
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
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 mt-8 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
          >
            <Zap className="w-5 h-5" />
            Start Verifying Content
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
