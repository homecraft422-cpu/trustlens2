import type { MetadataRoute } from "next";
import { SITE_NAME, getSiteUrl } from "@/lib/seo";

/**
 * Web app manifest (progressive-web-app meta). Provides theme color and
 * identity so the site can be installed / looks native on mobile.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "AI content detection & verification: images, videos, audio, claims and links.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4c6ef5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    lang: "en",
    categories: ["utilities", "security", "productivity"],
    scope: "/",
  };
}

export const dynamic = "force-static";
export const revalidate = false;
void getSiteUrl;
