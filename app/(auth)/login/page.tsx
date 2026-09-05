"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const BRAND_HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Razorpay-verified secure payments" },
  { icon: Zap, text: "Live and earning in under 10 minutes" },
  { icon: TrendingUp, text: "Keep 96% of every session fee" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });
      if (result?.error) {
        setError(result.error || "Invalid email or password");
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Left: Brand panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0c1222 0%, #050811 100%)",
          borderRight: "1px solid var(--glass-border)",
        }}
      >
        {/* Background orbs */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-30 orb-1"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-20 orb-2"
          style={{
            background: "radial-gradient(circle, rgba(15,118,110,0.4) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #0f766e 100%)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-800 text-xl text-white tracking-tight">SessionBook</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-800 text-white leading-tight tracking-tight">
              Monetize your expertise,{" "}
              <span className="gradient-text">one session at a time</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Join hundreds of creators, mentors, and consultants earning from their 1:1 time.
            </p>
          </div>

          <div className="space-y-3">
            {BRAND_HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    color: "#a5b4fc",
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Stat strip */}
          <div
            className="glass-card p-4 flex items-center gap-4"
            style={{ borderColor: "rgba(99,102,241,0.2)" }}
          >
            <div className="text-center flex-1">
              <p className="text-xl font-800 text-white">2,400+</p>
              <p className="text-[10px] font-600 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Sessions
              </p>
            </div>
            <div
              className="w-px h-10 self-center"
              style={{ background: "var(--glass-border)" }}
            />
            <div className="text-center flex-1">
              <p className="text-xl font-800 text-white">₹1.2Cr+</p>
              <p className="text-[10px] font-600 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Paid Out
              </p>
            </div>
            <div
              className="w-px h-10 self-center"
              style={{ background: "var(--glass-border)" }}
            />
            <div className="text-center flex-1">
              <p className="text-xl font-800 text-white">4.9★</p>
              <p className="text-[10px] font-600 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Rating
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
          © 2026 SessionBook · Secure by Razorpay
        </p>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #0f766e)" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-800 text-xl text-white">SessionBook</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
              Sign in to manage your sessions and earnings.
            </p>
          </div>

          {/* Alerts */}
          {registered && (
            <div
              className="mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#10b981",
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Account created! Please sign in.</span>
            </div>
          )}
          {error && (
            <div
              className="mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Card */}
          <div className="glass-card p-7 space-y-5">
            <GoogleSignInButton text="Continue with Google" callbackUrl={callbackUrl} />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "var(--glass-border)" }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className="px-3 text-[11px] font-600 uppercase tracking-wider"
                  style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
                >
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-700 uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-700 uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                  />
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center py-3.5 text-sm mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            No account yet?{" "}
            <Link
              href="/signup"
              className="font-700 transition-colors"
              style={{ color: "#a5b4fc" }}
            >
              Create creator account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
