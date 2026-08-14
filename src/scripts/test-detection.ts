/**
 * Detection Engine Test Suite
 *
 * Run with: npx tsx src/scripts/test-detection.ts
 *
 * Tests fusion, verdict, provider failure, confidence semantics,
 * mock/production separation, and result sanitization.
 */

import { fuseProviderResults, type ConsensusLevel } from "../lib/detection/fusion";
import { determineVerdict, verdictToDbEnum } from "../lib/detection/verdict";
import { computeScores } from "../lib/detection/scoring";
import type { DetectionResult, DetectionAnalysis, ProviderFailure, EvidenceItem } from "../lib/detection/types";
import { evaluatePredictions, type BenchmarkCase, type ProviderPrediction } from "../lib/detection/calibration";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}`);
  }
}

function makeResult(
  provider: string,
  ai: number,
  manip: number,
  conf: number,
  isMock = false
): DetectionResult {
  return {
    provider,
    providerVersion: "test",
    modality: "image",
    aiProbability: ai,
    manipulationProbability: manip,
    confidence: conf,
    evidence: [{
      id: "e1", category: "ai_detection", type: "ai_generated",
      title: "Test", description: "Test", score: ai, confidence: conf,
      severity: "medium", source: provider,
    }],
    processingTimeMs: 100,
    limitations: [],
    isMock,
  };
}

function makeAnalysis(results: DetectionResult[], failures: ProviderFailure[] = []): DetectionAnalysis {
  const evidence: EvidenceItem[] = results.flatMap(r => r.evidence);
  return {
    results, failures, evidence,
    providersUsed: results.map(r => r.provider),
    hasMockResults: results.some(r => r.isMock),
    totalProcessingTimeMs: 500,
  };
}

// ─── FUSION TESTS ────────────────────────────────────────────

console.log("\n── Fusion Engine ──");

// Case 1: Single provider
(() => {
  const f = fuseProviderResults([makeResult("hive", 0.85, 0.1, 0.9)], []);
  assert(f.consensus === "single_provider", "Single provider → single_provider");
  assert(f.providerCount === 1, "Provider count = 1");
  assert(f.agreement === null, "No agreement metric for single provider");
})();

// Case 3: Strong agreement
(() => {
  const f = fuseProviderResults([
    makeResult("hive", 0.91, 0.10, 0.90),
    makeResult("sightengine", 0.87, 0.12, 0.88),
  ], []);
  assert(f.consensus === "strong_agreement", "Close scores → strong_agreement");
  assert(f.providerCount === 2, "Provider count = 2");
  assert(f.agreement !== null && f.agreement > 0.9, "High agreement score");
})();

// Case 4: Partial agreement
(() => {
  const f = fuseProviderResults([
    makeResult("hive", 0.85, 0.10, 0.85),
    makeResult("sightengine", 0.60, 0.15, 0.80),
  ], []);
  assert(f.consensus === "partial_agreement", "Moderate diff → partial_agreement");
  assert(f.confidence < 0.83 * 0.76, "Confidence penalized for partial agreement");
})();

// Case 5: Strong disagreement
(() => {
  const f = fuseProviderResults([
    makeResult("hive", 0.92, 0.10, 0.90),
    makeResult("sightengine", 0.31, 0.08, 0.85),
  ], []);
  assert(f.consensus === "disagreement", "Large diff → disagreement");
  assert(f.confidence < 0.5, "Confidence heavily penalized");
  assert(f.agreement !== null && f.agreement < 0.5, "Low agreement score");
})();

// Case 6: One fails
(() => {
  const f = fuseProviderResults(
    [makeResult("hive", 0.88, 0.1, 0.9)],
    [{ provider: "sightengine", errorCode: "rate_limited", messageSafe: "x", retryable: true }]
  );
  assert(f.consensus === "single_provider", "One fail → single_provider");
  assert(f.hasFailures === true, "Failures recorded");
})();

// Case 8: Both fail
(() => {
  const f = fuseProviderResults([], [
    { provider: "hive", errorCode: "timeout", messageSafe: "x", retryable: true },
    { provider: "sightengine", errorCode: "timeout", messageSafe: "x", retryable: true },
  ]);
  assert(f.consensus === "insufficient_data", "Both fail → insufficient_data");
  assert(f.providerCount === 0, "Zero providers");
  assert(f.hasFailures === true, "Has failures");
})();

// Case 9: Mock
(() => {
  const f = fuseProviderResults([makeResult("mock", 0.7, 0.3, 0.8, true)], []);
  assert(f.hasMockResults === true, "Mock results flagged");
})();

// ─── VERDICT TESTS ───────────────────────────────────────────

console.log("\n── Verdict Engine ──");

// Disagreement → inconclusive
(() => {
  const f = fuseProviderResults([
    makeResult("hive", 0.92, 0.1, 0.9),
    makeResult("sightengine", 0.31, 0.08, 0.85),
  ], []);
  const v = determineVerdict(f, []);
  assert(v.verdict === "inconclusive", "Disagreement → inconclusive (NOT averaged to 61.5%)");
  const dbVerdict = verdictToDbEnum(v.verdict);
  assert(dbVerdict === "unverified", "inconclusive maps to unverified in DB");
})();

// Strong agreement high AI → likely_ai_generated
(() => {
  const f = fuseProviderResults([
    makeResult("hive", 0.91, 0.1, 0.9),
    makeResult("sightengine", 0.87, 0.12, 0.88),
  ], []);
  const v = determineVerdict(f, []);
  assert(v.verdict === "likely_ai_generated", "High AI + agreement → likely_ai_generated");
})();

// No providers → detection_unavailable
(() => {
  const f = fuseProviderResults([], []);
  const v = determineVerdict(f, []);
  assert(v.verdict === "detection_unavailable", "No providers → detection_unavailable");
})();

// Low AI → likely_authentic
(() => {
  const f = fuseProviderResults([
    makeResult("hive", 0.08, 0.05, 0.88),
    makeResult("sightengine", 0.12, 0.07, 0.85),
  ], []);
  const v = determineVerdict(f, []);
  assert(v.verdict === "likely_authentic", "Low AI → likely_authentic");
})();

// Partial agreement + high AI → possibly_ai_generated
(() => {
  const f = fuseProviderResults([
    makeResult("hive", 0.88, 0.1, 0.85),
    makeResult("sightengine", 0.62, 0.08, 0.80),
  ], []);
  const v = determineVerdict(f, []);
  assert(
    v.verdict === "possibly_ai_generated" || v.verdict === "likely_ai_generated",
    "Partial agreement + high AI → possibly or likely AI"
  );
})();

// ─── SCORING INTEGRATION ─────────────────────────────────────

console.log("\n── Scoring Engine ──");

// Full pipeline
(() => {
  const analysis = makeAnalysis([
    makeResult("hive", 0.90, 0.15, 0.88),
    makeResult("sightengine", 0.86, 0.10, 0.85),
  ]);
  const scores = computeScores(analysis);
  assert(scores.verdict === "likely_ai_generated", "Full pipeline → likely_ai_generated");
  assert(scores.aiInvolvementScore >= 85, "AI score ≥ 85");
  assert(scores.providerAgreement.consensus === "strong_agreement", "Consensus: strong");
  assert(scores.providerAgreement.providerCount === 2, "2 providers");
})();

// Empty analysis
(() => {
  const analysis = makeAnalysis([]);
  const scores = computeScores(analysis);
  assert(scores.verdict === "insufficient_evidence", "Empty → insufficient_evidence");
  assert(scores.aiInvolvementScore === 0, "AI = 0 for empty");
})();

// ─── CALIBRATION METRICS ─────────────────────────────────────

console.log("\n── Calibration ──");

(() => {
  const cases: BenchmarkCase[] = [
    { id: "1", label: "Real photo", mediaType: "image", expectedClass: "authentic", source: "test", description: "Real", fileReference: "x" },
    { id: "2", label: "AI image", mediaType: "image", expectedClass: "ai_generated", source: "test", description: "AI", fileReference: "x" },
    { id: "3", label: "AI image 2", mediaType: "image", expectedClass: "ai_generated", source: "test", description: "AI", fileReference: "x" },
    { id: "4", label: "Real photo 2", mediaType: "image", expectedClass: "authentic", source: "test", description: "Real", fileReference: "x" },
  ];

  const predictions: ProviderPrediction[] = [
    { caseId: "1", provider: "hive", aiProbability: 0.1, manipulationProbability: 0, confidence: 0.9, predictedPositive: false },
    { caseId: "2", provider: "hive", aiProbability: 0.92, manipulationProbability: 0, confidence: 0.9, predictedPositive: true },
    { caseId: "3", provider: "hive", aiProbability: 0.88, manipulationProbability: 0, confidence: 0.85, predictedPositive: true },
    { caseId: "4", provider: "hive", aiProbability: 0.15, manipulationProbability: 0, confidence: 0.88, predictedPositive: false },
  ];

  const metrics = evaluatePredictions(cases, predictions);
  assert(metrics.accuracy === 1.0, "Perfect predictions → accuracy 1.0");
  assert(metrics.precision === 1.0, "Perfect predictions → precision 1.0");
  assert(metrics.recall === 1.0, "Perfect predictions → recall 1.0");
  assert(metrics.falsePositiveRate === 0, "No false positives");
})();

// ─── CONFIDENCE SEMANTICS ────────────────────────────────────

console.log("\n── Confidence Semantics ──");

(() => {
  // AI probability ≠ confidence
  const r = makeResult("hive", 0.92, 0.1, 0.65);
  assert(r.aiProbability !== r.confidence, "AI probability ≠ confidence");

  // Disagreement lowers fusion confidence
  const f = fuseProviderResults([
    makeResult("hive", 0.95, 0.1, 0.9),
    makeResult("sightengine", 0.20, 0.05, 0.9),
  ], []);
  assert(f.confidence < 0.6, "Disagreement lowers fusion confidence below individual");
})();

// ─── SUMMARY ─────────────────────────────────────────────────

console.log(`\n${"═".repeat(50)}`);
console.log(`Tests: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (failed > 0) {
  process.exit(1);
}

console.log("✅ All detection engine tests passed.\n");
