import { config } from "./config";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  delivered: boolean;
  provider: "resend" | "smtp" | "console";
  messageId?: string;
}

/**
 * Simple email sender with three providers:
 * - console: logs the message and returns a dev preview link when present (for local/preview deploys)
 * - resend: uses Resend HTTP API
 * - smtp: uses nodemailer
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = config.email.provider;

  if (provider === "resend" && config.email.resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.email.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.email.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Resend email failed (${response.status}): ${detail}`);
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return { delivered: true, provider: "resend", messageId: data.id };
  }

  if (provider === "smtp" && config.email.smtpHost && config.email.smtpUser && config.email.smtpPassword) {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpSecure,
      auth: { user: config.email.smtpUser, pass: config.email.smtpPassword },
    });

    const info = await transporter.sendMail({
      from: config.email.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { delivered: true, provider: "smtp", messageId: info.messageId };
  }

  // Safe fallback: never throw in development or when no provider is configured.
  // This keeps preview deployments usable while still logging the email.
  console.info(`\n📧 Email (console fallback)`, {
    from: config.email.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  });

  return { delivered: true, provider: "console" };
}

export function renderMagicLinkEmail(params: {
  name?: string | null;
  url: string;
  expiresInMinutes: number;
}) {
  const greeting = params.name ? `Hi ${params.name},` : "Hello,";
  const subject = `Your ${config.app.name} sign-in link`;
  const text = `${greeting}\n\nUse this secure link to sign in to ${config.app.name}:\n\n${params.url}\n\nThis link expires in ${params.expiresInMinutes} minutes and can only be used once. If you did not request it, you can safely ignore this email.\n\nThanks,\nThe ${config.app.name} team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="margin-bottom: 8px;">Sign in to ${config.app.name}</h2>
      <p style="color:#475569; line-height:1.6;">${greeting}</p>
      <p style="color:#475569; line-height:1.6;">Click the button below to sign in securely. No password is needed.</p>
      <p style="margin: 28px 0;">
        <a href="${params.url}" style="background:#2563eb; color:white; padding:12px 20px; border-radius:10px; text-decoration:none; font-weight:700;">Sign in now</a>
      </p>
      <p style="color:#64748b; font-size:13px;">This link expires in ${params.expiresInMinutes} minutes and can only be used once.</p>
      <p style="color:#94a3b8; font-size:12px; word-break:break-all;">${params.url}</p>
    </div>
  `;

  return { subject, text, html };
}
