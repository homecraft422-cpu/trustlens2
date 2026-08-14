"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Shield,
  ChevronDown,
  Image,
  Video,
  Music,
  MessageSquare,
  Camera,
  Globe,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
}

const TOOLS_DROPDOWN = [
  {
    href: "/analyze",
    label: "Image & Video Check",
    icon: Image,
    desc: "Verify images and videos",
  },
  {
    href: "/tools/audio-check",
    label: "Audio Analysis",
    icon: Music,
    desc: "Detect AI audio & cloning",
  },
  {
    href: "/tools/fact-check",
    label: "Fact Checker",
    icon: MessageSquare,
    desc: "Verify claims & headlines",
  },
  {
    href: "/tools/social-check",
    label: "Social Media Check",
    icon: Camera,
    desc: "Verify social posts",
  },
  {
    href: "/tools/url-check",
    label: "URL Content Check",
    icon: Globe,
    desc: "Analyze web pages",
  },
];

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/analyze", label: "Check Content" },
    { href: "/reports", label: "My Reports" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="w-7 h-7 text-brand-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              TRUST<span className="text-brand-600">LENS</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                onBlur={() => setTimeout(() => setToolsOpen(false), 200)}
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  pathname.startsWith("/tools")
                    ? "text-brand-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tools
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {toolsOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg py-2 animate-fade-in">
                  {TOOLS_DROPDOWN.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                      onClick={() => setToolsOpen(false)}
                    >
                      <tool.icon className="w-5 h-5 text-brand-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {tool.label}
                        </p>
                        <p className="text-xs text-slate-500">{tool.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-brand-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 mt-2 pt-4 animate-fade-in">
            {/* Mobile Tools */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
                Tools
              </p>
              {TOOLS_DROPDOWN.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center gap-3 py-2 px-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMenuOpen(false)}
                >
                  <tool.icon className="w-4 h-4 text-brand-500" />
                  {tool.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-600"
                >
                  Sign Out ({user.name})
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="text-sm font-medium text-slate-600">
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg text-center"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
