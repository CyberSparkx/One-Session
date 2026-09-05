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
    <div className="relative w-full max-w-sm mx-auto">
      {/* Main card */}
      <div className="relative bg-white border border-gray-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        {!isBooked ? (
          <>
            {/* Creator profile */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-shrink-0">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-orange-700 bg-orange-100 font-extrabold text-base border border-orange-200">
                  AK
                </div>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-950 leading-tight truncate">
                  Arjun Kapoor
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Full-stack Architect · 6 yrs
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-gray-500 ml-1 font-semibold">4.9</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-extrabold text-gray-950">₹2,500</p>
                <p className="text-xs text-gray-400">/ session</p>
              </div>
            </div>

            {/* Session type chip */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-700">
              <Video className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Code Review &amp; Architecture</span>
              <div className="ml-auto flex items-center gap-1 text-orange-600">
                <Clock className="w-3 h-3" />
                <span>60m</span>
              </div>
            </div>

            {/* Date */}
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-2">
              Sept 8, 2026 — Open slots
            </p>

            {/* Time slots */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedSlot === slot
                      ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                      : "bg-gray-50/80 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            {/* Book button */}
            <button
              onClick={handleBook}
              disabled={!selectedSlot}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {selectedSlot ? (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book {selectedSlot}</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span>Select a time slot</span>
                </>
              )}
            </button>

            {/* Trust note */}
            <p className="text-center text-[11px] text-gray-400 mt-3">
              Secure checkout via Razorpay · Instant confirmation
            </p>
          </>
        ) : (
          /* Success state */
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-950 text-base">Booking Confirmed!</p>
              <p className="text-xs text-gray-500 mt-1">
                Sept 8 at {selectedSlot} with Arjun Kapoor
              </p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
              .ics invite + Google Meet link sent to your email.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center py-2 px-4 rounded-xl bg-gray-900 text-xs font-semibold text-white hover:bg-black transition-colors"
            >
              Create Your Page
            </Link>
          </div>
        )}
      </div>

      {/* Floating badge */}
      <div className="absolute -top-2.5 -right-2.5 bg-white border border-gray-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-bold text-gray-800">12 booked today</span>
      </div>
    </div>
  );
}
