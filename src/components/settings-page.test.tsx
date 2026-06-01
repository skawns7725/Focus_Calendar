import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncGoogleCalendar } from "@/client/api";
import { SettingsPage } from "./settings-page";

vi.mock("@/client/api", () => ({
  getSettings: vi.fn(async () => ({
    weekdayStart: "09:00", weekdayEnd: "22:00", weekendStart: "10:00", weekendEnd: "22:00",
    defaultView: "list", timeZone: "Asia/Seoul", theme: "light", twoWaySync: false,
    googleImportMode: "all", selectedGoogleCalendarIds: [],
    notificationPromptCompleted: true, browserNotificationsEnabled: false, reminderMinutes: 10
  })),
  updateSettings: vi.fn(),
  getGoogleStatus: vi.fn(async () => ({
    configured: true, connected: true, dedicatedCalendarId: null, lastSyncedAt: null, lastSyncError: null
  })),
  listGoogleCalendars: vi.fn(async () => [{ id: "primary", summary: "기본 캘린더" }, { id: "work", summary: "업무" }]),
  listUnreadNotifications: vi.fn(async () => []),
  markNotificationsRead: vi.fn(async () => undefined),
  syncGoogleCalendar: vi.fn(),
  getPushStatus: vi.fn(async () => ({ configured: true, publicKey: "AQAB", notificationPromptCompleted: true, browserNotificationsEnabled: false, reminderMinutes: 10 })),
  subscribePush: vi.fn(),
  unsubscribePush: vi.fn(),
  getAuthStatus: vi.fn(async () => ({ signedIn: false, localDevelopment: true, email: null }))
}));

describe("settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/settings");
  });
  afterEach(cleanup);

  it("shows initial calendar selection and manual sync controls", async () => {
    render(<SettingsPage />);
    expect(await screen.findByRole("button", { name: "지금 동기화" })).toBeInTheDocument();
    expect(screen.getByLabelText("모든 캘린더")).toBeInTheDocument();
    expect(screen.getByLabelText("선택한 캘린더만")).toBeInTheDocument();
    expect(await screen.findByLabelText("업무")).toBeInTheDocument();
    expect(await screen.findByText("브라우저 알림")).toBeInTheDocument();
    expect(screen.getByLabelText("시작 전 알림")).toHaveValue(10);
  });

  it("applies a selected theme immediately", async () => {
    render(<SettingsPage />);
    fireEvent.change(await screen.findByLabelText("테마"), { target: { value: "dark" } });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("syncs connected calendars immediately after settings are saved", async () => {
    render(<SettingsPage />);
    await screen.findByRole("button", { name: "지금 동기화" });

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(syncGoogleCalendar).toHaveBeenCalled());
    expect(await screen.findByText("Google Calendar 일정을 동기화했습니다.")).toBeVisible();
  });

  it("shows a reconnect message after Google callback failure", async () => {
    window.history.replaceState({}, "", "/settings?google=error");
    render(<SettingsPage />);
    expect(await screen.findByText("Google Calendar 연결을 완료하지 못했습니다. 다시 연결해 주세요.")).toBeVisible();
  });
});
