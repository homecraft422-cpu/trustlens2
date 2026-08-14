"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,
  User,
  LogOut,
  Settings,
  BarChart3,
  FileCheck,
  Zap,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Image,
  Video,
  Music,
  CreditCard,
} from "lucide-react";

const TOOLS = [
  { href: "/analyze", label: "Image & Video Check", icon: "🖼️", desc: "AI image & video manipulation" },
  { href: "/tools/audio-check", label: "Audio Analysis", icon: "🎵", desc: "AI voice & deepfake audio" },
  { href: "/tools/fact-check", label: "Fact Checker", icon: "✅", desc: "Verify claims & statements" },
  { href: "/tools/social-check", label: "Social Media Check", icon: "📱", desc: "Instagram, Twitter, YouTube" },
  { href: "/tools/url-check", label: "URL Content Check", icon: "🌐", desc: "Scan links for authenticity" },
  { href: "/tools/batch-process", label: "Batch Processing", icon: "📦", desc: "Analyze multiple files" },
  { href: "/tools/content-fingerprint", label: "Content Fingerprint", icon: "🔍", desc: "Hashes & provenance" },
  { href: "/dashboard", label: "Analytics Dashboard", icon: "📊", desc: "Overview & detection trends" },
];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface QuotaLimits {
  image: { used: number; limit: number; remaining: number };
  video: { used: number; limit: number; remaining: number };
  audio: { used: number; limit: number; remaining: number };
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [quotas, setQuotas] = useState<QuotaLimits | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [toolsOpen, setToolsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const fetchAuthAndUsage = useCallback(async () => {
    try {
      const [meRes, usageRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/v1/usage", { cache: "no-store" }),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user || null);
      } else {
        setUser(null);
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        if (usageData.limits) {
          setQuotas(usageData.limits);
        }
      }
    } catch {
      // Ignore network errors on header poll
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthAndUsage();

    // Re-check auth when window receives focus or storage changes
    const onFocus = () => fetchAuthAndUsage();
    window.addEventListener("focus", onFocus);
    window.addEventListener("auth-changed", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("auth-changed", onFocus);
    };
  }, [fetchAuthAndUsage, pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      fetchAuthAndUsage();
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-slate-900 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-brand-600/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  TRUST<span className="text-brand-600">LENS</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 -mt-1">
                  AI Content Verification
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {/* Tools Dropdown */}
              <div className="relative" ref={toolsRef}>
                <button
                  type="button"
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    toolsOpen || pathname.startsWith("/tools")
                      ? "text-brand-600 bg-brand-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Tools
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
                </button>

                {toolsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-100 mb-1">
                      Verification Suite
                    </div>
                    <div className="space-y-0.5 max-h-[70vh] overflow-y-auto">
                      {TOOLS.map((t) => (
                        <Link
                          key={t.href}
                          href={t.href}
                          onClick={() => setToolsOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                        >
                          <span className="text-xl mt-0.5">{t.icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
                              {t.label}
                            </div>
                            <div className="text-xs text-slate-600">{t.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/analyze"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === "/analyze"
                    ? "text-brand-600 bg-brand-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Check Content
              </Link>

              <Link
                href="/reports"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === "/reports"
                    ? "text-brand-600 bg-brand-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                My Reports
              </Link>

              <Link
                href="/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === "/dashboard"
                    ? "text-brand-600 bg-brand-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Dashboard
              </Link>

              <Link
                href="/pricing"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === "/pricing"
                    ? "text-brand-600 bg-brand-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quota indicator pills */}
            {quotas && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-full text-xs">
                <span className="text-slate-600 font-medium mr-1">
                  {user ? "Monthly Credits:" : "Free Tier:"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                    quotas.image.remaining > 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  }`}
                  title={`${quotas.image.remaining} of ${quotas.image.limit} image checks remaining`}
                >
                  <Image className="w-3 h-3" />
                  {quotas.image.remaining}/{quotas.image.limit}
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                    quotas.video.remaining > 0 ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"
                  }`}
                  title={`${quotas.video.remaining} of ${quotas.video.limit} video checks remaining`}
                >
                  <Video className="w-3 h-3" />
                  {quotas.video.remaining}/{quotas.video.limit}
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                    quotas.audio.remaining > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                  title={`${quotas.audio.remaining} of ${quotas.audio.limit} audio checks remaining`}
                >
                  <Music className="w-3 h-3" />
                  {quotas.audio.remaining}/{quotas.audio.limit}
                </span>
              </div>
            )}

            {!isAuthLoading && (
              <>
                {user ? (
                  /* User Account Dropdown */
                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                        {getInitials(user.name)}
                      </div>
                      <div className="text-left hidden xl:block">
                        <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Active Free Plan</div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-2 z-50 animate-fade-in">
                        <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold">
                            <Sparkles className="w-3 h-3" />
                            10 Img • 5 Vid • 5 Aud / mo
                          </div>
                        </div>

                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Account Settings
                        </Link>

                        <Link
                          href="/reports"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <FileCheck className="w-4 h-4 text-slate-400" />
                          My Reports
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <BarChart3 className="w-4 h-4 text-slate-400" />
                          Analytics Dashboard
                        </Link>

                        <div className="border-t border-slate-100 my-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Guest Buttons */
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-md shadow-brand-600/20 hover:shadow-lg transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-xl">
          {/* User status in mobile drawer */}
          {user ? (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center">
                  {getInitials(user.name)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
              {quotas && (
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs mt-3 pt-3 border-t border-slate-200">
                  <div className="bg-blue-50 text-blue-700 p-1.5 rounded-lg">
                    <span className="font-bold">{quotas.image.remaining}/{quotas.image.limit}</span> Img
                  </div>
                  <div className="bg-purple-50 text-purple-700 p-1.5 rounded-lg">
                    <span className="font-bold">{quotas.video.remaining}/{quotas.video.limit}</span> Vid
                  </div>
                  <div className="bg-green-50 text-green-700 p-1.5 rounded-lg">
                    <span className="font-bold">{quotas.audio.remaining}/{quotas.audio.limit}</span> Aud
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
              <div className="text-xs font-semibold text-blue-900">Guest Mode (Free Tier)</div>
              <div className="text-xs text-blue-700 mt-0.5">
                Sign in to get 10 images, 5 videos, and 5 audios per month!
              </div>
              <div className="flex gap-2 mt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold text-white bg-brand-600 rounded-xl"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          )}

          {/* Nav links */}
          <div className="space-y-1">
            <Link
              href="/analyze"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-800 hover:bg-slate-50"
            >
              <Zap className="w-4 h-4 text-brand-600" />
              Check Content
            </Link>
            <Link
              href="/reports"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-800 hover:bg-slate-50"
            >
              <FileCheck className="w-4 h-4 text-slate-400" />
              My Reports
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-800 hover:bg-slate-50"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Analytics Dashboard
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-800 hover:bg-slate-50"
            >
              <CreditCard className="w-4 h-4 text-slate-400" />
              Pricing & Plans
            </Link>
            {user && (
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-800 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Account Settings
              </Link>
            )}
          </div>

          {/* Tools List */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Verification Tools
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {user && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
