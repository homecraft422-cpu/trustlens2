/**
 * Adsterra ad configuration — trustlens2.vercel.app
 *
 * All four Adsterra ad units live here in one place so they are easy to
 * review, update, or disable:
 *
 *   1. Popunder   → injected in <head>        (site-wide, root layout)
 *   2. Social bar → injected before </body>   (site-wide, root layout)
 *   3. Native banner (1:4 widget) → rendered by <AdsterraAds /> on public pages
 *   4. Banner 160x300            → rendered by <AdsterraAds /> on public pages
 *
 * Control:
 *   NEXT_PUBLIC_ADS_ENABLED — master switch. Defaults to enabled in
 *   production and DISABLED in development (so ad impressions are never
 *   generated from localhost, which Adsterra flags as invalid traffic).
 *
 *   NEXT_PUBLIC_ADSTERRA_BANNER160_INVOKE_URL — optional override for the
 *   160x300 banner loader URL, in case your Adsterra dashboard shows a
 *   different invoke.js domain than the default (highperformanceformat.com).
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Master switch: ads are ON in production, OFF in development. */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED
  ? process.env.NEXT_PUBLIC_ADS_ENABLED === "true"
  : IS_PRODUCTION;

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
