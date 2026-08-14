import type { Metadata } from "next";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
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
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
