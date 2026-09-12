import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PayoutStatus } from "@/lib/types";
import { sendPayoutCompletedEmail } from "@/lib/email";

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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            creator: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        payoutStatus: PayoutStatus.MANUALLY_PAID,
      },
    });

    // Notify creator that their session payout is done
    try {
      const creatorUser = payment.booking?.creator?.user;
      if (creatorUser) {
        let payoutDetailsObj: any = null;
        if (payment.booking.creator.payoutDetails) {
          try {
            payoutDetailsObj = JSON.parse(payment.booking.creator.payoutDetails);
          } catch (e) {}
        }
        const method = payment.booking.creator.payoutMethod || "upi";
        const dest = method === "upi" ? `UPI: ${payoutDetailsObj?.upiId || "Registered UPI"}` : `Bank A/C: •••${payoutDetailsObj?.bankAccount?.slice(-4) || "XXXX"}`;

        await sendPayoutCompletedEmail({
          creatorName: creatorUser.name,
          creatorEmail: creatorUser.email,
          payoutAmountPaise: payment.creatorPayoutPaise,
          payoutMethod: method,
          destinationSummary: dest,
          reference: `PAYMENT_${payment.id.slice(-6)}`,
          sessionsCount: 1,
        });
      }
    } catch (emailErr) {
      console.error("Payout completed email error in mark-paid:", emailErr);
    }

    return NextResponse.json({
      message: "Payout marked as manually paid",
      payment: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/payouts/[id]/mark-paid error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
