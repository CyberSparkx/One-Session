import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  CreditCard,
  Video,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Globe,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Background radial highlights */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />

      {/* Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">SessionBook</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="py-2 px-4 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-indigo-600/30 transition-all"
            >
              Start Hosting Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Monetize your 1:1 time with zero hassle</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            The easiest way to book paid{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              1-on-1 consultations
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create your custom booking link, set your rates and availability, and get paid directly. We handle scheduling, calendar invites, and payments. You keep 96%.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all group cursor-pointer"
            >
              <span>Create Your Booking Link</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-all"
            >
              Creator Login
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Razorpay Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Slot Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Transparent 4% Commission</span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-900">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Everything you need to run your consultation business
            </h2>
            <p className="text-sm text-slate-400">
              Built for mentors, developers, startup founders, advisors, and creators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Smart Availability Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Define recurring hours, date overrides, and buffer times between meetings. No double bookings, ever.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Instant Razorpay Checkout</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clients pay upfront in INR via UPI, Cards, Netbanking, or Wallets. Money is held securely with instant confirmation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Automated Calendar & .ICS</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic confirmation emails with downloadable .ics calendar invites for Google Calendar, Apple, and Outlook.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing / Distribution Model Explainer */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/20 shadow-2xl space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              No monthly subscriptions or hidden charges. The platform takes a flat 4% commission only when you earn. You keep 96%.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto text-left">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-500 block uppercase tracking-wider">Platform Fee</span>
                <span className="text-2xl font-bold text-indigo-400 mt-1 block">4%</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Per successful booking</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-500 block uppercase tracking-wider">Creator Payout</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">96%</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Direct to UPI / Bank</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition-colors"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 SessionBook. Built for creators and mentors.</p>
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <Link href="/login" className="hover:text-white">Sign In</Link>
          <span>•</span>
          <Link href="/signup" className="hover:text-white">Sign Up</Link>
          <span>•</span>
          <Link href="/admin" className="hover:text-white">Admin Portal</Link>
        </div>
      </footer>
    </div>
  );
}
