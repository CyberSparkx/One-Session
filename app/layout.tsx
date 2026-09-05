import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "SessionBook — Book 1:1 Expert Sessions & Consultations",
  description:
    "The premier marketplace for creators, mentors, and experts to offer paid 1-on-1 consultations with instant calendar booking and seamless payments.",
  keywords: [
    "1:1 sessions",
    "expert consultations",
    "booking platform",
    "mentor booking",
    "paid sessions",
  ],
  openGraph: {
    title: "SessionBook — Book 1:1 Expert Sessions",
    description:
      "Book paid 1-on-1 consultations with top creators, mentors, and experts. Instant booking, secure payments.",
    type: "website",
  },
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
    <html
      lang="en"
      className={`h-full ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${plusJakartaSans.className} min-h-screen antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>{children}</SessionProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
