import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { quest } from "@/test/factories";
import { TodayFocusBlocks } from "./today-focus-blocks";

afterEach(cleanup);

it("shows today's scheduled tasks as time-ordered focus blocks", () => {
  const onComplete = vi.fn();
  render(<TodayFocusBlocks
    quests={[
      quest({ id: "later", title: "운동", category: "health", plannedStart: "2026-06-22T02:00:00.000Z", expectedMinutes: 30 }),
      quest({ id: "first", title: "보고서 초안", category: "work", plannedStart: "2026-06-22T00:00:00.000Z", expectedMinutes: 45 })
    ]}
    now={new Date("2026-06-22T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    onComplete={onComplete}
  />);

  expect(screen.getByRole("heading", { name: "오늘의 집중 블록" })).toBeVisible();
  expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    expect.stringContaining("보고서 초안"),
    expect.stringContaining("운동")
  ]);
  expect(screen.getByText("업무")).toBeVisible();
  expect(screen.getAllByText("예정")).toHaveLength(2);
  expect(screen.getAllByText("마감일이 가까워요")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "보고서 초안 완료" }));
  expect(onComplete).toHaveBeenCalledWith("first");
});

it("shows the requested empty-state copy and opens task creation", () => {
  const onAdd = vi.fn();
  render(<TodayFocusBlocks quests={[]} onComplete={() => undefined} onAdd={onAdd} />);

  expect(screen.getByText("첫 할 일을 추가해보세요.")).toBeVisible();
  expect(screen.getByText("예: 열역학 5장 문제풀이 / 오늘 / 50분 / 중요도 높음")).toBeVisible();
  expect(screen.getByText("마감일, 중요도, 예상 소요 시간을 기준으로 오늘의 빈 시간에 자동 배치합니다.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "첫 할 일 추가" }));
  expect(onAdd).toHaveBeenCalledTimes(1);
});

it("keeps tasks that could not be scheduled visible", () => {
  render(<TodayFocusBlocks
    quests={[
      quest({ id: "placed", title: "배치된 할 일", plannedStart: "2026-06-22T00:00:00.000Z" }),
      quest({ id: "unplaced", title: "배치되지 않은 할 일", plannedStart: null, expectedMinutes: 90 })
    ]}
    now={new Date("2026-06-22T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    unplacedReasons={{ unplaced: "no_continuous_slot" }}
    onComplete={() => undefined}
  />);

  expect(screen.getByRole("heading", { name: "배치하지 못한 할 일" })).toBeVisible();
  expect(screen.getByText("배치되지 않은 할 일")).toBeVisible();
  expect(screen.getByText("90분 · 기타")).toBeVisible();
  expect(screen.getByText("90분을 넣을 수 있는 연속된 빈 시간이 부족합니다.")).toBeVisible();
  expect(screen.getByText("예상 시간을 줄이거나 활동 가능 시간을 조정해보세요.")).toBeVisible();
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

  expect(screen.getByText("오늘의 활동 가능 시간이 끝나 배치하지 못했습니다.")).toBeVisible();
  expect(screen.getByText("오늘 남은 전체 시간이 120분보다 부족합니다.")).toBeVisible();
});
