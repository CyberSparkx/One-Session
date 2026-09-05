import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  IndianRupee,
  ShieldCheck,
  Clock,
  Star,
  Zap,
  Video,
  Copy,
  TrendingUp,
  CheckCircle2,
  Users,
  ChevronRight,
} from "lucide-react";

/* ── Marquee items ─────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  "Code Review", "Architecture Consulting", "Product Strategy", "UX Critique",
  "Career Coaching", "Startup Mentorship", "Interview Prep", "Design Feedback",
  "Growth Strategy", "Financial Planning", "Legal Advice", "Sales Coaching",
  "Content Strategy", "AI/ML Consulting", "SEO Audit", "Brand Strategy",
];

/* ── Testimonials ──────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "Priya Kapoor",
    role: "UX Designer",
    avatar: "PK",
    text: "I made ₹40,000 in my first month just from 1:1 design reviews. The booking flow is so clean that clients never drop off.",
    sessions: 38,
  },
  {
    name: "Arjun Mehta",
    role: "Senior Engineer",
    avatar: "AM",
    text: "I charge ₹2,500/hr for code reviews. SessionBook handles everything — booking, payment, reminders. I just show up.",
    sessions: 112,
  },
  {
    name: "Shreya Nair",
    role: "Product Manager",
    avatar: "SN",
    text: "My public booking page looks so professional that clients often assume I have a whole team behind it. It's just me.",
    sessions: 67,
  },
];

/* ── Features ──────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Zap,
    title: "Live in under 10 minutes",
    desc: "Create your account, set your session types, share your link. That's it. No developers required.",
    color: "#F97316",
    bg: "#FFF7ED",
  },
  {
    icon: ShieldCheck,
    title: "Payments via Razorpay",
    desc: "Every rupee is safe. We verify every transaction before your slot is confirmed. No fraud, no chargebacks.",
    color: "#16A34A",
    bg: "#DCFCE7",
  },
  {
    icon: CalendarCheck2,
    title: "Smart availability engine",
    desc: "Set your working hours once. Clients only see slots that actually exist — no double bookings, ever.",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    icon: Video,
    title: "Auto calendar invites",
    desc: "Every confirmed booking sends an .ics invite and Google Meet details to both parties automatically.",
    color: "#0891B2",
    bg: "#CFFAFE",
  },
];

const STEPS = [
  { num: "01", title: "Create your account", desc: "Sign up free in 30 seconds. No card, no commitment." },
  { num: "02", title: "Add session types", desc: "Define what you offer, how long, and what you charge." },
  { num: "03", title: "Share your page", desc: "Share /u/yourname anywhere — Twitter, Instagram, LinkedIn." },
  { num: "04", title: "Get paid", desc: "Clients book and pay instantly. You keep 96% every time." },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border-base)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-800 text-lg text-gray-900">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-900"
              style={{ background: "var(--orange)" }}
            >
              S
            </div>
            <span>SessionBook</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {["Features", "How it works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-sm hidden sm:flex">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary text-sm">
              Get started free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-0 md:pt-24 md:pb-0">
        {/* Dot grid */}
        <div
          className="dot-grid absolute inset-0 opacity-60"
          style={{
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 40%, transparent 100%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4">
          {/* Top badge */}
          <div className="flex justify-center mb-8">
            <div className="badge animate-fade-up">
              🇮🇳 Built for Indian Creators
            </div>
          </div>

          {/* Editorial headline */}
          <div className="text-center max-w-4xl mx-auto animate-fade-up delay-75">
            <h1
              className="font-900 tracking-tight leading-none"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", color: "var(--text-primary)" }}
            >
              Turn your expertise
              <br />
              <span style={{ color: "var(--orange)" }}>into income.</span>
            </h1>
            <p
              className="mt-5 font-400 max-w-xl mx-auto text-lg"
              style={{ color: "var(--text-muted)" }}
            >
              List your 1:1 sessions. Set your price. Share one link.
              Clients book and pay instantly — you keep{" "}
              <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>96%</strong>.
            </p>
          </div>

          {/* URL claim input */}
          <div className="flex justify-center mt-10 animate-fade-up delay-150">
            <div
              className="flex items-center gap-0 rounded-xl overflow-hidden shadow-lg border w-full max-w-lg"
              style={{ borderColor: "var(--border-base)" }}
            >
              <div
                className="px-4 py-3.5 text-sm font-500 border-r flex-shrink-0"
                style={{
                  background: "var(--bg-muted)",
                  color: "var(--text-muted)",
                  borderColor: "var(--border-base)",
                  fontFamily: "monospace",
                }}
              >
                sessionbook.in/u/
              </div>
              <input
                type="text"
                placeholder="yourname"
                className="flex-1 px-4 py-3.5 text-sm font-500 outline-none"
                style={{
                  background: "var(--bg-page)",
                  color: "var(--text-primary)",
                  fontFamily: "monospace",
                }}
              />
              <Link
                href="/signup"
                className="flex-shrink-0 px-5 py-3.5 font-600 text-sm text-white transition-all"
                style={{ background: "var(--orange)" }}
              >
                Claim →
              </Link>
            </div>
          </div>

          <p className="text-center mt-3 text-xs animate-fade-up delay-200" style={{ color: "var(--text-muted)" }}>
            Free to start · No card needed · Live in minutes
          </p>

          {/* Product preview */}
          <div className="relative mt-16 flex justify-center animate-fade-up delay-300">
            <div
              className="w-full max-w-4xl rounded-t-2xl border border-b-0 overflow-hidden shadow-xl"
              style={{ borderColor: "var(--border-base)" }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ background: "var(--bg-muted)", borderColor: "var(--border-base)" }}
              >
                <div className="flex gap-1.5">
                  {["#FC5753", "#FEBC2E", "#27C840"].map((c) => (
                    <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div
                  className="flex-1 mx-4 px-3 py-1 rounded-md text-xs font-mono"
                  style={{ background: "var(--bg-page)", color: "var(--text-muted)", border: "1px solid var(--border-base)" }}
                >
                  sessionbook.in/u/alex
                </div>
              </div>

              {/* Fake dashboard preview */}
              <div
                className="p-6 grid grid-cols-3 gap-4"
                style={{ background: "var(--bg-subtle)" }}
              >
                {/* Sidebar preview */}
                <div
                  className="card p-4 space-y-3"
                  style={{ background: "var(--bg-page)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-800"
                      style={{ background: "var(--orange)" }}>A</div>
                    <div>
                      <div className="text-xs font-700" style={{ color: "var(--text-primary)" }}>Alex Rivers</div>
                      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>@alex</div>
                    </div>
                  </div>
                  {["Home", "Bookings", "Sessions", "Calendar", "Payouts"].map((item, i) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-500"
                      style={i === 0 ? {
                        background: "var(--orange-light)",
                        color: "var(--orange-text)",
                        borderLeft: "2px solid var(--orange)",
                      } : { color: "var(--text-muted)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? "var(--orange)" : "var(--border-strong)" }} />
                      {item}
                    </div>
                  ))}
                </div>

                {/* Main content preview */}
                <div className="col-span-2 space-y-3">
                  <div className="text-sm font-800" style={{ color: "var(--text-primary)" }}>
                    Hi, Alex 👋
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Sessions", val: "14" },
                      { label: "Upcoming", val: "3" },
                      { label: "Earnings", val: "₹8.4k" },
                    ].map((m) => (
                      <div key={m.label} className="card p-3">
                        <div className="text-lg font-800" style={{ color: "var(--text-primary)" }}>{m.val}</div>
                        <div className="text-[10px] font-500" style={{ color: "var(--text-muted)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="card p-4">
                    <div className="text-xs font-700 mb-2.5" style={{ color: "var(--text-primary)" }}>Recent Bookings</div>
                    {[
                      { name: "Priya Kapoor", session: "1:1 Consultation", price: "₹1,500" },
                      { name: "Raj Patel", session: "Code Review", price: "₹2,500" },
                    ].map((b) => (
                      <div key={b.name} className="flex items-center justify-between py-1.5 border-t text-xs"
                        style={{ borderColor: "var(--border-base)" }}>
                        <span className="font-600" style={{ color: "var(--text-primary)" }}>{b.name}</span>
                        <span style={{ color: "var(--text-muted)" }}>{b.session}</span>
                        <span className="font-700" style={{ color: "var(--green)" }}>{b.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────────────────────── */}
      <section
        className="py-5 border-y overflow-hidden"
        style={{ borderColor: "var(--border-base)", background: "var(--bg-subtle)" }}
      >
        <div className="marquee-container">
          <div className="marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-3 px-6 text-sm font-500 whitespace-nowrap"
                style={{ color: "var(--text-muted)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "var(--orange)" }}
                />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="py-16 border-b" style={{ borderColor: "var(--border-base)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px border rounded-2xl overflow-hidden"
            style={{ borderColor: "var(--border-base)", background: "var(--border-base)" }}>
            {[
              { value: "₹1.2Cr+", label: "Paid out to creators", sub: "Across all sessions" },
              { value: "2,400+", label: "Sessions completed", sub: "And counting" },
              { value: "96%", label: "Creator payout rate", sub: "We take just 4%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-8 md:p-10 text-center"
                style={{ background: "var(--bg-page)" }}
              >
                <div
                  className="text-4xl md:text-5xl font-900 tracking-tight mb-1"
                  style={{ color: "var(--orange)" }}
                >
                  {stat.value}
                </div>
                <div className="font-700 text-sm" style={{ color: "var(--text-primary)" }}>
                  {stat.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-20 border-b" style={{ borderColor: "var(--border-base)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="section-label justify-center">What you get</div>
            <h2 className="text-3xl md:text-4xl font-900 tracking-tight">
              Everything a creator needs.<br />
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Nothing they don't.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="card p-7 flex gap-5 animate-fade-up group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: f.bg, color: f.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-700 text-base mb-1.5" style={{ color: "var(--text-primary)" }}>
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-20 border-b"
        style={{ background: "var(--bg-subtle)", borderColor: "var(--border-base)" }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="section-label justify-center">How it works</div>
            <h2 className="text-3xl md:text-4xl font-900 tracking-tight">
              From signup to first booking
              <br />
              <span style={{ color: "var(--orange)" }}>in under 10 minutes.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="card p-6 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div
                  className="text-4xl font-900 tracking-tighter mb-4 leading-none"
                  style={{ color: "var(--orange)", opacity: 0.25 }}
                >
                  {step.num}
                </div>
                <h3 className="font-700 text-sm mb-2" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 border-b" style={{ borderColor: "var(--border-base)" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="section-label justify-center">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-900 tracking-tight mt-2 mb-4">
            One rule. No fine print.
          </h2>
          <p className="text-base mb-10" style={{ color: "var(--text-muted)" }}>
            We take 4% only when you earn. No monthly fees, no setup cost, no hidden charges.
          </p>

          <div className="card p-8 md:p-10 text-left max-w-xl mx-auto">
            {/* Split bar */}
            <div className="mb-8">
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm font-600" style={{ color: "var(--text-muted)" }}>You receive</span>
                <span className="text-5xl font-900 tracking-tighter" style={{ color: "var(--green)" }}>96%</span>
              </div>
              <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: "96%", background: "linear-gradient(90deg, #16A34A, #22C55E)" }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Creator payout</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Platform: <strong style={{ color: "var(--text-secondary)" }}>4%</strong>
                </span>
              </div>
            </div>

            <div className="space-y-3 border-t pt-6" style={{ borderColor: "var(--border-base)" }}>
              {[
                "Zero monthly fees — ever",
                "Instant Razorpay settlements",
                "Unlimited session types",
                "Unlimited bookings",
                "Custom booking page URL",
                "Automated .ics invites",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--green)" }} />
                  {item}
                </div>
              ))}
            </div>

            <Link href="/signup" className="btn btn-primary w-full justify-center mt-8 py-3.5">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────── */}
      <section
        className="py-20 border-b"
        style={{ background: "var(--bg-subtle)", borderColor: "var(--border-base)" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="section-label justify-center">Creator stories</div>
            <h2 className="text-3xl font-900 tracking-tight mt-2">
              Real people. Real earnings.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="card p-7 space-y-5 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-current" style={{ color: "var(--orange)" }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border-base)" }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-800 text-white flex-shrink-0"
                    style={{ background: "var(--orange)" }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-700" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t.role} · {t.sessions} sessions
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-900 tracking-tight mb-4">
            Your expertise has value.
            <br />
            <span style={{ color: "var(--orange)" }}>Start charging for it.</span>
          </h2>
          <p className="text-base mb-8" style={{ color: "var(--text-muted)" }}>
            Join thousands of creators earning from their 1:1 time. Free forever to start.
          </p>
          <Link href="/signup" className="btn btn-primary text-base px-8 py-4 mx-auto">
            Create your booking page
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            No credit card required · Live in 10 minutes
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer
        className="border-t py-10"
        style={{ borderColor: "var(--border-base)", background: "var(--bg-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-700">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-900"
              style={{ background: "var(--orange)" }}
            >
              S
            </div>
            <span style={{ color: "var(--text-primary)" }}>SessionBook</span>
          </div>
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            © 2026 SessionBook. Payments secured by Razorpay. Made in India 🇮🇳
          </p>
          <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <Link href="/login" className="hover:underline">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
