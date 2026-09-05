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
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className="p-5 flex items-center gap-3 border-b"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #0f766e 100%)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
          }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-800 text-base text-white block leading-tight">SessionBook</span>
          <span className="text-[11px] font-500" style={{ color: "var(--text-muted)" }}>
            Creator Workspace
          </span>
        </div>
      </div>

      {/* Booking Page Card */}
      <div className="px-3 pt-4">
        <div
          className="rounded-2xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(15,118,110,0.06) 100%)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-700 text-white">Your Booking Page</span>
            <span
              className="text-[10px] font-700 px-2 py-0.5 rounded-full"
              style={
                user.isPublished
                  ? { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }
                  : { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }
              }
            >
              {user.isPublished ? "Live" : "Draft"}
            </span>
          </div>
          <p
            className="text-xs font-500 font-mono mb-3 truncate"
            style={{ color: "var(--text-muted)" }}
          >
            /u/{user.slug}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={publicUrl}
              target="_blank"
              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              style={{
                background: "rgba(99,102,241,0.15)",
                color: "#a5b4fc",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </Link>
            <button
              onClick={copyPublicLink}
              title="Copy booking link"
              className="p-1.5 rounded-xl transition-all cursor-pointer"
              style={{
                background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: copied ? "#10b981" : "#94a3b8",
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Nav Section label */}
      <p
        className="px-5 pt-5 pb-2 text-[10px] font-700 uppercase tracking-widest"
        style={{ color: "var(--text-faint)" }}
      >
        Navigation
      </p>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group cursor-pointer"
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.08) 100%)",
                      border: "1px solid rgba(99,102,241,0.3)",
                    }
                  : {
                      background: "transparent",
                      border: "1px solid transparent",
                    }
              }
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                style={
                  isActive
                    ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }
                    : { background: "rgba(255,255,255,0.04)", color: "#64748b" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-600 leading-tight truncate"
                  style={{ color: isActive ? "#f8fafc" : "#94a3b8" }}
                >
                  {link.label}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>
                  {link.sub}
                </p>
              </div>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#6366f1" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User */}
      <div
        className="p-4 border-t"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-700 text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #0f766e 100%)",
            }}
          >
            {avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-600 text-white truncate">{user.name}</p>
            <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="p-2 rounded-xl transition-all cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
            }}
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
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40"
        style={{
          background: "rgba(5,8,17,0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "var(--glass-border)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #0f766e)" }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-800 text-white">SessionBook</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl cursor-pointer transition-all"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            color: "#94a3b8",
          }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col border-r transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(7,11,20,0.95)",
          backdropFilter: "blur(24px)",
          borderColor: "var(--glass-border)",
        }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
