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
  Video,
  CheckCircle2,
  ExternalLink,
  Plus,
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

  const pendingPayoutPaise = confirmedBookings.reduce((sum, b) => {
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
      sub: "After 4% platform fee",
      icon: IndianRupee,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      label: "Pending Payout",
      value: `₹${pendingPayoutInRupees}`,
      sub: "Auto-processed weekly",
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      label: "Upcoming Sessions",
      value: String(upcomingBookings.length),
      sub: "Confirmed on calendar",
      icon: CalendarCheck2,
      iconBg: "bg-orange-50 text-orange-600 border-orange-200",
    },
    {
      label: "Total Hosted",
      value: String(pastBookings.length),
      sub: "Successfully completed",
      icon: CheckCircle2,
      iconBg: "bg-blue-50 text-blue-600 border-blue-200",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your bookings, earnings, and upcoming scheduled sessions.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link
            href={`/u/${profile.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public Page
          </Link>
          <Link
            href="/dashboard/session-types"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            New Session Type
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs transition-all hover:border-gray-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {metric.label}
                </p>
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center ${metric.iconBg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-none mb-1.5">
                {metric.value}
              </p>
              <p className="text-xs text-gray-400 font-medium">{metric.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Upcoming Bookings ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Upcoming Bookings</h2>
            <p className="text-xs text-gray-500">
              {upcomingBookings.length} session{upcomingBookings.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
          {upcomingBookings.length > 0 && (
            <Link
              href="/dashboard/calendar"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
            >
              Calendar view
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          /* Empty state */
          <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">No upcoming sessions yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Share your personal booking link with clients, in your bio, or via social channels to get booked.
              </p>
            </div>
            <Link
              href={`/u/${profile.slug}`}
              target="_blank"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Your Booking Page
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.map((booking) => {
              const start = new Date(booking.scheduledStart);
              const end = new Date(booking.scheduledEnd);
              return (
                <div
                  key={booking.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 hover:border-gray-300 transition-all shadow-xs"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                        {booking.sessionType.title}
                      </span>
                      <h3 className="text-base font-bold text-gray-950 mt-2 truncate">
                        {booking.clientName}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {booking.clientEmail}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                      ₹{(booking.sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Time row */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{format(start, "EEE, MMM d • h:mm a")} – {format(end, "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700 font-medium">
                      <Video className="w-3.5 h-3.5 text-orange-600" />
                      <span>1:1 Call</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <p className="text-xs italic bg-gray-50 border border-gray-100 text-gray-600 p-2.5 rounded-xl">
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
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Past Sessions</h2>
            <span className="text-xs font-medium text-gray-500">
              {pastBookings.length} total
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/75">
                    {["Client", "Session", "Date", "Payout", "Status"].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pastBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-900 text-sm">
                        {booking.clientName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {booking.sessionType.title}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {format(new Date(booking.scheduledStart), "MMM d, yyyy · h:mm a")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-sm text-emerald-600">
                        ₹{((booking.payment?.creatorPayoutPaise || booking.sessionType.priceInPaise * 0.96) / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            booking.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
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
