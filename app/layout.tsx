import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allingo · Ads Dashboard",
  description: "Meta Ads performance tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
