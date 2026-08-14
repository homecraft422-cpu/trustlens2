import type { Metadata } from "next";
import LegalPage, { LegalCallout, LegalSection, PolicyLink } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy | TRUSTLENS",
  description: "How TRUSTLENS uses cookies, local storage, analytics, and advertising technologies.",
};

const contents = [
  { id: "overview", label: "What these technologies are" },
  { id: "categories", label: "Categories we use" },
  { id: "storage", label: "Cookies and local storage" },
  { id: "third-parties", label: "Analytics and advertising" },
  { id: "choices", label: "Your choices" },
  { id: "signals", label: "Do Not Track and opt-outs" },
  { id: "changes", label: "Changes and contact" },
];

export default function CookiePolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      badge="Cookies & Device Storage"
      description="This policy explains how cookies and similar browser technologies support login, guest usage, security, analytics, and advertising on TRUSTLENS."
      contents={contents}
    >
      <LegalCallout title="Essential storage keeps the Service working">
        <p>
          TRUSTLENS uses essential cookies and browser storage for sessions, security, and guest quotas.
          Optional analytics or advertising technologies may be used when enabled and permitted by law.
        </p>
      </LegalCallout>

      <LegalSection id="overview" title="1. What cookies and similar technologies are">
        <p>
          Cookies are small text files a website asks your browser to store. Session cookies generally expire
          when a session ends; persistent cookies remain until their expiry or deletion. Local storage is a
          browser feature that can retain identifiers or preferences without sending them automatically with
          every request. Pixels, tags, scripts, and software-development kits can perform similar functions.
        </p>
        <p>
          In this policy, “cookies” includes these related technologies where appropriate. This policy should be
          read with our <PolicyLink href="/privacy">Privacy Policy</PolicyLink>, which explains how information is used.
        </p>
      </LegalSection>

      <LegalSection id="categories" title="2. Categories we use or may use">
        <h3>Strictly necessary</h3>
        <p>
          These technologies enable functions you request and protect the Service. They may authenticate a session,
          remember a security state, route requests, balance load, prevent fraud, enforce quotas, or save a cookie
          choice. The Service may not work correctly without them, so they generally cannot be disabled through a
          consent tool.
        </p>
        <h3>Functional</h3>
        <p>
          Functional storage can remember language, display, accessibility, region, or workflow preferences. If
          disabled, the Service still may work, but you may need to re-enter preferences.
        </p>
        <h3>Analytics and performance</h3>
        <p>
          Analytics technologies help us understand visits, feature use, errors, and performance in aggregate. They
          may process a pseudonymous identifier, IP address, device/browser information, referrer, pages viewed, and
          timestamps. We use this information to diagnose problems and improve usability.
        </p>
        <h3>Advertising</h3>
        <p>
          Advertising technologies may select, limit, deliver, and measure ads and may infer interests across sites
          or sessions. Depending on your region and consent, ads may be personalized or non-personalized. We do not
          permit an advertising partner to access the files you submit for analysis merely to target advertising.
        </p>
      </LegalSection>

      <LegalSection id="storage" title="3. Technologies used by core TRUSTLENS features">
        <div className="overflow-x-auto">
          <table className="mt-4 w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-800">
                <th className="px-3 py-2">Technology</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Typical duration</th>
                <th className="px-3 py-2">Category</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-3 font-semibold text-slate-800">Session cookie</td>
                <td className="px-3 py-3">Keeps a signed-in user authenticated and helps protect account access.</td>
                <td className="px-3 py-3">Until logout or session expiry</td>
                <td className="px-3 py-3">Strictly necessary</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-3 font-semibold text-slate-800">Guest browser identifier</td>
                <td className="px-3 py-3">Associates guest analyses and applies free usage limits.</td>
                <td className="px-3 py-3">Until browser data is cleared</td>
                <td className="px-3 py-3">Strictly necessary</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-3 font-semibold text-slate-800">Security and rate-limit data</td>
                <td className="px-3 py-3">Detects abuse, protects endpoints, and keeps the Service reliable.</td>
                <td className="px-3 py-3">Session or limited operational period</td>
                <td className="px-3 py-3">Strictly necessary</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="px-3 py-3 font-semibold text-slate-800">Preference storage</td>
                <td className="px-3 py-3">Remembers settings or notices you have dismissed.</td>
                <td className="px-3 py-3">Varies by preference</td>
                <td className="px-3 py-3">Functional</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Names and exact durations can change as security and implementation details evolve. Inspect your browser’s
          storage tools for the technologies active in your current deployment and session.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="4. Third-party analytics and advertising">
        <p>
          When configured, TRUSTLENS may use Google AdSense, Google analytics products, or comparable providers.
          Google and other partners may set or read cookies and identifiers, receive device and interaction data,
          and use that information under their own privacy policies. Advertising providers may combine activity from
          TRUSTLENS with information from other services if the law and your choices permit.
        </p>
        <p>
          Third parties determine their own cookie names and expiration periods, and those details can change. You can
          review Google’s privacy and advertising controls on Google’s own policy and ad-settings pages. Blocking an
          advertising cookie should not prevent you from using the core analysis tools, although ads and measurement
          may behave differently.
        </p>
      </LegalSection>

      <LegalSection id="choices" title="5. Your cookie choices">
        <ul>
          <li>
            <strong>Consent controls:</strong> where an on-site cookie control is presented, use it to accept, reject,
            or adjust non-essential categories. Withdrawing consent does not affect earlier lawful processing.
          </li>
          <li>
            <strong>Browser controls:</strong> most browsers let you view, block, or delete site data and restrict
            third-party cookies. Browser help pages explain the steps for your version.
          </li>
          <li>
            <strong>Device and provider settings:</strong> operating-system privacy settings and advertising-provider
            opt-out tools can limit personalization or reset identifiers.
          </li>
          <li>
            <strong>Guest data:</strong> clearing local storage may reset the local guest identifier and disconnect
            browser access to guest history. It does not necessarily delete server records; use our data-request process.
          </li>
        </ul>
        <LegalCallout title="Blocking essential cookies" tone="amber">
          <p>
            If you block all cookies, sign-in, account security, saved reports, billing settings, and other core
            features may fail. You can still contact us to exercise privacy rights.
          </p>
        </LegalCallout>
      </LegalSection>

      <LegalSection id="signals" title="6. Do Not Track, Global Privacy Control, and opt-outs">
        <p>
          Browsers may transmit Do Not Track (DNT) or Global Privacy Control (GPC) signals. Because DNT does not have
          a uniform industry interpretation, the Service may not respond to it consistently. Where applicable law
          requires recognition of GPC or another universal opt-out signal, we will treat a valid signal as a request
          to opt out of covered sale, sharing, or targeted advertising for that browser.
        </p>
        <p>
          You can also email <a href="mailto:privacy@trustlens.com">privacy@trustlens.com</a> for help with a privacy
          choice. Include your region and browser type, but never send a password or session token.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="7. Changes and contact">
        <p>
          We may update this Cookie Policy when technologies, providers, or legal requirements change. We will post
          the revised date and provide additional notice when required. Questions about cookies or advertising privacy
          may be sent to <a href="mailto:privacy@trustlens.com">privacy@trustlens.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
