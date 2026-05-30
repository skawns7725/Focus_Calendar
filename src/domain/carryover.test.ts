import { describe, expect, it } from "vitest";
import { quest } from "@/test/factories";
import { reconcileQuest } from "./carryover";

describe("reconcileQuest", () => {
  it("keeps a missed quest visible without changing time on the same day", () => {
    const original = quest({ plannedStart: "2026-06-01T09:00:00+09:00" });
    const result = reconcileQuest(original, { today: "2026-06-01", nextDaySlot: null });

    expect(result.quest).toMatchObject({
      status: "due_today",
      plannedStart: original.plannedStart
    });
    expect(result.notification).toBeNull();
  });

  it("moves a missed quest on the next day and emits a notification", () => {
    const result = reconcileQuest(quest({ plannedStart: "2026-06-01T09:00:00+09:00" }), {
      today: "2026-06-02",
      nextDaySlot: { start: "2026-06-02T10:00:00+09:00", end: "2026-06-02T11:00:00+09:00" }
    });

    expect(result.quest).toMatchObject({
      plannedStart: "2026-06-02T10:00:00+09:00",
      carryoverCount: 1,
      status: "scheduled"
    });
    expect(result.notification?.kind).toBe("carried_over");
  });

  it("requires attention when the next day is full", () => {
    const result = reconcileQuest(quest({ plannedStart: "2026-06-01T09:00:00+09:00" }), {
      today: "2026-06-02",
      nextDaySlot: null
    });

    expect(result.quest.status).toBe("needs_attention");
    expect(result.notification?.kind).toBe("conflict");
  });
});

