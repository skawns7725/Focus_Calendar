import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getGoogleStatus, listQuests, reconcileSchedule, syncGoogleCalendar } from "@/client/api";
import { quest } from "@/test/factories";
import { Dashboard } from "./dashboard";

vi.mock("@/client/api", () => ({
  abandonQuest: vi.fn(),
  completeQuest: vi.fn(),
  createQuest: vi.fn(),
  getGoogleStatus: vi.fn(async () => ({ connected: false })),
  getPushStatus: vi.fn(async () => ({ configured: false, notificationPromptCompleted: true })),
  listQuests: vi.fn(async () => [quest({ title: "로컬 일정 먼저 표시" })]),
  listUnreadNotifications: vi.fn(async () => []),
  markNotificationsRead: vi.fn(),
  moveQuestToNearestDay: vi.fn(),
  reconcileSchedule: vi.fn(() => new Promise(() => undefined)),
  subscribePush: vi.fn(),
  syncGoogleCalendar: vi.fn(),
  unsubscribePush: vi.fn(),
  updateQuest: vi.fn()
}));

beforeEach(() => {
  vi.mocked(getGoogleStatus).mockResolvedValue({ connected: false });
  vi.mocked(listQuests).mockResolvedValue([quest({ title: "로컬 일정 먼저 표시" })]);
  vi.mocked(reconcileSchedule).mockImplementation(() => new Promise(() => undefined));
  vi.mocked(syncGoogleCalendar).mockResolvedValue(undefined);
});

afterEach(cleanup);

vi.mock("./app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>
}));

it("shows local quests before background reconciliation finishes", async () => {
  render(<Dashboard />);
  expect(await screen.findAllByText("로컬 일정 먼저 표시", {}, { timeout: 200 })).toHaveLength(2);
});

it("keeps the signed-out dashboard calm when quests cannot be loaded", async () => {
  vi.mocked(listQuests).mockRejectedValue(new Error("Sign in required"));
  render(<Dashboard />);

  expect(await screen.findByText("해야 할 일을 가볍게 적어보세요.")).toBeVisible();
  expect(screen.queryByText("현재 남아 있는 할 일이 없습니다.")).not.toBeInTheDocument();
});

it("shows a retry action when a connected Google Calendar sync fails", async () => {
  vi.mocked(getGoogleStatus).mockResolvedValue({ connected: true });
  vi.mocked(reconcileSchedule).mockResolvedValue(undefined);
  vi.mocked(syncGoogleCalendar).mockRejectedValue(new Error("Calendar unavailable"));

  render(<Dashboard />);

  expect(await screen.findByText("Google Calendar 일정을 가져오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.")).toBeVisible();
  expect(screen.getByRole("button", { name: "다시 시도" })).toBeVisible();
});
