"use client";

import { useEffect, useState } from "react";
import { createQuest, listCalendarBlocks, listQuests, syncGoogleCalendar, updateQuest } from "@/client/api";
import { Quest } from "@/domain/types";
import { AppShell } from "./app-shell";
import { CalendarGrid, CalendarGridBlock } from "./calendar-grid";
import { PlusIcon } from "./icons";
import { QuestDraft } from "./quest-form";
import { TaskModal } from "./task-modal";

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
  const [calendarUnavailable, setCalendarUnavailable] = useState(false);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const { from, to } = visibleRange(mode);
    setError(null);
    setCalendarUnavailable(false);
    syncGoogleCalendar()
      .catch(() => {
        if (active) setSyncWarning("Google Calendar의 최신 일정을 가져오지 못했습니다. 저장된 일정을 표시합니다.");
      })
      .then(() => Promise.all([
        listCalendarBlocks(from, to).catch(() => {
          if (active) setCalendarUnavailable(true);
          return [];
        }),
        listQuests()
      ]))
      .then(([calendarBlocks, loadedQuests]: [ImportedBlock[], Quest[]]) => {
        if (active) {
          setQuests(loadedQuests);
          setBlocks(combineBlocks(calendarBlocks, loadedQuests, from, to));
        }
      })
      .catch(() => {
        if (active) setError("일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [mode, refreshVersion]);

  async function saveNewQuest(input: QuestDraft) {
    await createQuest(input);
    setShowForm(false);
    setRefreshVersion((version) => version + 1);
  }

  async function saveEditedQuest(input: QuestDraft) {
    if (!editingQuest) return;
    await updateQuest(editingQuest.id, input);
    setEditingQuest(null);
    setRefreshVersion((version) => version + 1);
  }

  return (
    <AppShell title={mode === "day" ? "일간 캘린더" : "주간 캘린더"} subtitle="고정 일정과 할 일 배치를 한눈에 확인하세요." actions={<button className="primary-button" type="button" onClick={() => setShowForm(true)}><PlusIcon size={16} />할 일 추가</button>}>
      <div className="calendar-toolbar"><span>{mode === "day" ? "오늘" : "이번 주"}</span><strong>Google Calendar 일정은 읽기 전용입니다.</strong></div>
      {syncWarning && !error && <p className="sync-warning" role="status">{syncWarning}</p>}
      {loading ? <p className="calendar-state">오늘의 빈 시간을 확인하고 있습니다.</p> : <>
        {calendarUnavailable && <CalendarConnectionPrompt />}
        {error && <p className="calendar-state">{error}</p>}
        {!error && mode === "day" && <p className="calendar-schedule-status" role="status">{dayScheduleMessage(quests)}</p>}
        {!error && <CalendarGrid blocks={blocks} onSelectTask={(id) => setEditingQuest(quests.find((quest) => quest.id === id) ?? null)} />}
      </>}
      {(showForm || editingQuest) && <TaskModal key={editingQuest?.id ?? "new"} initialValue={editingQuest ?? undefined} onClose={() => editingQuest ? setEditingQuest(null) : setShowForm(false)} onSubmit={editingQuest ? saveEditedQuest : saveNewQuest} />}
    </AppShell>
  );
}

function dayScheduleMessage(quests: Quest[]) {
  const active = quests.filter((quest) => quest.status !== "completed" && quest.status !== "abandoned");
  if (active.length === 0) return "할 일을 추가하면 오늘의 빈 시간에 자동 배치됩니다.";
  if (active.some((quest) => !quest.plannedStart)) return "활동 가능 시간 안에 배치할 수 있는 시간이 부족합니다. 예상 시간을 줄이거나 설정에서 활동 가능 시간을 조정해보세요.";
  return "오늘의 할 일이 시간표에 배치되었습니다. 작업 사이에는 10분의 여유를 둡니다.";
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
