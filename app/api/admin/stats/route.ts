import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PaymentStatus, Role } from "@/lib/types";
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

    if (!user || user.role !== Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount > 0 && user?.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Aggregate captured payments for confirmed/completed bookings
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.CAPTURED,
        booking: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      },
      include: {
        booking: true,
      },
    });

    const totalGmvPaise = payments.reduce((sum, p) => sum + p.amountTotalPaise, 0);
    const totalPlatformFeePaise = payments.reduce((sum, p) => sum + p.platformFeePaise, 0);
    const totalCreatorPayoutsPaise = payments.reduce((sum, p) => sum + p.creatorPayoutPaise, 0);

    // In-flight reserve (session in future) vs completed pending payout
    let totalInFlightReservePaise = 0;
    let totalPendingEligiblePayoutPaise = 0;
    let totalDisbursedPayoutPaise = 0;

    payments.forEach((p) => {
      const isSessionFinished =
        p.booking.status === "COMPLETED" || new Date(p.booking.scheduledEnd) <= now;

      if (p.payoutStatus === "MANUALLY_PAID" || p.payoutStatus === "ROUTE_TRANSFERRED") {
        totalDisbursedPayoutPaise += p.creatorPayoutPaise;
      } else if (isSessionFinished) {
        totalPendingEligiblePayoutPaise += p.creatorPayoutPaise;
      } else {
        totalInFlightReservePaise += p.creatorPayoutPaise;
      }
    });

    // Current month analytics
    const thisMonthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate >= currentMonthStart && paymentDate <= currentMonthEnd;
    });
    const thisMonthGmvPaise = thisMonthPayments.reduce((sum, p) => sum + p.amountTotalPaise, 0);
    const thisMonthPlatformFeePaise = thisMonthPayments.reduce((sum, p) => sum + p.platformFeePaise, 0);

    const creatorsCount = await prisma.creatorProfile.count();
    const publishedCreatorsCount = await prisma.creatorProfile.count({
      where: { isPublished: true },
    });
    const totalBookingsCount = await prisma.booking.count();
    const confirmedBookingsCount = await prisma.booking.count({
      where: { status: "CONFIRMED" },
    });
    const completedBookingsCount = await prisma.booking.count({
      where: { status: "COMPLETED" },
    });
    const cancelledBookingsCount = await prisma.booking.count({
      where: { status: { in: ["CANCELLED", "REFUNDED"] } },
    });

    return NextResponse.json({
      totalGmvPaise,
      totalGmvRupees: totalGmvPaise / 100,
      totalPlatformFeePaise,
      totalPlatformFeeRupees: totalPlatformFeePaise / 100,
      totalCreatorPayoutsPaise,
      totalCreatorPayoutsRupees: totalCreatorPayoutsPaise / 100,
      totalInFlightReservePaise,
      totalInFlightReserveRupees: totalInFlightReservePaise / 100,
      totalPendingEligiblePayoutPaise,
      totalPendingEligiblePayoutRupees: totalPendingEligiblePayoutPaise / 100,
      totalDisbursedPayoutPaise,
      totalDisbursedPayoutRupees: totalDisbursedPayoutPaise / 100,
      thisMonthGmvPaise,
      thisMonthGmvRupees: thisMonthGmvPaise / 100,
      thisMonthPlatformFeePaise,
      thisMonthPlatformFeeRupees: thisMonthPlatformFeePaise / 100,
      thisMonthBookingsCount: thisMonthPayments.length,
      creatorsCount,
      publishedCreatorsCount,
      totalBookingsCount,
      confirmedBookingsCount,
      completedBookingsCount,
      cancelledBookingsCount,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
