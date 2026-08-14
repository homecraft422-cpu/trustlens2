"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  Image,
  Video,
  Music,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/analyze";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      // Trigger a soft refresh and redirect
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 400);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("demo@trustlens.ai");
    setPassword("password123");
    setError("");
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
            Sign in to unlock higher monthly verification limits
          </p>
        </div>

        {/* Demo Account Quick Button */}
        <div className="mb-6 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-blue-900">Quick Demo Access</span>
              <p className="text-blue-700">Test with pre-configured demo account</p>
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
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>Signed in successfully! Redirecting...</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
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
                  <Image className="w-4 h-4" />
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
      <Footer />
    </div>
  );
}
