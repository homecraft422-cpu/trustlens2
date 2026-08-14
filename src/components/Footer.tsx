"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "#0f172a", color: "#94a3b8", marginTop: "auto" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🛡️</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>TRUST<span style={{ color: "#748ffc" }}>LENS</span></span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>India & worldwide content verification platform. Detect fake images, deepfake videos, AI audio, verify social media posts, and fact-check claims.</p>
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Tools</h3>
            {[
              ["/analyze", "Image & Video Check"],
              ["/tools/audio-check", "Audio Analysis"],
              ["/tools/fact-check", "Fact Checker"],
              ["/tools/social-check", "Social Media Check"],
              ["/tools/url-check", "URL Content Check"],
            ].map(([h, l]) => (
              <Link key={h} href={h} style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</Link>
            ))}
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Resources</h3>
            {[["/#how-it-works", "How It Works"], ["/pricing", "Pricing & Plans"], ["/dashboard", "Dashboard"], ["/reports", "My Reports"]].map(([h, l]) => (
              <Link key={h} href={h} style={{ display: "block", fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 10 }}>{l}</Link>
            ))}
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>About</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>Built for transparency and truth. Verify before you believe.</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, textAlign: "center", fontSize: 13 }}>
          © {new Date().getFullYear()} TRUSTLENS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
