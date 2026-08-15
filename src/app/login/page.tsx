"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";
import {
  Shield,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  Image as ImageIcon,
  Video,
  Music,
  Mail,
  KeyRound,
} from "lucide-react";

type AuthMode = "magic" | "password";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const redirectUrl =
    requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/dashboard";

  const magicError = searchParams.get("magic");

  const [mode, setMode] = useState<AuthMode>("magic");
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    magicError
      ? "That sign-in link is invalid, expired, or was already used. Request a new one below."
      : ""
  );
  const [needsAccount, setNeedsAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicFallback, setMagicFallback] = useState(false);
  const [devPreviewUrl, setDevPreviewUrl] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsAccount(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "We could not sign you in. Please try again.");
        setNeedsAccount(data.code === "INVALID_CREDENTIALS");
        // Passwordless account: move them to the tab that actually works.
        if (data.code === "PASSWORDLESS_ACCOUNT" || data.useMagicLink) {
          setMode("magic");
          setNeedsAccount(false);
        }
        setLoading(false);
        return;
      }

      const sessionResponse = await fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const sessionData = await sessionResponse.json().catch(() => ({}));
      if (!sessionResponse.ok || !sessionData.user) {
        throw new Error("SESSION_NOT_ESTABLISHED");
      }

      setSuccess(true);
      window.dispatchEvent(new Event("auth-changed"));
      // A hard navigation guarantees the dashboard mounts with the new session
      // cookie attached; router.replace alone could reuse a cached signed-out
      // RSC payload and land the user on the "sign in" dashboard state.
      window.location.assign(redirectUrl);
    } catch (error) {
      setError(
        error instanceof Error && error.message === "SESSION_NOT_ESTABLISHED"
          ? "Your password was accepted, but the secure session could not be created. Please enable cookies and try again."
          : "Network error. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDevPreviewUrl("");
    setMagicSent(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirect: redirectUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "We could not send the sign-in link. Please try again.");
        // Email delivery is down but password sign-in still works.
        if (data.canUsePassword) setMode("password");
        setLoading(false);
        return;
      }

      setMagicSent(true);
      setDevPreviewUrl(data.devPreviewUrl || "");
      setMagicFallback(!!data.fallback);
      setLoading(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setMode("password");
    setEmail("demo@trustlens.ai");
    setPassword("password123");
    setError("");
    setNeedsAccount(false);
    setMagicSent(false);
    setMagicFallback(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid md:grid-cols-12 gap-8 items-center">
      {/* Left side: Sign In Form */}
      <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-100/50">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-brand-700 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            TrustLens Auth
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in securely with an email link or your password
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode("magic");
              setError("");
              setNeedsAccount(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              mode === "magic"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Mail className="w-4 h-4" />
            Email link
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError("");
              setMagicSent(false);
              setMagicFallback(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              mode === "password"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Password
          </button>
        </div>

        {/* Demo Account Quick Button */}
        <div className="mb-6 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-blue-900">Quick Demo Access</span>
              <p className="text-blue-700">Use password mode with the demo account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
          >
            Auto Fill
          </button>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-start gap-3" role="alert">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              {mode === "password" && needsAccount && (
                <Link
                  href={`/signup?email=${encodeURIComponent(email.trim())}&redirect=${encodeURIComponent(redirectUrl)}`}
                  className="mt-2 inline-flex font-bold text-red-800 underline underline-offset-2"
                >
                  New email? Create your free account
                </Link>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>Signed in successfully! Redirecting...</div>
          </div>
        )}

        {mode === "magic" ? (
          magicSent ? (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-900">Check your email</h3>
                  {magicFallback ? (
                    <p className="text-sm text-amber-800 mt-1">
                      We couldn&apos;t email the link to <strong>{email}</strong> (the sender address isn&apos;t
                      verified with the email provider). Use the link below to sign in instead — it works right now.
                    </p>
                  ) : (
                    <p className="text-sm text-emerald-800 mt-1">
                      We sent a one-time sign-in link to <strong>{email}</strong>. The link expires in 15 minutes.
                    </p>
                  )}
                  {devPreviewUrl && (
                    <a
                      href={devPreviewUrl}
                      className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                    >
                      {magicFallback ? "Open sign-in link now" : "Open sign-in link"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setMagicSent(false)}
                    className="block mt-3 text-xs font-semibold text-emerald-900 underline underline-offset-2"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMagicSubmit} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Send sign-in link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                New email? We&apos;ll create your free account automatically after verification.
              </p>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white py-3.5 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Success!
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account yet?{" "}
            <Link href={`/signup?redirect=${encodeURIComponent(redirectUrl)}`} className="text-brand-600 font-semibold hover:underline">
              Create Free Account
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Benefits of Signing In */}
      <div className="md:col-span-5 space-y-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-7 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-brand-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Free Tier Quota Boost
          </div>
          <h2 className="text-xl font-bold mb-2">Sign in to get monthly credits:</h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Free users get monthly recurring quotas that reset automatically on the 1st of every month:
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Image Checks</div>
                  <div className="text-[11px] text-slate-400">Guest: 2 total</div>
                </div>
              </div>
              <span className="text-sm font-bold text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-md">
                10 / mo
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Video Deepfakes</div>
                  <div className="text-[11px] text-slate-400">Guest: 1 total</div>
                </div>
              </div>
              <span className="text-sm font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-md">
                5 / mo
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Audio Speech Check</div>
                  <div className="text-[11px] text-slate-400">Guest: 1 total</div>
                </div>
              </div>
              <span className="text-sm font-bold text-green-300 bg-green-500/20 px-2.5 py-1 rounded-md">
                5 / mo
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Permanent history & public shareable reports</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Suspense fallback={<Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
