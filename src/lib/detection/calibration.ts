/**
 * Calibration & Evaluation Service
 *
 * Supports benchmark dataset definition and metric calculation
 * for measuring detection accuracy across providers.
 *
 * IMPORTANT: These metrics are internal-only.
 * Never display accuracy claims to normal users unless validated
 * against a controlled, representative dataset.
 */

// ─── Benchmark case ──────────────────────────────────────────

export type ExpectedClass =
  | "authentic"
  | "ai_generated"
  | "ai_edited"
  | "manipulated"
  | "unknown";

export interface BenchmarkCase {
  /** Unique identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Media type */
  mediaType: "image" | "video" | "audio";
  /** Ground truth classification */
  expectedClass: ExpectedClass;
  /** Source of the ground truth (e.g., "known AI generator", "original photographer") */
  source: string;
  /** Description of the case */
  description: string;
  /** Reference to file (path, URL, or asset ID) */
  fileReference: string;
  /** Additional notes */
  notes?: string;
}

// ─── Provider prediction for a case ──────────────────────────

export interface ProviderPrediction {
  caseId: string;
  provider: string;
  aiProbability: number;
  manipulationProbability: number;
  confidence: number;
  predictedPositive: boolean; // Did this provider consider it AI/manipulated?
}

// ─── Evaluation result per provider ──────────────────────────

export interface EvaluationMetrics {
  provider: string;
  totalCases: number;
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

// ─── Fusion evaluation ──────────────────────────────────────

export interface FusionEvaluationResult {
  totalCases: number;
  perProvider: EvaluationMetrics[];
  fusionMetrics: EvaluationMetrics;
  providerAgreementRate: number;
  caseDetails: CaseEvaluationDetail[];
}

export interface CaseEvaluationDetail {
  caseId: string;
  expectedClass: ExpectedClass;
  expectedPositive: boolean;
  providers: Record<string, {
    aiProbability: number;
    predictedPositive: boolean;
    correct: boolean;
  }>;
  fusionScore: number;
  fusionPredictedPositive: boolean;
  fusionCorrect: boolean;
  spread: number;
  consensus: string;
}

// ─── Threshold for binary classification ─────────────────────
// A case is "positive" (AI-related) if expectedClass is ai_generated,
// ai_edited, or manipulated.

function isPositiveClass(cls: ExpectedClass): boolean {
  return cls === "ai_generated" || cls === "ai_edited" || cls === "manipulated";
}

function isPredictedPositive(aiProb: number, threshold: number = 0.5): boolean {
  return aiProb >= threshold;
}

// ─── Evaluate a set of predictions ──────────────────────────

export function evaluatePredictions(
  cases: BenchmarkCase[],
  predictions: ProviderPrediction[],
  threshold: number = 0.5
): EvaluationMetrics {
  const provider = predictions[0]?.provider || "unknown";
  let tp = 0, tn = 0, fp = 0, fn = 0;

  const predMap = new Map<string, ProviderPrediction>();
  for (const p of predictions) {
    predMap.set(p.caseId, p);
  }

  for (const c of cases) {
    if (c.expectedClass === "unknown") continue; // Skip unknowns
    const pred = predMap.get(c.id);
    if (!pred) continue;

    const actualPositive = isPositiveClass(c.expectedClass);
    const predictedPositive = isPredictedPositive(pred.aiProbability, threshold);

    if (actualPositive && predictedPositive) tp++;
    else if (!actualPositive && !predictedPositive) tn++;
    else if (!actualPositive && predictedPositive) fp++;
    else if (actualPositive && !predictedPositive) fn++;
  }

  const total = tp + tn + fp + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1Score = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;
  const fnr = (fn + tp) > 0 ? fn / (fn + tp) : 0;

  return {
    provider,
    totalCases: total,
    truePositives: tp,
    trueNegatives: tn,
    falsePositives: fp,
    falseNegatives: fn,
    accuracy: round(accuracy),
    precision: round(precision),
    recall: round(recall),
    f1Score: round(f1Score),
    falsePositiveRate: round(fpr),
    falseNegativeRate: round(fnr),
  };
}

/**
 * Calculate provider agreement rate across a set of cases.
 * Agreement = fraction of cases where all providers agree on positive/negative.
 */
export function calculateAgreementRate(
  cases: BenchmarkCase[],
  allPredictions: Map<string, ProviderPrediction[]>, // caseId -> predictions
  threshold: number = 0.5
): number {
  let agreeCount = 0;
  let totalCount = 0;

  for (const c of cases) {
    if (c.expectedClass === "unknown") continue;
    const preds = allPredictions.get(c.id);
    if (!preds || preds.length < 2) continue;

    totalCount++;
    const decisions = preds.map((p) => isPredictedPositive(p.aiProbability, threshold));
    const allSame = decisions.every((d) => d === decisions[0]);
    if (allSame) agreeCount++;
  }

  return totalCount > 0 ? round(agreeCount / totalCount) : 0;
}

function round(v: number): number {
  return Math.round(v * 10000) / 10000;
}
