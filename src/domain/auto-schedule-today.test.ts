import { describe, expect, it } from "vitest";
import { quest } from "@/test/factories";
import { autoScheduleToday, autoScheduleTodayWithReasons } from "./auto-schedule-today";

describe("autoScheduleToday", () => {
  it("returns no placements when there are no tasks", () => {
    expect(autoScheduleToday({
      quests: [],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "18:00",
      fixedBlocks: [],
      timeZone: "Asia/Seoul"
    })).toEqual([]);
  });

  it("places one 50-minute task for exactly its expected duration", () => {
    expect(autoScheduleToday({
      quests: [quest({ id: "study", plannedStart: null, expectedMinutes: 50 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "18:00",
      fixedBlocks: [],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    })).toEqual([{ questId: "study", start: "2026-06-22T00:00:00.000Z", end: "2026-06-22T00:50:00.000Z" }]);
  });

  it("orders incomplete tasks by deadline then importance and keeps ten-minute buffers", () => {
    const placements = autoScheduleToday({
      quests: [
        quest({ id: "completed", status: "completed", plannedStart: null, expectedMinutes: 20 }),
        quest({ id: "less-important", plannedStart: null, deadline: "2026-06-22T09:00:00.000Z", importance: 1, expectedMinutes: 30 }),
        quest({ id: "important", plannedStart: null, deadline: "2026-06-22T09:00:00.000Z", importance: 3, expectedMinutes: 30 }),
        quest({ id: "later", plannedStart: null, deadline: "2026-06-23T09:00:00.000Z", importance: 3, expectedMinutes: 20 })
      ],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "12:00",
      fixedBlocks: [{ start: "2026-06-22T01:00:00.000Z", end: "2026-06-22T01:30:00.000Z" }],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    });

    expect(placements).toEqual([
      { questId: "important", start: "2026-06-22T00:00:00.000Z", end: "2026-06-22T00:30:00.000Z" },
      { questId: "less-important", start: "2026-06-22T01:40:00.000Z", end: "2026-06-22T02:10:00.000Z" },
      { questId: "later", start: "2026-06-22T02:20:00.000Z", end: "2026-06-22T02:40:00.000Z" }
    ]);
  });

  it("uses shorter expected time as a tie-breaker after deadline and importance", () => {
    const placements = autoScheduleToday({
      quests: [
        quest({ id: "long", plannedStart: null, deadline: "2026-06-22T09:00:00.000Z", importance: 2, expectedMinutes: 50 }),
        quest({ id: "short", plannedStart: null, deadline: "2026-06-22T09:00:00.000Z", importance: 2, expectedMinutes: 15 })
      ],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "11:00",
      fixedBlocks: [],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    });

    expect(placements.map((placement) => placement.questId)).toEqual(["short", "long"]);
  });

  it("does not place a task past the end of active hours", () => {
    const placements = autoScheduleToday({
      quests: [quest({ id: "too-long", plannedStart: null, expectedMinutes: 61 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "10:00",
      fixedBlocks: [],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    });

    expect(placements).toEqual([]);
  });

  it("keeps the activity end boundary when a later fixed block exists", () => {
    const placements = autoScheduleToday({
      quests: [quest({ id: "too-long", plannedStart: null, expectedMinutes: 90 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "10:00",
      fixedBlocks: [{ start: "2026-06-22T03:00:00.000Z", end: "2026-06-22T04:00:00.000Z" }],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    });

    expect(placements).toEqual([]);
  });

  it("uses only a gap between existing calendar blocks", () => {
    const placements = autoScheduleToday({
      quests: [quest({ id: "gap-task", plannedStart: null, expectedMinutes: 30 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "12:00",
      fixedBlocks: [
        { start: "2026-06-22T00:00:00.000Z", end: "2026-06-22T01:00:00.000Z" },
        { start: "2026-06-22T02:00:00.000Z", end: "2026-06-22T03:00:00.000Z" }
      ],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    });

    expect(placements).toEqual([{ questId: "gap-task", start: "2026-06-22T01:10:00.000Z", end: "2026-06-22T01:40:00.000Z" }]);
  });

  it("does not place tasks after active hours have ended", () => {
    expect(autoScheduleToday({
      quests: [quest({ id: "late", plannedStart: null, expectedMinutes: 30 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "18:00",
      fixedBlocks: [],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-22T09:01:00.000Z")
    })).toEqual([]);
  });

  it("distinguishes activity hours ending from other unplaced reasons", () => {
    const result = autoScheduleTodayWithReasons({
      quests: [quest({ id: "late", plannedStart: null, expectedMinutes: 30 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "18:00",
      fixedBlocks: [],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-22T09:01:00.000Z")
    });

    expect(result.unplaced).toEqual([{ questId: "late", reason: "activity_hours_ended" }]);
  });

  it("distinguishes fragmented free time from insufficient total time", () => {
    const fragmented = autoScheduleTodayWithReasons({
      quests: [quest({ id: "fragmented", plannedStart: null, expectedMinutes: 60 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "12:00",
      fixedBlocks: [
        { start: "2026-06-22T01:00:00.000Z", end: "2026-06-22T01:30:00.000Z" },
        { start: "2026-06-22T02:30:00.000Z", end: "2026-06-22T03:00:00.000Z" }
      ],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    });
    const insufficient = autoScheduleTodayWithReasons({
      quests: [quest({ id: "insufficient", plannedStart: null, expectedMinutes: 61 })],
      date: "2026-06-22",
      activityStart: "09:00",
      activityEnd: "10:00",
      fixedBlocks: [],
      timeZone: "Asia/Seoul",
      now: new Date("2026-06-21T23:00:00.000Z")
    });

    expect(fragmented.unplaced).toEqual([{ questId: "fragmented", reason: "no_continuous_slot" }]);
    expect(insufficient.unplaced).toEqual([{ questId: "insufficient", reason: "insufficient_total_time" }]);
  });
});
