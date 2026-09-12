import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardNav from "./DashboardNav";
import AnimatedBackground from "@/components/AnimatedBackground";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { creatorProfile: true },
  });

  if (!user) {
    redirect("/login");
  }

  // Regular clients/learners (USER role) can only view the homepage and public booking pages
  if (user.role === "USER") {
    redirect("/");
  }

  if (!user.creatorProfile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] text-gray-900 relative">
      <AnimatedBackground />

      <DashboardNav
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          slug: user.creatorProfile.slug,
          isPublished: user.creatorProfile.isPublished,
        }}
      />

      {/* Main content area */}
      <main className="relative z-10 flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
