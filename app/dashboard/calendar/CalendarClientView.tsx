"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
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
  User,
  Mail,
  Phone,
  Video,
  ExternalLink,
  CheckCircle2,
  CalendarCheck,
  Download,
  AlertCircle,
  Sparkles,
} from "lucide-react";

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading empty days for month grid alignment (Monday = 1 ... Sunday = 7)
  const startDay = monthStart.getDay(); // 0 is Sunday
  const paddingDays = (startDay + 6) % 7; // Monday-first grid

  // Filter bookings for the selected date
  const selectedDayBookings = bookings.filter((b) => {
    const start = parseISO(b.scheduledStart);
    return isSameDay(start, selectedDate);
  });

  // Count bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return bookings.filter((b) => isSameDay(parseISO(b.scheduledStart), day));
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-indigo-400" />
            <span>Session Calendar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track all your scheduled 1:1 consultation calls and Google Calendar sync status.
          </p>
        </div>

        {/* Google Calendar Status Card */}
        <div className="flex items-center">
          {isGoogleConnected ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Calendar Auto-Sync Active</span>
            </div>
          ) : (
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard/calendar" })}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
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
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-5">
          {/* Month Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(now);
                  setSelectedDate(now);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
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
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                      : isTodayDate
                      ? "bg-slate-800/80 border-indigo-500/50 text-slate-100"
                      : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <span
                    className={`text-xs sm:text-sm font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : isTodayDate
                        ? "bg-indigo-500/20 text-indigo-400 font-bold"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Booking count dot/pill */}
                  {hasBookings && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400">
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
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDayBookings.length}{" "}
                  {selectedDayBookings.length === 1 ? "session" : "sessions"} scheduled
                </p>
              </div>
              {isToday(selectedDate) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Today
                </span>
              )}
            </div>

            {selectedDayBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">No sessions on this day</p>
                <p className="text-xs text-slate-500 mt-1">
                  Select another day on the calendar to inspect bookings.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {selectedDayBookings.map((b) => {
                  const start = parseISO(b.scheduledStart);
                  const end = parseISO(b.scheduledEnd);
                  const isConfirmed = b.status === "CONFIRMED";

                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                            {b.sessionTitle}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{b.clientName}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isConfirmed
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {format(start, "h:mm a")} - {format(end, "h:mm a")} ({creatorTimezone})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.clientEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.clientPhone}</span>
                        </div>
                      </div>

                      {b.notes && (
                        <p className="text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          "{b.notes}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-emerald-400">
                          Payout: ₹{(b.creatorPayoutPaise / 100).toLocaleString("en-IN")}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Add to Google Calendar Web Link */}
                          <a
                            href={buildGoogleCalendarWebUrl(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Open in Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Google Cal</span>
                          </a>

                          {/* Download .ics */}
                          <a
                            href={`/api/bookings/${b.id}/ics`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                            title="Download .ics invite"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>.ics</span>
                          </a>
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
