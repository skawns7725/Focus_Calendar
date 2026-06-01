"use client";

import { useEffect, useState } from "react";
import { listCalendarBlocks, listQuests, syncGoogleCalendar } from "@/client/api";
import { Quest } from "@/domain/types";
import { AppShell } from "./app-shell";
import { CalendarGrid, CalendarGridBlock } from "./calendar-grid";

interface ImportedBlock {
  id: string;
  title: string;
  start: string;
  end: string;
}

export function CalendarPage({ mode }: { mode: "day" | "week" }) {
  const [blocks, setBlocks] = useState<CalendarGridBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const { from, to } = visibleRange(mode);
    syncGoogleCalendar()
      .catch(() => {
        if (active) setSyncWarning("Google Calendar의 최신 일정을 가져오지 못했습니다. 저장된 일정을 표시합니다.");
      })
      .then(() => Promise.all([listCalendarBlocks(from, to), listQuests()]))
      .then(([calendarBlocks, quests]: [ImportedBlock[], Quest[]]) => {
        if (active) setBlocks(combineBlocks(calendarBlocks, quests, from, to));
      })
      .catch(() => {
        if (active) setError("일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [mode]);

  return (
    <AppShell title={mode === "day" ? "일간 캘린더" : "주간 캘린더"} subtitle="고정 일정과 할 일 배치를 한눈에 확인하세요.">
      <div className="calendar-toolbar"><span>{mode === "day" ? "오늘" : "이번 주"}</span><strong>Google Calendar 일정은 읽기 전용입니다.</strong></div>
      {syncWarning && <p className="sync-warning" role="status">{syncWarning}</p>}
      {loading ? <p className="calendar-state">일정을 정리하고 있습니다.</p> : error ? <CalendarConnectionPrompt /> : <CalendarGrid blocks={blocks} />}
    </AppShell>
  );
}

function CalendarConnectionPrompt() {
  return (
    <section className="calendar-state connection-prompt">
      <p className="eyebrow">Calendar</p>
      <h2>Google Calendar를 연결해 일정을 불러오세요.</h2>
      <p>연결하면 고정 일정과 자동 배치된 할 일을 한 화면에서 확인할 수 있습니다.</p>
      <a className="primary-button" href="/api/google/connect?mode=read">Google Calendar 연결</a>
    </section>
  );
}

function combineBlocks(calendarBlocks: ImportedBlock[], quests: Quest[], from: string, to: string): CalendarGridBlock[] {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();
  return [
    ...calendarBlocks.map((block) => ({ ...block, source: "calendar" as const })),
    ...quests
      .filter((quest) => quest.plannedStart && quest.status !== "completed" && quest.status !== "abandoned")
      .map((quest) => ({
        id: quest.id,
        title: quest.title,
        start: quest.plannedStart!,
        end: new Date(new Date(quest.plannedStart!).getTime() + quest.expectedMinutes * 60_000).toISOString(),
        source: "quest" as const
      }))
  ].filter((block) => {
    const start = new Date(block.start).getTime();
    const end = new Date(block.end).getTime();
    return start < toTime && end > fromTime;
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function visibleRange(mode: "day" | "week") {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (mode === "week") from.setDate(from.getDate() - from.getDay());
  const to = new Date(from);
  to.setDate(to.getDate() + (mode === "day" ? 1 : 7));
  return { from: from.toISOString(), to: to.toISOString() };
}
