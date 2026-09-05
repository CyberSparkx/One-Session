import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { creatorProfile: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          creatorProfileId: user.creatorProfile?.id,
          slug: user.creatorProfile?.slug,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_google_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_google_client_secret",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        let existingUser = await prisma.user.findUnique({
          where: { email },
          include: { creatorProfile: true },
        });

        if (!existingUser) {
          const name = user.name || "Creator";
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

          existingUser = await prisma.user.create({
            data: {
              name,
              email,
              role: "CREATOR",
              creatorProfile: {
                create: {
                  slug,
                  avatarUrl: user.image || null,
                  bio: `Hi, I'm ${name}. Book a 1:1 session with me to discuss strategy, mentorship, or consultation!`,
                  isPublished: true,
                  availabilityRules: {
                    create: [
                      { dayOfWeek: 1, startTime: "10:00", endTime: "18:00" },
                      { dayOfWeek: 2, startTime: "10:00", endTime: "18:00" },
                      { dayOfWeek: 3, startTime: "10:00", endTime: "18:00" },
                      { dayOfWeek: 4, startTime: "10:00", endTime: "18:00" },
                      { dayOfWeek: 5, startTime: "10:00", endTime: "18:00" },
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
        }

        // Save or update Google tokens if provided
        if (account.access_token || account.refresh_token) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              googleAccessToken: account.access_token || undefined,
              googleRefreshToken: account.refresh_token || undefined,
            } as any,
          });
        }

        user.id = existingUser.id;
        (user as any).role = existingUser.role;
        (user as any).creatorProfileId = existingUser.creatorProfile?.id;
        (user as any).slug = existingUser.creatorProfile?.slug;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.creatorProfileId = (user as any).creatorProfileId;
        token.slug = (user as any).slug;
      }

      // If token doesn't have slug yet (e.g. initial Google OAuth callback)
      if (!token.slug && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { creatorProfile: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.creatorProfileId = dbUser.creatorProfile?.id;
          token.slug = dbUser.creatorProfile?.slug;
        }
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.slug) token.slug = session.slug;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).creatorProfileId = token.creatorProfileId as string;
        (session.user as any).slug = token.slug as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "development-sessionbook-secret-key-32chars!",
};
