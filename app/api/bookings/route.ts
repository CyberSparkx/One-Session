import { NextResponse } from "next/server";
import { addMinutes, areIntervalsOverlapping } from "date-fns";
import prisma from "@/lib/prisma";
import { CreateBookingSchema } from "@/lib/validations";
import { getRazorpayClient } from "@/lib/razorpay";
import { BookingStatus, PaymentStatus, PayoutStatus } from "@/lib/types";
import { sendBookingConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = CreateBookingSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      sessionTypeId,
      scheduledStart,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = result.data;

    // 1. Fetch SessionType from DB to recompute price server-side (Never trust client price!)
    const sessionType = await prisma.sessionType.findUnique({
      where: { id: sessionTypeId },
      include: {
        creator: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!sessionType || !sessionType.isActive) {
      return NextResponse.json(
        { error: "This session type is not active or no longer exists" },
        { status: 404 }
      );
    }

    const priceInPaise = sessionType.priceInPaise;
    const durationMinutes = sessionType.durationMinutes;
    const startDate = new Date(scheduledStart);
    const endDate = addMinutes(startDate, durationMinutes);

    // 2. Conflict check: make sure no confirmed booking exists and no pending booking is < 10 min old
    const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000);
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        creatorId: sessionType.creatorId,
        OR: [
          { status: BookingStatus.CONFIRMED },
          {
            status: BookingStatus.PENDING_PAYMENT,
            createdAt: { gte: TEN_MINUTES_AGO },
          },
        ],
      },
    });

    const normalizedEmail = clientEmail.toLowerCase().trim();

    const isOverlappingWithOther = conflictingBookings.some((b) => {
      const isOverlap = areIntervalsOverlapping(
        { start: startDate, end: endDate },
        { start: new Date(b.scheduledStart), end: new Date(b.scheduledEnd) }
      );
      if (!isOverlap) return false;

      // Confirmed bookings always block
      if (b.status === BookingStatus.CONFIRMED) return true;

      // If pending payment is by the same client email, allow them to re-attempt payment!
      if (b.clientEmail.toLowerCase().trim() === normalizedEmail) {
        return false;
      }
      return true;
    });

    if (isOverlappingWithOther) {
      return NextResponse.json(
        { error: "This time slot was just taken. Please select another slot." },
        { status: 409 }
      );
    }

    // Cancel any prior abandoned PENDING_PAYMENT bookings for this slot by this same client
    await prisma.booking.updateMany({
      where: {
        creatorId: sessionType.creatorId,
        clientEmail: normalizedEmail,
        status: BookingStatus.PENDING_PAYMENT,
        scheduledStart: startDate,
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    // 3. Platform 4% fee, 2% gateway fee, 18% GST on gateway fee, and creator net payout
    const platformFeePaise = Math.round(priceInPaise * 0.04);
    const gatewayFeePaise = Math.round(priceInPaise * 0.02);
    const gatewayGstPaise = Math.round(gatewayFeePaise * 0.18);
    const creatorPayoutPaise = priceInPaise - platformFeePaise - (gatewayFeePaise + gatewayGstPaise);

    // 4. Create Razorpay order if Razorpay is configured
    const razorpay = getRazorpayClient();
    let razorpayOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (razorpay && priceInPaise > 0) {
      try {
        const order = await razorpay.orders.create({
          amount: priceInPaise,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            sessionTypeId,
            clientEmail,
          },
        });
        razorpayOrderId = order.id;
      } catch (err: any) {
        console.error("Razorpay order creation failed:", err);
        // If test API keys fail or offline, keep test order id for simulation
      }
    }

    // 5. Create Booking and Payment records in database
    const booking = await prisma.booking.create({
      data: {
        sessionTypeId: sessionType.id,
        creatorId: sessionType.creatorId,
        clientName,
        clientEmail: clientEmail.toLowerCase().trim(),
        clientPhone,
        notes: notes || null,
        scheduledStart: startDate,
        scheduledEnd: endDate,
        status: priceInPaise === 0 ? BookingStatus.CONFIRMED : BookingStatus.PENDING_PAYMENT,
        payment: {
          create: {
            razorpayOrderId,
            amountTotalPaise: priceInPaise,
            platformFeePaise,
            creatorPayoutPaise,
            status: priceInPaise === 0 ? PaymentStatus.CAPTURED : PaymentStatus.CREATED,
            payoutStatus: PayoutStatus.NOT_PAID_OUT,
          },
        },
      },
      include: {
        payment: true,
        sessionType: true,
      },
    });

    // 6. If session is free, dispatch confirmation email immediately
    if (priceInPaise === 0 && sessionType.creator?.user) {
      try {
        await sendBookingConfirmationEmail({
          bookingId: booking.id,
          sessionTitle: sessionType.title,
          scheduledStart: booking.scheduledStart,
          scheduledEnd: booking.scheduledEnd,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          creatorName: sessionType.creator.user.name,
          creatorEmail: sessionType.creator.user.email,
          creatorTimezone: sessionType.creator.user.timezone,
          priceInPaise: 0,
        });
      } catch (emailErr) {
        console.error("Email notification error for free booking:", emailErr);
      }
    }

    return NextResponse.json(
      {
        bookingId: booking.id,
        cancelToken: booking.cancelToken,
        razorpayOrderId,
        razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amountTotalPaise: priceInPaise,
        currency: "INR",
        status: booking.status,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
