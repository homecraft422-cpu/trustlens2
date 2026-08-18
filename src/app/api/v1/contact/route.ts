import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { applyRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

interface ContactMessage {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const TOPICS = [
  "Product & account support",
  "Billing & refunds",
  "Privacy & data requests",
  "Security reports",
  "Legal & rights concerns",
  "Accessibility",
  "Other",
];

/**
 * Contact form API — validates input, rate-limits per IP + email, and sends
 * the message through the configured email provider (Resend / SMTP), falling
 * back to a console log in development.
 */
export async function POST(request: NextRequest) {
  const limit = applyRateLimit(request, "auth");
  if (!limit.allowed && limit.response) {
    return limit.response;
  }

  let body: ContactMessage;
  try {
    body = (await request.json()) as ContactMessage;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name || "").trim().replace(/[<>]/g, "").slice(0, 100);
  const email = (body.email || "").trim().toLowerCase().slice(0, 254);
  const topic = TOPICS.includes(body.topic) ? body.topic : "Other";
  const message = (body.message || "").trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, 5000);

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Please enter your name (at least 2 characters)." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Please write a message of at least 10 characters." }, { status: 400 });
  }

  // Honeypot-ish: if the topic is empty it's likely a bot (form default "Other"
  // is always sent by our UI, so empty means scripted submission).
  if (!body.topic) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const result = await sendEmail({
      to: config.contact.recipient,
      subject: `[Contact] ${topic} — from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
          <h2 style="margin-bottom:4px">New contact form submission</h2>
          <p style="color:#475569"><strong>Topic:</strong> ${topic}</p>
          <p style="color:#475569"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
          <p style="color:#334155;line-height:1.6;white-space:pre-wrap">${message}</p>
        </div>
      `,
    });

    return NextResponse.json({
      ok: result.delivered,
      provider: result.provider,
      message:
        result.delivered
          ? "Thanks! Your message has been received. We usually reply within 1–2 business days."
          : "We couldn't deliver your message right now. Please email us directly at " + config.contact.recipient,
    });
  } catch (error) {
    console.error("[contact] send failed:", error);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again or email " + config.contact.recipient },
      { status: 500 }
    );
  }
}
