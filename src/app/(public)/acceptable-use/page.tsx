import type { Metadata } from "next";
import LegalPage, { LegalCallout, LegalSection, PolicyLink } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | TRUSTLENS",
  description: "Rules for safe, lawful, and responsible use of TRUSTLENS verification tools.",
};

const contents = [
  { id: "scope", label: "Scope and responsibility" },
  { id: "illegal-harm", label: "Illegal and harmful use" },
  { id: "privacy-safety", label: "Privacy and personal safety" },
  { id: "children", label: "Child safety" },
  { id: "results", label: "Responsible use of Results" },
  { id: "security", label: "Platform and security abuse" },
  { id: "rights", label: "Intellectual property" },
  { id: "automation", label: "Automation and resale" },
  { id: "enforcement", label: "Enforcement and appeals" },
  { id: "report", label: "Report misuse" },
];

export default function AcceptableUsePolicy() {
  return (
    <LegalPage
      title="Acceptable Use Policy"
      badge="Trust & Safety"
      description="These rules protect people, submitted content, and the reliability of TRUSTLENS. They apply to every user, account, integration, and shared report."
      contents={contents}
    >
      <LegalCallout title="Use verification tools to reduce harm—not create it" tone="green">
        <p>
          You may investigate suspicious content, support journalism or research, protect your organization,
          and improve media literacy. You may not use TRUSTLENS to exploit people, evade safeguards, or turn
          an uncertain result into a false accusation.
        </p>
      </LegalCallout>

      <LegalSection id="scope" title="1. Scope and your responsibility">
        <p>
          This Acceptable Use Policy is part of the <PolicyLink href="/terms">Terms of Service</PolicyLink>.
          It applies to use of our website, upload tools, fact checks, URLs, reports, batch features, APIs,
          and any attempt to access the Service. You are responsible for your users, credentials, submissions,
          public links, and downstream use of Results.
        </p>
        <p>
          You must comply with applicable law and obtain all necessary rights and consent. A permitted example
          below does not excuse unlawful conduct, and a prohibited example is illustrative rather than exhaustive.
        </p>
      </LegalSection>

      <LegalSection id="illegal-harm" title="2. Illegal, deceptive, or harmful activity">
        <p>You may not use the Service to:</p>
        <ul>
          <li>commit, plan, facilitate, or conceal a crime or violation of another person’s legal rights;</li>
          <li>defraud, phish, impersonate, extort, stalk, threaten, harass, or coordinate targeted abuse;</li>
          <li>create or support disinformation intended to suppress voting, incite violence, or cause imminent harm;</li>
          <li>distribute malware, stolen credentials, unlawful surveillance material, or instructions to bypass safeguards;</li>
          <li>discriminate unlawfully or facilitate persecution based on a protected characteristic;</li>
          <li>submit content subject to a court order, confidentiality duty, or access restriction you are not allowed to breach; or</li>
          <li>misrepresent your identity, authority, affiliation, payment status, or entitlement to use content.</li>
        </ul>
      </LegalSection>

      <LegalSection id="privacy-safety" title="3. Privacy, biometrics, and personal safety">
        <p>
          Do not upload private or sensitive content without a lawful basis. Prohibited uses include non-consensual
          intimate imagery; sexualized content shared to shame or identify a person; doxxing; unlawful tracking;
          bulk face or voice surveillance; inferring protected or highly sensitive traits; and building identity
          profiles without appropriate notice, consent, and legal authority.
        </p>
        <p>
          You may use the Service to investigate possible impersonation, scams, or deepfakes when you minimize data,
          limit access, preserve context, and avoid publishing uncertain allegations. Law-enforcement, employment,
          education, and similar investigations must include appropriate authorization, human review, and due process.
        </p>
      </LegalSection>

      <LegalSection id="children" title="4. Child safety and exploitation">
        <p>
          TRUSTLENS has zero tolerance for child sexual abuse material (CSAM), grooming, sexualization of minors,
          trafficking, or content that exploits or endangers a child. You must not upload, generate, solicit, retain,
          or distribute such material through the Service—even for the stated purpose of testing a detector.
        </p>
        <p>
          If you encounter suspected CSAM, do not download, forward, or repeatedly analyze it. Report it through the
          legally appropriate child-protection or law-enforcement channel in your jurisdiction. We may preserve and
          report apparent illegal content when legally required and may immediately suspend related accounts.
        </p>
      </LegalSection>

      <LegalSection id="results" title="5. Responsible use and communication of Results">
        <p>You must not:</p>
        <ul>
          <li>describe a probabilistic score as proof, certainty, official certification, or a finding of guilt;</li>
          <li>fabricate, edit, crop, or remove limitations from a report in a way that misleads others;</li>
          <li>claim TRUSTLENS endorses an accusation, person, campaign, product, or political position;</li>
          <li>use a Result alone to make a high-impact decision about an identifiable person;</li>
          <li>publish sensitive personal information or confidential submitted content through a report link; or</li>
          <li>use Results to defame, intimidate, discriminate against, or organize harassment of a person.</li>
        </ul>
        <p>
          When sharing a Result, preserve its date, confidence, evidence, and limitations. Correct or withdraw a public
          statement if reliable later evidence shows it was materially wrong. Read the
          {" "}<PolicyLink href="/disclaimer">Analysis Disclaimer</PolicyLink> before public use.
        </p>
      </LegalSection>

      <LegalSection id="security" title="6. Platform, account, and security abuse">
        <p>You may not:</p>
        <ul>
          <li>bypass or manipulate authentication, paywalls, quotas, credits, rate limits, or report permissions;</li>
          <li>probe, scan, exploit, or access systems, accounts, files, or data without authorization;</li>
          <li>introduce malware, destructive payloads, invalid files intended to exploit parsers, or denial-of-service traffic;</li>
          <li>use multiple accounts, identities, IP addresses, or automation to evade restrictions or enforcement;</li>
          <li>interfere with another user, corrupt Results, or overload infrastructure or upstream providers;</li>
          <li>extract secrets, source code, model weights, or non-public system instructions; or</li>
          <li>test a vulnerability in a manner that accesses personal data, disrupts service, or causes harm.</li>
        </ul>
        <p>
          Good-faith security research should follow the instructions on our <PolicyLink href="/security">Security page</PolicyLink>.
          Report vulnerabilities privately to <a href="mailto:security@trustlens.com">security@trustlens.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="7. Intellectual-property and access rights">
        <p>
          Do not submit content you are not entitled to process; remove rights-management notices; use the Service to
          locate or distribute pirated material; copy the TRUSTLENS interface or documentation beyond legal allowances;
          or use our name or logo to imply sponsorship. Good-faith analysis for commentary, research, security, or
          journalism may be permitted by law, but you remain responsible for the facts and your use.
        </p>
      </LegalSection>

      <LegalSection id="automation" title="8. Automation, scraping, and resale">
        <p>
          Use only documented or expressly authorized interfaces. Do not scrape pages, enumerate public report IDs,
          harvest user data, run unapproved bots, or create traffic that exceeds stated limits. Do not resell, sublicense,
          white-label, or provide shared access to the Service or Results as a commercial detection service without our
          written agreement. Approved API and business use remains subject to plan limits, security requirements, and law.
        </p>
      </LegalSection>

      <LegalSection id="enforcement" title="9. Enforcement and appeals">
        <p>
          We may investigate suspected violations using account, usage, security, and submission information as permitted
          by our Privacy Policy. Depending on severity and context, we may warn you, remove or disable a report, limit a
          feature, revoke sessions or API access, suspend an account, terminate service, preserve evidence, or report a
          matter when legally required.
        </p>
        <p>
          We may act immediately when needed to protect a child, prevent imminent harm, contain a security incident, or
          comply with law. Otherwise, we will try to provide notice and an opportunity to explain or appeal. Attempts to
          retaliate against a reporter or evade enforcement are separate violations.
        </p>
      </LegalSection>

      <LegalSection id="report" title="10. Report misuse or appeal an action">
        <p>
          Email <a href="mailto:abuse@trustlens.com">abuse@trustlens.com</a> with the relevant URL or report ID, a concise
          description, and supporting evidence. For an account appeal, use the email associated with the account and explain
          why the action should be reconsidered. Do not send passwords, unnecessary sensitive files, or suspected CSAM.
          False, automated, or abusive reports may themselves violate this policy.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
