import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import InvoicesClientView from "./InvoicesClientView";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  const user = await prisma.user.findUnique({
    where: { email: email! },
    include: {
      creatorProfile: true,
    },
  });

  if (!user || !user.creatorProfile) {
    return null;
  }

  return (
    <InvoicesClientView
      creatorName={user.name}
      creatorEmail={user.email}
      creatorTimezone={user.timezone}
    />
  );
}
