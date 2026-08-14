import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRUSTLENS — India & Worldwide Content Verification Platform",
  description:
    "All-in-one platform to detect fake images, deepfake videos, AI audio, verify social media posts, and fact-check claims. Built for India and worldwide content verification.",
  keywords: [
    "fake image detection",
    "deepfake detection",
    "AI audio detection",
    "fact checker",
    "social media verification",
    "content authenticity",
    "India fact check",
    "manipulation detection",
    "trust verification",
  ],
  openGraph: {
    title: "TRUSTLENS — Verify Before You Believe",
    description:
      "Detect fake images, deepfake videos, AI audio, verify social media posts, and fact-check claims.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
