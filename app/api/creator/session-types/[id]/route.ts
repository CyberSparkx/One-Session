import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SessionTypeSchema } from "@/lib/validations";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();
    const result = SessionTypeSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existing = await prisma.sessionType.findUnique({
      where: { id },
    });

    if (!existing || existing.creatorId !== user.creatorProfile.id) {
      return NextResponse.json(
        { error: "Session type not found or not owned by creator" },
        { status: 404 }
      );
    }

    const updated = await prisma.sessionType.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/creator/session-types/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existing = await prisma.sessionType.findUnique({
      where: { id },
    });

    if (!existing || existing.creatorId !== user.creatorProfile.id) {
      return NextResponse.json(
        { error: "Session type not found or not owned by creator" },
        { status: 404 }
      );
    }

    // Check if there are active bookings
    const bookingsCount = await prisma.booking.count({
      where: {
        sessionTypeId: id,
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
      },
    });

    if (bookingsCount > 0) {
      // Instead of hard deleting and breaking foreign keys, deactivate it
      const deactivated = await prisma.sessionType.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Session type has active bookings, deactivated instead of deleted",
        sessionType: deactivated,
      });
    }

    await prisma.sessionType.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Session type deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/creator/session-types/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
