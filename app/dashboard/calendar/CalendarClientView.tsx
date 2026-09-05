"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  CalendarCheck,
  Download,
} from "lucide-react";
import CancelSessionButton from "@/components/CancelSessionButton";

interface BookingItem {
  id: string;
  sessionTitle: string;
  durationMinutes: number;
  priceInPaise: number;
  scheduledStart: string;
  scheduledEnd: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  notes?: string | null;
  creatorPayoutPaise: number;
}

interface CalendarClientViewProps {
  bookings: BookingItem[];
  isGoogleConnected: boolean;
  creatorTimezone: string;
  creatorName: string;
}

export default function CalendarClientView({
  bookings,
  isGoogleConnected,
  creatorTimezone,
  creatorName,
}: CalendarClientViewProps) {
  const [bookingList, setBookingList] = useState<BookingItem[]>(bookings);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading empty days for month grid alignment (Monday = 1 ... Sunday = 7)
  const startDay = monthStart.getDay(); // 0 is Sunday
  const paddingDays = (startDay + 6) % 7; // Monday-first grid

  // Filter bookings for the selected date
  const selectedDayBookings = bookingList.filter((b) => {
    const start = parseISO(b.scheduledStart);
    return isSameDay(start, selectedDate);
  });

  // Count bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return bookingList.filter((b) => isSameDay(parseISO(b.scheduledStart), day));
  };

  // Helper to build a direct Google Calendar Web Link (action=TEMPLATE)
  const buildGoogleCalendarWebUrl = (b: BookingItem) => {
    const startIso = parseISO(b.scheduledStart).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = parseISO(b.scheduledEnd).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`1:1 Session: ${b.sessionTitle} with ${b.clientName}`);
    const details = encodeURIComponent(
      `SessionBook Consultation\nClient: ${b.clientName}\nEmail: ${b.clientEmail}\nPhone: ${b.clientPhone}\nNotes: ${b.notes || "None"}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Schedule
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-orange-600" />
            <span>Session Calendar</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all your scheduled 1:1 consultation calls and Google Calendar sync status.
          </p>
        </div>

        {/* Google Calendar Status */}
        <div className="flex items-center">
          {isGoogleConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Google Calendar Connected</span>
            </div>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard/calendar" })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.3-4.8 3.3-8.1z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.8 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7.1H2.2C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.6-2.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.5 7.7 23 12 23z"
                />
              </svg>
              <span>Connect Google Calendar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Sessions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Calendar (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-5">
          {/* Month Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-950">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(now);
                  setSelectedDate(now);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-100">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty padding cells for start of month */}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`padding-${i}`} className="min-h-[64px] rounded-xl bg-transparent" />
            ))}

            {/* Days of the month */}
            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const dayBookings = getBookingsForDay(day);
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[68px] sm:min-h-[74px] p-2 rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-orange-50 border-orange-500 text-orange-950 font-bold shadow-xs"
                      : isTodayDate
                      ? "bg-gray-50 border-orange-300 text-gray-900"
                      : "bg-white border-gray-100 hover:border-gray-200 text-gray-700"
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected
                        ? "bg-orange-600 text-white"
                        : isTodayDate
                        ? "bg-orange-100 text-orange-700 font-bold"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Booking count dot/pill */}
                  {hasBookings && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-700">
                        {dayBookings.length} {dayBookings.length === 1 ? "call" : "calls"}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Day's Sessions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-950">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedDayBookings.length}{" "}
                  {selectedDayBookings.length === 1 ? "session" : "sessions"} scheduled
                </p>
              </div>
              {isToday(selectedDate) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  Today
                </span>
              )}
            </div>

            {selectedDayBookings.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-semibold text-gray-700">No sessions on this day</p>
                <p className="text-xs text-gray-400 mt-1">
                  Select another date on the calendar to inspect bookings.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedDayBookings.map((b) => {
                  const start = parseISO(b.scheduledStart);
                  const end = parseISO(b.scheduledEnd);
                  const isConfirmed = b.status === "CONFIRMED";

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                            {b.sessionTitle}
                          </span>
                          <h4 className="text-sm font-bold text-gray-950 mt-1.5">{b.clientName}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isConfirmed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {format(start, "h:mm a")} - {format(end, "h:mm a")} ({creatorTimezone})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{b.clientEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{b.clientPhone}</span>
                        </div>
                      </div>

                      {b.notes && (
                        <p className="text-xs text-gray-600 italic bg-white p-2.5 rounded-lg border border-gray-200">
                          "{b.notes}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-600">
                          Payout: ₹{(b.creatorPayoutPaise / 100).toLocaleString("en-IN")}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Add to Google Calendar Web Link */}
                          <a
                            href={buildGoogleCalendarWebUrl(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Open in Google Calendar"
                          >
                            <ExternalLink className="w-3 h-3 text-gray-500" />
                            <span>Google Cal</span>
                          </a>

                          {/* Download .ics */}
                          <a
                            href={`/api/bookings/${b.id}/ics`}
                            className="p-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs flex items-center gap-1 transition-colors"
                            title="Download .ics invite"
                          >
                            <Download className="w-3 h-3 text-gray-500" />
                            <span>.ics</span>
                          </a>

                          {/* Cancel Session Action */}
                          {isConfirmed && (
                            <CancelSessionButton
                              bookingId={b.id}
                              clientName={b.clientName}
                              sessionTitle={b.sessionTitle}
                              variant="icon"
                              onSuccess={() => {
                                setBookingList((prev) => prev.filter((item) => item.id !== b.id));
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
