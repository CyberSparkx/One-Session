import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CalendarClientView from "./CalendarClientView";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  const user = await prisma.user.findUnique({
    where: { email: email! },
    include: {
      creatorProfile: {
        include: {
          bookings: {
            include: {
              sessionType: true,
              payment: true,
            },
            orderBy: { scheduledStart: "asc" },
          },
        },
      },
    },
  });

  if (!user || !user.creatorProfile) {
    return null;
  }

  const isGoogleConnected = Boolean((user as any).googleAccessToken);
  const bookings = user.creatorProfile.bookings.map((b) => ({
    id: b.id,
    sessionTitle: b.sessionType.title,
    durationMinutes: b.sessionType.durationMinutes,
    priceInPaise: b.sessionType.priceInPaise,
    scheduledStart: b.scheduledStart.toISOString(),
    scheduledEnd: b.scheduledEnd.toISOString(),
    clientName: b.clientName,
    clientEmail: b.clientEmail,
    clientPhone: b.clientPhone,
    status: b.status,
    notes: b.notes,
    creatorPayoutPaise: b.payment?.creatorPayoutPaise || Math.round(b.sessionType.priceInPaise * 0.96),
  }));

  return (
    <CalendarClientView
      bookings={bookings}
      isGoogleConnected={isGoogleConnected}
      creatorTimezone={user.timezone}
      creatorName={user.name}
    />
  );
}
