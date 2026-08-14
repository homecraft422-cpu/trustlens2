# TRUSTLENS Confidence Semantics

## Definitions

These four concepts are distinct and must NOT be mixed:

### 1. AI Probability (`aiProbability`)
- **What:** The provider's model estimate of how likely the content was generated or substantially created by AI.
- **Range:** 0.0 to 1.0
- **Source:** Detection provider model output (Hive, Sightengine, etc.)
- **NOT the same as:** accuracy, confidence, or truth.
- **Display label:** "AI Involvement" or "AI generation probability"
- **Never label as:** "accuracy" or "certainty"

### 2. Provider Confidence (`confidence`)
- **What:** How confident the provider's model is in its own classification. A high AI probability with low confidence means the model is uncertain about its own result.
- **Range:** 0.0 to 1.0
- **Source:** Provider model metadata, or derived from signal strength.
- **Display label:** "Evidence Confidence" or "Detection confidence"
- **NOT the same as:** AI probability.

### 3. Fusion Confidence
- **What:** Overall confidence in the fused multi-provider result. Penalized when providers disagree.
- **Range:** 0.0 to 1.0
- **Derivation:**
  - Strong agreement: average of provider confidences
  - Partial agreement: average × 0.75
  - Disagreement: average × 0.50
- **Display label:** "Evidence Confidence"

### 4. Evidence Severity (`severity`)
- **What:** How significant a specific piece of evidence is. A "high" severity signal found by Hive doesn't mean 100% certainty — it means the signal itself is strong.
- **Values:** low, medium, high, critical
- **NOT the same as:** overall confidence or AI probability.

## Key Rules

1. `aiProbability = 0.92` does NOT mean "92% accurate"
2. `confidence = 0.85` does NOT mean "85% chance the result is correct"
3. Two providers agreeing does NOT prove the content is AI
4. Provider disagreement should lower confidence, not force an average
5. Never display "X% accurate" to users
