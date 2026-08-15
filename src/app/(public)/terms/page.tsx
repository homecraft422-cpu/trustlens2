import type { Metadata } from "next";
import LegalPage, {
  LegalCallout,
  LegalSection,
  PolicyLink,
} from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | TRUSTLENS",
  description:
    "The terms governing access to and use of TRUSTLENS content-verification services.",
};

const contents = [
  { id: "acceptance", label: "Acceptance and eligibility" },
  { id: "service", label: "The Service" },
  { id: "accounts", label: "Accounts and security" },
  { id: "content", label: "Your content and permissions" },
  { id: "results", label: "Analysis results" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "public-reports", label: "Public reports and sharing" },
  { id: "plans", label: "Plans, credits, and payment" },
  { id: "our-rights", label: "Our intellectual property" },
  { id: "third-parties", label: "Third-party services" },
  { id: "availability", label: "Changes and availability" },
  { id: "termination", label: "Suspension and termination" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "law", label: "Law and disputes" },
  { id: "general", label: "General terms and contact" },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      badge="User Agreement"
      description="These Terms are the agreement between you and TRUSTLENS for use of our website, tools, reports, accounts, and related services."
      contents={contents}
    >
      <LegalCallout title="Please read before using TRUSTLENS" tone="amber">
        <p>
          Our outputs are automated, probabilistic assessments and can be incomplete or wrong. They
          must not be treated as proof or used as the sole basis for a high-impact decision about a person.
        </p>
      </LegalCallout>

      <LegalSection id="acceptance" title="1. Acceptance and eligibility">
        <p>
          By visiting, creating an account, submitting content, purchasing a plan or credits, or otherwise
          using the Service, you agree to these Terms and the policies they incorporate. If you do not agree,
          do not use the Service. If you use the Service for an organization, you represent that you have
          authority to bind it; “you” then includes that organization.
        </p>
        <p>
          You must be at least 18 years old and legally capable of entering this agreement. If local law
          allows a minor to use the Service only with a parent or guardian, that adult must review and accept
          these Terms and is responsible for the minor’s use. The Service is not offered where its use is prohibited.
        </p>
      </LegalSection>

      <LegalSection id="service" title="2. The Service">
        <p>
          TRUSTLENS provides tools that may inspect images, video, audio, URLs, social-media references,
          metadata, provenance information, fingerprints, or written claims. Features may identify technical
          signals associated with AI generation, editing, manipulation, synthetic speech, or misinformation;
          compare information with available sources; and generate a report explaining the result.
        </p>
        <p>
          Features, supported formats, quotas, providers, and detection methods may differ by plan, region,
          and deployment. Some environments or features may use mock, demonstration, beta, or experimental
          data. When identified as such, those results are for testing and illustration only.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts and security">
        <ul>
          <li>Provide accurate, current information and keep it updated.</li>
          <li>Maintain one account per person unless we authorize otherwise.</li>
          <li>Keep passwords, sessions, API credentials, and devices secure and confidential.</li>
          <li>Do not share, sell, transfer, or allow unauthorized use of your account.</li>
          <li>Notify us promptly at <a href="mailto:security@trustlens.com">security@trustlens.com</a> if you suspect compromise.</li>
        </ul>
        <p>
          You are responsible for activity through your account to the extent permitted by law. We may require
          verification, reset credentials, revoke sessions, or temporarily restrict access to protect the account
          or Service. Guest analyses may be associated with a browser identifier and can be lost if local storage is cleared.
        </p>
      </LegalSection>

      <LegalSection id="content" title="4. Your content and permissions">
        <p>
          “Your Content” includes any file, URL, claim, prompt, metadata, feedback, or other material you submit.
          You retain your ownership rights in Your Content. You grant TRUSTLENS a limited, worldwide,
          non-exclusive license to host, copy, validate, transform, extract technical features from, transmit to
          service providers, analyze, display to you, and otherwise process Your Content solely to operate,
          secure, support, and improve the Service as described in our <PolicyLink href="/privacy">Privacy Policy</PolicyLink>.
        </p>
        <p>
          You represent that you own Your Content or have all permissions and lawful bases needed to submit and
          process it. Your Content and our processing of it at your request must not violate privacy, publicity,
          confidentiality, intellectual-property, child-safety, contractual, or other rights. You are responsible
          for obtaining consent where required and for minimizing unnecessary personal or sensitive data.
        </p>
        <p>
          We do not claim ownership of Your Content and do not use uploaded media to train our own AI models
          unless we first obtain separate, explicit permission. We may use de-identified, aggregated operational
          metrics that do not reasonably identify you or reveal Your Content.
        </p>
      </LegalSection>

      <LegalSection id="results" title="5. Analysis results and responsible use">
        <p>
          Analysis scores, labels, explanations, source links, signals, and reports (“Results”) are generated from
          available tools, models, provider responses, metadata, and sources. Detection technology has false
          positives and false negatives. Content may be authentic despite suspicious signals, manipulated despite
          no detected signal, or unverifiable because evidence is missing or degraded.
        </p>
        <ul>
          <li>Review the confidence, limitations, evidence, date, and context—not only the headline verdict.</li>
          <li>Confirm important findings with primary sources, qualified experts, and other independent methods.</li>
          <li>Do not present a Result as certainty, official certification, or a finding of intent or misconduct.</li>
          <li>
            Do not use a Result as the sole basis for employment, credit, housing, education, insurance, legal,
            immigration, medical, law-enforcement, or similarly consequential decisions.
          </li>
          <li>Do not use Results to harass, defame, discriminate against, or publicly accuse a person.</li>
        </ul>
        <p>
          More detail appears in our <PolicyLink href="/disclaimer">Analysis Disclaimer</PolicyLink>, which forms
          part of these Terms.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="6. Acceptable use">
        <p>
          You must follow our <PolicyLink href="/acceptable-use">Acceptable Use Policy</PolicyLink>. Among other
          things, you may not use the Service to break the law; exploit or endanger children; process non-consensual
          intimate content; invade privacy; infringe rights; facilitate fraud or harassment; bypass access, quota,
          or security controls; introduce malicious code; overload or scrape the Service; reverse engineer protected
          systems except where the law expressly permits; or misrepresent Results.
        </p>
        <p>
          You may not resell or commercially expose the Service or its API without written authorization. Reasonable
          public discussion of a Result is allowed if it is accurate, contextualized, and does not violate another person’s rights.
        </p>
      </LegalSection>

      <LegalSection id="public-reports" title="7. Public reports and sharing">
        <p>
          Certain features let you create or share a report link. You control whether to initiate sharing, but a person
          with the link may copy, screenshot, index, or redistribute the report. Do not include confidential or sensitive
          information in a public report. Remove or disable sharing when it is no longer appropriate.
        </p>
        <p>
          We may restrict or remove a shared report that violates these Terms, creates a security or legal risk, or is
          the subject of a valid rights complaint. Removal from TRUSTLENS does not remove copies previously made by others.
        </p>
      </LegalSection>

      <LegalSection id="plans" title="8. Plans, credits, renewal, and payment">
        <h3>Prices and taxes</h3>
        <p>
          Current features, quotas, prices, currencies, and billing periods are shown at checkout or on the Pricing page.
          Taxes, bank fees, currency conversion, and payment-provider charges may apply. You authorize us and our payment
          provider to charge the displayed amount using your selected method.
        </p>
        <h3>Subscriptions</h3>
        <p>
          A paid subscription renews for the stated period until cancelled, unless checkout clearly says otherwise. You
          may cancel through available account settings or by contacting support. Cancellation stops future renewal and
          normally takes effect at the end of the paid period; unused monthly quotas do not roll over unless stated.
        </p>
        <h3>Credits</h3>
        <p>
          Purchased credits are a limited, revocable right to use eligible Service features. They are not money, stored
          value, or transferable property; cannot be redeemed for cash; and may be consumed at different rates by media
          type. Any expiry or plan restriction will be disclosed before purchase. Promotional credits may have separate terms.
        </p>
        <h3>Refunds and price changes</h3>
        <p>
          Refund eligibility is governed by our <PolicyLink href="/refund-policy">Refund &amp; Cancellation Policy</PolicyLink>
          and mandatory consumer law. We may change future prices after reasonable notice; a change does not alter an
          already-paid billing period. A clearly identified demo checkout does not process payment and creates no refund obligation.
        </p>
      </LegalSection>

      <LegalSection id="our-rights" title="9. Our intellectual property">
        <p>
          The Service—including software, interface, branding, designs, documentation, and our original report format—is
          owned by or licensed to TRUSTLENS and protected by applicable law. Except for the limited right to use the Service
          under these Terms, no right or license is granted to you.
        </p>
        <p>
          You may download or share a Result for lawful internal, journalistic, educational, or personal use, subject to
          these Terms and third-party rights. Do not remove notices, imply endorsement, use our marks confusingly, or copy
          substantial portions of the Service to build a competing dataset or product. Feedback you voluntarily provide may
          be used by us without restriction or payment, but we will not identify you publicly without permission.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="10. Third-party services and content">
        <p>
          The Service may rely on or link to detection providers, payment processors, hosting services, public sources,
          social platforms, and other third parties. Their services and content are controlled by them, not us. Links do
          not mean endorsement, and source availability or accuracy may change. Your use of a third party may be governed
          by its separate terms and privacy policy. We are not responsible for third-party services to the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="11. Changes, beta features, and availability">
        <p>
          We may add, change, limit, suspend, or discontinue a feature; update models or providers; impose reasonable usage
          limits; or perform maintenance. We aim to provide notice of a material reduction to a paid feature when practicable,
          but urgent security, legal, or provider changes may occur without advance notice.
        </p>
        <p>
          Beta, preview, demo, or experimental features may be less reliable, change substantially, or be withdrawn. Do not
          depend on the Service as your only copy of content or reports. Maintain appropriate backups and independent workflows.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="12. Suspension and termination">
        <p>
          You may stop using the Service at any time and may request account deletion. We may suspend, limit, or terminate
          access if you materially or repeatedly violate these Terms; create risk or legal exposure; fail to pay; use the
          Service fraudulently; or if suspension is reasonably needed for security, maintenance, or legal compliance.
        </p>
        <p>
          Where appropriate, we will provide notice and an opportunity to cure or appeal. We may act immediately for urgent
          threats, unlawful content, child-safety concerns, attacks, or evasion. On termination, your license to use the
          Service ends. Provisions that by nature should survive—including payment obligations, ownership, disclaimers,
          liability limits, indemnity, and dispute terms—remain effective.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="13. Disclaimers">
        <p>
          To the maximum extent permitted by law, the Service and Results are provided “as is” and “as available.” TRUSTLENS
          disclaims implied warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy,
          availability, and error-free operation. We do not warrant that a Result is complete, current, admissible as evidence,
          or suitable for your intended purpose. Nothing in these Terms excludes a warranty that cannot lawfully be excluded.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="14. Limitation of liability">
        <p>
          To the maximum extent permitted by law, TRUSTLENS and its affiliates, personnel, and service providers will not be
          liable for indirect, incidental, special, exemplary, punitive, or consequential damages; lost profits, revenue,
          goodwill, data, or opportunities; or harm arising from reliance on a Result, third-party conduct, unauthorized access,
          or service interruption, even if advised of the possibility.
        </p>
        <p>
          To the maximum extent permitted by law, our aggregate liability for claims relating to the Service will not exceed
          the greater of (a) the amount you paid to TRUSTLENS for the Service during the 12 months before the event giving rise
          to the claim or (b) US$100 (or its local-currency equivalent). These limits do not apply where prohibited, including
          liability that cannot be limited for fraud, wilful misconduct, or certain consumer rights.
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="15. Indemnity">
        <p>
          If you use the Service for a business or professional purpose, you will defend, indemnify, and hold harmless
          TRUSTLENS and its affiliates and personnel from third-party claims, losses, and reasonable costs arising from Your
          Content, your unlawful or unauthorized use, your public accusations or decisions based on Results, or your material
          breach of these Terms. This obligation applies only to the extent allowed by law and does not require indemnification
          for our own fraud or wilful misconduct.
        </p>
      </LegalSection>

      <LegalSection id="law" title="16. Governing law and disputes">
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law rules, except that mandatory consumer
          protections in your place of residence continue to apply. Before filing a formal claim, you and TRUSTLENS agree to
          try in good faith for 30 days to resolve it by written notice to <a href="mailto:legal@trustlens.com">legal@trustlens.com</a>.
        </p>
        <p>
          If the dispute is not resolved, it may be brought before a court of competent jurisdiction in India, unless applicable
          consumer law gives you the right to bring it elsewhere. Nothing prevents either party from seeking urgent injunctive
          relief or reporting a matter to a regulator. You may also use any consumer redress process available under mandatory law.
        </p>
      </LegalSection>

      <LegalSection id="general" title="17. General terms and contact">
        <p>
          These Terms and incorporated policies are the entire agreement about the Service and replace prior statements on
          that subject. If a provision is unenforceable, it will be modified only as necessary and the rest remains effective.
          Our failure to enforce a provision is not a waiver. You may not assign this agreement without our consent; we may
          assign it as part of a reorganization or transfer of the Service. Headings are for convenience only.
        </p>
        <p>
          We may update these Terms by posting a revised version and effective date. We will provide additional notice for
          material changes when required. Continued use after the effective date constitutes acceptance, but changes do not
          retroactively reduce mandatory rights. Questions may be sent to
          {" "}<a href="mailto:legal@trustlens.com">legal@trustlens.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
