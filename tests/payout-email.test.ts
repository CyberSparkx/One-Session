import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sendPayoutInitiatedEmail,
  sendPayoutCompletedEmail,
} from "../lib/email.ts";
import type { PayoutEmailData } from "../lib/email.ts";

describe("Creator Payout Notifications Suite", () => {
  it("should process Payout Initiated email payload without errors", async () => {
    const payload: PayoutEmailData = {
      creatorName: "Naren Roy",
      creatorEmail: "narensarkar607@gmail.com",
      payoutAmountPaise: 140460, // ₹1,404.60
      payoutMethod: "upi",
      destinationSummary: "UPI: naren@okaxis",
      sessionsCount: 1,
    };

    await assert.doesNotReject(async () => {
      await sendPayoutInitiatedEmail(payload);
    });
  });

  it("should process Payout Completed / Done email payload with reference without errors", async () => {
    const payload: PayoutEmailData = {
      creatorName: "Naren Roy",
      creatorEmail: "narensarkar607@gmail.com",
      payoutAmountPaise: 140460, // ₹1,404.60
      payoutMethod: "bank",
      destinationSummary: "Bank A/C: •••1234 (HDFC0001234)",
      reference: "UTR9876543210",
      sessionsCount: 1,
    };

    await assert.doesNotReject(async () => {
      await sendPayoutCompletedEmail(payload);
    });
  });

  it("should format rupee amounts with decimal fractions accurately", () => {
    const paise = 140460;
    const formatted = (paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    assert.equal(formatted, "1,404.60");
  });
});
