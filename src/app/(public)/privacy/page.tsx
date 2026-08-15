import type { Metadata } from "next";
import LegalPage, {
  LegalCallout,
  LegalSection,
  PolicyLink,
} from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | TRUSTLENS",
  description:
    "How TRUSTLENS collects, uses, stores, shares, and protects personal data and uploaded content.",
};

const contents = [
  { id: "scope", label: "Scope and who we are" },
  { id: "data-we-collect", label: "Data we collect" },
  { id: "how-we-use", label: "How we use data" },
  { id: "legal-bases", label: "Legal bases" },
  { id: "media-analysis", label: "Uploads and automated analysis" },
  { id: "sharing", label: "When we share data" },
  { id: "advertising", label: "Advertising and analytics" },
  { id: "retention", label: "Retention and deletion" },
  { id: "transfers", label: "International transfers" },
  { id: "security", label: "Security" },
  { id: "rights", label: "Your privacy rights" },
  { id: "children", label: "Children's privacy" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact and grievances" },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      badge="Privacy & Data Protection"
      description="This policy explains what information TRUSTLENS processes, why we process it, how long we keep it, and the choices available to you."
      contents={contents}
    >
      <LegalCallout title="The short version" tone="green">
        <p>
          We collect the information needed to provide accounts, analyze content, secure the
          service, and support users. Uploaded content is used to deliver the analysis you request;
          we do not use it to train our own AI models unless you give separate, explicit permission.
          We do not sell personal information.
        </p>
      </LegalCallout>

      <LegalSection id="scope" title="1. Scope and who we are">
        <p>
          This Privacy Policy applies to the TRUSTLENS website, applications, content-verification
          tools, reports, account features, APIs, and related support services (together, the
          “Service”). In this policy, “TRUSTLENS,” “we,” “us,” and “our” refer to the operator of
          the Service, and “you” refers to a visitor, account holder, or other person using it.
        </p>
        <p>
          This policy covers personal data processed through the Service. It does not govern a
          third-party website, platform, or service that has its own privacy policy, even when we
          link to it. If you use TRUSTLENS for an organization, that organization may separately
          control data associated with your work account.
        </p>
      </LegalSection>

      <LegalSection id="data-we-collect" title="2. Data we collect">
        <h3>Information you provide</h3>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, password in hashed form, account
            preferences, plan, and authentication or session information.
          </li>
          <li>
            <strong>Content submitted for analysis:</strong> images, video, audio, URLs, social-post
            references, written claims, filenames, and associated metadata. A submission may contain
            personal data about you or another person.
          </li>
          <li>
            <strong>Reports and sharing choices:</strong> analysis history, findings, report settings,
            and whether you choose to create or share a public report link.
          </li>
          <li>
            <strong>Transactions and support:</strong> plan or credit selections, transaction records,
            billing status, messages, attachments, survey responses, and other information you send us.
            A payment provider may process full card, bank, UPI, or wallet details; we generally receive
            only a transaction reference, status, amount, and limited billing details.
          </li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li>IP address, browser and device type, operating system, language, and approximate region.</li>
          <li>Pages viewed, referring URL, timestamps, feature use, errors, and diagnostic logs.</li>
          <li>
            Cookie identifiers, session tokens, and a browser-stored guest identifier used to apply
            usage limits and associate an analysis with a guest session.
          </li>
          <li>
            Technical characteristics and metadata extracted from submitted media, such as MIME type,
            file size, dimensions, duration, codecs, timestamps, hashes, and available provenance data.
          </li>
        </ul>

        <h3>Information from others</h3>
        <p>
          We may receive limited data from authentication, payment, hosting, security, analytics,
          advertising, and content-analysis providers; from a person who shares a report with you;
          or from publicly available sources requested for fact-checking. We process such information
          under this policy and the applicable provider terms.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" title="3. How we use data">
        <p>We use information to:</p>
        <ul>
          <li>create and secure accounts, authenticate users, and maintain sessions;</li>
          <li>validate uploads, perform requested analyses, generate findings, and store reports;</li>
          <li>operate quotas, subscriptions, credits, billing records, and service communications;</li>
          <li>provide support, respond to privacy requests, and send important account notices;</li>
          <li>detect fraud, abuse, malware, security incidents, and violations of our policies;</li>
          <li>debug, monitor, measure, and improve the reliability and usability of the Service;</li>
          <li>understand aggregate usage and, where permitted, provide or measure advertising;</li>
          <li>comply with law, enforce agreements, and protect users, the public, and our rights; and</li>
          <li>carry out another purpose disclosed to you when you provide the information.</li>
        </ul>
        <p>
          We may create aggregate or de-identified statistics that do not reasonably identify you.
          We may use and disclose those statistics for service improvement, research, security, and
          business reporting, subject to applicable law.
        </p>
      </LegalSection>

      <LegalSection id="legal-bases" title="4. Legal bases for processing">
        <p>
          Depending on your location and the activity, we rely on one or more of the following:
        </p>
        <ul>
          <li>
            <strong>Contract:</strong> processing needed to provide the Service you request and manage
            your account or purchase.
          </li>
          <li>
            <strong>Consent:</strong> for optional cookies, certain marketing, or another activity for
            which the law requires consent. You may withdraw consent prospectively.
          </li>
          <li>
            <strong>Legitimate interests:</strong> securing, maintaining, improving, and understanding
            the Service; preventing misuse; and communicating with users, balanced against your rights.
          </li>
          <li>
            <strong>Legal obligation and public interest:</strong> complying with lawful requests,
            maintaining required records, and protecting safety or legal rights.
          </li>
        </ul>
        <p>
          Where India’s Digital Personal Data Protection Act, 2023 applies, we process digital personal
          data on consent or for applicable legitimate uses and provide the notices and rights required
          by law. Other regional rights may apply as described below.
        </p>
      </LegalSection>

      <LegalSection id="media-analysis" title="5. Uploads and automated analysis">
        <p>
          TRUSTLENS uses automated systems to inspect submitted content for signals associated with
          AI generation, manipulation, deepfakes, synthetic audio, provenance, or misleading claims.
          We may extract frames, audio tracks, metadata, fingerprints, or other technical features to
          perform the requested analysis. Results are probabilistic assessments—not legal or factual
          determinations about a person or piece of content.
        </p>
        <p>
          In production mode, submitted content or derived technical data may be sent to specialist
          detection providers acting as service providers for us. They receive only the information
          reasonably needed to return an analysis and are subject to their own security, retention,
          and processing commitments. Provider availability can vary by feature and deployment.
        </p>
        <LegalCallout title="Your responsibility" tone="amber">
          <p>
            Submit content only when you have the right and lawful basis to do so. Avoid uploading
            highly sensitive, confidential, intimate, or biometric material unless it is necessary,
            lawful, and appropriate. See our <PolicyLink href="/acceptable-use">Acceptable Use Policy</PolicyLink>.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection id="sharing" title="6. When we share data">
        <p>We may disclose information to the following limited categories:</p>
        <ul>
          <li>
            <strong>Infrastructure and service providers</strong> that supply hosting, databases,
            storage, email, customer support, monitoring, authentication, payment, and security.
          </li>
          <li>
            <strong>Detection and verification providers</strong> that analyze submitted media,
            metadata, URLs, or claims on our behalf.
          </li>
          <li>
            <strong>Analytics and advertising partners</strong> when enabled and allowed by your
            settings and applicable law. See our <PolicyLink href="/cookies">Cookie Policy</PolicyLink>.
          </li>
          <li>
            <strong>Your organization</strong> if you use an organization-managed account, subject to
            the organization’s settings and agreement with us.
          </li>
          <li>
            <strong>Other users or the public</strong> when you intentionally share a report or make a
            report public. Anyone with a public link may be able to view and redistribute its contents.
          </li>
          <li>
            <strong>Authorities and affected parties</strong> when reasonably necessary to comply with
            law or legal process, investigate misuse, enforce agreements, or protect rights and safety.
          </li>
          <li>
            <strong>Transaction participants</strong> in connection with financing, reorganization,
            merger, acquisition, or transfer of all or part of the Service, subject to appropriate safeguards.
          </li>
        </ul>
        <p>
          We do not sell personal information for money. Where a privacy law treats certain targeted
          advertising or cross-context sharing as a “sale” or “sharing,” you may have a right to opt out.
        </p>
      </LegalSection>

      <LegalSection id="advertising" title="7. Advertising, analytics, and cookies">
        <p>
          TRUSTLENS may use analytics to understand traffic and may display advertisements, including
          ads delivered by Google AdSense or similar partners. Those partners may use cookies or device
          identifiers to deliver, limit, personalize, and measure ads, subject to consent requirements.
          Google’s use of advertising data is governed by Google’s own policies and controls.
        </p>
        <p>
          Essential cookies and local storage support login, security, guest limits, and core features.
          Optional analytics or advertising technologies should be used only as permitted by applicable
          law. You can use browser controls, available consent settings, and provider opt-out tools.
          Disabling essential storage may prevent account or analysis features from working.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="8. Retention and deletion">
        <p>
          We keep personal data only as long as reasonably necessary for the purposes described here,
          including to provide your account and reports, meet legal or accounting duties, resolve
          disputes, prevent fraud, and maintain security. Retention depends on the data and context:
        </p>
        <ul>
          <li>session records expire or are removed after logout, expiry, or security invalidation;</li>
          <li>account and billing records are kept while the account is active and as legally required;</li>
          <li>
            uploads, extracted artifacts, results, and reports are kept while needed to deliver history
            and sharing features, then deleted or de-identified according to operational schedules;
          </li>
          <li>security logs may be retained for a limited period needed to investigate incidents; and</li>
          <li>backup copies may remain until securely overwritten through normal backup rotation.</li>
        </ul>
        <p>
          You can request account or content deletion as explained on our
          {" "}<PolicyLink href="/data-rights">Data Rights &amp; Deletion page</PolicyLink>. We may retain
          a minimal record when required by law or necessary to establish, exercise, or defend legal claims.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="9. International data transfers">
        <p>
          TRUSTLENS and its providers may process information in countries other than your own. Those
          countries may have different data-protection laws. Where required, we use recognized transfer
          safeguards, contractual protections, risk assessments, or another lawful transfer mechanism.
          We also require service providers to apply appropriate confidentiality and security measures.
        </p>
      </LegalSection>

      <LegalSection id="security" title="10. Security">
        <p>
          We use administrative, technical, and organizational safeguards designed for the nature of
          the data and risks involved. Measures may include access controls, password hashing, secure
          session cookies, transport encryption, input and file validation, rate limits, monitoring,
          and restricted storage access. Learn more on our <PolicyLink href="/security">Security page</PolicyLink>.
        </p>
        <p>
          No internet transmission or storage system is completely secure. You are responsible for
          using a strong, unique password, protecting your device and session, and promptly telling us
          if you suspect unauthorized access.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="11. Your privacy rights">
        <p>
          Subject to your location, applicable exceptions, and identity verification, you may have the
          right to access, correct, update, delete, restrict, or object to processing; receive a portable
          copy; withdraw consent; opt out of certain advertising; and appeal or complain to a regulator.
          You will not be discriminated against for exercising a privacy right.
        </p>
        <p>
          Indian users may also have rights to correction and erasure, grievance redressal, and nomination
          as provided by applicable law. You should keep your information accurate, use the Service lawfully,
          and avoid impersonation or false grievances.
        </p>
        <p>
          Submit a request to <a href="mailto:privacy@trustlens.com">privacy@trustlens.com</a>. We may ask
          for information reasonably necessary to verify your identity and authority. Authorized agents
          may submit requests where the law permits. Our detailed process is on the
          {" "}<PolicyLink href="/data-rights">Data Rights &amp; Deletion page</PolicyLink>.
        </p>
      </LegalSection>

      <LegalSection id="children" title="12. Children's privacy">
        <p>
          The Service is not directed to children under 18, and we do not knowingly collect their personal
          data without authorization required by law. Do not submit a child’s personal or sensitive content
          unless you have a lawful basis and any required consent from a parent or guardian. If you believe
          a child provided personal data improperly, contact us so we can investigate and take appropriate action.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to this policy">
        <p>
          We may update this policy as the Service, providers, or law changes. We will post the revised
          version here and update the effective date. If a change materially affects how we process personal
          data, we will provide additional notice when required, such as an in-product message or email.
          Your rights regarding data collected before a change remain subject to applicable law.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact and grievance redressal">
        <p>
          For privacy questions, rights requests, or grievances, email
          {" "}<a href="mailto:privacy@trustlens.com">privacy@trustlens.com</a>. For security vulnerabilities,
          email <a href="mailto:security@trustlens.com">security@trustlens.com</a> rather than posting the
          issue publicly. Please include enough detail for us to locate the relevant account or submission,
          but do not email passwords or unnecessary sensitive content.
        </p>
        <p>
          We will acknowledge and address a verified grievance within the period required by applicable law.
          You may also contact your local data-protection authority where that right applies.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
