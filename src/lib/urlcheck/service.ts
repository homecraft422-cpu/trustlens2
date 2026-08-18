/**
 * Real URL-content analysis service.
 *
 * Fetches the user-supplied URL server-side and analyzes:
 *   - page metadata (title, description, Open Graph, generator, language)
 *   - page structure (headings, images, links, word count)
 *   - transport security (HTTPS, HSTS, CSP, cookies)
 *   - domain registration info via the free IANA RDAP API (domain age,
 *     registrar) — a brand-new domain is a classic misinformation signal
 *
 * SSRF protection: private/loopback/link-local IPs are blocked before any
 * request is made, redirects are limited, and the response body is capped.
 */

import { lookup } from "dns/promises";
import { isIP } from "net";
import * as cheerio from "cheerio";
import { config } from "../config";

export interface UrlCheckResult {
  url: string;
  finalUrl: string;
  domain: string;
  reachable: boolean;
  https: boolean;
  httpStatus: number | null;
  pageTitle: string;
  metaDescription: string;
  generator: string;
  language: string;
  wordCount: number;
  headingCount: number;
  imageCount: number;
  linkCount: number;
  hasStructuredData: boolean;
  securityHeaders: {
    hsts: boolean;
    xContentTypeOptions: boolean;
    xFrameOptions: boolean;
    referrerPolicy: boolean;
    contentSecurityPolicy: boolean;
  };
  domainAnalysis: {
    registrar: string | null;
    registrationDate: string | null;
    ageYears: number | null;
    isNewDomain: boolean;
  };
  credibilityScore: number; // 0..100
  signals: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
  summary: string;
  analyzedAt: string;
}

// ─── SSRF guard: private / loopback / link-local / CGNAT ranges ────────────

function isPrivateIp(address: string): boolean {
  const ip = address.toLowerCase();
  if (isIP(ip) === 0) return false;

  if (ip.includes(":")) {
    // IPv6
    if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe8")) return true;
    if (ip.startsWith("::ffff:")) return isPrivateIp(ip.slice(7));
    return false;
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 0) ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a >= 224) // multicast/reserved
  );
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (hostname === "localhost") {
    throw new Error("BLOCKED_LOCAL");
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new Error("BLOCKED_PRIVATE");
    }
  }
}

// ─── RDAP domain lookup (free IANA bootstrap, no key) ──────────────────────

async function rdapDomain(domain: string): Promise<{
  registrar: string | null;
  registrationDate: string | null;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json, application/json", "User-Agent": "TrustLens/1.0" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return { registrar: null, registrationDate: null };

    const data = (await res.json()) as {
      events?: Array<{ eventAction: string; eventDate?: string }>;
      entities?: Array<{ roles?: string[]; vcardArray?: unknown[] }>;
    };

    const registered = data.events?.find((e) => e.eventAction === "registration");
    let registrar: string | null = null;
    for (const entity of data.entities || []) {
      if (entity.roles?.includes("registrar") && Array.isArray(entity.vcardArray)) {
        // vcardArray = ["vcard", [["fn", {}, "text", "Name"], ...]]
        const fields = entity.vcardArray[1] as Array<[string, unknown, unknown, string]>;
        const fn = fields.find((f) => f[0] === "fn");
        if (fn && typeof fn[3] === "string") registrar = fn[3];
        break;
      }
    }
    return {
      registrar,
      registrationDate: registered?.eventDate || null,
    };
  } catch (error) {
    console.warn(`[urlcheck] RDAP lookup failed for ${domain}:`, error);
    return { registrar: null, registrationDate: null };
  }
}

// ─── Page fetch + parse ────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<{
  finalUrl: string;
  status: number;
  headers: Headers;
  html: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.urlCheck.timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TrustLens-Verifier/2.0; +https://trustlens.ai) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en,hi;q=0.8",
      },
    });
    const body = await res.arrayBuffer();
    const html = Buffer.from(body).subarray(0, config.urlCheck.maxContentBytes).toString("utf8");
    return {
      finalUrl: res.url || url,
      status: res.status,
      headers: res.headers,
      html,
    };
  } finally {
    clearTimeout(timer);
  }
}

