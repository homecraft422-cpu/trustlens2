/**
 * Advertising configuration — TRUSTLENS
 *
 * All ad units live here in one place so they are easy to review, update, or
 * disable. The site supports two independent networks:
 *
 *   1. Google AdSense (preferred — enables monetisation + keeps AdSense policy)
 *      - Enable by setting NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXX in .env.
 *      - The <meta name="google-adsense-account"> tag is always emitted from the
 *        root layout so Google can verify ownership even before ads go live.
 *      - ads.txt at the site root must list your real publisher ID.
 *
 *   2. Adsterra (legacy units — keep or disable per your choice)
 *      - Native banner (1:4 widget)  → rendered by <AdsterraAds />
 *      - Banner 160x300              → rendered by <AdsterraAds />
 *      - Social bar                  → injected in root layout
 *      - Popunder                    → OPT-OUT by default. Pop-unders/pop-ups
 *        violate Google AdSense program policies; if you ever enable AdSense,
 *        keep this OFF. Enable only if you stay Adsterra-only with
 *        NEXT_PUBLIC_ADSTERRA_POPUNDER_ENABLED=true.
 *
 * Control switches (all read at build time):
 *   NEXT_PUBLIC_ADS_ENABLED                 — master switch for ALL ad networks.
 *                                             Default: ON in production, OFF in
 *                                             development (never generate ad
 *                                             impressions from localhost).
 *   NEXT_PUBLIC_ADSTERRA_POPUNDER_ENABLED   — default OFF (AdSense policy).
 *   NEXT_PUBLIC_ADSTERRA_SOCIALBAR_ENABLED  — default ON.
 *   NEXT_PUBLIC_ADSENSE_CLIENT              — e.g. ca-pub-7020382922277193.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Master switch: ads are ON in production, OFF in development. */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED
  ? process.env.NEXT_PUBLIC_ADS_ENABLED === "true"
  : IS_PRODUCTION;

/** Google AdSense publisher ID (meta tag + auto ads). Empty = AdSense off. */
export const ADSENSE_CLIENT = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();

/** AdSense auto-ads script loads only when a real client ID is configured. */
export const ADSENSE_ENABLED = ADS_ENABLED && ADSENSE_CLIENT.startsWith("ca-pub-");

/** Adsterra popunder — OFF unless explicitly enabled (AdSense policy). */
export const ADSTERRA_POPUNDER_ENABLED =
  (process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_ENABLED || "").toLowerCase() === "true";

/** Adsterra social bar — ON by default (non-intrusive). */
export const ADSTERRA_SOCIALBAR_ENABLED =
  (process.env.NEXT_PUBLIC_ADSTERRA_SOCIALBAR_ENABLED || "true").toLowerCase() !== "false";

export const ADSTERRA_ADS = {
  /** Popunder — Adsterra says: paste right before the closing </head> tag. */
  popunderSrc:
    "https://pl30862542.effectivecpmnetwork.com/2a/7f/01/2a7f01f2e476a66ed8af224d39878533.js",

  /** Social bar — Adsterra says: paste right above the closing </body> tag. */
  socialBarSrc:
    "https://pl30862543.effectivecpmnetwork.com/55/53/a2/5553a2cb4935b100da17be297b1d8e3c.js",

  /** Native banner (1:4 widget) — script + container div in the page body. */
  nativeBanner: {
    invokeSrc:
      "https://pl30862544.effectivecpmnetwork.com/cad2757ee9a706aecbbdf476f1be41ef/invoke.js",
    containerId: "container-cad2757ee9a706aecbbdf476f1be41ef",
  },

  /** Banner 160x300 (iframe format) — atOptions config + invoke.js loader. */
  banner160: {
    key: "9d435794af3e7655ec34febe818d78f7",
    format: "iframe",
    width: 160,
    height: 300,
    invokeSrc:
      process.env.NEXT_PUBLIC_ADSTERRA_BANNER160_INVOKE_URL ??
      "https://www.highperformanceformat.com/9d435794af3e7655ec34febe818d78f7/invoke.js",
  },
} as const;

/**
 * Cookie-consent state (GDPR/EEA). Ad code (AdSense + Adsterra) is only
 * injected once the visitor has made a choice, unless they are outside the
 * EEA in which case we default to "accepted" for a frictionless experience.
 * The choice is stored in localStorage by <ConsentBanner /> under this key.
 */
export const CONSENT_STORAGE_KEY = "tl_consent_v1";

export type ConsentChoice = "accepted" | "rejected";

export function isEeaCountry(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false; // unknown → treat as non-EEA
  const EEA = new Set([
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
    "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
    "PT", "RO", "SK", "SI", "ES", "SE", "CH", "GB", "AX", "GI", "MC", "AD",
    "SM", "VA",
  ]);
  return EEA.has((countryCode || "").toUpperCase());
}
