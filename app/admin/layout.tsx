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
  // ONLY users with role === Role.ADMIN can access /admin.
  if (user.role !== Role.ADMIN) {
    if (user.role === Role.CREATOR) {
      redirect("/dashboard");
    } else {
      redirect("/");
    }
  }

  return <>{children}</>;
}
