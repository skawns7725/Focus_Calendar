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
  selectedGoogleCalendarIds: [],
  notificationPromptCompleted: false,
  browserNotificationsEnabled: false,
  reminderMinutes: 10
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

  it("stores browser notification preferences", async () => {
    const repository = {
      get: vi.fn(),
      update: vi.fn(async (input) => input)
    };
    const service = createSettingsService(repository);

    await service.update({
      ...baseSettings,
      notificationPromptCompleted: true,
      browserNotificationsEnabled: true,
      reminderMinutes: 15
    });

    expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
      notificationPromptCompleted: true,
      browserNotificationsEnabled: true,
      reminderMinutes: 15
    }));
  });
});
