import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { quest } from "@/test/factories";
import { CalendarPage } from "./calendar-page";
import { listCalendarBlocks, syncGoogleCalendar } from "@/client/api";

vi.mock("@/client/api", () => ({
  syncGoogleCalendar: vi.fn(async () => undefined),
  createQuest: vi.fn(async () => undefined),
  updateQuest: vi.fn(async () => undefined),
  listCalendarBlocks: vi.fn(async () => {
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    return [{
      id: "calendar-1",
      title: "실제 Google 일정",
      start: start.toISOString(),
      end: new Date(start.getTime() + 60 * 60_000).toISOString()
    }];
  }),
  listQuests: vi.fn(async () => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    return [quest({
      id: "quest-1",
      title: "실제 배치 할 일",
      plannedStart: start.toISOString(),
      deadline: new Date(start.getTime() + 6 * 60 * 60_000).toISOString()
    })];
  })
}));

vi.mock("./app-shell", () => ({
  AppShell: ({ actions, children }: { actions?: React.ReactNode; children: React.ReactNode }) => <main>{actions}{children}</main>
}));

beforeEach(() => {
  vi.mocked(syncGoogleCalendar).mockResolvedValue(undefined);
  vi.mocked(listCalendarBlocks).mockResolvedValue([{
    id: "calendar-1",
    title: "실제 Google 일정",
    start: todayAt(10).toISOString(),
    end: todayAt(11).toISOString()
  }]);
});

afterEach(cleanup);

it("shows imported calendar blocks and scheduled quests instead of demo events", async () => {
  render(<CalendarPage mode="day" />);

  expect(await screen.findByText("실제 Google 일정")).toBeVisible();
  expect(screen.getByText("실제 배치 할 일")).toBeVisible();
  expect(screen.queryByText("팀 정기 회의")).not.toBeInTheDocument();
});

it("offers Google connection when calendar loading requires sign-in", async () => {
  vi.mocked(listCalendarBlocks).mockRejectedValue(new Error("Sign in required"));
  render(<CalendarPage mode="day" />);

  expect(await screen.findByText("Google Calendar를 연결해 일정을 불러오세요.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Google Calendar 연결" })).toHaveAttribute("href", "/api/google/connect?mode=read");
});

it("keeps scheduled quests visible when Google calendar loading requires sign-in", async () => {
  vi.mocked(listCalendarBlocks).mockRejectedValue(new Error("Sign in required"));
  render(<CalendarPage mode="day" />);

  expect(await screen.findByText("실제 배치 할 일")).toBeVisible();
});

it("keeps saved blocks visible and explains when the latest Google sync fails", async () => {
  vi.mocked(syncGoogleCalendar).mockRejectedValue(new Error("Calendar unavailable"));
  render(<CalendarPage mode="day" />);

  expect(await screen.findByText("Google Calendar의 최신 일정을 가져오지 못했습니다. 저장된 일정을 표시합니다.")).toBeVisible();
  expect(await screen.findByText("실제 Google 일정")).toBeVisible();
});

it("opens the shared task dialog from the calendar", async () => {
  render(<CalendarPage mode="day" />);
  fireEvent.click(await screen.findByRole("button", { name: "할 일 추가" }));
  expect(screen.getByRole("dialog", { name: "할 일 추가" })).toBeVisible();
});

function todayAt(hour: number) {
  const value = new Date();
  value.setHours(hour, 0, 0, 0);
  return value;
}
