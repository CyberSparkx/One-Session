"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { isAllowedEmailDomain, ALLOWED_EMAIL_ERROR } from "@/lib/validations";

const BRAND_HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Razorpay-verified secure payouts" },
  { icon: Zap, text: "Live & accepting bookings in under 5 minutes" },
  { icon: TrendingUp, text: "Keep 96% of every session fee" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isAllowedEmailDomain(formData.email)) {
      setError(ALLOWED_EMAIL_ERROR);
      return;
    }

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
    <div className="min-h-[100dvh] flex bg-[#FAFAFA] text-gray-900">
      {/* ── Left: Brand panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative bg-white border-r border-gray-200">
        {/* Subtle top ambient glow */}
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

        {/* Center content */}
        <div className="relative z-10 space-y-8 max-w-md">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 inline-block mb-3">
              Creator Platform
            </span>
            <h2 className="text-3xl font-extrabold text-gray-950 leading-tight tracking-tight">
              Monetize your expertise,{" "}
              <span className="text-orange-600">one session at a time</span>.
            </h2>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Join hundreds of creators, mentors, and consultants earning from their 1:1 time with zero scheduling friction.
            </p>
          </div>

          <div className="space-y-3">
            {BRAND_HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-gray-700">{text}</p>
              </div>
            ))}
          </div>

          {/* Stat strip - Genuine Platform Economics */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="text-center flex-1">
              <p className="text-xl font-extrabold text-gray-950">96%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Creator Share
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center flex-1">
              <p className="text-xl font-extrabold text-gray-950">4%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Platform Fee
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center flex-1">
              <p className="text-xl font-extrabold text-gray-950">₹0</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Monthly Fee
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <p className="text-xs text-gray-400 relative z-10">
          © 2026 SessionBook · Secured by Razorpay
        </p>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-16">
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
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Sign in to manage your sessions, calendar, and payouts.
            </p>
          </div>

          {/* Alerts */}
          {registered && (
            <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Account created successfully! Please sign in.</span>
            </div>
          )}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium bg-red-50 border border-red-200 text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <GoogleSignInButton text="Continue with Google" callbackUrl={callbackUrl} />

            {/* Divider */}
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
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address (Gmail or Yahoo only)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="you@gmail.com or you@yahoo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Only @gmail.com or @yahoo.com addresses are permitted</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-all shadow-xs shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Sign up as a creator
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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
