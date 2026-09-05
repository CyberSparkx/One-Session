"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  format,
  addDays,
  isSameDay,
  isToday,
  isPast,
  startOfToday,
} from "date-fns";
import {
  Clock,
  Calendar as CalendarIcon,
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
} from "lucide-react";

interface Slot {
  startTime: string; // UTC ISO
  endTime: string;   // UTC ISO
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

  // Date selection state
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calendarOffset, setCalendarOffset] = useState(0); // page through days

  // Slots state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Client form state
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

  // Fetch creator and session type data
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

  // Fetch slots whenever selectedDate changes
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

  // Generate 14 days view (2 full weeks)
  const daysToShow = Array.from({ length: 14 }, (_, i) =>
    addDays(today, calendarOffset * 7 + i)
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

      // Check if Razorpay order is returned
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
          theme: {
            color: "#6366f1",
          },
          handler: async function (response: any) {
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
        rzp.open();
      } else {
        // Direct confirmation or test redirect
        router.push(`/booking/${data.bookingId}/confirmation`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator || !sessionType) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Session Not Found</h2>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            This session type does not exist or has been deactivated.
          </p>
          <Link
            href={`/u/${slug}`}
            className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-medium"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/u/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {creator.name}'s page</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Booking</span>
          </div>
        </div>
      </header>

      {/* Main Booking Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Session Details & Client Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* Session Card */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                    {creator.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-white">{creator.name}</h3>
                  <p className="text-xs text-slate-400">1:1 Consultation</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {sessionType.title}
                </h1>
                {sessionType.description && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {sessionType.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
                    Duration
                  </span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {sessionType.durationMinutes} mins
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
                    Total Price
                  </span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block">
                    ₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Web conference details will be emailed after booking</span>
              </div>
            </div>

            {/* Client Details Form */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-semibold text-white">Your Contact Details</h2>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="booking-form" onSubmit={handleBookingSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maya Sharma"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="maya@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Notes / Questions for {creator.name} (optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly share what you'd like to discuss..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Date & Slot Picker */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-6">
              {/* Date selector header with prev/next week pagination */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Select Date & Time</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Times shown in creator's timezone: <span className="text-indigo-400">{creator.timezone}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalendarOffset((prev) => Math.max(0, prev - 1))}
                    disabled={calendarOffset === 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCalendarOffset((prev) => prev + 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day selection strip */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {daysToShow.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isPastDate = isPast(day) && !isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPastDate}
                      onClick={() => setSelectedDate(day)}
                      className={`p-2 sm:p-2.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold"
                          : isPastDate
                          ? "opacity-30 cursor-not-allowed bg-slate-950/30 text-slate-600"
                          : "bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-medium">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-sm sm:text-base font-bold mt-0.5">
                        {format(day, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Available Slots Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Available Slots for {format(selectedDate, "EEEE, MMMM d")}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {loadingSlots ? "Checking..." : `${slots.length} open`}
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-12 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-10 px-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center">
                    <Clock className="w-8 h-8 text-amber-400/80 mx-auto mb-2" />
                    {isToday(selectedDate) ? (
                      <>
                        <p className="text-xs text-slate-300 font-medium">
                          All slots for today ({format(selectedDate, "EEEE")}) have already passed.
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Please select tomorrow ({format(addDays(selectedDate, 1), "EEEE, MMM d")}) or next weekend above!
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-slate-400 font-medium">
                          No open slots on {format(selectedDate, "EEEE, MMMM d")}.
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          The creator is unavailable on this day. Please select an available day above.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                              : "bg-slate-950/60 border-slate-800 hover:border-indigo-500/50 text-slate-200"
                          }`}
                        >
                          {slot.displayTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm & Pay Section */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                {selectedSlot && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
                    <span>
                      Selected: <strong>{format(selectedDate, "MMM d")} at {selectedSlot.displayTime}</strong>
                    </span>
                    <span>₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")}</span>
                  </div>
                )}

                <button
                  type="submit"
                  form="booking-form"
                  disabled={!isFormValid || submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay & Confirm Booking (₹{(sessionType.priceInPaise / 100).toLocaleString("en-IN")})</span>
                    </>
                  )}
                </button>

                {!isFormValid && (
                  <p className="text-[11px] text-center text-amber-400/90 font-medium">
                    {!selectedSlot
                      ? "👉 Please select an available time slot above."
                      : "👉 Please fill in your name, email, and phone number to enable payment."}
                  </p>
                )}

                <p className="text-[11px] text-center text-slate-500">
                  Payments are 100% secure via Razorpay. Your slot is reserved immediately upon payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
