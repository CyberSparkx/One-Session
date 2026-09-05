import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SessionTypeSchema } from "@/lib/validations";

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
            sessionTypes: {
              orderBy: { priceInPaise: "asc" },
            },
          },
        },
      },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(user.creatorProfile.sessionTypes);
  } catch (error: any) {
    console.error("GET /api/creator/session-types error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const newSessionType = await prisma.sessionType.create({
      data: {
        creatorId: user.creatorProfile.id,
        ...result.data,
      },
    });

    return NextResponse.json(newSessionType, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/creator/session-types error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
