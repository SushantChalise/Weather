import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nepal Mountain Weather Decision Map",
  description:
    "Compare conditions, see clear windows, and choose better travel windows across Nepal — with visible evidence and confidence labels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
