import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CancelBookingSchema } from "@/lib/validations";
import { getRazorpayClient } from "@/lib/razorpay";
import { BookingStatus, PaymentStatus } from "@/lib/types";
import { sendBookingCancellationEmail } from "@/lib/email";
import { deleteGoogleCalendarEvent } from "@/lib/googleCalendar";

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
      include: {
        payment: true,
        sessionType: true,
        creator: {
          include: {
            user: { select: { id: true, name: true, email: true, googleAccessToken: true, googleRefreshToken: true } },
          },
        },
      },
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
    const isPaid = booking.payment && (booking.payment.status === PaymentStatus.CAPTURED || booking.payment.status === "CAPTURED");
    const refundAmountPaise = isPaid ? booking.payment!.amountTotalPaise : 0;
    let refunded = false;

    if (
      razorpay &&
      booking.payment?.razorpayPaymentId &&
      isPaid
    ) {
      try {
        await razorpay.payments.refund(booking.payment.razorpayPaymentId, {
          amount: refundAmountPaise,
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
          status: isPaid ? BookingStatus.REFUNDED : BookingStatus.CANCELLED,
          cancellationReason: reason?.trim() || "Client requested cancellation",
          cancelledBy: "CLIENT",
        },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundType: "FULL",
            refundAmountPaise: refundAmountPaise,
          },
        });
      }

      return b;
    });

    // Send cancellation notifications to both the client and creator
    const cancellationReason = reason?.trim() || "Client requested cancellation";
    try {
      await sendBookingCancellationEmail({
        bookingId: booking.id,
        sessionTitle: booking.sessionType.title,
        scheduledStart: booking.scheduledStart,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        creatorName: booking.creator.user.name,
        creatorEmail: booking.creator.user.email,
        reason: cancellationReason,
        refundType: isPaid ? "FULL" : "NONE",
        refundAmountPaise: refundAmountPaise,
        cancelledBy: "CLIENT",
      });
    } catch (mailErr) {
      console.error("Failed to send booking cancellation email:", mailErr);
    }

    // Remove event from creator's Google Calendar (web and mobile/phone)
    const creatorUser = booking.creator?.user;
    if (creatorUser?.googleAccessToken || creatorUser?.googleRefreshToken) {
      try {
        await deleteGoogleCalendarEvent({
          userId: creatorUser.id,
          accessToken: creatorUser.googleAccessToken,
          refreshToken: creatorUser.googleRefreshToken,
          scheduledStart: booking.scheduledStart,
          scheduledEnd: booking.scheduledEnd,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          sessionTitle: booking.sessionType.title,
        });
      } catch (gcalErr) {
        console.warn("Failed to delete Google Calendar event upon client cancellation:", gcalErr);
      }
    }

    return NextResponse.json({
      message: "Booking successfully cancelled",
      status: updated.status,
      refunded: isPaid,
    });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/cancel error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
