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

    return NextResponse.json({
      name: profile.user.name,
      slug: profile.slug,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      timezone: profile.user.timezone,
      sessionTypes: profile.sessionTypes,
    });
  } catch (error: any) {
    console.error("GET /api/public/[slug] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
