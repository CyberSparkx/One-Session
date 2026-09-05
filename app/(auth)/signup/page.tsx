"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const STEPS = [
  { num: "01", text: "Create your account — free, takes 60 seconds" },
  { num: "02", text: "Set session types, duration rates, and available hours" },
  { num: "03", text: "Share your booking link and keep 96% of every session fee" },
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

  return (
    <div className="min-h-[100dvh] flex bg-[#FAFAFA] text-gray-900">
      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative bg-white border-r border-gray-200">
        {/* Subtle glow */}
        <div
          className="absolute top-0 left-0 w-full h-80 opacity-40 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 20% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xl text-gray-950 tracking-tight">SessionBook</span>
        </Link>

        {/* Main pitch */}
        <div className="relative z-10 space-y-8 max-w-md">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 inline-block mb-3">
              Get Started
            </span>
            <h2 className="text-3xl font-extrabold text-gray-950 leading-tight tracking-tight">
              Your expertise deserves to be{" "}
              <span className="text-orange-600">fairly rewarded</span>.
            </h2>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              In 3 simple steps, you go from signup to your personal booking page and first client booking.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.num}
                </div>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* Highlight box */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">
              Creator-First Model
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-950">96%</span>
              <span className="text-xs text-gray-500">of every session fee goes to you</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              We retain a simple 4% platform fee — and only when you get booked. No subscription fees.
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 relative z-10">
          © 2026 SessionBook · No monthly subscription fees
        </p>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg text-gray-950">SessionBook</span>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              Create your creator account
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Start hosting and monetizing paid 1:1 sessions today.
            </p>
          </div>

          {generalError && (
            <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium bg-red-50 border border-red-200 text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <GoogleSignInButton text="Sign up with Google" callbackUrl="/dashboard" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-[11px] font-semibold uppercase tracking-wider bg-white text-gray-400">
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="Alex Rivers"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    placeholder="alex@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    id="signup-timezone"
                    type="text"
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Auto-detected. Can be updated anytime in Settings.
                </p>
              </div>

              <button
                id="signup-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
