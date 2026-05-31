import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./settings-page";

vi.mock("@/client/api", () => ({
  getSettings: vi.fn(async () => ({
    weekdayStart: "09:00", weekdayEnd: "22:00", weekendStart: "10:00", weekendEnd: "22:00",
    defaultView: "list", timeZone: "Asia/Seoul", theme: "light", twoWaySync: false,
    googleImportMode: null, selectedGoogleCalendarIds: []
  })),
  updateSettings: vi.fn(),
  getGoogleStatus: vi.fn(async () => ({
    configured: true, connected: true, dedicatedCalendarId: null, lastSyncedAt: null, lastSyncError: null
  })),
  listGoogleCalendars: vi.fn(async () => [{ id: "primary", summary: "기본 캘린더" }, { id: "work", summary: "업무" }]),
  syncGoogleCalendar: vi.fn()
}));

describe("settings page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows initial calendar selection and manual sync controls", async () => {
    render(<SettingsPage />);
    expect(await screen.findByRole("button", { name: "지금 동기화" })).toBeInTheDocument();
    expect(screen.getByLabelText("모든 캘린더")).toBeInTheDocument();
    expect(screen.getByLabelText("선택한 캘린더만")).toBeInTheDocument();
    expect(await screen.findByLabelText("업무")).toBeInTheDocument();
  });
});
