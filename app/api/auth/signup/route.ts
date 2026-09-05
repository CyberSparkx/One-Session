import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { SignUpSchema } from "@/lib/validations";
import { Role } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = SignUpSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, timezone } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate a unique slug based on name
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "creator";

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.creatorProfile.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create User, CreatorProfile, and default Mon-Fri availability in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          timezone,
          role: Role.CREATOR,
          creatorProfile: {
            create: {
              slug,
              bio: `Hi, I'm ${name}. Book a 1:1 session with me to discuss strategy, mentorship, or consultation!`,
              isPublished: true,
              availabilityRules: {
                create: [
                  { dayOfWeek: 1, startTime: "10:00", endTime: "18:00" }, // Mon
                  { dayOfWeek: 2, startTime: "10:00", endTime: "18:00" }, // Tue
                  { dayOfWeek: 3, startTime: "10:00", endTime: "18:00" }, // Wed
                  { dayOfWeek: 4, startTime: "10:00", endTime: "18:00" }, // Thu
                  { dayOfWeek: 5, startTime: "10:00", endTime: "18:00" }, // Fri
                ],
              },
              sessionTypes: {
                create: {
                  title: "30-Minute Consultation",
                  description: "One-on-one session to discuss your questions and goals.",
                  durationMinutes: 30,
                  priceInPaise: 150000, // ₹1,500
                  bufferBeforeMin: 0,
                  bufferAfterMin: 15,
                  isActive: true,
                },
              },
            },
          },
        },
        include: { creatorProfile: true },
      });

      return user;
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          slug: newUser.creatorProfile?.slug,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
