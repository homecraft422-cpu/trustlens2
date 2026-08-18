/**
 * Real fact-checking service.
 *
 * Uses, in order:
 *   1. Google Fact Check Tools API (requires GOOGLE_FACTCHECK_API_KEY) —
 *      returns ratings from professional fact-checking organisations
 *      (Reuters, AFP, Snopes, India Today, BOOM Live, …).
 *   2. Wikipedia search + extracts (free, no key) — provides verifiable
 *      context/sources when no professional rating exists.
 *
 * The result is DETERMINISTIC and HONEST: no random verdicts. When neither
 * source can verify the claim, the service says "unverified" and explains
 * why, instead of inventing a rating.
 */

import { config } from "../config";

export type FactVerdict =
  | "true"
  | "false"
  | "misleading"
  | "partially_true"
  | "unverified";

export interface FactSource {
  title: string;
  url: string;
  reliability: "high" | "medium" | "low";
  rating?: string;
  publisher?: string;
  reviewDate?: string;
}

export interface FactCheckResult {
  claim: string;
  verdict: FactVerdict;
  confidence: number; // 0..1 — how strong the evidence is, not "how true"
  explanation: string;
  sources: FactSource[];
  manipulationIndicators: string[];
  context: string;
  evidence: Array<{
    text: string;
    url?: string;
  }>;
  analysisSource: "google_fact_check_tools" | "wikipedia" | "none";
  metadata: {
    analyzedAt: string;
    language: string;
    apiStatus: "ok" | "fallback" | "unavailable";
  };
}

// ─── Google Fact Check Tools API ───────────────────────────────────────────

interface GoogleClaimReview {
  text?: string;
  claimReview?: Array<{
    title?: string;
    url?: string;
    textualRating?: string;
    reviewDate?: string;
    publisher?: { name?: string; site?: string };
    languageCode?: string;
  }>;
}

