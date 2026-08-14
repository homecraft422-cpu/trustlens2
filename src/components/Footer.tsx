"use client";

import Link from "next/link";
import { Shield, Heart, Globe, ExternalLink, Mail, BookOpen, HelpCircle } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-brand-400" />
              <span className="text-lg font-bold text-white">
                TRUST<span className="text-brand-400">LENS</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              India & worldwide content verification platform. Detect fake
              images, deepfake videos, AI audio, verify social media posts, and
              fact-check claims.
            </p>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="text-xs">Available Worldwide</span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Verification Tools
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/analyze", label: "Image & Video Check", desc: "Verify visual content" },
                { href: "/tools/audio-check", label: "Audio Analysis", desc: "Detect AI audio" },
                { href: "/tools/fact-check", label: "Fact Checker", desc: "Verify claims" },
                { href: "/tools/social-check", label: "Social Media Check", desc: "Verify posts" },
                { href: "/tools/url-check", label: "URL Content Check", desc: "Analyze web pages" },
                { href: "/tools/batch-process", label: "Batch Processing", desc: "Bulk analysis" },
                { href: "/tools/content-fingerprint", label: "Content Fingerprint", desc: "Track origins" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group block hover:text-white transition-colors"
                  >
                    <span className="text-sm font-medium">{link.label}</span>
                    <span className="block text-xs text-slate-500 group-hover:text-slate-400">
                      {link.desc}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/#how-it-works", label: "How It Works", icon: BookOpen },
                { href: "/#tools", label: "All Tools", icon: HelpCircle },
                { href: "/dashboard", label: "Analytics Dashboard", icon: ExternalLink },
                { href: "/reports", label: "My Reports", icon: ExternalLink },
                { href: "/settings", label: "Settings", icon: Mail },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm hover:text-white transition-colors"
                  >
                    <link.icon className="w-4 h-4 text-slate-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              About TrustLens
            </h3>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                We believe in transparency and truth. Our platform helps you
                verify content before you believe or share it.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>94.2% Detection Accuracy</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>2.4M+ Images Analyzed</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>150K+ Active Users</span>
                </div>
              </div>
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-white mb-2">Supported Regions</h4>
                <div className="flex flex-wrap gap-2">
                  {["India", "USA", "UK", "Global"].map((region) => (
                    <span
                      key={region}
                      className="text-xs px-2 py-1 bg-slate-800 rounded-full"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Principles */}
        <div className="border-t border-slate-800 pt-8 mb-8">
          <h3 className="text-sm font-semibold text-white mb-4">Our Trust Principles</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "AI detection is probabilistic, not absolute",
              "AI involvement ≠ deception",
              "Absence of provenance ≠ fake",
              "We explain, you decide",
            ].map((principle, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg"
              >
                <Shield className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-300">{principle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {currentYear} TRUSTLENS. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-slate-500 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-slate-500 hover:text-white">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-xs text-slate-500 hover:text-white">
              Contact
            </Link>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-red-400" /> for
            transparency and truth
          </p>
        </div>
      </div>
    </footer>
  );
}
