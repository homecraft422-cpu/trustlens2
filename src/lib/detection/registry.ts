/**
 * Detection Provider Registry
 *
 * Manages the set of active detection providers.
 * Providers are registered at startup based on configuration.
 */

import { DetectionProvider, Modality, ProvenanceAnalyzer } from "./types";

export class DetectionProviderRegistry {
  private providers: Map<string, DetectionProvider> = new Map();
  private provenanceAnalyzers: Map<string, ProvenanceAnalyzer> = new Map();

  /** Register a detection provider */
  register(provider: DetectionProvider): void {
    if (this.providers.has(provider.name)) {
      console.warn(`Provider "${provider.name}" already registered, replacing.`);
    }
    this.providers.set(provider.name, provider);
    console.log(
      `Registered detection provider: ${provider.name} v${provider.version} ` +
      `(${provider.getSupportedModalities().join(", ")})`
    );
  }

  /** Register a provenance analyzer */
  registerProvenanceAnalyzer(analyzer: ProvenanceAnalyzer): void {
    this.provenanceAnalyzers.set(analyzer.name, analyzer);
    console.log(`Registered provenance analyzer: ${analyzer.name}`);
  }

  /** Get all registered providers */
  getAll(): DetectionProvider[] {
    return Array.from(this.providers.values());
  }

  /** Get providers that support a given modality */
  getForModality(modality: Modality): DetectionProvider[] {
    return this.getAll().filter((p) => p.supportsModality(modality));
  }

  /** Get a specific provider by name */
  get(name: string): DetectionProvider | undefined {
    return this.providers.get(name);
  }

  /** Get all provenance analyzers */
  getProvenanceAnalyzers(): ProvenanceAnalyzer[] {
    return Array.from(this.provenanceAnalyzers.values());
  }

  /** Total number of registered providers */
  get count(): number {
    return this.providers.size;
  }

  /** List provider names */
  getNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /** Remove a provider */
  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  /** Clear all providers */
  clear(): void {
    this.providers.clear();
    this.provenanceAnalyzers.clear();
  }
}
