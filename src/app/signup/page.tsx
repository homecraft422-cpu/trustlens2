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
  Image as ImageIcon,
  Video,
  Music,
  Lock,
} from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const redirectUrl =
    requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "We could not create your account. Please try again.");
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
      router.replace(redirectUrl);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error && error.message === "SESSION_NOT_ESTABLISHED"
          ? "Your account was created, but the secure session could not be started. Please enable cookies and sign in."
          : "Network error. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid md:grid-cols-12 gap-8 items-center">
      {/* Left side: Signup Form */}
      <div className="md:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-100/50">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            100% Free Account
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Free Account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Get 10 images, 5 videos, and 5 audios every month
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>Account created! Setting up your workspace...</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
              placeholder="e.g. Alex Kumar"
            />
          </div>

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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
                placeholder="Re-enter password"
              />
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
                Creating Account...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Welcome Aboard!
              </>
            ) : (
              <>
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Benefits Breakdown */}
      <div className="md:col-span-5 space-y-4">
        <div className="bg-gradient-to-br from-brand-900 to-indigo-950 text-white rounded-3xl p-7 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-brand-200 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5 text-brand-300" />
            Your Free Plan Includes
          </div>
          <h2 className="text-xl font-bold mb-2">Monthly Recurring Quotas</h2>
          <p className="text-xs text-slate-300 mb-6 leading-relaxed">
            Free forever with monthly automatic renewals on the 1st of every month:
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/30 text-blue-300 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">10 Images / month</div>
                  <div className="text-[11px] text-slate-300">Up from 2 guest scans</div>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-200 bg-blue-500/20 px-2 py-0.5 rounded">
                +400%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/30 text-purple-300 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">5 Videos / month</div>
                  <div className="text-[11px] text-slate-300">Up from 1 guest scan</div>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-200 bg-purple-500/20 px-2 py-0.5 rounded">
                +400%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">5 Audios / month</div>
                  <div className="text-[11px] text-slate-300">Up from 1 guest scan</div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded">
                +400%
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full analysis reports & download export</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Private encrypted storage for all uploads</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Suspense fallback={<Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />}>
          <SignupForm />
        </Suspense>
      </main>
    </div>
  );
}
