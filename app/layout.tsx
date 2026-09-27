import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AYURE | Where properties meet opportunity",
  description:
    "Discover properties, trusted professionals, and short-term rental opportunities in one destination.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body data-ayure-build="v0-2026-09-27">{children}</body>
    </html>
  );
}
