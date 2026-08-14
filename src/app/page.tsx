"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Shield, Search, FileCheck, BarChart3, Eye, Share2, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-brand-50/30 to-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              Content Trust & Authenticity Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
              Can you trust what you&apos;re seeing?
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
              Analyze images and videos for AI generation, manipulation signals,
              provenance, and evidence — before you believe or share them.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/analyze"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
              >
                Check Content
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-colors"
              >
                How It Works
              </a>
            </div>
          </div>

          {/* Hero upload preview */}
          <div className="max-w-2xl mx-auto">
            <Link
              href="/analyze"
              className="block border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center bg-white/80 backdrop-blur-sm hover:border-brand-400 hover:bg-brand-50/50 transition-all group"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <Search className="w-6 h-6 text-brand-500" />
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-1">
                Drop an image or short video here
              </p>
              <p className="text-sm text-slate-500 mb-3">or click to browse</p>
              <p className="text-xs text-slate-400">
                JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM
              </p>
            </Link>
            <p className="mt-3 text-xs text-slate-400 text-center">
              Your uploaded media is processed securely and is not used for model training without explicit permission.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Three steps to understand the content you&apos;re looking at.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                step: "1",
                title: "Upload",
                desc: "Upload an image or short video you want to verify. We accept common formats and process them securely.",
              },
              {
                icon: BarChart3,
                step: "2",
                title: "Analyze",
                desc: "Our system checks for AI-generation signals, manipulation indicators, metadata, and provenance information.",
              },
              {
                icon: FileCheck,
                step: "3",
                title: "Understand",
                desc: "Get a clear trust report with scores, evidence explanations, and confidence levels — no AI jargon needed.",
              },
            ].map((item) => (
              <div key={item.step} className="relative p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div className="text-xs font-bold text-brand-500 mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Check */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What We Analyze
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              We separate AI detection from manipulation detection — because
              AI involvement does not automatically mean deception.
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
                icon: FileCheck,
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
              <div key={item.title} className="p-6 rounded-2xl bg-white border border-slate-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Promise */}
      <section className="py-20 bg-white">
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
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Shield className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{text}</p>
              </div>
            ))}
          </div>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 mt-8 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Start Checking Content
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
