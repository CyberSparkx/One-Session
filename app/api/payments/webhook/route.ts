import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { BookingStatus, PaymentStatus, PayoutStatus } from "@/lib/types";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { createGoogleCalendarEvent, getFreshGoogleAccessToken } from "@/lib/googleCalendar";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. In production, signature verification is strictly enforced
    if (webhookSecret) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("Razorpay webhook signature verification failed");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const event = payload.event;
    console.log(`Received Razorpay webhook event: ${event}`);

    // Handle payment.captured or order.paid
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        return NextResponse.json({ error: "Missing order_id in webhook" }, { status: 400 });
      }

      // Find the payment record in the platform ledger
      const paymentRecord = await prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
        include: {
          booking: {
            include: {
              sessionType: true,
              creator: {
                include: {
                  user: { select: { id: true, name: true, email: true, timezone: true, googleAccessToken: true, googleRefreshToken: true } },
                },
              },
            },
          },
        },
      });

      if (!paymentRecord) {
        console.warn(`Payment record for order ${orderId} not found in database`);
        return NextResponse.json({ message: "Order not found, ignored" }, { status: 200 });
      }

      // Idempotency: If already captured and booking confirmed, do not reprocess
      if (paymentRecord.status === PaymentStatus.CAPTURED) {
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // Compute 4% platform commission, 2% gateway fee, 18% GST on gateway fee, and creator net payout
      const amountPaise = paymentRecord.amountTotalPaise;
      const platformFeePaise = Math.round(amountPaise * 0.04);
      const gatewayFeePaise = Math.round(amountPaise * 0.02);
      const gatewayGstPaise = Math.round(gatewayFeePaise * 0.18);
      const creatorPayoutPaise = amountPaise - platformFeePaise - (gatewayFeePaise + gatewayGstPaise);

      // Update payment and booking statuses in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: PaymentStatus.CAPTURED,
            razorpayPaymentId: paymentId || paymentRecord.razorpayPaymentId,
            platformFeePaise,
            creatorPayoutPaise,
            payoutStatus: PayoutStatus.NOT_PAID_OUT, // Eligible for creator payout
          },
        });

        await tx.booking.update({
          where: { id: paymentRecord.bookingId },
          data: {
            status: BookingStatus.CONFIRMED,
          },
        });
      });

      // Send confirmation emails with calendar invite to client and creator
      const bookingRecord = (paymentRecord as any)?.booking;
      const creatorUser = bookingRecord?.creator?.user;

      try {
        await sendBookingConfirmationEmail({
          bookingId: bookingRecord.id,
          sessionTitle: bookingRecord.sessionType.title,
          scheduledStart: bookingRecord.scheduledStart,
          scheduledEnd: bookingRecord.scheduledEnd,
          clientName: bookingRecord.clientName,
          clientEmail: bookingRecord.clientEmail,
          creatorName: creatorUser.name,
          creatorEmail: creatorUser.email,
          creatorTimezone: creatorUser.timezone,
          priceInPaise: paymentRecord.amountTotalPaise,
        });
      } catch (emailErr) {
        console.error("Failed to send booking emails:", emailErr);
      }

      // Automatically sync to Google Calendar if creator signed in with Google
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
              sessionTitle: bookingRecord.sessionType.title,
              scheduledStart: bookingRecord.scheduledStart,
              scheduledEnd: bookingRecord.scheduledEnd,
              clientName: bookingRecord.clientName,
              clientEmail: bookingRecord.clientEmail,
              clientPhone: bookingRecord.clientPhone,
              creatorName: creatorUser.name,
              creatorEmail: creatorUser.email,
            });
          }
        } catch (gcalErr) {
          console.warn("Google Calendar sync error in webhook:", gcalErr);
        }
      }

      return NextResponse.json({ message: "Booking confirmed successfully" }, { status: 200 });
    }

    // Handle payment.failed
    if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;

      if (orderId) {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: orderId },
          data: { status: PaymentStatus.FAILED },
        });
      }

      return NextResponse.json({ message: "Payment failure recorded" }, { status: 200 });
    }

    // Handle refund.processed
    if (event === "refund.processed") {
      const paymentId = payload.payload?.payment?.entity?.id;
      if (paymentId) {
        const payment = await prisma.payment.findFirst({
          where: { razorpayPaymentId: paymentId },
        });

        if (payment) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.REFUNDED },
            }),
            prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: BookingStatus.REFUNDED },
            }),
          ]);
        }
      }

      return NextResponse.json({ message: "Refund recorded" }, { status: 200 });
    }

    return NextResponse.json({ message: `Unhandled event ${event}` }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
