import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeAvailableSlots } from "@/lib/availability";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(req.url);
    const sessionTypeId = url.searchParams.get("sessionTypeId");
    const dateStr = url.searchParams.get("date"); // YYYY-MM-DD

    if (!sessionTypeId || !dateStr) {
      return NextResponse.json(
        { error: "Missing required query parameters: sessionTypeId and date" },
        { status: 400 }
      );
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        user: { select: { timezone: true } },
        sessionTypes: { where: { id: sessionTypeId, isActive: true } },
        availabilityRules: true,
        availabilityOverrides: true,
      },
    });

    if (!profile || !profile.isPublished) {
      return NextResponse.json(
        { error: "Creator profile not found or unpublished" },
        { status: 404 }
      );
    }

    const sessionType = profile.sessionTypes[0];
    if (!sessionType) {
      return NextResponse.json(
        { error: "Active session type not found" },
        { status: 404 }
      );
    }

    // Query existing bookings for this creator around this target date (within a 48 hour buffer)
    const targetDateStart = new Date(`${dateStr}T00:00:00.000Z`);
    const targetDateEnd = new Date(`${dateStr}T23:59:59.999Z`);
    // Buffer window to cover timezone discrepancies (+/- 24 hours)
    const windowStart = new Date(targetDateStart.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd = new Date(targetDateEnd.getTime() + 24 * 60 * 60 * 1000);

    const existingBookings = await prisma.booking.findMany({
      where: {
        creatorId: profile.id,
        status: { in: ["CONFIRMED", "PENDING_PAYMENT"] },
        scheduledStart: { gte: windowStart, lte: windowEnd },
      },
      select: {
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        createdAt: true,
      },
    });

    const slots = computeAvailableSlots({
      targetDate: dateStr,
      creatorTimezone: profile.user.timezone,
      durationMinutes: sessionType.durationMinutes,
      bufferBeforeMin: sessionType.bufferBeforeMin,
      bufferAfterMin: sessionType.bufferAfterMin,
      rules: profile.availabilityRules,
      overrides: profile.availabilityOverrides,
      existingBookings,
      now: new Date(),
    });

    return NextResponse.json({
      creatorTimezone: profile.user.timezone,
      slots,
    });
  } catch (error: any) {
    console.error("GET /api/public/[slug]/slots error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