async function googleFactCheck(claim: string, language: string): Promise<{
  reviews: Array<{
    claim: string;
    rating: string;
    title: string;
    url: string;
    publisher: string;
    reviewDate: string;
  }>;
}> {
  const apiKey = config.factCheck.googleApiKey;
  if (!apiKey) return { reviews: [] };

  const url = new URL("https://factchecktools.googleapis.com/v1alpha1/claims:search");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("query", claim.slice(0, 500));
  url.searchParams.set("languageCode", language || "en");
  url.searchParams.set("pageSize", "8");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.factCheck.timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[factcheck] Google API error ${res.status}`);
      return { reviews: [] };
    }
    const data = (await res.json()) as { claims?: GoogleClaimReview[] };
    const reviews: Array<{
      claim: string;
      rating: string;
      title: string;
      url: string;
      publisher: string;
      reviewDate: string;
    }> = [];
    for (const claimItem of data.claims || []) {
      for (const review of claimItem.claimReview || []) {
        const rating = (review.textualRating || "").trim();
        const publisher = review.publisher?.name || review.publisher?.site || "Unknown publisher";
        if (!rating && !review.title) continue;
        reviews.push({
          claim: claimItem.text || claim,
          rating,
          title: review.title || rating || "Fact-check review",
          url: review.url || "",
          publisher,
          reviewDate: review.reviewDate || "",
        });
      }
    }
    return { reviews };
  } catch (error) {
    console.warn("[factcheck] Google API unavailable:", error);
    return { reviews: [] };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Wikipedia fallback (free, no key) ─────────────────────────────────────

async function wikipediaSearch(claim: string, language: string): Promise<{
  results: Array<{ title: string; url: string; extract: string }>;
}> {
  const lang = (language || "en").toLowerCase();
  const api = `https://${lang}.wikipedia.org/w/api.php`;

  // 1. Search for the best matching articles.
  const searchUrl = new URL(api);
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("list", "search");
  searchUrl.searchParams.set("srsearch", claim.slice(0, 300));
  searchUrl.searchParams.set("srlimit", "5");
  searchUrl.searchParams.set("format", "json");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.factCheck.timeoutMs);
  try {
    const searchRes = await fetch(searchUrl.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "TrustLens/1.0 (content verification tool)" },
    });
    if (!searchRes.ok) return { results: [] };
    const searchData = (await searchRes.json()) as {
      query?: { search?: Array<{ title: string }> };
    };
    const titles = (searchData.query?.search || []).map((s) => s.title).slice(0, 3);
    if (titles.length === 0) return { results: [] };

    // 2. Fetch short intros (extracts) for the top matches.
    const extractUrl = new URL(api);
    extractUrl.searchParams.set("action", "query");
    extractUrl.searchParams.set("prop", "extracts");
    extractUrl.searchParams.set("exintro", "1");
    extractUrl.searchParams.set("explaintext", "1");
    extractUrl.searchParams.set("titles", titles.join("|"));
    extractUrl.searchParams.set("format", "json");

    const extractRes = await fetch(extractUrl.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "TrustLens/1.0 (content verification tool)" },
    });
    if (!extractRes.ok) return { results: [] };
    const extractData = (await extractRes.json()) as {
      query?: { pages?: Record<string, { title?: string; extract?: string }> };
    };
    const results: Array<{ title: string; url: string; extract: string }> = [];
    for (const page of Object.values(extractData.query?.pages || {})) {
      if (!page.title) continue;
      results.push({
        title: page.title,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
        extract: (page.extract || "").slice(0, 400),
      });
    }
    return { results };
  } catch (error) {
    console.warn("[factcheck] Wikipedia unavailable:", error);
    return { results: [] };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Verdict synthesis (deterministic) ─────────────────────────────────────

function ratingToVerdict(rating: string): FactVerdict | null {
  const r = rating.toLowerCase();
  if (/(^|\s)(false|fake|incorrect|wrong|hoax)(\s|$)/.test(r)) return "false";
  if (/(^|\s)(true|accurate|correct|real|genuine)(\s|$)/.test(r)) return "true";
  if (r.includes("misleading") || r.includes("mislead")) return "misleading";
  if (
    r.includes("partially") ||
    r.includes("mostly") ||
    r.includes("half") ||
    r.includes("incomplete")
  ) {
    return "partially_true";
  }
  if (/(satire|parody)/.test(r)) return "misleading";
  return null;
}

function analyzeClaimText(claim: string): string[] {
  const indicators: string[] = [];
  const lower = claim.toLowerCase();

  if (/(always|never|100%|definitely|proven|cures|kills|secret)/.test(lower)) {
    indicators.push("Absolute or alarmist language (always, never, proven) — a common misinformation pattern.");
  }
  if (!/\d{4}/.test(claim)) {
    indicators.push("No date or timeframe is given, which makes the claim hard to verify.");
  }
  if (!/\.\s*$/.test(claim) && claim.length > 40) {
    indicators.push("Claim reads like a headline fragment without attribution.");
  }
  if (/(they say|people are saying|studies show|experts agree|everyone knows)/.test(lower)) {
    indicators.push("Vague, unattributed authority (\"studies show\", \"experts say\").");
  }
  if (/(miracle|shocking|doctors hate|banned|exposed)/.test(lower)) {
    indicators.push("Clickbait framing used to drive shares before verification.");
  }
  return indicators;
}

export async function checkClaim(
  claim: string,
  options: { language?: string; region?: string } = {}
): Promise<FactCheckResult> {
  const language = (options.language || "en").toLowerCase();
  const cleanedClaim = claim.trim().replace(/\s+/g, " ").slice(0, 5000);

  const [google, wiki] = await Promise.all([
    googleFactCheck(cleanedClaim, language),
    config.factCheck.wikipediaFallback ? wikipediaSearch(cleanedClaim, language) : Promise.resolve({ results: [] }),
  ]);

  const sources: FactSource[] = [];
  let verdict: FactVerdict = "unverified";
  let confidence = 0;
  let explanation = "";
  let context = "";
  const evidence: Array<{ text: string; url?: string }> = [];
  let analysisSource: FactCheckResult["analysisSource"] = "none";
  let apiStatus: FactCheckResult["metadata"]["apiStatus"] = "unavailable";

  // 1. Professional ratings (Google Fact Check Tools) — strongest signal.
  if (google.reviews.length > 0) {
    apiStatus = "ok";
    analysisSource = "google_fact_check_tools";

    const votes = new Map<FactVerdict, number>();
    for (const review of google.reviews) {
      const mapped = ratingToVerdict(review.rating || review.title);
      if (mapped) votes.set(mapped, (votes.get(mapped) || 0) + 1);
      sources.push({
        title: review.title,
        url: review.url,
        reliability: "high",
        rating: review.rating || undefined,
        publisher: review.publisher,
        reviewDate: review.reviewDate || undefined,
      });
      evidence.push({
        text: `${review.publisher}: “${review.rating || review.title}”`,
        url: review.url,
      });
    }

    const counted = Array.from(votes.entries()).sort((a, b) => b[1] - a[1]);
    if (counted.length > 0) {
      verdict = counted[0][0];
      const total = google.reviews.length;
      confidence = Math.min(0.95, 0.45 + (counted[0][1] / total) * 0.5);
    } else {
      // Ratings exist but don't map cleanly — surface them as evidence.
      verdict = "unverified";
      confidence = 0.4;
      explanation =
        "Professional fact-checkers have reviewed this claim, but their ratings don't map to a clear verdict. Review the sources below.";
    }

    if (!explanation) {
      const top = sources[0];
      const count = sources.length;
      explanation = `${count} professional fact-check${count === 1 ? " source rates" : " sources rate"} this claim as “${verdict.replace("_", " ")}” (${top?.publisher || "fact-checking organisation"}${top?.reviewDate ? `, ${top.reviewDate}` : ""}). Review the linked reviews for full context.`;
    }
  }

  // 2. Wikipedia context — fills gaps and enriches evidence.
  if (wiki.results.length > 0) {
    if (analysisSource === "none") {
      analysisSource = "wikipedia";
      apiStatus = "fallback";
      verdict = "unverified";
      confidence = 0.25;
      explanation =
        "No professional fact-check rating was found for this exact claim. We found related background information from Wikipedia — read it, check the original source, and treat the claim as unverified until a professional rating exists.";
    }
    for (const result of wiki.results) {
      sources.push({
        title: `${result.title} (Wikipedia)`,
        url: result.url,
        reliability: "medium",
      });
      if (result.extract) {
        evidence.push({ text: result.extract, url: result.url });
      }
    }
    if (context === "") {
      context = `Background: the most relevant article found is “${wiki.results[0].title}”. Wikipedia is a general reference, not a fact-checking organisation — use it to orient yourself, then consult primary sources.`;
    }
  }

  // 3. Nothing found — honest "unverified".
  if (analysisSource === "none") {
    verdict = "unverified";
    confidence = 0.15;
    explanation =
      "We searched professional fact-checking sources and reference articles but could not verify this claim. That does not mean it is false — it means there is no verifiable evidence yet. Look for the original source, a named author/date, and coverage from at least two independent, reputable outlets.";
    context =
      "Tips: search the exact claim on Reuters Fact Check, AFP Fact Check, Snopes, PolitiFact, or India Today Fact Check. If the claim names a study, find it on PubMed/Google Scholar. If it names a person or event, check primary sources first.";
  }

  const manipulationIndicators = analyzeClaimText(cleanedClaim);

  return {
    claim: cleanedClaim,
    verdict,
    confidence: Math.round(confidence * 100) / 100,
    explanation,
    sources: sources.slice(0, 10),
    manipulationIndicators,
    context,
    evidence: evidence.slice(0, 8),
    analysisSource,
    metadata: {
      analyzedAt: new Date().toISOString(),
      language,
      apiStatus,
    },
  };
}
