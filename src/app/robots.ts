import type { MetadataRoute } from "next";

/**
 * robots.txt — generated at build time.
 * Google crawls the public site freely; private/API paths are blocked.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://trustlens.ai").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
          "/login",
          "/signup",
          "/settings",
          "/reports",
          "/result",
          "/test",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ""),
  };
}
