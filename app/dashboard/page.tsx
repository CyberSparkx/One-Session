import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  CalendarDays,
  IndianRupee,
  Clock,
  ArrowUpRight,
  Sparkles,
  CalendarCheck2,
  AlertCircle,
  Video,
  CheckCircle,
  ExternalLink,
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
            include: {
              sessionType: true,
              payment: true,
            },
            orderBy: { scheduledStart: "desc" },
          },
        },
      },
    },
  });

  if (!user || !user.creatorProfile) {
    return null;
  }

  const profile = user.creatorProfile;
  const bookings = profile.bookings || [];

  // Metrics computation: ONLY confirmed & paid sessions are included
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

  // Earnings in paise: 96% goes to creator for confirmed bookings
  const totalEarningsPaise = confirmedBookings.reduce((sum, b) => {
    if (b.payment && (b.payment.status === "CAPTURED" || b.status === "CONFIRMED")) {
      return sum + (b.payment.creatorPayoutPaise || Math.round(b.sessionType.priceInPaise * 0.96));
    }
    return sum;
  }, 0);

  const pendingPayoutPaise = bookings.reduce((sum, b) => {
    if (
      b.payment &&
      b.payment.status === "CAPTURED" &&
      b.payment.payoutStatus === "NOT_PAID_OUT"
    ) {
      return sum + b.payment.creatorPayoutPaise;
    }
    return sum;
  }, 0);

  const totalEarningsInRupees = (totalEarningsPaise / 100).toLocaleString("en-IN");
  const pendingPayoutInRupees = (pendingPayoutPaise / 100).toLocaleString("en-IN");

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here's what is happening with your 1:1 sessions today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/u/${profile.slug}`}
            target="_blank"
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Public Page</span>
          </Link>
          <Link
            href="/dashboard/session-types"
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <span>Add Session</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">₹{totalEarningsInRupees}</div>
          <p className="text-xs text-slate-400 mt-1">After 4% platform commission</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Payout</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">₹{pendingPayoutInRupees}</div>
          <p className="text-xs text-slate-400 mt-1">Ready for next payout cycle</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{upcomingBookings.length}</div>
          <p className="text-xs text-slate-400 mt-1">Confirmed & scheduled</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Completed</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{pastBookings.length}</div>
          <p className="text-xs text-slate-400 mt-1">Successfully hosted</p>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Upcoming Bookings</h2>
          <span className="text-xs text-slate-400">{upcomingBookings.length} scheduled</span>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
            <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No upcoming sessions scheduled yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Share your public booking link with clients or on social media to get booked!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.map((booking) => {
              const start = new Date(booking.scheduledStart);
              const end = new Date(booking.scheduledEnd);
              return (
                <div
                  key={booking.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
                        {booking.sessionType.title}
                      </span>
                      <h3 className="text-base font-semibold text-white mt-0.5">{booking.clientName}</h3>
                      <p className="text-xs text-slate-400">{booking.clientEmail} • {booking.clientPhone}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ₹{(booking.sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{format(start, "EEE, MMM d, yyyy • h:mm a")} - {format(end, "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-400">
                      <Video className="w-3.5 h-3.5" />
                      <span>Online Call</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/50">
                      "{booking.notes}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
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

      {/* Recent History Table */}
      {pastBookings.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold text-white">Past Sessions</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payout</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-white">{booking.clientName}</td>
                    <td className="py-3 px-4 text-slate-300">{booking.sessionType.title}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {format(new Date(booking.scheduledStart), "MMM d, yyyy • h:mm a")}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-medium">
                      ₹{((booking.payment?.creatorPayoutPaise || booking.sessionType.priceInPaise * 0.96) / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300">
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
