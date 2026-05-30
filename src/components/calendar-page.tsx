import { AppShell } from "./app-shell";
import { CalendarGrid, CalendarGridBlock } from "./calendar-grid";

const demoBlocks: CalendarGridBlock[] = [
  { id: "google-focus", title: "팀 정기 회의", start: "2026-05-31T10:00:00+09:00", end: "2026-05-31T11:00:00+09:00", source: "calendar" },
  { id: "quest-report", title: "보고서 초안 작성", start: "2026-05-31T13:30:00+09:00", end: "2026-05-31T14:30:00+09:00", source: "quest" }
];

export function CalendarPage({ mode }: { mode: "day" | "week" }) {
  return (
    <AppShell title={mode === "day" ? "일간 캘린더" : "주간 캘린더"} subtitle="고정 일정과 내부 퀘스트 배치를 한눈에 확인하세요.">
      <div className="calendar-toolbar"><span>{mode === "day" ? "오늘" : "이번 주"}</span><strong>Google Calendar 일정은 읽기 전용입니다.</strong></div>
      <CalendarGrid blocks={demoBlocks} />
    </AppShell>
  );
}

