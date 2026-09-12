import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sendBookingCancellationEmail } from "../lib/email.ts";
import type { BookingCancellationEmailData } from "../lib/email.ts";

describe("Booking Cancellation Email Notifications", () => {
  it("should process CLIENT cancellation email payload with user reason and refund details", async () => {
    const payload: BookingCancellationEmailData = {
      bookingId: "test-booking-123",
      sessionTitle: "30-Minute Consultation",
      scheduledStart: new Date(Date.now() + 86400000).toISOString(),
      clientName: "Rahul Sharma",
      clientEmail: "rahul@example.com",
      creatorName: "Naren Roy",
      creatorEmail: "naren@example.com",
      reason: "Unexpected schedule conflict at work",
      refundType: "FULL",
      refundAmountPaise: 150000,
      cancelledBy: "CLIENT",
    };

    // Should run simulation / send without throwing errors
    await assert.doesNotReject(async () => {
      await sendBookingCancellationEmail(payload);
    });
  });

  it("should process CREATOR cancellation email payload with creator reason", async () => {
    const payload: BookingCancellationEmailData = {
      bookingId: "test-booking-456",
      sessionTitle: "60-Minute Strategy Call",
      scheduledStart: new Date(Date.now() + 172800000).toISOString(),
      clientName: "Priya Patel",
      clientEmail: "priya@example.com",
      creatorName: "Naren Roy",
      creatorEmail: "naren@example.com",
      reason: "Doctor appointment conflict",
      refundType: "FULL",
      refundAmountPaise: 300000,
      cancelledBy: "CREATOR",
    };

    await assert.doesNotReject(async () => {
      await sendBookingCancellationEmail(payload);
    });
  });

  it("should handle unpaid/free sessions with NONE refund type gracefully", async () => {
    const payload: BookingCancellationEmailData = {
      bookingId: "test-booking-789",
      sessionTitle: "Free 15-Minute Intro",
      scheduledStart: new Date(Date.now() + 3600000).toISOString(),
      clientName: "Amit Verma",
      clientEmail: "amit@example.com",
      creatorName: "Naren Roy",
      creatorEmail: "naren@example.com",
      reason: "No longer needed",
      refundType: "NONE",
      refundAmountPaise: 0,
      cancelledBy: "CLIENT",
    };

    await assert.doesNotReject(async () => {
      await sendBookingCancellationEmail(payload);
    });
  });
});

describe("Google Calendar Event Deletion and Token Refresh", () => {
  it("should return false gracefully when no access token or refresh token is present", async () => {
    const { deleteGoogleCalendarEvent } = await import("../lib/googleCalendar.ts");
    const result = await deleteGoogleCalendarEvent({
      scheduledStart: new Date().toISOString(),
      scheduledEnd: new Date(Date.now() + 1800000).toISOString(),
      clientName: "Non-existent Client",
      clientEmail: "none@example.com",
    });

    assert.equal(result, false);
  });

  it("should return null for fresh access token when no refresh token is configured", async () => {
    const { getFreshGoogleAccessToken } = await import("../lib/googleCalendar.ts");
    const token = await getFreshGoogleAccessToken({
      googleAccessToken: null,
      googleRefreshToken: null,
    });

    assert.equal(token, null);
  });
});

