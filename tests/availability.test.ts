import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeAvailableSlots } from "../lib/availability.ts";

describe("Availability & Slot Engine (computeAvailableSlots)", () => {
  const timezone = "Asia/Kolkata";
  // Target date: Wednesday, Sept 9, 2026
  const targetDate = "2026-09-09";
  // Wednesday is dayOfWeek 3
  const standardRules = [
    { dayOfWeek: 3, startTime: "10:00", endTime: "12:00" }, // 2 hour window
  ];
  // Set "now" to early morning on target date so no slots are in the past
  const morningNow = new Date("2026-09-09T00:00:00.000Z");

  it("should generate exact 30-minute slots within standard working hours", () => {
    const slots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      bufferBeforeMin: 0,
      bufferAfterMin: 0,
      rules: standardRules,
      now: morningNow,
    });

    assert.strictEqual(slots.length, 4, "10:00-12:00 with 30m slots should yield 4 slots");
    assert.strictEqual(slots[0].displayTime, "10:00 AM");
    assert.strictEqual(slots[1].displayTime, "10:30 AM");
    assert.strictEqual(slots[2].displayTime, "11:00 AM");
    assert.strictEqual(slots[3].displayTime, "11:30 AM");
  });

  it("should return empty array on non-working day", () => {
    // Target date Thursday, Sept 10, 2026 (dayOfWeek 4, not in rules)
    const slots = computeAvailableSlots({
      targetDate: "2026-09-10",
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules, // only Wednesday
      now: morningNow,
    });

    assert.strictEqual(slots.length, 0, "Non-working day must return 0 slots");
  });

  it("should return empty array when date is blocked by override", () => {
    const slots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      overrides: [
        {
          date: targetDate,
          isBlocked: true, // Day off override
        },
      ],
      now: morningNow,
    });

    assert.strictEqual(slots.length, 0, "Blocked date override must return 0 slots");
  });

  it("should support custom working hours override for a specific date", () => {
    const slots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      overrides: [
        {
          date: targetDate,
          isBlocked: false,
          startTime: "14:00",
          endTime: "15:00",
        },
      ],
      now: morningNow,
    });

    assert.strictEqual(slots.length, 2, "Custom 14:00-15:00 window should yield 2 slots");
    assert.strictEqual(slots[0].displayTime, "2:00 PM");
    assert.strictEqual(slots[1].displayTime, "2:30 PM");
  });

  it("should correctly account for bufferAfterMin between slots", () => {
    // 30 min session + 15 min buffer = 45 min interval
    // 10:00 -> 10:30 (buffer to 10:45)
    // 10:45 -> 11:15 (buffer to 11:30)
    // Next slot 11:30 -> 12:00 (fits in 10:00-12:00 window)
    const slots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      bufferAfterMin: 15,
      rules: standardRules,
      now: morningNow,
    });

    assert.strictEqual(slots.length, 3, "10:00-12:00 with 30m slot + 15m buffer yields 3 slots");
    assert.strictEqual(slots[0].displayTime, "10:00 AM");
    assert.strictEqual(slots[1].displayTime, "10:45 AM");
    assert.strictEqual(slots[2].displayTime, "11:30 AM");
  });

  it("should eliminate slot overlapping a CONFIRMED booking", () => {
    const initialSlots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      now: morningNow,
    });

    const bookedStart = initialSlots[1].startTime; // 10:30 AM slot
    const bookedEnd = initialSlots[1].endTime;

    const remainingSlots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      existingBookings: [
        {
          scheduledStart: bookedStart,
          scheduledEnd: bookedEnd,
          status: "CONFIRMED",
        },
      ],
      now: morningNow,
    });

    assert.strictEqual(remainingSlots.length, 3, "Confirmed booking must block 10:30 AM slot");
    assert.strictEqual(
      remainingSlots.some((s) => s.displayTime === "10:30 AM"),
      false,
      "10:30 AM slot must be gone"
    );
  });

  it("should block slot for recent PENDING_PAYMENT (< 10 min old)", () => {
    const initialSlots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      now: morningNow,
    });

    const bookedStart = initialSlots[0].startTime; // 10:00 AM slot
    const bookedEnd = initialSlots[0].endTime;

    // Created 3 minutes ago
    const recentCreatedAt = new Date(morningNow.getTime() - 3 * 60 * 1000);

    const remainingSlots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      existingBookings: [
        {
          scheduledStart: bookedStart,
          scheduledEnd: bookedEnd,
          status: "PENDING_PAYMENT",
          createdAt: recentCreatedAt,
        },
      ],
      now: morningNow,
    });

    assert.strictEqual(
      remainingSlots.some((s) => s.displayTime === "10:00 AM"),
      false,
      "Active pending payment (<10 min) must block the slot"
    );
  });

  it("should release slot for stale PENDING_PAYMENT (> 10 min old)", () => {
    const initialSlots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      now: morningNow,
    });

    const bookedStart = initialSlots[0].startTime; // 10:00 AM slot
    const bookedEnd = initialSlots[0].endTime;

    // Created 15 minutes ago (abandoned checkout)
    const staleCreatedAt = new Date(morningNow.getTime() - 15 * 60 * 1000);

    const remainingSlots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      existingBookings: [
        {
          scheduledStart: bookedStart,
          scheduledEnd: bookedEnd,
          status: "PENDING_PAYMENT",
          createdAt: staleCreatedAt,
        },
      ],
      now: morningNow,
    });

    assert.strictEqual(
      remainingSlots.some((s) => s.displayTime === "10:00 AM"),
      true,
      "Expired pending payment (>10 min) must release the slot"
    );
  });

  it("should filter out past slots when now is partway through working hours", () => {
    // 10:00 AM in Asia/Kolkata on 2026-09-09 is 04:30:00 UTC
    // Set "now" to 10:45 AM Asia/Kolkata (05:15:00 UTC)
    const midDayNow = new Date("2026-09-09T05:15:00.000Z");

    const slots = computeAvailableSlots({
      targetDate,
      creatorTimezone: timezone,
      durationMinutes: 30,
      rules: standardRules,
      now: midDayNow,
    });

    // 10:00 AM and 10:30 AM are in the past; only 11:00 AM and 11:30 AM should be returned
    assert.strictEqual(slots.length, 2, "Past slots must be filtered out");
    assert.strictEqual(slots[0].displayTime, "11:00 AM");
    assert.strictEqual(slots[1].displayTime, "11:30 AM");
  });
});
