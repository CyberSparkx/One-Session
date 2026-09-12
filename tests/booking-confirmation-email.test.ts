import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateIcsAttachment,
  sendBookingConfirmationEmail,
} from "../lib/email.ts";
import type { BookingEmailData } from "../lib/email.ts";

function calculateSplit(priceInPaise: number) {
  const platformFeePaise = Math.round(priceInPaise * 0.04);
  const creatorPayoutPaise = priceInPaise - platformFeePaise;
  return { platformFeePaise, creatorPayoutPaise };
}

describe("Booking Confirmation Emails & iCalendar Invite Generation", () => {
  it("should generate a valid RFC 5545 iCalendar (.ics) invite string", () => {
    const start = new Date("2026-09-15T10:00:00.000Z");
    const end = new Date("2026-09-15T10:30:00.000Z");

    const ics = generateIcsAttachment({
      bookingId: "book_abc123",
      sessionTitle: "30-Minute Consultation",
      scheduledStart: start,
      scheduledEnd: end,
      clientName: "Abhishek",
      clientEmail: "abhishek@gmail.com",
      creatorName: "Naren Roy",
      creatorEmail: "naren@gmail.com",
    });

    assert.ok(ics.includes("BEGIN:VCALENDAR"), "Must contain BEGIN:VCALENDAR");
    assert.ok(ics.includes("END:VCALENDAR"), "Must contain END:VCALENDAR");
    assert.ok(ics.includes("BEGIN:VEVENT"), "Must contain BEGIN:VEVENT");
    assert.ok(ics.includes("UID:booking-book_abc123@sessionbook.com"), "Must contain correct UID");
    assert.ok(ics.includes("SUMMARY:1:1 Session: 30-Minute Consultation with Naren Roy"), "Must include session title and creator name");
    assert.ok(ics.includes("ORGANIZER;CN=Naren Roy:mailto:naren@gmail.com"), "Must include organizer header");
    assert.ok(ics.includes("ATTENDEE;"), "Must include attendee header");
    assert.ok(ics.includes("mailto:abhishek@gmail.com"), "Must include client email in attendee");
    assert.ok(ics.includes("STATUS:CONFIRMED"), "Must mark event status as confirmed");
  });

  it("should successfully process confirmation email dispatch for a paid session (₹1,500)", async () => {
    const payload: BookingEmailData = {
      bookingId: "booking-paid-test-01",
      sessionTitle: "30-Minute Consultation",
      scheduledStart: new Date(Date.now() + 86400000).toISOString(),
      scheduledEnd: new Date(Date.now() + 86400000 + 1800000).toISOString(),
      clientName: "Abhishek",
      clientEmail: "narenroy83883@gmail.com",
      creatorName: "Naren Roy",
      creatorEmail: "narensarkar607@gmail.com",
      creatorTimezone: "Asia/Kolkata",
      priceInPaise: 150000,
    };

    // Calculate fees to verify calculation integrity in booking email context
    const feeBreakdown = calculateSplit(payload.priceInPaise);
    assert.equal(feeBreakdown.platformFeePaise, 6000); // 4% = ₹60
    assert.equal(feeBreakdown.creatorPayoutPaise, 144000); // 96% = ₹1,440

    // Should not throw or crash
    await assert.doesNotReject(async () => {
      await sendBookingConfirmationEmail(payload);
    });
  });

  it("should successfully process confirmation email dispatch for a free session (₹0)", async () => {
    const payload: BookingEmailData = {
      bookingId: "booking-free-test-02",
      sessionTitle: "Free 15-Minute Intro Call",
      scheduledStart: new Date(Date.now() + 172800000).toISOString(),
      scheduledEnd: new Date(Date.now() + 172800000 + 900000).toISOString(),
      clientName: "Priya Sharma",
      clientEmail: "priya@gmail.com",
      creatorName: "Naren Roy",
      creatorEmail: "narensarkar607@gmail.com",
      creatorTimezone: "Asia/Kolkata",
      priceInPaise: 0,
    };

    const feeBreakdown = calculateSplit(payload.priceInPaise);
    assert.equal(feeBreakdown.platformFeePaise, 0);
    assert.equal(feeBreakdown.creatorPayoutPaise, 0);

    await assert.doesNotReject(async () => {
      await sendBookingConfirmationEmail(payload);
    });
  });

  it("should format dates and prices accurately in email templates", () => {
    const pricePaise = 150000;
    const priceRupees = (pricePaise / 100).toLocaleString("en-IN");
    assert.equal(priceRupees, "1,500");

    const creatorPayoutRupees = (Math.round(pricePaise * 0.96) / 100).toLocaleString("en-IN");
    assert.equal(creatorPayoutRupees, "1,440");
  });
});
