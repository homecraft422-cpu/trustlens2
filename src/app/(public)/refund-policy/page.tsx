import type { Metadata } from "next";
import LegalPage, { LegalCallout, LegalSection, PolicyLink } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | TRUSTLENS",
  description: "Cancellation, renewal, credit, and refund rules for TRUSTLENS paid services.",
};

const contents = [
  { id: "scope", label: "Scope" },
  { id: "subscriptions", label: "Subscription cancellation" },
  { id: "credits", label: "Credit purchases" },
  { id: "eligible", label: "Refund eligibility" },
  { id: "not-eligible", label: "Normally non-refundable" },
  { id: "request", label: "How to request a refund" },
  { id: "processing", label: "Processing and chargebacks" },
  { id: "changes", label: "Changes and consumer rights" },
];

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      badge="Billing & Consumer Information"
      description="This policy explains how to cancel a TRUSTLENS plan, when a purchase may qualify for a refund, and how credits and renewals are handled."
      contents={contents}
    >
      <LegalCallout title="Cancel future renewals at any time" tone="green">
        <p>
          Cancelling normally stops the next charge while access continues through the paid period. A cancellation
          is not automatically a refund for time already used. Mandatory consumer rights always apply.
        </p>
      </LegalCallout>

      <LegalSection id="scope" title="1. Scope">
        <p>
          This policy applies to paid TRUSTLENS subscriptions and pay-as-you-go credit packs purchased directly from
          us. If you purchase through an app store, reseller, marketplace, or other third party, that seller’s billing
          and refund process may control. This policy is part of our <PolicyLink href="/terms">Terms of Service</PolicyLink>.
        </p>
        <p>
          The price, currency, taxes, billing interval, included quota, and any special refund term shown at checkout
          take precedence for that purchase. A checkout clearly marked “demo,” “test,” or “simulation” does not collect
          money; no refund is due for a transaction that was never charged.
        </p>
      </LegalSection>

      <LegalSection id="subscriptions" title="2. Subscription renewal and cancellation">
        <p>
          Unless checkout says otherwise, paid subscriptions renew automatically for the selected monthly or yearly
          period. You authorize the displayed recurring charge until cancellation. To cancel, use the available billing
          or account settings or email <a href="mailto:billing@trustlens.com">billing@trustlens.com</a> from the address
          associated with your account.
        </p>
        <ul>
          <li>Cancel before the renewal timestamp shown in your account to avoid the next charge.</li>
          <li>Access and plan quota normally continue through the end of the already-paid period.</li>
          <li>Cancellation does not retroactively refund prior billing periods or partially used periods.</li>
          <li>Deleting the app, clearing cookies, or not using the Service does not itself cancel a subscription.</li>
          <li>If we discontinue a paid plan, we will provide a reasonable transition, credit, or pro-rata refund as appropriate.</li>
        </ul>
      </LegalSection>

      <LegalSection id="credits" title="3. Pay-as-you-go credits">
        <p>
          Credits are consumed when eligible analyses run after an included plan quota is unavailable, at the rate
          disclosed for the relevant media type. Credits are not cash, cannot be transferred or redeemed, and are tied
          to the purchasing account. Purchased credits do not expire unless an expiry was clearly disclosed before purchase.
        </p>
        <p>
          Unused credits may qualify for a refund only under the conditions below. Used credits are ordinarily not
          refundable because the underlying computing and provider costs are incurred when an analysis is processed.
          Promotional, bonus, or complimentary credits have no cash value and are not refundable.
        </p>
      </LegalSection>

      <LegalSection id="eligible" title="4. When a refund may be available">
        <p>
          Contact us within seven calendar days after the charge, or within the longer period required by applicable law.
          After verification, we may provide a full or pro-rata refund when:
        </p>
        <ul>
          <li>you were charged more than once for the same intended purchase;</li>
          <li>an incorrect amount was charged due to a verified billing error;</li>
          <li>an unauthorized transaction is confirmed after reasonable account and payment review;</li>
          <li>
            a material technical failure attributable to TRUSTLENS prevented meaningful use of the paid Service and
            support could not restore it within a reasonable period;
          </li>
          <li>we terminate a paid Service without cause before the end of its paid period; or</li>
          <li>applicable consumer law requires a refund, cooling-off right, or other remedy.</li>
        </ul>
        <p>
          If you purchased a first subscription, did not materially use it, and request cancellation within seven days,
          we may provide a courtesy refund where payment-provider and local-law conditions allow. This courtesy is not
          guaranteed and does not apply to repeated purchases, renewals, abuse, or substantial use.
        </p>
      </LegalSection>

      <LegalSection id="not-eligible" title="5. Items normally not eligible for refund">
        <ul>
          <li>subscription time, quotas, or credits already substantially used;</li>
          <li>renewal charges when cancellation was requested only after renewal, unless law requires otherwise;</li>
          <li>dissatisfaction with an analysis label, confidence score, or inconclusive Result;</li>
          <li>incompatibility or upload failure caused by an unsupported format, device, connection, or third-party service;</li>
          <li>account restriction or termination caused by fraud, chargeback abuse, or a policy violation;</li>
          <li>currency-conversion differences, bank fees, taxes remitted, or charges imposed by another provider;</li>
          <li>promotional, free, bonus, expired, or previously refunded credits; or</li>
          <li>a request based solely on failure to cancel before a clearly disclosed renewal.</li>
        </ul>
        <p>
          An analysis is a probabilistic digital service. A Result that differs from your expectation is not by itself
          evidence that the Service failed. See the <PolicyLink href="/disclaimer">Analysis Disclaimer</PolicyLink>.
        </p>
      </LegalSection>

      <LegalSection id="request" title="6. How to request a refund">
        <p>
          Email <a href="mailto:billing@trustlens.com">billing@trustlens.com</a> from your account email and include:
        </p>
        <ol>
          <li>your name and TRUSTLENS account email;</li>
          <li>transaction ID, invoice reference, date, amount, and payment method type;</li>
          <li>the plan or credit pack purchased and the reason for your request; and</li>
          <li>relevant screenshots or error references, with full card or bank numbers redacted.</li>
        </ol>
        <p>
          Never email a password, one-time code, CVV, UPI PIN, full card number, or authentication token. We may request
          limited additional information to verify the account or transaction and prevent fraud.
        </p>
      </LegalSection>

      <LegalSection id="processing" title="7. Review, processing time, and chargebacks">
        <p>
          We aim to acknowledge requests within three business days. Approved refunds are sent to the original payment
          method when possible. We may approve the request promptly, but the bank or payment provider can take approximately
          5–10 business days—or longer across borders—to post funds. Taxes and provider fees are handled as required by law.
        </p>
        <p>
          Contact us before filing a chargeback so we can investigate. A chargeback does not remove your obligation for a
          valid charge and may lead us to restrict the associated account while the dispute is reviewed. We will not retaliate
          against a user for making a legitimate consumer complaint or exercising a legal right.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="8. Policy changes and mandatory consumer rights">
        <p>
          We may revise this policy for future purchases. The version presented at the time of purchase applies unless a
          later version is more favorable or the law requires otherwise. Nothing here limits a non-waivable right under
          applicable consumer-protection law. Billing questions may be sent to
          {" "}<a href="mailto:billing@trustlens.com">billing@trustlens.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
