import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quest } from "@/test/factories";
import { TodayFocusBlocks } from "./today-focus-blocks";

afterEach(cleanup);

it("shows one current focus card and up to two next focus cards with clear time signals", () => {
  const onComplete = vi.fn();
  render(<TodayFocusBlocks
    quests={[
      quest({ id: "first", title: "보고서 초안", category: "work", importance: 3, plannedStart: "2026-06-22T00:00:00.000Z", expectedMinutes: 45 }),
      quest({ id: "second", title: "운동", category: "health", importance: 2, plannedStart: "2026-06-22T02:00:00.000Z", expectedMinutes: 30 }),
      quest({ id: "third", title: "영어 복습", category: "study", importance: 1, plannedStart: "2026-06-22T03:00:00.000Z", expectedMinutes: 20 }),
      quest({ id: "hidden", title: "네 번째 항목", category: "other", importance: 1, plannedStart: "2026-06-22T04:00:00.000Z", expectedMinutes: 15 })
    ]}
    now={new Date("2026-06-22T00:10:00.000Z")}
    timeZone="Asia/Seoul"
    availableMinutes={120}
    onComplete={onComplete}
  />);

  expect(screen.getByRole("heading", { name: "오늘 지금 할 일" })).toBeVisible();
  expect(screen.getByTestId("current-focus-card")).toHaveTextContent("보고서 초안");
  expect(screen.getAllByTestId("next-focus-card")).toHaveLength(2);
  expect(screen.getAllByTestId("today-focus-item")).toHaveLength(3);
  expect(screen.getByText("추천 작업 합계: 110분")).toBeVisible();
  expect(screen.getByTestId("today-available-minutes")).toHaveTextContent("오늘 가용 시간: 120분");
  expect(screen.getByText("남은 계획: 110분")).toBeVisible();
  expect(screen.getByText("지연됨 · 원래 09:00 시작")).toBeVisible();
  expect(screen.getByText("예정됨 · 11:00 시작")).toBeVisible();
  expect(screen.getByText("45분")).toBeVisible();
  expect(screen.getByText("업무")).toBeVisible();
  expect(screen.getByText("중요도 3")).toBeVisible();
  expect(screen.queryByText("네 번째 항목")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "보고서 초안 완료" }));
  expect(onComplete).toHaveBeenCalledWith("first");
});

it("shows an explicit calendar conflict limitation warning when calendar sync failed", () => {
  render(<TodayFocusBlocks
    quests={[quest({ id: "first", title: "보고서 초안", plannedStart: "2026-06-22T00:00:00.000Z", expectedMinutes: 45 })]}
    now={new Date("2026-06-22T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    calendarSyncWarning="Google Calendar 확인 실패 — 외부 일정 충돌 판단이 제한됩니다."
    onComplete={() => undefined}
  />);

  expect(screen.getByText("충돌 판단: 제한됨")).toBeVisible();
  expect(screen.getByText("Google Calendar 확인 실패 — 외부 일정 충돌 판단이 제한됩니다.")).toBeVisible();
});

it("shows a reschedule-needed label instead of presenting a missed item as executable now", () => {
  render(<TodayFocusBlocks
    quests={[quest({ id: "missed", title: "吏???묒뾽", plannedStart: "2026-06-22T00:00:00.000Z", expectedMinutes: 30 })]}
    now={new Date("2026-06-22T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    onComplete={() => undefined}
  />);

  expect(screen.getByText("재배치 필요 · 시간이 지났습니다")).toBeVisible();
  expect(screen.queryByText("지금 실행 가능")).not.toBeInTheDocument();
});

it("shows a compact schedule-change summary near Today Focus", () => {
  render(<TodayFocusBlocks
    quests={[quest({ id: "first", title: "보고서 초안", plannedStart: "2026-06-22T00:00:00.000Z" })]}
    now={new Date("2026-06-22T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    scheduleChangeCount={3}
    onComplete={() => undefined}
  />);

  expect(screen.getByText("오늘 일정 변경 3건 있음")).toBeVisible();
  expect(screen.getByText("변경된 계획 확인 필요")).toBeVisible();
});

it("shows the requested empty-state copy and opens task creation", () => {
  const onAdd = vi.fn();
  render(<TodayFocusBlocks quests={[]} onComplete={() => undefined} onAdd={onAdd} />);

  expect(screen.getByText("첫 할 일을 추가해보세요.")).toBeVisible();
  expect(screen.getByText("예: 역사 5장 문제풀이 / 오늘 / 50분 / 중요도 높음")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "첫 할 일 추가" }));
  expect(onAdd).toHaveBeenCalledTimes(1);
});

it("keeps tasks that could not be scheduled visible with concrete reasons", () => {
  render(<TodayFocusBlocks
    quests={[
      quest({ id: "placed", title: "배치됨", plannedStart: "2026-06-22T00:00:00.000Z" }),
      quest({ id: "unplaced", title: "배치되지 않은 일", plannedStart: null, expectedMinutes: 90 })
    ]}
    now={new Date("2026-06-22T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    unplacedReasons={{ unplaced: "no_continuous_slot" }}
    onComplete={() => undefined}
  />);

  expect(screen.getByRole("heading", { name: "배치하지 못한 일 1개" })).toBeVisible();
  expect(screen.queryByText("배치되지 않은 일")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "이유 보기" }));
  expect(screen.getByText("배치되지 않은 일")).toBeVisible();
  expect(screen.getByText("90분 · 기타")).toBeVisible();
  expect(screen.getByText("90분을 넣을 수 있는 연속된 빈 시간이 부족합니다.")).toBeVisible();
});

it("shows distinct reasons for activity ending and insufficient total time", () => {
  render(<TodayFocusBlocks
    quests={[
      quest({ id: "ended", title: "활동 시간 종료 작업", plannedStart: null, expectedMinutes: 30 }),
      quest({ id: "full", title: "전체 시간 부족 작업", plannedStart: null, expectedMinutes: 120 })
    ]}
    unplacedReasons={{ ended: "activity_hours_ended", full: "insufficient_total_time" }}
    onComplete={() => undefined}
  />);

  fireEvent.click(screen.getByRole("button", { name: "이유 보기" }));
  expect(screen.getByText("오늘의 활동 가능 시간이 끝나 배치하지 못했습니다.")).toBeVisible();
  expect(screen.getByText("오늘 남은 전체 시간이 120분보다 부족합니다.")).toBeVisible();
});
