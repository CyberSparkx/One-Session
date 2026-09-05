import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        sessionType: true,
        creator: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { creator, sessionType } = booking;
    const startUtc = new Date(booking.scheduledStart)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const endUtc = new Date(booking.scheduledEnd)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const nowUtc = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SessionBook//Booking System//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:booking-${booking.id}@sessionbook.com`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${startUtc}`,
      `DTEND:${endUtc}`,
      `SUMMARY:1:1 Session: ${sessionType.title} with ${creator.user.name}`,
      `DESCRIPTION:${sessionType.description || "1:1 Consultation Session via SessionBook"}\\nClient: ${booking.clientName}`,
      `ORGANIZER;CN=${creator.user.name}:mailto:${creator.user.email}`,
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${booking.clientName}:mailto:${booking.clientEmail}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="session-${booking.id}.ics"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/bookings/[id]/ics error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
