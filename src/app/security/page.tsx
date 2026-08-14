import type { Metadata } from "next";
import LegalPage, { LegalCallout, LegalSection, PolicyLink } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Security | TRUSTLENS",
  description: "TRUSTLENS security practices and responsible vulnerability-reporting guidance.",
};

const contents = [
  { id: "approach", label: "Our security approach" },
  { id: "accounts", label: "Account protection" },
  { id: "uploads", label: "Upload and data security" },
  { id: "operations", label: "Application and operations" },
  { id: "your-role", label: "How users can stay secure" },
  { id: "reporting", label: "Report a vulnerability" },
  { id: "safe-harbor", label: "Research guidelines" },
  { id: "incidents", label: "Security incidents" },
];

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security at TRUSTLENS"
      badge="Security & Responsible Disclosure"
      description="We use layered safeguards to protect accounts, submitted media, reports, and service infrastructure—and we welcome careful, good-faith vulnerability reports."
      contents={contents}
    >
      <LegalCallout title="Report security issues privately" tone="green">
        <p>
          Email <a href="mailto:security@trustlens.com">security@trustlens.com</a> with steps to reproduce and
          the affected URL or feature. Do not publish the issue or access another person’s data while we investigate.
        </p>
      </LegalCallout>

      <LegalSection id="approach" title="1. Our security approach">
        <p>
          TRUSTLENS applies administrative, technical, and organizational controls based on the sensitivity of data,
          foreseeable threats, and how the Service is deployed. Security is an ongoing risk-management process rather
          than a guarantee. We review controls as features, providers, and threats change.
        </p>
        <p>
          Our program is designed around least privilege, defense in depth, secure defaults, data minimization, input
          validation, and timely response. Specific controls can differ between development, demo, and production
          deployments and may change to avoid exposing defensive details.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="2. Account and session protection">
        <ul>
          <li>Passwords are stored using one-way cryptographic hashing rather than in readable form.</li>
          <li>Authentication sessions use time-limited tokens and protected cookie settings in secure deployments.</li>
          <li>Authorization and ownership checks restrict access to private account data and reports.</li>
          <li>Rate limits and validation help reduce automated abuse, credential attacks, and malformed input.</li>
          <li>Sensitive secrets and provider credentials are kept out of browser code and source-control configuration.</li>
        </ul>
        <p>
          No control can compensate for a reused password or compromised device. Use a unique password, keep your browser
          and operating system current, sign out on shared devices, and contact us promptly if account activity looks unfamiliar.
        </p>
      </LegalSection>

      <LegalSection id="uploads" title="3. Upload and data security">
        <p>
          Submitted files are treated as untrusted. Controls may include extension and MIME checks, content inspection,
          per-media size limits, randomized storage keys, restricted file paths, and separation between uploaded content
          and executable application code. Processing access is limited to the systems and providers needed to deliver an analysis.
        </p>
        <p>
          Production traffic should use HTTPS encryption in transit. Access to databases, storage, and analysis providers
          is restricted through service credentials and role-based permissions. Retention and deletion are described in our
          {" "}<PolicyLink href="/privacy">Privacy Policy</PolicyLink>. Users should still avoid submitting unnecessary
          secrets, identity documents, intimate media, or highly sensitive personal data.
        </p>
      </LegalSection>

      <LegalSection id="operations" title="4. Application and operational safeguards">
        <ul>
          <li>Parameterized database access and server-side validation reduce injection risk.</li>
          <li>Security headers and restrictive browser policies reduce common content and framing attacks.</li>
          <li>Errors shown to users are designed not to reveal stack traces, credentials, or internal paths.</li>
          <li>Logging and health checks support diagnosis, abuse detection, and incident investigation.</li>
          <li>Dependencies and configurations can be reviewed for known vulnerabilities before release.</li>
          <li>Backups, recovery procedures, and provider resilience are evaluated according to deployment needs.</li>
        </ul>
        <p>
          This page describes our approach and is not a certification, audit report, service-level agreement, or warranty
          that every listed control is active in every test deployment at all times.
        </p>
      </LegalSection>

      <LegalSection id="your-role" title="5. How you can use TRUSTLENS securely">
        <ol>
          <li>Use a strong, unique password and never share passwords, session tokens, or one-time codes.</li>
          <li>Confirm you are on the expected HTTPS domain before signing in or uploading content.</li>
          <li>Do not upload confidential or sensitive material unless it is necessary and authorized.</li>
          <li>Review report-sharing status and disable public links when they are no longer needed.</li>
          <li>Keep independent copies of important source files and reports; TRUSTLENS is not archival storage.</li>
          <li>Do not open suspicious links or files solely because a Result labels content likely authentic.</li>
          <li>Report unexpected account, billing, upload, or report activity promptly.</li>
        </ol>
      </LegalSection>

      <LegalSection id="reporting" title="6. How to report a vulnerability">
        <p>
          Email <a href="mailto:security@trustlens.com">security@trustlens.com</a> and include, where available:
        </p>
        <ul>
          <li>a clear description of the issue and realistic impact;</li>
          <li>the affected URL, endpoint, account type, browser, or feature;</li>
          <li>minimal reproducible steps, request/response examples, screenshots, or proof-of-concept code;</li>
          <li>whether any data was accidentally accessed or changed; and</li>
          <li>a safe way and preferred language for us to contact you.</li>
        </ul>
        <p>
          Remove passwords, access tokens, unrelated personal data, and destructive payloads. Use a harmless test account
          and the smallest proof needed. We aim to acknowledge useful reports within three business days, triage by severity,
          and keep the reporter informed when practical. We do not currently promise a bounty or payment.
        </p>
      </LegalSection>

      <LegalSection id="safe-harbor" title="7. Good-faith security research guidelines">
        <p>
          We will not initiate legal action solely for research that is authorized by these guidelines, conducted in good
          faith, and promptly reported, provided you:
        </p>
        <ul>
          <li>do not access, copy, retain, or disclose another person’s data;</li>
          <li>do not use phishing, social engineering, physical intrusion, malware, or employee targeting;</li>
          <li>do not perform denial-of-service, high-volume scanning, spam, or actions that degrade the Service;</li>
          <li>do not test payment providers, other users’ accounts, or third-party systems without their permission;</li>
          <li>stop immediately and report if you encounter sensitive data or obtain unintended access;</li>
          <li>give us a reasonable opportunity to investigate and remediate before public disclosure; and</li>
          <li>comply with applicable law and our instructions to prevent ongoing harm.</li>
        </ul>
        <p>
          This limited statement does not authorize activity on third-party infrastructure or waive rights of other parties.
          If you are unsure whether a test is safe, ask us before proceeding.
        </p>
      </LegalSection>

      <LegalSection id="incidents" title="8. Incident response and notification">
        <p>
          When we confirm a security incident, we work to contain it, preserve relevant evidence, assess affected systems and
          data, correct the cause, and monitor for recurrence. We notify affected users, customers, regulators, or others when
          and as required by applicable law, taking account of investigative and law-enforcement constraints.
        </p>
        <p>
          Security notices will not ask for your password, one-time code, or payment PIN. If you receive a suspicious message
          claiming to be from TRUSTLENS, do not use its links; forward details to
          {" "}<a href="mailto:security@trustlens.com">security@trustlens.com</a> through a trusted channel.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
