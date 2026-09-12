import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Live API Endpoints & Smoke Tests", async () => {
  const BASE_URL = process.env.TEST_API_URL || "http://localhost:3000";

  // Check server reachability
  let isServerReachable = false;
  try {
    const healthRes = await fetch(`${BASE_URL}/api/public/naren-roy`, { method: "HEAD" });
    if (healthRes.status < 500) {
      isServerReachable = true;
    }
  } catch {
    isServerReachable = false;
  }

  it("should fetch public creator profile", async (t) => {
    if (!isServerReachable) {
      t.skip("Local dev server is not running on port 3000; skipping live HTTP test");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/public/naren-roy`);
    assert.strictEqual(res.status, 200, "Profile endpoint must return HTTP 200");

    const data = await res.json();
    assert.strictEqual(data.slug, "naren-roy");
    assert.ok(Array.isArray(data.sessionTypes), "Profile must include sessionTypes array");
  });

  it("should fetch available slots for active session type", async (t) => {
    if (!isServerReachable) {
      t.skip("Local dev server is not running on port 3000; skipping live HTTP test");
      return;
    }

    const profileRes = await fetch(`${BASE_URL}/api/public/naren-roy`);
    const profile = await profileRes.json();
    const sessionTypeId = profile.sessionTypes?.[0]?.id;

    if (!sessionTypeId) {
      t.skip("No active session types found for naren-roy");
      return;
    }

    const res = await fetch(
      `${BASE_URL}/api/public/naren-roy/slots?sessionTypeId=${sessionTypeId}&date=2026-09-09`
    );
    assert.strictEqual(res.status, 200, "Slots endpoint must return HTTP 200");

    const data = await res.json();
    assert.ok(Array.isArray(data.slots), "Response must contain slots array");
  });

  it("should reject POST /api/bookings with 400 when body fails Zod validation", async (t) => {
    if (!isServerReachable) {
      t.skip("Local dev server is not running on port 3000; skipping live HTTP test");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionTypeId: "invalid_id",
        // Missing required clientName, clientEmail, scheduledStart
      }),
    });

    assert.strictEqual(res.status, 400, "Invalid payload must return HTTP 400");
    const data = await res.json();
    assert.strictEqual(data.error, "Validation failed");
    assert.ok(data.details, "Error must contain validation details");
  });

  it("should reject POST /api/bookings/verify with 400 when payment signature is tampered", async (t) => {
    if (!isServerReachable) {
      t.skip("Local dev server is not running on port 3000; skipping live HTTP test");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/bookings/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: "test_booking_id",
        razorpayOrderId: "order_mock_123",
        razorpayPaymentId: "pay_mock_123",
        razorpaySignature: "invalid_tampered_signature_string",
      }),
    });

    assert.strictEqual(res.status, 400, "Tampered signature must return HTTP 400");
  });
});
