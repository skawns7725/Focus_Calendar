import { describe, expect, it } from "vitest";
import type { StudyBlock } from "./study-plan";
import { buildTodayFocusItems } from "./today-focus";
import { quest } from "@/test/factories";

describe("buildTodayFocusItems", () => {
  it("combines scheduled quests and today's pending study blocks with recommendation reasons", () => {
    const items = buildTodayFocusItems({
      today: "2026-06-24",
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-24T00:00:00.000Z"),
      quests: [
        quest({
          id: "important",
          title: "보고서",
          plannedStart: "2026-06-24T01:00:00.000Z",
          deadline: "2026-06-24T09:00:00.000Z",
          importance: 3,
          expectedMinutes: 60
        })
      ],
      studyBlocks: [
        studyBlock({ id: "block-1", title: "수학 개념학습", date: "2026-06-24", sequence: 1 })
      ]
    });

    expect(items.map((item) => ({ sourceType: item.sourceType, id: item.id, reason: item.reason }))).toEqual(expect.arrayContaining([
      { sourceType: "quest", id: "important", reason: "마감일이 가까워요" },
      { sourceType: "study_block", id: "block-1", reason: "오늘 계획된 학습 블록이에요" }
    ]));
  });

  it("marks an unfinished scheduled item as delayed after its start time passes", () => {
    const items = buildTodayFocusItems({
      today: "2026-06-24",
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-24T01:10:00.000Z"),
      quests: [
        quest({
          id: "delayed",
          plannedStart: "2026-06-24T01:00:00.000Z",
          expectedMinutes: 30
        })
      ]
    });

    expect(items[0]).toMatchObject({
      id: "delayed",
      executionStatus: "delayed"
    });
  });

  it("marks an unfinished item as needing reschedule after its planned window has passed", () => {
    const items = buildTodayFocusItems({
      today: "2026-06-24",
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-24T02:00:00.000Z"),
      quests: [
        quest({
          id: "missed",
          plannedStart: "2026-06-24T01:00:00.000Z",
          expectedMinutes: 30
        })
      ]
    });

    expect(items[0]).toMatchObject({
      id: "missed",
      executionStatus: "needs_reschedule"
    });
  });

  it("separates scheduled future items from currently executable items", () => {
    const items = buildTodayFocusItems({
      today: "2026-06-24",
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-24T01:10:00.000Z"),
      quests: [
        quest({
          id: "now",
          plannedStart: "2026-06-24T01:10:00.000Z",
          expectedMinutes: 30
        }),
        quest({
          id: "future",
          plannedStart: "2026-06-24T03:00:00.000Z",
          expectedMinutes: 30
        })
      ]
    });

    expect(items.map((item) => [item.id, item.executionStatus])).toEqual([
      ["now", "available_now"],
      ["future", "scheduled"]
    ]);
  });

  it("excludes completed quests and completed study blocks from default focus execution items", () => {
    const items = buildTodayFocusItems({
      today: "2026-06-24",
      quests: [
        quest({ id: "done-quest", plannedStart: "2026-06-24T01:00:00.000Z", status: "completed" })
      ],
      studyBlocks: [
        studyBlock({ id: "done-block", date: "2026-06-24", status: "completed" }),
        studyBlock({ id: "tomorrow", date: "2026-06-25", status: "pending" })
      ]
    });

    expect(items).toEqual([]);
  });

  it("uses importance and short expected time as recommendation reasons when deadline is not urgent", () => {
    const items = buildTodayFocusItems({
      today: "2026-06-24",
      timeZone: "Asia/Seoul",
      quests: [
        quest({
          id: "high",
          plannedStart: "2026-06-24T02:00:00.000Z",
          deadline: "2026-07-01T09:00:00.000Z",
          importance: 3,
          expectedMinutes: 90
        }),
        quest({
          id: "short",
          plannedStart: "2026-06-24T03:00:00.000Z",
          deadline: "2026-07-01T09:00:00.000Z",
          importance: 1,
          expectedMinutes: 20
        })
      ]
    });

    expect(items.map((item) => [item.id, item.reason])).toEqual([
      ["high", "중요도가 높아요"],
      ["short", "예상 시간이 짧아 지금 처리하기 좋아요"]
    ]);
  });

  it("uses category as a tie-breaker before expected time for otherwise equal focus items", () => {
    const items = buildTodayFocusItems({
      today: "2026-06-24",
      timeZone: "Asia/Seoul",
      quests: [
        quest({
          id: "short-other",
          category: "other",
          plannedStart: "2026-06-24T02:00:00.000Z",
          deadline: "2026-07-01T09:00:00.000Z",
          importance: 2,
          expectedMinutes: 15
        }),
        quest({
          id: "study-longer",
          category: "study",
          plannedStart: "2026-06-24T02:00:00.000Z",
          deadline: "2026-07-01T09:00:00.000Z",
          importance: 2,
          expectedMinutes: 50
        })
      ]
    });

    expect(items.map((item) => item.id)).toEqual(["study-longer", "short-other"]);
  });
});

function studyBlock(overrides: Partial<StudyBlock> = {}): StudyBlock {
  return {
    id: "block",
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
