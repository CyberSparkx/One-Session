import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Download,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  AlertTriangle,
  CalendarCheck2,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export const dynamic = "force-dynamic";

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      sessionType: true,
      creator: {
        include: {
          user: { select: { name: true, email: true, timezone: true } },
        },
      },
      payment: true,
    },
  });

  if (!booking) notFound();

  const { creator, sessionType, payment } = booking;
  const start = new Date(booking.scheduledStart);
  const end = new Date(booking.scheduledEnd);
  const isConfirmed = booking.status === "CONFIRMED";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FAFAFA] text-gray-900 relative">
      <AnimatedBackground />

      {/* ── Header ── */}
      <header className="relative z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-gray-950 tracking-tight">SessionBook</span>
          </Link>
          <span className="text-xs font-mono text-gray-400">
            ID: {booking.id.substring(0, 8)}…
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-12 md:py-16 space-y-6">

        {/* ── Status Hero ── */}
        <div className="text-center space-y-3">
          {isConfirmed ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                  Booking Confirmed!
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  A confirmation email and calendar invite have been dispatched to{" "}
                  <span className="font-semibold text-gray-900">
                    {booking.clientEmail}
                  </span>
                </p>
              </div>

              {/* Checklist */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {[
                  { icon: Mail, text: "Confirmation email sent" },
                  { icon: CalendarCheck2, text: "Calendar .ics available" },
                  { icon: ShieldCheck, text: "Payment verified" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                  Payment Verification Pending
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  We haven't received confirmation from the payment gateway yet. If you completed payment, please reload this page.
                </p>
              </div>
              <Link
                href={`/u/${creator.slug}/book/${sessionType.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-xs"
              >
                <span>Retry Payment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* ── Details Card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Session + price header */}
          <div className="flex items-start justify-between gap-3 pb-5 border-b border-gray-100">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-1">
                1:1 Session with
              </p>
              <h2 className="text-xl font-extrabold text-gray-950">{creator.user.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {sessionType.title}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400 font-medium">Amount Paid</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Date</span>
              </div>
              <p className="text-sm font-bold text-gray-950">{format(start, "EEEE, MMMM d, yyyy")}</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>Time & Duration</span>
              </div>
              <p className="text-sm font-bold text-gray-950">
                {format(start, "h:mm a")} – {format(end, "h:mm a")} ({sessionType.durationMinutes}m)
              </p>
            </div>
          </div>

          {/* Video / calendar */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-orange-50/60 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 flex-shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-950">Online Video Call</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isConfirmed
                    ? "Link and access details attached to calendar invite"
                    : "Video link generated after payment confirmation"}
                </p>
              </div>
            </div>
            {isConfirmed && (
              <a
                href={`/api/bookings/${booking.id}/ics`}
                download={`${sessionType.title.replace(/\s+/g, "_")}.ics`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 text-xs font-semibold shadow-xs flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-orange-600" />
                <span>.ics</span>
              </a>
            )}
          </div>

          {/* Attendee */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Attendee Information
            </p>
            {[
              { label: "Name", value: booking.clientName },
              { label: "Email", value: booking.clientEmail },
              { label: "Phone", value: booking.clientPhone },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
            {booking.notes && (
              <div className="p-3 rounded-xl mt-2 text-xs italic bg-gray-50 border border-gray-100 text-gray-600">
                "{booking.notes}"
              </div>
            )}
          </div>
        </div>

        {/* ── Cancel link ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 text-xs shadow-xs">
          <div>
            <p className="font-bold text-gray-900">Need to cancel or reschedule?</p>
            <p className="text-gray-500 mt-0.5">
              Cancellations permitted up to 2 hours before the scheduled call start.
            </p>
          </div>
          <Link
            href={`/booking/${booking.id}/cancel?token=${booking.cancelToken}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex-shrink-0"
          >
            Cancel Booking
          </Link>
        </div>
      </main>
    </div>
  );
}
