import {
  addMinutes,
  parse,
  format,
  isBefore,
  isAfter,
  areIntervalsOverlapping,
  startOfDay,
  endOfDay,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export interface ComputedSlot {
  startTime: string; // ISO 8601 UTC string
  endTime: string;   // ISO 8601 UTC string
  displayTime: string; // Local formatted time for preview
}

export interface AvailabilityRuleData {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "10:00"
  endTime: string;   // "18:00"
}

export interface AvailabilityOverrideData {
  date: Date | string;
  isBlocked: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export interface ExistingBookingData {
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  status: string;
  createdAt?: Date | string;
}

/**
 * Computes open, non-overlapping booking slots for a given creator, session type, and target date.
 */
export function computeAvailableSlots({
  targetDate, // e.g. "2026-09-10" or Date
  creatorTimezone, // e.g. "Asia/Kolkata"
  durationMinutes,
  bufferBeforeMin = 0,
  bufferAfterMin = 0,
  rules,
  overrides = [],
  existingBookings = [],
  now = new Date(),
}: {
  targetDate: string | Date;
  creatorTimezone: string;
  durationMinutes: number;
  bufferBeforeMin?: number;
  bufferAfterMin?: number;
  rules: AvailabilityRuleData[];
  overrides?: AvailabilityOverrideData[];
  existingBookings?: ExistingBookingData[];
  now?: Date;
}): ComputedSlot[] {
  // Normalize target date string YYYY-MM-DD
  const targetDateStr =
    typeof targetDate === "string"
      ? targetDate.split("T")[0]
      : format(targetDate, "yyyy-MM-dd");

  // Determine day of week in creator's timezone for the target date
  // Parse target date as noon in creator's timezone to avoid edge-of-day offsets
  const dateInTimezone = toZonedTime(new Date(`${targetDateStr}T12:00:00Z`), creatorTimezone);
  const dayOfWeek = dateInTimezone.getDay(); // 0 = Sun, 1 = Mon...

  // Check for any specific date override
  const dateOverride = overrides.find((o) => {
    const overrideDateStr =
      typeof o.date === "string"
        ? o.date.split("T")[0]
        : format(new Date(o.date), "yyyy-MM-dd");
    return overrideDateStr === targetDateStr;
  });

  // If this specific date is completely blocked
  if (dateOverride && dateOverride.isBlocked) {
    return [];
  }

  // Determine working windows for this date
  let windows: { startTime: string; endTime: string }[] = [];

  if (dateOverride && !dateOverride.isBlocked && dateOverride.startTime && dateOverride.endTime) {
    // Custom window for this date
    windows = [{ startTime: dateOverride.startTime, endTime: dateOverride.endTime }];
  } else {
    // Standard recurring rules for this day of the week
    const matchingRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
    windows = matchingRules.map((r) => ({
      startTime: r.startTime,
      endTime: r.endTime,
    }));
  }

  if (windows.length === 0) {
    return [];
  }

  // Active bookings filter:
  // - CONFIRMED bookings always block slots
  // - PENDING_PAYMENT bookings block slots only if created less than 10 minutes ago
  const TEN_MINUTES_MS = 10 * 60 * 1000;
  const blockingBookings = existingBookings.filter((b) => {
    if (b.status === "CONFIRMED") return true;
    if (b.status === "PENDING_PAYMENT") {
      const createdAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return now.getTime() - createdAt < TEN_MINUTES_MS;
    }
    return false;
  });

  const slots: ComputedSlot[] = [];

  for (const window of windows) {
    // Construct window start and end in creator's timezone, then convert to UTC Date objects
    // Format: "2026-09-10 10:00"
    const windowStartLocalStr = `${targetDateStr} ${window.startTime}:00`;
    const windowEndLocalStr = `${targetDateStr} ${window.endTime}:00`;

    // fromZonedTime interprets the local string in creatorTimezone and returns UTC Date
    const windowStartUtc = fromZonedTime(windowStartLocalStr, creatorTimezone);
    let windowEndUtc = fromZonedTime(windowEndLocalStr, creatorTimezone);

    // Handle midnight crossover if endTime <= startTime
    if (!isAfter(windowEndUtc, windowStartUtc)) {
      windowEndUtc = addMinutes(windowEndUtc, 24 * 60);
    }

    // Step through the window
    let currentSlotStartUtc = windowStartUtc;

    while (true) {
      const slotEndUtc = addMinutes(currentSlotStartUtc, durationMinutes);

      // Check if slot exceeds window boundary
      if (isAfter(slotEndUtc, windowEndUtc)) {
        break;
      }

      // Buffer inclusion for conflict checking
      const bufferedSlotStart = addMinutes(currentSlotStartUtc, -bufferBeforeMin);
      const bufferedSlotEnd = addMinutes(slotEndUtc, bufferAfterMin);

      // Check if this slot is in the past
      const isPast = isBefore(currentSlotStartUtc, now);

      // Check if slot overlaps any existing confirmed or active pending booking
      const hasConflict = blockingBookings.some((b) => {
        const bStart = new Date(b.scheduledStart);
        const bEnd = new Date(b.scheduledEnd);
        return areIntervalsOverlapping(
          { start: bufferedSlotStart, end: bufferedSlotEnd },
          { start: bStart, end: bEnd }
        );
      });

      if (!isPast && !hasConflict) {
        slots.push({
          startTime: currentSlotStartUtc.toISOString(),
          endTime: slotEndUtc.toISOString(),
          displayTime: format(toZonedTime(currentSlotStartUtc, creatorTimezone), "h:mm a"),
        });
      }

      // Increment by duration + bufferAfter
      const stepMinutes = Math.max(15, durationMinutes + bufferAfterMin);
      currentSlotStartUtc = addMinutes(currentSlotStartUtc, stepMinutes);
    }
  }

  // Sort slots chronologically
  return slots.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}
