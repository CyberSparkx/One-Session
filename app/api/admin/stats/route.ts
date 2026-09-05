import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PaymentStatus, Role } from "@/lib/types";

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
      // In development mode, allow creators to view admin stats or require role ADMIN
      // Let's check if there are any admins, if not, allow first user
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount > 0 && user?.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    // Aggregate captured payments for active bookings
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.CAPTURED,
        booking: {
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      },
    });

    const totalGmvPaise = payments.reduce((sum, p) => sum + p.amountTotalPaise, 0);
    const totalPlatformFeePaise = payments.reduce((sum, p) => sum + p.platformFeePaise, 0);
    const totalCreatorPayoutsPaise = payments.reduce((sum, p) => sum + p.creatorPayoutPaise, 0);

    const creatorsCount = await prisma.creatorProfile.count();
    const publishedCreatorsCount = await prisma.creatorProfile.count({
      where: { isPublished: true },
    });
    const totalBookingsCount = await prisma.booking.count();
    const confirmedBookingsCount = await prisma.booking.count({
      where: { status: "CONFIRMED" },
    });

    return NextResponse.json({
      totalGmvPaise,
      totalGmvRupees: totalGmvPaise / 100,
      totalPlatformFeePaise,
      totalPlatformFeeRupees: totalPlatformFeePaise / 100,
      totalCreatorPayoutsPaise,
      totalCreatorPayoutsRupees: totalCreatorPayoutsPaise / 100,
      creatorsCount,
      publishedCreatorsCount,
      totalBookingsCount,
      confirmedBookingsCount,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
