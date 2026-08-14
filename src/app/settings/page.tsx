"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UsageMeter from "@/components/UsageMeter";
import { Shield, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number; isAuthenticated: boolean } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/v1/usage").then((r) => r.json()),
    ])
      .then(([authData, usageData]) => {
        setUser(authData.user);
        setUsage(usageData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

        {/* Account */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Account</h2>
          {user ? (
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400">Name</span>
                <p className="text-sm font-medium text-slate-800">{user.name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Email</span>
                <p className="text-sm font-medium text-slate-800">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">You are using TRUSTLENS as a guest.</p>
          )}
        </div>

        {/* Usage */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Usage</h2>
          {usage && (
            <div>
              <UsageMeter used={usage.used} limit={usage.limit} isAuthenticated={usage.isAuthenticated} />
              <p className="text-xs text-slate-400 mt-3">
                {usage.isAuthenticated
                  ? `You have used ${usage.used} of ${usage.limit} analyses.`
                  : `Guest accounts have ${usage.limit} free analyses.`}
              </p>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Privacy</h2>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-brand-500 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 mb-1">Your uploads are processed securely</p>
              <p className="text-xs text-slate-500">
                Uploaded media is not used for model training without explicit permission.
                Data deletion support is available upon request.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
