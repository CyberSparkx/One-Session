import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Video,
  Globe,
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
    <div className="min-h-[100dvh] flex flex-col bg-[#FAFAFA] text-gray-900 relative">
      <AnimatedBackground />

      {/* ── Navbar ── */}
      <header className="relative z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-gray-950 text-base tracking-tight">SessionBook</span>
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Creator Login →
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-12 md:py-20">
        {/* ── Creator Hero ── */}
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          {/* Avatar */}
          <div className="relative inline-block">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center bg-white">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-orange-700 bg-orange-100">
                  {initials}
                </div>
              )}
            </div>
            {/* Verified badge */}
            <div
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center border-2 border-white bg-emerald-600 text-white shadow-xs"
              title="Verified Creator"
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Name & timezone */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              {user.name}
            </h1>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-gray-500 font-medium">
              <Globe className="w-3.5 h-3.5 text-orange-600" />
              <span>{user.timezone}</span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-lg">
              {profile.bio}
            </p>
          )}

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            {[
              { icon: ShieldCheck, label: "Verified Creator", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { icon: Video, label: "1:1 Video Calls", color: "text-orange-700 bg-orange-50 border-orange-200" },
              { icon: CalendarCheck2, label: "Instant Confirmation", color: "text-blue-700 bg-blue-50 border-blue-200" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${color}`}
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
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 inline-block mb-2">
              Bookings
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
              Available Sessions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a session type to view open calendar dates and reserve your slot.
            </p>
          </div>

          {sessionTypes.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-md mx-auto shadow-xs">
              <CalendarCheck2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-bold text-gray-900">No sessions available right now</p>
              <p className="text-xs text-gray-500 mt-1">
                Please check back soon or reach out directly to the creator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessionTypes.map((st) => (
                <div
                  key={st.id}
                  className="bg-white border border-gray-200/90 rounded-2xl p-6 flex flex-col justify-between group hover:border-gray-300 hover:shadow-md transition-all duration-200 shadow-xs"
                >
                  <div className="space-y-4">
                    {/* Duration + price */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{st.durationMinutes} min</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-extrabold text-gray-950">
                          ₹{(st.priceInPaise / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Title + desc */}
                    <div>
                      <h3 className="text-base font-bold text-gray-950 group-hover:text-orange-600 transition-colors leading-snug">
                        {st.title}
                      </h3>
                      {st.description && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">
                          {st.description}
                        </p>
                      )}
                    </div>

                    {/* Format */}
                    <div className="flex items-center gap-2 text-xs pt-3 border-t border-gray-100 text-gray-500">
                      <Video className="w-3.5 h-3.5 text-orange-600" />
                      <span>Online Video Call · Calendar invite sent</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-5 mt-4">
                    <Link
                      href={`/u/${profile.slug}/book/${st.id}`}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs shadow-orange-500/20"
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
      <footer className="relative z-10 border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center text-white">
            <Sparkles className="w-3 h-3" />
          </div>
          <span>Powered by SessionBook · Secure payments via Razorpay</span>
        </div>
      </footer>
    </div>
  );
}
