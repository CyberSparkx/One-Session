import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
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
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const statusParam = searchParams.get("status") || "ALL";
    const exportCsv = searchParams.get("format") === "csv";

    // Date range filtering
    const dateFilter: any = {};
    if (fromParam) {
      dateFilter.gte = startOfDay(parseISO(fromParam));
    }
    if (toParam) {
      dateFilter.lte = endOfDay(parseISO(toParam));
    }

    // Status filtering: only include confirmed, completed, or refunded (never pending)
    let statusFilter: any = { in: ["CONFIRMED", "COMPLETED", "REFUNDED"] };
    if (statusParam === "CONFIRMED") {
      statusFilter = { in: ["CONFIRMED", "COMPLETED"] };
    } else if (statusParam === "REFUNDED") {
      statusFilter = "REFUNDED";
    }

    const bookings = await prisma.booking.findMany({
      where: {
        creatorId: user.creatorProfile.id,
        status: statusFilter,
        ...(Object.keys(dateFilter).length > 0 ? { scheduledStart: dateFilter } : {}),
      },
      include: {
        sessionType: true,
        payment: true,
      },
      orderBy: { scheduledStart: "desc" },
    });

    const items = bookings.map((b) => {
      const grossPaise = b.payment?.amountTotalPaise || b.sessionType.priceInPaise;
      const platformFeePaise = b.payment?.platformFeePaise || Math.round(grossPaise * 0.04);
      
      // Detailed breakdown:
      // Razorpay payment gateway standard fee: 2%
      const gatewayFeePaise = Math.round(grossPaise * 0.02);
      // GST / Tax on gateway fee (18% of gateway fee):
      const gatewayGstPaise = Math.round(gatewayFeePaise * 0.18);
      // Total Gateway + Tax deduction:
      const totalTaxAndGatewayPaise = gatewayFeePaise + gatewayGstPaise;

      // Net creator payout is recorded in database
      const netPaise = b.payment?.creatorPayoutPaise || (grossPaise - platformFeePaise);

      return {
        id: b.id,
        invoiceNumber: `INV-${b.id.substring(b.id.length - 8).toUpperCase()}`,
        date: b.scheduledStart.toISOString(),
        clientName: b.clientName,
        clientEmail: b.clientEmail,
        clientPhone: b.clientPhone,
        sessionTitle: b.sessionType.title,
        durationMinutes: b.sessionType.durationMinutes,
        status: b.status,
        paymentStatus: b.payment?.status || (b.status === "CONFIRMED" ? "CAPTURED" : "PENDING"),
        payoutStatus: b.payment?.payoutStatus || "NOT_PAID_OUT",
        paymentId: b.payment?.razorpayPaymentId || "N/A",
        orderId: b.payment?.razorpayOrderId || "N/A",
        grossAmountPaise: grossPaise,
        platformFeePaise,
        gatewayFeePaise,
        gatewayGstPaise,
        totalTaxAndGatewayPaise,
        netPayoutPaise: netPaise,
        grossRupees: (grossPaise / 100).toFixed(2),
        platformFeeRupees: (platformFeePaise / 100).toFixed(2),
        gatewayFeeRupees: (gatewayFeePaise / 100).toFixed(2),
        gatewayGstRupees: (gatewayGstPaise / 100).toFixed(2),
        totalTaxAndGatewayRupees: (totalTaxAndGatewayPaise / 100).toFixed(2),
        netPayoutRupees: (netPaise / 100).toFixed(2),
      };
    });

    // Compute totals (excluding refunded from net earnings if applicable)
    const activeItems = items.filter((i) => i.status !== "REFUNDED");
    const totalSessions = items.length;
    const totalGrossPaise = activeItems.reduce((sum, i) => sum + i.grossAmountPaise, 0);
    const totalPlatformFeePaise = activeItems.reduce((sum, i) => sum + i.platformFeePaise, 0);
    const totalTaxAndGatewayPaise = activeItems.reduce((sum, i) => sum + i.totalTaxAndGatewayPaise, 0);
    const totalNetPayoutPaise = activeItems.reduce((sum, i) => sum + i.netPayoutPaise, 0);

    // If CSV download requested, generate CSV format with complete breakdown
    if (exportCsv) {
      const csvHeader = [
        "Invoice Number",
        "Date",
        "Client Name",
        "Client Email",
        "Session Title",
        "Duration (Mins)",
        "Gross Amount (INR)",
        "Platform Fee 4% (INR)",
        "Razorpay Processing Fee (2% INR)",
        "GST on Processing (18% INR)",
        "Creator Net Payout (INR)",
        "Payout Status",
        "Payment ID",
      ].join(",");

      const csvRows = items.map((i) =>
        [
          `"${i.invoiceNumber}"`,
          `"${format(new Date(i.date), "yyyy-MM-dd HH:mm")}"`,
          `"${i.clientName.replace(/"/g, '""')}"`,
          `"${i.clientEmail}"`,
          `"${i.sessionTitle.replace(/"/g, '""')}"`,
          i.durationMinutes,
          i.grossRupees,
          i.platformFeeRupees,
          i.gatewayFeeRupees,
          i.gatewayGstRupees,
          i.netPayoutRupees,
          `"${i.payoutStatus}"`,
          `"${i.paymentId}"`,
        ].join(",")
      );

      // Add summary row at bottom
      csvRows.push("");
      csvRows.push(
        `"TOTALS (Active)","","","","",${totalSessions},${(totalGrossPaise / 100).toFixed(2)},${(totalPlatformFeePaise / 100).toFixed(2)},${(totalTaxAndGatewayPaise / 100).toFixed(2)},"",${(totalNetPayoutPaise / 100).toFixed(2)},"",""`
      );

      const csvContent = [csvHeader, ...csvRows].join("\n");
      const filename = `SessionBook_Invoices_${fromParam || "start"}_to_${toParam || "end"}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      creatorName: user.name,
      creatorEmail: user.email,
      from: fromParam || null,
      to: toParam || null,
      totalSessions,
      totalGrossPaise,
      totalPlatformFeePaise,
      totalTaxAndGatewayPaise,
      totalNetPayoutPaise,
      items,
    });
  } catch (error: any) {
    console.error("GET /api/creator/invoices error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
