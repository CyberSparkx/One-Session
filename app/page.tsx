import Link from "next/link";
import {
  Calendar,
  CreditCard,
  Video,
  ShieldCheck,
  Clock,
  TrendingUp,
  ArrowRight,
  Globe,
  Zap,
  BarChart3,
  Lock,
  Mail,
  Users,
  CheckCircle2,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import HeroBookingCard from "@/components/HeroBookingCard";

/* ─── Static data ────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Calendar,
    title: "Smart Availability Engine",
    desc: "Define recurring hours, date overrides, and buffer times. No double bookings, ever. Your calendar stays perfectly in sync.",
    accent: "#6366f1",
    accentDim: "rgba(99,102,241,0.1)",
    size: "large",
  },
  {
    icon: CreditCard,
    title: "Instant Razorpay Checkout",
    desc: "Clients pay via UPI, Cards, Netbanking, or Wallets. Instant confirmation, zero waiting.",
    accent: "#10b981",
    accentDim: "rgba(16,185,129,0.1)",
    size: "small",
  },
  {
    icon: Video,
    title: "Automated .ICS Invites",
    desc: "Google Calendar, Apple, and Outlook sync automatically after every booking.",
    accent: "#0f766e",
    accentDim: "rgba(15,118,110,0.1)",
    size: "small",
  },
  {
    icon: BarChart3,
    title: "Creator Analytics",
    desc: "Track bookings, revenue, and popular session types at a glance.",
    accent: "#f59e0b",
    accentDim: "rgba(245,158,11,0.1)",
    size: "small",
  },
  {
    icon: Globe,
    title: "Your Public Booking Page",
    desc: "Share one link anywhere — social bios, LinkedIn, newsletters — and start getting paid.",
    accent: "#6366f1",
    accentDim: "rgba(99,102,241,0.1)",
    size: "small",
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    desc: "All payments are Razorpay-verified. Webhook signatures checked server-side on every transaction.",
    accent: "#10b981",
    accentDim: "rgba(16,185,129,0.1)",
    size: "small",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create your free account",
    desc: "Sign up in 30 seconds with Google or email. Set your name, bio, and expertise.",
  },
  {
    num: "02",
    title: "List your session types",
    desc: "Set your rates, durations, and availability windows. Define exactly when and how you work.",
  },
  {
    num: "03",
    title: "Share your booking link",
    desc: "One URL — anywhere. Clients browse your slots, pay upfront, and get an instant calendar invite.",
  },
  {
    num: "04",
    title: "Show up & get paid",
    desc: "Show up to the session. 96% of the fee hits your UPI or bank account — zero hidden charges.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "SessionBook changed how I monetize my expertise. I went from chasing clients to having a queue within two weeks.",
    name: "Priya Sharma",
    role: "Startup Advisor",
    avatar: "PS",
    rating: 5,
    earnings: "₹1.4L this month",
  },
  {
    quote:
      "Setup took literally 10 minutes. The automatic calendar invites and Razorpay integration are flawless.",
    name: "Rohan Mehta",
    role: "Full-Stack Developer",
    avatar: "RM",
    rating: 5,
    earnings: "280+ sessions booked",
  },
  {
    quote:
      "I love that the platform only takes 4%. Every other tool I tried took 15-20%. SessionBook respects creators.",
    name: "Divya Nair",
    role: "UX Consultant",
    avatar: "DN",
    rating: 5,
    earnings: "96% payout rate",
  },
];

const STATS = [
  { value: "2,400+", label: "Sessions booked", icon: CalendarCheck },
  { value: "₹1.2 Cr", label: "Paid to creators", icon: TrendingUp },
  { value: "4.9 ★", label: "Average rating", icon: Star },
];

/* ─── Inline components ──────────────────────────────────────────────────────── */

function CalendarCheck({ className }: { className?: string }) {
  return <CheckCircle2 className={className} />;
}

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[0];
  index: number;
}) {
  const Icon = feature.icon;
  const isLarge = feature.size === "large";
  return (
    <div
      className={`glass-card p-6 relative overflow-hidden group animate-fade-up ${
        isLarge ? "md:col-span-2 md:row-span-1" : ""
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Accent glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${feature.accentDim} 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{
            background: feature.accentDim,
            border: `1px solid ${feature.accent}30`,
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: feature.accent }}
          />
        </div>

        <h3
          className={`font-700 text-white mb-2 ${
            isLarge ? "text-xl" : "text-base"
          }`}
        >
          {feature.title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>

        {isLarge && (
          <div className="mt-5 flex items-center gap-2 text-xs font-600" style={{ color: feature.accent }}>
            <span>Learn more</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div
      className="relative min-h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Animated mesh background */}
      <AnimatedBackground />

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <header
        className="relative z-30 border-b"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "rgba(5,8,17,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #6366f1 0%, #0f766e 100%)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-800 text-lg text-white tracking-tight">
              SessionBook
            </span>
          </Link>

          {/* Nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-slate-400 hover:text-white transition-colors duration-150 font-500"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Auth CTAs */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:block py-2 px-4 rounded-xl text-sm font-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
              style={{ background: "transparent" }}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm py-2 px-5"
            >
              Start Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">

        {/* ── Hero — Split Screen ───────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Copy */}
            <div className="space-y-7">
              {/* Badge */}
              <div className="badge animate-fade-up">
                <div className="dot-pulse" />
                <span>Monetize your 1:1 time · Zero hassle</span>
              </div>

              {/* Headline */}
              <h1
                className="text-4xl sm:text-5xl lg:text-[3.5rem] font-800 leading-[1.08] tracking-[-0.025em] animate-fade-up delay-100"
              >
                The smartest way to{" "}
                <span className="gradient-text">book paid sessions</span>{" "}
                with your audience
              </h1>

              {/* Subheading */}
              <p
                className="text-base sm:text-lg leading-relaxed max-w-[52ch] animate-fade-up delay-200"
                style={{ color: "var(--text-secondary)" }}
              >
                Create your booking page, set your rates and availability, and
                start earning in minutes. We handle scheduling, calendar invites,
                and Razorpay payments.{" "}
                <span className="text-emerald-400 font-600">You keep 96%.</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-300">
                <Link href="/signup" className="btn-primary btn-emerald text-sm">
                  Create Your Booking Page
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="btn-primary btn-ghost text-sm">
                  Creator Login
                </Link>
              </div>

              {/* Trust badges */}
              <div
                className="flex flex-wrap gap-5 animate-fade-up delay-400 pt-2"
                style={{ color: "var(--text-muted)" }}
              >
                {[
                  { icon: ShieldCheck, label: "Razorpay Verified", color: "#10b981" },
                  { icon: Clock, label: "Real-Time Slots", color: "#6366f1" },
                  { icon: Zap, label: "Instant Setup", color: "#f59e0b" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs font-600">
                    <Icon className="w-4 h-4" style={{ color }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating booking widget */}
            <div className="relative flex items-center justify-center animate-slide-right delay-200 lg:pl-8">
              <HeroBookingCard />
            </div>
          </div>
        </section>

        {/* ── Stats Strip ──────────────────────────────────────────────────────── */}
        <section
          className="border-y relative z-10"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 py-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 100%)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              {[
                { value: "2,400+", label: "Sessions Booked", icon: CheckCircle2, color: "#6366f1" },
                { value: "₹1.2 Cr+", label: "Paid to Creators", icon: TrendingUp, color: "#10b981" },
                { value: "4.9 / 5.0", label: "Average Rating", icon: Star, color: "#f59e0b" },
              ].map(({ value, label, icon: Icon, color }, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-4 py-6 sm:py-0 sm:px-10 animate-fade-up`}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-800 text-white leading-tight">
                      {value}
                    </p>
                    <p className="text-xs font-500" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          {/* Section label */}
          <div className="mb-14 max-w-xl">
            <p className="badge mb-4">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-800 tracking-tight leading-tight text-white">
              Live and earning in{" "}
              <span className="gradient-text-teal">under 10 minutes</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              No technical setup, no contracts. Just a clean booking page and a Razorpay account.
            </p>
          </div>

          {/* Steps — asymmetric 2-col on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="glass-card p-7 flex gap-5 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="step-num flex-shrink-0">{step.num}</div>
                <div>
                  <h3 className="font-700 text-white text-base mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Grid ────────────────────────────────────────────────────── */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-24"
        >
          <div className="mb-14">
            <p className="badge mb-4">Features</p>
            <h2 className="text-3xl sm:text-4xl font-800 tracking-tight leading-tight text-white max-w-xl">
              Everything to run your{" "}
              <span className="gradient-text">consultation business</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base max-w-lg" style={{ color: "var(--text-muted)" }}>
              Built for mentors, developers, startup founders, advisors, and creators.
            </p>
          </div>

          {/* Asymmetric grid: large card spans 2 cols */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large featured card first */}
            <FeatureCard feature={FEATURES[0]} index={0} />

            {/* Remaining 5 small cards */}
            {FEATURES.slice(1).map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i + 1} />
            ))}
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="py-24 relative"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(99,102,241,0.04) 30%, rgba(16,185,129,0.03) 70%, transparent)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <p className="badge mx-auto mb-4 w-fit">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-800 tracking-tight text-white">
                Simple. Transparent. Creator-first.
              </h2>
              <p className="mt-3 text-sm sm:text-base max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
                No monthly subscriptions, no hidden charges. Only pay when you earn.
              </p>
            </div>

            {/* Pricing card */}
            <div className="gradient-border animate-fade-up">
              <div
                className="glass-card rounded-2xl p-8 sm:p-12"
                style={{ borderColor: "transparent" }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                  {/* Platform fee */}
                  <div
                    className="p-6 rounded-2xl text-center"
                    style={{
                      background: "rgba(99,102,241,0.07)",
                      border: "1px solid rgba(99,102,241,0.15)",
                    }}
                  >
                    <p
                      className="text-xs font-700 uppercase tracking-widest mb-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Platform Commission
                    </p>
                    <p className="text-6xl font-800 text-white leading-none mb-1">
                      4<span className="text-3xl text-slate-400">%</span>
                    </p>
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      Per successful booking only
                    </p>
                    <div
                      className="mt-4 pt-4 flex flex-col gap-1.5 text-xs text-left"
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {["No monthly fee", "No setup charge", "No cancellation fee"].map(
                        (item) => (
                          <div key={item} className="flex items-center gap-2">
                            <CheckCircle2
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color: "#6366f1" }}
                            />
                            {item}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Creator payout */}
                  <div
                    className="p-6 rounded-2xl text-center"
                    style={{
                      background: "rgba(16,185,129,0.07)",
                      border: "1px solid rgba(16,185,129,0.15)",
                    }}
                  >
                    <p
                      className="text-xs font-700 uppercase tracking-widest mb-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Creator Payout
                    </p>
                    <p className="text-6xl font-800 leading-none mb-1 text-emerald-400">
                      96<span className="text-3xl" style={{ color: "#6ee7b7" }}>%</span>
                    </p>
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      Direct to UPI / Bank account
                    </p>
                    <div
                      className="mt-4 pt-4 flex flex-col gap-1.5 text-xs text-left"
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {[
                        "Instant transfer confirmation",
                        "UPI, NEFT, IMPS supported",
                        "₹0 minimum withdrawal",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle2
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: "#10b981" }}
                          />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Example calculation */}
                <div
                  className="mt-8 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <p className="text-xs font-700 uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
                      Example
                    </p>
                    <p className="text-sm text-white font-600">
                      You charge ₹5,000 per session → You receive{" "}
                      <span className="text-emerald-400">₹4,800</span>
                    </p>
                  </div>
                  <Link href="/signup" className="btn-primary btn-emerald text-sm flex-shrink-0">
                    Start Earning
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────────────── */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden">
          <div className="mb-12">
            <p className="badge mb-4">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-800 tracking-tight text-white">
              Loved by creators across India
            </h2>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="glass-card p-6 flex flex-col gap-5 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p
                  className="text-sm leading-relaxed flex-1 italic"
                  style={{ color: "var(--text-secondary)" }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-700 text-white flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${
                        i === 0 ? "#6366f1" : i === 1 ? "#0f766e" : "#f59e0b"
                      }, ${
                        i === 0 ? "#4f46e5" : i === 1 ? "#134e4a" : "#d97706"
                      })`,
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-700 text-white leading-tight">{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t.role}
                    </p>
                  </div>
                  <span
                    className="text-xs font-600 px-2 py-1 rounded-lg flex-shrink-0"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      color: "#10b981",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    {t.earnings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Band ─────────────────────────────────────────────────────────── */}
        <section className="relative py-24 overflow-hidden">
          {/* Band background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(15,118,110,0.08) 50%, rgba(99,102,241,0.06) 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(16,185,129,0.4), transparent)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs font-700 uppercase tracking-widest"
              style={{
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#10b981",
              }}
            >
              <Users className="w-3.5 h-3.5" />
              Join 500+ active creators
            </div>

            <h2 className="text-4xl sm:text-5xl font-800 tracking-tight text-white leading-tight mb-5">
              Ready to get paid for{" "}
              <span className="gradient-text">your expertise?</span>
            </h2>

            <p
              className="text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Create your page for free. No card required. Start accepting bookings
              in the next 10 minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="btn-primary btn-emerald text-base py-4 px-8">
                Create Your Free Page
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-primary btn-ghost text-base py-4 px-8">
                <Mail className="w-5 h-5" />
                Sign In
              </Link>
            </div>

            <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
              No monthly fees · 96% payout · Cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 border-t py-10"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #0f766e)",
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-700 text-white text-sm">SessionBook</span>
            <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
              © 2026
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-xs font-600" style={{ color: "var(--text-muted)" }}>
            <Link href="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <Link href="/signup" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin Portal
            </Link>
          </nav>

          {/* Tagline */}
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Built for creators · Powered by Razorpay
          </p>
        </div>
      </footer>
    </div>
  );
}
