import { describe, expect, it } from "vitest";
import { isGoogleCalendarWriteEnabled } from "./google-feature-flags";

describe("Google Calendar write feature flag", () => {
  it("keeps write and two-way sync disabled unless explicitly enabled", () => {
    expect(isGoogleCalendarWriteEnabled({})).toBe(false);
    expect(isGoogleCalendarWriteEnabled({ GOOGLE_CALENDAR_WRITE_ENABLED: "false" })).toBe(false);
    expect(isGoogleCalendarWriteEnabled({ GOOGLE_CALENDAR_WRITE_ENABLED: "true" })).toBe(true);
  });
});
