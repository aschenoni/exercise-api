import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ExerciseAPI — the exercise catalog API",
  description:
    "A hand-curated, hypertrophy-focused exercise library over REST: stimulus-to-fatigue ratings, research-backed gold standards, e1RM substitution groups, progression chains. Your first 100 calls each day are free — no key required to try it.",
  openGraph: {
    title: "ExerciseAPI — the exercise catalog API",
    description:
      "Hand-curated, hypertrophy-focused exercise data over REST. First 100 calls/day free — no key to try it.",
    url: SITE_URL,
    siteName: "ExerciseAPI",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
