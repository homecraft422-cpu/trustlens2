import type { Metadata } from "next";
import LegalPage, { LegalCallout, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Accessibility Statement | TRUSTLENS",
  description: "TRUSTLENS accessibility commitments, known limitations, and feedback process.",
};

const contents = [
  { id: "commitment", label: "Our commitment" },
  { id: "measures", label: "Measures we take" },
  { id: "compatibility", label: "Compatibility" },
  { id: "limitations", label: "Known limitations" },
  { id: "alternatives", label: "Alternative access" },
  { id: "feedback", label: "Feedback and response" },
  { id: "assessment", label: "Assessment and updates" },
];

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility Statement"
      badge="Inclusive Access"
      description="TRUSTLENS aims to make content-verification tools understandable and usable for people with diverse abilities, devices, and assistive technologies."
      contents={contents}
    >
      <LegalCallout title="Need help using a feature?" tone="green">
        <p>
          Email <a href="mailto:accessibility@trustlens.com">accessibility@trustlens.com</a> and tell us the page,
          task, assistive technology, and format you need. We will work with you on a reasonable alternative.
        </p>
      </LegalCallout>

      <LegalSection id="commitment" title="1. Our commitment">
        <p>
          We are working toward conformance with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA where
          reasonably applicable to the public website and core user workflows. Accessibility is considered in design,
          development, content, testing, and support, but the Service may not yet conform fully in every feature or state.
        </p>
        <p>
          Our goal is practical access: users should be able to navigate, upload supported content, understand status,
          review findings, manage an account, and reach policies and support without unnecessary barriers. This statement
          describes an ongoing effort, not a certification or guarantee of perfect accessibility.
        </p>
      </LegalSection>

      <LegalSection id="measures" title="2. Accessibility measures">
        <p>Measures used or planned across TRUSTLENS include:</p>
        <ul>
          <li>semantic headings, landmarks, lists, tables, labels, and meaningful link text;</li>
          <li>keyboard-operable navigation and visible focus indicators;</li>
          <li>responsive layouts that support mobile devices and browser zoom;</li>
          <li>color choices intended to provide sufficient contrast, with text beyond color-only status cues;</li>
          <li>accessible names for controls and decorative icons hidden from assistive technology where appropriate;</li>
          <li>clear validation, progress, status, error, and limitation messages;</li>
          <li>captions, transcripts, text summaries, or alternatives for our own material where applicable; and</li>
          <li>periodic review with automated tools, keyboard testing, and assistive-technology checks.</li>
        </ul>
      </LegalSection>

      <LegalSection id="compatibility" title="3. Technical compatibility">
        <p>
          TRUSTLENS is designed for current versions of major browsers using standards-based HTML, CSS, JavaScript,
          and WAI-ARIA where native semantics are not enough. The experience should work with common screen readers,
          keyboard navigation, voice input, magnification, and operating-system accessibility settings, but combinations
          of older browsers and assistive technologies may behave differently.
        </p>
        <p>
          JavaScript and browser storage are required for key functions including authentication, uploads, progress, and
          guest usage. Blocking these technologies may prevent a complete experience. We recommend an up-to-date browser
          and assistive-technology version for security and compatibility.
        </p>
      </LegalSection>

      <LegalSection id="limitations" title="4. Known and potential limitations">
        <p>Despite our efforts, barriers may occur in areas such as:</p>
        <ul>
          <li>interactive charts, media timelines, waveforms, and visually dense forensic findings;</li>
          <li>third-party payment, advertising, embedded source, or authentication interfaces we do not fully control;</li>
          <li>user-submitted images, videos, audio, filenames, links, and public reports without accessible descriptions;</li>
          <li>downloaded PDF, CSV, metadata, or provider-generated report content;</li>
          <li>live progress changes or error notices that are not announced consistently by every screen reader; and</li>
          <li>experimental, beta, demo, and administrative tools that have not completed accessibility review.</li>
        </ul>
        <p>
          An automated media detector cannot create an authoritative description of visual or audio content. Generated
          summaries may also be inaccurate and should not be treated as an accessibility replacement without human review.
        </p>
      </LegalSection>

      <LegalSection id="alternatives" title="5. Alternative access and accommodations">
        <p>
          If a feature or document is inaccessible, contact us for a reasonable alternative such as a plain-text explanation,
          accessible copy of our own document, support-assisted account action, or another available route to the same
          information. We may need to verify identity before discussing private reports, account data, billing, or submissions.
        </p>
        <p>
          Please do not email confidential media, passwords, payment credentials, or one-time codes. If a secure exchange
          is necessary, ask us to provide appropriate instructions.
        </p>
      </LegalSection>

      <LegalSection id="feedback" title="6. Accessibility feedback">
        <p>
          Email <a href="mailto:accessibility@trustlens.com">accessibility@trustlens.com</a> with:
        </p>
        <ul>
          <li>the page URL, feature, or document involved;</li>
          <li>the task you were trying to complete;</li>
          <li>your browser, device, and assistive technology, if you are comfortable sharing them;</li>
          <li>what happened and what you expected; and</li>
          <li>the accessible format or accommodation that would help.</li>
        </ul>
        <p>
          We aim to acknowledge accessibility feedback within three business days and provide a substantive response or
          progress update within a reasonable period based on impact and complexity. Urgent account or billing matters can
          also be sent to <a href="mailto:support@trustlens.com">support@trustlens.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="assessment" title="7. Assessment and statement updates">
        <p>
          Accessibility is assessed through a combination of internal review, automated checks, keyboard navigation, and
          targeted manual testing. We prioritize issues that block core workflows or affect many users. We may update this
          statement as features, standards, known limitations, and remediation work change.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
