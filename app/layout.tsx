import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SessionBook — Book 1:1 Expert Sessions & Consultations",
  description:
    "The premier marketplace for creators, mentors, and experts to offer paid 1-on-1 consultations with instant calendar booking and seamless payments.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100">
      <body className={`${inter.className} min-h-screen antialiased bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
