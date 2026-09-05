import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { areIntervalsOverlapping } from "date-fns";

describe("Booking Conflict & Overlap Logic", () => {
  it("should NOT conflict for back-to-back adjacent sessions", () => {
    // Session 1: 10:00 to 10:30
    const session1 = {
      start: new Date("2026-09-09T10:00:00.000Z"),
      end: new Date("2026-09-09T10:30:00.000Z"),
    };
    // Session 2: 10:30 to 11:00
    const session2 = {
      start: new Date("2026-09-09T10:30:00.000Z"),
      end: new Date("2026-09-09T11:00:00.000Z"),
    };

    const isOverlap = areIntervalsOverlapping(session1, session2);
    assert.strictEqual(isOverlap, false, "Back-to-back sessions touching at boundary must not conflict");
  });

  it("should conflict for overlapping intervals", () => {
    // Session 1: 10:00 to 10:30
    const session1 = {
      start: new Date("2026-09-09T10:00:00.000Z"),
      end: new Date("2026-09-09T10:30:00.000Z"),
    };
    // Session 2: 10:15 to 10:45 (15 min overlap)
    const session2 = {
      start: new Date("2026-09-09T10:15:00.000Z"),
      end: new Date("2026-09-09T10:45:00.000Z"),
    };

    const isOverlap = areIntervalsOverlapping(session1, session2);
    assert.strictEqual(isOverlap, true, "Overlapping intervals must conflict");
  });

  it("should conflict for identical intervals", () => {
    const slot = {
      start: new Date("2026-09-09T10:00:00.000Z"),
      end: new Date("2026-09-09T10:30:00.000Z"),
    };

    assert.strictEqual(areIntervalsOverlapping(slot, slot), true);
  });

  it("should conflict when one interval completely encloses another", () => {
    const parentInterval = {
      start: new Date("2026-09-09T10:00:00.000Z"),
      end: new Date("2026-09-09T11:00:00.000Z"),
    };
    const childInterval = {
      start: new Date("2026-09-09T10:15:00.000Z"),
      end: new Date("2026-09-09T10:45:00.000Z"),
    };

    assert.strictEqual(areIntervalsOverlapping(parentInterval, childInterval), true);
  });

  describe("Client Conflict Resolution Policy", () => {
    // Replicates conflict check in app/api/bookings/route.ts
    function checkBookingConflict({
      targetSlot,
      clientEmail,
      existingBookings,
      now,
    }: {
      targetSlot: { start: Date; end: Date };
      clientEmail: string;
      existingBookings: Array<{
        scheduledStart: Date;
        scheduledEnd: Date;
        status: string;
        clientEmail: string;
        createdAt: Date;
      }>;
      now: Date;
    }): boolean {
      const TEN_MIN_MS = 10 * 60 * 1000;
      const normalizedEmail = clientEmail.toLowerCase().trim();

      return existingBookings.some((b) => {
        const isOverlap = areIntervalsOverlapping(targetSlot, {
          start: b.scheduledStart,
          end: b.scheduledEnd,
        });
        if (!isOverlap) return false;

        // Confirmed bookings always block everyone
        if (b.status === "CONFIRMED") return true;

        // Pending payments: block if < 10 min old AND by a different email
        if (b.status === "PENDING_PAYMENT") {
          const isFresh = now.getTime() - b.createdAt.getTime() < TEN_MIN_MS;
          if (!isFresh) return false; // Stale, released

          // Same client retry allowed: do not block
          if (b.clientEmail.toLowerCase().trim() === normalizedEmail) {
            return false;
          }
          return true; // Different client, block
        }

        return false;
      });
    }

    const now = new Date("2026-09-09T10:05:00.000Z");
    const targetSlot = {
      start: new Date("2026-09-09T10:30:00.000Z"),
      end: new Date("2026-09-09T11:00:00.000Z"),
    };

    it("should allow same client to retry on their pending booking without 409 conflict", () => {
      const existingBookings = [
        {
          scheduledStart: targetSlot.start,
          scheduledEnd: targetSlot.end,
          status: "PENDING_PAYMENT",
          clientEmail: "rahul@example.com",
          createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
        },
      ];

      const hasConflict = checkBookingConflict({
        targetSlot,
        clientEmail: "rahul@example.com",
        existingBookings,
        now,
      });

      assert.strictEqual(hasConflict, false, "Same client must be permitted to retry");
    });

    it("should block a different client from booking an active pending slot", () => {
      const existingBookings = [
        {
          scheduledStart: targetSlot.start,
          scheduledEnd: targetSlot.end,
          status: "PENDING_PAYMENT",
          clientEmail: "rahul@example.com",
          createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
        },
      ];

      const hasConflict = checkBookingConflict({
        targetSlot,
        clientEmail: "other.user@example.com",
        existingBookings,
        now,
      });

      assert.strictEqual(hasConflict, true, "Different client must be blocked during 10-min window");
    });

    it("should block even the same client if the booking is already CONFIRMED", () => {
      const existingBookings = [
        {
          scheduledStart: targetSlot.start,
          scheduledEnd: targetSlot.end,
          status: "CONFIRMED",
          clientEmail: "rahul@example.com",
          createdAt: new Date(now.getTime() - 10 * 60 * 1000),
        },
      ];

      const hasConflict = checkBookingConflict({
        targetSlot,
        clientEmail: "rahul@example.com",
        existingBookings,
        now,
      });

      assert.strictEqual(hasConflict, true, "Confirmed booking must block all subsequent requests");
    });
  });
});
