import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      return NextResponse.json(
        { error: "Cannot mark a cancelled or refunded booking as completed" },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
    });

    return NextResponse.json({
      message: "Session marked as completed",
      booking: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/bookings/[id]/complete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
