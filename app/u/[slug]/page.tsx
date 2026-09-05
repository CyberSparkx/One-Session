import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Video,
  Globe,
  Star,
  Users,
  CalendarCheck2,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

interface PublicProfileProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicCreatorPage({ params }: PublicProfileProps) {
  const { slug } = await params;

  const profile = await prisma.creatorProfile.findUnique({
    where: { slug: slug.toLowerCase() },
    include: {
      user: { select: { name: true, timezone: true } },
      sessionTypes: {
        where: { isActive: true },
        orderBy: { priceInPaise: "asc" },
      },
    },
  });

  if (!profile || !profile.isPublished) notFound();

  const { user, sessionTypes } = profile;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <AnimatedBackground />

      {/* ── Navbar ── */}
      <header
        className="relative z-30 border-b sticky top-0"
        style={{
          borderColor: "var(--glass-border)",
          background: "rgba(5,8,17,0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #0f766e 100%)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-800 text-white text-base tracking-tight">SessionBook</span>
          </Link>
          <Link
            href="/login"
            className="text-xs font-600 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Creator Login →
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-12 md:py-20">

        {/* ── Creator Hero ── */}
        <div className="flex flex-col items-center text-center mb-16 gap-5">
          {/* Avatar with gradient ring */}
          <div className="relative inline-block">
            <div
              className="absolute inset-0 rounded-3xl opacity-60"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(15,118,110,0.4))",
                filter: "blur(12px)",
                transform: "scale(1.1)",
              }}
            />
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-2 overflow-hidden flex items-center justify-center"
              style={{ borderColor: "rgba(99,102,241,0.4)" }}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-800 text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #0f766e 100%)" }}
                >
                  {initials}
                </div>
              )}
            </div>
            {/* Verified badge */}
            <div
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center border-2"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                borderColor: "var(--bg-base)",
              }}
            >
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Name & timezone */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
              {user.name}
            </h1>
            <div
              className="flex items-center justify-center gap-1.5 mt-1.5 text-xs font-500"
              style={{ color: "var(--text-muted)" }}
            >
              <Globe className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
              <span>{user.timezone}</span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p
              className="text-sm sm:text-base leading-relaxed max-w-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              {profile.bio}
            </p>
          )}

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            {[
              { icon: ShieldCheck, label: "Verified Creator", color: "#10b981" },
              { icon: Video, label: "Online Sessions", color: "#6366f1" },
              { icon: CalendarCheck2, label: "Instant Booking", color: "#f59e0b" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs font-600 px-3 py-1.5 rounded-full"
                style={{
                  background: `${color}12`,
                  border: `1px solid ${color}25`,
                  color: color,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Session Types ── */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="badge mx-auto w-fit mb-3">Available Sessions</p>
            <h2 className="text-xl sm:text-2xl font-800 text-white tracking-tight">
              Book a 1:1 Session
            </h2>
            <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
              Select a session type and choose your preferred time slot.
            </p>
          </div>

          {sessionTypes.length === 0 ? (
            <div className="glass-card p-10 text-center max-w-md mx-auto">
              <CalendarCheck2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="font-700 text-white">No sessions available yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessionTypes.map((st, i) => (
                <div
                  key={st.id}
                  className="glass-card p-6 flex flex-col justify-between group animate-fade-up relative overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)",
                    }}
                  />

                  <div className="relative z-10 space-y-4">
                    {/* Duration + price */}
                    <div className="flex items-start justify-between">
                      <div
                        className="flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(99,102,241,0.1)",
                          border: "1px solid rgba(99,102,241,0.2)",
                          color: "#a5b4fc",
                        }}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{st.durationMinutes} min</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-800 text-white">
                          ₹{(st.priceInPaise / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Title + desc */}
                    <div>
                      <h3 className="text-base font-700 text-white group-hover:text-indigo-300 transition-colors leading-tight">
                        {st.title}
                      </h3>
                      {st.description && (
                        <p
                          className="text-xs mt-2 leading-relaxed line-clamp-3"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {st.description}
                        </p>
                      )}
                    </div>

                    {/* Format */}
                    <div
                      className="flex items-center gap-2 text-xs pt-3 border-t"
                      style={{ borderColor: "var(--glass-border)", color: "var(--text-muted)" }}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Online Video · Calendar .ics invite</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="relative z-10 pt-5 mt-4">
                    <Link
                      href={`/u/${profile.slug}/book/${st.id}`}
                      className="btn-primary btn-emerald w-full justify-center text-sm py-3"
                    >
                      <span>Choose a Slot</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 border-t py-6 text-center text-xs"
        style={{
          borderColor: "var(--glass-border)",
          color: "var(--text-muted)",
          background: "rgba(5,8,17,0.5)",
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #0f766e)" }}
          >
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span>Powered by SessionBook · Secure payments via Razorpay</span>
        </div>
      </footer>
    </div>
  );
}
