import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { BookingStatus, PaymentStatus, PayoutStatus } from "@/lib/types";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { createGoogleCalendarEvent, getFreshGoogleAccessToken } from "@/lib/googleCalendar";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!bookingId || !/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      return NextResponse.json({ error: "Invalid or missing bookingId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        sessionType: true,
        creator: {
          include: {
            user: { select: { id: true, name: true, email: true, timezone: true, googleAccessToken: true, googleRefreshToken: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // If Razorpay secret is present and signature is provided, verify it
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const isValid = verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        secret: keySecret,
      });

      if (!isValid) {
        console.error("Payment signature verification mismatch");
        return NextResponse.json(
          { error: "Payment signature verification failed. Invalid transaction." },
          { status: 400 }
        );
      }
    }

    // Recompute 4% platform fee, 2% gateway fee, 18% GST on gateway, and creator payout
    const priceInPaise = booking.sessionType.priceInPaise;
    const platformFeePaise = Math.round(priceInPaise * 0.04);
    const gatewayFeePaise = Math.round(priceInPaise * 0.02);
    const gatewayGstPaise = Math.round(gatewayFeePaise * 0.18);
    const creatorPayoutPaise = priceInPaise - platformFeePaise - (gatewayFeePaise + gatewayGstPaise);

    // Flip booking to CONFIRMED and payment to CAPTURED
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.CAPTURED,
            razorpayPaymentId: razorpayPaymentId || booking.payment.razorpayPaymentId || `pay_sim_${Date.now()}`,
            platformFeePaise,
            creatorPayoutPaise,
            payoutStatus: PayoutStatus.NOT_PAID_OUT,
          },
        });
      }
    });

    // Send confirmation emails with calendar .ics invites to both client and creator
    try {
      await sendBookingConfirmationEmail({
        bookingId: booking.id,
        sessionTitle: booking.sessionType.title,
        scheduledStart: booking.scheduledStart,
        scheduledEnd: booking.scheduledEnd,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        creatorName: booking.creator.user.name,
        creatorEmail: booking.creator.user.email,
        creatorTimezone: booking.creator.user.timezone,
        priceInPaise,
      });
    } catch (emailErr) {
      console.error("Email notification error in verify:", emailErr);
    }

    // Automatically sync to Google Calendar if creator signed in with Google
    const creatorUser = (booking as any)?.creator?.user;
    if (creatorUser?.googleAccessToken || creatorUser?.googleRefreshToken) {
      try {
        const freshToken = await getFreshGoogleAccessToken({
          id: creatorUser.id,
          googleAccessToken: creatorUser.googleAccessToken,
          googleRefreshToken: creatorUser.googleRefreshToken,
        });

        if (freshToken) {
          await createGoogleCalendarEvent({
            accessToken: freshToken,
            sessionTitle: booking.sessionType.title,
            scheduledStart: booking.scheduledStart,
            scheduledEnd: booking.scheduledEnd,
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            clientPhone: booking.clientPhone,
            creatorName: creatorUser.name,
            creatorEmail: creatorUser.email,
          });
        }
      } catch (gcalErr) {
        console.warn("Google Calendar sync error:", gcalErr);
      }
    }

    return NextResponse.json({ success: true, message: "Booking confirmed successfully" });
  } catch (error: any) {
    console.error("POST /api/bookings/verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
