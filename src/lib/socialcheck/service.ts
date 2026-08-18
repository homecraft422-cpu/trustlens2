/**
 * Social Media Post Check — real analysis.
 *
 * What we can actually do without platform API tokens:
 *   1. Recognize the platform and post type from the URL.
 *   2. YouTube: fetch REAL metadata via the free YouTube oEmbed endpoint
 *      (title, author, thumbnail) and analyze the channel via the standard
 *      page fetch + RDAP checks.
 *   3. Other platforms: fetch the public page server-side (many posts are
 *      server-rendered) and apply the same transport/domain/page checks.
 *
 * What we explicitly DO NOT do: invent follower counts, engagement ratios, or
 * "bot scores" — the old version simulated those with random numbers. Where we
 * lack data we say so.
 */

import { analyzeUrl, type UrlCheckResult } from "../urlcheck/service";

export type SocialPlatform =
  | "youtube"
  | "instagram"
  | "twitter"
  | "tiktok"
  | "facebook"
  | "linkedin"
  | "whatsapp"
  | "other";

export interface SocialCheckResult {
  platform: SocialPlatform;
  url: string;
  platformLabel: string;
  postType: string | null;
  embed: {
    title: string | null;
    authorName: string | null;
    thumbnailUrl: string | null;
    authorUrl: string | null;
  };
  pageAnalysis: UrlCheckResult | null;
  summary: string;
  caveats: string[];
  analyzedAt: string;
}

const PLATFORM_INFO: Record<SocialPlatform, { label: string; hosts: RegExp[] }> = {
  youtube: {
    label: "YouTube",
    hosts: [/(^|\.)youtube\.com$/i, /(^|\.)youtu\.be$/i, /(^|\.)youtube-nocookie\.com$/i],
  },
  instagram: {
    label: "Instagram",
    hosts: [/(^|\.)instagram\.com$/i, /(^|\.)instagr\.am$/i],
  },
  twitter: {
    label: "X (Twitter)",
    hosts: [/(^|\.)twitter\.com$/i, /(^|\.)x\.com$/i, /(^|\.)t\.co$/i],
  },
  tiktok: {
    label: "TikTok",
    hosts: [/(^|\.)tiktok\.com$/i, /(^|\.)vm\.tiktok\.com$/i],
  },
  facebook: {
    label: "Facebook",
    hosts: [/(^|\.)facebook\.com$/i, /(^|\.)fb\.com$/i, /(^|\.)fb\.watch$/i],
  },
  linkedin: {
    label: "LinkedIn",
    hosts: [/(^|\.)linkedin\.com$/i, /(^|\.)lnkd\.in$/i],
  },
  whatsapp: {
    label: "WhatsApp",
    hosts: [/(^|\.)whatsapp\.com$/i, /(^|\.)wa\.me$/i],
  },
  other: { label: "Web page", hosts: [] },
};

export function detectPlatform(url: string): SocialPlatform {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const [platform, info] of Object.entries(PLATFORM_INFO) as Array<[SocialPlatform, typeof PLATFORM_INFO.youtube]>) {
      if (platform === "other") continue;
      if (info.hosts.some((re) => re.test(host))) return platform;
    }
  } catch {
    // fall through
  }
  return "other";
}

function postType(url: string, platform: SocialPlatform): string | null {
  try {
    const path = new URL(url).pathname.toLowerCase();
    switch (platform) {
      case "youtube":
        if (path.includes("/shorts/")) return "Shorts video";
        if (path.startsWith("/watch") || path.startsWith("/v/")) return "Video";
        if (path.startsWith("/live/")) return "Live stream";
        if (path.startsWith("/@") || path.startsWith("/channel/") || path.startsWith("/user/")) return "Channel page";
        return "Video";
      case "instagram":
        if (path.startsWith("/p/") || path.startsWith("/reel/")) return "Post / Reel";
        if (path.startsWith("/stories/")) return "Story";
        return "Profile";
      case "twitter":
        if (/\/status\/\d+/.test(path)) return "Post (tweet)";
        return "Profile";
      case "tiktok":
        if (path.startsWith("/@")) return "Video or profile";
        return "Video";
      case "facebook":
        if (path.startsWith("/watch")) return "Video";
        if (/\/posts\//.test(path)) return "Post";
        return "Page";
      default:
        return null;
    }
  } catch {
    return null;
  }
}

async function youtubeOEmbed(url: string): Promise<SocialCheckResult["embed"]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return { title: null, authorName: null, thumbnailUrl: null, authorUrl: null };
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      author_url?: string;
    };
    return {
      title: data.title || null,
      authorName: data.author_name || null,
      thumbnailUrl: data.thumbnail_url || null,
      authorUrl: data.author_url || null,
    };
  } catch {
    return { title: null, authorName: null, thumbnailUrl: null, authorUrl: null };
  }
}

export async function analyzeSocialPost(rawUrl: string): Promise<SocialCheckResult> {
  let url: string;
  try {
    url = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
    new URL(url);
  } catch {
    throw new Error("INVALID_URL");
  }

  const platform = detectPlatform(url);
  const platformLabel = PLATFORM_INFO[platform].label;
  const postTypeLabel = postType(url, platform);

  const embed =
    platform === "youtube"
      ? await youtubeOEmbed(url)
      : { title: null, authorName: null, thumbnailUrl: null, authorUrl: null };

  // Analyze the page itself (transport, domain age, structure) — same engine
  // as the URL checker. Most social post pages are public.
  const pageAnalysis = await analyzeUrl(url).catch(() => null);

  const caveats: string[] = [];
  if (platform === "instagram" || platform === "facebook") {
    caveats.push(
      "Instagram/Facebook often block automated access or require login; if the page analysis returned no data, open the link in your browser."
    );
  }
  if (platform === "twitter") {
    caveats.push(
      "X may require login for many posts. Use the page analysis results with that in mind."
    );
  }
  caveats.push(
    "This tool checks the page, transport, and domain — it cannot see private engagement data or verify who controls an account."
  );

  let summary: string;
  if (!pageAnalysis) {
    summary = `We identified this as a ${platformLabel} link${postTypeLabel ? ` (${postTypeLabel})` : ""} but could not fetch the page for analysis. Open it in your browser and check: who posted it, when the account was created, and whether reputable sources cover it.`;
  } else {
    summary = `This is a ${platformLabel} link${postTypeLabel ? ` (${postTypeLabel})` : ""}. The page is ${
      pageAnalysis.reachable ? "reachable" : "not reachable"
    }${pageAnalysis.https ? " over HTTPS" : " over plain HTTP"} and the domain has a credibility score of ${
      pageAnalysis.credibilityScore
    }/100. Remember: a reachable page does not prove the post is authentic — verify the account and the claims it makes.`;
  }

  return {
    platform,
    url,
    platformLabel,
    postType: postTypeLabel,
    embed,
    pageAnalysis,
    summary,
    caveats,
    analyzedAt: new Date().toISOString(),
  };
}
