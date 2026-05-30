import { describe, expect, it } from "vitest";
import { quest } from "@/test/factories";
import { sortQuests } from "./priority";

describe("sortQuests", () => {
  it("orders quests by deadline, importance, then carryover count", () => {
    const result = sortQuests([
      quest({ id: "late", deadline: "2026-06-02T09:00:00+09:00", importance: 3 }),
      quest({ id: "low", deadline: "2026-06-01T09:00:00+09:00", importance: 1 }),
      quest({ id: "carried", deadline: "2026-06-01T09:00:00+09:00", importance: 3, carryoverCount: 2 }),
      quest({ id: "important", deadline: "2026-06-01T09:00:00+09:00", importance: 3, carryoverCount: 0 })
    ]);

    expect(result.map((item) => item.id)).toEqual(["carried", "important", "low", "late"]);
  });

  it("always places overdue quests before active quests", () => {
    const now = new Date("2026-06-01T10:00:00+09:00");
    const result = sortQuests([
      quest({ id: "active", deadline: "2026-06-01T11:00:00+09:00" }),
      quest({ id: "overdue", deadline: "2026-06-01T09:00:00+09:00" })
    ], now);

    expect(result.map((item) => item.id)).toEqual(["overdue", "active"]);
  });
});

