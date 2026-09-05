import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CreateBookingSchema,
  CancelBookingSchema,
  SessionTypeSchema,
  CreatorProfileSchema,
  AvailabilityRuleSchema,
} from "../lib/validations.ts";

describe("Input Validation with Zod (AGENTS.md Rule #5)", () => {
  describe("CreateBookingSchema", () => {
    const validBooking = {
      sessionTypeId: "6a9c580b9bb03b1bb009df4a",
      scheduledStart: "2026-09-09T04:30:00.000Z",
      clientName: "Aarav Gupta",
      clientEmail: "aarav@example.com",
      clientPhone: "+919876543210",
      notes: "Looking forward to the consultation",
    };

    it("should accept valid booking input", () => {
      const result = CreateBookingSchema.safeParse(validBooking);
      assert.strictEqual(result.success, true);
    });

    it("should reject invalid email", () => {
      const result = CreateBookingSchema.safeParse({
        ...validBooking,
        clientEmail: "not-an-email",
      });
      assert.strictEqual(result.success, false);
      if (!result.success) {
        assert.ok(result.error.flatten().fieldErrors.clientEmail);
      }
    });

    it("should reject missing or too short client name", () => {
      const result = CreateBookingSchema.safeParse({
        ...validBooking,
        clientName: "A",
      });
      assert.strictEqual(result.success, false);
    });

    it("should reject invalid date format (non-ISO string)", () => {
      const result = CreateBookingSchema.safeParse({
        ...validBooking,
        scheduledStart: "tomorrow at 10am",
      });
      assert.strictEqual(result.success, false);
    });

    it("should reject phone number shorter than 5 characters", () => {
      const result = CreateBookingSchema.safeParse({
        ...validBooking,
        clientPhone: "123",
      });
      assert.strictEqual(result.success, false);
    });

    it("should accept optional empty notes", () => {
      const result = CreateBookingSchema.safeParse({
        ...validBooking,
        notes: undefined,
      });
      assert.strictEqual(result.success, true);
    });
  });

  describe("SessionTypeSchema", () => {
    it("should validate a standard paid session", () => {
      const result = SessionTypeSchema.safeParse({
        title: "30-Min Mentorship Call",
        description: "1:1 Strategy session",
        durationMinutes: 30,
        priceInPaise: 150000,
        bufferBeforeMin: 0,
        bufferAfterMin: 15,
        isActive: true,
      });
      assert.strictEqual(result.success, true);
    });

    it("should reject negative prices", () => {
      const result = SessionTypeSchema.safeParse({
        title: "Invalid Price Session",
        durationMinutes: 30,
        priceInPaise: -500,
      });
      assert.strictEqual(result.success, false);
    });

    it("should reject 0 or negative duration", () => {
      const result = SessionTypeSchema.safeParse({
        title: "Zero Minute Session",
        durationMinutes: 0,
        priceInPaise: 10000,
      });
      assert.strictEqual(result.success, false);
    });

    it("should reject non-integer prices (floats)", () => {
      const result = SessionTypeSchema.safeParse({
        title: "Float Price Session",
        durationMinutes: 30,
        priceInPaise: 1500.5,
      });
      assert.strictEqual(result.success, false, "Floats must be rejected per Rule #3");
    });
  });

  describe("CreatorProfileSchema", () => {
    it("should validate a valid creator slug and profile", () => {
      const result = CreatorProfileSchema.safeParse({
        name: "Naren Roy",
        slug: "naren-roy-tech",
        timezone: "Asia/Kolkata",
        isPublished: true,
      });
      assert.strictEqual(result.success, true);
    });

    it("should reject slugs with capital letters or special symbols", () => {
      const result = CreatorProfileSchema.safeParse({
        name: "Naren Roy",
        slug: "Naren_Roy@123!",
        timezone: "Asia/Kolkata",
      });
      assert.strictEqual(result.success, false);
    });

    it("should reject slug shorter than 3 characters", () => {
      const result = CreatorProfileSchema.safeParse({
        name: "Naren Roy",
        slug: "nr",
        timezone: "Asia/Kolkata",
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe("AvailabilityRuleSchema", () => {
    it("should accept valid 24h format times and day 0-6", () => {
      const result = AvailabilityRuleSchema.safeParse({
        dayOfWeek: 1, // Monday
        startTime: "09:30",
        endTime: "18:00",
      });
      assert.strictEqual(result.success, true);
    });

    it("should reject dayOfWeek outside 0-6", () => {
      const result = AvailabilityRuleSchema.safeParse({
        dayOfWeek: 7,
        startTime: "10:00",
        endTime: "18:00",
      });
      assert.strictEqual(result.success, false);
    });

    it("should reject invalid time formats", () => {
      assert.strictEqual(
        AvailabilityRuleSchema.safeParse({ dayOfWeek: 1, startTime: "9am", endTime: "5pm" }).success,
        false
      );
      assert.strictEqual(
        AvailabilityRuleSchema.safeParse({ dayOfWeek: 1, startTime: "25:00", endTime: "18:00" }).success,
        false
      );
    });
  });

  describe("CancelBookingSchema", () => {
    it("should accept valid cancelToken", () => {
      const result = CancelBookingSchema.safeParse({
        cancelToken: "123e4567-e89b-12d3-a456-426614174000",
        reason: "Scheduling conflict",
      });
      assert.strictEqual(result.success, true);
    });

    it("should reject empty cancelToken", () => {
      const result = CancelBookingSchema.safeParse({
        cancelToken: "",
      });
      assert.strictEqual(result.success, false);
    });
  });
});
