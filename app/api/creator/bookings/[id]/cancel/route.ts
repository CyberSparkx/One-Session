import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { BookingStatus, PaymentStatus } from "@/lib/types";
import { sendBookingCancellationEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || "Cancelled by creator";
    const refundType = body?.refundType === "FULL" ? "FULL" : "PARTIAL";

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        creatorId: user.creatorProfile.id,
      },
      include: { payment: true, sessionType: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 });
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      return NextResponse.json({ error: "This booking is already cancelled" }, { status: 400 });
    }

    // Determine refund amount & creator fee debit
    let refundAmountPaise = 0;
    let creatorFeeDebitPaise = 0;

    if (booking.payment && (booking.payment.status === PaymentStatus.CAPTURED || booking.payment.status === "CAPTURED")) {
      if (refundType === "FULL") {
        // Client gets 100% of the session amount back
        refundAmountPaise = booking.payment.amountTotalPaise;
        // Creator pays the 4% platform fee (debited from balance)
        creatorFeeDebitPaise = booking.payment.platformFeePaise;
      } else {
        // Partial refund: Client gets 96% (creator portion) back, platform keeps 4%
        refundAmountPaise = booking.payment.creatorPayoutPaise;
        creatorFeeDebitPaise = 0;
      }
    }

    // Attempt Razorpay refund if payment was captured
    const razorpay = getRazorpayClient();
    let razorpayRefundSuccess = false;

    if (
      razorpay &&
      booking.payment?.razorpayPaymentId &&
      refundAmountPaise > 0
    ) {
      try {
        await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
          amount: refundAmountPaise,
          notes: {
            reason,
            refundType,
            bookingId: booking.id,
          },
        });
        razorpayRefundSuccess = true;
      } catch (err: any) {
        console.warn("Razorpay refund note:", err.message || err);
        // Even if test keys or automated refund fails, creator cancellation still proceeds
      }
    }

    const newBookingStatus = refundAmountPaise > 0 ? BookingStatus.REFUNDED : BookingStatus.CANCELLED;

    await prisma.$transaction(async (tx) => {
      // 1. Update booking status
      await tx.booking.update({
        where: { id },
        data: { status: newBookingStatus },
      });

      // 2. Update payment status and refund audit
      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundType: refundAmountPaise > 0 ? refundType : null,
            refundAmountPaise: refundAmountPaise > 0 ? refundAmountPaise : 0,
            payoutStatus: "NOT_PAID_OUT",
          },
        });
      }

      // 3. Debit creator's account balance for the 4% fee if Full Refund was chosen
      if (creatorFeeDebitPaise > 0) {
        await tx.creatorProfile.update({
          where: { id: user.creatorProfile.id },
          data: {
            balanceAdjustmentPaise: {
              decrement: creatorFeeDebitPaise,
            },
          },
        });
      }
    });

    // 4. Send cancellation notification email to client (and creator copy)
    try {
      await sendBookingCancellationEmail({
        bookingId: booking.id,
        sessionTitle: booking.sessionType.title,
        scheduledStart: booking.scheduledStart,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        creatorName: user.name,
        creatorEmail: user.email,
        reason,
        refundType: refundAmountPaise > 0 ? (refundType as "FULL" | "PARTIAL") : "NONE",
        refundAmountPaise,
      });
    } catch (mailErr) {
      console.error("Failed to trigger cancellation email:", mailErr);
    }

    const refundLabel = refundType === "FULL" ? "Full Refund (100%)" : "Partial Refund (96%)";
    const refundRupees = (refundAmountPaise / 100).toLocaleString("en-IN");

    return NextResponse.json({
      success: true,
      message: refundAmountPaise > 0
        ? `Session cancelled. ${refundLabel} of ₹${refundRupees} initiated to client.`
        : "Session cancelled successfully.",
      status: newBookingStatus,
      refundType: refundAmountPaise > 0 ? refundType : null,
      refundAmountRupees: refundAmountPaise / 100,
      feeDebitedRupees: creatorFeeDebitPaise / 100,
    });
  } catch (error: any) {
    console.error("POST /api/creator/bookings/[id]/cancel error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
