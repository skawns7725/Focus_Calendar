import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { StudyBlock } from "@/domain/study-plan";
import { TodayFocusBlocks } from "./today-focus-blocks";

afterEach(cleanup);

it("shows today's pending study blocks with a study-specific recommendation reason", () => {
  const onCompleteStudyBlock = vi.fn();
  render(<TodayFocusBlocks
    quests={[]}
    studyBlocks={[studyBlock({ id: "study-block-1", title: "수학 개념학습" })]}
    now={new Date("2026-06-24T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    onComplete={() => undefined}
    onCompleteStudyBlock={onCompleteStudyBlock}
  />);

  expect(screen.getByText("수학 개념학습")).toBeVisible();
  expect(screen.getByText("오늘 계획된 학습 블록이에요")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "수학 개념학습 완료" }));
  expect(onCompleteStudyBlock).toHaveBeenCalledWith("study-block-1");
});

it("summarizes recommended, completed, remaining, and available focus minutes with the next recommendation", () => {
  render(<TodayFocusBlocks
    quests={[]}
    studyBlocks={[
      studyBlock({ id: "done", title: "완료된 복습", durationMinutes: 30, status: "completed" }),
      studyBlock({ id: "next", title: "다음 문제풀이", durationMinutes: 45, status: "pending", sequence: 2 })
    ]}
    now={new Date("2026-06-24T01:00:00.000Z")}
    timeZone="Asia/Seoul"
    availableMinutes={90}
    onComplete={() => undefined}
  />);

  expect(screen.getByText("오늘 추천 총 소요 시간: 75분")).toBeVisible();
  expect(screen.getByText("추천 기준 시간: 90분")).toBeVisible();
  expect(screen.getByText("완료: 30분 / 남은 계획: 45분")).toBeVisible();
  expect(screen.getByText("우선 기준: 마감일 + 중요도 + 예상 시간")).toBeVisible();
  expect(screen.getByText("다음 추천: 다음 문제풀이")).toBeVisible();
});

function studyBlock(overrides: Partial<StudyBlock> = {}): StudyBlock {
  return {
    id: "study-block",
    studyPlanId: "plan",
    title: "영어 문제풀이",
    date: "2026-06-24",
    stage: "practice",
    durationMinutes: 40,
    sequence: 1,
    status: "pending",
    ...overrides
  };
}
