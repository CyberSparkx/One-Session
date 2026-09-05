import { computeAvailableSlots } from "./availability";

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ ${message}`);
      failed++;
    }
  }

  console.log("Starting Availability Engine Tests...\n");

  // Test 1: Standard Monday availability with 30 min duration
  {
    console.log("Test 1: Standard Monday window (10:00 to 12:00, 30m sessions, 15m buffer)");
    // 2026-09-07 is a Monday
    const slots = computeAvailableSlots({
      targetDate: "2026-09-07",
      creatorTimezone: "Asia/Kolkata",
      durationMinutes: 30,
      bufferAfterMin: 15,
      rules: [{ dayOfWeek: 1, startTime: "10:00", endTime: "12:00" }],
      now: new Date("2026-09-01T00:00:00Z"), // in the past
    });

    // 10:00 - 10:30, step to 10:45
    // 10:45 - 11:15, step to 11:30
    // 11:30 - 12:00
    assert(slots.length === 3, `Expected 3 slots, got ${slots.length}`);
    if (slots.length >= 3) {
      assert(slots[0].displayTime === "10:00 AM", `First slot is 10:00 AM (${slots[0].displayTime})`);
      assert(slots[1].displayTime === "10:45 AM", `Second slot is 10:45 AM (${slots[1].displayTime})`);
      assert(slots[2].displayTime === "11:30 AM", `Third slot is 11:30 AM (${slots[2].displayTime})`);
    }
  }

  // Test 2: Fully blocked day via AvailabilityOverride
  {
    console.log("\nTest 2: Fully blocked day override");
    const slots = computeAvailableSlots({
      targetDate: "2026-09-07",
      creatorTimezone: "Asia/Kolkata",
      durationMinutes: 30,
      rules: [{ dayOfWeek: 1, startTime: "10:00", endTime: "18:00" }],
      overrides: [{ date: "2026-09-07", isBlocked: true }],
      now: new Date("2026-09-01T00:00:00Z"),
    });

    assert(slots.length === 0, `Blocked day must return 0 slots (got ${slots.length})`);
  }

  // Test 3: Midnight crossover window
  {
    console.log("\nTest 3: Midnight crossover window (23:00 to 01:00 next day)");
    const slots = computeAvailableSlots({
      targetDate: "2026-09-07",
      creatorTimezone: "UTC",
      durationMinutes: 45,
      bufferAfterMin: 15,
      rules: [{ dayOfWeek: 1, startTime: "23:00", endTime: "01:00" }],
      now: new Date("2026-09-01T00:00:00Z"),
    });

    assert(slots.length === 2, `Expected 2 slots across midnight, got ${slots.length}`);
  }

  // Test 4: Conflict resolution - existing CONFIRMED booking
  {
    console.log("\nTest 4: Conflict resolution with existing confirmed booking");
    const testDate = "2026-09-07";
    const slotsNoBooking = computeAvailableSlots({
      targetDate: testDate,
      creatorTimezone: "UTC",
      durationMinutes: 30,
      rules: [{ dayOfWeek: 1, startTime: "10:00", endTime: "12:00" }],
      now: new Date("2026-09-01T00:00:00Z"),
    });

    const slotsWithBooking = computeAvailableSlots({
      targetDate: testDate,
      creatorTimezone: "UTC",
      durationMinutes: 30,
      rules: [{ dayOfWeek: 1, startTime: "10:00", endTime: "12:00" }],
      existingBookings: [
        {
          scheduledStart: "2026-09-07T10:00:00.000Z",
          scheduledEnd: "2026-09-07T10:30:00.000Z",
          status: "CONFIRMED",
        },
      ],
      now: new Date("2026-09-01T00:00:00Z"),
    });

    assert(
      slotsWithBooking.length === slotsNoBooking.length - 1,
      `Confirmed booking removed 1 overlapping slot (${slotsWithBooking.length} vs ${slotsNoBooking.length})`
    );
  }

  // Test 5: Expired pending booking does NOT block slot
  {
    console.log("\nTest 5: Expired pending payment (>10 min ago) does NOT block slot");
    const testNow = new Date("2026-09-01T12:00:00Z");
    const slots = computeAvailableSlots({
      targetDate: "2026-09-07",
      creatorTimezone: "UTC",
      durationMinutes: 30,
      rules: [{ dayOfWeek: 1, startTime: "10:00", endTime: "11:00" }],
      existingBookings: [
        {
          scheduledStart: "2026-09-07T10:00:00.000Z",
          scheduledEnd: "2026-09-07T10:30:00.000Z",
          status: "PENDING_PAYMENT",
          createdAt: new Date("2026-09-01T11:40:00Z"), // 20 min ago (> 10 min)
        },
      ],
      now: testNow,
    });

    assert(slots.length === 2, `Expired pending booking should be ignored, slots: ${slots.length}`);
  }

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
