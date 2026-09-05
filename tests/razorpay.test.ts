import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyPaymentSignature, verifyWebhookSignature } from "../lib/razorpay.ts";

describe("Razorpay Signature Security (AGENTS.md Rule #3)", () => {
  const secret = "test_razorpay_secret_key_987654";
  const orderId = "order_test_123456";
  const paymentId = "pay_test_789012";

  // Generate authentic HMAC-SHA256 signature
  const expectedPayload = `${orderId}|${paymentId}`;
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(expectedPayload)
    .digest("hex");

  it("should successfully verify a genuine payment signature", () => {
    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: validSignature,
      secret,
    });
    assert.strictEqual(isValid, true, "Authentic signature must verify as valid");
  });

  it("should reject a tampered or forged payment signature", () => {
    const tamperedSignature = validSignature.substring(0, validSignature.length - 2) + "ab";
    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: tamperedSignature,
      secret,
    });
    assert.strictEqual(isValid, false, "Tampered signature must be rejected");
  });

  it("should reject a signature generated with a wrong secret", () => {
    const wrongSignature = crypto
      .createHmac("sha256", "wrong_secret_attacker")
      .update(expectedPayload)
      .digest("hex");

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature: wrongSignature,
      secret,
    });
    assert.strictEqual(isValid, false, "Signature with wrong secret must be rejected");
  });

  it("should reject when orderId is mismatched", () => {
    const isValid = verifyPaymentSignature({
      orderId: "order_different_999",
      paymentId,
      signature: validSignature,
      secret,
    });
    assert.strictEqual(isValid, false, "Mismatched orderId must be rejected");
  });

  it("should reject when paymentId is mismatched", () => {
    const isValid = verifyPaymentSignature({
      orderId,
      paymentId: "pay_different_999",
      signature: validSignature,
      secret,
    });
    assert.strictEqual(isValid, false, "Mismatched paymentId must be rejected");
  });

  it("should verify authentic Razorpay webhook signatures using timing-safe comparison", () => {
    const webhookSecret = "webhook_secret_xyz123";
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, order_id: orderId } } },
    });

    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isValid = verifyWebhookSignature(rawBody, validWebhookSig, webhookSecret);
    assert.strictEqual(isValid, true, "Authentic webhook signature must be valid");

    const isFakeValid = verifyWebhookSignature(rawBody, "fake_sig_123", webhookSecret);
    assert.strictEqual(isFakeValid, false, "Forged webhook signature must be rejected");
  });

  it("should safely reject missing webhook signature or secret", () => {
    assert.strictEqual(verifyWebhookSignature("body", "", "secret"), false);
    assert.strictEqual(verifyWebhookSignature("body", "sig", ""), false);
  });
});
