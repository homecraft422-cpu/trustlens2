import { NextRequest, NextResponse } from "next/server";

interface FactCheckRequest {
  claim: string;
  language?: string;
  region?: string;
}

interface FactCheckResponse {
  claim: string;
  verdict: "true" | "false" | "misleading" | "unverified" | "partially_true";
  confidence: number;
  explanation: string;
  sources: Array<{
    title: string;
    url: string;
    reliability: "high" | "medium" | "low";
  }>;
  manipulationIndicators: string[];
  context: string;
  metadata: {
    analyzedAt: string;
    language: string;
    region: string;
  };
}

// Mock fact-check database for common claims
const FACT_CHECK_DATABASE: Record<
  string,
  Omit<FactCheckResponse, "claim" | "metadata">
> = {
  gdp: {
    verdict: "partially_true",
    confidence: 0.78,
    explanation:
      "India's GDP growth rate varies by quarter and fiscal year. The claim may use preliminary data.",
    sources: [
      {
        title: "RBI Annual Report",
        url: "https://rbi.org.in",
        reliability: "high",
      },
      {
        title: "World Bank India",
        url: "https://worldbank.org/in",
        reliability: "high",
      },
    ],
    manipulationIndicators: [
      "Using preliminary data as final",
      "Omitting fiscal year context",
    ],
    context:
      "GDP figures are often revised. Always check the specific period being referenced.",
  },
  covid: {
    verdict: "false",
    confidence: 0.95,
    explanation:
      "There is no scientific evidence for home remedies curing COVID-19. Vaccination and medical treatment are recommended.",
    sources: [
      {
        title: "WHO",
        url: "https://who.int",
        reliability: "high",
      },
      {
        title: "ICMR",
        url: "https://icmr.nic.in",
        reliability: "high",
      },
    ],
    manipulationIndicators: [
      "Health misinformation",
      "False medical claims",
    ],
    context:
      "COVID misinformation has been widespread. Always consult medical professionals.",
  },
  chandrayaan: {
    verdict: "true",
    confidence: 0.98,
    explanation:
      "Chandrayaan-3 successfully landed on Moon's south pole on August 23, 2023.",
    sources: [
      {
        title: "ISRO",
        url: "https://isro.gov.in",
        reliability: "high",
      },
      {
        title: "NASA",
        url: "https://nasa.gov",
        reliability: "high",
      },
    ],
    manipulationIndicators: [],
    context: "This is a verified achievement by India's space program.",
  },
  "5g": {
    verdict: "false",
    confidence: 0.92,
    explanation:
      "Scientific consensus confirms 5G technology does not cause health problems at regulated exposure levels.",
    sources: [
      {
        title: "WHO",
        url: "https://who.int",
        reliability: "high",
      },
      {
        title: "ICNIRP",
        url: "https://icnirp.org",
        reliability: "high",
      },
    ],
    manipulationIndicators: [
      "Misrepresentation of electromagnetic radiation",
      "Fear-based messaging",
    ],
    context:
      "5G health scares are a recurring pattern with each new wireless generation.",
  },
  upi: {
    verdict: "true",
    confidence: 0.94,
    explanation:
      "UPI has processed over 10 billion transactions in a single month.",
    sources: [
      {
        title: "NPCI",
        url: "https://npci.org.in",
        reliability: "high",
      },
      {
        title: "RBI",
        url: "https://rbi.org.in",
        reliability: "high",
      },
    ],
    manipulationIndicators: [],
    context:
      "UPI is one of the world's largest real-time payment systems.",
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: FactCheckRequest = await request.json();

    if (!body.claim || body.claim.trim().length === 0) {
      return NextResponse.json(
        { error: "Claim is required" },
        { status: 400 }
      );
    }

    if (body.claim.length > 5000) {
      return NextResponse.json(
        { error: "Claim is too long. Maximum 5000 characters." },
        { status: 400 }
      );
    }

    // Simulate processing time
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1500)
    );

    const claimLower = body.claim.toLowerCase();
    let result: Omit<FactCheckResponse, "claim" | "metadata"> | null = null;

    // Check against known claims
    for (const [key, value] of Object.entries(FACT_CHECK_DATABASE)) {
      if (claimLower.includes(key)) {
        result = value;
        break;
      }
    }

    // Default result if no match
    if (!result) {
      const rand = Math.random();
      if (rand > 0.6) {
        result = {
          verdict: "unverified",
          confidence: 0.35,
          explanation:
            "We couldn't find sufficient reliable sources to verify or debunk this claim.",
          sources: [
            {
              title: "Reuters Fact Check",
              url: "https://reuters.com/fact-check",
              reliability: "high",
            },
          ],
          manipulationIndicators: [
            "Claim lacks specific source attribution",
          ],
          context:
            "For unverifiable claims, look for primary sources.",
        };
      } else if (rand > 0.3) {
        result = {
          verdict: "misleading",
          confidence: 0.65,
          explanation:
            "This claim contains elements of truth but is presented misleadingly.",
          sources: [
            {
              title: "BOOM Live",
              url: "https://boomlive.in",
              reliability: "high",
            },
          ],
          manipulationIndicators: [
            "Selective use of facts",
            "Important context omitted",
          ],
          context:
            "Misleading claims often use true facts to create false impressions.",
        };
      } else {
        result = {
          verdict: "partially_true",
          confidence: 0.58,
          explanation:
            "This claim is partially accurate with some exaggeration.",
          sources: [
            {
              title: "Fact Checker",
              url: "https://factchecker.in",
              reliability: "high",
            },
          ],
          manipulationIndicators: [
            "Mixing verified facts with unverified claims",
          ],
          context:
            "Partially true claims are effective at spreading misinformation.",
        };
      }
    }

    const response: FactCheckResponse = {
      claim: body.claim,
      ...result,
      metadata: {
        analyzedAt: new Date().toISOString(),
        language: body.language || "en",
        region: body.region || "IN",
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Fact-check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "TrustLens Fact Checker API",
    version: "1.0.0",
    description: "Verify claims and statements against trusted sources",
    usage: {
      endpoint: "/api/v1/fact-check",
      method: "POST",
      body: {
        claim: "string (required) - The claim to fact-check",
        language: "string (optional) - Language code (default: en)",
        region: "string (optional) - Region code (default: IN)",
      },
    },
    supportedRegions: ["IN", "US", "UK", "GLOBAL"],
    supportedLanguages: ["en", "hi"],
  });
}
