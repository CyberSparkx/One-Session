import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Helper to compute platform fee and creator payout per project specs:
 * Platform fee is strictly 4% (rounded), rest 96% is creator payout.
 * Stored in smallest currency unit (paise, integer).
 */
function calculateSplit(priceInPaise: number) {
  const platformFeePaise = Math.round(priceInPaise * 0.04);
  const creatorPayoutPaise = priceInPaise - platformFeePaise;
  return { platformFeePaise, creatorPayoutPaise };
}

/**
 * Helper to calculate refund amounts and creator debits based on refund type:
 * - PARTIAL: client gets 96% (creator portion), platform keeps 4%, creator fee debit = 0
 * - FULL: client gets 100%, platform retains 4% by debiting creator balance (creator fee debit = 4%)
 */
function calculateRefund(
  amountTotalPaise: number,
  platformFeePaise: number,
  creatorPayoutPaise: number,
  refundType: "FULL" | "PARTIAL"
) {
  if (refundType === "FULL") {
    return {
      clientRefundPaise: amountTotalPaise,
      creatorFeeDebitPaise: platformFeePaise,
    };
  } else {
    return {
      clientRefundPaise: creatorPayoutPaise,
      creatorFeeDebitPaise: 0,
    };
  }
}

describe("Pricing & Commission Calculations", () => {
  it("should calculate exact 4% platform fee and 96% creator payout on ₹1,500 (150,000 paise)", () => {
    const price = 150000;
    const { platformFeePaise, creatorPayoutPaise } = calculateSplit(price);

    assert.strictEqual(platformFeePaise, 6000, "Platform fee should be 6,000 paise (₹60)");
    assert.strictEqual(creatorPayoutPaise, 144000, "Creator payout should be 144,000 paise (₹1,440)");
    assert.strictEqual(platformFeePaise + creatorPayoutPaise, price, "Sum must equal total price");
    assert.strictEqual(Number.isInteger(platformFeePaise), true, "Platform fee must be an integer");
    assert.strictEqual(Number.isInteger(creatorPayoutPaise), true, "Creator payout must be an integer");
  });

  it("should calculate exact 4% platform fee on ₹500 (50,000 paise)", () => {
    const price = 50000;
    const { platformFeePaise, creatorPayoutPaise } = calculateSplit(price);

    assert.strictEqual(platformFeePaise, 2000, "Platform fee should be 2,000 paise (₹20)");
    assert.strictEqual(creatorPayoutPaise, 48000, "Creator payout should be 48,000 paise (₹480)");
    assert.strictEqual(platformFeePaise + creatorPayoutPaise, price);
  });

  it("should calculate exact 4% platform fee on ₹3,000 (300,000 paise)", () => {
    const price = 300000;
    const { platformFeePaise, creatorPayoutPaise } = calculateSplit(price);

    assert.strictEqual(platformFeePaise, 12000, "Platform fee should be 12,000 paise (₹120)");
    assert.strictEqual(creatorPayoutPaise, 288000, "Creator payout should be 288,000 paise (₹2,880)");
    assert.strictEqual(platformFeePaise + creatorPayoutPaise, price);
  });

  it("should handle free sessions (0 paise) without errors or NaN", () => {
    const price = 0;
    const { platformFeePaise, creatorPayoutPaise } = calculateSplit(price);

    assert.strictEqual(platformFeePaise, 0);
    assert.strictEqual(creatorPayoutPaise, 0);
  });

  it("should round fractional paise cleanly to integer", () => {
    // 4% of 199 paise = 7.96 -> rounds to 8 paise
    const price = 199;
    const { platformFeePaise, creatorPayoutPaise } = calculateSplit(price);

    assert.strictEqual(platformFeePaise, 8);
    assert.strictEqual(creatorPayoutPaise, 191);
    assert.strictEqual(platformFeePaise + creatorPayoutPaise, price);
    assert.strictEqual(Number.isInteger(platformFeePaise), true);
  });
});

describe("Refund Calculations (Partial vs Full)", () => {
  const total = 150000; // ₹1,500
  const fee = 6000;     // ₹60 (4%)
  const payout = 144000;// ₹1,440 (96%)

  it("should handle PARTIAL refund: 96% to client, ₹0 debit from creator", () => {
    const { clientRefundPaise, creatorFeeDebitPaise } = calculateRefund(
      total,
      fee,
      payout,
      "PARTIAL"
    );

    assert.strictEqual(clientRefundPaise, 144000, "Client receives 96% of session price (₹1,440)");
    assert.strictEqual(creatorFeeDebitPaise, 0, "Creator pays ₹0 out of pocket");
  });

  it("should handle FULL refund: 100% to client, 4% debited from creator account", () => {
    const { clientRefundPaise, creatorFeeDebitPaise } = calculateRefund(
      total,
      fee,
      payout,
      "FULL"
    );

    assert.strictEqual(clientRefundPaise, 150000, "Client receives 100% of session price (₹1,500)");
    assert.strictEqual(creatorFeeDebitPaise, 6000, "Creator is debited 4% platform fee (₹60)");
  });

  it("should correctly calculate pending payout after negative balance adjustment", () => {
    const confirmedGrossPendingPaise = 288000; // ₹2,880 from other sessions
    const balanceAdjustmentPaise = -6000;      // -₹60 fee debit from prior full refund

    const netPendingPayoutPaise = Math.max(0, confirmedGrossPendingPaise + balanceAdjustmentPaise);
    assert.strictEqual(netPendingPayoutPaise, 282000, "Net payout should be ₹2,820 (₹2,880 - ₹60)");
  });
});
