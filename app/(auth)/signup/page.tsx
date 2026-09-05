"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Sparkles, ArrowRight, Lock, Mail, User, Clock,
  AlertCircle, CheckCircle2, ShieldCheck, Zap, TrendingUp,
} from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const STEPS = [
  { num: "01", text: "Create your account — free, instant" },
  { num: "02", text: "Set session types, rates, and availability" },
  { num: "03", text: "Share your link. Start earning 96% of every session." },
];

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const formatted: Record<string, string> = {};
          for (const key in data.details) {
            formatted[key] = data.details[key][0];
          }
          setErrors(formatted);
        } else {
          setGeneralError(data.error || "Failed to create account");
        }
        setIsLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (signInResult?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--glass-border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="min-h-[100dvh] flex"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Left: Brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0c1222 0%, #050811 100%)",
          borderRight: "1px solid var(--glass-border)",
        }}
      >
        {/* Orbs */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-25 orb-2"
          style={{
            background: "radial-gradient(circle, rgba(15,118,110,0.5) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 orb-1"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
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

        {/* Main pitch */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-800 text-white leading-tight tracking-tight">
              Your expertise deserves to be{" "}
              <span className="gradient-text-teal">paid for</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              In 3 simple steps, you go from signup to your first paid session.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <div className="step-num flex-shrink-0 w-8 h-8 text-xs">{step.num}</div>
                <p className="text-sm pt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* Highlight box */}
          <div
            className="glass-card p-5"
            style={{ borderColor: "rgba(16,185,129,0.25)" }}
          >
            <p className="text-xs font-700 uppercase tracking-wider mb-3" style={{ color: "#10b981" }}>
              Creator-first economics
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-800 text-white">96%</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>of every session fee goes to you</span>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              We only take 4% — and only when you earn.
            </p>
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
          © 2026 SessionBook · No monthly fees, ever.
        </p>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-16 overflow-y-auto">
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
              Create your account
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
              Start hosting paid 1:1 sessions today.
            </p>
          </div>

          {generalError && (
            <div
              className="mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <div className="glass-card p-7 space-y-5">
            <GoogleSignInButton text="Sign up with Google" callbackUrl="/dashboard" />

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
              {/* Name */}
              <div>
                <label className="block text-xs font-700 uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="Alex Rivers"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                  />
                </div>
                {errors.name && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-700 uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="alex@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                  />
                </div>
                {errors.email && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-700 uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                  />
                </div>
                {errors.password && <p className="text-xs mt-1.5" style={{ color: "#f87171" }}>{errors.password}</p>}
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-700 uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3.5" style={{ color: "var(--text-muted)" }} />
                  <input
                    id="signup-timezone"
                    type="text"
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                  />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Auto-detected. Editable in settings anytime.
                </p>
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-emerald w-full justify-center py-3.5 text-sm mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-700 transition-colors" style={{ color: "#a5b4fc" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
