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
          select: { id: true, title: true, priceInPaise: true },
        },
        bookings: {
          where: { status: "CONFIRMED" },
          include: { payment: true },
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    });

    const formatted = creators.map((c) => {
      const totalEarnedPaise = c.bookings.reduce((sum, b) => {
        return sum + (b.payment?.creatorPayoutPaise || 0);
      }, 0);

      let payoutDetails = null;
      if (c.payoutDetails) {
        try {
          payoutDetails = JSON.parse(c.payoutDetails);
        } catch (e) {}
      }

      return {
        id: c.id,
        name: c.user.name,
        email: c.user.email,
        slug: c.slug,
        isPublished: c.isPublished,
        payoutMethod: c.payoutMethod || "upi",
        payoutDetails,
        sessionTypesCount: c.sessionTypes.length,
        confirmedBookingsCount: c.bookings.length,
        totalEarnedPaise,
        totalEarnedRupees: totalEarnedPaise / 100,
        createdAt: c.user.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/admin/creators error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
