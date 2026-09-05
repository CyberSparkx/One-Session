"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  format,
  addDays,
  isSameDay,
  isToday,
  startOfToday,
} from "date-fns";
import {
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Video,
  User,
  Mail,
  Phone,
  FileText,
  CalendarCheck2,
  CheckCircle2,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

interface Slot {
  startTime: string;
  endTime: string;
  displayTime: string;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string; sessionTypeId: string }>;
}) {
  const resolvedParams = use(params);
  const { slug, sessionTypeId } = resolvedParams;
  const router = useRouter();

  const [creator, setCreator] = useState<any>(null);
  const [sessionType, setSessionType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calendarOffset, setCalendarOffset] = useState(0);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isFormValid =
    Boolean(selectedSlot) &&
    Boolean(formData.clientName.trim()) &&
    Boolean(formData.clientEmail.trim()) &&
    Boolean(formData.clientPhone.trim());

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/public/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setCreator(data);
          const st = data.sessionTypes?.find((s: any) => s.id === sessionTypeId);
          setSessionType(st || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug, sessionTypeId]);

  useEffect(() => {
    async function loadSlots() {
      if (!sessionTypeId) return;
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(
          `/api/public/${slug}/slots?sessionTypeId=${sessionTypeId}&date=${dateStr}`
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error(err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedDate, slug, sessionTypeId]);

  const isDayAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const override = creator?.availabilityOverrides?.find(
      (o: any) => o.date === dateStr
    );
    if (override) return !override.isBlocked;
    const dayOfWeek = date.getDay();
    if (creator?.availableDaysOfWeek && creator.availableDaysOfWeek.length > 0) {
      return creator.availableDaysOfWeek.includes(dayOfWeek);
    }
    return true;
  };

  const allAvailableDates = useMemo(() => {
    if (!creator) return [];
    const dates: Date[] = [];
    for (let i = 0; i < 90; i++) {
      const d = addDays(today, i);
      if (isDayAvailable(d)) dates.push(d);
    }
    return dates;
  }, [creator, today]);

  useEffect(() => {
    if (allAvailableDates.length > 0) {
      const isCurrentSelectedAvailable = allAvailableDates.some((d) =>
        isSameDay(d, selectedDate)
      );
      if (!isCurrentSelectedAvailable) setSelectedDate(allAvailableDates[0]);
    }
  }, [allAvailableDates, selectedDate]);

  const DATES_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(allAvailableDates.length / DATES_PER_PAGE));
  const currentDatesToShow = allAvailableDates.slice(
    calendarOffset * DATES_PER_PAGE,
    (calendarOffset + 1) * DATES_PER_PAGE
  );

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please select an available time slot");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTypeId,
          scheduledStart: selectedSlot.startTime,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to initiate booking");
        setSubmitting(false);
        return;
      }

      if (data.razorpayOrderId && window.Razorpay) {
        const options = {
          key: data.razorpayKeyId,
          amount: data.amountTotalPaise,
          currency: "INR",
          name: "SessionBook",
          description: sessionType.title,
          order_id: data.razorpayOrderId,
          prefill: {
            name: formData.clientName,
            email: formData.clientEmail,
            contact: formData.clientPhone,
          },
          theme: { color: "#6366f1" },
          handler: async function (response: any) {
            setSubmitting(true);
            try {
              await fetch("/api/bookings/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bookingId: data.bookingId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
            } catch (err) {
              console.error("Verification error:", err);
            }
            router.push(`/booking/${data.bookingId}/confirmation`);
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (failResponse: any) {
          setError(
            failResponse.error?.description ||
              "Payment failed or was declined. Please try again."
          );
          setSubmitting(false);
        });
        rzp.open();
      } else {
        router.push(`/booking/${data.bookingId}/confirmation`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--glass-border)",
    color: "var(--text-primary)",
  };
  const inputClass =
    "w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:outline-none transition-all";

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator || !sessionType) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="glass-card p-10 text-center max-w-md">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#f87171" }} />
          <h2 className="text-lg font-700 text-white">Session Not Found</h2>
          <p className="text-sm mt-1 mb-5" style={{ color: "var(--text-muted)" }}>
            This session type does not exist or has been deactivated.
          </p>
          <Link href={`/u/${slug}`} className="btn-primary text-sm py-2.5 px-5">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  const creatorInitials = creator.name
    ? creator.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

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
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            href={`/u/${slug}`}
            className="flex items-center gap-2 text-sm font-600 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {creator.name}&apos;s page</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-600" style={{ color: "#10b981" }}>
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Verified Booking</span>
          </div>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Left: Session info + form ── */}
          <div className="lg:col-span-5 space-y-5">

            {/* Session summary card */}
            <div className="glass-card p-5 space-y-4">
              {/* Creator row */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-800 flex-shrink-0 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #6366f1, #0f766e)" }}
                >
                  {creator.avatarUrl ? (
                    <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                  ) : (
                    creatorInitials
                  )}
                </div>
                <div>
                  <p className="text-sm font-700 text-white">{creator.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>1:1 Consultation</p>
                </div>
              </div>

              {/* Session name + desc */}
              <div
                className="pt-4 border-t"
                style={{ borderColor: "var(--glass-border)" }}
              >
                <h1 className="text-lg font-800 text-white leading-tight">
                  {sessionType.title}
                </h1>
                {sessionType.description && (
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {sessionType.description}
                  </p>
                )}
              </div>

              {/* Meta chips */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Duration", value: `${sessionType.durationMinutes} min`, color: "#6366f1" },
                  { label: "Price", value: `₹${(sessionType.priceInPaise / 100).toLocaleString("en-IN")}`, color: "#10b981" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="p-3 rounded-xl text-center"
                    style={{
                      background: `${color}0d`,
                      border: `1px solid ${color}20`,
                    }}
                  >
                    <p className="text-[10px] font-700 uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </p>
                    <p className="text-base font-800" style={{ color }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center gap-2 text-xs pt-2 border-t"
                style={{ borderColor: "var(--glass-border)", color: "var(--text-muted)" }}
              >
                <Video className="w-4 h-4" style={{ color: "#6366f1" }} />
                <span>Online video · Calendar invite sent automatically</span>
              </div>
            </div>

            {/* Contact form */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-base font-700 text-white">Your Details</h2>

              {error && (
                <div
                  className="p-3 rounded-xl flex items-center gap-2 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="booking-form" onSubmit={handleBookingSubmit} className="space-y-3.5">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-700 uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3.5" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      required
                      placeholder="Maya Sharma"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-700 uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3.5" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="email"
                      required
                      placeholder="maya@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-700 uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3.5" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className={inputClass}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-700 uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Notes for {creator.name} (optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3 top-3" style={{ color: "var(--text-muted)" }} />
                    <textarea
                      rows={2}
                      placeholder="Briefly share what you'd like to discuss..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm focus:outline-none transition-all resize-none"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--glass-border)")}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right: Date & time picker + pay ── */}
          <div className="lg:col-span-7 space-y-5">
            <div className="glass-card p-6 space-y-6">

              {/* Date picker header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-700 text-white">Select Date &amp; Time</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Available dates only · Times in{" "}
                    <span style={{ color: "#a5b4fc" }}>{creator.timezone}</span>
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {calendarOffset + 1}/{totalPages}
                    </span>
                    <button
                      onClick={() => setCalendarOffset((p) => Math.max(0, p - 1))}
                      disabled={calendarOffset === 0}
                      className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30"
                      style={{
                        background: "var(--glass-bg)",
                        border: "1px solid var(--glass-border)",
                        color: "#94a3b8",
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCalendarOffset((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={calendarOffset >= totalPages - 1}
                      className="p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-30"
                      style={{
                        background: "var(--glass-bg)",
                        border: "1px solid var(--glass-border)",
                        color: "#94a3b8",
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Date strip */}
              {allAvailableDates.length === 0 ? (
                <div
                  className="py-8 text-center rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)" }}
                >
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No available dates in the next 90 days.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {currentDatesToShow.map((day) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className="p-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer"
                        style={
                          isSelected
                            ? {
                                background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.15))",
                                border: "1px solid rgba(99,102,241,0.5)",
                                boxShadow: "0 4px 20px rgba(99,102,241,0.2)",
                                transform: "scale(1.04)",
                                color: "#fff",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid var(--glass-border)",
                                color: "#94a3b8",
                              }
                        }
                      >
                        <span
                          className="text-[10px] uppercase font-700 tracking-wider"
                          style={{ color: isSelected ? "#c7d2fe" : "#6366f1" }}
                        >
                          {format(day, "EEE")}
                        </span>
                        <span className="text-lg font-800 mt-0.5">
                          {format(day, "d")}
                        </span>
                        <span className="text-[10px] font-500 mt-0.5" style={{ color: isSelected ? "#c7d2fe" : "var(--text-muted)" }}>
                          {format(day, "MMM")}
                        </span>
                        {isTodayDate && (
                          <span
                            className="mt-1 text-[9px] font-700 px-1.5 py-0.5 rounded-full"
                            style={
                              isSelected
                                ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                                : { background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }
                            }
                          >
                            Today
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Slots */}
              <div
                className="space-y-3 pt-4 border-t"
                style={{ borderColor: "var(--glass-border)" }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xs font-700 uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Slots · {format(selectedDate, "EEEE, MMM d")}
                  </h3>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {loadingSlots ? "Checking..." : `${slots.length} open`}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div
                    className="py-8 text-center rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--glass-border)" }}
                  >
                    <Clock className="w-7 h-7 mx-auto mb-2" style={{ color: "#f59e0b" }} />
                    <p className="text-sm font-600 text-white">
                      {isToday(selectedDate)
                        ? "All slots for today have passed"
                        : `No open slots on ${format(selectedDate, "EEEE")}`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Please select another available date above.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className="py-3 px-3 rounded-xl text-sm font-600 transition-all cursor-pointer"
                          style={
                            isSelected
                              ? {
                                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                                  border: "1px solid rgba(99,102,241,0.6)",
                                  color: "#fff",
                                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                                  transform: "scale(1.03)",
                                }
                              : {
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid var(--glass-border)",
                                  color: "#94a3b8",
                                }
                          }
                        >
                          {slot.displayTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected slot summary */}
              {selectedSlot && (
                <div
                  className="flex items-center justify-between p-4 rounded-2xl animate-fade-up"
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-600 text-white">
                      {format(selectedDate, "MMM d")} at {selectedSlot.displayTime}
                    </span>
                  </div>
                  <span className="text-sm font-800 text-emerald-400">
                    ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* Pay CTA */}
              <div
                className="pt-4 border-t space-y-3"
                style={{ borderColor: "var(--glass-border)" }}
              >
                <button
                  type="submit"
                  form="booking-form"
                  disabled={!isFormValid || submitting}
                  className="btn-primary btn-emerald w-full justify-center py-4 text-sm"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Pay &amp; Confirm — ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                      </span>
                    </>
                  )}
                </button>

                {!isFormValid && (
                  <p className="text-[11px] text-center font-600" style={{ color: "#f59e0b" }}>
                    {!selectedSlot
                      ? "Select a time slot above to continue"
                      : "Fill in your name, email, and phone number"}
                  </p>
                )}

                <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
                  100% secure via Razorpay · Slot reserved instantly upon payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
