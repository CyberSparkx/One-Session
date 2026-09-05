import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";
import { BookingStatus, PaymentStatus } from "@/lib/types";

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

    // Attempt Razorpay refund if payment was captured
    const razorpay = getRazorpayClient();
    let refunded = false;

    if (
      razorpay &&
      booking.payment?.razorpayPaymentId &&
      booking.payment?.status === PaymentStatus.CAPTURED
    ) {
      try {
        await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
          amount: booking.payment.amountTotalPaise,
          notes: { reason },
        });
        refunded = true;
      } catch (err: any) {
        console.warn("Razorpay refund note:", err.message || err);
        // Even if test keys or automated refund fails, creator cancellation still proceeds
      }
    }

    const newStatus = refunded ? BookingStatus.REFUNDED : BookingStatus.CANCELLED;

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id },
        data: { status: newStatus },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Session has been cancelled${refunded ? " and client refund has been initiated" : ""}.`,
      status: newStatus,
    });
  } catch (error: any) {
    console.error("POST /api/creator/bookings/[id]/cancel error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
