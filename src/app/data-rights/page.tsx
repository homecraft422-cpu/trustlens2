import type { Metadata } from "next";
import LegalPage, { LegalCallout, LegalSection, PolicyLink } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Data Rights & Deletion | TRUSTLENS",
  description: "How to access, correct, export, or delete your TRUSTLENS account and personal data.",
};

const contents = [
  { id: "options", label: "Your options" },
  { id: "account", label: "Account and report controls" },
  { id: "request", label: "Submit a request" },
  { id: "verification", label: "Identity verification" },
  { id: "deletion", label: "What deletion means" },
  { id: "guests", label: "Guest users" },
  { id: "authorized", label: "Agents and nomination" },
  { id: "timing", label: "Timing and appeals" },
  { id: "complaints", label: "Complaints and contact" },
];

export default function DataRightsPage() {
  return (
    <LegalPage
      title="Data Rights & Deletion"
      badge="Privacy Request Guide"
      description="Use this guide to access, correct, export, object to, or delete personal data associated with TRUSTLENS. Rights vary by location and circumstances."
      contents={contents}
    >
      <LegalCallout title="Start with privacy@trustlens.com" tone="green">
        <p>
          Send your request from the email connected to your account and clearly state the right you want to
          exercise. We will use your information only to verify and complete the request.
        </p>
      </LegalCallout>

      <LegalSection id="options" title="1. Privacy options that may be available">
        <p>
          Depending on applicable law, you may ask TRUSTLENS to take one or more of the following actions:
        </p>
        <ul>
          <li><strong>Access:</strong> confirm whether we process your personal data and provide a copy or summary.</li>
          <li><strong>Correction:</strong> fix inaccurate information and complete material information that is incomplete.</li>
          <li><strong>Deletion:</strong> remove eligible account, submission, analysis, and profile data.</li>
          <li><strong>Portability:</strong> provide certain data you supplied in a structured, commonly used format.</li>
          <li><strong>Restriction or objection:</strong> limit or object to certain processing where the law provides that right.</li>
          <li><strong>Withdraw consent:</strong> stop future processing that relies on your consent.</li>
          <li><strong>Advertising opt-out:</strong> opt out of covered sale, sharing, profiling, or targeted advertising.</li>
          <li><strong>Complaint or appeal:</strong> ask us to reconsider a decision or complain to an appropriate authority.</li>
        </ul>
        <p>
          Indian users may have rights of access to information, correction, completion, updating, erasure, grievance
          redressal, and nomination under applicable law. Exercising a right does not permit impersonation, false or
          frivolous grievances, or deletion of another person’s lawful account.
        </p>
      </LegalSection>

      <LegalSection id="account" title="2. Controls you can use directly">
        <p>
          Where the relevant feature is available, account settings may let you update profile details, sign out,
          manage a plan, review usage, control a public report, or delete individual history. Browser settings can
          clear cookies and the local guest identifier. Cancelling a subscription stops future renewal but does not
          itself delete the account; deleting an account does not automatically settle unpaid charges or payment disputes.
        </p>
        <p>
          Before deleting a public report, save any copy you need and disable sharing. People who previously accessed
          a report may retain copies beyond our control. See our <PolicyLink href="/privacy">Privacy Policy</PolicyLink>
          for information about collection, sharing, and retention.
        </p>
      </LegalSection>

      <LegalSection id="request" title="3. How to submit a privacy request">
        <p>
          Email <a href="mailto:privacy@trustlens.com">privacy@trustlens.com</a> with the subject “Privacy Request” and include:
        </p>
        <ol>
          <li>the right or action you want to exercise;</li>
          <li>the email address associated with your account, if any;</li>
          <li>your country or state/territory of residence;</li>
          <li>relevant report, analysis, or transaction identifiers; and</li>
          <li>enough detail to locate the data and understand your request.</li>
        </ol>
        <p>
          Do not email your password, session token, government identity document, full payment credentials, or a copy
          of sensitive uploaded media unless we specifically request a secure verification step. A concise request helps
          us respond efficiently.
        </p>
      </LegalSection>

      <LegalSection id="verification" title="4. Identity and authority verification">
        <p>
          We must reasonably verify that the requester is the person whose data is involved or an authorized representative.
          Verification can include replying from the account email, confirming recent account details, signing in, or using
          another proportionate method. We consider the sensitivity of the data, risk of harm, and type of request.
        </p>
        <p>
          If we cannot verify identity or locate data with the details supplied, we may ask for clarification or deny the
          request as permitted by law. Any verification information is used for the request, fraud prevention, and legally
          required records, then retained only as necessary.
        </p>
      </LegalSection>

      <LegalSection id="deletion" title="5. What account deletion does—and does not—mean">
        <p>
          After a verified deletion request, we will delete or de-identify eligible personal data from active systems and
          schedule eligible backup copies for removal through normal rotation. This may include profile data, sessions,
          private reports, analysis history, and stored uploads associated with the verified account.
        </p>
        <p>We may retain limited information when reasonably necessary to:</p>
        <ul>
          <li>complete an active transaction or a request you made;</li>
          <li>comply with tax, accounting, sanctions, court, or other legal obligations;</li>
          <li>detect security incidents, prevent fraud, debug errors, and protect the Service;</li>
          <li>exercise or defend legal claims and document that a privacy request was fulfilled;</li>
          <li>respect another person’s rights, such as records in their account or copies they lawfully hold; or</li>
          <li>maintain de-identified or aggregate information that no longer reasonably identifies you.</li>
        </ul>
        <p>
          Deletion is generally irreversible. It may remove access to reports, remaining quotas, and non-refundable or
          non-transferable credits. We will explain material consequences before completion when practicable.
        </p>
      </LegalSection>

      <LegalSection id="guests" title="6. Requests from guest users">
        <p>
          Guest users may not have a verified email attached to an analysis. To help us locate a guest record, provide the
          guest identifier stored in your browser, report link, analysis/job ID, approximate submission date, filename,
          and other non-sensitive details. We may be unable to provide or delete data if we cannot reliably connect you to
          it without exposing another person’s information.
        </p>
        <p>
          Clearing browser storage removes the guest identifier from that device but may not delete server-side uploads,
          analyses, or security logs. Submit a verified request if you want us to search active systems.
        </p>
      </LegalSection>

      <LegalSection id="authorized" title="7. Authorized agents, parents, and nomination">
        <p>
          Where law permits, an authorized agent may submit a request for you. We may require signed authority and may
          still contact you directly to confirm identity and the request. A parent or guardian requesting action about a
          child must establish their relationship and legal authority without sending excessive sensitive documentation.
        </p>
        <p>
          If applicable Indian law provides a nomination right, a verified account holder may nominate an eligible person
          to exercise specified rights in the event of death or incapacity. Contact us for the current process. We will
          verify the nominee’s identity, authority, and triggering event before disclosure or action.
        </p>
      </LegalSection>

      <LegalSection id="timing" title="8. Response timing, fees, and appeals">
        <p>
          We aim to acknowledge a request promptly and respond within the period required by applicable law. Complex,
          high-volume, or multi-system requests may take longer where the law allows; if so, we will explain the extension.
          Requests are ordinarily free, but we may charge a reasonable fee or refuse requests that are manifestly unfounded,
          excessive, repetitive, fraudulent, or outside legal scope, with an explanation where required.
        </p>
        <p>
          If we deny or limit a request, we will state the reason and available appeal route to the extent required. To
          appeal, reply to the decision within 30 days with the word “Appeal” and explain why it should be reconsidered.
          The appeal will be reviewed by someone not solely responsible for the original decision where practicable.
        </p>
      </LegalSection>

      <LegalSection id="complaints" title="9. Complaints and supervisory authorities">
        <p>
          Send privacy grievances and appeals to <a href="mailto:privacy@trustlens.com">privacy@trustlens.com</a>. Include
          the original request date and reference number if available. We will address verified grievances according to
          applicable timelines. You may also complain to the data-protection, consumer, or other competent authority in
          your jurisdiction. Contacting us first may allow a faster resolution but does not remove a right to contact an authority.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
