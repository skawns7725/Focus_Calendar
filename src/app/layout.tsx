import type { Metadata } from "next";
import "./globals.css";
import { ThemeController } from "@/components/theme-controller";

export const metadata: Metadata = {
  title: "Focus Calendar",
  description: "Deadline-first schedule management with calendar-aware planning",
  applicationName: "Focus Calendar",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><ThemeController />{children}</body>
    </html>
  );
}
