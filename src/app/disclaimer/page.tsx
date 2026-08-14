import type { Metadata } from "next";
import LegalPage, {
  LegalCallout,
  LegalSection,
  PolicyLink,
} from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Analysis Disclaimer | TRUSTLENS",
  description:
    "Important limitations for TRUSTLENS AI-content detection, deepfake analysis, fact checks, and reports.",
};

const contents = [
  { id: "purpose", label: "Purpose of TRUSTLENS" },
  { id: "probabilistic", label: "Probabilistic results" },
  { id: "not-proof", label: "Not proof or certification" },
  { id: "fact-checks", label: "Fact-check limitations" },
  { id: "provenance", label: "Metadata and provenance" },
  { id: "professional-advice", label: "No professional advice" },
  { id: "high-impact", label: "High-impact decisions" },
  { id: "third-parties", label: "Sources and third parties" },
  { id: "user-content", label: "Uploaded content" },
  { id: "public-use", label: "Sharing and public claims" },
  { id: "demo", label: "Demo and beta features" },
  { id: "responsibility", label: "Your responsibility" },
  { id: "contact", label: "Corrections and contact" },
];

export default function Disclaimer() {
  return (
    <LegalPage
      title="Analysis Disclaimer"
      badge="Important Limitations"
      description="Understand what TRUSTLENS findings can—and cannot—tell you before relying on or sharing an analysis."
      contents={contents}
    >
      <LegalCallout title="No detector can establish truth with certainty" tone="amber">
        <p>
          A “likely authentic,” “possibly manipulated,” or “likely AI-generated” label is an
          evidence-based estimate, not proof. False positives and false negatives are possible.
          Review the full report and verify important matters independently.
        </p>
      </LegalCallout>

      <LegalSection id="purpose" title="1. Purpose of TRUSTLENS">
        <p>
          TRUSTLENS is a decision-support and media-literacy service. It helps users inspect content,
          organize technical signals, review available provenance, and identify questions for further
          investigation. It does not replace human judgment, primary-source reporting, forensic examination,
          due process, or advice from a qualified professional.
        </p>
        <p>
          This Disclaimer applies to all scores, labels, confidence values, explanations, timelines,
          metadata, fingerprints, source links, summaries, and reports generated or displayed by the Service.
          It supplements our <PolicyLink href="/terms">Terms of Service</PolicyLink>.
        </p>
      </LegalSection>

      <LegalSection id="probabilistic" title="2. Results are probabilistic">
        <p>
          Automated detection relies on statistical patterns and available technical evidence. Accuracy
          varies with file quality, compression, cropping, screen recording, editing, transcoding, language,
          duration, content type, model coverage, provider availability, and new generation techniques.
          A confidence score describes the system’s assessment under the available conditions; it is not the
          probability that a person lied or that an event did or did not happen.
        </p>
        <ul>
          <li>
            <strong>False positive:</strong> authentic or ordinary edited content may be flagged as synthetic
            or manipulated.
          </li>
          <li>
            <strong>False negative:</strong> AI-generated or manipulated content may not produce a detectable signal.
          </li>
          <li>
            <strong>Inconclusive result:</strong> insufficient, conflicting, degraded, or unsupported evidence may
            prevent a reliable assessment.
          </li>
          <li>
            <strong>Model drift:</strong> performance may change as creation tools, formats, and detection models evolve.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="not-proof" title="3. A Result is not proof or certification">
        <p>
          TRUSTLENS does not certify authorship, identity, ownership, consent, motive, legality, journalistic
          accuracy, or admissibility in court. Detection of AI involvement does not mean content is false,
          harmful, deceptive, or unlawful. AI may be used for translation, restoration, accessibility, noise
          removal, editing, or creative work. Likewise, a lack of detected AI signals does not establish authenticity.
        </p>
        <p>
          A Result is not an official C2PA certificate, digital-signature validation by an issuing authority,
          forensic expert opinion, chain-of-custody record, or guarantee from a platform or content creator.
          Preserve original files and obtain qualified forensic assistance when evidentiary integrity matters.
        </p>
      </LegalSection>

      <LegalSection id="fact-checks" title="4. Fact-check and URL limitations">
        <p>
          Fact-checking and URL tools may use automated matching, selected databases, public sources, and
          model-generated explanations. Sources can be incomplete, outdated, unavailable, misquoted, regionally
          limited, or wrong. An “unverified” label means adequate evidence was not found; it does not mean the claim
          is false. A “true,” “false,” “misleading,” or similar label can omit context or later become outdated.
        </p>
        <p>
          Check publication dates, primary documents, methodology, corrections, conflicts of interest, and the
          exact wording of the claim. For breaking news, elections, public safety, health, or conflict, consult
          multiple reputable and current sources rather than relying on one automated response.
        </p>
      </LegalSection>

      <LegalSection id="provenance" title="5. Metadata, fingerprints, and provenance">
        <p>
          Metadata can be missing, altered, stripped, spoofed, or added after creation. A hash or fingerprint can
          show that two byte sequences match or help locate related content, but does not by itself establish truth,
          ownership, or who created the file. The absence of C2PA or other provenance credentials is common and is
          not evidence that content is fake. A valid credential describes signed assertions and history; it does
          not guarantee that the depicted event is true or ethically presented.
        </p>
      </LegalSection>

      <LegalSection id="professional-advice" title="6. No legal, medical, financial, or other professional advice">
        <p>
          The Service provides general information and technical assistance only. Results are not legal advice,
          medical diagnosis, emergency guidance, investment or credit advice, insurance assessment, compliance
          certification, or a substitute for a licensed professional. Do not delay professional care or emergency
          assistance because of a TRUSTLENS Result.
        </p>
        <p>
          If content suggests immediate danger, abuse, self-harm, crime, or a medical emergency, contact appropriate
          local emergency services or qualified authorities. TRUSTLENS does not monitor submissions in real time and
          is not an emergency-reporting channel.
        </p>
      </LegalSection>

      <LegalSection id="high-impact" title="7. Do not use Results alone for high-impact decisions">
        <p>
          You must not use a Result as the sole or determinative basis for decisions affecting a person’s employment,
          education, housing, lending, insurance, healthcare, immigration, legal rights, access to essential services,
          reputation, or freedom. Such decisions require appropriate notice, human review, reliable corroboration,
          an opportunity to contest the evidence, and compliance with applicable law.
        </p>
        <p>
          Face, voice, or identity-related signals may perform differently across demographics, recording conditions,
          languages, accents, and disabilities. Do not infer identity, protected traits, intent, guilt, or credibility
          from a technical media analysis.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="8. Sources, links, and third-party providers">
        <p>
          TRUSTLENS may display information returned by specialist detection services or link to news organizations,
          fact-checkers, social platforms, archives, or public websites. We do not control or guarantee their methods,
          availability, security, accuracy, or continued content. A link or provider name is not an endorsement.
          Third-party terms may apply when you visit or use their services.
        </p>
      </LegalSection>

      <LegalSection id="user-content" title="9. Uploaded content and rights">
        <p>
          We do not verify that a user owns or has permission to analyze a submission. The presence of content in the
          Service does not establish ownership or consent. Users must have the right and lawful basis to upload and
          process content, especially material involving children, private individuals, confidential information,
          biometrics, health, sexuality, or non-consensual intimate imagery.
        </p>
        <p>
          Uploading content may expose it to automated processing and approved service providers as described in our
          {" "}<PolicyLink href="/privacy">Privacy Policy</PolicyLink>. Minimize sensitive data and do not submit content
          that our <PolicyLink href="/acceptable-use">Acceptable Use Policy</PolicyLink> prohibits.
        </p>
      </LegalSection>

      <LegalSection id="public-use" title="10. Sharing reports and making public claims">
        <p>
          A shareable report can be copied, indexed, misunderstood, or become outdated. Before publishing a report,
          redact unnecessary personal data, preserve context, state that the result is probabilistic, and give affected
          people a fair opportunity to respond where appropriate. Do not use TRUSTLENS branding or Results to imply that
          we accuse, clear, endorse, or certify a person or organization.
        </p>
        <p>
          You are responsible for statements and decisions you make based on a Result, including compliance with
          defamation, privacy, copyright, employment, evidence, and consumer-protection laws.
        </p>
      </LegalSection>

      <LegalSection id="demo" title="11. Demo, mock, beta, and experimental features">
        <p>
          Features identified as demo, mock, beta, preview, or experimental may generate simulated or preconfigured
          output, use incomplete workflows, or change without notice. Mock results do not describe the submitted content
          and must never be represented as a real analysis. Experimental features may be less accurate or available than
          generally released features. Review all in-product labels before using or sharing a Result.
        </p>
      </LegalSection>

      <LegalSection id="responsibility" title="12. Your verification checklist">
        <ol>
          <li>Use the original, highest-quality file whenever possible.</li>
          <li>Confirm whether the feature is operating in production, demo, or mock mode.</li>
          <li>Read the complete findings, provider status, confidence, and limitations.</li>
          <li>Inspect provenance and metadata without assuming that absence or presence proves truth.</li>
          <li>Compare against reverse-search results, primary sources, and independent reporting.</li>
          <li>Ask a qualified human expert when consequences are significant.</li>
          <li>Document uncertainty and avoid categorical public accusations.</li>
          <li>Re-check time-sensitive claims because sources and evidence can change.</li>
        </ol>
      </LegalSection>

      <LegalSection id="contact" title="13. Corrections and contact">
        <p>
          To report a demonstrable error, broken source, rights concern, or misleading shared report, email
          {" "}<a href="mailto:support@trustlens.com">support@trustlens.com</a>. Include the report link or analysis
          identifier, the specific issue, and reliable supporting material. Do not send passwords or unnecessary
          sensitive files by email. We may review or remove content but cannot guarantee a requested outcome.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
