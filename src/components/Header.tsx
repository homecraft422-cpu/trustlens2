"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const TOOLS = [
  { href: "/analyze", label: "Image & Video Check", icon: "🖼️" },
  { href: "/tools/audio-check", label: "Audio Analysis", icon: "🎵" },
  { href: "/tools/fact-check", label: "Fact Checker", icon: "✅" },
  { href: "/tools/social-check", label: "Social Media Check", icon: "📱" },
  { href: "/tools/url-check", label: "URL Content Check", icon: "🌐" },
  { href: "/tools/batch-process", label: "Batch Processing", icon: "📦" },
  { href: "/tools/content-fingerprint", label: "Content Fingerprint", icon: "🔍" },
  { href: "/dashboard", label: "Analytics Dashboard", icon: "📊" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>TRUST<span style={{ color: "#4c6ef5" }}>LENS</span></span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setToolsOpen(!toolsOpen)} onBlur={() => setTimeout(() => setToolsOpen(false), 200)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>
                Tools ▾
              </button>
              {toolsOpen && (
                <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 8, width: 280, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: 8, zIndex: 50 }}>
                  {TOOLS.map(t => (
                    <Link key={t.href} href={t.href} onClick={() => setToolsOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, textDecoration: "none", color: "#334155", fontSize: 14 }}>
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/analyze" style={{ fontSize: 14, fontWeight: 500, color: "#475569", textDecoration: "none" }}>Check Content</Link>
            <Link href="/reports" style={{ fontSize: 14, fontWeight: 500, color: "#475569", textDecoration: "none" }}>My Reports</Link>
            <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 500, color: "#475569", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: "#475569", textDecoration: "none" }}>Sign In</Link>
            <Link href="/signup" style={{ fontSize: 14, fontWeight: 500, background: "#4c6ef5", color: "#fff", padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>Get Started</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
