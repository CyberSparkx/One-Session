import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendPayoutInitiatedEmail } from "@/lib/email";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const creator = await prisma.creatorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "COMPLETED"] },
          },
          include: { payment: true },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const now = new Date();

    const eligiblePayments = creator.bookings
      .filter((b) => {
        const isFinished = b.status === "COMPLETED" || new Date(b.scheduledEnd) <= now;
        return (
          isFinished &&
          b.payment &&
          b.payment.status === "CAPTURED" &&
          b.payment.payoutStatus === "NOT_PAID_OUT"
        );
      })
      .map((b) => b.payment!);

    if (eligiblePayments.length === 0) {
      return NextResponse.json(
        { error: "No completed sessions are currently pending payout for this creator." },
        { status: 400 }
      );
    }

    const totalEligiblePaise = eligiblePayments.reduce(
      (sum, p) => sum + p.creatorPayoutPaise,
      0
    );

    const balanceAdjustmentPaise = creator.balanceAdjustmentPaise || 0;
    const netPayoutPaise = Math.max(0, totalEligiblePaise + balanceAdjustmentPaise);

    let payoutDetailsObj: any = null;
    if (creator.payoutDetails) {
      try {
        payoutDetailsObj = JSON.parse(creator.payoutDetails);
      } catch (e) {}
    }

    const method = body.method || creator.payoutMethod || "upi";
    let destinationSummary = "";
    if (method === "upi") {
      destinationSummary = `UPI: ${payoutDetailsObj?.upiId || "Registered UPI VPA"}`;
    } else if (method === "bank") {
      destinationSummary = `Bank A/C: •••${payoutDetailsObj?.bankAccount?.slice(-4) || "XXXX"} (${payoutDetailsObj?.ifsc || ""})`;
    } else {
      destinationSummary = method.toUpperCase();
    }

    // Send the "Payout Initiated" email to creator
    await sendPayoutInitiatedEmail({
      creatorName: creator.user.name,
      creatorEmail: creator.user.email,
      payoutAmountPaise: netPayoutPaise,
      payoutMethod: method,
      destinationSummary,
      sessionsCount: eligiblePayments.length,
    });

    return NextResponse.json({
      success: true,
      message: `Payout of ₹${(netPayoutPaise / 100).toLocaleString("en-IN")} initiated. Creator ${creator.user.name} has been notified via email.`,
      creatorName: creator.user.name,
      creatorEmail: creator.user.email,
      payoutAmountPaise: netPayoutPaise,
      method,
    });
  } catch (error: any) {
    console.error("POST /api/admin/creators/[id]/payout/initiate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
