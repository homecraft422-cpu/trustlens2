import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import Footer from "@/components/Footer";
import { ADS_ENABLED, ADSTERRA_ADS } from "@/lib/ads";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRUSTLENS — Evidence-First Content Verification",
  description:
    "Examine images, videos, audio, claims, and links with transparent evidence, clear confidence levels, and honest limitations.",
  keywords: [
    "fake image detection",
    "deepfake detection",
    "AI audio detection",
    "fact checker",
    "social media verification",
    "content authenticity",
    "evidence-based verification",
    "manipulation detection",
    "trust verification",
  ],
  openGraph: {
    title: "TRUSTLENS — Verify Before You Believe",
    description:
      "Understand suspicious digital content through transparent signals, clear confidence, and honest limitations.",
    type: "website",
  },
  verification: {
    google: "cz7qJT43zVb1OqXpA9_aOfk8YTa3KpMU6ALExy0qdGw",
  },
  other: {
    "google-adsense-account": "ca-pub-7020382922277193",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        {/* Adsterra popunder — runs before hydration (injected into <head>),
            one popunder per page. Site-wide per Adsterra's instructions. */}
        {ADS_ENABLED && (
          <Script src={ADSTERRA_ADS.popunderSrc} strategy="beforeInteractive" />
        )}
        <div className="flex-1">{children}</div>
        <Footer />
        {/* Adsterra social bar — loads right before the end of the page,
            equivalent to placing it above the closing </body> tag. */}
        {ADS_ENABLED && (
          <Script src={ADSTERRA_ADS.socialBarSrc} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
