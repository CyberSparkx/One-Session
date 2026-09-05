"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Settings,
  ExternalLink,
  LogOut,
  Sparkles,
  Copy,
  Check,
  Menu,
  X,
  ShieldAlert,
  CalendarCheck2,
} from "lucide-react";

interface DashboardNavProps {
  user: {
    name: string;
    email: string;
    role: string;
    slug: string;
    isPublished: boolean;
  };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicUrl = `/u/${user.slug}`;

  const copyPublicLink = () => {
    const fullUrl = `${window.location.origin}${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navLinks = [
    { href: "/dashboard", label: "Overview & Bookings", icon: LayoutDashboard },
    { href: "/dashboard/calendar", label: "Calendar View", icon: CalendarCheck2 },
    { href: "/dashboard/session-types", label: "Session Types", icon: CalendarDays },
    { href: "/dashboard/availability", label: "Weekly Availability", icon: Clock },
    { href: "/dashboard/settings", label: "Profile & Payouts", icon: Settings },
  ];

  if (user.role === "ADMIN") {
    navLinks.push({ href: "/admin", label: "Admin Portal", icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">SessionBook</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900/95 md:bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white block leading-tight">SessionBook</span>
            <span className="text-[11px] text-slate-400 font-medium">Creator Workspace</span>
          </div>
        </div>

        {/* Public Page Card */}
        <div className="p-4 mx-3 mt-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Your Booking Page</span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                user.isPublished
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {user.isPublished ? "Live" : "Draft"}
            </span>
          </div>
          <div className="text-xs text-slate-400 truncate mb-3 font-mono">/u/{user.slug}</div>
          <div className="flex items-center gap-2">
            <Link
              href={publicUrl}
              target="_blank"
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview</span>
            </Link>
            <button
              onClick={copyPublicLink}
              title="Copy link"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 mt-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Sign out */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
