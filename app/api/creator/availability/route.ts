import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const PutAvailabilitySchema = z.object({
  rules: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    })
  ),
  overrides: z
    .array(
      z.object({
        date: z.string(), // YYYY-MM-DD
        isBlocked: z.boolean(),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        creatorProfile: {
          include: {
            availabilityRules: {
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
            availabilityOverrides: {
              orderBy: { date: "asc" },
            },
          },
        },
      },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      timezone: user.timezone,
      rules: user.creatorProfile.availabilityRules,
      overrides: user.creatorProfile.availabilityOverrides,
    });
  } catch (error: any) {
    console.error("GET /api/creator/availability error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const result = PutAvailabilitySchema.safeParse(json);

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

    const creatorId = user.creatorProfile.id;
    const { rules, overrides = [] } = result.data;

    await prisma.$transaction(async (tx) => {
      // Replace all existing recurring rules for this creator
      await tx.availabilityRule.deleteMany({
        where: { creatorId },
      });

      if (rules.length > 0) {
        await tx.availabilityRule.createMany({
          data: rules.map((r) => ({
            creatorId,
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
          })),
        });
      }

      // Replace overrides if provided
      await tx.availabilityOverride.deleteMany({
        where: { creatorId },
      });

      if (overrides.length > 0) {
        await tx.availabilityOverride.createMany({
          data: overrides.map((o) => ({
            creatorId,
            date: new Date(`${o.date}T00:00:00.000Z`),
            isBlocked: o.isBlocked,
            startTime: o.startTime || null,
            endTime: o.endTime || null,
          })),
        });
      }
    });

    return NextResponse.json({ message: "Availability rules updated successfully" });
  } catch (error: any) {
    console.error("PUT /api/creator/availability error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
