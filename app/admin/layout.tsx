import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/admin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // If user is not found, redirect to login
  if (!user) {
    redirect("/login");
  }

  // Strictly enforce ADMIN role for the admin dashboard.
  // If there are no admins in the database yet (initial setup),
  // the first registered creator can access or claim it, otherwise block non-admins.
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });

  if (adminCount > 0 && user.role !== Role.ADMIN) {
    // Creators or regular users attempting to open /admin are redirected to their allowed pages
    if (user.role === Role.CREATOR) {
      redirect("/dashboard");
    } else {
      redirect("/");
    }
  }

  return <>{children}</>;
}
