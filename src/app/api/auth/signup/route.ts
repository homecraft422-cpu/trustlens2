import { NextRequest, NextResponse } from "next/server";
import { createUser, normalizeEmail, createMagicLinkToken } from "@/lib/auth";
import { config } from "@/lib/config";
import { sendEmail, renderMagicLinkEmail } from "@/lib/email";
import { resolveBaseUrl, friendlySendError } from "@/lib/magic-link-helpers";

// config is used for app URL and magic-link expiry.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Enter a valid email address.", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "Name must be between 2 and 80 characters.", code: "INVALID_NAME" },
        { status: 400 }
      );
    }
    if (password.length < 8 || password.length > 256) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters.", code: "WEAK_PASSWORD" },
        { status: 400 }
      );
    }

    await createUser(email, password, name);

    // Send an email-verification / magic-link sign-in link.
    // We intentionally do not auto-start a password session until the inbox is confirmed.
    const { rawToken, expiresAt } = await createMagicLinkToken({
      email,
      purpose: "email_verification",
      redirectPath: "/dashboard?verified=1",
    });

    const callbackUrl = new URL("/api/auth/magic-link/verify", resolveBaseUrl(req));
    callbackUrl.searchParams.set("token", rawToken);
    const minutes = Math.max(1, Math.round(config.auth.magicLinkDuration / 60000));
    const message = renderMagicLinkEmail({
      name,
      url: callbackUrl.toString(),
      expiresInMinutes: minutes,
    });

    let devPreviewUrl: string | undefined;
    if (
      config.email.provider === "console" ||
      (config.email.provider === "resend" && !config.email.resendApiKey) ||
      (config.email.provider === "smtp" && !config.email.smtpHost)
    ) {
      devPreviewUrl = callbackUrl.toString();
      console.info(`📧 Signup verification link for ${email}: ${callbackUrl.toString()} (expires ${expiresAt.toISOString()})`);
    }

    // The account already exists at this point, so a mail-delivery failure must
    // not surface as "signup failed" — that used to leave users with an account
    // they were told was never created, and a second attempt then hit
    // "account already exists". Report it as a delivery problem instead.
    let emailDelivered = true;
    let deliveryWarning: string | undefined;
    try {
      await sendEmail({ to: email, subject: message.subject, text: message.text, html: message.html });
    } catch (sendError) {
      emailDelivered = false;
      deliveryWarning = friendlySendError(sendError).message;
      console.error("Signup verification email failed to send:", sendError);
    }

    return NextResponse.json(
      {
        ok: true,
        requiresVerification: true,
        emailDelivered,
        message: emailDelivered
          ? `Account created. We sent a verification link to ${email}.`
          : `Account created, but we could not send the verification email to ${email}. You can sign in with your password, or request a new link.`,
        ...(deliveryWarning ? { warning: deliveryWarning } : {}),
        ...(devPreviewUrl ? { devPreviewUrl } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    if (message === "User already exists") {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Sign in instead.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 }
      );
    }
    console.error("Signup error:", error);
    const { message: sendMessage, detail } = friendlySendError(error);
    return NextResponse.json(
      {
        error: sendMessage,
        ...(detail ? { detail } : {}),
        code: "SIGNUP_FAILED",
      },
      { status: 500 }
    );
  }
}
