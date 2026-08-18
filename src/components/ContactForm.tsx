"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";

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
 * Working contact form — submits to /api/v1/contact which sends the message
 * through the configured email provider (Resend / SMTP / console fallback).
 */
export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Product & account support");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      setError("Please fill in your name, a valid email, and a message of at least 10 characters.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not send your message.");
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Could not send your message. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h2 className="mt-3 text-xl font-extrabold text-slate-950">Message sent!</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Thanks for reaching out. We usually reply within 1–2 business days.
            For urgent issues, email us directly at support@trustlens.ai.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-5 rounded-xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
          >
            Send another message
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <h2 className="text-xl font-extrabold text-slate-950">Send us a message</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use this form and your message goes straight to our support inbox.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cf-name" className="text-sm font-bold text-slate-800">
              Your name
            </label>
            <input
              id="cf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label htmlFor="cf-email" className="text-sm font-bold text-slate-800">
              Your email
            </label>
            <input
              id="cf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cf-topic" className="text-sm font-bold text-slate-800">
              Topic
            </label>
            <select
              id="cf-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cf-message" className="text-sm font-bold text-slate-800">
              Message
            </label>
            <textarea
              id="cf-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or question. Include relevant references (e.g. report ID) but never passwords, OTPs, or full payment details."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:col-span-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
