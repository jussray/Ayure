import type { Metadata } from "next";
import "./globals.css";
import AyureMotion from "../components/AyureMotion";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ayure.us"),
  alternates: { canonical: "/" },
  title: "AYURE | Where properties meet opportunity",
  description:
    "Discover properties, trusted professionals, and short-term rental opportunities in one destination.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-ayure-build="v0.2-reference-2026-10-01">{children}<AyureMotion /></body>
    </html>
  );
}
