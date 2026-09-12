import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PayoutStatus } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0 && adminUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reference, method, executeRazorpayX } = body;

    const creator = await prisma.creatorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
          include: { payment: true },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const now = new Date();

    // Eligible payments: completed sessions where payoutStatus is NOT_PAID_OUT
    const eligiblePayments = creator.bookings
      .filter((b) => {
        const isFinished = b.status === "COMPLETED" || new Date(b.scheduledEnd) <= now;
        return (
          isFinished &&
          b.payment &&
          b.payment.status === "CAPTURED" &&
          b.payment.payoutStatus === "NOT_PAID_OUT"
        );
      })
      .map((b) => b.payment!);

    if (eligiblePayments.length === 0) {
      return NextResponse.json(
        { error: "No completed sessions are currently pending payout for this creator." },
        { status: 400 }
      );
    }

    const totalEligiblePaise = eligiblePayments.reduce(
      (sum, p) => sum + p.creatorPayoutPaise,
      0
    );

    const balanceAdjustmentPaise = creator.balanceAdjustmentPaise || 0;
    const netPayoutPaise = Math.max(0, totalEligiblePaise + balanceAdjustmentPaise);

    let payoutReference = reference?.trim() || `PAYOUT_${Date.now()}`;
    let razorpayxPayoutId: string | null = null;
    let usedMethod = method || creator.payoutMethod || "manual";

    // Optional RazorpayX direct payout integration if keys and virtual account exist
    if (executeRazorpayX && process.env.RAZORPAYX_ACCOUNT_NUMBER && process.env.RAZORPAY_KEY_SECRET) {
      try {
        let payoutDetailsObj: any = null;
        if (creator.payoutDetails) {
          payoutDetailsObj = JSON.parse(creator.payoutDetails);
        }

        const authHeader = `Basic ${Buffer.from(
          `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`;

        // Prepare destination fund_account payload
        const fundAccountPayload: any = {
          account_type: payoutDetailsObj?.type === "upi" ? "vpa" : "bank_account",
        };

        if (payoutDetailsObj?.type === "upi" && payoutDetailsObj?.upiId) {
          fundAccountPayload.vpa = { address: payoutDetailsObj.upiId };
        } else if (payoutDetailsObj?.bankAccount && payoutDetailsObj?.ifsc) {
          fundAccountPayload.bank_account = {
            name: payoutDetailsObj.accountHolderName || creator.user.name,
            ifsc: payoutDetailsObj.ifsc,
            account_number: payoutDetailsObj.bankAccount,
          };
        }

        // Call RazorpayX Payouts API
        const rzpResponse = await fetch("https://api.razorpay.com/v1/payouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
            amount: netPayoutPaise,
            currency: "INR",
            mode: payoutDetailsObj?.type === "upi" ? "UPI" : "IMPS",
            purpose: "payout",
            fund_account: fundAccountPayload,
            queue_if_low_balance: true,
            reference_id: `sb_${creator.slug}_${Date.now().toString().slice(-6)}`,
            narration: `SessionBook Payout to ${creator.user.name.slice(0, 15)}`,
          }),
        });

        if (rzpResponse.ok) {
          const rzpData = await rzpResponse.json();
          razorpayxPayoutId = rzpData.id;
          payoutReference = `RazorpayX: ${rzpData.id}`;
          usedMethod = "razorpayx";
        } else {
          const errText = await rzpResponse.text();
          console.warn("RazorpayX direct payout response note:", errText);
        }
      } catch (rzpErr: any) {
        console.warn("RazorpayX call fallback:", rzpErr.message);
      }
    }

    const paymentIds = eligiblePayments.map((p) => p.id);

    // Update all payments to MANUALLY_PAID and reset/offset any negative fee adjustment
    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { id: { in: paymentIds } },
        data: {
          payoutStatus: PayoutStatus.MANUALLY_PAID,
        },
      });

      // If there was a negative adjustment, it is now satisfied by this payout
      if (balanceAdjustmentPaise < 0) {
        await tx.creatorProfile.update({
          where: { id: creator.id },
          data: {
            balanceAdjustmentPaise: 0,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully disbursed ₹${(netPayoutPaise / 100).toLocaleString("en-IN")} to ${creator.user.name}.`,
      creatorName: creator.user.name,
      disbursedPaise: netPayoutPaise,
      disbursedRupees: netPayoutPaise / 100,
      sessionsCount: eligiblePayments.length,
      reference: payoutReference,
      razorpayxPayoutId,
      method: usedMethod,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("POST /api/admin/creators/[id]/payout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
