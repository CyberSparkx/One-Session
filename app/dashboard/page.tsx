import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  CalendarDays,
  IndianRupee,
  Clock,
  ArrowUpRight,
  CalendarCheck2,
  AlertCircle,
  Video,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import CancelSessionButton from "@/components/CancelSessionButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  const user = await prisma.user.findUnique({
    where: { email: email! },
    include: {
      creatorProfile: {
        include: {
          sessionTypes: true,
          bookings: {
            include: { sessionType: true, payment: true },
            orderBy: { scheduledStart: "desc" },
          },
        },
      },
    },
  });

  if (!user || !user.creatorProfile) return null;

  const profile = user.creatorProfile;
  const bookings = profile.bookings || [];
  const now = new Date();

  const confirmedBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
  );
  const upcomingBookings = confirmedBookings.filter(
    (b) => new Date(b.scheduledEnd) >= now
  );
  const pastBookings = confirmedBookings.filter(
    (b) => new Date(b.scheduledEnd) < now
  );

  const totalEarningsPaise = confirmedBookings.reduce((sum, b) => {
    if (b.payment && (b.payment.status === "CAPTURED" || b.status === "CONFIRMED")) {
      return sum + (b.payment.creatorPayoutPaise || Math.round(b.sessionType.priceInPaise * 0.96));
    }
    return sum;
  }, 0);

  const pendingPayoutPaise = bookings.reduce((sum, b) => {
    if (b.payment && b.payment.status === "CAPTURED" && b.payment.payoutStatus === "NOT_PAID_OUT") {
      return sum + b.payment.creatorPayoutPaise;
    }
    return sum;
  }, 0);

  const totalEarningsInRupees = (totalEarningsPaise / 100).toLocaleString("en-IN");
  const pendingPayoutInRupees = (pendingPayoutPaise / 100).toLocaleString("en-IN");

  const METRICS = [
    {
      label: "Total Net Earnings",
      value: `₹${totalEarningsInRupees}`,
      sub: "After 4% platform commission",
      icon: IndianRupee,
      color: "#10b981",
      colorDim: "rgba(16,185,129,0.12)",
      glow: "0 0 30px rgba(16,185,129,0.1)",
    },
    {
      label: "Pending Payout",
      value: `₹${pendingPayoutInRupees}`,
      sub: "Ready for next payout cycle",
      icon: Clock,
      color: "#f59e0b",
      colorDim: "rgba(245,158,11,0.12)",
      glow: "0 0 30px rgba(245,158,11,0.08)",
    },
    {
      label: "Upcoming Sessions",
      value: String(upcomingBookings.length),
      sub: "Confirmed & scheduled",
      icon: CalendarCheck2,
      color: "#6366f1",
      colorDim: "rgba(99,102,241,0.12)",
      glow: "0 0 30px rgba(99,102,241,0.12)",
    },
    {
      label: "Total Completed",
      value: String(pastBookings.length),
      sub: "Successfully hosted",
      icon: CheckCircle,
      color: "#0f766e",
      colorDim: "rgba(15,118,110,0.12)",
      glow: "0 0 30px rgba(15,118,110,0.1)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div>
          <p className="badge mb-2 w-fit">Creator Dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Here's what's happening with your 1:1 sessions.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={`/u/${profile.slug}`}
            target="_blank"
            className="btn-primary btn-ghost text-sm py-2 px-4 gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            Public Page
          </Link>
          <Link
            href="/dashboard/session-types"
            className="btn-primary text-sm py-2 px-4 gap-1.5"
          >
            <Zap className="w-4 h-4" />
            Add Session
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="glass-card p-5 relative overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Corner glow */}
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-50"
                style={{
                  background: `radial-gradient(circle, ${metric.color}20 0%, transparent 70%)`,
                  filter: "blur(10px)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <p
                    className="text-[10px] font-700 uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {metric.label}
                  </p>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: metric.colorDim,
                      border: `1px solid ${metric.color}25`,
                      color: metric.color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-800 text-white leading-none mb-1">
                  {metric.value}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {metric.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Upcoming Bookings ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-700 text-white">Upcoming Bookings</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {upcomingBookings.length} session{upcomingBookings.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
          {upcomingBookings.length > 0 && (
            <Link
              href="/dashboard/calendar"
              className="text-xs font-600 flex items-center gap-1 transition-colors"
              style={{ color: "#a5b4fc" }}
            >
              Calendar view
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          /* Empty state */
          <div
            className="glass-card p-10 flex flex-col items-center text-center gap-4"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <CalendarDays className="w-7 h-7" style={{ color: "#6366f1" }} />
            </div>
            <div>
              <p className="font-700 text-white text-base">No upcoming sessions</p>
              <p className="text-sm mt-1 max-w-xs" style={{ color: "var(--text-muted)" }}>
                Share your booking link with clients or on social media to get booked.
              </p>
            </div>
            <Link href={`/u/${profile.slug}`} target="_blank" className="btn-primary text-sm py-2.5 px-5">
              <ExternalLink className="w-4 h-4" />
              View Public Page
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.map((booking, i) => {
              const start = new Date(booking.scheduledStart);
              const end = new Date(booking.scheduledEnd);
              return (
                <div
                  key={booking.id}
                  className="glass-card p-5 space-y-4 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[10px] font-700 uppercase tracking-wider"
                        style={{ color: "#a5b4fc" }}
                      >
                        {booking.sessionType.title}
                      </span>
                      <h3 className="text-base font-700 text-white mt-0.5 truncate">
                        {booking.clientName}
                      </h3>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {booking.clientEmail}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-xl text-xs font-700 flex-shrink-0"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#10b981",
                        border: "1px solid rgba(16,185,129,0.25)",
                      }}
                    >
                      ₹{(booking.sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Time row */}
                  <div
                    className="flex items-center justify-between text-xs pt-3 border-t"
                    style={{ borderColor: "var(--glass-border)" }}
                  >
                    <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                      <span>{format(start, "EEE, MMM d • h:mm a")} – {format(end, "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: "#a5b4fc" }}>
                      <Video className="w-3.5 h-3.5" />
                      <span className="font-600">Online</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <p
                      className="text-xs italic leading-relaxed p-3 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--glass-border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      "{booking.notes}"
                    </p>
                  )}

                  {/* Cancel */}
                  <div className="flex justify-end pt-1">
                    <CancelSessionButton
                      bookingId={booking.id}
                      clientName={booking.clientName}
                      sessionTitle={booking.sessionType.title}
                      variant="button"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Past Sessions Table ── */}
      {pastBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-700 text-white">Past Sessions</h2>
            <span className="text-xs font-600" style={{ color: "var(--text-muted)" }}>
              {pastBookings.length} total
            </span>
          </div>

          <div
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div
              className="overflow-x-auto"
              style={{ background: "var(--glass-bg)" }}
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "var(--glass-border)",
                    }}
                  >
                    {["Client", "Session", "Date", "Payout", "Status"].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-[10px] font-700 uppercase tracking-widest"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pastBookings.map((booking, i) => (
                    <tr
                      key={booking.id}
                      className="border-b transition-colors"
                      style={{
                        borderColor: "var(--glass-border)",
                        background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      }}
                    >
                      <td className="py-3.5 px-4 font-700 text-white text-sm">
                        {booking.clientName}
                      </td>
                      <td className="py-3.5 px-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {booking.sessionType.title}
                      </td>
                      <td className="py-3.5 px-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        {format(new Date(booking.scheduledStart), "MMM d, yyyy · h:mm a")}
                      </td>
                      <td className="py-3.5 px-4 font-700 text-sm" style={{ color: "#10b981" }}>
                        ₹{((booking.payment?.creatorPayoutPaise || booking.sessionType.priceInPaise * 0.96) / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex px-2.5 py-1 rounded-lg text-[11px] font-700"
                          style={
                            booking.status === "COMPLETED"
                              ? { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }
                              : { background: "rgba(255,255,255,0.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }
                          }
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
