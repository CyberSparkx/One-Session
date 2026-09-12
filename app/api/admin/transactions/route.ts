import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount > 0 && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const now = new Date();

    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            sessionType: true,
            creator: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = payments.map((p) => {
      let payoutDetails = null;
      if (p.booking.creator.payoutDetails) {
        try {
          payoutDetails = JSON.parse(p.booking.creator.payoutDetails);
        } catch (e) {}
      }

      const isCompleted =
        p.booking.status === "COMPLETED" || new Date(p.booking.scheduledEnd) <= now;
      const isUpcoming =
        p.booking.status === "CONFIRMED" && new Date(p.booking.scheduledEnd) > now;

      return {
        id: p.id,
        bookingId: p.bookingId,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        clientName: p.booking.clientName,
        clientEmail: p.booking.clientEmail,
        clientPhone: p.booking.clientPhone,
        creatorId: p.booking.creatorId,
        creatorName: p.booking.creator.user.name,
        creatorEmail: p.booking.creator.user.email,
        creatorPayoutMethod: p.booking.creator.payoutMethod,
        creatorPayoutDetails: payoutDetails,
        sessionTitle: p.booking.sessionType.title,
        scheduledStart: p.booking.scheduledStart,
        scheduledEnd: p.booking.scheduledEnd,
        bookingStatus: p.booking.status,
        isCompleted,
        isUpcoming,
        cancellationReason: p.booking.cancellationReason,
        cancelledBy: p.booking.cancelledBy,
        amountTotalPaise: p.amountTotalPaise,
        platformFeePaise: p.platformFeePaise,
        creatorPayoutPaise: p.creatorPayoutPaise,
        refundType: p.refundType,
        refundAmountPaise: p.refundAmountPaise,
        status: p.status,
        payoutStatus: p.payoutStatus,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/admin/transactions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
