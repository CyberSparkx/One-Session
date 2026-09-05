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
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <AnimatedBackground />

      {/* ── Header ── */}
      <header
        className="relative z-30 border-b"
        style={{
          borderColor: "var(--glass-border)",
          background: "rgba(5,8,17,0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #0f766e)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-800 text-white">SessionBook</span>
          </Link>
          <span
            className="text-xs font-500 font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            Booking · {booking.id.substring(0, 12)}…
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-12 md:py-20 space-y-6">

        {/* ── Status Hero ── */}
        <div className="text-center space-y-4">
          {isConfirmed ? (
            <>
              {/* Animated success ring */}
              <div className="relative inline-flex items-center justify-center mx-auto mb-2">
                <div
                  className="absolute w-24 h-24 rounded-full animate-spin-slow"
                  style={{
                    background: "conic-gradient(from 0deg, rgba(16,185,129,0.4), rgba(16,185,129,0.05), rgba(16,185,129,0.4))",
                    filter: "blur(2px)",
                  }}
                />
                <div
                  className="relative w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
                    border: "1px solid rgba(16,185,129,0.4)",
                    boxShadow: "0 0 40px rgba(16,185,129,0.2)",
                  }}
                >
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
                  Booking Confirmed!
                </h1>
                <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                  Confirmation email and calendar .ics invite sent to{" "}
                  <span className="font-700" style={{ color: "var(--text-secondary)" }}>
                    {booking.clientEmail}
                  </span>
                </p>
              </div>

              {/* Checklist */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {[
                  { icon: Mail, text: "Email sent" },
                  { icon: CalendarCheck2, text: "Calendar .ics ready" },
                  { icon: ShieldCheck, text: "Payment secured" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-1.5 text-xs font-600 px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.2)",
                      color: "#10b981",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {text}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
              >
                <AlertTriangle className="w-9 h-9 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-800 text-white tracking-tight">
                  Payment Pending
                </h1>
                <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                  We haven't received payment confirmation yet. If you completed payment, please refresh.
                </p>
              </div>
              <Link
                href={`/u/${creator.slug}/book/${sessionType.id}`}
                className="btn-primary inline-flex text-sm px-6 py-3"
              >
                Retry Payment
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* ── Details Card ── */}
        <div className="glass-card p-6 sm:p-8 space-y-6">
          {/* Session + price header */}
          <div
            className="flex items-start justify-between gap-3 pb-5 border-b"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div>
              <p className="text-[10px] font-700 uppercase tracking-widest mb-1" style={{ color: "#a5b4fc" }}>
                1:1 Session with
              </p>
              <h2 className="text-xl font-800 text-white">{creator.user.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {sessionType.title}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Amount Paid</p>
              <p className="text-xl font-800 text-emerald-400 mt-0.5">
                ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Calendar,
                label: "Date",
                value: format(start, "EEEE, MMMM d, yyyy"),
                color: "#6366f1",
              },
              {
                icon: Clock,
                label: "Time & Duration",
                value: `${format(start, "h:mm a")} – ${format(end, "h:mm a")} (${sessionType.durationMinutes}m)`,
                color: "#6366f1",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="p-4 rounded-xl space-y-1.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span>{label}</span>
                </div>
                <p className="text-sm font-700 text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Video / calendar */}
          <div
            className="flex items-center justify-between gap-4 p-4 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}
              >
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-700 text-white">Video Conferencing</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {isConfirmed
                    ? "Meet link activates at session time"
                    : "Link generated after payment confirmation"}
                </p>
              </div>
            </div>
            {isConfirmed ? (
              <a
                href={`/api/bookings/${booking.id}/ics`}
                download={`${sessionType.title.replace(/\s+/g, "_")}.ics`}
                className="btn-primary text-xs py-2 px-3 flex-shrink-0"
                style={{ fontSize: "11px" }}
              >
                <Download className="w-3.5 h-3.5" />
                .ics
              </a>
            ) : (
              <span
                className="text-[11px] font-700 px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                Pending
              </span>
            )}
          </div>

          {/* Attendee */}
          <div
            className="pt-4 border-t space-y-2.5"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <p
              className="text-[10px] font-700 uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Attendee
            </p>
            {[
              { label: "Name", value: booking.clientName },
              { label: "Email", value: booking.clientEmail },
              { label: "Phone", value: booking.clientPhone },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span className="font-600 text-white">{value}</span>
              </div>
            ))}
            {booking.notes && (
              <div
                className="p-3 rounded-xl mt-2 text-sm italic"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-muted)",
                }}
              >
                "{booking.notes}"
              </div>
            )}
          </div>
        </div>

        {/* ── Cancel link ── */}
        <div
          className="glass-card p-5 flex items-center justify-between gap-4 text-sm"
        >
          <div>
            <p className="font-600 text-white">Need to cancel or reschedule?</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Cancellations allowed up to 2 hours before session start.
            </p>
          </div>
          <Link
            href={`/booking/${booking.id}/cancel?token=${booking.cancelToken}`}
            className="text-xs font-700 flex-shrink-0 px-4 py-2 rounded-xl transition-all"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
            }}
          >
            Cancel Booking
          </Link>
        </div>
      </main>
    </div>
  );
}
