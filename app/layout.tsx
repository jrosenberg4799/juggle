import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Juggle — Maintenance, in order.",
  description: "Cocozza restaurant maintenance and equipment history",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
