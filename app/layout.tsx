import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./workspace.css";
import "./shell.css";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
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
