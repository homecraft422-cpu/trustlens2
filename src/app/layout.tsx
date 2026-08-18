import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import Footer from "@/components/Footer";
import ConsentBanner from "@/components/ConsentBanner";
import {
  ADS_ENABLED,
  ADSENSE_CLIENT,
  ADSENSE_ENABLED,
  ADSTERRA_ADS,
  ADSTERRA_POPUNDER_ENABLED,
  ADSTERRA_SOCIALBAR_ENABLED,
} from "@/lib/ads";
import { getSiteUrl, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — Evidence-First AI Content Verification`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI image detector",
    "deepfake detection",
    "AI content detector",
    "fake image detection",
    "AI audio detection",
    "fact checker",
    "content authenticity",
    "manipulation detection",
    "image forensics",
    "deepfake checker",
  ],
  authors: [{ name: "TrustLens" }],
  creator: "TrustLens",
  publisher: "TrustLens",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} — Verify Before You Believe`,
    description: SITE_DESCRIPTION,
    type: "website",
    url: siteUrl,
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — AI content verification`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Verify Before You Believe`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Google Search Console verification (keep or replace with yours).
    google: "cz7qJT43zVb1OqXpA9_aOfk8YTa3KpMU6ALExy0qdGw",
  },
  other: {
    // AdSense site ownership verification — must match ads.txt publisher ID.
    "google-adsense-account": ADSENSE_CLIENT || "ca-pub-7020382922277193",
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4c6ef5",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const showPopunder = ADS_ENABLED && ADSTERRA_POPUNDER_ENABLED;
  const showSocialBar = ADS_ENABLED && ADSTERRA_SOCIALBAR_ENABLED;
  const showAdsense = ADSENSE_ENABLED;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        {/* Adsterra popunder — opt-in only (disabled by default; pop-unders
            violate Google AdSense policies). */}
        {showPopunder && (
          <Script src={ADSTERRA_ADS.popunderSrc} strategy="beforeInteractive" />
        )}

        {/* Google AdSense auto ads — loads only when a real ca-pub client is
            configured in .env (NEXT_PUBLIC_ADSENSE_CLIENT). */}
        {showAdsense && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        <div className="flex-1">{children}</div>

        <Footer />

        {/* Adsterra social bar — site-wide, kept optional. */}
        {showSocialBar && (
          <Script src={ADSTERRA_ADS.socialBarSrc} strategy="afterInteractive" />
        )}

        {/* GDPR/EEA cookie-consent banner (ads only load after consent in EEA). */}
        <ConsentBanner />
      </body>
    </html>
  );
}
