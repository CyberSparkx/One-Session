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
  CheckCircle2,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

interface Slot {
  startTime: string;
  endTime: string;
  displayTime: string;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      setTimeout(() => resolve(Boolean((window as any).Razorpay)), 1500);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  useEffect(() => {
    loadRazorpayScript();
  }, []);

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
      const isPaid = (sessionType?.priceInPaise || 0) > 0;
      if (isPaid) {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || !(window as any).Razorpay) {
          setError(
            "Could not connect to the Razorpay payment gateway. Please disable ad-blockers or check your connection and try again."
          );
          setSubmitting(false);
          return;
        }
      }

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

      // Free session: directly proceed to confirmation
      if (data.amountTotalPaise === 0) {
        router.push(`/booking/${data.bookingId}/confirmation`);
        return;
      }

      // Paid session: launch Razorpay Checkout modal
      if (data.razorpayOrderId && (window as any).Razorpay) {
        const options = {
          key: data.razorpayKeyId,
          amount: data.amountTotalPaise,
          currency: "INR",
          name: "SessionBook",
          description: `${sessionType?.title || "1:1 Session"} with ${creator?.user?.name || "Creator"}`,
          order_id: data.razorpayOrderId,
          prefill: {
            name: formData.clientName,
            email: formData.clientEmail,
            contact: formData.clientPhone,
          },
          theme: { color: "#EA580C" },
          handler: async function (response: any) {
            setSubmitting(true);
            try {
              const verifyRes = await fetch("/api/bookings/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bookingId: data.bookingId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              if (!verifyRes.ok) {
                const verifyData = await verifyRes.json();
                setError(
                  verifyData.error ||
                    "Payment signature verification failed. Please contact support."
                );
                setSubmitting(false);
                return;
              }

              router.push(`/booking/${data.bookingId}/confirmation`);
            } catch (err: any) {
              console.error("Verification error:", err);
              // In case of a temporary browser error after payment capture, direct to confirmation
              router.push(`/booking/${data.bookingId}/confirmation`);
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (failResponse: any) {
          setError(
            failResponse.error?.description ||
              "Payment failed or was declined. You have not been charged."
          );
          setSubmitting(false);
        });
        rzp.open();
      } else {
        setError(
          "Payment gateway could not be initialized. Please reload the page and try again."
        );
        setSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator || !sessionType) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-md shadow-xs">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
          <h2 className="text-lg font-bold text-gray-950">Session Not Found</h2>
          <p className="text-xs text-gray-500 mt-1 mb-5">
            This session type does not exist or has been deactivated.
          </p>
          <Link
            href={`/u/${slug}`}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold"
          >
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
    <div className="min-h-[100dvh] flex flex-col bg-[#FAFAFA] text-gray-900 relative">
      <AnimatedBackground />

      {/* ── Header ── */}
      <header className="relative z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            href={`/u/${slug}`}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {creator.name}&apos;s profile</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Secure 1:1 Booking</span>
          </div>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Left: Session info + form ── */}
          <div className="lg:col-span-5 space-y-5">

            {/* Session summary card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
              {/* Creator row */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-orange-700 bg-orange-100 font-extrabold text-sm flex-shrink-0 overflow-hidden border border-orange-200">
                  {creator.avatarUrl ? (
                    <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                  ) : (
                    creatorInitials
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-950">{creator.name}</p>
                  <p className="text-xs text-gray-500">1:1 Consultation</p>
                </div>
              </div>

              {/* Session name + desc */}
              <div className="pt-3 border-t border-gray-100">
                <h1 className="text-base font-bold text-gray-950 leading-snug">
                  {sessionType.title}
                </h1>
                {sessionType.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {sessionType.description}
                  </p>
                )}
              </div>

              {/* Meta chips */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                    Duration
                  </p>
                  <p className="text-base font-extrabold text-orange-700">
                    {sessionType.durationMinutes} min
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                    Price
                  </p>
                  <p className="text-base font-extrabold text-emerald-700">
                    ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs pt-2 border-t border-gray-100 text-gray-500">
                <Video className="w-4 h-4 text-orange-600" />
                <span>Online video · Calendar invite sent automatically</span>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <h2 className="text-sm font-bold text-gray-950 uppercase tracking-wider">Your Details</h2>

              {error && (
                <div className="p-3 rounded-xl flex items-center gap-2 text-xs font-medium bg-red-50 border border-red-200 text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="booking-form" onSubmit={handleBookingSubmit} className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Maya Sharma"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="maya@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Notes for {creator.name} (optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <textarea
                      rows={2}
                      placeholder="Briefly describe what you'd like to discuss..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right: Date & time picker + pay ── */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-xs">

              {/* Date picker header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-950">Select Date &amp; Time</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Times shown in <span className="font-semibold text-orange-600">{creator.timezone}</span>
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 mr-1">
                      {calendarOffset + 1}/{totalPages}
                    </span>
                    <button
                      onClick={() => setCalendarOffset((p) => Math.max(0, p - 1))}
                      disabled={calendarOffset === 0}
                      className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCalendarOffset((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={calendarOffset >= totalPages - 1}
                      className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Date strip */}
              {allAvailableDates.length === 0 ? (
                <div className="py-8 text-center rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500">
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
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                            : "bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100/70"
                        }`}
                      >
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${
                            isSelected ? "text-orange-100" : "text-gray-400"
                          }`}
                        >
                          {format(day, "EEE")}
                        </span>
                        <span className="text-base font-extrabold mt-0.5">
                          {format(day, "d")}
                        </span>
                        <span
                          className={`text-[10px] font-medium mt-0.5 ${
                            isSelected ? "text-orange-100" : "text-gray-500"
                          }`}
                        >
                          {format(day, "MMM")}
                        </span>
                        {isTodayDate && (
                          <span
                            className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-orange-50 text-orange-700 border border-orange-200"
                            }`}
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
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Slots · {format(selectedDate, "EEEE, MMM d")}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {loadingSlots ? "Checking..." : `${slots.length} available`}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-8 text-center rounded-2xl bg-gray-50 border border-gray-200">
                    <Clock className="w-6 h-6 mx-auto mb-1.5 text-amber-500" />
                    <p className="text-xs font-semibold text-gray-900">
                      {isToday(selectedDate)
                        ? "All slots for today have passed"
                        : `No open slots on ${format(selectedDate, "EEEE")}`}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Please select another date on the calendar above.
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
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
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
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-900">
                      {format(selectedDate, "MMM d")} at {selectedSlot.displayTime}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">
                    ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {/* Pay CTA */}
              <div className="pt-4 border-t border-gray-100 space-y-2.5">
                <button
                  type="submit"
                  form="booking-form"
                  disabled={!isFormValid || submitting}
                  className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  <p className="text-[11px] text-center font-medium text-amber-600">
                    {!selectedSlot
                      ? "Select an open time slot above to continue"
                      : "Please provide your name, email, and phone number"}
                  </p>
                )}

                <p className="text-[11px] text-center text-gray-400">
                  Secured by Razorpay · Instant calendar confirmation upon payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
