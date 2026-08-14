import { NextRequest, NextResponse } from "next/server";
import {
  createMagicLinkToken,
  normalizeEmail,
  purgeExpiredMagicLinkTokens,
} from "@/lib/auth";
import { config } from "@/lib/config";
import { sendEmail, renderMagicLinkEmail } from "@/lib/email";
import { resolveBaseUrl, friendlySendError } from "@/lib/magic-link-helpers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeRedirect(redirect?: string) {
  if (!redirect) return "/dashboard";
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/dashboard";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const redirect = typeof body?.redirect === "string" ? body.redirect : "/dashboard";

    if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Enter a valid email address.", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    purgeExpiredMagicLinkTokens().catch((error) => {
      console.warn("Could not purge expired magic-link tokens", error);
    });

    const { rawToken, expiresAt } = await createMagicLinkToken({
      email,
      purpose: "magic_link",
      redirectPath: safeRedirect(redirect),
    });

    const callbackUrl = new URL("/api/auth/magic-link/verify", resolveBaseUrl(req));
    callbackUrl.searchParams.set("token", rawToken);

    const minutes = Math.max(1, Math.round(config.auth.magicLinkDuration / 60000));
    const message = renderMagicLinkEmail({ url: callbackUrl.toString(), expiresInMinutes: minutes });

    let devPreviewUrl: string | undefined;

    // In development/preview with no real email provider, expose the link so it can be tested without an inbox.
    if (
      config.email.provider === "console" ||
      (config.email.provider === "resend" && !config.email.resendApiKey) ||
      (config.email.provider === "smtp" && !config.email.smtpHost)
    ) {
      devPreviewUrl = callbackUrl.toString();
      console.info(`🔐 Magic link for ${email}: ${callbackUrl.toString()} (expires ${expiresAt.toISOString()})`);
    }

    await sendEmail({ to: email, subject: message.subject, text: message.text, html: message.html });

    return NextResponse.json({
      ok: true,
      message: `A sign-in link was sent to ${email}. Check your inbox and spam folder.`,
      ...(devPreviewUrl ? { devPreviewUrl } : {}),
    });
  } catch (error) {
    console.error("Magic link request error:", error);
    const { message, detail } = friendlySendError(error);
    return NextResponse.json(
      {
        error: message,
        ...(detail ? { detail } : {}),
        code: "MAGIC_LINK_SEND_FAILED",
      },
      { status: 500 }
    );
  }
}
