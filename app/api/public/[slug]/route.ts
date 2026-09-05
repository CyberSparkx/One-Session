import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const profile = await prisma.creatorProfile.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        user: {
          select: {
            name: true,
            timezone: true,
          },
        },
        sessionTypes: {
          where: { isActive: true },
          orderBy: { priceInPaise: "asc" },
        },
        availabilityRules: {
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
        availabilityOverrides: {
          select: { date: true, isBlocked: true, startTime: true, endTime: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (!profile.isPublished) {
      return NextResponse.json(
        { error: "This creator page is currently private" },
        { status: 403 }
      );
    }

    const availableDaysOfWeek = Array.from(
      new Set(profile.availabilityRules.map((r) => r.dayOfWeek))
    );

    return NextResponse.json({
      name: profile.user.name,
      slug: profile.slug,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      timezone: profile.user.timezone,
      sessionTypes: profile.sessionTypes,
      availableDaysOfWeek,
      availabilityOverrides: profile.availabilityOverrides.map((o) => ({
        date: o.date.toISOString().split("T")[0],
        isBlocked: o.isBlocked,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/public/[slug] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
