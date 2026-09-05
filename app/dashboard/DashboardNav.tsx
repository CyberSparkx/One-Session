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
  FileText,
  ChevronRight,
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

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", sub: "Bookings & earnings", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendar", sub: "Schedule view", icon: CalendarCheck2 },
  { href: "/dashboard/invoices", label: "Invoices", sub: "Balance & payouts", icon: FileText },
  { href: "/dashboard/session-types", label: "Session Types", sub: "Manage offerings", icon: CalendarDays },
  { href: "/dashboard/availability", label: "Availability", sub: "Weekly hours", icon: Clock },
  { href: "/dashboard/settings", label: "Settings", sub: "Profile & payouts", icon: Settings },
];

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = user.role === "ADMIN"
    ? [...NAV_LINKS, { href: "/admin", label: "Admin Portal", sub: "Platform control", icon: ShieldAlert }]
    : NAV_LINKS;

  const publicUrl = `/u/${user.slug}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avatarInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-gray-900 border-r border-gray-200">
      {/* Brand */}
      <div className="p-5 flex items-center justify-between border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-gray-900 block leading-tight">SessionBook</span>
            <span className="text-[11px] font-medium text-gray-400">Creator Hub</span>
          </div>
        </Link>
      </div>

      {/* Booking Page Card */}
      <div className="p-3">
        <div className="rounded-xl p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Public Page</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                user.isPublished
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${user.isPublished ? "bg-green-500" : "bg-amber-500"}`} />
              {user.isPublished ? "Live" : "Draft"}
            </span>
          </div>
          <p className="text-xs font-mono text-gray-500 mb-2.5 truncate">
            /u/{user.slug}
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href={publicUrl}
              target="_blank"
              className="flex-1 py-1 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ExternalLink className="w-3 h-3" />
              Preview
            </Link>
            <button
              onClick={copyPublicLink}
              title="Copy link"
              className="p-1 rounded-lg bg-white hover:bg-gray-100 text-gray-500 border border-gray-200 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Menu</p>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-50 text-orange-600 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="leading-tight truncate">{link.label}</p>
                <p className="text-[11px] font-normal text-gray-400 truncate">{link.sub}</p>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 border border-gray-200/60">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Header ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-gray-900">SessionBook</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 md:z-30 w-64 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