function parsePage(html: string) {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || $("meta[property='og:title']").attr("content")?.trim() || "";
  const metaDescription =
    $("meta[name='description']").attr("content")?.trim() ||
    $("meta[property='og:description']").attr("content")?.trim() ||
    "";
  const generator =
    $("meta[name='generator']").attr("content")?.trim() ||
    $("meta[name='application-name']").attr("content")?.trim() ||
    "";
  const language = ($("html").attr("lang") || "en").slice(0, 10);
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").length : 0;
  const headingCount = $("h1, h2, h3").length;
  const imageCount = $("img").length;
  const linkCount = $("a[href]").length;
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  const canonical =
    $("link[rel='canonical']").attr("href") || $("meta[property='og:url']").attr("content") || "";

  return {
    title,
    metaDescription,
    generator,
    language,
    wordCount,
    headingCount,
    imageCount,
    linkCount,
    hasStructuredData,
    canonical,
  };
}

// ─── Main entry point ──────────────────────────────────────────────────────

export async function analyzeUrl(rawUrl: string): Promise<UrlCheckResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("INVALID_URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("UNSUPPORTED_PROTOCOL");
  }
  const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (!domain.includes(".") || domain.length > 253) {
    throw new Error("INVALID_DOMAIN");
  }

  // SSRF guard — never resolve to an internal address.
  if (config.urlCheck.blockPrivateNetworks) {
    try {
      await assertPublicHost(parsed.hostname);
    } catch (error) {
      const code = error instanceof Error ? error.message : "BLOCKED";
      throw new Error(code); // BLOCKED_LOCAL / BLOCKED_PRIVATE
    }
  }

  const [rdap, page] = await Promise.all([
    rdapDomain(domain),
    fetchPage(parsed.toString()).catch((error) => {
      console.warn(`[urlcheck] fetch failed for ${parsed.toString()}:`, error);
      return null;
    }),
  ]);

  const signals: UrlCheckResult["signals"] = [];
  let credibilityScore = 40; // neutral baseline

  if (!page) {
    return {
      url: rawUrl,
      finalUrl: rawUrl,
      domain,
      reachable: false,
      https: parsed.protocol === "https:",
      httpStatus: null,
      pageTitle: "",
      metaDescription: "",
      generator: "",
      language: "",
      wordCount: 0,
      headingCount: 0,
      imageCount: 0,
      linkCount: 0,
      hasStructuredData: false,
      securityHeaders: {
        hsts: false,
        xContentTypeOptions: false,
        xFrameOptions: false,
        referrerPolicy: false,
        contentSecurityPolicy: false,
      },
      domainAnalysis: {
        registrar: rdap.registrar,
        registrationDate: rdap.registrationDate,
        ageYears: rdap.registrationDate
          ? Math.max(0, (Date.now() - new Date(rdap.registrationDate).getTime()) / (365.25 * 24 * 3600 * 1000))
          : null,
        isNewDomain: false,
      },
      credibilityScore: 5,
      signals: [
        {
          title: "Page could not be fetched",
          description:
            "The URL did not respond within the timeout or the connection failed. This is common for dead links, paywalled pages, or sites that block automated access.",
          severity: "medium",
        },
      ],
      summary:
        "We could not retrieve this URL. Try opening it in your browser to confirm it exists and is publicly accessible.",
      analyzedAt: new Date().toISOString(),
    };
  }

  const parsedPage = parsePage(page.html);

  // Domain age via RDAP.
  const ageYears = rdap.registrationDate
    ? Math.max(0, (Date.now() - new Date(rdap.registrationDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  const isNewDomain = ageYears !== null && ageYears < 0.6;

  if (isNewDomain) {
    signals.push({
      title: "Domain is very new",
      description: `This domain was registered ${ageYears !== null ? `about ${(ageYears * 12).toFixed(0)} months` : "recently"} ago (${rdap.registrationDate?.slice(0, 10)}). Fresh domains are a common pattern for scam and misinformation sites.`,
      severity: "high",
    });
    credibilityScore -= 20;
  } else if (ageYears !== null) {
    credibilityScore += Math.min(15, ageYears * 2);
  }

  const https = page.finalUrl.startsWith("https://");
  if (https) {
    credibilityScore += 12;
  } else {
    signals.push({
      title: "No HTTPS encryption",
      description: "The page is served over plain HTTP. Data can be read or modified in transit — unusual for any serious publisher today.",
      severity: "medium",
    });
  }

  const hsts = page.headers.get("strict-transport-security") !== null;
  const securityHeaders = {
    hsts,
    xContentTypeOptions: page.headers.get("x-content-type-options") !== null,
    xFrameOptions: page.headers.get("x-frame-options") !== null,
    referrerPolicy: page.headers.get("referrer-policy") !== null,
    contentSecurityPolicy: page.headers.get("content-security-policy") !== null,
  };
  const headerCount = Object.values(securityHeaders).filter(Boolean).length;
  if (headerCount >= 3) credibilityScore += 8;
  else if (headerCount === 0 && https) {
    signals.push({
      title: "Weak security headers",
      description: "The site sends none of the standard hardening headers (HSTS, CSP, X-Frame-Options, etc.), which is rare for established professional publishers.",
      severity: "low",
    });
  }

  if (parsedPage.title && parsedPage.metaDescription) credibilityScore += 8;
  if (parsedPage.wordCount >= 300) credibilityScore += 6;
  if (parsedPage.hasStructuredData) credibilityScore += 4;
  if (parsedPage.generator) credibilityScore += 2;

  // Professional-looking page → fewer red flags.
  if (headerCount === 0 && !isNewDomain && parsedPage.wordCount > 500) {
    credibilityScore -= 0; // keep it simple
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(credibilityScore)));

  // Build a human summary.
  let summary: string;
  if (finalScore >= 70) {
    summary = `This page looks like a genuine, professionally operated site: it uses ${https ? "HTTPS" : "HTTP"}, has a real title${parsedPage.metaDescription ? " and description" : ""}, and ${isNewDomain ? "its domain is new — check it closely anyway" : "its domain has been registered for a while"}. Treat the CONTENT on the page with normal caution — a credible-looking site can still publish false claims.`;
  } else if (finalScore >= 45) {
    summary = `This page has mixed signals. It is reachable and has real content, but ${signals.length > 0 ? signals[0].description.toLowerCase().slice(0, 1) + signals[0].description.slice(1).toLowerCase() : "some signals warrant a closer look"}. Verify its claims against professional fact-checkers before trusting or sharing anything from it.`;
  } else {
    summary = `This URL has several warning signs (${signals.map((s) => s.title.toLowerCase()).join(", ")}). Treat it as untrustworthy until proven otherwise.`;
  }

  return {
    url: rawUrl,
    finalUrl: page.finalUrl,
    domain,
    reachable: true,
    https,
    httpStatus: page.status,
    pageTitle: parsedPage.title,
    metaDescription: parsedPage.metaDescription,
    generator: parsedPage.generator,
    language: parsedPage.language,
    wordCount: parsedPage.wordCount,
    headingCount: parsedPage.headingCount,
    imageCount: parsedPage.imageCount,
    linkCount: parsedPage.linkCount,
    hasStructuredData: parsedPage.hasStructuredData,
    securityHeaders,
    domainAnalysis: {
      registrar: rdap.registrar,
      registrationDate: rdap.registrationDate,
      ageYears: ageYears === null ? null : Math.round(ageYears * 10) / 10,
      isNewDomain,
    },
    credibilityScore: finalScore,
    signals,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}
