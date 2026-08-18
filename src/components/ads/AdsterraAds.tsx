"use client";

import { useEffect, useRef, useState } from "react";
import { ADS_ENABLED, ADSTERRA_ADS, CONSENT_STORAGE_KEY } from "@/lib/ads";

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
  }
}

function hasConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted";
  } catch {
    // Storage blocked — assume no consent to stay conservative.
    return false;
  }
}

/**
 * Adsterra in-page ad units (Native banner 1:4 + Banner 160x300).
 *
 * The two units are injected in the exact order Adsterra expects:
 *   - the native invoke.js looks up its container <div> by id,
 *   - the 160x300 loader reads the global `atOptions` object.
 *
 * Scripts are appended via DOM APIs (not React-rendered <script> tags) so
 * execution order matches Adsterra's original snippet 1:1 and never runs
 * twice (guarded against StrictMode double-effects).
 *
 * Injection is gated on visitor consent (GDPR): outside the EEA the consent
 * banner auto-accepts, so ads still appear; inside the EEA the visitor must
 * tap Accept first.
 */
export default function AdsterraAds() {
  const banner160Ref = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);
  const [consentReady, setConsentReady] = useState(false);

  useEffect(() => {
    function check() {
      if (hasConsent()) {
        setConsentReady(true);
      }
    }
    check();
    window.addEventListener("tl-consent-change", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("tl-consent-change", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  useEffect(() => {
    if (!ADS_ENABLED || !consentReady || injectedRef.current) return;
    injectedRef.current = true;

    // --- Native banner (1:4 widget): async invoke.js + container div ---
    const nativeScript = document.createElement("script");
    nativeScript.async = true;
    nativeScript.setAttribute("data-cfasync", "false");
    nativeScript.src = ADSTERRA_ADS.nativeBanner.invokeSrc;
    document.body.appendChild(nativeScript);

    // --- Banner 160x300: global atOptions first, then invoke.js loader ---
    if (banner160Ref.current) {
      window.atOptions = {
        key: ADSTERRA_ADS.banner160.key,
        format: ADSTERRA_ADS.banner160.format,
        height: ADSTERRA_ADS.banner160.height,
        width: ADSTERRA_ADS.banner160.width,
        params: {},
      };
      const bannerScript = document.createElement("script");
      bannerScript.type = "text/javascript";
      bannerScript.src = ADSTERRA_ADS.banner160.invokeSrc;
      banner160Ref.current.appendChild(bannerScript);
    }
  }, [consentReady]); // re-run when consent arrives after mount

  if (!ADS_ENABLED || !consentReady) {
    // Development placeholder — shows exactly where ads will appear in
    // production without loading any real ad code from localhost.
    return (
      <section
        aria-label="Advertisement placeholder"
        className="mx-auto w-full max-w-6xl px-4 pb-10"
      >
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Advertisement
        </p>
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
          <div className="flex h-[300px] w-[160px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
            Adsterra
            <br />
            160×300 banner
          </div>
          <div className="flex h-[120px] w-full max-w-xl items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
            Adsterra native banner (1:4 widget)
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Advertisement" className="mx-auto w-full max-w-6xl px-4 pb-10">
      <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
        Advertisement
      </p>
      <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:items-start">
        {/* Banner 160x300 — fixed-size slot so the layout doesn't shift */}
        <div
          ref={banner160Ref}
          className="shrink-0"
          style={{ width: 160, height: 300 }}
        />
        {/* Native banner 1:4 — Adsterra fills this container by id */}
        <div className="w-full max-w-xl">
          <div id={ADSTERRA_ADS.nativeBanner.containerId} />
        </div>
      </div>
    </section>
  );
}
