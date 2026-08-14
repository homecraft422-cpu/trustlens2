"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UsageMeter, { type QuotaItem } from "@/components/UsageMeter";
import { Shield, Loader2, User, Sparkles, LogOut, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

interface DetailedUsageData {
  isAuthenticated: boolean;
  user: UserProfile | null;
  period: "monthly" | "guest_session";
  monthName: string;
  resetDate: string;
  limits: {
    image: QuotaItem;
    video: QuotaItem;
    audio: QuotaItem;
  };
  total: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<DetailedUsageData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/v1/usage", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([authData, usageData]) => {
        setUser(authData.user || null);
        setUsage(usageData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Account & Settings</h1>
          <p className="text-slate-500 mt-1">Manage your TrustLens account, active plan, and analysis limits.</p>
        </div>

        {/* Account Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Profile</h2>
            {user ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Free Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                Guest Mode
              </span>
            )}
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-brand-600/20">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                You are currently using TRUSTLENS as a guest. Guest limits: 2 images, 1 video, and 1 audio.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-md hover:bg-brand-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quota & Usage Meter Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-6 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verification Quota</h2>
          </div>

          {usage && (
            <UsageMeter
              limits={usage.limits}
              isAuthenticated={usage.isAuthenticated}
              resetDate={usage.resetDate}
              monthName={usage.monthName}
            />
          )}
        </div>

        {/* Plan Comparison Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-6 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Rules & Benefits</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900">Guest Tier (Without Sign In)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">Free</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 mt-3">
                <li>• 2 Image verifications total</li>
                <li>• 1 Video deepfake check total</li>
                <li>• 1 Audio speech analysis total</li>
                <li>• Ephemeral guest session</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-brand-900">Signed-in Free Tier</span>
                <span className="text-xs px-2 py-0.5 rounded bg-brand-600 text-white font-semibold">Monthly Plan</span>
              </div>
              <ul className="text-xs text-brand-800 space-y-1.5 mt-3">
                <li>• <strong>10 Image verifications</strong> per month</li>
                <li>• <strong>5 Video deepfake checks</strong> per month</li>
                <li>• <strong>5 Audio speech analyses</strong> per month</li>
                <li>• Automatic renewal on 1st of every month</li>
                <li>• Saved history & shareable reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy & Security Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-4 pb-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Privacy & Security</h2>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-1">Encrypted & Private Processing</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                All media uploads are transmitted over TLS, analyzed in secure memory, and never used for public model training. You retain full ownership and can delete your analyses anytime.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
