import { describe, expect, it } from "vitest";
import { addLocalDays, localWeekday, toInstant, toLocalDate } from "./time-zone";

describe("time-zone helpers", () => {
  it("formats an instant as a local calendar date", () => {
    expect(toLocalDate(new Date("2026-03-08T04:30:00Z"), "America/New_York")).toBe("2026-03-07");
  });

  it("resolves a wall clock time across daylight saving changes", () => {
    expect(toInstant("2026-03-08", "09:00", "America/New_York").toISOString()).toBe("2026-03-08T13:00:00.000Z");
  });

  it("adds local calendar days and reports weekday", () => {
    expect(addLocalDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(localWeekday("2026-03-08")).toBe(0);
  });
});
