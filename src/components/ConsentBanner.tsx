"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_STORAGE_KEY,
  type ConsentChoice,
} from "@/lib/ads";

/**
 * Cookie-consent banner (GDPR / EEA).
 *
 * Behavior:
 *  - Outside the EEA we auto-accept silently (frictionless experience) and
 *    the banner never appears.
 *  - Inside the EEA the banner asks once; the choice is stored in
 *    localStorage and ad networks only inject scripts after acceptance.
 *  - If the geo lookup fails, we show the banner (conservative default).
 */
export default function ConsentBanner() {
  const [state, setState] = useState<
    "checking" | "hidden" | "show"
  >("checking");

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      try {
        const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        if (stored === "accepted" || stored === "rejected") {
          setState("hidden");
          return;
        }

        const res = await fetch("/api/v1/geo", { cache: "no-store" });
        const data = (await res.json()) as { inEea?: boolean };
        if (cancelled) return;

        if (data.inEea === false) {
          // Non-EEA: assume consent (site is a free tool; no prior notice law).
          window.localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
          setState("hidden");
        } else {
          // EEA or unknown → ask.
          setState("show");
        }
      } catch {
        if (!cancelled) setState("show");
      }
    }

    decide();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state !== "show") return null;

  function choose(choice: ConsentChoice) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
      // Storage unavailable — accept and hide anyway.
    }
    window.dispatchEvent(new CustomEvent("tl-consent-change", { detail: choice }));
    setState("hidden");
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur animate-slide-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-slate-600">
            <span className="font-bold text-slate-900">We respect your privacy.</span>{" "}
            This site uses cookies for essential functions and may show ads from
            third-party networks (Google AdSense, Adsterra). You can accept or
            decline non-essential cookies below. See our{" "}
            <a href="/cookies" className="font-semibold text-brand-600 underline">
              Cookie Policy
            </a>{" "}
            and{" "}
            <a href="/privacy" className="font-semibold text-brand-600 underline">
              Privacy Policy
            </a>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => choose("rejected")}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Decline
            </button>
            <button
              onClick={() => choose("accepted")}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-700"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
