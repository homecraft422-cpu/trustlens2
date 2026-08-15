import type { NextRequest } from "next/server";
import { config } from "./config";

/**
 * Build the public base URL for a magic-link / verification URL.
 * Prefers an explicitly-configured real domain (APP_URL / NEXT_PUBLIC_APP_URL),
 * otherwise derives it from the incoming request so preview hosts and custom
 * domains work automatically (instead of hardcoding http://localhost:3000).
 */
export function resolveBaseUrl(
  req: NextRequest,
  options: { preferRequestHost?: boolean } = {}
): string {
  const configured = config.app.url.replace(/\/$/, "");
  const looksConfigured =
    /^https?:\/\/[^/]+/.test(configured) &&
    !/^https?:\/\/localhost(:|$)/.test(configured);

  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim();
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  const requestOrigin = host ? `${proto}://${host}` : "";
  const isLocalRequestHost =
    !host ||
    /^localhost(:|$)/.test(host) ||
    /^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(host);

  // When following a link the user actually clicked, the host they are on wins
  // over a possibly-stale NEXT_PUBLIC_APP_URL — otherwise the redirect throws
  // them onto a different (or unreachable) domain and drops the session cookie.
  if (options.preferRequestHost && requestOrigin) {
    return requestOrigin;
  }

  if (looksConfigured) return configured;
  if (!isLocalRequestHost) return requestOrigin;

  return configured || requestOrigin || "http://localhost:3000";
}

/** Turn a sendEmail failure into a clear, actionable message for the user. */
export function friendlySendError(error: unknown): { message: string; detail?: string } {
  const detail = error instanceof Error ? error.message : "";
  if (detail) {
    if (/401|403/.test(detail)) {
      return {
        message:
          "Your email provider rejected the request (unauthorized). Check your API key and make sure the sender email domain is verified.",
        detail,
      };
    }
    if (/422/.test(detail)) {
      return {
        message:
          "Your email provider rejected the message (422). The sender address or domain is not verified — verify it in your email provider's dashboard.",
        detail,
      };
    }
    if (/authentication|auth failed|credentials|535|Login/i.test(detail)) {
      return {
        message:
          "Your email provider could not authenticate. Check your SMTP user/password or API key.",
        detail,
      };
    }
    if (/SOCKET|ECONN|ETIMEDOUT|connect/i.test(detail)) {
      return {
        message:
          "Could not reach your email provider. Check the SMTP host/port or network access from your hosting provider.",
        detail,
      };
    }
    return { message: `The email provider reported an error: ${detail}`, detail };
  }
  return { message: "We could not send the sign-in link right now. Please try again." };
}
