import { describe, expect, it } from "vitest";
import { findEarliestSlot } from "./scheduling";

describe("findEarliestSlot", () => {
  it("uses the earliest slot inside activity hours that avoids fixed blocks", () => {
    const result = findEarliestSlot({
      date: "2026-06-01",
      durationMinutes: 60,
      activityStart: "09:00",
      activityEnd: "18:00",
      fixedBlocks: [{ start: "2026-06-01T09:00:00+09:00", end: "2026-06-01T10:30:00+09:00" }],
      timeZoneOffset: "+09:00"
    });

    expect(result).toEqual({
      start: "2026-06-01T01:30:00.000Z",
      end: "2026-06-01T02:30:00.000Z"
    });
  });

  it("returns null when no sufficiently long slot exists", () => {
    const result = findEarliestSlot({
      date: "2026-06-01",
      durationMinutes: 120,
      activityStart: "09:00",
      activityEnd: "11:00",
      fixedBlocks: [{ start: "2026-06-01T09:30:00+09:00", end: "2026-06-01T10:00:00+09:00" }],
      timeZoneOffset: "+09:00"
    });

    expect(result).toBeNull();
  });
});

