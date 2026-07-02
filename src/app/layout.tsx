import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExerciseAPI — the exercise catalog API",
  description:
    "Free, public REST API for a hand-curated, hypertrophy-focused exercise library: 183 exercises with stimulus-to-fatigue ratings, substitution groups, progression chains, and coaching cues.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
