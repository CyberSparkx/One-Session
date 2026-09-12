import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const creators = await prisma.creatorProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            timezone: true,
            createdAt: true,
          },
        },
        sessionTypes: {
          select: { id: true, title: true, priceInPaise: true, durationMinutes: true },
        },
        bookings: {
          include: { payment: true, sessionType: true },
          orderBy: { scheduledStart: "desc" },
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    });

    const formatted = creators.map((c) => {
      let payoutDetails = null;
      if (c.payoutDetails) {
        try {
          payoutDetails = JSON.parse(c.payoutDetails);
        } catch (e) {}
      }

      // Filter bookings by statuses
      const allBookings = c.bookings;
      const confirmedOrCompletedBookings = allBookings.filter(
        (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
      );
      const cancelledOrRefundedBookings = allBookings.filter(
        (b) => b.status === "CANCELLED" || b.status === "REFUNDED"
      );

      // Current Month Bookings
      const thisMonthBookings = allBookings.filter((b) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= currentMonthStart && bookingDate <= currentMonthEnd;
      });

      const thisMonthConfirmedBookings = confirmedOrCompletedBookings.filter((b) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= currentMonthStart && bookingDate <= currentMonthEnd;
      });

      const calculateNetCreatorPayout = (pricePaise: number, existingPayout?: number | null) => {
        if (existingPayout != null && existingPayout > 0) return existingPayout;
        const platform = Math.round(pricePaise * 0.04);
        const gateway = Math.round(pricePaise * 0.02);
        const gst = Math.round(gateway * 0.18);
        return pricePaise - platform - (gateway + gst);
      };

      const thisMonthGrossPaise = thisMonthConfirmedBookings.reduce((sum, b) => {
        return sum + (b.payment?.amountTotalPaise || b.sessionType.priceInPaise || 0);
      }, 0);

      const thisMonthCreatorPayoutPaise = thisMonthConfirmedBookings.reduce((sum, b) => {
        return sum + (b.payment?.creatorPayoutPaise || calculateNetCreatorPayout(b.sessionType.priceInPaise));
      }, 0);

      // Lifecycle segmentation:
      // In-flight reserve: session scheduledEnd is still in future (held safely until session happens)
      const upcomingSessions = confirmedOrCompletedBookings.filter(
        (b) => b.status !== "COMPLETED" && new Date(b.scheduledEnd) > now
      );
      const inFlightReservePaise = upcomingSessions.reduce((sum, b) => {
        return sum + (b.payment?.creatorPayoutPaise || calculateNetCreatorPayout(b.sessionType.priceInPaise));
      }, 0);

      // Completed sessions: session is marked COMPLETED or scheduledEnd has passed
      const completedSessions = confirmedOrCompletedBookings.filter(
        (b) => b.status === "COMPLETED" || new Date(b.scheduledEnd) <= now
      );

      // Eligible pending payout: completed sessions where payoutStatus is NOT_PAID_OUT
      const pendingEligiblePayments = completedSessions.filter(
        (b) => b.payment && b.payment.status === "CAPTURED" && b.payment.payoutStatus === "NOT_PAID_OUT"
      );
      const rawPendingPayoutPaise = pendingEligiblePayments.reduce((sum, b) => {
        return sum + (b.payment?.creatorPayoutPaise || calculateNetCreatorPayout(b.sessionType.priceInPaise));
      }, 0);

      // Total already paid out
      const paidOutPayments = confirmedOrCompletedBookings.filter(
        (b) => b.payment && (b.payment.payoutStatus === "MANUALLY_PAID" || b.payment.payoutStatus === "ROUTE_TRANSFERRED")
      );
      const totalPaidOutPaise = paidOutPayments.reduce((sum, b) => {
        return sum + (b.payment?.creatorPayoutPaise || 0);
      }, 0);

      // Total lifetime gross & earnings
      const lifetimeGrossPaise = confirmedOrCompletedBookings.reduce((sum, b) => {
        return sum + (b.payment?.amountTotalPaise || b.sessionType.priceInPaise || 0);
      }, 0);

      const lifetimeCreatorEarningsPaise = confirmedOrCompletedBookings.reduce((sum, b) => {
        return sum + (b.payment?.creatorPayoutPaise || calculateNetCreatorPayout(b.sessionType.priceInPaise));
      }, 0);

      const balanceAdjustmentPaise = c.balanceAdjustmentPaise || 0;
      // Net pending payout after fee debits
      const netPendingPayoutPaise = Math.max(0, rawPendingPayoutPaise + balanceAdjustmentPaise);

      // Detailed list of cancelled sessions for creator audit
      const cancelledList = cancelledOrRefundedBookings.map((cb) => ({
        id: cb.id,
        clientName: cb.clientName,
        clientEmail: cb.clientEmail,
        sessionTitle: cb.sessionType.title,
        scheduledStart: cb.scheduledStart,
        status: cb.status,
        cancellationReason: cb.cancellationReason || "No specific reason provided",
        cancelledBy: cb.cancelledBy || (cb.status === "REFUNDED" ? "CREATOR" : "CLIENT"),
        refundAmountPaise: cb.payment?.refundAmountPaise || cb.payment?.amountTotalPaise || cb.sessionType.priceInPaise,
        refundType: cb.payment?.refundType || (cb.status === "REFUNDED" ? "FULL" : "NONE"),
        createdAt: cb.createdAt,
      }));

      return {
        id: c.id,
        userId: c.userId,
        name: c.user.name,
        email: c.user.email,
        slug: c.slug,
        bio: c.bio,
        avatarUrl: c.avatarUrl,
        isPublished: c.isPublished,
        payoutMethod: c.payoutMethod || "upi",
        payoutDetails,
        sessionTypesCount: c.sessionTypes.length,

        // Monthly Stats
        thisMonthBookingsCount: thisMonthBookings.length,
        thisMonthConfirmedCount: thisMonthConfirmedBookings.length,
        thisMonthGrossPaise,
        thisMonthCreatorPayoutPaise,

        // Reserve & Payout Amounts
        inFlightReservePaise,
        rawPendingPayoutPaise,
        balanceAdjustmentPaise,
        netPendingPayoutPaise,
        totalPaidOutPaise,
        lifetimeGrossPaise,
        lifetimeCreatorEarningsPaise,

        // Session Counts
        confirmedBookingsCount: confirmedOrCompletedBookings.length,
        completedSessionsCount: completedSessions.length,
        upcomingSessionsCount: upcomingSessions.length,
        pendingEligibleBookingsCount: pendingEligiblePayments.length,
        cancelledCount: cancelledOrRefundedBookings.length,

        // Audit lists
        cancelledBookings: cancelledList,
        eligibleBookingIds: pendingEligiblePayments.map((b) => b.id),

        createdAt: c.user.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/admin/creators error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
