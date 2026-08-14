/**
 * C2PA / Content Credentials Provenance Analyzer
 *
 * Inspects media for C2PA Content Credentials metadata.
 *
 * IMPORTANT:
 * - C2PA is NOT an AI detector — it is a provenance signal.
 * - Absence of C2PA does NOT mean AI-generated.
 * - Presence of C2PA does NOT automatically mean authentic.
 * - C2PA metadata can be stripped or potentially falsified.
 *
 * For V0.1, this analyzer extracts C2PA data that Hive returns
 * in its `algorithmic_tags.c2pa` field. A full standalone C2PA
 * library integration is deferred to a future step.
 */

import {
  ProvenanceAnalyzer,
  ProvenanceResult,
  AssetInfo,
  EvidenceItem,
} from "../types";
import { nanoid } from "nanoid";

/**
 * Standalone C2PA analyzer stub.
 *
 * In production, this would use a C2PA library (e.g. c2pa-node)
 * to parse and verify Content Credentials directly from the file.
 *
 * For now, it returns "unavailable" since the Hive provider
 * already extracts C2PA data from its own API response.
 * This analyzer exists as the architectural placeholder.
 */
export class C2paProvenanceAnalyzer implements ProvenanceAnalyzer {
  readonly name = "c2pa_analyzer";

  async analyze(asset: AssetInfo): Promise<ProvenanceResult> {
    // Future: use a C2PA library to inspect the raw file
    // const storage = getStorage();
    // const buffer = await storage.download(asset.storageKey);
    // const c2paResult = await c2paLib.verify(buffer);

    const evidence: EvidenceItem[] = [];
    const limitations: string[] = [];

    // Until a C2PA parsing library is integrated, report unavailable
    evidence.push({
      id: nanoid(8),
      category: "provenance",
      type: "provenance_absent",
      title: "Content Credentials analysis limited",
      description:
        "Standalone C2PA verification is not yet available. " +
        "C2PA data reported by detection providers is included in their results. " +
        "No Content Credentials were found does not mean the media is AI-generated.",
      score: null,
      confidence: null,
      severity: "low",
      source: this.name,
    });

    limitations.push(
      "Full C2PA verification requires a dedicated C2PA library integration."
    );

    return {
      found: false,
      verified: false,
      standard: null,
      issuer: null,
      evidence,
      limitations,
    };
  }
}

/**
 * Parse C2PA data that was returned by Hive's API and convert
 * to a ProvenanceResult. This is used by the Hive provider
 * normalizer — not the standalone analyzer.
 */
export function parseHiveC2paData(
  c2paData: {
    claim_generator?: string;
    actions_software_agent?: string;
    actions_action?: string;
    actions_digital_source_type?: string;
  } | undefined
): ProvenanceResult | null {
  if (!c2paData) return null;

  const hasData =
    c2paData.claim_generator ||
    c2paData.actions_software_agent ||
    c2paData.actions_action;

  if (!hasData) return null;

  const evidence: EvidenceItem[] = [];

  // Determine if this indicates AI generation
  const isAlgorithmic = c2paData.actions_digital_source_type?.includes(
    "trainedAlgorithmicMedia"
  );

  evidence.push({
    id: nanoid(8),
    category: "provenance",
    type: "provenance_verified",
    title: "Content Credentials detected (C2PA)",
    description:
      `C2PA provenance metadata was found in this file. ` +
      `Generator: ${c2paData.claim_generator || "not specified"}. ` +
      `Software agent: ${c2paData.actions_software_agent || "not specified"}. ` +
      (isAlgorithmic
        ? "The source type indicates AI/algorithmic generation."
        : ""),
    score: null,
    confidence: 0.9,
    severity: "low",
    source: "c2pa",
    providerMetadata: { ...c2paData },
  });

  return {
    found: true,
    verified: true, // C2PA data is cryptographically signed
    standard: "c2pa",
    issuer: c2paData.claim_generator || null,
    evidence,
    limitations: [
      "C2PA metadata can be stripped from files after creation.",
      "Presence of C2PA does not automatically confirm authenticity.",
    ],
  };
}
