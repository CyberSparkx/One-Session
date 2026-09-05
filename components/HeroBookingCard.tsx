"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Video,
  CheckCircle2,
  ChevronRight,
  Star,
  CalendarCheck,
} from "lucide-react";

const TIME_SLOTS = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM", "6:00 PM"];

export default function HeroBookingCard() {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  const handleBook = () => {
    if (selectedSlot) {
      setIsBooked(true);
    }
  };

  return (
    <div className="animate-float relative w-full max-w-sm mx-auto">
      {/* Outer glow ring */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.4) 0%, transparent 60%)",
          filter: "blur(20px)",
          transform: "translateY(-10px) scale(1.05)",
        }}
      />

      {/* Main card */}
      <div
        className="relative glass-card rounded-3xl p-6 overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        {/* Top bar decoration */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(16,185,129,0.4), transparent)",
          }}
        />

        {!isBooked ? (
          <>
            {/* Creator profile */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                  style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  }}
                >
                  AK
                </div>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0C1222]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-700 text-white leading-tight truncate">
                  Arjun Kapoor
                </p>
                <p className="text-xs text-slate-400 truncate">
                  Full-stack Architect · 6 yrs
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">4.9</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-800 text-white">₹2,500</p>
                <p className="text-xs text-slate-500">/ session</p>
              </div>
            </div>

            {/* Session type chip */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-500"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#a5b4fc",
              }}
            >
              <Video className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Code Review & Architecture Deep-Dive</span>
              <div className="ml-auto flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>60 min</span>
              </div>
            </div>

            {/* Date */}
            <p className="text-xs text-slate-500 uppercase tracking-wider font-600 mb-2">
              Sept 8, 2026 — Available slots
            </p>

            {/* Time slots */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {TIME_SLOTS.slice(0, 6).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className="py-2 px-2 rounded-xl text-xs font-600 transition-all duration-150 cursor-pointer"
                  style={{
                    background:
                      selectedSlot === slot
                        ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                        : "rgba(255,255,255,0.05)",
                    border:
                      selectedSlot === slot
                        ? "1px solid rgba(99,102,241,0.6)"
                        : "1px solid rgba(255,255,255,0.08)",
                    color: selectedSlot === slot ? "#fff" : "#94a3b8",
                    transform: selectedSlot === slot ? "scale(1.04)" : "scale(1)",
                    boxShadow:
                      selectedSlot === slot
                        ? "0 4px 12px rgba(99,102,241,0.35)"
                        : "none",
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>

            {/* Book button */}
            <button
              onClick={handleBook}
              disabled={!selectedSlot}
              className="w-full btn-primary btn-emerald justify-center text-sm py-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {selectedSlot ? (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  Book {selectedSlot}
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Select a time slot
                </>
              )}
            </button>

            {/* Trust note */}
            <p className="text-center text-[10px] text-slate-600 mt-3">
              Secure checkout via Razorpay · Instant confirmation
            </p>
          </>
        ) : (
          /* Success state */
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="font-700 text-white text-base">Booking Confirmed!</p>
              <p className="text-xs text-slate-400 mt-1">
                Sept 8 at {selectedSlot} with Arjun Kapoor
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
              .ics invite + Google Meet link sent to your email.
            </p>
            <Link
              href="/signup"
              className="btn-primary text-xs px-5 py-2"
            >
              Create Your Page
            </Link>
          </div>
        )}
      </div>

      {/* Floating badge - bookings counter */}
      <div
        className="absolute -top-3 -right-3 animate-fade-in delay-500 glass-card px-3 py-1.5 rounded-full flex items-center gap-2"
        style={{ borderColor: "rgba(16,185,129,0.3)" }}
      >
        <div className="dot-pulse" />
        <span className="text-xs font-600 text-emerald-400">12 booked today</span>
      </div>
    </div>
  );
}
