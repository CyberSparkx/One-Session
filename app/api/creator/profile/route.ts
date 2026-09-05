import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreatorProfileSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let payoutDetailsObj = null;
    if (user.creatorProfile.payoutDetails) {
      try {
        payoutDetailsObj = JSON.parse(user.creatorProfile.payoutDetails);
      } catch (e) {
        payoutDetailsObj = null;
      }
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      bio: user.creatorProfile.bio || "",
      avatarUrl: user.creatorProfile.avatarUrl || "",
      slug: user.creatorProfile.slug,
      timezone: user.timezone,
      isPublished: user.creatorProfile.isPublished,
      payoutMethod: user.creatorProfile.payoutMethod || "upi",
      payoutDetails: payoutDetailsObj,
    });
  } catch (error: any) {
    console.error("GET /api/creator/profile error:", error);
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
    const result = CreatorProfileSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      name,
      bio,
      avatarUrl,
      slug,
      timezone,
      isPublished,
      payoutMethod,
      payoutDetails,
    } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creatorProfile: true },
    });

    if (!user || !user.creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug !== user.creatorProfile.slug) {
      const slugOwner = await prisma.creatorProfile.findUnique({
        where: { slug },
      });
      if (slugOwner && slugOwner.id !== user.creatorProfile.id) {
        return NextResponse.json(
          { error: "This slug is already taken by another creator" },
          { status: 409 }
        );
      }
    }

    // Update user and profile in transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { name, timezone },
      });

      const profile = await tx.creatorProfile.update({
        where: { id: user.creatorProfile!.id },
        data: {
          bio,
          avatarUrl: avatarUrl || null,
          slug,
          isPublished,
          payoutMethod: payoutMethod || null,
          payoutDetails: payoutDetails ? JSON.stringify(payoutDetails) : null,
        },
      });

      return profile;
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/creator/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
