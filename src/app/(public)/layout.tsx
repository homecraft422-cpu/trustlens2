import type { ReactNode } from "react";
import AdsterraAds from "@/components/ads/AdsterraAds";

/**
 * Layout for all public-facing pages (home, tools, legal pages, reports, …).
 *
 * Adsterra in-page ad units (native banner + 160x300) render at the bottom
 * of every public page, just above the global footer. Auth/dashboard/admin
 * pages live outside this group and stay ad-free.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdsterraAds />
    </>
  );
}
