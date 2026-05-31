import { describe, expect, it, vi } from "vitest";
import { createSettingsService } from "./settings-service";

const baseSettings = {
  weekdayStart: "09:00",
  weekdayEnd: "22:00",
  weekendStart: "10:00",
  weekendEnd: "22:00",
  defaultView: "list" as const,
  timeZone: "Asia/Seoul",
  theme: "light" as const,
  twoWaySync: false,
  googleImportMode: null,
  selectedGoogleCalendarIds: []
};

describe("settings service", () => {
  it("stores Google import selection", async () => {
    const repository = {
      get: vi.fn(),
      update: vi.fn(async (input) => input)
    };
    const service = createSettingsService(repository);

    await service.update({
      ...baseSettings,
      googleImportMode: "selected",
      selectedGoogleCalendarIds: ["primary", "work"]
    });

    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      googleImportMode: "selected",
      selectedGoogleCalendarIds: ["primary", "work"]
    }));
  });
});
