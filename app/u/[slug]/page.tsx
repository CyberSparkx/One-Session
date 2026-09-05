import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Video,
  Globe,
} from "lucide-react";

interface PublicProfileProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicCreatorPage({ params }: PublicProfileProps) {
  const { slug } = await params;

  const profile = await prisma.creatorProfile.findUnique({
    where: { slug: slug.toLowerCase() },
    include: {
      user: {
        select: {
          name: true,
          timezone: true,
        },
      },
      sessionTypes: {
        where: { isActive: true },
        orderBy: { priceInPaise: "asc" },
      },
    },
  });

  if (!profile || !profile.isPublished) {
    notFound();
  }

  const { user, sessionTypes } = profile;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />

      {/* Top Brand Bar */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">SessionBook</span>
          </Link>
          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Are you a creator? Log in
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-12 md:py-16 space-y-12">
        {/* Creator Hero Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="relative inline-block">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-indigo-500/40 shadow-2xl mx-auto"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl mx-auto border-2 border-indigo-500/40">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
            <div className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-950">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {user.name}
              </h1>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-slate-400">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Based in {user.timezone}</span>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Available Session Types Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Book a 1:1 Session</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select a session type below to view open dates and reserve your slot.
            </p>
          </div>

          {sessionTypes.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center max-w-md mx-auto">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No sessions currently available</p>
              <p className="text-xs text-slate-500 mt-1">Please check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessionTypes.map((st) => (
                <div
                  key={st.id}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                        <Clock className="w-4 h-4" />
                        <span>{st.durationMinutes} minutes</span>
                      </div>
                      <div className="text-xl font-bold text-white">
                        ₹{(st.priceInPaise / 100).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {st.title}
                      </h3>
                      {st.description && (
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                          {st.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                      <Video className="w-3.5 h-3.5 text-slate-500" />
                      <span>Online Video Call & Calendar Invite (.ics)</span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4">
                    <Link
                      href={`/u/${profile.slug}/book/${st.id}`}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all group-hover:shadow-indigo-500/35"
                    >
                      <span>Choose Slot</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Powered by SessionBook • Direct 1:1 Sessions with verified experts</p>
      </footer>
    </div>
  );
}
