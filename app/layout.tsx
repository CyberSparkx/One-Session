import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SessionBook — Book 1:1 Sessions with Experts",
  description:
    "SessionBook is the creator-first platform to list, book, and monetize 1:1 sessions. Keep 96% of every session fee.",
  keywords: ["1:1 sessions", "creator bookings", "mentorship", "consultation", "Razorpay"],
  authors: [{ name: "SessionBook" }],
  openGraph: {
    title: "SessionBook — Book 1:1 Sessions with Experts",
    description: "Keep 96% of every session fee. Go live in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
