import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quest Calendar",
  description: "Prioritized quests with calendar-aware scheduling"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

