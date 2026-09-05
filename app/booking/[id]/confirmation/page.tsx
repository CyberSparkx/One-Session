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
  ExternalLink,
  User,
  Mail,
  AlertTriangle,
} from "lucide-react";

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
          user: {
            select: { name: true, email: true, timezone: true },
          },
        },
      },
      payment: true,
    },
  });

  if (!booking) {
    notFound();
  }

  const { creator, sessionType, payment } = booking;
  const start = new Date(booking.scheduledStart);
  const end = new Date(booking.scheduledEnd);

  // When landing on confirmation, ensure booking is confirmed and payment captured
  if (booking.status === "PENDING_PAYMENT") {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CONFIRMED" },
      }),
      prisma.payment.updateMany({
        where: { bookingId: id },
        data: { status: "CAPTURED" },
      }),
    ]);
    booking.status = "CONFIRMED";
  }

  const isConfirmed = true;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">SessionBook</span>
          </Link>
          <div className="text-xs text-slate-400">
            Booking ID: <span className="font-mono text-slate-200">{booking.id.substring(0, 10)}...</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-10 md:py-16 space-y-8">
        {/* Status Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isConfirmed ? "Booking Confirmed!" : "Payment Processing"}
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            A confirmation email and calendar invitation have been sent to{" "}
            <span className="text-slate-200 font-medium">{booking.clientEmail}</span>.
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                1:1 Session with
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{creator.user.name}</h2>
              <p className="text-xs text-slate-400">{sessionType.title}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Amount Paid</span>
              <span className="text-lg font-bold text-emerald-400">
                ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Scheduled Date</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {format(start, "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Time & Duration</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {format(start, "h:mm a")} - {format(end, "h:mm a")} ({sessionType.durationMinutes}m)
              </p>
            </div>
          </div>

          {/* Online Meeting Details */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Web Conferencing</p>
                <p className="text-[11px] text-slate-400">
                  Google Meet / conferencing link will activate at session time.
                </p>
              </div>
            </div>
            <a
              href={`/api/bookings/${booking.id}/ics`}
              download={`${sessionType.title.replace(/\s+/g, "_")}.ics`}
              className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Add to Calendar</span>
            </a>
          </div>

          {/* Attendee Details */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs">
            <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Attendee Information
            </h3>
            <div className="flex items-center justify-between text-slate-400">
              <span>Name:</span>
              <span className="font-medium text-slate-200">{booking.clientName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Email:</span>
              <span className="font-medium text-slate-200">{booking.clientEmail}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Phone:</span>
              <span className="font-medium text-slate-200">{booking.clientPhone}</span>
            </div>
            {booking.notes && (
              <div className="pt-2">
                <span className="text-slate-500 block">Notes for {creator.user.name}:</span>
                <p className="text-slate-300 italic mt-0.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                  "{booking.notes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reschedule / Cancellation Policy Card */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-start justify-between gap-4">
          <div>
            <span className="font-medium text-slate-300 block mb-1">Need to cancel or reschedule?</span>
            <p className="text-[11px] leading-relaxed">
              You can cancel up to 2 hours before the scheduled time using your private cancellation token.
            </p>
          </div>
          <Link
            href={`/booking/${booking.id}/cancel?token=${booking.cancelToken}`}
            className="text-rose-400 hover:text-rose-300 underline font-medium shrink-0 pt-0.5"
          >
            Cancel Booking
          </Link>
        </div>
      </main>
    </div>
  );
}
