import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CancelBookingSchema } from "@/lib/validations";
import { getRazorpayClient } from "@/lib/razorpay";
import { BookingStatus, PaymentStatus } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const result = CancelBookingSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cancelToken, reason } = result.data;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.cancelToken !== cancelToken) {
      return NextResponse.json(
        { error: "Invalid cancellation token. You do not have permission to cancel this booking." },
        { status: 403 }
      );
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      return NextResponse.json(
        { error: "This booking has already been cancelled" },
        { status: 400 }
      );
    }

    // Process refund if payment was captured and razorpay is configured
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
          notes: { reason: reason || "Client cancelled" },
        });
        refunded = true;
      } catch (err) {
        console.error("Razorpay refund error:", err);
      }
    }

    // Update booking and payment statuses in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id },
        data: {
          status: refunded ? BookingStatus.REFUNDED : BookingStatus.CANCELLED,
        },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: refunded ? PaymentStatus.REFUNDED : booking.payment.status,
          },
        });
      }

      return b;
    });

    return NextResponse.json({
      message: "Booking successfully cancelled",
      status: updated.status,
      refunded,
    });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/cancel error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
