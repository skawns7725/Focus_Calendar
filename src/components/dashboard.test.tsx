import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quest } from "@/test/factories";
import { Dashboard } from "./dashboard";

vi.mock("@/client/api", () => ({
  abandonQuest: vi.fn(),
  completeQuest: vi.fn(),
  createQuest: vi.fn(),
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

vi.mock("./app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>
}));

it("shows local quests before background reconciliation finishes", async () => {
  render(<Dashboard />);
  expect(await screen.findByText("로컬 일정 먼저 표시", {}, { timeout: 200 })).toBeInTheDocument();
});
